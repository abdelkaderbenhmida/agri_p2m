#!/usr/bin/env bash
set -euo pipefail

# Usage: ./install-plugins.sh <jenkins-container-name>
# This copies scripts/jenkins/plugins.txt into the Jenkins container and runs jenkins-plugin-cli.

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <jenkins-container-name>"
  exit 2
fi
CONTAINER="$1"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Container '${CONTAINER}' not found. Start Jenkins container first." >&2
  exit 3
fi

echo "Copying plugins list to container..."
docker cp "$(pwd)/plugins.txt" "${CONTAINER}:/tmp/plugins.txt"

echo "Installing plugins via jenkins-plugin-cli inside container..."
docker exec -u root -it "${CONTAINER}" bash -c 'jenkins-plugin-cli --plugin-file /tmp/plugins.txt --verbose'

echo "Plugin install finished. Restarting Jenkins..."
docker exec -u root -it "${CONTAINER}" bash -c 'jenkins-cli -s http://localhost:8080/ safe-restart' || true

echo "Done. Monitor Jenkins logs for plugin install progress."
