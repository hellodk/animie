import type { Room, GameSession } from '@kubequest/shared';
import { GAME_CONSTANTS } from '@kubequest/shared';

interface Store {
  rooms: Map<string, Room>;
  sessions: Map<string, GameSession>;
  playerRoomIndex: Map<string, string>;
  sessionIndex: Map<string, string>;
  timers: Map<string, NodeJS.Timeout>;
}

const store: Store = {
  rooms: new Map(),
  sessions: new Map(),
  playerRoomIndex: new Map(),
  sessionIndex: new Map(),
  timers: new Map(),
};

export function getRoom(code: string): Room | undefined {
  return store.rooms.get(code);
}

export function setRoom(room: Room): void {
  store.rooms.set(room.code, room);
}

export function deleteRoom(code: string): void {
  store.rooms.delete(code);
  store.sessions.delete(code);
}

export function getSession(roomCode: string): GameSession | undefined {
  return store.sessions.get(roomCode);
}

export function setSession(session: GameSession): void {
  store.sessions.set(session.roomCode, session);
}

export function getPlayerRoom(socketId: string): string | undefined {
  return store.playerRoomIndex.get(socketId);
}

export function setPlayerRoom(socketId: string, roomCode: string): void {
  store.playerRoomIndex.set(socketId, roomCode);
}

export function removePlayerRoom(socketId: string): void {
  store.playerRoomIndex.delete(socketId);
}

export function getSocketBySession(sessionId: string): string | undefined {
  return store.sessionIndex.get(sessionId);
}

export function setSessionSocket(sessionId: string, socketId: string): void {
  store.sessionIndex.set(sessionId, socketId);
}

export function setTimer(roomCode: string, timer: NodeJS.Timeout): void {
  clearTimer(roomCode);
  store.timers.set(roomCode, timer);
}

export function clearTimer(roomCode: string): void {
  const existing = store.timers.get(roomCode);
  if (existing) {
    clearTimeout(existing);
    store.timers.delete(roomCode);
  }
}

// Cleanup expired rooms every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of store.rooms) {
    if (now - room.createdAt > GAME_CONSTANTS.ROOM_EXPIRY_MS) {
      clearTimer(code);
      deleteRoom(code);
    }
  }
}, 10 * 60 * 1000);

export { store };
