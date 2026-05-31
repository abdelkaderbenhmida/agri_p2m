#!/usr/bin/env bash
set -euo pipefail

# Lightweight bootstrap to run the project locally with a registry and compose
# Usage: ./scripts/run-locally.sh [--skip-build]

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_BUILD=0

if [[ "${1:-}" == "--skip-build" ]]; then
  SKIP_BUILD=1
fi

# Start local registry if not running
if ! docker ps --format '{{.Names}}' | grep -q '^agri-registry$'; then
  echo "Starting local registry: localhost:5000"
  docker run -d --restart=unless-stopped --name agri-registry -p 5000:5000 registry:2
else
  echo "Local registry already running"
fi

cd "${REPO_ROOT}"

if [[ "${SKIP_BUILD}" -eq 0 ]]; then
  echo "Building backend modules and frontend (this may take several minutes)..."
  (
    mvn -f gateway/api-gateway/pom.xml clean package -DskipTests || true
    mvn -f services/catalog-service/pom.xml clean package -DskipTests || true
    mvn -f services/jobs-service/pom.xml clean package -DskipTests || true
    mvn -f services/messaging-service/pom.xml clean package -DskipTests || true
    mvn -f services/order-service/pom.xml clean package -DskipTests || true
    mvn -f services/payment-service/pom.xml clean package -DskipTests || true
    mvn -f services/delivery-service/pom.xml clean package -DskipTests || true
    mvn -f services/auth-service/pom.xml clean package -DskipTests || true
    mvn -f services/user-service/pom.xml clean package -DskipTests || true
    echo "Building frontend..."
    cd frontend
    npm ci --silent || true
    npm run build || true
  ) > /tmp/agri-build.log 2>&1 &
  echo "Build started in background (logs: /tmp/agri-build.log)"
else
  echo "Skipping build as requested"
fi

# Build and push images to local registry
images=(
  "api-gateway:gateway/api-gateway"
  "catalog-service:services/catalog-service"
  "jobs-service:services/jobs-service"
  "messaging-service:services/messaging-service"
  "order-service:services/order-service"
  "payment-service:services/payment-service"
  "delivery-service:services/delivery-service"
  "auth-service:services/auth-service"
  "user-service:services/user-service"
  "frontend:frontend"
)

for item in "${images[@]}"; do
  name="${item%%:*}"
  context="${item#*:}"
  echo "Building ${name}..."
  docker build -t localhost:5000/agri/${name}:latest -t localhost:5000/agri/${name}:local-test "${context}"
  echo "Pushing ${name}..."
  docker push localhost:5000/agri/${name}:latest
  docker push localhost:5000/agri/${name}:local-test
done

# Start compose stack
echo "Starting docker compose stack (microservices + fast overlay)..."
docker compose -f docker-compose.microservices.yml -f docker-compose.fast.yml up -d

echo "All done. Gateway: http://localhost:8080 Actuator health -> /actuator/health"
echo "Frontend: http://localhost:4200"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000"

echo "If you want to run the local Jenkins controller, see scripts/jenkins/README.md"
