'use client';
import { motion } from 'framer-motion';
import { CHARACTERS } from '@kubequest/shared';
import type { CharacterId } from '@kubequest/shared';
import { useSocket } from '@/providers/SocketProvider';
import { useGameStore } from '@/store/gameStore';

interface Props {
  roomCode: string;
  selectedId: CharacterId | null;
  onSelect: (id: CharacterId) => void;
}

export function CharacterSelect({ roomCode, selectedId, onSelect }: Props) {
  const socket = useSocket();
  const currentCourse = useGameStore(s => s.currentCourse);
  // Use course-specific characters if available, otherwise fall back to K8s defaults
  const characters = (currentCourse?.characters?.length ? currentCourse.characters : CHARACTERS);

  function handleSelect(id: CharacterId) {
    onSelect(id);
    socket.emit('player:select-character', { roomCode, characterId: id });
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {characters.map((c, i) => {
        const selected = selectedId === c.id;
        return (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSelect(c.id as CharacterId)}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              selected
                ? 'border-[#326CE5] bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-[#334155] bg-[#1e293b] hover:border-slate-500'
            }`}
          >
            <div className="text-4xl mb-3">{c.avatarEmoji}</div>
            <div className="font-bold text-white text-sm">{c.name}</div>
            <div className="text-xs text-slate-400 mt-1 mb-3">{c.title}</div>
            <div
              className="text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2"
              style={{ background: `${c.primaryColor}20`, color: c.primaryColor }}
            >
              {c.buff.name}
            </div>
            <div className="text-xs text-slate-400">{c.buff.description}</div>
            <div className="text-xs italic text-slate-500 mt-2">{c.flavor}</div>
          </motion.button>
        );
      })}
    </div>
  );
}
