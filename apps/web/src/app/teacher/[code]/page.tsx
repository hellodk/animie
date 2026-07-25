'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSocket } from '@/providers/SocketProvider';
import { useGameStore } from '@/store/gameStore';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { formatTime } from '@/lib/utils';
import type { PlayerProgressPayload } from '@kubequest/shared';

interface PlayerProgress {
  [playerId: string]: PlayerProgressPayload;
}

export default function TeacherDashboard() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const router = useRouter();
  const socket = useSocket();
  const { players, phase, currentScenario, leaderboard, roundEndAt, settings } = useGameStore();
  const [progress, setProgress] = useState<PlayerProgress>({});
  const [solutionCommands, setSolutionCommands] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const timer = roundEndAt
      ? setInterval(() => setTimeLeft(Math.max(0, roundEndAt - Date.now())), 500)
      : null;
    return () => { if (timer) clearInterval(timer); };
  }, [roundEndAt]);

  useEffect(() => {
    socket.on('teacher:player-progress', (payload) => {
      setProgress(prev => ({ ...prev, [payload.playerId]: payload }));
    });
    socket.on('teacher:solution', ({ commands }) => {
      setSolutionCommands(commands);
      setShowSolution(true);
    });
    return () => {
      socket.off('teacher:player-progress');
      socket.off('teacher:solution');
    };
  }, [socket]);

  useEffect(() => {
    if (phase === 'final') router.push(`/leaderboard/${code}`);
  }, [phase]);

  function startGame() { socket.emit('teacher:start-game', { roomCode: code }); }
  function nextScenario() { socket.emit('teacher:next-scenario', { roomCode: code }); }
  function endGame() { socket.emit('teacher:end-game', { roomCode: code }); }
  function revealSolution() { socket.emit('teacher:reveal-solution', { roomCode: code }); }
  function openProjector() { window.open(`/leaderboard/${code}?projector=1`, '_blank'); }

  // Filter out the teacher's own socket entry so the count reflects students only
  const students = (players as Array<(typeof players)[number] & { role?: string }>)
    .filter(p => p.id !== socket.id && p.role !== 'teacher');
  const solvedCount = Object.values(progress).filter(p => p.solved).length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0 bg-[#1e293b] border-r border-[#334155] flex flex-col">
          <div className="p-4 border-b border-[#334155]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#326CE5] text-lg">⎈</span>
              <span className="font-bold">Teacher Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#326CE5] text-xl tracking-widest">{code}</span>
              <span className="text-xs bg-[#0f172a] px-2 py-0.5 rounded text-slate-400">Room Code</span>
            </div>
          </div>

          {/* Phase info */}
          <div className="p-4 border-b border-[#334155]">
            <div className="text-xs text-slate-500 mb-1">Current Phase</div>
            <div className="font-bold capitalize text-white">{phase}</div>
            {currentScenario && (
              <div className="text-sm text-slate-400 mt-1">{currentScenario.scenario.name}</div>
            )}
            {timeLeft !== null && phase === 'active' && (
              <div className={`font-mono font-bold mt-2 ${timeLeft < 30000 ? 'text-red-400' : 'text-green-400'}`}>
                ⏱ {formatTime(timeLeft)} left
              </div>
            )}
            {currentScenario && (
              <div className="text-xs text-slate-500 mt-1">
                Scenario {currentScenario.scenarioIndex + 1}/{currentScenario.totalScenarios}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-2 border-b border-[#334155]">
            {phase === 'lobby' && (
              <div>
                <button
                  onClick={startGame}
                  disabled={students.length === 0}
                  title={students.length === 0 ? 'Waiting for students to join…' : undefined}
                  className="w-full py-2.5 bg-[#326CE5] hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🚀 Start Game
                </button>
                {students.length === 0 && (
                  <p className="text-xs text-center mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Waiting for students to join…
                  </p>
                )}
              </div>
            )}
            {(phase === 'active' || phase === 'review' || phase === 'character-select' || phase === 'briefing') && (
              <button onClick={nextScenario} className="w-full py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm">
                ⏭ Next Scenario
              </button>
            )}
            {phase === 'active' && (
              <button onClick={revealSolution} className="w-full py-2.5 bg-amber-700/50 hover:bg-amber-700 border border-amber-600/50 text-amber-200 rounded-lg text-sm transition-colors">
                💡 Reveal Solution
              </button>
            )}
            <button onClick={openProjector} className="w-full py-2 border border-[#334155] hover:border-slate-500 text-slate-400 rounded-lg text-sm transition-colors">
              📺 Open Projector View
            </button>
            {phase !== 'lobby' && phase !== 'final' && (
              <button onClick={endGame} className="w-full py-2 border border-red-800/50 hover:bg-red-900/20 text-red-400 rounded-lg text-sm transition-colors">
                ⏹ End Game
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f172a] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#326CE5]">{students.length}</div>
                <div className="text-xs text-slate-500">Players</div>
              </div>
              <div className="bg-[#0f172a] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{solvedCount}</div>
                <div className="text-xs text-slate-500">Solved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Player progress */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-bold mb-4">Player Progress</h2>
              {students.length === 0 ? (
                <div className="text-center text-slate-500 py-16">
                  <div className="text-4xl mb-4">👥</div>
                  <div>No students have joined yet.</div>
                  <div className="text-sm mt-2">Share the room code: <span className="font-mono text-[#326CE5] font-bold">{code}</span></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {students.map(p => {
                    const prog = progress[p.id];
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        className={`bg-[#1e293b] border rounded-xl p-4 ${prog?.solved ? 'border-green-500/50' : 'border-[#334155]'}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl">{p.characterEmoji ?? '❓'}</div>
                          <div>
                            <div className="font-semibold text-sm">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.characterId ?? 'No character'}</div>
                          </div>
                          {prog?.solved && (
                            <div className="ml-auto text-green-400 text-xl">✅</div>
                          )}
                          {!p.isConnected && (
                            <div className="ml-auto text-red-400 text-xs">Disconnected</div>
                          )}
                        </div>
                        {prog && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Commands run</span>
                              <span className="text-white">{prog.commandsRun}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Hints used</span>
                              <span className={prog.hintsUsed > 0 ? 'text-yellow-400' : 'text-white'}>{prog.hintsUsed}</span>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 bg-[#0f172a] rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${prog.solved ? 'bg-green-400' : 'bg-[#326CE5]'}`}
                                style={{ width: `${Math.min(100, prog.commandsRun * 10)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Solution panel */}
              {showSolution && solutionCommands.length > 0 && (
                <div className="mt-6 bg-amber-900/20 border border-amber-700/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-amber-300">💡 Solution Commands</h3>
                    <button onClick={() => setShowSolution(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
                  </div>
                  <div className="space-y-1">
                    {solutionCommands.map((cmd, i) => (
                      <div key={i} className="font-mono text-sm bg-[#0f172a] px-3 py-2 rounded text-green-300">
                        $ {cmd}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Leaderboard */}
            <div className="w-72 flex-shrink-0 border-l border-[#334155] overflow-y-auto p-4">
              <h2 className="font-bold mb-4">Live Leaderboard</h2>
              <Leaderboard entries={leaderboard} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
