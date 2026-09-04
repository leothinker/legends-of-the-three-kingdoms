import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
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
      return game.hasPlayer(
        (current) => current !== player && current.group === "wei",
      )
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
        return game.hasPlayer(
          (current) => current !== player && current.group === "wei",
        )
      },
    },
    group: "rehujia_draw",
    subSkill: {
      draw: {
        trigger: { global: ["useCard", "respond"] },
        usable: 1,
        filter(event, player) {
          return (
            event.card.name === "shan" &&
            event.player !== player &&
            event.player.group === "wei" &&
            event.player.isIn() &&
            event.player !== _status.currentPhase &&
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
      return event.num > 0 && event.source?.isIn() && event.source !== player
    },
  },
  // 界许褚
  // 裸衣
  olluoyi: {
    audio: "reluoyi",
    trigger: {
      player: "phaseDrawBefore",
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
          type === "basic" ||
          c.name === "juedou" ||
          (type === "equip" && get.subtype(c) === "equip1")
        ) {
          cardsx.push(c)
        }
      }

      event.cards = cardsx
      const prompt = `是否跳过摸牌阶段${cardsx.length ? `并获得${get.translation(cardsx)}` : ""}？`
      const result = await player
        .chooseBool(prompt)
        .set("choice", cardsx.length >= trigger.num)
        .forResult()

      if (result.bool) {
        if (cardsx.length) {
          await player.gain(cardsx, "gain2")
        }
        player.addTempSkill("olluoyi_buff", { player: "phaseBeforeStart" })
        trigger.cancel()
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
            return get.color(card) === "black" ? 1.5 : -1.5
          })
          .set("judge2", (result) => result.bool)
          .set("callback", async (event, trigger, player) => {
            if (
              event.judgeResult.color === "black" &&
              get.position(event.card, true) === "o"
            ) {
              await player.gain(event.card, "gain2")
            }
            const bool =
              event.judgeResult.color === "black" &&
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
      const num = player.getHistory(
        "gain",
        (evt) => evt.getParent(event.name) === event,
      ).length
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
        !game.hasPlayer(
          (current) => current !== player && current.group === "shu",
        )
      ) {
        return false
      }
      return (
        !event.jijiang &&
        (event.type !== "phase" || !player.hasSkill("jijiang3"))
      )
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
          !game.hasPlayer(
            (current) => current !== player && current.group === "shu",
          )
        ) {
          return false
        }
      },
    },
  },
  rejijiang1: {
    audio: "rejijiang",
    trigger: { player: ["useCardBegin", "respondBegin"] },
    logTarget: "targets",
    sourceSkill: "rejijiang",
    filter(event, player) {
      return event.skill === "rejijiang"
    },
    forced: true,
    async content(event, trigger, player) {
      delete trigger.skill
      trigger.getParent().set("jijiang", true)

      var current = player.next

      while (current !== player) {
        if (current.group === "shu") {
          var next = current.chooseToRespond(
            `是否替${get.translation(player)}使用或打出【杀】？`,
          )
          next.set("filterCard", (card, player) => {
            if (get.name(card) !== "sha") {
              return false
            }
            return lib.filter.cardRespondable(card, player)
          })
          next.set("ai", () => {
            var event = _status.event
            return get.attitude(event.player, event.source) - 2
          })
          next.set("source", player)
          next.set("jijiang", true)
          next.set("skillwarn", `替${get.translation(player)}使用或打出【杀】`)
          next.noOrdering = true
          next.autochoose = lib.filter.autoRespondSha

          var result = await next.forResult()

          if (result.bool) {
            trigger.card = result.card
            trigger.cards = result.cards
            trigger.throw = false
            if (
              typeof current.ai.shown === "number" &&
              current.ai.shown < 0.95
            ) {
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
        event.card.name === "sha" &&
        event.player !== player &&
        event.player.group === "shu" &&
        event.player.isIn() &&
        event.player !== _status.currentPhase &&
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
    trigger: { player: "shaMiss" },
    forced: true,
    async content(event, trigger, player) {
      player.addTempSkill("olpaoxiao2")
      player.addMark("olpaoxiao2", 1, false)
    },
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") {
          return Infinity
        }
      },
    },
  },
  olpaoxiao2: {
    trigger: { source: "damageBegin1" },
    forced: true,
    audio: "repaoxiao",
    sourceSkill: "olpaoxiao",
    filter(event, player) {
      return (
        event.card &&
        event.card.name === "sha" &&
        player.countMark("olpaoxiao2") > 0
      )
    },
    onremove: true,
    async content(event, trigger, player) {
      trigger.num += player.countMark("olpaoxiao2")
      player.removeSkill("olpaoxiao2")
    },
    intro: { content: "本回合下一次造成【杀】的伤害时，此伤害+#" },
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
        if (card.name !== "sha" && card.name !== "shan") {
          return
        }
        var geti = () => {
          var cards = player.getCards(
            "hs",
            (card) => card.name === "sha" || card.name === "shan",
          )
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
    hiddenCard(player, name) {
      if (name === "tao") {
        return player.countCards("hs", "jiu") > 0
      }
      if (name === "jiu") {
        return player.countCards("hs", "tao") > 0
      }
      return false
    },
    enable: ["chooseToUse", "chooseToRespond"],
    position: "hs",
    prompt:
      "将一张【闪】当【杀】、【杀】当【闪】、【酒】当【桃】、【桃】当【酒】使用或打出",
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
      if (_status.event.type === "phase") {
        var max = 0
        var name2
        var list = ["sha", "tao", "jiu"]
        var map = { sha: "shan", tao: "jiu", jiu: "tao" }
        for (var i = 0; i < list.length; i++) {
          var name = list[i]
          if (
            player.countCards("hs", map[name]) > (name === "jiu" ? 1 : 0) &&
            player.getUseValue({ name: name }) > 0
          ) {
            var temp = get.order({ name: name })
            if (temp > max) {
              max = temp
              name2 = map[name]
            }
          }
        }
        if (name2 === get.name(card, player)) {
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
      if (
        name === "sha" &&
        filter({ name: "shan", cards: [card] }, player, event)
      ) {
        return true
      }
      if (
        name === "shan" &&
        filter({ name: "sha", cards: [card] }, player, event)
      ) {
        return true
      }
      if (
        name === "tao" &&
        filter({ name: "jiu", cards: [card] }, player, event)
      ) {
        return true
      }
      if (
        name === "jiu" &&
        filter({ name: "tao", cards: [card] }, player, event)
      ) {
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
        if (player && _status.event.type === "phase") {
          var max = 0
          var list = ["sha", "tao", "jiu"]
          var map = { sha: "shan", tao: "jiu", jiu: "tao" }
          for (var i = 0; i < list.length; i++) {
            var name = list[i]
            if (
              player.countCards("hs", map[name]) > (name === "jiu" ? 1 : 0) &&
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
      if (player === _status.currentPhase) {
        return false
      }
      return (
        ["useCard", "respond"].includes(event.getParent().name) &&
        event.getl(player)?.hs?.length
      )
    },
    async content(event, trigger, player) {
      const cards = get.cards(1, true)
      await player
        .showCards(cards, `${get.translation(player)}发动了【涯角】`, true)
        .set("type", get.type2(trigger.getParent().card))
        .set("clearArena", false)
        .set("removeHighlight", false)
        .set("callback", async (event, trigger, player) => {
          const { cards } = event
          const [card] = cards
          const evt = event.getParent()
          const { type, videoId, highlightRemove } = evt
          if (get.type2(card) === type) {
            const result = await player
              .chooseTarget("涯角：将此牌交给一名角色")
              .set("ai", (target) => {
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
              .set("du", get.name(card) === "du")
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
                (card, player, target) =>
                  target.inRange(player) &&
                  target.countDiscardableCards(player, "hej") > 0,
              )
              .set("ai", (target) => {
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
  // 界黄月英
  // 集智
  oljizhi: {
    audio: "rejizhi",
    inherit: "rejizhi",
    filter(event) {
      return get.type(event.card, "trick") === "trick" && event.card.isCard
    },
    init(player) {
      player.storage.oljizhi = 0
    },
    async content(event, trigger, player) {
      await player.draw("nodelay")
      if (
        !player.hasCards("h", (card) => {
          return (
            get.type(card) === "basic" &&
            lib.filter.cardDiscardable(card, player)
          )
        })
      ) {
        return
      }

      const result = await player
        .chooseToDiscard({
          prompt: `是否弃置一张基本牌然后本回合你的手牌上限+1？`,
          filterCard(card, player) {
            return get.type(card) === "basic"
          },
          ai(card) {
            if (!_status.event.check) {
              return -1
            }
            return 6 - get.value(card, player)
          },
        })
        .set(
          "check",
          _status.currentPhase === player && player.needsToDiscard(-3),
        )
        .forResult()

      if (result.bool) {
        player.storage.oljizhi++
        if (_status.currentPhase === player) {
          player.markSkill("oljizhi")
        }
      }
    },
    mod: {
      maxHandcard(player, num) {
        return num + player.storage.oljizhi
      },
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
        player !== event.player &&
        event.player.group === "wu" &&
        player.hp <= event.player.hp &&
        event.getParent().name !== "oljiuyuan" &&
        player.hasZhuSkill("oljiuyuan", event.player) &&
        event.player === _status.currentPhase
      )
    },
    async content(event, trigger, player) {
      // step 0
      const result = await trigger.player
        .chooseBool(
          `是否对${get.translation(player)}发动【救援】？`,
          "改为令其回复1点体力，然后你摸一张牌",
        )
        .set("ai", () => {
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
    audio: "qinxue",
    inherit: "qinxue",
    trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
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
      game.getGlobalHistory("cardMove", (evt) => {
        if (suits.length >= 4) {
          return
        }
        if (evt.name === "lose") {
          if (evt.position === ui.discardPile) {
            for (var i of evt.cards) {
              suits.add(get.suit(i, false))
            }
          }
        } else {
          if (evt.name === "cardsDiscard") {
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
          if (event.name === "phase") {
            return true
          }
          if (player !== _status.currentPhase) {
            return false
          }
          if (event.name === "lose") {
            return event.position === ui.discardPile
          }
          return true
        },
        async content(event, trigger, player) {
          if (trigger.name === "phase") {
            player.unmarkSkill("botu_mark")
            return
          }
          const suits = []
          game.getGlobalHistory("cardMove", (evt) => {
            if (suits.length >= 4) {
              return false
            }
            if (evt.name === "lose") {
              if (evt.position === ui.discardPile) {
                for (const c of evt.cards) {
                  suits.add(get.suit(c, false))
                }
              }
            } else if (evt.name === "cardsDiscard") {
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
          content: "本回合置入弃牌堆的牌包含$花色",
        },
      },
    },
  },
  // 界黄盖
  // 诈降
  rezhaxiang: {
    audio: "zhaxiang",
    audioname2: { ol_sb_jiangwei: "zhaxiang_ol_sb_jiangwei" },
    inherit: "zhaxiang",
    async content(event, trigger, player) {
      await player.draw(3)
      if (player.isPhaseUsing()) {
        player.addTempSkill(`${event.name}_effect`)
        player.addMark(`${event.name}_effect`, 1, false)
      }
    },
    subSkill: {
      effect: {
        inherit: "zhaxiang_effect",
        mod: {
          targetInRange(card, player, target, now) {
            if (card.name === "sha" && get.color(card) === "red") {
              return true
            }
          },
          cardUsable(card, player, num) {
            if (card.name === "sha") {
              return num + player.countMark("rezhaxiang_effect")
            }
          },
        },
        sourceSkill: "rezhaxiang",
      },
    },
  },
  // 界貂蝉
  // 离间
  relijian: {
    audio: "lijian",
    audioname: ["old_diaochan"],
    inherit: "lijian",
    async content(event, trigger, player) {
      const next = event.targets[1]
        .useCard({
          card: get.autoViewAs({ name: "juedou", isCard: true }),
          targets: [event.targets[0]],
          nowuxie: true,
          noai: true,
        })
        .set("animate", false)
      await game.delay(0.5)
      return next
    },
  },
  // 界华雄
  // 耀武
  olyaowu: {
    trigger: { player: "damageBegin3" },
    audio: 2,
    forced: true,
    filter(event) {
      return (
        event.card && (get.color(event.card) !== "red" || event.source?.isIn())
      )
    },
    async content(event, trigger, player) {
      if (get.color(trigger.card) === "red") {
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
      return target !== player && target.canUse("juedou", player)
    },
    async content(event, trigger, player) {
      await event.target.useCard(
        { name: "juedou", isCard: true },
        player,
        "noai",
      )
    },
    ai: {
      order: 2,
      result: {
        player(player, target) {
          return get.effect(
            player,
            { name: "juedou", isCard: true },
            target,
            player,
          )
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
        get.sgn(player.getDamagedHp() - 1.5) !==
        get.sgn(player.getDamagedHp() - 1.5 + event.num)
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
      if (!event.isFirstTarget || get.color(event.card) !== "black") {
        return false
      }
      for (var i of event.targets) {
        if (
          i !== player &&
          i.hasCard((card) => lib.filter.canBeDiscarded(card, player, i), "he")
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
          "弃置其中一个目标一张牌。若此牌为：装备牌，你获得之；锦囊牌，此" +
            get.translation(trigger.card) +
            "无法被响应。",
          (card, player, target) =>
            target !== player &&
            _status.event.getTrigger().targets.includes(target) &&
            target.hasCard(
              (card) => lib.filter.canBeDiscarded(card, player, target),
              "he",
            ),
        )
        .set("ai", (target) => {
          const player = _status.event.player
          return get.effect(target, { name: "guohe_copy2" }, player, player)
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      const result = await player
        .discardPlayerCard(target, true, "he")
        .forResult()
      if (result?.bool && result.cards?.length) {
        //为了体现白马义从野性纯真的美 直接获取卡牌原类型 不考虑维系区域
        const card = result.cards[0],
          type = get.type2(card, false)
        if (type === "trick") {
          trigger.directHit.addArray(
            game.filterPlayer((current) => current !== player),
          )
        }
        if (type === "equip" && get.position(card, true) === "d") {
          await player.gain(card, "gain2")
        }
      }
    },
  },
  // 界曹仁
  // 解围
  rejiewei: {
    audio: "jiewei",
    inherit: "jiewei",
    group: "rejiewei_move",
    subSkill: {
      move: {
        inherit: "jiewei_move",
        async cost(event, trigger, player) {
          event.result = await player
            .chooseToDiscard(
              "he",
              get.prompt("rejiewei"),
              "弃置一张牌，然后可以移动场上的一张牌",
              lib.filter.cardDiscardable,
            )
            .set("ai", (card) => {
              if (!_status.event.check) {
                return 0
              }
              return 7 - get.value(card)
            })
            .set("check", player.canMoveCard(true))
            .forResult()
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
      targetInRange(card) {
        if (card.name === "sha") {
          return true
        }
      },
    },
    onChooseToUse(event) {
      event.targetprompt2.add(lib.skill.olliegong.targetprompt2)
    },
    onChooseTarget(event) {
      event.targetprompt2.add(lib.skill.olliegong.targetprompt2)
    },
    audio: 2,
    inherit: "reliegong",
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
          [{ prompt: "失去任意点体力", min: 1, max: player.getHp() }],
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
          if (
            player.countCards("hs", (card) => player.canSaveCard(card, player))
          ) {
            mindist++
          }
          if (
            game.hasPlayer(
              (current) =>
                get.distance(player, current) <= mindist &&
                player.canUse("sha", current, false) &&
                get.effect(current, { name: "sha" }, player, player) > 0,
            )
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
        if (
          typeof player.storage.reqimou2 === "number" &&
          card.name === "sha"
        ) {
          return num + player.storage.reqimou2
        }
      },
      globalFrom(from, to, distance) {
        if (typeof from.storage.reqimou2 === "number") {
          return distance - from.storage.reqimou2
        }
      },
    },
  },
  // 界小乔
  // 天香
  oltianxiang: {
    audio: 2,
    trigger: { player: "damageBegin4" },
    direct: true,
    filter(event, player) {
      return (
        player.countCards("he", (card) => {
          if (_status.connectMode && get.position(card) === "h") {
            return true
          }
          return get.suit(card, player) === "heart"
        }) > 0 && event.num > 0
      )
    },
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .chooseCardTarget({
          filterCard(card, player) {
            return (
              get.suit(card) === "heart" &&
              lib.filter.cardDiscardable(card, player)
            )
          },
          filterTarget(card, player, target) {
            return player !== target
          },
          position: "he",
          ai1(card) {
            return 10 - get.value(card)
          },
          ai2(target) {
            var att = get.attitude(_status.event.player, target)
            var trigger = _status.event.getTrigger()
            var da = 0
            if (_status.event.player.hp === 1) {
              da = 10
            }
            var eff = get.damageEffect(target, trigger.source, target)
            if (att === 0) {
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
            (event, player) => {
              var target = _status.event.target
              var att = get.attitude(player, target)
              if (target.hasSkillTag("maihp")) {
                att = -att
              }
              if (att > 0) {
                return 0
              }
              return 1
            },
            [
              `令来源对${get.translation(target)}造成1点伤害，然后其摸X张牌（X为其已损失的体力值且至多为5）`,
              `令${get.translation(target)}失去1点体力，然后其获得${get.translation(result.cards)}`,
            ],
          )
          .set("target", target)
          .forResult()
        player.logSkill(event.name, target)
        trigger.cancel()
        event.target = target
        event.card = result.cards[0]
        // step 2
        if (typeof result2.index === "number") {
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
        if (suit === "spade") {
          return "heart"
        }
      },
      maxHandcardBase(player, num) {
        if (
          player.countCards("e", (card) => get.suit(card, player) === "heart")
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
        .judge((card) => (get.suit(card) === "heart" ? 2 : 0))
        .set("judge2", (result) => !!result.bool)
        .forResult()
      if (result?.card && result.suit === "heart") {
        const { card } = result
        if (get.position(card, true) === "d") {
          const result2 = await player
            .chooseTarget(
              `飘零：将${get.translation(card)}交给一名角色，或点【取消】将其置于牌堆顶`,
            )
            .set("ai", (target) => {
              var player = _status.event.player
              var att = get.attitude(player, target)
              if (player === target) {
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
            if (player === target) {
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
  // 不屈
  olbuqu: {
    audio: "rebuqu",
    trigger: { player: "dying" },
    forced: true,
    filter(event, player) {
      if (event.getParent("olbuqu")?.player === player) return false
      return player.isDying()
    },
    async content(event, trigger, player) {
      if (player.hp <= 0) {
        await player.recover(1 - player.hp)
      }
      player.removeSkill("refenji_used")
      const [card] = get.cards()
      const next = player.addToExpansion(card, "gain2")
      next.gaintag.add("olbuqu")
      await next
      const cards = player.getExpansions("olbuqu"),
        num = get.number(card)
      player.showCards(cards, "不屈")
      for (let i = 0; i < cards.length; i++) {
        if (cards[i] !== card && get.number(cards[i]) === num) {
          await player.loseToDiscardpile(card)
          await player.loseHp()
          return
        }
      }
    },
    mod: {
      maxHandcardBase(player, num) {
        return num + player.getExpansions("olbuqu").length
      },
    },
    ai: {
      save: true,
      skillTagFilter(player, tag, target) {
        if (player !== target) {
          return false
        }
      },
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
            const num = target.getExpansions("olbuqu").length || target.getHp()
            return (num + 1) / 5
          }
        },
      },
    },
    onremove(player, skill) {
      const cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
        player.loseHp(cards.length)
      }
    },
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
  },
  // 奋激
  refenji: {
    audio: "fenji",
    trigger: { global: ["gainAfter", "loseAfter", "loseAsyncAfter"] },
    filter(event, player) {
      return !["useCard", "respond"].includes(event.getParent().name)
    },
    getIndex(event, player) {
      const used = player.getStorage("refenji_used")
      return game
        .filterPlayer((current) => {
          return (
            event.getl(current).hs.length > 0 &&
            !used.includes(current) &&
            current.isIn()
          )
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
      player.addTempSkill("refenji_used")
      player.markAuto("refenji_used", target)
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
    trigger: { player: ["useCard", "respond"] },
    filter(event, player) {
      return (
        event.card.name === "shan" ||
        (event.name === "useCard" && event.card.name === "shandian")
      )
    },
    judgeCheck(card, bool) {
      var suit = get.suit(card)
      if (suit === "spade") {
        if (bool && get.number(card) > 1 && get.number(card) < 10) {
          return 5
        }
        return 4
      }
      if (suit === "club") {
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
          if (typeof card === "object") {
            if (card.viewAs) {
              name = card.viewAs
            } else {
              name = get.name(card)
            }
          }
          if (
            name === "shandian" ||
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
              game.hasPlayer(
                (current) =>
                  get.attitude(target, current) < 0 &&
                  get.damageEffect(current, target, target, "thunder") > 0,
              )
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
                player === target ||
                player.hasSkillTag("viewHandcard", null, target, true)
                  ? "hes"
                  : "e",
              better = club > spade ? "club" : "spade",
              max = 0
            target.hasCard((cardx) => {
              if (get.suit(cardx) === better) {
                max = 2
                return true
              }
              if (spade && get.color(cardx) === "black") {
                max = 1
              }
            }, pos)
            if (max === 2) {
              return [1, Math.max(club, spade)]
            }
            if (max === 1) {
              return [1, Math.min(club, spade)]
            }
            if (pos === "e") {
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
          if (typeof card === "object") {
            if (card.viewAs) {
              name = card.viewAs
            } else {
              name = get.name(card)
            }
          }
          if (name === "lebu" || name === "bingliang") {
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
      if (event.num === 1 && player.isDamaged()) {
        event.logged = true
        player.logSkill("olleiji")
        await player.recover()
      }
      const result = await player
        .chooseTarget(`雷击：是否对一名角色造成${event.num}点雷电伤害？`)
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
      if (result.bool && result.targets?.length) {
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
          get.itemtype(card) === "card" &&
          get.color(card) === "black" &&
          get.type(card) === "equip"
        ) {
          num * 1.35
        }
      },
      aiValue(player, card, num) {
        if (
          num > 0 &&
          get.itemtype(card) === "card" &&
          get.color(card) === "black"
        ) {
          return num * 1.15
        }
      },
      aiUseful(player, card, num) {
        if (
          num > 0 &&
          get.itemtype(card) === "card" &&
          get.color(card) === "black"
        ) {
          return num * 1.35
        }
      },
    },
    locked: false,
    trigger: { global: "judge" },
    filter(event, player) {
      return player.hasCards("hes", { color: "black" })
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCard({
          prompt: `${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`,
          filterCard(card) {
            const player = get.player()
            if (get.color(card) !== "black") {
              return false
            }
            const mod2 = game.checkMod(
              card,
              player,
              "unchanged",
              "cardEnabled2",
              player,
            )
            if (mod2 !== "unchanged") {
              return mod2
            }
            const mod = game.checkMod(
              card,
              player,
              "unchanged",
              "cardRespondable",
              player,
            )
            if (mod !== "unchanged") {
              return mod
            }
            return true
          },
          position: "hes",
          ai(card) {
            const trigger = get.event().getTrigger()
            const { player, judging } = get.event()
            const result = trigger.judge(card) - trigger.judge(judging)
            const attitude = get.attitude(player, trigger.player)
            if (attitude === 0 || result === 0) {
              if (trigger.player !== player) {
                return 0
              }
              if (
                game.hasPlayer((current) => get.attitude(player, current) < 0)
              ) {
                const checkx =
                  lib.skill.xinleiji.judgeCheck(card, true) -
                  lib.skill.xinleiji.judgeCheck(judging)
                if (checkx > 0) {
                  return checkx
                }
              }
              return 0
            }
            let val = get.value(card)
            if (get.subtype(card) === "equip2") {
              val /= 2
            } else {
              val /= 7
            }
            if (attitude === 0 || result === 0) {
              return 0
            }
            if (attitude > 0) {
              return result - val
            }
            return -result - val
          },
        })
        .set("judging", trigger.player.judging[0])
        .forResult()
    },
    popup: false,
    async content(event, trigger, player) {
      const next = player.respond({
        cards: event.cards,
        skill: event.name,
        highlight: true,
        noOrdering: true,
      })
      await next
      const { cards } = next
      if (cards?.length) {
        player.$gain2(trigger.player.judging[0])
        await player.gain(trigger.player.judging[0])
        const card = cards[0]
        if (
          get.suit(card) === "spade" &&
          get.number(card) > 1 &&
          get.number(card) < 10
        ) {
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
      var list = game.filterPlayer(
        (target) =>
          target !== player && target.hasZhuSkill("rehuangtian", player),
      )
      var str = `将一张【闪】或黑桃手牌交给${get.translation(list)}`
      if (list.length > 1) {
        str += "中的一人"
      }
      return str
    },
    filter(event, player) {
      if (player.group !== "qun") {
        return false
      }
      if (
        !game.hasPlayer(
          (target) =>
            target !== player &&
            target.hasZhuSkill("rehuangtian", player) &&
            !target.hasSkill("rehuangtian3"),
        )
      ) {
        return false
      }
      return player.hasCard(
        (card) => lib.skill.rehuangtian2.filterCard(card, player),
        "h",
      )
    },
    filterCard(card, player) {
      return (
        get.name(card, player) === "shan" || get.suit(card, player) === "spade"
      )
    },
    log: false,
    visible: true,
    filterTarget(card, player, target) {
      return (
        target !== player &&
        target.hasZhuSkill("rehuangtian", player) &&
        !target.hasSkill("rehuangtian3")
      )
    },
    //usable:1,
    //forceaudio:true,
    async content(event, trigger, player) {
      const { cards, target } = event
      await player.give(cards, target, true)
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
    derivation: ["rechanyuan", "olguhuo_faq"],
    enable: ["chooseToUse", "chooseToRespond"],
    hiddenCard(player, name) {
      return (
        lib.inpile.includes(name) &&
        player.countCards("h") > 0 &&
        !player.hasSkill("olguhuo_used")
      )
    },
    filter(event, player) {
      if (!player.countCards("hs") || player.hasSkill("olguhuo_used")) {
        return false
      }
      for (var i of lib.inpile) {
        var type = get.type(i)
        if (
          (type === "basic" || type === "trick") &&
          event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)
        ) {
          return true
        }
        if (i === "sha") {
          for (var j of lib.inpile_nature) {
            if (
              event.filterCard(
                get.autoViewAs({ name: i, nature: j }, "unsure"),
                player,
                event,
              )
            ) {
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
          if (type === "basic" || type === "trick") {
            list.push([type, "", i])
          }
          if (i === "sha") {
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
          get.autoViewAs(
            { name: button.link[2], nature: button.link[3] },
            "unsure",
          ),
          player,
          evt,
        )
      },
      check(button) {
        var player = _status.event.player
        var rand = _status.event.getParent().getRand("olguhuo")
        var hasEnemy = game.hasPlayer(
          (current) =>
            current !== player &&
            !current.hasSkill("rechanyuan") &&
            (get.realAttitude || get.attitude)(current, player) < 0,
        )
        var card = { name: button.link[2], nature: button.link[3] }
        var val =
          _status.event.getParent().type === "phase"
            ? player.getUseValue(card)
            : 1
        if (val <= 0) {
          return 0
        }
        if (hasEnemy && rand > 0.3) {
          if (
            !player.countCards("h", (cardx) => {
              if (card.name === cardx.name) {
                if (card.name !== "sha") {
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
            var mod = game.checkMod(
              card,
              player,
              "unchanged",
              "cardEnabled2",
              player,
            )
            if (mod !== "unchanged") {
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
            var hasEnemy = game.hasPlayer(
              (current) =>
                current !== player &&
                !current.hasSkill("rechanyuan") &&
                (get.realAttitude || get.attitude)(current, player) < 0,
            )
            var rand = _status.event.getRand("olguhuo")
            var cardx = lib.skill.olguhuo_backup.viewAs
            if (hasEnemy && rand > 0.3) {
              if (
                card.name === cardx.name &&
                (card.name !== "sha" || get.is.sameNature(card, cardx))
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
        return `将一张手牌当做${get.translation(links[0][3]) || ""}${get.translation(links[0][2])}使用`
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
          return event.skill && event.skill.indexOf("olguhuo_") === 0
        },
        async content(event, trigger, player) {
          // step 0
          player.addTempSkill("olguhuo_used")
          event.fake = false
          const card = trigger.cards[0]
          if (
            card.name !== trigger.card.name ||
            (card.name === "sha" && !get.is.sameNature(trigger.card, card))
          ) {
            event.fake = true
          }
          player.line(trigger.targets, get.nature(trigger.card))
          event.cardTranslate = get.translation(trigger.card.name)
          trigger.card.number = get.number(card)
          trigger.card.suit = get.suit(card)
          trigger.skill = "olguhuo_backup"
          if (
            trigger.card.name === "sha" &&
            get.natureList(trigger.card).length
          ) {
            event.cardTranslate =
              get.translation(trigger.card.nature) + event.cardTranslate
          }
          player.popup(
            event.cardTranslate,
            trigger.name === "useCard" ? "metal" : "wood",
          )
          event.prompt = `是否质疑${get.translation(player)}声明的${event.cardTranslate}？`
          game.log(player, "声明了", `#y${event.cardTranslate}`)
          event.targets = game
            .filterPlayer(
              (current) =>
                current !== player && !current.hasSkill("rechanyuan"),
            )
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
          const list = event.targets.map((target) => [
            target,
            [event.prompt, [["guhuo_ally", "guhuo_betray"], "vcard"]],
            true,
          ])
          const result = await player
            .chooseButtonOL(list)
            .set("switchToAuto", () => {
              _status.event.result = "ai"
            })
            .set("processAI", () => {
              let choice = Math.random() > 0.5 ? "guhuo_ally" : "guhuo_betray"
              const playerx = _status.event.player
              const evt = _status.event.getParent("olguhuo_guess")
              if (
                playerx.hp <= 1 ||
                (evt &&
                  (get.realAttitude || get.attitude)(playerx, evt.player) >= 0)
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
            if (result[i].links[0][2] === "guhuo_betray") {
              const current = (
                _status.connectMode ? lib.playerOL : game.playerMap
              )[i]
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
              game.log(player, "声明的", `#y${event.cardTranslate}`, "作废了")
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
        skill !== "chanyuan" &&
        skill !== "rechanyuan" &&
        !lib.skill[skill].charlotte &&
        !lib.skill[skill].persevereSkill &&
        player.hp <= 1
      )
    },
    mark: true,
    intro: {
      content(storage, player, skill) {
        var str =
          "<li>锁定技，你不能质疑〖蛊惑〗；若你的体力值小于等于1，你的其他技能失效。"
        var list = player
          .getSkills(null, false, false)
          .filter((i) => lib.skill.rechanyuan.skillBlocker(i, player))
        if (list.length) {
          str += `<br><li>失效技能：${get.translation(list)}`
        }
        return str
      },
    },
    audio: 2,
    trigger: { player: "changeHp" },
    filter(event, player) {
      if (event.changedHp === 0) {
        return false
      }
      return (
        get.sgn(player.hp - 1.5) !== get.sgn(player.hp - 1.5 - event.changedHp)
      )
    },
    forced: true,
    async content(event, trigger, player) {},
  },
  // 神关羽
  // 武神
  rewushen: {
    mod: {
      cardname(card, player, name) {
        if (get.suit(card) === "heart") {
          return "sha"
        }
      },
      cardnature(card, player) {
        if (get.suit(card) === "heart") {
          return false
        }
      },
      targetInRange(card) {
        if (card.name === "sha") {
          const suit = get.suit(card)
          if (suit === "heart" || suit === "unsure") {
            return true
          }
        }
      },
      cardUsable(card) {
        if (card.name === "sha") {
          const suit = get.suit(card)
          if (suit === "heart" || suit === "unsure") {
            return Infinity
          }
        }
      },
    },
    audio: "wushen",
    trigger: { player: "useCard" },
    forced: true,
    filter(event, player) {
      return event.card.name === "sha" && get.suit(event.card) === "heart"
    },
    async content(event, trigger, player) {
      if (trigger.addCount !== false) {
        trigger.addCount = false
        if (player.stat[player.stat.length - 1].card.sha > 0) {
          player.stat[player.stat.length - 1].card.sha--
        }
      }
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (get.tag(card, "respondSha") && current < 0) {
            return 0.6
          }
        },
      },
      skillTagFilter(player, tag, arg) {
        return arg.card.name === "sha" && get.suit(arg.card) === "heart"
      },
    },
  },
  // 界典韦
  // 强袭
  olqiangxi: {
    audio: 2,
    enable: "phaseUse",
    usable: 2,
    filter(event, player) {
      if (
        player.hp < 1 &&
        !player.hasCard((card) => lib.skill.olqiangxi.filterCard(card), "he")
      ) {
        return false
      }
      return game.hasPlayer((current) =>
        lib.skill.olqiangxi.filterTarget(null, player, current),
      )
    },
    filterCard(card) {
      return get.subtype(card) === "equip1"
    },
    position: "he",
    filterTarget(card, player, target) {
      if (target === player) {
        return false
      }
      var stat = player.getStat()._olqiangxi
      return !stat?.includes(target)
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
            if (player.hp === 2 && target.hp >= 2) {
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
      if (player !== event.player && player !== event.source) {
        return false
      }
      return event.player.getHistory("damage").indexOf(event) === 1
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
    trigger: { player: ["damageEnd", "die"] },
    forceDie: true,
    filter(event, player) {
      if (event.name === "die") {
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
          const draw = Math.min(5, target.maxHp) - target.countCards("h")
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
      const num = target.countCards("h") - Math.min(5, target.maxHp)
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
                max = Math.max(
                  Math.min(5, players[i].hp) - players[i].countCards("h"),
                  max,
                )
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
            (card.name === "tao" || card.name === "caoyao") &&
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
        const { cards } = await player
          .choosePlayerCard(target, showPosition, true)
          .forResult()
        return { bool: true, cards: cards }
      })
      trigger.set("filterDiscard", (card) => {
        const { cards2 } = get.event().getParent("huogong", true)
        return get.color(card) === get.color(cards2[0])
      })
    },
    async huogongContent(event, trigger, player) {
      const { target } = event
      if (target.countCards("h") === 0) {
        return
      }
      const { cards } = await player
          .choosePlayerCard(target, "h", true)
          .forResult(),
        card = cards[0]
      await target.showCards(cards).setContent(() => {})
      event.dialog = ui.create.dialog(
        `${get.translation(target)}展示的手牌`,
        cards,
      )
      event.videoId = lib.status.videoId++

      game.broadcast(
        "createDialog",
        event.videoId,
        `${get.translation(target)}展示的手牌`,
        cards,
      )
      game.addVideo("cardDialog", null, [
        `${get.translation(target)}展示的手牌`,
        get.cardsInfo(cards),
        event.videoId,
      ])
      game.log(target, "展示了", card)
      const result = await player
        .chooseToDiscard({ color: get.color(card) }, "h", (card) => {
          var evt = _status.event.getParent()
          if (
            get.damageEffect(evt.target, evt.player, evt.player, "fire") > 0
          ) {
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
      return event.card.name === "wuxie"
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
        player.getHistory(
          "useCard",
          (card) => get.type(card.card, "trick") === "trick",
        ).length === 0
      )
    },
    async content(event, trigger, player) {
      const result = await player
        .chooseCard({
          prompt: "展示任意张锦囊牌，令这些牌此阶段不计入手牌上限",
          position: "h",
          filterCard(card) {
            return get.type(card, "trick") === "trick"
          },
          selectCard: [1, Infinity],
          allowChooseAll: true,
          ai(card) {
            const { tricks } = get.event()
            return tricks.includes(card) ? 1 : 0
          },
        })
        .set(
          "tricks",
          player
            .getCards("h", (card) => get.type(card, "trick") === "trick")
            .sort((a, b) => get.value(a, player) - get.value(b, player))
            .slice(
              0,
              Math.max(0, player.countCards("h") - player.getHandcardLimit()),
            ),
        )
        .forResult()
      if (result.bool && result.cards?.length) {
        await player.showCards(result.cards, "藏拙")
        player.addGaintag(result.cards, "cangzhuo")
        player.addTempSkill("cangzhuo2")
      }
    },
  },
  cangzhuo2: {
    mod: {
      ignoredHandcard(card, player) {
        if (card.hasGaintag("cangzhuo")) {
          return true
        }
      },
      cardDiscardable(card, player, name) {
        if (name === "phaseDiscard" && card.hasGaintag("cangzhuo")) {
          return false
        }
      },
    },
    onremove(player) {
      player.removeGaintag("cangzhuo")
    },
  },
  // 界庞统
  // 连环
  ollianhuan: {
    audio: 2,
    hiddenCard: (player, name) => {
      return (
        name === "tiesuo" &&
        player.hasCard((card) => get.suit(card) === "club", "she")
      )
    },
    filter(event, player) {
      if (!player.hasCard((card) => get.suit(card) === "club", "she")) {
        return false
      }
      return (
        event.type === "phase" ||
        event.filterCard({ name: "tiesuo" }, player, event)
      )
    },
    position: "hes",
    inherit: "lianhuan",
    group: "ollianhuan_add",
    subSkill: {
      add: {
        audio: "ollianhuan",
        trigger: { player: "useCard2" },
        filter(event, player) {
          if (event.card.name !== "tiesuo") {
            return false
          }
          var info = get.info(event.card)
          if (info.allowMultiple === false) {
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
            .set(
              "prompt2",
              `为${get.translation(trigger.card)}多指定一名角色为目标`,
            )
            .set("sourcex", trigger.targets)
            .set("ai", (target) => {
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
      if (event.type === "dying") {
        if (player !== event.dying) {
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
        .set("prompt", "选择下列一个技能并获得之")
        .set("ai", () => {
          const player = get.event().player,
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
        if (player !== target || player.storage.olniepan) {
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
      if (player === event.player) {
        return true
      }
      if (event.targets) {
        return event.targets.includes(player)
      }
      return player === event.target
    },
    logTarget(event, player) {
      if (player !== event.player) {
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
        player === trigger.player
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
        player === trigger.player
          ? trigger.targets
            ? trigger.targets.slice(0)
            : [trigger.target]
          : [trigger.player]
      if (!trigger.fixedResult) {
        trigger.fixedResult = {}
      }
      for (const target of targets) {
        const result = await player
          .choosePlayerCard(target, "h", true)
          .forResult()
        if (result.bool) {
          trigger.fixedResult[target.playerid] = result.cards[0]
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
        player !== event.player &&
        player !== event.target &&
        !event.targets?.includes(player)
      ) {
        return false
      }
      for (var i of event.lose_list) {
        if (Array.isArray(i[1])) {
          for (var j of i[1]) {
            if (get.name(j, i[0]) === "sha" && get.position(j, true) === "o") {
              return true
            }
          }
        } else {
          var j = i[1]
          if (get.name(j, i[0]) === "sha" && get.position(j, true) === "o") {
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
            if (get.name(j, i[0]) === "sha" && get.position(j, true) === "o") {
              var num = get.number(j, i[0])
              if (num > max) {
                cards = []
                max = num
              }
              if (num === max) {
                cards.push(j)
              }
            }
          }
        } else {
          var j = i[1]
          if (get.name(j, i[0]) === "sha" && get.position(j, true) === "o") {
            var num = get.number(j, i[0])
            if (num > max) {
              cards = []
              max = num
            }
            if (num === max) {
              cards.push(j)
            }
          }
        }
      }
      return `获得${get.translation(cards)}`
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
      return (
        event.card.name === "sha" &&
        event.target.countDiscardableCards(player, "he") > 0
      )
    },
    direct: true,
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .discardPlayerCard(
          trigger.target,
          get.prompt("rejianchu", trigger.target),
        )
        .set("ai", (button) => {
          if (!_status.event.att) {
            return 0
          }
          if (get.position(button.link) === "e") {
            if (get.subtype(button.link) === "equip2") {
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
      if (result.bool && result.links?.length) {
        if (
          get.type(
            result.links[0],
            null,
            result.links[0].original === "h" ? player : false,
          ) !== "basic"
        ) {
          trigger.getParent().directHit.add(trigger.target)
          player.addTempSkill("rejianchu2")
          player.addMark("rejianchu2", 1, false)
        } else if (trigger.cards) {
          var list = []
          for (var i = 0; i < trigger.cards.length; i++) {
            if (get.position(trigger.cards[i], true) === "o") {
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
        if (tag === "directHit_ai") {
          return (
            arg.card.name === "sha" &&
            arg.target.countCards("e", (card) => get.value(card) > 1) > 0
          )
        }
        if (arg && arg.name === "sha" && arg.target.getEquip(2)) {
          return true
        }
        return false
      },
    },
  },
  rejianchu2: {
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") {
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
      return event.card.name === "wanjian" && event.targets.length > 0
    },
    line: false,
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .chooseTarget(
          get.prompt("olluanji"),
          `取消${get.translation(trigger.card)}中一个目标`,
          (card, player, target) => _status.event.targets.includes(target),
        )
        .set("targets", trigger.targets)
        .set("ai", (target) => {
          var player = _status.event.player
          return -get.effect(
            target,
            _status.event.getTrigger().card,
            player,
            player,
          )
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
  rexueyi: {
    audio: 2,
    trigger: { global: "phaseBefore", player: "enterGame" },
    forced: true,
    zhuSkill: true,
    filter(event, player) {
      return (
        (event.name !== "phase" || game.phaseNumber === 0) &&
        player.hasZhuSkill("rexueyi")
      )
    },
    async content(event, trigger, player) {
      const num = game.countPlayer((current) => current.group === "qun")
      if (num) {
        player.addMark("rexueyi", num * 2)
      }
    },
    marktext: "裔",
    intro: {
      name2: "裔",
      content: "mark",
    },
    mod: {
      maxHandcard(player, num) {
        if (player.hasZhuSkill("rexueyi")) {
          return num + player.countMark("rexueyi")
        }
      },
    },
    group: "rexueyi_draw",
    subSkill: {
      draw: {
        audio: "rexueyi",
        trigger: { player: "phaseUseBegin" },
        prompt2: "弃1枚“裔”，然后摸一张牌",
        check(event, player) {
          return player.getUseValue("wanjian") > 0 || !player.needsToDiscard()
        },
        filter(event, player) {
          return player.hasZhuSkill("rexueyi") && player.hasMark("rexueyi")
        },
        async content(event, trigger, player) {
          player.removeMark("rexueyi", 1)
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
          "弃置一张牌，然后本回合你可以将一张与之颜色不同的牌当【决斗】使用",
          "chooseonly",
        )
        .set("ai", (card) => {
          const player = _status.event.player
          if (!_status.event.goon || player.skipList.includes("phaseUse")) {
            return -get.value(card)
          }
          let color = get.color(card),
            effect = 0,
            cards = player.getCards("hes"),
            sha = false
          for (const cardx of cards) {
            if (cardx === card || get.color(cardx) === color) {
              continue
            }
            const cardy = get.autoViewAs({ name: "juedou" }, [cardx]),
              eff1 = player.getUseValue(cardy)
            if (get.position(cardx) === "e") {
              const eff2 = get.value(cardx)
              if (eff1 > eff2) {
                effect += eff1 - eff2
              }
              continue
            }
            if (get.name(cardx) === "sha") {
              if (sha) {
                effect += eff1
                continue
              }
              sha = true
            }
            const eff2 = player.getUseValue(cardx, null, true)
            if (eff1 > eff2) {
              effect += eff1 - eff2
            }
          }
          return effect - get.value(card)
        })
        .set(
          "goon",
          player.hasValueTarget({ name: "juedou" }) &&
            !player.hasSkill("olshuangxiong_effect"),
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
            if (color !== i) {
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
          str += "的牌当【决斗】使用"
          return str
        },
        check(card) {
          const player = _status.event.player
          if (get.position(card) === "e") {
            const raw = get.value(card)
            const eff = player.getUseValue(
              get.autoViewAs({ name: "juedou" }, [card]),
            )
            return eff - raw
          }
          const raw = player.getUseValue(card, null, true)
          const eff = player.getUseValue(
            get.autoViewAs({ name: "juedou" }, [card]),
          )
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
          return player.hasHistory("damage", (evt) => {
            //Disable Umi Kato's chaofan
            return (
              evt.card && evt.cards?.some((card) => get.position(card, true))
            )
          })
        },
        async content(event, trigger, player) {
          const cards = []
          player.getHistory("damage", (evt) => {
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
  // 界徐晃
  // 断粮
  olduanliang: {
    audio: 2,
    locked: false,
    enable: "chooseToUse",
    filterCard(card) {
      return get.type2(card) !== "trick" && get.color(card) === "black"
    },
    filter(event, player) {
      return player.hasCard(
        (card) => get.type2(card) !== "trick" && get.color(card) === "black",
        "hes",
      )
    },
    position: "hes",
    viewAs: { name: "bingliang" },
    prompt: "将一张黑色非锦囊牌当【兵粮寸断】使用",
    check(card) {
      return 6 - get.value(card)
    },
    ai: {
      order: 9,
    },
    mod: {
      targetInRange(card, player, target) {
        if (card.name === "bingliang" && !player.getStat("damage")) {
          return true
        }
      },
    },
  },
  // 截辎
  rejiezi: {
    audio: 2,
    trigger: { global: ["phaseDrawSkipped", "phaseDrawCancelled"] },
    direct: true,
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          get.prompt("rejiezi"),
          "你可以选择一名角色，若其手牌数为全场最少且没有“辎”，其获得“辎”，否则其摸一张牌。",
        )
        .set("ai", (target) => {
          var att = get.attitude(_status.event.player, target)
          if (!target.hasMark("rejiezi") && target.isMinHandcard()) {
            att *= 2
          }
          return att
        })
        .forResult()
      if (result.bool) {
        var target = result.targets[0]
        player.logSkill("rejiezi", target)
        if (!target.hasMark("rejiezi") && target.isMinHandcard()) {
          target.addMark("rejiezi", 1)
        } else {
          target.draw()
        }
      }
    },
    marktext: "辎",
    intro: {
      name2: "辎",
      content: "mark",
      onunmark: true,
    },
    group: "rejiezi_extra",
    subSkill: {
      extra: {
        audio: "rejiezi",
        trigger: { global: "phaseDrawAfter" },
        forced: true,
        filter(event, player) {
          return event.player.hasMark("rejiezi")
        },
        logTarget: "player",
        async content(event, trigger, player) {
          const evt = trigger.getParent("phase", true, true)
          if (evt?.phaseList) {
            evt.phaseList.splice(evt.num + 1, 0, "phaseDraw|rejiezi")
          }
          trigger.player.removeMark(
            "rejiezi",
            trigger.player.countMark("rejiezi"),
          )
        },
      },
    },
  },
  // 界祝融
  // 长标
  changbiao: {
    audio: 2,
    mod: {
      targetInRange(card, player, target) {
        if (card.changbiao) {
          return true
        }
      },
    },
    enable: "phaseUse",
    usable: 1,
    viewAs: {
      name: "sha",
      changbiao: true,
    },
    locked: false,
    filter(event, player) {
      return player.countCards("hs") > 0
    },
    filterCard: true,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    position: "hs",
    check(card) {
      const player = _status.event.player
      if (ui.selected.cards.length) {
        const list = game
          .filterPlayer(
            (current) =>
              current !== player &&
              player.canUse("sha", current, false) &&
              get.effect(current, { name: "sha" }, player, player) > 0,
          )
          .sort(
            (a, b) =>
              get.effect(b, { name: "sha" }, player, player) -
              get.effect(a, { name: "sha" }, player, player),
          )
        if (!list.length) {
          return 0
        }
        const target = list[0],
          cards = ui.selected.cards.concat([card]),
          color = []
        for (const i of cards) {
          if (!color.includes(get.color(i, player))) {
            color.add(get.color(i, player))
          }
        }
        if (color.length !== 1) {
          color[0] = "none"
        }
        if (
          player.hasSkillTag(
            "directHit_ai",
            true,
            {
              target: target,
              card: {
                name: "sha",
                suit: "none",
                color: color[0],
                cards: cards,
                isCard: true,
              },
            },
            true,
          )
        ) {
          return 6.5 - get.value(card, player)
        }
        if (
          Math.random() * target.countCards("hs") < 1 ||
          player.needsToDiscard(0, (i, player) => {
            return (
              !ui.selected.cards.includes(i) && !player.canIgnoreHandcard(i)
            )
          })
        ) {
          return 6 - get.value(card, player)
        }
        return 0
      }
      return 6.3 - get.value(card)
    },
    onuse(result, player) {
      player.addTempSkill("changbiao_draw")
    },
    subSkill: {
      draw: {
        audio: "changbiao",
        trigger: { player: "phaseUseEnd" },
        forced: true,
        charlotte: true,
        filter(event, player) {
          return player.hasHistory("sourceDamage", (evxt) => {
            var evt = evxt.getParent()
            return (
              evt &&
              evt.name === "sha" &&
              evt.skill === "changbiao" &&
              evt.getParent("phaseUse") === event
            )
          })
        },
        async content(event, trigger, player) {
          const cards = []
          for (const evxt of player.getHistory("sourceDamage")) {
            const evt = evxt.getParent()
            if (
              evt &&
              evt.name === "sha" &&
              evt.skill === "changbiao" &&
              evt.getParent("phaseUse") === trigger
            ) {
              cards.addArray(evt.cards)
            }
          }
          if (cards.length) {
            await player.draw(cards.length)
          }
        },
      },
    },
    ai: {
      order(item, player) {
        return (
          get.order({ name: "sha" }, player) +
          0.3 *
            (Math.min(
              player.getCardUsable("sha"),
              player.countCards("hs", "sha") +
                player.hasCard(
                  (card) =>
                    card.name !== "sha" && get.value(card, player) < 6.3,
                  "hs",
                )
                ? 1
                : 0,
            ) > 1
              ? -1
              : 1)
        )
      },
      nokeep: true,
      skillTagFilter(player, tag, arg) {
        if (tag === "nokeep") {
          let num = 0
          if (arg && (!arg.card || get.name(arg.card) !== "tao")) {
            return false
          }
          player.getHistory("sourceDamage", (evxt) => {
            const evt = evxt.getParent()
            if (evt && evt.name === "sha" && evt.skill === "changbiao") {
              num += evt.cards.length
            }
          })
          return player.needsToDiscard(num) > 0
        }
      },
    },
  },
  // 界孟获
  // 再起
  olzaiqi: {
    audio: 2,
    direct: true,
    filter(event, player) {
      return lib.skill.olzaiqi.count() > 0
    },
    trigger: {
      player: "phaseJieshuBegin",
    },
    async content(event, trigger, player) {
      let result

      // step 0
      result = await player
        .chooseTarget([1, lib.skill.olzaiqi.count()], get.prompt2("olzaiqi"))
        .set("ai", (target) => get.attitude(_status.event.player, target))
        .forResult()

      // step 1
      if (result.bool) {
        var targets = result.targets
        targets.sortBySeat()
        player.line(targets, "fire")
        player.logSkill("olzaiqi", targets)
        event.targets = targets
      } else {
        return
      }

      // step 2 & 3 (loop through targets)
      while (event.targets.length) {
        event.current = event.targets.shift()
        if (player.isHealthy()) {
          result = { index: 0 }
        } else {
          result = await event.current
            .chooseControl()
            .set("choiceList", [
              "摸一张牌",
              `令${get.translation(player)}回复1点体力`,
            ])
            .set("ai", () => {
              if (get.attitude(event.current, player) > 0) {
                return 1
              }
              return 0
            })
            .forResult()
        }

        if (result.index === 1) {
          event.current.line(player)
          await player.recover(event.current)
        } else {
          await event.current.draw()
        }
        await game.delay()
      }
    },
    count: () =>
      get.discarded().filter((card) => get.color(card) === "red").length,
  },
  // 界鲁肃
  // 好施
  olhaoshi: {
    audio: 2,
    trigger: { player: "phaseDrawBegin2" },
    filter(event, player) {
      return !event.numFixed
    },
    check(event, player) {
      return (
        player.countCards("h") + 2 + event.num <= 5 ||
        game.hasPlayer(
          (target) =>
            player !== target &&
            !game.hasPlayer(
              (current) =>
                current !== player &&
                current !== target &&
                current.countCards("h") < target.countCards("h"),
            ) &&
            get.attitude(player, target) > 0,
        )
      )
    },
    async content(event, trigger, player) {
      trigger.num += 2
      player.addTempSkill("olhaoshi_give", "phaseDrawAfter")
    },
    subSkill: {
      give: {
        trigger: { player: "phaseDrawEnd" },
        forced: true,
        charlotte: true,
        popup: false,
        filter(event, player) {
          return player.countCards("h") > 5
        },
        async content(event, trigger, player) {
          let result

          // step 0
          var targets = game.filterPlayer(
              (target) =>
                target !== player &&
                !game.hasPlayer(
                  (current) =>
                    current !== player &&
                    current !== target &&
                    current.countCards("h") < target.countCards("h"),
                ),
            ),
            num = Math.floor(player.countCards("h") / 2)
          result = await player
            .chooseCardTarget({
              position: "h",
              filterCard: true,
              filterTarget(card, player, target) {
                return _status.event.targets.includes(target)
              },
              targets: targets,
              selectTarget: targets.length === 1 ? -1 : 1,
              selectCard: num,
              prompt: `将${get.cnNumber(num)}张手牌交给手牌最少的一名其他角色`,
              forced: true,
              ai1(card) {
                var goon = false,
                  player = _status.event.player
                for (var i of _status.event.targets) {
                  if (
                    get.attitude(i, player) > 0 &&
                    get.attitude(player, i) > 0
                  ) {
                    goon = true
                  }
                  break
                }
                if (goon) {
                  if (
                    !player.hasValueTarget(card) ||
                    (card.name === "sha" &&
                      player.countCards(
                        "h",
                        (cardx) =>
                          cardx.name === "sha" &&
                          !ui.selected.cards.includes(cardx),
                      ) > player.getCardUsable("sha"))
                  ) {
                    return 2
                  }
                  return Math.max(2, get.value(card) / 4)
                }
                return 1 / Math.max(1, get.value(card))
              },
              ai2(target) {
                return get.attitude(_status.event.player, target)
              },
            })
            .forResult()

          // step 1
          if (result.bool) {
            var target = result.targets[0]
            player.line(target, "green")
            player.give(result.cards, target)
            player.markAuto("olhaoshi_help", [target])
            player.addTempSkill("olhaoshi_help", { player: "phaseBeginStart" })
          }
        },
      },
      help: {
        trigger: { target: "useCardToTargeted" },
        direct: true,
        charlotte: true,
        onremove: true,
        filter(event, player) {
          if (!player.storage.olhaoshi_help?.length) {
            return false
          }
          if (event.card.name !== "sha" && get.type(event.card) !== "trick") {
            return false
          }
          for (var i of player.storage.olhaoshi_help) {
            if (i.countCards("h") > 0) {
              return true
            }
          }
          return false
        },
        async content(event, trigger, player) {
          let result
          let targets = event.targets
          let target = event.target

          while (true) {
            // step 0
            if (!targets) {
              targets = player.storage.olhaoshi_help.slice(0).sortBySeat()
            }
            if (!targets.length) break

            target = targets.shift()
            result = await target
              .chooseCard(
                "h",
                `好施：是否交给${get.translation(player)}一张手牌？`,
              )
              .set("ai", (card) => {
                var player = _status.event.player,
                  target = _status.event.getTrigger().player
                if (!_status.event.goon) {
                  if (
                    get.value(card, player) < 0 ||
                    get.value(card, target) < 0
                  ) {
                    return 1
                  }
                  return 0
                }
                var cardx = _status.event.getTrigger().card
                if (
                  card.name === "shan" &&
                  get.tag(cardx, "respondShan") &&
                  target.countCards("h", "shan") <
                    player.countCards("h", "shan")
                ) {
                  return 2
                }
                if (
                  card.name === "sha" &&
                  (cardx.name === "juedou" ||
                    (get.tag(card, "respondSha") &&
                      target.countCards("h", "sha") <
                        player.countCards("h", "sha")))
                ) {
                  return 2
                }
                if (
                  get.value(card, target) > get.value(card, player) ||
                  target.getUseValue(card) > player.getUseValue(card)
                ) {
                  return 1
                }
                if (player.hasSkillTag("noh")) {
                  return 0.5 / Math.max(1, get.value(card, player))
                }
                return 0
              })
              .set("goon", get.attitude(target, player) > 0)
              .forResult()

            // step 1
            if (result.bool) {
              target.logSkill("olhaoshi_help", player)
              target.give(result.cards, player)
            }
          }
        },
      },
    },
  },
  // 缔盟
  oldimeng: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return game.hasPlayer((current) =>
        lib.skill.oldimeng.filterTarget(null, player, current),
      )
    },
    selectTarget: 2,
    complexTarget: true,
    filterTarget(card, player, target) {
      if (target === player) {
        return false
      }
      var ps = player.countCards("he")
      if (!ui.selected.targets.length) {
        var hs = target.countCards("h")
        return game.hasPlayer((current) => {
          if (current === player || current === target) {
            return false
          }
          var cs = current.countCards("h")
          return (hs > 0 || cs > 0) && Math.abs(hs - cs) <= ps
        })
      }
      var current = ui.selected.targets[0],
        hs = target.countCards("h"),
        cs = current.countCards("h")
      return (hs > 0 || cs > 0) && Math.abs(hs - cs) <= ps
    },
    multitarget: true,
    multiline: true,
    async content(event, trigger, player) {
      const { targets } = event
      await targets[0].swapHandcards(targets[1])
      player.addTempSkill("oldimeng_discard", "phaseUseAfter")
      player.markAuto("oldimeng_discard", [targets])
    },
    ai: {
      threaten: 4.5,
      pretao: true,
      nokeep: true,
      order: 1,
      expose: 0.2,
      result: {
        target(player, target) {
          if (!ui.selected.targets.length) {
            return -Math.sqrt(target.countCards("h"))
          }
          var h1 = ui.selected.targets[0].getCards("h"),
            h2 = target.getCards("h")
          if (h2.length > h1.length) {
            return 0
          }
          var delval =
            get.value(h2, target) - get.value(h1, ui.selected.targets[0])
          if (delval >= 0) {
            return 0
          }
          return -delval * (h1.length - h2.length)
        },
      },
    },
    subSkill: {
      discard: {
        audio: "oldimeng",
        trigger: { player: "phaseUseEnd" },
        forced: true,
        charlotte: true,
        onremove: true,
        filter(event, player) {
          return player.countCards("he") > 0
        },
        async content(event, trigger, player) {
          for (const targets of player.getStorage("oldimeng_discard")) {
            if (targets.length < 2) {
              continue
            }
            const num = Math.abs(
              targets[0].countCards("h") - targets[1].countCards("h"),
            )
            if (num > 0 && player.countCards("he") > 0) {
              await player.chooseToDiscard("he", true, num)
            }
          }
        },
      },
    },
  },
  // 界孙坚
  // 武烈
  wulie: {
    trigger: { player: "phaseJieshuBegin" },
    audio: 2,
    direct: true,
    limited: true,
    skillAnimation: true,
    animationColor: "wood",
    filter(event, player) {
      return player.hp > 0
    },
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .chooseTarget([1, player.hp], get.prompt2("wulie"), lib.filter.notMe)
        .set("ai", (target) => {
          var player = _status.event.player
          if (player.hasUnknown()) {
            return 0
          }
          if (
            player.hp - ui.selected.targets.length >
            1 +
              player.countCards("hs", (card) =>
                player.canSaveCard(card, player),
              )
          ) {
            return get.attitude(player, target)
          }
          return 0
        })
        .forResult()
      // step 1
      if (result.bool) {
        var targets = result.targets.sortBySeat()
        player.logSkill("wulie", targets)
        player.awakenSkill(event.name)
        await player.loseHp(targets.length)
        while (targets.length) {
          targets[0].addSkill("wulie2")
          targets.shift().addMark("wulie2")
        }
      }
    },
  },
  wulie2: {
    marktext: "烈",
    intro: { name2: "烈", content: "mark" },
    trigger: { player: "damageBegin3" },
    forced: true,
    sourceSkill: "wulie",
    async content(event, trigger, player) {
      trigger.cancel()
      player.removeMark("wulie2", 1)
      if (!player.storage.wulie2) {
        player.removeSkill("wulie2")
      }
    },
  },
  // 界董卓
  // 酒池
  oljiuchi: {
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "jiu") {
          return Infinity
        }
      },
    },
    audio: 2,
    enable: "chooseToUse",
    filterCard(card) {
      return get.suit(card) === "spade"
    },
    viewAs: { name: "jiu" },
    position: "hs",
    viewAsFilter(player) {
      return player.hasCard((card) => get.suit(card) === "spade", "hs")
    },
    prompt: "将一张黑桃手牌当【酒】使用",
    check(cardx, player) {
      if (player && player === cardx.player) {
        return true
      }
      if (_status.event.type === "dying") {
        return 1
      }
      var player = _status.event.player
      var shas = player.getCards(
        "hs",
        (card) => card !== cardx && get.name(card, player) === "sha",
      )
      if (!shas.length) {
        return -1
      }
      if (
        shas.length > 1 &&
        (player.getCardUsable("sha") > 1 || player.countCards("hs", "zhuge"))
      ) {
        return 0
      }
      shas.sort((a, b) => get.order(b) - get.order(a))
      var card = false
      if (shas.length) {
        for (var i = 0; i < shas.length; i++) {
          if (shas[i] !== cardx && lib.filter.filterCard(shas[i], player)) {
            card = shas[i]
            break
          }
        }
      }
      if (card) {
        if (
          game.hasPlayer(
            (current) =>
              get.attitude(player, current) < 0 &&
              !current.hasShan() &&
              current.hp + current.countCards("h", { name: ["tao", "jiu"] }) >
                1 + (player.storage.jiu || 0) &&
              player.canUse(card, current, true, true) &&
              !current.hasSkillTag("filterDamage", null, {
                player: player,
                card: card,
                jiu: true,
              }) &&
              get.effect(current, card, player) > 0,
          )
        ) {
          return 4 - get.value(cardx)
        }
      }
      return -1
    },
    ai: {
      threaten: 1.5,
    },
    trigger: { source: "damageEnd" },
    locked: false,
    forced: true,
    filter(event, player) {
      if (event.name === "chooseToUse") {
        return player.hasCard((card) => get.suit(card) === "spade", "hs")
      }
      return (
        event.card &&
        event.card.name === "sha" &&
        event.getParent(2).jiu === true &&
        !player.isTempBanned("benghuai")
      )
    },
    async content(event, trigger, player) {
      player.logSkill("oljiuchi")
      player.tempBanSkill("benghuai")
    },
  },
  // 暴虐
  olbaonue: {
    audio: 2,
    zhuSkill: true,
    trigger: { global: "damageSource" },
    filter(event, player) {
      if (
        player === event.source ||
        !event.source ||
        event.source.group !== "qun"
      ) {
        return false
      }
      return player.hasZhuSkill("olbaonue", event.source)
    },
    getIndex: (event) => event.num,
    logTarget: "source",
    async content(event, trigger, player) {
      const next = player.judge((card) => {
        if (get.suit(card) === "spade") {
          return 4
        }
        return 0
      })
      next.set("callback", async (event) => {
        if (event.judgeResult.suit === "spade") {
          await player.recover()
          if (get.position(event.judgeResult.card, true) === "o") {
            await player.gain(event.judgeResult.card, "gain2", "log")
          }
        }
      })
      next.judge2 = (result) => result.bool
      await next
    },
  },
  // 界贾诩
  // 帷幕
  olweimu: {
    audio: 2,
    mod: {
      targetEnabled(card) {
        if (get.type2(card) === "trick" && get.color(card) === "black") {
          return false
        }
      },
    },
    trigger: { player: "damageBegin4" },
    forced: true,
    filter(event, player) {
      return player === _status.currentPhase
    },
    async content(event, trigger, player) {
      trigger.cancel()
      const num = trigger.num
      await player.draw(2 * num)
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (target === _status.currentPhase && get.tag(card, "damage")) {
            return [0, 2, 0, 0]
          }
        },
      },
    },
    group: "olweimu_log",
    subSkill: {
      log: {
        audio: "olweimu",
        trigger: { global: "useCard1" },
        forced: true,
        firstDo: true,
        filter(event, player) {
          if (event.player === player) {
            return false
          }
          if (
            get.color(event.card) !== "black" ||
            get.type(event.card) !== "trick"
          ) {
            return false
          }
          var info = lib.card[event.card.name]
          return info?.selectTarget && info.selectTarget === -1 && !info.toself
        },
        async content(_) {},
      },
    },
  },
  // 完杀
  olwansha: {
    audio: 2,
    audioname2: { shen_simayi: "jilue_wansha" },
    global: "olwansha_global",
    trigger: { global: "dyingBegin" },
    forced: true,
    logTarget: "player",
    filter(event, player) {
      return player === _status.currentPhase
    },
    async content(event, trigger, player) {
      const targets = game.filterPlayer()
      for (const current of targets) {
        if (current !== player && current !== trigger.player) {
          current.addSkillBlocker("olwansha_fengyin")
        }
      }
      player.addTempSkill("olwansha_clear")
    },
    subSkill: {
      global: {
        mod: {
          cardEnabled(card, player) {
            var source = _status.currentPhase
            if (
              card.name === "tao" &&
              source &&
              source !== player &&
              source.hasSkill("olwansha") &&
              !player.isDying()
            ) {
              return false
            }
          },
          cardSavable(card, player) {
            var source = _status.currentPhase
            if (
              card.name === "tao" &&
              source &&
              source !== player &&
              source.hasSkill("olwansha") &&
              !player.isDying()
            ) {
              return false
            }
          },
        },
      },
      fengyin: {
        inherit: "fengyin",
      },
      clear: {
        trigger: { global: "dyingAfter" },
        forced: true,
        charlotte: true,
        popup: false,
        filter(event, player) {
          return !_status.dying.length
        },
        async content(event, trigger, player) {
          player.removeSkill("olwansha_clear")
        },
        onremove() {
          game.countPlayer2((current) => {
            current.removeSkillBlocker("olwansha_fengyin")
          })
        },
      },
    },
  },
  // 乱武
  olluanwu: {
    audio: 2,
    audioname2: {},
    inherit: "luanwu",
    async contentAfter(event, trigger, player) {
      await player.chooseUseTarget(
        "sha",
        "是否视为使用一张无距离限制的【杀】？",
        false,
        "nodistance",
      )
    },
  },
  // 界邓艾
  // 屯田
  oltuntian: {
    inherit: "tuntian",
    filter(event, player) {
      if (player === _status.currentPhase) {
        if (event.type !== "discard") {
          return false
        }
        var evt = event.getl(player)
        return (
          evt?.cards2 &&
          evt.cards2.filter(
            (i) => get.name(i, evt.hs.includes(i) ? player : false) === "sha",
          ).length > 0
        )
      }
      if (event.name === "gain" && event.player === player) {
        return false
      }
      var evt = event.getl(player)
      return evt?.cards2 && evt.cards2.length > 0
    },
  },
  // 凿险
  olzaoxian: {
    inherit: "zaoxian",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.loseMaxHp()
      player.addSkills("jixi")
      player.insertPhase()
    },
    ai: {
      combo: "oltuntian",
    },
  },
  // 界张郃
  // 巧变
  olqiaobian: {
    audio: 2,
    trigger: {
      global: "phaseBefore",
      player: "enterGame",
    },
    forced: true,
    locked: false,
    filter(event, player) {
      return event.name !== "phase" || game.phaseNumber === 0
    },
    async content(event, trigger, player) {
      player.addMark("olqiaobian", 2)
      await game.delayx()
    },
    marktext: "变",
    intro: {
      name2: "变",
      content(storage, player) {
        var str = `共有${storage || 0}个标记`
        if (player.storage.olqiaobian_jieshu) {
          str = `<li>${str}<br><li>已记录手牌数：${get.translation(player.storage.olqiaobian_jieshu)}`
        }
        return str
      },
    },
    group: [
      "olqiaobian_judge",
      "olqiaobian_draw",
      "olqiaobian_use",
      "olqiaobian_discard",
      "olqiaobian_jieshu",
    ],
    subSkill: {
      judge: {
        audio: "olqiaobian",
        trigger: { player: "phaseJudgeBefore" },
        direct: true,
        filter(event, player) {
          return (
            player.hasMark("olqiaobian") ||
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_judge"),
              "he",
            )
          )
        },
        check(event, player) {
          return player.hasCard(
            (card) =>
              get.effect(
                player,
                {
                  name: card.viewAs || card.name,
                  cards: [card],
                },
                player,
                player,
              ) < 0,
            "j",
          )
        },
        async content(event, trigger, player) {
          let result

          // step 0
          var choices = []
          if (player.hasMark("olqiaobian")) {
            choices.push("弃置标记")
          }
          if (
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_judge"),
              "he",
            )
          ) {
            choices.push("弃置牌")
          }
          choices.push("cancel2")
          result = await player
            .chooseControl(choices)
            .set("prompt", "巧变：是否跳过判定阶段？")
            .set("ai", () => {
              var evt = _status.event
              if (
                lib.skill[evt.getParent().name].check(
                  evt.getTrigger(),
                  evt.player,
                )
              ) {
                return 0
              }
              return "cancel2"
            })
            .forResult()

          // step 1
          if (result.control !== "cancel2") {
            if (result.control === "弃置牌") {
              const discardResult = await player
                .chooseToDiscard("he", true)
                .forResult()
              discardResult.logSkill = event.name
            } else {
              player.logSkill(event.name)
              player.removeMark("olqiaobian", 1)
            }

            // step 2
            trigger.cancel()
          }
        },
      },
      draw: {
        audio: "olqiaobian",
        trigger: { player: "phaseDrawBefore" },
        direct: true,
        filter(event, player) {
          return (
            player.hasMark("olqiaobian") ||
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_judge"),
              "he",
            )
          )
        },
        check(event, player) {
          return (
            game.countPlayer((current) => {
              if (
                current === player ||
                current.countGainableCards(player, "h") === 0
              ) {
                return false
              }
              var att = get.attitude(player, current)
              if (current.hasSkill("tuntian")) {
                return att > 0
              }
              return att < 1
            }) > 1
          )
        },
        async content(event, trigger, player) {
          let result

          // step 0
          var choices = []
          if (player.hasMark("olqiaobian")) {
            choices.push("弃置标记")
          }
          if (
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_draw"),
              "he",
            )
          ) {
            choices.push("弃置牌")
          }
          choices.push("cancel2")
          result = await player
            .chooseControl(choices)
            .set("prompt", "巧变：是否跳过摸牌阶段？")
            .set("ai", () => {
              var evt = _status.event
              if (
                lib.skill[evt.getParent().name].check(
                  evt.getTrigger(),
                  evt.player,
                )
              ) {
                return 0
              }
              return "cancel2"
            })
            .forResult()

          // step 1
          if (result.control !== "cancel2") {
            if (result.control === "弃置牌") {
              const discardResult = await player
                .chooseToDiscard("he", true)
                .forResult()
              discardResult.logSkill = event.name
            } else {
              player.logSkill(event.name)
              player.removeMark("olqiaobian", 1)
            }

            // step 2
            trigger.cancel()
            if (
              game.hasPlayer(
                (current) => current.countGainableCards(player, "h") > 0,
              )
            ) {
              result = await player
                .chooseTarget(
                  "是否获得至多两名其他角色各一张手牌？",
                  [1, 2],
                  (card, player, target) =>
                    target !== player &&
                    target.countGainableCards(player, "h") > 0,
                )
                .set("ai", (target) => {
                  var att = get.attitude(_status.event.player, target)
                  if (target.hasSkill("tuntian")) {
                    return att / 10
                  }
                  return 1 - att
                })
                .forResult()

              // step 3
              if (result.bool) {
                var targets = result.targets.sortBySeat()
                player.line(targets, "green")
                await player.gainMultiple(targets).forResult()
              }
            }
          }
        },
      },
      use: {
        audio: "olqiaobian",
        trigger: { player: "phaseUseBefore" },
        direct: true,
        filter(event, player) {
          return (
            player.hasMark("olqiaobian") ||
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_judge"),
              "he",
            )
          )
        },
        check(event, player) {
          if (
            player.countCards("h", (card) =>
              player.hasValueTarget(card, null, true),
            ) > 1
          ) {
            return false
          }
          return game.hasPlayer((current) => {
            var att = get.sgn(get.attitude(player, current))
            if (att !== 0) {
              var es = current.getCards("e")
              for (var i = 0; i < es.length; i++) {
                if (
                  game.hasPlayer((current2) => {
                    if (
                      get.sgn(get.value(es[i], current)) !== -att ||
                      get.value(es[i], current) < 5
                    ) {
                      return false
                    }
                    var att2 = get.sgn(get.attitude(player, current2))
                    if (
                      att === att2 ||
                      att2 !==
                        get.sgn(get.effect(current2, es[i], player, current2))
                    ) {
                      return false
                    }
                    return (
                      current !== current2 &&
                      !current2.isMin() &&
                      current2.canEquip(es[i])
                    )
                  })
                ) {
                  return true
                }
              }
            }
            if (att > 0) {
              var js = current.getCards(
                "j",
                (card) =>
                  get.effect(
                    current,
                    {
                      name: card.viewAs || card.name,
                      cards: [card],
                    },
                    current,
                    current,
                  ) < -2,
              )
              for (var i = 0; i < js.length; i++) {
                if (
                  game.hasPlayer((current2) => {
                    var att2 = get.attitude(player, current2)
                    if (att2 >= 0) {
                      return false
                    }
                    return current !== current2 && current2.canAddJudge(js[i])
                  })
                ) {
                  return true
                }
              }
            }
          })
        },
        async content(event, trigger, player) {
          let result

          // step 0
          var choices = []
          if (player.hasMark("olqiaobian")) {
            choices.push("弃置标记")
          }
          if (
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_use"),
              "he",
            )
          ) {
            choices.push("弃置牌")
          }
          choices.push("cancel2")
          result = await player
            .chooseControl(choices)
            .set("prompt", "巧变：是否跳过出牌阶段？")
            .set("ai", () => {
              var evt = _status.event
              if (
                lib.skill[evt.getParent().name].check(
                  evt.getTrigger(),
                  evt.player,
                )
              ) {
                return 0
              }
              return "cancel2"
            })
            .forResult()

          // step 1
          if (result.control !== "cancel2") {
            if (result.control === "弃置牌") {
              const discardResult = await player
                .chooseToDiscard("he", true)
                .forResult()
              discardResult.logSkill = event.name
            } else {
              player.logSkill(event.name)
              player.removeMark("olqiaobian", 1)
            }

            // step 2
            trigger.cancel()
            await player.moveCard().forResult()
          }
        },
      },
      discard: {
        audio: "olqiaobian",
        trigger: { player: "phaseDiscardBefore" },
        direct: true,
        filter(event, player) {
          return (
            player.hasMark("olqiaobian") ||
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_judge"),
              "he",
            )
          )
        },
        check(event, player) {
          return player.needsToDiscard()
        },
        async content(event, trigger, player) {
          let result

          // step 0
          var choices = []
          if (player.hasMark("olqiaobian")) {
            choices.push("弃置标记")
          }
          if (
            player.hasCard(
              (card) =>
                lib.filter.cardDiscardable(card, player, "olqiaobian_discard"),
              "he",
            )
          ) {
            choices.push("弃置牌")
          }
          choices.push("cancel2")
          result = await player
            .chooseControl(choices)
            .set("prompt", "巧变：是否跳过弃牌阶段？")
            .set("ai", () => {
              var evt = _status.event
              if (
                lib.skill[evt.getParent().name].check(
                  evt.getTrigger(),
                  evt.player,
                )
              ) {
                return 0
              }
              return "cancel2"
            })
            .forResult()

          // step 1
          if (result.control !== "cancel2") {
            if (result.control === "弃置牌") {
              const discardResult = await player
                .chooseToDiscard("he", true)
                .forResult()
              discardResult.logSkill = event.name
            } else {
              player.logSkill(event.name)
              player.removeMark("olqiaobian", 1)
            }

            // step 2
            trigger.cancel()
          }
        },
      },
      jieshu: {
        audio: "olqiaobian",
        trigger: { player: "phaseJieshuBegin" },
        forced: true,
        filter(event, player) {
          return !player
            .getStorage("olqiaobian_jieshu")
            .includes(player.countCards("h"))
        },
        async content(event, trigger, player) {
          player.addMark("olqiaobian", 1)
          player.markAuto("olqiaobian_jieshu", [player.countCards("h")])
          player.storage.olqiaobian_jieshu.sort()
        },
      },
    },
  },
  // 界姜维
  // 挑衅
  oltiaoxin: {
    audio: 2,
    enable: "phaseUse",
    usable(skill, player) {
      return (
        1 + (player.hasSkill(`${skill}_rewrite`, null, null, false) ? 1 : 0)
      )
    },
    filter(event, player) {
      return game.hasPlayer((target) =>
        lib.skill.oltiaoxin.filterTarget(null, player, target),
      )
    },
    filterTarget(card, player, target) {
      return (
        target !== player &&
        target.inRange(player) &&
        target.countCards("he") > 0
      )
    },
    async content(event, trigger, player) {
      const { target } = event
      const result = await target
        .chooseToUse(
          function (card, player, event) {
            if (get.name(card) !== "sha") {
              return false
            }
            return lib.filter.filterCard.apply(this, arguments)
          },
          `挑衅：对${get.translation(player)}使用一张【杀】且此【杀】对其造成伤害，否则其弃置你一张牌`,
        )
        .set("targetRequired", true)
        .set("complexSelect", true)
        .set("complexTarget", true)
        .set("filterTarget", function (card, player, target) {
          if (
            target !== _status.event.sourcex &&
            !ui.selected.targets.includes(_status.event.sourcex)
          ) {
            return false
          }
          return lib.filter.filterTarget.apply(this, arguments)
        })
        .set("sourcex", player)
        .forResult()
      if (
        !result.bool ||
        !player.hasHistory("damage", (evt) => {
          return evt.getParent().type === "card" && evt.getParent(4) === event
        })
      ) {
        if (target.countDiscardableCards(player, "he") > 0) {
          await player
            .discardPlayerCard(target, "he", true)
            .set("boolline", true)
        }
        player.addTempSkill(`${event.name}_rewrite`, "phaseUseEnd")
      }
    },
    ai: {
      order: 4,
      expose: 0.2,
      result: {
        target: -1,
        player(player, target) {
          if (target.countCards("h") === 0) {
            return 0
          }
          if (target.countCards("h") === 1) {
            return -0.1
          }
          if (player.hp <= 2) {
            return -2
          }
          if (player.countCards("h", "shan") === 0) {
            return -1
          }
          return -0.5
        },
      },
      threaten: 1.1,
    },
    subSkill: { rewrite: { charlotte: true } },
  },
  // 志继
  olzhiji: {
    skillAnimation: true,
    animationColor: "fire",
    audio: 2,
    juexingji: true,
    //priority:-10,
    derivation: "reguanxing",
    trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
    forced: true,
    filter(event, player) {
      return player.countCards("h") === 0
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      player.chooseDrawRecover(2, true)
      player.loseMaxHp()
      player.addSkills("reguanxing")
    },
  },
  // 界刘禅
  // 放权
  olfangquan: {
    audio: 2,
    audioname2: { shen_caopi: "olfangquan_shen_caopi" },
    trigger: { player: "phaseUseBefore" },
    filter(event, player) {
      return player.countCards("h") > 0 && !player.hasSkill("olfangquan3")
    },
    direct: true,
    async content(event, trigger, player) {
      // step 0
      var fang =
        player.countMark("olfangquan2") === 0 &&
        player.hp >= 2 &&
        player.countCards("h") <= player.hp + 2
      const result = await player
        .chooseBool(get.prompt2("olfangquan"))
        .set("ai", () => {
          if (!_status.event.fang) {
            return false
          }
          return game.hasPlayer((target) => {
            if (target.hasJudge("lebu") || target === player) {
              return false
            }
            if (get.attitude(player, target) > 4) {
              return (
                get.threaten(target) /
                  Math.sqrt(target.hp + 1) /
                  Math.sqrt(target.countCards("h") + 1) >
                0
              )
            }
            return false
          })
        })
        .set("fang", fang)
        .forResult()
      // step 1
      if (result.bool) {
        player.logSkill("olfangquan")
        trigger.cancel()
        player.addTempSkill("olfangquan2")
        player.addMark("olfangquan2", 1, false)
      }
    },
  },
  olfangquan2: {
    trigger: { player: "phaseDiscardBegin" },
    forced: true,
    popup: false,
    audio: false,
    onremove: true,
    sourceSkill: "olfangquan",
    async content(event, trigger, player) {
      // step 0
      event.count = player.countMark(event.name)
      player.removeMark(event.name, event.count, false)
      while (event.count > 0) {
        // step 1
        event.count--
        const result = await player
          .chooseToDiscard(
            "是否弃置一张手牌，令一名其他角色于回合结束时执行一个额外的回合？",
          )
          .set("logSkill", "olfangquan")
          .set("ai", (card) => {
            return 20 - get.value(card)
          })
          .forResult()
        // step 2
        if (result.bool) {
          const result2 = await player
            .chooseTarget(
              true,
              "请选择执行额外回合的目标角色",
              lib.filter.notMe,
            )
            .set("ai", (target) => {
              if (target.hasJudge("lebu")) {
                return -1
              }
              if (get.attitude(player, target) > 4) {
                return (
                  get.threaten(target) /
                  Math.sqrt(target.hp + 1) /
                  Math.sqrt(target.countCards("h") + 1)
                )
              }
              return -1
            })
            .forResult()
          // step 3
          if (result2.bool) {
            var target = result2.targets[0]
            player.line(target, "fire")
            target.markSkillCharacter(
              "olfangquan",
              player,
              "放权",
              "执行一个额外的回合",
            )
            target.insertPhase()
            target.addSkill("olfangquan3")
          }
        } else {
          break
        }
      }
    },
  },
  olfangquan3: {
    trigger: { player: ["phaseAfter", "phaseCancelled"] },
    forced: true,
    popup: false,
    audio: false,
    sourceSkill: "olfangquan",
    async content(event, trigger, player) {
      player.unmarkSkill("olfangquan")
      player.removeSkill("olfangquan3")
    },
  },
  // 若愚
  olruoyu: {
    skillAnimation: true,
    animationColor: "fire",
    audio: 2,
    juexingji: true,
    zhuSkill: true,
    keepSkill: true,
    derivation: ["rejijiang", "sishu"],
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    filter(event, player) {
      if (!player.hasZhuSkill("olruoyu")) {
        return false
      }
      return player.isMinHp()
    },
    async content(event, trigger, player) {
      // step 0
      player.awakenSkill(event.name)
      await player.gainMaxHp()
      // step 1
      if (player.hp < 3) {
        await player.recover(3 - player.hp)
      }
      player.addSkills(["sishu", "rejijiang"])
    },
  },
  // 思蜀
  sishu: {
    audio: 2,
    trigger: { player: "phaseUseBegin" },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(get.prompt2(event.skill))
        .set("ai", (target) => {
          const att = get.attitude(get.player(), target)
          if (target.countMark("sishu2") % 2 === 1) {
            return -att
          }
          return att
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      target.addSkill("sishu_reverse")
      target.addMark("sishu_reverse", 1, false)
    },
    subSkill: {
      reverse: {
        charlotte: true,
        onremove: true,
        marktext: "思",
        intro: {
          name: "思蜀",
          content: "本局游戏【乐不思蜀】的判定结果反转#次",
        },
        trigger: {
          player: "judgeBefore",
        },
        filter(event, player) {
          return event.card?.name === "lebu"
        },
        firstDo: true,
        forced: true,
        locked: false,
        async content(event, trigger, player) {
          trigger.judgeFromSishu = trigger.judge
          trigger.judge = function (card) {
            const { player, judgeFromSishu } = this
            let result = judgeFromSishu(card)
            if (player.countMark("sishu_reverse") % 2 === 1) {
              result *= -1
            }
            return result
          }
        },
      },
    },
  },
  sishu2: {
    charlotte: true,
    marktext: "思",
    intro: {
      name: "思蜀",
      content: "本局游戏【乐不思蜀】的判定结果反转#次",
    },
    mod: {
      judge(player, result) {
        if (
          _status.event.cardname === "lebu" &&
          player.countMark("sishu2") % 2 === 1
        ) {
          if (result.bool === false) {
            result.bool = true
          } else {
            result.bool = false
          }
        }
      },
    },
  },
  // 界孙策
  // 激昂
  oljiang: {
    audio: 2,
    inherit: "jiang",
    group: "oljiang_gain",
    subSkill: {
      gain: {
        audio: "oljiang",
        trigger: { global: ["loseAfter", "loseAsyncAfter"] },
        usable: 1,
        filter(event, player) {
          if (
            player.hp < 1 ||
            event.type !== "discard" ||
            event.position !== ui.discardPile
          ) {
            return false
          }
          var filter = (card) =>
            card.name === "juedou" ||
            (card.name === "sha" && get.color(card, false) === "red")
          var cards = event.getd().filter(filter)
          if (
            !cards.filter((card) => get.position(card, true) === "d").length
          ) {
            return false
          }
          var searched = false
          if (
            game.getGlobalHistory("cardMove", (evt) => {
              if (
                searched ||
                evt.type !== "discard" ||
                evt.position !== ui.discardPile
              ) {
                return false
              }
              var evtx = evt
              if (evtx.getlx === false) {
                evtx = evt.getParent()
              }
              var cards = evtx.getd().filter(filter)
              if (!cards.length) {
                return false
              }
              searched = true
              return evtx !== event
            }).length > 0
          ) {
            return false
          }
          return true
        },
        prompt2(event, player) {
          var cards = event
            .getd()
            .filter(
              (card) =>
                (card.name === "juedou" ||
                  (card.name === "sha" && get.color(card, false) === "red")) &&
                get.position(card, true) === "d",
            )
          return `失去1点体力获得${get.translation(cards)}`
        },
        check(event, player) {
          return player.hp > 1 && !player.storage.olhunzi
        },
        async content(event, trigger, player) {
          await player.loseHp()
          const cards = trigger.getd().filter((card) => {
            return (
              (card.name === "juedou" ||
                (card.name === "sha" && get.color(card, false) === "red")) &&
              get.position(card, true) === "d"
            )
          })
          if (cards.length > 0) {
            await player.gain(cards, "gain2")
          }
        },
      },
    },
  },
  // 魂姿
  olhunzi: {
    audio: 2,
    inherit: "hunzi",
    derivation: ["reyingzi", "yinghun"],
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.loseMaxHp()
      //player.recover();
      await player.addSkills(["reyingzi", "yinghun"])
      player.addTempSkill("olhunzi_effect")
    },
    subSkill: {
      effect: {
        trigger: { player: "phaseJieshuBegin" },
        forced: true,
        popup: false,
        charlotte: true,
        async content(event, trigger, player) {
          await player.chooseDrawRecover(2, true)
        },
      },
    },
  },
  // 制霸
  olzhiba: {
    audio: 2,
    zhuSkill: true,
    global: "olzhiba2",
  },
  olzhiba2: {
    ai: {
      order: 1,
      result: {
        target(player, target) {
          if (
            player.hasZhuSkill("olzhiba") &&
            !player.hasSkill("olzhiba3") &&
            target.group === "wu"
          ) {
            if (
              player.countCards("h", (card) => {
                var val = get.value(card)
                if (val < 0) {
                  return true
                }
                if (val <= 5) {
                  return get.number(card) >= 12
                }
                if (val <= 6) {
                  return get.number(card) >= 13
                }
                return false
              }) > 0
            ) {
              return -1
            }
            return 0
          }
          if (
            player.countCards("h", "du") &&
            get.attitude(player, target) < 0
          ) {
            return -1
          }
          if (player.countCards("h") <= player.hp) {
            return 0
          }
          var maxnum = 0
          var cards2 = target.getCards("h")
          for (var i = 0; i < cards2.length; i++) {
            if (get.number(cards2[i]) > maxnum) {
              maxnum = get.number(cards2[i])
            }
          }
          if (maxnum > 10) {
            maxnum = 10
          }
          if (maxnum < 5 && cards2.length > 1) {
            maxnum = 5
          }
          var cards = player.getCards("h")
          for (var i = 0; i < cards.length; i++) {
            if (get.number(cards[i]) < maxnum) {
              return 1
            }
          }
          return 0
        },
      },
    },
    enable: "phaseUse",
    //usable:1,
    prompt: "请选择〖制霸〗的目标",
    filter(event, player) {
      if (
        player.hasZhuSkill("olzhiba") &&
        !player.hasSkill("olzhiba3") &&
        game.hasPlayer(
          (current) =>
            current !== player &&
            current.group === "wu" &&
            player.canCompare(current),
        )
      ) {
        return true
      }
      return (
        player.group === "wu" &&
        game.hasPlayer(
          (current) =>
            current !== player &&
            current.hasZhuSkill("olzhiba", player) &&
            !current.hasSkill("olzhiba3") &&
            player.canCompare(current),
        )
      )
    },
    filterTarget(card, player, target) {
      if (
        player.hasZhuSkill("olzhiba") &&
        !player.hasSkill("olzhiba3") &&
        target.group === "wu" &&
        player.canCompare(target)
      ) {
        return true
      }
      return (
        player.group === "wu" &&
        target.hasZhuSkill("olzhiba", player) &&
        !target.hasSkill("olzhiba3") &&
        player.canCompare(target)
      )
    },
    prepare(cards, player, targets) {
      if (player.hasZhuSkill("olzhiba")) {
        player.logSkill("olzhiba")
      }
      if (targets[0].hasZhuSkill("olzhiba", player)) {
        targets[0].logSkill("olzhiba")
      }
    },
    direct: true,
    clearTime: true,
    async contentBefore(event, trigger, player) {
      const { targets } = event
      const list = []
      if (
        player.hasZhuSkill("olzhiba") &&
        targets[0].group === "wu" &&
        !player.hasSkill("olzhiba3")
      ) {
        list.push(player)
      }
      if (
        player.group === "wu" &&
        targets[0].hasZhuSkill("olzhiba") &&
        !targets[0].hasSkill("olzhiba3")
      ) {
        list.push(targets[0])
      }

      let chooseRes
      if (list.length === 1) {
        event.target = list[0]
      } else {
        chooseRes = await player
          .chooseTarget(
            true,
            "请选择获得所有拼点牌的角色",
            (card, pl, target) => _status.event.list.includes(target),
          )
          .set("list", list)
          .forResult()
        if (!chooseRes?.bool) {
          return
        }
        event.target = chooseRes.targets[0]
      }

      const target = event.target
      target.addTempSkill("olzhiba3", "phaseUseEnd")

      let acceptRes
      if (target === targets[0]) {
        acceptRes = await target
          .chooseBool(`是否接受来自${get.translation(player)}的拼点请求？`)
          .set(
            "choice",
            get.attitude(target, player) > 0 ||
              target.countCards("h", (card) => {
                const val = get.value(card)
                if (val < 0) return true
                if (val <= 5) return get.number(card) >= 12
                if (val <= 6) return get.number(card) >= 13
                return false
              }) > 0,
          )
          .set("ai", () => _status.event.choice)
          .forResult()
      } else {
        acceptRes = { bool: true }
      }

      if (acceptRes.bool) {
        event.getParent().zhiba_target = target
      } else {
        game.log(target, "拒绝了", player, "的拼点请求")
        target.chat("拒绝")
      }
    },
    async content(event, trigger, player) {
      const { target } = event
      const parent = event.getParent()
      const source = parent?.zhiba_target
      event.source = source
      if (!source) {
        return
      }

      // step 1: 比拼
      const comp = player
        .chooseToCompare(target)
        .set("small", target === source && get.attitude(player, target) > 0)
      comp.clear = false
      const cmpResult = await comp.forResult()

      // step 2: 根据拼点结果处理
      if (
        (player === source && cmpResult.bool) ||
        (target === source && !cmpResult.bool)
      ) {
        event.cards = [cmpResult.player, cmpResult.target].filterInD("d")
        if (!event.cards.length) return

        // 询问 source 是否获得拼点牌
        const ctrl = await source
          .chooseControl("ok", "cancel2")
          .set("dialog", ["是否获得拼点的两张牌？", event.cards])
          .set("ai", () => get.value(event.cards, source, "raw") > 0)
          .forResult()

        if (ctrl.control !== "cancel2") {
          await source.gain(event.cards, "gain2", "log")
        } else {
          ui.clear()
        }
      } else {
        return
      }
    },
  },
  olzhiba3: {},
  // 界张昭张纮
  // 直谏
  olzhijian: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return player.countCards("he", { type: "equip" }) > 0
    },
    filterCard(card) {
      return get.type(card) === "equip"
    },
    position: "he",
    check(card) {
      var player = _status.currentPhase
      if (player.countCards("he", { subtype: get.subtype(card) }) > 1) {
        return 11 - get.equipValue(card)
      }
      return 6 - get.value(card)
    },
    filterTarget(card, player, target) {
      if (target.isMin()) {
        return false
      }
      return player !== target && target.canEquip(card, true)
    },
    async content(event, trigger, player) {
      await event.target.equip(event.cards[0])
      await player.draw()
    },
    discard: false,
    lose: false,
    prepare(cards, player, targets) {
      player.$give(cards, targets[0], false)
    },
    ai: {
      basic: {
        order: 10,
      },
      result: {
        target(player, target) {
          var card = ui.selected.cards[0]
          if (card) {
            return get.effect(target, card, target, target)
          }
          return 0
        },
      },
      threaten: 1.35,
    },
  },
  // 固政
  olguzheng: {
    audio: 2,
    trigger: {
      global: ["loseAfter", "loseAsyncAfter"],
    },
    filter(event, player) {
      if (event.type !== "discard") {
        return false
      }
      if (player.hasSkill("olguzheng_used")) {
        return false
      }
      var phaseName
      for (var name of lib.phaseName) {
        var evt = event.getParent(name)
        if (!evt || evt.name !== name) {
          continue
        }
        phaseName = name
        break
      }
      if (!phaseName) {
        return false
      }
      return game.hasPlayer((current) => {
        if (current === player) {
          return false
        }
        var evt = event.getl(current)
        if (!evt?.cards2 || evt.cards2.filterInD("d").length < 2) {
          return false
        }
        return true
      })
    },
    checkx(event, player, cards) {
      if (cards.length > 2 || get.attitude(player, event.player) > 0) {
        return true
      }
      for (var i = 0; i < cards.length; i++) {
        if (get.value(cards[i], event.player, "raw") < 0) {
          return true
        }
      }
      return false
    },
    direct: true,
    preHidden: true,
    async content(event, trigger, player) {
      const targets = [],
        cardsList = [],
        players = game.filterPlayer().sortBySeat(_status.currentPhase)
      for (const current of players) {
        if (current === player) {
          continue
        }
        const cards = []
        const evt = trigger.getl(current)
        if (!evt?.cards2) {
          continue
        }
        const cardsx = evt.cards2.filterInD("d")
        cards.addArray(cardsx)
        if (cards.length) {
          targets.push(current)
          cardsList.push(cards)
        }
      }
      while (targets.length) {
        const target = targets.shift()
        let cards = cardsList.shift()
        const result = await player
          .chooseButton(2, [
            get.prompt("olguzheng", target),
            '<span class="text center">被选择的牌将成为对方收回的牌</span>',
            cards,
            [["获得剩余的牌", "放弃剩余的牌"], "tdnodes"],
          ])
          .set("filterButton", (button) => {
            const type = typeof button.link
            if (
              ui.selected.buttons.length &&
              type === typeof ui.selected.buttons[0].link
            ) {
              return false
            }
            return true
          })
          .set("check", lib.skill.olguzheng.checkx(trigger, player, cards))
          .set("ai", (button) => {
            if (typeof button.link === "string") {
              return button.link === "获得剩余的牌" ? 1 : 0
            }
            if (_status.event.check) {
              return (
                20 - get.value(button.link, _status.event.getTrigger().player)
              )
            }
            return 0
          })
          .setHiddenSkill("olguzheng")
          .forResult()
        if (result?.links) {
          player.logSkill("olguzheng", target)
          const links = result.links
          player.addTempSkill("olguzheng_used", [
            "phaseZhunbeiAfter",
            "phaseDrawAfter",
            "phaseJudgeAfter",
            "phaseUseAfter",
            "phaseDiscardAfter",
            "phaseJieshuAfter",
          ])
          if (typeof links[0] !== "string") {
            links.reverse()
          }
          const card = links[1]
          await target.gain(card, "gain2")
          cards.remove(card)
          cards = cards.filterInD("d")
          if (cards.length > 0 && links[0] === "获得剩余的牌") {
            await player.gain(cards, "gain2")
          }
          break
        }
      }
    },
    ai: {
      threaten: 1.3,
      expose: 0.2,
    },
    subSkill: {
      used: {
        charlotte: true,
      },
    },
  },
  // 界左慈
  // 化身
  olhuashen: {
    unique: true,
    audio: 2,
    trigger: {
      global: "phaseBefore",
      player: ["enterGame", "phaseBegin", "phaseEnd"],
    },
    filter(event, player, name) {
      if (event.name !== "phase") {
        return true
      }
      if (name === "phaseBefore") {
        return game.phaseNumber === 0
      }
      return player.storage.olhuashen?.character?.length > 0
    },
    async cost(event, trigger, player) {
      if (trigger.name !== "phase" || event.triggername === "phaseBefore") {
        event.result = { bool: true, cost_data: ["更改亮出的“化身”牌"] }
        return
      }
      const prompt = `###${get.prompt(event.skill)}###<div class="text center">更改亮出的“化身”牌或替换至多两张未亮出的“化身”牌</div>`
      const result = await player
        .chooseControl("更改亮出的“化身”牌", "替换未亮出的“化身”牌", "cancel2")
        .set("ai", () => {
          const { player, cond } = get.event()
          const skills = player.storage.olhuashen.character.flatMap(
            (i) => get.character(i).skills,
          )
          skills.randomSort()
          skills.sort((a, b) => get.skillRank(b, cond) - get.skillRank(a, cond))
          if (
            skills[0] === player.storage.olhuashen.current2 ||
            get.skillRank(skills[0], cond) < 1
          ) {
            return "替换未亮出的“化身”牌"
          }
          return "更改亮出的“化身”牌"
        })
        .set("cond", event.triggername)
        .set("prompt", prompt)
        .forResult()
      const control = result.control
      event.result = {
        bool: typeof control === "string" && control !== "cancel2",
        cost_data: control,
      }
    },
    async content(event, trigger, player) {
      let choice = event.cost_data
      if (Array.isArray(choice)) {
        lib.skill.olhuashen.addHuashens(player, 3)
        ;[choice] = choice
      }
      _status.noclearcountdown = true
      const id = lib.status.videoId++,
        prompt =
          choice === "更改亮出的“化身”牌"
            ? "化身：请选择你要更改亮出的“化身”牌"
            : "化身：选择移去至多两张未亮出的“化身”牌，然后获得等量新的“化身”牌"
      const cards = player.storage.olhuashen.character
      if (player.isOnline2()) {
        player.send(
          (cards, prompt, id) => {
            const dialog = ui.create.dialog(prompt, [
              cards,
              lib.skill.huashen.$createButton,
            ])
            dialog.videoId = id
          },
          cards,
          prompt,
          id,
        )
      }
      const dialog = ui.create.dialog(prompt, [
        cards,
        lib.skill.huashen.$createButton,
      ])
      dialog.videoId = id
      if (!event.isMine()) {
        dialog.style.display = "none"
      }
      if (choice === "更改亮出的“化身”牌") {
        const buttons = dialog.content.querySelector(".buttons")
        const array = dialog.buttons.filter(
          (item) =>
            !item.classList.contains("nodisplay") &&
            item.style.display !== "none",
        )
        const choosed = player.storage.olhuashen.choosed
        const groups = array
          .map((i) => get.character(i.link).group)
          .unique()
          .sort((a, b) => {
            const getNum = (g) =>
              lib.group.includes(g) ? lib.group.indexOf(g) : lib.group.length
            return getNum(a) - getNum(b)
          })
        if (choosed.length > 0 || groups.length > 1) {
          dialog.style.bottom = `${parseInt(dialog.style.top || "0", 10) + get.is.phoneLayout() ? 230 : 220}px`
          dialog.addPagination({
            data: array,
            totalPageCount: groups.length + Math.sign(choosed.length),
            container: dialog.content,
            insertAfter: buttons,
            onPageChange(state) {
              const { pageNumber, data, pageElement } = state
              const { groups, choosed } = pageElement
              data.forEach((item) => {
                item.classList[
                  (() => {
                    const name = item.link,
                      goon = choosed.length > 0
                    if (goon && pageNumber === 1) {
                      return choosed.includes(name)
                    }
                    const group = get.character(name).group
                    return groups.indexOf(group) + (1 + goon) === pageNumber
                  })()
                    ? "remove"
                    : "add"
                ]("nodisplay")
              })
              ui.update()
            },
            pageLimitForCN: ["←", "→"],
            pageNumberForCN: (choosed.length > 0 ? ["常用"] : []).concat(
              groups.map((i) => {
                const isChineseChar = (char) => {
                  const regex =
                    /[\u4e00-\u9fff\u3400-\u4dbf\ud840-\ud86f\udc00-\udfff\ud870-\ud87f\udc00-\udfff\ud880-\ud88f\udc00-\udfff\ud890-\ud8af\udc00-\udfff\ud8b0-\ud8bf\udc00-\udfff\ud8c0-\ud8df\udc00-\udfff\ud8e0-\ud8ff\udc00-\udfff\ud900-\ud91f\udc00-\udfff\ud920-\ud93f\udc00-\udfff\ud940-\ud97f\udc00-\udfff\ud980-\ud9bf\udc00-\udfff\ud9c0-\ud9ff\udc00-\udfff]/u
                  return regex.test(char)
                } //友情提醒：regex为基本汉字区间到扩展G区的Unicode范围的正则表达式，非加密/混淆
                const str = get.plainText(
                  lib.translate[`${i}2`] || lib.translate[i] || "无",
                )
                return isChineseChar(str.slice(0, 1)) ? str.slice(0, 1) : str
              }),
            ),
            changePageEvent: "click",
            pageElement: {
              groups: groups,
              choosed: choosed,
            },
          })
        }
      }
      const finish = () => {
        if (player.isOnline2()) {
          player.send("closeDialog", id)
        }
        dialog.close()
        delete _status.noclearcountdown
        if (!_status.noclearcountdown) {
          game.stopCountChoose()
        }
      }
      while (true) {
        const next = player.chooseButton(true).set("dialog", id)
        if (choice === "替换未亮出的“化身”牌") {
          next.set("selectButton", [1, 2])
          next.set(
            "filterButton",
            (button) => button.link !== get.event().current,
          )
          next.set("current", player.storage.olhuashen.current)
        } else {
          next.set("ai", (button) => {
            const { player, cond } = get.event()
            const skills = player.storage.olhuashen.character.flatMap(
              (i) => get.character(i).skills,
            )
            skills.randomSort()
            skills.sort(
              (a, b) => get.skillRank(b, cond) - get.skillRank(a, cond),
            )
            return player.storage.olhuashen.map[button.link].includes(skills[0])
              ? 2.5
              : 1 + Math.random()
          })
          next.set("cond", event.triggername)
        }
        const result = await next.forResult()
        if (choice === "替换未亮出的“化身”牌") {
          finish()
          lib.skill.olhuashen.removeHuashen(player, result.links)
          lib.skill.olhuashen.addHuashens(player, result.links.length)
          return
        }
        const card = result.links[0]
        const func = (card, id) => {
          const dialog = get.idDialog(id)
          if (dialog) {
            //禁止翻页
            const paginationInstance = dialog.paginationMap?.get(
              dialog.content.querySelector(".buttons"),
            )
            if (paginationInstance?.state) {
              paginationInstance.state.pageRefuseChanged = true
            }
            for (let i = 0; i < dialog.buttons.length; i++) {
              if (dialog.buttons[i].link === card) {
                dialog.buttons[i].classList.add("selectedx")
              } else {
                dialog.buttons[i].classList.add("unselectable")
              }
            }
          }
        }
        if (player.isOnline2()) {
          player.send(func, card, id)
        } else if (event.isMine()) {
          func(card, id)
        }
        const result2 = await player
          .chooseControl(player.storage.olhuashen.map[card], "返回")
          .set("ai", () => {
            const { player, cond, controls } = get.event()
            const skills = controls.slice()
            skills.randomSort()
            skills.sort(
              (a, b) => get.skillRank(b, cond) - get.skillRank(a, cond),
            )
            return skills[0]
          })
          .set("cond", event.triggername)
          .forResult()
        const control = result2.control
        if (control === "返回") {
          const func2 = (card, id) => {
            const dialog = get.idDialog(id)
            if (dialog) {
              //允许翻页
              const paginationInstance = dialog.paginationMap?.get(
                dialog.content.querySelector(".buttons"),
              )
              if (paginationInstance?.state) {
                paginationInstance.state.pageRefuseChanged = false
              }
              for (let i = 0; i < dialog.buttons.length; i++) {
                dialog.buttons[i].classList.remove("selectedx")
                dialog.buttons[i].classList.remove("unselectable")
              }
            }
          }
          if (player.isOnline2()) {
            player.send(func2, card, id)
          } else if (event.isMine()) {
            func2(card, id)
          }
        } else {
          finish()
          player.storage.olhuashen.choosed.add(card)
          if (player.storage.olhuashen.current !== card) {
            const old = player.storage.olhuashen.current
            player.storage.olhuashen.current = card
            game.broadcastAll(
              (player, character, old) => {
                player.tempname.remove(old)
                player.tempname.add(character)
                player.sex = lib.character[character][0]
              },
              player,
              card,
              old,
            )
            game.log(
              player,
              "将性别变为了",
              `#y${get.translation(get.character(card).sex)}性`,
            )
            player.changeGroup(get.character(card).group)
          }
          player.storage.olhuashen.current2 = control
          if (!player.additionalSkills.olhuashen?.includes(control)) {
            player.flashAvatar("olhuashen", card)
            player.syncStorage("olhuashen")
            player.updateMarks("olhuashen")
            await player.addAdditionalSkills("olhuashen", control)
            // lib.skill.olhuashen.createAudio(card,link,'re_zuoci');
          }
          return
        }
      }
    },
    init(player, skill) {
      if (!player.storage[skill]) {
        player.storage[skill] = {
          character: [],
          choosed: [],
          map: {},
        }
      }
    },
    addHuashen(player) {
      if (!player.storage.olhuashen) {
        return
      }
      if (!_status.characterlist) {
        game.initCharacterList()
      }
      _status.characterlist.randomSort()
      for (let i = 0; i < _status.characterlist.length; i++) {
        const name = _status.characterlist[i]
        if (
          name.indexOf("zuoci") !== -1 ||
          name.indexOf("key_") === 0 ||
          name.indexOf("sp_key_") === 0 ||
          get.is.double(name) ||
          lib.skill.huashen.banned.includes(name) ||
          player.storage.olhuashen.character.includes(name)
        ) {
          continue
        }
        const skills = lib.character[name][3].filter((skill) => {
          const categories = get.skillCategoriesOf(skill, player)
          return !categories.some((type) =>
            lib.skill.huashen.bannedType.includes(type),
          )
        })
        if (skills.length) {
          player.storage.olhuashen.character.push(name)
          player.storage.olhuashen.map[name] = skills
          _status.characterlist.remove(name)
          return name
        }
      }
    },
    addHuashens(player, num) {
      var list = []
      for (var i = 0; i < num; i++) {
        var name = lib.skill.olhuashen.addHuashen(player)
        if (name) {
          list.push(name)
        }
      }
      if (list.length) {
        player.syncStorage("olhuashen")
        player.updateMarks("olhuashen")
        game.log(player, "获得了", `${get.cnNumber(list.length)}张`, "#g化身")
        lib.skill.huashen.drawCharacter(player, list)
      }
    },
    removeHuashen(player, links) {
      player.storage.olhuashen.character.removeArray(links)
      _status.characterlist.addArray(links)
      game.log(player, "移去了", `${get.cnNumber(links.length)}张`, "#g化身")
    },
    mark: true,
    intro: {
      onunmark(storage, player) {
        _status.characterlist.addArray(storage.character)
        storage.character = []
        const name = player.name ? player.name : player.name1
        if (name) {
          const sex = get.character(name).sex
          const group = get.character(name).group
          if (player.sex !== sex) {
            game.broadcastAll(
              (player, sex) => {
                player.sex = sex
              },
              player,
              sex,
            )
            game.log(player, "将性别变为了", `#y${get.translation(sex)}性`)
          }
          if (player.group !== group) {
            game.broadcastAll(
              (player, group) => {
                player.group = group
                player.node.name.dataset.nature = get.groupnature(group)
              },
              player,
              group,
            )
            game.log(player, "将势力变为了", `#y${get.translation(group + 2)}`)
          }
        }
      },
      mark(dialog, storage, player) {
        if (storage?.current) {
          dialog.addSmall([
            [storage.current],
            (item, type, position, noclick, node) =>
              lib.skill.huashen.$createButton(
                item,
                type,
                position,
                noclick,
                node,
              ),
          ])
        }
        if (storage?.current2) {
          dialog.add(
            `<div><div class="skill">【${get.translation(lib.translate[`${storage.current2}_ab`] || get.translation(storage.current2).slice(0, 2))}】</div><div>${get.skillInfoTranslation(storage.current2, player, false)}</div></div>`,
          )
        }
        if (storage?.character.length) {
          if (player.isUnderControl(true)) {
            dialog.addSmall([
              storage.character,
              (item, type, position, noclick, node) =>
                lib.skill.huashen.$createButton(
                  item,
                  type,
                  position,
                  noclick,
                  node,
                ),
            ])
          } else {
            dialog.addText(
              `共有${get.cnNumber(storage.character.length)}张“化身”牌`,
            )
          }
        } else {
          return "没有“化身”牌"
        }
      },
      content(storage, player) {
        return `共有${get.cnNumber(storage.character.length)}张“化身”牌`
      },
      markcount(storage, player) {
        if (storage?.character) {
          return storage.character.length
        }
        return 0
      },
    },
  },
  // 新生
  olxinsheng: {
    inherit: "xinsheng",
    async content(event, trigger, player) {
      lib.skill.olhuashen.addHuashens(player, 1)
    },
    ai: { combo: "olhuashen" },
  },
  // 界蔡文姬
  // 悲歌
  olbeige: {
    audio: 2,
    trigger: { global: "damageEnd" },
    logTarget: "player",
    filter(event, player) {
      return (
        event.card &&
        event.card.name === "sha" &&
        event.player.isIn() &&
        player.countCards("he") > 0
      )
    },
    check(event, player) {
      let att = get.attitude(player, event.player)
      if (event.player.hasSkill("xinleiji")) {
        return att > 0
      }
      if (att > 0 || event.player.isHealthy()) {
        return true
      }
      if (!event.source) {
        return true
      }
      att = get.attitude(player, event.source)
      return att <= 0 || event.source.isTurnedOver()
    },
    prompt2: "令其进行判定，然后你可以弃置一张牌，根据结果执行对应效果。",
    async content(event, trigger, player) {
      const target = trigger.player
      const source = trigger.source
      let result

      // step 0
      result = await trigger.player.judge().forResult()

      // step 1
      const judgeResult = get.copy(result)
      let str = "是否弃置一张牌",
        strt = get.translation(target),
        strs = get.translation(source),
        goon = 0
      switch (result.suit) {
        case "heart":
          if (target.isIn() && target.isDamaged()) {
            str += `，令${strt}回复1点体力`
            goon = get.recoverEffect(target, player, player)
          }
          break
        case "diamond":
          if (target.isIn()) {
            str += `，令${strt}摸两张牌`
            goon = 2 * get.effect(target, { name: "draw" }, player, player)
          }
          break
        case "spade":
          if (source?.isIn()) {
            str += `，令${strs}翻${source.isTurnedOver() ? "回正" : ""}面`
            goon =
              get.attitude(player, source) * (source.isTurnedOver() ? 2 : -2)
          }
          break
        case "club":
          if (source?.isIn()) {
            str += `，令${strs}弃置两张牌`
            var cards = source
              .getCards("he")
              .sort((a, b) => get.value(a, source) - get.value(b, source))
              .slice(0, 2)
            for (var i of cards) {
              goon += get.value(i, source)
            }
            goon *= -get.sgn(get.attitude(player, source))
          }
          break
      }
      str += "？"
      var str2 = `若弃置点数为${get.strNumber(result.number)}的牌则获得你弃置的牌`
      if (get.position(result.card, true) === "d") {
        str2 += `；若弃置花色为${get.translation(result.suit)}的牌则获得${get.translation(result.card)}`
      }
      result = await player
        .chooseToDiscard({
          position: "he",
          prompt: str,
          prompt2: str2,
        })
        .set("goon", goon)
        .set("ai", (card) => {
          const { result, goon, player } = get.event()
          let eff = Math.min(7, goon)
          if (eff <= 0) {
            return 0
          }
          if (get.suit(card, player) === result.suit) {
            eff += get.value(result.card, player)
          }
          if (get.number(card, player) === result.number) {
            return eff
          }
          return eff - get.value(card)
        })
        .set("result", judgeResult)
        .forResult()

      // step 2
      if (result.bool) {
        const card = result.cards[0]
        switch (judgeResult.suit) {
          case "heart":
            if (target.isIn() && target.isDamaged()) {
              await target.recover().forResult()
            }
            break
          case "diamond":
            if (target.isIn()) {
              await target.draw(2).forResult()
            }
            break
          case "spade":
            if (source?.isIn()) {
              await source.turnOver().forResult()
            }
            player.addExpose(0.1)
            break
          case "club":
            if (source?.isIn() && source.countCards("he") > 0) {
              await source.chooseToDiscard(2, "he", true).forResult()
            }
            player.addExpose(0.1)
            break
        }

        // step 3
        var gains = []
        if (
          get.position(judgeResult.card, true) === "d" &&
          get.suit(card, player) === judgeResult.suit
        ) {
          gains.push(judgeResult.card)
        }
        if (
          get.position(card, true) === "d" &&
          get.number(card, player) === judgeResult.number
        ) {
          gains.push(card)
        }
        if (gains.length) {
          player.gain(gains, "gain2")
        }
      }
    },
  },
  // 神司马懿
  // 忍戒
  olrenjie: {
    audio: "renjie",
    trigger: { player: "damageEnd" },
    forced: true,
    group: "olrenjie2",
    filter(event) {
      return event.num > 0
    },
    async content(event, trigger, player) {
      player.addMark("olrenjie", trigger.num)
    },
    intro: {
      name2: "忍",
      content: "mark",
    },
    marktext: "忍",
    ai: {
      maixie: true,
      maixie_hp: true,
      combo: "oljilue",
      effect: {
        target(card, player, target) {
          if (
            (!target.hasSkill("olbaiyin") && !target.hasSkill("oljilue")) ||
            !target.hasFriend()
          ) {
            return
          }
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -2]
          }
          if (get.tag(card, "damage")) {
            if (target.isHealthy() && target.getHp() > 2) {
              if (!target.hasSkill("oljilue")) {
                return [0, 1]
              }
              return [0.7, 1]
            }
            return 0.7
          }
        },
      },
    },
  },
  olrenjie2: {
    audio: "renjie",
    mod: {
      aiOrder: (player, card, num) => {
        if (
          num <= 0 ||
          typeof card !== "object" ||
          !player.isPhaseUsing() ||
          player.isDying()
        ) {
          return num
        }
        if (player.hasSkill("olbaiyin")) {
          if (
            player.countMark("olrenjie") < 4 &&
            player.getUseValue(card) < Math.min(4, (player.hp * player.hp) / 4)
          ) {
            return 0
          }
        } else if (player.hasSkill("oljilue")) {
          if (
            player.countMark("olrenjie") < 3 &&
            player.getUseValue(card) <
              Math.min(1.8, 0.18 * player.hp * player.hp)
          ) {
            return 0
          }
        }
      },
    },
    trigger: {
      player: "loseAfter",
      global: "loseAsyncAfter",
    },
    forced: true,
    sourceSkill: "olrenjie",
    filter(event, player) {
      if (event.type !== "discard" || event.getlx === false) {
        return false
      }
      var evt = event.getParent("phaseDiscard"),
        evt2 = event.getl(player)
      return (
        evt &&
        evt2 &&
        evt.name === "phaseDiscard" &&
        evt.player === player &&
        evt2.cards2 &&
        evt2.cards2.length > 0
      )
    },
    async content(event, trigger, player) {
      player.addMark("olrenjie", trigger.getl(player).cards2.length)
    },
  },
  // 拜印
  olbaiyin: {
    skillAnimation: "epic",
    animationColor: "thunder",
    juexingji: true,
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    audio: "sbaiyin",
    filter(event, player) {
      return player.countMark("olrenjie") >= 4
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.loseMaxHp()
      await player.addSkills("oljilue")
    },
    derivation: [
      "oljilue",
      "oljilue_guicai",
      "oljilue_fangzhu",
      "oljilue_jizhi",
      "oljilue_zhiheng",
      "oljilue_wansha",
    ],
    ai: { combo: "olrenjie" },
  },
  // 极略
  oljilue: {
    audio: "jilue",
    group: [
      "oljilue_guicai",
      "oljilue_fangzhu",
      "oljilue_jizhi",
      "oljilue_zhiheng",
      "oljilue_wansha",
    ],
    ai: { combo: "olrenjie" },
  },
  oljilue_guicai: {
    audio: "jilue_guicai",
    trigger: { global: "judge" },
    filter(event, player) {
      return player.countCards("hes") > 0 && player.hasMark("olrenjie")
    },
    async cost(event, trigger, player) {
      const next = player.chooseCard(
        "是否弃1枚“忍”，发动〖鬼才〗？",
        "hes",
        filterCard,
      )
      next.set("ai", processAI)

      event.result = await next.forResult()

      return

      /**
       * @param {Card} card
       * @returns {boolean}
       */
      function filterCard(card) {
        const player = get.player()
        const mod2 = game.checkMod(
          card,
          player,
          "unchanged",
          "cardEnabled2",
          player,
        )
        if (mod2 !== "unchanged") {
          return mod2
        }
        const mod = game.checkMod(
          card,
          player,
          "unchanged",
          "cardRespondable",
          player,
        )
        if (mod !== "unchanged") {
          return mod
        }
        return true
      }

      /**
       * @param {Card} card
       * @returns {number}
       */
      function processAI(card) {
        const trigger = get.event().parent._trigger
        const player = get.event().player
        const result =
          trigger.judge(card) - trigger.judge(trigger.player.judging[0])
        const attitude = get.attitude(player, trigger.player)
        let val = get.value(card)
        if (get.subtype(card) === "equip2") {
          val /= 2
        } else {
          val /= 4
        }
        if (attitude === 0 || result === 0) {
          return 0
        }
        if (attitude > 0) {
          return result - val
        }
        return -result - val
      }
    },
    async content(event, trigger, player) {
      const { cards } = event
      const [card] = cards
      player.removeMark("olrenjie", 1)
      await player.respond(cards, "highlight", "noOrdering")
      if (trigger.player.judging[0].clone) {
        trigger.player.judging[0].clone.delete()
        game.addVideo(
          "deletenode",
          player,
          get.cardsInfo([trigger.player.judging[0].clone]),
        )
      }
      await game.cardsDiscard(trigger.player.judging[0])
      trigger.player.judging[0] = card
      trigger.orderingCards.addArray(cards)
      game.log(trigger.player, "的判定牌改为", card)
      await game.delay(2)
    },
    ai: {
      rejudge: true,
      tag: {
        rejudge: 1,
      },
    },
  },
  oljilue_fangzhu: {
    audio: "jilue_fangzhu",
    trigger: { player: "damageEnd" },
    //priority:-1,
    filter(event, player) {
      return player.hasMark("olrenjie")
    },
    async cost(event, trigger, player) {
      const next = player.chooseTarget(
        "是否弃1枚“忍”，发动【放逐】？",
        (card, player, target) => player !== target,
      )
      next.set("ai", processAI)

      event.result = await next.forResult()

      return

      /**
       * @param {Player} target
       * @returns {number}
       */
      function processAI(target) {
        if (target.hasSkillTag("noturn")) {
          return 0
        }
        var player = _status.event.player
        if (get.attitude(_status.event.player, target) === 0) {
          return 0
        }
        if (get.attitude(_status.event.player, target) > 0) {
          if (target.classList.contains("turnedover")) {
            return 1000 - target.countCards("h")
          }
          if (player.getDamagedHp() < 3) {
            return -1
          }
          return 100 - target.countCards("h")
        }
        if (target.classList.contains("turnedover")) {
          return -1
        }
        if (player.getDamagedHp() >= 3) {
          return -1
        }
        return 1 + target.countCards("h")
      }
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const { targets } = event
      const [target] = targets
      player.removeMark("olrenjie", 1)
      let result

      // step 1
      if (player.isHealthy()) {
        result = { bool: false }
      } else {
        const next2 = target.chooseToDiscard("he", player.getDamagedHp())
        next2.set("ai", (card) => {
          var player = _status.event.player
          if (
            player.isTurnedOver() ||
            _status.event.getTrigger().player.getDamagedHp() > 2
          ) {
            return -1
          }
          return player.hp * player.hp - get.value(card)
        })
        next2.set(
          "prompt",
          `弃置${get.cnNumber(player.getDamagedHp())}张牌并失去1点体力；或摸${get.cnNumber(player.getDamagedHp())}张牌并翻面。`,
        )
        result = await next2.forResult()
      }

      // step 2
      if (result.bool) {
        await target.loseHp()
      } else {
        if (player.isDamaged()) {
          await target.draw(player.getDamagedHp()).forResult()
        }
        await target.turnOver().forResult()
      }
    },
  },
  oljilue_jizhi: {
    audio: "jilue_jizhi",
    trigger: { player: "useCard" },
    filter(event, player) {
      return (
        get.type(event.card, "trick") === "trick" &&
        event.card.isCard &&
        player.hasMark("olrenjie")
      )
    },
    async content(event, trigger, player) {
      player.removeMark("olrenjie", 1)
      await player.draw("nodelay")

      if (
        !player.hasCards("h", (card) => {
          return (
            get.type(card) === "basic" &&
            lib.filter.cardDiscardable(card, player)
          )
        })
      ) {
        return
      }

      const result = await player
        .chooseToDiscard({
          prompt: `是否弃置一张基本牌然后本回合你的手牌上限+1？`,
          filterCard(card, player) {
            return get.type(card) === "basic"
          },
          ai(card) {
            if (!_status.event.check) {
              return -1
            }
            return 6 - get.value(card, player)
          },
        })
        .set(
          "check",
          _status.currentPhase === player && player.needsToDiscard(-3),
        )
        .forResult()

      if (result.bool) {
        player.addTempSkill("oljilue_jizhi_clear")
        player.addMark("oljilue_jizhi_clear", 1, false)
      }
    },
    subSkill: {
      clear: {
        charlotte: true,
        onremove: true,
        mod: {
          maxHandcard(player, num) {
            return num + player.countMark("oljilue_jizhi_clear")
          },
        },
        intro: { content: "手牌上限+#" },
      },
    },
  },
  oljilue_zhiheng: {
    audio: "jilue_zhiheng",
    audioname2: {},
    inherit: "rezhiheng",
    filter(event, player) {
      return player.hasMark("olrenjie")
    },
    prompt:
      "弃1枚“忍”，弃置任意张牌，然后摸等量的牌。若你以此法弃置了所有手牌，则你多摸一张牌。",
    async content(event, trigger, player) {
      const { cards } = event

      player.removeMark("olrenjie", 1)
      const hs = player.getCards("h")
      const num =
        hs.length > 0 && hs.every((card) => cards.includes(card)) ? 1 : 0

      await player.discard({ cards })
      await player.draw(num + cards.length)
    },
    ai: {
      order(item, player) {
        if (
          player.hasCard((i) => get.value(i) > Math.max(6, 9 - player.hp), "he")
        ) {
          return 1
        }
        return 10
      },
      result: {
        player(player) {
          var num = 0
          var cards = player.getCards("he")
          for (var i = 0; i < cards.length; i++) {
            if (get.value(cards[i]) < 6) {
              num++
            }
          }
          if (cards.length > 2) {
            return 1
          }
          // if (cards.length == 2 && player.storage.oljilue > 1) {
          // }
          return 0
        },
      },
      nokeep: true,
      skillTagFilter(player, tag, arg) {
        if (tag === "nokeep") {
          return (
            player.isPhaseUsing() &&
            !player.getStat().skill.oljilue_zhiheng &&
            player.hasCard((card) => get.name(card) !== "tao", "h")
          )
        }
      },
    },
  },
  oljilue_wansha: {
    audio: "jilue_wansha",
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.hasMark("olrenjie")
    },
    async content(event, trigger, player) {
      player.removeMark("olrenjie", 1)
      player.addTempSkill("olwansha")
    },
    ai: {
      order: () => {
        const player = _status.event.player
        if (
          game.hasPlayer((current) => {
            if (
              player === current ||
              current.hp > 1 ||
              get.attitude(player, current) >= 0
            ) {
              return false
            }
            return (
              (player.inRange(current) &&
                player.countCards("hs", "sha") &&
                player.getCardUsable("sha")) ||
              player.countCards(
                "hs",
                (card) => get.name(card) !== "sha" && get.tag(card, "damage"),
              ) > 1
            )
          })
        ) {
          return 9.2
        }
        return 0
      },
      result: {
        player: 1,
      },
      effect: {
        player(card, player, target) {
          if (
            target &&
            player.hasSkill("olwansha") &&
            target.hp <= 1 &&
            get.tag(card, "damage")
          ) {
            return [1, 0, 1.5, -1.5]
          }
        },
      },
    },
  },
}

export default skills
