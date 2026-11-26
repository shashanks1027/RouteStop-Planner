import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api calls go to the Express server, so the browser sees one origin (no CORS needed).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
});
