import type { KubectlVerb } from './k8s';
import type { ScenarioCategory } from './game';

export type DifficultyTier = 1 | 2 | 3 | 4;

export interface Hint {
  id: string;
  order: number;
  text: string;
  pointPenalty: number;
}

export type WinConditionType =
  | 'pod-running'
  | 'deployment-ready'
  | 'replica-count'
  | 'resource-exists'
  | 'resource-deleted'
  | 'label-set'
  | 'env-var-set'
  | 'service-selector-match'
  | 'secret-mounted'
  | 'rbac-binding-exists'
  | 'hpa-configured'
  | 'image-set'
  | 'ingress-backend'
  | 'annotation-set'
  | 'custom'
  | 'all';

export interface WinCondition {
  type: WinConditionType;
  targetNamespace?: string;
  targetName?: string;
  targetKind?: string;
  expectedValue?: string | number;
  expectedLabels?: Record<string, string>;
  all?: WinCondition[];
  /** Human-readable description used when type === 'custom'. Server skips evaluation. */
  label?: string;
}

export interface ClusterStateSnapshot {
  namespaces: string[];
  currentNamespace: string;
  resources: SerializedResource[];
}

export interface SerializedResource {
  kind: string;
  spec: Record<string, unknown>;
}

export interface Scenario {
  id: string;
  slug: string;
  name: string;
  category: ScenarioCategory;
  difficulty: DifficultyTier;
  estimatedMinutes: number;
  maxPoints: number;
  description: string;
  story: string;
  objectives: string[];
  initialClusterState: ClusterStateSnapshot;
  winCondition: WinCondition;
  hints: Hint[];
  allowedCommands?: KubectlVerb[];
  solutionCommands: string[];
  teacherNotes: string;
  conceptId?: string;
}

export type { KubectlVerb };
