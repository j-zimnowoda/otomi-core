#!/bin/bash

set -e

path_to_values_schema=$1
if [ $# -ne 1 ]; then
  echo "Usage: $0  <path_to_values_schema>"
  echo "Where:"
  echo "   <path_to_values_schema> = Path to values-schema.yaml"
  exit 2
fi

set +e

yellow=$(tput setaf 3)
reset=$(tput sgr0)

echo "${yellow}CHANGES${reset}"
# yq r values-schema.yaml changes

previousRevision=""
git rev-list origin..HEAD | while read -r rev; do
  rev_path="$rev:${path_to_values_schema}"

  git cat-file -e $rev_path 2>/dev/null
  if [ $? -eq 0 ]; then
    currentRevision=$(git show "$rev_path" | yq r - changes)
    isChanged=$(comm -23 <(echo $currentRevision) <(echo $previousRevision))
    if [ "$isChanged" != "" ]; then
      echo "REV: $rev"
      git show "$rev_path" | yq r - changes
      echo "---"
    fi
  fi

  previousRevision="$currentRevision"
done
