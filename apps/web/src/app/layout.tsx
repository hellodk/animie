import type { Metadata } from 'next';
import './globals.css';
import { SocketProvider } from '@/providers/SocketProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'KubeQuest — Kubernetes Learning Game',
  description: 'Multiplayer Kubernetes simulation game for classrooms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SocketProvider>
            <ThemeToggle />
            {children}
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
