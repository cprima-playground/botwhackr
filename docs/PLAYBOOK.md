# BotWhackr Solution Architecture Playbook

This repository follows a Phaser 3 + TypeScript architecture designed for a GitHub Pages deployment at `/botwhackr/`. The goals are:
- Keep a stable autoplay-focused promo loop that players can interrupt at any time.
- Ship a static build (no backend), with assets served from `/public`.
- Maintain clear module boundaries so scenes compose reusable systems instead of duplicating logic.

## Stack & layout
- **Framework:** Phaser 3 (latest stable).
- **Bundler:** Vite with `base: "/botwhackr/"` for Pages.
- **Language:** TypeScript.
- **Scenes:** Boot → Preload → Main (gameplay) + UI (HUD running in parallel).
- **Directories:** runtime code in `/src`, deployable assets in `/public`, source art or references in `/static-assets` (to be added as art lands).

## Runtime systems
- **InputController (`src/core/InputController.ts`):** normalizes keyboard/mouse/touch to jump events and signals when the player has taken over.
- **AutoplayController (`src/core/AutoplayController.ts`):** drives jumps while in demo mode and can be toggled off/on without disrupting the run.
- **LevelGenerator (`src/core/LevelGenerator.ts`):** lightweight obstacle spawning/pooling to keep the auto-run loop infinite.
- **ScoringSystem (`src/core/ScoringSystem.ts`):** tracks distance/time/deaths and emits updates for UI consumption.
- **AudioManager (`src/core/AudioManager.ts`):** placeholder toggle point for SFX/music.

## Autoplay & takeover rules
- Autoplay is active on load. Any jump input latches player control and pauses autoplay until inactivity lasts longer than `autoplayConfig.reenableTimeoutMs`.
- Jumps are buffered by `autoplayConfig.jumpBufferMs` to avoid spamming.
- Run resets are soft: tint + delay, then return to the starting lane while preserving whether the player or autoplay is in charge.

## Asset & UX constraints
- Logical resolution: 320×180, pixel art scaling (`image-rendering: pixelated`).
- Placeholder vector textures live in generated textures until production sprites/audio arrive; production assets should live under `/public/assets`.
- Provide quick mute toggle/hotkey when audio assets are added; keep controls keyboard-friendly (space/W/up + click/tap).

## CI/CD expectations
- Protect `main`; ship via GitHub Actions that run `npm ci`, `npm run build`, and publish `dist/` to GitHub Pages.
- All asset references must respect the `/botwhackr/` base path to avoid broken links in the hosted build.
