import { _status, game, get, lib } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 族吴苋
  // 移荣
  yirong: {
    audio: 2,
    enable: "phaseUse",
    usable: 2,
    filter(event, player) {
      var num1 = player.countCards("h"),
        num2 = player.getHandcardLimit()
      return num1 !== num2
    },
    selectCard() {
      var player = _status.event.player
      var num1 = player.countCards("h"),
        num2 = player.getHandcardLimit()
      if (num1 > num2) {
        return num1 - num2
      }
      return [0, 1]
    },
    filterCard(card, player) {
      var num1 = player.countCards("h"),
        num2 = player.getHandcardLimit()
      return num1 > num2
    },
    check(card) {
      var player = _status.event.player
      if (
        player.countCards("h", (card) => lib.skill.yirong.checkx(card) > 0) +
          1 <
        player.countCards("h") - player.getHandcardLimit()
      ) {
        return 0
      }
      return lib.skill.yirong.checkx(card)
    },
    checkx(card) {
      var num = 1
      if (_status.event.player.getUseValue(card, null, true) <= 0) {
        num = 1.5
      }
      return (15 - get.value(card)) * num
    },
    prompt() {
      var player = _status.event.player
      var num1 = player.countCards("h"),
        num2 = player.getHandcardLimit()
      var str = '<span class="text center">'
      if (num1 > num2) {
        str += `弃置${get.cnNumber(num1 - num2)}张牌并令你手牌上限+1。`
      } else {
        str += `摸${get.cnNumber(num2 - num1)}张牌并令你手牌上限-1。`
      }
      str += `<br>※当前手牌上限：${num2}`
      var num3 = (_status.event.getParent().phaseIndex || 0) + 1
      if (num3 > 0) {
        str += `；阶段数：${num3}`
      }
      str += "</span>"
      return str
    },
    async content(event, trigger, player) {
      const { cards } = event
      if (cards.length) {
        lib.skill.chenliuwushi.change(player, 1)
        return
      }
      const num1 = player.countCards("h")
      const num2 = player.getHandcardLimit()
      if (num1 < num2) {
        await player.draw(num2 - num1)
      }
      lib.skill.chenliuwushi.change(player, -1)
    },
    ai: {
      order(item, player) {
        var num = player.getHandcardLimit(),
          numx = (_status.event.getParent().phaseIndex || 0) + 1
        if (num === 5 && numx === 4 && player.getStat("skill").yirong) {
          return 0
        }
        if (
          player.countCards("h") === num + 1 &&
          num !== 2 &&
          (num <= 4 || (num > 4 && numx > 4))
        ) {
          return 10
        }
        return 0.5
      },
      result: { player: 1 },
      threaten: 5,
    },
  },
  // 贵相
  guixiang: {
    audio: 2,
    trigger: { player: "phaseChange" },
    forced: true,
    filter(event, player) {
      if (event.phaseList[event.num].startsWith("phaseUse")) {
        return false
      }
      const num1 = player.getHandcardLimit() - 1,
        num2 = event.num - player.getHistory("skipped").length
      return num1 === num2
    },
    async content(event, trigger, player) {
      trigger.phaseList[trigger.num] = `phaseUse|${event.name}`
      await game.delayx()
    },
  },
  // 穆荫
  muyin: {
    audio: 2,
    clanSkill: true,
    trigger: { player: "phaseBegin" },
    isMax(player) {
      var num = player.getHandcardLimit()
      return !game.hasPlayer(
        (current) => current !== player && current.getHandcardLimit() > num,
      )
    },
    filter(event, player) {
      return game.hasPlayer(
        (current) =>
          (current === player || current.hasClan("陈留吴氏")) &&
          !lib.skill.muyin.isMax(current),
      )
    },
    direct: true,
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          get.prompt("muyin"),
          "令一名手牌上限不为全场最大的同族角色手牌上限+1",
          (card, player, current) => {
            return (
              (current === player || current.hasClan("陈留吴氏")) &&
              !lib.skill.muyin.isMax(current)
            )
          },
        )
        .set("ai", (target) => {
          return get.attitude(_status.event.player, target)
        })
        .forResult()

      if (result.bool) {
        const target = result.targets[0]
        player.logSkill("muyin", target)
        lib.skill.chenliuwushi.change(target, 1)
        await game.delayx()
      }
    },
  },
  chenliuwushi: {
    charlotte: true,
    change(player, num) {
      player.addSkill("chenliuwushi")
      var info = player.storage
      if (typeof info.chenliuwushi !== "number") {
        info.chenliuwushi = 0
      }
      info.chenliuwushi += num
      if (info.chenliuwushi === 0) {
        player.unmarkSkill("chenliuwushi")
      } else {
        player.markSkill("chenliuwushi")
      }
      if (num >= 0) {
        game.log(player, "的手牌上限", `#y+${num}`)
      } else {
        game.log(player, "的手牌上限", `#g${num}`)
      }
    },
    mod: {
      maxHandcard(player, num) {
        var add = player.storage.chenliuwushi
        if (typeof add === "number") {
          return num + add
        }
      },
    },
    markimage: "image/card/handcard.png",
    intro: {
      content(num, player) {
        var str = "<li>手牌上限"
        if (num >= 0) {
          str += "+"
        }
        str += num
        str += "<br><li>当前手牌上限："
        str += player.getHandcardLimit()
        return str
      },
    },
  },
}

export default skills
