import * as path from 'node:path'
import * as p from '@clack/prompts'
import { execa } from 'execa'
import color from 'picocolors'

export async function runBuild() {
	p.intro(color.bgCyan(color.black(' Build Monorepo ')))

	const spinner = p.spinner()
	spinner.start('Building all packages...')

	try {
		// Get the monorepo root
		const currentDir = process.cwd()
		const isInCliApp = currentDir.includes('apps/cli')

		const workspaceRoot = isInCliApp
			? path.resolve(currentDir, '../../')
			: currentDir

		// Run the build command
		const { stdout, stderr } = await execa('pnpm', ['build'], {
			cwd: workspaceRoot,
			env: {
				DO_NOT_TRACK: '1',
				TURBO_TELEMETRY_DISABLED: '1',
			},
		})

		spinner.stop('Build completed successfully!')

		// Show build output
		if (stdout) {
			p.log.message(stdout)
		}

		if (stderr) {
			p.log.warn(stderr)
		}

		p.outro(color.green('✅ All packages built successfully!'))
	} catch (error) {
		spinner.stop('Build failed!')

		const execError = error as {
			stdout?: string
			stderr?: string
			message: string
		}

		if (execError.stdout) {
			p.log.error('Build output:')
			p.log.message(execError.stdout)
		}

		if (execError.stderr) {
			p.log.error('Build errors:')
			p.log.error(execError.stderr)
		}

		p.outro(color.red('❌ Build failed. Please check the errors above.'))

		throw new Error(`Build failed: ${execError.message}`)
	}
}
