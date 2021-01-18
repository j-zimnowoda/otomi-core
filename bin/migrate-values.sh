#!/bin/bash

set -e

docker run \
  -v ${ENV_DIR}/env:/app/dist/tasks/migrate-values/env \
  -v ${PWD}/bin/mock-changes.yaml:/app/dist/tasks/migrate-values/mock-changes.yaml \
  --rm \
  otomi/tasks:migrate-values npm run tasks:migrate-values -- \
  --env-dir /app/dist/tasks/migrate-values/env \
  --changes /app/dist/tasks/migrate-values/mock-changes.yaml \
  --file mock.yaml \
  --op displacements
