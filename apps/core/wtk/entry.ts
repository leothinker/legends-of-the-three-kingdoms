import { game, lib } from "wtk"
import { boot } from "@/init/index.js"
import { device, userAgentLowerCase } from "@/util/index.js"
import { loadBuildInfo } from "@/util/meta.js"
import "core-js-bundle"
// 保证打包时存在(importmap)
import "vue/dist/vue.esm-browser.js"

;(async () => {
  try {
    lib.device = device

    // 预加载脚本
    const { default: preload } = await import("./init/browser.js")
    await preload({ lib, game })
    lib.buildInfo = await loadBuildInfo((url) => lib.init.promises.json(url))

    await boot()
  } catch (e) {
    console.error(e)
    alert(`《三国杀》加载内容失败
浏览器UA信息: 
${userAgentLowerCase}
错误信息: 
${e instanceof Error ? e.stack : String(e)}
若您不理解该信息，请依次检查：
1. 游戏文件是否完整（重新下载完整包）
2. 客户端是否需要更新
3. 浏览器是否需要更新
4. 若您直接打开index.html进行游戏，请改为运行文件夹内的wtk-server.exe
5. 若以上步骤均无法解决问题，请及时向开发组反馈`)
  }
})()
