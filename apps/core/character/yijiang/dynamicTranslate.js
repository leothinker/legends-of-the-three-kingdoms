const dynamicTranslates = {
  dangxian(player) {
    if (player.storage.fuli) {
      return "回合开始时，你可以失去1点体力并从弃牌堆中获得一张【杀】，然后执行一个额外的出牌阶段。"
    }
    return "锁定技，回合开始时，你失去1点体力并从弃牌堆中获得一张【杀】，然后执行一个额外的出牌阶段。"
  },
  xingxue(player) {
    if (!player.hasSkill("yanzhu")) {
      return "结束阶段，你可以令至多X名角色依次摸一张牌并将一张牌置于牌堆顶（X为你的体力上限）。"
    }
    return "结束阶段，你可以令至多X名角色依次摸一张牌并将一张牌置于牌堆顶（X为你的体力值）。"
  },
  funan(player) {
    if (player.hasSkill("funan_jiexun")) {
      return "当其他角色使用或打出牌响应你使用的牌时，你可以获得其使用或打出的牌。"
    }
    return "当其他角色使用或打出牌响应你使用的牌时，你可以令其获得你使用的牌（其本回合不能使用或打出此牌），然后你获得其使用或打出的牌。"
  },
}

export default dynamicTranslates
