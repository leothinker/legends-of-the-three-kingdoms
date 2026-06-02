import { spawnSync } from "node:child_process"
import fs from "node:fs/promises"
spawnSync("pnpm -F wtk... build", {
  shell: true,
  stdio: "inherit",
})

console.log("合并打包结果")
await fs.rm("dist", { recursive: true, force: true })
await fs.mkdir("dist", { recursive: true })
await Promise.all([
  fs.cp("apps/core/dist", "dist", { recursive: true }),
  fs.cp("apps/core/audio", "dist/audio", { recursive: true }),
  fs.cp("apps/core/image", "dist/image", { recursive: true }),
])
