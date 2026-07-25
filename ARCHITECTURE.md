# KubeQuest — Architecture Document

> **Living document** — append new decisions, changes, and learnings as the project evolves.
> Format: `## YYYY-MM-DD — <title>` for each new section.

---

## 2026-04-17 — Initial Architecture

### Overview

KubeQuest is a **multiplayer Kubernetes simulation game** for classroom environments.
Players solve real-world Kubernetes incidents using a browser-based `kubectl` simulator.
A teacher controls the session; students compete on a live leaderboard.

---

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Student)                   │
│  Next.js 14 App Router · Zustand · Socket.io-client      │
│  ┌──────────┐  ┌───────────────┐  ┌─────────────────┐   │
│  │  Game UI │  │ KubeTerminal  │  │   Leaderboard   │   │
│  │(scenario,│  │  (xterm.js)   │  │  (live, framer) │   │
│  │ hints,   │  │  kubectl cmds │  │                 │   │
│  │ scoring) │  │               │  │                 │   │
│  └──────────┘  └───────────────┘  └─────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │ WebSocket (Socket.io)
┌─────────────────────────▼───────────────────────────────┐
│                   Node.js Server                         │
│  Express + Socket.io · In-memory store                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Socket       │  │  Game Engine │  │  K8s Simulator│  │
│  │ Handlers     │  │  (state      │  │  (parser,     │  │
│  │ (room, game) │  │  machine)    │  │  executor,    │  │
│  └──────────────┘  └──────────────┘  │  renderer)    │  │
│                                      └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    Browser (Teacher)                     │
│  Dashboard · Player progress · Controls · Solution view  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                Projector / Display                        │
│  /leaderboard/[code]?projector=1                         │
│  Large-font, auto-updating leaderboard for classroom TV  │
└─────────────────────────────────────────────────────────┘
```

---

### Monorepo Structure

```
kubequest/
├── packages/
│   └── shared/          # Shared TypeScript types, constants, scoring utils
│       └── src/
│           ├── types/   # game.ts, k8s.ts, scenario.ts, leaderboard.ts, socket.ts
│           ├── constants/ # characters.ts, scenarios.ts, game.ts
│           └── utils/   # scoring.ts
│
├── apps/
│   ├── server/          # Express + Socket.io backend
│   │   └── src/
│   │       ├── config.ts
│   │       ├── store/        # In-memory room/session store
│   │       ├── game/         # Engine, win-condition evaluator
│   │       ├── k8s-sim/      # kubectl parser, executor, renderer, cluster state
│   │       └── socket/       # Socket.io handler registration
│   │
│   └── web/             # Next.js 14 App Router frontend
│       └── src/
│           ├── app/          # Pages: /, /join, /create, /room/[code], /game/[code],
│           │                 #        /teacher/[code], /leaderboard/[code]
│           ├── components/   # game/, terminal/, leaderboard/
│           ├── providers/    # SocketProvider (context + event wiring)
│           ├── store/        # gameStore.ts (Zustand)
│           └── lib/          # socket-client.ts, utils.ts
│
└── kubequest.sh         # Master control script
```

---

### Data Flow

#### Room Creation (Teacher)
```
Teacher fills form → POST (via socket 'room:create')
  → Server generates 6-char room code
  → Creates Room + GameSession in memory
  → Teacher joins socket room
  → Ack with room code
  → Teacher redirected to /teacher/[code]
```

#### Player Join (Student)
```
Student enters room code + name → 'room:join'
  → Server validates room exists, not full
  → Creates Player record, joins socket room
  → Ack with room state (players, settings)
  → Student redirected to /room/[code] (lobby)
  → All other players receive 'room:player-joined'
```

#### Game Start
```
Teacher clicks Start → 'teacher:start-game'
  → Phase: lobby → character-select
  → 60s timer for character selection
  → All players get 'game:phase-change'
  → After timer: first scenario loads
```

#### kubectl Command Flow
```
Student types command → 'game:submit-command'
  → Server: parseKubectl(raw) → ParsedKubectlCommand
  → executeCommand(cmd, clusterState) → {result, newState}
  → commandCount++ for player
  → Ack to student with result.output
  → If stateChanged: evaluateWinCondition(scenario, newState)
    → If win: handlePlayerSolvedScenario()
              → computeScenarioScore()
              → Emit 'game:player-solved' to room
              → Emit 'game:score-update' to player
              → Emit 'game:leaderboard' to room
  → Teacher receives 'terminal:output'
