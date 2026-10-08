import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const apiPort = Number(process.env.API_PORT || 4000);
const devPort = Number(process.env.VITE_PORT || 3000);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Vercel's Express deployment serves public/ assets from its CDN. Emit the
    // built SPA there while keeping source public assets in public-assets/.
    publicDir: 'public-assets',
    build: { outDir: 'public' },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: devPort,
      host: '127.0.0.1',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: { '/api': `http://127.0.0.1:${apiPort}` },
    },
  };
});
