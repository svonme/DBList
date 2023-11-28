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
    polyfillModulePreload: false,
    lib: {
      entry: "src/index",
      name: "DBList",
      formats: ["umd"],
      fileName: "dblist",
      
    },
    sourcemap: true,
    manifest: false,
    rollupOptions: {
      external: [
      ],
      output: {
        exports: "default",
        inlineDynamicImports: true
      }
    }
  },
})
