import {
	type Directory,
	dag,
	func,
	object,
	type Secret,
} from '@dagger.io/dagger'

@object()
export class Infrastructure {
	@func()
	async buildAndPush(
		src: Directory,
		dockerNamespace: string,
		dockerUser: string,
		dockerhubToken: Secret,
		tag: string,
	): Promise<string> {
		const apps = ['server', 'web'] as const
		const builds = apps.map(async app => {
			try {
				const ref = `docker.io/${dockerNamespace}/${app}:${tag}`
				const dockerfile = `infrastructure/simple/docker/${app}.Dockerfile`
				await dag
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
  --dockerfile ${dockerfile} \
  --context /src \
  --destination ${ref} \
  --snapshot-mode=redo \
  --cache=true --cache-ttl=168h --cache-repo=docker.io/${dockerNamespace}/cache
						`.trim(),
					])
					.exitCode()
				return ref
			} catch (error) {
				throw new Error(`Build failed for ${app}: ${error}`)
			}
		})

		const refs = await Promise.all(builds)
		return refs.join(', ')
	}

	@func()
	async deployViaSSH(
		serverAddress: string,
		sshPrivateKey: Secret,
		dockerNamespace: string,
		tag: string,
	): Promise<string> {
		const script = `
set -euo pipefail
cd /opt/aipacto

# Update image tags in existing docker-compose.yml
sed -i "s#${dockerNamespace}/web:.*#${dockerNamespace}/web:${tag}#" docker-compose.yml
sed -i "s#${dockerNamespace}/server:.*#${dockerNamespace}/server:${tag}#" docker-compose.yml

docker compose pull
docker compose up -d --wait
docker compose ps
		`

		try {
			await dag
				.container()
				.from('alpine:3.20')
				.withExec(['apk', 'add', '--no-cache', 'openssh-client'])
				.withSecretVariable('SSH_KEY', sshPrivateKey)
				.withExec(['sh', '-lc', 'mkdir -p /root/.ssh && chmod 700 /root/.ssh'])
				.withExec([
					'sh',
					'-lc',
					'echo "$SSH_KEY" > /root/.ssh/id_ed25519 && chmod 600 /root/.ssh/id_ed25519',
				])
				.withExec([
					'sh',
					'-lc',
					`ssh -o StrictHostKeyChecking=no -i /root/.ssh/id_ed25519 ubuntu@${serverAddress} 'bash -s' <<'EOS'\n${script}\nEOS`,
				])
				.exitCode()
			return `Deployed tag ${tag} to ${serverAddress}`
		} catch (error) {
			throw new Error(`Deployment failed: ${error}`)
		}
	}
}
