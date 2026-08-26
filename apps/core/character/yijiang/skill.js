import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 曹植
  // 落英
  luoying: {
    //unique:true,
    //gainable:true,
    audio: 2,
    group: ["luoying_discard", "luoying_judge"],
    subfrequent: ["judge"],
    subSkill: {
      discard: {
        audio: "luoying",
        trigger: { global: "loseAfter" },
        filter(event, player) {
          if (event.type !== "discard" || event.getlx === false) {
            return false
          }
          var cards = event.cards.slice(0)
          var evt = event.getl(player)
          if (evt?.cards) {
            cards.removeArray(evt.cards)
          }
          for (var i = 0; i < cards.length; i++) {
            if (
              cards[i].original !== "j" &&
              get.suit(cards[i], event.player) === "club" &&
              get.position(cards[i], true) === "d"
            ) {
              return true
            }
          }
          return false
        },
        async cost(event, trigger, player) {
          if (trigger.delay === false) {
            await game.delay()
          }
          const cards2 = trigger.cards.slice(0)
          const evt = trigger.getl(player)
          if (evt?.cards) {
            cards2.removeArray(evt.cards)
          }
          const cards = cards2.filter(
            (card) =>
              card.original !== "j" &&
              get.suit(card, trigger.player) === "club" &&
              get.position(card, true) === "d",
          )
          if (!cards.length) {
            return
          }

          event.result = await player
            .chooseButton({
              createDialog: ["落英：选择要获得的牌", cards],
              selectButton: [1, cards.length],
              ai(button) {
                return get.value(button.link, _status.event.player, "raw")
              },
            })
            .forResult()
          event.result.cards = event.result.links
        },
        async content(event, trigger, player) {
          await player.gain({
            cards: event.cards,
            animate: "gain2",
            log: true,
          })
        },
      },
      judge: {
        audio: "luoying",
        trigger: { global: "cardsDiscardAfter" },
        //frequent:'check',
        filter(event, player) {
          var evt = event.getParent().relatedEvent
          if (evt?.name !== "judge") {
            return
          }
          if (evt.player === player) {
            return false
          }
          if (get.position(event.cards[0], true) !== "d") {
            return false
          }
          return get.suit(event.cards[0]) === "club"
        },
        async cost(event, trigger, player) {
          const result = await player
            .chooseButton({
              createDialog: ["落英：选择要获得的牌", trigger.cards],
              selectButton: [1, trigger.cards.length],
              ai(button) {
                return get.value(button.link, _status.event.player, "raw")
              },
            })
            .forResult()

          event.result = {
            bool: result.bool,
            cards: result.links,
          }
        },
        async content(event, trigger, player) {
          await player.gain({
            cards: event.cards,
            animate: "gain2",
            log: true,
          })
        },
      },
    },
  },
  // 酒诗
  jiushi: {
    audio: 2,
    group: ["jiushi1", "jiushi3"],
  },
  jiushi1: {
    audio: "jiushi",
    enable: "chooseToUse",
    sourceSkill: "jiushi",
    hiddenCard(player, name) {
      if (name === "jiu") {
        return !player.isTurnedOver()
      }
      return false
    },
    filter(event, player) {
      if (player.classList.contains("turnedover")) {
        return false
      }
      return event.filterCard({ name: "jiu", isCard: true }, player, event)
    },
    async content(event, trigger, player) {
      if (_status.event.getParent(2).type === "dying") {
        event.dying = player
        event.type = "dying"
      }
      await player.turnOver()
      await player.useCard({ name: "jiu", isCard: true }, player)
    },
    ai: {
      save: true,
      skillTagFilter(player, tag, arg) {
        return !player.isTurnedOver() && _status.event?.dying === player
      },
      order: 5,
      result: {
        player(player) {
          if (_status.event.parent.name === "phaseUse") {
            if (player.countCards("h", "jiu") > 0) {
              return 0
            }
            if (player.getEquip("zhuge") && player.countCards("h", "sha") > 1) {
              return 0
            }
            if (!player.countCards("h", "sha")) {
              return 0
            }
            var targets = []
            var target
            var players = game.filterPlayer()
            for (var i = 0; i < players.length; i++) {
              if (get.attitude(player, players[i]) < 0) {
                if (player.canUse("sha", players[i], true, true)) {
                  targets.push(players[i])
                }
              }
            }
            if (targets.length) {
              target = targets[0]
            } else {
              return 0
            }
            var num = get.effect(target, { name: "sha" }, player, player)
            for (var i = 1; i < targets.length; i++) {
              var num2 = get.effect(targets[i], { name: "sha" }, player, player)
              if (num2 > num) {
                target = targets[i]
                num = num2
              }
            }
            if (num <= 0) {
              return 0
            }
            var e2 = target.getEquip(2)
            if (e2) {
              if (e2.name === "tengjia") {
                if (
                  !player.countCards("h", { name: "sha", nature: "fire" }) &&
                  !player.getEquip("zhuque")
                ) {
                  return 0
                }
              }
              if (e2.name === "renwang") {
                if (!player.countCards("h", { name: "sha", color: "red" })) {
                  return 0
                }
              }
              if (e2.name === "baiyin") {
                return 0
              }
            }
            if (player.getEquip("guanshi") && player.countCards("he") > 2) {
              return 1
            }
            return target.countCards("h") > 3 ? 0 : 1
          }
          if (player === _status.event.dying || player.isTurnedOver()) {
            return 3
          }
        },
      },
      effect: {
        target(card, player, target) {
          if (target.isTurnedOver()) {
            if (get.tag(card, "damage")) {
              if (player.hasSkillTag("jueqing", false, target)) {
                return [1, -2]
              }
              if (target.hp === 1) {
                return
              }
              return [1, target.countCards("h") / 2]
            }
          }
        },
      },
    },
  },
  jiushi3: {
    audio: "jiushi",
    trigger: { player: "damageEnd" },
    sourceSkill: "jiushi",
    check(event, player) {
      return player.isTurnedOver()
    },
    prompt: "是否发动【酒诗】，将武将牌翻面？",
    filter(event, player) {
      if (event.checkJiushi) {
        return true
      }
      return false
    },
    async content(event, trigger, player) {
      player.turnOver()
    },
  },
  // 于禁
  // 镇军
  zhenjun: {
    audio: 2,
    trigger: {
      player: "phaseUseBegin",
    },
    direct: true,
    filter(event, player) {
      return player.countCards("he") > 0
    },
    content() {
      "step 0"
      player.chooseCardTarget({
        filterCard: true,
        filterTarget: lib.filter.notMe,
        position: "he",
        prompt: get.prompt2("zhenjun"),
        ai1(card) {
          var player = _status.event.player
          if (card.name === "sha" && get.color(card) === "red") {
            for (var i = 0; i < game.players.length; i++) {
              var current = game.players[i]
              if (
                current !== player &&
                get.attitude(player, current) > 0 &&
                current.hasValueTarget(card)
              ) {
                return 7
              }
            }
            return 0
          }
          return 7 - get.value(card)
        },
        ai2(target) {
          var player = _status.event.player
          var card = ui.selected.cards[0]
          var att = get.attitude(player, target)
          if (get.value(card) < 0) {
            return -att * 2
          }
          if (
            target.countCards("h", { name: "sha", color: "red" }) ||
            target.hasSkill("wusheng") ||
            target.hasSkill("new_rewusheng") ||
            target.hasSkill("wushen") ||
            (card.name === "sha" &&
              get.color(card) === "red" &&
              target.hasValueTarget(card))
          ) {
            return att * 2
          }
          var eff = 0
          game.countPlayer((current) => {
            if (
              target !== current &&
              get.distance(target, current, "attack") > 1
            ) {
              return
            }
            var eff2 = get.damageEffect(current, player, player)
            if (eff2 > eff) {
              eff = eff2
            }
          })
          if (att > 0 && eff > 0) {
            eff += 2 * att
          }
          return eff
        },
      })
      ;("step 1")
      if (result.bool) {
        var target = result.targets[0]
        event.target = target
        player.logSkill("zhenjun", target)
        player.give(result.cards, target)
      } else {
        event.finish()
      }
      ;("step 2")
      target.chooseToUse({
        filterCard(card) {
          return (
            get.name(card) === "sha" &&
            get.color(card) !== "black" &&
            lib.filter.cardEnabled.apply(this, arguments)
          )
        },
        prompt: `请使用一张非黑色的【杀】，否则${get.translation(player)}可以对你或你攻击范围内的一名角色造成1点伤害`,
      })
      ;("step 3")
      if (result.bool) {
        var num = 1
        game.countPlayer2((current) => {
          current.getHistory("damage", (evt) => {
            if (evt.getParent(evt.notLink() ? 4 : 8) === event) {
              num += evt.num
            }
          })
        })
        player.draw(num)
        event.finish()
      } else {
        player
          .chooseTarget(
            `是否对${get.translation(target)}或其攻击范围内的一名角色造成1点伤害？`,
            (card, player, target) =>
              target === _status.event.targetx ||
              _status.event.targetx.inRange(target),
          )
          .set("targetx", event.target).ai = (target) => {
          var player = _status.event.player
          return get.damageEffect(target, player, player)
        }
      }
      ;("step 4")
      if (result.bool) {
        player.line(result.targets)
        result.targets[0].damage("nocard")
      }
    },
  },
  // 张春华
  // 绝情
  jueqing: {
    audio: 2,
    audioname: ["ol_zhangchunhua"],
    trigger: { source: "damageBefore" },
    forced: true,
    async content(event, trigger, player) {
      trigger.cancel()
      trigger.player.loseHp(trigger.num)
    },
    ai: {
      jueqing: true,
    },
  },
  // 伤逝
  shangshi: {
    audio: 2,
    audioname: ["ol_zhangchunhua"],
    audioname2: {
      re_zhangchunhua: "reshangshi",
    },
    trigger: {
      player: ["loseAfter", "changeHp", "gainMaxHpAfter", "loseMaxHpAfter"],
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    frequent: true,
    filter(event, player) {
      if (event.getl && !event.getl(player)) {
        return false
      }
      return player.countCards("h") < player.getDamagedHp()
    },
    async content(event, trigger, player) {
      player.draw(player.getDamagedHp() - player.countCards("h"))
    },
    ai: {
      noh: true,
      freeSha: true,
      freeShan: true,
      skillTagFilter(player, tag) {
        if (player.maxHp - player.hp < player.countCards("h")) {
          return false
        }
      },
    },
  },
  // 法正
  // 恩怨
  enyuan: {
    audio: 2,
    group: ["enyuan1", "enyuan2"],
  },
  enyuan1: {
    audio: true,
    sourceSkill: "enyuan",
    trigger: { player: "gainAfter", global: "loseAsyncAfter" },
    filter(event, player, triggername, target) {
      return target?.isIn()
    },
    getIndex(event, player) {
      return game
        .filterPlayer((current) => {
          if (current === player) {
            return false
          }
          return (
            event
              .getl?.(current)
              ?.cards2?.filter((card) => event.getg?.(player)?.includes(card))
              .length >= 2
          )
        })
        .sortBySeat()
    },
    logTarget: (event, player, triggername, target) => target,
    check(event, player, triggername, target) {
      return get.attitude(player, target) > 0
    },
    prompt2: (event, player, triggername, target) =>
      `令${get.translation(target)}摸一张牌`,
    async content(event, trigger, player) {
      await event.targets[0].draw()
    },
  },
  enyuan2: {
    audio: true,
    trigger: { player: "damageEnd" },
    sourceSkill: "enyuan",
    check(event, player) {
      const att = get.attitude(player, event.source)
      const num = event.source.countCards("h")
      if (att <= 0) {
        return true
      }
      if (num > 2) {
        return true
      }
      if (num) {
        return att < 4
      }
      return false
    },
    filter(event, player) {
      return event.source?.isIn() && event.source !== player && event.num > 0
    },
    logTarget: "source",
    prompt2(event, player) {
      return `令${get.translation(event.source)}交给你一张手牌或失去1点体力`
    },
    getIndex: (event) => event.num,
    async content(event, trigger, player) {
      const result = await trigger.source
        .chooseToGive(
          `恩怨：交给${get.translation(player)}一张手牌，或失去1点体力`,
          "h",
          player,
        )
        .set("ai", (card) => {
          const { player, target } = get.event()
          if (get.effect(player, { name: "losehp" }, player, player) >= 0) {
            return 0
          }
          if (get.attitude(target, player) > 0) {
            return 11 - get.value(card)
          }
          return 7 - get.value(card)
        })
        .forResult()
      if (!result?.bool) {
        await trigger.source.loseHp()
      }
    },
    ai: {
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -1.5]
          }
          if (!target.hasFriend()) {
            return
          }
          if (get.tag(card, "damage")) {
            return [1, 0, 0, -0.7]
          }
        },
      },
    },
  },
  // 眩惑
  xuanhuo: {
    audio: 2,
    trigger: {
      player: "phaseDrawBegin1",
    },
    filter(event, player) {
      return !event.numFixed
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt2("xuanhuo"),
          filterTarget(card, player, target) {
            return player !== target
          },
          ai(target) {
            const event = get.event()
            const player = get.player()

            let att = get.attitude(player, target)
            const count = target.countCards("h")
            if (att > 0) {
              if (count < target.hp) {
                att += 2
              }
              return att - count / 3
            }
            return -1
          },
        })
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      trigger.changeToZero()

      const target = event.targets[0]
      await target.draw(2)

      let noSha = true
      if (game.hasPlayer((current) => target.canUse("sha", current))) {
        let result = await player
          .chooseTarget({
            prompt: "选择出【杀】的目标",
            filterTarget(card, player, target) {
              const event = get.event()
              return event.target.canUse("sha", target)
            },
            forced: true,
            ai(target) {
              const event = get.event()
              return get.effect(
                target,
                { name: "sha" },
                event.target,
                event.player,
              )
            },
          })
          .set("target", target)
          .forResult()

        if (result.bool && result.targets?.length) {
          game.log(player, "指定的出【杀】目标为", result.targets)
          const target2 = result.targets[0]
          target.line(target2)
          result = await target
            .chooseToUse({
              prompt: `对${get.translation(result.targets)}使用一张【杀】，否则${get.translation(player)}获得你两张牌`,
              filterTarget(card, player, target) {
                return target === target2
              },
              selectTarget: -1,
              filterCard(card) {
                return card.name === "sha"
              },
            })
            .forResult()
          noSha = !result.bool
        }
      }

      if (noSha) {
        await player.gainPlayerCard({
          target,
          selectButton: Math.min(2, target.countCards("he")),
          position: "he",
          forced: true,
        })
      }
    },
    ai: {
      expose: 0.2,
    },
  },
  // 马谡
  // 散谣
  sanyao: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return target.isMaxHp()
    },
    filter(event, player) {
      return player.countCards("he") > 0
    },
    check(card) {
      return 7 - get.value(card)
    },
    position: "he",
    filterCard: true,
    async content(event, trigger, player) {
      const { target } = event
      target.damage("nocard")
    },
    ai: {
      result: {
        target(player, target) {
          if (target.countCards("j") && get.attitude(player, target) > 0) {
            return 1
          }
          if (target.countCards("e")) {
            return -1
          }
          return get.damageEffect(target, player)
        },
      },
      order: 7,
    },
  },
  // 制蛮
  zhiman: {
    audio: 2,
    trigger: { source: "damageBegin2" },
    check(event, player) {
      if (get.damageEffect(event.player, player, player) < 0) {
        return true
      }
      var att = get.attitude(player, event.player)
      if (att > 0 && event.player.countCards("j")) {
        return true
      }
      if (event.num > 1) {
        if (att < 0) {
          return false
        }
        if (att > 0) {
          return true
        }
      }
      var cards = event.player.getGainableCards(player, "e")
      for (var i = 0; i < cards.length; i++) {
        if (get.equipValue(cards[i]) >= 6) {
          return true
        }
      }
      return false
    },
    filter(event, player) {
      return player !== event.player
    },
    logTarget: "player",
    async content(event, trigger, player) {
      if (trigger.player.countGainableCards(player, "ej")) {
        player.gainPlayerCard(trigger.player, "ej", true)
      }
      trigger.cancel()
    },
  },
  // 徐庶
  // 无言
  wuyan: {
    audio: 2,
    trigger: { source: "damageBegin2", player: "damageBegin4" },
    forced: true,
    check(event, player) {
      if (player === event.player) {
        return true
      }
      return false
    },
    filter(event, player) {
      return get.type(event.card, "trick") === "trick"
    },
    async content(event, trigger, player) {
      trigger.cancel()
    },
    ai: {
      notrick: true,
      notricksource: true,
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "trick" && get.tag(card, "damage")) {
            return "zeroplayertarget"
          }
        },
        player(card, player, target, current) {
          if (get.type(card) === "trick" && get.tag(card, "damage")) {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 举荐
  jujian: {
    trigger: { player: "phaseJieshuBegin" },
    audio: 2,
    filter(event, player) {
      return (
        player.countCards("he") > player.countCards("he", { type: "basic" })
      )
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCardTarget({
          filterTarget(card, player, target) {
            return player !== target
          },
          filterCard(card, player) {
            return (
              get.type(card) !== "basic" &&
              lib.filter.cardDiscardable(card, player)
            )
          },
          ai1(card) {
            if (get.tag(card, "damage") && get.type(card) === "trick") {
              return 20
            }
            return 9 - get.value(card)
          },
          ai2(target) {
            var att = get.attitude(_status.event.player, target)
            if (att > 0) {
              if (target.isTurnedOver()) {
                att += 3
              }
              if (target.hp === 1) {
                att += 3
              }
            }
            return att
          },
          position: "he",
          prompt: get.prompt2("jujian"),
        })
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]

      await player.discard(event.cards)

      const controls = ["draw_card"]
      if (target.hp < target.maxHp) {
        controls.push("recover_hp")
      }
      if (target.isLinked() || target.isTurnedOver()) {
        controls.push("reset_character")
      }

      let result
      if (controls.length === 1) {
        result = { control: controls[0] }
      } else {
        result = await target
          .chooseControl({
            controls,
            ai() {
              const target = get.event().target
              if (target.isTurnedOver()) {
                return "reset_character"
              }
              if (target.hp === 1 && target.maxHp > 2) {
                return "recover_hp"
              }
              if (
                target.hp === 2 &&
                target.maxHp > 2 &&
                target.countCards("h") > 1
              ) {
                return "recover_hp"
              }
              return "draw_card"
            },
          })
          .set("target", target)
          .forResult()
      }

      switch (result.control) {
        case "recover_hp":
          await target.recover()
          break
        case "draw_card":
          await target.draw(2)
          break
        case "reset_character":
          if (target.isTurnedOver()) {
            await target.turnOver()
          }
          if (target.isLinked()) {
            await target.link()
          }
          break
      }
    },
    ai: {
      expose: 0.2,
      threaten: 1.4,
    },
  },
  // 凌统
  // 旋风
  xuanfeng: {
    audio: 2,
    trigger: {
      player: ["loseAfter", "phaseDiscardEnd"],
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    filter(event, player) {
      if (event.name === "phaseDiscard") {
        var cards = []
        player.getHistory("lose", (evt) => {
          if (
            evt &&
            evt.type === "discard" &&
            evt.getParent("phaseDiscard") === event &&
            evt.hs
          ) {
            cards.addArray(evt.hs)
          }
        })
        return cards.length > 1
      }
      var evt = event.getl(player)
      return evt?.es && evt.es.length > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt2("xuanfeng"),
          filterTarget(event, player, target) {
            return (
              player !== target &&
              target.countDiscardableCards(player, "he") > 0
            )
          },
          ai(target) {
            const player = get.player()
            return -get.attitude(player, target)
          },
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target1 = event.targets[0]
      player.line(target1, "green")
      await player.discardPlayerCard({
        target: target1,
        position: "he",
        forced: true,
      })

      const result = await player
        .chooseTarget({
          prompt: "旋风：弃置一名其他角色的一张牌",
          filterTarget(event, player, target) {
            return (
              player !== target &&
              target.countDiscardableCards(player, "he") > 0
            )
          },
          ai(target) {
            const player = get.player()
            return -get.attitude(player, target)
          },
        })
        .forResult()
      if (!result.bool || !result.targets?.length) {
        return
      }

      const target2 = result.targets[0]
      player.line(target2, "green")
      await player.discardPlayerCard({
        target: target2,
        position: "he",
        forced: true,
      })
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "equip" && !get.cardtag(card, "gifts")) {
            return [1, 3]
          }
        },
      },
      reverseEquip: true,
      noe: true,
    },
  },
  // 吴国太
  // 甘露
  ganlu: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    selectTarget: 2,
    filterTarget(card, player, target) {
      if (target.isMin()) {
        return false
      }
      if (ui.selected.targets.length === 0) {
        return true
      }
      if (
        ui.selected.targets[0].countCards("e") === 0 &&
        target.countCards("e") === 0
      ) {
        return false
      }
      return (
        Math.abs(
          ui.selected.targets[0].countCards("e") - target.countCards("e"),
        ) <=
        player.maxHp - player.hp
      )
    },
    multitarget: true,
    async content(event, trigger, player) {
      const { targets } = event
      targets[0].swapEquip(targets[1])
    },
    ai: {
      order: 10,
      threaten(player, target) {
        return 0.8 * Math.max(1 + target.maxHp - target.hp)
      },
      result: {
        target(player, target) {
          var list1 = []
          var list2 = []
          var num = player.maxHp - player.hp
          var players = game.filterPlayer()
          for (var i = 0; i < players.length; i++) {
            if (get.attitude(player, players[i]) > 0) {
              list1.push(players[i])
            } else if (get.attitude(player, players[i]) < 0) {
              list2.push(players[i])
            }
          }
          list1.sort((a, b) => a.countCards("e") - b.countCards("e"))
          list2.sort((a, b) => b.countCards("e") - a.countCards("e"))
          var delta
          for (var i = 0; i < list1.length; i++) {
            for (var j = 0; j < list2.length; j++) {
              delta = list2[j].countCards("e") - list1[i].countCards("e")
              if (delta <= 0) {
                continue
              }
              if (delta <= num) {
                if (target === list1[i] || target === list2[j]) {
                  return get.attitude(player, target)
                }
                return 0
              }
            }
          }
          return 0
        },
      },
      effect: {
        target(card, player, target) {
          if (target.hp === target.maxHp && get.tag(card, "damage")) {
            return 0.2
          }
        },
      },
    },
  },
  // 补益
  buyi: {
    trigger: { global: "dying" },
    //priority:6,
    audio: 2,
    filter(event, player) {
      return event.player.hp <= 0 && event.player.countCards("h") > 0
    },
    async cost(event, trigger, player) {
      let check
      if (trigger.player.isUnderControl(true, player)) {
        check = player.hasCard((card) => get.type(card) !== "basic")
      } else {
        check = get.attitude(player, trigger.player) > 0
      }

      event.result = await player
        .choosePlayerCard({
          prompt: get.prompt("buyi", trigger.player),
          target: trigger.player,
          filterButton(button) {
            if (_status.event.player === _status.event.target) {
              return lib.filter.cardDiscardable(
                button.link,
                _status.event.player,
              )
            }
            return true
          },
          position: "h",
          ai(button) {
            if (!_status.event.check) {
              return 0
            }
            if (
              _status.event.target.isUnderControl(true, _status.event.player)
            ) {
              if (get.type(button.link) !== "basic") {
                return 10 - get.value(button.link)
              }
              return 0
            }
            return Math.random()
          },
        })
        .set("check", check)
        .forResult()

      event.result.cards = event.result.links
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const card = event.cards[0]
      await player.showCards([card], `${get.translation(player)}展示的手牌`)
      if (get.type(card) !== "basic") {
        await trigger.player.discard(card)
        await trigger.player.recover()
      }
    },
    ai: {
      threaten: 1.4,
    },
  },
  // 徐盛
  // 破军
  pojun: {
    trigger: { player: "useCardToPlayered" },
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        player.isPhaseUsing() &&
        event.target.hp > 0 &&
        event.target.countCards("he") > 0
      )
    },
    audio: 2,
    async cost(event, trigger, player) {
      event.result = await player
        .choosePlayerCard({
          prompt: get.prompt("pojun", trigger.target),
          target: trigger.target,
          selectButton: [
            1,
            Math.min(trigger.target.countCards("he"), trigger.target.hp),
          ],
          allowChooseAll: true,
        })
        .set("forceAuto", true)
        .forResult()

      event.result.cards = event.result.links
    },
    logTarget(event) {
      return event?.target
    },
    async content(event, trigger, player) {
      const target = trigger.target
      await target.addToExpansion({
        cards: event.cards,
        source: target,
        animate: "giveAuto",
        gaintag: ["pojun2"],
      })
      target.addSkill("pojun2")
    },
    ai: {
      unequip_ai: true,
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (get.attitude(player, arg.target) > 0 || !player.isPhaseUsing()) {
          return false
        }
        if (tag === "directHit_ai") {
          return arg.target.hp >= Math.max(1, arg.target.countCards("h") - 1)
        }
        if (arg && arg.name === "sha" && arg.target.getEquip(2)) {
          return true
        }
        return false
      },
    },
  },
  pojun2: {
    trigger: { global: "phaseEnd" },
    forced: true,
    popup: false,
    charlotte: true,
    sourceSkill: "pojun",
    filter(event, player) {
      return player.getExpansions("pojun2").length > 0
    },
    async content(event, trigger, player) {
      const cards = player.getExpansions("pojun2")
      await player.gain({
        cards,
        animate: "draw",
      })
      game.log(player, `收回了${get.cnNumber(cards.length)}张“破军”牌`)
      player.removeSkill("pojun2")
    },
    intro: {
      markcount: "expansion",
      mark(dialog, storage, player) {
        var cards = player.getExpansions("pojun2")
        if (player.isUnderControl(true)) {
          dialog.addAuto(cards)
        } else {
          return `共有${get.cnNumber(cards.length)}张牌`
        }
      },
    },
  },
  // 陈宫
  // 明策
  mingce: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    position: "he",
    filterCard(card) {
      return get.name(card) === "sha" || get.type(card) === "equip"
    },
    filter(event, player) {
      return (
        player.countCards("h", "sha") > 0 ||
        player.countCards("he", { type: "equip" }) > 0
      )
    },
    check(card) {
      return 8 - get.value(card)
    },
    selectTarget: 2,
    multitarget: true,
    discard: false,
    lose: false,
    targetprompt: ["得到牌", "出杀目标"],
    filterTarget(card, player, target) {
      if (ui.selected.targets.length === 0) {
        return player !== target
      }
      return ui.selected.targets[0].inRange(target)
    },
    delay: false,
    async content(event, trigger, player) {
      const { cards, targets } = event
      await player.give(cards, targets[0], true)
      let result
      if (
        !lib.filter.filterTarget(
          { name: "sha", isCard: true },
          targets[0],
          targets[1],
        )
      ) {
        result = { control: "draw_card" }
      } else {
        result = await targets[0]
          .chooseControl({
            prompt: `对${get.translation(targets[1])}使用一张【杀】，或摸一张牌`,
            controls: ["draw_card", "出杀"],
            ai() {
              const { player, target } = get.event()
              if (
                get.effect(
                  _status.event.target,
                  { name: "sha" },
                  player,
                  player,
                ) > 0
              ) {
                return 1
              }
              return 0
            },
          })
          .set("target", targets[1])
          .forResult()
      }
      if (result.control === "draw_card") {
        await targets[0].draw()
      } else {
        await targets[0].useCard({
          card: get.autoViewAs({ name: "sha", isCard: true }),
          targets: [targets[1]],
        })
      }
    },
    ai: {
      result: {
        player(player) {
          var players = game.filterPlayer()
          for (var i = 0; i < players.length; i++) {
            if (
              players[i] !== player &&
              get.attitude(player, players[i]) > 1 &&
              get.attitude(players[i], player) > 1
            ) {
              return 1
            }
          }
          return 0
        },
        target(player, target) {
          if (ui.selected.targets.length) {
            return -0.1
          }
          return 1
        },
      },
      order: 8.5,
      expose: 0.2,
    },
  },
  // 智迟
  zhichi: {
    audio: 2,
    trigger: { player: "damageEnd" },
    forced: true,
    filter(event, player) {
      return _status.currentPhase !== player
    },
    async content(event, trigger, player) {
      player.addTempSkill("zhichi2", ["phaseAfter", "phaseBefore"])
    },
  },
  zhichi2: {
    audio: "zhichi",
    trigger: { target: "useCardToBefore" },
    forced: true,
    charlotte: true,
    priority: 15,
    sourceSkill: "zhichi",
    filter(event, player) {
      return get.type(event.card) === "trick" || event.card.name === "sha"
    },
    async content(event, trigger, player) {
      game.log(
        player,
        "发动了智迟，",
        trigger.card,
        "对",
        trigger.target,
        "失效",
      )
      trigger.cancel()
    },
    mark: true,
    intro: {
      content: "【杀】和普通锦囊牌对你无效",
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "trick" || card.name === "sha") {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 高顺
  // 陷阵
  xianzhen: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return player.canCompare(target)
    },
    filter(event, player) {
      return player.countCards("h") > 0
    },
    async content(event, trigger, player) {
      const { target } = event
      const result = await player.chooseToCompare(target).forResult()
      if (result.bool) {
        player.storage[event.name] = target
        player.addTempSkill(event.name + 2)
      } else {
        player.addTempSkill(event.name + 3)
      }
    },
    ai: {
      order(name, player) {
        var cards = player.getCards("h")
        if (player.countCards("h", "sha") === 0) {
          return 1
        }
        for (var i = 0; i < cards.length; i++) {
          if (
            cards[i].name !== "sha" &&
            get.number(cards[i]) > 11 &&
            get.value(cards[i]) < 7
          ) {
            return 9
          }
        }
        return get.order({ name: "sha" }) - 1
      },
      result: {
        player(player) {
          if (player.countCards("h", "sha") > 0) {
            return 0
          }
          var num = player.countCards("h")
          if (num > player.hp) {
            return 0
          }
          if (num === 1) {
            return -2
          }
          if (num === 2) {
            return -1
          }
          return -0.7
        },
        target(player, target) {
          var num = target.countCards("h")
          if (num === 1) {
            return -1
          }
          if (num === 2) {
            return -0.7
          }
          return -0.5
        },
      },
      threaten: 1.3,
    },
  },
  xianzhen2: {
    charlotte: true,
    mod: {
      targetInRange(card, player, target) {
        if (target === player.storage.xianzhen) {
          return true
        }
      },
      cardUsableTarget(card, player, target) {
        if (target === player.storage.xianzhen) {
          return true
        }
      },
    },
    ai: {
      unequip: true,
      skillTagFilter(player, tag, arg) {
        if (arg.target !== player.storage.xianzhen) {
          return false
        }
      },
    },
  },
  xianzhen3: {
    charlotte: true,
    mod: {
      cardEnabled(card) {
        if (card.name === "sha") {
          return false
        }
      },
    },
  },
  // 禁酒
  jinjiu: {
    mod: {
      cardname(card, player) {
        if (card.name === "jiu") {
          return "sha"
        }
      },
    },
    ai: {
      skillTagFilter(player) {
        if (!player.countCards("h", "jiu")) {
          return false
        }
      },
      respondSha: true,
    },
    audio: 2,
    trigger: { player: ["useCard1", "respond"] },
    firstDo: true,
    forced: true,
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        !event.skill &&
        event.cards.length === 1 &&
        event.cards[0].name === "jiu"
      )
    },
    async content(event, trigger, player) {},
  },
}

export default skills
