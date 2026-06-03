import { lib, game, ui, get, ai, _status } from "wtk"
import { type } from "../../mode/boss"

/** @type { importCharacterConfig['skill'] } */
const skills = {
  // 界曹操
  // 护驾
  rehujia: {
    audio: 2,
    audioname2: {},
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
  // 界夏侯惇
  // 刚烈
  olganglie: {
    audio: "reganglie",
    inherit: "reganglie",
    filter(event, player) {
      return event.num > 0 && event.source && event.source != player
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
    audio: 2,
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
        charlotte: true,
        onremove: true,
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
  // 界于吉
  // 蛊惑
  olguhuo: {
    audio: 2,
    derivation: "rechanyuan",
    enable: ["chooseToUse", "chooseToRespond"],
    hiddenCard(player, name) {
      return (
        lib.inpile.includes(name) && player.countCards("h") > 0 && !player.hasSkill("olguhuo_used")
      )
    },
    filter(event, player) {
      if (!player.countCards("hs") || player.hasSkill("olguhuo_used")) {
        return false
      }
      for (var i of lib.inpile) {
        var type = get.type(i)
        if (
          (type == "basic" || type == "trick") &&
          event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)
        ) {
          return true
        }
        if (i == "sha") {
          for (var j of lib.inpile_nature) {
            if (event.filterCard(get.autoViewAs({ name: i, nature: j }, "unsure"), player, event)) {
              return true
            }
          }
        }
      }
      return false
    },
    chooseButton: {
      dialog() {
        var list = []
        for (var i of lib.inpile) {
          var type = get.type(i)
          if (type == "basic" || type == "trick") {
            list.push([type, "", i])
          }
          if (i == "sha") {
            for (var j of lib.inpile_nature) {
              list.push(["基本", "", "sha", j])
            }
          }
        }
        return ui.create.dialog("蛊惑", [list, "vcard"])
      },
      filter(button, player) {
        var evt = _status.event.getParent()
        return evt.filterCard(
          get.autoViewAs({ name: button.link[2], nature: button.link[3] }, "unsure"),
          player,
          evt,
        )
      },
      check(button) {
        var player = _status.event.player
        var rand = _status.event.getParent().getRand("olguhuo")
        var hasEnemy = game.hasPlayer(function (current) {
          return (
            current != player &&
            !current.hasSkill("rechanyuan") &&
            (get.realAttitude || get.attitude)(current, player) < 0
          )
        })
        var card = { name: button.link[2], nature: button.link[3] }
        var val = _status.event.getParent().type == "phase" ? player.getUseValue(card) : 1
        if (val <= 0) {
          return 0
        }
        if (hasEnemy && rand > 0.3) {
          if (
            !player.countCards("h", function (cardx) {
              if (card.name == cardx.name) {
                if (card.name != "sha") {
                  return true
                }
                return get.is.sameNature(card, cardx)
              }
              return false
            })
          ) {
            return 0
          }
          return 3 * val
        }
        return val
      },
      backup(links, player) {
        return {
          viewAs: {
            name: links[0][2],
            nature: links[0][3],
            suit: "none",
            number: null,
          },
          filterCard(card, player, target) {
            var result = true
            var suit = card.suit,
              number = card.number
            card.suit = "none"
            card.number = null
            var mod = game.checkMod(card, player, "unchanged", "cardEnabled2", player)
            if (mod != "unchanged") {
              result = mod
            }
            card.suit = suit
            card.number = number
            return result
          },
          position: "hs",
          ignoreMod: true,
          ai1(card) {
            var player = _status.event.player
            var hasEnemy = game.hasPlayer(function (current) {
              return (
                current != player &&
                !current.hasSkill("rechanyuan") &&
                (get.realAttitude || get.attitude)(current, player) < 0
              )
            })
            var rand = _status.event.getRand("olguhuo")
            var cardx = lib.skill.olguhuo_backup.viewAs
            if (hasEnemy && rand > 0.3) {
              if (
                card.name == cardx.name &&
                (card.name != "sha" || get.is.sameNature(card, cardx))
              ) {
                return 10
              }
              return 0
            }
            return 6 - get.value(card)
          },
          async precontent(event, trigger, player) {
            const { result } = event
            player.logSkill("olguhuo")
            player.addTempSkill("olguhuo_guess")
            const card = result.cards[0]
            result.card.suit = get.suit(card)
            result.card.number = get.number(card)
          },
        }
      },
      prompt(links) {
        return (
          "将一张手牌当做" +
          (get.translation(links[0][3]) || "") +
          get.translation(links[0][2]) +
          "使用"
        )
      },
    },
    ai: {
      fireAttack: true,
      respondShan: true,
      respondSha: true,
      skillTagFilter(player) {
        if (!player.countCards("hs") || player.hasSkill("olguhuo_used")) {
          return false
        }
      },
      order: 10,
      result: {
        player: 1,
      },
      threaten: 1.3,
    },
    subSkill: {
      backup: {},
      used: { charlotte: true },
      guess: {
        trigger: {
          player: ["useCardBefore", "respondBefore"],
        },
        forced: true,
        silent: true,
        popup: false,
        charlotte: true,
        firstDo: true,
        sourceSkill: "olguhuo",
        filter(event, player) {
          return event.skill && event.skill.indexOf("olguhuo_") == 0
        },
        async content(event, trigger, player) {
          // step 0
          player.addTempSkill("olguhuo_used")
          event.fake = false
          const card = trigger.cards[0]
          if (
            card.name != trigger.card.name ||
            (card.name == "sha" && !get.is.sameNature(trigger.card, card))
          ) {
            event.fake = true
          }
          player.line(trigger.targets, get.nature(trigger.card))
          event.cardTranslate = get.translation(trigger.card.name)
          trigger.card.number = get.number(card)
          trigger.card.suit = get.suit(card)
          trigger.skill = "olguhuo_backup"
          if (trigger.card.name == "sha" && get.natureList(trigger.card).length) {
            event.cardTranslate = get.translation(trigger.card.nature) + event.cardTranslate
          }
          player.popup(event.cardTranslate, trigger.name == "useCard" ? "metal" : "wood")
          event.prompt =
            "是否质疑" + get.translation(player) + "声明的" + event.cardTranslate + "？"
          game.log(player, "声明了", "#y" + event.cardTranslate)
          event.targets = game
            .filterPlayer(function (current) {
              return current != player && !current.hasSkill("rechanyuan")
            })
            .sortBySeat()
          event.targets2 = event.targets.slice(0)
          player.lose(card, ui.ordering).relatedEvent = trigger
          if (!event.targets.length) {
            event.betrays = []
            // Skip to step 3
            for (const i of event.targets2) {
              i.popup("不质疑", "wood")
              game.log(i, "#g不质疑")
            }
            game.delay()
            player.showCards(trigger.cards)
            return
          }
          event.betrays = []

          // step 1
          let list = event.targets.map(function (target) {
            return [target, [event.prompt, [["guhuo_ally", "guhuo_betray"], "vcard"]], true]
          })
          const result = await player
            .chooseButtonOL(list)
            .set("switchToAuto", function () {
              _status.event.result = "ai"
            })
            .set("processAI", function () {
              let choice = Math.random() > 0.5 ? "guhuo_ally" : "guhuo_betray"
              const playerx = _status.event.player
              const evt = _status.event.getParent("olguhuo_guess")
              if (
                playerx.hp <= 1 ||
                (evt && (get.realAttitude || get.attitude)(playerx, evt.player) >= 0)
              ) {
                choice = "guhuo_ally"
              }
              return {
                bool: true,
                links: [["", "", choice]],
              }
            })
            .forResult()

          // step 2
          for (const i in result) {
            if (result[i].links[0][2] == "guhuo_betray") {
              const current = (_status.connectMode ? lib.playerOL : game.playerMap)[i]
              event.betrays.push(current)
              current.addExpose(0.2)
            }
          }

          // step 3
          for (const i of event.targets2) {
            const b = event.betrays.includes(i)
            i.popup(b ? "质疑" : "不质疑", b ? "fire" : "wood")
            game.log(i, b ? "#y质疑" : "#g不质疑")
          }
          game.delay()

          // step 4
          player.showCards(trigger.cards)
          if (event.betrays.length) {
            event.betrays.sortBySeat()
            if (event.fake) {
              game.asyncDraw(event.betrays)
              trigger.cancel()
              trigger.getParent().goto(0)
              game.log(player, "声明的", "#y" + event.cardTranslate, "作废了")
            } else {
              const next = game.createEvent("olguhuo_final", false)
              event.next.remove(next)
              trigger.after.push(next)
              next.targets = event.betrays
              next.setContent(lib.skill.olguhuo_guess.contentx)
            }
          }

          // step 5
          game.delayx()
        },
        async contentx(event, trigger, player) {
          // process a copy of targets to mimic original step-goto loop
          const targets = (event.targets || []).slice(0)
          let result
          while (targets.length) {
            const target = targets.shift()
            event.target = target

            // step 0 -> await the choice
            result = await target
              .chooseToDiscard("弃置一张牌或失去1点体力")
              .set("ai", (card) => 9 - get.value(card))
              .forResult()

            // step 1
            if (!result.bool) {
              await target.loseHp()
            }

            // step 2
            await target.addSkills("rechanyuan")
          }
        },
      },
    },
  },
  // 缠怨
  rechanyuan: {
    init(player, skill) {
      if (player.hp <= 1) {
        player.logSkill(skill)
      }
      player.addSkillBlocker(skill)
    },
    onremove(player, skill) {
      player.removeSkillBlocker(skill)
    },
    skillBlocker(skill, player) {
      return (
        skill != "chanyuan" &&
        skill != "rechanyuan" &&
        !lib.skill[skill].charlotte &&
        !lib.skill[skill].persevereSkill &&
        player.hp <= 1
      )
    },
    mark: true,
    intro: {
      content(storage, player, skill) {
        var str = "<li>锁定技，你不能质疑〖蛊惑〗；若你的体力值小于等于1，你的其他技能失效。"
        var list = player.getSkills(null, false, false).filter(function (i) {
          return lib.skill.rechanyuan.skillBlocker(i, player)
        })
        if (list.length) {
          str += "<br><li>失效技能：" + get.translation(list)
        }
        return str
      },
    },
    audio: 2,
    trigger: { player: "changeHp" },
    filter(event, player) {
      if (event.changedHp == 0) {
        return false
      }
      return get.sgn(player.hp - 1.5) != get.sgn(player.hp - 1.5 - event.changedHp)
    },
    forced: true,
    async content(event, trigger, player) {},
  },
  // 界典韦
  // 强袭
  olqiangxi: {
    audio: 2,
    audioname: ["boss_lvbu3"],
    enable: "phaseUse",
    usable: 2,
    filter(event, player) {
      if (player.hp < 1 && !player.hasCard((card) => lib.skill.olqiangxi.filterCard(card), "he")) {
        return false
      }
      return game.hasPlayer((current) => lib.skill.olqiangxi.filterTarget(null, player, current))
    },
    filterCard(card) {
      return get.subtype(card) == "equip1"
    },
    position: "he",
    filterTarget(card, player, target) {
      if (target == player) {
        return false
      }
      var stat = player.getStat()._olqiangxi
      return !stat || !stat.includes(target)
    },
    selectCard() {
      if (_status.event.player.hp < 1) {
        return 1
      }
      return [0, 1]
    },
    async content(event, trigger, player) {
      const { cards, target } = event

      var stat = player.getStat()
      if (!stat._olqiangxi) {
        stat._olqiangxi = []
      }
      stat._olqiangxi.push(target)
      if (!cards.length) {
        await player.damage("nosource", "nocard")
      }
      await target.damage("nocard")
    },
    ai: {
      damage: true,
      order: 8,
      result: {
        player(player, target) {
          if (ui.selected.cards.length) {
            return 0
          }
          if (player.hp >= target.hp) {
            return -0.9
          }
          if (player.hp <= 2) {
            return -10
          }
          return get.damageEffect(player, player, player)
        },
        target(player, target) {
          if (!ui.selected.cards.length) {
            if (player.hp < 2) {
              return 0
            }
            if (player.hp == 2 && target.hp >= 2) {
              return 0
            }
            if (target.hp > player.hp) {
              return 0
            }
          }
          return get.damageEffect(target, player, target)
        },
      },
      threaten: 1.5,
    },
  },
  // 狞恶
  ninge: {
    audio: 2,
    trigger: { global: "damageEnd" },
    filter(event, player) {
      if (player != event.player && player != event.source) {
        return false
      }
      return event.player.getHistory("damage").indexOf(event) == 1
    },
    logTarget: "player",
    forced: true,
    async content(event, trigger, player) {
      await player.draw()
      await player.discardPlayerCard(trigger.player, true, "ej")
    },
  },
  // 界荀彧
  // 节命
  oljieming: {
    audio: 2,
    audioname2: { sxrm_caocao: "oljieming_sxrm_caocao" },
    trigger: { player: ["damageEnd", "die"] },
    forceDie: true,
    filter(event, player) {
      if (event.name == "die") {
        return true
      }
      return player.isIn() && event.num > 0
    },
    getIndex(event) {
      return event.num || 1
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(get.prompt2(event.skill), (card, player, target) => {
          return target.maxHp > 0
        })
        .set("ai", (target) => {
          const player = get.player()
          let att = get.attitude(player, target)
          let draw = Math.min(5, target.maxHp) - target.countCards("h")
          if (draw >= 0) {
            if (target.hasSkillTag("nogain")) {
              att /= 6
            }
            if (att > 2) {
              return Math.sqrt(draw + 1) * att
            }
            return att / 3
          }
          if (draw < -1) {
            if (target.hasSkillTag("nogain")) {
              att *= 6
            }
            if (att < -2) {
              return -Math.sqrt(1 - draw) * att
            }
          }
          return 0
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      await target.draw(Math.min(5, target.maxHp))
      let num = target.countCards("h") - Math.min(5, target.maxHp)
      if (num > 0) {
        await target.chooseToDiscard("h", true, num, "allowChooseAll")
      }
    },
    ai: {
      expose: 0.2,
      maixie: true,
      maixie_hp: true,
      effect: {
        target(card, player, target, current) {
          if (get.tag(card, "damage") && target.hp > 1) {
            if (player.hasSkillTag("jueqing", false, target)) {
              return [1, -2]
            }
            var max = 0
            var players = game.filterPlayer()
            for (var i = 0; i < players.length; i++) {
              if (get.attitude(target, players[i]) > 0) {
                max = Math.max(Math.min(5, players[i].hp) - players[i].countCards("h"), max)
              }
            }
            switch (max) {
              case 0:
                return 2
              case 1:
                return 1.5
              case 2:
                return [1, 2]
              default:
                return [0, max]
            }
          }
          if (
            (card.name == "tao" || card.name == "caoyao") &&
            target.hp > 1 &&
            target.countCards("h") <= target.hp
          ) {
            return [0, 0]
          }
        },
      },
    },
  },
  // 界卧龙诸葛
  // 火计
  olhuoji: {
    audio: 2,
    audioname: ["ol_pangtong"],
    trigger: { player: "huogongBegin" },
    forced: true,
    locked: false,
    popup: false,
    group: "olhuoji_viewAs",
    async content(event, trigger, player) {
      trigger.set("chooseToShow", async (event, player, target) => {
        const { showPosition = "h" } = event
        const cards = (await player.choosePlayerCard(target, showPosition, true).forResult()).cards
        return { bool: true, cards: cards }
      })
      trigger.set("filterDiscard", (card) => {
        const { cards2 } = get.event().getParent("huogong", true)
        return get.color(card) == get.color(cards2[0])
      })
    },
    async huogongContent(event, trigger, player) {
      const { target } = event
      if (target.countCards("h") == 0) {
        return
      }
      const cards = (await player.choosePlayerCard(target, "h", true).forResult()).cards,
        card = cards[0]
      await target.showCards(cards).setContent(function () {})
      event.dialog = ui.create.dialog(get.translation(target) + "展示的手牌", cards)
      event.videoId = lib.status.videoId++

      game.broadcast("createDialog", event.videoId, get.translation(target) + "展示的手牌", cards)
      game.addVideo("cardDialog", null, [
        get.translation(target) + "展示的手牌",
        get.cardsInfo(cards),
        event.videoId,
      ])
      game.log(target, "展示了", card)
      const result = await player
        .chooseToDiscard({ color: get.color(card) }, "h", function (card) {
          var evt = _status.event.getParent()
          if (get.damageEffect(evt.target, evt.player, evt.player, "fire") > 0) {
            return 7 - get.value(card, evt.player)
          }
          return -1
        })
        .set("prompt", false)
        .forResult()
      //game.delay(2);
      if (result?.bool) {
        await target.damage("fire")
      } else {
        target.addTempSkill("huogong2")
      }
      event.dialog.close()
      game.addVideo("cardDialog", null, event.videoId)
      game.broadcast("closeDialog", event.videoId)
    },
    subSkill: { viewAs: { inherit: "rehuoji", audio: "olhuoji" } },
  },
  // 看破
  olkanpo: {
    audio: 2,
    audioname: ["ol_pangtong"],
    trigger: { player: "useCard" },
    forced: true,
    locked: false,
    popup: false,
    group: "olkanpo_viewAs",
    filter(event, player) {
      return event.card.name == "wuxie"
    },
    async content(event, trigger, player) {
      trigger.directHit.addArray(game.players)
    },
    subSkill: { viewAs: { inherit: "rekanpo", audio: "olkanpo" } },
  },
  // 藏拙
  cangzhuo: {
    trigger: { player: "phaseDiscardBegin" },
    frequent: true,
    audio: 2,
    filter(event, player) {
      return (
        player.getHistory("useCard", function (card) {
          return get.type(card.card, "trick") == "trick"
        }).length == 0
      )
    },
    async content(event, trigger, player) {
      const result = await player
        .chooseCard(
          "h",
          [1, Infinity],
          "展示任意张锦囊牌，令这些牌此阶段不计入手牌上限",
          (card) => get.type(card, "trick") == "trick",
          "allowChooseAll",
        )
        .set(
          "tricks",
          player
            .getCards("h", (card) => get.type(card, "trick") == "trick")
            .sort((a, b) => get.value(a, player) - get.value(b, player))
            .slice(0, Math.max(0, player.countCards("h") - player.getHandcardLimit())),
        )
        .set("ai", (card) => {
          const { player, tricks } = get.event()
          return tricks.includes(card) ? 10 - get.value(card, player) : 0
        })
        .forResult()
      if (result.bool) {
        player.addGaintag(result.cards, "cangzhuo")
        player.addTempSkill("cangzhuo2")
        player.showCards(result.cards, "藏拙")
      }
    },
  },
  cangzhuo2: {
    onremove(player) {
      player.removeGaintag("cangzhuo")
    },
    mod: {
      ignoredHandcard(card, player) {
        if (card.hasGaintag("cangzhuo")) {
          return true
        }
      },
      cardDiscardable(card, player, name) {
        if (name == "phaseDiscard" && card.hasGaintag("cangzhuo")) {
          return false
        }
      },
    },
  },
  // 界庞统
  // 连环
  ollianhuan: {
    audio: 2,
    hiddenCard: (player, name) => {
      return name == "tiesuo" && player.hasCard((card) => get.suit(card) == "club", "she")
    },
    filter(event, player) {
      if (!player.hasCard((card) => get.suit(card) == "club", "she")) {
        return false
      }
      return event.type == "phase" || event.filterCard({ name: "tiesuo" }, player, event)
    },
    position: "hes",
    inherit: "relianhuan",
    group: "ollianhuan_add",
    subSkill: {
      add: {
        audio: "ollianhuan",
        trigger: { player: "useCard2" },
        filter(event, player) {
          if (event.card.name != "tiesuo") {
            return false
          }
          var info = get.info(event.card)
          if (info.allowMultiple == false) {
            return false
          }
          if (event.targets && !info.multitarget) {
            if (
              game.hasPlayer((current) => {
                return (
                  !event.targets.includes(current) &&
                  lib.filter.targetEnabled2(event.card, player, current)
                )
              })
            ) {
              return true
            }
          }
          return false
        },
        charlotte: true,
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          const result = await player
            .chooseTarget({
              prompt: get.prompt("ollianhuan"),
              filterTarget(card, player, target) {
                const event = get.event()
                return (
                  !event.sourcex.includes(target) &&
                  lib.filter.targetEnabled2(event.card, player, target)
                )
              },
            })
            .set("prompt2", `为${get.translation(trigger.card)}额外指定一个目标`)
            .set("sourcex", trigger.targets)
            .set("ai", function (target) {
              var player = _status.event.player
              return get.effect(target, _status.event.card, player, player)
            })
            .set("card", trigger.card)
            .forResult()
          if (result?.bool && result.targets) {
            if (!event.isMine() && !event.isOnline()) {
              await game.delayex()
            }
            const targets = result.targets
            player.logSkill("ollianhuan_add", targets)
            trigger.targets.addArray(targets)
            game.log(targets, "也成为了", trigger.card, "的目标")
          }
        },
      },
    },
  },
  // 涅槃
  olniepan: {
    audio: 2,
    enable: "chooseToUse",
    skillAnimation: true,
    limited: true,
    animationColor: "orange",
    filter(event, player) {
      if (event.type == "dying") {
        if (player != event.dying) {
          return false
        }
        return true
      }
      return false
    },
    async content(event, trigger, player) {
      // step 0
      player.awakenSkill(event.name)
      player.storage.olniepan = true
      await player.discard(player.getCards("hej"))
      // step 1
      await player.link(false)
      // step 2
      await player.turnOver(false)
      // step 3
      await player.draw(3)
      // step 4
      if (player.hp < 3) {
        await player.recover(3 - player.hp)
      }
      // step 5
      const result = await player
        .chooseControl("bazhen", "olhuoji", "olkanpo")
        .set("prompt", "选择获得一个技能")
        .set("ai", () => {
          let player = get.event().player,
            threaten = get.threaten(player)
          if (!player.hasEmptySlot(2)) {
            return "olhuoji"
          }
          if (threaten < 0.8) {
            return "olkanpo"
          }
          if (threaten < 1.6) {
            return "bazhen"
          }
          return ["olhuoji", "bazhen"].randomGet()
        })
        .forResult()
      // step 6
      player.addSkills(result.control)
    },
    derivation: ["bazhen", "olhuoji", "olkanpo"],
    ai: {
      order: 1,
      skillTagFilter(player, tag, target) {
        if (player != target || player.storage.olniepan) {
          return false
        }
      },
      save: true,
      result: {
        player(player) {
          if (player.hp <= 0) {
            return 10
          }
          if (player.hp <= 2 && player.countCards("he") <= 1) {
            return 10
          }
          return 0
        },
      },
      threaten(player, target) {
        if (!target.storage.olniepan) {
          return 0.6
        }
      },
    },
  },
  // 界太史慈
  // 酣战
  hanzhan: {
    audio: 2,
    trigger: {
      global: "chooseToCompareBegin",
    },
    filter(event, player) {
      if (player == event.player) {
        return true
      }
      if (event.targets) {
        return event.targets.includes(player)
      }
      return player == event.target
    },
    logTarget(event, player) {
      if (player != event.player) {
        return event.player
      }
      return event.targets || event.target
    },
    prompt2(event, player) {
      return "选择其一张手牌，其用此牌与你拼点"
    },
    check(trigger, player) {
      var num = 0
      var targets =
        player == trigger.player
          ? trigger.targets
            ? trigger.targets.slice(0)
            : [trigger.target]
          : [trigger.player]
      while (targets.length) {
        var target = targets.shift()
        if (target.getCards("h").length > 1) {
          num -= get.attitude(player, target)
        }
      }
      return num > 0
    },
    async content(event, trigger, player) {
      const targets =
        player == trigger.player
          ? trigger.targets
            ? trigger.targets.slice(0)
            : [trigger.target]
          : [trigger.player]
      if (!trigger.fixedResult) {
        trigger.fixedResult = {}
      }
      for (const target of targets) {
        const hs = target.getCards("h")
        if (hs.length) {
          const result = await player.choosePlayerCard(target, "h", true).forResult()
          if (result.bool) {
            trigger.fixedResult[target.playerid] = result.cards[0]
          }
        }
      }
    },
    group: "hanzhan_gain",
    subfrequent: ["gain"],
  },
  hanzhan_gain: {
    trigger: {
      global: "chooseToCompareAfter",
    },
    audio: "hanzhan",
    sourceSkill: "hanzhan",
    filter(event, player) {
      if (event.preserve) {
        return false
      }
      if (
        player != event.player &&
        player != event.target &&
        (!event.targets || !event.targets.includes(player))
      ) {
        return false
      }
      for (var i of event.lose_list) {
        if (Array.isArray(i[1])) {
          for (var j of i[1]) {
            if (get.name(j, i[0]) == "sha" && get.position(j, true) == "o") {
              return true
            }
          }
        } else {
          var j = i[1]
          if (get.name(j, i[0]) == "sha" && get.position(j, true) == "o") {
            return true
          }
        }
      }
      return false
    },
    frequent: true,
    prompt2(event, player) {
      var cards = [],
        max = 0
      for (var i of event.lose_list) {
        if (Array.isArray(i[1])) {
          for (var j of i[1]) {
            if (get.name(j, i[0]) == "sha" && get.position(j, true) == "o") {
              var num = get.number(j, i[0])
              if (num > max) {
                cards = []
                max = num
              }
              if (num == max) {
                cards.push(j)
              }
            }
          }
        } else {
          var j = i[1]
          if (get.name(j, i[0]) == "sha" && get.position(j, true) == "o") {
            var num = get.number(j, i[0])
            if (num > max) {
              cards = []
              max = num
            }
            if (num == max) {
              cards.push(j)
            }
          }
        }
      }
      return "获得" + get.translation(cards)
    },
    async content(event, trigger, player) {
      const cards = []
      let max = 0
      for (const entry of trigger.lose_list) {
        const owner = entry[0]
        const item = entry[1]
        if (Array.isArray(item)) {
          for (const j of item) {
            if (get.name(j, owner) === "sha" && get.position(j, true) === "o") {
              const num = get.number(j, owner)
              if (num > max) {
                cards.length = 0
                max = num
              }
              if (num === max) {
                cards.push(j)
              }
            }
          }
        } else {
          const j = item
          if (get.name(j, owner) === "sha" && get.position(j, true) === "o") {
            const num = get.number(j, owner)
            if (num > max) {
              cards.length = 0
              max = num
            }
            if (num === max) {
              cards.push(j)
            }
          }
        }
      }
      if (cards.length) {
        await player.gain(cards, "gain2")
      }
    },
  },
  // 界庞德
  // 鞬出
  rejianchu: {
    audio: 2,
    trigger: { player: "useCardToPlayered" },
    filter(event, player) {
      return event.card.name == "sha" && event.target.countDiscardableCards(player, "he") > 0
    },
    direct: true,
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .discardPlayerCard(trigger.target, get.prompt("rejianchu", trigger.target))
        .set("ai", function (button) {
          if (!_status.event.att) {
            return 0
          }
          if (get.position(button.link) == "e") {
            if (get.subtype(button.link) == "equip2") {
              return 5 * get.value(button.link)
            }
            return get.value(button.link)
          }
          return 1
        })
        .set("logSkill", ["rejianchu", trigger.target])
        .set("att", get.attitude(player, trigger.target) <= 0)
        .forResult()
      // step 1
      if (result.bool && result.links && result.links.length) {
        if (
          get.type(result.links[0], null, result.links[0].original == "h" ? player : false) !=
          "basic"
        ) {
          trigger.getParent().directHit.add(trigger.target)
          player.addTempSkill("rejianchu2")
          player.addMark("rejianchu2", 1, false)
        } else if (trigger.cards) {
          var list = []
          for (var i = 0; i < trigger.cards.length; i++) {
            if (get.position(trigger.cards[i], true) == "o") {
              list.push(trigger.cards[i])
            }
          }
          if (list.length) {
            await trigger.target.gain(list, "gain2", "log")
          }
        }
      }
    },
    ai: {
      unequip_ai: true,
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (tag == "directHit_ai") {
          return (
            arg.card.name == "sha" &&
            arg.target.countCards("e", function (card) {
              return get.value(card) > 1
            }) > 0
          )
        }
        if (arg && arg.name == "sha" && arg.target.getEquip(2)) {
          return true
        }
        return false
      },
    },
  },
  rejianchu2: {
    mod: {
      cardUsable(card, player, num) {
        if (card.name == "sha") {
          return num + player.countMark("rejianchu2")
        }
      },
    },
    onremove: true,
  },
  // 界袁绍
  // 乱击
  olluanji: {
    inherit: "luanji",
    audioname2: { shen_caopi: "olluanji_shen_caopi" },
    audio: 2,
    line: false,
    group: "olluanji_remove",
    check(card) {
      return 7 - get.value(card)
    },
  },
  olluanji_remove: {
    trigger: { player: "useCard2" },
    direct: true,
    sourceSkill: "olluanji",
    filter(event, player) {
      return event.card.name == "wanjian" && event.targets.length > 0
    },
    line: false,
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .chooseTarget(
          get.prompt("olluanji"),
          "为" + get.translation(trigger.card) + "减少一个目标",
          function (card, player, target) {
            return _status.event.targets.includes(target)
          },
        )
        .set("targets", trigger.targets)
        .set("ai", function (target) {
          var player = _status.event.player
          return -get.effect(target, _status.event.getTrigger().card, player, player)
        })
        .forResult()
      // step 1
      if (result.bool) {
        player.logSkill("olluanji", result.targets)
        trigger.targets.remove(result.targets[0])
      }
    },
  },
  // 血裔
  olxueyi: {
    audio: 2,
    trigger: { global: "phaseBefore", player: "enterGame" },
    forced: true,
    zhuSkill: true,
    filter(event, player) {
      return (event.name != "phase" || game.phaseNumber == 0) && player.hasZhuSkill("olxueyi")
    },
    async content(event, trigger, player) {
      const num = game.countPlayer((current) => current.group == "qun")
      if (num) {
        player.addMark("olxueyi", num * 2)
      }
    },
    marktext: "裔",
    intro: {
      name2: "裔",
      content: "mark",
    },
    mod: {
      maxHandcard(player, num) {
        if (player.hasZhuSkill("olxueyi")) {
          return num + player.countMark("olxueyi")
        }
      },
    },
    group: "olxueyi_draw",
    subSkill: {
      draw: {
        audio: "olxueyi",
        trigger: { player: "phaseUseBegin" },
        prompt2: "弃置一枚「裔」标记，然后摸一张牌",
        check(event, player) {
          return player.getUseValue("wanjian") > 0 || !player.needsToDiscard()
        },
        filter(event, player) {
          return player.hasZhuSkill("olxueyi") && player.hasMark("olxueyi")
        },
        async content(event, trigger, player) {
          player.removeMark("olxueyi", 1)
          await player.draw()
        },
      },
    },
  },
  // 界颜良文丑
  // 双雄
  olshuangxiong: {
    audio: 2,
    trigger: { player: "phaseDrawEnd" },
    filter: (event, player) => player.countCards("he") > 0,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseToDiscard(
          "he",
          get.prompt("olshuangxiong"),
          "弃置一张牌，然后你本回合内可以将一张与此牌颜色不同的牌当做【决斗】使用",
          "chooseonly",
        )
        .set("ai", function (card) {
          let player = _status.event.player
          if (!_status.event.goon || player.skipList.includes("phaseUse")) {
            return -get.value(card)
          }
          let color = get.color(card),
            effect = 0,
            cards = player.getCards("hes"),
            sha = false
          for (const cardx of cards) {
            if (cardx == card || get.color(cardx) == color) {
              continue
            }
            const cardy = get.autoViewAs({ name: "juedou" }, [cardx]),
              eff1 = player.getUseValue(cardy)
            if (get.position(cardx) == "e") {
              let eff2 = get.value(cardx)
              if (eff1 > eff2) {
                effect += eff1 - eff2
              }
              continue
            } else if (get.name(cardx) == "sha") {
              if (sha) {
                effect += eff1
                continue
              } else {
                sha = true
              }
            }
            let eff2 = player.getUseValue(cardx, null, true)
            if (eff1 > eff2) {
              effect += eff1 - eff2
            }
          }
          return effect - get.value(card)
        })
        .set(
          "goon",
          player.hasValueTarget({ name: "juedou" }) && !player.hasSkill("olshuangxiong_effect"),
        )
        .forResult()
    },
    async content(event, trigger, player) {
      const { cards } = event,
        color = get.color(cards[0], player)
      await player.modedDiscard(cards)
      player.markAuto("olshuangxiong_effect", [color])
      player.addTempSkill("olshuangxiong_effect")
    },
    group: "olshuangxiong_jianxiong",
    subSkill: {
      effect: {
        audio: "olshuangxiong",
        enable: "chooseToUse",
        viewAs: { name: "juedou" },
        position: "hes",
        viewAsFilter(player) {
          return player.hasCard(
            (card) => lib.skill.olshuangxiong_effect.filterCard(card, player),
            "hes",
          )
        },
        filterCard(card, player) {
          const color = get.color(card),
            colors = player.getStorage("olshuangxiong_effect")
          for (const i of colors) {
            if (color != i) {
              return true
            }
          }
          return false
        },
        prompt() {
          const colors = _status.event.player.getStorage("olshuangxiong_effect")
          let str = "将一张颜色"
          for (let i = 0; i < colors.length; i++) {
            if (i > 0) {
              str += "或"
            }
            str += "不为"
            str += get.translation(colors[i])
          }
          str += "的牌当做【决斗】使用"
          return str
        },
        check(card) {
          const player = _status.event.player
          if (get.position(card) == "e") {
            const raw = get.value(card)
            const eff = player.getUseValue(get.autoViewAs({ name: "juedou" }, [card]))
            return eff - raw
          }
          const raw = player.getUseValue(card, null, true)
          const eff = player.getUseValue(get.autoViewAs({ name: "juedou" }, [card]))
          return eff - raw
        },
        onremove: true,
        charlotte: true,
        ai: { order: 7 },
      },
      jianxiong: {
        audio: "olshuangxiong",
        trigger: { player: "phaseJieshuBegin" },
        forced: true,
        locked: false,
        filter(event, player) {
          return player.hasHistory("damage", function (evt) {
            //Disable Umi Kato's chaofan
            return evt.card && evt.cards && evt.cards.some((card) => get.position(card, true))
          })
        },
        async content(event, trigger, player) {
          const cards = []
          player.getHistory("damage", function (evt) {
            if (evt.card && evt.cards) {
              cards.addArray(evt.cards.filterInD("d"))
            }
          })
          if (cards.length) {
            await player.gain(cards, "gain2")
          }
        },
      },
    },
  },
}

export default skills
