import { get, ui } from "wtk"

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
    kaihua: {
      enable: true,
      fullskin: true,
      type: "trick",
      selectTarget: -1,
      toself: true,
      filterTarget(card, player, target) {
        return target === player
      },
      modTarget: true,
      async content(event, trigger, player) {
        const { target } = event
        if (!target.hasCards("he")) {
          return
        }
        const result = await target
          .chooseToDiscard(true, "he", [1, 2])
          .set("ai", (card) => {
            if (!ui.selected.cards.length && get.type(card) === "equip") {
              return 8 - get.value(card)
            }
            return 6 - get.value(card)
          })
          .forResult()
        if (!result.bool || !result.cards) {
          return
        }
        const equips = result.cards.some((card) => get.type(card) === "equip")
        await target.draw(result.cards.length + (equips ? 1 : 0))
      },
      ai: {
        wuxie() {
          return 0
        },
        basic: {
          useful: 3,
          value: 3,
          order: 5,
        },
        result: {
          target(player, target, card) {
            const cards = ui.selected.cards.concat(card.cards || [])
            const num = player.countCards("he", (card) => {
              if (cards.includes(card)) {
                return false
              }
              if (get.type(card) === "equip") {
                return 8 > get.value(card)
              }
              return 6 > get.value(card)
            })
            if (!num) {
              return 0
            }
            if (
              player.countCards("he", (card) => {
                if (cards.includes(card)) {
                  return false
                }
                if (get.type(card) === "equip") {
                  return 4 > get.value(card)
                }
                return false
              })
            ) {
              return 1.6
            }
            if (num < 2) {
              return 0.5
            }
            return 1.2
          },
        },
        tag: {
          loseCard: 1,
          discard: 1,
          norepeat: 1,
        },
      },
    },
  },
  skill: {},
  translate: {
    jiejia: "解甲归田",
    jiejia_info:
      "出牌阶段，对一名装备区里有牌的角色使用。目标角色获得其装备区里的所有牌。",

    kaihua: "树上开花",
    kaihua_info:
      "出牌阶段，对包含你自己在内的一名角色使用。目标角色弃置一至两张牌，然后摸等量的牌。若其以此法弃置了装备牌，则多摸一张牌。",
  },
  list: [
    ["diamond", 3, "jiejia"],
    ["diamond", 9, "kaihua"],

    ["club", 3, "jiejia"],

    ["heart", 9, "kaihua"],
    ["heart", 11, "kaihua"],
  ],
}
