import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: [],
  },
  esbuild: {
    loader: 'js',
    format: 'esm',
    target: 'es2020',
  },
  resolve: {
    extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.json'],
    mainFields: ['module', 'browser', 'main'],
  },
  plugins: [
    {
      name: 'fix-html-parse',
      enforce: 'pre',
      transformIndexHtml(html) {
        return html.trim();
      },
    },
    {
      name: 'handle-js',
      transform(code, id) {
        if (id.endsWith('.js')) {
          return {
            code,
            map: null
          }
        }
      }
    }
  ],
}) 