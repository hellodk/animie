import type { Scenario } from '../types/scenario';

export const SCENARIOS: Scenario[] = [
  {
    id: 's01-pod-crashloop',
    slug: 'pod-in-distress',
    name: 'Pod in Distress',
    category: 'pod-management',
    difficulty: 1,
    estimatedMinutes: 5,
    maxPoints: 100,
    description: 'The Acme Corp API server is down. The pod keeps restarting. Find out why and fix it.',
    story: '🚨 **INCIDENT ALERT** — The Acme Corp API is returning 503s. On-call just got paged. The `api-server` pod has been restarting every 30 seconds for the last 5 minutes. Your job: diagnose and fix it **before** the SLA breach timer hits zero.',
    objectives: [
      'Identify why the api-server pod is in CrashLoopBackOff',
      'Fix the misconfiguration causing the crash',
      'Ensure the pod reaches Running status',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'api-server',
              namespace: 'default',
              labels: { app: 'api', version: 'v1' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              uid: 'deploy-s01',
            },
            spec: {
              replicas: 1,
              selector: { matchLabels: { app: 'api' } },
              template: {
                metadata: { labels: { app: 'api' }, annotations: {} },
                spec: {
                  containers: [{
                    name: 'api',
                    image: 'acmecorp/api:latest',
                    ports: [{ containerPort: 8080 }],
                    env: [],
                    envFrom: [],
                  }],
                },
              },
            },
            status: {
              replicas: 1,
              readyReplicas: 0,
              availableReplicas: 0,
              unavailableReplicas: 1,
              conditions: [{ type: 'Available', status: 'False', message: 'Error: missing required environment variable DATABASE_URL' }],
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'api-server',
              namespace: 'default',
              labels: { app: 'api', version: 'v1' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'pod-001',
            },
            spec: {
              containers: [{
                name: 'api',
                image: 'acmecorp/api:latest',
                ports: [{ containerPort: 8080 }],
                env: [],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'api',
                ready: false,
                restartCount: 5,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'acmecorp/api:latest',
              }],
              message: 'Error: missing required environment variable DATABASE_URL',
              reason: 'CrashLoopBackOff',
            },
          },
        },
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'app-config',
              namespace: 'default',
              labels: {},
              annotations: {},
              creationTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              uid: 'cm-001',
            },
            data: {
              DATABASE_URL: 'postgres://db:5432/acme',
              LOG_LEVEL: 'info',
              PORT: '8080',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'pod-running',
      targetNamespace: 'default',
      targetName: 'api-server',
    },
    hints: [
      { id: 'h1', order: 1, text: 'Run `kubectl describe deployment api-server` and look at the Events section. You cannot patch a running pod\'s envFrom — use the Deployment instead.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: 'There is a ConfigMap called `app-config` with the needed values. Use `kubectl set env` on the Deployment to inject the DATABASE_URL.', pointPenalty: 35 },
      { id: 'h3', order: 3, text: 'Run: `kubectl set env deployment/api-server DATABASE_URL=postgres://db:5432/app` then `kubectl rollout status deployment/api-server`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl get pods',
      'kubectl describe deployment api-server',
      'kubectl get configmap app-config -o yaml',
      'kubectl set env deployment/api-server DATABASE_URL=postgres://db:5432/app',
      'kubectl rollout status deployment/api-server',
    ],
    teacherNotes: 'This teaches: deployment describe, events, configmap usage, set env on Deployment (not Pod — pods are immutable). Common beginner mistake is trying to patch a running pod spec.',
    conceptId: 'pod-lifecycle',
  },

  {
    id: 's02-deployment-scaling',
    slug: 'scale-up-or-ship-out',
    name: 'Scale Up or Ship Out',
    category: 'deployment-scaling',
    difficulty: 1,
    estimatedMinutes: 4,
    maxPoints: 100,
    description: 'Black Friday traffic just hit. The frontend has 1 replica and is returning 503s. Scale it up fast.',
    story: '📈 **TRAFFIC SPIKE** — It\'s Black Friday and traffic just 10x\'d. The `frontend` Deployment has only 1 replica. The load balancer is dropping requests. Scale up to **5 replicas** before revenue loss becomes critical.',
    objectives: [
      'Scale the frontend Deployment to 5 replicas',
      'Verify all 5 replicas are Ready',
    ],
    initialClusterState: {
      namespaces: ['production'],
      currentNamespace: 'production',
      resources: [
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'frontend',
              namespace: 'production',
              labels: { app: 'frontend' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              uid: 'deploy-001',
            },
            spec: {
              replicas: 1,
              selector: { matchLabels: { app: 'frontend' } },
              template: {
                metadata: { labels: { app: 'frontend' }, annotations: {} },
                spec: {
                  containers: [{ name: 'frontend', image: 'acmecorp/frontend:v2.0', ports: [{ containerPort: 80 }], env: [], envFrom: [] }],
                },
              },
            },
            status: { replicas: 1, readyReplicas: 1, availableReplicas: 1, unavailableReplicas: 0, conditions: [{ type: 'Available', status: 'True' }] },
          },
        },
      ],
    },
    winCondition: {
      type: 'replica-count',
      targetNamespace: 'production',
      targetName: 'frontend',
      expectedValue: 5,
    },
    hints: [
      { id: 'h1', order: 1, text: '`kubectl scale` can change replicas without editing YAML directly.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: '`kubectl scale deployment/frontend --replicas=5 -n production`', pointPenalty: 35 },
      { id: 'h3', order: 3, text: 'After scaling: `kubectl rollout status deployment/frontend -n production` to verify.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl get deployment frontend -n production',
      'kubectl scale deployment/frontend --replicas=5 -n production',
      'kubectl rollout status deployment/frontend -n production',
    ],
    teacherNotes: 'Teaches kubectl scale, rollout status, and production namespace awareness.',
    conceptId: 'deployment-scale',
  },

  {
    id: 's03-image-update',
    slug: 'wrong-image-wrong-vibes',
    name: 'Wrong Image, Wrong Vibes',
    category: 'deployment-scaling',
    difficulty: 2,
    estimatedMinutes: 6,
    maxPoints: 150,
    description: 'A junior dev deployed the wrong Docker image tag to payment-service. Fix it without downtime.',
    story: '😱 **WRONG DEPLOY** — Someone pushed `myrepo/payment:broken` to production instead of `myrepo/payment:v2.1`. The payment service is returning errors. Use `kubectl set image` to roll out the correct version.',
    objectives: [
      'Update the container image on payment-service Deployment',
      'Set the image to myrepo/payment:v2.1',
      'Confirm rollout completes successfully',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'payment-service',
              namespace: 'default',
              labels: { app: 'payment' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              uid: 'deploy-002',
            },
            spec: {
              replicas: 3,
              selector: { matchLabels: { app: 'payment' } },
              template: {
                metadata: { labels: { app: 'payment' }, annotations: {} },
                spec: {
                  containers: [{ name: 'payment', image: 'myrepo/payment:broken', ports: [{ containerPort: 8080 }], env: [], envFrom: [] }],
                },
              },
            },
            status: {
              replicas: 3, readyReplicas: 0, availableReplicas: 0, unavailableReplicas: 3,
              conditions: [{ type: 'Available', status: 'False', message: 'Deployment does not have minimum availability.' }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'image-set',
      targetNamespace: 'default',
      targetName: 'payment-service',
      expectedValue: 'myrepo/payment:v2.1',
    },
    hints: [
      { id: 'h1', order: 1, text: '`kubectl set image` updates a container image in a running deployment.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: 'Syntax: `kubectl set image deployment/<name> <container>=<image>:<tag>`', pointPenalty: 35 },
      { id: 'h3', order: 3, text: '`kubectl set image deployment/payment-service payment=myrepo/payment:v2.1`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl get deployment payment-service -o yaml',
      'kubectl set image deployment/payment-service payment=myrepo/payment:v2.1',
      'kubectl rollout status deployment/payment-service',
    ],
    teacherNotes: 'Teaches set image, understanding deployment spec.template.spec, rollout status.',
    conceptId: 'image-tag',
  },

  {
    id: 's04-service-networking',
    slug: 'service-not-found',
    name: 'Service Not Found',
    category: 'networking',
    difficulty: 2,
    estimatedMinutes: 7,
    maxPoints: 150,
    description: 'The backend API is running fine but the frontend cannot reach it. The Service selector is broken.',
    story: '🕸️ **NETWORK MYSTERY** — The backend pods are healthy but `kubectl get endpoints api-service` shows `<none>`. Something is wrong with how the Service selects its pods. Hunt down the label mismatch and fix it.',
    objectives: [
      'Diagnose the label mismatch between Service and Pods',
      'Correct the Service selector so traffic routes properly',
      'Verify Endpoints are populated',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'api-pod-abc',
              namespace: 'default',
              labels: { app: 'api', version: 'v2' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              uid: 'pod-002',
            },
            spec: { containers: [{ name: 'api', image: 'acmecorp/api:v2', ports: [{ containerPort: 8080 }], env: [], envFrom: [] }] },
            status: { phase: 'Running', containerStatuses: [{ name: 'api', ready: true, restartCount: 0, state: 'running', image: 'acmecorp/api:v2' }] },
          },
        },
        {
          kind: 'Service',
          spec: {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
              name: 'api-service',
              namespace: 'default',
              labels: { app: 'api' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              uid: 'svc-001',
            },
            spec: {
              type: 'ClusterIP',
              selector: { app: 'api', version: 'v1' },
              ports: [{ port: 80, targetPort: 8080 }],
              clusterIP: '10.96.100.1',
            },
            status: {},
          },
        },
      ],
    },
    winCondition: {
      type: 'service-selector-match',
      targetNamespace: 'default',
      targetName: 'api-service',
    },
    hints: [
      { id: 'h1', order: 1, text: 'Run `kubectl describe service api-service` and look at the Selector and Endpoints fields.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: 'Compare with `kubectl get pods --show-labels` to spot the version mismatch.', pointPenalty: 35 },
      { id: 'h3', order: 3, text: '`kubectl patch service api-service -p \'{"spec":{"selector":{"app":"api","version":"v2"}}}\'`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl get pods --show-labels',
      'kubectl describe service api-service',
      'kubectl patch service api-service -p \'{"spec":{"selector":{"app":"api","version":"v2"}}}\'',
      'kubectl get endpoints api-service',
    ],
    teacherNotes: 'Core networking concept: Service selector vs Pod labels. Endpoints being empty is the diagnostic signal.',
    conceptId: 'service-selector',
  },

  {
    id: 's05-secrets',
    slug: 'secret-agent',
    name: 'Secret Agent',
    category: 'secrets',
    difficulty: 2,
    estimatedMinutes: 7,
    maxPoints: 150,
    description: 'The database pod can\'t find its credentials. Wire up the Secret without hardcoding anything.',
    story: '🔐 **CREDENTIAL CRISIS** — The `db-pod` keeps crashing because it cannot find its database credentials. A Secret named `db-credentials` exists with the right values. Mount it as environment variables — without hardcoding anything in the pod spec.',
    objectives: [
      'Inspect the db-credentials Secret to understand its keys',
      'Mount the Secret as environment variables in db-pod',
      'Ensure the pod reaches Running status',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'Secret',
          spec: {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
              name: 'db-credentials',
              namespace: 'default',
              labels: {},
              annotations: {},
              creationTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              uid: 'secret-001',
            },
            type: 'Opaque',
            data: {
              DB_USER: 'YWRtaW4=',
              DB_PASS: 'c3VwZXJzZWNyZXQ=',
              DB_HOST: 'cG9zdGdyZXM6NTQzMg==',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'db-pod',
              namespace: 'default',
              labels: { app: 'database' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'pod-003',
            },
            spec: {
              containers: [{
                name: 'postgres',
                image: 'postgres:15',
                ports: [{ containerPort: 5432 }],
                env: [],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{ name: 'postgres', ready: false, restartCount: 3, state: 'waiting', stateReason: 'CrashLoopBackOff', image: 'postgres:15' }],
              message: 'Error: POSTGRES_PASSWORD environment variable not set',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'secret-mounted',
      targetNamespace: 'default',
      targetName: 'db-pod',
      expectedValue: 'db-credentials',
    },
    hints: [
      { id: 'h1', order: 1, text: 'Run `kubectl get secret db-credentials -o yaml` to see the keys.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: 'Use `envFrom` with `secretRef` to load all keys from a Secret as env vars.', pointPenalty: 35 },
      { id: 'h3', order: 3, text: '`kubectl patch pod db-pod --type=json -p \'[{"op":"add","path":"/spec/containers/0/envFrom","value":[{"secretRef":{"name":"db-credentials"}}]}]\'`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl get secret db-credentials -o yaml',
      'kubectl describe pod db-pod',
      'kubectl patch pod db-pod --type=json -p \'[{"op":"add","path":"/spec/containers/0/envFrom","value":[{"secretRef":{"name":"db-credentials"}}]}]\'',
    ],
    teacherNotes: 'Teaches Secrets vs ConfigMaps, base64 encoding, envFrom.secretRef pattern.',
    conceptId: 'secret-injection',
  },

  {
    id: 's06-rbac-basic',
    slug: 'namespace-lockdown',
    name: 'Namespace Lockdown',
    category: 'rbac',
    difficulty: 3,
    estimatedMinutes: 10,
    maxPoints: 200,
    description: 'A CI/CD pipeline needs read-only pod access. Create a ServiceAccount, Role, and RoleBinding.',
    story: '🔒 **RBAC CHALLENGE** — The new CI/CD pipeline needs to list pods in the `staging` namespace for health checks — but nothing else. Set up proper RBAC: a ServiceAccount `ci-runner`, a Role `pod-reader`, and bind them together.',
    objectives: [
      'Create ServiceAccount "ci-runner" in namespace "staging"',
      'Create Role "pod-reader" that allows get, list, watch on pods',
      'Create RoleBinding "ci-pod-reader" binding ci-runner to pod-reader',
    ],
    initialClusterState: {
      namespaces: ['default', 'staging'],
      currentNamespace: 'staging',
      resources: [],
    },
    winCondition: {
      type: 'rbac-binding-exists',
      targetNamespace: 'staging',
      targetName: 'ci-pod-reader',
    },
    hints: [
      { id: 'h1', order: 1, text: 'You need three separate resources: ServiceAccount, Role, and RoleBinding.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: '`kubectl create serviceaccount ci-runner -n staging` and `kubectl create role pod-reader --verb=get,list,watch --resource=pods -n staging`', pointPenalty: 35 },
      { id: 'h3', order: 3, text: '`kubectl create rolebinding ci-pod-reader --role=pod-reader --serviceaccount=staging:ci-runner -n staging`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl create serviceaccount ci-runner -n staging',
      'kubectl create role pod-reader --verb=get,list,watch --resource=pods -n staging',
      'kubectl create rolebinding ci-pod-reader --role=pod-reader --serviceaccount=staging:ci-runner -n staging',
      'kubectl get rolebinding ci-pod-reader -n staging -o yaml',
    ],
    teacherNotes: 'Core RBAC trinity: SA + Role + RoleBinding. Note namespace scoping for the SA reference in the binding.',
    conceptId: 'rbac-flow',
  },

  {
    id: 's07-hpa',
    slug: 'autoscale-or-bust',
    name: 'Autoscale or Bust',
    category: 'deployment-scaling',
    difficulty: 2,
    estimatedMinutes: 10,
    maxPoints: 200,
    description: 'Configure a HorizontalPodAutoscaler for the worker deployment.',
    story: '⚙️ **AUTOSCALING REQUIRED** — The ops team is exhausted from manually scaling the `worker` deployment during peak hours. Set up an HPA to automatically scale between 2 and 10 replicas based on CPU utilisation (target: 70%).',
    objectives: [
      'Verify the worker Deployment has CPU resource requests set',
      'Create an HPA targeting worker with minReplicas=2, maxReplicas=10, targetCPU=70%',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'worker',
              namespace: 'default',
              labels: { app: 'worker' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              uid: 'deploy-003',
            },
            spec: {
              replicas: 2,
              selector: { matchLabels: { app: 'worker' } },
              template: {
                metadata: { labels: { app: 'worker' }, annotations: {} },
                spec: {
                  containers: [{
                    name: 'worker',
                    image: 'acmecorp/worker:latest',
                    env: [],
                    envFrom: [],
                    resources: { requests: { cpu: '200m', memory: '256Mi' }, limits: { cpu: '500m', memory: '512Mi' } },
                  }],
                },
              },
            },
            status: { replicas: 2, readyReplicas: 2, availableReplicas: 2, unavailableReplicas: 0, conditions: [{ type: 'Available', status: 'True' }] },
          },
        },
      ],
    },
    winCondition: {
      type: 'hpa-configured',
      targetNamespace: 'default',
      targetName: 'worker',
    },
    hints: [
      { id: 'h1', order: 1, text: '`kubectl autoscale` is the shortcut for creating an HPA resource.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: '`kubectl autoscale deployment worker --min=2 --max=10 --cpu-percent=70`', pointPenalty: 35 },
      { id: 'h3', order: 3, text: 'Verify with: `kubectl get hpa` and `kubectl describe hpa worker`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl get deployment worker',
      'kubectl autoscale deployment worker --min=2 --max=10 --cpu-percent=70',
      'kubectl get hpa',
      'kubectl describe hpa worker',
    ],
    teacherNotes: 'HPA requires resource requests. Good moment to discuss metrics-server and HPA v2 API.',
    conceptId: 'hpa-scaling',
  },

  {
    id: 's08-ingress',
    slug: 'the-ghost-ingress',
    name: 'The Ghost Ingress',
    category: 'networking',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: 'Traffic to app.example.com returns 404. The Ingress points to a renamed Service.',
    story: '👻 **GHOST ROUTE** — `app.example.com` is returning 404. The Ingress exists and the Service exists, but they\'re not connected. The Service was renamed from `web-service` to `frontend-service` and nobody updated the Ingress. Fix it.',
    objectives: [
      'Locate the broken Ingress backend reference',
      'Patch the Ingress to point to frontend-service:80',
      'Verify the backend is correctly configured',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'Service',
          spec: {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
              name: 'frontend-service',
              namespace: 'default',
              labels: { app: 'frontend' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
              uid: 'svc-002',
            },
            spec: {
              type: 'ClusterIP',
              selector: { app: 'frontend' },
              ports: [{ port: 80, targetPort: 8080 }],
              clusterIP: '10.96.100.2',
            },
            status: {},
          },
        },
        {
          kind: 'Ingress',
          spec: {
            apiVersion: 'networking.k8s.io/v1',
            kind: 'Ingress',
            metadata: {
              name: 'app-ingress',
              namespace: 'default',
              labels: {},
              annotations: { 'kubernetes.io/ingress.class': 'nginx' },
              creationTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              uid: 'ingress-001',
            },
            spec: {
              rules: [{
                host: 'app.example.com',
                http: {
                  paths: [{
                    path: '/',
                    pathType: 'Prefix',
                    backend: { service: { name: 'web-service', port: { number: 80 } } },
                  }],
                },
              }],
            },
            status: {},
          },
        },
      ],
    },
    winCondition: {
      type: 'ingress-backend',
      targetNamespace: 'default',
      targetName: 'app-ingress',
      expectedValue: 'frontend-service',
    },
    hints: [
      { id: 'h1', order: 1, text: 'Run `kubectl describe ingress app-ingress` and compare the backend service name with `kubectl get services`.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: 'The Ingress references `web-service` but only `frontend-service` exists.', pointPenalty: 35 },
      { id: 'h3', order: 3, text: '`kubectl patch ingress app-ingress --type=json -p \'[{"op":"replace","path":"/spec/rules/0/http/paths/0/backend/service/name","value":"frontend-service"}]\'`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl get ingress',
      'kubectl describe ingress app-ingress',
      'kubectl get services',
      'kubectl patch ingress app-ingress --type=json -p \'[{"op":"replace","path":"/spec/rules/0/http/paths/0/backend/service/name","value":"frontend-service"}]\'',
    ],
    teacherNotes: 'Ingress-to-Service wiring. Good discussion: why Ingress 404 vs 502 matters for debugging.',
    conceptId: 'ingress-routing',
  },

  {
    id: 's09-rollout-undo',
    slug: 'rollback-to-safety',
    name: 'Rollback to Safety',
    category: 'debugging',
    difficulty: 4,
    estimatedMinutes: 12,
    maxPoints: 250,
    description: 'A broken production deploy spiked error rates to 90%. Roll back immediately and document it.',
    story: '🔥 **PRODUCTION IS ON FIRE** — The `checkout` deployment was just updated to `v3-broken` and error rates spiked to 90%. You have 2 minutes to roll back to the previous version AND annotate the deployment with `kubernetes.io/change-cause: "emergency rollback"` for the audit trail.',
    objectives: [
      'Roll back the checkout Deployment to the previous revision',
      'Annotate the Deployment: kubernetes.io/change-cause="emergency rollback"',
      'Confirm all replicas are Ready',
    ],
    initialClusterState: {
      namespaces: ['production'],
      currentNamespace: 'production',
      resources: [
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'checkout',
              namespace: 'production',
              labels: { app: 'checkout' },
              annotations: { 'deployment.kubernetes.io/revision': '3' },
              creationTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              uid: 'deploy-004',
            },
            spec: {
              replicas: 4,
              selector: { matchLabels: { app: 'checkout' } },
              template: {
                metadata: { labels: { app: 'checkout' }, annotations: {} },
                spec: {
                  containers: [{ name: 'checkout', image: 'myrepo/checkout:v3-broken', ports: [{ containerPort: 8080 }], env: [], envFrom: [] }],
                },
              },
            },
            status: {
              replicas: 4, readyReplicas: 0, availableReplicas: 0, unavailableReplicas: 4,
              conditions: [{ type: 'Available', status: 'False', message: 'Deployment does not have minimum availability.' }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'all',
      all: [
        { type: 'deployment-ready', targetNamespace: 'production', targetName: 'checkout' },
        // Note: field is named expectedLabels but applies to annotations — historical naming
        { type: 'annotation-set', targetNamespace: 'production', targetName: 'checkout', targetKind: 'Deployment', expectedLabels: { 'kubernetes.io/change-cause': 'emergency rollback' } },
      ],
    },
    hints: [
      { id: 'h1', order: 1, text: '`kubectl rollout history deployment/checkout -n production` shows past revisions.', pointPenalty: 20 },
      { id: 'h2', order: 2, text: '`kubectl rollout undo deployment/checkout -n production` rolls back to revision N-1.', pointPenalty: 35 },
      { id: 'h3', order: 3, text: 'After rollback: `kubectl annotate deployment/checkout kubernetes.io/change-cause="emergency rollback" -n production`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'kubectl rollout history deployment/checkout -n production',
      'kubectl rollout undo deployment/checkout -n production',
      'kubectl rollout status deployment/checkout -n production',
      'kubectl annotate deployment/checkout kubernetes.io/change-cause="emergency rollback" -n production',
    ],
    teacherNotes: 'Rollout history, undo, and audit annotations. Discuss change-cause as an operational best practice.',
    conceptId: 'rollback-history',
  },
];

export const SCENARIO_MAP = Object.fromEntries(SCENARIOS.map(s => [s.id, s]));
