import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['xlsx'],
    exclude: ['openai']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@core': path.resolve(__dirname, './src/components/core'),
      '@shared': path.resolve(__dirname, './src/components/shared'),
      '@features': path.resolve(__dirname, './src/components/features'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@services': path.resolve(__dirname, './src/services')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
});