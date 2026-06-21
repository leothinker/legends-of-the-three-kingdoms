import { _status, game, get, lib } from "wtk"

/** @type { importCharacterConfig['skill'] } */
const skills = {
  // 谋姜维
  // 逐日
  olsbzhuri: {
    audio: 2,
    trigger: {
      player: "phaseAnyEnd",
    },
    filter(event, player) {
      if (!game.hasPlayer((target) => player.canCompare(target))) {
        return false
      }
      return (
        player.getHistory("gain", (evt) => evt.getParent(event.name) === event)
          .length +
        player.getHistory(
          "lose",
          (evt) => evt.getParent(event.name) === event && evt.hs.length,
        ).length
      )
    },
    direct: true,
    async content(event, trigger, player) {
      var result = await player
        .chooseTarget(get.prompt2("olsbzhuri"), (card, player, target) => {
          return player.canCompare(target)
        })
        .set("ai", (target) => {
          var player = _status.event.player
          var ts = target
            .getCards("h")
            .sort((a, b) => get.number(a) - get.number(b))
          if (get.attitude(player, target) < 0) {
            var hs = player
              .getCards("h")
              .sort((a, b) => get.number(b) - get.number(a))
            var ts = target
              .getCards("h")
              .sort((a, b) => get.number(b) - get.number(a))
            if (get.number(hs[0]) > get.number(ts[0])) {
              return 1
            }
            if (get.effect(player, { name: "losehp" }, player, player) > 0) {
              return Math.random() + 0.2
            }
            if (player.getHp() > 2) {
              return Math.random() - 0.5
            }
            return 0
          }
          return 0
        })
        .forResult()
      if (result.bool) {
        var target = result.targets[0]
        player.logSkill("olsbzhuri", target)
        var result2 = await player.chooseToCompare(target).forResult()
        if (result2.bool) {
          var cards = [result2.player, result2.target].filterInD("d")
          cards = cards.filter((card) => player.hasUseTarget(card))
          if (cards.length) {
            var result3 = await player
              .chooseButton(["是否使用其中的牌？", cards])
              .set("ai", (button) =>
                _status.event.player.getUseValue(button.link),
              )
              .forResult()
            if (result3.bool) {
              var card = result3.links[0]
              player.$gain2(card, false)
              await game.delayx()
              await player.chooseUseTarget(true, card, false)
            }
          }
        } else {
          var list = lib.skill.olsbranji.getList(trigger)
          var result3 = await player
            .chooseControl("失去体力", "技能失效")
            .set("prompt", "逐日：失去1点体力，或令此技能于本回合失效")
            .set("ai", () => {
              var player = _status.event.player
              if (player.getHp() > 2) {
                var list = _status.event.list
                list.removeArray(player.skipList)
                if (list.includes("phaseDraw") || list.includes("phaseUse")) {
                  return "失去体力"
                }
              }
              if (get.effect(player, { name: "losehp" }, player, player) > 0) {
                return "失去体力"
              }
              return "技能失效"
            })
            .set("list", list.slice(trigger.getParent().num, list.length))
            .forResult()
          if (result3.control === "失去体力") {
            player.loseHp(1)
          } else {
            player.addTempSkill("olsbzhuri_block")
            player.tempBanSkill("olsbzhuri")
          }
        }
      }
    },
    subSkill: {
      block: {
        charlotte: true,
        mark: true,
        marktext: '<span style="text-decoration: line-through;">日</span>',
        intro: { content: "追不动太阳了" },
      },
    },
  },
  // 燃己
  olsbranji: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    prompt2(event, player) {
      var str = "获得技能"
      var num = lib.skill.olsbranji.getNum(player)
      if (num >= player.getHp()) {
        str += "【困奋】"
      }
      if (num === player.getHp()) {
        str += "和"
      }
      if (num <= player.getHp()) {
        str += "【诈降】"
      }
      str += "，然后"
      var num1 = player.countCards("h") - player.getHandcardLimit()
      if (num1 || player.isDamaged()) {
        if (num1) {
          str +=
            num1 < 0
              ? `摸${get.cnNumber(-num1)}张牌`
              : `弃置${get.cnNumber(num1)}张牌`
        }
        if (num1 && player.isDamaged()) {
          str += "或"
        }
        if (player.isDamaged()) {
          str += `回复${player.getDamagedHp()}点体力`
        }
        str += "，最后"
      }
      str += "你不能回复体力直到你杀死角色。"
      return str
    },
    check(event, player) {
      var num = lib.skill.olsbranji.getNum(player)
      if (num === player.getHp()) {
        return true
      }
      return (
        player.getHandcardLimit() - player.countCards("h") >= 3 ||
        player.getDamagedHp() >= 2
      )
    },
    limited: true,
    skillAnimation: true,
    animationColor: "fire",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      var num = lib.skill.olsbranji.getNum(player)
      const skills = []
      if (num >= player.getHp()) {
        skills.push("kunfen")
        player.storage.kunfen = true
      }
      if (num <= player.getHp()) {
        skills.push("rezhaxiang")
      }
      player.addSkills(skills)
      if (
        player.countCards("h") !== player.getHandcardLimit() ||
        player.isDamaged()
      ) {
        var result,
          num1 = player.countCards("h") - player.getHandcardLimit()
        if (!num1) {
          result = { index: 1 }
        } else if (player.isHealthy()) {
          result = { index: 0 }
        } else {
          result = await player
            .chooseControl("手牌数", "体力值")
            .set("choiceList", [
              num1 < 0
                ? `摸${get.cnNumber(-num1)}张牌`
                : `弃置${get.cnNumber(num1)}张牌`,
              `回复${player.getDamagedHp()}点体力`,
            ])
            .set("ai", () => {
              var player = _status.event.player
              var list = _status.event.list
              var num1 = get.effect(player, { name: "draw" }, player, player)
              var num2 = get.recoverEffect(player, player, player)
              return num1 * list[0] > num2 * list[1] ? 0 : 1
            })
            .set("list", [-num1, player.getDamagedHp()])
            .forResult()
        }
        if (result.index === 0) {
          if (num1 < 0) {
            await player.drawTo(player.getHandcardLimit())
          } else {
            await player.chooseToDiscard(num1, "h", true, "allowChooseAll")
          }
        } else {
          await player.recover(player.maxHp - player.hp)
        }
      }
      player.addSkill("olsbranji_norecover")
      player
        .when({ source: "dieAfter" })
        .step(async () => player.removeSkill("olsbranji_norecover"))
    },
    derivation: ["kunfenx", "rezhaxiang"],
    getList(event) {
      return event.getParent().phaseList.map((list) => list.split("|")[0])
    },
    getNum(player) {
      return player
        .getHistory("useCard", (evt) => {
          return lib.phaseName.some((name) => {
            return evt.getParent(name).name === name
          })
        })
        .reduce((list, evt) => {
          return list.add(
            evt.getParent(
              lib.phaseName.find((name) => evt.getParent(name).name === name),
            ),
          )
        }, []).length
    },
    subSkill: {
      norecover: {
        audio: "olsbranji",
        charlotte: true,
        mark: true,
        intro: { content: "不能回复体力" },
        trigger: { player: "recoverBefore" },
        forced: true,
        firstDo: true,
        content() {
          trigger.cancel()
        },
        ai: {
          effect: {
            target(card, player, target) {
              if (get.tag(card, "recover")) {
                return "zeroplayertarget"
              }
            },
          },
        },
      },
    },
  },
  // 困奋
  kunfenx: {
    audio: "kunfen_ol_sb_jiangwei",
  },
  kunfen_ol_sb_jiangwei: { audio: 1 },
  // 诈降
  zhaxiang_ol_sb_jiangwei: { audio: 1 },
}

export default skills
