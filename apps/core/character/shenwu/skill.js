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
  // 诈降
  rezhaxiang: {
    audio: "zhaxiang",
    trigger: { player: "loseHpEnd" },
    filter(event, player) {
      return player.isIn() && event.num > 0
    },
    getIndex: (event) => event.num,
    forced: true,
    async content(event, trigger, player) {
      await player.draw(3)
      if (player.isPhaseUsing()) {
        player.addTempSkill(event.name + "_effect")
        player.addMark(event.name + "_effect", 1, false)
      }
    },
    subSkill: {
      effect: {
        mod: {
          targetInRange(card, player, target, now) {
            if (card.name == "sha" && get.color(card) == "red") {
              return true
            }
          },
          cardUsable(card, player, num) {
            if (card.name == "sha") {
              return num + player.countMark("rezhaxiang_effect")
            }
          },
        },
        charlotte: true,
        onremove: true,
        audio: "rezhaxiang",
        audioname2: { ol_sb_jiangwei: "rezhaxiang_ol_sb_jiangwei" },
        trigger: { player: "useCard" },
        sourceSkill: "rezhaxiang",
        filter(event, player) {
          return event.card?.name == "sha" && get.color(event.card) == "red"
        },
        forced: true,
        async content(event, trigger, player) {
          trigger.directHit.addArray(game.players)
        },
        intro: {
          content: "<li>使用【杀】的次数上限+#<br><li>使用红色【杀】无距离限制且不能被【闪】响应",
        },
        ai: {
          directHit_ai: true,
          skillTagFilter(player, tag, arg) {
            return arg?.card?.name == "sha" && get.color(arg.card) == "red"
          },
        },
      },
    },
    ai: {
      maihp: true,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage")) {
            if (player.hasSkillTag("jueqing", false, target)) {
              return [1, 1]
            }
            return 1.2
          }
          if (get.tag(card, "loseHp")) {
            if (target.hp <= 1) {
              return
            }
            var using = target.isPhaseUsing()
            if (target.hp <= 2) {
              return [1, player.countCards("h") <= 1 && using ? 3 : 0]
            }
            if (using && target.countCards("h", { name: "sha", color: "red" })) {
              return [1, 3]
            }
            return [
              1,
              target.countCards("h") <= target.hp ||
              (using &&
                game.hasPlayer(
                  (current) =>
                    current != player &&
                    get.attitude(player, current) < 0 &&
                    player.inRange(current),
                ))
                ? 3
                : 2,
            ]
          }
        },
      },
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
  // 界貂蝉
  // 离间
  relijian: {
    audio: "lijian",
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return game.countPlayer((current) => current != player && current.hasSex("male")) > 1
    },
    check(card) {
      return 10 - get.value(card)
    },
    filterCard: true,
    position: "he",
    filterTarget(card, player, target) {
      if (player == target) {
        return false
      }
      if (!target.hasSex("male")) {
        return false
      }
      if (ui.selected.targets.length == 1) {
        return target.canUse({ name: "juedou" }, ui.selected.targets[0])
      }
      return true
    },
    targetprompt: ["先出杀", "后出杀"],
    selectTarget: 2,
    multitarget: true,
    async content(event, trigger, player) {
      const useCardEvent = event.targets[1].useCard(
        { name: "juedou", isCard: true },
        "nowuxie",
        event.targets[0],
        "noai",
      )
      useCardEvent.animate = false
      await game.delay(0.5)
    },
    ai: {
      order: 8,
      result: {
        target(player, target) {
          if (ui.selected.targets.length == 0) {
            return -3
          } else {
            return get.effect(target, { name: "juedou" }, ui.selected.targets[0], target)
          }
        },
      },
      expose: 0.4,
      threaten: 3,
    },
  },
  // 界华雄
  // 耀武
  olyaowu: {
    trigger: { player: "damageBegin3" },
    audio: "reyaowu",
    forced: true,
    filter(event) {
      return event.card && (get.color(event.card) != "red" || (event.source && event.source.isIn()))
    },
    async content(event, trigger, player) {
      if (get.color(trigger.card) == "red") {
        await trigger.source.draw()
      } else {
        await trigger.player.draw()
      }
    },
    ai: {
      effect: {
        target: (card, player, target) => {
          if (typeof card !== "object" || !get.tag(card, "damage")) {
            return
          }
          if (player.hasSkillTag("jueqing", false, target)) {
            return
          }
          if (get.color(card) === "red") {
            return [1, 0, 1, 0.6]
          }
          return [1, 0.6]
        },
      },
    },
  },
  // 势斩
  shizhan: {
    audio: 2,
    enable: "phaseUse",
    usable: 2,
    filterTarget(card, player, target) {
      return target != player && target.canUse("juedou", player)
    },
    async content(event, trigger, player) {
      await event.target.useCard({ name: "juedou", isCard: true }, player, "noai")
    },
    ai: {
      order: 2,
      result: {
        player(player, target) {
          return get.effect(player, { name: "juedou", isCard: true }, target, player)
        },
      },
    },
  },
  // 界公孙瓒
  // 义从
  reyicong: {
    trigger: {
      player: ["changeHp"],
    },
    audio: 2,
    forced: true,
    filter(event, player) {
      return (
        get.sgn(player.getDamagedHp() - 1.5) != get.sgn(player.getDamagedHp() - 1.5 + event.num)
      )
    },
    async content(_) {},
    mod: {
      globalFrom(from, to, current) {
        return current - 1
      },
      globalTo(from, to, current) {
        if (to.getDamagedHp() >= 2) {
          return current + 1
        }
      },
    },
    ai: {
      threaten: 0.8,
    },
  },
  // 趫猛
  reqiaomeng: {
    audio: "qiaomeng",
    trigger: { player: "useCardToPlayered" },
    filter(event, player) {
      if (!event.isFirstTarget || get.color(event.card) != "black") {
        return false
      }
      for (var i of event.targets) {
        if (
          i != player &&
          i.hasCard(function (card) {
            return lib.filter.canBeDiscarded(card, player, i)
          }, "he")
        ) {
          return true
        }
      }
      return false
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt("reqiaomeng"),
          "选择一名不为自己的目标角色，然后弃置其一张牌。若以此法弃置的牌为：装备牌，你获得此牌；锦囊牌，你令" +
            get.translation(trigger.card) +
            "不可被响应。",
          function (card, player, target) {
            return (
              target != player &&
              _status.event.getTrigger().targets.includes(target) &&
              target.hasCard(function (card) {
                return lib.filter.canBeDiscarded(card, player, target)
              }, "he")
            )
          },
        )
        .set("ai", function (target) {
          const player = _status.event.player
          return get.effect(target, { name: "guohe_copy2" }, player, player)
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      const result = await player.discardPlayerCard(target, true, "he").forResult()
      if (result?.bool && result.cards?.length) {
        //为了体现白马义从野性纯真的美 直接获取卡牌原类型 不考虑维系区域
        const card = result.cards[0],
          type = get.type2(card, false)
        if (type == "trick") {
          trigger.directHit.addArray(game.filterPlayer((current) => current != player))
        }
        if (type == "equip" && get.position(card, true) == "d") {
          await player.gain(card, "gain2")
        }
      }
    },
  },
  // 界曹仁
  // 解围
  rejiewei: {
    audio: "jiewei",
    enable: "chooseToUse",
    filterCard: true,
    position: "e",
    viewAs: { name: "wuxie" },
    filter(event, player) {
      return player.countCards("e") > 0
    },
    viewAsFilter(player) {
      return player.countCards("e") > 0
    },
    prompt: "将装备区里的一张牌当【无懈可击】使用",
    check(card) {
      return 8 - get.equipValue(card)
    },
    threaten: 1.2,
    group: "rejiewei_move",
    subSkill: {
      move: {
        trigger: { player: "turnOverEnd" },
        audio: "jiewei",
        filter(event, player) {
          return !player.isTurnedOver() && player.canMoveCard()
        },
        async cost(event, trigger, player) {
          event.result = await player
            .chooseToDiscard(
              "he",
              get.prompt("rejiewei"),
              "弃置一张牌，然后可以移动场上的一张牌",
              lib.filter.cardDiscardable,
            )
            .set("ai", function (card) {
              if (!_status.event.check) {
                return 0
              }
              return 7 - get.value(card)
            })
            .set("check", player.canMoveCard(true))
            .forResult()
        },
        async content(event, trigger, player) {
          await player.moveCard()
        },
      },
    },
  },
  // 界夏侯渊
  // 设变
  shebian: {
    audio: 2,
    trigger: { player: "turnOverEnd" },
    check(event, player) {
      return player.canMoveCard(true, true)
    },
    filter(event, player) {
      return player.canMoveCard(null, true)
    },
    async content(event, trigger, player) {
      await player.moveCard().set("nojudge", true)
    },
  },
  // 界黄忠
  // 烈弓
  olliegong: {
    mod: {
      aiOrder(player, card, num) {
        if (num > 0 && (card.name === "sha" || get.tag(card, "draw"))) {
          return num + 6
        }
      },
      targetInRange(card, player) {
        if (card.name == "sha") {
          return true
        }
      },
    },
    targetprompt2: (target) => {
      const player = get.player(),
        card = get.card(),
        list = []
      if (card?.name != "sha" || !target.classList.contains("selectable")) {
        return list
      }
      const num = card.cards?.length ?? 0
      if (target.countCards("h") <= player.countCards("h") - num) {
        list.add("不可响应")
      }
      if (target.hp >= player.hp) {
        list.add("加伤")
      }
      return list
    },
    onChooseToUse(event) {
      event.targetprompt2.add(lib.skill.olliegong.targetprompt2)
    },
    onChooseTarget(event) {
      event.targetprompt2.add(lib.skill.olliegong.targetprompt2)
    },
    audio: 2,
    trigger: { player: "useCardToTargeted" },
    logTarget: "target",
    locked: false,
    check(event, player) {
      return get.attitude(player, event.target) <= 0
    },
    filter(event, player) {
      if (event.card.name != "sha") {
        return false
      }
      if (event.target.countCards("h") <= player.countCards("h")) {
        return true
      }
      if (event.target.hp >= player.hp) {
        return true
      }
      return false
    },
    async content(event, trigger, player) {
      if (trigger.target.countCards("h") <= player.countCards("h")) {
        trigger.getParent().directHit.push(trigger.target)
      }
      if (trigger.target.hp >= player.hp) {
        const id = trigger.target.playerid
        const map = trigger.getParent().customArgs
        if (!map[id]) {
          map[id] = {}
        }
        if (typeof map[id].extraDamage != "number") {
          map[id].extraDamage = 0
        }
        map[id].extraDamage++
      }
    },
    ai: {
      threaten: 0.5,
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (
          arg?.target &&
          arg?.card &&
          get.attitude(player, arg.target) <= 0 &&
          arg.card.name == "sha" &&
          player.countCards("h", function (card) {
            return card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card))
          }) >= arg.target.countCards("h")
        ) {
          return true
        }
        return false
      },
    },
  },
  // 界魏延
  // 奇谋
  reqimou: {
    limited: true,
    audio: 2,
    enable: "phaseUse",
    skillAnimation: true,
    animationColor: "orange",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      const result = await player
        .chooseNumbers(
          get.prompt(event.name),
          [{ prompt: "请选择你要失去的体力值", min: 1, max: player.getHp() }],
          true,
        )
        .set("processAI", () => {
          const player = get.player()
          let num = player.getHp() - 1
          if (player.countCards("hs", { name: ["tao", "jiu"] })) {
            num = player.getHp()
          }
          return [num]
        })
        .forResult()
      const number = result.numbers[0]
      player.storage.reqimou2 = number
      await player.loseHp(number)
      await player.draw(number)
      player.addTempSkill("reqimou2")
    },
    ai: {
      order: 14,
      result: {
        player(player) {
          if (player.hp < 3) {
            return false
          }
          var mindist = player.hp
          if (player.countCards("hs", (card) => player.canSaveCard(card, player))) {
            mindist++
          }
          if (
            game.hasPlayer(function (current) {
              return (
                get.distance(player, current) <= mindist &&
                player.canUse("sha", current, false) &&
                get.effect(current, { name: "sha" }, player, player) > 0
              )
            })
          ) {
            return 1
          }
          return 0
        },
      },
    },
  },
  reqimou2: {
    onremove: true,
    mod: {
      cardUsable(card, player, num) {
        if (typeof player.storage.reqimou2 == "number" && card.name == "sha") {
          return num + player.storage.reqimou2
        }
      },
      globalFrom(from, to, distance) {
        if (typeof from.storage.reqimou2 == "number") {
          return distance - from.storage.reqimou2
        }
      },
    },
  },
  // 界小乔
  // 天香
  oltianxiang: {
    audio: 2,
    audioname: ["daxiaoqiao"],
    trigger: { player: "damageBegin4" },
    direct: true,
    filter(event, player) {
      return (
        player.countCards("he", function (card) {
          if (_status.connectMode && get.position(card) == "h") {
            return true
          }
          return get.suit(card, player) == "heart"
        }) > 0 && event.num > 0
      )
    },
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .chooseCardTarget({
          filterCard(card, player) {
            return get.suit(card) == "heart" && lib.filter.cardDiscardable(card, player)
          },
          filterTarget(card, player, target) {
            return player != target
          },
          position: "he",
          ai1(card) {
            return 10 - get.value(card)
          },
          ai2(target) {
            var att = get.attitude(_status.event.player, target)
            var trigger = _status.event.getTrigger()
            var da = 0
            if (_status.event.player.hp == 1) {
              da = 10
            }
            var eff = get.damageEffect(target, trigger.source, target)
            if (att == 0) {
              return 0.1 + da
            }
            if (eff >= 0 && att > 0) {
              return att + da
            }
            if (att > 0 && target.hp > 1) {
              if (target.maxHp - target.hp >= 3) {
                return att * 1.1 + da
              }
              if (target.maxHp - target.hp >= 2) {
                return att * 0.9 + da
              }
            }
            return -att + da
          },
          prompt: get.prompt("oltianxiang"),
          prompt2: lib.translate.oltianxiang_info,
        })
        .forResult()
      // step 1
      if (result.bool) {
        await player.discard(result.cards)
        var target = result.targets[0]
        const result2 = await player
          .chooseControlList(
            true,
            function (event, player) {
              var target = _status.event.target
              var att = get.attitude(player, target)
              if (target.hasSkillTag("maihp")) {
                att = -att
              }
              if (att > 0) {
                return 0
              } else {
                return 1
              }
            },
            [
              "令" +
                get.translation(target) +
                "受到伤害来源对其造成的1点伤害，然后摸X张牌（X为其已损失体力值且至多为5）",
              "令" +
                get.translation(target) +
                "失去1点体力，然后获得" +
                get.translation(result.cards),
            ],
          )
          .set("target", target)
          .forResult()
        player.logSkill(event.name, target)
        trigger.cancel()
        event.target = target
        event.card = result.cards[0]
        // step 2
        if (typeof result2.index == "number") {
          event.index = result2.index
          if (result2.index) {
            event.related = event.target.loseHp()
          } else {
            const param = trigger.source
              ? { source: trigger.source, nocard: true }
              : { nosource: true, nocard: true }
            event.related = event.target.damage(param)
          }
          await event.related
        } else {
          return
        }
        // step 3
        if (event.related.cancelled || target.isDead()) {
          return
        }
        if (event.index && event.card.isInPile()) {
          await target.gain(event.card, "gain2")
        } else if (target.getDamagedHp()) {
          await target.draw({ num: Math.min(5, target.getDamagedHp()) })
        }
      }
    },
    ai: {
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return
          }
          if (get.tag(card, "damage") && target.countCards("he") > 1) {
            return 0.7
          }
        },
      },
    },
  },
  // 红颜
  rehongyan: {
    audio: 2,
    mod: {
      suit(card, suit) {
        if (suit == "spade") {
          return "heart"
        }
      },
      maxHandcardBase(player, num) {
        if (
          player.countCards("e", function (card) {
            return get.suit(card, player) == "heart"
          })
        ) {
          return player.maxHp
        }
      },
    },
  },
  // 飘零
  piaoling: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    frequent: true,
    async content(event, trigger, player) {
      const result = await player
        .judge(function (card) {
          return get.suit(card) == "heart" ? 2 : 0
        })
        .set("judge2", function (result) {
          return result.bool ? true : false
        })
        .forResult()
      if (result?.card && result.suit == "heart") {
        const { card } = result
        if (get.position(card, true) == "d") {
          const result2 = await player
            .chooseTarget(
              "飘零：令一名角色获得" + get.translation(card) + "，或点【取消】将其置于牌堆顶",
            )
            .set("ai", function (target) {
              var player = _status.event.player
              var att = get.attitude(player, target)
              if (player == target) {
                att /= 2
              }
              return att
            })
            .forResult()
          if (result2.bool && result2.targets?.length) {
            const {
              targets: [target],
            } = result2
            player.line(target, "green")
            await target.gain(card, "gain2")
            if (player == target) {
              await player.chooseToDiscard("he", true)
            }
          } else {
            game.log(player, "将", card, "置于牌堆顶")
            await game.cardsGotoPile(card, "insert")
          }
        }
      }
    },
  },
  // 界周泰
  // 奋激
  refenji: {
    audio: "fenji",
    trigger: { global: ["gainAfter", "loseAfter", "loseAsyncAfter"] },
    filter(event, player) {
      return event.player.isIn()
    },
    getIndex(event, player) {
      if (event.type == "use" || event.type == "respond") {
        return []
      }
      const storage = player.getStorage("refenji_used")
      return game
        .filterPlayer((current) => {
          return event.getl(current).hs.length > 0 && !storage.includes(current)
        })
        .sortBySeat()
    },
    logTarget: (event, player, triggername, target) => target,
    check(event, player, triggername, target) {
      if (get.attitude(player, target) <= 0) {
        return false
      }
      return (
        2 * get.effect(target, { name: "draw" }, player, player) +
          get.effect(player, { name: "losehp" }, player, player) >
        0
      )
    },
    async content(event, trigger, player) {
      const [target] = event.targets
      player.markAuto(`${event.name}_used`, target)
      player.addTempSkill(`${event.name}_used`)
      await player.loseHp()
      await target.draw(2)
    },
    subSkill: {
      used: {
        onremove: true,
        charlotte: true,
      },
    },
  },
  // 界张角
  // 雷击
  olleiji: {
    group: "olleiji_misa",
    audio: 2,
    audioname: ["boss_qinglong"],
    trigger: { player: ["useCard", "respond"] },
    filter(event, player) {
      return event.card.name == "shan" || (event.name == "useCard" && event.card.name == "shandian")
    },
    judgeCheck(card, bool) {
      var suit = get.suit(card)
      if (suit == "spade") {
        if (bool && get.number(card) > 1 && get.number(card) < 10) {
          return 5
        }
        return 4
      }
      if (suit == "club") {
        return 2
      }
      return 0
    },
    async content(event, trigger, player) {
      const judgeEvent = player.judge(lib.skill.olleiji.judgeCheck)
      judgeEvent.judge2 = (result) => !!result.bool
      await judgeEvent
    },
    ai: {
      useShan: true,
      effect: {
        target_use(card, player, target, current) {
          let name
          if (typeof card == "object") {
            if (card.viewAs) {
              name = card.viewAs
            } else {
              name = get.name(card)
            }
          }
          if (
            name == "shandian" ||
            (get.tag(card, "respondShan") &&
              !player.hasSkillTag(
                "directHit_ai",
                true,
                {
                  target: target,
                  card: card,
                },
                true,
              ))
          ) {
            let club = 0,
              spade = 0
            if (
              game.hasPlayer(function (current) {
                return (
                  get.attitude(target, current) < 0 &&
                  get.damageEffect(current, target, target, "thunder") > 0
                )
              })
            ) {
              club = 2
              spade = 4
            }
            if (!target.isHealthy()) {
              club += 2
            }
            if (!club && !spade) {
              return 1
            }
            if (name === "sha") {
              if (!target.mayHaveShan(player, "use")) {
                return
              }
            } else if (!target.mayHaveShan(player)) {
              return 1 - 0.1 * Math.min(5, target.countCards("hs"))
            }
            if (!target.hasSkillTag("rejudge")) {
              return [1, (club + spade) / 4]
            }
            let pos =
                player == target || player.hasSkillTag("viewHandcard", null, target, true)
                  ? "hes"
                  : "e",
              better = club > spade ? "club" : "spade",
              max = 0
            target.hasCard(function (cardx) {
              if (get.suit(cardx) == better) {
                max = 2
                return true
              }
              if (spade && get.color(cardx) == "black") {
                max = 1
              }
            }, pos)
            if (max == 2) {
              return [1, Math.max(club, spade)]
            }
            if (max == 1) {
              return [1, Math.min(club, spade)]
            }
            if (pos == "e") {
              return [
                1,
                Math.min(
                  (Math.max(1, target.countCards("hs")) * (club + spade)) / 4,
                  Math.max(club, spade),
                ),
              ]
            }
            return [1, (club + spade) / 4]
          }
        },
        target(card, player, target) {
          let name
          if (typeof card == "object") {
            if (card.viewAs) {
              name = card.viewAs
            } else {
              name = get.name(card)
            }
          }
          if (name == "lebu" || name == "bingliang") {
            return [
              target.hasSkillTag("rejudge") ? 0.4 : 1,
              2,
              target.hasSkillTag("rejudge") ? 0.4 : 1,
              0,
            ]
          }
        },
      },
    },
  },
  olleiji_misa: {
    audio: "olleiji",
    trigger: { player: "judgeEnd" },
    direct: true,
    disableReason: ["暴虐", "助祭", "弘仪", "孤影"],
    sourceSkill: "olleiji",
    filter(event, player) {
      return (
        !lib.skill.olleiji_misa.disableReason.includes(event.judgestr) &&
        ["spade", "club"].includes(event.result.suit)
      )
    },
    async content(event, trigger, player) {
      // step 0
      event.num = 1 + ["club", "spade"].indexOf(trigger.result.suit)
      event.logged = false
      if (event.num == 1 && player.isDamaged()) {
        event.logged = true
        player.logSkill("olleiji")
        await player.recover()
      }
      const result = await player
        .chooseTarget("雷击：是否对一名角色造成" + event.num + "点雷电伤害？")
        .set("ai", (target) => {
          const player = _status.event.player
          let eff = get.damageEffect(target, player, target, "thunder")
          if (
            get.event().num > 1 &&
            !target.hasSkillTag("filterDamage", null, {
              player: player,
              card: null,
              nature: "thunder",
            })
          ) {
            if (eff > 0) {
              eff -= 25
            } else if (eff < 0) {
              eff *= 2
            }
          }
          return eff * get.attitude(player, target)
        })
        .set("num", event.num)
        .forResult()

      // step 1
      if (result.bool && result.targets && result.targets.length) {
        if (!event.logged) {
          player.logSkill("olleiji", result.targets)
        } else {
          player.line(result.targets, "thunder")
        }
        await result.targets[0].damage(event.num, "thunder")
      }
    },
  },
  // 鬼道
  reguidao: {
    audio: 2,
    mod: {
      aiOrder(player, card, num) {
        if (
          num > 0 &&
          get.itemtype(card) == "card" &&
          get.color(card) == "black" &&
          get.type(card) == "equip"
        ) {
          num * 1.35
        }
      },
      aiValue(player, card, num) {
        if (num > 0 && get.itemtype(card) == "card" && get.color(card) == "black") {
          return num * 1.15
        }
      },
      aiUseful(player, card, num) {
        if (num > 0 && get.itemtype(card) == "card" && get.color(card) == "black") {
          return num * 1.35
        }
      },
    },
    locked: false,
    trigger: { global: "judge" },
    filter(event, player) {
      return player.countCards("hes", { color: "black" }) > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCard(
          `${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`,
          "hes",
          (card) => {
            const player = get.player()
            if (get.color(card) !== "black") {
              return false
            }
            const mod2 = game.checkMod(card, player, "unchanged", "cardEnabled2", player)
            if (mod2 != "unchanged") {
              return mod2
            }
            const mod = game.checkMod(card, player, "unchanged", "cardRespondable", player)
            if (mod != "unchanged") {
              return mod
            }
            return true
          },
        )
        .set("ai", (card) => {
          const trigger = get.event().getTrigger()
          const { player, judging } = get.event()
          const result = trigger.judge(card) - trigger.judge(judging)
          const attitude = get.attitude(player, trigger.player)
          if (attitude == 0 || result == 0) {
            if (trigger.player != player) {
              return 0
            }
            if (
              game.hasPlayer(function (current) {
                return get.attitude(player, current) < 0
              })
            ) {
              var checkx =
                lib.skill.olleiji.judgeCheck(card, true) - lib.skill.olleiji.judgeCheck(judging)
              if (checkx > 0) {
                return checkx
              }
            }
            return 0
          }
          let val = get.value(card)
          if (get.subtype(card) == "equip2") {
            val /= 2
          } else {
            val /= 7
          }
          if (attitude == 0 || result == 0) {
            return 0
          }
          if (attitude > 0) {
            return result - val
          }
          return -result - val
        })
        .set("judging", trigger.player.judging[0])
        .forResult()
    },
    popup: false,
    async content(event, trigger, player) {
      const next = player.respond(event.cards, event.name, "highlight", "noOrdering")
      await next
      const { cards } = next
      if (cards?.length) {
        player.$gain2(trigger.player.judging[0])
        await player.gain(trigger.player.judging[0])
        const card = cards[0]
        if (get.suit(card) == "spade" && get.number(card) > 1 && get.number(card) < 10) {
          await player.draw("nodelay")
        }
        trigger.player.judging[0] = card
        trigger.orderingCards.addArray(cards)
        game.log(trigger.player, "的判定牌改为", cards)
        await game.delay(2)
      }
    },
    ai: {
      rejudge: true,
      tag: { rejudge: 1 },
    },
  },
  // 黄天
  rehuangtian: {
    audio: 2,
    audioname: ["zhangjiao", "re_zhangjiao"],
    global: "rehuangtian2",
    zhuSkill: true,
  },
  rehuangtian2: {
    audio: "rehuangtian",
    enable: "phaseUse",
    discard: false,
    lose: false,
    delay: false,
    line: true,
    prepare(cards, player, targets) {
      targets[0].logSkill("rehuangtian")
    },
    prompt() {
      var player = _status.event.player
      var list = game.filterPlayer(function (target) {
        return target != player && target.hasZhuSkill("rehuangtian", player)
      })
      var str = "将一张【闪】或黑桃手牌交给" + get.translation(list)
      if (list.length > 1) {
        str += "中的一人"
      }
      return str
    },
    filter(event, player) {
      if (player.group != "qun") {
        return false
      }
      if (
        !game.hasPlayer(function (target) {
          return (
            target != player &&
            target.hasZhuSkill("rehuangtian", player) &&
            !target.hasSkill("rehuangtian3")
          )
        })
      ) {
        return false
      }
      return player.hasCard(function (card) {
        return lib.skill.rehuangtian2.filterCard(card, player)
      }, "h")
    },
    filterCard(card, player) {
      return get.name(card, player) == "shan" || get.suit(card, player) == "spade"
    },
    log: false,
    visible: true,
    filterTarget(card, player, target) {
      return (
        target != player &&
        target.hasZhuSkill("rehuangtian", player) &&
        !target.hasSkill("rehuangtian3")
      )
    },
    //usable:1,
    //forceaudio:true,
    async content(event, trigger, player) {
      const { cards, target } = event
      await player.give(cards, target)
      target.addTempSkill("rehuangtian3", "phaseUseEnd")
    },
    ai: {
      expose: 0.3,
      order: 10,
      result: {
        target: 5,
      },
    },
  },
  rehuangtian3: {},
}

export default skills
