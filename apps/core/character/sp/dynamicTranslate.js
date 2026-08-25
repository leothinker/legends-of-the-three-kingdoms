const dynamicTranslates = {
  kunfen(player) {
    if (player.storage.kunfen) {
      return "结束阶段，你可以失去1点体力，然后摸两张牌。"
    }
    return "锁定技，结束阶段，你失去1点体力，然后摸两张牌。"
  },
  youlong(player) {
    const bool = player.storage.youlong
    let yang = "普通锦囊牌",
      yin = "基本牌"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start =
        "转换技，每轮各限一次，你可以废除一个装备栏，视为使用一张未以此法使用过的：",
      end = "。"
    return `${start}阳：${yang}；阴：${yin}${end}`
  },
}
export default dynamicTranslates
