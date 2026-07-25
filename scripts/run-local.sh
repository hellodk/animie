#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/run-local.sh — interactive dev / prod runner for KubeQuest
# ─────────────────────────────────────────────────────────────────────────────
# Pattern from /home/dk/Documents/git/k8s-cluster-health/scripts/run-local.sh
# Every config item is loaded from env/<ENVIRONMENT>.env, shown to the
# operator with its default in [brackets], prompted for, validated, and only
# then used to start services.  With --yes the prompts are silently accepted;
# with --non-interactive a missing required value is fatal.
#
# Usage:
#   scripts/run-local.sh                            # interactive menu
#   scripts/run-local.sh start [-e dev|prod] [--yes] [--non-interactive]
#   scripts/run-local.sh stop
#   scripts/run-local.sh status
#   scripts/run-local.sh restart [...]
#   scripts/run-local.sh logs [server|web|all]
#   scripts/run-local.sh build
#   scripts/run-local.sh setup [-e dev|prod]        # writes env/<env>.env
#   scripts/run-local.sh doctor                     # pre-flight checks
#   scripts/run-local.sh lint                       # validate env file only
#   scripts/run-local.sh version
#
# Environment overrides (take precedence over the env-file values):
#   ENVIRONMENT, ENV_FILE, NODE_ENV, WEB_MODE,
#   BIND_ADDRESS, NEXT_HOSTNAME,
#   SERVER_PORT, WEB_PORT,
#   CLIENT_URL, NEXT_PUBLIC_SOCKET_URL,
#   LOG_DIR
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Colors ────────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; CYAN=''; BOLD=''; DIM=''; NC=''
fi

