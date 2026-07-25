'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSocket, saveSession } from '@/providers/SocketProvider';
import { useGameStore } from '@/store/gameStore';
import { getCourse } from '@kubequest/shared';

export default function JoinPage() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socket = useSocket();
  const router = useRouter();
  const { setRoomCode: storeSetRoom, setMyPlayer, setSettings, setPlayers, setPhase, setCurrentCourse } = useGameStore();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code || code.length !== 6) { setError('Enter a valid 6-character room code'); return; }
    if (!playerName.trim()) { setError('Please enter your name'); return; }
    setLoading(true);
    setError('');

    socket.emit('room:join', {
      roomCode: code,
      playerName: playerName.trim(),
    }, (ack) => {
      setLoading(false);
      if (ack.success && ack.room && ack.player) {
        storeSetRoom(code);
        setMyPlayer(ack.player);
        setSettings(ack.room.settings);
        setPlayers(ack.room.players);
        setPhase(ack.room.phase);
        setCurrentCourse(getCourse(ack.room.settings.courseId ?? 'kubernetes'));
        saveSession({ roomCode: code, playerName: playerName.trim(), characterId: null });
        router.push(`/room/${code}`);
      } else {
        setError(ack.error ?? 'Failed to join room');
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--background)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎮</div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Join Game</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Enter the room code from your instructor
          </p>
        </div>

        <form onSubmit={handleJoin}
          className="rounded-2xl p-8 space-y-5 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Room code */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Room Code
            </label>
            <input
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full rounded-lg px-4 py-3 font-mono text-2xl text-center tracking-widest uppercase outline-none border transition-colors"
              style={{
                background: 'var(--background)',
                borderColor: roomCode.length === 6 ? 'var(--accent)' : 'var(--border)',
                color: 'var(--foreground)',
                letterSpacing: '0.3em',
              }}
            />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
              {roomCode.length}/6 characters
            </p>
          </div>

          {/* Player name */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Your Name
            </label>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Jordan"
              maxLength={30}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none border transition-colors"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.3)', color: '#DC2626' }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 font-bold rounded-xl text-base transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 16px rgba(50,108,229,0.3)' }}
          >
            {loading ? 'Joining...' : '🚀 Join Room'}
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Are you a teacher?{' '}
            <Link href="/create" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
              Create a room instead
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
