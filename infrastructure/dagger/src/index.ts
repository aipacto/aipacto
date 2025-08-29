import {
	type Container,
	type Directory,
	dag,
	type File,
	func,
	object,
	type Secret,
} from '@dagger.io/dagger'

/**
 * K8s infra pipeline for Aipacto on Hetzner + Tailscale + k3s + Traefik.
 *
 * Build & publish images, install cluster add-ons (hcloud CCM/CSI + Traefik),
 * deploy Helm charts to prod or preview namespaces, and wait for healthy rollouts.
 */
@object()
export class Kubernetes {
	// ===========================================================================
	// PUBLIC API
	// ===========================================================================

	/**
	 * Deploy to PROD (aipacto.com + /api).
	 */
	@func()
	async deployProd(
		src: Directory,
		kubeconfig: File,
		chartsDir: Directory,
		bootstrapDir: Directory,
		dockerNamespace: string,
		dockerUser: string,
		dockerhubToken: Secret,
		hcloudToken: Secret,
		baseDomain: string = 'aipacto.com',
		certResolver: string = 'lehttp',
	): Promise<string> {
		// 1) Build & publish latest tags
		const serverRef = await this.publish(
			src,
			'server',
			'latest',
			dockerNamespace,
			dockerUser,
			dockerhubToken,
		)
		const webRef = await this.publish(
			src,
			'web',
			'latest',
			dockerNamespace,
			dockerUser,
			dockerhubToken,
		)

		// 2) Ensure add-ons (CCM, CSI, Traefik)
		const helm = await this.helmKubectl(kubeconfig)
		await this.installInfra(helm, hcloudToken, bootstrapDir)

		// 3) Deploy charts
		const ns = 'prod'
		await this.ensureNamespace(helm, ns)

		// server at https://aipacto.com/api (strip prefix)
		await this.helmUpgrade(helm, chartsDir, 'server', ns, [
			`image.repository=docker.io/${dockerNamespace}/server`,
			`image.tag=latest`,
			`ingress.host=${baseDomain}`,
			`ingress.path=/api`,
			`ingress.stripPrefix=true`,
			`ingress.tls.enabled=true`,
			`ingress.tls.certResolver=${certResolver}`,
		])

		// web at https://aipacto.com
		await this.helmUpgrade(helm, chartsDir, 'web', ns, [
			`image.repository=docker.io/${dockerNamespace}/web`,
			`image.tag=latest`,
			`ingress.host=${baseDomain}`,
			`ingress.path=/`,
			`ingress.tls.enabled=true`,
			`ingress.tls.certResolver=${certResolver}`,
		])

		// 4) Rollout gates
		await this.rolloutWait(helm, ns, 'server', '5m')
		await this.rolloutWait(helm, ns, 'web', '5m')

		return `✅ PROD deployed
web:  https://${baseDomain}
api:  https://${baseDomain}/api
imgs: ${serverRef}, ${webRef}`
	}

