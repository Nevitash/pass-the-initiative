import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/module.ts"),
      formats: ["es"],
      fileName: () => "module.js"
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: false
  }
});