```

---

### K8s Simulator Design

The simulator runs **entirely server-side** with no real Kubernetes.

**ClusterState** is a plain JavaScript object:
```typescript
{
  namespaces: string[],
  resources: Record<kind, Record<"namespace/name", AnyK8sResource>>,
  currentNamespace: string,
  events: ClusterEvent[]
}
```

Each player has their own independent `ClusterState`.

**Command lifecycle:**
1. `parser.ts` → tokenise raw string → `ParsedKubectlCommand`
2. `executor.ts` → dispatch to verb handler → mutate ClusterState copy → return `CommandResult`
3. `renderer.ts` → format output as kubectl-style text (fixed-width tables, YAML)
4. Server returns output to player, optionally syncs new state

**Supported verbs:** `get`, `describe`, `apply`, `create`, `delete`, `scale`, `patch`, `rollout`, `set image`, `label`, `annotate`, `logs`, `exec`, `config`, `autoscale`, `top`, `explain`

---

### Game State Machine

```
lobby
  ↓ teacher:start-game
character-select  (60s or all ready)
  ↓ auto / teacher:next-scenario
briefing          (15s — scenario story shown)
  ↓ auto
active            (timeLimitSeconds — per room setting + character buff)
  ↓ all solved OR timer expires OR teacher:next-scenario
review            (20s — leaderboard revealed)
  ↓ auto / teacher:next-scenario
  ├─ if more scenarios → briefing
  └─ if last scenario → final
