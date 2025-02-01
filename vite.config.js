import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
    },
    optimizeDeps: {
        include: ['monaco-editor/esm/vs/editor/editor.worker'],
    },
    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    monaco: ['monaco-editor'],
                    three: ['three'],
                },
            },
        },
    },
    esbuild: {
        target: 'esnext',
    },
}); 