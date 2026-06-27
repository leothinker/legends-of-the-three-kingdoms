import { _status, game, get } from "wtk"

const cards = {
  hun_zhuge: {
    fullskin: true,
    type: "equip",
    subtype: "equip1",
    derivation: "shen_huangyueying",
    skills: ["hun_zhuge_skill"],
    ai: {
      order() {
        return get.order({ name: "sha" }) + 0.1
      },
      equipValue(card, player) {
        if (player._zhuge_temp) {
          return 1
        }
        player._zhuge_temp = true
        var result = (() => {
          if (
            !game.hasPlayer(
              (current) =>
                get.distance(player, current) <= 1 &&
                player.canUse("sha", current) &&
                get.effect(current, { name: "sha" }, player, player) > 0,
            )
          ) {
            return 1.5
          }
          if (player.hasSha() && _status.currentPhase === player) {
            if (
              (player.getEquip("zhuge") && player.countUsed("sha")) ||
              player.getCardUsable("sha") === 0
            ) {
              return 10.5
            }
          }
          var num = player.countCards("h", "sha")
          if (num > 1) {
            return 6.5 + num
          }
          return 3.5 + num
        })()
        delete player._zhuge_temp
        return result
      },
      basic: {
        equipValue: 6,
      },
      tag: {
        valueswap: 1.5,
      },
    },
  },
  hun_bagua: {
    fullskin: true,
    type: "equip",
    subtype: "equip2",
    derivation: "shen_huangyueying",
    skills: ["hun_bagua_skill"],
    ai: {
      basic: {
        equipValue: 8,
      },
    },
  },
  lingling: {
    name: "lingling",
    fullskin: true,
    type: "equip",
    subtype: "equip4",
    derivation: "shen_huangyueying",
    skills: ["lingling_skill"],
    distance: { globalFrom: -2 },
    ai: {
      value(card, player) {
        if (
          !game.hasPlayer(
            (current) =>
              get.damageEffect(current, player, player, "thunder") > 0,
          )
        ) {
          return 0
        }
        return 8
      },
      equipValue(card, player) {
        if (
          !game.hasPlayer(
            (current) =>
              get.damageEffect(current, player, player, "thunder") > 0,
          )
        ) {
          return 0
        }
        return 8
      },
      basic: {
        equipValue: 2,
      },
    },
  },
  chixueqingfeng: {
    derivation: "ol_puyuan",
    bingzhu: ["赵云"],
    cardcolor: "spade",
    type: "equip",
    fullskin: true,
    modeimage: "boss",
    subtype: "equip1",
    distance: { attackFrom: -1 },
    skills: ["chixueqingfeng"],
    ai: {
      equipValue: 6.7,
    },
  },
}
export default cards
