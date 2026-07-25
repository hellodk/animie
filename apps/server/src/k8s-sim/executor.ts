import type {
  ParsedKubectlCommand, ClusterState, CommandResult,
  Pod, Deployment, Service, ConfigMap, Secret,
  HorizontalPodAutoscaler, Ingress, Role, RoleBinding, ServiceAccount,
  AnyK8sResource,
} from '@kubequest/shared';
import {
  getResource, setResource, deleteResource, listResources, addEvent, makeEvent, cloneState,
} from './cluster';
import {
  renderPodList, renderDeploymentList, renderServiceList, renderConfigMapList,
  renderSecretList, renderHPAList, renderIngressList, renderDescribePod,
  renderDescribeDeployment, renderDescribeService, renderYaml,
} from './renderer';

export function executeCommand(
  cmd: ParsedKubectlCommand,
  state: ClusterState
): { result: CommandResult; newState: ClusterState } {
  const ns = cmd.namespace ?? state.currentNamespace;
  const mutableState = cloneState(state);

  try {
    switch (cmd.verb) {
      case 'get':     return handleGet(cmd, ns, mutableState);
      case 'describe':return handleDescribe(cmd, ns, mutableState);
      case 'apply':   return handleApply(cmd, ns, mutableState);
      case 'create':  return handleCreate(cmd, ns, mutableState);
      case 'delete':  return handleDelete(cmd, ns, mutableState);
      case 'scale':   return handleScale(cmd, ns, mutableState);
      case 'patch':   return handlePatch(cmd, ns, mutableState);
      case 'rollout': return handleRollout(cmd, ns, mutableState);
      case 'set':     return handleSet(cmd, ns, mutableState);
      case 'label':   return handleLabel(cmd, ns, mutableState);
      case 'annotate':return handleAnnotate(cmd, ns, mutableState);
      case 'logs':    return handleLogs(cmd, ns, mutableState);
      case 'exec':    return handleExec(cmd, ns, mutableState);
      case 'config':  return handleConfig(cmd, ns, mutableState);
      case 'autoscale':return handleAutoscale(cmd, ns, mutableState);
      case 'top':     return handleTop(cmd, ns, mutableState);
      case 'explain': return handleExplain(cmd, mutableState);
      default:
        return ok(`kubectl: unrecognized command "${cmd.verb}"`, mutableState, false);
    }
  } catch (e: unknown) {
    return err(`Error: ${e instanceof Error ? e.message : String(e)}`, mutableState);
  }
}

// ── GET ─────────────────────────────────────────────────────────────────────

function handleGet(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  const outputFormat = cmd.flags['-o'] ?? cmd.flags['--output'];
  const allNs = cmd.flags['-A'] === true || cmd.flags['--all-namespaces'] === true;

  if (kind === 'Endpoints' || kind === 'endpoints') {
    return handleGetEndpoints(cmd, ns, state);
  }

  if (kind === 'Event' || kind === 'events') {
    const events = state.events.filter(e =>
      allNs || e.involvedObject.namespace === ns
    );
    if (!events.length) return ok('No events found.', state, false);
    const rows = events.map(e => [e.type, e.reason, getAge(e.lastTimestamp), e.involvedObject.kind, e.involvedObject.name, e.message.slice(0, 60)]);
    const { renderTable } = require('./renderer');
    return ok(renderTable(['TYPE', 'REASON', 'AGE', 'OBJECT', 'NAME', 'MESSAGE'], rows), state, false);
  }

  if (cmd.name) {
    const res = getResource(state, kind, ns, cmd.name);
    if (!res) return err(`Error from server (NotFound): ${kind.toLowerCase()} "${cmd.name}" not found`, state);
    if (outputFormat === 'yaml' || outputFormat === 'json') return ok(renderYaml(res), state, false);
    return ok(renderSingleResource(res, outputFormat as string | boolean | undefined), state, false);
  }

  const resources = listResources(state, kind, allNs ? undefined : ns);
  const showLabels = cmd.flags['--show-labels'] === true;
  return ok(renderResourceList(kind, resources, showLabels), state, false);
}

