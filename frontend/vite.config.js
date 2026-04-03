import { defineConfig } from "vite";

/** Для GitHub Pages: VITE_BASE=/имя-репозитория/ (со слэшем в конце). Локально не задаём. */
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
