/// <reference types="vite/client" />
import { game, lib } from "wtk"

export async function importCardPack(name: string) {
  await importFunction("card", `/card/${name}`)
}

export async function importCharacterPack(name: string) {
  const alreadyModernCharacterPack = lib.config.moderned_characters || []
  const path =
    import.meta.env.DEV || !alreadyModernCharacterPack.includes(name)
      ? `/character/${name}/index`
      : `/character/${name}`
  await importFunction("character", path).catch((e) => {
    console.error(`武将包《${name}》加载失败`, e)
    // 		alert(`武将包《${name}》加载失败
    // 错误信息:
    // ${e instanceof Error ? e.stack : String(e)}
    // 如果您在扩展中使用了game.import创建武将包，可将以下代码删除: lib.config.all.characters.push('武将包名');`);
  })
}

export async function importMode(name: string) {
  const alreadyModernMode = lib.config.moderned_modes || []
  const path = alreadyModernMode.includes(name)
    ? `/mode/${name}/index`
    : `/mode/${name}`
  await importFunction("mode", path)
}

async function importFunction(
  type: "card" | "character" | "mode",
  path: string,
): Promise<void> {
  const modeContent = await import(/* @vite-ignore */ `${path}.js`).catch(
    async (e) => {
      if (window.isSecureContext) {
        try {
          return await import(/* @vite-ignore */ `${path}.ts`)
        } catch {
          throw e
        }
      }
      throw e
    },
  )
  if (!modeContent.type) return
  if (modeContent.type !== type) {
    throw new Error(
      `Loaded Content doesn't match "${type}" (received "${modeContent.type}").`,
    )
  }
  // @ts-expect-error ignore
  await game.import(type, modeContent.default)
}
