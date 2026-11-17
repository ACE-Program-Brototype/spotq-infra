
#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="/opt/spotq/infra"
BRANCH="main"
COMPOSE_FILE="docker-compose/docker-compose.yml"
ENV_FILE="deploy/images.lock.env"

cd "$REPO_DIR"

# Remember the currently deployed configuration.
OLD_COMMIT="$(git rev-parse HEAD)"

echo "Fetching latest infrastructure configuration..."

# Checkout only deployment-related directories.
git sparse-checkout init --cone
git sparse-checkout set deploy docker-compose

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "Validating Compose configuration..."

if ! docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" config -q; then
  echo "Invalid Compose configuration. Restoring previous commit."
  git reset --hard "$OLD_COMMIT"
  exit 1
fi

echo "Pulling updated images..."

if ! docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" pull; then
  echo "Image pull failed. Restoring previous commit."
  git reset --hard "$OLD_COMMIT"
  exit 1
fi

echo "Starting updated services..."

if docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" \
  up -d --wait --wait-timeout 180; then

  echo "Deployment successful."
  exit 0
fi

echo "Deployment failed. Rolling back to $OLD_COMMIT"

git reset --hard "$OLD_COMMIT"

docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" \
  pull

docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" \
  up -d --wait --wait-timeout 180

echo "Rollback completed. Reporting deployment failure."
exit 1
