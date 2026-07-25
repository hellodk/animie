'use client';
import { create } from 'zustand';
import type {
  GamePhase, Player, RoomSettings, LeaderboardEntry, ScoreEvent,
  ClusterState, PlayerScore, Course,
} from '@kubequest/shared';
import type { ScenarioStartPayload, PlayerPublicInfo } from '@kubequest/shared';

interface GameStore {
  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Room
  roomCode: string | null;
  players: PlayerPublicInfo[];
  phase: GamePhase;
  settings: RoomSettings | null;
  myPlayer: Player | null;

  setRoomCode: (code: string) => void;
  setPlayers: (players: PlayerPublicInfo[]) => void;
  setPhase: (phase: GamePhase) => void;
  setSettings: (s: RoomSettings) => void;
  setMyPlayer: (p: Player) => void;

  // Game
  currentScenario: ScenarioStartPayload | null;
  currentCourse: Course | null;
  leaderboard: LeaderboardEntry[];
  myScore: PlayerScore | null;
  lastScoreEvent: ScoreEvent | null;
  roundEndAt: number | null;
  clusterState: ClusterState | null;
  solvedPlayers: string[];

  setCurrentScenario: (s: ScenarioStartPayload | null) => void;
  setCurrentCourse: (c: Course | null) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setMyScore: (score: PlayerScore, event?: ScoreEvent) => void;
  setRoundEndAt: (t: number | null) => void;
  setClusterState: (s: ClusterState) => void;
  addSolvedPlayer: (playerId: string) => void;
  resetSolvedPlayers: () => void;

  // Terminal
  terminalHistory: string[];
  addTerminalLine: (line: string) => void;
  clearTerminal: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  connected: false,
  roomCode: null,
  players: [],
  phase: 'lobby' as GamePhase,
  settings: null,
  myPlayer: null,
  currentScenario: null,
  currentCourse: null as Course | null,
  leaderboard: [],
  myScore: null,
  lastScoreEvent: null,
  roundEndAt: null,
  clusterState: null,
  solvedPlayers: [],
  terminalHistory: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setConnected: (v) => set({ connected: v }),
  setRoomCode: (code) => set({ roomCode: code }),
  setPlayers: (players) => set({ players }),
  setPhase: (phase) => set({ phase }),
  setSettings: (settings) => set({ settings }),
  setMyPlayer: (myPlayer) => set({ myPlayer }),

  setCurrentScenario: (currentScenario) => set({ currentScenario }),
  setCurrentCourse: (currentCourse) => set({ currentCourse }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setMyScore: (score, event) => set({ myScore: score, lastScoreEvent: event ?? null }),
  setRoundEndAt: (roundEndAt) => set({ roundEndAt }),
  setClusterState: (clusterState) => set({ clusterState }),
  addSolvedPlayer: (playerId) => set(s => ({ solvedPlayers: [...s.solvedPlayers, playerId] })),
  resetSolvedPlayers: () => set({ solvedPlayers: [] }),

  addTerminalLine: (line) => set(s => ({
    terminalHistory: [...s.terminalHistory.slice(-499), line],
  })),
  clearTerminal: () => set({ terminalHistory: [] }),

  reset: () => set(initialState),
}));
