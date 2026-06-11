import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  base: '/',
  build: {
    sourcemap: false,
  },
  plugins: [
    react({
      babel: {
        plugins: mode === 'development'
          ? ['react-dev-locator']
          : [],
      },
    }),
    tsconfigPaths(),
    // Chunk splitting for Vite 8 (Rolldown)
    {
      name: 'chunk-split',
      config() {
        return {
          build: {
            rollupOptions: {
              output: {
                manualChunks(id) {
                  if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
                  if (id.includes('node_modules/marked') || id.includes('node_modules/dompurify')) return 'vendor-markdown';
                  if (id.includes('node_modules/lucide-react') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'vendor-ui';
                  if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom')) return 'vendor-react';
                },
              },
            },
          },
        };
      },
    },
  ],
}))
