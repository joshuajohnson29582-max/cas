# Neon Casino — Telegram Mini App MVP

A mobile-first virtual-currency casino prototype built with React, Vite, Tailwind-compatible plain CSS, React Three Fiber, Drei and a modular async game service.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Architecture

- `src/gameService.js`: asynchronous mock for balance, bets and game outcomes. Replace it with an API adapter when backend/real payments are introduced.
- `src/App.jsx`: UI and Three.js scenes only. The UI never generates final outcomes.
- Telegram WebApp API is optional and falls back to browser behavior.
- The game uses virtual coins only and is not a real-money product.
