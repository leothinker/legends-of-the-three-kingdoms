import type { GameEvent } from "../../gameEvent.js"
import ContentCompilerBase from "./ContentCompilerBase.ts"
import type { EventContent } from "./IContentCompiler.ts"

export default class ArrayCompiler extends ContentCompilerBase {
  type = "array"

  filter(content: EventContent): boolean {
    return (
      Array.isArray(content) &&
      content.every((item) => typeof item === "function")
    )
  }

  compile(content: EventContent) {
    if (!Array.isArray(content)) {
      throw new ReferenceError("content必须是一个数组")
    }

    const compiler = this
    return async function (this: GameEvent, event: GameEvent) {
      if (!Number.isInteger(event.step)) {
        event.step = 0
      }

      while (!event.finished) {
        if (event.step >= content.length) {
          event.finish()
          break
        }
        compiler.beforeExecute(event)
        event.step++
        let result: Result | undefined
        if (!compiler.isPrevented(event)) {
          const original = content[event.step]
          result = await Reflect.apply(original, this, [
            event,
            event._trigger,
            event.player,
            event._result,
          ])
        }
        const nextResult = await event.waitNext()
        event._result = result ?? nextResult ?? event._result
        compiler.afterExecute(event)
      }
    }
  }
}
