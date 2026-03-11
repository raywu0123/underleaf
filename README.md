# Underleaf 🍃

Underleaf is a browser-based, collaborative LaTeX editor. It provides a real-time editing experience combined with local, privacy-first PDF compilation using WebAssembly. 

Live Demo: [https://raywu0123.github.io/underleaf/](https://raywu0123.github.io/underleaf/)

## Architecture

Underleaf is structured as an NPM workspaces **monorepo**:

- `apps/web`: The React frontend application (SPA).
- `apps/server`: The real-time WebSocket backend powered by [Hocuspocus](https://hocuspocus.dev/) to synchronize document state via [Yjs](https://yjs.dev/).

## Features

- **Real-Time Collaboration:** Powered by Yjs and Hocuspocus WebSockets, allowing multiple users to edit the same LaTeX document simultaneously with live cursor and avatar tracking.
- **Local Compilation:** Compiles LaTeX to PDF directly in your browser using [texlyre-busytex](https://github.com/texlyre/texlyre-busytex) (a WebAssembly port of TeXLive).
- **Privacy First:** Document compilation happens entirely on the client side.
- **Project Dashboard:** Create, manage, and delete multiple LaTeX documents from a built-in dashboard.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/raywu0123/underleaf.git
   cd underleaf
   ```

2. Install dependencies (this will automatically download the required BusyTeX WebAssembly assets to `apps/web/public/core/`):
   ```bash
   npm install
   ```

3. Start the development environment (this boots both the Vite frontend and the Hocuspocus WebSocket server concurrently):
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser. The backend server will run on `ws://localhost:1234`.

### Testing

Underleaf uses [Vitest](https://vitest.dev/) for unit testing. To run the test suite across all workspaces:

```bash
npm run test
```

## Deployment

The application consists of a static frontend site and a WebSocket backend.

### Frontend Deployment

This project uses [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) to inject required `SharedArrayBuffer` security headers on the client side, allowing it to be hosted on any static hosting provider (e.g., GitHub Pages).

By default, the frontend attempts to connect to `ws://localhost:1234`. In production, supply your backend URL as an environment variable (`VITE_WS_URL`) before building:

```bash
VITE_WS_URL=wss://api.yourdomain.com/ws npm run build
npm run deploy
```

### Backend Deployment

The Hocuspocus backend located in `apps/server` can be deployed to any Node.js hosting environment (such as Render, Heroku, or DigitalOcean App Platform). It exposes a WebSocket server on port `1234` by default.

## Technologies Used

- **Framework:** React + TypeScript + Vite
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Collaboration:** Yjs, y-monaco, Hocuspocus
- **Testing:** Vitest, React Testing Library
- **LaTeX Engine:** texlyre-busytex (WebAssembly)

## License

MIT License
