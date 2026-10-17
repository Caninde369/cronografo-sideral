import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('jspdf') || id.includes('html2canvas')) {
                  return 'export-pdf';
                }
                if (id.includes('firebase')) {
                  return 'firebase-vendor';
                }
                if (id.includes('astronomy-engine')) {
                  return 'astronomy-engine';
                }
                if (id.includes('lucide-react')) {
                  return 'icons';
                }
                if (id.includes('framer-motion')) {
                  return 'framer-motion';
                }
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