	/**
	 * Deploy to PROD using existing images (no build/publish).
	 */
	@func()
	async deployProdExisting(
		src: Directory,
		// kubeconfig: File,
		kubeconfigBase64: string,
		hcloudToken: Secret,
		serverImageRef: string,
		webImageRef: string,
		baseDomain: string = 'aipacto.com',
		certResolver: string = 'lehttp',
	): Promise<string> {
		// Default to module dir (snaps infrastructure/dagger/ when run from there)

		// Derive locals relative to module dir (clean paths, no ./)
		const chartsDir = await src.directory('k8s/charts')
		// const kubeconfig = await src.file('kubeconfig')
		const bootstrapDir = await src.directory('k8s/bootstrap')
		// const helm = await this.helmKubectlWithDirMount(src)
		// const helm = await this.helmKubectlWithDirMount(kubeconfig)
		// const helm = await this.helmKubectl(kubeconfig)

		// // Decode base64 and create kubeconfig in container
		// const helm = dag
		// 	.container()
		// 	.from('alpine:3.20')
		// 	// Install tools first
		// 	.withExec([
		// 		'apk',
		// 		'add',
		// 		'--no-cache',
		// 		'bash',
		// 		'curl',
		// 		'ca-certificates',
		// 		'kubectl',
		// 		'helm',
		// 		'jq',
		// 		'bind-tools',
		// 	])
		// 	// Fix DNS before anything else
		// 	.withExec([
		// 		'sh',
		// 		'-c',
		// 		'echo -e "nameserver 8.8.8.8\nnameserver 1.1.1.1" > /etc/resolv.conf',
		// 	])
		// 	// Test DNS works
		// 	.withExec(['nslookup', 'google.com'])
		// 	// Now set up kubeconfig
		// 	.withExec([
		// 		'sh',
		// 		'-c',
		// 		`
		//         mkdir -p /root/.kube && \
		//         echo '${kubeconfigBase64}' | base64 -d > /root/.kube/config && \
		//         chmod 600 /root/.kube/config
		//     `,
		// 	])
		// 	.withEnvVariable('KUBECONFIG', '/root/.kube/config')
		// 	// Verify kubectl works
		// 	.withExec(['kubectl', 'version', '--client'])
		const helm = dag
			.container()
			.from('alpine:3.20')
			.withExec([
				'apk',
				'add',
				'--no-cache',
				'bash',
				'curl',
				'ca-certificates',
				'kubectl',
				'helm',
				'jq',
			])
			// Just set up kubeconfig
			.withExec([
				'sh',
				'-c',
				`
            mkdir -p /root/.kube && \
            echo '${kubeconfigBase64}' | base64 -d > /root/.kube/config && \
            chmod 600 /root/.kube/config
        `,
			])
			.withEnvVariable('KUBECONFIG', '/root/.kube/config')

		await this.installInfra(helm, hcloudToken, bootstrapDir)
		const ns = 'prod'
		await this.ensureNamespace(helm, ns)

		// Parse image refs (unchanged)
		const [serverRepo, serverTag] = serverImageRef.split(':')
		const [webRepo, webTag] = webImageRef.split(':')

		// Server deploy (unchanged logic)
		await this.helmUpgrade(helm, chartsDir, 'server', ns, [
			`image.repository=${serverRepo}`,
			`image.tag=${serverTag || 'latest'}`,
			`ingress.host=${baseDomain}`,
			`ingress.path=/api`,
			`ingress.stripPrefix=true`,
			`ingress.tls.enabled=true`,
			`ingress.tls.certResolver=${certResolver}`,
		])

		// Web deploy (unchanged logic)
		await this.helmUpgrade(helm, chartsDir, 'web', ns, [
			`image.repository=${webRepo}`,
			`image.tag=${webTag || 'latest'}`,
			`ingress.host=${baseDomain}`,
			`ingress.path=/`,
			`ingress.tls.enabled=true`,
			`ingress.tls.certResolver=${certResolver}`,
		])

		// Rollout gates (unchanged)
		await this.rolloutWait(helm, ns, 'server', '5m')
		await this.rolloutWait(helm, ns, 'web', '5m')

		return `✅ PROD deployed with existing images
	web: https://${baseDomain}
	api: https://${baseDomain}/api
	imgs: ${serverImageRef}, ${webImageRef}`
	}

	/**
	 * Deploy a PR preview (pr-<n>.aipacto.com + /api).
	 */
	@func()
	async deployPreview(
		src: Directory,
		kubeconfig: File,
		chartsDir: Directory,
		bootstrapDir: Directory,
		dockerNamespace: string,
		dockerUser: string,
		dockerhubToken: Secret,
		hcloudToken: Secret,
		prNumber: string,
		baseDomain: string = 'aipacto.com',
		certResolver: string = 'lehttp',
	): Promise<string> {
		const tag = `pr-${prNumber}`

		// 1) Build & publish preview tags
		const serverRef = await this.publish(
			src,
			'server',
			tag,
			dockerNamespace,
			dockerUser,
			dockerhubToken,
		)
		const webRef = await this.publish(
			src,
			'web',
			tag,
			dockerNamespace,
			dockerUser,
			dockerhubToken,
		)

		// 2) Ensure add-ons
		const helm = await this.helmKubectl(kubeconfig)
		await this.installInfra(helm, hcloudToken, bootstrapDir)

		// 3) Deploy charts to isolated namespace
		const ns = `preview-${prNumber}`
		await this.ensureNamespace(helm, ns)

		const host = `pr-${prNumber}.${baseDomain}`

		// server → https://pr-<n>.aipacto.com/api
		await this.helmUpgrade(helm, chartsDir, 'server', ns, [
			`image.repository=docker.io/${dockerNamespace}/server`,
			`image.tag=${tag}`,
			`ingress.host=${host}`,
			`ingress.path=/api`,
			`ingress.stripPrefix=true`,
			`ingress.tls.enabled=true`,
			`ingress.tls.certResolver=${certResolver}`,
		])

		// web → https://pr-<n>.aipacto.com
		await this.helmUpgrade(helm, chartsDir, 'web', ns, [
			`image.repository=docker.io/${dockerNamespace}/web`,
			`image.tag=${tag}`,
			`ingress.host=${host}`,
			`ingress.path=/`,
			`ingress.tls.enabled=true`,
			`ingress.tls.certResolver=${certResolver}`,
		])

		// 4) Rollout gates
		await this.rolloutWait(helm, ns, 'server', '5m')
		await this.rolloutWait(helm, ns, 'web', '5m')

		return `✅ PREVIEW #${prNumber} deployed
web: https://${host}
api: https://${host}/api
imgs: ${serverRef}, ${webRef}`
	}

