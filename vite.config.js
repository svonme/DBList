import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    extensions: [".ts"],
    alias: {
      "src/": `${path.resolve(__dirname, "src")}/`,
    },
  },
  plugins: [],
  build: {
    outDir: "./build",
    target: "modules",
    polyfillModulePreload: false,
    lib: {
      entry: "src/index",
      name: "db",
      formats: ["es"],
      fileName: "db"
    },
    sourcemap: true,
    manifest: false,
    rollupOptions: {
      external: [
        /^lodash/i,
      ],
      output: {
        inlineDynamicImports: true
      }
    }
  },
})
