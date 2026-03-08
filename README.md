# Underleaf 🍃

Underleaf is a fully browser-based, collaborative LaTeX editor. It provides a real-time, peer-to-peer editing experience combined with local, privacy-first PDF compilation using WebAssembly. 

No backend servers required. No compilation limits.

Live Demo: [https://raywu0123.github.io/underleaf/](https://raywu0123.github.io/underleaf/)

## Features

- **Peer-to-Peer Collaboration:** Powered by [Yjs](https://yjs.dev/) and WebRTC, allowing multiple users to edit the same LaTeX document in real-time.
- **Local Compilation:** Compiles LaTeX to PDF directly in your browser using [texlyre-busytex](https://github.com/texlyre/texlyre-busytex) (a WebAssembly port of TeXLive).
- **Privacy First:** Your document data and compilation happen locally or peer-to-peer. 
- **Offline Capable:** Because the LaTeX distribution is cached locally, basic compilation works offline once the assets are downloaded.
- **Project Dashboard:** Create, manage, and delete multiple LaTeX documents from a built-in dashboard.

## How it Works

1. **Collaboration:** When you open a document, a unique room ID is generated. Sharing the URL allows others to join the WebRTC room. Yjs synchronizes the Monaco Editor state across all connected peers.
2. **Compilation:** When you hit "Compile", the LaTeX source code is sent to a Web Worker running the BusyTeX WebAssembly engine. The engine processes the text using a slimmed-down TeXLive distribution stored in memory and returns a raw PDF Blob, which is displayed in an iframe.
3. **Storage:** Document metadata (titles, creation dates) is stored in your browser's `localStorage`. Document content lives in the distributed Yjs state.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/raywu0123/underleaf.git
   cd underleaf
   ```

2. Install dependencies (this will automatically download the required BusyTeX WebAssembly assets to `public/core/`):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Deployment

This project is a static site (SPA) and can be deployed to any static hosting provider (GitHub Pages, Vercel, Netlify). 

### Security Headers (COOP / COEP)
Compiling LaTeX via WebAssembly requires `SharedArrayBuffer` support in the browser. For this to work, the server *must* respond with the following headers:
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

For hosts like GitHub Pages that do not support custom headers, this project uses [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) to automatically inject them on the client side.

### Deploying to GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```

## Technologies Used

- **Framework:** React + TypeScript + Vite
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Collaboration:** Yjs, y-monaco, y-webrtc
- **LaTeX Engine:** texlyre-busytex (WebAssembly)
- **Routing:** React Router (HashRouter for static hosting)

## License

MIT License
