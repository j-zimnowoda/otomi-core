#!/bin/bash

set -e

. bin/common.sh

migrate_values_dir=/app/dist/tasks/migrate-values

# PARAMETERS
env_dir=${migrate_values_dir}/env
changes=${migrate_values_dir}/mock-changes.yaml
schema=mock.yaml
op=displacements

function migrate_values() {
  _rind "otomi/tasks:mv" "npm run task:migrate-values" -- \
    --schema ${schema} \
    --env-dir ${env_dir} \
    --changes ${changes} \
    --file ${file} \
    --op ${op}
  return $?
}

migrate_values