final             (permanent until room expires)
```

---

### Scoring Formula

```
raw = max(0, (basePoints - hintPenalty + timeBonus) * catMultiplier * streakMultiplier)
total = floor(raw) + firstBloodBonus + perfectBonus
```

| Component | Value |
|---|---|
| Base points | Per scenario (100–250) |
| Time bonus | Up to +50 pts (proportional to time remaining) |
| Hint penalty | -20, -35, -50 per hint used |
| Category multiplier | Character-specific (1.0–1.3×) |
| Streak multiplier | 1.0, 1.1, 1.25, 1.5, 2.0× for streaks 0–4 |
| First blood bonus | +50 pts (first to solve) |
| Perfect bonus | +25 pts (no hints used) |

---

### Characters

| Character | Emoji | Strength | Buff |
|---|---|---|---|
| Kai the Operator | 🔧 | Pod management | +30s timer, 50% hint cost reduction |
| Priya the Developer | 💻 | Config/Secrets | +20% points on config/secrets, streak protection |
| Marcus the SRE | 🔍 | Debugging/Observability | +25% on debug, 25% hint cost reduction |
| Dana the Architect | 🏗️ | RBAC/Networking | +30% on RBAC/networking, +15s timer |

---

### Scenarios

| # | Name | Category | Difficulty | Max Pts |
|---|---|---|---|---|
| 1 | Pod in Distress | pod-management | ⬤○○○ | 100 |
| 2 | Scale Up or Ship Out | deployment-scaling | ⬤○○○ | 100 |
| 3 | Wrong Image, Wrong Vibes | deployment-scaling | ⬤⬤○○ | 150 |
| 4 | Service Not Found | networking | ⬤⬤○○ | 150 |
| 5 | Secret Agent | secrets | ⬤⬤○○ | 150 |
| 6 | Namespace Lockdown | rbac | ⬤⬤⬤○ | 200 |
| 7 | Autoscale or Bust | deployment-scaling | ⬤⬤⬤○ | 200 |
| 8 | The Ghost Ingress | networking | ⬤⬤⬤○ | 200 |
| 9 | Rollback to Safety | debugging | ⬤⬤⬤⬤ | 250 |

---

### Socket.io Event Reference

| Event | Direction | When |
|---|---|---|
| `room:create` | C→S | Teacher submits create form |
| `room:join` | C→S | Student enters room code |
| `room:leave` | C→S | Player navigates away |
| `room:state` | S→C | Any room mutation (broadcast) |
| `room:player-joined` | S→C | New player joins |
| `room:player-left` | S→C | Player disconnects |
| `room:error` | S→C | Invalid action (unicast) |
| `player:select-character` | C→S | Player picks character |
| `player:ready` | C→S | Player clicks Ready |
| `teacher:start-game` | C→S | Teacher starts session |
| `teacher:next-scenario` | C→S | Teacher advances manually |
| `teacher:end-game` | C→S | Teacher ends session |
| `teacher:kick-player` | C→S | Teacher removes a player |
| `teacher:reveal-solution` | C→S | Teacher shows answer |
| `game:phase-change` | S→C | Phase transitions (broadcast) |
| `game:scenario-start` | S→C | New scenario begins (broadcast) |
| `game:scenario-end` | S→C | Scenario concludes (broadcast) |
| `game:ended` | S→C | Full game over (broadcast) |
| `game:timer-sync` | S→C | Server clock sync every 10s |
| `game:submit-command` | C→S | Player runs kubectl command |
| `game:request-hint` | C→S | Player requests hint |
| `game:reset-cluster` | C→S | Player resets their cluster |
| `game:player-solved` | S→C | Someone solved the scenario |
| `game:score-update` | S→C | Points awarded (unicast) |
| `game:leaderboard` | S→C | Full leaderboard snapshot every 5s |
| `terminal:output` | S→C | kubectl output (teacher view) |
| `cluster:state` | S→C | Cluster state sync (unicast) |
| `teacher:player-progress` | S→C | Progress stream (teacher only) |
| `teacher:solution` | S→C | Solution payload (teacher only) |
| `ping` / `pong` | C↔S | Latency check |

---

### In-Memory Store

All game state is stored in-memory on the server. There is no database.

```typescript
{
  rooms: Map<code, Room>,             // Room config + players
  sessions: Map<code, GameSession>,   // Active game state
  playerRoomIndex: Map<socketId, code>, // Reverse lookup
  sessionIndex: Map<sessionId, socketId>, // Reconnect support
  timers: Map<key, NodeJS.Timeout>,   // Phase transition timers
}
```

**Room expiry:** Rooms older than 4 hours are automatically purged.
**Reconnect:** Players can reconnect using their `sessionId` cookie.

---

### URL Routes

| URL | Who | Purpose |
|---|---|---|
| `/` | Everyone | Landing page |
| `/create` | Teacher | Create room form |
| `/join` | Student | Enter room code + name |
| `/room/[code]` | Student | Lobby + character select |
| `/teacher/[code]` | Teacher | Dashboard + controls |
| `/game/[code]` | Student | Live game: terminal + scenario |
| `/leaderboard/[code]` | Everyone | Live leaderboard |
| `/leaderboard/[code]?projector=1` | Projector | Full-screen classroom display |

---

### Technology Choices & Rationale

| Technology | Choice | Reason |
|---|---|---|
| Realtime | Socket.io | Battle-tested, handles reconnects, rooms natively |
| State (client) | Zustand | Minimal boilerplate, works with React 18 |
| Animations | Framer Motion | Layout animations for leaderboard reordering |
| Terminal | xterm.js | De-facto browser terminal, used by VS Code |
| Styling | Tailwind CSS | Fast iteration, dark theme friendly |
| Frontend | Next.js 14 App Router | Server components opt-in, good DX |
| Monorepo | npm workspaces | Zero extra tooling, built into npm 7+ |
| Database | None (in-memory) | MVP scope; Redis can be added later for persistence |

---

### Classroom Deployment Tips

1. **Same network**: Teacher and students should be on the same WiFi/LAN.
   Update `NEXT_PUBLIC_SOCKET_URL` and `CLIENT_URL` to the server's LAN IP.
2. **Projector**: Open `/leaderboard/[code]?projector=1` on the projector browser.
3. **Room code**: Teacher shares the 6-char code on screen or verbally.
4. **Timing**: Default 120s per scenario. Adjust in teacher create form.
5. **Hints**: Can be disabled in room settings for advanced groups.

---

### Adding New Scenarios

1. Add a new entry to `packages/shared/src/constants/scenarios.ts`
2. Define `initialClusterState` (what resources exist at start)
3. Define `winCondition` (what must be true to win)
4. Add 3 hints with increasing specificity and penalties (20, 35, 50)
5. Add `solutionCommands` array
6. The `WinConditionType` enum in `types/scenario.ts` covers most cases;
   add new types there + implement in `apps/server/src/game/win-condition.ts` if needed

---

### Future Improvements

- [ ] Redis-backed store for multi-server deployments
- [ ] Persistent game history / session replay
- [ ] Team mode (2 players on one cluster)
- [ ] Custom scenario editor in teacher dashboard
- [ ] Sound effects (correct/wrong/countdown)
- [ ] Mobile-responsive terminal (virtual keyboard)
- [ ] YAML apply support (paste manifests into terminal)
- [ ] Export leaderboard to CSV
- [ ] OAuth for teacher accounts
- [ ] Kubernetes v2 API resources (Gateway API, etc.)

---

*Append new sections below as the project evolves.*

---

## 2026-05-15 — `scripts/run-local.sh` Design

### Purpose

`scripts/run-local.sh` is the single operator-facing entry point for every lifecycle
operation: setup, dev, build, start, stop, restart, status, logs, doctor, lint, and version.
It runs entirely in Bash with no runtime dependencies beyond `node`, `npm`, and standard
POSIX utilities.

### Command Reference

| Command     | What it does                                              |
|-------------|-----------------------------------------------------------|
| `setup`     | `npm ci` + build shared package                           |
| `dev`       | Start server (ts-node-dev) + web (next dev) in dev mode   |
| `start`     | Build all packages then start compiled JS + next start    |
| `stop`      | Send SIGTERM to process groups via PID files              |
| `restart`   | `stop` then `start`                                       |
| `status`    | Table of PID / HTTP health per service                    |
| `logs`      | Tail server and/or web log files                          |
| `build`     | Compile shared → server → web (skips if up-to-date)       |
| `doctor`    | Pre-flight check: tools, env file, ports, dist artifacts  |
| `lint`      | `npm run lint` across all packages                        |
| `version`   | Print KubeQuest + Node + npm versions                     |

Invoking with no command opens an interactive `select` menu (TTY only).

### Global Flags

```
-e, --env <name>        ENVIRONMENT name (default: dev)
    --env-file <path>   Explicit path to .env file
    --log-dir <path>    Override log directory
