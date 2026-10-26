import { defineConfig } from 'vite';
export default defineConfig({
  root: 'website',
  base: './',
  build: { outDir: '../docs', emptyOutDir: true, target: 'es2020' },
  server: { host: '127.0.0.1', port: 5182, strictPort: true }
});
