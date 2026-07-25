'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSocket, saveSession, loadSession } from '@/providers/SocketProvider';
import { useGameStore } from '@/store/gameStore';
import { CharacterSelect } from '@/components/game/CharacterSelect';
import { getCourse } from '@kubequest/shared';
import type { CharacterId } from '@kubequest/shared';

export default function RoomLobbyPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const router = useRouter();
  const socket = useSocket();
  const { players, phase, myPlayer, settings } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<CharacterId | null>(null);
  const [copied, setCopied] = useState(false);

  // Bug 1: redirect on character-select and briefing phases too, not just active
  useEffect(() => {
    if (phase === 'active' || phase === 'character-select' || phase === 'briefing') {
      router.push(`/game/${code}`);
    }
    if (phase === 'final') {
      router.push(`/leaderboard/${code}`);
    }
  }, [phase, code, router]);

  // Bug 2: auto-emit player:ready immediately when a character card is clicked
  function handleCharacterSelect(id: CharacterId) {
    setSelectedChar(id);
    socket.emit('player:ready', { roomCode: code });
    // Bug 3: update characterId in stored session
    const session = loadSession();
    if (session) {
      saveSession({ ...session, characterId: id });
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Bug 4: filter out any player whose role is 'teacher'
  // PlayerPublicInfo doesn't carry role, but we can cast defensively in case
  // the server ever adds it, and also exclude myPlayer when they are a teacher.
  type AugmentedPlayer = (typeof players)[number] & { role?: string };
  const visiblePlayers = (players as AugmentedPlayer[]).filter(p => {
    if (p.role === 'teacher') return false;
    if (myPlayer?.role === 'teacher' && p.id === myPlayer.id) return false;
    return true;
  });

  const readyCount = visiblePlayers.filter(p => p.isReady).length;

  // Lobby subtitle — Bug 1 UX improvement
  const subtitle = phase !== 'lobby'
    ? 'Game starting — choose your character!'
    : 'Waiting for the game to start';

  // Scenario names for the settings panel — look up in the correct course
  const scenarioNames = settings
    ? (() => {
        const course = getCourse(settings.courseId ?? 'kubernetes');
        const courseMap = Object.fromEntries(course.scenarios.map(s => [s.id, s]));
        return settings.scenarioIds.map(id => courseMap[id]?.name ?? id);
      })()
    : [];
  const displayedNames = scenarioNames.slice(0, 3);
  const remainingCount = scenarioNames.length - displayedNames.length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {/* Bug 6: home link */}
            <Link href="/" className="text-[#326CE5] font-bold text-sm hover:underline mb-1 inline-block">
              ⎈ KubeQuest
            </Link>
            <h1 className="text-2xl font-bold">Game Lobby</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <span className="font-mono font-bold text-[#326CE5] text-xl tracking-widest">{code}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{copied ? '✓ Copied!' : '📋 Copy'}</span>
          </button>
        </div>

        {/* Bug 7: urgency banner when game is starting */}
        {phase !== 'lobby' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold text-sm text-center animate-pulse"
          >
            ⚡ Game is starting! Select your character now.
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Character Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Choose Your Character
              {!selectedChar && (
                <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>(required)</span>
              )}
            </h2>
            {/* Bug 2: clicking a card calls handleCharacterSelect which also emits player:ready */}
            <CharacterSelect
              roomCode={code}
              selectedId={selectedChar}
              onSelect={handleCharacterSelect}
            />
            {/* Bug 2: show ready confirmation immediately, no separate button needed */}
            {selectedChar && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 py-3 text-center text-green-400 font-semibold"
              >
                ✅ You&apos;re ready! Waiting for teacher to start…
              </motion.div>
            )}
          </div>

          {/* Players list — Bug 4: only show students */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Players ({visiblePlayers.length})
              {visiblePlayers.length > 0 && (
                <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>{readyCount} ready</span>
              )}
            </h2>
            <div className="space-y-2">
              {visiblePlayers.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg p-3 border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="text-xl">{p.characterEmoji ?? '❓'}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p.characterId ?? 'No character selected'}
                    </div>
                  </div>
                  <div
                    className={`text-xs ${p.isReady ? 'text-green-400' : ''}`}
                    style={p.isReady ? undefined : { color: 'var(--text-muted)' }}
                  >
                    {p.isReady ? '✅ Ready' : '⏳ Waiting'}
                  </div>
                  {!p.isConnected && <div className="text-xs text-red-400">Disconnected</div>}
                </div>
              ))}
            </div>

            {settings && (
              <div
                className="mt-4 rounded-xl p-4 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Session Settings
                </h3>
                <div className="space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div>
                    ⏱️ Time per scenario:{' '}
                    <span style={{ color: 'var(--foreground)' }}>{settings.timeLimitSeconds}s</span>
                  </div>
                  <div>
                    📋 Scenarios:{' '}
                    <span style={{ color: 'var(--foreground)' }}>{settings.scenarioIds.length}</span>
                  </div>
                  {scenarioNames.length > 0 && (
                    <div className="mt-1 text-xs pl-5" style={{ color: 'var(--text-muted)' }}>
                      {displayedNames.join(', ')}
                      {remainingCount > 0 && ` and ${remainingCount} more`}
                    </div>
                  )}
                  <div>
                    💡 Hints:{' '}
                    <span style={{ color: 'var(--foreground)' }}>{settings.showHints ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
