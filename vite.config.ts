import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  // Dev server for `npm run dev`. The extension loads its code from here and
  // reloads itself when files change. Chrome extension pages need CORS access.
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
    cors: { origin: [/chrome-extension:\/\//] },
  },
  css: {
    preprocessorOptions: {
      // Lets any .scss file `@use "tokens";` the shared design tokens in src/styles
      scss: { loadPaths: [fileURLToPath(new URL("./src/styles", import.meta.url))] },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
