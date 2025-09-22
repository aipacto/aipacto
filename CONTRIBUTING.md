# Contributing to Aipacto

Thank you for your interest in contributing to Aipacto! We're building an AI-driven Operating System for city councils and local governments, starting with a revolutionary tender writer application for Spanish municipalities. This guide will help you get started and understand our development workflow and requirements.

## Prerequisites

- **Nix** (for reproducible development environment)
  - **Recommended:** [Determinate Systems Nix Installer](https://zero-to-nix.com/start/install/) (single command, works on Linux/macOS/WSL)
  - **Alternative:** [Official NixOS installer](https://nixos.org/download.html)

  Nix ensures everyone uses the exact same versions of Node.js, Yarn, TypeScript, and other tools. No more "works on my machine" issues!

- **Watchman** (for file watching and hot reloading)
  - **Linux:** Install using [Homebrew](https://brew.sh/):

    ```bash
    # Install Homebrew for Linux if you don't have it
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Install Watchman
    brew install watchman
    ```

  - **macOS:** `brew install watchman`
  - **Windows:** Download from [Watchman releases](https://github.com/facebook/watchman/releases)
  
  Watchman improves file watching performance and is required for optimal development experience with hot reloading.

## Getting Started

1. **Install Nix:**
   - **Recommended:** Use the [Determinate Systems Nix Installer](https://zero-to-nix.com/start/install/) for the best experience
   - **Alternative:** Follow the [official NixOS guide](https://nixos.org/download.html) if you prefer the traditional installer

2. **Enter the development shell:**
   In the project root, run:

   ```bash
   nix develop
   ```

   This drops you into a shell with the correct Node.js, Yarn, TypeScript, and required tools.

   Optional: direnv auto-enter
   - This repo includes an `.envrc` with `use flake` for seamless entry.
   - If you use direnv (+ nix-direnv), run `direnv allow` once in the repo, then simply `cd` into the folder to auto-enter the dev shell.
   - Works on macOS, Linux, and WSL.

   Prefer zsh inside nix?
   - Run `nix develop -c zsh` to start the dev shell with zsh.
   - In VS Code, the workspace terminal already uses your default shell inside nix (zsh if your `SHELL` is zsh).

3. **Install dependencies:**

   ```bash
   yarn install
   ```

4. **Run the applications:**

   Start the backend server (handles AI agents and tender data processing):

   ```bash
   yarn workspace @aipacto/apps-server dev
   ```

   Start the tender writer web application:

   ```bash
   yarn workspace @aipacto/apps-expo start
   ```

> **Note:** All commands below assume you are inside the Nix dev shell (`nix develop`).

## Monorepo Structure & Workspaces

Aipacto uses a monorepo managed with Yarn workspaces, organized around our tender writer application and municipal AI system. Each package/app has its own scripts. To run scripts for a specific package, use:

```sh
yarn workspace <package> <script>
```

**Key Workspaces:**

- **Tender Writer Application**: Cross-platform interface for creating procurement documents

  ```sh
  yarn workspace @aipacto/apps-expo start
  ```

- **Municipal AI Server**: Backend handling Spanish tender data crawling and AI processing

  ```sh
  yarn workspace @aipacto/apps-server dev
  ```

- **Shared Procurement Components**: UI components optimized for municipal workflows

  ```sh
  yarn workspace @aipacto/shared-ui-core build
  ```

## Contributing & PR Workflow

- **Branching:**
  - Never commit or push directly to `main`. Use feature branches and open a Pull Request (PR).
- **PR Types:**
  - Use **Draft PRs** for work-in-progress (WIP). Mark as "Ready for review" when complete.
  - Only **squash** or **rebase** merges are allowed (no merge commits).
- **CI/CD:**
  - GitHub Actions will run for all non-draft PRs and pushes to `main`.
  - Draft PRs will skip CI until marked ready.
- **Pre-commit hooks:**
  - Managed by Lefthook. Run checks for lint, types, secrets, and dependency consistency.

### Local Enforcement of Merge Policy

- **No direct commits or pushes to `main` are allowed.**  
  Our hooks will block any attempt to commit or push directly to the `main` branch.

- **On feature branches:**
  - **Before every commit** the following quick checks run automatically:
    - Lint (`yarn lint`)
    - Dependency consistency (`yarn check-deps`)
    - Secret scan of staged files (`yarn secretlint`)
  - **Before every push** additional enforcement runs:
    - Blocks direct pushes to `main` branch
    - Blocks merge commits to `main` branch (only rebase/squash allowed)
  - You can commit and push freely on feature branches. Heavy checks (type-checking, build, etc.) run in CI when you open a PR.
  - **Tip:** Use rebase or squash when your work is ready, then push and create a Pull Request.

## Pre-commit Checks

When you commit staged files, several automated checks will run (see `lefthook.yml`):

- **Block Main Commits**: Prevents direct commits to `main` branch
- **Linting**: Code style and formatting (`yarn lint`)
- **Dependency Version Consistency**: Ensures all packages use compatible versions (`yarn check-deps`)
- **Secret Scanning**: Prevents committing secrets (`yarn secretlint` on staged files)

If any check fails, your commit will be blocked. **You must fix all errors before committing.**

## Pre-push Checks

Additional checks run before pushing:

- **Block Main Push**: Prevents direct pushes to `main` branch
- **Block Merge Commits**: Prevents merge commits to `main` (enforces rebase/squash)

## Coding Standards

- Follow Clean Architecture and DDD principles (bounded contexts for procurement, municipal data, AI agents)
- Use TypeScript for all code (frontend and backend)
- For UI: Use Tamagui, Material Design 3, and custom tokens optimized for municipal interfaces
- Add new UI text to appropriate i18n files (Spanish/Catalan support for `common.json`)
- Prefer start/end over left/right for layout (LTR support, future RTL compatibility)
- Apply accessibility best practices (WCAG 2.1 AA for public sector compliance)
- Keep code and comments clear and concise
- Document public APIs with JSDoc, especially for tender processing functions

## CI & Quality

- **Build:** `yarn build`
- **Lint:** `yarn lint`
- **Type Check:** `yarn check-types`
- **Secrets:** `yarn check-secrets`
- **Dependencies versioning:** `yarn check-deps`

## Domain Knowledge

Contributing to Aipacto benefits from understanding:

- **Spanish Public Procurement**: Familiarity with LCSP (Ley de Contratos del Sector Público) and PLACSP portal
- **Municipal Operations**: Understanding of city council workflows and administrative processes
- **AI/LLM Integration**: Experience with LangChain, document processing, or Spanish language models

## Questions?

Feel free to open an issue or discussion on GitHub if you have questions about contributing to Spain's municipal AI revolution!
