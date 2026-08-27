const dynamicTranslates = {
  dangxian(player) {
    if (player.storage.fuli) {
      return "回合开始时，你可以失去1点体力并从弃牌堆中获得一张【杀】，然后执行一个额外的出牌阶段。"
    }
    return "锁定技，回合开始时，你失去1点体力并从弃牌堆中获得一张【杀】，然后执行一个额外的出牌阶段。"
  },
}

export default dynamicTranslates
