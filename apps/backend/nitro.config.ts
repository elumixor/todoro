import { resolve } from "node:path";
import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  preset: "vercel",
  srcDir: "src/api",
  compatibilityDate: "2025-01-01",
  alias: {
    env: resolve("./src/env"),
    services: resolve("./src/services"),
    utils: resolve("./src/utils/handler.ts"),
  },
  rollupConfig: {
    plugins: [
      {
        name: "prisma-client-exact-alias",
        resolveId(id: string) {
          if (id === "generated:prisma") return resolve("./generated/prisma/client.ts");
        },
      },
    ],
  },
});
