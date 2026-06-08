import fs from "node:fs"
import path from "node:path"
import type { Plugin } from "vite"

export default function vitePluginJIT(): Plugin {
  let _root = process.cwd()
  let isBuild = false

  return {
    name: "vite-plugin-jit",

    configResolved(config) {
      isBuild = config.command === "build"
      _root = config.root
    },

    transformIndexHtml(html) {
      if (!isBuild) return
      const script = fs
        .readFileSync(path.resolve(import.meta.dirname, "entry.js"))
        .toString()
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              type: "module",
            },
            children: script,
            injectTo: "head-prepend",
          },
        ],
      }
    },
    closeBundle() {
      fs.copyFileSync(
        path.resolve(import.meta.dirname, "service-worker/index.js"),
        path.resolve("dist/service-worker.js"),
      )
      fs.copyFileSync(
        path.resolve(import.meta.dirname, "public/jit-test.ts"),
        path.resolve("dist/jit-test.ts"),
      )
    },
  }
}
