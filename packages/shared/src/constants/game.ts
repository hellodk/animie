export const GAME_CONSTANTS = {
  BASE_POINTS_PER_SCENARIO: 100,
  FIRST_BLOOD_BONUS: 50,
  PERFECT_BONUS: 25,
  TIME_BONUS_MAX: 50,
  TIME_BONUS_DECAY: 0.5,
  HINT_PENALTIES: [20, 35, 50] as number[],

  STREAK_MULTIPLIERS: [1.0, 1.1, 1.25, 1.5, 2.0] as number[],

  DEFAULT_TIME_LIMIT_SECONDS: 120,
  MAX_PLAYERS: 30,
  ROOM_CODE_LENGTH: 6,
  ROOM_EXPIRY_MS: 4 * 60 * 60 * 1000,

  BRIEFING_DURATION_MS: 15_000,
  REVIEW_DURATION_MS: 20_000,
  CHARACTER_SELECT_DURATION_MS: 60_000,

  LEADERBOARD_BROADCAST_INTERVAL_MS: 5_000,
} as const;

export const DEFAULT_SCENARIO_IDS = [
  's01-pod-crashloop',
  's02-deployment-scaling',
  's03-image-update',
  's04-service-networking',
  's05-secrets',
  's06-rbac-basic',
  's07-hpa',
  's08-ingress',
  's09-rollout-undo',
];
