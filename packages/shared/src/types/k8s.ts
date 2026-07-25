export type ResourceKind =
  | 'Pod' | 'Deployment' | 'Service' | 'ConfigMap' | 'Secret'
  | 'Namespace' | 'Ingress' | 'ServiceAccount' | 'Role'
  | 'RoleBinding' | 'ClusterRole' | 'ClusterRoleBinding'
  | 'HorizontalPodAutoscaler' | 'PersistentVolumeClaim' | 'Node';

export type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown'
  | 'CrashLoopBackOff' | 'ImagePullBackOff' | 'OOMKilled' | 'Terminating';

export interface K8sMetadata {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  creationTimestamp: string;
  uid: string;
}

export interface K8sResource {
  apiVersion: string;
  kind: ResourceKind;
  metadata: K8sMetadata;
}

export interface ContainerSpec {
  name: string;
  image: string;
  command?: string[];
  args?: string[];
  env?: EnvVar[];
  envFrom?: EnvFromSource[];
  ports?: ContainerPort[];
  resources?: ResourceRequirements;
  readinessProbe?: Probe;
  livenessProbe?: Probe;
  volumeMounts?: VolumeMount[];
}

export interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: {
    configMapKeyRef?: { name: string; key: string };
    secretKeyRef?: { name: string; key: string };
  };
}

export interface EnvFromSource {
  configMapRef?: { name: string };
  secretRef?: { name: string };
}

export interface ContainerPort { containerPort: number; protocol?: 'TCP' | 'UDP' }
export interface ResourceRequirements {
  requests?: { cpu?: string; memory?: string };
  limits?: { cpu?: string; memory?: string };
}
export interface Probe {
  httpGet?: { path: string; port: number };
  tcpSocket?: { port: number };
  exec?: { command: string[] };
  initialDelaySeconds?: number;
  periodSeconds?: number;
  failureThreshold?: number;
}
export interface VolumeMount { name: string; mountPath: string; readOnly?: boolean }

export interface PodStatus {
  phase: PodPhase;
  podIP?: string;
  conditions?: Array<{ type: string; status: 'True' | 'False' | 'Unknown' }>;
  containerStatuses?: ContainerStatus[];
  startTime?: string;
  message?: string;
  reason?: string;
}

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  state: 'running' | 'waiting' | 'terminated';
  stateReason?: string;
  image: string;
}

export interface Volume {
  name: string;
  configMap?: { name: string };
  secret?: { secretName: string };
  emptyDir?: Record<string, never>;
  persistentVolumeClaim?: { claimName: string };
}

export interface Pod extends K8sResource {
  kind: 'Pod';
  spec: {
    containers: ContainerSpec[];
    initContainers?: ContainerSpec[];
    volumes?: Volume[];
    serviceAccountName?: string;
    nodeName?: string;
    restartPolicy?: 'Always' | 'OnFailure' | 'Never';
  };
  status: PodStatus;
}

export interface Deployment extends K8sResource {
  kind: 'Deployment';
  spec: {
    replicas: number;
    selector: { matchLabels: Record<string, string> };
    template: {
      metadata: Pick<K8sMetadata, 'labels' | 'annotations'>;
      spec: Pod['spec'];
    };
    strategy?: {
      type: 'RollingUpdate' | 'Recreate';
      rollingUpdate?: { maxSurge?: string | number; maxUnavailable?: string | number };
    };
  };
  status: {
    replicas: number;
    readyReplicas: number;
    availableReplicas: number;
    unavailableReplicas: number;
    conditions: Array<{ type: string; status: string; message?: string }>;
  };
}

export type ServiceType = 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';

export interface Service extends K8sResource {
  kind: 'Service';
  spec: {
    type: ServiceType;
    selector?: Record<string, string>;
    ports: Array<{ name?: string; port: number; targetPort: number | string; nodePort?: number; protocol?: string }>;
    clusterIP?: string;
    externalIPs?: string[];
  };
  status: { loadBalancer?: { ingress?: Array<{ ip: string }> } };
}

export interface ConfigMap extends K8sResource {
  kind: 'ConfigMap';
  data: Record<string, string>;
  binaryData?: Record<string, string>;
}

export interface Secret extends K8sResource {
  kind: 'Secret';
  type: 'Opaque' | 'kubernetes.io/tls' | 'kubernetes.io/dockerconfigjson' | 'kubernetes.io/service-account-token';
  data: Record<string, string>;
  stringData?: Record<string, string>;
}

export interface PolicyRule {
  apiGroups: string[];
  resources: string[];
  verbs: string[];
  resourceNames?: string[];
}

export interface Role extends K8sResource {
  kind: 'Role';
  rules: PolicyRule[];
}

export interface RoleBinding extends K8sResource {
  kind: 'RoleBinding';
  subjects: Array<{ kind: 'User' | 'Group' | 'ServiceAccount'; name: string; namespace?: string }>;
  roleRef: { apiGroup: string; kind: 'Role' | 'ClusterRole'; name: string };
}

export interface ServiceAccount extends K8sResource {
  kind: 'ServiceAccount';
  secrets?: Array<{ name: string }>;
}

export interface HorizontalPodAutoscaler extends K8sResource {
  kind: 'HorizontalPodAutoscaler';
  spec: {
    scaleTargetRef: { apiVersion: string; kind: string; name: string };
    minReplicas: number;
    maxReplicas: number;
    targetCPUUtilizationPercentage?: number;
  };
  status: {
    currentReplicas: number;
    desiredReplicas: number;
    currentCPUUtilizationPercentage?: number;
  };
}

export interface IngressRule {
  host?: string;
  http: {
    paths: Array<{
      path: string;
      pathType?: string;
      backend: {
        service: { name: string; port: { number: number } };
      };
    }>;
  };
}

export interface Ingress extends K8sResource {
  kind: 'Ingress';
  spec: {
    ingressClassName?: string;
    rules: IngressRule[];
    tls?: Array<{ hosts: string[]; secretName: string }>;
  };
  status: { loadBalancer?: { ingress?: Array<{ ip: string }> } };
}

export type AnyK8sResource =
  | Pod | Deployment | Service | ConfigMap | Secret
  | Role | RoleBinding | ServiceAccount | HorizontalPodAutoscaler | Ingress;

export interface ClusterEvent {
  id: string;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  involvedObject: { kind: ResourceKind; name: string; namespace: string };
  count: number;
  firstTimestamp: string;
  lastTimestamp: string;
}

export interface ClusterState {
  namespaces: string[];
  resources: Record<string, Record<string, AnyK8sResource>>;
  currentNamespace: string;
  events: ClusterEvent[];
}

export type KubectlVerb =
  | 'get' | 'describe' | 'apply' | 'create' | 'delete'
  | 'patch' | 'edit' | 'scale' | 'rollout' | 'logs'
  | 'exec' | 'port-forward' | 'set' | 'label' | 'annotate'
  | 'config' | 'top' | 'explain' | 'autoscale';

export interface ParsedKubectlCommand {
  verb: KubectlVerb;
  resource?: string;
  name?: string;
  namespace?: string;
  flags: Record<string, string | boolean>;
  raw: string;
  subVerb?: string;
  applyBody?: string;
}

export interface CommandResult {
  output: string;
  exitCode: 0 | 1;
  stateChanged: boolean;
  winConditionTriggered?: boolean;
}
