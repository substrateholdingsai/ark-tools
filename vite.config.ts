import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@tools': path.resolve(__dirname, './src/tools'),
      '@data': path.resolve(__dirname, './src/data'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
