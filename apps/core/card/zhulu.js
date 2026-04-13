import { lib, game, ui, get, ai, _status } from "noname"
game.import("card", function () {
  return {
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
        content() {
          var es = target.getCards("e")
          if (es.length) {
            target.gain(es, "gain2", "log")
          }
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
              var e5 = target.getEquip("muniu")
              if (e5 && e5.name == "muniu" && e5.cards && e5.cards.length > 1) {
                return -1
              }
              if (
                target.countCards("e", function (card) {
                  return get.value(card, target) <= 0
                }) ||
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
      jiejia_info: "出牌阶段，对一名装备区内有牌的角色使用。该角色获得其装备区内的所有牌。",
    },
    list: [
      ["diamond", 3, "jiejia"],
      ["club", 3, "jiejia"],
    ],
  }
})
