import { v4 as uuidv4 } from 'uuid';
import type { ClusterState, AnyK8sResource, ClusterEvent, ResourceKind, ClusterStateSnapshot } from '@kubequest/shared';

export function buildClusterState(snapshot: ClusterStateSnapshot): ClusterState {
  const resources: Record<string, Record<string, AnyK8sResource>> = {};
  const events: ClusterEvent[] = [];

  for (const raw of snapshot.resources) {
    const res = raw.spec as unknown as AnyK8sResource;
    const kind = res.kind as string;
    if (!resources[kind]) resources[kind] = {};
    const key = `${res.metadata.namespace}/${res.metadata.name}`;
    resources[kind][key] = res;

    // Generate synthetic Warning events for broken resources
    if (kind === 'Pod') {
      const pod = res as import('@kubequest/shared').Pod;
      if (pod.status.phase === 'CrashLoopBackOff' || pod.status.phase === 'ImagePullBackOff') {
        events.push(makeEvent('Warning', 'BackOff', pod.status.message ?? 'Container failed to start', {
          kind: 'Pod', name: pod.metadata.name, namespace: pod.metadata.namespace,
        }));
      }
    }
    if (kind === 'Deployment') {
      const dep = res as import('@kubequest/shared').Deployment;
      if (dep.status.readyReplicas === 0 && dep.spec.replicas > 0) {
        events.push(makeEvent('Warning', 'DeploymentNotAvailable', `Deployment ${dep.metadata.name} has no ready replicas`, {
          kind: 'Deployment', name: dep.metadata.name, namespace: dep.metadata.namespace,
        }));
      }
    }
  }

  return {
    namespaces: snapshot.namespaces,
    resources,
    currentNamespace: snapshot.currentNamespace,
    events,
  };
}

export function getResource<T extends AnyK8sResource>(
  state: ClusterState,
  kind: string,
  namespace: string,
  name: string
): T | undefined {
  return state.resources[kind]?.[`${namespace}/${name}`] as T | undefined;
}

export function setResource(state: ClusterState, resource: AnyK8sResource): ClusterState {
  const kind = resource.kind as string;
  if (!state.resources[kind]) state.resources[kind] = {};
  const key = `${resource.metadata.namespace}/${resource.metadata.name}`;
  state.resources[kind][key] = resource;
  return state;
}

export function deleteResource(state: ClusterState, kind: string, namespace: string, name: string): boolean {
  const key = `${namespace}/${name}`;
  if (state.resources[kind]?.[key]) {
    delete state.resources[kind][key];
    return true;
  }
  return false;
}

export function listResources<T extends AnyK8sResource>(
  state: ClusterState,
  kind: string,
  namespace?: string
): T[] {
  const kindMap = state.resources[kind] ?? {};
  return Object.values(kindMap).filter(r =>
    !namespace || r.metadata.namespace === namespace
  ) as T[];
}

export function addEvent(state: ClusterState, event: ClusterEvent): void {
  state.events.unshift(event);
  if (state.events.length > 100) state.events.pop();
}

export function makeEvent(
  type: 'Normal' | 'Warning',
  reason: string,
  message: string,
  involvedObject: { kind: ResourceKind; name: string; namespace: string }
): ClusterEvent {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    type,
    reason,
    message,
    involvedObject,
    count: 1,
    firstTimestamp: now,
    lastTimestamp: now,
  };
}

export function cloneState(state: ClusterState): ClusterState {
  return JSON.parse(JSON.stringify(state));
}
