import type { ClusterState, Pod, Deployment, Service, RoleBinding, HorizontalPodAutoscaler, Ingress } from '@kubequest/shared';
import type { WinCondition } from '@kubequest/shared';
import { getResource, listResources } from '../k8s-sim/cluster';

export function evaluateWinCondition(condition: WinCondition, state: ClusterState): boolean {
  const ns = condition.targetNamespace ?? state.currentNamespace;
  const name = condition.targetName ?? '';

  switch (condition.type) {
    case 'pod-running': {
      if (name) {
        const pod = getResource<Pod>(state, 'Pod', ns, name);
        return pod?.status.phase === 'Running';
      }
      const pods = listResources<Pod>(state, 'Pod', ns);
      return pods.length > 0 && pods.every(p => p.status.phase === 'Running');
    }

    case 'deployment-ready': {
      const dep = getResource<Deployment>(state, 'Deployment', ns, name);
      if (!dep) return false;
      return dep.status.readyReplicas >= dep.spec.replicas && dep.spec.replicas > 0;
    }

    case 'replica-count': {
      const dep = getResource<Deployment>(state, 'Deployment', ns, name);
      if (!dep) return false;
      return dep.spec.replicas === condition.expectedValue && dep.status.readyReplicas === dep.spec.replicas;
    }

    case 'resource-exists': {
      const kind = condition.targetKind ?? '';
      return !!getResource(state, kind, ns, name);
    }

    case 'resource-deleted': {
      const kind = condition.targetKind ?? '';
      return !getResource(state, kind, ns, name);
    }

    case 'label-set': {
      const kind = condition.targetKind ?? 'Pod';
      const res = getResource(state, kind, ns, name);
      if (!res) return false;
      const expected = condition.expectedLabels ?? {};
      return Object.entries(expected).every(([k, v]) => res.metadata.labels[k] === v);
    }

    case 'annotation-set': {
      const kind = condition.targetKind ?? 'Deployment';
      const res = getResource(state, kind, ns, name);
      if (!res) return false;
      const expected = condition.expectedLabels ?? {};
      return Object.entries(expected).every(([k, v]) => res.metadata.annotations[k] === v);
    }

    case 'env-var-set': {
      const pod = getResource<Pod>(state, 'Pod', ns, name);
      if (!pod) return false;
      const expectedKey = condition.expectedValue as string;
      for (const c of pod.spec.containers) {
        if (c.env?.some(e => e.name === expectedKey)) return true;
        if (c.envFrom?.length) return true;
      }
      return false;
    }

    case 'service-selector-match': {
      const svc = getResource<Service>(state, 'Service', ns, name);
      if (!svc || !svc.spec.selector) return false;
      const pods = listResources<Pod>(state, 'Pod', ns);
      return pods.some(p =>
        p.status.phase === 'Running' &&
        Object.entries(svc.spec.selector!).every(([k, v]) => p.metadata.labels[k] === v)
      );
    }

    case 'secret-mounted': {
      const pod = getResource<Pod>(state, 'Pod', ns, name);
      if (!pod) return false;
      const secretName = condition.expectedValue as string;
      for (const c of pod.spec.containers) {
        if (c.envFrom?.some(ef => ef.secretRef?.name === secretName)) {
          // Also fix pod status
          if (pod.status.phase !== 'Running') {
            pod.status.phase = 'Running';
            if (pod.status.containerStatuses?.[0]) {
              pod.status.containerStatuses[0].ready = true;
              pod.status.containerStatuses[0].state = 'running';
            }
          }
          return true;
        }
      }
      return false;
    }

    case 'rbac-binding-exists': {
      const rb = getResource<RoleBinding>(state, 'RoleBinding', ns, name);
      return !!rb && rb.subjects.length > 0 && !!rb.roleRef.name;
    }

    case 'hpa-configured': {
      const hpa = getResource<HorizontalPodAutoscaler>(state, 'HorizontalPodAutoscaler', ns, name);
      if (!hpa) return false;
      return hpa.spec.minReplicas >= 1 && hpa.spec.maxReplicas > hpa.spec.minReplicas;
    }

    case 'image-set': {
      const dep = getResource<Deployment>(state, 'Deployment', ns, name);
      if (!dep) return false;
      const expectedImage = condition.expectedValue as string;
      return dep.spec.template.spec.containers.some(c => c.image === expectedImage);
    }

    case 'ingress-backend': {
      const ing = getResource<Ingress>(state, 'Ingress', ns, name);
      if (!ing) return false;
      const expectedService = condition.expectedValue as string;
      return ing.spec.rules.some(r =>
        r.http.paths.some(p => p.backend.service.name === expectedService)
      );
    }

    case 'all': {
      return (condition.all ?? []).every(sub => evaluateWinCondition(sub, state));
    }

    case 'custom':
      // Custom win conditions are evaluated externally or require manual teacher advance.
      return false;

    default:
      return false;
  }
}
