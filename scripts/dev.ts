import { spawn } from "node:child_process"
spawn("pnpm -F @wtk/fs dev --debug --dirname=../../apps/core", { shell: true })
spawn("pnpm -F wtk dev --open", { shell: true })