info()    { echo -e "${BLUE}[info]${NC}  $*" >&2; }
success() { echo -e "${GREEN}[ok]${NC}    $*" >&2; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*" >&2; }
error()   { echo -e "${RED}[error]${NC} $*" >&2; }
header()  { echo -e "\n${BOLD}${CYAN}$*${NC}\n" >&2; }
fatal()   { error "$*"; exit 1; }

# ── Globals (defaults; overridden by env file → CLI) ──────────────────────────
PROMPT_RESULT=""
YES=0                  # --yes accepts every default silently
NON_INTERACTIVE=0      # --non-interactive: a missing required value is fatal
LOG_DIR="${LOG_DIR:-/tmp/kubequest-logs}"
mkdir -p "$LOG_DIR"

SERVER_PIDFILE="$LOG_DIR/server.pid"
WEB_PIDFILE="$LOG_DIR/web.pid"
SHARED_BUILD_STAMP="$LOG_DIR/.shared_built"

# ── TTY detection (avk pattern) ───────────────────────────────────────────────
# All prompts read from /dev/tty so a piped invocation doesn't accidentally
# consume the next program's stdin.  If /dev/tty isn't openable (cron,
# subprocess, CI, Claude background tasks, etc.) we enable --yes implicitly.
TTY_AVAILABLE=1
if ! { : <"/dev/tty"; } 2>/dev/null; then
  TTY_AVAILABLE=0
  YES=1
fi

# ── Prompt helpers ────────────────────────────────────────────────────────────
_prompt_input() {
  local label="$1" default="${2:-}"
  if (( YES )); then PROMPT_RESULT="$default"; return; fi
  if (( NON_INTERACTIVE )); then
    [[ -n "$default" ]] || fatal "non-interactive: required value '$label' missing"
    PROMPT_RESULT="$default"; return
  fi
  echo -en "${DIM}  ${label} [${default}]:${NC} " >&2
  local value=""
  read -r value </dev/tty 2>/dev/null || value=""
  PROMPT_RESULT="${value:-$default}"
}

_prompt_secret() {
  local label="$1" default="${2:-}"
  if (( YES )); then PROMPT_RESULT="$default"; return; fi
  if (( NON_INTERACTIVE )); then PROMPT_RESULT="$default"; return; fi
  if [[ -n "$default" ]]; then
    echo -en "${DIM}  ${label} [<existing>]:${NC} " >&2
  else
    echo -en "${DIM}  ${label} (empty to skip):${NC} " >&2
  fi
  local value=""
  read -rs value </dev/tty 2>/dev/null || value=""
  echo "" >&2
  PROMPT_RESULT="${value:-$default}"
}

_prompt_select() {
  local label="$1"; shift
  local default="$1"; shift
  local options=("$@")
  if (( YES )) || (( NON_INTERACTIVE )); then PROMPT_RESULT="$default"; return; fi
  echo -e "\n${BOLD}${label}${NC} ${DIM}[default: ${default}]${NC}" >&2
  local i
  for i in "${!options[@]}"; do
    local marker=" "
    [[ "${options[$i]}" == "$default" ]] && marker="*"
    echo -e "  ${CYAN}$((i+1)))${NC}${marker} ${options[$i]}" >&2
  done
  local choice=""
  while true; do
    echo -en "${DIM}  Select [1-${#options[@]}, enter for default]:${NC} " >&2
    read -r choice </dev/tty 2>/dev/null || choice=""
    if [[ -z "$choice" ]]; then PROMPT_RESULT="$default"; return; fi
    if [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= ${#options[@]} )); then
      PROMPT_RESULT="${options[$((choice-1))]}"; return
    fi
    error "  Invalid choice. Try again."
  done
}

prompt_confirm() {
  local prompt="$1" default="${2:-N}"
  if (( YES )); then [[ "$default" =~ ^[Yy]$ ]]; return; fi
  if (( NON_INTERACTIVE )); then [[ "$default" =~ ^[Yy]$ ]]; return; fi
  local hint reply=""
  if [[ "$default" =~ ^[Yy]$ ]]; then hint="Y/n"; else hint="y/N"; fi
  echo -en "${BOLD}  ${prompt} (${hint}):${NC} " >&2
  read -r reply </dev/tty 2>/dev/null || reply=""
  reply="${reply:-$default}"
  [[ "$reply" =~ ^[Yy]$ ]]
}

# ── Validators ────────────────────────────────────────────────────────────────
validate_int() {
  local name="$1" value="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || { error "$name must be an integer (got: '$value')"; return 1; }
}

validate_port() {
  local name="$1" value="$2"
  validate_int "$name" "$value" || return 1
  (( value >= 1 && value <= 65535 )) || { error "$name must be 1..65535 (got: $value)"; return 1; }
}

validate_port_free() {
  local name="$1" value="$2"
  validate_port "$name" "$value" || return 1
  if ss -tlnH "sport = :$value" 2>/dev/null | grep -q .; then
    local owner
    owner="$(ss -tlnpH "sport = :$value" 2>/dev/null | head -1)"
    error "$name :$value is already bound — listener: $owner"
    return 1
  fi
}

validate_url_syntax() {
  local name="$1" value="$2"
  [[ "$value" =~ ^https?:// ]] || { error "$name must start with http:// or https:// (got: '$value')"; return 1; }
}

validate_url_reachable() {
  local name="$1" value="$2"
  if ! curl -sI --max-time 5 "$value" >/dev/null 2>&1; then
    warn "$name '$value' is not reachable right now (continuing)"
  fi
}

validate_choice() {
  local name="$1" value="$2"; shift 2
  for opt in "$@"; do [[ "$value" == "$opt" ]] && return 0; done
  error "$name must be one of: $*  (got: '$value')"; return 1
}

# normalize_url — auto-prepend http:// when the operator types a bare host:port
normalize_url() {
  local var="$1"
  local value="${!var}"
  [[ -z "$value" ]] && return 0
  if [[ ! "$value" =~ ^https?:// ]]; then
    value="${value#//}"
    value="http://$value"
    printf -v "$var" '%s' "$value"
    info "  $var → $value (auto-prepended http://)"
  fi
}

# ── Env file ──────────────────────────────────────────────────────────────────
ENVIRONMENT="${ENVIRONMENT:-dev}"
ENV_FILE="${ENV_FILE:-}"

resolve_env_file() {
  if [[ -z "${ENV_FILE:-}" ]]; then
    ENV_FILE="$REPO_ROOT/env/$ENVIRONMENT.env"
  fi
  if [[ ! -f "$ENV_FILE" ]]; then
    warn "Env file not found: $ENV_FILE"
    local example="$REPO_ROOT/env/$ENVIRONMENT.env.example"
    if [[ -f "$example" ]]; then
      info "Hint: copy env/$ENVIRONMENT.env.example to env/$ENVIRONMENT.env and edit it."
    fi
    if (( YES )) || (( NON_INTERACTIVE )); then
      fatal "env file required for non-interactive mode"
    fi
    if ! prompt_confirm "Continue without an env file (use built-in defaults)?" "N"; then
      fatal "aborted"
    fi
    ENV_FILE=""
  fi
}

# Variables whose parent-env / CLI value must win over the env file.
ENV_FILE_VARS=(
  NODE_ENV WEB_MODE
  BIND_ADDRESS NEXT_HOSTNAME
  SERVER_PORT WEB_PORT
  CLIENT_URL NEXT_PUBLIC_SOCKET_URL
)

load_env_file() {
  if [[ -z "$ENV_FILE" ]]; then return; fi
  info "Loading env file: $ENV_FILE"
  # Snapshot vars set before sourcing, restore after (CLI > env file > default).
  declare -A __preset
  local v
  for v in "${ENV_FILE_VARS[@]}"; do
    if [[ -n "${!v+set}" ]]; then __preset[$v]="${!v}"; fi
  done
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
  for v in "${!__preset[@]}"; do
    printf -v "$v" '%s' "${__preset[$v]}"
    export "$v"
  done
}

# ── Built-in defaults ─────────────────────────────────────────────────────────
apply_defaults() {
  NODE_ENV="${NODE_ENV:-development}"
  WEB_MODE="${WEB_MODE:-dev}"
  BIND_ADDRESS="${BIND_ADDRESS:-0.0.0.0}"
  NEXT_HOSTNAME="${NEXT_HOSTNAME:-0.0.0.0}"
  SERVER_PORT="${SERVER_PORT:-3001}"
  WEB_PORT="${WEB_PORT:-3000}"
  # Derived URLs — only compute if still at the factory default so an
  # explicit env-file value is never clobbered by the formula.
  if [[ "${CLIENT_URL:-}" == "" ]]; then
    CLIENT_URL="http://localhost:${WEB_PORT}"
  fi
  if [[ "${NEXT_PUBLIC_SOCKET_URL:-}" == "" ]]; then
    NEXT_PUBLIC_SOCKET_URL="http://localhost:${SERVER_PORT}"
  fi
}

# ── Interactive collectors ─────────────────────────────────────────────────────
collect_runtime_config() {
  header "Runtime configuration"

  _prompt_select "NODE_ENV" "$NODE_ENV" "development" "production"
  NODE_ENV="$PROMPT_RESULT"

  while true; do
    _prompt_select "WEB_MODE" "$WEB_MODE" "dev" "prod"
    WEB_MODE="$PROMPT_RESULT"
    validate_choice WEB_MODE "$WEB_MODE" dev prod && break
  done

  while true; do
    _prompt_input "BIND_ADDRESS (interface for the server)" "$BIND_ADDRESS"
    BIND_ADDRESS="$PROMPT_RESULT"
    [[ -n "$BIND_ADDRESS" ]] && break
    error "BIND_ADDRESS may not be empty"
  done

  _prompt_input "NEXT_HOSTNAME (interface for the Next.js server)" "$NEXT_HOSTNAME"
  NEXT_HOSTNAME="$PROMPT_RESULT"
}

collect_ports() {
  header "Ports"
  for var in SERVER_PORT WEB_PORT; do
    while true; do
      _prompt_input "$var" "${!var}"
      printf -v "$var" '%s' "$PROMPT_RESULT"
      validate_port "$var" "${!var}" && break
    done
  done
  # Recompute derived URLs after ports may have changed.
  CLIENT_URL="http://localhost:${WEB_PORT}"
  NEXT_PUBLIC_SOCKET_URL="http://localhost:${SERVER_PORT}"
  validate_ports_free
}

validate_ports_free() {
  for var in SERVER_PORT WEB_PORT; do
    validate_port_free "$var" "${!var}" || fatal "port collision — change $var or stop the listener"
  done
}

collect_urls() {
  header "Service URLs"
  info "These tell each service how to reach the other."
  info "Change them when server and web run on different machines."

  while true; do
    _prompt_input "CLIENT_URL (web origin seen by the server; scheme optional)" "$CLIENT_URL"
    CLIENT_URL="$PROMPT_RESULT"
    normalize_url CLIENT_URL
    validate_url_syntax CLIENT_URL "$CLIENT_URL" && break
  done

  while true; do
    _prompt_input "NEXT_PUBLIC_SOCKET_URL (Socket.io server seen by the browser; scheme optional)" "$NEXT_PUBLIC_SOCKET_URL"
    NEXT_PUBLIC_SOCKET_URL="$PROMPT_RESULT"
    normalize_url NEXT_PUBLIC_SOCKET_URL
    validate_url_syntax NEXT_PUBLIC_SOCKET_URL "$NEXT_PUBLIC_SOCKET_URL" && break
  done
}

render_summary() {
  header "Summary"
  cat >&2 <<EOF
  ENVIRONMENT            = $ENVIRONMENT
  NODE_ENV               = $NODE_ENV
  WEB_MODE               = $WEB_MODE
  BIND_ADDRESS           = $BIND_ADDRESS
  NEXT_HOSTNAME          = $NEXT_HOSTNAME
  SERVER_PORT            = $SERVER_PORT
  WEB_PORT               = $WEB_PORT
  CLIENT_URL             = $CLIENT_URL
  NEXT_PUBLIC_SOCKET_URL = $NEXT_PUBLIC_SOCKET_URL
EOF
  echo "" >&2
  prompt_confirm "Proceed with these values?" "Y" || fatal "aborted by operator"
}

# ── Build helpers ─────────────────────────────────────────────────────────────
# Returns 0 (true) if any .ts/.tsx under $1 is newer than the stamp file $2,
# or if $2 doesn't exist.  Mirrors the go-binary staleness check in the
# reference script but for TypeScript source trees.
_any_ts_newer_than() {
  local src_dir="$1" stamp="$2"
  [[ ! -f "$stamp" ]] && return 0
  [[ -n "$(find "$src_dir" \( -name '*.ts' -o -name '*.tsx' \) -newer "$stamp" -print -quit 2>/dev/null)" ]]
}

build_shared_if_stale() {
  local src="$REPO_ROOT/packages/shared/src"
  local stamp="$REPO_ROOT/packages/shared/dist/index.js"
  if _any_ts_newer_than "$src" "$stamp"; then
    info "Building shared package..."
    (cd "$REPO_ROOT" && npm run build --workspace=packages/shared) \
      || fatal "shared build failed"
    touch "$SHARED_BUILD_STAMP"
    success "shared package built"
  else
    info "shared package up-to-date"
  fi
}

build_server_if_stale() {
  local src="$REPO_ROOT/apps/server/src"
  local stamp="$REPO_ROOT/apps/server/dist/index.js"
  if _any_ts_newer_than "$src" "$stamp"; then
    info "Building server..."
    (cd "$REPO_ROOT" && npm run build --workspace=apps/server) \
      || fatal "server build failed"
    success "server built"
  else
    info "server up-to-date"
  fi
}

build_web_if_stale() {
  local src="$REPO_ROOT/apps/web/src"
  local stamp="$REPO_ROOT/apps/web/.next/BUILD_ID"
  if _any_ts_newer_than "$src" "$stamp"; then
    info "Building web app (next build)..."
    (
      cd "$REPO_ROOT/apps/web"
      NEXT_PUBLIC_SOCKET_URL="$NEXT_PUBLIC_SOCKET_URL" npm run build
    ) || fatal "next build failed"
    success "web built"
  else
    info "web up-to-date"
  fi
}

# ── wait_for_http ─────────────────────────────────────────────────────────────
wait_for_http() {
  local url="$1" name="$2" max="${3:-30}" attempt
  info "Waiting for $name at $url..."
  for attempt in $(seq 1 "$max"); do
    if curl -s -o /dev/null --max-time 2 "$url"; then return 0; fi
    sleep 0.5
  done
  return 1
}

# ── Service start / stop ──────────────────────────────────────────────────────
start_server() {
  if [[ -f "$SERVER_PIDFILE" ]] && kill -0 "$(cat "$SERVER_PIDFILE")" 2>/dev/null; then
    fatal "Server already running (PID $(cat "$SERVER_PIDFILE")). Use 'stop' first."
  fi

  # Dev: ts-node-dev (hot reload).  Prod: compiled JS.
  local cmd
  if [[ "$NODE_ENV" == "production" ]]; then
    build_shared_if_stale
    build_server_if_stale
    cmd=("node" "$REPO_ROOT/apps/server/dist/index.js")
  else
    # Ensure shared is compiled at least once so imports resolve.
    build_shared_if_stale
    cmd=("npx" "ts-node-dev" "--respawn" "--transpile-only"
         "$REPO_ROOT/apps/server/src/index.ts")
  fi

  info "Starting server on $BIND_ADDRESS:$SERVER_PORT (NODE_ENV=$NODE_ENV)..."
  (
    export PORT="$SERVER_PORT"
    export CLIENT_URL="$CLIENT_URL"
    export NODE_ENV="$NODE_ENV"
    exec setsid "${cmd[@]}"
  ) > "$LOG_DIR/server.log" 2>&1 &
  echo $! > "$SERVER_PIDFILE"

  if ! wait_for_http "http://localhost:${SERVER_PORT}/health" "server" 40; then
    error "Server failed to become healthy. Last log lines:"
    tail -20 "$LOG_DIR/server.log" >&2 || true
    fatal "abort"
  fi
  success "Server ready (PID $(cat "$SERVER_PIDFILE")) → http://localhost:${SERVER_PORT}"
}

start_web() {
  if [[ -f "$WEB_PIDFILE" ]] && kill -0 "$(cat "$WEB_PIDFILE")" 2>/dev/null; then
    fatal "Web already running (PID $(cat "$WEB_PIDFILE")). Use 'stop' first."
  fi

  local next_cmd
  if [[ "$WEB_MODE" == "prod" ]]; then
    build_shared_if_stale
    build_web_if_stale
    next_cmd=("npx" "next" "start" "-H" "$NEXT_HOSTNAME" "-p" "$WEB_PORT")
  else
    next_cmd=("npx" "next" "dev" "--hostname" "$NEXT_HOSTNAME" "-p" "$WEB_PORT")
  fi

  info "Starting web on $NEXT_HOSTNAME:$WEB_PORT ($WEB_MODE mode)..."
  (
    cd "$REPO_ROOT/apps/web"
    export NEXT_PUBLIC_SOCKET_URL="$NEXT_PUBLIC_SOCKET_URL"
    export PORT="$WEB_PORT"
    exec setsid "${next_cmd[@]}"
  ) > "$LOG_DIR/web.log" 2>&1 &
  local pid=$!
  echo "$pid" > "$WEB_PIDFILE"

  if ! wait_for_http "http://localhost:${WEB_PORT}/" "web" 60; then
    error "Web failed to become reachable. Last log lines:"
    tail -20 "$LOG_DIR/web.log" >&2 || true
    fatal "abort"
  fi
  success "Web ready (PID $pid) → http://localhost:${WEB_PORT}"
}

# Kill PID and every descendant — mirrors the reference script to avoid
# orphaned next-server / ts-node-dev child processes.
kill_tree() {
  local pid="$1" sig="${2:-TERM}"
  local children
  children="$(pgrep -P "$pid" 2>/dev/null || true)"
  local c
  for c in $children; do kill_tree "$c" "$sig"; done
  kill -"$sig" "$pid" 2>/dev/null || true
}

stop_pidfile() {
  local pidfile="$1" label="$2"
  if [[ ! -f "$pidfile" ]]; then return; fi
  local pid
  pid="$(cat "$pidfile")"
  rm -f "$pidfile"
  if ! kill -0 "$pid" 2>/dev/null; then
    info "$label PID $pid already gone"; return
  fi
  info "Stopping $label (PID $pid + descendants)"
  kill -TERM -- -"$pid" 2>/dev/null || true
  kill_tree "$pid" TERM
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    warn "$label PID $pid did not exit on TERM, sending KILL"
    kill -KILL -- -"$pid" 2>/dev/null || true
    kill_tree "$pid" KILL
  fi
}

# ── Sub-commands ──────────────────────────────────────────────────────────────
cmd_start() {
  resolve_env_file
  load_env_file
  apply_defaults

  collect_runtime_config
  collect_ports
  collect_urls
  render_summary

  # Ensure npm workspaces are installed before trying to start anything.
  if [[ ! -d "$REPO_ROOT/node_modules" ]]; then
    info "node_modules not found — running npm install..."
    (cd "$REPO_ROOT" && npm install) || fatal "npm install failed"
  fi

  start_server
  start_web

  echo "" >&2
  success "KubeQuest stack ready"
  echo -e "  ${CYAN}Teacher create${NC}: http://localhost:${WEB_PORT}/create" >&2
  echo -e "  ${CYAN}Student join${NC}:   http://localhost:${WEB_PORT}/join" >&2
  echo -e "  ${CYAN}Server health${NC}:  http://localhost:${SERVER_PORT}/health" >&2
  echo -e "  ${CYAN}Projector view${NC}: http://localhost:${WEB_PORT}/leaderboard/<code>?projector=1" >&2
  echo -e "  ${CYAN}Logs${NC}:           scripts/run-local.sh logs" >&2
}

cmd_stop() {
  stop_pidfile "$SERVER_PIDFILE" "server"
  stop_pidfile "$WEB_PIDFILE"    "web"
  success "Stopped"
}

cmd_status() {
  local probed_env="${ENV_FILE:-$REPO_ROOT/env/$ENVIRONMENT.env}"
  if [[ -f "$probed_env" ]]; then
    ENV_FILE="$probed_env"
    load_env_file 2>/dev/null || true
  fi
  apply_defaults

  printf '%-10s %-10s %-8s %-7s %s\n' "SERVICE" "PIDFILE" "PID" "HTTP" "URL" >&2
  printf '%-10s %-10s %-8s %-7s %s\n' "-------" "-------" "---" "----" "---" >&2

  for triple in \
    "server:$SERVER_PIDFILE:$SERVER_PORT:/health" \
    "web:$WEB_PIDFILE:$WEB_PORT:/"; do
    IFS=: read -r name pidfile port probe <<< "$triple"
    local pid_state pid http
    if [[ -f "$pidfile" ]]; then
      pid="$(cat "$pidfile")"
      if ! kill -0 "$pid" 2>/dev/null; then
        pid="(stale)"; http="-"
      else
        http="$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 \
                  "http://localhost:$port$probe" 2>/dev/null || echo "x")"
      fi
      pid_state="$(basename "$pidfile")"
    else
      pid_state="-"; pid="-"; http="-"
    fi
    printf '%-10s %-10s %-8s %-7s %s\n' \
      "$name" "$pid_state" "$pid" "$http" "http://localhost:$port" >&2
  done
}

cmd_restart() {
  cmd_stop
  cmd_start "$@"
}

cmd_logs() {
  local target="${1:-all}"
  case "$target" in
    server) tail -F "$LOG_DIR/server.log" ;;
    web)    tail -F "$LOG_DIR/web.log" ;;
    all)    tail -F "$LOG_DIR/server.log" "$LOG_DIR/web.log" 2>/dev/null ;;
    *)      fatal "unknown target: $target (use server|web|all)" ;;
  esac
}

cmd_build() {
  resolve_env_file 2>/dev/null || true
  load_env_file    2>/dev/null || true
  apply_defaults

  if [[ ! -d "$REPO_ROOT/node_modules" ]]; then
    info "Running npm install first..."
    (cd "$REPO_ROOT" && npm install) || fatal "npm install failed"
  fi

  header "Building all packages"
  info "[1/3] shared"
  (cd "$REPO_ROOT" && npm run build --workspace=packages/shared) || fatal "shared build failed"
  success "shared"

  info "[2/3] server"
  (cd "$REPO_ROOT" && npm run build --workspace=apps/server) || fatal "server build failed"
  success "server"

  info "[3/3] web"
  (
    cd "$REPO_ROOT/apps/web"
    export NEXT_PUBLIC_SOCKET_URL="${NEXT_PUBLIC_SOCKET_URL:-http://localhost:3001}"
    npm run build
  ) || fatal "web build failed"
  success "web"

  success "Build complete"
  du -sh "$REPO_ROOT/apps/server/dist" "$REPO_ROOT/apps/web/.next" 2>/dev/null || true
}

cmd_setup() {
  header "KubeQuest setup wizard"
  resolve_env_file 2>/dev/null || true
  if [[ -z "$ENV_FILE" ]]; then
    ENV_FILE="$REPO_ROOT/env/$ENVIRONMENT.env"
  fi
  if [[ -f "$ENV_FILE" ]]; then
    load_env_file
    if ! prompt_confirm "Overwrite existing $ENV_FILE?" "N"; then
      fatal "aborted"
    fi
  fi
  apply_defaults

  collect_runtime_config
  collect_ports
  collect_urls
  render_summary

  cat > "$ENV_FILE" <<EOF
# Generated by scripts/run-local.sh setup on $(date -u +%Y-%m-%dT%H:%M:%SZ)
ENVIRONMENT=$ENVIRONMENT
NODE_ENV=$NODE_ENV
WEB_MODE=$WEB_MODE

BIND_ADDRESS=$BIND_ADDRESS
NEXT_HOSTNAME=$NEXT_HOSTNAME

SERVER_PORT=$SERVER_PORT
WEB_PORT=$WEB_PORT

CLIENT_URL=$CLIENT_URL
NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
EOF
  success "Wrote $ENV_FILE"
}

tool_version() {
  local tool="$1"
  case "$tool" in
    node) node --version 2>&1 | head -1 ;;
    npm)  npm  --version 2>&1 | head -1 ;;
    *)
      "$tool" --version 2>&1 | head -1 \
        || "$tool" -v 2>&1 | head -1 \
        || echo "(present)"
      ;;
  esac
}

