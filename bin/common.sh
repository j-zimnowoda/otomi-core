#!/usr/local/env bash
ENV_DIR=${ENV_DIR:-./env}

readonly otomiSettings="$ENV_DIR/env/settings.yaml"
readonly clustersFile="$ENV_DIR/env/clusters.yaml"
readonly helmfileOutputHide="(^\W+$|skipping|basePath=|Decrypting)"
readonly helmfileOutputHideTpl="(^[\W^-]+$|skipping|basePath=|Decrypting)"
readonly replacePathsPattern="s@../env@${ENV_DIR}@g"

get_k8s_version() {
  # double quotes needed for variables!
  yq e ".clouds.$CLOUD.clusters.$CLUSTER.k8sVersion" $clustersFile
}

otomi_image_tag() {
  # double quotes needed for variables!
  local otomiVersion=$(yq e ".clouds.$CLOUD.clusters.$CLUSTER.otomiVersion" $clustersFile)
  [[ -n $otomiVersion ]] && echo $otomiVersion || echo 'latest'
}

customer_name() {
  yq e '.customer.name' $otomiSettings
}

check_sops_file() {
  [[ ! -f "$ENV_DIR/.sops.yaml" ]] && (
    echo "Error: The $ENV_DIR/.sops.yaml does not exists"
    exit 1
  )
  return 0
}

hf() {
  helmfile --quiet -e $CLOUD-$CLUSTER $@
}

hf_values() {
  [ "${VERBOSE-'false'}" = 'false' ] && quiet='--quiet'
  helmfile ${quiet-} -e "$CLOUD-$CLUSTER" -f helmfile.tpl/helmfile-dump.yaml build | grep -Ev $helmfileOutputHide | sed -e $replacePathsPattern |
    yq e '.releases[0].values[0]' -
}

prepare_crypt() {
  [[ -z "$GCLOUD_SERVICE_KEY" ]] && echo "Error: The GCLOUD_SERVICE_KEY environment variable is not set" && exit 2
  GOOGLE_APPLICATION_CREDENTIALS="/tmp/key.json"
  echo $GCLOUD_SERVICE_KEY >$GOOGLE_APPLICATION_CREDENTIALS
  export GOOGLE_APPLICATION_CREDENTIALS
}

for_each_cluster() {
  # Perform a command from argument for each cluster
  executable=$1
  [[ -z "$executable" ]] && echo "ERROR: the positional argument is not set"
  local clustersPath="$ENV_DIR/env/clusters.yaml"
  clouds=$(yq -j e '.clouds' $clustersPath | jq -rc '.|keys[]')
  for cloud in $clouds; do
    # double quotes needed for variables!
    clusters=($(yq -j e ".clouds.${cloud}.clusters" $clustersPath | jq -rc '. | keys[]'))
    for cluster in "${clusters[@]}"; do
      CLOUD=$cloud CLUSTER=$cluster $executable
    done
  done
}
