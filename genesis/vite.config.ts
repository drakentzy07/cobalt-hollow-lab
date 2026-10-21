import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
export default defineConfig({
  root,
  base: process.env.GENESIS_BASE ?? '/cobalt-hollow-lab/',
  build: {
    outDir: 'dist-genesis',
    emptyOutDir: true,
    rollupOptions: { input: path.join(root, 'genesis/index.html') },
    sourcemap: false,
    target: 'es2022',
  },
});