	/**
	 * Build images only (no publish).
	 */
	@func()
	async buildOnly(src: Directory): Promise<string> {
		const server = await this.dockerBuild(
			src,
			'packages/infrastructure/docker/server.Dockerfile',
		)
		const web = await this.dockerBuild(
			src,
			'packages/infrastructure/docker/web.Dockerfile',
		)
		const [sId, wId] = await Promise.all([server.id(), web.id()])
		return `🧱 Built (no publish) server=${sId.slice(0, 12)} web=${wId.slice(0, 12)}`
	}

	// ===========================================================================
	// PRIVATE HELPERS
	// ===========================================================================

	/**
	 * Kaniko build & push with registry cache.
	 * (Creates Docker auth inside the container using env + secret; no plaintext in TS.)
	 */
	async publish(
		src: Directory,
		app: 'server' | 'web',
		tag: string,
		dockerNs: string,
		dockerUser: string,
		dockerhubToken: Secret,
	): Promise<string> {
		const ref = `docker.io/${dockerNs}/${app}:${tag}`

		const build = dag
			.container()
			.from('gcr.io/kaniko-project/executor:latest')
			.withEnvVariable('DOCKER_USERNAME', dockerUser)
			.withSecretVariable('DOCKER_PASSWORD', dockerhubToken)
			.withDirectory('/src', src)
			.withWorkdir('/src')
			.withExec([
				'sh',
				'-lc',
				`
set -e
mkdir -p /kaniko/.docker
AUTH=$(printf "%s" "$DOCKER_USERNAME:$DOCKER_PASSWORD" | base64 -w 0 || printf "%s" "$DOCKER_USERNAME:$DOCKER_PASSWORD" | base64)
cat > /kaniko/.docker/config.json <<EOF
{ "auths": { "https://index.docker.io/v1/": { "auth": "$AUTH" } } }
EOF
/kaniko/executor \
  --dockerfile packages/infrastructure/docker/${app}.Dockerfile \
  --context /src \
  --destination ${ref} \
  --snapshotMode redo \
  --cache=true --cache-ttl 168h --cache-repo docker.io/${dockerNs}/cache
        `.trim(),
			])

		await build.exitCode()
		return ref
	}

	/**
	 * Plain docker build (no publish), returns the built Container.
	 */
	async dockerBuild(
		src: Directory,
		dockerfilePath: string,
	): Promise<Container> {
		return src.dockerBuild({ dockerfile: dockerfilePath })
	}

	/**
	 * kubectl/helm toolbox with kubeconfig mounted.
	 */
	async helmKubectl(kubeconfig: File): Promise<Container> {
		return dag
			.container()
			.from('alpine:3.20')
			.withExec([
				'sh',
				'-lc',
				'apk add --no-cache bash curl ca-certificates kubectl helm jq',
			])
			.withMountedFile('/root/.kube/config', kubeconfig)
			.withEnvVariable('KUBECONFIG', '/root/.kube/config')
	}

