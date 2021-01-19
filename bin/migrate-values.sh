#!/bin/bash

set -e

migrate_values_dir=/app/dist/tasks/migrate-values

# PARAMETERS
env_dir=${migrate_values_dir}/env
changes=${migrate_values_dir}/mock-changes.yaml
file=mock.yaml
op=displacements

docker run \
  -v ${ENV_DIR}/env:${env_dir} \
  -v ${PWD}/bin/mock-changes.yaml:${migrate_values_dir}/mock-changes.yaml \
  --rm \
  otomi/tasks:migrate-values npm run tasks:migrate-values -- \
  --env-dir ${env_dir} \
  --changes ${changes} \
  --file ${file} \
  --op ${op}
