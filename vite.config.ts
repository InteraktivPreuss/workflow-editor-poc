import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// On GitHub Pages the app is served from /workflow-editor-poc/, so production
// assets must be referenced from that base. Dev stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/workflow-editor-poc/' : '/',
  plugins: [react(), tailwindcss()],
}));
