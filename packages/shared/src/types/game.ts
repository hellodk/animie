export type PlayerRole = 'teacher' | 'student';
export type GamePhase =
  | 'lobby'
  | 'character-select'
  | 'briefing'
  | 'active'
  | 'review'
  | 'final';

export type CharacterId = 'operator' | 'developer' | 'sre' | 'architect';
export type ScenarioCategory =
  | 'pod-management'
  | 'deployment-scaling'
  | 'networking'
  | 'configuration'
  | 'secrets'
  | 'rbac'
  | 'debugging'
  | 'observability'
  | 'blockchain-fundamentals'
  | 'ethereum'
  | 'defi'
  | 'tokens'
  | 'hyperledger'
  | 'layer2'
  | 'wallets'
  | 'smart-contracts'
  | 'security'
  | 'testing'
  | 'fuzzing'
  | 'symbolic'
  | 'docker-fundamentals'
  | 'rust-fundamentals';

export interface CharacterBuff {
  id: string;
  name: string;
  description: string;
  categoryMultiplier: Partial<Record<ScenarioCategory, number>>;
  hintCostReduction: number;
  timeBonus: number;
  streakProtection: boolean;
}

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  avatarEmoji: string;
  primaryColor: string;
  buff: CharacterBuff;
  flavor: string;
}

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  role: PlayerRole;
  character: Character | null;
  roomCode: string;
  isConnected: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface RoomSettings {
  maxPlayers: number;
  scenarioIds: string[];
  timeLimitSeconds: number;
  showHints: boolean;
  allowLateJoin: boolean;
  courseId: string;
}

export interface Room {
  code: string;
  teacherId: string;
  players: Record<string, Player>;
  phase: GamePhase;
  createdAt: number;
  settings: RoomSettings;
}

export interface PlayerScore {
  playerId: string;
  totalPoints: number;
  scenarioPoints: number[];
  currentStreak: number;
  maxStreak: number;
  hintsUsed: number;
  completedScenarios: number;
  rank: number;
  previousRank: number;
  lastPointDelta: number;
  solvedAt: number | null;
}

export interface CompletionRecord {
  playerId: string;
  scenarioId: string;
  completedAt: number;
  commandsUsed: number;
  hintsUsed: number;
  pointsAwarded: number;
}

export interface GameSession {
  roomCode: string;
  currentScenarioIndex: number;
  phase: GamePhase;
  phaseStartedAt: number;
  roundEndAt: number | null;
  scores: Record<string, PlayerScore>;
  clusterStates: Record<string, ClusterStateRecord>;
  completions: Record<string, CompletionRecord>;
  turnOrder: string[];
  currentTurnIndex: number;
  commandCounts: Record<string, number>;
  hintCounts: Record<string, number>;
}

export interface ClusterStateRecord {
  playerId: string;
  state: import('./k8s').ClusterState;
}
