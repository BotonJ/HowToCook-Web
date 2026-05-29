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
  ],
}))
