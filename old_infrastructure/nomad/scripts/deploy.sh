#!/usr/bin/env bash
set -Eeuo pipefail

# Usage: deploy.sh <environment> [pr_number] [image_tag]
# Examples:
#   ./deploy.sh production
#   ./deploy.sh staging
#   ./deploy.sh pr 123
#   ./deploy.sh pr 123 pr-123

ENVIRONMENT="${1:-production}"
PR_NUMBER="${2:-}"
IMAGE_TAG_DEFAULT="${3:-latest}"

: "${NOMAD_ADDR:?NOMAD_ADDR must be set, e.g. http://<nomad-ip>:4646}"

# --- Paths (independent of CWD) ---
SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
NOMAD_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
JOBS_DIR="$NOMAD_DIR/jobs"
VARS_DIR="$NOMAD_DIR/variables"

# --- Configurable waits ---
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-180}" # overall wait per job for "running" status

# --- Helpers ---
die() { echo "❌ $*" >&2; exit 1; }

trap 'echo "❌ Error on line $LINENO while running: ${BASH_COMMAND}"; exit 99' ERR

ensure_file() {
  local file="$1" label="${2:-file}"
  [[ -f "$file" ]] || die "$label not found: $file"
}

retry() {
  local max="${1:-3}"; shift
  local wait="${1:-2}"; shift
  local attempt=1
  while true; do
    if "$@"; then return 0; fi
    local rc=$?
    if (( attempt >= max )); then
      echo "❌ Command failed after ${attempt} attempts (rc=$rc): $*" >&2
      return "$rc"
    fi
    echo "⚠️  Command failed (rc=$rc). Retrying in ${wait}s... ($attempt/$max): $*"
    sleep "$wait"
    attempt=$((attempt+1))
    wait=$((wait*2))
  done
}

nomad_reachable() {
  retry 5 2 nomad status >/dev/null 2>&1
}

job_status_text() {
  # Extract the first "Status = X" (or "Status: X") line from `nomad job status`
  # Return lowercase status, or "unknown" if not parsable.
  local job="$1" ns="$2"
  local out
  if ! out="$(nomad job status -namespace="$ns" "$job" 2>/dev/null)"; then
    echo "unknown"
    return 1
  fi
  # Handle both "=" and ":" formats; print first occurrence only
  echo "$out" | awk '
    BEGIN{IGNORECASE=1}
    /^[[:space:]]*Status[[:space:]]*[=:]/{
      split($0,a,/[=:]/);
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", a[2]);
      s=tolower(a[2]);
      print s; exit
    }'
}

wait_for_running() {
  local job="$1" ns="$2"
  local waited=0
  while (( waited < TIMEOUT_SECONDS )); do
    local st
    st="$(job_status_text "$job" "$ns" || true)"
    case "$st" in
      running) echo "✅ $job is running in namespace '$ns'."; return 0 ;;
      dead|failed) die "Job '$job' entered status: $st" ;;
      *) printf "." ;;
    esac
    sleep "$SLEEP_SECONDS"
    waited=$((waited + SLEEP_SECONDS))
  done
  echo
  die "Timed out after ${TIMEOUT_SECONDS}s waiting for job '$job' to be running."
}

validate_job() {
  local jobfile="$1"
  shift || true
  retry 3 2 nomad job validate "$@" "$jobfile" >/dev/null
}

run_job() {
  local jobfile="$1" jobname="$2"
  shift 2 || true
  retry 3 2 nomad job run -detach "$@" "$jobfile" >/dev/null
}

# --- Echo context ---
echo "Deploying jobs"
echo "  NOMAD_ADDR = $NOMAD_ADDR"
echo "  ENV        = $ENVIRONMENT"
[[ -n "$PR_NUMBER" ]] && echo "  PR_NUMBER  = $PR_NUMBER"
echo "  NOMAD_DIR  = $NOMAD_DIR"

# --- Choose var-file by environment ---
case "$ENVIRONMENT" in
  production) VARFILE="$VARS_DIR/production.vars" ;;
  staging)    VARFILE="$VARS_DIR/staging.vars" ;;
  pr)         VARFILE="$VARS_DIR/pr.vars" ;;
  *) die "Unknown environment: $ENVIRONMENT" ;;
esac

ensure_file "$VARFILE" "Variable file"

# --- Ensure Nomad reachable ---
nomad_reachable || die "Cannot talk to Nomad at $NOMAD_ADDR"

# --- Namespace & image tag handling ---
NAMESPACE="default"
EXTRA_VARS=()
if [[ "$ENVIRONMENT" == "pr" ]]; then
  [[ -n "$PR_NUMBER" ]] || die "PR environment requires PR_NUMBER"
  NAMESPACE="pr-$PR_NUMBER"
  # Idempotent namespace creation/update with retries
  retry 3 2 nomad namespace apply -description "PR #$PR_NUMBER environment" "$NAMESPACE" >/dev/null
  EXTRA_VARS+=(-var "pr_number=$PR_NUMBER")
  IMAGE_TAG="${IMAGE_TAG_DEFAULT:-pr-$PR_NUMBER}"
else
  IMAGE_TAG="$IMAGE_TAG_DEFAULT"
fi

# --- Common vars ---
COMMON_VARS=(
  -var-file="$VARFILE"
  -var "image_tag=$IMAGE_TAG"
)

# --- Jobs in order ---
JOBS=(caddy aipacto-server aipacto-web)

# --- Deploy loop ---
for job in "${JOBS[@]}"; do
  JOB_FILE="$JOBS_DIR/$job.nomad"
  ensure_file "$JOB_FILE" "Job file"
  echo "🚀 Deploying job: $job (namespace: $NAMESPACE)"
  # Validate before running (helps catch var issues)
  validate_job "$JOB_FILE" "${COMMON_VARS[@]}" "${EXTRA_VARS[@]}"
  # Run (detached) with retries and namespace scoping
  run_job "$JOB_FILE" "$job" -namespace="$NAMESPACE" "${COMMON_VARS[@]}" "${EXTRA_VARS[@]}"
  # Wait for healthy/running state
  wait_for_running "$job" "$NAMESPACE"
done

echo "✅ Deployment complete for $ENVIRONMENT ${PR_NUMBER:+(PR #$PR_NUMBER)}"
