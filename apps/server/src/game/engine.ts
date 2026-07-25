import type { Server } from 'socket.io';
import type { GamePhase, Room, Player } from '@kubequest/shared';
import { GAME_CONSTANTS, DEFAULT_SCENARIO_IDS, SCENARIO_MAP, buildLeaderboard, initPlayerScore, computeScenarioScore, getCourse } from '@kubequest/shared';
import {
  getRoom, setRoom, getSession, setSession, setTimer, clearTimer,
} from '../store';
import { buildClusterState } from '../k8s-sim/cluster';

function getScenarioById(room: import('@kubequest/shared').Room, scenarioId: string) {
  const course = getCourse(room.settings.courseId ?? 'kubernetes');
  const courseScenarioMap = Object.fromEntries(course.scenarios.map(s => [s.id, s]));
  return courseScenarioMap[scenarioId] ?? SCENARIO_MAP[scenarioId];
}

export function startGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  room.phase = 'character-select';
  setRoom(room);

  const scenarioIds = room.settings.scenarioIds.length
    ? room.settings.scenarioIds
    : DEFAULT_SCENARIO_IDS.slice(0, 5);

  const scores: Record<string, import('@kubequest/shared').PlayerScore> = {};
  for (const player of Object.values(room.players)) {
    if (player.role === 'student') {
      scores[player.id] = initPlayerScore(player.id);
    }
  }

  setSession({
    roomCode,
    currentScenarioIndex: 0,
    phase: 'character-select',
    phaseStartedAt: Date.now(),
    roundEndAt: null,
    scores,
    clusterStates: {},
    completions: {},
    turnOrder: Object.keys(room.players).filter(id => room.players[id].role === 'student'),
    currentTurnIndex: 0,
    commandCounts: {},
    hintCounts: {},
  });

  io.to(roomCode).emit('game:phase-change', { phase: 'character-select', triggeredAt: Date.now() });

  const characterSelectTimer = setTimeout(() => {
    advanceToScenario(io, roomCode, 0);
  }, GAME_CONSTANTS.CHARACTER_SELECT_DURATION_MS);
  setTimer(`${roomCode}-charselect`, characterSelectTimer);
}

export function advanceToScenario(io: Server, roomCode: string, scenarioIdx: number): void {
  const room = getRoom(roomCode);
  const session = getSession(roomCode);
  if (!room || !session) return;

  const scenarioIds = room.settings.scenarioIds.length
    ? room.settings.scenarioIds
    : DEFAULT_SCENARIO_IDS.slice(0, 5);

  if (scenarioIdx >= scenarioIds.length) {
    endGame(io, roomCode);
    return;
  }

  const scenarioId = scenarioIds[scenarioIdx];
  const scenario = getScenarioById(room, scenarioId);
  if (!scenario) {
    endGame(io, roomCode);
    return;
  }

  // Briefing phase
  room.phase = 'briefing';
  session.phase = 'briefing';
  session.currentScenarioIndex = scenarioIdx;
  session.phaseStartedAt = Date.now();
  setRoom(room);
  setSession(session);

  io.to(roomCode).emit('game:phase-change', { phase: 'briefing', triggeredAt: Date.now() });
  io.to(roomCode).emit('game:scenario-start', {
    scenario: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      story: scenario.story,
      objectives: scenario.objectives,
      difficulty: scenario.difficulty,
      category: scenario.category,
      maxPoints: scenario.maxPoints,
      estimatedMinutes: scenario.estimatedMinutes,
    },
    scenarioIndex: scenarioIdx,
    totalScenarios: scenarioIds.length,
    timeLimitSeconds: room.settings.timeLimitSeconds,
    startAt: Date.now() + GAME_CONSTANTS.BRIEFING_DURATION_MS,
  });

  // After briefing, go active
  const briefTimer = setTimeout(() => {
    activateScenario(io, roomCode, scenarioIdx);
  }, GAME_CONSTANTS.BRIEFING_DURATION_MS);
  setTimer(`${roomCode}-brief`, briefTimer);
}

