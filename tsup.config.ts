import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    worker: "src/worker.ts",
    "cli/index": "src/cli/index.ts",
    "commands/index": "src/commands/index.ts",
    "mcp/index": "src/mcp/index.ts",
    base: "src/base.ts",
  },
  format: ["esm"],
  target: "node20",
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: true,
  shims: true,
});
