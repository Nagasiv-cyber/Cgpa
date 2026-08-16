import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/Cgpa/",
  nitro: {
    preset: "node-server",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [
    {
      name: "rewrite-asset-json-urls",
      enforce: "pre",
      transform(code, id) {
        if (id.endsWith(".asset.json")) {
          return {
            code: code.replace(/"url":\s*"\//g, '"url": "/Cgpa/'),
            map: null,
          };
        }
      },
    },
  ],
});
