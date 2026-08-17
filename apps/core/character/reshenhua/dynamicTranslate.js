const dynamicTranslates = {
  shenshi(player) {
    const bool = player.storage.shenshi
    let yang =
        "出牌阶段限一次，你可以将一张牌交给一名除你外手牌数最多的角色，然后对其造成1点伤害；若其因此死亡，你可以令一名角色将手牌摸至四张",
      yin =
        "当其他角色对你造成伤害后，你可以观看其手牌，然后交给其一张牌；当前回合结束时，若其未失去此牌，你将手牌摸至四张"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，",
      end = "。"
    return `${start}阳：${yang}。阴：${yin}${end}`
  },
  juzhan(player) {
    const bool = player.storage.juzhan
    let yang =
        "当你成为其他角色使用【杀】的目标后，你可以与其各摸一张牌，然后其本回合不能再对你使用牌",
      yin =
        "当你使用【杀】指定一名角色为目标后，你可以获得其一张牌，然后你本回合不能再对其使用牌"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，",
      end = "。"
    return `${start}阳：${yang}。阴：${yin}${end}`
  },
}
export default dynamicTranslates
