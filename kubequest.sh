#!/usr/bin/env bash
# KubeQuest — Master control script
# Usage: ./kubequest.sh [command]
#
# Commands:
#   setup        Install all dependencies and set up env files
#   dev          Start development servers (server + web)
#   build        Build all packages for production
#   start        Start production servers
#   test         Run all tests
#   lint         Run TypeScript type checks
#   clean        Remove node_modules and build artifacts
#   deploy:docker  Build Docker images and run with docker-compose
#   deploy:pm2   Deploy with PM2 process manager
#   help         Show this help message

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()    { echo -e "${CYAN}[kubequest]${NC} $*"; }
success(){ echo -e "${GREEN}✓${NC} $*"; }
warn()   { echo -e "${YELLOW}⚠${NC} $*"; }
error()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

banner() {
  echo ""
  echo -e "${BLUE}${BOLD}  ⎈  KubeQuest — Kubernetes Learning Game${NC}"
  echo -e "${BLUE}  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# ── Dependency checks ────────────────────────────────────────────────────────
check_deps() {
  local missing=0
  for cmd in node npm; do
    if ! command -v "$cmd" &>/dev/null; then
      warn "Missing: $cmd"
      missing=$((missing + 1))
    fi
  done
  [[ $missing -gt 0 ]] && error "Install missing dependencies first."
  local node_ver
  node_ver=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>&1) || \
    error "Node.js 18+ required. Current: $(node --version)"
  success "Node.js $(node --version), npm $(npm --version)"
}

# ── Setup ────────────────────────────────────────────────────────────────────
cmd_setup() {
  banner
  log "Setting up KubeQuest..."
  check_deps

  # Copy env files if they don't exist
  for envfile in \
    ".env:apps/server/.env" \
    ".env.web:apps/web/.env.local"; do
    src="${envfile%%:*}"
    dst="${envfile##*:}"
    example="${dst}.example"
    if [[ ! -f "$dst" && -f "$example" ]]; then
      cp "$example" "$dst"
      success "Created $dst from example"
    fi
  done

  if [[ ! -f "apps/server/.env" ]]; then
    cp "apps/server/.env.example" "apps/server/.env" 2>/dev/null || true
  fi
  if [[ ! -f "apps/web/.env.local" ]]; then
    cp "apps/web/.env.example" "apps/web/.env.local" 2>/dev/null || true
  fi

  log "Installing dependencies..."
  npm install --workspaces

  log "Building shared package..."
  npm run build --workspace=packages/shared

  success "Setup complete! Run './kubequest.sh dev' to start development servers."
}

# ── Dev ───────────────────────────────────────────────────────────────────────
cmd_dev() {
  banner
  check_deps
  log "Starting development servers..."
  log "  Server: http://localhost:3001"
  log "  Web:    http://localhost:3000"
  echo ""

  if ! command -v concurrently &>/dev/null && ! npx --yes concurrently --version &>/dev/null 2>&1; then
    npm install --save-dev concurrently
  fi

  # Build shared first
  npm run build --workspace=packages/shared 2>/dev/null || true

  npm run dev
}

# ── Build ─────────────────────────────────────────────────────────────────────
cmd_build() {
  banner
  check_deps
  log "Building all packages..."

  log "  [1/3] Building shared types..."
  npm run build --workspace=packages/shared

  log "  [2/3] Building server..."
  npm run build --workspace=apps/server

  log "  [3/3] Building web app..."
  npm run build --workspace=apps/web

  success "Build complete!"
  du -sh apps/server/dist apps/web/.next 2>/dev/null || true
}

# ── Start (production) ────────────────────────────────────────────────────────
cmd_start() {
  banner
  log "Starting production servers..."

  if [[ ! -d "apps/server/dist" ]]; then
    warn "Server not built. Running build first..."
    cmd_build
  fi

  log "Starting server on port ${PORT:-3001}..."
  (cd apps/server && node dist/index.js &)
  SERVER_PID=$!

  log "Starting web on port 3000..."
  (cd apps/web && npm run start &)
  WEB_PID=$!

  log "Services started. PID server=$SERVER_PID web=$WEB_PID"
  log "Press Ctrl+C to stop."
  trap "kill $SERVER_PID $WEB_PID 2>/dev/null; exit 0" INT TERM
  wait
}

# ── Test ──────────────────────────────────────────────────────────────────────
cmd_test() {
  banner
  log "Running type checks and tests..."

  log "  Checking shared types..."
  (cd packages/shared && npx tsc --noEmit 2>&1 | head -50 || warn "Type errors in shared package")

  log "  Checking server types..."
  (cd apps/server && npx tsc --noEmit 2>&1 | head -50 || warn "Type errors in server")

  log "  Checking web types..."
  (cd apps/web && npx tsc --noEmit 2>&1 | head -50 || warn "Type errors in web")

  success "Type checks complete."
}

# ── Lint ──────────────────────────────────────────────────────────────────────
cmd_lint() {
  banner
  log "Running TypeScript checks across all packages..."
  npm run typecheck 2>/dev/null || {
    warn "typecheck script not found, running tsc directly..."
    for pkg in packages/shared apps/server apps/web; do
      log "  Checking $pkg..."
      (cd "$pkg" && npx tsc --noEmit 2>&1 | head -30) || true
    done
  }
  success "Lint complete."
}

