'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { formatPoints } from '@/lib/utils';
import type { LeaderboardEntry } from '@kubequest/shared';

const RANK_ICONS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = (params.code as string).toUpperCase();
  const isProjector = searchParams.get('projector') === '1';
  const { leaderboard, phase, currentScenario } = useGameStore();
  const [prevEntries, setPrevEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (leaderboard.length) setPrevEntries(leaderboard);
  }, [leaderboard]);

  const entries = leaderboard.length ? leaderboard : prevEntries;
  const isFinal = phase === 'final';

  if (isProjector) return <ProjectorView entries={entries} roomCode={code} isFinal={isFinal} />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{isFinal ? '🏆' : '📊'}</div>
          <h1 className="text-3xl font-bold">{isFinal ? 'Final Leaderboard' : 'Live Leaderboard'}</h1>
          <p className="text-slate-400 mt-2">Room: <span className="font-mono text-[#326CE5]">{code}</span></p>
          {currentScenario && !isFinal && (
            <p className="text-slate-500 text-sm mt-1">Scenario {currentScenario.scenarioIndex + 1}: {currentScenario.scenario.name}</p>
          )}
        </div>

        {/* Podium for top 3 */}
        {isFinal && entries.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {[1, 0, 2].map(i => {
              const e = entries[i];
              if (!e) return null;
              const height = i === 0 ? 'h-28' : i === 1 ? 'h-20' : 'h-16';
              return (
                <motion.div
                  key={e.playerId}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (2 - i) * 0.2 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="text-3xl">{e.characterEmoji}</div>
                  <div className="text-sm font-bold text-center max-w-[80px] truncate">{e.playerName}</div>
                  <div className="text-lg font-black" style={{ color: PODIUM_COLORS[entries.indexOf(e)] }}>
                    {RANK_ICONS[entries.indexOf(e)]}
                  </div>
                  <div
                    className={`${height} w-20 rounded-t-xl flex items-end justify-center pb-2 font-bold text-sm`}
                    style={{ background: PODIUM_COLORS[entries.indexOf(e)] + '30', border: `2px solid ${PODIUM_COLORS[entries.indexOf(e)]}40` }}
                  >
                    {formatPoints(e.totalPoints)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.playerId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 bg-[#1e293b] border border-[#334155] rounded-xl px-5 py-4"
            >
              <div className="w-8 text-center font-bold text-lg">
                {entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : <span className="text-slate-400 text-sm">#{entry.rank}</span>}
              </div>
              <div className="text-2xl">{entry.characterEmoji}</div>
              <div className="flex-1">
                <div className="font-semibold">{entry.playerName}</div>
                <div className="text-xs text-slate-500">
                  {entry.completedScenarios} solved
                  {entry.maxStreak > 1 && <span className="ml-2 text-orange-400">Best streak: {entry.maxStreak}🔥</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-white">{formatPoints(entry.totalPoints)}</div>
                <div className="text-xs text-slate-500">points</div>
              </div>
            </motion.div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-16">
            {(phase === 'active' || phase === 'briefing') ? (
              <>
                <div className="text-4xl mb-4">🎮</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Game in progress</div>
                <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  Students are solving scenarios right now.
                  <br />
                  Scores will appear here as they solve each one.
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">⏳</div>
                <div className="text-slate-500">Waiting for game to start…</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectorView({ entries, roomCode, isFinal }: { entries: LeaderboardEntry[]; roomCode: string; isFinal: boolean }) {
  return (
    <div className="min-h-screen bg-[#050a14] text-white p-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-5xl">⎈</div>
          <div>
            <div className="text-4xl font-black">Kube<span className="text-[#326CE5]">Quest</span></div>
            <div className="text-slate-400">{isFinal ? '🏆 Final Results' : '📊 Live Leaderboard'}</div>
          </div>
        </div>
        <div className="text-right pr-14">
          <div className="text-slate-400 text-lg">Room Code</div>
          <div className="font-mono font-black text-5xl text-[#326CE5] tracking-widest">{roomCode}</div>
        </div>
      </div>

      {/* Top 10 big display */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {entries.slice(0, 10).map((entry, i) => (
          <motion.div
            key={entry.playerId}
            layout
            className="flex items-center gap-5 bg-[#1e293b]/60 border border-[#334155] rounded-2xl px-6 py-4"
          >
            <div className="w-12 text-center text-3xl font-black text-slate-400">
              {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
            </div>
            <div className="text-4xl">{entry.characterEmoji}</div>
            <div className="flex-1">
              <div className="text-2xl font-bold">{entry.playerName}</div>
              <div className="text-slate-400">
                {entry.completedScenarios} scenarios solved
                {entry.currentStreak > 1 && <span className="ml-3 text-orange-400">🔥 {entry.currentStreak} streak</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black" style={{ color: i < 3 ? PODIUM_COLORS[i] : 'white' }}>
                {formatPoints(entry.totalPoints)}
              </div>
              {entry.lastPointDelta > 0 && (
                <div className="text-green-400 text-lg">+{entry.lastPointDelta}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
