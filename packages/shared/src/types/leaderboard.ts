export interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  playerId: string;
  playerName: string;
  characterId: string;
  characterEmoji: string;
  totalPoints: number;
  completedScenarios: number;
  currentStreak: number;
  maxStreak: number;
  lastPointDelta: number;
}

export interface ScoreEvent {
  playerId: string;
  points: number;
  reason: ScoreReason;
  streakBonus: number;
  timeBonus: number;
  timestamp: number;
}

export type ScoreReason =
  | 'scenario-complete'
  | 'time-bonus'
  | 'streak-bonus'
  | 'hint-penalty'
  | 'first-blood'
  | 'perfect-solve';
