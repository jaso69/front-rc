import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "editor",
  plugins: [react()],
  resolve: {
    alias: {
      "@schema": new URL("./src/schema", import.meta.url).pathname,
    },
  },
  build: {
    outDir: "../dist-editor",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/assets": "http://localhost:3000",
      "/designs": "http://localhost:3000",
    },
  },
});
