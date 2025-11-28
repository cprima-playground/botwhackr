# botwhackr

Retro-styled Phaser 3 auto-runner prototype, set up for GitHub Pages deployment. The game autoplays by default so it can serve as a hands-off promo loop, while still allowing players to take control instantly.

## Project goals
- **Stable promo experience:** autoplay starts immediately and can be overridden by player input without stopping the loop.
- **Simple static footprint:** Vite + TypeScript only; assets are generated placeholders for now.
- **Maintainable architecture:** clear scene responsibilities (Boot → Preload → Main + UI) with reusable systems for input, autoplay, level generation, scoring, and audio.

## Repo layout
```
root
├── index.html            # Static shell used by Vite and GitHub Pages
├── src/
│   ├── config/           # Game constants (dimensions, tuning, copy)
│   ├── core/             # Systems: input, autoplay, level gen, scoring, audio
│   └── scenes/           # Boot, Preload, Main, and UI scenes
├── package.json          # Vite + Phaser + TypeScript toolchain
└── vite.config.ts        # Configured with base "/botwhackr/" for Pages
```

## Running locally
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production/GitHub Pages: `npm run build`

## Gameplay/UX notes
- Autoplay is enabled at startup; pressing space, W, up-arrow, or clicking triggers a jump and hands control to the player.
- If the player does nothing for a while after taking control, autoplay can resume automatically.
- The UI scene shows distance, elapsed time, death count, and the current control mode text.

## Keyboard shortcuts
- **Jump:** Space, Up Arrow, W, or Z (mouse/touch click also jumps and hands over control)
- **Mute/unmute:** M
- **Pause/resume physics:** P

## Next steps
- Swap placeholder textures for final pixel art and audio assets served from `/public/assets`.
- Expand level generator with pooled platforms/enemies and more nuanced autoplay heuristics.
- Wire GitHub Actions to build and deploy `dist/` to GitHub Pages on each `main` push.
