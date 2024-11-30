import { defineConfig } from "@farmfe/core";
import vue from "@vitejs/plugin-vue";
import worker from "@farmfe/plugin-worker";
import postcss from "@farmfe/js-plugin-postcss";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [worker(), postcss()],
  vitePlugins: [
    vue(),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
  ],

  clearScreen: false,
  compilation: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    treeShaking: false,
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
          watchOptions: {
            ignored: ["**/src-tauri/**"],
          },
        }
      : undefined,
  },
});
