import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as p from '@clack/prompts'

import { runBuild } from './build'
import { runEnvManager } from './env'

export async function runSetup() {
	p.note(
		'This script will set up your development environment by copying .env.example files to .env files in all apps, then run a build to ensure everything is properly configured.',
		'Setup Monorepo',
	)

	// Get the monorepo root
	const currentDir = process.cwd()
	const isInCliApp = currentDir.includes('apps/cli')

	let workspaceRoot: string
	if (isInCliApp) {
		// If running from apps/cli, go up two levels to reach monorepo root
		workspaceRoot = path.resolve(currentDir, '../../')
	} else {
		// If running from monorepo root, use current directory
		workspaceRoot = currentDir
	}

	// Verify we're in the right place by checking for the apps directory
	const appsDir = path.join(workspaceRoot, 'apps')
	if (!fsSync.existsSync(appsDir)) {
		p.log.error(`Could not find apps directory at ${appsDir}`)
		p.log.error(`Current directory: ${currentDir}`)
		p.log.error(`Workspace root: ${workspaceRoot}`)
		throw new Error('Invalid workspace root - apps directory not found')
	}

	try {
		// Get all app directories
		const appDirs = await fs.readdir(appsDir)
		const validAppDirs = appDirs.filter(dir => {
			const stat = fsSync.statSync(path.join(appsDir, dir))

			return stat.isDirectory()
		})

		if (validAppDirs.length === 0) {
			p.log.error('No app directories found in apps/')
			return
		}

		p.log.info(
			`Found ${validAppDirs.length} app directories: ${validAppDirs.join(', ')}`,
		)

		let copiedCount = 0
		let skippedCount = 0
		let errorCount = 0

		for (const appDir of validAppDirs) {
			const appPath = path.join(appsDir, appDir)
			const envExamplePath = path.join(appPath, '.env.example')
			const envPath = path.join(appPath, '.env')

			try {
				// Check if .env.example exists
				await fs.access(envExamplePath)

				// Check if .env already exists
				try {
					await fs.access(envPath)

					p.log.warn(`Skipping ${appDir}/.env (already exists)`)

					skippedCount++

					continue
				} catch {
					// .env doesn't exist, proceed with copy
				}

				// Copy .env.example to .env
				await fs.copyFile(envExamplePath, envPath)

				p.log.success(`Created ${appDir}/.env`)

				copiedCount++
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					p.log.warn(`No .env.example found in ${appDir}/`)

					skippedCount++
				} else {
					p.log.error(
						`Error processing ${appDir}/: ${(error as Error).message}`,
					)

					errorCount++
				}
			}
		}

		// Summary
		p.log.info('Setup completed!')
		p.log.info(`📁 Copied: ${copiedCount} files`)
		p.log.info(`⏭️  Skipped: ${skippedCount} files`)

		if (errorCount > 0) p.log.error(`❌ Errors: ${errorCount} files`)

		if (copiedCount > 0) {
			p.note(
				'Remember to update the .env files with your actual configuration values.',
				'Next Steps',
			)
		}

		// Run build after setup
		p.note(
			'Running build to ensure everything is properly configured...',
			'Build',
		)

		try {
			await runBuild()
		} catch (error) {
			p.log.error(
				'Build failed after setup. You may need to check your configuration.',
			)

			throw error
		}

		// Offer to configure environment variables
		p.note(
			'Setup completed successfully! Would you like to configure environment variables now?',
			'Environment Configuration',
		)

		const configureEnv = await p.select({
			message: 'Configure environment variables?',
			options: [
				{ value: 'yes', label: 'Yes, configure now' },
				{ value: 'no', label: 'No, skip for now' },
			],
		})

		if (!p.isCancel(configureEnv) && configureEnv === 'yes') {
			await runEnvManager()
		}
	} catch (error) {
		p.log.error(`Setup failed: ${(error as Error).message}`)

		throw error
	}
}
