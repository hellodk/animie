import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { WinCondition, ClusterState } from '@kubequest/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(pts: number): string {
  return pts.toLocaleString();
}

export function getDifficultyLabel(d: number): string {
  return ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'][d] ?? 'Unknown';
}

export function getDifficultyColor(d: number): string {
  return ['', '#4ade80', '#fbbf24', '#f97316', '#ef4444'][d] ?? '#94a3b8';
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Client-side approximation of win-condition satisfaction for each objective.
 * Returns one boolean per objective string (index aligned).
 * Only checks conditions the client can evaluate from the cluster state snapshot;
 * complex conditions default to false until the server confirms.
 */
export function evaluateObjectiveHints(
  scenario: { objectives: string[]; winCondition?: WinCondition },
  clusterState: ClusterState | null,
): boolean[] {
  if (!clusterState || !scenario.winCondition) {
    return scenario.objectives.map(() => false);
  }

  const winCondition = scenario.winCondition;
  const ns = winCondition.targetNamespace ?? 'default';
  const name = winCondition.targetName ?? '';
  const nsResources = clusterState.resources[ns] ?? {};

  function checkSingle(cond: WinCondition): boolean {
    const res = nsResources[cond.targetName ?? ''] as
      | { status?: { phase?: string; readyReplicas?: number; replicas?: number }; spec?: { replicas?: number } }
      | undefined;
    switch (cond.type) {
      case 'pod-running':
        return res?.status?.phase === 'Running';
      case 'replica-count':
        return res?.spec?.replicas === cond.expectedValue;
      case 'deployment-ready':
        return (res?.status?.readyReplicas ?? 0) > 0 &&
          res?.status?.readyReplicas === res?.status?.replicas;
      default:
        return false;
    }
  }

  // For compound 'all' conditions, evaluate each sub-condition against its objective
  if (winCondition.type === 'all' && winCondition.all) {
    return scenario.objectives.map((_, i) => {
      const sub = winCondition.all![i];
      if (!sub) return false;
      const subNs = sub.targetNamespace ?? ns;
      const subNsRes = clusterState.resources[subNs] ?? {};
      const subRes = subNsRes[sub.targetName ?? name] as
        | { status?: { phase?: string; readyReplicas?: number; replicas?: number }; spec?: { replicas?: number } }
        | undefined;
      switch (sub.type) {
        case 'pod-running':
          return subRes?.status?.phase === 'Running';
        case 'deployment-ready':
          return (subRes?.status?.readyReplicas ?? 0) > 0 &&
            subRes?.status?.readyReplicas === subRes?.status?.replicas;
        default:
          return false;
      }
    });
  }

  const passed = checkSingle({ ...winCondition, targetNamespace: ns, targetName: name });
  // All objectives share the single win condition — map first objective to result, rest to false
  return scenario.objectives.map((_, i) => (i === 0 ? passed : false));
}
