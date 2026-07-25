import type { ParsedKubectlCommand, KubectlVerb } from '@kubequest/shared';

const KIND_ALIASES: Record<string, string> = {
  po: 'Pod', pod: 'Pod', pods: 'Pod',
  deploy: 'Deployment', deployment: 'Deployment', deployments: 'Deployment',
  svc: 'Service', service: 'Service', services: 'Service',
  cm: 'ConfigMap', configmap: 'ConfigMap', configmaps: 'ConfigMap',
  secret: 'Secret', secrets: 'Secret',
  ns: 'Namespace', namespace: 'Namespace', namespaces: 'Namespace',
  ing: 'Ingress', ingress: 'Ingress', ingresses: 'Ingress',
  sa: 'ServiceAccount', serviceaccount: 'ServiceAccount', serviceaccounts: 'ServiceAccount',
  role: 'Role', roles: 'Role',
  rolebinding: 'RoleBinding', rolebindings: 'RoleBinding',
  hpa: 'HorizontalPodAutoscaler', horizontalpodautoscaler: 'HorizontalPodAutoscaler',
  pvc: 'PersistentVolumeClaim', persistentvolumeclaim: 'PersistentVolumeClaim',
  node: 'Node', nodes: 'Node',
  ep: 'Endpoints', endpoint: 'Endpoints', endpoints: 'Endpoints',
  ev: 'Event', event: 'Event', events: 'Event',
};

const VERBS_WITH_SUBVERB: Set<string> = new Set(['rollout', 'config', 'auth', 'certificate', 'debug']);

export function parseKubectl(raw: string): ParsedKubectlCommand | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Tokenize respecting quoted strings
  const tokens = tokenize(trimmed);
  if (!tokens.length) return null;

  // Strip leading 'kubectl' or 'k'
  let idx = 0;
  if (tokens[idx] === 'kubectl' || tokens[idx] === 'k') idx++;
  if (idx >= tokens.length) return null;

  const flags: Record<string, string | boolean> = {};
  let namespace: string | undefined;

  // Pull global flags that can appear before the verb
  while (idx < tokens.length && tokens[idx].startsWith('-')) {
    idx = consumeFlag(tokens, idx, flags);
    if (flags['-n']) { namespace = flags['-n'] as string; delete flags['-n']; }
    if (flags['--namespace']) { namespace = flags['--namespace'] as string; delete flags['--namespace']; }
  }

  if (idx >= tokens.length) return null;

  const verbRaw = tokens[idx++] as KubectlVerb;
  const verb: KubectlVerb = verbRaw;

  let subVerb: string | undefined;
  if (VERBS_WITH_SUBVERB.has(verbRaw) && idx < tokens.length && !tokens[idx].startsWith('-')) {
    subVerb = tokens[idx++];
  }

  // Parse resource type and optional name
  let resource: string | undefined;
  let name: string | undefined;

  if (idx < tokens.length && !tokens[idx].startsWith('-')) {
    const resourceToken = tokens[idx++];
    if (resourceToken.includes('/')) {
      const [rt, rn] = resourceToken.split('/');
      resource = normalizeKind(rt);
      name = rn;
    } else {
      resource = normalizeKind(resourceToken);
      // Next token might be the name
      if (idx < tokens.length && !tokens[idx].startsWith('-') && !isKnownKind(tokens[idx])) {
        name = tokens[idx++];
      }
    }
  }

  // Parse remaining flags
  while (idx < tokens.length) {
    idx = consumeFlag(tokens, idx, flags);
    if (flags['-n']) { namespace = flags['-n'] as string; delete flags['-n']; }
    if (flags['--namespace']) { namespace = flags['--namespace'] as string; delete flags['--namespace']; }
  }

  return { verb, subVerb, resource, name, namespace, flags, raw };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuote) {
      if (ch === inQuote) { inQuote = null; }
      else { current += ch; }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ' ' || ch === '\t') {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

function consumeFlag(tokens: string[], idx: number, flags: Record<string, string | boolean>): number {
  const token = tokens[idx];
  if (token.includes('=')) {
    const eqIdx = token.indexOf('=');
    flags[token.slice(0, eqIdx)] = token.slice(eqIdx + 1);
    return idx + 1;
  }
  // Boolean flag or flag with next-token value
  const nextToken = tokens[idx + 1];
  if (nextToken && !nextToken.startsWith('-')) {
    // Heuristic: single-char flags or known value flags take next token
    if (token === '-n' || token === '--namespace' || token === '-o' || token === '--output'
      || token === '-p' || token === '--patch' || token === '--replicas'
      || token === '--type' || token === '--field-selector' || token === '--selector'
      || token === '-l' || token === '--min' || token === '--max'
      || token === '--cpu-percent' || token === '--image' || token === '-c'
      || token === '--from-revision' || token === '--to-revision') {
      flags[token] = nextToken;
      return idx + 2;
    }
  }
  flags[token] = true;
  return idx + 1;
}

function normalizeKind(raw: string): string {
  return KIND_ALIASES[raw.toLowerCase()] ?? raw;
}

function isKnownKind(token: string): boolean {
  return token.toLowerCase() in KIND_ALIASES;
}