function handleGetEndpoints(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const svcs = listResources<Service>(state, 'Service', ns);
  const pods = listResources<Pod>(state, 'Pod', ns);

  const targetName = cmd.name;
  const filtered = targetName ? svcs.filter(s => s.metadata.name === targetName) : svcs;

  const rows = filtered.map(svc => {
    const endpoints = pods
      .filter(p => p.status.phase === 'Running' && matchSelector(p.metadata.labels, svc.spec.selector ?? {}))
      .map(p => `${p.status.podIP ?? '10.244.0.1'}:${svc.spec.ports[0]?.targetPort ?? 80}`)
      .join(',') || '<none>';
    return [svc.metadata.name, endpoints, getAge(svc.metadata.creationTimestamp)];
  });

  const { renderTable } = require('./renderer');
  return ok(renderTable(['NAME', 'ENDPOINTS', 'AGE'], rows), state, false);
}

// ── DESCRIBE ─────────────────────────────────────────────────────────────────

function handleDescribe(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  if (!cmd.name) return err('error: resource name must be specified', state);

  const res = getResource(state, kind, ns, cmd.name);
  if (!res) return err(`Error from server (NotFound): ${kind.toLowerCase()} "${cmd.name}" not found`, state);

  const events = state.events.filter(e =>
    e.involvedObject.kind === kind && e.involvedObject.name === cmd.name && e.involvedObject.namespace === ns
  );

  switch (kind) {
    case 'Pod':        return ok(renderDescribePod(res as Pod, events), state, false);
    case 'Deployment': return ok(renderDescribeDeployment(res as Deployment, events), state, false);
    case 'Service':    return ok(renderDescribeService(res as Service), state, false);
    default:           return ok(renderYaml(res), state, false);
  }
}

// ── CREATE ────────────────────────────────────────────────────────────────────

function handleCreate(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';

  if (kind === 'ServiceAccount' || kind === 'serviceaccount') {
    if (!cmd.name) return err('error: resource name must be specified', state);
    const existing = getResource(state, 'ServiceAccount', ns, cmd.name);
    if (existing) return err(`Error from server (AlreadyExists): serviceaccounts "${cmd.name}" already exists`, state);
    const sa: ServiceAccount = {
      apiVersion: 'v1', kind: 'ServiceAccount',
      metadata: { name: cmd.name, namespace: ns, labels: {}, annotations: {}, creationTimestamp: new Date().toISOString(), uid: Math.random().toString(36).slice(2) },
    };
    setResource(state, sa);
    return ok(`serviceaccount/${cmd.name} created`, state, true);
  }

  if (kind === 'Role') {
    if (!cmd.name) return err('error: resource name must be specified', state);
    const verbsFlag = (cmd.flags['--verb'] ?? '') as string;
    const resourcesFlag = (cmd.flags['--resource'] ?? '') as string;
    const verbs = verbsFlag.split(',').filter(Boolean);
    const resources = resourcesFlag.split(',').filter(Boolean);
    const role: Role = {
      apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'Role',
      metadata: { name: cmd.name, namespace: ns, labels: {}, annotations: {}, creationTimestamp: new Date().toISOString(), uid: Math.random().toString(36).slice(2) },
      rules: [{ apiGroups: [''], resources, verbs }],
    };
    setResource(state, role);
    return ok(`role.rbac.authorization.k8s.io/${cmd.name} created`, state, true);
  }

  if (kind === 'RoleBinding') {
    if (!cmd.name) return err('error: resource name must be specified', state);
    const roleFlag = (cmd.flags['--role'] ?? '') as string;
    const saFlag = (cmd.flags['--serviceaccount'] ?? '') as string;
    const subjects = saFlag ? saFlag.split(',').map(s => {
      const [saNamespace, saName] = s.includes(':') ? s.split(':') : [ns, s];
      return { kind: 'ServiceAccount' as const, name: saName, namespace: saNamespace };
    }) : [];
    const rb: RoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'RoleBinding',
      metadata: { name: cmd.name, namespace: ns, labels: {}, annotations: {}, creationTimestamp: new Date().toISOString(), uid: Math.random().toString(36).slice(2) },
      subjects,
      roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: roleFlag },
    };
    setResource(state, rb);
    return ok(`rolebinding.rbac.authorization.k8s.io/${cmd.name} created`, state, true);
  }

  return err(`error: create not supported for ${kind} via CLI flags in this simulator. Use kubectl apply -f`, state);
}

