import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "src/": `${path.resolve(__dirname, "src")}/index`,
    },
  },
  plugins: [],
  build: {
    outDir: "./build",
    target: "modules",
    lib: {
      entry: "src/index",
      name: "DBList",
      formats: ["cjs", "es", "umd"],
      fileName: "dblist",
    },
    sourcemap: false,
    manifest: false,
  },
})
