#!/usr/bin/env bash
set -euo pipefail

ENV_DIR=${ENV_DIR:-'./env'}

readonly project=$(yq e '.clouds.google.projectId' $ENV_DIR/env/clusters.yaml)
readonly google_region=$(yq e '.clouds.google.clusters.$CLUSTER.region' $ENV_DIR/env/clusters.yaml)
readonly customer=$(yq e '.customer.name' $ENV_DIR/env/settings.yaml)

# delete the cluster
gcloud container --project "$project" clusters delete "$customer-gke-$CLUSTER" --region "$google_region"
