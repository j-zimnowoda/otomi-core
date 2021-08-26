set -e

export VAULT_ADDR=http://vault.vault.svc.cluster.local:8200
export VAULT_TOKEN=bladiebla

vault secrets enable pki