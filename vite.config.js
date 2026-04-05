import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 2900,
    open: true,
  },
  build: {
    minify: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["slash-div", "import", "global-builtin"],
      },
    },
  },
  plugins: [
    {
      name: "force-full-reload",
      handleHotUpdate({ server }) {
        server.ws.send({ type: "full-reload" });
        return [];
      },
    },
  ],
});
