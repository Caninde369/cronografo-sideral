import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        port: 3000,
        host: '0.0.0.0',
        open: true,
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            onwarn(warning, warn) {
                // Suppress typescript warnings during build
                if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
                warn(warning);
            }
        }
    }
});