function activateScenario(io: Server, roomCode: string, scenarioIdx: number): void {
  const room = getRoom(roomCode);
  const session = getSession(roomCode);
  if (!room || !session) return;

  const scenarioIds = room.settings.scenarioIds.length
    ? room.settings.scenarioIds
    : DEFAULT_SCENARIO_IDS.slice(0, 5);
  const scenario = getScenarioById(room, scenarioIds[scenarioIdx]);
  if (!scenario) return;

  room.phase = 'active';
  session.phase = 'active';
  session.phaseStartedAt = Date.now();

  const timeLimit = room.settings.timeLimitSeconds * 1000;
  session.roundEndAt = Date.now() + timeLimit;
  session.completions = {};
  session.commandCounts = {};
  session.hintCounts = {};

  // Reset cluster state for all players
  for (const player of Object.values(room.players)) {
    if (player.role === 'student') {
      session.clusterStates[player.id] = {
        playerId: player.id,
        state: buildClusterState(scenario.initialClusterState),
      };
      session.commandCounts[player.id] = 0;
      session.hintCounts[player.id] = 0;
    }
  }

  setRoom(room);
  setSession(session);

  io.to(roomCode).emit('game:phase-change', { phase: 'active', triggeredAt: Date.now() });
  io.to(roomCode).emit('game:timer-sync', {
    roundEndAt: session.roundEndAt!,
    remaining: timeLimit,
  });

  // Timer sync every 10s
  const syncInterval = setInterval(() => {
    const sess = getSession(roomCode);
    if (!sess || sess.phase !== 'active') { clearInterval(syncInterval); return; }
    const remaining = Math.max(0, (sess.roundEndAt ?? 0) - Date.now());
    io.to(roomCode).emit('game:timer-sync', { roundEndAt: sess.roundEndAt!, remaining });
  }, 10_000);

  // Leaderboard broadcast every 5s
  const lbInterval = setInterval(() => {
    const sess = getSession(roomCode);
    const rm = getRoom(roomCode);
    if (!sess || !rm || sess.phase !== 'active') { clearInterval(lbInterval); return; }
    const entries = buildLeaderboard(sess.scores, rm.players);
    io.to(roomCode).emit('game:leaderboard', { entries, scenarioId: scenario.id });
  }, GAME_CONSTANTS.LEADERBOARD_BROADCAST_INTERVAL_MS);

  // Round end timer
  const roundTimer = setTimeout(() => {
    clearInterval(syncInterval);
    clearInterval(lbInterval);
    endScenario(io, roomCode, scenarioIdx);
  }, timeLimit);
  setTimer(`${roomCode}-round`, roundTimer);
}

export function endScenario(io: Server, roomCode: string, scenarioIdx: number): void {
  const room = getRoom(roomCode);
  const session = getSession(roomCode);
  if (!room || !session) return;

  const scenarioIds = room.settings.scenarioIds.length
    ? room.settings.scenarioIds
    : DEFAULT_SCENARIO_IDS.slice(0, 5);
  const scenario = getScenarioById(room, scenarioIds[scenarioIdx]);

  clearTimer(`${roomCode}-round`);

  room.phase = 'review';
  session.phase = 'review';
  setRoom(room);
  setSession(session);

  const entries = buildLeaderboard(session.scores, room.players);

  io.to(roomCode).emit('game:phase-change', { phase: 'review', triggeredAt: Date.now() });
  io.to(roomCode).emit('game:scenario-end', {
    scenarioId: scenario?.id ?? '',
    leaderboard: entries,
  });

  const reviewTimer = setTimeout(() => {
    advanceToScenario(io, roomCode, scenarioIdx + 1);
  }, GAME_CONSTANTS.REVIEW_DURATION_MS);
  setTimer(`${roomCode}-review`, reviewTimer);
}

