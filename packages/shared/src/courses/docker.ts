import type { Course } from '../types/course';
import type { Character } from '../types/game';
import type { Scenario } from '../types/scenario';

const dockerScenarios: Scenario[] = [
  {
    id: 'docker-s01-container-wont-start',
    slug: 'container-wont-start',
    name: 'Container Won\'t Start',
    category: 'pod-management',
    difficulty: 1,
    estimatedMinutes: 5,
    maxPoints: 100,
    description: 'A service container exits immediately on startup. Find why.',
    story: '🚨 **CONTAINER CRISIS** — The `web-app` container exits immediately with code 1. The service is down. Inspect the container, find the missing environment variable, and get it running.',
    objectives: [
      'Inspect the web-app container to find the crash reason',
      'Identify the missing DATABASE_URL environment variable',
      'Run the container with the correct environment variable set',
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
              name: 'web-app',
              namespace: 'default',
              labels: { app: 'web-app' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'docker-pod-001',
            },
            spec: {
              containers: [{
                name: 'web-app',
                image: 'web-app:latest',
                ports: [{ containerPort: 8080 }],
                env: [],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'web-app',
                ready: false,
                restartCount: 3,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'web-app:latest',
              }],
              message: 'Error: missing required environment variable DATABASE_URL',
              reason: 'CrashLoopBackOff',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'pod-running',
      targetNamespace: 'default',
      targetName: 'web-app',
    },
    hints: [
      { id: 'dh1-1', order: 1, text: 'Run `docker inspect web-app` to see the container\'s exit code and error message.', pointPenalty: 20 },
      { id: 'dh1-2', order: 2, text: 'The container needs a DATABASE_URL environment variable. Use `-e` to pass env vars to `docker run`.', pointPenalty: 35 },
      { id: 'dh1-3', order: 3, text: 'Run: `docker run -e DATABASE_URL=postgres://db:5432/app web-app`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'docker inspect web-app',
      'docker run -e DATABASE_URL=postgres://db:5432/app web-app',
    ],
    teacherNotes: 'Teaches: docker inspect, environment variables with -e flag. Common mistake: forgetting required env vars.',
  },

  {
    id: 'docker-s02-image-not-found',
    slug: 'image-not-found',
    name: 'Image Not Found',
    category: 'deployment-scaling',
    difficulty: 1,
    estimatedMinutes: 5,
    maxPoints: 100,
    description: 'Deployment fails — the image tag doesn\'t exist in the registry.',
    story: '😱 **WRONG TAG** — The deployment is failing because `myapp:latest` doesn\'t exist in the registry. Only `myapp:v1.2.3` is available. Pull the correct tag and run the container.',
    objectives: [
      'Check which image tags are available',
      'Pull the correct image tag myapp:v1.2.3',
      'Run a container using the correct image tag',
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
              name: 'myapp',
              namespace: 'default',
              labels: { app: 'myapp' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'docker-pod-002',
            },
            spec: {
              containers: [{
                name: 'myapp',
                image: 'myapp:latest',
                ports: [{ containerPort: 3000 }],
                env: [],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'myapp',
                ready: false,
                restartCount: 0,
                state: 'waiting',
                stateReason: 'ImagePullBackOff',
                image: 'myapp:latest',
              }],
              message: 'Error: manifest for myapp:latest not found: manifest unknown',
              reason: 'ImagePullBackOff',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'pod-running',
      targetNamespace: 'default',
      targetName: 'myapp',
    },
    hints: [
      { id: 'dh2-1', order: 1, text: 'Use `docker images` to list locally available images and tags.', pointPenalty: 20 },
      { id: 'dh2-2', order: 2, text: '`docker pull myapp:v1.2.3` fetches the correct tag from the registry.', pointPenalty: 35 },
      { id: 'dh2-3', order: 3, text: 'Run the container: `docker run -d --name myapp myapp:v1.2.3`', pointPenalty: 50 },
    ],
    solutionCommands: [
      'docker images',
      'docker pull myapp:v1.2.3',
      'docker run -d --name myapp myapp:v1.2.3',
    ],
    teacherNotes: 'Teaches: docker images, docker pull, image tagging best practices. Discuss why "latest" is dangerous.',
  },

  {
    id: 'docker-s03-port-conflict',
    slug: 'port-already-in-use',
    name: 'Port Already in Use',
    category: 'networking',
    difficulty: 2,
    estimatedMinutes: 7,
    maxPoints: 150,
    description: 'Container starts but the app isn\'t reachable. Host port 8080 is bound to something else.',
    story: '🕸️ **PORT CONFLICT** — The container starts fine but the app is unreachable. Another process is already using host port 8080. Remap the container to host port 8081 so traffic can reach it.',
    objectives: [
      'Diagnose the port conflict on host port 8080',
      'Stop or remove the conflicting container',
      'Run the container mapped to host port 8081 instead',
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
              name: 'webapp-conflict',
              namespace: 'default',
              labels: { app: 'webapp', port: '8080' },
              annotations: { port_binding: 'conflict' },
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'docker-pod-003',
            },
            spec: {
              containers: [{
                name: 'webapp',
                image: 'nginx:alpine',
                ports: [{ containerPort: 80 }],
                env: [],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'webapp',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'nginx:alpine',
              }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'default',
      targetName: 'webapp-conflict',
      targetKind: 'Pod',
      expectedLabels: { port_binding: 'resolved' },
    },
    hints: [
      { id: 'dh3-1', order: 1, text: 'Use `docker ps` to see running containers and their port mappings.', pointPenalty: 20 },
      { id: 'dh3-2', order: 2, text: 'Stop the conflicting container: `docker stop <container-id>`, then re-run with a different host port.', pointPenalty: 35 },
      { id: 'dh3-3', order: 3, text: 'Map port 8081 on the host to port 80 in the container: `docker run -d -p 8081:80 nginx:alpine`. Then run `docker annotate webapp-conflict port_binding=resolved` to confirm.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'docker ps',
      'docker stop webapp-conflict',
      'docker run -d -p 8081:80 --name webapp nginx:alpine',
      'docker annotate webapp-conflict port_binding=resolved',
    ],
    teacherNotes: 'Teaches: docker ps, port binding with -p, resolving host port conflicts.',
  },

  {
    id: 'docker-s04-write-dockerfile',
    slug: 'write-a-dockerfile',
    name: 'Write a Dockerfile',
    category: 'docker-fundamentals',
    difficulty: 2,
    estimatedMinutes: 10,
    maxPoints: 150,
    description: 'A Node.js app has no Dockerfile. Write one using a multi-stage build.',
    story: '📝 **NO DOCKERFILE** — The team has a Node.js app but no Dockerfile. Write a multi-stage Dockerfile that installs dependencies in a builder stage and copies only the production artifacts to the final image.',
    objectives: [
      'Inspect the app source files in the app-source ConfigMap',
      'Write a Dockerfile using FROM, COPY, RUN, and CMD',
      'Use a multi-stage build to keep the final image small',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'app-source',
              namespace: 'default',
              labels: { type: 'app-source', dockerfile: 'missing' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'docker-cm-004',
            },
            data: {
              'package.json': '{\n  "name": "myapp",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": { "start": "node index.js" },\n  "dependencies": { "express": "^4.18.0" }\n}',
              'index.js': 'const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.send("Hello from Docker!"));\napp.listen(3000);',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'dockerfile-check',
              namespace: 'default',
              labels: { app: 'dockerfile-check' },
              annotations: { dockerfile_valid: 'false' },
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'docker-pod-004',
            },
            spec: {
              containers: [{
                name: 'checker',
                image: 'node:18-alpine',
                ports: [{ containerPort: 3000 }],
                env: [],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Pending',
              containerStatuses: [{
                name: 'checker',
                ready: false,
                restartCount: 0,
                state: 'waiting',
                stateReason: 'PodInitializing',
                image: 'node:18-alpine',
              }],
              message: 'Waiting for Dockerfile to be written',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'default',
      targetName: 'dockerfile-check',
      targetKind: 'Pod',
      expectedLabels: { dockerfile_valid: 'true' },
      label: 'Dockerfile written and image built successfully',
    },
    hints: [
      { id: 'dh4-1', order: 1, text: 'Start with `FROM node:18-alpine AS builder`. Use COPY to copy package.json, then RUN npm install.', pointPenalty: 20 },
      { id: 'dh4-2', order: 2, text: 'For the second stage: `FROM node:18-alpine`, COPY --from=builder to get the node_modules, then COPY the source files. End with CMD ["node", "index.js"].', pointPenalty: 35 },
      { id: 'dh4-3', order: 3, text: 'Run `docker build -t myapp:v1 .` — a successful build sets the annotation. Multi-stage keeps the image small by excluding build-time tools from the final image.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'docker build -t myapp:v1 .',
    ],
    teacherNotes: 'Teaches: Dockerfile syntax (FROM, COPY, RUN, CMD), multi-stage builds, layer caching. Discuss why multi-stage reduces attack surface.',
  },

  {
    id: 'docker-s05-fix-compose',
    slug: 'fix-docker-compose',
    name: 'Fix a Broken docker-compose',
    category: 'docker-fundamentals',
    difficulty: 2,
    estimatedMinutes: 10,
    maxPoints: 150,
    description: '`docker-compose up` fails because the app starts before the database is ready.',
    story: '🔧 **COMPOSE FAILURE** — `docker-compose up` starts but the app crashes immediately because the database isn\'t ready yet. The compose file has `depends_on: [db]` but no health check condition. Fix it.',
    objectives: [
      'Inspect the compose-config ConfigMap to see the compose YAML',
      'Add a healthcheck to the db service',
      'Update depends_on to use condition: service_healthy',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'compose-config',
              namespace: 'default',
              labels: { type: 'docker-compose', status: 'broken' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'docker-cm-005',
            },
            data: {
              'docker-compose.yml': 'version: "3.9"\nservices:\n  app:\n    image: myapp:v1\n    depends_on:\n      - db\n    ports:\n      - "3000:3000"\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_PASSWORD: secret\n    # MISSING: healthcheck and depends_on condition',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'compose-check',
              namespace: 'default',
              labels: { app: 'compose-check' },
              annotations: { compose_status: 'broken' },
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'docker-pod-005',
            },
            spec: {
              containers: [{
                name: 'compose',
                image: 'docker/compose:latest',
                ports: [],
                env: [],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'compose',
                ready: false,
                restartCount: 2,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'docker/compose:latest',
              }],
              message: 'App started before DB was ready — connection refused',
              reason: 'StartupOrderError',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'default',
      targetName: 'compose-check',
      targetKind: 'Pod',
      expectedLabels: { compose_status: 'healthy' },
      label: 'docker-compose healthy after adding healthcheck and condition',
    },
    hints: [
      { id: 'dh5-1', order: 1, text: 'Run `docker-compose config --validate` to check the current compose file syntax.', pointPenalty: 20 },
      { id: 'dh5-2', order: 2, text: 'Add a healthcheck to the db service: `healthcheck: { test: ["CMD", "pg_isready", "-U", "postgres"], interval: 5s, retries: 5 }`.', pointPenalty: 35 },
      { id: 'dh5-3', order: 3, text: 'Change `depends_on: [db]` to `depends_on: { db: { condition: service_healthy } }`. Then run `docker-compose up`.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'docker-compose config --validate',
      'docker-compose up',
    ],
    teacherNotes: 'Teaches: docker-compose healthcheck syntax, depends_on condition: service_healthy. Common production pitfall — race condition on startup.',
  },

  {
    id: 'docker-s06-dangling-volumes',
    slug: 'dangling-volumes',
    name: 'Dangling Volumes',
    category: 'docker-fundamentals',
    difficulty: 3,
    estimatedMinutes: 10,
    maxPoints: 200,
    description: 'Disk is filling up. Find and remove dangling volumes and stopped containers.',
    story: '💾 **DISK FULL ALERT** — The host is running out of disk space. Multiple stopped containers and dangling volumes are consuming gigabytes. Clean them up before the disk fills completely.',
    objectives: [
      'List all stopped containers and dangling volumes',
      'Remove stopped containers and dangling volumes',
      'Verify disk space is reclaimed',
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
              name: 'stopped-container-1',
              namespace: 'default',
              labels: { status: 'stopped' },
              annotations: { status: 'stopped', size: '512MB' },
              creationTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              uid: 'docker-pod-006a',
            },
            spec: {
              containers: [{ name: 'old-worker', image: 'worker:v0.1', ports: [], env: [], envFrom: [] }],
            },
            status: {
              phase: 'Succeeded',
              containerStatuses: [{ name: 'old-worker', ready: false, restartCount: 0, state: 'terminated', image: 'worker:v0.1' }],
              message: 'Container exited 0',
              reason: 'Completed',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'cleanup-target',
              namespace: 'default',
              labels: { app: 'cleanup-target' },
              annotations: { disk_cleanup: 'pending', dangling_volumes: '3', stopped_containers: '2' },
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'docker-pod-006b',
            },
            spec: {
              containers: [{ name: 'monitor', image: 'alpine:latest', ports: [], env: [], envFrom: [] }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{ name: 'monitor', ready: true, restartCount: 0, state: 'running', image: 'alpine:latest' }],
              message: 'Disk at 95% capacity — cleanup required',
              reason: 'Running',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'default',
      targetName: 'cleanup-target',
      targetKind: 'Pod',
      expectedLabels: { disk_cleanup: 'done' },
      label: 'Dangling volumes and stopped containers removed',
    },
    hints: [
      { id: 'dh6-1', order: 1, text: 'List dangling volumes: `docker volume ls -f dangling=true`. List stopped containers: `docker ps -a --filter status=exited`.', pointPenalty: 20 },
      { id: 'dh6-2', order: 2, text: 'Remove all stopped containers at once: `docker container prune`. Remove all dangling volumes: `docker volume prune`.', pointPenalty: 35 },
      { id: 'dh6-3', order: 3, text: 'Or use `docker system prune --volumes` to remove stopped containers, dangling images, unused networks, AND volumes in one command. Add `-f` to skip confirmation.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'docker volume ls -f dangling=true',
      'docker ps -a --filter status=exited',
      'docker system prune --volumes -f',
    ],
    teacherNotes: 'Teaches: docker volume ls filters, docker system prune, container lifecycle states. Discuss prune safety — never run blindly in production.',
  },
];

const dockerCharacters: Character[] = [
  {
    id: 'operator',
    name: 'Alex the DevOps Engineer',
    title: 'DevOps Engineer',
    description: 'Container infrastructure expert. Gets extra time and reduced hint costs on all challenges.',
    avatarEmoji: '🐳',
    primaryColor: '#3B82F6',
    flavor: '"Containers don\'t lie — only the logs do."',
    buff: {
      id: 'operator-buff',
      name: 'Container Veteran',
      description: '+30s timer, 50% hint cost reduction',
      categoryMultiplier: { 'docker-fundamentals': 1.2 },
      hintCostReduction: 0.5,
      timeBonus: 30,
      streakProtection: false,
    },
  },
  {
    id: 'developer',
    name: 'Sam the Backend Dev',
    title: 'Backend Developer',
    description: 'Fast problem solver. Earns 20% more on config and secrets challenges.',
    avatarEmoji: '💻',
    primaryColor: '#10B981',
    flavor: '"Ship it. Fix the Dockerfile later."',
    buff: {
      id: 'developer-buff',
      name: 'Move Fast',
      description: '+20% points on config/secrets, streak protection',
      categoryMultiplier: { 'docker-fundamentals': 1.2, configuration: 1.1 },
      hintCostReduction: 0,
      timeBonus: 0,
      streakProtection: true,
    },
  },
  {
    id: 'sre',
    name: 'Jordan the Platform SRE',
    title: 'Site Reliability Engineer',
    description: 'Debugging specialist. Earns 25% more on debugging and observability scenarios.',
    avatarEmoji: '🔍',
    primaryColor: '#F59E0B',
    flavor: '"If it\'s not in docker inspect, it doesn\'t exist."',
    buff: {
      id: 'sre-buff',
      name: 'Blameless Postmortem',
      description: '+25% on debug/observability, hint cost reduction',
      categoryMultiplier: { 'docker-fundamentals': 1.25, debugging: 1.1 },
      hintCostReduction: 0.25,
      timeBonus: 0,
      streakProtection: false,
    },
  },
  {
    id: 'architect',
    name: 'Riley the Cloud Architect',
    title: 'Cloud Architect',
    description: 'Networking and infrastructure guru. Earns 30% more on networking scenarios.',
    avatarEmoji: '☁️',
    primaryColor: '#8B5CF6',
    flavor: '"Every container is an island — connect them wisely."',
    buff: {
      id: 'architect-buff',
      name: 'Network Maestro',
      description: '+30% on networking, +15s timer',
      categoryMultiplier: { 'docker-fundamentals': 1.3, networking: 1.2 },
      hintCostReduction: 0,
      timeBonus: 15,
      streakProtection: false,
    },
  },
];

export const dockerCourse: Course = {
  id: 'docker',
  name: 'Docker Fundamentals',
  icon: '🐳',
  description: 'Learn Docker container management, image handling, and networking through practical incident scenarios.',
  terminalPrompt: '🐳 $ ',
  terminalWelcome: [
    '\x1b[34m╔══════════════════════════════════════╗\x1b[0m',
    '\x1b[34m║   Docker Course Terminal             ║\x1b[0m',
    '\x1b[34m║   Type docker commands to solve       ║\x1b[0m',
    '\x1b[34m╚══════════════════════════════════════╝\x1b[0m',
  ],
  scenarios: dockerScenarios,
  characters: dockerCharacters,
};
