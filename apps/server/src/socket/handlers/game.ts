import type { Socket, Server } from 'socket.io';
import { DEFAULT_SCENARIO_IDS, SCENARIO_MAP, getCourse } from '@kubequest/shared';
import type { CommandSubmitPayload, CommandResultAck, HintRequestPayload, HintAck } from '@kubequest/shared';
import { getRoom, getSession, setSession, getPlayerRoom } from '../../store';
import { parseKubectl } from '../../k8s-sim/parser';
import { executeCommand } from '../../k8s-sim/executor';
import { buildClusterState } from '../../k8s-sim/cluster';
import { evaluateWinCondition } from '../win-condition-proxy';
import {
  startGame, advanceToScenario, endGame, handlePlayerSolvedScenario,
} from '../../game/engine';

function getScenarioById(room: import('@kubequest/shared').Room, scenarioId: string) {
  const course = getCourse(room.settings.courseId ?? 'kubernetes');
  const courseScenarioMap = Object.fromEntries(course.scenarios.map(s => [s.id, s]));
  return courseScenarioMap[scenarioId] ?? SCENARIO_MAP[scenarioId];
}

export function registerGameHandlers(io: Server, socket: Socket): void {

  socket.on('teacher:start-game', (payload) => {
    const room = getRoom(payload.roomCode);
    if (!room || room.teacherId !== socket.id) return;
    if (room.phase !== 'lobby') return;
    startGame(io, payload.roomCode);
  });

  socket.on('teacher:next-scenario', (payload) => {
    const room = getRoom(payload.roomCode);
    if (!room || room.teacherId !== socket.id) return;
    const session = getSession(payload.roomCode);
    if (!session) return;

    if (session.phase === 'character-select') {
      advanceToScenario(io, payload.roomCode, 0);
      return;
    }
    if (session.phase === 'review' || session.phase === 'active') {
      advanceToScenario(io, payload.roomCode, session.currentScenarioIndex + 1);
      return;
    }
  });

  socket.on('teacher:end-game', (payload) => {
    const room = getRoom(payload.roomCode);
    if (!room || room.teacherId !== socket.id) return;
    endGame(io, payload.roomCode);
  });

  socket.on('teacher:reveal-solution', (payload) => {
    const room = getRoom(payload.roomCode);
    if (!room || room.teacherId !== socket.id) return;
    const session = getSession(payload.roomCode);
    if (!session) return;

    const scenarioIds = room.settings.scenarioIds.length ? room.settings.scenarioIds : DEFAULT_SCENARIO_IDS.slice(0, 5);
    const scenario = getScenarioById(room, scenarioIds[session.currentScenarioIndex]);
    if (!scenario) return;

    io.to(payload.roomCode).emit('teacher:solution', {
      scenarioId: scenario.id,
      commands: scenario.solutionCommands,
    });
  });

  socket.on('teacher:kick-player', (payload) => {
    const room = getRoom(payload.roomCode);
    if (!room || room.teacherId !== socket.id) return;
    const target = room.players[payload.targetPlayerId];
    if (!target) return;
    delete room.players[payload.targetPlayerId];
    io.to(payload.roomCode).emit('room:player-left', {
      playerId: payload.targetPlayerId,
      playerName: target.name,
    });
    io.to(payload.targetPlayerId).emit('room:error', { code: 'KICKED', message: 'You have been removed from the game.' });
  });

  socket.on('game:submit-command', (payload: CommandSubmitPayload, cb: (ack: CommandResultAck) => void) => {
    const room = getRoom(payload.roomCode);
    const session = getSession(payload.roomCode);
    if (!room || !session) {
      cb({ result: { output: 'Error: not in an active game', exitCode: 1, stateChanged: false } });
      return;
    }
    if (session.phase !== 'active') {
      cb({ result: { output: 'Error: game is not in active phase', exitCode: 1, stateChanged: false } });
      return;
    }

    const playerState = session.clusterStates[socket.id];
    if (!playerState) {
      cb({ result: { output: 'Error: cluster state not initialized', exitCode: 1, stateChanged: false } });
      return;
    }

    const parsed = parseKubectl(payload.command);
    if (!parsed) {
      cb({ result: { output: 'Error: could not parse command. Did you forget "kubectl"?', exitCode: 1, stateChanged: false } });
      return;
    }

    const { result, newState } = executeCommand(parsed, playerState.state);
    playerState.state = newState;
    session.commandCounts[socket.id] = (session.commandCounts[socket.id] ?? 0) + 1;
    setSession(session);

    cb({ result });

    // Broadcast terminal output to teacher
    io.to(`teacher-${payload.roomCode}`).emit('terminal:output', {
      playerId: socket.id,
      command: payload.command,
      output: result.output,
      exitCode: result.exitCode,
      timestamp: Date.now(),
    });

    // Update teacher progress
    io.to(`teacher-${payload.roomCode}`).emit('teacher:player-progress', {
      playerId: socket.id,
      commandsRun: session.commandCounts[socket.id],
      hintsUsed: session.hintCounts[socket.id] ?? 0,
      solved: !!session.completions[socket.id],
    });

    if (result.stateChanged) {
      // Sync cluster state back to player
      socket.emit('cluster:state', { state: newState });

      // Check win condition
      const scenarioIds = room.settings.scenarioIds.length ? room.settings.scenarioIds : DEFAULT_SCENARIO_IDS.slice(0, 5);
      const scenario = getScenarioById(room, scenarioIds[session.currentScenarioIndex]);
      if (scenario && !session.completions[socket.id]) {
        const won = evaluateWinCondition(scenario.winCondition, newState);
        if (won) {
          handlePlayerSolvedScenario(io, payload.roomCode, socket.id, session.currentScenarioIndex);
        }
      }
    }
  });

  socket.on('game:request-hint', (payload: HintRequestPayload, cb: (ack: HintAck) => void) => {
    const room = getRoom(payload.roomCode);
    const session = getSession(payload.roomCode);
    if (!room || !session || session.phase !== 'active') {
      cb({ hint: undefined, pointPenalty: 0, error: 'Not in active phase' });
      return;
    }

    const scenarioIds = room.settings.scenarioIds.length ? room.settings.scenarioIds : DEFAULT_SCENARIO_IDS.slice(0, 5);
    const scenario = getScenarioById(room, scenarioIds[session.currentScenarioIndex]);
    if (!scenario) {
      cb({ hint: undefined, pointPenalty: 0, error: 'Scenario not found' });
      return;
    }

    const hint = scenario.hints[payload.hintIndex];
    if (!hint) {
      cb({ hint: undefined, pointPenalty: 0, error: 'Hint not available' });
      return;
    }

    session.hintCounts[socket.id] = (session.hintCounts[socket.id] ?? 0) + 1;
    setSession(session);

    const player = room.players[socket.id];
    const reduction = player?.character?.buff.hintCostReduction ?? 0;
    const adjustedPenalty = Math.floor(hint.pointPenalty * (1 - reduction));

    cb({ hint: hint.text, pointPenalty: adjustedPenalty });
  });

  socket.on('game:reset-cluster', (payload) => {
    const room = getRoom(payload.roomCode);
    const session = getSession(payload.roomCode);
    if (!room || !session || session.phase !== 'active') return;

    const scenarioIds = room.settings.scenarioIds.length ? room.settings.scenarioIds : DEFAULT_SCENARIO_IDS.slice(0, 5);
    const scenario = getScenarioById(room, scenarioIds[session.currentScenarioIndex]);
    if (!scenario) return;

    session.clusterStates[socket.id] = {
      playerId: socket.id,
      state: buildClusterState(scenario.initialClusterState),
    };
    setSession(session);
    socket.emit('cluster:state', { state: session.clusterStates[socket.id].state });
  });
}