-y, --yes               Skip all confirmation prompts
    --non-interactive   Alias for --yes
```

### Environment File Precedence

```
CLI --env-file flag  >  $REPO_ROOT/env/$ENVIRONMENT.env  >  built-in apply_defaults()
```

`apply_defaults` sets: `SERVER_PORT=3001`, `WEB_PORT=3000`, `BIND_ADDRESS=0.0.0.0`,
`NEXT_HOSTNAME=0.0.0.0`, `CLIENT_URL=http://localhost:3000`,
`NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`.

### Interactive Prompts

All prompts (`_prompt_input`, `_prompt_select`, `prompt_confirm`) read from `/dev/tty` so
they work when stdout/stderr are redirected. TTY availability is tested once at startup:

```bash
[[ -t 0 ]] || YES=1   # no TTY → behave as if --yes was passed
```

### Process Management

Each service is launched with `setsid` to create its own process group:

```bash
setsid <command> >> "$logfile" 2>&1 &
echo $! > "$pidfile"
```

`stop_pidfile` reads the PID, resolves the process group leader with `ps -o pgid=`, then
calls `kill_tree` which sends `SIGTERM` to the entire group followed by `SIGKILL` if
processes remain after a 5-second grace period.

### Stale-Build Detection

`_any_ts_newer_than <dist-file> <src-dirs...>` uses `find -newer` to compare the newest
`.ts` source file against the last build output. If any source is newer, the package is
rebuilt; otherwise the build step is skipped.

### `doctor` and `status` — Safe env Probing

Both commands need env values without dying when no env file exists. They use a direct
probe instead of calling `resolve_env_file` (which calls `fatal` → `exit 1` on missing
files in non-interactive mode):

```bash
local probed_env="${ENV_FILE:-$REPO_ROOT/env/$ENVIRONMENT.env}"
if [[ -f "$probed_env" ]]; then
  ENV_FILE="$probed_env"; load_env_file 2>/dev/null || true
fi
apply_defaults
```

### Log Files

Written to `$REPO_ROOT/logs/` (configurable via `--log-dir`):

| File             | Contents                          |
|------------------|-----------------------------------|
| `server.log`     | Express + Socket.io stdout/stderr |
| `web.log`        | Next.js stdout/stderr             |
| `server.pid`     | PID of the server setsid leader   |
| `web.pid`        | PID of the web setsid leader      |
