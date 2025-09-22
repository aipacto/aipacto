# Infrastructure (Production)

Provision Hetzner servers with Terraform (k3s + Tailscale), then install the Kubernetes platform (External Secrets → Infisical, cert-manager + Cloudflare DNS-01, Envoy Gateway, Hetzner CCM) and deploy apps.

---

## 0) Prereqs

**Accounts & tokens**

- Hetzner Cloud: `HCLOUD_TOKEN`
- S3-compatible object storage (Terraform state): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Tailscale reusable auth key: `TAILSCALE_AUTH_KEY`
- Cloudflare API **Token** with DNS edit on `aipacto.com`
- Infisical **Machine Identity** (Client ID/Secret) for project `aipacto`, env `prod`

**CLI Tools**

Install the required command-line tools:

- **Terraform** ≥ 1.13: [Installation Guide](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
- **kubectl**: [Official Installation](https://kubernetes.io/docs/tasks/tools/)
- **Kustomize**: [Official Documentation](https://kustomize.io/) | [GitHub Repository](https://github.com/kubernetes-sigs/kustomize)

  ```bash
  # macOS (Homebrew - recommended)
  brew install kustomize
  
  # Or via official script
  curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
  mv kustomize /usr/local/bin/
  ```

- **Tailscale CLI**: [Download](https://tailscale.com/download) (ensure you're logged in)

Verify installations:

```bash
terraform version
kubectl version       # Should connect to cluster
kustomize version     # Should show current version
tailscale status      # Should show "logged in"
```

> Ensure `infrastructure/terraform/provider.tf` uses S3 backend `endpoint = "https://<your-s3-endpoint>"` (not `endpoints = { ... }`).

---

## 1) Provision infra (Terraform)

```bash
cd infrastructure/terraform

export HCLOUD_TOKEN=...
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export TF_VAR_tailscale_authkey=... # or pass via -var

# Optional overrides:
# export TF_VAR_node_count=2
# export TF_VAR_location=fsn1

terraform init -upgrade
terraform plan -var="hcloud_token=$HCLOUD_TOKEN"
terraform apply -var="hcloud_token=$HCLOUD_TOKEN" -auto-approve
```

What you get:

- 1× control-plane + N× workers (k3s), private network & firewalls
- Nodes auto-join **Tailscale**; kube-api available on private + TS IPs

**Re-apply infra changes**

```bash
terraform plan -var="hcloud_token=$HCLOUD_TOKEN"
terraform apply -var="hcloud_token=$HCLOUD_TOKEN" -auto-approve
```

---

## 2) Fetch kubeconfig via Tailscale

```bash
cd ../..

CP=aipacto-prod-control-plane-1
TS_IP=$(tailscale ip -4 "$CP" | head -n1)

# Fetch kubeconfig
mkdir -p infrastructure
tailscale ssh tsadmin@"$CP" 'sudo cat /etc/rancher/k3s/k3s.yaml' > infrastructure/kubeconfig

# Point kubeconfig to Tailscale IP
awk -v ip="$TS_IP" '{
  if ($0 ~ /^ *server: https:/) { sub(/https:\/\/[^:]+:6443/, "https://" ip ":6443") }
  print
}' infrastructure/kubeconfig > infrastructure/kubeconfig.tmp && mv infrastructure/kubeconfig.tmp infrastructure/kubeconfig

# Verify
kubectl --kubeconfig infrastructure/kubeconfig get nodes -o wide
```

---

Perfect—here’s the **replacement for Step 3** using **Kustomize** (no Helm CLI). Run these from the **repo root**.

---

## 3) External Secrets (Kustomize) + Infisical

This installs the External Secrets Operator (ESO) **via Kustomize** and wires it to Infisical using the `ClusterSecretStore`.

```bash
# Always point tools to the cluster
export KUBECONFIG="$PWD/infrastructure/kubeconfig"

# Ensure namespace
kubectl get ns external-secrets || kubectl create ns external-secrets

# Install ESO
kustomize build infrastructure/kubernetes/platform/base/external-secrets --enable-helm | kubectl apply --server-side --force-conflicts -f -

# Wait for CRDs (prevents CRD/CR races)
kubectl wait --for=condition=Established \
  crd/secretstores.external-secrets.io \
  crd/clustersecretstores.external-secrets.io

# Add Infisical credentials + ClusterSecretStore
kubectl apply -f infrastructure/kubernetes/platform/base/external-secrets/infisical-universal-auth.yaml
kubectl apply -f infrastructure/kubernetes/platform/base/external-secrets/clustersecretstore-infisical.yaml


# Verify
kubectl -n external-secrets get pods
kubectl get clustersecretstore infisical-cluster-secret-store
```

**Re-apply later (changes to ESO/store):**

```bash
kustomize build infrastructure/kubernetes/platform/base/external-secrets --enable-helm \
  | kubectl apply --server-side -f -
kubectl apply -f infrastructure/kubernetes/platform/base/external-secrets/infisical-universal-auth.yaml

```

> Ensure your prod overlay includes the external-secrets base **before** cert-manager (you already have it as `../../base/external-secrets` in `platform/overlays/prod/kustomization.yaml`).

---

## 4) Install platform (cert-manager, Envoy, hcloud-ccm)

```bash
kubectl get ns cert-manager  || kubectl create ns cert-manager
kubectl get ns envoy-gateway || kubectl create ns envoy-gateway

kustomize build infrastructure/kubernetes/platform/overlays/prod --enable-helm \
  | kubectl apply --server-side -f -

kubectl -n external-secrets get pods
kubectl -n cert-manager get pods
kubectl -n envoy-gateway get pods

```

**Re-apply platform changes**

```bash
kustomize build infrastructure/kubernetes/platform/overlays/prod --enable-helm \
  | kubectl apply --server-side -f -
```

---

## 5) DNS

When Envoy’s Service is ready, get the External IP and create records in Cloudflare:

```bash
kubectl -n envoy-gateway get svc -o wide
```

Create:

- `A  aipacto.com  <LB-EXTERNAL-IP>`
- Optional: `CNAME *.aipacto.com  aipacto.com`

> cert-manager issues TLS via **DNS-01** (Cloudflare). DNS records still required for client routing.

---

## 6) Deploy applications (web & server)

```bash
kubectl get ns prod || kubectl create ns prod

kustomize build infrastructure/kubernetes/apps/overlays/prod --enable-helm \
  | kubectl apply --server-side -f -

# Rollouts
kubectl -n prod get deploy
kubectl -n prod rollout status deploy/web
kubectl -n prod rollout status deploy/server
```

URLs (after DNS + certs):

- Web: `https://aipacto.com/`
- API: `https://aipacto.com/api`

**Re-deploy apps**

```bash
# After changing image tags in apps/overlays/prod/*-values.yaml
kustomize build infrastructure/kubernetes/apps/overlays/prod --enable-helm \
  | kubectl apply --server-side -f -

# Quick restart without tag change
kubectl -n prod rollout restart deploy/web
kubectl -n prod rollout restart deploy/server
```

---

## 7) Troubleshooting

```bash
# Node access
tailscale ssh tsadmin@aipacto-prod-control-plane-1
tailscale ssh tsadmin@aipacto-prod-worker-1

# Cluster health
kubectl --kubeconfig infrastructure/kubeconfig get nodes -o wide

# Load balancer
kubectl --kubeconfig infrastructure/kubeconfig -n envoy-gateway get svc

# Certificates
kubectl --kubeconfig infrastructure/kubeconfig -n envoy-gateway get certificate,order,challenge
kubectl --kubeconfig infrastructure/kubeconfig -n cert-manager logs deploy/cert-manager -f | rg -i 'dns01|challenge|aipacto'

# Cloud-init / k3s on nodes
tailscale ssh tsadmin@aipacto-prod-control-plane-1 'cloud-init status --long || true'
tailscale ssh tsadmin@aipacto-prod-control-plane-1 'sudo systemctl status k3s --no-pager || true'
```

---

## 8) What gets created

- **Terraform**: Hetzner network, firewalls, 1× control-plane + N× workers (Ubuntu 24.04), Tailscale, k3s
- **Kubernetes (platform)**: ESO + Infisical store, cert-manager (+ Cloudflare DNS-01), Envoy Gateway (LB), Hetzner CCM
- **Kubernetes (apps)**: `prod` namespace, `web` and `server` Helm releases via HTTPRoutes
