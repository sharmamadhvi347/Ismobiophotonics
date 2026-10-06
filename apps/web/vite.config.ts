import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pms/config': path.resolve(__dirname, '../../packages/config/src'),
      '@pms/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@pms/validation': path.resolve(__dirname, '../../packages/validation/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
