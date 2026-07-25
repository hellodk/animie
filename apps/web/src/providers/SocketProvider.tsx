'use client';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@kubequest/shared';
import { getCourse } from '@kubequest/shared';
import { getSocket } from '@/lib/socket-client';
import { useGameStore } from '@/store/gameStore';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
const SocketContext = createContext<AppSocket | null>(null);

export const KQ_SESSION_KEY = 'kq_session';

export interface KQSession {
  roomCode: string;
  playerName: string;
  characterId: string | null;
}

export function saveSession(data: KQSession) {
  try { sessionStorage.setItem(KQ_SESSION_KEY, JSON.stringify(data)); } catch {}
}

export function loadSession(): KQSession | null {
  try {
    const raw = sessionStorage.getItem(KQ_SESSION_KEY);
    return raw ? (JSON.parse(raw) as KQSession) : null;
  } catch { return null; }
}

export function clearSession() {
  try { sessionStorage.removeItem(KQ_SESSION_KEY); } catch {}
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = getSocket();
  const { setConnected, setPlayers, setPhase, setSettings, setCurrentScenario,
    setLeaderboard, setMyScore, setRoundEndAt, setClusterState, addSolvedPlayer,
    resetSolvedPlayers, addTerminalLine, setRoomCode, setMyPlayer, setCurrentCourse } = useGameStore();

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      // On every (re)connect, attempt to restore a saved session so the server
      // can re-register the player and avoid "cluster state not initialized".
      const session = loadSession();
      if (session) {
        socket.emit('room:join', { roomCode: session.roomCode, playerName: session.playerName }, (ack) => {
          if (ack.success && ack.player && ack.room) {
            setRoomCode(ack.room.code);
            setMyPlayer(ack.player);
            setSettings(ack.room.settings);
            setPlayers(ack.room.players);
            setPhase(ack.room.phase);
            setCurrentCourse(getCourse(ack.room.settings.courseId ?? 'kubernetes'));
          }
        });
      }
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('room:state', ({ room }) => {
      setPlayers(room.players);
      setPhase(room.phase);
      setSettings(room.settings);
      setCurrentCourse(getCourse(room.settings.courseId ?? 'kubernetes'));
    });

    socket.on('room:player-joined', ({ player }) => {
      useGameStore.getState().setPlayers([
        ...useGameStore.getState().players.filter(p => p.id !== player.id),
        player,
      ]);
    });

    socket.on('room:player-left', ({ playerId }) => {
      useGameStore.getState().setPlayers(
        useGameStore.getState().players.map(p =>
          p.id === playerId ? { ...p, isConnected: false } : p
        )
      );
    });

    socket.on('game:phase-change', ({ phase }) => {
      setPhase(phase);
      if (phase === 'active') resetSolvedPlayers();
      if (phase === 'final') clearSession();
    });

    socket.on('game:scenario-start', (payload) => {
      setCurrentScenario(payload);
    });

    socket.on('game:scenario-end', ({ leaderboard }) => {
      setLeaderboard(leaderboard);
    });

    socket.on('game:ended', ({ finalLeaderboard }) => {
      setLeaderboard(finalLeaderboard);
      clearSession();
    });

    socket.on('game:leaderboard', ({ entries }) => {
      setLeaderboard(entries);
    });

    socket.on('game:score-update', ({ score, event }) => {
      setMyScore(score, event);
    });

    socket.on('game:timer-sync', ({ roundEndAt }) => {
      setRoundEndAt(roundEndAt);
    });

    socket.on('game:player-solved', ({ playerId }) => {
      addSolvedPlayer(playerId);
    });

    socket.on('cluster:state', ({ state }) => {
      setClusterState(state);
    });

    socket.on('terminal:output', ({ command, output }) => {
      addTerminalLine(`$ ${command}\n${output}`);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:state');
      socket.off('room:player-joined');
      socket.off('room:player-left');
      socket.off('game:phase-change');
      socket.off('game:scenario-start');
      socket.off('game:scenario-end');
      socket.off('game:ended');
      socket.off('game:leaderboard');
      socket.off('game:score-update');
      socket.off('game:timer-sync');
      socket.off('game:player-solved');
      socket.off('cluster:state');
      socket.off('terminal:output');
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
