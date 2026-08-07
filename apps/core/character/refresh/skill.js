import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 界曹操
  // 奸雄
  rejianxiong: {
    audio: 2,
    trigger: { player: "damageEnd" },
    async content(event, trigger, player) {
      if (
        get.itemtype(trigger.cards) === "cards" &&
        get.position(trigger.cards[0], true) === "o"
      ) {
        await player.gain(trigger.cards, "gain2")
      }
      await player.draw("nodelay")
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -1]
          }
          if (get.tag(card, "damage") && player !== target) {
            var cards = card.cards,
              evt = _status.event
            if (
              evt.player === target &&
              card.name === "damage" &&
              evt.getParent().type === "card"
            ) {
              cards = evt.getParent().cards.filterInD()
            }
            if (target.hp <= 1) {
              return
            }
            if (get.itemtype(cards) !== "cards") {
              return
            }
            for (var i of cards) {
              if (get.name(i, target) === "tao") {
                return [1, 4.5]
              }
            }
            if (get.value(cards, target) >= 7 + target.getDamagedHp()) {
              return [1, 2.5]
            }
            return [1, 0.6]
          }
        },
      },
    },
  },
  // 界司马懿
  // 反馈
  refankui: {
    audio: 2,
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return (
        event.source?.countGainableCards(
          player,
          event.source !== player ? "he" : "e",
        ) && event.num > 0
      )
    },
    async cost(event, trigger, player) {
      event.result = await player
        .choosePlayerCard(
          get.prompt(event.skill, trigger.source),
          trigger.source,
          trigger.source !== player ? "he" : "e",
        )
        .set("ai", (button) => {
          const val = get.buttonValue(button)
          if (get.event().att > 0) {
            return 1 - val
          }
          return val
        })
        .set("att", get.attitude(player, trigger.source))
        .forResult()
    },
    logTarget: "source",
    getIndex(event, player) {
      return event.num
    },
    async content(event, trigger, player) {
      await player.gain(event.cards, trigger.source, "giveAuto", "bySelf")
    },
    ai: {
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (player.countCards("he") > 1 && get.tag(card, "damage")) {
            if (player.hasSkillTag("jueqing", false, target)) {
              return [1, -1.5]
            }
            if (get.attitude(target, player) < 0) {
              return [1, 1]
            }
          }
        },
      },
    },
  },
  // 鬼才
  reguicai: {
    audio: 2,
    trigger: { global: "judge" },
    filter(event, player) {
      return player.countCards("hes") > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCard(
          `${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`,
          "hes",
          (card) => {
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
          },
        )
        .set("ai", (card) => {
          const trigger = get.event().getTrigger()
          const { player, judging } = get.event()
          const result = trigger.judge(card) - trigger.judge(judging)
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
        })
        .set("judging", trigger.player.judging[0])
        .setHiddenSkill(event.skill)
        .forResult()
    },
    preHidden: true,
    popup: false,
    async content(event, trigger, player) {
      const next = player.respond(
        event.cards,
        event.name,
        "highlight",
        "noOrdering",
      )
      await next
      const { cards } = next
      if (cards?.length) {
        if (trigger.player.judging[0].clone) {
          trigger.player.judging[0].clone.classList.remove("thrownhighlight")
          game.broadcast((card) => {
            if (card.clone) {
              card.clone.classList.remove("thrownhighlight")
            }
          }, trigger.player.judging[0])
          game.addVideo(
            "deletenode",
            player,
            get.cardsInfo([trigger.player.judging[0].clone]),
          )
        }
        await game.cardsDiscard(trigger.player.judging[0])
        trigger.player.judging[0] = cards[0]
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
  // 界夏侯惇
  // 刚烈
  reganglie: {
    audio: 2,
    trigger: { player: "damageEnd" },
    getIndex(event, player, triggername) {
      if (get.mode() === "guozhan") {
        return 1
      }
      return event.num
    },
    filter(event) {
      return event.num > 0
    },
    check(event, player) {
      if (!event.source?.isIn()) {
        return Math.random() < 0.5
      }
      return get.attitude(player, event.source) <= 0
    },
    prompt2(event, player) {
      let str = "你可以进行判定"
      if (event.source?.isIn()) {
        str += `，若结果为：红色，你对${get.translation(event.source)}造成1点伤害；黑色，你弃置${get.translation(event.source)}一张牌。`
      } else {
        str += "。"
      }
      return str
    },
    preHidden: true,
    async content(event, trigger, player) {
      const { source } = trigger
      const result = await player
        .judge((card) => {
          if (get.color(card) === "red") {
            return 1
          }
          return 0
        })
        .forResult()
      if (!source?.isIn()) {
        return
      }
      switch (result?.color) {
        case "black":
          if (source.countDiscardableCards(player, "he")) {
            await player.discardPlayerCard(source, "he", true)
          }
          break

        case "red":
          await source.damage()
          break
        default:
          break
      }
    },
    ai: {
      maixie_defend: true,
      expose: 0.4,
    },
  },
  // 清俭
  qingjian: {
    audio: 2,
    trigger: {
      player: "gainAfter",
      global: "loseAsyncAfter",
    },
    usable: 1,
    filter(event, player) {
      const evt = event.getParent("phaseDraw")
      if (evt?.player === player) {
        return false
      }
      return event.getg(player).length > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCardTarget({
          position: "he",
          filterCard: true,
          selectCard: [1, Infinity],
          filterTarget: lib.filter.notMe,
          ai1(card) {
            const player = get.player()
            if (
              card.name !== "du" &&
              get.attitude(player, _status.currentPhase) < 0 &&
              _status.currentPhase?.needsToDiscard()
            ) {
              return -1
            }
            for (var i = 0; i < ui.selected.cards.length; i++) {
              if (
                get.type(ui.selected.cards[i]) === get.type(card) ||
                (ui.selected.cards[i].name === "du" && card.name !== "du")
              ) {
                return -1
              }
            }
            if (card.name === "du") {
              return 20
            }
            return player.countCards("h") - player.hp
          },
          allowChooseAll: true,
          ai2(target) {
            const player = get.player()
            if (get.attitude(player, _status.currentPhase) < 0) {
              return -1
            }
            const att = get.attitude(player, target)
            if (
              ui.selected.cards.length &&
              ui.selected.cards[0].name === "du"
            ) {
              if (target.hasSkillTag("nodu")) {
                return 0
              }
              return 1 - att
            }
            if (target.countCards("h") > player.countCards("h")) {
              return 0
            }
            return att - 4
          },
          prompt: get.prompt2(event.name.slice(0, -5)),
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
        cards,
      } = event
      await player.showCards(cards)
      await player.give(cards, target)
      const current = _status.currentPhase
      if (current?.isIn()) {
        current.addTempSkill("qingjian_add")
        current.addMark(
          "qingjian_add",
          cards.map((card) => get.type2(card)).toUniqued().length,
          false,
        )
      }
    },
    ai: { expose: 0.3 },
  },
  qingjian_add: {
    mark: true,
    intro: { content: "手牌上限+#" },
    mod: {
      maxHandcard(player, num) {
        return num + player.countMark("qingjian_add")
      },
    },
    charlotte: true,
    onremove: true,
  },
  // 界张辽
  // 突袭
  retuxi: {
    audio: 2,
    trigger: {
      player: "phaseDrawBegin2",
    },
    direct: true,
    preHidden: true,
    filter(event, player) {
      return (
        event.num > 0 &&
        !event.numFixed &&
        game.hasPlayer(
          (target) => target.countCards("h") > 0 && player !== target,
        )
      )
    },
    async content(event, trigger, player) {
      let result

      // step 0
      const num = get.copy(trigger.num)
      result = await player
        .chooseTarget(
          get.prompt("retuxi"),
          `少摸至多${get.translation(num)}张牌并获得等量其他角色的各一张手牌`,
          [1, num],
          (card, player, target) =>
            target.countCards("h") > 0 && player !== target,
        )
        .set("ai", (target) => {
          const att = get.attitude(_status.event.player, target)
          if (target.hasSkill("tuntian")) {
            return att / 10
          }
          return 1 - att
        })
        .setHiddenSkill("retuxi")
        .forResult()

      // step 1
      if (result.bool) {
        result.targets.sortBySeat()
        player.logSkill("retuxi", result.targets)
        await player.gainMultiple(result.targets)
        trigger.num -= result.targets.length
      } else {
        return
      }

      // step 2
      if (trigger.num <= 0) {
        await game.delay()
      }
    },
    ai: {
      threaten: 1.6,
      expose: 0.2,
    },
  },
  // 界许褚
  // 裸衣
  reluoyi: {
    audio: 2,
    trigger: {
      player: "phaseDrawBegin1",
    },
    forced: true,
    locked: false,
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
      const prompt = `是否放弃摸牌${cardsx.length ? `并获得${get.translation(cardsx)}` : ""}？`
      const result = await player
        .chooseBool(prompt)
        .set("choice", cardsx.length >= trigger.num)
        .forResult()

      if (result.bool) {
        if (cardsx.length) {
          await player.gain(cardsx, "gain2")
        }
        player.addTempSkill("reluoyi_buff", { player: "phaseBeforeStart" })
        trigger.changeToZero()
      }
    },
    subSkill: { buff: { inherit: "reluoyi2", sourceSkill: "reluoyi" } },
  },
  reluoyi2: {
    trigger: { source: "damageBegin1" },
    sourceSkill: "reluoyi",
    filter(event) {
      return (
        event.card &&
        (event.card.name === "sha" || event.card.name === "juedou") &&
        event.notLink()
      )
    },
    forced: true,
    charlotte: true,
    async content(event, trigger, player) {
      trigger.num++
    },
    ai: {
      damageBonus: true,
      skillTagFilter(player, tag, arg) {
        if (tag === "damageBonus") {
          return (
            arg?.card && (arg.card.name === "sha" || arg.card.name === "juedou")
          )
        }
      },
    },
  },
  // 界郭嘉
  // 遗计
  reyiji: {
    audio: 2,
    trigger: {
      player: "damageEnd",
    },
    frequent: true,
    filter(event) {
      return event.num > 0
    },
    getIndex(event, player, triggername) {
      return event.num
    },
    async content(event, trigger, player) {
      let result

      // step 0
      result = await player.draw(2).forResult()
      if (_status.connectMode) {
        game.broadcastAll(() => {
          _status.noclearcountdown = true
        })
      }
      event.given_map = {}
      event.num = 2

      // step 1..2 (loop until all cards assigned or player cancels)
      while (event.num > 0) {
        result = await player
          .chooseCardTarget({
            filterCard(card) {
              return (
                get.itemtype(card) === "card" && !card.hasGaintag("reyiji_tag")
              )
            },
            filterTarget: lib.filter.notMe,
            selectCard: [1, event.num],
            prompt: "将至多两张手牌交给其他角色",
            ai1(card) {
              return ui.selected.cards.length ? 0 : 1
            },
            ai2(target) {
              const player = _status.event.player
              const card = ui.selected.cards[0]
              const val = target.getUseValue(card)
              if (val > 0) return val * get.attitude(player, target) * 2
              return get.value(card, target) * get.attitude(player, target)
            },
          })
          .forResult()

        if (result.bool) {
          const res = result.cards
          const targetId = result.targets[0].playerid
          player.addGaintag(res, "reyiji_tag")
          event.num -= res.length
          if (!event.given_map[targetId]) event.given_map[targetId] = []
          event.given_map[targetId].addArray(res)
          // continue loop if still cards to give
          continue
        }

        // player cancelled at the very first choice -> cleanup and exit
        if (event.num === 2) {
          if (_status.connectMode) {
            game.broadcastAll(() => {
              delete _status.noclearcountdown
              game.stopCountChoose()
            })
          }
          return
        }
        // otherwise break and proceed to distribution
        break
      }

      // step 3 cleanup for connect mode
      if (_status.connectMode) {
        game.broadcastAll(() => {
          delete _status.noclearcountdown
          game.stopCountChoose()
        })
      }

      // prepare gain map & cards list
      const map = []
      const cards = []
      for (const id of Object.keys(event.given_map)) {
        const source = (_status.connectMode ? lib.playerOL : game.playerMap)[id]
        player.line(source, "green")
        if (
          player !== source &&
          (get.mode() !== "identity" || player.identity !== "nei")
        ) {
          player.addExpose(0.18)
        }
        map.push([source, event.given_map[id]])
        cards.addArray(event.given_map[id])
      }

      // perform the async give
      await game
        .loseAsync({
          gain_list: map,
          player,
          cards,
          giver: player,
          animate: "giveAuto",
        })
        .setContent("gaincardMultiple")
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage")) {
            if (player.hasSkillTag("jueqing", false, target)) {
              return [1, -2]
            }
            if (!target.hasFriend()) {
              return
            }
            let num = 1
            if (get.attitude(player, target) > 0) {
              if (player.needsToDiscard()) {
                num = 0.7
              } else {
                num = 0.5
              }
            }
            if (target.hp >= 4) {
              return [1, num * 2]
            }
            if (target.hp === 3) {
              return [1, num * 1.5]
            }
            if (target.hp === 2) {
              return [1, num * 0.5]
            }
          }
        },
      },
      threaten: 0.6,
    },
  },
  // 界甄姬
  // 倾国
  reqingguo: {
    mod: {
      aiValue(player, card, num) {
        if (get.name(card) !== "shan" && get.color(card) !== "black") {
          return
        }
        var cards = player.getCards(
          "hs",
          (card) => get.name(card) === "shan" || get.color(card) === "black",
        )
        cards.sort(
          (a, b) =>
            (get.name(b) === "shan" ? 1 : 2) - (get.name(a) === "shan" ? 1 : 2),
        )
        var geti = () => {
          if (cards.includes(card)) {
            return cards.indexOf(card)
          }
          return cards.length
        }
        if (get.name(card) === "shan") {
          return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6
        }
        return Math.max(num, [6.5, 4, 3][Math.min(geti(), 2)])
      },
      aiUseful() {
        return lib.skill.reqingguo.mod.aiValue.apply(this, arguments)
      },
    },
    locked: false,
    audio: 2,
    enable: ["chooseToRespond", "chooseToUse"],
    filterCard(card) {
      return get.color(card) === "black"
    },
    position: "hes",
    viewAs: { name: "shan" },
    viewAsFilter(player) {
      if (!player.countCards("hes", { color: "black" })) {
        return false
      }
    },
    prompt: "将一张黑色牌当【闪】使用或打出",
    check() {
      return 1
    },
    ai: {
      order: 2,
      respondShan: true,
      skillTagFilter(player) {
        if (!player.countCards("hes", { color: "black" })) {
          return false
        }
      },
      effect: {
        target(card, player, target, current) {
          if (get.tag(card, "respondShan") && current < 0) {
            return 0.6
          }
        },
      },
    },
  },
  // 界刘备
  // 仁德
  rerende: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return (
        player.countCards("h") &&
        game.hasPlayer((current) =>
          get.info("rerende").filterTarget(null, player, current),
        )
      )
    },
    filterTarget(card, player, target) {
      if (player === target) {
        return false
      }
      return !player.getStorage("rerende_targeted").includes(target)
    },
    filterCard: true,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    discard: false,
    lose: false,
    delay: false,
    check(card) {
      if (ui.selected.cards.length && ui.selected.cards[0].name === "du") {
        return 0
      }
      if (!ui.selected.cards.length && card.name === "du") {
        return 20
      }
      var player = get.owner(card)
      if (
        ui.selected.cards.length >=
        Math.max(2, player.countCards("h") - player.hp)
      ) {
        return 0
      }
      if (
        player.hp === player.maxHp ||
        player.countMark("rerende") < 0 ||
        player.countCards("h") <= 1
      ) {
        var players = game.filterPlayer()
        for (var i = 0; i < players.length; i++) {
          if (
            players[i].hasSkill("haoshi") &&
            !players[i].isTurnedOver() &&
            !players[i].hasJudge("lebu") &&
            get.attitude(player, players[i]) >= 3 &&
            get.attitude(players[i], player) >= 3
          ) {
            return 11 - get.value(card)
          }
        }
        if (player.countCards("h") > player.hp) {
          return 10 - get.value(card)
        }
        if (player.countCards("h") > 2) {
          return 6 - get.value(card)
        }
        return -1
      }
      return 10 - get.value(card)
    },
    async content(event, trigger, player) {
      const { target, cards, name } = event
      player.addTempSkill(`${name}_targeted`, "phaseUseAfter")
      player.markAuto(`${name}_targeted`, [target])
      let num = 0
      player.getHistory("lose", (evt) => {
        if (
          evt.getParent(2).name === name &&
          evt.getParent("phaseUse") === event.getParent(3)
        ) {
          num += evt.cards.length
        }
      })
      if (!player.storage[event.name]) {
        player.when({ player: "phaseUseEnd" }).step(async () => {
          player.clearMark(event.name, false)
        })
      }
      player.addMark(event.name, num + cards.length, false)
      await player.give(cards, target)
      const list = get.inpileVCardList((info) => {
        return (
          info[0] === "basic" &&
          player.hasUseTarget(
            new lib.element.VCard({
              name: info[2],
              nature: info[3],
              isCard: true,
            }),
            null,
            true,
          )
        )
      })
      if (num < 2 && num + cards.length > 1 && list.length) {
        const result = await player
          .chooseButton(["是否视为使用一张基本牌？", [list, "vcard"]])
          .set("ai", (button) => {
            return get.player().getUseValue({
              name: button.link[2],
              nature: button.link[3],
              isCard: true,
            })
          })
          .forResult()
        if (!result?.links?.length) {
          return
        }
        await player.chooseUseTarget(
          get.autoViewAs({
            name: result.links[0][2],
            nature: result.links[0][3],
            isCard: true,
          }),
          true,
        )
      }
    },
    ai: {
      fireAttack: true,
      order(skill, player) {
        if (
          player.hp < player.maxHp &&
          player.countMark("rerende") < 2 &&
          player.countCards("h") > 1
        ) {
          return 10
        }
        return 4
      },
      result: {
        target(player, target) {
          if (target.hasSkillTag("nogain")) {
            return 0
          }
          if (ui.selected.cards.length && ui.selected.cards[0].name === "du") {
            if (target.hasSkillTag("nodu")) {
              return 0
            }
            return -10
          }
          if (target.hasJudge("lebu")) {
            return 0
          }
          var nh = target.countCards("h")
          var np = player.countCards("h")
          if (
            player.hp === player.maxHp ||
            player.countMark("rerende") < 0 ||
            player.countCards("h") <= 1
          ) {
            if (nh >= np - 1 && np <= player.hp && !target.hasSkill("haoshi")) {
              return 0
            }
          }
          return Math.max(1, 5 - nh)
        },
      },
      effect: {
        target_use(card, player, target) {
          if (player === target && get.type(card) === "equip") {
            if (player.countCards("e", { subtype: get.subtype(card) })) {
              if (
                game.hasPlayer(
                  (current) =>
                    current !== player && get.attitude(player, current) > 0,
                )
              ) {
                return 0
              }
            }
          }
        },
      },
      threaten: 0.8,
    },
    marktext: "仁",
    onremove: true,
    intro: {
      content: "本阶段已仁德牌数：#",
      onunmark: true,
    },
    subSkill: {
      targeted: {
        onremove: true,
        charlotte: true,
      },
    },
  },
  // 界关羽
  // 武圣
  rewusheng: {
    mod: {
      targetInRange(card) {
        if (get.suit(card) === "diamond" && card.name === "sha") {
          return true
        }
      },
    },
    locked: false,
    audio: 2,
    enable: ["chooseToRespond", "chooseToUse"],
    filterCard(card, player) {
      if (get.zhu(player, "shouyue")) {
        return true
      }
      return get.color(card) === "red"
    },
    position: "hes",
    viewAs: {
      name: "sha",
    },
    viewAsFilter(player) {
      if (get.zhu(player, "shouyue")) {
        if (!player.countCards("hes")) {
          return false
        }
      } else {
        if (!player.countCards("hes", { color: "red" })) {
          return false
        }
      }
    },
    prompt: "将一张红色牌当【杀】使用或打出",
    check(card) {
      var val = get.value(card)
      if (_status.event.name === "chooseToRespond") {
        return 1 / Math.max(0.1, val)
      }
      return 5 - val
    },
    ai: {
      respondSha: true,
      skillTagFilter(player) {
        if (get.zhu(player, "shouyue")) {
          if (!player.countCards("hes")) {
            return false
          }
        } else {
          if (!player.countCards("hes", { color: "red" })) {
            return false
          }
        }
      },
    },
  },
  // 义绝
  yijue: {
    initSkill(skill) {
      if (!lib.skill[skill]) {
        lib.skill[skill] = {
          charlotte: true,
          onremove: true,
          mark: true,
          marktext: "绝",
          intro: {
            markcount: () => 0,
            content: (storage) =>
              `本回合不能使用或打出手牌且所有非锁定技失效，${get.translation(storage[1])}使用红桃【杀】造成的伤害+1`,
          },
          group: "yijue_ban",
        }
        lib.translate[skill] = "义绝"
        lib.translate[`${skill}_bg`] = "绝"
      }
    },
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return player !== target && target.countCards("h")
    },
    filterCard: lib.filter.cardDiscardable,
    position: "he",
    check(card) {
      return 8 - get.value(card)
    },
    async content(event, trigger, player) {
      const { target } = event
      if (!target.countCards("h")) {
        return
      }
      const result = await target
        .chooseCard(true, "h")
        .set("ai", (card) => {
          const player = get.player()
          if (get.color(card) === "black") {
            return 18 - get.event().black - get.value(card)
          }
          return 18 - get.value(card)
        })
        .set(
          "black",
          (() => {
            if (get.attitude(target, player) > 0) {
              return 18
            }
            if (
              target.hasCard((card) => {
                const name = get.name(card, target)
                return (
                  name === "shan" ||
                  name === "tao" ||
                  (name === "jiu" && target.hp < 3)
                )
              })
            ) {
              return 18 / target.hp
            }
            if (target.hp < 3) {
              return 12 / target.hp
            }
            return 0
          })(),
        )
        .forResult()
      if (result?.bool && result?.cards?.length) {
        const { cards } = result
        await target.showCards(cards)
        const [card] = cards
        if (get.color(card) === "black") {
          if (!target.hasSkill("fengyin")) {
            target.addTempSkill("fengyin")
          }
          const skill = `yijue_${player.playerid}`
          game.broadcastAll(lib.skill.yijue.initSkill, skill)
          target.addTempSkill(skill)
          target.storage[skill] ??= [0, player]
          target.storage[skill][0]++
          target.markSkill(skill)
          player.addTempSkill("yijue_effect")
        } else if (get.color(card) === "red") {
          await player.gain(card, target, "give", "bySelf")
          if (target.isDamaged()) {
            const result = await player
              .chooseBool(`是否令${get.translation(target)}回复1点体力？`)
              .set("choice", get.recoverEffect(target, player, player) > 0)
              .forResult()
            if (result?.bool) {
              await target.recover()
            }
          }
        }
      }
    },
    ai: {
      result: {
        target(player, target) {
          var hs = player.getCards("h")
          if (hs.length < 3) {
            return 0
          }
          if (
            target.countCards("h") > target.hp + 1 &&
            get.recoverEffect(target) > 0
          ) {
            return 1
          }
          if (
            player.canUse("sha", target) &&
            (player.countCards("h", "sha") ||
              player.countCards("he", { color: "red" }))
          ) {
            return -2
          }
          return -0.5
        },
      },
      order: 9,
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (!arg?.target?.hasSkill(`yijue_${player.playerid}`)) {
          return false
        }
      },
    },
    subSkill: {
      effect: {
        charlotte: true,
        trigger: { source: "damageBegin1" },
        filter(event, player) {
          return (
            event.card?.name === "sha" &&
            get.suit(event.card) === "heart" &&
            event.notLink() &&
            event.player.storage[`yijue_${player.playerid}`]?.[1] === player
          )
        },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          trigger.num += trigger.player.storage[`yijue_${player.playerid}`][0]
        },
      },
      ban: {
        charlotte: true,
        mod: {
          cardEnabled2(card) {
            if (get.position(card) === "h") {
              return false
            }
          },
        },
      },
    },
  },
  // 界张飞
  // 咆哮
  repaoxiao: {
    audio: 2,
    firstDo: true,
    trigger: { player: "useCard1" },
    forced: true,
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        (!event.audioed || !player.hasSkill("repaoxiao2"))
      )
    },
    async content(event, trigger, player) {
      trigger.audioed = true
      player.addTempSkill("repaoxiao2")
    },
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") {
          return Infinity
        }
      },
    },
    ai: {
      unequip: true,
      skillTagFilter(player, tag, arg) {
        if (!get.zhu(player, "shouyue")) {
          return false
        }
        if (arg && arg.name === "sha") {
          return true
        }
        return false
      },
    },
  },
  repaoxiao2: {
    charlotte: true,
    mod: {
      targetInRange(card, player) {
        if (card.name === "sha") {
          return true
        }
      },
    },
  },
  // 替身
  tishen: {
    trigger: {
      player: "phaseUseEnd",
    },
    check(event, player) {
      var num = 0
      var he = player.getCards("he")
      for (var i = 0; i < he.length; i++) {
        if (get.type(he[i], "trick") === "trick") {
          num++
        }
        if (get.type(he[i]) === "equip") {
          var subtype = get.subtype(he[i])
          if (
            subtype === "equip3" ||
            subtype === "equip4" ||
            subtype === "equip6"
          ) {
            num++
          }
        }
      }
      return (
        num === 0 || num <= player.countCards("h") - player.getHandcardLimit()
      )
    },
    async content(event, trigger, player) {
      await player.showHandcards()
      const list = []
      const he = player.getCards("he")
      for (const card of he) {
        if (get.type(card, "trick") === "trick") {
          list.push(card)
        }
        if (get.type(card) === "equip") {
          const subtype = get.subtype(card)
          if (
            subtype === "equip3" ||
            subtype === "equip4" ||
            subtype === "equip6"
          ) {
            list.push(card)
          }
        }
      }
      if (list.length) {
        await player.discard(list)
      }
      player.addTempSkill("tishen2", { player: "phaseBefore" })
    },
    audio: 2,
  },
  tishen2: {
    audio: "tishen",
    trigger: {
      global: "useCardAfter",
    },
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        event.targets &&
        event.targets.includes(player) &&
        !player.hasHistory("damage", (evt) => evt.card === event.card) &&
        event.cards.filterInD("od").length
      )
    },
    forced: true,
    charlotte: true,
    sourceSkill: "tishen",
    async content(event, trigger, player) {
      await player.gain(trigger.cards.filterInD("od"), "gain2")
    },
  },
  // 界诸葛亮
  // 观星
  reguanxing: {
    audio: 2,
    audioname: ["re_jiangwei", "ol_jiangwei"],
    trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
    frequent: true,
    filter(event, player, name) {
      if (name === "phaseJieshuBegin") {
        return player.hasSkill("reguanxing_on")
      }
      return true
    },
    async content(event, trigger, player) {
      const result = await player
        .chooseToGuanxing(game.countPlayer() < 4 ? 3 : 5)
        .set("prompt", "观星：将这些牌以任意顺序置于牌堆顶或牌堆底")
        .forResult()
      if (
        (!result.bool || !result.moved[0].length) &&
        event.triggername === "phaseZhunbeiBegin"
      ) {
        player.addTempSkill(["reguanxing_on", "guanxing_fail"])
      }
    },
    subSkill: {
      on: { charlotte: true },
    },
    ai: {
      guanxing: true,
    },
  },
  // 界赵云
  // 涯角
  yajiao: {
    audio: 2,
    trigger: { player: ["useCard", "respond"] },
    frequent: true,
    filter(event, player) {
      return player !== _status.currentPhase
    },
    async content(event, trigger, player) {
      event.card = get.cards()[0]
      await player.showCards(event.card)
      event.same = get.type2(event.card) === get.type2(trigger.card)
      const result = await player
        .chooseTarget(
          `涯角：将${get.translation(event.card)}交给一名角色`,
          true,
        )
        .set("ai", (target) => {
          const { player, du, same } = get.event()
          let att = get.attitude(player, target)
          if (du) {
            if (target.hasSkillTag("nodu")) {
              return 0
            }
            return -att
          }
          if (!same) {
            att += target === player ? 1 : 0
          }
          if (att > 0) {
            return att + Math.max(0, 5 - target.countCards("h"))
          }
          return att
        })
        .set("du", event.card.name === "du")
        .set("same", event.same)
        .forResult()
      if (result?.targets?.length) {
        player.line(result.targets, "green")
        await result.targets[0].gain(event.card, "gain2")
        if (!event.same) {
          await player.chooseToDiscard(true, "he")
        }
      }
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
  // 界马超
  // 铁骑
  retieji: {
    audio: 2,
    trigger: { player: "useCardToPlayered" },
    check(event, player) {
      return get.attitude(player, event.target) <= 0
    },
    filter(event, player) {
      return event.card.name === "sha"
    },
    logTarget: "target",
    async content(event, trigger, player) {
      let result
      // step 0
      result = await player.judge(() => 0).forResult()
      if (!trigger.target.hasSkill("fengyin")) {
        trigger.target.addTempSkill("fengyin")
      }
      // step 1
      const suit = result.suit
      const target = trigger.target
      const num = target.countCards("h", "shan")
      result = await target
        .chooseToDiscard(
          `弃置一张${get.translation(suit)}牌，否则不能使用【闪】响应此【杀】`,
          "he",
          (card) => get.suit(card) === _status.event.suit,
        )
        .set("ai", (card) => {
          var num = _status.event.num
          if (num === 0) {
            return 0
          }
          if (card.name === "shan") {
            return num > 1 ? 2 : 0
          }
          return 8 - get.value(card)
        })
        .set("num", num)
        .set("suit", suit)
        .forResult()
      // step 2
      if (!result.bool) {
        trigger.getParent().directHit.add(trigger.target)
      }
    },
    ai: {
      ignoreSkill: true,
      skillTagFilter(player, tag, arg) {
        if (tag === "directHit_ai") {
          return arg?.target && get.attitude(player, arg.target) <= 0
        }
        if (!arg || arg.isLink || !arg.card || arg.card.name !== "sha") {
          return false
        }
        if (!arg.target || get.attitude(player, arg.target) >= 0) {
          return false
        }
        if (
          !arg.skill ||
          !lib.skill[arg.skill] ||
          lib.skill[arg.skill].charlotte ||
          lib.skill[arg.skill].persevereSkill ||
          get.is.locked(arg.skill) ||
          !arg.target.getSkills(true, false).includes(arg.skill)
        ) {
          return false
        }
      },
      directHit_ai: true,
    },
  },
  // 界黄月英
  // 集智
  rejizhi: {
    audio: 2,
    locked: false,
    trigger: { player: "useCard" },
    frequent: true,
    filter(event) {
      return get.type(event.card) === "trick" && event.card.isCard
    },
    init(player) {
      player.storage.rejizhi = 0
    },
    async content(event, trigger, player) {
      const result = await player.draw("nodelay").forResult()
      event.card = result.cards[0]
      if (get.type(event.card) !== "basic") {
        return
      }

      const result2 = await player
        .chooseBool(
          `是否弃置${get.translation(event.card)}，然后本回合手牌上限+1？`,
        )
        .set(
          "ai",
          (evt, player) =>
            _status.currentPhase === player &&
            player.needsToDiscard(-3) &&
            _status.event.value < 6,
        )
        .set("value", get.value(event.card, player))
        .forResult()

      if (result2.bool) {
        await player.discard(event.card)
        player.storage.rejizhi++
        if (_status.currentPhase === player) {
          player.markSkill("rejizhi")
        }
      }
    },
    ai: {
      threaten: 1.4,
      noautowuxie: true,
    },
    mod: {
      maxHandcard(player, num) {
        return num + player.storage.rejizhi
      },
    },
    intro: {
      content: "本回合手牌上限+#",
    },
    group: "rejizhi_clear",
    subSkill: {
      clear: {
        trigger: { global: "phaseAfter" },
        silent: true,
        async content(event, trigger, player) {
          player.storage.rejizhi = 0
          player.unmarkSkill("rejizhi")
        },
      },
    },
  },
  // 奇才
  reqicai: {
    audio: 2,
    mod: {
      targetInRange(card, player, target, now) {
        var type = get.type(card)
        if (type === "trick" || type === "delay") {
          return true
        }
      },
      canBeDiscarded(card, player, target) {
        if (
          get.position(card) === "e" &&
          get
            .subtypes(card)
            .some((subtype) => ["equip2", "equip5"].includes(subtype)) &&
          player !== target
        ) {
          return false
        }
      },
    },
  },
  // 界孙权
  // 制衡
  rezhiheng: {
    audio: 2,
    mod: {
      aiOrder(player, card, num) {
        if (
          num <= 0 ||
          get.itemtype(card) !== "card" ||
          get.type(card) !== "equip"
        ) {
          return num
        }
        const eq = player.getEquip(get.subtype(card))
        if (
          eq &&
          get.equipValue(card) - get.equipValue(eq) <
            Math.max(1.2, 6 - player.hp)
        ) {
          return 0
        }
      },
    },
    locked: false,
    enable: "phaseUse",
    usable: 1,
    position: "he",
    filterCard: lib.filter.cardDiscardable,
    discard: false,
    lose: false,
    delay: false,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    check(card) {
      const player = _status.event.player
      if (
        get.position(card) === "h" &&
        !player.countCards("h", "du") &&
        (player.hp > 2 ||
          !player.countCards("h", (i) => {
            return get.value(i) >= 8
          }))
      ) {
        return 1
      }
      if (get.position(card) === "e") {
        const subs = get.subtypes(card)
        if (subs.includes("equip2") || subs.includes("equip3")) {
          return player.getHp() - get.value(card)
        }
      }
      return 6 - get.value(card)
    },
    async content(event, trigger, player) {
      const { cards } = event
      event.num = 1
      const hs = player.getCards("h")
      if (!hs.length) {
        event.num = 0
      }
      for (let i = 0; i < hs.length; i++) {
        if (!cards.includes(hs[i])) {
          event.num = 0
          break
        }
      }
      await player.discard(cards)
      await player.draw(event.num + cards.length)
    },
    //group:'rezhiheng_draw',
    subSkill: {
      draw: {
        trigger: { player: "loseEnd" },
        silent: true,
        filter(event, player) {
          if (
            event.getParent(2).skill !== "rezhiheng" &&
            event.getParent(2).skill !== "jilue_zhiheng"
          ) {
            return false
          }
          if (player.countCards("h")) {
            return false
          }
          for (var i = 0; i < event.cards.length; i++) {
            if (event.cards[i].original === "h") {
              return true
            }
          }
          return false
        },
        async content(event, trigger, player) {
          player.addTempSkill(
            "rezhiheng_delay",
            `${trigger.getParent(2).skill}After`,
          )
        },
      },
      delay: {},
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
        player: 1,
      },
      nokeep: true,
      skillTagFilter(player, tag, arg) {
        if (tag === "nokeep") {
          return (
            (!arg || (arg?.card && get.name(arg.card) === "tao")) &&
            player.isPhaseUsing() &&
            !player.getStat().skill.rezhiheng &&
            player.hasCard((card) => get.name(card) !== "tao", "h")
          )
        }
      },
      threaten: 1.55,
    },
  },
  // 救援
  rejiuyuan: {
    audio: 2,
    zhuSkill: true,
    trigger: { global: "taoBegin" },
    direct: true,
    filter(event, player) {
      return (
        player !== event.player &&
        event.player.group === "wu" &&
        event.player === event.target &&
        player.hp < event.player.hp &&
        player.hasZhuSkill("rejiuyuan", event.player)
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
        player.logSkill("rejiuyuan")
        trigger.player.line(player, "green")
        trigger.cancel()
        await player.recover(trigger.player)
        await trigger.player.draw()
      }
    },
  },
  // 界甘宁
  // 奋威
  fenwei: {
    audio: 2,
    limited: true,
    trigger: { global: "useCardToPlayered" },
    filter(event, player) {
      if (event.getParent().triggeredTargets3.length > 1) {
        return false
      }
      if (get.type(event.card) !== "trick") {
        return false
      }
      if (get.info(event.card).multitarget) {
        return false
      }
      if (event.targets.length < 2) {
        return false
      }
      return true
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt(event.skill),
          `令${get.translation(trigger.card)}对其中任意个目标无效`,
          [1, trigger.targets.length],
          (card, player, target) => {
            return get.event().targets.includes(target)
          },
        )
        .set("ai", (target) => {
          const player = get.player()
          const trigger = get.event().getTrigger()
          return -get.effect(target, trigger.card, trigger.player, player)
        })
        .set("targets", trigger.targets)
        .forResult()
    },
    skillAnimation: true,
    animationColor: "wood",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      trigger.getParent().excluded.addArray(event.targets)
      await game.delayx()
    },
  },
  // 界吕蒙
  // 勤学
  qinxue: {
    skillAnimation: true,
    animationColor: "wood",
    audio: 2,
    juexingji: true,
    derivation: "gongxin",
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    filter(event, player) {
      const diff = get.totalPopulation() >= 7 ? 2 : 3
      if (player.countCards("h") >= player.hp + diff) {
        return true
      }
      return false
    },
    async content(event, trigger, player) {
      const { name } = event
      player.awakenSkill(name)
      await player.loseMaxHp()
      await player.addSkills("gongxin")
    },
  },
  // 界黄盖
  // 苦肉
  rekurou: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterCard: lib.filter.cardDiscardable,
    check(card) {
      return 8 - get.value(card)
    },
    position: "he",
    async content(event, trigger, player) {
      await player.loseHp()
    },
    ai: {
      order: 8,
      result: {
        player(player) {
          if (
            player.needsToDiscard(3) &&
            !player.hasValueTarget({ name: "sha" }, false)
          ) {
            return -1
          }
          return get.effect(player, { name: "losehp" }, player, player)
        },
      },
      neg: true,
    },
  },
  // 诈降
  zhaxiang: {
    audio: 2,
    trigger: { player: "loseHpEnd" },
    filter(event, player) {
      return player.isIn() && event.num > 0
    },
    getIndex: (event) => event.num,
    forced: true,
    async content(event, trigger, player) {
      await player.draw(3)
      if (player.isPhaseUsing()) {
        player.addTempSkill(`${event.name}_effect`, "phaseUseAfter")
        player.addMark(`${event.name}_effect`, 1, false)
      }
    },
    subSkill: {
      effect: {
        mod: {
          targetInRange(card, player, target, now) {
            if (card.name === "sha" && get.color(card) === "red") {
              return true
            }
          },
          cardUsable(card, player, num) {
            if (card.name === "sha") {
              return num + player.countMark("zhaxiang_effect")
            }
          },
        },
        charlotte: true,
        onremove: true,
        audio: "zhaxiang",
        trigger: { player: "useCard" },
        sourceSkill: "zhaxiang",
        filter(event, player) {
          return event.card?.name === "sha" && get.color(event.card) === "red"
        },
        forced: true,
        async content(event, trigger, player) {
          trigger.directHit.addArray(game.players)
        },
        intro: {
          content:
            "<li>使用【杀】的次数上限+#<br><li>使用红色【杀】无距离限制且不能被【闪】响应",
        },
        ai: {
          directHit_ai: true,
          skillTagFilter(player, tag, arg) {
            return arg?.card?.name === "sha" && get.color(arg.card) === "red"
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
            if (
              using &&
              target.countCards("h", { name: "sha", color: "red" })
            ) {
              return [1, 3]
            }
            return [
              1,
              target.countCards("h") <= target.hp ||
              (using &&
                game.hasPlayer(
                  (current) =>
                    current !== player &&
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
  // 界周瑜
  // 英姿
  reyingzi: {
    audio: 2,
    audioname: ["re_sunce", "ol_sunce"],
    trigger: { player: "phaseDrawBegin2" },
    forced: true,
    preHidden: true,
    filter(event, player) {
      return !event.numFixed
    },
    async content(event, trigger, player) {
      trigger.num++
    },
    ai: {
      threaten: 1.5,
    },
    mod: {
      maxHandcardBase(player, num) {
        return player.maxHp
      },
    },
  },
  // 反间
  refanjian: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    filterTarget(card, player, target) {
      return player !== target
    },
    filterCard: true,
    check(card) {
      return 8 - get.value(card)
    },
    discard: false,
    lose: false,
    delay: false,
    async content(event, trigger, player) {
      const { cards, target } = event
      let result

      // step 0
      target.storage.refanjian = cards[0]
      await player.give(cards[0], target)

      // step 1
      if (!target.countCards("h")) {
        result = { control: "refanjian_hp" }
      } else {
        result = await target
          .chooseControl("refanjian_card", "refanjian_hp")
          .set("ai", (event, player) => {
            var cards = player.getCards("he", {
              suit: get.suit(player.storage.refanjian),
            })
            if (cards.length === 1) {
              return 0
            }
            if (cards.length >= 2) {
              for (var i = 0; i < cards.length; i++) {
                if (get.tag(cards[i], "save")) {
                  return 1
                }
              }
            }
            if (player.hp === 1) {
              return 0
            }
            for (var i = 0; i < cards.length; i++) {
              if (get.value(cards[i]) >= 8) {
                return 1
              }
            }
            if (cards.length > 2 && player.hp > 2) {
              return 1
            }
            if (cards.length > 3) {
              return 1
            }
            return 0
          })
          .forResult()
      }

      // step 2
      if (result.control === "refanjian_card") {
        await target.showHandcards()
      } else {
        await target.loseHp()
        return
      }

      // step 3
      const suit = get.suit(target.storage.refanjian)
      await target.discard(
        target.getCards(
          "he",
          (i) =>
            get.suit(i) === suit &&
            lib.filter.cardDiscardable(i, target, "refanjian"),
        ),
      )
      delete target.storage.refanjian
    },
    ai: {
      order: 9,
      result: {
        target(player, target) {
          return (
            -target.countCards("he") - (player.countCards("h", "du") ? 1 : 0)
          )
        },
      },
      threaten: 2,
    },
  },
  // 界大乔
  // 国色
  reguose: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    discard: false,
    lose: false,
    delay: false,
    filter(event, player) {
      return player.countCards("hes", { suit: "diamond" }) > 0
    },
    position: "hes",
    filterCard: { suit: "diamond" },
    filterTarget(card, player, target) {
      if (
        get.position(ui.selected.cards[0]) !== "s" &&
        lib.filter.cardDiscardable(ui.selected.cards[0], player, "reguose") &&
        target.hasJudge("lebu")
      ) {
        return true
      }
      if (player === target) {
        return false
      }
      if (
        !game.checkMod(
          ui.selected.cards[0],
          player,
          "unchanged",
          "cardEnabled2",
          player,
        )
      ) {
        return false
      }
      return player.canUse({ name: "lebu", cards: ui.selected.cards }, target)
    },
    check(card) {
      return 7 - get.value(card)
    },
    async content(event, trigger, player) {
      const { target } = event
      if (event.target.hasJudge("lebu")) {
        await player.discard(event.cards)
        await target.discard(event.target.getJudge("lebu"))
      } else {
        await player
          .useCard({ name: "lebu" }, event.target, event.cards)
          .set("audio", false)
      }
      await player.draw()
    },
    ai: {
      result: {
        target(player, target) {
          if (target.hasJudge("lebu")) {
            return -get.effect(target, { name: "lebu" }, player, target)
          }
          return get.effect(target, { name: "lebu" }, player, target)
        },
      },
      order: 9,
    },
  },
  // 界陆逊
  // 谦逊
  reqianxun: {
    audio: 2,
    trigger: {
      target: "useCardToBegin",
      player: "judgeBefore",
    },
    filter(event, player) {
      if (player.countCards("h") === 0) {
        return false
      }
      if (event.getParent().name === "phaseJudge") {
        return true
      }
      if (event.name === "judge") {
        return false
      }
      if (event.targets && event.targets.length > 1) {
        return false
      }
      if (
        event.card &&
        get.type(event.card) === "trick" &&
        event.player !== player
      ) {
        return true
      }
    },
    async content(event, trigger, player) {
      const cards = player.getCards("h")
      if (!cards.length) {
        return
      }
      const next = player.addToExpansion(cards, "giveAuto", player)
      next.gaintag.add("reqianxun2")
      await next
      player.addSkill("reqianxun2")
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (player === target || !target.hasFriend()) {
            return
          }
          var type = get.type(card)
          var nh = Math.min(
            target.countCards(),
            game.countPlayer((i) => get.attitude(target, i) > 0),
          )
          if (type === "trick") {
            if (!get.tag(card, "multitarget") || get.info(card).singleCard) {
              if (get.tag(card, "damage")) {
                return [1.5, nh - 1]
              }
              return [1, nh]
            }
          } else if (type === "delay") {
            return [0.5, 0.5]
          }
        },
      },
    },
  },
  reqianxun2: {
    trigger: { global: "phaseEnd" },
    forced: true,
    audio: false,
    sourceSkill: "reqianxun",
    async content(event, trigger, player) {
      const cards = player.getExpansions("reqianxun2")
      if (cards.length) {
        await player.gain(cards, "draw")
      }
      player.removeSkill("reqianxun2")
    },
    intro: {
      mark(dialog, storage, player) {
        var cards = player.getExpansions("reqianxun2")
        if (player.isUnderControl(true)) {
          dialog.addAuto(cards)
        } else {
          return `共有${get.cnNumber(cards.length)}张牌`
        }
      },
      markcount: "expansion",
    },
  },
  // 连营
  relianying: {
    audio: 2,
    trigger: {
      player: "loseAfter",
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    direct: true,
    filter(event, player) {
      if (player.countCards("h")) {
        return false
      }
      var evt = event.getl(player)
      return evt?.hs?.length
    },
    async content(event, trigger, player) {
      const num = trigger.getl(player).hs.length
      const result = await player
        .chooseTarget(
          get.prompt("relianying"),
          `令至多${get.cnNumber(num)}名角色各摸一张牌`,
          [1, num],
        )
        .set("ai", (target) => {
          const player = _status.event.player
          if (player === target) {
            return get.attitude(player, target) + 10
          }
          return get.attitude(player, target)
        })
        .forResult()
      if (!result?.bool) return
      player.logSkill("relianying", result.targets)
      await game.asyncDraw(result.targets)
      await game.delay()
    },
    ai: {
      threaten: 0.8,
      effect: {
        player_use(card, player, target) {
          if (player.countCards("h") === 1) {
            return [1, 0.8]
          }
        },
        target(card, player, target) {
          if (get.tag(card, "loseCard") && target.countCards("h") === 1) {
            return 0.5
          }
        },
      },
      noh: true,
      freeSha: true,
      freeShan: true,
      skillTagFilter(player) {
        return player.countCards("h") === 1
      },
    },
  },
  // 界孙尚香
  // 结姻
  rejieyin: {
    audio: 2,
    enable: "phaseUse",
    filterCard: true,
    usable: 1,
    position: "he",
    filter(event, player) {
      return player.countCards("he") > 0
    },
    check(card) {
      var player = _status.event.player
      if (get.position(card) === "e") {
        var subtype = get.subtype(card)
        if (
          !game.hasPlayer(
            (current) =>
              current !== player &&
              get.attitude(player, current) > 0 &&
              !current.countCards("e", { subtype: subtype }),
          )
        ) {
          return 0
        }
        if (player.countCards("h", { subtype: subtype })) {
          return 20 - get.value(card)
        }
        return 10 - get.value(card)
      }
      if (player.countCards("e")) {
        return 0
      }
      if (player.countCards("h", { type: "equip" })) {
        return 0
      }
      return 8 - get.value(card)
    },
    filterTarget(card, player, target) {
      if (!target.hasSex("male")) {
        return false
      }
      var card = ui.selected.cards[0]
      if (!card) {
        return false
      }
      if (get.position(card) === "e" && !target.canEquip(card)) {
        return false
      }
      return true
    },
    discard: false,
    delay: false,
    lose: false,
    async content(event, trigger, player) {
      const { cards, target } = event
      let result

      // step 0
      if (get.position(cards[0]) === "e") {
        result = { index: 0 }
      } else if (get.type(cards[0]) !== "equip" || !target.canEquip(cards[0])) {
        result = { index: 1 }
      } else {
        result = await player
          .chooseControl()
          .set("choiceList", [
            `将${get.translation(cards[0])}置入${get.translation(target)}装备区`,
            `弃置${get.translation(cards[0])}`,
          ])
          .set("ai", () => 1)
          .forResult()
      }

      // step 1
      if (result.index === 0) {
        player.$give(cards, target, false)
        await target.equip(cards[0])
      } else {
        await player.discard(cards)
      }

      // step 2
      if (player.hp > target.hp) {
        await player.draw()
        if (target.isDamaged()) {
          await target.recover()
        }
      } else if (player.hp < target.hp) {
        await target.draw()
        if (player.isDamaged()) {
          await player.recover()
        }
      }
    },
    ai: {
      order() {
        var player = _status.event.player
        var es = player.getCards("e")
        for (var i = 0; i < es.length; i++) {
          if (player.countCards("h", { subtype: get.subtype(es[i]) })) {
            return 10
          }
        }
        return 2
      },
      result: {
        player(player, target) {
          if (!ui.selected.cards.length) {
            return 0
          }
          let card = ui.selected.cards[0],
            val = -get.value(card, player) / 6
          if (get.position(card) === "e") {
            val += 2
          }
          if (player.hp > target.hp) {
            val++
          } else if (player.hp < target.hp && player.isDamaged()) {
            val +=
              get.recoverEffect(player, player, player) /
              get.attitude(player, player)
          }
          return val
        },
        target(player, target) {
          if (!ui.selected.cards.length) {
            return 0
          }
          let card = ui.selected.cards[0],
            val = get.position(card) === "e" ? get.value(card, target) / 6 : 0
          if (target.hp > player.hp) {
            val++
          } else if (target.hp < player.hp && target.isDamaged()) {
            val +=
              get.recoverEffect(target, target, target) /
              get.attitude(target, target)
          }
          return val
        },
      },
    },
  },
  // 枭姬
  rexiaoji: {
    audio: 2,
    trigger: {
      player: "loseAfter",
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
      const evt = event.getl(player)
      return evt?.player === player && evt.es?.length > 0
    },
    async content(event, trigger, player) {
      await player.draw(2)
    },
    ai: {
      noe: true,
      reverseEquip: true,
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "equip" && !get.cardtag(card, "gifts")) {
            return [1, 3]
          }
        },
      },
    },
  },
  // 界华佗
  // 除疠
  chuli: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      if (player === target) {
        return false
      }
      if (target.group === "unknown") {
        return false
      }
      for (var i = 0; i < ui.selected.targets.length; i++) {
        if (ui.selected.targets[i].group === target.group) {
          return false
        }
      }
      return target.countCards("he") > 0
    },
    filter(event, player) {
      return player.countCards("he") > 0
    },
    filterCard: true,
    position: "he",
    selectTarget: [1, Infinity],
    check(card) {
      if (get.suit(card) === "spade") {
        return 8 - get.value(card)
      }
      return 5 - get.value(card)
    },
    async content(event, trigger, player) {
      const { num, cards, targets } = event
      let result

      // step 0
      if (num === 0 && get.suit(cards[0]) === "spade") {
        await player.draw()
      }
      result = await player
        .choosePlayerCard(targets[num], "he", true)
        .forResult()

      // step 1
      if (result.bool) {
        if (result.links?.length) {
          await targets[num].discard(result.links[0])
        }
        if (get.suit(result.links[0]) === "spade") {
          await targets[num].draw()
        }
      }
    },
    ai: {
      result: {
        target: -1,
      },
      threaten: 1.2,
      order: 3,
    },
  },
  // 界吕布
  // 利驭
  liyu: {
    audio: 2,
    trigger: {
      source: "damageSource",
    },
    filter(event, player) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return (
        event.card &&
        event.card.name === "sha" &&
        event.player !== player &&
        event.player.isIn() &&
        event.player.countGainableCards(player, "hej") > 0
      )
    },
    direct: true,
    async content(event, trigger, player) {
      const gainResult = await player
        .gainPlayerCard(
          get.prompt("liyu", trigger.player),
          trigger.player,
          "hej",
          "visibleMove",
        )
        .set("ai", (button) => {
          const player = _status.event.player
          const target = _status.event.target
          if (
            get.attitude(player, target) > 0 &&
            get.position(button.link) === "j"
          ) {
            return 4 + get.value(button.link)
          }
          if (get.type(button.link) === "equip") {
            return _status.event.juedou
          }
          return 3
        })
        .set(
          "juedou",
          (() => {
            if (
              get.attitude(player, trigger.player) > 0 &&
              game.hasPlayer((current) => {
                return (
                  player.canUse({ name: "juedou" }, current) &&
                  current !== trigger.player &&
                  current !== player &&
                  get.effect(current, { name: "juedou" }, player, player) > 2
                )
              })
            ) {
              return 5
            }
            if (
              game.hasPlayer((current) => {
                return (
                  player.canUse({ name: "juedou" }, current) &&
                  current !== trigger.player &&
                  current !== player &&
                  get.effect(current, { name: "juedou" }, player, player) < 0
                )
              })
            ) {
              return 1
            }
            return 4
          })(),
        )
        .set("logSkill", ["liyu", trigger.player])
        .forResult()

      if (!gainResult?.bool) return

      const gained = gainResult.cards?.[0]
      if (!gained) return

      if (get.type(gained) !== "equip") {
        await trigger.player.draw()
        return
      }

      if (
        !game.hasPlayer(
          (current) =>
            current !== player &&
            current !== trigger.player &&
            player.canUse("juedou", current),
        )
      ) {
        return
      }

      const chooseRes = await trigger.player
        .chooseTarget(
          true,
          (card, player2, target) => {
            const evt = _status.event.getParent()
            return (
              evt.player.canUse({ name: "juedou" }, target) &&
              target !== _status.event.player
            )
          },
          `${get.translation(player)}视为对你选择的另一名角色使用一张【决斗】`,
        )
        .set("ai", (target) => {
          const evt = _status.event.getParent()
          return (
            get.effect(
              target,
              { name: "juedou" },
              evt.player,
              _status.event.player,
            ) - 2
          )
        })
        .forResult()

      if (chooseRes?.targets?.length) {
        await player.useCard(
          { name: "juedou", isCard: true },
          chooseRes.targets[0],
          "noai",
        )
      }
    },
    ai: {
      halfneg: true,
    },
  },
  // 界貂蝉
  // 闭月
  rebiyue: {
    audio: 2,
    audioname2: { ol_diaochan: "biyue" },
    trigger: { player: "phaseJieshuBegin" },
    frequent: true,
    async content(event, trigger, player) {
      await player.draw(player.countCards("h") ? 1 : 2)
    },
  },
  // 界华雄
  // 耀武
  reyaowu: {
    trigger: {
      player: "damageBegin3",
    },
    //priority:1,
    audio: 2,
    filter(event) {
      return (
        event.card &&
        event.card.name === "sha" &&
        (get.color(event.card) !== "red" || event.source?.isIn())
      )
    },
    forced: true,
    async content(event, trigger, player) {
      if (get.color(trigger.card) !== "red") {
        await player.draw()
      } else {
        await trigger.source.chooseDrawRecover(true)
      }
    },
    ai: {
      effect: {
        target: (card, player, target, current) => {
          if (card.name === "sha") {
            if (get.color(card) === "red") {
              const num = player.isDamaged() ? 1.6 : 0.7
              if (get.attitude(player, target) > 0 && player.hp < 3) {
                return [1, 0, 1, num]
              }
              return [1, 0, 1, num / 2]
            }
            return [1, 0.6]
          }
        },
      },
    },
  },
  // 界公孙瓒
  // 趫猛
  qiaomeng: {
    audio: 2,
    trigger: { source: "damageSource" },
    direct: true,
    filter(event, player) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return (
        event.card &&
        event.card.name === "sha" &&
        event.cards &&
        get.color(event.cards) === "black" &&
        event.player.countDiscardableCards(player, "e")
      )
    },
    async content(event, trigger, player) {
      let result

      // step 0
      result = await player
        .discardPlayerCard(
          get.prompt("qiaomeng", trigger.player),
          "e",
          trigger.player,
        )
        .set("logSkill", ["qiaomeng", trigger.player])
        .forResult()

      // step 1
      if (result?.bool) {
        const card = result.cards[0]
        if (get.position(card) === "d") {
          const subtype = get.subtype(card)
          if (
            subtype === "equip3" ||
            subtype === "equip4" ||
            subtype === "equip6"
          ) {
            await player.gain(card, player, "gain2")
          }
        }
      }
    },
  },
  // 曹彰
  // 将驰
  jiangchi: {
    audio: 2,
    trigger: {
      player: "phaseDrawEnd",
    },
    logAudio: (event, player, name, indexedData, costResult) =>
      costResult.cost_data.control === "弃牌"
        ? "jiangchi2.mp3"
        : "jiangchi1.mp3",
    async cost(event, trigger, player) {
      const list = ["弃牌", "摸牌", "cancel2"]
      if (!player.hasCards("he")) {
        list.remove("弃牌")
      }
      const { control } = await player
        .chooseControl({
          prompt: get.prompt2(event.skill),
          controls: list,
          ai() {
            const player = _status.event.player
            if (list.includes("弃牌")) {
              if (
                player.countCards("h") > 3 &&
                player.countCards("h", "sha") > 1
              ) {
                return "弃牌"
              }
              if (player.countCards("h", "sha") > 2) {
                return "弃牌"
              }
            }
            if (!player.hasCards("h", "sha")) {
              return "摸牌"
            }
            return "cancel2"
          },
        })
        .forResult()
      if (control === "cancel2") {
        event.result = { bool: false }
      } else {
        event.result = {
          bool: true,
          cost_data: { control },
        }
      }
    },
    async content(event, trigger, player) {
      const { control } = event.cost_data

      if (control === "弃牌") {
        player.addTempSkill("jiangchi2")
        await player.chooseToDiscard({
          position: "he",
          forced: true,
        })
      } else if (control === "摸牌") {
        player.addTempSkill("jiangchi3")
        await player.draw()
      }
    },
  },
  jiangchi2: {
    mod: {
      targetInRange(card, player, target, now) {
        if (card.name === "sha") {
          return true
        }
      },
      cardUsable(card, player, num) {
        if (card.name === "sha") {
          return num + 1
        }
      },
    },
  },
  jiangchi3: {
    mod: {
      cardEnabled(card) {
        if (card.name === "sha") {
          return false
        }
      },
      cardRespondable(card) {
        if (card.name === "sha") {
          return false
        }
      },
    },
  },
  // 伊籍
  // 机捷
  jijie: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    async content(event, trigger, player) {
      const card = get.bottomCards()[0]
      game.cardsGotoOrdering(card)
      event.card = card
      const { bool, targets } = await player
        .chooseTarget({
          forced: true,
          ai(target) {
            let att = get.attitude(_status.event.player, target)
            if (_status.event.du) {
              if (target.hasSkillTag("nodu")) {
                return 0.5
              }
              return -att
            }
            if (att > 0) {
              if (_status.event.player !== target) {
                att += 2
              }
              return att + Math.max(0, 5 - target.countCards("h"))
            }
            return att
          },
        })
        .set("du", event.card.name === "du")
        .set("createDialog", ["机捷：将此牌交给一名角色", [card]])
        .forResult()
      if (bool && targets?.length) {
        const target = targets[0]
        player.line(target, "green")
        const gainEvent = target.gain({
          cards: [card],
          animate: "draw",
        })
        gainEvent.giver = player
        await gainEvent
      }
    },
    ai: {
      order: 7.2,
      result: {
        player: 1,
      },
    },
  },
  // 急援
  jiyuan: {
    trigger: {
      global: ["dying", "gainAfter", "loseAsyncAfter"],
    },
    audio: 2,
    getIndex(event, player) {
      if (event.name !== "loseAsync") {
        return [event.player]
      }
      return game
        .filterPlayer(
          (current) => current !== player && event.getg(current).length > 0,
        )
        .sortBySeat()
    },
    filter(event, player, triggername, target) {
      if (!target?.isIn()) {
        return false
      }
      if (event.name === "dying") {
        return true
      }
      if (event.giver !== player) {
        return false
      }
      if (event.name === "gain") {
        return event.player !== player && event.getg(target).length > 0
      }
      return game.hasPlayer(
        (current) => current !== player && event.getg(current).length > 0,
      )
    },
    logTarget(event, player, triggername, target) {
      return target
    },
    check(event, player, triggername, target) {
      return get.attitude(player, target) > 0
    },
    async content(event, trigger, player) {
      await event.targets[0].draw()
    },
  },
}

export default skills
