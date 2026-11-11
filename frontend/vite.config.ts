import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 1420, strictPort: true },
  build: { assetsInlineLimit: 0 },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], testTimeout: 15000 },
});
