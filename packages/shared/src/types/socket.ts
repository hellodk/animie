import type { Player, GamePhase, RoomSettings, CharacterId } from './game';
import type { LeaderboardEntry, ScoreEvent } from './leaderboard';
import type { Scenario } from './scenario';
import type { ClusterState, CommandResult } from './k8s';
import type { PlayerScore } from './game';

export type AckCallback<T> = (response: T) => void;

export interface PlayerPublicInfo {
  id: string;
  name: string;
  characterId: string | null;
  characterEmoji: string | null;
  isReady: boolean;
  isConnected: boolean;
}

export interface RoomCreatePayload { teacherName: string; settings?: Partial<RoomSettings>; courseId?: string }
export interface RoomCreateAck { success: boolean; room?: { code: string }; error?: string }

export interface RoomJoinPayload { roomCode: string; playerName: string; sessionId?: string }
export interface RoomJoinAck {
  success: boolean;
  player?: Player;
  room?: { code: string; phase: GamePhase; settings: RoomSettings; players: PlayerPublicInfo[] };
  error?: string;
}

export interface CommandSubmitPayload { roomCode: string; command: string }
export interface CommandResultAck { result: CommandResult }

export interface HintRequestPayload { roomCode: string; hintIndex: number }
export interface HintAck { hint?: string; pointPenalty: number; error?: string }

export interface PhaseChangePayload { phase: GamePhase; triggeredAt: number }

export interface ScenarioStartPayload {
  scenario: Pick<Scenario, 'id' | 'name' | 'description' | 'story' | 'objectives' | 'difficulty' | 'category' | 'maxPoints' | 'estimatedMinutes' | 'conceptId'>;
  scenarioIndex: number;
  totalScenarios: number;
  timeLimitSeconds: number;
  startAt: number;
}

export interface ScenarioEndPayload {
  scenarioId: string;
  leaderboard: LeaderboardEntry[];
  solutions?: string[];
}

export interface GameEndedPayload {
  finalLeaderboard: LeaderboardEntry[];
  mvp: string;
}

export interface TimerSyncPayload { roundEndAt: number; remaining: number }

export interface PlayerSolvedPayload {
  playerId: string;
  playerName: string;
  characterId: string;
  characterEmoji: string;
  rank: number;
  timeTaken: number;
}

export interface ScoreUpdatePayload { playerId: string; score: PlayerScore; event: ScoreEvent }
export interface LeaderboardPayload { entries: LeaderboardEntry[]; scenarioId: string }

export interface TerminalOutputPayload {
  playerId: string;
  command: string;
  output: string;
  exitCode: 0 | 1;
  timestamp: number;
}

export interface PlayerProgressPayload {
  playerId: string;
  commandsRun: number;
  hintsUsed: number;
  solved: boolean;
}

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, cb: AckCallback<RoomCreateAck>) => void;
  'room:join':   (payload: RoomJoinPayload,   cb: AckCallback<RoomJoinAck>)   => void;
  'room:leave':  (payload: { roomCode: string }) => void;

  'player:select-character': (payload: { roomCode: string; characterId: CharacterId }) => void;
  'player:ready':            (payload: { roomCode: string }) => void;

  'teacher:start-game':      (payload: { roomCode: string }) => void;
  'teacher:next-scenario':   (payload: { roomCode: string }) => void;
  'teacher:end-game':        (payload: { roomCode: string }) => void;
  'teacher:kick-player':     (payload: { roomCode: string; targetPlayerId: string }) => void;
  'teacher:reveal-solution': (payload: { roomCode: string }) => void;
  'teacher:update-settings': (payload: { roomCode: string; settings: Partial<RoomSettings> }) => void;

  'game:submit-command': (payload: CommandSubmitPayload, cb: AckCallback<CommandResultAck>) => void;
  'game:request-hint':   (payload: HintRequestPayload,   cb: AckCallback<HintAck>) => void;
  'game:reset-cluster':  (payload: { roomCode: string }) => void;

  'ping': () => void;
}

export interface ServerToClientEvents {
  'room:state':          (payload: { room: { code: string; phase: GamePhase; players: PlayerPublicInfo[]; settings: RoomSettings } }) => void;
  'room:player-joined':  (payload: { player: PlayerPublicInfo }) => void;
  'room:player-left':    (payload: { playerId: string; playerName: string }) => void;
  'room:error':          (payload: { code: string; message: string }) => void;

  'game:phase-change':   (payload: PhaseChangePayload) => void;
  'game:scenario-start': (payload: ScenarioStartPayload) => void;
  'game:scenario-end':   (payload: ScenarioEndPayload) => void;
  'game:ended':          (payload: GameEndedPayload) => void;
  'game:timer-sync':     (payload: TimerSyncPayload) => void;
  'game:player-solved':  (payload: PlayerSolvedPayload) => void;
  'game:score-update':   (payload: ScoreUpdatePayload) => void;
  'game:leaderboard':    (payload: LeaderboardPayload) => void;

  'terminal:output':     (payload: TerminalOutputPayload) => void;
  'cluster:state':       (payload: { state: ClusterState }) => void;

  'teacher:player-progress': (payload: PlayerProgressPayload) => void;
  'teacher:solution':        (payload: { scenarioId: string; commands: string[] }) => void;

  'pong': (payload: { serverTime: number }) => void;
}
