#!/bin/bash
set -e

# Script location awareness
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
NOMAD_JOBS_DIR="${INFRA_DIR}/nomad/jobs"
VAR_FILES_DIR="${INFRA_DIR}/nomad/variables"

ENVIRONMENT=${1:-production}
PR_NUMBER=${2:-""}
IMAGE_TAG=${3:-latest}
NOMAD_ADDR=${NOMAD_ADDR:-http://localhost:4646}

echo "Script running from: $(pwd)"
echo "Jobs directory: ${NOMAD_JOBS_DIR}"

# Verify files exist
for job in caddy aipacto-server aipacto-web; do
    if [[ ! -f "${NOMAD_JOBS_DIR}/${job}.nomad" ]]; then
        echo "Error: ${NOMAD_JOBS_DIR}/${job}.nomad not found"
        exit 1
    fi
done

# Handle PR environment
if [[ "$ENVIRONMENT" == "pr" ]]; then
    NAMESPACE="pr-$PR_NUMBER"
    IMAGE_TAG="${IMAGE_TAG:-pr-$PR_NUMBER}"
    
    # Create namespace
    nomad namespace apply -description "PR #$PR_NUMBER" "$NAMESPACE" 2>/dev/null || true
    
    # Deploy with command-line variables (not var-file for PR)
    for job in caddy aipacto-server aipacto-web; do
        echo "Deploying $job to namespace $NAMESPACE..."
        nomad job run \
            -namespace="$NAMESPACE" \
            -var="datacenter=pr-${PR_NUMBER}" \
            -var="namespace=pr-${PR_NUMBER}" \
            -var="environment=pr" \
            -var="version=pr-${PR_NUMBER}" \
            -var="image_tag=${IMAGE_TAG}" \
            -var="server_count=1" \
            -var="server_cpu=200" \
            -var="server_memory=512" \
            -var="web_count=1" \
            -var="web_cpu=100" \
            -var="web_memory=256" \
            -var="caddy_count=1" \
            -var="api_url=http://pr-${PR_NUMBER}.pr.aipacto.com" \
            -var="log_level=debug" \
            -var="db_password=pr-password" \
            -var="pr_number=${PR_NUMBER}" \
            "${NOMAD_JOBS_DIR}/${job}.nomad"
    done
else
    # Production/staging use static var files
    if [[ ! -f "${VAR_FILES_DIR}/${ENVIRONMENT}.vars" ]]; then
        echo "Error: ${VAR_FILES_DIR}/${ENVIRONMENT}.vars not found"
        exit 1
    fi
    
    for job in caddy aipacto-server aipacto-web; do
        echo "Deploying $job..."
        nomad job run \
            -var-file="${VAR_FILES_DIR}/${ENVIRONMENT}.vars" \
            -var="image_tag=${IMAGE_TAG}" \
            "${NOMAD_JOBS_DIR}/${job}.nomad"
    done
fi

echo "Deployment complete"
