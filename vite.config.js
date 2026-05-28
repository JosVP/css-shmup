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
    {
      name: "log-rebuild-success",
      configureServer(server) {
        server.watcher.on("change", (file) => {
          // Wait briefly for Vite to process the file and clear errors
          setTimeout(() => {
            console.log(
              `\x1b[32m✓\x1b[0m Rebuild successful after change in: ${file}`,
            );
          }, 200);
        });
      },
    },
  ],
});
