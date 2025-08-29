#!/bin/bash
set -e

# Configuration
DOCKER_NAMESPACE="developeraipacto"
SERVER_IMAGE="${SERVER_IMAGE:-docker.io/${DOCKER_NAMESPACE}/server:latest}"
WEB_IMAGE="${WEB_IMAGE:-docker.io/${DOCKER_NAMESPACE}/web:latest}"
BASE_DOMAIN="${BASE_DOMAIN:-aipacto.com}"
CERT_RESOLVER="${CERT_RESOLVER:-lehttp}"
NAMESPACE="prod"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Deploying to Production${NC}"
echo "Server: $SERVER_IMAGE"
echo "Web: $WEB_IMAGE"
echo "Domain: $BASE_DOMAIN"
echo ""

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found${NC}"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo -e "${RED}❌ helm not found${NC}"
    exit 1
fi

# Set kubeconfig
export KUBECONFIG="${KUBECONFIG:-./kubeconfig}"

# Test cluster connection
echo -e "${YELLOW}📡 Testing cluster connection...${NC}"
if ! kubectl get nodes &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to cluster. Check your kubeconfig.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected to cluster${NC}"

# Step 1: Add Helm repositories
echo -e "${YELLOW}📦 Adding Helm repositories...${NC}"
helm repo add hcloud https://charts.hetzner.cloud
helm repo add traefik https://traefik.github.io/charts
helm repo update

# Step 2: Install Infrastructure Components
echo -e "${YELLOW}🔧 Installing infrastructure components...${NC}"

# Create hcloud secret
kubectl create namespace kube-system 2>/dev/null || true
kubectl -n kube-system create secret generic hcloud \
    --from-literal=token="${HCLOUD_TOKEN}" \
    --dry-run=client -o yaml | kubectl apply -f -

# Install Hetzner CCM
echo "Installing Hetzner Cloud Controller Manager..."
helm upgrade --install hcloud-ccm hcloud/hcloud-cloud-controller-manager \
    -n kube-system \
    --set secret.name=hcloud \
    --wait

# Install Hetzner CSI
echo "Installing Hetzner CSI Driver..."
helm upgrade --install hcloud-csi hcloud/hcloud-csi \
    -n kube-system \
		--set provisioner.extraArgs.timeout=60s \
    --wait

# Make hcloud-volumes default storage class
kubectl patch storageclass hcloud-volumes -p \
    '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}' 2>/dev/null || true


#===
# Debug cluster state
echo "Checking cluster health..."
kubectl get nodes
kubectl -n kube-system get pods | grep -E "(csi|ccm)"

# Install Traefik WITHOUT --wait to see what happens
echo "Installing Traefik (no wait)..."
helm upgrade --install traefik traefik/traefik \
    -n kube-system \
    -f k8s/bootstrap/traefik-values.yaml

# Now watch what happens
echo "Watching Traefik deployment..."
for i in {1..30}; do
    echo "=== Attempt $i/30 ==="
    kubectl -n kube-system get pods -l app.kubernetes.io/name=traefik
    kubectl -n kube-system get pvc
    kubectl -n kube-system get events --sort-by='.lastTimestamp' | tail -5
    sleep 10
done

# Fix storage class conflict
echo "Fixing storage classes..."
kubectl patch storageclass local-path -p \
    '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}' 2>/dev/null || true

# Clean up stuck Traefik resources if they exist
helm uninstall traefik -n kube-system 2>/dev/null || true
kubectl -n kube-system delete pvc traefik 2>/dev/null || true

# Install Traefik
echo "Installing Traefik..."
helm upgrade --install traefik traefik/traefik \
    -n kube-system \
    -f k8s/bootstrap/traefik-values.yaml \
    --wait --timeout 5m

# Wait for Traefik LoadBalancer
echo -e "${YELLOW}⏳ Waiting for Traefik LoadBalancer...${NC}"
for i in {1..60}; do
    LB_IP=$(kubectl -n kube-system get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
    if [ -n "$LB_IP" ]; then
        echo -e "${GREEN}✅ Traefik LB ready: $LB_IP${NC}"
        break
    fi
    sleep 5
done

# Step 3: Deploy Applications
echo -e "${YELLOW}📦 Deploying applications...${NC}"

# Create namespace
kubectl create namespace $NAMESPACE 2>/dev/null || true

# Parse image references
IFS=':' read -r SERVER_REPO SERVER_TAG <<< "$SERVER_IMAGE"
IFS=':' read -r WEB_REPO WEB_TAG <<< "$WEB_IMAGE"
SERVER_TAG="${SERVER_TAG:-latest}"
WEB_TAG="${WEB_TAG:-latest}"

# Deploy server
echo "Deploying server..."
helm upgrade --install server k8s/charts/server \
    -n $NAMESPACE \
    --set image.repository="$SERVER_REPO" \
    --set image.tag="$SERVER_TAG" \
    --set ingress.host="$BASE_DOMAIN" \
    --set ingress.path="/api" \
    --set ingress.stripPrefix=true \
    --set ingress.tls.enabled=true \
    --set ingress.tls.certResolver="$CERT_RESOLVER" \
    --wait --timeout 5m

# Deploy web
echo "Deploying web..."
helm upgrade --install web k8s/charts/web \
    -n $NAMESPACE \
    --set image.repository="$WEB_REPO" \
    --set image.tag="$WEB_TAG" \
    --set ingress.host="$BASE_DOMAIN" \
    --set ingress.path="/" \
    --set ingress.tls.enabled=true \
    --set ingress.tls.certResolver="$CERT_RESOLVER" \
    --wait --timeout 5m

# Step 4: Wait for rollout
echo -e "${YELLOW}⏳ Waiting for deployments...${NC}"
kubectl -n $NAMESPACE rollout status deployment/server --timeout=5m
kubectl -n $NAMESPACE rollout status deployment/web --timeout=5m

# Success!
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Web: https://$BASE_DOMAIN"
echo "🔌 API: https://$BASE_DOMAIN/api"
echo ""
echo "Check status with:"
echo "  kubectl -n $NAMESPACE get pods"
echo "  kubectl -n $NAMESPACE get ingress"
