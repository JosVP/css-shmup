import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 2900,
    open: true,
  },
  build: {
    minify: false,
  },
});
