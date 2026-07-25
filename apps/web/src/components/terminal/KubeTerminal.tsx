'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useGameStore } from '@/store/gameStore';
import type { Course } from '@kubequest/shared';

interface Props {
  roomCode: string;
  namespace?: string;
  course?: Course | null;
  onCommand?: (cmd: string, output: string) => void;
}

const TERMINAL_THEME = {
  background: '#0a0f1e',
  foreground: '#e2e8f0',
  cursor: '#38bdf8',
  cursorAccent: '#0f172a',
  selectionBackground: '#326CE520',
  black: '#1e293b',
  brightBlack: '#475569',
  red: '#f87171',
  brightRed: '#ef4444',
  green: '#4ade80',
  brightGreen: '#22c55e',
  yellow: '#fbbf24',
  brightYellow: '#f59e0b',
  blue: '#60a5fa',
  brightBlue: '#3b82f6',
  magenta: '#c084fc',
  brightMagenta: '#a855f7',
  cyan: '#22d3ee',
  brightCyan: '#06b6d4',
  white: '#e2e8f0',
  brightWhite: '#f8fafc',
};

export function KubeTerminal({ roomCode, namespace = 'default', course, onCommand }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import('xterm').Terminal | null>(null);
  const inputRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);
  const socket = useSocket();
  const storeCourse = useGameStore(s => s.currentCourse);
  const activeCourse = course ?? storeCourse;

  const prompt = useCallback((ns: string) => {
    if (activeCourse?.terminalPrompt) {
      return `\x1b[36m${activeCourse.terminalPrompt}\x1b[0m`;
    }
    return `\x1b[36m⎈\x1b[0m \x1b[32m${ns}\x1b[0m \x1b[94m$\x1b[0m `;
  }, [activeCourse]);

  useEffect(() => {
    if (!containerRef.current) return;

    let terminal: import('xterm').Terminal;
    let fitAddon: import('@xterm/addon-fit').FitAddon;
    let rafId: number;
    let resizeObserver: ResizeObserver;
    let disposed = false;

    async function init() {
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      // xterm CSS is imported via global CSS

      terminal = new Terminal({
        theme: TERMINAL_THEME,
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        convertEol: true,
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      // Bug 2 fix: defer open() until the container has non-zero dimensions
      await new Promise<void>(resolve => {
        const tryOpen = () => {
          if (disposed) return;
          if (containerRef.current && containerRef.current.offsetHeight > 0) {
            terminal.open(containerRef.current);
            fitAddon.fit();
            resolve();
          } else {
            rafId = requestAnimationFrame(tryOpen);
          }
        };
        rafId = requestAnimationFrame(tryOpen);
      });

      if (disposed) return;
      termRef.current = terminal;

      // Welcome message — use course-specific lines if available
      const welcomeLines = activeCourse?.terminalWelcome ?? [
        '\x1b[36m╔══════════════════════════════════════╗\x1b[0m',
        '\x1b[36m║   KubeQuest Terminal Simulator       ║\x1b[0m',
        '\x1b[36m║   Type kubectl commands to solve      ║\x1b[0m',
        '\x1b[36m╚══════════════════════════════════════╝\x1b[0m',
      ];
      for (const line of welcomeLines) {
        terminal.writeln(line);
      }
      terminal.writeln('');
      terminal.write(prompt(namespace));

      terminal.onData((data) => {
        const code = data.charCodeAt(0);

        if (data === '\r') {
          // Enter
          terminal.writeln('');
          const cmd = inputRef.current.trim();
          inputRef.current = '';
          historyIdxRef.current = -1;

          if (cmd) {
            historyRef.current.unshift(cmd);
            if (historyRef.current.length > 100) historyRef.current.pop();

            socket.emit('game:submit-command', { roomCode, command: cmd }, (ack) => {
              const output = ack.result.output;
              const lines = output.split('\n');
              for (const line of lines) {
                terminal.writeln(ack.result.exitCode === 0 ? line : `\x1b[31m${line}\x1b[0m`);
              }
              terminal.write(prompt(namespace));
              onCommand?.(cmd, output);
            });
          } else {
            terminal.write(prompt(namespace));
          }
        } else if (code === 127 || data === '\x7f') {
          // Backspace
          if (inputRef.current.length > 0) {
            inputRef.current = inputRef.current.slice(0, -1);
            terminal.write('\b \b');
          }
        } else if (data === '\x1b[A') {
          // Arrow up — history
          const next = historyIdxRef.current + 1;
          if (next < historyRef.current.length) {
            clearCurrentInput(terminal, inputRef.current.length);
            inputRef.current = historyRef.current[next];
            historyIdxRef.current = next;
            terminal.write(inputRef.current);
          }
        } else if (data === '\x1b[B') {
          // Arrow down — history
          const prev = historyIdxRef.current - 1;
          clearCurrentInput(terminal, inputRef.current.length);
          if (prev >= 0) {
            inputRef.current = historyRef.current[prev];
            historyIdxRef.current = prev;
            terminal.write(inputRef.current);
          } else {
            inputRef.current = '';
            historyIdxRef.current = -1;
          }
        } else if (data === '\x03') {
          // Ctrl+C
          terminal.writeln('^C');
          inputRef.current = '';
          terminal.write(prompt(namespace));
        } else if (data === '\x0c') {
          // Ctrl+L
          terminal.clear();
          terminal.write(prompt(namespace));
        } else if (code >= 32) {
          inputRef.current += data;
          terminal.write(data);
        }
      });

      // Resize observer — keep terminal fitted as the container changes size
      resizeObserver = new ResizeObserver(() => {
        if (!disposed) fitAddon.fit();
      });
      resizeObserver.observe(containerRef.current!);
    }

    init();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      terminal?.dispose();
      termRef.current = null;
    };
  }, [roomCode, namespace, activeCourse]);

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] rounded-xl overflow-hidden border border-[#334155]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border-b border-[#334155]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-slate-400 ml-2 font-mono">{activeCourse?.name ?? 'KubeQuest'} — {namespace}</span>
        <button
          onClick={() => {
            if (termRef.current) {
              socket.emit('game:reset-cluster', { roomCode });
              termRef.current.clear();
              termRef.current.writeln('\x1b[33mCluster state reset to initial.\x1b[0m');
            }
          }}
          className="ml-auto text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
          title="Reset cluster to initial state"
        >
          ↺ Reset
        </button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}

function clearCurrentInput(terminal: import('xterm').Terminal, length: number) {
  for (let i = 0; i < length; i++) terminal.write('\b \b');
}
