# Shmup — Vite + SCSS

This is a minimal Vite project for a plain HTML site that compiles SCSS and provides hot-reload on save.

Quick start

1. Install dependencies

   npm install

2. Start dev server (runs on http://localhost:2900)

   npm run dev

3. Build for production

   npm run build

Notes

- SCSS is imported in `src/main.js` so Vite handles style HMR automatically.
- The dev server is configured to run on port 2900 in `vite.config.js`.
