import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

const port = {
  client: 8081,
  server: 8089,
}

export default defineConfig({
  appType: "mpa",
  root: ".",
  base: "./",
  resolve: {
    alias: {
      "@": "/wtk",
      wtk: "/wtk.js",
    },
  },
  plugins: [vue()],
  server: {
    host: "127.0.0.1",
    port: port.client,
    fs: {
      allow: ["../.."],
    },
    proxy: {
      "/checkFile": `http://127.0.0.1:${port.server}`,
      "/checkDir": `http://127.0.0.1:${port.server}`,
      "/readFile": `http://127.0.0.1:${port.server}`,
      "/readFileAsText": `http://127.0.0.1:${port.server}`,
      "/getFileList": `http://127.0.0.1:${port.server}`,
    },
  },
})
