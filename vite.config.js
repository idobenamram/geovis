import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
    },
    optimizeDeps: {
        include: ['monaco-editor/esm/vs/editor/editor.worker'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    monaco: ['monaco-editor'],
                    three: ['three'],
                },
            },
        },
    },
}); 