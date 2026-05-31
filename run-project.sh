#!/usr/bin/env bash
set -euo pipefail

# run-project.sh
# Single-command runner: fixes ownership (sudo), builds backends, builds frontend,
# then starts the entire stack using the single `docker-compose.yml`.
# Usage: ./run-project.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "Attempting to fix file ownership for build targets..."
if sudo -n true 2>/dev/null; then
  sudo chown -R $(id -u):$(id -g) gateway/*/target services/*/target frontend/dist || true
else
  echo "Skipping ownership fix (sudo password required)."
fi

echo "Building backend modules (maven)..."
for m in gateway/api-gateway services/*; do
  if [ -f "$m/pom.xml" ]; then
    echo "  mvn -f $m/pom.xml clean package -DskipTests"
    mvn -f "$m/pom.xml" clean package -DskipTests
  fi
done

if [ -d frontend ]; then
  echo "Building frontend (npm)..."
  pushd frontend >/dev/null
  npm ci
  npm run build
  popd >/dev/null
fi

echo "Starting docker-compose (build and detach)..."
docker compose up --build -d

echo "All done. Follow logs with: docker compose logs -f" 
