import { lib, game, ui, get, ai, _status } from "wtk"
import { type } from "../../mode/boss"

/** @type { importCharacterConfig['skill'] } */
const skills = {
  // 界曹操
  // 护驾
  rehujia: {
    audio: 2,
    inherit: "hujia",
    filter(event, player) {
      if (event.responded) {
        return false
      }
      if (player.storage.hujiaing) {
        return false
      }
      if (!player.hasZhuSkill("rehujia")) {
        return false
      }
      if (!event.filterCard({ name: "shan" }, player, event)) {
        return false
      }
      return game.hasPlayer((current) => current != player && current.group == "wei")
    },
    ai: {
      respondShan: true,
      skillTagFilter(player) {
        if (player.storage.hujiaing) {
          return false
        }
        if (!player.hasZhuSkill("rehujia")) {
          return false
        }
        return game.hasPlayer((current) => current != player && current.group == "wei")
      },
    },
    group: "rehujia_draw",
    subSkill: {
      draw: {
        trigger: { global: ["useCard", "respond"] },
        usable: 1,
        filter(event, player) {
          return (
            event.card.name == "shan" &&
            event.player != player &&
            event.player.group == "wei" &&
            event.player.isIn() &&
            event.player != _status.currentPhase &&
            player.hasZhuSkill("rehujia")
          )
        },
        async cost(event, trigger, player) {
          event.result = await trigger.player
            .chooseBool(`护驾：是否令${get.translation(player)}摸一张牌？`)
            .set("ai", () => {
              const evt = _status.event
              return get.attitude(evt.player, evt.getParent().player) > 0
            })
            .forResult()
        },
        async content(event, trigger, player) {
          trigger.player.line(player, "fire")
          await player.draw()
        },
      },
    },
  },
  // 界许褚
  // 裸衣
  olluoyi: {
    audio: "reluoyi",
    trigger: {
      player: "phaseDrawBegin1",
    },
    filter(event, player) {
      return !event.numFixed
    },
    async content(event, trigger, player) {
      const cards = get.cards(3, true)
      await player.showCards(cards, "裸衣", true)

      const cardsx = []
      for (const c of cards) {
        const type = get.type(c)
        if (
          type == "basic" ||
          c.name == "juedou" ||
          (type == "equip" && get.subtype(c) == "equip1")
        ) {
          cardsx.push(c)
        }
      }

      event.cards = cardsx
      const prompt =
        "是否放弃摸牌" + (cardsx.length ? "，改为获得" + get.translation(cardsx) : "") + "？"
      const result = await player
        .chooseBool(prompt)
        .set("choice", cardsx.length >= trigger.num)
        .forResult()

      if (result.bool) {
        if (cardsx.length) {
          await player.gain(cardsx, "gain2")
        }
        player.addTempSkill("olluoyi_buff", { player: "phaseBeforeStart" })
        trigger.changeToZero()
      }
    },
    subSkill: { buff: { inherit: "reluoyi2", sourceSkill: "olluoyi" } },
  },
  // 界甄姬
  // 洛神
  reluoshen: {
    audio: 2,
    trigger: { player: "phaseZhunbeiBegin" },
    frequent: true,
    async content(event, trigger, player) {
      event.bool = true
      while (event.bool) {
        await player
          .judge((card) => {
            return get.color(card) == "black" ? 1.5 : -1.5
          })
          .set("judge2", (result) => result.bool)
          .set("callback", async (event, trigger, player) => {
            if (event.judgeResult.color == "black" && get.position(event.card, true) == "o") {
              await player.gain(event.card, "gain2")
            }
            const bool =
              event.judgeResult.color == "black" &&
              (
                await player
                  .chooseBool("是否继续发动【洛神】？")
                  .set("frequentSkill", "reluoshen")
                  .forResult()
              ).bool
            if (!bool) {
              event.getParent(2).bool = false
            }
          })
      }
      const num = player.getHistory("gain", (evt) => evt.getParent(event.name) == event).length
      if (num > 0) {
        const name = `${event.name}_effect`
        player.addTempSkill(name)
        player.addMark(name, num, false)
      }
    },
    subSkill: {
      effect: {
        charlotte: true,
        onremove: true,
        intro: {
          content: "本回合手牌上限+#",
        },
        mod: {
          maxHandcard(player, num) {
            return num + player.countMark("reluoshen_effect")
          },
        },
      },
    },
  },
  // 界刘备
  // 激将
  rejijiang: {
    audio: 2,
    audioname: ["ol_liushan"],
    group: ["rejijiang1", "rejijiang3"],
    zhuSkill: true,
    filter(event, player) {
      if (
        !player.hasZhuSkill("rejijiang") ||
        !game.hasPlayer(function (current) {
          return current != player && current.group == "shu"
        })
      ) {
        return false
      }
      return !event.jijiang && (event.type != "phase" || !player.hasSkill("jijiang3"))
    },
    enable: ["chooseToUse", "chooseToRespond"],
    viewAs: { name: "sha" },
    filterCard: () => false,
    selectCard: -1,
    ai: {
      order() {
        return get.order({ name: "sha" }) + 0.3
      },
      respondSha: true,
      skillTagFilter(player) {
        if (
          !player.hasZhuSkill("rejijiang") ||
          !game.hasPlayer(function (current) {
            return current != player && current.group == "shu"
          })
        ) {
          return false
        }
      },
    },
  },
  rejijiang1: {
    audio: "rejijiang",
    audioname: ["ol_liushan"],
    trigger: { player: ["useCardBegin", "respondBegin"] },
    logTarget: "targets",
    sourceSkill: "rejijiang",
    filter(event, player) {
      return event.skill == "rejijiang"
    },
    forced: true,
    async content(event, trigger, player) {
      delete trigger.skill
      trigger.getParent().set("jijiang", true)

      var current = player.next

      while (current != player) {
        if (current.group == "shu") {
          var next = current.chooseToRespond("是否替" + get.translation(player) + "打出一张杀？", {
            name: "sha",
          })
          next.set("ai", function () {
            var event = _status.event
            return get.attitude(event.player, event.source) - 2
          })
          next.set("source", player)
          next.set("jijiang", true)
          next.set("skillwarn", "替" + get.translation(player) + "打出一张杀")
          next.noOrdering = true
          next.autochoose = lib.filter.autoRespondSha

          var result = await next.forResult()

          if (result.bool) {
            trigger.card = result.card
            trigger.cards = result.cards
            trigger.throw = false
            if (typeof current.ai.shown == "number" && current.ai.shown < 0.95) {
              current.ai.shown += 0.3
              if (current.ai.shown > 0.95) {
                current.ai.shown = 0.95
              }
            }
            return
          }
        }
        current = current.next
      }

      player.addTempSkill("jijiang3")
      trigger.cancel()
      trigger.getParent().goto(0)
    },
  },
  rejijiang3: {
    trigger: { global: ["useCard", "respond"] },
    usable: 1,
    sourceSkill: "rejijiang",
    filter(event, player) {
      return (
        event.card.name == "sha" &&
        event.player != player &&
        event.player.group == "shu" &&
        event.player.isIn() &&
        event.player != _status.currentPhase &&
        player.hasZhuSkill("rejijiang")
      )
    },
    async cost(event, trigger, player) {
      event.result = await trigger.player
        .chooseBool(`激将：是否令${get.translation(player)}摸一张牌？`)
        .set("ai", () => {
          const evt = _status.event
          return get.attitude(evt.player, evt.getParent().player) > 0
        })
        .forResult()
    },
    async content(event, trigger, player) {
      trigger.player.line(player, "fire")
      await player.draw()
    },
  },
  // 界张飞
  // 咆哮
  olpaoxiao: {
    audio: "repaoxiao",
    audioname: ["xiahouba", "re_guanzhang"],
    audioname2: { guanzhang: "paoxiao_guanzhang", ol_guanzhang: "paoxiao_ol_guanzhang" },
    trigger: { player: "shaMiss" },
    forced: true,
    async content(event, trigger, player) {
      player.addTempSkill("olpaoxiao2")
      player.addMark("olpaoxiao2", 1, false)
    },
    mod: {
      cardUsable(card, player, num) {
        if (card.name == "sha") {
          return Infinity
        }
      },
    },
  },
  olpaoxiao2: {
    trigger: { source: "damageBegin1" },
    forced: true,
    audio: "repaoxiao",
    audioname: ["xiahouba", "re_guanzhang"],
    audioname2: { guanzhang: "paoxiao_guanzhang", ol_guanzhang: "paoxiao_ol_guanzhang" },
    sourceSkill: "olpaoxiao",
    filter(event, player) {
      return event.card && event.card.name == "sha" && player.countMark("olpaoxiao2") > 0
    },
    onremove: true,
    async content(event, trigger, player) {
      trigger.num += player.countMark("olpaoxiao2")
      player.removeSkill("olpaoxiao2")
    },
    intro: { content: "本回合内下一次使用【杀】造成伤害时令伤害值+#" },
  },
  // 替身
  retishen: {
    audio: "tishen",
    skillAnimation: true,
    animationColor: "soil",
    limited: true,
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      return player.isDamaged()
    },
    check(event, player) {
      if (player.hp <= 2 || player.getDamagedHp() > 2) {
        return true
      }
      if (player.getDamagedHp() <= 1) {
        return false
      }
      return player.getDamagedHp() < game.roundNumber
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      const num = player.getDamagedHp(true)
      await player.recover(num)
      await player.draw(num)
    },
  },
  // 界赵云
  // 龙胆
  relongdan: {
    mod: {
      aiValue(player, card, num) {
        if (card.name != "sha" && card.name != "shan") {
          return
        }
        var geti = function () {
          var cards = player.getCards("hs", function (card) {
            return card.name == "sha" || card.name == "shan"
          })
          if (cards.includes(card)) {
            return cards.indexOf(card)
          }
          return cards.length
        }
        return Math.max(num, [7, 5, 5, 3][Math.min(geti(), 3)])
      },
      aiUseful() {
        return lib.skill.relongdan.mod.aiValue.apply(this, arguments)
      },
    },
    locked: false,
    audio: 2,
    audioname: ["huan_zhaoyun", "sp_zhaoyun"],
    audioname2: { tongyuan: "longdan_tongyuan" },
    hiddenCard(player, name) {
      if (name == "tao") {
        return player.countCards("hs", "jiu") > 0
      }
      if (name == "jiu") {
        return player.countCards("hs", "tao") > 0
      }
      return false
    },
    enable: ["chooseToUse", "chooseToRespond"],
    position: "hs",
    prompt: "将一张【闪】当【杀】、【杀】当【闪】、【酒】当【桃】、【桃】当【酒】使用或打出",
    viewAs(cards, player) {
      if (cards.length) {
        var name = false
        switch (get.name(cards[0], player)) {
          case "sha":
            name = "shan"
            break
          case "shan":
            name = "sha"
            break
          case "tao":
            name = "jiu"
            break
          case "jiu":
            name = "tao"
            break
        }
        if (name) {
          return { name: name }
        }
      }
      return null
    },
    check(card) {
      var player = _status.event.player
      if (_status.event.type == "phase") {
        var max = 0
        var name2
        var list = ["sha", "tao", "jiu"]
        var map = { sha: "shan", tao: "jiu", jiu: "tao" }
        for (var i = 0; i < list.length; i++) {
          var name = list[i]
          if (
            player.countCards("hs", map[name]) > (name == "jiu" ? 1 : 0) &&
            player.getUseValue({ name: name }) > 0
          ) {
            var temp = get.order({ name: name })
            if (temp > max) {
              max = temp
              name2 = map[name]
            }
          }
        }
        if (name2 == get.name(card, player)) {
          return 1
        }
        return 0
      }
      return 1
    },
    filterCard(card, player, event) {
      event = event || _status.event
      var filter = event._backup.filterCard
      var name = get.name(card, player)
      if (name == "sha" && filter({ name: "shan", cards: [card] }, player, event)) {
        return true
      }
      if (name == "shan" && filter({ name: "sha", cards: [card] }, player, event)) {
        return true
      }
      if (name == "tao" && filter({ name: "jiu", cards: [card] }, player, event)) {
        return true
      }
      if (name == "jiu" && filter({ name: "tao", cards: [card] }, player, event)) {
        return true
      }
      return false
    },
    filter(event, player) {
      var filter = event.filterCard
      if (
        filter(get.autoViewAs({ name: "sha" }, "unsure"), player, event) &&
        player.countCards("hs", "shan")
      ) {
        return true
      }
      if (
        filter(get.autoViewAs({ name: "shan" }, "unsure"), player, event) &&
        player.countCards("hs", "sha")
      ) {
        return true
      }
      if (
        filter(get.autoViewAs({ name: "tao" }, "unsure"), player, event) &&
        player.countCards("hs", "jiu")
      ) {
        return true
      }
      if (
        filter(get.autoViewAs({ name: "jiu" }, "unsure"), player, event) &&
        player.countCards("hs", "tao")
      ) {
        return true
      }
      return false
    },
    ai: {
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag) {
        var name
        switch (tag) {
          case "respondSha":
            name = "shan"
            break
          case "respondShan":
            name = "sha"
            break
        }
        if (!player.countCards("hs", name)) {
          return false
        }
      },
      order(item, player) {
        if (player && _status.event.type == "phase") {
          var max = 0
          var list = ["sha", "tao", "jiu"]
          var map = { sha: "shan", tao: "jiu", jiu: "tao" }
          for (var i = 0; i < list.length; i++) {
            var name = list[i]
            if (
              player.countCards("hs", map[name]) > (name == "jiu" ? 1 : 0) &&
              player.getUseValue({ name: name }) > 0
            ) {
              var temp = get.order({ name: name })
              if (temp > max) {
                max = temp
              }
            }
          }
          if (max > 0) {
            max += 0.3
          }
          return max
        }
        return 4
      },
    },
  },
  // 涯角
  reyajiao: {
    audio: "yajiao",
    trigger: {
      player: "loseAfter",
      global: "loseAsyncAfter",
    },
    frequent: true,
    filter(event, player) {
      if (player == _status.currentPhase) {
        return false
      }
      return (
        ["useCard", "respond"].includes(event.getParent().name) && event.getl(player)?.hs?.length
      )
    },
    async content(event, trigger, player) {
      const cards = get.cards(1, true)
      await player
        .showCards(cards, get.translation(player) + "发动了【涯角】", true)
        .set("type", get.type2(trigger.getParent().card))
        .set("clearArena", false)
        .set("removeHighlight", false)
        .set("callback", async (event, trigger, player) => {
          const { cards } = event
          const [card] = cards
          const evt = event.getParent()
          const { type, videoId, highlightRemove } = evt
          if (get.type2(card) == type) {
            const result = await player
              .chooseTarget("涯角：选择获得此牌的角色")
              .set("ai", function (target) {
                var att = get.attitude(_status.event.player, target)
                if (_status.event.du) {
                  if (target.hasSkillTag("nodu")) {
                    return 0
                  }
                  return -att
                }
                if (att > 0) {
                  return att + Math.max(0, 5 - target.countCards("h"))
                }
                return att
              })
              .set("du", get.name(card) == "du")
              .forResult()
            if (result?.bool && result.targets?.length) {
              const {
                targets: [target],
              } = result
              player.line(target, "green")
              highlightRemove()
              await target.gain(cards, "gain2")
            }
          } else {
            const result = await player
              .chooseTarget(
                "涯角：是否弃置攻击范围内包含你的角色区域里的一张牌？",
                function (card, player, target) {
                  return target.inRange(player) && target.countDiscardableCards(player, "hej") > 0
                },
              )
              .set("ai", function (target) {
                var player = _status.event.player
                return get.effect(target, { name: "guohe" }, player, player)
              })
              .forResult()
            if (result?.bool && result.targets?.length) {
              const {
                targets: [target],
              } = result
              player.line(target, "green")
              highlightRemove()
              await player.discardPlayerCard(target, "hej", true)
            }
          }
          //清楚残留的动画
          game.broadcastAll(ui.clear)
          game.addVideo("judge2", null, videoId)
          if (cards.someInD()) {
            await game.cardsGotoPile(cards.filterInD(), "insert")
          }
        })
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.tag(card, "respond") && target.countCards("h") > 1) {
            return [1, 0.2]
          }
        },
      },
    },
  },
  oljizhi: {
    audio: "rejizhi",
    locked: false,
    trigger: { player: "useCard" },
    frequent: true,
    filter(event) {
      return get.type(event.card, "trick") == "trick" && event.card.isCard
    },
    init(player) {
      player.storage.oljizhi = 0
    },
    async content(event, trigger, player) {
      await player.draw("nodelay")
      if (!player.hasCard({ type: "basic" }, "h")) {
        return
      }

      const result = await player
        .chooseToDiscard("是否弃置一张基本牌并令本回合你的手牌上限+1？", { type: "basic" })
        .set("ai", (card) => {
          if (_status.currentPhase === player && player.needsToDiscard(-3)) {
            return 6 - get.value(card, player)
          }
          return 0
        })
        .forResult()

      if (result.bool) {
        player.storage.oljizhi++
        if (_status.currentPhase === player) {
          player.markSkill("oljizhi")
        }
      }
    },
    ai: {
      threaten: 1.4,
      noautowuxie: true,
    },
    mod: {
      maxHandcard(player, num) {
        return num + player.storage.oljizhi
      },
    },
    intro: {
      content: "本回合手牌上限+#",
    },
    group: "oljizhi_clear",
    subSkill: {
      clear: {
        trigger: { global: "phaseAfter" },
        silent: true,
        async content(event, trigger, player) {
          player.storage.oljizhi = 0
          player.unmarkSkill("oljizhi")
        },
      },
    },
  },
  // 界孙权
  // 救援
  oljiuyuan: {
    audio: "rejiuyuan",
    zhuSkill: true,
    trigger: { global: "recoverBefore" },
    direct: true,
    filter(event, player) {
      return (
        player != event.player &&
        event.player.group == "wu" &&
        player.hp <= event.player.hp &&
        event.getParent().name != "oljiuyuan" &&
        player.hasZhuSkill("oljiuyuan", event.player) &&
        event.player === _status.currentPhase
      )
    },
    async content(event, trigger, player) {
      // step 0
      const result = await trigger.player
        .chooseBool(
          "是否对" + get.translation(player) + "发动【救援】？",
          "改为令其回复1点体力，然后你摸一张牌",
        )
        .set("ai", function () {
          const evt = _status.event
          return get.attitude(evt.player, evt.getParent().player) > 0
        })
        .forResult()

      // step 1
      if (result.bool) {
        player.logSkill("oljiuyuan")
        trigger.player.line(player, "green")
        trigger.cancel()
        await player.recover(trigger.player)
        await trigger.player.draw()
      }
    },
  },
  // 界吕蒙
  // 勤学
  reqinxue: {
    skillAnimation: true,
    animationColor: "wood",
    audio: "qinxue",
    juexingji: true,
    derivation: "gongxin",
    trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
    forced: true,
    filter(event, player) {
      if (player.countCards("h") >= player.hp + 2) {
        return true
      }
      return false
    },
    async content(event, trigger, player) {
      const { name } = event
      player.awakenSkill(name)
      await player.loseMaxHp()
      await player.chooseDrawRecover(2, true)
      await player.addSkills("gongxin")
    },
  },
  // 博图
  botu: {
    audio: 2,
    trigger: { player: "phaseEnd" },
    frequent: true,
    filter(event, player) {
      if (player.countMark("botu_used") >= Math.min(3, game.countPlayer())) {
        return false
      }
      var suits = []
      game.getGlobalHistory("cardMove", function (evt) {
        if (suits.length >= 4) {
          return
        }
        if (evt.name == "lose") {
          if (evt.position == ui.discardPile) {
            for (var i of evt.cards) {
              suits.add(get.suit(i, false))
            }
          }
        } else {
          if (evt.name == "cardsDiscard") {
            for (var i of evt.cards) {
              suits.add(get.suit(i, false))
            }
          }
        }
      })
      return suits.length >= 4
    },
    async content(event, trigger, player) {
      player.addTempSkill("botu_used", "roundStart")
      player.addMark("botu_used", 1, false)
      player.insertPhase()
    },
    group: "botu_mark",
    subSkill: {
      used: {
        onremove: true,
        charlotte: true,
      },
      mark: {
        trigger: {
          global: ["loseAfter", "cardsDiscardAfter"],
          player: "phaseAfter",
        },
        forced: true,
        firstDo: true,
        silent: true,
        filter(event, player) {
          if (event.name == "phase") {
            return true
          }
          if (player != _status.currentPhase) {
            return false
          }
          if (event.name == "lose") {
            return event.position == ui.discardPile
          }
          return true
        },
        async content(event, trigger, player) {
          if (trigger.name == "phase") {
            player.unmarkSkill("botu_mark")
            return
          }
          const suits = []
          game.getGlobalHistory("cardMove", (evt) => {
            if (suits.length >= 4) {
              return false
            }
            if (evt.name == "lose") {
              if (evt.position == ui.discardPile) {
                for (const c of evt.cards) {
                  suits.add(get.suit(c, false))
                }
              }
            } else if (evt.name == "cardsDiscard") {
              for (const c of evt.cards) {
                suits.add(get.suit(c, false))
              }
            }
            return false
          })
          player.storage.botu_mark = suits
          player.markSkill("botu_mark")
        },
        intro: {
          onunmark: true,
          content: "本回合已有$花色的牌进入过弃牌堆",
        },
      },
    },
  },
}

export default skills
