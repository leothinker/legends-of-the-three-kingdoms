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
  chenglve(player) {
    const bool = player.storage.chenglve
    let yang = "你可以摸一张牌，然后弃置两张手牌",
      yin = "你可以摸两张牌，然后弃置一张手牌"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，出牌阶段限一次，",
      end = "。若如此做，你本阶段使用与弃置牌花色相同的牌无距离和次数限制。"
    return `${start}阳：${yang}。阴：${yin}${end}`
  },
  zhenliang(player) {
    const bool = player.storage.zhenliang
    let yang =
        "出牌阶段限一次，你可以选择你攻击范围内的一名其他角色并弃置X张与“任”颜色相同的牌，对其造成1点伤害（X为你与其体力值之差且至少为1）",
      yin =
        "你的回合外，当你使用或打出的牌结算结束后，若此牌与“任”类别相同，你可以令一名角色摸一张牌"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，",
      end = "。"
    return `${start}阳：${yang}；阴：${yin}${end}`
  },
  longnu(player) {
    const bool = player.hasSkill("longnu_2") || player.storage.longnu
    let yang =
        "你失去1点体力，摸一张牌，你的红色手牌于此阶段内均视为火【杀】，你于此阶段内使用火【杀】无距离限制",
      yin =
        "你减1点体力上限，摸一张牌，你的锦囊牌于此阶段内均视为雷【杀】，你于此阶段内使用雷【杀】无次数限制"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，锁定技，出牌阶段开始时，",
      end = "。"
    return `${start}阳：${yang}；阴：${yin}${end}`
  },
}
export default dynamicTranslates
