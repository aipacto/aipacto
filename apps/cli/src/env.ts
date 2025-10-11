import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as p from '@clack/prompts'
import color from 'picocolors'

export async function runEnvManager() {
	p.intro(color.bgCyan(color.black(' Environment Variables Manager ')))

	// Get the monorepo root
	const currentDir = process.cwd()
	const isInCliApp = currentDir.includes('apps/cli')

	const workspaceRoot = isInCliApp
		? path.resolve(currentDir, '../../')
		: currentDir

	const serverEnvPath = path.join(workspaceRoot, 'apps/server/.env')
	const webEnvPath = path.join(workspaceRoot, 'apps/web/.env')

	// Check if .env files exist
	let serverEnvExists = false
	let webEnvExists = false

	try {
		await fs.access(serverEnvPath)
		serverEnvExists = true
	} catch {
		// File doesn't exist
	}

	try {
		await fs.access(webEnvPath)
		webEnvExists = true
	} catch {
		// File doesn't exist
	}

	if (!serverEnvExists || !webEnvExists) {
		p.log.warn('Some .env files are missing. Please run setup first.')
		return
	}

	const appChoice = await p.select({
		message: 'Which app environment do you want to manage?',
		options: [
			{ value: 'server', label: 'Server (Backend API)' },
			{ value: 'web', label: 'Web (Frontend)' },
			{ value: 'back', label: 'Back to main menu' },
		],
	})

	if (p.isCancel(appChoice) || appChoice === 'back') {
		return
	}

	const envPath = appChoice === 'server' ? serverEnvPath : webEnvPath

	// Read current .env file
	const envContent = await fs.readFile(envPath, 'utf-8')
	const envLines = envContent.split('\n')

	p.note(
		`Current environment variables for ${appChoice}:\n\n${envLines
			.filter(line => line.trim() && !line.startsWith('#'))
			.join('\n')}`,
		'Current .env',
	)

	const action = await p.select({
		message: 'What would you like to do?',
		options: [
			{ value: 'edit', label: 'Edit a variable' },
			{ value: 'view', label: 'View all variables' },
			{ value: 'back', label: 'Back to main menu' },
		],
	})

	if (p.isCancel(action) || action === 'back') {
		return
	}

	if (action === 'view') {
		p.log.message(`\n${envContent}\n`)
		return
	}

	if (action === 'edit') {
		const varName = await p.text({
			message: 'Enter the variable name to edit (e.g., SERVER_PORT):',
			placeholder: 'VARIABLE_NAME',
		})

		if (p.isCancel(varName)) {
			return
		}

		const varValue = await p.text({
			message: `Enter the new value for ${varName}:`,
			placeholder: 'value',
		})

		if (p.isCancel(varValue)) {
			return
		}

		// Update the .env file
		const updatedLines = envLines.map(line => {
			if (line.startsWith(`${varName}=`)) {
				return `${varName}=${varValue}`
			}
			return line
		})

		// Check if variable was found
		const found = updatedLines.some(
			line => line !== envLines[envLines.indexOf(line)],
		)

		if (!found) {
			// Variable doesn't exist, add it
			updatedLines.push(`${varName}=${varValue}`)
			p.log.warn(`Variable ${varName} not found. Adding it to the .env file.`)
		}

		await fs.writeFile(envPath, updatedLines.join('\n'))

		p.outro(
			color.green(`✅ Updated ${varName} in ${appChoice}/.env to: ${varValue}`),
		)
	}
}
