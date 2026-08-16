// This config is used ONLY for GitHub Pages static deployment (GitHub Actions CI).
// It inherits the main vite.config.ts config but explicitly disables Nitro/SSR,
// producing a pure Vite client-side SPA bundle in dist/client/.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    server: { entry: "server" },
  },
});
