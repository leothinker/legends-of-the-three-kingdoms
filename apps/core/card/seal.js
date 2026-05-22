import { lib, game, ui, get, ai, _status } from "wtk"
game.import("card", function () {
  return {
    name: "seal",
    connect: true,
    card: {
      yinyueqiang: {
        audio: true,
        fullskin: true,
        type: "equip",
        subtype: "equip1",
        bingzhu: ["赵云"],
        distance: { attackFrom: -2 },
        ai: {
          basic: {
            equipValue: 4,
          },
        },
        skills: ["yinyueqiang"],
      },
    },
    skill: {
      yinyueqiang: {
        equipSkill: true,
        trigger: { player: ["useCard", "respondAfter"] },
        filter(event, player) {
          if (_status.currentPhase == player) {
            return false
          }
          if (!event.cards) {
            return false
          }
          if (event.cards.length != 1) {
            return false
          }
          if (lib.filter.autoRespondSha.call({ player: player })) {
            return false
          }
          return (
            get.color(event.cards[0]) == "black" &&
            player.hasHistory("lose", (evt) => evt.getParent() == event && evt.hs?.length == 1)
          )
        },
        direct: true,
        clearTime: true,
        async content(event, trigger, player) {
          await player
            .chooseToUse(`###${get.prompt(event.name)}###对你攻击范围内的一名角色使用一张【杀】`)
            .set("filterCard", function (card, player, event) {
              if (get.name(card) != "sha") {
                return false
              }
              return lib.filter.filterCard.apply(this, arguments)
            })
            .set("addCount", false)
            .set("logSkill", event.name)
            .forResult()
        },
      },
    },
    translate: {
      yinyueqiang: "银月枪",
      yinyueqiang_info:
        "一名其他角色回合结束时，若你于此回合失去过手牌，则你可以对攻击范围内的一名本回合获得过手牌的角色使用一张【杀】。",
      yinyueqiang_append:
        '<span class="text" style="font-family: yuanli">“匹马单枪敢独行，摧锋破敌任纵横。”</span>',
    },
    list: [["diamond", 12, "yinyueqiang"]],
  }
})
