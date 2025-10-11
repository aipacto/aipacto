# Repository Guidelines

## Project

Aipacto is a web app inspired by ChatGPT, designed for city councils, their workers, and citizens. It provides AI-driven interactions and includes a collaborative workspace à la Google Workspace, enabling organizations, groups, folders, and document management with real-time editing, permissions, and storage.

## Tech Stack

- Clean Architecture
- Nix Flake for development environment
- TypeScript +v5.8, ESM-only, tsconfig as "bundler"
- pnpm v9 (not npm)
- Effect +v3.17
- Langchain +v0.3, Langgraph +v0.2.71
- Web: React +v19.1.0 + Vite v6 + Tanstack Router (file-based routing)
- Packages:
  @aipacto/agents-domain: ../../agents/domain/src
  @aipacto/agents-infra-langchain: ../../infrastructure/langchain/src
  @aipacto/shared-domain: ../domain/src
  @aipacto/shared-ui-localization: ../ui/localization/src
  @aipacto/shared-utils-env: ../utils/env/src
  @aipacto/shared-utils-logging: ../utils/logging/src
  …

## Project Structure & Module Organization

- Monorepo (pnpm v9 + Turbo, Node >= 22, optional Nix dev shell).
- `apps/`: `server`, `web`, `harvesting_cli`.
- `packages/`: `agents` (domain, infra-langchain), `shared` (domain, ui, utils, tsconfig), `infrastructure`.

## Build, and Development Commands

- `nix develop`: enter pinned toolchain (Node, pnpm, TypeScript).
- Optional: `direnv` auto-enter. This repo ships `.envrc` with `use flake`. If you use direnv (+ nix-direnv), run `direnv allow` once in the repo to auto-enter the dev shell on `cd`.
- `pnpm install`: install workspace deps.
- `pnpm server`: run backend (`@aipacto/apps-server` dev).
- `pnpm web`: run Expo on web; use `pnpm --filter @aipacto/apps-expo start` for native.
- `pnpm build`: Turbo build all packages. Per package: `pnpm --filter <pkg> build`.
- Quality: `pnpm lint`, `pnpm check-types`, `pnpm check-secrets`, `pnpm check-deps`.

## Coding Style & Naming Conventions

- TypeScript + ESM. tab‑space indent. Strict types where feasible.
- Biome enforces formatting/lint: `pnpm lint` or `pnpm lint:biome`.
- Names: files/dirs kebab-case; React components PascalCase; vars/functions camelCase; env UPPER_SNAKE_CASE.
- Follow Clean Architecture & DDD boundaries; document public APIs with JSDoc.

## Commit & Pull Request Guidelines

- Conventional Commits (enforced by Commitlint): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- No direct commits/pushes to `main`; Lefthook blocks and runs lint/secret checks.
- PRs: clear description, linked issues, screenshots for UI, and doc updates when needed. Use squash or rebase (no merge commits).

## Frontend

- **UI Framework**: Tanstack Start (SSR) + React 19 + Vite.
- **Component Library**: Base UI (`@base-ui-components/react`) for headless accessible components.
- **Styling**: Tailwind CSS v4 with Material Design 3 token system.
- **MD3 Tokens System**: All design tokens are defined as CSS variables in `apps/web/src/styles/global.css` and mapped to Tailwind utilities in `apps/web/tailwind.config.ts`:
  - **Colors** (theme-specific): MD3 color roles (primary, on-primary, surface, surface-container, outline, etc.) for light/dark themes with medium/high contrast variants in `apps/web/src/styles/themes.css`.
  - **Spacing** (fluid): `clamp()`-based tokens (none, xxs, xs, sm, md, lg, xl, xxl) that scale smoothly between viewport widths using rem units.
  - **Typography** (fluid): MD3 type scale with viewport-responsive sizing - display-m/s, heading-l/m, title, body-l/m, label-l/m.
  - **Border Radius** (fluid): Tokens (none, sm, md, lg, xl, full) with `clamp()` scaling.
  - **Z-index** (semantic): Layering tokens (negative, background, default, dropdown, sticky, fixed, modal-backdrop, offcanvas, modal, popover, tooltip).
  - **Usage**: Access via Tailwind classes (`bg-surface-container`, `text-on-primary`, `rounded-lg`, `text-body-l`, `p-md`, `gap-sm`) or CSS variables (`var(--surface)`, `var(--spacing-md)`).
- **Fluid Design System**: All dimensional tokens (spacing, typography, border radius) use fluid scaling with `clamp(min, preferred, max)` where preferred is vw-based. Never use fixed px/rem values - always use tokens for consistent responsive behavior across all viewport sizes.
- **Design System**: Follow Material Design 3 guidelines and naming conventions for all UI components and tokens.
- **Localization**: Add UI text to `@aipacto/shared-ui-localization` (i18n) in `packages/shared/ui/localization/src/locales/[eng|spa|cat]/common.json`.

## Requirements

- Try to keep comments and docs in the code.
- For UI tasks:
  - Use start-end before left-right terms to support ltr/rtl when CSS and Tailwind allow it.
  - Consider accessibility, follow best practices. Use Base UI components for accessible primitives.
  - Use MD3 tokens exclusively via Tailwind classes (e.g., `bg-surface-container`, `text-body-l`, `p-md`).
- Keep spacing between lines like the current code.

## Security & Configuration

- Never commit secrets. Secretlint scans staged files.
- Use `.env.example` templates; don't commit `.env` (see `infrastructure/dagger/.env.example` for CI/local tooling).
- After cloning: `pnpm install`, `pnpm prepare` (install hooks), optionally `pnpm generate-paths` to refresh TS path aliases.
