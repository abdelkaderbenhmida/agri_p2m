#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
IMAGE_NAME="agri-jenkins-controller:local"
CONTAINER_NAME="agri-jenkins"
JENKINS_HOME_VOLUME="agri_jenkins_home_v3"

DOCKER_GID="$(getent group docker | cut -d: -f3 || true)"
if [[ -z "${DOCKER_GID}" ]]; then
  DOCKER_GID="999"
fi

echo "Building Jenkins controller image..."
docker build -t "${IMAGE_NAME}" -f "${SCRIPT_DIR}/Dockerfile" "${SCRIPT_DIR}"

echo "Starting Jenkins controller container..."
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
docker volume create "${JENKINS_HOME_VOLUME}" >/dev/null

docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  --group-add "${DOCKER_GID}" \
  --add-host=host.docker.internal:host-gateway \
  -p 8081:8080 \
  -p 50000:50000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "${REPO_ROOT}":"${REPO_ROOT}" \
  -v "${JENKINS_HOME_VOLUME}":/var/jenkins_home \
  -e REPO_ROOT="${REPO_ROOT}" \
  -e JAVA_OPTS='-Djenkins.install.runSetupWizard=false' \
  "${IMAGE_NAME}" >/dev/null

echo "Waiting for Jenkins to become ready..."
for _ in $(seq 1 120); do
  if curl -fsS http://localhost:8081/login >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Waiting for agri-local job to be created and started by Jenkins init scripts..."
for _ in $(seq 1 60); do
  if curl -fsS -u admin:admin http://localhost:8081/job/agri-local/api/json >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Jenkins controller is running at http://localhost:8081"
echo "Username/password: admin / admin"
echo "Follow logs with: docker logs -f ${CONTAINER_NAME}"
