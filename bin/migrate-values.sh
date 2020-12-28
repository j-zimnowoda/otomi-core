#!/bin/bash

set -e

docker run --rm otomi/tasks:migrate-values npm run tasks:migrate-values