cmd_doctor() {
  header "Pre-flight checks"
  local fails=0

  # Required tools
  for tool in bash node npm curl ss; do
    if command -v "$tool" >/dev/null 2>&1; then
      success "$tool: $(tool_version "$tool")"
    else
      error "$tool: not found"
      fails=$((fails+1))
    fi
  done

  # Node version ≥ 18
  if command -v node >/dev/null 2>&1; then
    local ver
    ver="$(node -e 'process.stdout.write(process.version)' 2>/dev/null || echo v0)"
    local major="${ver#v}"; major="${major%%.*}"
    if (( major < 18 )); then
      error "Node.js 18+ required (got $ver)"
      fails=$((fails+1))
    else
      success "Node.js version: $ver (≥ 18)"
    fi
  fi

  # Optional tools (warn only)
  for tool in git docker; do
    if command -v "$tool" >/dev/null 2>&1; then
      success "$tool: $(tool_version "$tool")"
    else
      warn "$tool: not found (optional)"
    fi
  done

  # Env file — probe without fataling; doctor must never abort mid-run
  local probed_env="${ENV_FILE:-$REPO_ROOT/env/$ENVIRONMENT.env}"
  if [[ -f "$probed_env" ]]; then
    ENV_FILE="$probed_env"
    success "env file: $ENV_FILE"
    load_env_file 2>/dev/null || true
  else
    warn "env file: $probed_env not found — built-in defaults will be used"
    local example="$REPO_ROOT/env/$ENVIRONMENT.env.example"
    [[ -f "$example" ]] && info "  Hint: cp $example $probed_env && edit it"
  fi
  apply_defaults

  # Ports free
  for var in SERVER_PORT WEB_PORT; do
    if validate_port_free "$var" "${!var}" 2>/dev/null; then
      success "$var: ${!var} free"
    else
      error "$var: ${!var} in use"
      fails=$((fails+1))
    fi
  done

  # Shared package built
  if [[ -f "$REPO_ROOT/packages/shared/dist/index.js" ]]; then
    success "shared package: dist/index.js present"
  else
    warn "shared package: not yet built — will be built on start"
  fi

  # node_modules
  if [[ -d "$REPO_ROOT/node_modules" ]]; then
    success "node_modules: present"
  else
    warn "node_modules: missing — run: npm install"
    fails=$((fails+1))
  fi

  if (( fails > 0 )); then
    error "$fails check(s) failed"
    return 1
  fi
  success "All checks passed"
}

