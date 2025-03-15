import { defineConfig } from 'vite';
import wasm from "vite-plugin-wasm";
import react from '@vitejs/plugin-react';
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    plugins: [react(), topLevelAwait({
        // The export name of top-level await promise for each chunk module
        promiseExportName: "__tla",
        // The function to generate import names of top-level await promise in each chunk module
        promiseImportName: i => `__tla_${i}`
    }), wasm()],
    // worker: {
    //     format: 'es',
    //     plugins: [topLevelAwait({
    //         // The export name of top-level await promise for each chunk module
    //         promiseExportName: "__tla",
    //         // The function to generate import names of top-level await promise in each chunk module
    //         promiseImportName: i => `__tla_${i}`
    //     })],
    // },
    server: {
        port: 3000,
    },
    optimizeDeps: {
        include: ['monaco-editor/esm/vs/editor/editor.worker'],
        exclude: ['latex-expr-parser', 'geo-calc']
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