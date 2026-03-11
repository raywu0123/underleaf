/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const buildTime = new Date().toLocaleString()
const buildTimestamp = Date.now()

// https://vite.dev/config/
export default defineConfig({
  base: '/underleaf/',
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_TIMESTAMP__: buildTimestamp,
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage: {
      include: ['src/**'],
      exclude: ['src/**/*.test.tsx', 'src/**/*.test.ts', 'src/setupTests.ts', 'src/globals.d.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
})