cmd_lint() {
  resolve_env_file
  load_env_file
  apply_defaults

  local fails=0
  validate_choice NODE_ENV "$NODE_ENV" development production || fails=$((fails+1))
  validate_choice WEB_MODE "$WEB_MODE" dev prod               || fails=$((fails+1))
  for var in SERVER_PORT WEB_PORT; do
    validate_port "$var" "${!var}" || fails=$((fails+1))
  done
  for var in CLIENT_URL NEXT_PUBLIC_SOCKET_URL; do
    validate_url_syntax "$var" "${!var}" || fails=$((fails+1))
  done

  if (( fails > 0 )); then fatal "$fails validation error(s) in $ENV_FILE"; fi
  success "Env file passes lint: $ENV_FILE"
}

cmd_version() {
  local sha
  sha="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  local pkg_ver
  pkg_ver="$(node -e "console.log(require('$REPO_ROOT/package.json').version)" 2>/dev/null || echo unknown)"
  echo "kubequest: git $sha · version $pkg_ver" >&2
}

usage() {
  cat >&2 <<EOF

${BOLD}scripts/run-local.sh${NC} — interactive dev/prod runner for KubeQuest

${BOLD}Usage:${NC}
  scripts/run-local.sh                              # interactive menu
  scripts/run-local.sh <command> [flags]

${BOLD}Commands:${NC}
  ${CYAN}start${NC}    [-e ENV] [--yes] [--non-interactive]   Configure → validate → start
  ${CYAN}stop${NC}                                            Stop services and clean pidfiles
  ${CYAN}status${NC}                                          Tabular status of all services
  ${CYAN}restart${NC}  [...]                                  stop → start
  ${CYAN}logs${NC}     [server|web|all]                       tail -F selected logs
  ${CYAN}build${NC}                                           Build shared + server + web
  ${CYAN}setup${NC}    [-e ENV]                               Wizard: write env/<ENV>.env
  ${CYAN}doctor${NC}                                          Pre-flight: tool & env checks
  ${CYAN}lint${NC}                                            Validate env file only
  ${CYAN}version${NC}                                         Print git SHA + package version
  ${CYAN}help${NC}                                            This message

${BOLD}Flags:${NC}
  ${DIM}-e, --env ENV${NC}        Environment (dev|prod). Defaults to ENVIRONMENT or "dev".
  ${DIM}-y, --yes${NC}            Accept env-file defaults without prompting.
  ${DIM}--non-interactive${NC}    Fail if any required value is missing.
  ${DIM}--env-file PATH${NC}      Override env file path.
  ${DIM}--log-dir PATH${NC}       Override log directory (default: /tmp/kubequest-logs).

${BOLD}Quick start:${NC}
  scripts/run-local.sh setup          # write env/dev.env
  scripts/run-local.sh start --yes    # start with defaults

${BOLD}URLs (defaults):${NC}
  Teacher create:  http://localhost:3000/create
  Student join:    http://localhost:3000/join
  Server health:   http://localhost:3001/health
  Projector:       http://localhost:3000/leaderboard/<code>?projector=1

EOF
}

