'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSocket } from '@/providers/SocketProvider';
import { useGameStore } from '@/store/gameStore';
import { COURSES, getCourse } from '@kubequest/shared';

const DIFF_COLORS = ['', '#4ade80', '#fbbf24', '#f97316', '#ef4444'];
const DIFF_LABELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

const SCENARIO_EMOJIS = ['💥','📈','😱','🕸️','🔐','🔒','⚙️','👻','🔥','🐳','📦','🌐','🦀','⏳','📦'];

export default function CreatePage() {
  const [teacherName, setTeacherName] = useState('');
  const [timeLimit, setTimeLimit] = useState(120);
  const [selectedCourseId, setSelectedCourseId] = useState('kubernetes');
  const [selectedScenarios, setSelectedScenarios] = useState(
    getCourse('kubernetes').scenarios.slice(0, 5).map(s => s.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socket = useSocket();
  const router = useRouter();
  const { setRoomCode, setMyPlayer, setSettings } = useGameStore();

  function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);
    const course = getCourse(courseId);
    setSelectedScenarios(course.scenarios.slice(0, 5).map(s => s.id));
  }

  function toggleScenario(id: string) {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherName.trim()) { setError('Please enter your name'); return; }
    if (!selectedScenarios.length) { setError('Select at least one scenario'); return; }
    setLoading(true);
    setError('');

    socket.emit('room:create', {
      teacherName: teacherName.trim(),
      courseId: selectedCourseId,
      settings: {
        scenarioIds: selectedScenarios,
        timeLimitSeconds: timeLimit,
        showHints: true,
        allowLateJoin: true,
        courseId: selectedCourseId,
      },
    }, (ack) => {
      setLoading(false);
      if (ack.success && ack.room) {
        setRoomCode(ack.room.code);
        router.push(`/teacher/${ack.room.code}`);
      } else {
        setError(ack.error ?? 'Failed to create room');
      }
    });
  }

  const activeCourse = getCourse(selectedCourseId);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--background)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👩‍🏫</div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Create Classroom</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Set up your learning game session</p>
        </div>

        <form onSubmit={handleCreate}
          className="rounded-2xl p-8 space-y-6 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Course selector */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Select Course
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {COURSES.map(course => {
                const active = selectedCourseId === course.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => handleCourseChange(course.id)}
                    className="flex flex-col items-start p-3 rounded-xl border text-left transition-all"
                    style={{
                      background: active ? 'rgba(50,108,229,0.12)' : 'var(--background)',
                      borderColor: active ? 'rgba(50,108,229,0.6)' : 'var(--border)',
                      outline: active ? '2px solid rgba(50,108,229,0.3)' : 'none',
                    }}
                  >
                    <span className="text-2xl mb-1">{course.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{course.name}</span>
                    <span className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{course.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teacher name */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Your Name
            </label>
            <input
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              placeholder="e.g. Alex Smith"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors border"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Time limit */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Time per Scenario:{' '}
              <span style={{ color: 'var(--accent)' }}>{timeLimit}s</span>
            </label>
            <input
              type="range" min={60} max={300} step={30}
              value={timeLimit}
              onChange={e => setTimeLimit(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>60s</span><span>5 min</span>
            </div>
          </div>

          {/* Scenario selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Select Scenarios
              </label>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(50,108,229,0.15)', color: 'var(--accent)' }}>
                {selectedScenarios.length} selected
              </span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeCourse.scenarios.map((s, i) => {
                const selected = selectedScenarios.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                    style={{
                      background: selected ? 'rgba(50,108,229,0.08)' : 'var(--background)',
                      borderColor: selected ? 'rgba(50,108,229,0.5)' : 'var(--border)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleScenario(s.id)}
                      className="accent-blue-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-base shrink-0">{SCENARIO_EMOJIS[i] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{s.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {s.category} · {s.estimatedMinutes}m · {s.maxPoints}pts
                      </div>
                    </div>
                    <div className="text-xs font-bold shrink-0" title={DIFF_LABELS[s.difficulty]}
                      style={{ color: DIFF_COLORS[s.difficulty] }}>
                      {'●'.repeat(s.difficulty)}{'○'.repeat(4 - s.difficulty)}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedScenarios.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.3)', color: '#ca8a04' }}>
              Select at least one scenario to continue.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.3)', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || selectedScenarios.length === 0}
            className="w-full py-4 font-bold rounded-xl text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 16px rgba(50,108,229,0.3)' }}
          >
            {loading ? 'Creating room...' : '🚀 Create Room'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
