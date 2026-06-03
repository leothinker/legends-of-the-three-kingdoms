import { lib, game, ui, get, ai, _status } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 界曹操
  // 奸雄
  oldjianxiong: {
    audio: "rejianxiong",
    trigger: { player: "damageEnd" },
    async cost(event, trigger, player) {
      let list = ["摸牌"]
      if (get.itemtype(trigger.cards) == "cards" && trigger.cards.filterInD().length) {
        list.push("拿牌")
      }
      list.push("cancel2")
      const { control } = await player
        .chooseControl(list)
        .set("prompt", get.prompt2(event.skill))
        .set("ai", () => {
          const player = get.event().player,
            trigger = get.event().getTrigger()
          const cards = trigger.cards ? trigger.cards.filterInD() : []
          if (get.event().controls.includes("拿牌")) {
            if (
              cards.reduce((sum, card) => {
                return sum + (card.name == "du" ? -1 : 1)
              }, 0) > 1 ||
              player.getUseValue(cards[0]) > 6
            ) {
              return "拿牌"
            }
          }
          return "摸牌"
        })
        .forResult()
      event.result = { bool: control != "cancel2", cost_data: control }
    },
    async content(event, trigger, player) {
      if (event.cost_data == "摸牌") {
        await player.draw()
      } else {
        await player.gain(trigger.cards.filterInD(), "gain2")
      }
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -1]
          }
          if (get.tag(card, "damage") && player != target) {
            return [1, 0.6]
          }
        },
      },
    },
  },
  // 界夏侯惇
  // 清俭
  oldqingjian: {
    audio: "qingjian",
    trigger: { player: "gainAfter" },
    direct: true,
    filter(event, player) {
      var evt = event.getParent("phaseDraw")
      if (evt && evt.player == player) {
        return false
      }
      return event.getg(player).length > 0
    },
    async content(event, trigger, player) {
      let result
      // step 0
      event.cards = trigger.getg(player)
      // step 1..n
      while (true) {
        result = await player
          .chooseCardTarget({
            filterCard(card) {
              return _status.event.getParent().cards.includes(card)
            },
            selectCard: [1, event.cards.length],
            filterTarget(card, player, target) {
              return player != target
            },
            allowChooseAll: true,
            ai1(card) {
              if (ui.selected.cards.length > 0) {
                return -1
              }
              if (card.name == "du") {
                return 20
              }
              return _status.event.player.countCards("h") - _status.event.player.hp
            },
            ai2(target) {
              var att = get.attitude(_status.event.player, target)
              if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
                if (target.hasSkillTag("nodu")) {
                  return 0
                }
                return 1 - att
              }
              if (target.countCards("h") > _status.event.player.countCards("h")) {
                return 0
              }
              return att - 4
            },
            prompt: "请选择要送人的卡牌",
          })
          .forResult()

        // step 2
        if (result.bool) {
          player.storage.oldqingjian++
          player.logSkill("oldqingjian", result.targets)
          await result.targets[0].gain(result.cards, player, "give")
          for (var i = 0; i < result.cards.length; i++) {
            event.cards.remove(result.cards[i])
          }
          if (event.cards.length) {
            continue
          }
          break
        } else {
          player.storage.counttrigger.oldqingjian--
          break
        }
      }
    },
    ai: {
      expose: 0.3,
    },
  },
}

export default skills
