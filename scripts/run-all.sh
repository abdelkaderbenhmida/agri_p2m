#!/usr/bin/env bash
set -euo pipefail

# scripts/run-all.sh
# Convenience script to build backend jars, build frontend, build & push images,
# and start the docker-compose stack used for local development.
# Usage:
#   ./scripts/run-all.sh         # full build, push to localhost:5000, start compose
#   ./scripts/run-all.sh --quick # skip builds and pushes, just start compose
#   ./scripts/run-all.sh --no-push # build images but don't push

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

QUICK=false
NO_PUSH=false
for arg in "$@"; do
  case "$arg" in
    --quick) QUICK=true ;; 
    --no-push) NO_PUSH=true ;; 
    -h|--help)
      sed -n '1,120p' "$0"
      exit 0
      ;;
  esac
done

echo "Root: $ROOT_DIR"

check_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command '$1' not found. Install it and re-run." >&2
    exit 2
  fi
}

check_cmd mvn
check_cmd npm
check_cmd docker

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose subcommand not available; make sure Docker CLI v2 (docker compose) is installed." >&2
  # continue: some systems have docker-compose as separate binary; try to accept that
fi

if [ "$QUICK" = true ]; then
  echo "Quick mode: skipping builds and pushes. Starting compose..."
  docker compose up -d
  echo "Compose started (quick)."
  exit 0
fi

echo "[0/4] Starting local registry..."
docker compose up -d registry
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:5000/v2/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[1/4] Building backend modules (mvn clean package -DskipTests)..."
for m in gateway/api-gateway services/*; do
  if [ -f "$m/pom.xml" ]; then
    echo "  Building $m"
    mvn -f "$m/pom.xml" clean package -DskipTests
  fi
done

echo "[2/4] Building frontend (npm ci && npm run build)..."
if [ -d frontend ]; then
  pushd frontend >/dev/null
  npm ci
  npm run build
  popd >/dev/null
fi

echo "[3/4] Building Docker images (tags: localhost:5000/agri/<name>:latest and :local-test)..."
images=(
  'api-gateway:gateway/api-gateway'
  'catalog-service:services/catalog-service'
  'jobs-service:services/jobs-service'
  'messaging-service:services/messaging-service'
  'order-service:services/order-service'
  'payment-service:services/payment-service'
  'delivery-service:services/delivery-service'
  'auth-service:services/auth-service'
  'user-service:services/user-service'
  'frontend:frontend'
)

for item in "${images[@]}"; do
  name="${item%%:*}"
  context="${item#*:}"
  echo "--- building ${name} from ${context} ---"
  docker build -t localhost:5000/agri/${name}:latest -t localhost:5000/agri/${name}:local-test "${context}"
  if [ "$NO_PUSH" = false ]; then
    echo "--- pushing ${name} ---"
    docker push localhost:5000/agri/${name}:latest
    docker push localhost:5000/agri/${name}:local-test
  else
    echo "--- skipping push for ${name} (no-push) ---"
  fi
done

echo "[4/4] Starting compose stack..."
docker compose up -d

echo "Done. Use 'docker compose logs -f' to follow logs and the health endpoints to verify services." 