# ── Argument parsing ──────────────────────────────────────────────────────────
parse_global_flags() {
  REMAINING=()
  while (( $# > 0 )); do
    case "$1" in
      -e|--env)          ENVIRONMENT="$2"; shift 2 ;;
      --env-file)        ENV_FILE="$2"; shift 2 ;;
      --log-dir)         LOG_DIR="$2"; mkdir -p "$LOG_DIR"
                         SERVER_PIDFILE="$LOG_DIR/server.pid"
                         WEB_PIDFILE="$LOG_DIR/web.pid"
                         shift 2 ;;
      -y|--yes)          YES=1; shift ;;
      --non-interactive) NON_INTERACTIVE=1; shift ;;
      *)                 REMAINING+=("$1"); shift ;;
    esac
  done
}

main() {
  REMAINING=()
  parse_global_flags "$@"
  set -- "${REMAINING[@]+"${REMAINING[@]}"}"

  local cmd="${1:-}"
  shift 2>/dev/null || true

  if [[ -z "$cmd" ]]; then
    if (( YES )) || (( NON_INTERACTIVE )); then
      usage; fatal "no command given (cannot prompt with --yes/--non-interactive)"
    fi
    _prompt_select "What would you like to do?" "start" \
      "start" "stop" "status" "restart" "logs" "build" "setup" "doctor" "lint" "version" "help"
    cmd="$PROMPT_RESULT"
  fi

  case "$cmd" in
    start)               cmd_start   "$@" ;;
    stop)                cmd_stop    "$@" ;;
    status)              cmd_status  "$@" ;;
    restart)             cmd_restart "$@" ;;
    logs)                cmd_logs    "$@" ;;
    build)               cmd_build   "$@" ;;
    setup)               cmd_setup   "$@" ;;
    doctor)              cmd_doctor  "$@" ;;
    lint)                cmd_lint    "$@" ;;
    version|-v|--version) cmd_version ;;
    help|-h|--help)      usage ;;
    *)                   error "Unknown command: $cmd"; usage; exit 1 ;;
  esac
}

main "$@"
