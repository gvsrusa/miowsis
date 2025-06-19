#!/bin/bash

# MIOwSIS Deployment Script
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.0.0

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
NAMESPACE="miowsis-${ENVIRONMENT}"
REGISTRY="ghcr.io"
IMAGE_NAME="yourusername/miowsis"

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

log_info "Starting deployment to $ENVIRONMENT with version $VERSION"

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { log_error "docker is required but not installed."; exit 1; }

# Build and push Docker image
if [ "$VERSION" != "latest" ]; then
    log_info "Building Docker image..."
    docker build -t ${REGISTRY}/${IMAGE_NAME}:${VERSION} .
    
    log_info "Pushing Docker image..."
    docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}
fi

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes configurations
log_info "Applying Kubernetes configurations..."
cd k8s/overlays/${ENVIRONMENT}

# Update image tag in kustomization
if [ "$VERSION" != "latest" ]; then
    sed -i "s/newTag: .*/newTag: ${VERSION}/" kustomization.yaml
fi

# Apply configurations
kubectl apply -k . -n $NAMESPACE

# Wait for rollout to complete
log_info "Waiting for deployment to complete..."
kubectl rollout status deployment/prod-miowsis-app -n $NAMESPACE --timeout=600s

# Verify deployment
log_info "Verifying deployment..."
PODS_READY=$(kubectl get pods -n $NAMESPACE -l app=miowsis -o jsonpath='{.items[*].status.containerStatuses[*].ready}' | tr ' ' '\n' | grep -c "true" || true)
PODS_TOTAL=$(kubectl get pods -n $NAMESPACE -l app=miowsis --no-headers | wc -l)

if [ "$PODS_READY" -eq "$PODS_TOTAL" ] && [ "$PODS_TOTAL" -gt 0 ]; then
    log_info "Deployment successful! $PODS_READY/$PODS_TOTAL pods are ready."
else
    log_error "Deployment may have issues. Only $PODS_READY/$PODS_TOTAL pods are ready."
    kubectl get pods -n $NAMESPACE -l app=miowsis
    exit 1
fi

# Run smoke tests
log_info "Running smoke tests..."
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

log_info "Deployment completed successfully!"

# Show deployment info
echo ""
echo "Deployment Summary:"
echo "==================="
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo "Namespace: $NAMESPACE"
echo "URL: $INGRESS_URL"
echo ""

# Show resource usage
kubectl top pods -n $NAMESPACE -l app=miowsis || true