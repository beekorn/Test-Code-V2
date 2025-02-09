import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'codemirror': path.resolve(__dirname, 'node_modules/codemirror'),
    }
  },
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      external: [
        'codemirror',
      ],
      output: {
        globals: {
          'codemirror': 'CodeMirror',
        },
      },
    },
  },
});
