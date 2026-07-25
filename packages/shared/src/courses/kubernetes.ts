import type { Course } from '../types/course';
import { SCENARIOS } from '../constants/scenarios';
import { CHARACTERS } from '../constants/characters';

export const kubernetesCourse: Course = {
  id: 'kubernetes',
  name: 'Kubernetes Operations',
  icon: '⎈',
  description: 'Master Kubernetes cluster management, debugging, and operations through hands-on incident scenarios.',
  terminalPrompt: '⎈ default $ ',
  terminalWelcome: [
    '\x1b[36m╔══════════════════════════════════════╗\x1b[0m',
    '\x1b[36m║   KubeQuest Terminal Simulator       ║\x1b[0m',
    '\x1b[36m║   Type kubectl commands to solve      ║\x1b[0m',
    '\x1b[36m╚══════════════════════════════════════╝\x1b[0m',
  ],
  scenarios: SCENARIOS,
  characters: CHARACTERS,
};