# ── Clean ─────────────────────────────────────────────────────────────────────
cmd_clean() {
  banner
  log "Cleaning build artifacts and node_modules..."
  read -rp "$(echo -e "${YELLOW}This will delete node_modules and dist. Continue? [y/N] ${NC}")" confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }

  find . -name 'node_modules' -type d -prune -exec rm -rf {} + 2>/dev/null || true
  find . -name 'dist' -type d -prune -exec rm -rf {} + 2>/dev/null || true
  find . -name '.next' -type d -prune -exec rm -rf {} + 2>/dev/null || true
  find . -name '*.tsbuildinfo' -delete 2>/dev/null || true

  success "Clean complete."
}

# ── Docker deploy ─────────────────────────────────────────────────────────────
cmd_deploy_docker() {
  banner
  if ! command -v docker &>/dev/null; then error "Docker not installed."; fi
  if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
    error "docker-compose not installed."
  fi

  log "Building Docker images..."
  if [[ -f "docker-compose.yml" ]]; then
    docker compose build
    docker compose up -d
    success "Containers started. Run 'docker compose logs -f' to view logs."
  else
    warn "docker-compose.yml not found. Generating one..."
    generate_docker_compose
    docker compose build
    docker compose up -d
    success "Deployed via Docker Compose."
  fi
}

generate_docker_compose() {
  cat > docker-compose.yml << 'DOCKER'
version: '3.8'
services:
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - CLIENT_URL=http://localhost:3000
      - NODE_ENV=production
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
    depends_on:
      - server
    restart: unless-stopped
DOCKER

  cat > Dockerfile.server << 'DOCKER'
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

FROM base AS deps
RUN npm install --workspaces

FROM deps AS build
COPY . .
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/server

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./node_modules/@kubequest/shared/dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
DOCKER

  cat > Dockerfile.web << 'DOCKER'
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

FROM base AS deps
RUN npm install --workspaces

FROM deps AS build
COPY . .
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./.next/static
COPY --from=build /app/apps/web/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
DOCKER

  success "Generated docker-compose.yml and Dockerfiles."
}

# ── PM2 deploy ────────────────────────────────────────────────────────────────
cmd_deploy_pm2() {
  banner
  if ! command -v pm2 &>/dev/null; then
    log "Installing PM2 globally..."
    npm install -g pm2
  fi

  cmd_build

  log "Creating PM2 ecosystem config..."
  cat > ecosystem.config.js << 'PM2'
module.exports = {
  apps: [
    {
      name: 'kubequest-server',
      script: 'apps/server/dist/index.js',
      env: { NODE_ENV: 'production', PORT: 3001, CLIENT_URL: 'http://localhost:3000' },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },
    {
      name: 'kubequest-web',
      cwd: 'apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: { NODE_ENV: 'production', NEXT_PUBLIC_SOCKET_URL: 'http://localhost:3001' },
      instances: 1,
      autorestart: true,
    },
  ],
};
PM2

  pm2 start ecosystem.config.js
  pm2 save
  success "KubeQuest deployed with PM2. Run 'pm2 status' to monitor."
}

# ── Help ──────────────────────────────────────────────────────────────────────
cmd_help() {
  banner
  echo -e "${BOLD}Usage:${NC} ./kubequest.sh <command>"
  echo ""
  echo -e "${BOLD}Commands:${NC}"
  printf "  ${GREEN}%-20s${NC} %s\n" "setup"         "Install dependencies, copy env files"
  printf "  ${GREEN}%-20s${NC} %s\n" "dev"           "Start dev servers (hot-reload)"
  printf "  ${GREEN}%-20s${NC} %s\n" "build"         "Build all packages for production"
  printf "  ${GREEN}%-20s${NC} %s\n" "start"         "Start production build"
  printf "  ${GREEN}%-20s${NC} %s\n" "test"          "TypeScript type checking"
  printf "  ${GREEN}%-20s${NC} %s\n" "lint"          "Alias for test"
  printf "  ${GREEN}%-20s${NC} %s\n" "clean"         "Remove all build artifacts"
  printf "  ${GREEN}%-20s${NC} %s\n" "deploy:docker" "Build and run with Docker Compose"
  printf "  ${GREEN}%-20s${NC} %s\n" "deploy:pm2"    "Deploy with PM2 process manager"
  printf "  ${GREEN}%-20s${NC} %s\n" "help"          "Show this help"
  echo ""
  echo -e "${BOLD}Quick start:${NC}"
  echo "  ./kubequest.sh setup"
  echo "  ./kubequest.sh dev"
  echo ""
  echo -e "${BOLD}URLs:${NC}"
  echo "  Student join:   http://localhost:3000/join"
  echo "  Teacher create: http://localhost:3000/create"
  echo "  Server health:  http://localhost:3001/health"
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
COMMAND="${1:-help}"
case "$COMMAND" in
  setup)          cmd_setup ;;
  dev)            cmd_dev ;;
  build)          cmd_build ;;
  start)          cmd_start ;;
  test|typecheck) cmd_test ;;
  lint)           cmd_lint ;;
  clean)          cmd_clean ;;
  deploy:docker)  cmd_deploy_docker ;;
  deploy:pm2)     cmd_deploy_pm2 ;;
  help|--help|-h) cmd_help ;;
  *)              warn "Unknown command: $COMMAND"; cmd_help ;;
esac
