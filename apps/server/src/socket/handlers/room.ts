import type { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GAME_CONSTANTS, DEFAULT_SCENARIO_IDS, CHARACTER_MAP, getCourse } from '@kubequest/shared';
import type { Room, Player, RoomSettings } from '@kubequest/shared';
import type { RoomCreatePayload, RoomCreateAck, RoomJoinPayload, RoomJoinAck, PlayerPublicInfo } from '@kubequest/shared';
import { getRoom, setRoom, getSession, getPlayerRoom, setPlayerRoom, removePlayerRoom, setSessionSocket } from '../../store';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < GAME_CONSTANTS.ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toPublicPlayer(p: Player): PlayerPublicInfo {
  return {
    id: p.id,
    name: p.name,
    characterId: p.character?.id ?? null,
    characterEmoji: p.character?.avatarEmoji ?? null,
    isReady: p.isReady,
    isConnected: p.isConnected,
  };
}

export function registerRoomHandlers(io: Server, socket: Socket): void {

  socket.on('room:create', (payload: RoomCreatePayload, cb) => {
    const code = generateRoomCode();
    const sessionId = uuidv4();

    const courseId = payload.courseId ?? payload.settings?.courseId ?? 'kubernetes';
    const course = getCourse(courseId);
    const defaultScenarioIds = course.scenarios.slice(0, 5).map(s => s.id);

    const settings: RoomSettings = {
      maxPlayers: GAME_CONSTANTS.MAX_PLAYERS,
      scenarioIds: defaultScenarioIds,
      timeLimitSeconds: GAME_CONSTANTS.DEFAULT_TIME_LIMIT_SECONDS,
      showHints: true,
      allowLateJoin: true,
      courseId,
      ...payload.settings,
    };

    const teacher: Player = {
      id: socket.id,
      sessionId,
      name: payload.teacherName,
      role: 'teacher',
      character: null,
      roomCode: code,
      isConnected: true,
      isReady: true,
      joinedAt: Date.now(),
    };

    const room: Room = {
      code,
      teacherId: socket.id,
      players: { [socket.id]: teacher },
      phase: 'lobby',
      createdAt: Date.now(),
      settings,
    };

    setRoom(room);
    setPlayerRoom(socket.id, code);
    setSessionSocket(sessionId, socket.id);
    socket.join(code);
    socket.join(`teacher-${code}`);

    cb({ success: true, room: { code } });
    io.to(code).emit('room:state', {
      room: {
        code,
        phase: 'lobby',
        players: Object.values(room.players).map(toPublicPlayer),
        settings,
      },
    });
  });

  socket.on('room:join', (payload: RoomJoinPayload, cb) => {
    const room = getRoom(payload.roomCode);
    if (!room) {
      cb({ success: false, error: 'Room not found' });
      return;
    }
    if (room.phase !== 'lobby' && room.phase !== 'character-select' && !room.settings.allowLateJoin) {
      cb({ success: false, error: 'Game already in progress' });
      return;
    }
    const playerCount = Object.values(room.players).filter(p => p.role === 'student').length;
    if (playerCount >= room.settings.maxPlayers) {
      cb({ success: false, error: 'Room is full' });
      return;
    }

    const sessionId = payload.sessionId ?? uuidv4();
    const player: Player = {
      id: socket.id,
      sessionId,
      name: payload.playerName,
      role: 'student',
      character: null,
      roomCode: payload.roomCode,
      isConnected: true,
      isReady: false,
      joinedAt: Date.now(),
    };

    room.players[socket.id] = player;
    setRoom(room);
    setPlayerRoom(socket.id, payload.roomCode);
    setSessionSocket(sessionId, socket.id);
    socket.join(payload.roomCode);

    cb({
      success: true,
      player,
      room: {
        code: room.code,
        phase: room.phase,
        settings: room.settings,
        players: Object.values(room.players).map(toPublicPlayer),
      },
    });

    // Notify others
    io.to(payload.roomCode).emit('room:player-joined', { player: toPublicPlayer(player) });
    io.to(payload.roomCode).emit('room:state', {
      room: {
        code: room.code,
        phase: room.phase,
        players: Object.values(room.players).map(toPublicPlayer),
        settings: room.settings,
      },
    });

    // If game is active, send current cluster state
    const session = getSession(payload.roomCode);
    if (session && session.phase === 'active' && session.clusterStates[socket.id]) {
      socket.emit('cluster:state', { state: session.clusterStates[socket.id].state });
    }
  });

  socket.on('room:leave', (payload) => {
    handleLeave(io, socket, payload.roomCode);
  });

  socket.on('player:select-character', (payload) => {
    const room = getRoom(payload.roomCode);
    if (!room || !room.players[socket.id]) return;
    const character = CHARACTER_MAP[payload.characterId];
    if (!character) return;
    room.players[socket.id].character = character;
    setRoom(room);

    io.to(payload.roomCode).emit('room:player-joined', {
      player: toPublicPlayer(room.players[socket.id]),
    });
    io.to(payload.roomCode).emit('room:state', {
      room: {
        code: room.code,
        phase: room.phase,
        players: Object.values(room.players).map(toPublicPlayer),
        settings: room.settings,
      },
    });
  });

  socket.on('player:ready', (payload) => {
    const room = getRoom(payload.roomCode);
    if (!room || !room.players[socket.id]) return;
    room.players[socket.id].isReady = true;
    setRoom(room);

    io.to(payload.roomCode).emit('room:state', {
      room: {
        code: room.code,
        phase: room.phase,
        players: Object.values(room.players).map(toPublicPlayer),
        settings: room.settings,
      },
    });
  });

  socket.on('disconnect', () => {
    const roomCode = getPlayerRoom(socket.id);
    if (roomCode) {
      handleLeave(io, socket, roomCode);
    }
  });

  socket.on('ping', () => {
    socket.emit('pong', { serverTime: Date.now() });
  });
}

function handleLeave(io: Server, socket: Socket, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  const player = room.players[socket.id];
  if (!player) return;

  if (player.role === 'teacher') {
    // Teacher left — mark all players disconnected
    for (const p of Object.values(room.players)) {
      p.isConnected = false;
    }
    io.to(roomCode).emit('room:error', { code: 'TEACHER_LEFT', message: 'The teacher has disconnected.' });
  } else {
    room.players[socket.id].isConnected = false;
    io.to(roomCode).emit('room:player-left', { playerId: socket.id, playerName: player.name });
  }

  setRoom(room);
  removePlayerRoom(socket.id);
  socket.leave(roomCode);
}
