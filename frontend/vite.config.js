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
