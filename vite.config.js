import { defineConfig } from 'vite';
import wasm from "vite-plugin-wasm";
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react(), wasm()],
    server: {
        port: 3000,
    },
    optimizeDeps: {
        include: ['monaco-editor/esm/vs/editor/editor.worker'],
        exclude: ['latex-expr-parser']
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