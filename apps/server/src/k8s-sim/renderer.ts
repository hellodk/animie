import type { AnyK8sResource, ClusterEvent, Pod, Deployment, Service, ConfigMap, Secret, HorizontalPodAutoscaler, Ingress, Role, RoleBinding, ServiceAccount } from '@kubequest/shared';

export function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length))
  );
  const header = headers.map((h, i) => h.padEnd(widths[i])).join('   ');
  const lines = rows.map(r => r.map((c, i) => (c ?? '').padEnd(widths[i])).join('   '));
  return [header, ...lines].join('\n');
}

export function renderPodList(pods: Pod[]): string {
  if (!pods.length) return 'No resources found.';
  const rows = pods.map(p => {
    const cs = p.status.containerStatuses?.[0];
    const ready = cs ? (cs.ready ? '1/1' : '0/1') : '0/1';
    const restarts = cs?.restartCount ?? 0;
    const age = getAge(p.metadata.creationTimestamp);
    return [p.metadata.name, ready, p.status.phase, String(restarts), age];
  });
  return renderTable(['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'], rows);
}

export function renderDeploymentList(deployments: Deployment[]): string {
  if (!deployments.length) return 'No resources found.';
  const rows = deployments.map(d => {
    const ready = `${d.status.readyReplicas}/${d.spec.replicas}`;
    const age = getAge(d.metadata.creationTimestamp);
    return [d.metadata.name, ready, String(d.spec.replicas), String(d.status.availableReplicas), age];
  });
  return renderTable(['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'AGE'], rows);
}

export function renderServiceList(services: Service[]): string {
  if (!services.length) return 'No resources found.';
  const rows = services.map(s => {
    const ports = s.spec.ports.map(p => `${p.port}/${p.protocol ?? 'TCP'}`).join(',');
    const age = getAge(s.metadata.creationTimestamp);
    return [s.metadata.name, s.spec.type, s.spec.clusterIP ?? '<none>', '<none>', ports, age];
  });
  return renderTable(['NAME', 'TYPE', 'CLUSTER-IP', 'EXTERNAL-IP', 'PORT(S)', 'AGE'], rows);
}

export function renderConfigMapList(cms: ConfigMap[]): string {
  if (!cms.length) return 'No resources found.';
  const rows = cms.map(c => [c.metadata.name, String(Object.keys(c.data ?? {}).length), getAge(c.metadata.creationTimestamp)]);
  return renderTable(['NAME', 'DATA', 'AGE'], rows);
}

export function renderSecretList(secrets: Secret[]): string {
  if (!secrets.length) return 'No resources found.';
  const rows = secrets.map(s => [s.metadata.name, s.type, String(Object.keys(s.data ?? {}).length), getAge(s.metadata.creationTimestamp)]);
  return renderTable(['NAME', 'TYPE', 'DATA', 'AGE'], rows);
}

export function renderHPAList(hpas: HorizontalPodAutoscaler[]): string {
  if (!hpas.length) return 'No resources found.';
  const rows = hpas.map(h => [
    h.metadata.name,
    `${h.spec.scaleTargetRef.kind}/${h.spec.scaleTargetRef.name}`,
    h.spec.targetCPUUtilizationPercentage ? `${h.spec.targetCPUUtilizationPercentage}%` : '<unknown>',
    h.status.currentCPUUtilizationPercentage ? `${h.status.currentCPUUtilizationPercentage}%` : '<unknown>',
    String(h.spec.minReplicas),
    String(h.spec.maxReplicas),
    String(h.status.currentReplicas),
    getAge(h.metadata.creationTimestamp),
  ]);
  return renderTable(['NAME', 'REFERENCE', 'TARGETS', 'MINPODS', 'MAXPODS', 'REPLICAS', 'AGE'], rows);
}

export function renderIngressList(ingresses: Ingress[]): string {
  if (!ingresses.length) return 'No resources found.';
  const rows = ingresses.map(ing => {
    const hosts = ing.spec.rules.map(r => r.host ?? '*').join(',');
    const backend = ing.spec.rules[0]?.http.paths[0]?.backend.service.name ?? '<none>';
    return [ing.metadata.name, '<none>', hosts, `${backend}:80`, '*', getAge(ing.metadata.creationTimestamp)];
  });
  return renderTable(['NAME', 'CLASS', 'HOSTS', 'ADDRESS', 'PORTS', 'AGE'], rows);
}

export function renderDescribePod(pod: Pod, events: ClusterEvent[]): string {
  const lines: string[] = [
    `Name:         ${pod.metadata.name}`,
    `Namespace:    ${pod.metadata.namespace}`,
    `Labels:       ${formatLabels(pod.metadata.labels)}`,
    `Annotations:  ${formatLabels(pod.metadata.annotations)}`,
    `Status:       ${pod.status.phase}`,
    `IP:           ${pod.status.podIP ?? '<none>'}`,
    `Node:         ${pod.spec.nodeName ?? '<none>'}`,
    '',
    'Containers:',
  ];

  for (const c of pod.spec.containers) {
    const cs = pod.status.containerStatuses?.find(s => s.name === c.name);
    lines.push(`  ${c.name}:`);
    lines.push(`    Image:       ${c.image}`);
    lines.push(`    Ready:       ${cs?.ready ?? false}`);
    lines.push(`    Restart Count: ${cs?.restartCount ?? 0}`);
    if (c.env?.length) {
      lines.push(`    Environment:`);
      for (const e of c.env) {
        lines.push(`      ${e.name}: ${e.value ?? '(from ref)'}`);
      }
    }
    if (c.envFrom?.length) {
      lines.push(`    Environment From:`);
      for (const ef of c.envFrom) {
        if (ef.configMapRef) lines.push(`      ${ef.configMapRef.name}\tConfigMap`);
        if (ef.secretRef) lines.push(`      ${ef.secretRef.name}\tSecret`);
      }
    }
  }

  if (pod.status.message) {
    lines.push('');
    lines.push(`Message:      ${pod.status.message}`);
  }

  lines.push('');
  lines.push('Events:');
  if (!events.length) {
    lines.push('  <none>');
  } else {
    lines.push('  Type     Reason    Age     From     Message');
    lines.push('  ----     ------    ---     ----     -------');
    for (const ev of events) {
      lines.push(`  ${ev.type.padEnd(8)} ${ev.reason.padEnd(10)} ${getAge(ev.lastTimestamp).padEnd(8)} kubelet  ${ev.message}`);
    }
  }

  return lines.join('\n');
}

export function renderDescribeDeployment(dep: Deployment, events: ClusterEvent[]): string {
  const lines: string[] = [
    `Name:               ${dep.metadata.name}`,
    `Namespace:          ${dep.metadata.namespace}`,
    `Labels:             ${formatLabels(dep.metadata.labels)}`,
    `Replicas:           ${dep.status.readyReplicas} available / ${dep.spec.replicas} desired`,
    `StrategyType:       ${dep.spec.strategy?.type ?? 'RollingUpdate'}`,
    '',
    'Pod Template:',
    `  Labels: ${formatLabels(dep.spec.template.metadata.labels)}`,
    `  Containers:`,
  ];
  for (const c of dep.spec.template.spec.containers) {
    lines.push(`    ${c.name}:`);
    lines.push(`      Image: ${c.image}`);
    if (c.resources?.requests) {
      lines.push(`      Requests: cpu=${c.resources.requests.cpu ?? '0'}, memory=${c.resources.requests.memory ?? '0'}`);
    }
  }
  lines.push('');
  lines.push('Conditions:');
  for (const cond of dep.status.conditions) {
    lines.push(`  ${cond.type.padEnd(20)} ${cond.status.padEnd(8)} ${cond.message ?? ''}`);
  }
  lines.push('');
  lines.push('Events:');
  if (!events.length) lines.push('  <none>');
  else for (const ev of events) lines.push(`  ${ev.type.padEnd(8)} ${ev.reason.padEnd(12)} ${ev.message}`);
  return lines.join('\n');
}

export function renderDescribeService(svc: Service): string {
  return [
    `Name:              ${svc.metadata.name}`,
    `Namespace:         ${svc.metadata.namespace}`,
    `Labels:            ${formatLabels(svc.metadata.labels)}`,
    `Type:              ${svc.spec.type}`,
    `IP:                ${svc.spec.clusterIP ?? '<none>'}`,
    `Selector:          ${formatLabels(svc.spec.selector ?? {})}`,
    `Port:              ${svc.spec.ports.map(p => `${p.port}/${p.protocol ?? 'TCP'}`).join(', ')}`,
    `TargetPort:        ${svc.spec.ports.map(p => `${p.targetPort}`).join(', ')}`,
    `Endpoints:         (computed dynamically)`,
  ].join('\n');
}

export function renderYaml(resource: AnyK8sResource): string {
  return JSON.stringify(resource, null, 2)
    .replace(/^/gm, '')
    .replace(/"([^"]+)":/g, '$1:');
}

function formatLabels(labels: Record<string, string>): string {
  const entries = Object.entries(labels ?? {});
  if (!entries.length) return '<none>';
  return entries.map(([k, v]) => `${k}=${v}`).join(',');
}

function getAge(timestamp: string): string {
  if (!timestamp) return '<unknown>';
  const ms = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
