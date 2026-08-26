const dynamicTranslates = {
  jieyuan(player) {
    var str = "当你对"
    if (!player.hasSkill("fenxin_fan")) {
      str += "体力值不小于你的"
    }
    str += "其他角色造成伤害时，你可以弃置一张"
    if (!player.hasSkill("fenxin_nei")) {
      str += "黑色手"
    }
    str += "牌，令此伤害+1。当你受到"
    if (!player.hasSkill("fenxin_zhong")) {
      str += "体力值不小于你的"
    }
    str += "其他角色造成的伤害时，你可以弃置一张"
    if (!player.hasSkill("fenxin_nei")) {
      str += "红色手"
    }
    str += "牌，令此伤害-1。"
    return str
  },
}

export default dynamicTranslates
