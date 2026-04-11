import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
