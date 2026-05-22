let url = new URL(/* @vite-ignore */ "./", import.meta.url)
if (!url.href.endsWith("/")) {
  url = new URL(url.href + "/")
}
export const rootURL = url

export { AI, ai, setAI } from "./wtk/ai/index.js"
export { Game, game, setGame } from "./wtk/game/index.js"
export { Get, get, setGet } from "./wtk/get/index.js"
export { Library, lib, setLibrary } from "./wtk/library/index.js"
export { status, _status, setStatus } from "./wtk/status/index.js"
export { UI, ui, setUI } from "./wtk/ui/index.js"
