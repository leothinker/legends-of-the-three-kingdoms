import { get } from "wtk"

export const type = "card"

/** @type { importCardConfig } */
export default {
  name: "zhulu",
  connect: true,
  card: {
    jiejia: {
      fullskin: true,
      type: "trick",
      enable: true,
      filterTarget(card, player, target) {
        return target.countCards("e") > 0
      },
      async content(event, trigger, player) {
        const { target } = event
        const es = target.getCards("e")
        if (!es.length) {
          return
        }
        await target.gain(es, "gain2", "log")
      },
      ai: {
        order: 10,
        tag: {
          gain: 1,
          //loseCard:1,
        },
        basic: {
          useful: 0.5,
          value: 0.5,
        },
        result: {
          target(player, target) {
            const e5 = target.getEquip("muniu")
            if (e5 && e5.name === "muniu" && e5.cards && e5.cards.length > 1) {
              return -1
            }
            if (
              target.countCards("e", (card) => get.value(card, target) <= 0) ||
              target.hasSkillTag("noe")
            ) {
              return 1
            }
            return 0
          },
        },
      },
    },
  },
  skill: {},
  translate: {
    jiejia: "解甲归田",
    jiejia_info:
      "出牌阶段，对一名装备区里有牌的角色使用。目标角色获得其装备区里的所有牌。",
  },
  list: [
    ["diamond", 3, "jiejia"],

    ["club", 3, "jiejia"],
  ],
}
