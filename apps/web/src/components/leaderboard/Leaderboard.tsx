'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { LeaderboardEntry } from '@kubequest/shared';
import { formatPoints } from '@/lib/utils';

interface Props {
  entries: LeaderboardEntry[];
  myPlayerId?: string;
  compact?: boolean;
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ entries, myPlayerId, compact }: Props) {
  if (!entries.length) {
    return (
      <div className="text-center text-slate-500 py-8">
        No scores yet — be the first to solve a scenario!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {entries.slice(0, compact ? 5 : undefined).map((entry) => {
          const isMe = entry.playerId === myPlayerId;
          const rankImproved = entry.rank < entry.previousRank && entry.previousRank > 0;
          return (
            <motion.div
              key={entry.playerId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isMe
                  ? 'border-[#326CE5] bg-blue-500/10'
                  : 'border-[#334155] bg-[#1e293b]'
              } ${rankImproved ? 'rank-improved' : ''}`}
            >
              {/* Rank */}
              <div className="w-8 text-center font-bold text-lg">
                {entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : (
                  <span className="text-slate-400 text-sm">#{entry.rank}</span>
                )}
              </div>

              {/* Character emoji */}
              <div className="text-2xl">{entry.characterEmoji || '❓'}</div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white truncate">
                  {entry.playerName}
                  {isMe && <span className="ml-2 text-xs text-[#326CE5]">(you)</span>}
                </div>
                <div className="text-xs text-slate-500">
                  {entry.completedScenarios} solved
                  {entry.currentStreak > 1 && (
                    <span className="ml-2 text-orange-400">🔥 {entry.currentStreak}</span>
                  )}
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="font-bold text-white">{formatPoints(entry.totalPoints)}</div>
                {entry.lastPointDelta > 0 && (
                  <div className="text-xs text-green-400">+{entry.lastPointDelta}</div>
                )}
              </div>

              {/* Rank change */}
              {rankImproved && (
                <div className="text-green-400 text-xs">↑</div>
              )}
              {entry.rank > entry.previousRank && entry.previousRank > 0 && (
                <div className="text-red-400 text-xs">↓</div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
