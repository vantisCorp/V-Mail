import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' && visualizer({ open: true, gzipSize: true }),
  ],
  
  // Build optimizations
  build: {
    // Enable source maps for production debugging
    sourcemap: false,
    
    // Minify output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    
    // Code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React and React DOM
          'react-vendor': ['react', 'react-dom'],
          // Tiptap editor
          'editor-vendor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
          ],
        },
        // Chunk file naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Target modern browsers
    target: 'esnext',
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    open: false,
    strictPort: false,
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@types': resolve(__dirname, './src/types'),
      '@styles': resolve(__dirname, './src/styles'),
      '@utils': resolve(__dirname, './src/utils'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase',
    },
  },
  
  // Dependencies optimization
  optimizeDeps: {
    include: ['react', 'react-dom', '@tiptap/react'],
  },
}));