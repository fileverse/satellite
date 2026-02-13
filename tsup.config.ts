import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    worker: "src/worker.ts",
    cloudflare: "src/cloudflare.ts",
    "cli/index": "src/cli/index.ts",
    "commands/index": "src/commands/index.ts",
    "mcp/index": "src/mcp/index.ts",
  },
  format: ["esm"],
  target: "node20",
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: false,
  shims: true,
});
