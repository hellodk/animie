import { GAME_CONSTANTS } from '../constants/game';
import type { Player, PlayerScore, ScenarioCategory } from '../types/game';
import type { ScoreEvent } from '../types/leaderboard';
import type { Scenario } from '../types/scenario';

export function computeScenarioScore(params: {
  scenario: Scenario;
  player: Player;
  solvedAt: number;
  scenarioStartedAt: number;
  timeLimitSeconds: number;
  hintsUsed: number;
  completionOrder: number;
  currentStreak: number;
}): ScoreEvent {
  const base = params.scenario.maxPoints;

  const elapsed = (params.solvedAt - params.scenarioStartedAt) / 1000;
  const remaining = Math.max(0, params.timeLimitSeconds - elapsed);
  const timeFraction = remaining / params.timeLimitSeconds;
  const timeBonus = Math.floor(timeFraction * GAME_CONSTANTS.TIME_BONUS_MAX);

  const hintPenalty = GAME_CONSTANTS.HINT_PENALTIES
    .slice(0, params.hintsUsed)
    .reduce((a: number, b: number) => a + b, 0);

  const category = params.scenario.category as ScenarioCategory;
  const catMultiplier = params.player.character?.buff.categoryMultiplier[category] ?? 1.0;

  const streakIdx = Math.min(params.currentStreak, GAME_CONSTANTS.STREAK_MULTIPLIERS.length - 1);
  const streakMult = GAME_CONSTANTS.STREAK_MULTIPLIERS[streakIdx];

  const firstBlood = params.completionOrder === 1 ? GAME_CONSTANTS.FIRST_BLOOD_BONUS : 0;
  const perfect = params.hintsUsed === 0 ? GAME_CONSTANTS.PERFECT_BONUS : 0;

  const raw = Math.max(0, (base - hintPenalty + timeBonus) * catMultiplier * streakMult);
  const total = Math.floor(raw) + firstBlood + perfect;

  return {
    playerId: params.player.id,
    points: total,
    reason: 'scenario-complete',
    streakBonus: Math.floor(raw * (streakMult - 1)),
    timeBonus,
    timestamp: Date.now(),
  };
}

export function buildLeaderboard(
  scores: Record<string, PlayerScore>,
  players: Record<string, Player>
) {
  return Object.values(scores)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((score, idx) => {
      const player = players[score.playerId];
      return {
        rank: idx + 1,
        previousRank: score.previousRank,
        playerId: score.playerId,
        playerName: player?.name ?? 'Unknown',
        characterId: player?.character?.id ?? '',
        characterEmoji: player?.character?.avatarEmoji ?? '❓',
        totalPoints: score.totalPoints,
        completedScenarios: score.completedScenarios,
        currentStreak: score.currentStreak,
        maxStreak: score.maxStreak,
        lastPointDelta: score.lastPointDelta,
      };
    });
}

export function initPlayerScore(playerId: string): PlayerScore {
  return {
    playerId,
    totalPoints: 0,
    scenarioPoints: [],
    currentStreak: 0,
    maxStreak: 0,
    hintsUsed: 0,
    completedScenarios: 0,
    rank: 0,
    previousRank: 0,
    lastPointDelta: 0,
    solvedAt: null,
  };
}
