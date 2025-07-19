# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Aipacto is a web app inspired by ChatGPT, designed for city councils, their workers, and citizens. It provides AI-driven interactions and includes a collaborative workspace à la Google Workspace, enabling organizations, groups, folders, and document management with real-time editing, permissions, and storage.

## Tech Stack

- Clean Architecture
- Nix Flake for development environment
- TypeScript +v5.8, ESM-only, tsconfig as "bundler"
- Yarn v4 (not npm)
- Effect +v3.14
- Langchain +v0.3, Langgraph +v0.2.71
- React +v19.1.0
- Web: Vite v6 + Tanstack Router (file-based routing)
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
