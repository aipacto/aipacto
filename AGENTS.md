# Repository Guidelines

## Project

Aipacto is a web app inspired by ChatGPT, designed for city councils, their workers, and citizens. It provides AI-driven interactions and includes a collaborative workspace à la Google Workspace, enabling organizations, groups, folders, and document management with real-time editing, permissions, and storage.

## Tech Stack

- Clean Architecture
- Nix Flake for development environment
- TypeScript +v5.8, ESM-only, tsconfig as "bundler"
- Yarn v4 (not npm)
- Effect +v3.14
- Langchain +v0.3, Langgraph +v0.2.71
- Web: React +v19.1.0 + Vite v6 + Tanstack Router (file-based routing)
- Packages:
  @aipacto/agents-domain: ../../agents/domain/src
  @aipacto/agents-infra-langchain: ../../infrastructure/langchain/src
  @aipacto/shared-domain: ../domain/src
  @aipacto/shared-ui-localization: ../ui/localization/src
  @aipacto/shared-utils-env: ../utils/env/src
  @aipacto/shared-utils-logging: ../utils/logging/src
  @aipacto/workspace-domain: ../../workspace/domain/src
  @aipacto/workspace-infra-authz: ../../workspace/infrastructure/authz/src
  @aipacto/workspace-infra-storage: ../../workspace/infrastructure/storage/src
  …

## Project Structure & Module Organization

- Monorepo (Yarn v4 + Turbo, Node >= 22, optional Nix dev shell).
- `apps/`: `expo`, `server`, `web`, `marketing`, `harvesting_cli`.
- `packages/`: `agents` (domain, infra-langchain), `shared` (domain, ui, utils, tsconfig), `infrastructure`, `workspace`.
- `services/`: auth, authz, db, email, sync. `infrastructure/`: CI/build tooling (e.g., `infrastructure/dagger`).
- Tests: colocate as `*.test.ts[x]` or under `__tests__/` near source.

## Build, Test, and Development Commands

- `nix develop`: enter pinned toolchain (Node, Yarn, TypeScript).
- Optional: `direnv` auto-enter. This repo ships `.envrc` with `use flake`. If you use direnv (+ nix-direnv), run `direnv allow` once in the repo to auto-enter the dev shell on `cd`.
- `yarn install`: install workspace deps.
- `yarn server`: run backend (`@aipacto/apps-server` dev).
- `yarn web`: run Expo on web; use `yarn workspace @aipacto/apps-expo start` for native.
- `yarn build`: Turbo build all packages. Per package: `yarn workspace <pkg> build`.
- Quality: `yarn lint`, `yarn check-types`, `yarn check-secrets`, `yarn check-deps`.

## Coding Style & Naming Conventions

- TypeScript + ESM. tab‑space indent. Strict types where feasible.
- Biome enforces formatting/lint: `yarn lint` or `yarn lint:biome`.
- Names: files/dirs kebab-case; React components PascalCase; vars/functions camelCase; env UPPER_SNAKE_CASE.
- Follow Clean Architecture & DDD boundaries; document public APIs with JSDoc.

## Commit & Pull Request Guidelines

- Conventional Commits (enforced by Commitlint): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- No direct commits/pushes to `main`; Lefthook blocks and runs lint/secret checks.
- PRs: clear description, linked issues, screenshots for UI, and doc updates when needed. Use squash or rebase (no merge commits).

## Frontend

- Shadcn (in apps/web/src/components/ui imported with `~components`) and Tailwind (with all available tokens in apps/web/tailwind.config.ts and apps/web/src/styles/global.css).
- Use fluid spacing (like utopia.fyi: no fixed sizes, rem, clamp(), etc; apps/web/src/styles/global.css).
- Follow Material Design 3 guidelines and tokens naming conventions.
- Localize text for UI adding it to @aipacto/shared-ui-localization (i18n) in packages/shared/ui/localization/src/locales/[eng|spa|cat]/common.json.

## Requirements

- Try to keep comments and docs in the code.
- For UI tasks:
  - Use start-end before left-right terms to support ltr/rtl when CSS and Tailwind allow it.
  - Consider accessibility, follow best practices. You can use RadixUI (behind Shadcn) or react-aria-components.
- Keep spacing between lines like the current code.

## Security & Configuration

- Never commit secrets. Secretlint scans staged files.
- Use `.env.example` templates; don't commit `.env` (see `infrastructure/dagger/.env.example` for CI/local tooling).
- After cloning: `yarn install`, `yarn prepare` (install hooks), optionally `yarn generate-paths` to refresh TS path aliases.