// ── APPLY ─────────────────────────────────────────────────────────────────────

function handleApply(cmd: ParsedKubectlCommand, _ns: string, state: ClusterState) {
  if (!cmd.applyBody) return err('error: must specify --filename, -f', state);
  try {
    const manifest = JSON.parse(cmd.applyBody) as AnyK8sResource;
    const ns2 = manifest.metadata.namespace || _ns;
    manifest.metadata.namespace = ns2;
    if (!manifest.metadata.creationTimestamp) manifest.metadata.creationTimestamp = new Date().toISOString();
    if (!manifest.metadata.uid) manifest.metadata.uid = Math.random().toString(36).slice(2);
    const existing = getResource(state, manifest.kind, ns2, manifest.metadata.name);
    setResource(state, manifest);
    const verb = existing ? 'configured' : 'created';
    return ok(`${manifest.kind.toLowerCase()}/${manifest.metadata.name} ${verb}`, state, true);
  } catch {
    return err('error: could not parse manifest JSON', state);
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

function handleDelete(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  if (!cmd.name) return err('error: resource name must be specified', state);
  const deleted = deleteResource(state, kind, ns, cmd.name);
  if (!deleted) return err(`Error from server (NotFound): ${kind.toLowerCase()} "${cmd.name}" not found`, state);
  addEvent(state, makeEvent('Normal', 'Killing', `Stopping container ${cmd.name}`, { kind: kind as any, name: cmd.name, namespace: ns }));
  return ok(`${kind.toLowerCase()}/${cmd.name} deleted`, state, true);
}

// ── SCALE ─────────────────────────────────────────────────────────────────────

function handleScale(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  if (!cmd.name) return err('error: resource name must be specified', state);
  const replicasFlag = cmd.flags['--replicas'] as string;
  if (!replicasFlag) return err('error: --replicas flag required', state);
  const replicas = parseInt(replicasFlag, 10);
  if (isNaN(replicas) || replicas < 0) return err('error: --replicas must be a non-negative integer', state);

  if (kind === 'Deployment') {
    const dep = getResource<Deployment>(state, 'Deployment', ns, cmd.name);
    if (!dep) return err(`Error from server (NotFound): deployment "${cmd.name}" not found`, state);
    dep.spec.replicas = replicas;
    dep.status.replicas = replicas;
    dep.status.readyReplicas = replicas;
    dep.status.availableReplicas = replicas;
    dep.status.unavailableReplicas = 0;
    dep.status.conditions = [{ type: 'Available', status: 'True' }];
    setResource(state, dep);
    addEvent(state, makeEvent('Normal', 'ScalingReplicaSet', `Scaled ${kind} "${cmd.name}" to ${replicas}`, { kind: 'Deployment', name: cmd.name, namespace: ns }));
    return ok(`deployment.apps/${cmd.name} scaled`, state, true);
  }
  return err(`error: scaling not supported for ${kind}`, state);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

function handlePatch(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  if (!cmd.name) return err('error: resource name must be specified', state);
  const patchStr = cmd.flags['-p'] ?? cmd.flags['--patch'];
  if (!patchStr || typeof patchStr !== 'string') return err('error: -p flag required with patch body', state);
  const patchType = cmd.flags['--type'] ?? 'strategic';

  const res = getResource<AnyK8sResource>(state, kind, ns, cmd.name);
  if (!res) return err(`Error from server (NotFound): ${kind.toLowerCase()} "${cmd.name}" not found`, state);

  try {
    if (patchType === 'json') {
      const ops = JSON.parse(patchStr) as Array<{ op: string; path: string; value: unknown }>;
      applyJsonPatch(res, ops);
    } else {
      const patch = JSON.parse(patchStr);
      deepMerge(res as unknown, patch as unknown);
    }

    // Recompute pod status if envFrom was changed
    if (kind === 'Pod') {
      recomputePodStatus(res as Pod, state);
    }
    if (kind === 'Ingress') {
      // Nothing special needed
    }

    setResource(state, res);
    return ok(`${kind.toLowerCase()}/${cmd.name} patched`, state, true);
  } catch (e: unknown) {
    return err(`error: ${e instanceof Error ? e.message : 'invalid patch'}`, state);
  }
}

// ── ROLLOUT ───────────────────────────────────────────────────────────────────

function handleRollout(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const sub = cmd.subVerb ?? '';
  const name = cmd.name;

  if (sub === 'restart') {
    if (!name) return err('error: resource name required', state);
    const dep = getResource<Deployment>(state, 'Deployment', ns, name);
    if (!dep) return err(`Error from server (NotFound): deployment "${name}" not found`, state);
    dep.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();
    dep.status.readyReplicas = dep.spec.replicas;
    dep.status.availableReplicas = dep.spec.replicas;
    dep.status.unavailableReplicas = 0;
    setResource(state, dep);
    return ok(`deployment.apps/${name} restarted`, state, true);
  }

  if (sub === 'status') {
    if (!name) return err('error: resource name required', state);
    const dep = getResource<Deployment>(state, 'Deployment', ns, name);
    if (!dep) return err(`Error from server (NotFound): deployment "${name}" not found`, state);
    const ready = dep.status.readyReplicas === dep.spec.replicas;
    return ok(ready
      ? `deployment "${name}" successfully rolled out`
      : `Waiting for deployment "${name}" rollout to finish: ${dep.status.readyReplicas}/${dep.spec.replicas} updated replicas are available...`,
      state, false);
  }

  if (sub === 'undo') {
    if (!name) return err('error: resource name required', state);
    const dep = getResource<Deployment>(state, 'Deployment', ns, name);
    if (!dep) return err(`Error from server (NotFound): deployment "${name}" not found`, state);
    // Simulate rollback: fix the image and mark ready
    const rev = parseInt(dep.metadata.annotations['deployment.kubernetes.io/revision'] ?? '1', 10);
    dep.metadata.annotations['deployment.kubernetes.io/revision'] = String(Math.max(1, rev - 1));
    // Simulate previous stable image
    for (const c of dep.spec.template.spec.containers) {
      if (c.image.includes('broken')) {
        c.image = c.image.replace(/:.*$/, ':stable');
      }
    }
    dep.status.readyReplicas = dep.spec.replicas;
    dep.status.availableReplicas = dep.spec.replicas;
    dep.status.unavailableReplicas = 0;
    dep.status.conditions = [{ type: 'Available', status: 'True' }];
    setResource(state, dep);
    addEvent(state, makeEvent('Normal', 'ScalingReplicaSet', `Rolled back deployment "${name}"`, { kind: 'Deployment', name, namespace: ns }));
    return ok(`deployment.apps/${name} rolled back`, state, true);
  }

  if (sub === 'history') {
    if (!name) return err('error: resource name required', state);
    const dep = getResource<Deployment>(state, 'Deployment', ns, name);
    if (!dep) return err(`Error from server (NotFound): deployment "${name}" not found`, state);
    const rev = parseInt(dep.metadata.annotations['deployment.kubernetes.io/revision'] ?? '1', 10);
    const lines = [`deployment.apps/${name}`, `REVISION  CHANGE-CAUSE`];
    for (let i = Math.max(1, rev - 2); i <= rev; i++) {
      const current = i === rev;
      lines.push(`${i}${current ? '         <current>' : '         <none>'}`);
    }
    return ok(lines.join('\n'), state, false);
  }

  return err(`error: unknown rollout subcommand "${sub}"`, state);
}

// ── SET ───────────────────────────────────────────────────────────────────────

function handleSet(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const sub = cmd.subVerb ?? cmd.resource ?? '';
  if (sub === 'image') {
    const name = cmd.name;
    if (!name) return err('error: resource name required', state);
    const dep = getResource<Deployment>(state, 'Deployment', ns, name);
    if (!dep) return err(`Error from server (NotFound): deployment "${name}" not found`, state);

    // Parse container=image pairs from remaining flags
    // They come as positional args after the resource name
    const imageSpec = Object.entries(cmd.flags).find(([k]) => !k.startsWith('-'));
    if (imageSpec) {
      const [containerName, newImage] = imageSpec[0].includes('=')
        ? imageSpec[0].split('=')
        : [imageSpec[0], imageSpec[1] as string];
      const container = dep.spec.template.spec.containers.find(c => c.name === containerName);
      if (container) {
        container.image = newImage ?? '';
        dep.status.readyReplicas = dep.spec.replicas;
        dep.status.availableReplicas = dep.spec.replicas;
        dep.status.unavailableReplicas = 0;
        dep.status.conditions = [{ type: 'Available', status: 'True' }];
        setResource(state, dep);
        return ok(`deployment.apps/${name} image updated`, state, true);
      }
    }
    return err('error: specify container=image pair', state);
  }
  return err(`error: unknown set subcommand "${sub}"`, state);
}

// ── LABEL ────────────────────────────────────────────────────────────────────

function handleLabel(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  if (!cmd.name) return err('error: resource name required', state);
  const res = getResource<AnyK8sResource>(state, kind, ns, cmd.name);
  if (!res) return err(`Error from server (NotFound): ${kind.toLowerCase()} "${cmd.name}" not found`, state);

  for (const [k, v] of Object.entries(cmd.flags)) {
    if (k.startsWith('-')) continue;
    if (k.includes('=')) {
      const [key, val] = k.split('=');
      res.metadata.labels[key] = val;
    } else if (k.endsWith('-')) {
      delete res.metadata.labels[k.slice(0, -1)];
    }
  }
  setResource(state, res);
  return ok(`${kind.toLowerCase()}/${cmd.name} labeled`, state, true);
}

// ── ANNOTATE ─────────────────────────────────────────────────────────────────

function handleAnnotate(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  if (!cmd.name) return err('error: resource name required', state);
  const res = getResource<AnyK8sResource>(state, kind, ns, cmd.name);
  if (!res) return err(`Error from server (NotFound): ${kind.toLowerCase()} "${cmd.name}" not found`, state);

  for (const [k, v] of Object.entries(cmd.flags)) {
    if (k.startsWith('-')) continue;
    if (k.includes('=')) {
      const [key, val] = k.split('=');
      res.metadata.annotations[key] = val;
    } else {
      // treat flag value as annotation key=value
      if (typeof v === 'string' && v.includes('=')) {
        // key is the flag, v contains key=value
      }
    }
  }

  // Also handle positional key=value in the raw command
  const rawParts = cmd.raw.split(' ');
  for (const part of rawParts) {
    if (part.includes('=') && !part.startsWith('-') && !part.startsWith('kubectl') && !part.startsWith('k ')
      && part !== cmd.resource && part !== cmd.name) {
      const eqIdx = part.indexOf('=');
      const key = part.slice(0, eqIdx);
      const val = part.slice(eqIdx + 1).replace(/['"]/g, '');
      if (key && val && !['kubectl', 'annotate', kind.toLowerCase(), cmd.name].includes(key)) {
        res.metadata.annotations[key] = val;
      }
    }
  }

  setResource(state, res);
  return ok(`${kind.toLowerCase()}/${cmd.name} annotated`, state, true);
}

// ── LOGS ─────────────────────────────────────────────────────────────────────

function handleLogs(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  if (!cmd.name) return err('error: pod name required', state);
  const pod = getResource<Pod>(state, 'Pod', ns, cmd.name);
  if (!pod) return err(`Error from server (NotFound): pods "${cmd.name}" not found`, state);

  if (pod.status.phase === 'CrashLoopBackOff' || pod.status.phase === 'Failed') {
    const msg = pod.status.message ?? 'Error: container failed to start';
    return ok([
      `${new Date().toISOString()} [INFO] Starting container...`,
      `${new Date().toISOString()} [INFO] Loading configuration...`,
      `${new Date().toISOString()} [FATAL] ${msg}`,
    ].join('\n'), state, false);
  }

  return ok([
    `${new Date().toISOString()} [INFO] Container started successfully`,
    `${new Date().toISOString()} [INFO] Listening on port 8080`,
    `${new Date().toISOString()} [INFO] Ready to serve requests`,
  ].join('\n'), state, false);
}

// ── EXEC ──────────────────────────────────────────────────────────────────────

function handleExec(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  if (!cmd.name) return err('error: pod name required', state);
  const pod = getResource<Pod>(state, 'Pod', ns, cmd.name);
  if (!pod) return err(`Error from server (NotFound): pods "${cmd.name}" not found`, state);
  if (pod.status.phase !== 'Running') return err(`error: cannot exec into a pod that is not running (current phase: ${pod.status.phase})`, state);
  return ok('(simulated shell session — exec is read-only in this environment)', state, false);
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

function handleConfig(cmd: ParsedKubectlCommand, _ns: string, state: ClusterState) {
  if (cmd.subVerb === 'set-context') {
    const nsFlag = cmd.flags['--namespace'] as string | undefined;
    if (nsFlag) {
      state.currentNamespace = nsFlag;
      return ok(`Context modified. Namespace set to "${nsFlag}".`, state, false);
    }
  }
  if (cmd.subVerb === 'current-context') {
    return ok('kubequest-classroom', state, false);
  }
  return ok(`Current namespace: ${state.currentNamespace}`, state, false);
}

// ── AUTOSCALE ─────────────────────────────────────────────────────────────────

function handleAutoscale(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  const kind = cmd.resource ?? '';
  if (!cmd.name) return err('error: resource name required', state);
  const dep = getResource<Deployment>(state, 'Deployment', ns, cmd.name);
  if (!dep) return err(`Error from server (NotFound): deployment "${cmd.name}" not found`, state);

  const min = parseInt((cmd.flags['--min'] ?? '1') as string, 10);
  const max = parseInt((cmd.flags['--max'] ?? '10') as string, 10);
  const cpu = parseInt((cmd.flags['--cpu-percent'] ?? '80') as string, 10);

  const hpaName = `${cmd.name}`;
  const hpa: HorizontalPodAutoscaler = {
    apiVersion: 'autoscaling/v1', kind: 'HorizontalPodAutoscaler',
    metadata: { name: hpaName, namespace: ns, labels: {}, annotations: {}, creationTimestamp: new Date().toISOString(), uid: Math.random().toString(36).slice(2) },
    spec: {
      scaleTargetRef: { apiVersion: 'apps/v1', kind: 'Deployment', name: cmd.name },
      minReplicas: min, maxReplicas: max, targetCPUUtilizationPercentage: cpu,
    },
    status: { currentReplicas: dep.spec.replicas, desiredReplicas: dep.spec.replicas },
  };
  setResource(state, hpa);
  return ok(`horizontalpodautoscaler.autoscaling/${hpaName} autoscaled`, state, true);
}

// ── TOP ───────────────────────────────────────────────────────────────────────

function handleTop(cmd: ParsedKubectlCommand, ns: string, state: ClusterState) {
  if (cmd.resource === 'Pod' || cmd.resource === 'pods') {
    const pods = listResources<Pod>(state, 'Pod', ns);
    const rows = pods.map(p => [p.metadata.name, `${Math.floor(Math.random() * 200)}m`, `${Math.floor(Math.random() * 256)}Mi`]);
    const { renderTable } = require('./renderer');
    return ok(renderTable(['NAME', 'CPU(cores)', 'MEMORY(bytes)'], rows), state, false);
  }
  return ok('Metrics not available in simulator', state, false);
}

// ── EXPLAIN ───────────────────────────────────────────────────────────────────

function handleExplain(cmd: ParsedKubectlCommand, state: ClusterState) {
  const kind = cmd.resource ?? '';
  const explanations: Record<string, string> = {
    Pod: 'Pod is a collection of containers that can run on a host. This resource is created by clients and scheduled onto hosts.',
    Deployment: 'Deployment enables declarative updates for Pods and ReplicaSets.',
    Service: 'Service is a named abstraction of software service (for example, mysql) consisting of local port that the proxy listens on.',
    ConfigMap: 'ConfigMap holds configuration data for pods to consume.',
    Secret: 'Secret holds secret data of a certain type. The total bytes of the values in the Data field must be less than MaxSecretSize bytes.',
    HorizontalPodAutoscaler: 'HorizontalPodAutoscaler is the configuration for a horizontal pod autoscaler, which automatically manages the replica count of any resource implementing the scale subresource.',
  };
  return ok(explanations[kind] ?? `Kind: ${kind}\nDescription: Kubernetes resource type`, state, false);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function ok(output: string, state: ClusterState, stateChanged: boolean): { result: CommandResult; newState: ClusterState } {
  return { result: { output, exitCode: 0, stateChanged }, newState: state };
}

function err(output: string, state: ClusterState): { result: CommandResult; newState: ClusterState } {
  return { result: { output, exitCode: 1, stateChanged: false }, newState: state };
}

function renderResourceList(kind: string, resources: AnyK8sResource[], showLabels: boolean): string {
  if (!resources.length) return 'No resources found.';
  switch (kind) {
    case 'Pod':                      return renderPodList(resources as import('@kubequest/shared').Pod[]);
    case 'Deployment':               return renderDeploymentList(resources as import('@kubequest/shared').Deployment[]);
    case 'Service':                  return renderServiceList(resources as import('@kubequest/shared').Service[]);
    case 'ConfigMap':                return renderConfigMapList(resources as import('@kubequest/shared').ConfigMap[]);
    case 'Secret':                   return renderSecretList(resources as import('@kubequest/shared').Secret[]);
    case 'HorizontalPodAutoscaler':  return renderHPAList(resources as import('@kubequest/shared').HorizontalPodAutoscaler[]);
    case 'Ingress':                  return renderIngressList(resources as import('@kubequest/shared').Ingress[]);
    default: {
      const rows = resources.map(r => [r.metadata.name, r.metadata.namespace, getAge(r.metadata.creationTimestamp)]);
      const { renderTable } = require('./renderer');
      return renderTable(['NAME', 'NAMESPACE', 'AGE'], rows);
    }
  }
}

function renderSingleResource(res: AnyK8sResource, format?: string | boolean): string {
  if (format === 'wide') return renderYaml(res);
  return renderYaml(res);
}

function matchSelector(podLabels: Record<string, string>, selector: Record<string, string>): boolean {
  return Object.entries(selector).every(([k, v]) => podLabels[k] === v);
}

function applyJsonPatch(obj: unknown, ops: Array<{ op: string; path: string; value?: unknown }>): void {
  return applyJsonPatchImpl(obj as Record<string, unknown>, ops);
}

function applyJsonPatchImpl(obj: Record<string, unknown>, ops: Array<{ op: string; path: string; value?: unknown }>): void {
  for (const op of ops) {
    const parts = op.path.split('/').filter(Boolean);
    if (op.op === 'add' || op.op === 'replace') {
      let cur: Record<string, unknown> = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const next = cur[part];
        if (Array.isArray(next)) {
          const idx = parseInt(parts[i + 1], 10);
          if (!isNaN(idx)) {
            if (i + 1 === parts.length - 1) {
              next[idx] = op.value;
              break;
            }
            cur = next[idx] as Record<string, unknown>;
            i++;
          }
        } else if (next && typeof next === 'object') {
          cur = next as Record<string, unknown>;
        } else {
          cur[part] = {};
          cur = cur[part] as Record<string, unknown>;
        }
      }
      const lastPart = parts[parts.length - 1];
      if (lastPart !== undefined) {
        const parent = cur[parts[parts.length - 2]] ?? cur;
        if (Array.isArray(parent) && !isNaN(parseInt(lastPart, 10))) {
          (parent as unknown[])[parseInt(lastPart, 10)] = op.value;
        } else {
          cur[lastPart] = op.value;
        }
      }
    } else if (op.op === 'remove') {
      let cur: Record<string, unknown> = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        cur = (cur[parts[i]] ?? {}) as Record<string, unknown>;
      }
      delete cur[parts[parts.length - 1]];
    }
  }
}

function deepMerge(target: unknown, source: unknown): void {
  const t = target as Record<string, unknown>;
  const s = source as Record<string, unknown>;
  return deepMergeImpl(t, s);
}

function deepMergeImpl(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') {
      deepMergeImpl(target[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      target[k] = v;
    }
  }
}

function recomputePodStatus(pod: Pod, _state: ClusterState): void {
  const envFrom = pod.spec.containers[0]?.envFrom ?? [];
  const hasEnv = envFrom.length > 0 || (pod.spec.containers[0]?.env?.length ?? 0) > 0;
  if (hasEnv && (pod.status.phase === 'CrashLoopBackOff' || pod.status.phase === 'Failed')) {
    pod.status.phase = 'Running';
    pod.status.message = undefined;
    pod.status.reason = undefined;
    if (pod.status.containerStatuses) {
      pod.status.containerStatuses[0].ready = true;
      pod.status.containerStatuses[0].state = 'running';
      pod.status.containerStatuses[0].stateReason = undefined;
    }
  }
}

function getAge(timestamp: string): string {
  if (!timestamp) return '<unknown>';
  const ms = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