export function endGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  const session = getSession(roomCode);
  if (!room || !session) return;

  clearTimer(`${roomCode}-round`);
  clearTimer(`${roomCode}-review`);
  clearTimer(`${roomCode}-brief`);
  clearTimer(`${roomCode}-charselect`);

  room.phase = 'final';
  session.phase = 'final';
  setRoom(room);
  setSession(session);

  const finalLeaderboard = buildLeaderboard(session.scores, room.players);
  const mvp = finalLeaderboard[0]?.playerName ?? 'No one';

  io.to(roomCode).emit('game:phase-change', { phase: 'final', triggeredAt: Date.now() });
  io.to(roomCode).emit('game:ended', { finalLeaderboard, mvp });
}

export function handlePlayerSolvedScenario(
  io: Server,
  roomCode: string,
  playerId: string,
  scenarioIdx: number
): void {
  const room = getRoom(roomCode);
  const session = getSession(roomCode);
  if (!room || !session || session.phase !== 'active') return;
  if (session.completions[playerId]) return; // already completed

  const scenarioIds = room.settings.scenarioIds.length
    ? room.settings.scenarioIds
    : DEFAULT_SCENARIO_IDS.slice(0, 5);
  const scenario = getScenarioById(room, scenarioIds[scenarioIdx]);
  if (!scenario) return;

  const player = room.players[playerId];
  if (!player) return;

  const completionOrder = Object.keys(session.completions).length + 1;
  const solvedAt = Date.now();

  session.completions[playerId] = {
    playerId,
    scenarioId: scenario.id,
    completedAt: solvedAt,
    commandsUsed: session.commandCounts[playerId] ?? 0,
    hintsUsed: session.hintCounts[playerId] ?? 0,
    pointsAwarded: 0,
  };

  const score = session.scores[playerId];
  if (!score) return;

  const scoreEvent = computeScenarioScore({
    scenario,
    player,
    solvedAt,
    scenarioStartedAt: session.phaseStartedAt,
    timeLimitSeconds: room.settings.timeLimitSeconds,
    hintsUsed: session.hintCounts[playerId] ?? 0,
    completionOrder,
    currentStreak: score.currentStreak,
  });

  score.previousRank = score.rank;
  score.totalPoints += scoreEvent.points;
  score.completedScenarios += 1;
  score.currentStreak += 1;
  score.maxStreak = Math.max(score.maxStreak, score.currentStreak);
  score.hintsUsed += session.hintCounts[playerId] ?? 0;
  score.lastPointDelta = scoreEvent.points;
  score.scenarioPoints.push(scoreEvent.points);
  score.solvedAt = solvedAt;
  session.completions[playerId].pointsAwarded = scoreEvent.points;

  setSession(session);

  // Notify room of player solved
  io.to(roomCode).emit('game:player-solved', {
    playerId,
    playerName: player.name,
    characterId: player.character?.id ?? '',
    characterEmoji: player.character?.avatarEmoji ?? '❓',
    rank: completionOrder,
    timeTaken: solvedAt - session.phaseStartedAt,
  });

  // Send score update to the player
  io.to(playerId).emit('game:score-update', { playerId, score, event: scoreEvent });

  // Update leaderboard for everyone
  const entries = buildLeaderboard(session.scores, room.players);
  io.to(roomCode).emit('game:leaderboard', { entries, scenarioId: scenario.id });

  // Also notify teacher
  io.to(`teacher-${roomCode}`).emit('teacher:player-progress', {
    playerId,
    commandsRun: session.commandCounts[playerId] ?? 0,
    hintsUsed: session.hintCounts[playerId] ?? 0,
    solved: true,
  });

  // If all students solved, advance early
  const students = Object.values(room.players).filter(p => p.role === 'student');
  const allSolved = students.every(p => session.completions[p.id]);
  if (allSolved) {
    clearTimer(`${roomCode}-round`);
    setTimeout(() => endScenario(io, roomCode, scenarioIdx), 2000);
  }
}
