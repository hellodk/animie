'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  { icon: '🖥️', title: 'Real kubectl Simulator', desc: 'Practice actual Kubernetes commands in a safe sandbox environment.' },
  { icon: '🏆', title: 'Live Leaderboard', desc: 'Compete in real-time with classmates. Earn points for speed and accuracy.' },
  { icon: '🎭', title: '4 Unique Characters', desc: 'Each with special buffs. Choose your Operator, Developer, SRE, or Architect.' },
  { icon: '📋', title: '9 Scenarios', desc: 'From pod crashes to RBAC — realistic production incidents to solve.' },
  { icon: '💡', title: 'Progressive Hints', desc: 'Stuck? Use hints (with a point penalty). Learn without frustration.' },
  { icon: '👩‍🏫', title: 'Teacher Dashboard', desc: 'Monitor every student in real-time. Reveal solutions. Control the pace.' },
];

const scenarios = [
  { name: 'Pod in Distress', diff: 1, cat: 'pod-management', emoji: '💥' },
  { name: 'Scale Up or Ship Out', diff: 1, cat: 'deployment', emoji: '📈' },
  { name: 'Wrong Image, Wrong Vibes', diff: 2, cat: 'deployment', emoji: '😱' },
  { name: 'Service Not Found', diff: 2, cat: 'networking', emoji: '🕸️' },
  { name: 'Secret Agent', diff: 2, cat: 'secrets', emoji: '🔐' },
  { name: 'Namespace Lockdown', diff: 3, cat: 'rbac', emoji: '🔒' },
  { name: 'Autoscale or Bust', diff: 3, cat: 'hpa', emoji: '⚙️' },
  { name: 'The Ghost Ingress', diff: 3, cat: 'networking', emoji: '👻' },
  { name: 'Rollback to Safety', diff: 4, cat: 'debugging', emoji: '🔥' },
];

const diffColors = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
const diffLabels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Blue glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl" style={{ background: 'var(--accent)' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-8 border"
              style={{ background: 'rgba(50,108,229,0.12)', borderColor: 'rgba(50,108,229,0.3)', color: 'var(--accent)' }}>
              ⎈ Multiplayer Kubernetes Learning
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl"
                style={{ background: 'var(--accent)', boxShadow: '0 0 32px rgba(50,108,229,0.4)' }}>
                ⎈
              </div>
              <h1 className="text-6xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Kube<span style={{ color: 'var(--accent)' }}>Quest</span>
              </h1>
            </div>

            <p className="text-lg max-w-xl mx-auto mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Solve real Kubernetes incidents in a competitive classroom game.
              Race teammates, earn points, and climb the live leaderboard.
            </p>
            <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
              9 scenarios · Real kubectl simulator · Live leaderboard · 4 character classes
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 font-bold rounded-xl text-base transition-all"
                  style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 24px rgba(50,108,229,0.35)' }}
                >
                  👩‍🏫 Create Classroom
                </motion.button>
              </Link>
              <Link href="/join">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 font-bold rounded-xl text-base border transition-all"
                  style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
                >
                  🎮 Join Game
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-16 w-full">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--foreground)' }}>
          Everything you need for a Kubernetes workshop
        </h2>
        <p className="text-center text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
          No setup required for students — just share the room code
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-xl p-5 border transition-colors"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scenarios */}
      <div className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--foreground)' }}>
          9 Scenarios included
        </h2>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          From beginner-friendly to expert-level production incidents
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scenarios.map((s) => (
            <div key={s.name}
              className="rounded-lg p-3 flex items-center gap-3 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border-subtle)' }}
            >
              <span className="text-xl shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{s.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.cat}</div>
              </div>
              <div className={`text-xs font-bold shrink-0 ${diffColors[s.diff]}`} title={diffLabels[s.diff]}>
                {'●'.repeat(s.diff)}{'○'.repeat(4 - s.diff)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t py-6 text-center text-sm"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        KubeQuest — Built for Kubernetes education
      </footer>
    </div>
  );
}
