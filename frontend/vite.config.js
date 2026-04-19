import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";

function viteBase() {
  const b = process.env.VITE_BASE || "/";
  if (b === "/" || b === "") return "/";
  return b.endsWith("/") ? b : b + "/";
}

export default defineConfig({
  root: ".",
  base: viteBase(),
  publicDir: "public",
  plugins: [
    {
      name: "copy-index-to-404",
      closeBundle: function () {
        var d = join(process.cwd(), "dist");
        copyFileSync(join(d, "index.html"), join(d, "404.html"));
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
