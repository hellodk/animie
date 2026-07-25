'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSocket, loadSession } from '@/providers/SocketProvider';
import { getCourse } from '@kubequest/shared';
import { useGameStore } from '@/store/gameStore';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { formatTime, getDifficultyLabel, getDifficultyColor, evaluateObjectiveHints } from '@/lib/utils';
import ConceptDiagram from '@/components/concepts/ConceptDiagram';

const KubeTerminal = dynamic(
  () => import('@/components/terminal/KubeTerminal').then(m => m.KubeTerminal),
  { ssr: false, loading: () => <div className="flex-1 bg-[#0a0f1e] rounded-xl animate-pulse" /> }
);

export default function GamePage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const router = useRouter();
  const socket = useSocket();
  const {
    phase, currentScenario, leaderboard, myPlayer, myScore,
    lastScoreEvent, roundEndAt, solvedPlayers, settings, clusterState,
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [hintIndex, setHintIndex] = useState(0);
  const [solveNotification, setSolveNotification] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scorePopup, setScorePopup] = useState<number | null>(null);

  // Bug 3: on page load/refresh, if store is empty (no myPlayer), attempt to rejoin via
  // sessionStorage so the server re-registers the player and avoids "cluster state not initialized".
  const { setRoomCode, setMyPlayer: storeSetMyPlayer, setSettings, setPlayers, setPhase, setCurrentCourse } = useGameStore();
  useEffect(() => {
    if (!myPlayer) {
      const session = loadSession();
      if (session) {
        socket.emit('room:join', { roomCode: session.roomCode, playerName: session.playerName }, (ack) => {
          if (ack.success && ack.player && ack.room) {
            setRoomCode(ack.room.code);
            storeSetMyPlayer(ack.player);
            setSettings(ack.room.settings);
            setPlayers(ack.room.players);
            setPhase(ack.room.phase);
            setCurrentCourse(getCourse(ack.room.settings.courseId ?? 'kubernetes'));
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!roundEndAt) { setTimeLeft(null); return; }
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, roundEndAt - Date.now()));
    }, 250);
    return () => clearInterval(interval);
  }, [roundEndAt]);

  // Score popup
  useEffect(() => {
    if (lastScoreEvent && lastScoreEvent.points > 0) {
      setScorePopup(lastScoreEvent.points);
      setTimeout(() => setScorePopup(null), 2000);
    }
  }, [lastScoreEvent]);

  // Phase changes
  useEffect(() => {
    if (phase === 'final') router.push(`/leaderboard/${code}`);
    if (phase === 'review') setShowLeaderboard(true);
    if (phase === 'active') setShowLeaderboard(false);
  }, [phase, code, router]);

  // Player solved notifications
  useEffect(() => {
    if (!solvedPlayers.length) return;
    const lastId = solvedPlayers[solvedPlayers.length - 1];
    const lb = leaderboard.find(e => e.playerId === lastId);
    if (lb) {
      setSolveNotification(`${lb.characterEmoji} ${lb.playerName} solved it! 🎉`);
      setTimeout(() => setSolveNotification(null), 3000);
    }
  }, [solvedPlayers]);

  function requestHint() {
    socket.emit('game:request-hint', { roomCode: code, hintIndex }, (ack) => {
      if (ack.hint) {
        setHints(prev => [...prev, ack.hint!]);
        setHintIndex(i => i + 1);
      }
    });
  }

  const namespace = (() => {
    if (!currentScenario) return settings?.courseId === 'blockchain' ? 'blockchain' : 'default';
    const id = currentScenario.scenario.id;
    if (id.startsWith('bc-')) return 'blockchain';
    if (id.includes('production')) return 'production';
    if (id.includes('staging')) return 'staging';
    return 'default';
  })();

  const isMySolved = myPlayer && solvedPlayers.includes(myPlayer.id);
  const isTimeLow = timeLeft !== null && timeLeft < 30_000;

  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b] border-b border-[#334155] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#326CE5] font-bold hover:underline">⎈ KubeQuest</Link>
          <span className="text-slate-500 text-sm">Room: {code}</span>
          {currentScenario && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-sm text-slate-300">{currentScenario.scenario.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: getDifficultyColor(currentScenario.scenario.difficulty) + '20',
                color: getDifficultyColor(currentScenario.scenario.difficulty),
              }}>
                {getDifficultyLabel(currentScenario.scenario.difficulty)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {timeLeft !== null && (
            <div className={`font-mono font-bold text-lg ${isTimeLow ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}

          {/* My score */}
          <div className="text-right">
            <div className="text-sm font-bold text-[#326CE5]">{myScore?.totalPoints ?? 0} pts</div>
            {(myScore?.currentStreak ?? 0) > 1 && (
              <div className="text-xs text-orange-400">🔥 {myScore!.currentStreak} streak</div>
            )}
          </div>

          <button
            onClick={() => setShowLeaderboard(v => !v)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors whitespace-nowrap shrink-0"
            title="Toggle leaderboard"
          >
            🏆
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — scenario + hints */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-[#334155] overflow-y-auto">
          {currentScenario ? (
            <div className="p-4 space-y-4">
              {/* Scenario header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-500">
                    Scenario {currentScenario.scenarioIndex + 1}/{currentScenario.totalScenarios}
                  </span>
                </div>
                <h2 className="font-bold text-lg text-white">{currentScenario.scenario.name}</h2>
              </div>

              {/* Concept diagram */}
              <ConceptDiagram conceptId={currentScenario.scenario.conceptId} />

              {/* Story */}
              <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {currentScenario.scenario.story.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              </div>

              {/* Objectives */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Objectives</h3>
                <ul className="space-y-2">
                  {currentScenario.scenario.objectives.map((obj, i) => {
                    const hints = evaluateObjectiveHints(currentScenario.scenario, clusterState);
                    const done = isMySolved || hints[i];
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className={done ? 'text-green-400' : 'text-slate-600'}>
                          {done ? '✅' : '○'}
                        </span>
                        {obj}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Hints */}
              {settings?.showHints && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-400">Hints</h3>
                    <span className="text-xs text-slate-500">{3 - hintIndex} remaining</span>
                  </div>
                  {hints.map((h, i) => (
                    <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2 text-xs text-yellow-200">
                      💡 {h}
                    </div>
                  ))}
                  {hintIndex < 3 && !isMySolved && (
                    <button
                      onClick={requestHint}
                      className="w-full py-2 border border-yellow-500/40 hover:bg-yellow-500/10 text-yellow-400 text-sm rounded-lg transition-colors"
                    >
                      💡 Use Hint (-{[20, 35, 50][hintIndex]}pts)
                    </button>
                  )}
                </div>
              )}

              {/* Solved banner */}
              {isMySolved && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center"
                >
                  <div className="text-3xl mb-1">🎉</div>
                  <div className="font-bold text-green-400">Scenario Solved!</div>
                  <div className="text-sm text-green-300 mt-1">
                    +{myScore?.lastPointDelta ?? 0} points earned
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              {/* Character card */}
              {myPlayer && (
                <div className="rounded-xl p-4 border border-[#334155] bg-[#1e293b]">
                  <div className="text-3xl mb-2">{myPlayer.character?.avatarEmoji ?? '⎈'}</div>
                  <div className="font-semibold text-white">{myPlayer.character?.name ?? 'KubeQuest Player'}</div>
                  {myPlayer.character?.buff?.description && (
                    <div className="text-xs text-slate-400 mt-1">{myPlayer.character.buff.description}</div>
                  )}
                </div>
              )}

              {/* Tip box */}
              <div className="rounded-lg p-3 border border-yellow-500/30 bg-yellow-500/10 text-xs text-yellow-200">
                💡 Tip: Use <code className="font-mono bg-yellow-500/20 px-1 rounded">kubectl get pods</code> to inspect the cluster when the scenario starts.
              </div>

              {/* Waiting text */}
              <div className="text-center text-slate-500 text-sm mt-2">
                ⏳ Waiting for scenario...
              </div>
            </div>
          )}
        </div>

        {/* Right panel — terminal or leaderboard */}
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          {showLeaderboard ? (
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Live Leaderboard</h2>
                <button onClick={() => setShowLeaderboard(false)} className="text-slate-400 hover:text-white text-sm">
                  ← Back to Terminal
                </button>
              </div>
              <Leaderboard entries={leaderboard} myPlayerId={myPlayer?.id} />
            </div>
          ) : (
            <KubeTerminal roomCode={code} namespace={namespace} />
          )}
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {solveNotification && (
          <motion.div
            key="solve"
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-16 left-1/2 bg-green-900/90 border border-green-500 rounded-xl px-6 py-3 text-green-300 font-semibold shadow-xl z-50"
          >
            {solveNotification}
          </motion.div>
        )}
        {scorePopup && (
          <motion.div
            key="score"
            initial={{ opacity: 0, y: 0, x: '-50%' }}
            animate={{ opacity: 1, y: -40, x: '-50%' }}
            exit={{ opacity: 0, y: -80, x: '-50%' }}
            className="fixed bottom-20 left-1/2 text-3xl font-black text-green-400 z-50 pointer-events-none"
          >
            +{scorePopup}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase overlays */}
      <AnimatePresence>
        {phase === 'briefing' && currentScenario && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1e293b] border border-[#326CE5] rounded-2xl p-8 max-w-lg w-full mx-4 text-center"
            >
              <div className="text-4xl mb-4">📋</div>
              <div className="text-sm text-[#326CE5] mb-2">
                Scenario {currentScenario.scenarioIndex + 1} of {currentScenario.totalScenarios}
              </div>
              <h2 className="text-2xl font-bold mb-4">{currentScenario.scenario.name}</h2>
              <div className="mb-4">
                <ConceptDiagram conceptId={currentScenario.scenario.conceptId} />
              </div>
              <p className="text-slate-400 mb-6 text-sm">{currentScenario.scenario.description}</p>
              <div className="text-slate-300 text-sm">Starting in a moment...</div>
            </motion.div>
          </motion.div>
        )}
        {phase === 'review' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 max-w-lg w-full mx-4"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">📊</div>
                <h2 className="text-2xl font-bold">Round Results</h2>
              </div>
              <Leaderboard entries={leaderboard.slice(0, 5)} myPlayerId={myPlayer?.id} />
              <p className="text-center text-slate-500 text-sm mt-6">Next scenario starting soon...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
