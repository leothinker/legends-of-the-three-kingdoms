import { lib } from "wtk"

const dynamicTranslates = {
  olbixin(player) {
    var count = player.countMark("olbixin")
    if (count < 3) {
      return lib.translate.olbixin_info.slice(count * 5)
    }
    return "当你需要使用基本牌时，你可以声明一种类别并摸1张牌（每种类别限3次），将所有此类别手牌当你本轮未使用过的基本牌使用。"
  },
  olfeibai(player) {
    const bool = player.storage.olfeibai
    let yang = "当你的非黑色牌造成伤害时，此伤害值+1",
      yin = "当你的非红色牌回复体力时，此回复值+1"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，锁定技，",
      end = "。"
    return `${start}阳：${yang}；阴：${yin}${end}`
  },
}

export default dynamicTranslates
