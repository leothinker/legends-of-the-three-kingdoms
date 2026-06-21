import { game, get } from "wtk"

const cards = {
  // 影
  ying: {
    audio: true,
    fullskin: true,
    type: "basic",
    cardcolor: "spade",
    enable: false,
    destroy: "discardPile",
    getYing(count) {
      var cards = []
      if (typeof count !== "number") {
        count = 1
      }
      while (count--) {
        const card = game.createCard("ying", "spade", 1)
        cards.push(card)
      }
      return cards
    },
    ai: {
      basic: {
        useful: 0,
        value: 0,
      },
    },
  },
  // 蓄谋
  xumou: {
    type: "special_delay",
    allowDuplicate: true,
    blankCard: true,
    fullimage: true,
    wuxieable: false,
    async effect(event, trigger, player) {
      const card = get.autoViewAs(event.cards[0])
      card.storage.xumou = true
      const result = await player
        .chooseUseTarget(
          card,
          event.cards,
          `蓄谋:是否使用${get.translation(card)}？`,
          `依次处理蓄谋牌：1.使用这张蓄谋牌；2.将你判定区内所有蓄谋牌置入弃牌堆。`,
        )
        .forResult()
      if (!result.bool) {
        const cards = player.getCards(
          "j",
          (card) => (card.viewAs || card.name) === "xumou",
        )
        if (cards.length > 0) {
          await player.loseToDiscardpile(cards)
        }
      } else {
        player.addTempSkill("xumou_temp", "phaseChange")
        player.markAuto("xumou_temp", [event.cards[0].name])
      }
    },
  },
}
export default cards
