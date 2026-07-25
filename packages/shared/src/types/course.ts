import type { Character } from './game';
import type { Scenario } from './scenario';

export interface Course {
  id: string;
  name: string;
  icon: string;
  description: string;
  terminalPrompt: string;
  terminalWelcome: string[];
  scenarios: Scenario[];
  characters: Character[];
}
