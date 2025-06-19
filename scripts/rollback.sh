#!/bin/bash

# MIOwSIS Rollback Script
# Usage: ./rollback.sh [environment] [revision]
# Example: ./rollback.sh production 2

set -e

# Configuration
ENVIRONMENT=${1:-staging}
REVISION=${2:-0}
NAMESPACE="miowsis-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    exit 1
fi

log_info "Starting rollback for $ENVIRONMENT"

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed."; exit 1; }

# Get deployment name
DEPLOYMENT_NAME="prod-miowsis-app"
if [ "$ENVIRONMENT" != "production" ]; then
    DEPLOYMENT_NAME="${ENVIRONMENT}-miowsis-app"
fi

# Show rollout history
log_info "Rollout history:"
kubectl rollout history deployment/${DEPLOYMENT_NAME} -n $NAMESPACE

# Perform rollback
if [ "$REVISION" -eq 0 ]; then
    log_info "Rolling back to previous version..."
    kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n $NAMESPACE
else
    log_info "Rolling back to revision $REVISION..."
    kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n $NAMESPACE --to-revision=$REVISION
fi

# Wait for rollback to complete
log_info "Waiting for rollback to complete..."
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n $NAMESPACE --timeout=600s

# Verify rollback
log_info "Verifying rollback..."
PODS_READY=$(kubectl get pods -n $NAMESPACE -l app=miowsis -o jsonpath='{.items[*].status.containerStatuses[*].ready}' | tr ' ' '\n' | grep -c "true" || true)
PODS_TOTAL=$(kubectl get pods -n $NAMESPACE -l app=miowsis --no-headers | wc -l)

if [ "$PODS_READY" -eq "$PODS_TOTAL" ] && [ "$PODS_TOTAL" -gt 0 ]; then
    log_info "Rollback successful! $PODS_READY/$PODS_TOTAL pods are ready."
else
    log_error "Rollback may have issues. Only $PODS_READY/$PODS_TOTAL pods are ready."
    kubectl get pods -n $NAMESPACE -l app=miowsis
    exit 1
fi

# Run health check
log_info "Running health check..."
if [ "$ENVIRONMENT" == "production" ]; then
    INGRESS_URL="https://miowsis.com"
else
    INGRESS_URL="https://${ENVIRONMENT}.miowsis.com"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${INGRESS_URL}/api/health || echo "000")
if [ "$HTTP_CODE" == "200" ]; then
    log_info "Health check passed!"
else
    log_error "Health check failed with HTTP code: $HTTP_CODE"
    exit 1
fi

log_info "Rollback completed successfully!"

# Show current deployment info
echo ""
echo "Current Deployment Info:"
echo "======================="
kubectl describe deployment/${DEPLOYMENT_NAME} -n $NAMESPACE | grep -E "Image:|Replicas:"