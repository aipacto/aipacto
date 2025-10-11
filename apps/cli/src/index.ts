import * as p from '@clack/prompts'
import color from 'picocolors'

import { runEnvManager } from './env'
import { runSetup } from './setup'

async function main() {
	while (true) {
		// biome-ignore lint/suspicious/noConsole: <explanation>
		console.clear()

		p.intro(color.bgCyan(color.black(' Developer Toolkit Console ')))

		const choice = await p.select({
			message: 'Select a script to run',
			options: [
				{
					value: 'setup',
					label: 'Setup Monorepo',
					hint: 'Set up your development environment (env files, build, etc.)',
				},
				{
					value: 'env',
					label: 'Environment Variables',
					hint: 'Manage environment variables (Mapbox keys, etc.)',
				},
				{ value: 'exit', label: 'Exit' },
			],
		})

		if (p.isCancel(choice) || choice === 'exit') {
			p.cancel('Goodbye!')
			process.exit(0)
		}

		try {
			switch (choice) {
				case 'setup':
					await runSetup()
					break
				case 'env':
					await runEnvManager()
					break
			}
		} catch (error) {
			p.outro(color.red(`🤕 CLI failed: ${(error as Error).message}`))
			// Wait a moment for user to see the error, then continue to main menu
			await new Promise(resolve => setTimeout(resolve, 2000))
			continue
		}

		// Ask if user wants to continue or exit
		const continueChoice = await p.select({
			message: 'Would you like to continue using the CLI?',
			options: [
				{ value: 'continue', label: 'Yes, return to main menu' },
				{ value: 'exit', label: 'No, exit CLI' },
			],
		})

		if (p.isCancel(continueChoice) || continueChoice === 'exit') {
			p.outro(color.green('🥳 CLI finished successfully'))
			process.exit(0)
		}
	}
}

main().catch(() => {
	// The error is already handled inside the main function's try/catch,
	// so we can have a silent catch here to prevent unhandled rejection errors.
})
