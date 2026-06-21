const dynamicTranslates = {
  kunfen(player) {
    if (player.storage.kunfen) {
      return "结束阶段，你可以失去1点体力，然后摸两张牌。"
    }
    return "锁定技，结束阶段，你失去1点体力，然后摸两张牌。"
  },
}
export default dynamicTranslates
