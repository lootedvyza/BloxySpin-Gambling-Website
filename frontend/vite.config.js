import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.mov"],
  css: {
    postcss: false,
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "window",
    "process.env": {},
    "process.version": '"v18.0.0"',
  },
});