	/**
	 * Install/ensure Hetzner CCM, CSI, Traefik (ACME), then wait for LB.
	 */
	async installInfra(
		helm: Container,
		hcloudToken: Secret,
		bootstrapDir: Directory,
	): Promise<void> {
		// hcloud token secret
		await helm
			.withExec([
				'sh',
				'-c',
				`kubectl -n kube-system create secret generic hcloud --from-literal=token=${await hcloudToken.plaintext()} --dry-run=client -o yaml | kubectl apply -f -`,
			])
			.exitCode()

		// Helm repos
		await helm
			.withExec(['helm', 'repo', 'add', 'hcloud', 'https://helm.hetzner.cloud'])
			.exitCode()
		await helm
			.withExec([
				'helm',
				'repo',
				'add',
				'hcloud-csi',
				'https://hetznercloud.github.io/csi-driver/',
			])
			.exitCode()
		await helm
			.withExec([
				'helm',
				'repo',
				'add',
				'traefik',
				'https://traefik.github.io/charts',
			])
			.exitCode()
		await helm.withExec(['helm', 'repo', 'update']).exitCode()

		// CCM & CSI
		await helm
			.withExec([
				'helm',
				'upgrade',
				'--install',
				'hcloud-ccm',
				'hcloud/hcloud-cloud-controller-manager',
				'-n',
				'kube-system',
				'--set',
				'secret.name=hcloud',
			])
			.exitCode()

		await helm
			.withExec([
				'helm',
				'upgrade',
				'--install',
				'hcloud-csi',
				'hcloud-csi/hcloud-csi',
				'-n',
				'kube-system',
				'--set',
				'secret.name=hcloud',
			])
			.exitCode()

		// Make hcloud-volumes default StorageClass (kept minimal per your choices)
		await helm
			.withExec([
				'kubectl',
				'patch',
				'storageclass',
				'hcloud-volumes',
				'-p',
				'{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}',
			])
			.exitCode()

		// Traefik with our values (ACME HTTP-01)
		await helm
			.withDirectory('/charts', bootstrapDir)
			.withExec([
				'helm',
				'upgrade',
				'--install',
				'traefik',
				'traefik/traefik',
				'-n',
				'kube-system',
				'-f',
				'/charts/traefik-values.yaml',
			])
			.exitCode()

		// Wait for LB External IP or hostname (no `${…}` in JS string)
		await this.waitForTraefikLB(helm)
	}

	/**
	 * Wait until Service/traefik has an External IP/hostname.
	 */
	async waitForTraefikLB(helm: Container): Promise<void> {
		const script = `
set -e
echo "⏳ Waiting for Traefik LoadBalancer external address..."
for i in $(seq 1 120); do
  ip=$(kubectl -n kube-system get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
  host=$(kubectl -n kube-system get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
  if [ -n "$ip" ] || [ -n "$host" ]; then
    addr="$ip"
    if [ -z "$addr" ]; then addr="$host"; fi
    echo "✅ Traefik LB: $addr"
    exit 0
  fi
  sleep 5
done
echo "❌ Timed out waiting for Traefik LB external address" >&2
exit 1
`.trim()

		await helm.withExec(['sh', '-lc', script]).exitCode()
	}

	/**
	 * Ensure namespace exists (idempotent).
	 */
	async ensureNamespace(helm: Container, ns: string): Promise<void> {
		await helm
			.withExec([
				'sh',
				'-c',
				`kubectl create ns ${ns} --dry-run=client -o yaml | kubectl apply -f -`,
			])
			.exitCode()
	}

	/**
	 * `helm upgrade --install` for charts in provided charts directory.
	 */
	async helmUpgrade(
		helm: Container,
		chartsDir: Directory,
		chartName: 'server' | 'web',
		ns: string,
		setArgs: string[],
	): Promise<void> {
		await helm
			.withDirectory('/charts', chartsDir)
			.withExec([
				'helm',
				'upgrade',
				'--install',
				chartName,
				`/charts/${chartName}`,
				'-n',
				ns,
				...setArgs.flatMap(v => ['--set', v]),
			])
			.exitCode()
	}

	/**
	 * Wait for a deployment rollout to complete.
	 */
	async rolloutWait(
		helm: Container,
		ns: string,
		deployName: string,
		timeout: string,
	): Promise<void> {
		await helm
			.withExec([
				'kubectl',
				'-n',
				ns,
				'rollout',
				'status',
				`deploy/${deployName}`,
				`--timeout=${timeout}`,
			])
			.exitCode()
	}

	async helmKubectlWithDirMount(kubeconfig: File): Promise<Container> {
		// Read the kubeconfig content
		const kubeconfigContent = await kubeconfig.contents()

		return (
			dag
				.container()
				.from('alpine:3.20')
				.withExec([
					'apk',
					'add',
					'--no-cache',
					'bash',
					'curl',
					'ca-certificates',
					'kubectl',
					'helm',
					'jq',
				])
				// Create the .kube directory and write the config file
				.withExec(['mkdir', '-p', '/root/.kube'])
				.withExec([
					'sh',
					'-c',
					`cat > /root/.kube/config << 'EOF'
 ${kubeconfigContent}
 EOF`,
				])
				.withExec(['chmod', '600', '/root/.kube/config'])
				.withEnvVariable('KUBECONFIG', '/root/.kube/config')
		)
	}
}
