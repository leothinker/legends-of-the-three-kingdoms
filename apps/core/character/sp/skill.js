import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 乐进
  // 骁果
  xiaoguo: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    filter(event, player) {
      return (
        event.player.isIn() &&
        event.player !== player &&
        player.hasCards("h", (card) => {
          if (_status.connectMode) {
            return true
          }
          return (
            get.type(card) === "basic" &&
            lib.filter.cardDiscardable(card, player)
          )
        })
      )
    },
    direct: true,
    content() {
      "step 0"
      var next = player.chooseToDiscard({
        prompt: get.prompt("xiaoguo", trigger.player),
        filterCard(card, player) {
          return get.type(card) === "basic"
        },
      })
      next.set("ai", (card) => _status.event.eff - get.useful(card))
      next.set("logSkill", ["xiaoguo", trigger.player])
      next.set(
        "eff",
        (() => {
          if (trigger.player.hasSkillTag("noe")) {
            return get.attitude(_status.event.player, trigger.player)
          }
          return get.damageEffect(trigger.player, player, _status.event.player)
        })(),
      )
      ;("step 1")
      if (result.bool) {
        if (get.mode() !== "identity" || player.identity !== "nei") {
          player.addExpose(0.15)
        }
        trigger.player
          .chooseToDiscard(
            "he",
            `弃置一张装备牌并令${get.translation(player)}摸一张牌，或受到1点伤害`,
            { type: "equip" },
          )
          .set("ai", (card) => {
            if (_status.event.damage > 0) {
              return 0
            }
            if (_status.event.noe) {
              return 12 - get.value(card)
            }
            return -_status.event.damage - get.value(card)
          })
          .set(
            "damage",
            get.damageEffect(trigger.player, player, trigger.player),
          )
          .set("noe", trigger.player.hasSkillTag("noe"))
      } else {
        event.finish()
      }
      ;("step 2")
      if (result.bool) {
        player.draw()
      } else {
        trigger.player.damage()
      }
    },
  },
  // 李典
  // 恂恂
  xunxun: {
    audio: 2,
    trigger: { player: "phaseDrawBegin1" },
    preHidden: true,
    frequent: true,
    async content(event, trigger, player) {
      trigger.changeToZero()
      const cards = get.cards(4, true)
      await game.cardsGotoOrdering(cards)
      const result = await player
        .chooseToMove(
          "恂恂：获得其中的两张牌，其余以任意顺序置于牌堆底（靠左的牌更靠上）",
          true,
        )
        .set("list", [["获得", cards], ["牌堆底"]])
        .set("filterMove", (from, to, moved) => {
          if (to === 1 && moved[1].length >= 2) {
            return false
          }
          return true
        })
        .set("filterOk", (moved) => moved[1].length === 2)
        .set("processAI", (list) => {
          var cards = list[0][1]
            .slice(0)
            .sort((a, b) => get.value(b) - get.value(a))
          return [cards, cards.splice(2)]
        })
        .forResult()
      const top = result.moved[0]
      const bottom = result.moved[1]
      await player.gain(top, "draw")
      player.popup(`${get.cnNumber(0)}上${get.cnNumber(bottom.length)}下`)
      await game.cardsGotoPile(bottom)
    },
  },
  // 忘隙
  wangxi: {
    audio: 2,
    trigger: { player: "damageEnd", source: "damageSource" },
    getIndex: (event) => event.num,
    filter(event) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return (
        event.num &&
        event.source?.isIn() &&
        event.player?.isIn() &&
        event.source !== event.player
      )
    },
    check(event, player) {
      if (player.isPhaseUsing()) {
        return true
      }
      if (event.player === player) {
        return get.attitude(player, event.source) > -3
      }
      return get.attitude(player, event.player) > -3
    },
    logTarget(event, player) {
      if (event.player === player) {
        return event.source
      }
      return event.player
    },
    preHidden: true,
    async content(event, trigger, player) {
      await game.asyncDraw([trigger.player, trigger.source].sortBySeat())
    },
    ai: {
      maixie: true,
      maixie_hp: true,
    },
  },
  // SP蔡文姬
  // 陈情
  chenqing: {
    audio: 2,
    trigger: { global: "dying" },
    filter(event, player) {
      return (
        event.player.hp <= 0 &&
        game.hasPlayer(
          (current) => current !== player && current !== event.player,
        )
      )
    },
    round: 1,
    async cost(event, trigger, player) {
      const { player: target } = trigger
      event.result = await player
        .chooseTarget(get.prompt2(event.skill), (card, player, target) => {
          return target !== player && target !== get.event().targetx
        })
        .set("ai", (target) => {
          const { player, targetx } = get.event()
          if (get.attitude(player, targetx) > 0) {
            const att1 = get.attitude(target, player)
            const att2 = get.attitude(target, targetx)
            const att3 = get.attitude(player, target)
            if (att3 < 0) {
              return 0
            }
            return att1 / 2 + att2 + att3
          }
          return 0
        })
        .set("targetx", target)
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      await target.draw(4)
      if (
        !target.countCards("he", (card) =>
          lib.filter.cardDiscardable(card, target, "chenqing"),
        )
      ) {
        return
      }
      const { player: tosave } = trigger
      const att = get.attitude(target, tosave)
      const hastao =
        target.countCards("hs", (card) => target.canSaveCard(card, tosave)) >=
        1 - tosave.hp
      const result = await target
        .chooseToDiscard(4, true, "he")
        .set("ai", (card) => {
          const { hastao, att } = get.event()
          if (!hastao && att > 0) {
            const suit = get.suit(card)
            for (let i = 0; i < ui.selected.cards.length; i++) {
              if (get.suit(ui.selected.cards[i]) === suit) {
                return -4 - get.value(card)
              }
            }
          }
          if (att < 0 && ui.selected.cards.length === 3) {
            const suit = get.suit(card)
            for (let i = 0; i < ui.selected.cards.length; i++) {
              if (get.suit(ui.selected.cards[i]) === suit) {
                return -get.value(card)
              }
            }
            return -10 - get.value(card)
          }
          return -get.value(card)
        })
        .set("hastao", hastao)
        .set("att", att)
        .forResult()
      if (result?.cards?.length === 4) {
        const suits = result.cards.map((card) => get.suit(card)).toUniqued()
        const tao = get.autoViewAs({ name: "tao", isCard: true })
        if (suits.length === 4 && lib.filter.cardSavable(tao, target, tosave)) {
          await target.useCard(tao, tosave)
        }
      }
    },
    ai: {
      expose: 0.2,
      threaten: 1.5,
    },
  },
  // 默识
  mozhi: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return (
        player.getHistory(
          "useCard",
          (evt) =>
            evt.isPhaseUsing() &&
            ["basic", "trick"].includes(get.type(evt.card)),
        ).length > 0 && player.countCards("hs") > 0
      )
    },
    direct: true,
    async content(event, trigger, player) {
      let count = 2
      const history = player.getHistory(
        "useCard",
        (evt) =>
          evt.isPhaseUsing() && ["basic", "trick"].includes(get.type(evt.card)),
      )
      while (count-- && history.length && player.countCards("hs")) {
        let card = history.shift().card
        card = { name: card.name, nature: card.nature }
        if (player.hasUseTarget(card, true, true)) {
          const name = `${event.name}_backup`
          game.broadcastAll(
            (name, card) => {
              lib.skill[name].viewAs = card
            },
            name,
            card,
          )
          const next = player.chooseToUse()
          next.logSkill = event.name
          next.set(
            "openskilldialog",
            `默识：将一张手牌当${get.translation(card)}使用`,
          )
          next.set("norestore", true)
          next.set("_backupevent", name)
          next.set("custom", {
            add: {},
            replace: { window() {} },
          })
          next.backup(name)
          const result = await next.forResult()
          if (!result?.bool) {
            break
          }
        } else {
          break
        }
      }
    },
    subSkill: {
      backup: {
        filterCard(card) {
          return get.itemtype(card) === "card"
        },
        selectCard: 1,
        position: "hs",
        popname: true,
        log: false,
      },
    },
  },
  // 曹昂
  // 慷忾
  kangkai: {
    audio: 2,
    trigger: { global: "useCardToTargeted" },
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        get.distance(player, event.target) <= 1 &&
        event.target.isIn()
      )
    },
    check(event, player) {
      return get.attitude(player, event.target) >= 0
    },
    preHidden: true,
    logTarget: "target",
    content() {
      "step 0"
      player.draw()
      if (trigger.target !== player) {
        player
          .chooseCard(
            true,
            "he",
            `交给${get.translation(trigger.target)}一张牌`,
          )
          .set("ai", (card) => {
            if (get.position(card) === "e") {
              return -1
            }
            if (card.name === "shan") {
              return 1
            }
            if (get.type(card) === "equip") {
              return 0.5
            }
            return 0
          })
      } else {
        event.finish()
      }
      ;("step 1")
      player.give(result.cards, trigger.target, "give")
      game.delay()
      event.card = result.cards[0]
      ;("step 2")
      if (
        trigger.target.getCards("h").includes(card) &&
        get.type(card) === "equip"
      ) {
        trigger.target.chooseUseTarget(card)
      }
    },
    ai: {
      threaten: 1.1,
    },
  },
  // 司马朗
  // 郡兵
  junbing: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    filter(event, player) {
      return (
        event.player.countCards("h") <= 1 &&
        (player === event.player || player.hasSkill("junbing"))
      )
    },
    async cost(event, trigger, player) {
      event.result = await trigger.player
        .chooseBool(
          player === trigger.player
            ? get.prompt(event.skill)
            : `是否发动${get.translation(player)}的【郡兵】？`,
          `摸一张牌${player === trigger.player ? "" : `，然后交给${get.translation(player)}所有手牌。若如此做，其交给你等量的牌`}`,
        )
        .set("ai", () => get.event().choice)
        .set(
          "choice",
          (() => {
            const num = player.countCards("h"),
              att = get.attitude(trigger.player, player)
            if (num === 0) {
              return true
            }
            if (num === 1) {
              return att > -1
            }
            if (num === 2) {
              return att > 0
            }
            return att > 1
          })(),
        )
        .forResult()
    },
    async content(event, trigger, player) {
      const target = trigger.player
      if (target !== player) {
        game.log(target, "发动了", player, "的", "#g【郡兵】")
      }
      await target.draw()
      const cards = target.getCards("h")
      if (target === player || !cards.length) {
        return
      }
      await target.give(cards, player)
      let num = cards.length,
        result
      if (player.countCards("he") > num) {
        result = await player
          .chooseCard(
            `郡兵：请交给${get.translation(target)}${get.translation(num)}张牌`,
            "he",
            true,
            num,
          )
          .set("ai", (card) => {
            const player = _status.event.player,
              target = get.event().target
            if (get.attitude(player, target) <= 0) {
              if (card.name === "du") {
                return 30
              }
              return -get.value(card)
            }
            return 6 - get.value(card)
          })
          .set("target", target)
          .forResult()
      } else {
        result = {
          bool: player.hasCard((i) => true, "he"),
          cards: player.getCards("he"),
        }
      }
      if (result.bool) {
        await player.give(result.cards, target)
      }
    },
  },
  // 去疾
  quji: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    position: "he",
    filterCard: true,
    selectCard() {
      var player = _status.event.player
      return player.getDamagedHp()
    },
    filterTarget(card, player, target) {
      return target.hp < target.maxHp
    },
    filter(event, player) {
      return player.hp < player.maxHp
    },
    selectTarget() {
      return [1, ui.selected.cards.length]
    },
    complexSelect: true,
    check(card) {
      if (get.color(card) === "black") {
        return -1
      }
      return 9 - get.value(card)
    },
    content() {
      "step 0"
      target.recover()
      ;("step 1")
      if (target === targets[targets.length - 1]) {
        for (var i = 0; i < cards.length; i++) {
          if (get.color(cards[i], player) === "black") {
            player.loseHp()
            break
          }
        }
      }
    },
    ai: {
      result: {
        target: 1,
      },
      order: 6,
    },
  },
  // 关银屏
  // 血祭
  xueji: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("he", { color: "red" }) > 0
    },
    filterTarget: true,
    selectTarget() {
      var player = _status.event.player
      return [1, Math.max(1, player.getDamagedHp())]
    },
    position: "he",
    filterCard: { color: "red" },
    check(card) {
      return 8 - get.value(card)
    },
    multitarget: true,
    multiline: true,
    line: "fire",
    content() {
      "step 0"
      event.delay = false
      for (var i = 0; i < targets.length; i++) {
        if (!targets[i].isLinked()) {
          targets[i].link(true)
          event.delay = true
        }
      }
      ;("step 1")
      if (event.delay) {
        game.delay()
      }
      ;("step 2")
      targets[0].damage("fire", "nocard")
    },
    ai: {
      damage: true,
      fireAttack: true,
      threaten: 1.5,
      order: 7,
      result: {
        target(player, target) {
          var eff = get.damageEffect(target, player, target, "fire")
          if (target.isLinked()) {
            return eff / 10
          }
          return eff
        },
      },
    },
  },
  // 虎啸
  huxiao: {
    audio: 2,
    trigger: { source: "damageSource" },
    forced: true,
    filter(event, player) {
      if (event._notrigger.includes(event.player) || !event.player.isIn()) {
        return false
      }
      return event.hasNature("fire")
    },
    logTarget: "player",
    content() {
      if (!player.storage.huxiao3) {
        player.storage.huxiao3 = []
      }
      player.storage.huxiao3.add(trigger.player)
      trigger.player.draw()
      player.addTempSkill("huxiao3")
    },
  },
  huxiao3: {
    onremove: true,
    mark: true,
    intro: {
      content: "players",
    },
    mod: {
      cardUsableTarget(card, player, target) {
        if (player.storage.huxiao3?.includes(target)) {
          return true
        }
      },
    },
  },
  // 武继
  wuji: {
    skillAnimation: true,
    animationColor: "orange",
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    forced: true,
    juexingji: true,
    filter(event, player) {
      return player.getStat("damage") >= 3
    },
    content() {
      "step 0"
      player.removeSkills("huxiao")
      player.gainMaxHp()
      ;("step 1")
      player.recover()
      player.awakenSkill(event.name)
      var card = get.cardPile("qinglong", "field")
      if (card) {
        player.gain(card, "gain2", "log")
      }
    },
  },
  // SP孙尚香
  // 良助
  liangzhu: {
    audio: 2,
    trigger: { global: "recoverAfter" },
    direct: true,
    filter(event, player) {
      return event.player.isPhaseUsing()
    },
    content() {
      "step 0"
      if (player === trigger.player) {
        player
          .chooseControl("摸一张", "摸两张", "cancel2", () => "摸两张")
          .set("prompt", get.prompt2("liangzhu"))
        event.single = true
      } else {
        player
          .chooseTarget(
            get.prompt2("liangzhu"),
            (card, player, target) =>
              target === _status.event.player ||
              target === _status.event.target,
          )
          .set("target", trigger.player)
          .set("ai", (target) => {
            var player = _status.event.player
            if (player === target) {
              return 1
            }
            return get.attitude(player, target) - 1.5
          })
      }
      ;("step 1")
      if (event.single) {
        if (result.control !== "cancel2") {
          player.logSkill("liangzhu", player)
          if (result.control === "摸一张") {
            player.draw()
          } else {
            player.draw(2)
            if (!player.storage.liangzhu) {
              player.storage.liangzhu = []
            }
            player.storage.liangzhu.add(player)
          }
        }
      } else if (result.bool) {
        var target = result.targets[0]
        player.logSkill("liangzhu", target)
        if (target === player) {
          target.draw()
        } else {
          target.draw(2)
          if (target.storage.liangzhu) {
            target.storage.liangzhu.add(player)
          } else {
            target.storage.liangzhu = [player]
          }
        }
      }
    },
    ai: {
      expose: 0.1,
    },
  },
  // 返乡
  fanxiang: {
    skillAnimation: true,
    animationColor: "fire",
    audio: 2,
    juexingji: true,
    derivation: "xiaoji",
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      return game.hasPlayer(
        (current) =>
          current.storage.liangzhu?.includes(player) && current.isDamaged(),
      )
    },
    forced: true,
    content() {
      player.awakenSkill(event.name)
      player.gainMaxHp()
      player.recover()
      player.changeSkills(["xiaoji"], ["liangzhu"])
    },
    ai: {
      combo: "liangzhu",
    },
  },
  // 董允
  // 秉正
  bingzheng: {
    audio: 2,
    trigger: { player: "phaseUseEnd" },
    direct: true,
    content() {
      "step 0"
      player
        .chooseTarget(
          get.prompt2("bingzheng"),
          (card, player, target) => target.countCards("h") !== target.hp,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          var att = get.attitude(player, target)
          var nh = target.countCards("h")
          if (att > 0) {
            if (nh === target.hp - 1) {
              if (player === target) {
                return att + 1
              }
              return att + 2
            }
            if (player === target && player.needsToDiscard()) {
              return att / 3
            }
            return att
          }
          if (nh === target.hp + 1) {
            return -att
          }
          if (nh === 0) {
            return 0
          }
          return -att / 2
        })
      ;("step 1")
      if (result.bool) {
        player.logSkill("bingzheng", result.targets)
        event.target = result.targets[0]
        if (event.target.countCards("h")) {
          player
            .chooseControl((event, player) => {
              var target = event.target
              if (get.attitude(player, target) < 0) {
                return 1
              }
              return 0
            })
            .set("choiceList", [
              `令${get.translation(event.target)}摸一张牌`,
              `令${get.translation(event.target)}弃置一张手牌`,
            ])
        } else {
          event.directfalse = true
        }
      } else {
        event.finish()
      }
      ;("step 2")
      if (event.directfalse || result.index === 0) {
        event.target.draw()
      } else {
        event.target.chooseToDiscard("h", true)
      }
      ;("step 3")
      if (event.target.countCards("h") === event.target.hp) {
        player.draw()
        if (event.target === player) {
          event.finish()
          return
        }
        var next = player.chooseCard(
          `是否交给${get.translation(event.target)}一张牌？`,
          "he",
        )
        next.set("ai", (card) => {
          if (get.position(card) !== "h") {
            return 0
          }
          if (_status.event.shan && card.name === "shan") {
            return 11
          }
          if (_status.event.goon) {
            return 10 - get.value(card)
          }
          return -get.value(card, _status.event.player, "raw")
        })
        if (
          get.attitude(player, event.target) > 1 &&
          player.countCards("h", "shan") > 1 &&
          player.countCards("h") > event.target.countCards("h")
        ) {
          next.set("shan", true)
        }
        if (get.attitude(player, event.target) > 0 && player.needsToDiscard()) {
          next.set("goon", true)
        }
      } else {
        event.finish()
      }
      ;("step 4")
      if (result.bool) {
        player.give(result.cards, target)
      }
    },
    ai: {
      expose: 0.2,
      threaten: 1.4,
    },
  },
  // 舍宴
  sheyan: {
    audio: 2,
    trigger: { target: "useCardToTarget" },
    filter(event, player) {
      if (!event.targets?.includes(player)) {
        return false
      }
      const info = get.info(event.card)
      if (info?.type !== "trick") {
        return false
      }
      if (info.multitarget) {
        return false
      }
      if (event.targets.length > 1) {
        return true
      }
      return game.hasPlayer((current) => {
        return (
          !event.targets.includes(current) &&
          lib.filter.targetEnabled2(event.card, event.player, current)
        )
      })
    },
    async cost(event, trigger, player) {
      const bool1 = game.hasPlayer((current) => {
        return (
          !trigger.targets.includes(current) &&
          lib.filter.targetEnabled2(trigger.card, trigger.player, current)
        )
      })
      const bool2 = trigger.targets.length > 1
      let str = ""
      if (bool1) {
        str += `为${get.translation(trigger.card)}增加一个目标`
      }
      if (bool1 && bool2) {
        str += `，或`
      }
      if (bool2) {
        str += `为${get.translation(trigger.card)}减少一个目标`
      }
      const next = player
        .chooseTarget(get.prompt(event.skill), str, (card, player, target) => {
          const trigger = get.event().getTrigger()
          if (trigger.targets.includes(target) && trigger.targets.length > 1) {
            return true
          }
          return (
            !trigger.targets.includes(target) &&
            lib.filter.targetEnabled2(trigger.card, trigger.player, target)
          )
        })
        .set("ai", (target) => {
          const player = get.player()
          const trigger = get.event().getTrigger()
          return (
            get.effect(target, trigger.card, player, player) *
            (trigger.targets.includes(target) ? -1 : 1)
          )
        })
        .set("targets", trigger.targets)
      next.targetprompt2.add((target) => {
        const trigger = get.event().getTrigger()
        if (
          !target.classList.contains("selectable") ||
          !trigger.targets.includes(target)
        ) {
          return
        }
        return "可无效"
      })
      event.result = await next.forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      event.type = trigger.targets.includes(target) ? "remove" : "add"
      if (!event.isMine() && !event.isOnline()) {
        await game.delayx()
      }
      if (event.type === "remove") {
        trigger.getParent().excluded.add(target)
        game.log(trigger.card, "对", target, "无效")
      } else {
        trigger.targets.add(target)
        game.log(target, "成为了", trigger.card, "的目标")
      }
    },
    ai: { expose: 0.2 },
  },
  // 孙乾
  // 谦雅
  qianya: {
    audio: 2,
    trigger: { target: "useCardToTargeted" },
    filter(event, player) {
      return get.type(event.card, "trick") === "trick" && player.countCards("h")
    },
    async cost(event, trigger, player) {
      const nh = player.countCards("h")
      event.result = await player
        .chooseCardTarget({
          filterCard: true,
          filterTarget(card, player, target) {
            return target !== player
          },
          selectCard: [1, nh],
          allowChooseAll: true,
          ai1(card) {
            var player = _status.event.player
            var cardname = _status.event.cardname
            if (_status.event.du) {
              return -get.value(card, player, "raw")
            }
            if (_status.event.shuimeng) {
              if (cardname === "wuzhong") {
                if (
                  player.needsToDiscard(2, (i, player) => {
                    return (
                      !ui.selected.cards.includes(i) &&
                      !player.canIgnoreHandcard(i)
                    )
                  })
                ) {
                  return 10 - get.value(card, player, "raw")
                }
              } else if (cardname === "guohe") {
                if (
                  player.needsToDiscard(-1, (i, player) => {
                    return (
                      !ui.selected.cards.includes(i) &&
                      !player.canIgnoreHandcard(i)
                    )
                  })
                ) {
                  return 10 - get.value(card, player, "raw")
                }
              }
              return 0
            }
            if (cardname === "lebu") {
              if (
                player.needsToDiscard(1, (i, player) => {
                  return (
                    !ui.selected.cards.includes(i) &&
                    !player.canIgnoreHandcard(i)
                  )
                })
              ) {
                return 8 - get.value(card, player, "raw")
              }
              if (!ui.selected.cards.length) {
                return 6 - get.value(card, player, "raw")
              }
              return 0
            }
            if (cardname === "shunshou") {
              if (_status.event.nh <= 2) {
                return get.value(card, player, "raw")
              }
            } else if (cardname === "huogong") {
              if (player.hp === 1) {
                return get.value(card, player, "raw")
              }
            }
            if (ui.selected.cards.length) {
              return 0
            }
            return 7 - get.value(card, player, "raw")
          },
          ai2(target) {
            var att = get.attitude(_status.event.player, target)
            var nh2 = target.countCards("h")
            var num = Math.sqrt(1 + nh2)
            var cardname = _status.event.cardname
            if (_status.event.du) {
              return 0.5 - att
            }
            if (_status.event.shuimeng) {
              return att / num
            }
            if (cardname === "lebu") {
              return att / num
            }
            if (cardname === "shunshou") {
              if (_status.event.nh <= 2) {
                return att / num
              }
            } else if (cardname === "huogong") {
              if (_status.event.player.hp === 1) {
                return att / num
              }
            }
            if (_status.event.nh > nh2 + 1) {
              return att / num
            }
            return 0
          },
          du: player.hasCard((card) => get.value(card, player, "raw") < 0),
          shuimeng: (() => {
            if (trigger.card.name === "guohe") {
              return trigger.getParent(2).name === "shuimeng"
            }
            if (trigger.card.name === "wuzhong") {
              return trigger.getParent(3).name === "shuimeng"
            }
          })(),
          nh: nh,
          cardname: trigger.card.name,
          prompt: get.prompt2(event.skill),
        })
        .forResult()
    },
    async content(event, trigger, player) {
      player.give(event.cards, event.targets[0])
    },
  },
  // 说盟
  shuimeng: {
    audio: 2,
    trigger: { player: "phaseUseAfter" },
    direct: true,
    filter(event, player) {
      return player.countCards("h")
    },
    content() {
      "step 0"
      player
        .chooseTarget(get.prompt2("shuimeng"), (card, player, target) =>
          player.canCompare(target),
        )
        .set("ai", (target) => {
          if (!_status.event.goon) {
            return 0
          }
          return -get.attitude(_status.event.player, target)
        })
        .set(
          "goon",
          player.needsToDiscard() ||
            player.hasCard((card) => {
              var val = get.value(card)
              if (val < 0) {
                return true
              }
              if (val <= 5) {
                return card.number >= 11
              }
              if (val <= 6) {
                return card.number >= 12
              }
              return false
            }),
        )
      ;("step 1")
      if (result.bool) {
        player.logSkill("shuimeng", result.targets)
        event.target = result.targets[0]
        player.chooseToCompare(event.target)
      } else {
        event.finish()
      }
      ;("step 2")
      if (result.bool) {
        player.chooseUseTarget({ name: "wuzhong", isCard: true }, true)
      } else {
        event.target.useCard({ name: "guohe", isCard: true }, player)
      }
    },
  },
  // 丁奉
  // 短兵
  duanbing: {
    audio: 2,
    trigger: { player: "useCard2" },
    filter(event, player) {
      if (event.card.name !== "sha") {
        return false
      }
      return game.hasPlayer(
        (current) =>
          !event.targets.includes(current) &&
          get.distance(player, current) <= 1 &&
          player.canUse(event.card, current),
      )
    },
    direct: true,
    content() {
      "step 0"
      player
        .chooseTarget(
          get.prompt("duanbing"),
          `为${get.translation(trigger.card)}增加一个目标`,
          (card, player, target) =>
            !_status.event.sourcex.includes(target) &&
            get.distance(player, target) <= 1 &&
            player.canUse(_status.event.card, target),
        )
        .set("sourcex", trigger.targets)
        .set("ai", (target) => {
          var player = _status.event.player
          return get.effect(target, _status.event.card, player, player)
        })
        .set("card", trigger.card)
      ;("step 1")
      if (result.bool) {
        if (!event.isMine() && !event.isOnline()) {
          game.delayx()
        }
        event.target = result.targets[0]
      } else {
        event.finish()
      }
      ;("step 2")
      player.logSkill("duanbing", event.target)
      trigger.targets.push(event.target)
    },
    ai: {
      effect: {
        player_use(card, player, target, current, isLink) {
          if (!isLink && card.name === "sha") {
            if (player._duanbingtmp) {
              return
            }
            player._duanbingtmp = true
            if (get.effect(target, card, player, player) <= 0) {
              delete player._duanbingtmp
              return
            }
            if (
              game.hasPlayer(
                (current) =>
                  current !== target &&
                  get.distance(player, current) <= 1 &&
                  player.canUse(card, current) &&
                  get.effect(current, card, player, player) > 0,
              )
            ) {
              delete player._duanbingtmp
              return [1, 1]
            }
            delete player._duanbingtmp
          }
        },
      },
    },
  },
  // 奋迅
  fenxun: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    position: "he",
    filterTarget(card, player, target) {
      return target !== player
    },
    content() {
      player.markAuto("fenxun2", [target])
      player.addTempSkill("fenxun2")
    },
    check(card) {
      if (
        card.name === "sha" &&
        _status.event.player.countCards("h", "sha") <= 1
      ) {
        return 0
      }
      return 6 - get.value(card)
    },
    filterCard: true,
    ai: {
      order: 4,
      result: {
        player(player, target) {
          if (get.distance(player, target) <= 1) {
            return 0
          }
          var hs = player.getCards("h", "shunshou")
          if (hs.length && player.canUse(hs[0], target, false)) {
            return 1
          }
          var geteff = (current) =>
            player.canUse("sha", current, false, true) &&
            get.effect(current, { name: "sha" }, player, player) > 0
          if (player.hasSha() && geteff(target)) {
            var num = game.countPlayer(
              (current) =>
                current !== player &&
                get.distance(player, current) <= 1 &&
                geteff(current),
            )
            if (num === 0) {
              if (
                game.hasPlayer(
                  (current) =>
                    player.canUse("sha", current) &&
                    geteff(current) &&
                    current !== target,
                )
              ) {
                return 1
              }
            } else if (num === 1) {
              return 1
            }
          }
          return 0
        },
      },
    },
  },
  fenxun2: {
    mark: "character",
    onremove: true,
    intro: {
      content: "到$的距离视为1",
    },
    mod: {
      globalFrom(from, to) {
        if (from.getStorage("fenxun2").includes(to)) {
          return -Infinity
        }
      },
    },
  },
  // 诸葛瑾
  // 缓释
  huanshi: {
    audio: 2,
    trigger: { global: "judge" },
    filter(event, player) {
      return player.countCards("he") > 0
    },
    logTarget: "player",
    check(event, player) {
      if (get.attitude(player, event.player) <= 0) {
        return false
      }
      var cards = player.getCards("he")
      var judge = event.judge(event.player.judging[0])
      for (var i = 0; i < cards.length; i++) {
        var judge2 = event.judge(cards[i])
        if (judge2 > judge) {
          return true
        }
        if (
          _status.currentPhase !== player &&
          judge2 === judge &&
          get.color(cards[i]) === "red" &&
          get.useful(cards[i]) < 5
        ) {
          return true
        }
      }
      return false
    },
    content() {
      "step 0"
      var target = trigger.player
      var judge = trigger.judge(target.judging[0])
      var attitude = get.attitude(target, player)
      target
        .choosePlayerCard("请选择代替判定的牌", "he", "visible", true, player)
        .set("ai", (button) => {
          var card = button.link
          var judge = _status.event.judge
          var attitude = _status.event.attitude
          var result = trigger.judge(card) - judge
          var player = _status.event.player
          if (result > 0) {
            return 20 + result
          }
          if (result === 0) {
            if (_status.currentPhase === player) {
              return 0
            }
            if (attitude >= 0) {
              return get.color(card) === "red" ? 7 : 0 - get.value(card)
            }
            return get.color(card) === "black" ? 10 : 0 + get.value(card)
          }
          if (attitude >= 0) {
            return get.color(card) === "red" ? 0 : -10 + result
          }
          return get.color(card) === "black" ? 0 : -10 + result
        })
        .set("filterButton", (button) => {
          var player = _status.event.target
          var card = button.link
          var mod2 = game.checkMod(
            card,
            player,
            "unchanged",
            "cardEnabled2",
            player,
          )
          if (mod2 !== "unchanged") {
            return mod2
          }
          var mod = game.checkMod(
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
        })
        .set("judge", judge)
        .set("attitude", attitude)
      ;("step 1")
      if (result.bool) {
        event.card = result.links[0]
        player.respond(event.card, "highlight", "noOrdering").nopopup = true
      } else {
        event.finish()
      }
      ;("step 2")
      if (result.bool) {
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
        game.cardsDiscard(trigger.player.judging[0])
        trigger.player.judging[0] = event.card
        trigger.orderingCards.add(event.card)
        game.log(trigger.player, "的判定牌改为", event.card)
        game.delay(2)
      }
    },
    ai: {
      rejudge: true,
      tag: {
        rejudge: 1,
      },
    },
  },
  // 弘援
  hongyuan: {
    trigger: { player: "phaseDrawBegin2" },
    direct: true,
    audio: 2,
    filter(event, player) {
      return !event.numFixed && event.num > 0
    },
    content() {
      "step 0"
      var check
      if (player.countCards("h") === 0) {
        check = false
      } else {
        check =
          game.countPlayer(
            (current) =>
              player !== current && get.attitude(player, current) > 1,
          ) >= 2
      }
      if (get.is.versus()) {
        event.versus = true
        player.chooseBool(get.prompt2("hongyuan")).ai = () =>
          game.countPlayer((current) => player.side === current.side) > 2
      } else {
        player
          .chooseTarget(
            get.prompt2("hongyuan"),
            [1, 2],
            (card, player, target) => player !== target,
            (target) => {
              if (!_status.event.check) {
                return 0
              }
              return get.attitude(_status.event.player, target)
            },
          )
          .set("check", check)
      }
      ;("step 1")
      if (result.bool) {
        var targets
        if (event.versus) {
          targets = game.filterPlayer(
            (current) => current !== player && current.side === player.side,
          )
        } else {
          targets = result.targets
        }
        player.logSkill("hongyuan", targets)
        game.asyncDraw(targets)
        trigger.num--
      }
    },
  },
  // 明哲
  mingzhe: {
    audio: 2,
    trigger: {
      player: ["useCard", "respond", "loseAfter"],
      global: "loseAsyncAfter",
    },
    frequent: true,
    getIndex(event, player) {
      if (event.name.indexOf("lose") !== 0) {
        return 1
      }
      return event
        .getl?.(player)
        ?.cards2?.filter((card) => get.color(card, player) === "red").length
    },
    filter(event, player) {
      if (player === _status.currentPhase) {
        return false
      }
      if (event.name.indexOf("lose") !== 0) {
        return get.color(event.card) === "red"
      }
      return event.type === "discard"
    },
    async content(event, trigger, player) {
      await player.draw()
    },
    ai: { threaten: 0.7 },
  },
  // 诸葛恪
  // 傲才
  aocai: {
    audio: 2,
    enable: ["chooseToUse", "chooseToRespond"],
    hiddenCard(player, name) {
      if (
        player !== _status.currentPhase &&
        get.type(name) === "basic" &&
        lib.inpile.includes(name)
      ) {
        return true
      }
    },
    filter(event, player) {
      if (event.responded || player === _status.currentPhase || event.aocai) {
        return false
      }
      return lib.inpile.some(
        (i) =>
          get.type(i) === "basic" &&
          event.filterCard(
            get.autoViewAs({ name: i }, "unsure"),
            player,
            event,
          ),
      )
    },
    delay: false,
    async content(event, trigger, player) {
      const evt = event.getParent(2)
      const cards = get.cards(2, true)
      const cardsx = cards.slice().map((card) => {
        const cardx = ui.create.card()
        cardx.init(get.cardInfo(card))
        cardx._cardid = card.cardid
        return cardx
      })
      evt.set("aocai", true)
      player.directgains(cardsx, null, "aocai_hs")
      const result = await player
        .chooseCard(
          `傲才：选择要${evt.name === "chooseToUse" ? "使用" : "打出"}的牌`,
          (card, player) => {
            return get.event().cards.includes(card)
          },
          "s",
        )
        .set(
          "cards",
          cardsx.filter((card) => {
            if (player.hasSkill("aozhan") && card.name === "tao") {
              return (
                evt.filterCard(
                  {
                    name: "sha",
                    isCard: true,
                    cards: [card],
                  },
                  evt.player,
                  evt,
                ) ||
                evt.filterCard(
                  {
                    name: "shan",
                    isCard: true,
                    cards: [card],
                  },
                  evt.player,
                  evt,
                )
              )
            }
            return evt.filterCard(card, evt.player, evt)
          }),
        )
        .set("ai", (card) => {
          if (get.type(card) === "equip") {
            return 0
          }
          const evt = get.event().getParent(3),
            player = get.event().player
          if (
            evt.type === "phase" &&
            !player.hasValueTarget(card, null, true)
          ) {
            return 0
          }
          if (evt?.ai) {
            const tmp = _status.event
            _status.event = evt
            const result = (evt.ai || event.ai1)(card, player, evt)
            _status.event = tmp
            return result
          }
          return 1
        })
        .forResult()
      let card
      if (result.bool) {
        card = cards.find((card) => card.cardid === result.cards[0]._cardid)
      }
      const cards2 = player.getCards("s", (card) => card.hasGaintag("aocai_hs"))
      if (player.isOnline2()) {
        player.send(
          (cards, player) => {
            cards.forEach((i) => i.delete())
            if (player === game.me) {
              ui.updatehl()
            }
          },
          cards2,
          player,
        )
      }
      cards2.forEach((i) => i.delete())
      if (player === game.me) {
        ui.updatehl()
      }
      if (card) {
        let name = card.name,
          aozhan = player.hasSkill("aozhan") && name === "tao"
        if (aozhan) {
          name = evt.filterCard(
            {
              name: "sha",
              isCard: true,
              cards: [card],
            },
            evt.player,
            evt,
          )
            ? "sha"
            : "shan"
        }
        if (evt.name === "chooseToUse") {
          game.broadcastAll(
            (result, name) => {
              lib.skill.aocai_backup.viewAs = {
                name: name,
                cards: [result],
                isCard: true,
              }
            },
            card,
            name,
          )
          evt.set("_backupevent", "aocai_backup")
          evt.set("openskilldialog", `请选择${get.translation(card)}的目标`)
          evt.backup("aocai_backup")
        } else {
          delete evt.result.used
          delete evt.result.skill
          evt.result.card = get.autoViewAs(card)
          if (aozhan) {
            evt.result.card.name = name
          }
          evt.result.cards = [card]
          evt.redo()
          return
        }
      }
      evt.goto(0)
    },
    ai: {
      effect: {
        target(card, player, target, effect) {
          if (get.tag(card, "respondShan")) {
            return 0.7
          }
          if (get.tag(card, "respondSha")) {
            return 0.7
          }
        },
      },
      order: 11,
      respondShan: true,
      respondSha: true,
      result: {
        player(player) {
          if (_status.event.dying) {
            return get.attitude(player, _status.event.dying)
          }
          return 1
        },
      },
    },
    subSkill: {
      backup: {
        precontent() {
          var name = event.result.card.name,
            cards = event.result.card.cards.slice(0)
          event.result.cards = cards
          var rcard = cards[0],
            card
          if (rcard.name === name) {
            card = get.autoViewAs(rcard)
          } else {
            card = get.autoViewAs({ name, isCard: true })
          }
          event.result.card = card
          event.result._apply_args = { addSkillCount: false }
        },
        filterCard: () => false,
        selectCard: -1,
        log: false,
      },
    },
  },
  // 黩武
  duwu: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return game.hasPlayer(
        (current) =>
          current.hp > 0 &&
          current.hp <= player.countCards("he") &&
          player.inRange(current),
      )
    },
    filterCard() {
      if (ui.selected.targets.length) {
        return false
      }
      return true
    },
    position: "he",
    selectCard: [1, Infinity],
    complexSelect: true,
    complexCard: true,
    filterTarget(card, player, target) {
      return (
        target !== player &&
        target.hp > 0 &&
        player.inRange(target) &&
        ui.selected.cards.length === target.hp
      )
    },
    check(card) {
      var player = _status.event.player
      if (
        game.hasPlayer(
          (current) =>
            current !== player &&
            current.hp > 0 &&
            player.inRange(current) &&
            ui.selected.cards.length === current.hp &&
            get.damageEffect(current, player, player) > 0,
        )
      ) {
        return 0
      }
      switch (ui.selected.cards.length) {
        case 0:
          return 8 - get.value(card)
        case 1:
          return 6 - get.value(card)
        case 2:
          return 3 - get.value(card)
        default:
          return 0
      }
    },
    content() {
      player.addTempSkill("duwu2")
      target.damage("nocard")
    },
    ai: {
      damage: true,
      order: 2,
      result: {
        target(player, target) {
          return get.damageEffect(target, player)
        },
      },
      threaten: 1.5,
      expose: 0.3,
    },
  },
  duwu2: {
    trigger: { global: "dyingAfter" },
    forced: true,
    popup: false,
    charlotte: true,
    sourceSkill: "duwu",
    filter(event, player) {
      if (!event.reason) {
        return false
      }
      const evt = event.reason.getParent()
      return evt.name === "duwu" && evt.player === player
    },
    content() {
      player.loseHp()
      player.tempBanSkill("duwu")
    },
  },
  // SP庞统
  // 过论
  guolun: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    filterTarget(card, player, target) {
      return target !== player && target.countCards("h") > 0
    },
    content() {
      "step 0"
      player.choosePlayerCard(target, true, "h")
      ;("step 1")
      event.cardt = result.cards[0]
      target.showCards(event.cardt)
      player.chooseCard("he").set("ai", (card) => {
        var event = _status.event.getParent(),
          player = event.player
        var numt = get.number(event.cardt)
        var att = get.attitude(player, target)
        var value = get.value(event.cardt)
        var num = get.number(card)
        if (num < numt || att > 2) {
          return value + 6 - get.value(card)
        }
        if (num === numt) {
          return value - get.value(card)
        }
        return -1
      })
      ;("step 2")
      if (!result.bool) {
        event.finish()
      } else {
        player.showCards(result.cards)
        event.cardp = result.cards[0]
      }
      ;("step 3")
      player.swapHandcards(target, [event.cardp], [event.cardt])
      ;("step 4")
      var nump = get.number(event.cardp, player)
      var numt = get.number(event.cardt, target)
      if (nump < numt) {
        player.draw()
      } else if (nump > numt) {
        target.draw()
      }
    },
    ai: {
      threaten: 1.5,
      order: 8,
      result: {
        player(player, target) {
          if (get.attitude(player, target) > 0) {
            return 1.5
          }
          return 0.5
        },
      },
    },
  },
  // 送丧
  songsang: {
    limited: true,
    skillAnimation: true,
    animationColor: "wood",
    audio: 2,
    derivation: "zhanji",
    trigger: { global: "dieAfter" },
    logTarget: "player",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      if (player.isDamaged()) {
        await player.recover()
      } else {
        await player.gainMaxHp()
      }
      player.addSkills("zhanji")
    },
  },
  // 展骥
  zhanji: {
    audio: 2,
    trigger: {
      player: "gainAfter",
    },
    forced: true,
    filter(event, player) {
      if (!player.isPhaseUsing()) {
        return false
      }
      return (
        event.getParent().name === "draw" &&
        event.getParent(2).name !== "zhanji"
      )
    },
    content() {
      player.draw("nodelay")
    },
  },
  // 严畯
  // 观潮
  guanchao: {
    subSkill: {
      dizeng: {
        mark: true,
        marktext: "增",
        intro: {
          content: "严格递增",
        },
        trigger: {
          player: "useCard",
        },
        audio: "guanchao",
        forced: true,
        mod: {
          aiOrder(player, card, num) {
            if (typeof card.number !== "number") {
              return
            }
            var history = player.getHistory(
              "useCard",
              (evt) =>
                evt.isPhaseUsing() &&
                evt.getParent("phaseUse") ===
                  _status.event.getParent("phaseUse"),
            )
            if (history.length === 0) {
              return num + 10 * (14 - card.number)
            }
            var num = get.number(history[0].card)
            if (!num) {
              return
            }
            for (var i = 1; i < history.length; i++) {
              var num2 = get.number(history[i].card)
              if (!num2 || num2 <= num) {
                return
              }
              num = num2
            }
            if (card.number > num) {
              return num + 10 * (14 - card.number)
            }
          },
        },
        filter(event, player) {
          var history = player.getHistory(
            "useCard",
            (evt) =>
              evt.isPhaseUsing() &&
              evt.getParent("phaseUse") === event.getParent("phaseUse"),
          )
          if (history.length < 2) {
            return false
          }
          var num = get.number(history[0].card)
          if (!num) {
            return false
          }
          for (var i = 1; i < history.length; i++) {
            var num2 = get.number(history[i].card)
            if (!num2 || num2 <= num) {
              return false
            }
            num = num2
          }
          return true
        },
        content() {
          player.draw()
        },
        sub: true,
      },
      dijian: {
        mark: true,
        marktext: "减",
        intro: {
          content: "严格递减",
        },
        init(player) {
          player.storage.guanchao = 0
        },
        onremove(player) {
          delete player.storage.guanchao
        },
        trigger: {
          player: "useCard",
        },
        audio: "guanchao",
        forced: true,
        mod: {
          aiOrder(player, card, num) {
            if (typeof card.number !== "number") {
              return
            }
            var history = player.getHistory(
              "useCard",
              (evt) =>
                evt.isPhaseUsing() &&
                evt.getParent("phaseUse") ===
                  _status.event.getParent("phaseUse"),
            )
            if (history.length === 0) {
              return num + 10 * card.number
            }
            var num = get.number(history[0].card)
            if (!num) {
              return
            }
            for (var i = 1; i < history.length; i++) {
              var num2 = get.number(history[i].card)
              if (!num2 || num2 >= num) {
                return
              }
              num = num2
            }
            if (card.number < num) {
              return num + 10 * card.number
            }
          },
        },
        filter(event, player) {
          var history = player.getHistory(
            "useCard",
            (evt) =>
              evt.isPhaseUsing() &&
              evt.getParent("phaseUse") === event.getParent("phaseUse"),
          )
          if (history.length < 2) {
            return false
          }
          var num = get.number(history[0].card)
          if (!num) {
            return false
          }
          for (var i = 1; i < history.length; i++) {
            var num2 = get.number(history[i].card)
            if (!num2 || num2 >= num) {
              return false
            }
            num = num2
          }
          return true
        },
        content() {
          player.draw()
        },
        sub: true,
      },
    },
    audio: 2,
    trigger: {
      player: "phaseUseBegin",
    },
    direct: true,
    content() {
      "step 0"
      var list = ["递增", "递减", "取消"]
      player
        .chooseControl(list)
        .set("prompt", get.prompt2("guanchao"))
        .set("ai", () => [0, 1].randomGet())
      ;("step 1")
      switch (result.control) {
        case "递增": {
          player.logSkill("guanchao")
          player.addTempSkill("guanchao_dizeng", "phaseUseEnd")
          break
        }
        case "递减": {
          player.logSkill("guanchao")
          player.addTempSkill("guanchao_dijian", "phaseUseEnd")
          break
        }
        case "取消": {
          break
        }
      }
    },
  },
  // 逊贤
  xunxian: {
    usable: 1,
    audio: 2,
    trigger: {
      player: ["useCardAfter", "respond"],
    },
    filter(event, player) {
      if (
        player.isPhaseUsing() ||
        get.itemtype(event.cards) !== "cards" ||
        !game.hasPlayer((current) => {
          if (current === player) {
            return false
          }
          return current.countCards("h") > player.countCards("h")
        })
      ) {
        return false
      }
      for (var i = 0; i < event.cards.length; i++) {
        if (event.cards[i].isInPile()) {
          return true
        }
      }
      return false
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(get.prompt2(event.skill), (card, player, target) => {
          if (target === player) {
            return false
          }
          return target.countCards("h") > player.countCards("h")
        })
        .set("ai", (target) => {
          let att = get.attitude(_status.event.player, target),
            name = _status.event.cards[0].name
          if (att < 3) {
            return 0
          }
          if (target.hasJudge("lebu")) {
            att /= 5
          }
          if (name === "sha" && target.hasSha()) {
            att /= 5
          }
          if (name === "wuxie" && target.needsToDiscard(_status.event.cards)) {
            att /= 5
          }
          return att / (1 + get.distance(player, target, "absolute"))
        })
        .set("cards", trigger.cards)
        .forResult()
    },
    async content(event, trigger, player) {
      const list = []
      for (let i = 0; i < trigger.cards.length; i++) {
        if (trigger.cards[i].isInPile()) {
          list.push(trigger.cards[i])
        }
      }
      if (get.mode() !== "identity" || player.identity !== "nei") {
        player.addExpose(0.2)
      }
      event.targets[0].gain(list, "gain2").giver = player
    },
  },
  // 何太后
  // 鸩毒
  zhendu: {
    audio: 2,
    trigger: { global: "phaseUseBegin" },
    filter(event, player) {
      return (
        event.player !== player &&
        event.player.isIn() &&
        player.countCards("h") > 0 &&
        event.player.hasUseTarget({ name: "jiu" }, null, event)
      )
    },
    direct: true,
    preHidden: true,
    content() {
      "step 0"
      var nono = Math.abs(get.attitude(player, trigger.player)) < 3
      if (
        player === trigger.player ||
        get.damageEffect(trigger.player, player, player) <= 0 ||
        !trigger.player.hasUseTarget({ name: "jiu" }, null, trigger)
      ) {
        nono = true
      } else if (trigger.player.hp > 2) {
        nono = true
      } else if (
        trigger.player.hp > 1 &&
        player.countCards("h") < 3 &&
        trigger.player.canUse("sha", player) &&
        !player.countCards("h", "shan") &&
        trigger.player.countCards("h") >= 3
      ) {
        nono = true
      }
      var next = player.chooseToDiscard(get.prompt2("zhendu", trigger.player))
      next.set("ai", (card) => {
        if (_status.event.nono) {
          return -1
        }
        return 7 - get.useful(card)
      })
      next.set("logSkill", ["zhendu", trigger.player])
      next.set("nono", nono)
      next.setHiddenSkill("zhendu")
      ;("step 1")
      if (result.bool) {
        trigger.player.chooseUseTarget(
          { name: "jiu" },
          true,
          "noTargetDelay",
          "nodelayx",
        )
      } else {
        event.finish()
      }
      ;("step 2")
      if (result.bool && trigger.player !== player) {
        trigger.player.damage()
      }
    },
    ai: {
      threaten: 2,
      expose: 0.3,
    },
  },
  // 戚乱
  qiluan: {
    audio: 2,
    preHidden: true,
    trigger: { global: "phaseEnd" },
    frequent: true,
    filter(event, player) {
      return (player.getStat("kill") || 0) > 0
    },
    prompt(event, player) {
      var num = (player.getStat("kill") || 0) * 3
      return `${get.prompt("qiluan")}（可摸${get.cnNumber(num)}张牌）`
    },
    content() {
      //if(get.mode()=='guozhan'){
      //	player.draw(3);
      //}
      //else{
      player.draw((player.getStat("kill") || 0) * 3)
      //}
    },
    subSkill: {
      draw: {
        audio: "qiluan",
        trigger: { global: "dieAfter" },
        frequent: true,
        filter(event, player) {
          return /*get.mode()!='guozhan'&&*/ player !== event.source
        },
        content() {
          player.draw()
        },
      },
    },
  },
  // 刘协
  // 天命
  tianming: {
    audio: 2,
    trigger: { target: "useCardToTargeted" },
    check(event, player) {
      var cards = player.getCards("h")
      if (cards.length <= 2) {
        for (var i = 0; i < cards.length; i++) {
          if (cards[i].name === "shan" || cards[i].name === "tao") {
            return false
          }
        }
      }
      return true
    },
    filter(event, player) {
      return event.card.name === "sha"
    },
    content() {
      "step 0"
      player.chooseToDiscard(2, true, "he")
      player.draw(2)
      var players = game.filterPlayer()
      players.sort((a, b) => b.hp - a.hp)
      if (players[0].hp > players[1].hp && players[0] !== player) {
        players[0].chooseBool(get.prompt2("tianming"))
        event.player = players[0]
      } else {
        event.finish()
      }
      ;("step 1")
      if (result.bool) {
        player.chooseToDiscard(2, true, "he")
        player.draw(2)
      }
    },
    ai: {
      effect: {
        target_use(card, player, target, current) {
          if (card.name === "sha") {
            return [1, 0.5]
          }
        },
      },
    },
  },
  // 密诏
  mizhao: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    filterCard: true,
    selectCard: -1,
    filterTarget(card, player, target) {
      return player !== target
    },
    discard: false,
    lose: false,
    delay: false,
    ai: {
      order: 1,
      result: {
        player: 0,
        target(player, target) {
          if (target.hasSkillTag("nogain")) {
            return 0
          }
          if (player.countCards("h") > 1) {
            return 1
          }
          var players = game.filterPlayer()
          for (var i = 0; i < players.length; i++) {
            if (
              players[i].countCards("h") &&
              players[i] !== target &&
              players[i] !== player &&
              get.attitude(player, players[i]) < 0
            ) {
              break
            }
          }
          if (i === players.length) {
            return 1
          }
          return -2 / (target.countCards("h") + 1)
        },
      },
    },
    content() {
      "step 0"
      event.target1 = targets[0]
      player.give(cards, targets[0], false)
      ;("step 1")
      if (!targets[0].countCards("h")) {
        event.finish()
        return
      }
      var players = game.filterPlayer()
      for (var i = 0; i < players.length; i++) {
        if (
          players[i] !== event.target1 &&
          players[i] !== player &&
          event.target1.canCompare(players[i])
        ) {
          break
        }
      }
      if (i === players.length) {
        event.finish()
      }
      ;("step 2")
      player
        .chooseTarget(
          true,
          "选择拼点目标",
          (card, player, target) =>
            _status.event.target1.canCompare(target) && target !== player,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          var eff = get.effect(
            target,
            { name: "sha" },
            _status.event.target1,
            player,
          )
          var att = get.attitude(player, target)
          if (att > 0) {
            return eff - 10
          }
          return eff
        })
        .set("target1", event.target1)
        .set("forceDie", true)
      ;("step 3")
      if (result.targets.length) {
        event.target2 = result.targets[0]
        event.target1.line(event.target2)
        event.target1.chooseToCompare(event.target2)
      } else {
        event.finish()
      }
      ;("step 4")
      if (!result.tie) {
        if (result.bool) {
          if (
            event.target1.canUse(
              { name: "sha", isCard: true },
              event.target2,
              false,
            )
          ) {
            event.target1.useCard({ name: "sha", isCard: true }, event.target2)
          }
        } else if (
          event.target2.canUse(
            { name: "sha", isCard: true },
            event.target1,
            false,
          )
        ) {
          event.target2.useCard({ name: "sha", isCard: true }, event.target1)
        }
      }
    },
  },
  // SP黄月英
  // 机巧
  jiqiao: {
    audio: 2,
    trigger: { player: "phaseUseBegin" },
    direct: true,
    filter(event, player) {
      return player.countCards("he", { type: "equip" }) > 0
    },
    content() {
      "step 0"
      player
        .chooseToDiscard(
          get.prompt2("jiqiao"),
          [1, player.countCards("he", { type: "equip" })],
          "he",
          (card) => get.type(card) === "equip",
          "allowChooseAll",
        )
        .set("ai", (card) => {
          if (card.name === "bagua") {
            return 10
          }
          return 7 - get.value(card)
        }).logSkill = "jiqiao"
      ;("step 1")
      if (result.bool) {
        event.cards = get.cards(2 * result.cards.length)
        player.showCards(event.cards)
      } else {
        event.finish()
      }
      ;("step 2")
      var gained = []
      var tothrow = []
      for (var i = 0; i < event.cards.length; i++) {
        if (get.type(event.cards[i], "trick") === "trick") {
          gained.push(event.cards[i])
        } else {
          tothrow.push(event.cards[i])
        }
      }
      player.gain(gained, "gain2")
      game.cardsDiscard(tothrow)
    },
    ai: {
      threaten: 1.5,
    },
  },
  // 玲珑
  linglong: {
    audio: 2,
    trigger: {
      player: ["loseAfter", "disableEquipAfter", "enableEquipAfter"],
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
        "phaseBefore",
      ],
    },
    init(player, skill) {
      player.addExtraEquip(
        skill,
        "bagua",
        true,
        (player) => !player.getEquips(2).length && lib.card.bagua,
      )
    },
    onremove(player, skill) {
      delete player.storage[skill]
      player.removeExtraEquip(skill)
    },
    forced: true,
    derivation: "reqicai",
    filter(event, player) {
      if (event.name === "disableEquip" || event.name === "enableEquip") {
        if (!event.slots.includes("equip5")) {
          return false
        }
      } else if (
        event.name !== "phase" &&
        (event.name !== "equip" || event.player !== player)
      ) {
        var evt = event.getl(player)
        if (!evt?.es?.some((i) => get.subtypes(i).includes("equip5"))) {
          return false
        }
      }
      const skills = player.additionalSkills.linglong
      return (skills && skills.length > 0) !== player.hasEmptySlot(5)
    },
    direct: true,
    content() {
      player.removeAdditionalSkill("linglong")
      if (player.hasEmptySlot(5)) {
        player.addAdditionalSkill("linglong", ["reqicai"])
      }
    },
    group: "linglong_bagua",
    mod: {
      maxHandcard(player, num) {
        if (!player.hasEmptySlot(3) || !player.hasEmptySlot(4)) {
          return
        }
        return num + 1
      },
      /*targetInRange(card, player, target, now) {
				if (!player.hasEmptySlot(5)) return;
				var type = get.type(card);
				if (type == "trick" || type == "delay") return true;
			},
			canBeDiscarded(card, source, player) {
				if (!player.hasEmptySlot(5)) return;
				if (get.position(card) == "e" && get.subtypes(card).some(slot => slot == "equip2" || slot == "equip5")) return false;
			},
			cardDiscardable:function (card,player){
				if(player.getEquip(5)) return;
				if(get.position(card)=='e') return false;
			},*/
    },
  },
  linglong_bagua: {
    audio: "linglong",
    inherit: "bagua_skill",
    sourceSkill: "linglong",
    filter(event, player) {
      if (!lib.skill.bagua_skill.filter(event, player)) {
        return false
      }
      if (!player.hasEmptySlot(2)) {
        return false
      }
      return true
    },
    ai: {
      respondShan: true,
      freeShan: true,
      skillTagFilter(player, tag, arg) {
        if (tag !== "respondShan" && tag !== "freeShan") {
          return
        }
        if (!player.hasEmptySlot(2) || player.hasSkillTag("unequip2")) {
          return false
        }
        if (!arg?.player) {
          return true
        }
        if (
          arg.player.hasSkillTag("unequip", false, {
            target: player,
          })
        ) {
          return false
        }
        return true
      },
      effect: {
        target(card, player, target) {
          if (player === target && get.subtype(card) === "equip2") {
            if (get.equipValue(card) <= 7.5) {
              return 0
            }
          }
          if (target.getEquip(2)) {
            return
          }
          return lib.skill.bagua_skill.ai.effect.target.apply(this, arguments)
        },
      },
    },
  },
  // 蹋顿
  // 乱战
  luanzhan: {
    mod: {
      selectTarget(card, player, range) {
        if (!player.storage.luanzhan) {
          return
        }
        if (range[1] === -1) {
          return
        }
        if (card.name === "sha") {
          range[1] += player.storage.luanzhan
        }
        if (get.color(card) === "black" && get.type(card) === "trick") {
          var info = get.info(card)
          if (info.multitarget) {
            return false
          }
          range[1] += player.storage.luanzhan
        }
      },
    },
    trigger: { source: "damageSource" },
    audio: 2,
    forced: true,
    mark: true,
    intro: {
      content(storage) {
        return `可以多选择至多${storage}名角色为目标`
      },
    },
    init(player) {
      player.storage.luanzhan = 0
    },
    init2(player) {
      player.markSkill("luanzhan")
    },
    content() {
      if (typeof player.storage.luanzhan === "number") {
        player.storage.luanzhan += trigger.num
      } else {
        player.storage.luanzhan = trigger.num
      }
      if (player.hasSkill("luanzhan")) {
        player.markSkill("luanzhan")
      }
    },
    group: "luanzhan_cancel",
    subSkill: {
      cancel: {
        audio: "luanzhan",
        trigger: { player: "useCard" },
        forced: true,
        filter(event, player) {
          if (!player.storage.luanzhan) {
            return false
          }
          var check = false
          var card = event.card
          if (card.name === "sha") {
            check = true
          } else if (
            get.color(card) === "black" &&
            get.type(card) === "trick"
          ) {
            var info = get.info(card)
            if (!info.multitarget) {
              check = true
              if (info.selectTarget === -1) {
                check = false
              } else if (
                Array.isArray(info.selectTarget) &&
                info.selectTarget[1] === -1
              ) {
                check = false
              }
            }
          }
          if (
            check &&
            event.targets &&
            event.targets.length < player.storage.luanzhan
          ) {
            return true
          }
          return false
        },
        content() {
          player.storage.luanzhan = 0
          player.markSkill("luanzhan")
        },
      },
    },
  },
  // 刘繇
  // 戡难
  kannan: {
    audio: 2,
    enable: "phaseUse",
    usable(skill, player) {
      return player.hp
    },
    filter(event, player) {
      return game.hasPlayer((current) =>
        lib.skill.kannan.filterTarget(null, player, current),
      )
    },
    filterTarget(card, player, target) {
      if (target.hasSkill("kannan_phase")) {
        return false
      }
      return player.canCompare(target)
    },
    async content(event, trigger, player) {
      const { target, name: skillName } = event
      target.addTempSkill(`${skillName}_phase`)
      const { bool } = await player.chooseToCompare(target).forResult()
      if (bool) {
        player.tempBanSkill(skillName)
        player.addSkill(`${skillName}_effect`)
        player.addMark(`${skillName}_effect`, 1, false)
      } else {
        target.addSkill(`${skillName}_effect`)
        target.addMark(`${skillName}_effect`, 1, false)
      }
    },
    ai: {
      order() {
        return get.order({ name: "sha" }) + 0.4
      },
      result: {
        target(player, target) {
          if (
            player.hasCard((card) => {
              if (get.position(card) !== "h") {
                return false
              }
              var val = get.value(card)
              if (val < 0) {
                return true
              }
              if (val <= 5) {
                return card.number >= 12
              }
              if (val <= 6) {
                return card.number >= 13
              }
              return false
            })
          ) {
            return -1
          }
          return 0
        },
      },
    },
    subSkill: {
      phase: { charlotte: true },
      effect: {
        charlotte: true,
        onremove: true,
        trigger: {
          player: "useCard",
        },
        filter(event) {
          return event.card?.name === "sha"
        },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          if (!trigger.baseDamage) {
            trigger.baseDamage = 1
          }
          trigger.baseDamage += player.countMark(event.name)
          player.removeSkill(event.name)
        },
        intro: {
          content: "下一张【杀】的伤害值基数+#",
        },
      },
    },
  },
  // 陈琳
  // 笔伐
  bifa: {
    trigger: { player: "phaseJieshuBegin" },
    direct: true,
    audio: 2,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    content() {
      "step 0"
      player.chooseCardTarget({
        filterCard: true,
        filterTarget(card, player, target) {
          return player !== target && !target.getExpansions("bifa2").length
        },
        ai1(card) {
          return 7 - get.value(card)
        },
        ai2(target) {
          var num = target.hasSkillTag("maixie") ? 2 : 0
          return -get.attitude(_status.event.player, target) - num
        },
        prompt: get.prompt2("bifa"),
      })
      ;("step 1")
      if (result.bool) {
        event.forceDie = true
        var target = result.targets[0]
        event.target = target
        player.logSkill("bifa", result.targets[0])
        event.card = result.cards[0]
        target.storage.bifa2 = [result.cards[0], player]
        if (!_status.connectMode && player.isUnderControl(true)) {
          player.$giveAuto(result.cards[0], target, false)
        } else {
          player.$give(1, target, false)
        }
        target.addToExpansion(result.cards[0]).gaintag.add("bifa2")
      } else {
        event.finish()
      }
      ;("step 2")
      if (target.getExpansions("bifa2").includes(card)) {
        target.addSkill("bifa2")
      } else {
        delete target.storage.bifa2
      }
    },
    ai: {
      threaten: 1.7,
      expose: 0.3,
    },
  },
  bifa2: {
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    charlotte: true,
    audio: false,
    sourceSkill: "bifa",
    filter(event, player) {
      return (
        player.storage.bifa2 &&
        player.getExpansions("bifa2").includes(player.storage.bifa2[0])
      )
    },
    content() {
      "step 0"
      if (player.storage.bifa2[1].isIn() && player.countCards("h")) {
        player
          .chooseCard(
            `${get.translation(player.storage.bifa2[1])}的笔伐牌为：`,
            (card) => get.type(card, "trick") === _status.event.type,
          )
          .set("ai", (card) => 8 - get.value(card))
          .set("type", get.type(player.storage.bifa2[0], "trick"))
          .set("promptx", [
            [player.storage.bifa2[0]],
            "请交给其一张与此牌类别相同的手牌，否则失去1点体力",
          ])
      } else {
        event.directfalse = true
      }
      ;("step 1")
      if (result.bool && !event.directfalse) {
        player.give(result.cards, player.storage.bifa2[1])
        player.gain(player.storage.bifa2[0], "draw")
      } else {
        player.loseHp()
      }
      ;("step 2")
      player.removeSkill("bifa2")
    },
    marktext: "檄",
    intro: {
      markcount: () => 1,
      name: "笔伐",
      content: "已成为〖笔伐〗的目标",
    },
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
      delete player.storage[skill]
    },
  },
  // 颂词
  songci: {
    onChooseToUse(event) {
      event.targetprompt2.add((target) => {
        if (
          event.skill !== "songci" ||
          !target.classList.contains("selectable")
        ) {
          return
        }
        if (target.countCards("h") > target.hp) {
          return "弃牌"
        }
        return "摸牌"
      })
    },
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return game.hasPlayer((current) =>
        get.info("songci").filterTarget(null, player, current),
      )
    },
    filterTarget(card, player, target) {
      return (
        !player.getStorage("songci").includes(target) &&
        target.countCards("h") !== target.hp
      )
    },
    logAudio(event, player) {
      const target = event.targets[0],
        goon = target.countCards("h") > target.hp
      return goon ? "songci2.mp3" : "songci1.mp3"
    },
    async content(event, trigger, player) {
      const { target } = event,
        goon = target.countCards("h") > target.hp
      player.markAuto(event.name, [target])
      if (goon) {
        await target.chooseToDiscard(2, "he", true)
      } else {
        await target.draw(2)
      }
    },
    intro: { content: "已对$发动过〖颂词〗" },
    ai: {
      order: 7,
      threaten: 1.6,
      expose: 0.2,
      result: {
        target(player, target) {
          if (target.countCards("h") <= target.hp) {
            return 1
          }
          if (target.countCards("h") > target.hp) {
            return -1
          }
        },
      },
    },
  },
  // 诸葛诞
  // 功獒
  gongao: {
    audio: 2,
    trigger: { global: "dieAfter" },
    forced: true,
    content() {
      player.gainMaxHp()
      player.recover()
    },
    ai: {
      threaten: 1.5,
    },
  },
  // 举义
  juyi: {
    skillAnimation: true,
    animationColor: "thunder",
    audio: 2,
    derivation: ["benghuai", "weizhong"],
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      return player.maxHp > game.countPlayer()
    },
    forced: true,
    juexingji: true,
    content() {
      player.awakenSkill(event.name)
      player.draw(player.maxHp)
      player.addSkills(["benghuai", "weizhong"])
    },
  },
  // 威重
  weizhong: {
    audio: 1,
    trigger: { player: ["gainMaxHpEnd", "loseMaxHpEnd"] },
    forced: true,
    content() {
      player.draw(player.isMinHandcard() ? 2 : 1)
    },
  },
  // SP姜维
  // 困奋
  kunfen: {
    audio: 2,
    audioname2: {
      ol_sb_jiangwei: "kunfenx",
    },
    derivation: "kunfenx",
    trigger: { player: "phaseJieshuBegin" },
    locked(skill, player) {
      if (!player?.storage.kunfen) {
        return true
      }
      return false
    },
    direct: true,
    content() {
      "step 0"
      if (
        player.storage.kunfen ||
        (get.mode() === "guozhan" && player.hiddenSkills.includes("kunfen"))
      ) {
        if (!player.storage.kunfen) {
          event.skillHidden = true
        }
        player
          .chooseBool(get.prompt("kunfen"), "失去1点体力，然后摸两张牌")
          .set("ai", () => {
            var player = _status.event.player
            if (player.hp > 3) {
              return true
            }
            if (player.hp === 3 && player.countCards("h") < 3) {
              return true
            }
            if (player.hp === 2 && player.countCards("h") === 0) {
              return true
            }
            return false
          })
      } else {
        event._result = { bool: true }
      }
      ;("step 1")
      if (result.bool) {
        player.logSkill("kunfen")
        player.loseHp()
      } else {
        event.finish()
      }
      ;("step 2")
      player.draw(2)
    },
    ai: { threaten: 1.5 },
  },
  // 逢亮
  fengliang: {
    skillAnimation: true,
    animationColor: "thunder",
    juexingji: true,
    audio: 2,
    derivation: "retiaoxin",
    trigger: { player: "dying" },
    //priority:10,
    forced: true,
    content() {
      "step 0"
      player.awakenSkill(event.name)
      player.loseMaxHp()
      ;("step 1")
      if (player.hp < 2) {
        player.recover(2 - player.hp)
      }
      ;("step 2")
      player.storage.kunfen = true
      player.addSkills("retiaoxin")
    },
  },
  // 李通
  // 推锋
  tuifeng: {
    audio: 2,
    trigger: { player: "damageEnd" },
    direct: true,
    filter(event, player) {
      return player.countCards("he") > 0
    },
    content() {
      "step 0"
      player
        .chooseCard(get.prompt2("tuifeng"), "he", [1, trigger.num])
        .set("ai", (card) => {
          if (card.name === "du") {
            return 20
          }
          return 7 - get.useful(card)
        })
      ;("step 1")
      if (result.bool) {
        player.logSkill("tuifeng")
        player
          .addToExpansion(result.cards, player, "give")
          .gaintag.add("tuifeng")
      }
    },
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    marktext: "锋",
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    group: "tuifeng2",
    ai: {
      threaten: 0.8,
      maixie: true,
      maixie_hp: true,
      notemp: true,
    },
  },
  tuifeng2: {
    audio: "tuifeng",
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    sourceSkill: "tuifeng",
    filter(event, player) {
      return player.getExpansions("tuifeng").length > 0
    },
    content() {
      var cards = player.getExpansions("tuifeng")
      player.draw(2 * cards.length)
      player.addTempSkill("tuifeng3")
      player.addMark("tuifeng3", cards.length, false)
      player.loseToDiscardpile(cards)
    },
  },
  tuifeng3: {
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") {
          return num + player.countMark("tuifeng3")
        }
      },
    },
    onremove: true,
    charlotte: true,
  },
  // 朱灵
  // 战意
  zhanyi: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterCard: lib.filter.cardDiscardable,
    position: "he",
    check(card) {
      const player = get.player()
      const type = get.type2(card)
      if (!["basic", "equip", "trick"].includes(type)) {
        return 0
      }
      if (
        get.effect(player, { name: "losehp" }, player, player) < 0 &&
        player.hp <= 2
      ) {
        return 0
      }
      if (type === "basic") {
        if (
          player.hasCards(
            "hs",
            (cardx) => cardx !== card && get.type(cardx) === "basic",
          ) &&
          (player.isDamaged() || player.countCards("h") >= 7)
        ) {
          if (!player.hasValueTarget(card)) {
            return 10
          }
          return 6.5 - get.value(card)
        }
      } else if (type === "trick") {
        if (!player.hasValueTarget(card)) {
          return 10
        }
        return 7 - get.value(card)
      } else if (type === "equip") {
        if (
          player.hasSha() &&
          game.hasPlayer((current) => {
            return (
              player.canUse({ name: "sha" }, current) &&
              get.attitude(player, current) < 0 &&
              get.effect(current, { name: "sha" }, player, player) > 0 &&
              current.hasCards("he")
            )
          })
        ) {
          return 7 - get.value(card)
        }
      }
      return 0
    },
    async content(event, trigger, player) {
      const { cards } = event
      const type = get.type(
        cards[0],
        "trick",
        cards[0].original === "h" ? player : false,
      )
      await player.loseHp()
      if (["basic", "equip", "trick"].includes(type)) {
        player.addTempSkill(`${event.name}_${type}`, "phaseUseAfter")
        if (type === "basic") {
          player.addTempSkill(`${event.name}_effect`, "phaseUseAfter")
        }
        if (type === "trick") {
          await player.draw(3)
        }
      }
    },
    ai: {
      order: 9.1,
      result: {
        player(player) {
          if (
            get.effect(player, { name: "losehp" }, player, player) < 0 &&
            player.hp <= 2
          ) {
            return 0
          }
          if (
            player.hasCards("he", (card) => {
              if (!lib.filter.cardDiscardable(card, player, "zhanyi")) {
                return false
              }
              const type = get.type2(card)
              if (["equip", "trick"].includes(type)) {
                return true
              }
              if (
                type === "basic" &&
                player.hasCards(
                  "hs",
                  (cardx) => cardx !== card && get.type(cardx) === "basic",
                )
              ) {
                return true
              }
              return false
            })
          ) {
            return 1
          }
          return 0
        },
      },
    },
    subSkill: {
      basic: {
        charlotte: true,
        audio: "zhanyi",
        enable: "chooseToUse",
        filter(event, player) {
          if (
            !_status.connectMode &&
            !player.hasCards("hs", (card) => {
              return get.type(card) === "basic"
            })
          ) {
            return false
          }
          return get.inpileVCardList((info) => {
            if (info[0] !== "basic") {
              return false
            }
            return event.filterCard(
              get.autoViewAs({ name: info[2], nature: info[3] }, "unsure"),
              player,
              event,
            )
          }).length
        },
        chooseButton: {
          dialog(event, player) {
            const vcards = get.inpileVCardList((info) => {
              if (info[0] !== "basic") {
                return false
              }
              return event.filterCard(
                get.autoViewAs({ name: info[2], nature: info[3] }, "unsure"),
                player,
                event,
              )
            })
            return ui.create.dialog("战意", [vcards, "vcard"], "hidden")
          },
          check(button) {
            if (get.event().getParent().type !== "phase") {
              return 1
            }
            return get
              .player()
              .getUseValue({ name: button.link[2], nature: button.link[3] })
          },
          backup(links, player) {
            return {
              audio: "zhanyi",
              filterCard(card, player, target) {
                return get.type(card) === "basic"
              },
              check(card) {
                return 9 - get.value(card)
              },
              viewAs: { name: links[0][2], nature: links[0][3] },
              position: "hs",
              popname: true,
            }
          },
          prompt(links, player) {
            return `将一张基本牌当${get.translation(links[0][3]) || ""}${get.translation(links[0][2])}使用`
          },
        },
        hiddenCard(player, name) {
          return get.type(name) === "basic" && player.countCards("hs") > 0
        },
        order: 6,
        respondSha: true,
        skillTagFilter(player, tag, arg) {
          if (player.hasCards("hs", (card) => get.type(card) === "basic")) {
            if (tag === "respondSha") {
              if (arg === "respond") {
                return false
              }
            }
          } else {
            return false
          }
        },
        result: {
          player(player) {
            if (get.event().dying) {
              return get.attitude(player, get.event().dying)
            }
            return 1
          },
        },
        mark: true,
        intro: { content: "本阶段可以将一张基本牌当成任意基本牌使用" },
      },
      basic_backup: {},
      effect: {
        trigger: { player: "useCard1" },
        filter(event, player) {
          return get.type(event.card, null, false) === "basic"
        },
        forced: true,
        popup: false,
        firstDo: true,
        async content(event, trigger, player) {
          player.removeSkill(event.name)
          player.addTempSkill("zhanyi_buff")
          trigger.card.storage ??= {}
          trigger.card.storage.zhanyi_buff = true
        },
        mark: true,
        intro: { content: "本阶段使用的下一张基本牌造成的伤害量或回复量+1" },
      },
      buff: {
        charlotte: true,
        trigger: {
          source: "damageBegin1",
          global: "recoverBegin",
        },
        filter(event, player) {
          const card = event.card
          const evt = event.getParent()
          if (evt.player !== player || !card?.storage?.zhanyi_buff) {
            return false
          }
          return true
        },
        forced: true,
        popup: false,
        firstDo: true,
        async content(event, trigger, player) {
          trigger.num++
        },
      },
      equip: {
        charlotte: true,
        audio: "zhanyi",
        trigger: { player: "useCardToPlayered" },
        filter(event, player) {
          return event.card.name === "sha" && event.target.hasCards("he")
        },
        forced: true,
        check(event, player) {
          return get.attitude(player, event.target) < 0
        },
        logTarget: "target",
        async content(event, trigger, player) {
          const { target } = trigger
          let result = await target.chooseToDiscard("he", true, 2).forResult()
          if (result?.cards?.someInD("d")) {
            const cards = result.cards.filterInD("d")
            result = await player
              .chooseButton(["战意：选择其中一张获得之", cards], true)
              .set("ai", (button) => {
                return get.value(button.link)
              })
              .set("direct", true)
              .forResult()
            if (result?.links?.length) {
              await player.gain(result.links, "gain2")
            }
          }
        },
        mark: true,
        intro: {
          content:
            "本阶段使用【杀】指定一名角色为目标后，该角色须弃置两张牌，然后你选择其中一张获得之",
        },
      },
      trick: {
        charlotte: true,
        mod: {
          wuxieRespondable() {
            return false
          },
        },
        mark: true,
        intro: { content: "本阶段使用锦囊不能被【无懈可击】响应" },
      },
    },
  },
  // 曹纯
  // 缮甲
  shanjia: {
    audio: 2,
    init(player) {
      player.addSkill("shanjia_count")
    },
    onremove(player) {
      player.removeSkill("shanjia_count")
    },
    locked: false,
    mod: {
      aiValue(player, card, num) {
        if (
          player.countMark("shanjia") < 3 &&
          get.type(card) === "equip" &&
          !get.cardtag(card, "gifts")
        ) {
          return num / player.hp
        }
      },
    },
    trigger: {
      player: "phaseUseBegin",
    },
    intro: {
      content: "已失去过#张装备区里的牌",
    },
    frequent: true,
    sync(player) {
      const history = player.actionHistory
      let num = 0
      for (let i = 0; i < history.length; i++) {
        for (let j = 0; j < history[i].lose.length; j++) {
          const loseEvent = history[i].lose[j]
          const es = loseEvent.es
          if (es?.length) {
            num += es.filter((card) => get.type(card) === "equip").length
          }
        }
      }
      player.setStorage("shanjia", num, true)
    },
    async content(event, trigger, player) {
      await player.draw(3)
      lib.skill.shanjia.sync(player)
      const num = 3 - player.countMark("shanjia")
      let result
      if (num > 0) {
        result = await player
          .chooseToDiscard({
            position: "he",
            forced: true,
            selectCard: num,
            ai: (card) => -get.value(card),
          })
          .forResult()
      }
      lib.skill.shanjia.sync(player)
      let bool = true
      if (result?.cards?.length) {
        const cards = result.cards
        for (const card of cards) {
          const type = get.type(
            card,
            "trick",
            card.original === "h" ? player : false,
          )
          if (type === "basic" || type === "trick") {
            bool = false
          }
        }
      }
      if (bool) {
        await player.chooseUseTarget({
          card: new lib.element.VCard({ name: "sha", isCard: true }),
          addCount: false,
          prompt: "缮甲：是否视为使用一张【杀】？",
        })
      }
    },
    ai: {
      threaten: 3,
      noe: true,
      reverseOrder: true,
      skillTagFilter(player) {
        if (player.countMark("shanjia") > 2) {
          return false
        }
      },
      effect: {
        target(card, player, target) {
          if (
            player.countMark("shanjia") < 3 &&
            get.type(card) === "equip" &&
            !get.cardtag(card, "gifts")
          ) {
            return [1, 3]
          }
        },
      },
    },
    subSkill: {
      count: {
        forced: true,
        silent: true,
        popup: false,
        trigger: {
          player: "loseEnd",
        },
        filter(event, player) {
          const es = event.es
          return es?.some((card) => get.type(card) === "equip")
        },
        async content(event, trigger, player) {
          lib.skill.shanjia.sync(player)
        },
      },
    },
  },
  // 唐咨
  // 兴棹
  xingzhao: {
    audio: 2,
    group: ["xz_xunxun", "xingzhao2"],
    trigger: { player: "useCard" },
    forced: true,
    filter(event, player) {
      if (game.countPlayer((current) => current.isDamaged()) < 2) {
        return false
      }
      return get.type(event.card) === "equip"
    },
    content() {
      player.draw()
    },
    derivation: "xz_xunxun",
    mark: true,
    intro: {
      content(storage, player) {
        var num = game.countPlayer((current) => current.isDamaged())
        var str = ""
        if (num >= 1) {
          str = "<li>拥有〖恂恂〗"
        }
        if (num >= 2) {
          str += "<br><li>使用装备牌时摸一张牌"
        }
        if (num >= 3) {
          str += "<br><li>跳过弃牌阶段"
        }
        return str
      },
    },
  },
  xingzhao2: {
    audio: "xingzhao",
    sourceSkill: "xingzhao",
    trigger: {
      player: ["phaseDiscardBefore"],
    },
    forced: true,
    filter(event, player) {
      var num = game.countPlayer((current) => current.isDamaged())
      return num >= 3
    },
    content() {
      trigger.cancel()
      game.log(
        player,
        `跳过了${trigger.name === "phaseJudge" ? "判定" : "弃牌"}阶段`,
      )
    },
  },
  // 恂恂
  xz_xunxun: {
    filter(event, player) {
      var num = game.countPlayer((current) => current.isDamaged())
      return num >= 1 && !player.hasSkill("xunxun")
    },
    audio: 2,
    trigger: {
      player: "phaseDrawBegin1",
    },
    //priority:10,
    content() {
      "step 0"
      var cards = get.cards(4)
      game.cardsGotoOrdering(cards)
      var next = player.chooseToMove("恂恂：将两张牌置于牌堆顶", true)
      next.set("list", [["牌堆顶", cards], ["牌堆底"]])
      next.set("filterMove", (from, to, moved) => {
        if (to === 1 && moved[1].length >= 2) {
          return false
        }
        return true
      })
      next.set("filterOk", (moved) => moved[1].length === 2)
      next.set("processAI", (list) => {
        var cards = list[0][1]
          .slice(0)
          .sort((a, b) => get.value(b) - get.value(a))
        return [cards, cards.splice(2)]
      })
      ;("step 1")
      var top = result.moved[0]
      var bottom = result.moved[1]
      top.reverse()
      for (var i = 0; i < top.length; i++) {
        ui.cardPile.insertBefore(top[i], ui.cardPile.firstChild)
      }
      for (i = 0; i < bottom.length; i++) {
        ui.cardPile.appendChild(bottom[i])
      }
      game.updateRoundNumber()
      game.delayx()
    },
  },
  // 贾逵
  // 忠佐
  zhongzuo: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    direct: true,
    filter(event, player) {
      return (
        player.getHistory("damage").length > 0 ||
        player.getHistory("sourceDamage").length > 0
      )
    },
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          get.prompt("zhongzuo"),
          "令一名角色摸两张牌，然后若其已受伤，你可以摸一张牌。",
        )
        .set("ai", (target) => {
          if (target.hasSkillTag("nogain")) {
            return target.isDamaged() ? 0 : 1
          }
          const att = get.attitude(_status.event.player, target)
          if (att <= 0) {
            return 0
          }
          if (target.isDamaged()) {
            return 1 + att / 5
          }
          return att / 5
        })
        .forResult()
      if (result.bool) {
        const target = result.targets[0]
        player.logSkill("zhongzuo", target)
        await target.draw(2)
        if (target.isDamaged()) {
          await player.draw()
        }
      }
    },
  },
  // 挽澜
  wanlan: {
    audio: 2,
    trigger: { global: "dying" },
    check(event, player) {
      if (get.attitude(player, event.player) < 4) {
        return false
      }
      if (
        player.countCards("hs", (card) =>
          player.canSaveCard(card, event.player),
        ) >=
        1 - event.player.hp
      ) {
        return false
      }
      if (event.player === player || event.player === get.zhu(player)) {
        return true
      }
      if (
        _status.currentPhase &&
        get.damageEffect(_status.currentPhase, player, player) < 0
      ) {
        return false
      }
      if (get.recoverEffect(event.player, player, player) <= 0) {
        return false
      }
      return !player.hasUnknown()
    },
    limited: true,
    filter(event, player) {
      return event.player.hp <= 0
    },
    skillAnimation: true,
    animationColor: "thunder",
    logTarget: "player",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      const hs = player.getCards("h")
      if (hs.length) {
        await player.modedDiscard(hs)
      }
      await trigger.player.recoverTo(1)
      if (_status.currentPhase?.isIn()) {
        player
          .when({ global: "dyingAfter" })
          .filter((evt) => evt === trigger)
          .step(async () => await _status.currentPhase?.damage())
      }
    },
  },
  // 沙摩柯
  // 蒺藜
  jili: {
    mod: {
      aiOrder(player, card, num) {
        if (
          player.isPhaseUsing() &&
          get.subtype(card) === "equip1" &&
          !get.cardtag(card, "gifts")
        ) {
          var range0 = player.getAttackRange()
          var range = 0
          var info = get.info(card)
          if (info?.distance?.attackFrom) {
            range -= info.distance.attackFrom
          }
          if (player.getEquip(1)) {
            var num = 0
            var info = get.info(player.getEquip(1))
            if (info?.distance?.attackFrom) {
              num -= info.distance.attackFrom
            }
            range0 -= num
          }
          range0 += range
          if (
            range0 ===
              player.getHistory("useCard").length +
                player.getHistory("respond").length +
                2 &&
            player.countCards(
              "h",
              (cardx) =>
                get.subtype(cardx) !== "equip1" &&
                player.getUseValue(cardx) > 0,
            )
          ) {
            return num + 10
          }
        }
      },
    },
    trigger: { player: ["useCard", "respond"] },
    frequent: true,
    locked: false,
    preHidden: true,
    onremove(player) {
      player.removeTip("jili")
    },
    filter(event, player) {
      const count =
        player.getHistory("useCard").length +
        player.getHistory("respond").length
      player.addTip("jili", `蒺藜 ${count}`, true)
      return count === player.getAttackRange()
    },
    audio: 2,
    content() {
      player.draw(
        player.getHistory("useCard").length +
          player.getHistory("respond").length,
      )
    },
    ai: {
      threaten: 1.8,
      effect: {
        target_use(card, player, target, current) {
          const used =
            target.getHistory("useCard").length +
            target.getHistory("respond").length
          if (get.subtype(card) === "equip1" && !get.cardtag(card, "gifts")) {
            if (player !== target || !player.isPhaseUsing()) {
              return
            }
            let range0 = player.getAttackRange()
            let range = 0
            const info = get.info(card)
            if (info?.distance?.attackFrom) {
              range -= info.distance.attackFrom
            }
            if (player.getEquip(1)) {
              let num = 0
              const info = get.info(player.getEquip(1))
              if (info?.distance?.attackFrom) {
                num -= info.distance.attackFrom
              }
              range0 -= num
            }
            range0 += range
            const delta = range0 - used
            if (delta < 0) {
              return
            }
            const num = player.countCards(
              "h",
              (card) =>
                (get.cardtag(card, "gifts") ||
                  get.subtype(card) !== "equip1") &&
                player.getUseValue(card) > 0,
            )
            if (delta === 2 && num > 0) {
              return [1, 3]
            }
            if (num >= delta) {
              return "zeroplayertarget"
            }
          } else if (get.tag(card, "respondShan") > 0) {
            if (current < 0 && used === target.getAttackRange() - 1) {
              if (card.name === "sha") {
                if (!target.mayHaveShan(player, "use")) {
                  return
                }
              } else if (!target.mayHaveShan(player)) {
                return 0.9
              }
              return [1, (used + 1) / 2]
            }
          } else if (get.tag(card, "respondSha") > 0) {
            if (
              current < 0 &&
              used === target.getAttackRange() - 1 &&
              target.mayHaveSha(player)
            ) {
              return [1, (used + 1) / 2]
            }
          }
        },
      },
    },
  },
  // 张星彩
  // 甚贤
  shenxian: {
    audio: 2,
    trigger: { global: ["loseAfter", "loseAsyncAfter"] },
    filter(event, player) {
      if (
        event.type !== "discard" ||
        _status.currentPhase === player ||
        event.getlx === false
      ) {
        return false
      }
      if (event.name === "lose" && event.player === player) {
        return false
      }
      if (player.hasSkill("shenxian2")) {
        return false
      }
      var cards = event.cards.slice(0)
      var evt = event.getl(player)
      if (evt?.cards) {
        cards.removeArray(evt.cards)
      }
      for (var i = 0; i < cards.length; i++) {
        if (
          get.type(
            cards[i],
            null,
            event.hs?.includes(cards[i]) ? event.player : false,
          ) === "basic" &&
          cards[i].original !== "j"
        ) {
          return true
        }
      }
      return false
    },
    frequent: true,
    preHidden: true,
    content() {
      "step 0"
      if (trigger.delay === false) {
        game.delay()
      }
      ;("step 1")
      player.draw()
      if (event.name === "shenxian") {
        player.addTempSkill("shenxian2")
      }
    },
    ai: {
      threaten: 1.5,
    },
  },
  shenxian2: { charlotte: true },
  // 枪舞
  qiangwu: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    content() {
      "step 0"
      player.judge((card) => {
        if (
          game.hasPlayer((cur) => {
            return get.event().player.canUse("sha", cur)
          })
        ) {
          return get.number(card)
        }
        return 1 / get.number(card)
      })
      ;("step 1")
      player.storage.qiangwu = result.number
      player.addTempSkill("qiangwu3", "phaseUseEnd")
    },
    ai: {
      result: {
        player: 1,
      },
      order: 11,
    },
  },
  qiangwu3: {
    mod: {
      targetInRange(card, player) {
        if (card.name === "sha") {
          const num = get.number(card)
          if (num === "unsure" || num < player.storage.qiangwu) {
            return true
          }
        }
      },
      cardUsable(card, player) {
        if (card.name === "sha") {
          const num = get.number(card)
          if (num === "unsure" || num > player.storage.qiangwu) {
            return true
          }
        }
      },
    },
    trigger: { player: "useCard1" },
    sourceSkill: "qiangwu",
    filter(event, player) {
      if (
        _status.currentPhase === player &&
        event.card.name === "sha" &&
        get.number(event.card) > player.storage.qiangwu &&
        event.addCount !== false
      ) {
        return true
      }
      return false
    },
    forced: true,
    popup: false,
    firstDo: true,
    content() {
      trigger.addCount = false
      if (player.stat[player.stat.length - 1].card.sha > 0) {
        player.stat[player.stat.length - 1].card.sha--
      }
    },
  },
  // 马良
  // 自书
  zishu: {
    audio: 2,
    locked: true,
    subSkill: {
      discard: {
        trigger: { global: "phaseJieshuEnd" },
        audio: "zishu",
        forced: true,
        filter(event, player) {
          if (_status.currentPhase !== player) {
            const he = player.getCards("h")
            let bool = false
            player.getHistory("gain", (evt) => {
              if (!bool && evt && evt.cards) {
                for (let i = 0; i < evt.cards.length; i++) {
                  if (he.includes(evt.cards[i])) {
                    bool = true
                  }
                  break
                }
              }
            })
            return bool
          }
          return false
        },
        async content(event, trigger, player) {
          const he = player.getCards("h")
          const list = []
          player.getHistory("gain", (evt) => {
            if (evt?.cards) {
              for (let i = 0; i < evt.cards.length; i++) {
                if (he.includes(evt.cards[i])) {
                  list.add(evt.cards[i])
                }
              }
            }
          })
          player.$throw(list, 1000)
          await player.lose(list, ui.discardPile, "visible")
          game.log(player, "将", list, "置入弃牌堆")
        },
      },
      mark: {
        trigger: {
          player: "gainBegin",
          global: "phaseBeginStart",
        },
        silent: true,
        filter(event, player) {
          return event.name !== "gain" || player !== _status.currentPhase
        },
        content() {
          if (trigger.name === "gain") {
            trigger.gaintag.add("zishu")
          } else {
            player.removeGaintag("zishu")
          }
        },
      },
      draw: {
        trigger: {
          player: "gainAfter",
          global: "loseAsyncAfter",
        },
        audio: "zishu",
        forced: true,
        filter(event, player) {
          if (
            _status.currentPhase !== player ||
            event.getg(player).length === 0
          ) {
            return false
          }
          return event.getParent(2).name !== "zishu_draw"
        },
        content() {
          player.draw("nodelay")
        },
      },
    },
    ai: {
      threaten: 1.2,
      nogain: 1,
      skillTagFilter(player) {
        return player !== _status.currentPhase
      },
    },
    group: ["zishu_draw", "zishu_discard", "zishu_mark"],
  },
  // 应援
  yingyuan: {
    audio: 2,
    trigger: { player: "useCardAfter" },
    direct: true,
    filter(event, player) {
      if (_status.currentPhase !== player) {
        return false
      }
      if (
        player.getHistory(
          "custom",
          (evt) => evt.yingyuan_name === event.card.name,
        ).length > 0
      ) {
        return false
      }
      return event.cards.filterInD().length > 0
    },
    content() {
      "step 0"
      player
        .chooseTarget(
          get.prompt("yingyuan"),
          `将${get.translation(trigger.cards)}交给一名其他角色`,
          (card, player, target) => target !== player,
        )
        .set("ai", (target) => {
          if (target.hasJudge("lebu")) {
            return 0
          }
          let att = get.attitude(_status.event.player, target),
            name = _status.event.cards[0].name
          if (att < 3) {
            return 0
          }
          if (target.hasSkillTag("nogain")) {
            att /= 10
          }
          if (name === "sha" && target.hasSha()) {
            att /= 5
          }
          if (name === "wuxie" && target.needsToDiscard(_status.event.cards)) {
            att /= 5
          }
          return att / (1 + get.distance(player, target, "absolute"))
        })
        .set("cards", trigger.cards)
      ;("step 1")
      if (result.bool) {
        player.logSkill("yingyuan", result.targets[0])
        result.targets[0].gain(trigger.cards.filterInD(), "gain2")
        player.getHistory("custom").push({ yingyuan_name: trigger.card.name })
      }
    },
  },
  // 张翼
  // 执义
  zhiyi: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    forced: true,
    filter(event, player) {
      return (
        player.getHistory("useCard", (card) => get.type(card.card) === "basic")
          .length > 0 ||
        player.getHistory("respond", (card) => get.type(card.card) === "basic")
          .length > 0
      )
    },
    async content(event, trigger, player) {
      const list = []
      player.getHistory("useCard", (evt) => {
        if (get.type(evt.card) !== "basic") {
          return
        }
        var name = evt.card.name
        if (name === "sha") {
          var nature = evt.card.nature
          switch (nature) {
            case "fire":
              name = "huosha"
              break
            case "thunder":
              name = "leisha"
              break
            case "kami":
              name = "kamisha"
              break
            case "ice":
              name = "icesha"
              break
            case "stab":
              name = "cisha"
              break
          }
        }
        list.add(name)
      })
      player.getHistory("respond", (evt) => {
        if (get.type(evt.card) !== "basic") {
          return
        }
        var name = evt.card.name
        if (name === "sha") {
          var nature = evt.card.nature
          switch (nature) {
            case "fire":
              name = "huosha"
              break
            case "thunder":
              name = "leisha"
              break
            case "kami":
              name = "kamisha"
              break
            case "ice":
              name = "icesha"
              break
            case "stab":
              name = "cisha"
              break
          }
        }
        list.add(name)
      })
      const result = await player
        .chooseButton(
          [
            "执义：选择要使用的牌，或点取消摸一张牌",
            [list.map((name) => ["基本", "", name]), "vcard"],
          ],
          (button) =>
            _status.event.player.getUseValue({
              name: button.link[2],
              nature: button.link[3],
            }),
          (button) =>
            _status.event.player.hasUseTarget({
              name: button.link[2],
              nature: button.link[3],
            }),
        )
        .forResult()
      if (!result.bool) {
        await player.draw()
      } else {
        await player
          .chooseUseTarget(
            {
              name: result.links[0][2],
              isCard: true,
              nature: result.links[0][3],
            },
            true,
          )
          .forResult()
      }
    },
  },
  // 李丰
  // 屯储
  tunchu: {
    audio: 2,
    trigger: { player: "phaseDrawBegin2" },
    frequent: true,
    preHidden: true,
    locked: false,
    filter(event, player) {
      if (event.numFixed || player.getExpansions("tunchu").length) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      trigger.num += 2
      player.addTempSkill("tunchu_choose", "phaseDrawAfter")
    },
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    mod: {
      cardEnabled(card, player) {
        if (player.getExpansions("tunchu").length && card.name === "sha") {
          return false
        }
      },
    },
    subSkill: {
      choose: {
        trigger: { player: "phaseDrawEnd" },
        forced: true,
        popup: false,
        charlotte: true,
        async content(event, trigger, player) {
          player.removeSkill("tunchu_choose")
          const nh = player.countCards("h")
          if (nh) {
            const result = await player
              .chooseCard(
                "h",
                [1, nh],
                "将任意张手牌置于武将牌上",
                "allowChooseAll",
              )
              .set("ai", (card) => {
                var player = _status.event.player
                var count = game.countPlayer(
                  (current) =>
                    get.attitude(player, current) > 2 &&
                    current.hp - current.countCards("h") > 1,
                )
                if (ui.selected.cards.length >= count) {
                  return -get.value(card)
                }
                return 5 - get.value(card)
              })
              .forResult()
            if (result.bool) {
              const next = player.addToExpansion(
                result.cards,
                player,
                "giveAuto",
              )
              next.gaintag.add("tunchu")
              await next
            }
          }
        },
      },
    },
  },
  // 输粮
  shuliang: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    direct: true,
    filter(event, player) {
      return (
        player.getExpansions("tunchu").length > 0 &&
        event.player.countCards("h") < event.player.hp &&
        event.player.isIn()
      )
    },
    async content(event, trigger, player) {
      const goon = get.attitude(player, trigger.player) > 0
      const result = await player
        .chooseCardButton(
          get.prompt("shuliang", trigger.player),
          player.getExpansions("tunchu"),
        )
        .set("ai", () => {
          if (_status.event.goon) {
            return 1
          }
          return 0
        })
        .set("goon", goon)
        .forResult()
      if (result.bool) {
        player.logSkill("shuliang", trigger.player)
        await player.loseToDiscardpile(result.links)
        await trigger.player.draw(2)
      }
    },
    ai: { combo: "tunchu" },
  },
  // 邓芝
  // 急盟
  jimeng: {
    audio: 2,
    trigger: { player: "phaseUseBegin" },
    direct: true,
    filter(event, player) {
      return game.hasPlayer(
        (current) => current.countGainableCards(player, "he") > 0,
      )
    },
    async content(event, trigger, player) {
      const result1 = await player
        .chooseTarget(
          get.prompt2("jimeng"),
          (card, player, target) =>
            target !== player && target.countGainableCards(player, "he") > 0,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          if (player.hp > 1 && get.attitude(player, target) < 2) {
            return 0
          }
          return get.effect(target, { name: "shunshou" }, player, player)
        })
        .forResult()
      if (!result1.bool) {
        return
      }
      const target = result1.targets[0]
      player.logSkill("jimeng", target)
      await player.gainPlayerCard(target, "he", true)
      const hs = player.getCards("he")
      if (!(player.hp > 0 && hs.length)) {
        return
      }
      let cards
      if (hs.length <= player.hp) {
        cards = hs
      } else {
        const result2 = await player
          .chooseCard(
            player.hp,
            true,
            `交给${get.translation(target)}${get.cnNumber(player.hp)}张牌`,
            "he",
            true,
          )
          .forResult()
        cards = result2.cards
      }
      await player.give(cards, target)
    },
  },
  // 率言
  shuaiyan: {
    audio: 2,
    trigger: { player: "phaseDiscardBegin" },
    filter(event, player) {
      return player.countCards("h") > 1
    },
    check(event, player) {
      return game.hasPlayer(
        (current) =>
          current !== player &&
          current.countCards("he") &&
          lib.skill.shuaiyan.check2(current, player),
      )
    },
    check2(target, player) {
      if (get.itemtype(player) !== "player") {
        player = _status.event.player
      }
      return -get.attitude(player, target) / target.countCards("he")
    },
    async content(event, trigger, player) {
      player.showHandcards(`${get.translation(player)}发动了【率言】`)
      const filter = (card, player, target) =>
        player !== target && target.countCards("he") > 0
      if (
        !game.hasPlayer((current) => filter("我约等于白板", player, current))
      ) {
        return
      }
      const result1 = await player
        .chooseTarget(true, filter, "选择令一名其他角色交给你一张牌")
        .set("ai", lib.skill.shuaiyan.check2)
        .forResult()
      const target = result1.targets[0]
      player.line(target, "green")
      const result2 = await target
        .chooseCard("he", true, `交给${get.translation(player)}一张牌`)
        .forResult()
      await target.give(result2.cards, player)
    },
  },
  // 陈震
  // 歃盟
  shameng: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      const hs = player.getCards("h")
      if (hs.length < 2) {
        return false
      }
      let red = 0
      let black = 0
      for (const i of hs) {
        if (get.color(i, player) === "red") {
          red++
        } else {
          black++
        }
        if (red > 1 || black > 1) {
          return true
        }
      }
      return false
    },
    complexCard: true,
    selectCard: 2,
    filterCard(card, player) {
      if (ui.selected.cards.length) {
        return (
          get.color(card, player) === get.color(ui.selected.cards[0], player)
        )
      }
      const color = get.color(card, player)
      return (
        player.countCards(
          "h",
          (cardx) => cardx !== card && color === get.color(cardx, player),
        ) > 0
      )
    },
    filterTarget: lib.filter.notMe,
    check(card) {
      return 7 - get.value(card)
    },
    position: "h",
    async content(event, trigger, player) {
      const target = event.target
      await target.draw(2)
      await player.draw(3)
    },
    ai: {
      order: 6,
      result: { target: 2 },
    },
  },
  // 孙鲁育
  // 魅步
  meibu: {
    audio: 2,
    trigger: {
      global: "phaseUseBegin",
    },
    filter(event, player) {
      return (
        event.player !== player &&
        event.player.isIn() &&
        player.countCards("he") > 0 &&
        event.player.inRange(player)
      )
    },
    direct: true,
    derivation: ["zhixi"],
    checkx(event, player) {
      if (get.attitude(player, event.player) >= 0) {
        return false
      }
      var e2 = player.getEquip(2)
      if (e2) {
        if (e2.name === "tengjia" || e2.name === "rewrite_tengjia") {
          return true
        }
        if (e2.name === "bagua" || e2.name === "rewrite_bagua") {
          return true
        }
      }
      return event.player.countCards("h") > event.player.hp
    },
    async content(event, trigger, player) {
      const check = lib.skill.meibu.checkx(trigger, player)
      const result = await player
        .chooseToDiscard(get.prompt2("meibu", trigger.player), "he")
        .set("ai", (card) => {
          if (_status.event.check) {
            return 6 - get.value(card)
          }
          return 0
        })
        .set("check", check)
        .set("logSkill", ["meibu", trigger.player])
        .forResult()
      if (!result.bool) {
        return
      }
      var target = trigger.player
      var card = result.cards[0]
      player.line(target, "green")
      target.addTempSkills("zhixi", "phaseEnd")
      if (
        card.name !== "sha" &&
        !(get.type(card, "trick") === "trick" && get.color(card) === "black")
      ) {
        target.addTempSkill("meibu_range", "phaseEnd")
        target.markAuto("meibu_range", player)
      }
      target.markSkillCharacter(
        "meibu",
        player,
        "魅步",
        "锁定技，出牌阶段，你至多使用X张牌（X为你的体力值）。若你于出牌阶段内使用过锦囊牌，你本阶段不能使用牌。",
      )
    },
    ai: {
      expose: 0.2,
    },
    subSkill: {
      range: {
        onremove: true,
        charlotte: true,
        mod: {
          globalFrom(from, to, num) {
            if (from.getStorage("meibu_range").includes(to)) {
              return -Infinity
            }
          },
        },
        sub: true,
      },
    },
  },
  // 穆穆
  mumu: {
    audio: 2,
    trigger: {
      player: "phaseUseBegin",
    },
    filter(event, player) {
      return game.hasPlayer((current) => {
        return current.countCards("e") > 0
      })
    },
    direct: true,
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          get.prompt("mumu"),
          "弃置场上的一张装备牌，或者获得场上的一张防具牌。",
          (card, player, target) => target.countCards("e") > 0,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          var att = get.attitude(player, target)
          if (target.getEquip(2) && player.hasEmptySlot(2)) {
            return -2 * att
          }
          return -att
        })
        .forResult()
      if (!result.bool || !result.targets?.length) {
        return
      }
      const target = result.targets[0]
      player.logSkill("mumu", target)
      player.line(target, "green")
      const e = target.getEquips(2)
      let choice = "弃置一张装备牌"
      if (e.length > 0) {
        const control = await player
          .chooseControl("弃置一张装备牌", "获得一张防具牌")
          .set("ai", () => {
            if (_status.event.player.getEquips(2).length > 0) {
              return "弃置一张装备牌"
            }
            return "获得一张防具牌"
          })
          .forResult()
        choice = control.control
      }
      if (choice === "弃置一张装备牌") {
        await player.discardPlayerCard(target, "e", true)
      } else if (e.length) {
        await player.gain(e, target, "give", "bySelf")
        player.addTempSkill("mumu_notsha")
      }
    },
    subSkill: {
      notsha: {
        mark: true,
        intro: {
          content: "不能使用或打出【杀】",
        },
        charlotte: true,
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
    },
  },
  // 止息
  zhixi: {
    mod: {
      cardEnabled(card, player) {
        if (player.storage.zhixi2 || player.countMark("zhixi") >= player.hp) {
          return false
        }
      },
      cardUsable(card, player) {
        if (player.storage.zhixi2 || player.countMark("zhixi") >= player.hp) {
          return false
        }
      },
      cardSavable(card, player) {
        if (player.storage.zhixi2 || player.countMark("zhixi") >= player.hp) {
          return false
        }
      },
    },
    trigger: {
      player: "useCard1",
    },
    forced: true,
    popup: false,
    firstDo: true,
    init(player, skill) {
      player.storage[skill] = 0
      var evt = _status.event.getParent("phaseUse")
      if (evt && evt.player === player) {
        player.getHistory("useCard", (evtx) => {
          if (evtx.getParent("phaseUse") === evt) {
            player.storage[skill]++
            if (get.type2(evtx.card) === "trick") {
              player.storage.zhixi2 = true
            }
          }
        })
      }
    },
    onremove(player) {
      player.unmarkSkill("meibu")
      delete player.storage.zhixi
      delete player.storage.zhixi2
    },
    content() {
      player.addMark("zhixi", 1, false)
      if (get.type2(trigger.card) === "trick") {
        player.storage.zhixi2 = true
      }
    },
    ai: {
      presha: true,
      pretao: true,
      neg: true,
      nokeep: true,
    },
  },
  // 步骘
  // 弘德
  hongde: {
    audio: 2,
    trigger: {
      player: ["loseAfter", "gainAfter"],
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
      var num = event.getl(player).cards2.length
      if (event.getg) {
        num = Math.max(num, event.getg(player).length)
      }
      return num > 1
    },
    content() {
      "step 0"
      player
        .chooseTarget(
          get.prompt("hongde"),
          "令一名其他角色摸一张牌",
          (card, player, target) => target !== player,
        )
        .set("ai", (target) => get.attitude(get.player(), target))
      ;("step 1")
      if (result.bool) {
        player.logSkill("hongde", result.targets)
        result.targets[0].draw()
      }
    },
  },
  // 定叛
  dingpan: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return game.hasPlayer((target) =>
        lib.skill.dingpan.filterTarget(null, player, target),
      )
    },
    filterTarget(card, player, target) {
      return target.countCards("e") > 0
    },
    usable(skill, player) {
      let num,
        mode = get.mode()
      if (mode === "identity" || mode === "doudizhu") {
        if (mode === "identity" && _status.mode === "purple") {
          num = player.getEnemies().length
        } else {
          num = get.population("fan")
        }
      } else if (mode === "versus") {
        if (!_status.mode || _status.mode !== "two") {
          num = player.getEnemies().length
        } else {
          const target = game.findPlayer((x) => {
            return !game.hasPlayer((y) => {
              return x !== y && y.getFriends().length > x.getFriends().length
            })
          })
          num = target ? target.getFriends(true).length : 2
        }
      } else {
        num = 2
      }
      return num
    },
    content() {
      "step 0"
      target.draw()
      ;("step 1")
      var goon = get.damageEffect(target, player, target) >= 0
      if (!goon && target.hp >= 4 && get.attitude(player, target) < 0) {
        var es = target.getCards("e")
        for (var i = 0; i < es.length; i++) {
          if (get.equipValue(es[i], target) >= 8) {
            goon = true
            break
          }
        }
      }
      target
        .chooseControl(() => {
          if (_status.event.goon) {
            return "选项二"
          }
          return "选项一"
        })
        .set("goon", goon)
        .set("prompt", "定叛")
        .set("choiceList", [
          `令${get.translation(player)}弃置你装备区里的一张牌`,
          "获得装备区里的所有牌，然后受到1点伤害",
        ])
      ;("step 2")
      if (result.control === "选项一") {
        player.discardPlayerCard(target, true, "e")
        event.finish()
      } else {
        target.gain(target.getCards("e"), "gain2")
      }
      ;("step 3")
      game.delay(0.5)
      target.damage()
    },
    ai: {
      order: 7,
      result: {
        target(player, target) {
          if (get.damageEffect(target, player, target) >= 0) {
            return 2
          }
          var att = get.attitude(player, target)
          if (att === 0) {
            return 0
          }
          var es = target.getCards("e")
          if (
            att > 0 &&
            (target.countCards("h") > 2 || target.needsToDiscard(1))
          ) {
            return 0
          }
          if (es.length === 1 && att > 0) {
            return 0
          }
          for (var i = 0; i < es.length; i++) {
            var val = get.equipValue(es[i], target)
            if (val <= 4) {
              if (att > 0) {
                return 1
              }
            } else if (val >= 7) {
              if (att < 0) {
                return -1
              }
            }
          }
          return 0
        },
      },
    },
  },
  // 吕岱
  // 勤国
  qinguo: {
    group: "qinguo_recover",
    audio: 2,
    subfrequent: ["recover"],
    trigger: {
      player: "useCardEnd",
    },
    filter(event, player) {
      return get.type(event.card) === "equip"
    },
    direct: true,
    content() {
      player.chooseUseTarget(
        { name: "sha" },
        get.prompt("qinguo"),
        "视为使用一张无次数限制的【杀】",
        false,
      ).logSkill = "qinguo"
    },
    subSkill: {
      recover: {
        audio: "qinguo",
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
        prompt: "是否发动【勤国】回复1点体力？",
        filter(event, player) {
          if (player.isHealthy() || player.countCards("e") !== player.hp) {
            return false
          }
          var evt = event.getl(player)
          if (event.name === "equip" && event.player === player) {
            return event.cards.length !== (evt.es?.length ?? 0)
          }
          return evt?.es.length
        },
        frequent: true,
        content() {
          player.recover()
        },
      },
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (
            get.type(card) === "equip" &&
            !get.cardtag(card, "gifts") &&
            game.hasPlayer((current) => target.canUse("sha", current))
          ) {
            return [1, 1.5]
          }
        },
      },
      noe: true,
      reverseEquip: true,
      skillTagFilter(player, tag, arg) {
        if (tag === "noe") {
          return player.countCards("e") === player.hp + 1
        }
        return game.hasPlayer((current) => player.canUse("sha", current))
      },
    },
  },
  // 周鲂
  // 断发
  duanfa: {
    init(player) {
      player.storage.duanfa = 0
    },
    audio: 2,
    enable: "phaseUse",
    position: "he",
    filter(card, player) {
      return player.storage.duanfa < player.maxHp
    },
    filterCard(card, player) {
      if (!lib.filter.cardDiscardable(card, player)) {
        return false
      }
      return get.color(card) === "black"
    },
    selectCard() {
      var player = _status.event.player
      return [1, player.maxHp - player.storage.duanfa]
    },
    check(card) {
      return 6 - get.value(card)
    },
    delay: false,
    allowChooseAll: true,
    content() {
      player.draw(cards.length)
      player.storage.duanfa += cards.length
    },
    group: "duanfa_clear",
    subSkill: {
      clear: {
        trigger: {
          player: "phaseBefore",
        },
        forced: true,
        silent: true,
        popup: false,
        content() {
          player.storage.duanfa = 0
        },
        sub: true,
      },
    },
    ai: {
      order: 1,
      result: {
        player: 1,
      },
    },
  },
  // 诱敌
  youdi: {
    audio: 2,
    trigger: {
      player: "phaseJieshuBegin",
    },
    direct: true,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    content() {
      "step 0"
      player
        .chooseTarget(
          get.prompt2("youdi"),
          (card, player, target) => player !== target,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          if (
            player.countCards("h", "sha") > player.countCards("h") / 3 &&
            player.countCards("h", { color: "red" }) >
              player.countCards("h") / 2
          ) {
            return 0
          }
          if (target.countCards("he") === 0) {
            return 0.1
          }
          return -get.attitude(_status.event.player, target)
        })
      ;("step 1")
      if (result.bool) {
        game.delay()
        player.logSkill("youdi", result.targets)
        event.target = result.targets[0]
        event.target.discardPlayerCard(player, "h", true)
      } else {
        event.finish()
      }
      ;("step 2")
      if (get.color(result.links[0]) !== "black") {
        player.draw("nodelay")
      }
      if (result.links[0].name !== "sha" && event.target.countCards("he")) {
        player.gainPlayerCard("he", event.target, true)
      }
    },
    ai: {
      expose: 0.3,
      threaten: 1.4,
    },
  },
  // 孙茹
  // 影箭
  yingjian: {
    trigger: { player: "phaseZhunbeiBegin" },
    direct: true,
    audio: 2,
    async content(event, trigger, player) {
      player.chooseUseTarget(
        "###是否发动【影箭】？###视为使用一张无距离限制的【杀】",
        { name: "sha" },
        false,
        "nodistance",
      ).logSkill = "yingjian"
    },
    ai: {
      threaten(player, target) {
        return 1.6
      },
    },
  },
  // 释衅
  shixin: {
    audio: 2,
    trigger: { player: "damageBegin4" },
    filter(event) {
      return event.hasNature("fire")
    },
    forced: true,
    async content(event, trigger, player) {
      trigger.cancel()
    },
    ai: {
      nofire: true,
      effect: {
        target(card, player, target, current) {
          if (get.tag(card, "fireDamage")) {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 凌操
  // 独进
  dujin: {
    audio: 2,
    trigger: { player: "phaseDrawBegin2" },
    frequent: true,
    preHidden: true,
    filter(event, player) {
      return !event.numFixed
    },
    async content(event, trigger, player) {
      trigger.num += 1 + Math.floor(player.countCards("e") / 2)
    },
  },
  // 苏飞
  // 联翩
  lianpian: {
    audio: 2,
    usable: 3,
    trigger: {
      player: "useCardToPlayered",
    },
    frequent: true,
    filter(event, player) {
      if (
        !event.targets?.length ||
        event.getParent()?.triggeredTargets3.length > 1 ||
        !event.isPhaseUsing(player)
      ) {
        return false
      }
      const evt = player.getLastUsed(1)
      if (!evt?.targets?.length || !evt.isPhaseUsing(player)) {
        return false
      }
      for (let i = 0; i < event.targets.length; i++) {
        if (evt.targets.includes(event.targets[i])) {
          return true
        }
      }
      return false
    },
    async content(event, trigger, player) {
      const { cards } = await player.draw().forResult()
      if (!cards?.length) {
        return
      }
      const card = cards[0]
      const ablers = player.getLastUsed(1)?.targets.slice(0) ?? []
      for (let i = 0; i < ablers.length; i++) {
        if (ablers[i] === player || !trigger.targets.includes(ablers[i])) {
          ablers.splice(i--, 1)
        }
      }
      if (get.owner(card) === player && ablers.length) {
        const result = await player
          .chooseTarget({
            prompt: `联翩：是否将${get.translation(card)}交给其他角色`,
            filterTarget(card, player, target) {
              return get.event().ablers.includes(target) && target !== player
            },
            ai: (target) => 0,
          })
          .set("ablers", ablers)
          .forResult()
        if (result?.bool && result.targets?.length) {
          const target = result.targets[0]
          player.line(target)
          await player.give(card, target, true)
        }
      }
    },
    locked: false,
    mod: {
      aiOrder(player, card, num) {
        if (
          player.isPhaseUsing() &&
          (!player.storage.counttrigger?.lianpian ||
            player.storage.counttrigger.lianpian < 3)
        ) {
          const evt = player.getLastUsed()
          if (
            evt?.targets?.length &&
            evt.isPhaseUsing(player) &&
            game.hasPlayer((current) => {
              return (
                evt.targets.includes(current) &&
                player.canUse(card, current) &&
                get.effect(current, card, player, player) > 0
              )
            })
          ) {
            return num + 10
          }
        }
      },
    },
    ai: {
      effect: {
        player_use(card, player, target) {
          var evt = player.getLastUsed()
          if (
            evt?.targets.includes(target) &&
            (!player.storage.counttrigger?.lianpian ||
              player.storage.counttrigger.lianpian < 3) &&
            player.isPhaseUsing(player)
          ) {
            return [1.5, 0]
          }
        },
      },
    },
  },
  // 潘凤
  // 狂斧
  kuangfu: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    delay: false,
    filterTarget(card, player, target) {
      if (player === target) {
        return (
          player.countCards("e", (card) =>
            lib.filter.cardDiscardable(card, player),
          ) > 0
        )
      }
      return target.countDiscardableCards(player, "e") > 0
    },
    filter(event, player) {
      return game.hasPlayer((current) => current.countCards("e") > 0)
    },
    useShaValue(player) {
      const cache = _status.event.getTempCache("kuangfu", "useShaValue")
      if (cache) {
        return cache
      }
      let eff = -Infinity,
        odds = 0,
        tar = null
      game.countPlayer((cur) => {
        if (!player.canUse("sha", cur, false)) {
          return
        }
        let eff2 = get.effect(cur, { name: "sha" }, player, player)
        if (eff2 < eff) {
          return
        }
        let directHit = 1 - cur.mayHaveShan(player, "use", true, "odds")
        if (get.attitude(player, cur) > 0) {
          directHit = 1
        } else {
          eff2 *= directHit
        }
        if (eff2 <= eff) {
          return
        }
        tar = cur
        eff = eff2
        odds = directHit
      })
      _status.event.putTempCache("kuangfu", "useShaValue", {
        tar,
        eff,
        odds,
      })
      return { tar, eff, odds }
    },
    async content(event, trigger, player) {
      const target = event.target
      if (player === target) {
        await player.chooseToDiscard("e", true)
      } else {
        await player.discardPlayerCard(target, "e", true)
      }
      await player.chooseUseTarget("sha", true, false, "nodistance")
      const bool = game.hasPlayer2((current) => {
        return (
          current.getHistory(
            "damage",
            (evt) => evt.getParent("kuangfu") === event,
          ).length > 0
        )
      })
      if (player === target && bool) {
        await player.draw(2)
      } else if (player !== target && !bool) {
        await player.chooseToDiscard("h", 2, true)
      }
    },
    ai: {
      order() {
        return get.order({ name: "sha" }) - 0.3
      },
      result: {
        player(player, target) {
          const cache = lib.skill.kuangfu.useShaValue(player),
            eff = cache.eff / 10
          if (player === target) {
            return 2 * cache.odds + eff
          }
          return Math.min(2, player.countCards("h")) * (cache.odds - 1) + eff
        },
        target(player, target) {
          let att = get.attitude(player, target),
            max = 0,
            min = 1
          target.countCards("e", (card) => {
            var val = get.value(card, target)
            if (val > max) {
              max = val
            }
            if (val < min) {
              min = val
            }
          })
          if (att <= 0) {
            if (target.hasSkillTag("noe")) {
              return 2 - max / 3
            }
            if (min <= 0) {
              return 1
            }
            return -max / 3
          }
          if (target.hasSkillTag("noe")) {
            return 2 - min / 4
          }
          if (min <= 0) {
            return 1
          }
          if (player === target) {
            const cache = lib.skill.kuangfu.useShaValue(player)
            return cache.eff / 10 - 1
          }
          return 0
        },
      },
    },
  },
  // 伏完
  // 谋溃
  moukui: {
    audio: 2,
    trigger: { player: "useCardToPlayered" },
    filter(event, player) {
      return event.card.name === "sha"
    },
    async cost(event, trigger, player) {
      const controls = ["draw_card"]
      if (trigger.target.countCards("he") > 0) {
        controls.push("discard_card")
      }
      controls.push("cancel2")
      const result = await player
        .chooseControl({
          prompt: get.prompt2(event.skill, trigger.target),
          controls,
          ai() {
            const trigger = get.event().getTrigger()
            const player = get.player()
            if (
              trigger.target.countCards("he") &&
              get.attitude(_status.event.player, trigger.target) < 0
            ) {
              return "discard_card"
            }
            const num = Math.min(
              player.getCardUsable("sha"),
              player.countCards("hs", (i) => get.name(i) === "sha") + 1,
            )
            if (!player.hasCard((i) => get.value(i) > 6 + num, "e")) {
              return "draw_card"
            }
            return "cancel2"
          },
        })
        .forResult()
      event.result = {
        bool: result.control !== "cancel2",
        targets: [trigger.target],
        cost_data: result.control,
      }
    },
    async content(event, trigger, player) {
      const result = event.cost_data
      if (result === "draw_card") {
        await player.draw()
      } else if (trigger.target.countCards("he")) {
        await player.discardPlayerCard(trigger.target, "he", true)
      }
      player.addTempSkill(`${event.name}_conseq`)
      player.markAuto(`${event.name}_conseq`, [[trigger.card, trigger.target]])
    },
    ai: { expose: 0.1 },
    subSkill: {
      conseq: {
        charlotte: true,
        onremove: true,
        trigger: { player: "shaMiss" },
        filter(event, player) {
          if (
            !player
              .getStorage("moukui_conseq")
              .some(
                ([card, target]) =>
                  event.card === card && event.target === target,
              )
          ) {
            return false
          }
          return player.countCards("he") > 0
        },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          const list = player
            .getStorage(event.name)
            .filter(
              ([card, target]) =>
                trigger.card === card && trigger.target === target,
            )
          player.unmarkAuto(event.name, list)
          if (!player.getStorage(event.name).length) {
            player.removeSkill(event.name)
          }
          const { target } = trigger
          target.line(player, "green")
          await target.discardPlayerCard(player, true)
        },
      },
    },
  },
  // 董承
  // 承诏
  chengzhao: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    filter(event, player) {
      let num = 0
      player.checkHistory("gain", (evt) => {
        num += evt.cards.length
      })
      if (num < 2) {
        return false
      }
      return (
        player.hasCards("h") &&
        game.hasPlayer((current) => current.canCompare(player))
      )
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(get.prompt2(event.skill), (card, player, target) => {
          return player.canCompare(target)
        })
        .set("ai", (target) => {
          const player = get.player()
          return -get.attitude(player, target) / target.countCards("h")
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      const result = await player.chooseToCompare(target).forResult()
      if (result?.bool) {
        const card = { name: "sha", isCard: true, storage: { chengzhao: true } }
        if (player.canUse(card, target, false)) {
          player.addTempSkill(`${event.name}_effect`)
          await player.useCard(card, target, false)
        }
      }
    },
    subSkill: {
      effect: {
        charlotte: true,
        ai: {
          unequip: true,
          skillTagFilter(player, tag, arg) {
            if (!arg?.card?.storage?.chengzhao) {
              return false
            }
          },
        },
      },
    },
  },

  // 薛灵芸
  // 思泣
  siqi: {
    audio: 2,
    trigger: { player: "damageEnd" },
    filter(event, player) {
      const cardPile = Array.from(ui.cardPile.childNodes).reverse()
      return cardPile[0]
    },
    frequent: true,
    /*
		async cost(event, trigger, player) {
			const cardPile = Array.from(ui.cardPile.childNodes).reverse();
			const redCards = [];
			for (const card of cardPile) {
				if (get.color(card) == "red") {
					redCards.push(card);
					if (redCards.length >= 3) break;
				} else break;
			}
			const result = await player
				.chooseNumbers(get.prompt2("siqi"), [{ prompt: "请选择你要亮出的牌数", min: 1, max: redCards.length }])
				.set("processAI", () => {
					return [get.event().maxNum];
				})
				.set("maxNum", redCards.length)
				.forResult();
			if (result.bool) {
				const number = result.numbers[0];
				event.result = {
					bool: result.bool,
					cost_data: number,
				};
			}
		},
		*/
    async content(event, trigger, player) {
      let cards = []
      const cardPile = Array.from(ui.cardPile.childNodes).reverse()
      for (const card of cardPile) {
        if (get.color(card) === "red") {
          cards.push(card)
          if (cards.length >= 3 /*event.cost_data*/) {
            break
          }
        } else {
          cards.push(card)
          break
        }
      }
      if (!cards.length) {
        return
      }
      const next = game.cardsGotoOrdering(cards)
      await next
      cards = next.cards.slice()
      if (!cards.length) {
        return
      }
      await player.showCards(cards, `${get.translation(player)}发动了【思泣】`)
      while (cards.length) {
        if (
          cards.every((card) => {
            if (!lib.filter.cardEnabled(card, player)) {
              return true
            }
            const name = ["tao", "wuzhong"]
            if (name.includes(card.name) || get.type(card) === "equip") {
              return !game.hasPlayer((target) =>
                lib.filter.targetEnabled2(card, player, target),
              )
            }
            return true
          })
        ) {
          break
        }
        const result2 = await player
          .chooseCardButton({
            cards,
            prompt: "思泣：请选择要使用的牌",
            filter(button) {
              const card = button.link
              if (!lib.filter.cardEnabled(card, get.player())) {
                return false
              }
              if (
                ["tao", "wuzhong"].includes(card.name) ||
                get.type(card) === "equip"
              ) {
                return game.hasPlayer((target) =>
                  lib.filter.targetEnabled2(card, get.player(), target),
                )
              }
              return false
            },
            forced: true,
            ai(button) {
              return get.player().getUseValue(button.link)
            },
          })
          .forResult()
        if (result2.bool) {
          const card = result2.links[0]
          game.broadcastAll((card) => {
            lib.skill.siqi_backup.viewAs = card
            lib.skill.siqi_backup.card = card
          }, card)
          player.addTempSkill("siqi_target")
          const next = player.chooseToUse()
          next.set(
            "openskilldialog",
            `思泣：请选择${get.translation(card)}的目标`,
          )
          next.set("forced", true)
          next.set("norestore", true)
          next.set("_backupevent", "siqi_backup")
          next.set("custom", {
            add: {},
            replace: { window() {} },
          })
          next.backup("siqi_backup")
          next.set("addCount", false)
          player
            .when("chooseToUseBegin")
            .filter((evt) => evt === next)
            .step(
              async (event, trigger, player) =>
                (trigger.filterCard = () => false),
            )
          const result3 = await next.forResult()
          player.removeSkill("siqi_target")
          if (result3.bool) {
            cards.remove(card)
            continue
          }
        }
        break
      }
      if (cards.length) {
        await player.draw({
          num: cards.filter((card) => {
            if (get.color(card) !== "red") {
              return false
            }
            if (!lib.filter.cardEnabled(card, player)) {
              return true
            }
            const name = ["tao", "wuzhong"]
            if (name.includes(card.name) || get.type(card) === "equip") {
              return !game.hasPlayer((target) =>
                lib.filter.targetEnabled2(card, player, target),
              )
            }
            return true
          }).length,
        })
      }
    },
    group: "siqi_lose",
    subSkill: {
      backup: {
        filterCard: () => false,
        selectCard: -1,
        filterTarget: lib.filter.targetEnabled2,
        log: false,
        async precontent(event, trigger, player) {
          const { card } = get.info("siqi_backup")
          event.result.cards = [card]
          event.result.card = get.autoViewAs(card, [card])
        },
      },
      lose: {
        audio: "siqi",
        trigger: {
          player: "loseAfter",
          global: [
            "loseAsyncAfter",
            "cardsDiscardAfter",
            "equipAfter",
            "addJudgeAfter",
            "addToExpansionAfter",
          ],
        },
        filter(event, player) {
          return event
            .getd(player, "cards2")
            .some((i) => get.color(i, player) === "red")
        },
        forced: true,
        locked: true,
        async content(event, trigger, player) {
          const list = trigger
            .getd(player)
            .filter((i) => get.color(i, player) === "red")
          await game.cardsGotoPile(list)
          game.log(player, "将", list, "置于牌堆底")
        },
      },
      target: {
        mod: {
          selectTarget(card, player, range) {
            if (_status._siqi_check) {
              return
            }
            const event = get.event()
            if (
              event?.name !== "chooseToUse" ||
              event.getParent().name !== "siqi"
            ) {
              return
            }
            _status._siqi_check = true
            const bool =
              game.countPlayer((target) =>
                lib.filter.targetEnabled2(card, player, target),
              ) > 1
            delete _status._siqi_check
            if (bool) {
              if (range[0] !== 1) {
                range[0] = 1
              }
              if (range[1] !== 1) {
                range[1] = 1
              }
            }
          },
          cardEnabled2(card, player) {
            if (_status._siqi_check) {
              return
            }
            const event = get.event()
            if (
              event?.name !== "chooseToUse" ||
              event.getParent().name !== "siqi"
            ) {
              return
            }
            _status._siqi_check = true
            const bool = game.hasPlayer((target) =>
              lib.filter.targetEnabled2(card, player, target),
            )
            delete _status._siqi_check
            if (bool) {
              return true
            }
          },
          cardEnabled(card, player) {
            if (_status._siqi_check) {
              return
            }
            const event = get.event()
            if (
              event?.name !== "chooseToUse" ||
              event.getParent().name !== "siqi"
            ) {
              return
            }
            _status._siqi_check = true
            const bool = game.hasPlayer((target) =>
              lib.filter.targetEnabled2(card, player, target),
            )
            delete _status._siqi_check
            if (bool) {
              return true
            }
          },
          playerEnabled(card, player, target) {
            if (_status._siqi_check) {
              return
            }
            const event = get.event()
            if (
              event?.name !== "chooseToUse" ||
              event.getParent().name !== "siqi"
            ) {
              return
            }
            _status._siqi_check = true
            const bool = lib.filter.targetEnabled2(card, player, target)
            delete _status._siqi_check
            if (bool) {
              return true
            }
          },
        },
        charlotte: false,
      },
    },
  },
  // 巧织
  qiaozhi: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      if (
        !player.hasCard(
          (card) => lib.filter.cardDiscardable(card, player),
          "he",
        )
      ) {
        return false
      }
      return !player.hasCard((card) => card.hasGaintag("qiaozhi"), "h")
    },
    filterCard: lib.filter.cardDiscardable,
    position: "he",
    check(card) {
      const player = get.player()
      return (
        7 -
        get.value(card) +
        (player.hasSkill("olshqi") && get.color(card) === "red" ? 3 : 0)
      )
    },
    async content(event, trigger, player) {
      const next = game.cardsGotoOrdering(get.cards(2))
      await next
      const cards = next.cards
      const videoId = lib.status.videoId++
      game.broadcastAll(
        (player, id, cards) => {
          const dialog = ui.create.dialog(
            `${get.translation(player)}发动了【巧织】`,
            cards,
          )
          dialog.videoId = id
        },
        player,
        videoId,
        cards,
      )
      const time = get.utc()
      game.addVideo("showCards", player, [
        `${get.translation(player)}发动了【巧织】`,
        get.cardsInfo(cards),
      ])
      await game.delay(2.5)
      game.broadcastAll(
        (player, id) => {
          const dialog = get.idDialog(id)
          if (player === game.me && !_status.auto) {
            dialog.content.childNodes[0].textContent =
              "巧织：选择获得其中一张牌"
          }
        },
        player,
        videoId,
      )
      const { links } = await player
        .chooseButton([1, 1], true)
        .set("ai", (button) => {
          return Math.max(get.value(button.link), get.useful(button.link))
        })
        .set("dialog", videoId)
        .forResult()
      const time2 = 1000 - (get.utc() - time)
      if (time2 > 0) {
        await game.delay(0, time2)
      }
      game.broadcastAll("closeDialog", videoId)
      if (!links?.length) {
        return
      }
      const next2 = player.gain(links, "gain2")
      next2.gaintag.add("qiaozhi")
      await next2
    },
    ai: {
      order: 1,
      result: { player: 1 },
    },
  },

  // // 夏侯玄
  // // 宦浮
  // huanfu: {
  //   audio: 2,
  //   trigger: {
  //     player: "useCardToPlayered",
  //     target: "useCardToTargeted",
  //   },
  //   filter(event, player) {
  //     if (event.card.name !== "sha") {
  //       return false
  //     }
  //     if (player === event.player && !event.isFirstTarget) {
  //       return false
  //     }
  //     if (event.huanfu_map?.[player.playerid]) {
  //       return false
  //     }
  //     return player.maxHp > 0 && player.countCards("he") > 0
  //   },
  //   direct: true,
  //   content() {
  //     "step 0"
  //     player
  //       .chooseToDiscard(
  //         "he",
  //         [1, player.maxHp],
  //         get.prompt("huanfu"),
  //         "通过弃牌，预测" +
  //           (player === trigger.player
  //             ? "你"
  //             : get.translation(trigger.player)) +
  //           "使用的" +
  //           get.translation(trigger.card) +
  //           "能造成多少伤害。如果弃置的牌数等于总伤害，则你摸两倍的牌。",
  //         "allowChooseAll",
  //       )
  //       .set(
  //         "predict",
  //         (() => {
  //           var target = trigger.target
  //           if (player === target) {
  //             if (
  //               trigger.targets.length > 1 ||
  //               player.hasShan() ||
  //               get.effect(player, trigger.card, trigger.player, player) === 0
  //             ) {
  //               return 0
  //             }
  //           } else {
  //             var target = trigger.target
  //             if (
  //               trigger.targets.length > 1 ||
  //               target.mayHaveShan(player, "use")
  //             ) {
  //               return 0
  //             }
  //           }
  //           var num = trigger.getParent().baseDamage
  //           var map = trigger.getParent().customArgs,
  //             id = target.playerid
  //           if (map[id]) {
  //             if (typeof map[id].baseDamage === "number") {
  //               num = map[id].baseDamage
  //             }
  //             if (typeof map[id].extraDamage === "number") {
  //               num += map[id].extraDamage
  //             }
  //           }
  //           if (
  //             target.hasSkillTag("filterDamage", null, {
  //               player: trigger.player,
  //               card: trigger.card,
  //             })
  //           ) {
  //             num = 1
  //           }
  //           return num
  //         })(),
  //       )
  //       .set("ai", (card) => {
  //         var num = _status.event.predict,
  //           player = _status.event.player
  //         if (ui.selected.cards.length >= num) {
  //           return 0
  //         }
  //         if (
  //           player.countCards("he", (card) => get.value(card) < 6 + num) < num
  //         ) {
  //           return 0
  //         }
  //         return 6 + num - get.value(card)
  //       }).logSkill = "huanfu"
  //     ;("step 1")
  //     if (result.bool) {
  //       player.addTempSkill("huanfu_lottery")
  //       var evt = trigger.getParent()
  //       if (!evt.huanfu_map) {
  //         evt.huanfu_map = {}
  //       }
  //       evt.huanfu_map[player.playerid] = result.cards.length
  //     }
  //   },
  //   ai: {
  //     effect: {
  //       target_use(card, player, target, current) {
  //         if (
  //           card.name === "sha" &&
  //           target.hp > 0 &&
  //           current < 0 &&
  //           target.countCards("he") > 0
  //         ) {
  //           return 0.7
  //         }
  //       },
  //     },
  //   },
  //   subSkill: {
  //     lottery: {
  //       audio: "huanfu",
  //       trigger: { global: "useCardAfter" },
  //       forced: true,
  //       charlotte: true,
  //       filter(event, player) {
  //         var map = event.huanfu_map
  //         if (!map?.[player.playerid]) {
  //           return false
  //         }
  //         var num = 0
  //         event.player.getHistory("sourceDamage", (evt) => {
  //           if (evt.card === event.card && evt.getParent().type === "card") {
  //             num += evt.num
  //           }
  //         })
  //         return num === map[player.playerid]
  //       },
  //       content() {
  //         player.draw(2 * trigger.huanfu_map[player.playerid])
  //       },
  //     },
  //   },
  // },
  // // 清议
  // qingyi: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filter(event, player) {
  //     return (
  //       player.hasCard(
  //         (card) => lib.filter.cardDiscardable(card, player, "qingyi"),
  //         "he",
  //       ) &&
  //       game.hasPlayer((current) =>
  //         lib.skill.qingyi.filterTarget(null, player, current),
  //       )
  //     )
  //   },
  //   selectTarget: [1, 2],
  //   filterTarget(card, player, target) {
  //     return target !== player && target.countCards("he") > 0
  //   },
  //   multitarget: true,
  //   multiline: true,
  //   content() {
  //     "step 0"
  //     var list = [player]
  //     list.addArray(targets)
  //     list.sortBySeat()
  //     event.list = list
  //     for (var target of event.list) {
  //       if (
  //         !target.hasCard(
  //           (card) => lib.filter.cardDiscardable(card, target, "qingyi"),
  //           "he",
  //         )
  //       ) {
  //         event.finish()
  //         break
  //       }
  //     }
  //     ;("step 1")
  //     player
  //       .chooseCardOL(
  //         event.list,
  //         "he",
  //         true,
  //         "清议：选择弃置一张牌",
  //         (card, player) => lib.filter.cardDiscardable(card, player, "qingyi"),
  //       )
  //       .set("ai", get.unuseful)
  //     ;("step 2")
  //     var lose_list = [],
  //       cards = []
  //     for (var i = 0; i < result.length; i++) {
  //       var current = event.list[i],
  //         card = result[i].cards[0]
  //       lose_list.push([current, result[i].cards])
  //       cards.push(card)
  //     }
  //     game
  //       .loseAsync({
  //         lose_list: lose_list,
  //       })
  //       .setContent("discardMultiple")
  //     var type = get.type2(cards[0])
  //     for (var i = 1; i < cards.length; i++) {
  //       if (get.type2(cards[i]) !== type) {
  //         event.finish()
  //       }
  //     }
  //     ;("step 3")
  //     for (var target of event.list) {
  //       if (
  //         !target.hasCard(
  //           (card) => lib.filter.cardDiscardable(card, target, "qingyi"),
  //           "he",
  //         )
  //       ) {
  //         event.finish()
  //         return
  //       }
  //     }
  //     player.chooseBool("清议：是否重复此流程？").set("ai", () => true)
  //     ;("step 4")
  //     if (result.bool) {
  //       event.goto(1)
  //     }
  //   },
  //   ai: {
  //     threaten: 1.2,
  //     order: 9.1,
  //     result: {
  //       player(player) {
  //         let min = 24
  //         player.countCards("he", (card) => {
  //           min = Math.min(min, get.value(card))
  //         })
  //         if (ui.selected.targets.length === 1) {
  //           return 1 - min / 6
  //         }
  //         return 0.75 - min / 48
  //       },
  //       target(player, target) {
  //         if (
  //           target.hasCard(
  //             (card) => lib.filter.cardDiscardable(card, player, "qingyi"),
  //             "he",
  //           )
  //         ) {
  //           return -1
  //         }
  //         return 0
  //       },
  //     },
  //   },
  //   group: "qingyi_gain",
  //   subSkill: {
  //     gain: {
  //       audio: "qingyi",
  //       trigger: { player: "phaseJieshuBegin" },
  //       direct: true,
  //       filter(event, player) {
  //         var history = player.getHistory(
  //           "useSkill",
  //           (evt) => evt.skill === "qingyi",
  //         )
  //         if (!history.length) {
  //           return false
  //         }
  //         for (var evt of history) {
  //           var list = [player]
  //           list.addArray(evt.targets)
  //           for (var target of list) {
  //             var found = false
  //             target.getHistory("lose", (evtx) => {
  //               if (found || evtx.getParent(2).name !== "qingyi") {
  //                 return false
  //               }
  //               for (var card of evtx.cards) {
  //                 if (get.position(card, true) === "d") {
  //                   found = true
  //                 }
  //               }
  //             })
  //             if (found) {
  //               return true
  //             }
  //           }
  //         }
  //         return false
  //       },
  //       content() {
  //         "step 0"
  //         var history = player.getHistory(
  //             "useSkill",
  //             (evt) => evt.skill === "qingyi",
  //           ),
  //           cards = []
  //         for (var evt of history) {
  //           var list = [player]
  //           list.addArray(evt.targets)
  //           for (var target of list) {
  //             target.getHistory("lose", (evtx) => {
  //               if (evtx.getParent(2).name !== "qingyi") {
  //                 return false
  //               }
  //               for (var card of evtx.cards) {
  //                 if (get.position(card, true) === "d") {
  //                   cards.add(card)
  //                 }
  //               }
  //             })
  //           }
  //         }
  //         var colors = []
  //         for (var card of cards) {
  //           colors.add(get.color(card, false))
  //         }
  //         var numColors = colors.length
  //         if (!numColors || !cards.length) {
  //           event.finish()
  //           return
  //         }
  //         player
  //           .chooseButton(
  //             ["清议：选择获得每种颜色的牌各一张", cards],
  //             numColors,
  //           )
  //           .set("filterButton", (button) => {
  //             var selected = ui.selected.buttons
  //             for (var i = 0; i < selected.length; i++) {
  //               if (
  //                 get.color(selected[i].link, false) ===
  //                 get.color(button.link, false)
  //               ) {
  //                 return false
  //               }
  //             }
  //             return true
  //           })
  //           .set("ai", (button) => get.value(button.link, _status.event.player))
  //         ;("step 1")
  //         if (result.bool) {
  //           player.logSkill("qingyi_gain")
  //           player.gain(result.links, "gain2")
  //         }
  //       },
  //     },
  //   },
  // },
  // // 迮阅
  // zeyue: {
  //   audio: 2,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   limited: true,
  //   skillAnimation: true,
  //   animationColor: "water",
  //   direct: true,
  //   filter(event, player) {
  //     var sources = [],
  //       history = player.actionHistory
  //     for (var i = history.length - 1; i >= 0; i--) {
  //       if (i < history.length - 1 && history[i].isMe) {
  //         break
  //       }
  //       for (var evt of history[i].damage) {
  //         if (evt.source && evt.source !== player && evt.source.isIn()) {
  //           sources.add(evt.source)
  //         }
  //       }
  //     }
  //     for (var source of sources) {
  //       var skills = source.getStockSkills("一！", "五！")
  //       for (var skill of skills) {
  //         var info = get.info(skill)
  //         if (
  //           info &&
  //           !info.persevereSkill &&
  //           !info.charlotte &&
  //           !get.is.locked(skill, source) &&
  //           source.hasSkill(skill, null, null, false)
  //         ) {
  //           return true
  //         }
  //       }
  //     }
  //     return false
  //   },
  //   content() {
  //     "step 0"
  //     var sources = [],
  //       history = player.actionHistory
  //     for (var i = history.length - 1; i >= 0; i--) {
  //       if (i < history.length - 1 && history[i].isMe) {
  //         break
  //       }
  //       for (var evt of history[i].damage) {
  //         if (evt.source && evt.source !== player && evt.source.isIn()) {
  //           sources.add(evt.source)
  //         }
  //       }
  //     }
  //     sources = sources.filter((source) => {
  //       var skills = source.getStockSkills("一！", "五！")
  //       for (var skill of skills) {
  //         var info = get.info(skill)
  //         if (
  //           info &&
  //           !info.persevereSkill &&
  //           !info.charlotte &&
  //           !get.is.locked(skill, source) &&
  //           source.hasSkill(skill, null, null, false)
  //         ) {
  //           return true
  //         }
  //       }
  //       return false
  //     })
  //     player
  //       .chooseTarget(
  //         get.prompt("zeyue"),
  //         "令一名可选角色的一个非锁定技失效",
  //         (card, player, target) => _status.event.sources.includes(target),
  //       )
  //       .set("sources", sources)
  //       .set("ai", (target) => {
  //         var player = _status.event.player,
  //           att = get.attitude(player, target)
  //         if (att >= 0) {
  //           return 0
  //         }
  //         return get.threaten(target, player)
  //       })
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       player.logSkill("zeyue", target)
  //       player.awakenSkill(event.name)
  //       event.target = target
  //       var skills = target.getStockSkills("一！", "五！")
  //       skills = skills.filter((skill) => {
  //         var info = get.info(skill)
  //         if (
  //           info &&
  //           !info.charlotte &&
  //           !get.is.locked(skill, target) &&
  //           target.hasSkill(skill, null, null, false)
  //         ) {
  //           return true
  //         }
  //       })
  //       if (skills.length === 1) {
  //         event._result = { control: skills[0] }
  //       } else {
  //         player
  //           .chooseControl(skills)
  //           .set("prompt", `令${get.translation(target)}的一个技能失效`)
  //       }
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     var skill = result.control
  //     target.disableSkill(`zeyue_${player.playerid}`, skill)
  //     target.storage[`zeyue_${player.playerid}`] = true
  //     player.addSkill("zeyue_round")
  //     player.markAuto("zeyue_round", [target])
  //     if (!player.storage.zeyue_map) {
  //       player.storage.zeyue_map = {}
  //     }
  //     player.storage.zeyue_map[target.playerid] = 0
  //     game.log(target, "的技能", `#g【${get.translation(skill)}】`, "被失效了")
  //   },
  //   ai: { threaten: 3 },
  //   subSkill: {
  //     round: {
  //       charlotte: true,
  //       trigger: { global: "roundEnd" },
  //       filter(event, player) {
  //         var storage = player.getStorage("zeyue_round")
  //         for (var source of storage) {
  //           if (source.isIn() && source.canUse("sha", player, false)) {
  //             return true
  //           }
  //         }
  //         return false
  //       },
  //       forced: true,
  //       popup: false,
  //       content() {
  //         "step 0"
  //         event.targets = player.storage.zeyue_round.slice(0).sortBySeat()
  //         event.target = event.targets.shift()
  //         event.forceDie = true
  //         ;("step 1")
  //         var map = player.storage.zeyue_map
  //         if (target.storage[`zeyue_${player.playerid}`]) {
  //           map[target.playerid]++
  //         }
  //         event.num = map[target.playerid] - 1
  //         if (event.num <= 0) {
  //           event.finish()
  //         }
  //         ;("step 2")
  //         event.num--
  //         target.useCard(
  //           player,
  //           { name: "sha", isCard: true },
  //           false,
  //           "zeyue_round",
  //         )
  //         ;("step 3")
  //         var key = `zeyue_${player.playerid}`
  //         if (
  //           target.storage[key] &&
  //           player.hasHistory(
  //             "damage",
  //             (evt) =>
  //               evt.card.name === "sha" &&
  //               evt.getParent().type === "card" &&
  //               evt.getParent(3) === event,
  //           )
  //         ) {
  //           for (var skill in target.disabledSkills) {
  //             if (target.disabledSkills[skill].includes(key)) {
  //               game.log(
  //                 target,
  //                 "恢复了技能",
  //                 `#g【${get.translation(skill)}】`,
  //               )
  //             }
  //           }
  //           delete target.storage[key]
  //           target.enableSkill(key)
  //         }
  //         if (
  //           event.num > 0 &&
  //           player.isIn() &&
  //           target.isIn() &&
  //           target.canUse("sha", player, false)
  //         ) {
  //           event.goto(2)
  //         } else if (event.targets.length > 0) {
  //           event.target = event.targets.shift()
  //           event.goto(1)
  //         }
  //       },
  //     },
  //   },
  // },
  // // 阎柔
  // // 仇讨
  // choutao: {
  //   audio: 2,
  //   trigger: {
  //     player: "useCard",
  //     target: "useCardToTargeted",
  //   },
  //   filter(event, player) {
  //     if (event.card.name !== "sha" || !event.player.isIn()) {
  //       return false
  //     }
  //     if (player === event.player) {
  //       return player.hasCard(
  //         (card) => lib.filter.cardDiscardable(card, player, "choutao"),
  //         "he",
  //       )
  //     }
  //     return event.player.hasCard(
  //       (card) => lib.filter.canBeDiscarded(card, player, event.player),
  //       "he",
  //     )
  //   },
  //   check(event, player) {
  //     if (player === event.player) {
  //       if (!player.hasCard((card) => get.value(card) <= 5, "he")) {
  //         return false
  //       }
  //       for (var i of event.targets) {
  //         var eff1 = get.damageEffect(i, player, player)
  //         if (eff1 < 0) {
  //           return false
  //         }
  //         if (i.hasShan() && eff1 > 0) {
  //           return true
  //         }
  //       }
  //       var sha = false
  //       return (
  //         player.getCardUsable({ name: "sha" }) <= 0 &&
  //         player.hasCard((card) => {
  //           if (
  //             !sha &&
  //             get.name(card) === "sha" &&
  //             player.getUseValue(card) > 0
  //           ) {
  //             sha = true
  //             return false
  //           }
  //           return sha && get.value(card) <= 5
  //         }, "hs")
  //       )
  //     }
  //     var eff1 = get.effect(
  //       event.player,
  //       { name: "guohe_copy2" },
  //       player,
  //       player,
  //     )
  //     var eff2 = get.damageEffect(player, event.player, player)
  //     if (!player.hasShan()) {
  //       return eff1 > 0
  //     }
  //     if (eff2 > 0) {
  //       return eff1 > 0
  //     }
  //     return player.hp > 2 && eff2 < eff1
  //   },
  //   logTarget: "player",
  //   content() {
  //     "step 0"
  //     if (
  //       player !== game.me &&
  //       !player.isOnline() &&
  //       !player.isUnderControl()
  //     ) {
  //       game.delayx()
  //     }
  //     if (player === trigger.player) {
  //       player.chooseToDiscard("he", true).set("ai", (card) => {
  //         var player = _status.event.player
  //         var val = player.getUseValue(card)
  //         if (get.name(card) === "sha" && player.getUseValue(card) > 0) {
  //           val += 5
  //         }
  //         return 20 - val
  //       })
  //     } else {
  //       player.discardPlayerCard(trigger.player, true, "he")
  //     }
  //     ;("step 1")
  //     trigger.directHit.addArray(game.players)
  //     if (player === trigger.player && trigger.addCount !== false) {
  //       trigger.addCount = false
  //       const stat = player.getStat().card,
  //         name = trigger.card.name
  //       if (typeof stat[name] === "number") {
  //         stat[name]--
  //       }
  //     }
  //   },
  // },
  // // 襄戍
  // xiangshu: {
  //   audio: 2,
  //   trigger: { player: "phaseJieshuBegin" },
  //   direct: true,
  //   limited: true,
  //   skillAnimation: true,
  //   animationColor: "gray",
  //   filter(event, player) {
  //     return (
  //       (player.getStat("damage") || 0) > 0 &&
  //       game.hasPlayer((current) => current.isDamaged())
  //     )
  //   },
  //   content() {
  //     "step 0"
  //     event.num = Math.min(5, player.getStat("damage"))
  //     player
  //       .chooseTarget(
  //         "是否发动限定技【襄戍】？",
  //         `令一名角色回复${event.num}点体力并摸${get.cnNumber(event.num)}张牌`,
  //         (card, player, target) => target.isDamaged(),
  //       )
  //       .set("ai", (target) => {
  //         var num = _status.event.getParent().num,
  //           player = _status.event.player
  //         var att = get.attitude(player, target)
  //         if (att > 0 && num >= Math.min(player.hp, 2)) {
  //           return att * Math.sqrt(target.getDamagedHp())
  //         }
  //         return 0
  //       })
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       player.awakenSkill(event.name)
  //       player.logSkill("xiangshu", target)
  //       target.recover(num)
  //       target.draw(num)
  //       if (player !== target) {
  //         player.addExpose(0.2)
  //       }
  //     }
  //   },
  // },
  // // 清河公主
  // // 谮构
  // zengou: {
  //   audio: 2,
  //   trigger: { global: "useCard" },
  //   filter(event, player) {
  //     return (
  //       event.card.name === "shan" &&
  //       player.inRange(event.player) &&
  //       (player.hp > 0 ||
  //         player.hasCard(
  //           (card) =>
  //             get.type(card) !== "basic" &&
  //             lib.filter.cardDiscardable(card, player, "zengou"),
  //           "eh",
  //         ))
  //     )
  //   },
  //   logTarget: "player",
  //   check(event, player) {
  //     if (get.attitude(player, event.player) >= 0) {
  //       return false
  //     }
  //     if (
  //       get.damageEffect(
  //         event.player,
  //         event.getParent(3).player,
  //         player,
  //         get.nature(event.card),
  //       ) <= 0
  //     ) {
  //       return false
  //     }
  //     if (
  //       player.hasCard(
  //         (card) =>
  //           get.type(card) !== "basic" &&
  //           get.value(card) < 7 &&
  //           lib.filter.cardDiscardable(card, player, "zengou"),
  //         "eh",
  //       )
  //     ) {
  //       return true
  //     }
  //     return player.hp > Math.max(1, event.player.hp)
  //   },
  //   content() {
  //     "step 0"
  //     trigger.all_excluded = true
  //     var str = "弃置一张非基本牌"
  //     if (player.hp > 0) {
  //       str += "，或点「取消」失去1点体力"
  //     }
  //     var next = player
  //       .chooseToDiscard(str, (card) => get.type(card) !== "basic", "he")
  //       .set("ai", (card) => 7 - get.value(card))
  //     if (player.hp <= 0) {
  //       next.set("forced", true)
  //     }
  //     ;("step 1")
  //     if (!result.bool) {
  //       player.loseHp()
  //     }
  //     ;("step 2")
  //     var cards = trigger.cards.filterInD()
  //     if (cards.length) {
  //       player.gain(cards, "gain2")
  //     }
  //   },
  // },
  // // 长姬
  // zhangji: {
  //   audio: 2,
  //   trigger: { global: "phaseJieshuBegin" },
  //   direct: true,
  //   filter(event, player) {
  //     if (!event.player.isIn()) {
  //       return false
  //     }
  //     if (player.getHistory("sourceDamage").length > 0) {
  //       return true
  //     }
  //     if (player.getHistory("damage").length > 0) {
  //       return event.player.countCards("he") > 0
  //     }
  //     return false
  //   },
  //   content() {
  //     "step 0"
  //     event.target = trigger.player
  //     if (player.getHistory("sourceDamage").length) {
  //       player
  //         .chooseBool(
  //           get.prompt("zhangji", event.target),
  //           `令${get.translation(event.target)}摸两张牌`,
  //         )
  //         .set("choice", get.attitude(player, event.target) > 0)
  //         .set("ai", () => _status.event.choice)
  //     } else {
  //       event.goto(2)
  //     }
  //     ;("step 1")
  //     if (result.bool) {
  //       player.logSkill("zhangji", target)
  //       event.logged = true
  //       target.draw(2)
  //     }
  //     ;("step 2")
  //     if (
  //       target.isIn() &&
  //       target.countCards("he") > 0 &&
  //       player.getHistory("damage").length > 0
  //     ) {
  //       player
  //         .chooseBool(
  //           get.prompt("zhangji", event.target),
  //           `令${get.translation(event.target)}弃置两张牌`,
  //         )
  //         .set("choice", get.attitude(player, event.target) < 0)
  //         .set("ai", () => _status.event.choice)
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 3")
  //     if (result.bool) {
  //       if (!event.logged) {
  //         player.logSkill("zhangji", target)
  //       }
  //       target.chooseToDiscard("he", true, 2)
  //     }
  //   },
  // },
  // // 曹芳
  // // 置民
  // zhimin: {
  //   audio: 2,
  //   trigger: { global: "roundStart" },
  //   filter(event, player) {
  //     return (
  //       game.hasPlayer(
  //         (current) => current !== player && current.countCards("h"),
  //       ) && player.getHp() > 0
  //     )
  //   },
  //   forced: true,
  //   group: ["zhimin_mark", "zhimin_draw"],
  //   async content(event, trigger, player) {
  //     const result = await player
  //       .chooseTarget(
  //         `置民：请选择至多${get.cnNumber(player.getHp())}名其他角色`,
  //         "你获得这些角色各自手牌中的随机一张牌",
  //         (card, player, target) => {
  //           return target !== player && target.countCards("h")
  //         },
  //         [1, player.getHp()],
  //         true,
  //       )
  //       .set("ai", (target) => {
  //         const player = get.player()
  //         return (
  //           get.effect(
  //             target,
  //             { name: "shunshou_copy", position: "h" },
  //             player,
  //             player,
  //           ) + 0.1
  //         )
  //       })
  //       .forResult()
  //     if (!result?.targets?.length) {
  //       return
  //     }
  //     const targets = result.targets.sortBySeat()
  //     player.line(targets, "thunder")
  //     const toGain = []
  //     for (const target of targets) {
  //       const cards = target.getCards("h")
  //       const gainableCards = cards
  //         .filter((card) => {
  //           return lib.filter.canBeGained(card, player, target)
  //         })
  //         .randomSort()
  //       toGain.push(gainableCards[0])
  //     }
  //     if (toGain.length) {
  //       await player.gain(toGain, "giveAuto")
  //     }
  //     await game.delayx()
  //   },
  //   ai: { threaten: 5.8 },
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (
  //         num > 0 &&
  //         get.itemtype(card) === "card" &&
  //         card.hasGaintag("zhimin_tag") &&
  //         player.countCards("h", (cardx) => {
  //           return cardx.hasGaintag("zhimin_tag") && cardx !== card
  //         }) < player.maxHp
  //       ) {
  //         return num / 10
  //       }
  //     },
  //   },
  //   subSkill: {
  //     mark: {
  //       audio: "zhimin",
  //       trigger: {
  //         player: "loseAfter",
  //         global: [
  //           "equipAfter",
  //           "addJudgeAfter",
  //           "gainAfter",
  //           "loseAsyncAfter",
  //           "addToExpansionAfter",
  //         ],
  //       },
  //       forced: true,
  //       silent: true,
  //       filter(event, player) {
  //         if (
  //           !event.getl(player).hs.length &&
  //           !event
  //             .getg(player)
  //             .some(
  //               (card) =>
  //                 get.position(card) === "h" && get.owner(card) === player,
  //             )
  //         ) {
  //           return false
  //         }
  //         return true
  //       },
  //       async content(event, trigger, player) {
  //         player.removeGaintag("zhimin_tag")
  //         const cards = player.getCards("h"),
  //           minNumber = cards
  //             .map((card) => get.number(card))
  //             .sort((a, b) => a - b)[0]
  //         player.addGaintag(
  //           cards.filter((card) => get.number(card) === minNumber),
  //           "zhimin_tag",
  //         )
  //       },
  //     },
  //     draw: {
  //       audio: "zhimin",
  //       trigger: {
  //         player: "loseAfter",
  //         global: [
  //           "equipAfter",
  //           "addJudgeAfter",
  //           "gainAfter",
  //           "loseAsyncAfter",
  //           "addToExpansionAfter",
  //         ],
  //       },
  //       filter(event, player) {
  //         const evt = event.getl(player)
  //         if (!evt.hs.length || player.maxHp <= player.countCards("h")) {
  //           return false
  //         }
  //         return Object.values(evt.gaintag_map).flat().includes("zhimin_tag")
  //       },
  //       async content(event, trigger, player) {
  //         player.showHandcards(`${get.translation(player)}发动了【置民】`)
  //         await player.drawTo(player.maxHp)
  //       },
  //     },
  //   },
  // },
  // // 拒谏
  // dcjujian: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   zhuSkill: true,
  //   filter(event, player) {
  //     return game.hasPlayer((current) => {
  //       return (
  //         player.hasZhuSkill("dcjujian", current) &&
  //         current.group === "wei" &&
  //         current !== player
  //       )
  //     })
  //   },
  //   filterTarget(_, player, target) {
  //     return (
  //       player.hasZhuSkill("dcjujian", target) &&
  //       target.group === "wei" &&
  //       target !== player
  //     )
  //   },
  //   async content(event, trigger, player) {
  //     const target = event.targets[0]
  //     await target.draw()
  //     target.addTempSkill("dcjujian_forbid", "roundStart")
  //     target.markAuto("dcjujian_forbid", player)
  //   },
  //   ai: {
  //     result: {
  //       target(player, target) {
  //         const num = target.countCards("hs", (card) => {
  //             return (
  //               get.type(card) === "trick" &&
  //               target.canUse(card, player) &&
  //               get.effect(player, card, target, player) < -2
  //             )
  //           }),
  //           att = get.attitude(player, target)
  //         if (att < 0) {
  //           return -0.74 * num
  //         }
  //         return 1.5
  //       },
  //     },
  //   },
  //   subSkill: {
  //     forbid: {
  //       audio: "dcjujian",
  //       trigger: {
  //         player: "useCardToBefore",
  //       },
  //       filter(event, player) {
  //         if (get.type(event.card) !== "trick") {
  //           return false
  //         }
  //         return player.getStorage("dcjujian_forbid").includes(event.target)
  //       },
  //       forced: true,
  //       charlotte: true,
  //       onremove: true,
  //       direct: true,
  //       async content(event, trigger, player) {
  //         await trigger.target.logSkill("dcjujian_forbid", player)
  //         trigger.cancel()
  //       },
  //       intro: {
  //         content: "使用普通锦囊牌对$无效",
  //       },
  //       ai: {
  //         effect: {
  //           player(card, player, target, current) {
  //             if (
  //               get.type(card) === "trick" &&
  //               player.getStorage("dcjujian_forbid").includes(target)
  //             ) {
  //               return "zeroplayertarget"
  //             }
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // // 杜预
  // // 谏国
  // jianguo: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     return ["discard", "draw"].some(
  //       (i) => !player.getStorage("jianguo_used").includes(i),
  //     )
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       var dialog = ui.create.dialog("谏国：请选择一项", "hidden")
  //       dialog.add([
  //         [
  //           ["discard", "令一名角色摸一张牌，然后弃置一半手牌"],
  //           ["draw", "令一名角色弃置一张牌，然后摸等同于手牌数一半的牌"],
  //         ],
  //         "textbutton",
  //       ])
  //       return dialog
  //     },
  //     filter(button, player) {
  //       return !player.getStorage("jianguo_used").includes(button.link)
  //     },
  //     check(button) {
  //       var player = _status.event.player
  //       if (button.link === "discard") {
  //         var discard = Math.max.apply(
  //           Math,
  //           game
  //             .filterPlayer((current) => {
  //               return lib.skill.jianguo_discard.filterTarget(
  //                 null,
  //                 player,
  //                 current,
  //               )
  //             })
  //             .map((current) => {
  //               return get.effect(current, "jianguo_discard", player, player)
  //             }),
  //         )
  //         return discard
  //       }
  //       if (button.link === "draw") {
  //         var draw = Math.max.apply(
  //           Math,
  //           game
  //             .filterPlayer((current) => {
  //               return lib.skill.jianguo_draw.filterTarget(
  //                 null,
  //                 player,
  //                 current,
  //               )
  //             })
  //             .map((current) => {
  //               return get.effect(current, "jianguo_draw", player, player)
  //             }),
  //         )
  //         return draw
  //       }
  //       return 0
  //     },
  //     backup(links) {
  //       return get.copy(lib.skill[`jianguo_${links[0]}`])
  //     },
  //     prompt(links) {
  //       if (links[0] === "discard") {
  //         return "令一名角色摸一张牌，然后弃置一半手牌"
  //       }
  //       return "令一名角色弃置一张牌，然后摸等同于手牌数一半的牌"
  //     },
  //   },
  //   ai: {
  //     order: 10,
  //     threaten: 2.8,
  //     result: {
  //       //想让杜预两个技能自我联动写起来太累了，开摆
  //       player: 1,
  //     },
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //     backup: { audio: "jianguo" },
  //     discard: {
  //       audio: "jianguo",
  //       filterTarget: () => true,
  //       filterCard: () => false,
  //       selectCard: -1,
  //       content() {
  //         "step 0"
  //         player.addTempSkill("jianguo_used", "phaseUseAfter")
  //         player.markAuto("jianguo_used", ["discard"])
  //         target.draw()
  //         game.delayex()
  //         ;("step 1")
  //         var num = Math.ceil(target.countCards("h") / 2)
  //         if (num > 0) {
  //           target.chooseToDiscard(
  //             num,
  //             true,
  //             `谏国：请弃置${get.cnNumber(num)}张手牌`,
  //           )
  //         }
  //       },
  //       ai: {
  //         result: {
  //           target(player, target) {
  //             return 1.1 - Math.floor(target.countCards("h") / 2)
  //           },
  //         },
  //         tag: {
  //           gain: 1,
  //           loseCard: 2,
  //         },
  //       },
  //     },
  //     draw: {
  //       audio: "jianguo",
  //       filterTarget(card, player, target) {
  //         return target.countCards("he")
  //       },
  //       filterCard: () => false,
  //       selectCard: -1,
  //       content() {
  //         "step 0"
  //         player.addTempSkill("jianguo_used", "phaseUseAfter")
  //         player.markAuto("jianguo_used", ["draw"])
  //         target.chooseToDiscard("he", true, "谏国：请弃置一张牌")
  //         ;("step 1")
  //         var num = Math.ceil(target.countCards("h") / 2)
  //         if (num > 0) {
  //           target.draw(num)
  //         }
  //       },
  //       ai: {
  //         result: {
  //           target(player, target) {
  //             var fix = 0
  //             var num = target.countCards("h")
  //             if (player === target && num % 2 === 1 && num >= 5) {
  //               fix += 1
  //             }
  //             return Math.ceil(num / 2 - 0.5) + fix
  //           },
  //         },
  //         tag: {
  //           loseCard: 1,
  //           gain: 2,
  //         },
  //       },
  //     },
  //   },
  // },
  // // 倾势
  // qingshi: {
  //   audio: 2,
  //   trigger: {
  //     player: "useCardToPlayered",
  //   },
  //   filter(event, player) {
  //     if (player !== _status.currentPhase) {
  //       return false
  //     }
  //     if (!event.isFirstTarget) {
  //       return false
  //     }
  //     if (
  //       event.card.name !== "sha" &&
  //       get.type(event.card, null, false) !== "trick"
  //     ) {
  //       return false
  //     }
  //     if (
  //       player.countCards("h") !==
  //       player.getHistory("useCard").indexOf(event.getParent()) + 1
  //     ) {
  //       return false
  //     }
  //     return event.targets.some((target) => {
  //       return target !== player && target.isIn()
  //     })
  //   },
  //   direct: true,
  //   locked: false,
  //   content() {
  //     "step 0"
  //     var targets = trigger.targets.filter((target) => {
  //       return target !== player && target.isIn()
  //     })
  //     player
  //       .chooseTarget(
  //         get.prompt("qingshi"),
  //         "对一名不为你的目标角色造成1点伤害",
  //         (card, player, target) => {
  //           return _status.event.targets.includes(target)
  //         },
  //       )
  //       .set("ai", (target) => {
  //         var player = _status.event.player
  //         return get.damageEffect(target, player, player)
  //       })
  //       .set("targets", targets)
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       player.logSkill("qingshi", target)
  //       target.damage()
  //     }
  //   },
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (_status.currentPhase !== player) {
  //         return
  //       }
  //       var cardsh = []
  //       if (Array.isArray(card.cards)) {
  //         cardsh.addArray(
  //           card.cards.filter((card) => {
  //             return get.position(card) === "h"
  //           }),
  //         )
  //       }
  //       var del =
  //         player.countCards("h") -
  //         cardsh.length -
  //         player.getHistory("useCard").length -
  //         1
  //       if (del < 0) {
  //         return
  //       }
  //       if (del > 0) {
  //         if (card.name === "sha" || get.type(card, null, player) !== "trick") {
  //           return num / 3
  //         }
  //         return num + 1
  //       }
  //       return num + 15
  //     },
  //   },
  // },
  // // 桓范
  // // 谏诤
  // sp_jianzheng: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filterTarget(card, player, target) {
  //     return target.countCards("h") && target !== player
  //   },
  //   content() {
  //     "step 0"
  //     var forced = target.hasCard((i) => player.hasUseTarget(i), "h")
  //     player
  //       .choosePlayerCard(
  //         target,
  //         "h",
  //         "visible",
  //         forced,
  //         "获得并使用其中一张牌",
  //       )
  //       .set("filterButton", (button) => {
  //         return _status.event.player.hasUseTarget(button.link)
  //       })
  //       .set("ai", (button) => {
  //         return _status.event.player.getUseValue(button.link)
  //       })
  //     ;("step 1")
  //     if (result.bool) {
  //       var card = result.links[0]
  //       event.card = card
  //       player.gain(card, "giveAuto")
  //     } else {
  //       event.goto(3)
  //     }
  //     ;("step 2")
  //     if (
  //       get.position(card) === "h" &&
  //       get.owner(card) === player &&
  //       player.hasUseTarget(card)
  //     ) {
  //       if (get.name(card, player) === "sha") {
  //         player.chooseUseTarget(card, true, false)
  //       } else {
  //         player.chooseUseTarget(card, true)
  //       }
  //     }
  //     ;("step 3")
  //     if (
  //       player.hasHistory("useCard", (evt) => {
  //         return (
  //           evt.getParent(2).name === "sp_jianzheng" &&
  //           evt.targets.includes(target)
  //         )
  //       })
  //     ) {
  //       player.link(true)
  //       target.link(true)
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 4")
  //     target.viewHandcards(player)
  //   },
  //   ai: {
  //     order: 10,
  //     expose: 0.2,
  //     result: {
  //       target(player, target) {
  //         return -Math.sqrt(target.countCards("h"))
  //       },
  //     },
  //   },
  // },
  // // 腹谋
  // fumou: {
  //   audio: 2,
  //   trigger: { player: "damageEnd" },
  //   direct: true,
  //   filter(event, player) {
  //     return player.getDamagedHp() > 0
  //   },
  //   content() {
  //     "step 0"
  //     event.num = trigger.num
  //     ;("step 1")
  //     player
  //       .chooseTarget(get.prompt2("fumou"), [1, player.getDamagedHp()])
  //       .set("ai", (target) => {
  //         var att = get.attitude(_status.event.player, target)
  //         if (
  //           target.countCards("h") >= 3 &&
  //           (!target.isDamaged() || !target.countCards("e"))
  //         ) {
  //           if (!target.canMoveCard()) {
  //             return -att
  //           }
  //           if (!target.canMoveCard(true)) {
  //             return -att / 5
  //           }
  //         }
  //         return att
  //       })
  //     ;("step 2")
  //     if (result.bool) {
  //       var targets = result.targets
  //       targets.sortBySeat(player)
  //       event.targets = targets
  //       player.logSkill("fumou", targets)
  //       event.num--
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 3")
  //     var target = targets.shift()
  //     event.target = target
  //     var choices = []
  //     var choiceList = [
  //       "移动场上的一张牌",
  //       "弃置所有手牌并摸两张牌",
  //       "弃置装备区里的所有牌并回复1点体力",
  //     ]
  //     if (target.canMoveCard()) {
  //       choices.push("选项一")
  //     } else {
  //       choiceList[0] = `<span style="opacity:0.5">${choiceList[0]}</span>`
  //     }
  //     if (
  //       target.countCards("h") &&
  //       !target.hasCard((card) => {
  //         return !lib.filter.cardDiscardable(card, target, "fumou")
  //       }, "h")
  //     ) {
  //       choices.push("选项二")
  //     } else {
  //       choiceList[1] = `<span style="opacity:0.5">${choiceList[1]}</span>`
  //     }
  //     if (
  //       target.countCards("e") &&
  //       !target.hasCard((card) => {
  //         return !lib.filter.cardDiscardable(card, target, "fumou")
  //       }, "h")
  //     ) {
  //       choices.push("选项三")
  //     } else {
  //       choiceList[2] = `<span style="opacity:0.5">${choiceList[2]}</span>`
  //     }
  //     if (choices.length) {
  //       target
  //         .chooseControl(choices)
  //         .set("prompt", "腹谋：请选择一项")
  //         .set("choiceList", choiceList)
  //         .set("ai", () => {
  //           return _status.event.choice
  //         })
  //         .set(
  //           "choice",
  //           (() => {
  //             if (choices.length === 1) {
  //               return choices[0]
  //             }
  //             var func = (choice, target) => {
  //               switch (choice) {
  //                 case "选项一":
  //                   if (target.canMoveCard(true)) {
  //                     return 5
  //                   }
  //                   return 0
  //                 case "选项二":
  //                   return (
  //                     4 -
  //                     target.getCards("h").reduce((acc, card) => {
  //                       return acc + get.value(card)
  //                     }, 0) /
  //                       3
  //                   )
  //                 case "选项三": {
  //                   var e2 = target.getEquip(2)
  //                   if (target.isHealthy()) {
  //                     return -1.8 * target.countCards("e") - (e2 ? 1 : 0)
  //                   }
  //                   if (
  //                     !e2 &&
  //                     target.hp + target.countCards("hs", ["tao", "jiu"]) < 2
  //                   ) {
  //                     return 6
  //                   }
  //                   let rec =
  //                     get.recoverEffect(target, target, target) / 4 -
  //                     target.getCards("e").reduce((acc, card) => {
  //                       return acc + get.value(card)
  //                     }, 0) /
  //                       3
  //                   if (!e2) {
  //                     rec += 2
  //                   }
  //                   return rec
  //                 }
  //               }
  //             }
  //             var choicesx = choices
  //               .map((i) => [i, func(i, target)])
  //               .sort((a, b) => b[1] - a[1])
  //             return choicesx[0][0]
  //           })(),
  //         )
  //     } else {
  //       event.goto(5)
  //     }
  //     ;("step 4")
  //     game.log(target, "选择了", `#y${result.control}`)
  //     if (result.control === "选项一") {
  //       target.moveCard(true)
  //     } else if (result.control === "选项二") {
  //       target.chooseToDiscard(true, "h", target.countCards("h"))
  //       target.draw(2)
  //     } else {
  //       target.chooseToDiscard(true, "e", target.countCards("e"))
  //       target.recover()
  //     }
  //     ;("step 5")
  //     if (event.targets.length) {
  //       event.goto(3)
  //     }
  //     // else if(event.num) event.goto(1);
  //   },
  //   ai: {
  //     maixie: true,
  //     maixie_hp: true,
  //     effect: {
  //       target(card, player, target) {
  //         if (get.tag(card, "damage")) {
  //           if (player.hasSkillTag("jueqing", false, target)) {
  //             return [1, -2]
  //           }
  //           if (!target.hasFriend()) {
  //             return
  //           }
  //           var num = 1
  //           if (get.attitude(player, target) > 0) {
  //             if (player.needsToDiscard()) {
  //               num = 0.7
  //             } else {
  //               num = 0.5
  //             }
  //           }
  //           if (target.hp === 2 && target.hasFriend()) {
  //             return [1, num * 1.5]
  //           }
  //           if (target.hp >= 2) {
  //             return [1, num]
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // // 郑浑
  // // 强峙
  // dcqiangzhi: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filterTarget(card, player, target) {
  //     if (target === player) {
  //       return false
  //     }
  //     return (
  //       target.countDiscardableCards(player, "he") +
  //         player.countDiscardableCards(player, "he") >=
  //       3
  //     )
  //   },
  //   content() {
  //     "step 0"
  //     var dialog = []
  //     dialog.push(`强峙：弃置你与${get.translation(target)}的共计三张牌`)
  //     if (player.countCards("h")) {
  //       dialog.addArray([
  //         '<div class="text center">你的手牌</div>',
  //         player.getCards("h"),
  //       ])
  //     }
  //     if (player.countCards("e")) {
  //       dialog.addArray([
  //         '<div class="text center">你的装备</div>',
  //         player.getCards("e"),
  //       ])
  //     }
  //     if (target.countCards("h")) {
  //       dialog.add(
  //         `<div class="text center">${get.translation(target)}的手牌</div>`,
  //       )
  //       if (player.hasSkillTag("viewHandcard", null, target, true)) {
  //         dialog.push(target.getCards("h"))
  //       } else {
  //         dialog.push([target.getCards("h"), "blank"])
  //       }
  //     }
  //     if (target.countCards("e")) {
  //       dialog.addArray([
  //         `<div class="text center">${get.translation(target)}的装备</div>`,
  //         target.getCards("e"),
  //       ])
  //     }
  //     player
  //       .chooseButton(3, true)
  //       .set("createDialog", dialog)
  //       .set("filterButton", (button) => {
  //         if (
  //           !lib.filter.canBeDiscarded(
  //             button.link,
  //             _status.event.player,
  //             get.owner(button.link),
  //           )
  //         ) {
  //           return false
  //         }
  //         return true
  //       })
  //       .set("filterOk", () => {
  //         return ui.selected.buttons.length === 3
  //       })
  //       .set("ai", (button) => {
  //         var player = _status.event.player
  //         var target = _status.event.getParent().target
  //         var card = button.link
  //         if (get.owner(card) === player) {
  //           if (_status.event.damage) {
  //             return 15 - get.value(card)
  //           }
  //           if (
  //             player.hp >= 3 ||
  //             get.damageEffect(player, target, player) >= 0 ||
  //             (player.hasSkill("pitian") &&
  //               player.getHandcardLimit() - player.countCards("h") >= 1 &&
  //               player.hp > 1)
  //           ) {
  //             return 0
  //           }
  //           if (ui.selected.buttons.length === 0) {
  //             return 10 - get.value(card)
  //           }
  //           return 0
  //         }
  //         if (_status.event.damage) {
  //           return 0
  //         }
  //         return -(get.sgnAttitude(player, target) || 1) * get.value(card)
  //       })
  //       .set(
  //         "damage",
  //         get.damageEffect(target, player, player) > 10 &&
  //           player.countCards("he", (card) => {
  //             return (
  //               lib.filter.canBeDiscarded(card, player, player) &&
  //               get.value(card) < 5
  //             )
  //           }) >= 3,
  //       )
  //     ;("step 1")
  //     if (result.bool) {
  //       var links = result.links
  //       var list1 = [],
  //         list2 = []
  //       event.players = [player, target]
  //       for (var card of links) {
  //         if (get.owner(card) === player) {
  //           list1.push(card)
  //         } else {
  //           list2.push(card)
  //         }
  //       }
  //       if (list1.length && list2.length) {
  //         game
  //           .loseAsync({
  //             lose_list: [
  //               [player, list1],
  //               [target, list2],
  //             ],
  //             discarder: player,
  //           })
  //           .setContent("discardMultiple")
  //         event.finish()
  //       } else if (list2.length) {
  //         target.discard(list2)
  //       } else {
  //         player.discard(list1)
  //       }
  //       if (list2.length >= 3) {
  //         event.players.reverse()
  //       }
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     event.players[0].line(event.players[1])
  //     event.players[1].damage(event.players[0])
  //   },
  //   ai: {
  //     expose: 0.2,
  //     order: 4,
  //     result: {
  //       target(player, target) {
  //         return (
  //           (get.effect(target, { name: "guohe_copy2" }, player, target) / 2) *
  //             (target.countDiscardableCards(player, "he") >= 2 ? 1.25 : 1) +
  //           get.damageEffect(target, player, target) / 3
  //         )
  //       },
  //     },
  //   },
  // },
  // // 辟田
  // pitian: {
  //   audio: 2,
  //   trigger: {
  //     player: ["loseAfter", "damageEnd"],
  //     global: "loseAsyncAfter",
  //   },
  //   forced: true,
  //   locked: false,
  //   group: "pitian_draw",
  //   filter(event, player) {
  //     if (event.name === "damage") {
  //       return true
  //     }
  //     return event.type === "discard" && event.getl(player).cards2.length > 0
  //   },
  //   content() {
  //     player.addMark("pitian_handcard", 1, false)
  //     player.addSkill("pitian_handcard")
  //     game.log(player, "的手牌上限", "#y+1")
  //   },
  //   subSkill: {
  //     draw: {
  //       audio: "pitian",
  //       trigger: { player: "phaseJieshuBegin" },
  //       filter(event, player) {
  //         return player.countCards("h") < player.getHandcardLimit()
  //       },
  //       prompt2(event, player) {
  //         return (
  //           "摸" +
  //           get.cnNumber(
  //             Math.min(5, player.getHandcardLimit() - player.countCards("h")),
  //           ) +
  //           "张牌，重置因〖辟田〗增加的手牌上限"
  //         )
  //       },
  //       check(event, player) {
  //         return (
  //           player.getHandcardLimit() - player.countCards("h") >
  //           Math.min(2, player.hp - 1)
  //         )
  //       },
  //       content() {
  //         "step 0"
  //         var num = Math.min(
  //           5,
  //           player.getHandcardLimit() - player.countCards("h"),
  //         )
  //         if (num > 0) {
  //           player.draw(num)
  //         }
  //         ;("step 1")
  //         player.removeMark(
  //           "pitian_handcard",
  //           player.countMark("pitian_handcard"),
  //           false,
  //         )
  //         game.log(player, "重置了", "#g【辟田】", "增加的手牌上限")
  //       },
  //     },
  //     handcard: {
  //       markimage: "image/card/handcard.png",
  //       intro: {
  //         content(storage, player) {
  //           return `手牌上限+${storage}`
  //         },
  //       },
  //       charlotte: true,
  //       mod: {
  //         maxHandcard(player, num) {
  //           return num + player.countMark("pitian_handcard")
  //         },
  //       },
  //     },
  //   },
  //   ai: {
  //     effect: {
  //       target(card, player, target) {
  //         if (get.tag(card, "discard")) {
  //           return 0.9
  //         }
  //         if (get.tag(card, "damage")) {
  //           return 0.95
  //         }
  //       },
  //     },
  //   },
  // },
  // // 赵俨
  // // 抚宁
  // funing: {
  //   audio: 2,
  //   trigger: { player: "useCard" },
  //   prompt2(event, player) {
  //     return (
  //       "摸两张牌，然后弃置" +
  //       get.cnNumber(
  //         1 +
  //           player.getHistory("useSkill", (evt) => evt.skill === "funing")
  //             .length,
  //       ) +
  //       "张牌"
  //     )
  //   },
  //   check(event, player) {
  //     return (
  //       player.getHistory("useSkill", (evt) => evt.skill === "funing").length <
  //       2
  //     )
  //   },
  //   content() {
  //     player.draw(2)
  //     player.chooseToDiscard(
  //       "he",
  //       true,
  //       +player.getHistory("useSkill", (evt) => evt.skill === "funing").length,
  //     )
  //   },
  // },
  // // 秉纪
  // bingji: {
  //   mod: {
  //     cardUsable(card, player, num) {
  //       if (card.storage?.bingji) {
  //         return Infinity
  //       }
  //     },
  //     cardEnabled(card, player) {
  //       if (card.storage?.bingji) {
  //         return true
  //       }
  //     },
  //   },
  //   locked: false,
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     var hs = player.getCards("h"),
  //       suits = player.getStorage("bingji_used")
  //     if (!hs.length) {
  //       return false
  //     }
  //     var suit = get.suit(hs[0], player)
  //     if (suit === "none" || suits.includes(suit)) {
  //       return false
  //     }
  //     for (var i = 1; i < hs.length; i++) {
  //       if (get.suit(hs[i], player) !== suit) {
  //         return false
  //       }
  //     }
  //     return true
  //   },
  //   ai: {
  //     order: 10,
  //     result: { player: 1 },
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       return ui.create.dialog("秉纪", [["sha", "tao"], "vcard"], "hidden")
  //     },
  //     filter(button, player) {
  //       return lib.filter.cardEnabled(
  //         {
  //           name: button.link[2],
  //           isCard: true,
  //           storage: { bingji: true },
  //         },
  //         player,
  //         "forceEnable",
  //       )
  //     },
  //     check(button) {
  //       var card = {
  //           name: button.link[2],
  //           isCard: true,
  //           storage: { bingji: true },
  //         },
  //         player = _status.event.player
  //       return Math.max.apply(
  //         Math,
  //         game
  //           .filterPlayer((target) => {
  //             if (player === target) {
  //               return false
  //             }
  //             return (
  //               lib.filter.targetEnabled2(card, player, target) &&
  //               lib.filter.targetInRange(card, player, target)
  //             )
  //           })
  //           .map((target) => get.effect(target, card, player, player)),
  //       )
  //     },
  //     backup(links, player) {
  //       return {
  //         viewAs: {
  //           name: links[0][2],
  //           isCard: true,
  //           storage: { bingji: true },
  //         },
  //         filterCard: () => false,
  //         selectCard: -1,
  //         filterTarget(card, player, target) {
  //           if (!card) {
  //             card = get.card()
  //           }
  //           if (player === target) {
  //             return false
  //           }
  //           return (
  //             lib.filter.targetEnabled2(card, player, target) &&
  //             lib.filter.targetInRange(card, player, target)
  //           )
  //         },
  //         selectTarget: 1,
  //         ignoreMod: true,
  //         filterOk: () => true,
  //         log: false,
  //         precontent() {
  //           player.logSkill("bingji")
  //           var hs = player.getCards("h")
  //           event.getParent().addCount = false
  //           player.showCards(hs, `${get.translation(player)}发动了【秉纪】`)
  //           player.markAuto("bingji_used", [get.suit(hs[0], player)])
  //           player.addTempSkill("bingji_used")
  //         },
  //       }
  //     },
  //     prompt(links, player) {
  //       return `请选择【${get.translation(links[0][2])}】的目标`
  //     },
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //   },
  // },
  // // 文钦
  // // 犷骜
  // guangao: {
  //   audio: 2,
  //   trigger: {
  //     global: "useCard2",
  //   },
  //   filter(event, player) {
  //     var card = event.card
  //     if (card.name !== "sha") {
  //       return false
  //     }
  //     if (event.player === player) {
  //       return game.hasPlayer((current) => {
  //         return (
  //           current.isIn() &&
  //           !event.targets.includes(current) &&
  //           player.canUse(card, current)
  //         )
  //       })
  //     }
  //     return (
  //       event.player.isIn() &&
  //       !event.targets.includes(player) &&
  //       event.player.canUse(card, player)
  //     )
  //   },
  //   direct: true,
  //   content() {
  //     "step 0"
  //     if (trigger.player === player) {
  //       player
  //         .chooseTarget(
  //           get.prompt("guangao"),
  //           "为" +
  //             get.translation(trigger.card) +
  //             "额外指定一个目标。然后若你手牌数为偶数，你摸一张牌并令此牌对任意目标无效。",
  //           (card, player, target) => {
  //             return (
  //               !_status.event.sourcex.includes(target) &&
  //               player.canUse(_status.event.card, target)
  //             )
  //           },
  //         )
  //         .set("sourcex", trigger.targets)
  //         .set("ai", (target) => {
  //           var player = _status.event.player
  //           if (player.countCards("h") % 2 === 0) {
  //             return true
  //           }
  //           var eff = get.effect(target, _status.event.card, player, player)
  //           if (
  //             player.hasSkill("xieju") &&
  //             player.isPhaseUsing() &&
  //             !player.getStat().skill.xieju &&
  //             get.attitude(player, target) > 0 &&
  //             !game.hasGlobalHistory("useCard", (evt) => {
  //               return evt.targets?.includes(target)
  //             })
  //           ) {
  //             return 6 + eff
  //           }
  //           return eff
  //         })
  //         .set("card", trigger.card)
  //     } else {
  //       trigger.player
  //         .chooseBool(
  //           `是否发动${get.translation(player)}的【犷骜】？`,
  //           "令其成为" +
  //             get.translation(trigger.card) +
  //             "的额外目标。然后若其手牌数为偶数，其摸一张牌并令此牌对任意目标无效。",
  //         )
  //         .set("ai", () => {
  //           return _status.event.bool
  //         })
  //         .set(
  //           "bool",
  //           (() => {
  //             var att = get.attitude(trigger.player, player)
  //             if (player.countCards("h") % 2 === 0) {
  //               if (att > 0) {
  //                 return true
  //               }
  //               return false
  //             }
  //             if (
  //               get.effect(
  //                 player,
  //                 trigger.card,
  //                 trigger.player,
  //                 trigger.player,
  //               ) > 0
  //             ) {
  //               return true
  //             }
  //             return false
  //           })(),
  //         )
  //     }
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets?.[0]
  //       if (!target) {
  //         target = player
  //         trigger.player.logSkill("guangao", player)
  //       } else {
  //         player.logSkill("guangao", target)
  //       }
  //       trigger.targets.add(target)
  //       game.delayex()
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     if (player.countCards("h") % 2 === 0) {
  //       player.draw()
  //       player
  //         .chooseTarget(
  //           "犷骜：令此杀对其任意个目标无效",
  //           [1, Infinity],
  //           (card, player, target) => {
  //             return _status.event.targetsx.includes(target)
  //           },
  //         )
  //         .set("ai", (target) => {
  //           const evt = _status.event.getTrigger(),
  //             player = _status.event.player
  //           return -get.effect(target, evt.card, evt.player, player)
  //         })
  //         .set("targetsx", trigger.targets)
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 3")
  //     if (result.bool) {
  //       player.line(result.targets)
  //       trigger.excluded.addArray(result.targets)
  //     }
  //   },
  // },
  // // 彗企
  // huiqi: {
  //   audio: 2,
  //   trigger: {
  //     global: "phaseEnd",
  //   },
  //   juexingji: true,
  //   forced: true,
  //   skillAnimation: true,
  //   animationColor: "thunder",
  //   derivation: "xieju",
  //   filter(event, player) {
  //     const targets = []
  //     game.getGlobalHistory("useCard", (evt) => {
  //       if (evt.targets?.length) {
  //         targets.addArray(evt.targets)
  //       }
  //     })
  //     return targets.length === 3 && targets.includes(player)
  //   },
  //   async content(event, trigger, player) {
  //     player.awakenSkill(event.name)
  //     await player.addSkills("xieju")
  //     player.insertPhase()
  //   },
  // },
  // // 偕举
  // xieju: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filter(event, player) {
  //     return event.xieju?.length
  //   },
  //   onChooseToUse(event) {
  //     if (!event.xieju && !game.online) {
  //       const targets = []
  //       game.getGlobalHistory("useCard", (evt) => {
  //         if (evt.targets?.length) {
  //           targets.addArray(evt.targets)
  //         }
  //       })
  //       event.set("xieju", targets)
  //     }
  //   },
  //   filterTarget(card, player, target) {
  //     return (
  //       get.event().xieju.includes(target) &&
  //       target.hasUseTarget({ name: "sha" }, true, false)
  //     )
  //   },
  //   selectTarget: [1, Infinity],
  //   async content(event, trigger, player) {
  //     await event.target.chooseUseTarget(
  //       { name: "sha" },
  //       "偕举：视为使用一张【杀】",
  //       true,
  //       false,
  //     )
  //   },
  //   ai: {
  //     order: 1,
  //     result: {
  //       target(player, target) {
  //         var val = target.getUseValue({ name: "sha" }, true)
  //         return Math.sign(val)
  //       },
  //     },
  //   },
  // },
  // // 界钟会
  // // 权计
  // quanji: {
  //   audio: 2,
  //   trigger: { player: "damageEnd" },
  //   frequent: true,
  //   locked: false,
  //   filter(event) {
  //     return event.num > 0
  //   },
  //   getIndex: (event) => event.num,
  //   async content(event, trigger, player) {
  //     await player.draw()
  //     const hs = player.getCards("h")
  //     if (!hs.length) {
  //       return
  //     }
  //     const result =
  //       hs.length === 1
  //         ? { bool: true, cards: hs }
  //         : await player.chooseCard("h", true, "选择一张牌作为“权”").forResult()
  //     if (result?.bool && result?.cards?.length) {
  //       const next = player.addToExpansion(result.cards, player, "give")
  //       next.gaintag.add(event.name)
  //       await next
  //     }
  //   },
  //   intro: {
  //     content: "expansion",
  //     markcount: "expansion",
  //   },
  //   onremove(player, skill) {
  //     const cards = player.getExpansions(skill)
  //     if (cards.length) {
  //       player.loseToDiscardpile(cards)
  //     }
  //   },
  //   mod: {
  //     maxHandcard(player, num) {
  //       return num + player.getExpansions("quanji").length
  //     },
  //   },
  //   ai: {
  //     maixie: true,
  //     maixie_hp: true,
  //     notemp: true,
  //     threaten: 0.8,
  //     effect: {
  //       target(card, player, target) {
  //         if (
  //           get.tag(card, "damage") &&
  //           (player.hasSkill("paiyi") || player.hasSkill("zili"))
  //         ) {
  //           if (player.hasSkillTag("jueqing", false, target)) {
  //             return [1, -2]
  //           }
  //           if (!target.hasFriend()) {
  //             return
  //           }
  //           if (target.hp >= 4) {
  //             return [0.5, get.tag(card, "damage") * 2]
  //           }
  //           if (!target.hasSkill("paiyi") && target.hp > 1) {
  //             return [0.5, get.tag(card, "damage") * 1.5]
  //           }
  //           if (target.hp === 3) {
  //             return [0.5, get.tag(card, "damage") * 1.5]
  //           }
  //           if (target.hp === 2) {
  //             return [1, get.tag(card, "damage") * 0.5]
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // jx_quanji: {
  //   audio: 2,
  //   trigger: { player: ["damageEnd", "phaseUseEnd"] },
  //   frequent: true,
  //   locked: false,
  //   filter(event, player) {
  //     if (event.name === "phaseUse") {
  //       return player.countCards("h") > player.hp
  //     }
  //     return event.num > 0
  //   },
  //   getIndex(event, player) {
  //     return event.num || 1
  //   },
  //   async content(event, trigger, player) {
  //     await player.draw()
  //     if (!player.countCards("h")) {
  //       return
  //     }
  //     const result = await player
  //       .chooseCard("将一张手牌置于武将牌上作为“权”", true)
  //       .forResult()
  //     if (result?.bool && result?.cards?.length) {
  //       const next = player.addToExpansion(result.cards, player, "give")
  //       next.gaintag.add("quanji")
  //       await next
  //     }
  //   },
  //   mod: {
  //     maxHandcard(player, num) {
  //       return num + player.getExpansions("quanji").length
  //     },
  //     aiOrder(player, card, num) {
  //       if (num <= 0 || typeof card !== "object" || !player.isPhaseUsing()) {
  //         return num
  //       }
  //       if (player.countCards("h") > player.hp + 1) {
  //         return num
  //       }
  //       if (!player.hasSkill("zili") || player.hasSkill("paiyi")) {
  //         return num
  //       }
  //       if (player.getExpansions("quanji").length < 3) {
  //         if (
  //           get.type(card) === "equip" &&
  //           !["equip2", "equip3"].includes(get.subtype(card))
  //         ) {
  //           return 0
  //         }
  //         let eff = 6 + player.hp
  //         if (!get.tag(card, "gain") && !get.tag(card, "draw")) {
  //           eff += 3
  //         }
  //         if (player.getUseValue(card) < eff) {
  //           return 0
  //         }
  //       }
  //     },
  //   },
  //   onremove(player, skill) {
  //     const cards = player.getExpansions("quanji")
  //     if (cards.length) {
  //       player.loseToDiscardpile(cards)
  //     }
  //   },
  //   ai: {
  //     maixie: true,
  //     maixie_hp: true,
  //     notemp: true,
  //     threaten: 0.8,
  //     effect: {
  //       target(card, player, target) {
  //         if (get.tag(card, "damage")) {
  //           if (player.hasSkillTag("jueqing", false, target)) {
  //             return [1, -2]
  //           }
  //           if (!target.hasFriend()) {
  //             return
  //           }
  //           if (target.hp >= 4) {
  //             return [0.5, get.tag(card, "damage") * 2]
  //           }
  //           if (!target.hasSkill("paiyi") && target.hp > 1) {
  //             return [0.5, get.tag(card, "damage") * 1.5]
  //           }
  //           if (target.hp === 3) {
  //             return [0.5, get.tag(card, "damage") * 1.5]
  //           }
  //           if (target.hp === 2) {
  //             return [1, get.tag(card, "damage") * 0.5]
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // // 自立
  // zili: {
  //   skillAnimation: true,
  //   animationColor: "thunder",
  //   audio: 2,
  //   audioname: ["jx_zhonghui"],
  //   juexingji: true,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   forced: true,
  //   derivation: "paiyi",
  //   filter(event, player) {
  //     return player.countExpansions("quanji") >= 3
  //   },
  //   async content(event, trigger, player) {
  //     player.awakenSkill(event.name)
  //     await player.loseMaxHp()
  //     await player.chooseDrawRecover(2, true, (event, player) => {
  //       if (player.hp === 1 && player.isDamaged()) {
  //         return "recover_hp"
  //       }
  //       return "draw_card"
  //     })
  //     await player.addSkills("paiyi")
  //   },
  //   ai: { combo: "quanji" },
  // },
  // // 排异
  // paiyi: {
  //   enable: "phaseUse",
  //   usable: 1,
  //   audio: 2,
  //   audioname: ["jx_zhonghui"],
  //   filter(event, player) {
  //     return player.getExpansions("quanji").length > 0
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       return ui.create.dialog(
  //         "排异",
  //         player.getExpansions("quanji"),
  //         "hidden",
  //       )
  //     },
  //     backup(links, player) {
  //       return {
  //         audio: "paiyi",
  //         audioname: ["jx_zhonghui"],
  //         filterTarget: true,
  //         filterCard() {
  //           return false
  //         },
  //         selectCard: -1,
  //         card: links[0],
  //         delay: false,
  //         content: lib.skill.paiyi.contentx,
  //         ai: {
  //           order: 10,
  //           result: {
  //             target(player, target) {
  //               if (player !== target) {
  //                 return 0
  //               }
  //               if (
  //                 player.hasSkill("quanji") ||
  //                 player.countCards("h") + 2 <=
  //                   player.hp + player.getExpansions("quanji").length
  //               ) {
  //                 return 1
  //               }
  //               return 0
  //             },
  //           },
  //         },
  //       }
  //     },
  //     prompt() {
  //       return "请选择〖排异〗的目标"
  //     },
  //   },
  //   contentx() {
  //     "step 0"
  //     var card = lib.skill.paiyi_backup.card
  //     player.loseToDiscardpile(card)
  //     ;("step 1")
  //     target.draw(2)
  //     ;("step 2")
  //     if (target.countCards("h") > player.countCards("h")) {
  //       target.damage()
  //     }
  //   },
  //   ai: {
  //     order: 1,
  //     combo: "quanji",
  //     result: {
  //       player: 1,
  //     },
  //   },
  // },
  // // 羊徽瑜
  // // 弘仪
  // hongyi: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   //filter:function(event,player){
  //   //	return player.countCards('he')>=Math.min(2,game.dead.length);
  //   //},
  //   //selectCard:function(){
  //   //	return Math.min(2,game.dead.length);
  //   //},
  //   //filterCard:true,
  //   filterTarget: lib.filter.notMe,
  //   check(card) {
  //     var num = Math.min(2, game.dead.length)
  //     if (!num) {
  //       return 1
  //     }
  //     if (num === 1) {
  //       return 7 - get.value(card)
  //     }
  //     return 5 - get.value(card)
  //   },
  //   position: "he",
  //   content() {
  //     const skill = `${event.name}_effect`
  //     player.addTempSkill(skill, { player: "phaseBeginStart" })
  //     player.markAuto(skill, target)
  //   },
  //   ai: {
  //     order: 1,
  //     result: {
  //       target(player, target) {
  //         if (target.hasJudge("lebu")) {
  //           return -0.5
  //         }
  //         return -1 - target.countCards("h")
  //       },
  //     },
  //   },
  //   subSkill: {
  //     effect: {
  //       audio: "hongyi",
  //       trigger: { global: "damageBegin1" },
  //       charlotte: true,
  //       forced: true,
  //       logTarget: "source",
  //       filter(event, player) {
  //         return player.getStorage("hongyi_effect").includes(event.source)
  //       },
  //       async content(event, trigger, player) {
  //         const result = await trigger.source.judge().forResult()
  //         if (result.color === "black") {
  //           trigger.num--
  //         } else {
  //           await trigger.player.draw()
  //         }
  //       },
  //       onremove: true,
  //       intro: {
  //         content: "已选中$为技能目标",
  //       },
  //     },
  //   },
  // },
  // // 劝封
  // quanfeng: {
  //   audio: 2,
  //   enable: "chooseToUse",
  //   limited: true,
  //   skillAnimation: true,
  //   animationColor: "thunder",
  //   prompt2:
  //     "（限定技）失去技能【劝封】，并获得该角色武将牌上的所有技能，然后加1点体力上限并回复1点体力",
  //   logTarget: "player",
  //   trigger: { global: "die" },
  //   check: (event, player) => {
  //     if (
  //       event.player
  //         .getStockSkills("仲村由理", "天下第一")
  //         .filter((skill) => {
  //           const info = get.info(skill)
  //           return (
  //             info && !info.hiddenSkill && !info.zhuSkill && !info.charlotte
  //           )
  //         })
  //         .some((i) => {
  //           const info = get.info(i)
  //           if (info?.ai) {
  //             return info.ai.neg || info.ai.halfneg
  //           }
  //         })
  //     ) {
  //       return false
  //     }
  //     return true
  //   },
  //   filter(event, player) {
  //     if (event.name === "die") {
  //       return (
  //         player.hasSkill("hongyi") &&
  //         event.player
  //           .getStockSkills("仲村由理", "天下第一")
  //           .filter((skill) => {
  //             var info = get.info(skill)
  //             return (
  //               info && !info.hiddenSkill && !info.zhuSkill && !info.charlotte
  //             )
  //           }).length > 0
  //       )
  //     }
  //     return event.type === "dying" && player === event.dying
  //   },
  //   async content(event, trigger, player) {
  //     player.awakenSkill(event.name)
  //     if (trigger?.name === "die") {
  //       await player.removeSkills("hongyi")
  //       const skills = trigger.player
  //         .getStockSkills("仲村由理", "天下第一")
  //         .filter((skill) => {
  //           const info = get.info(skill)
  //           return (
  //             info && !info.hiddenSkill && !info.zhuSkill && !info.charlotte
  //           )
  //         })
  //       if (skills.length) {
  //         await player.addSkills(skills)
  //         game.broadcastAll((list) => {
  //           game.expandSkills(list)
  //           for (const i of list) {
  //             const info = lib.skill[i]
  //             if (!info) {
  //               continue
  //             }
  //             if (!info.audioname2) {
  //               info.audioname2 = {}
  //             }
  //             info.audioname2.yanghuiyu = "quanfeng"
  //           }
  //         }, skills)
  //       }
  //       await player.gainMaxHp()
  //       await player.recover()
  //     } else {
  //       await player.gainMaxHp(2)
  //       await player.recover(4)
  //     }
  //   },
  //   ai: {
  //     save: true,
  //     skillTagFilter(player, tag, arg) {
  //       return player === arg
  //     },
  //     order: 10,
  //     result: {
  //       player: 1,
  //     },
  //   },
  // },
  // // 戏志才
  // // 先辅
  // xianfu: {
  //   trigger: {
  //     global: "phaseBefore",
  //     player: "enterGame",
  //   },
  //   locked: true,
  //   filter(event, player) {
  //     return (
  //       game.hasPlayer((current) => current !== player) &&
  //       (event.name !== "phase" || game.phaseNumber === 0)
  //     )
  //   },
  //   audio: 6,
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         "请选择【先辅】的目标",
  //         lib.translate.xianfu_info,
  //         true,
  //         (card, player, target) =>
  //           target !== player && !player.storage.xianfu2?.includes(target),
  //       )
  //       .set("ai", (target) => {
  //         const att = get.attitude(_status.event.player, target)
  //         if (att > 0) {
  //           return att + 1
  //         }
  //         if (att === 0) {
  //           return Math.random()
  //         }
  //         return att
  //       })
  //       .set("animate", false)
  //       .forResult()
  //   },
  //   logAudio: () => 2,
  //   logLine: false,
  //   async content(event, trigger, player) {
  //     const [target] = event.targets
  //     player.storage.xianfu2 ??= []
  //     player.storage.xianfu2.push(target)
  //     player.addSkill("xianfu2")
  //     const func = (player, target) => {
  //       target.storage.xianfu_mark ??= []
  //       target.storage.xianfu_mark.add(player)
  //       target.storage.xianfu_mark.sortBySeat()
  //       target.markSkill("xianfu_mark", null, null, true)
  //     }
  //     if (event.isMine()) {
  //       func(player, target)
  //     } else if (player.isOnline2()) {
  //       player.send(func, player, target)
  //     }
  //   },
  // },
  // xianfu_mark: {
  //   marktext: "辅",
  //   intro: {
  //     name: "先辅",
  //     content:
  //       "当你受到伤害后，$受到等量的伤害，当你回复体力后，$回复等量的体力",
  //   },
  // },
  // xianfu2: {
  //   audio: "xianfu",
  //   charlotte: true,
  //   trigger: { global: ["damageEnd", "recoverEnd"] },
  //   forced: true,
  //   sourceSkill: "xianfu",
  //   filter(event, player) {
  //     if (
  //       event.player.isDead() ||
  //       !player.storage.xianfu2 ||
  //       !player.storage.xianfu2.includes(event.player) ||
  //       event.num <= 0
  //     ) {
  //       return false
  //     }
  //     if (event.name === "damage") {
  //       return true
  //     }
  //     return player.isDamaged()
  //   },
  //   logAudio(event, player) {
  //     if (event.name === "damage") {
  //       return ["xianfu5.mp3", "xianfu6.mp3"]
  //     }
  //     return ["xianfu3.mp3", "xianfu4.mp3"]
  //   },
  //   logTarget: "player",
  //   content() {
  //     "step 0"
  //     var target = trigger.player
  //     if (!target.storage.xianfu_mark) {
  //       target.storage.xianfu_mark = []
  //     }
  //     target.storage.xianfu_mark.add(player)
  //     target.storage.xianfu_mark.sortBySeat()
  //     target.markSkill("xianfu_mark")
  //     game.delayx()
  //     ;("step 1")
  //     player[trigger.name](trigger.num, "nosource")
  //   },
  //   onremove(player) {
  //     if (!player.storage.xianfu2) {
  //       return
  //     }
  //     game.countPlayer((current) => {
  //       if (
  //         player.storage.xianfu2.includes(current) &&
  //         current.storage.xianfu_mark
  //       ) {
  //         current.storage.xianfu_mark.remove(player)
  //         if (!current.storage.xianfu_mark.length) {
  //           current.unmarkSkill("xianfu_mark")
  //         } else {
  //           current.markSkill("xianfu_mark")
  //         }
  //       }
  //     })
  //     delete player.storage.xianfu2
  //   },
  //   group: "xianfu3",
  // },
  // xianfu3: {
  //   trigger: { global: "dieBegin" },
  //   silent: true,
  //   sourceSkill: "xianfu",
  //   filter(event, player) {
  //     return (
  //       event.player === player ||
  //       player.storage.xianfu2?.includes(event.player)
  //     )
  //   },
  //   content() {
  //     if (player === trigger.player) {
  //       lib.skill.xianfu2.onremove(player)
  //     } else {
  //       player.storage.xianfu2.remove(event.player)
  //     }
  //   },
  // },
  // // 筹策
  // chouce: {
  //   audio: 2,
  //   trigger: { player: "damageEnd" },
  //   getIndex: (event) => event.num,
  //   filter(event) {
  //     return event.num > 0
  //   },
  //   async content(event, trigger, player) {
  //     const result = await player.judge().forResult()
  //     const color = result?.color
  //     let result2
  //     switch (color) {
  //       case "black":
  //         if (
  //           game.hasPlayer((current) =>
  //             current.countDiscardableCards(player, "hej"),
  //           )
  //         ) {
  //           result2 = await player
  //             .chooseTarget(
  //               "弃置一名角色区域内的一张牌",
  //               (card, player, target) => {
  //                 return target.countDiscardableCards(player, "hej")
  //               },
  //               true,
  //             )
  //             .set("ai", (target) => {
  //               const player = get.player()
  //               let att = get.attitude(player, target)
  //               if (att < 0) {
  //                 att = -Math.sqrt(-att)
  //               } else {
  //                 att = Math.sqrt(att)
  //               }
  //               return att * lib.card.guohe.ai.result.target(player, target)
  //             })
  //             .forResult()
  //         }
  //         break

  //       case "red": {
  //         const next = player.chooseTarget("令一名角色摸一张牌")
  //         if (player.storage.xianfu2?.length) {
  //           next.set(
  //             "prompt2",
  //             `（若目标为${get.translation(player.storage.xianfu2)}则改为摸两张牌）`,
  //           )
  //         }
  //         next.set("ai", (target) => {
  //           const player = get.player()
  //           let att =
  //             get.attitude(player, target) /
  //             Math.sqrt(1 + target.countCards("h"))
  //           if (target.hasSkillTag("nogain")) {
  //             att /= 10
  //           }
  //           if (player.storage.xianfu2?.includes(target)) {
  //             return att * 2
  //           }
  //           return att
  //         })
  //         result2 = await next.forResult()
  //         break
  //       }

  //       default:
  //         break
  //     }
  //     if (result2?.bool && result2?.targets?.length) {
  //       const target = result2.targets[0]
  //       player.line(target, "green")
  //       if (color === "black") {
  //         if (target.countDiscardableCards(player, "hej")) {
  //           await player.discardPlayerCard(target, "hej", true)
  //         }
  //       } else {
  //         if (player.storage.xianfu2?.includes(target)) {
  //           target.storage.xianfu_mark ??= []
  //           target.storage.xianfu_mark.add(player)
  //           target.storage.xianfu_mark.sortBySeat()
  //           target.markSkill("xianfu_mark")
  //           await target.draw(2)
  //         } else {
  //           await target.draw()
  //         }
  //       }
  //     }
  //   },
  //   ai: {
  //     maixie: true,
  //     maixie_hp: true,
  //     effect: {
  //       target(card, player, target) {
  //         if (get.tag(card, "damage")) {
  //           if (player.hasSkillTag("jueqing", false, target)) {
  //             return [1, -2]
  //           }
  //           if (!target.hasFriend()) {
  //             return
  //           }
  //           if (target.hp >= 4) {
  //             return [1, get.tag(card, "damage") * 1.5]
  //           }
  //           if (target.hp === 3) {
  //             return [1, get.tag(card, "damage") * 1]
  //           }
  //           if (target.hp === 2) {
  //             return [1, get.tag(card, "damage") * 0.5]
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // 界张春华
  // 翦灭
  jianmie: {
    audio: 2,
    enable: "phaseUse",
    filterTarget: lib.filter.notMe,
    usable: 1,
    async content(event, trigger, player) {
      const target = event.target,
        targets = [player, target]
      const map = await game
        .chooseAnyOL(targets, get.info(event.name).chooseControl, [targets])
        .forResult()
      const getColor = (result) => {
          return result.control === "none2" ? "none" : result.control
        },
        cards_player = player.getDiscardableCards(
          player,
          "h",
          (card) => get.color(card) === getColor(map.get(player)),
        ),
        cards_target = target.getDiscardableCards(
          target,
          "h",
          (card) => get.color(card) === getColor(map.get(target)),
        )
      if (cards_player.length && cards_target.length) {
        await game
          .loseAsync({
            lose_list: [
              [player, cards_player],
              [target, cards_target],
            ],
          })
          .setContent("discardMultiple")
      } else if (cards_player.length) {
        await player.discard(cards_player)
      } else if (cards_target.length) {
        await target.discard(cards_target)
      }
      if (cards_player.length !== cards_target.length) {
        const user = cards_player.length > cards_target.length ? player : target
        const aim = user === player ? target : player
        const juedou = new lib.element.VCard({ name: "juedou", isCard: true })
        if (user.canUse(juedou, aim, false)) {
          await user.useCard(juedou, aim, false)
        }
      }
    },
    ai: {
      order: 1,
      result: {
        player(player, target) {
          const num =
            (player.hasSkill("shangshi")
              ? Math.max(0, player.getDamagedHp() - player.countCards("h") / 2)
              : 0) -
            player.countDiscardableCards(player, "h") / 2
          return (
            get.effect(player, { name: "juedou" }, target, player) +
            get.effect(player, { name: "draw" }, player, player) * num
          )
        },
        target(player, target) {
          return (
            get.effect(target, { name: "juedou" }, player, target) -
            (get.effect(target, { name: "draw" }, target, target) *
              target.countDiscardableCards(target, "h")) /
              2
          )
        },
      },
    },
    chooseControl(player, targets, eventId) {
      const colors = ["red", "black"]
      if (
        player
          .getDiscardableCards(player, "h")
          .some((card) => get.color(card) === "none")
      ) {
        colors.push("none2")
      }
      const str = get.translation(
        targets[0] === player ? targets[1] : targets[0],
      )
      return player
        .chooseControl(colors)
        .set("prompt", "翦灭：请选择一个颜色")
        .set(
          "prompt2",
          "弃置选择颜色的手牌，然后若你/" +
            str +
            "弃置的牌更多，则你/" +
            str +
            "视为对" +
            str +
            "/你使用【决斗】",
        )
        .set("ai", () => {
          const player = get.event().player
          const controls = get.event().controls.slice()
          return controls.sort((a, b) => {
            return (
              player
                .getDiscardableCards(player, "h")
                .filter((card) => {
                  return get.color(card) === (a === "none2" ? "none" : a)
                })
                .reduce((sum, card) => sum + get.value(card, player), 0) -
              player
                .getDiscardableCards(player, "h")
                .filter((card) => {
                  return get.color(card) === (b === "none2" ? "none" : b)
                })
                .reduce((sum, card) => sum + get.value(card, player), 0)
            )
          })[0]
        })
        .set("id", eventId)
        .set("_global_waiting", true)
    },
  },
  // 王元姬
  // 谦冲
  // qianchong: {
  //   audio: 1,
  //   init(player, skill) {
  //     const es = player.getCards("e")
  //     if (es.length) {
  //       if (es.every((card) => get.color(card) === "red")) {
  //         player.addAdditionalSkill(skill, "mingzhe")
  //       } else if (es.every((card) => get.color(card) === "black")) {
  //         player.addAdditionalSkill(skill, "jx_weimu")
  //       } else {
  //         player.removeAdditionalSkill(skill)
  //       }
  //     } else {
  //       player.removeAdditionalSkill(skill)
  //     }
  //   },
  //   onremove(player, skill) {
  //     player.removeAdditionalSkill(skill)
  //   },
  //   trigger: { player: "phaseUseBegin" },
  //   filter(event, player) {
  //     if (
  //       ["basic", "trick", "equip"].every((type) =>
  //         player.getStorage("qianchong_effect").includes(type),
  //       )
  //     ) {
  //       return false
  //     }
  //     const es = player.getCards("e")
  //     if (!es.length) {
  //       return true
  //     }
  //     const col = get.color(es[0])
  //     for (let i = 0; i < es.length; i++) {
  //       if (get.color(es[i]) !== col) {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   locked: true,
  //   async cost(event, trigger, player) {
  //     const list = ["basic", "trick", "equip", "cancel2"]
  //     list.removeArray(player.getStorage("qianchong_effect"))
  //     const result = await player
  //       .chooseControl(list)
  //       .set("ai", () => {
  //         const player = get.player()
  //         const choices = get.event().controls.slice().remove("cancel2")
  //         return choices.includes("basic")
  //           ? "basic"
  //           : choices.includes("trick")
  //             ? "trick"
  //             : choices.randomGet()
  //       })
  //       .set("prompt", get.prompt(event.skill))
  //       .set(
  //         "prompt2",
  //         "你可以选择一种类别的牌，然后你本回合内使用该类别的牌时没有次数和距离限制。",
  //       )
  //       .forResult()
  //     event.result = {
  //       bool: result?.control !== "cancel2",
  //       cost_data: result?.control,
  //     }
  //   },
  //   async content(event, trigger, player) {
  //     const { cost_data: type } = event
  //     player.addTempSkill(`${event.name}_effect`)
  //     player.markAuto(`${event.name}_effect`, [type])
  //     const str = `${get.translation(type)}牌`
  //     game.log(player, "声明了", `#y${str}`)
  //     player.popup(str, "thunder")
  //   },
  //   derivation: ["jx_weimu", "mingzhe"],
  //   group: "qianchong_change",
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       onremove: true,
  //       intro: { content: "本回合内使用$牌没有次数和距离限制" },
  //       mod: {
  //         cardUsable(card, player) {
  //           const type = get.type2(card)
  //           if (player.getStorage("qianchong_effect").includes(type)) {
  //             return Infinity
  //           }
  //         },
  //         targetInRange(card, player) {
  //           const type = get.type2(card)
  //           if (player.getStorage("qianchong_effect").includes(type)) {
  //             return true
  //           }
  //         },
  //       },
  //     },
  //     change: {
  //       trigger: {
  //         player: "loseAfter",
  //         global: [
  //           "equipAfter",
  //           "addJudgeAfter",
  //           "gainAfter",
  //           "loseAsyncAfter",
  //           "addToExpansionAfter",
  //         ],
  //       },
  //       filter(event, player) {
  //         if (event.name === "equip" && event.player === player) {
  //           return true
  //         }
  //         return event.getl?.(player)?.es?.length
  //       },
  //       forced: true,
  //       popup: false,
  //       async content(event, trigger, player) {
  //         const skill = "qianchong"
  //         get.info(skill).init(player, skill)
  //       },
  //     },
  //   },
  // },
  // mingzhe: {
  //   audio: 2,
  //   audioname: ["wangyuanji"],
  //   trigger: {
  //     player: "loseAfter",
  //     global: [
  //       "equipAfter",
  //       "addJudgeAfter",
  //       "gainAfter",
  //       "loseAsyncAfter",
  //       "addToExpansionAfter",
  //     ],
  //   },
  //   forced: true,
  //   filter(event, player) {
  //     if (player.isPhaseUsing()) {
  //       return false
  //     }
  //     var evt = event.getl(player)
  //     for (var i of evt.cards2) {
  //       if (get.color(i, player) === "red") {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   content() {
  //     if (!trigger.visible) {
  //       var cards = trigger
  //         .getl(player)
  //         .hs.filter((i) => get.color(i, player) === "red")
  //       if (cards.length > 0) {
  //         player.showCards(cards, `${get.translation(player)}发动了【明哲】`)
  //       }
  //     }
  //     player.draw()
  //   },
  // },
  // // 尚俭
  // shangjian: {
  //   audio: 2,
  //   getNum(player) {
  //     let num = 0
  //     player.getHistory("lose", (evt) => {
  //       const evt2 = evt.relatedEvent || evt.getParent()
  //       if (
  //         evt2.name === "useCard" &&
  //         evt2.player === player &&
  //         get.type(evt2.card, null, false) === "equip"
  //       ) {
  //         return
  //       }
  //       if (evt.cards2?.length) {
  //         num += evt.cards2.length
  //       }
  //     })
  //     return num
  //   },
  //   trigger: { global: "phaseJieshuBegin" },
  //   filter(event, player) {
  //     const num = get.info("shangjian").getNum(player)
  //     return num > 0 && num <= player.hp
  //   },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     const num = get.info(event.name).getNum(player)
  //     if (num > 0) {
  //       await player.draw(num)
  //     }
  //   },
  // },
  // // 曹婴
  // // 凌人
  // lingren: {
  //   audio: 2,
  //   trigger: { player: "useCardToPlayered" },
  //   filter(event, player) {
  //     if (event.getParent().triggeredTargets3.length > 1) {
  //       return false
  //     }
  //     if (!["basic", "trick"].includes(get.type(event.card))) {
  //       return false
  //     }
  //     return get.tag(event.card, "damage")
  //   },
  //   usable: 1,
  //   derivation: ["jx_jianxiong", "jx_xingshang"],
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt(event.name.slice(0, -5)),
  //         "选择一名目标角色并猜测其手牌构成",
  //         (card, player, target) => {
  //           return _status.event.targets.includes(target)
  //         },
  //       )
  //       .set("ai", (target) => {
  //         return 2 - get.attitude(get.player(), target)
  //       })
  //       .set("targets", trigger.targets)
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const {
  //       targets: [target],
  //     } = event
  //     const list = ["basic", "trick", "equip"].map((type) => [
  //       "",
  //       "",
  //       `caoying_${type}`,
  //     ])
  //     const result = await player
  //       .chooseButton(
  //         ["凌人：猜测其有哪些类别的手牌", [list, "vcard"]],
  //         [0, 3],
  //         true,
  //       )
  //       .set("ai", (button) => {
  //         return get.event().choice.includes(button.link[2].slice(8))
  //       })
  //       .set(
  //         "choice",
  //         (() => {
  //           if (!target.countCards("h")) {
  //             return []
  //           }
  //           const choice = [],
  //             known = target.getKnownCards(player),
  //             unknown = target.getCards("h", (i) => !known.includes(i))
  //           for (const i of known) {
  //             choice.add(get.type2(i, target))
  //           }
  //           if (!unknown.length || choice.length > 2) {
  //             return choice
  //           }
  //           let rand = 0.05
  //           if (!choice.includes("basic")) {
  //             if (unknown.some((i) => get.type(i, null, target) === "basic")) {
  //               rand = 0.95
  //             }
  //             if (Math.random() < rand) {
  //               choice.push("basic")
  //             }
  //           }
  //           if (!choice.includes("trick")) {
  //             if (
  //               unknown.some((i) => get.type(i, "trick", target) === "trick")
  //             ) {
  //               rand = 0.9
  //             } else {
  //               rand = 0.1
  //             }
  //             if (Math.random() < rand) {
  //               choice.push("trick")
  //             }
  //           }
  //           if (!choice.includes("equip")) {
  //             if (unknown.some((i) => get.type(i, null, target) === "equip")) {
  //               rand = 0.75
  //             } else {
  //               rand = 0.25
  //             }
  //             if (Math.random() < rand) {
  //               choice.push("equip")
  //             }
  //           }
  //           return choice
  //         })(),
  //       )
  //       .forResult()
  //     if (!result?.bool) {
  //       return
  //     }
  //     const choices = result.links.map((i) => i[2].slice(8))
  //     if (!event.isMine() && !event.isOnline()) {
  //       await game.delayx()
  //     }
  //     let num = 0
  //     ;["basic", "trick", "equip"].forEach((type) => {
  //       if (
  //         choices.includes(type) ===
  //         target.hasCard((card) => get.type2(card, target) === type, "h")
  //       ) {
  //         num++
  //       }
  //     })
  //     player.popup(`猜对${get.cnNumber(num)}项`)
  //     game.log(player, `猜对了${get.cnNumber(num)}项`)
  //     if (num > 0) {
  //       const map = trigger.customArgs
  //       const id = target.playerid
  //       map[id] ??= {}
  //       if (typeof map[id].extraDamage !== "number") {
  //         map[id].extraDamage = 0
  //       }
  //       map[id].extraDamage++
  //     }
  //     if (num > 1) {
  //       await player.draw(2)
  //     }
  //     if (num > 2) {
  //       await player.addTempSkills(get.info(event.name).derivation, {
  //         player: "phaseBegin",
  //       })
  //     }
  //   },
  //   ai: { threaten: 2.4 },
  // },
  // // 伏间
  // fujian: {
  //   audio: 2,
  //   trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
  //   filter(event, player) {
  //     return !game.hasPlayer(
  //       (target) => target !== player && target.countCards("h") === 0,
  //     )
  //   },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     const result = await player
  //       .chooseTarget(
  //         "伏间：请选择一名手牌数最少的其他角色",
  //         (card, player, target) => {
  //           return (
  //             target !== player &&
  //             target.isMinHandcard(null, (current) => current !== player)
  //           )
  //         },
  //         true,
  //       )
  //       .set("ai", (target) => {
  //         return -get.attitude(player, target)
  //       })
  //       .forResult()
  //     if (result.bool) {
  //       const target = result.targets[0]
  //       player.line(target)
  //       game.log(player, "观看了", target, "的手牌")
  //       await player.viewHandcards(target)
  //     }
  //   },
  // },
  // // 赵昂
  // // 忠节
  // zhongjie: {
  //   audio: 2,
  //   round: 1,
  //   trigger: { global: "dying" },
  //   logTarget: "player",
  //   filter(event, player) {
  //     return (
  //       event.player.hp < 1 && event.reason && event.reason.name === "loseHp"
  //     )
  //   },
  //   check(event, player) {
  //     return get.attitude(player, event.player) > 2
  //   },
  //   content() {
  //     trigger.player.recover()
  //     trigger.player.draw()
  //   },
  //   ai: {
  //     combo: "sushou",
  //   },
  // },
  // // 夙守
  // sushou: {
  //   audio: 2,
  //   trigger: { global: "phaseUseBegin" },
  //   filter(event, player) {
  //     return player.hp > 0 && event.player.isMaxHandcard(true)
  //   },
  //   logTarget: "player",
  //   check(event, player) {
  //     var num = player.hp
  //     if (
  //       player.hasSkill("zhongjie") &&
  //       (player.storage.zhongjie_roundcount || 0) < game.roundNumber
  //     ) {
  //       num++
  //     }
  //     return num > 1
  //   },
  //   content() {
  //     "step 0"
  //     player.loseHp()
  //     event.target = trigger.player
  //     ;("step 1")
  //     var num = player.getDamagedHp()
  //     if (num > 0) {
  //       player.draw(num)
  //     }
  //     if (player === target) {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     var ts = target.getCards("h")
  //     if (ts.length < 2) {
  //       event.finish()
  //     } else {
  //       var hs = player.getCards("h")
  //       ts = ts.randomGets(Math.floor(ts.length / 2))
  //       if (!hs.length) {
  //         player.viewCards(`${get.translation(target)}的部分手牌`, ts)
  //         event.finish()
  //         return
  //       }
  //       var next = player.chooseToMove(
  //         "夙守：交换至多" +
  //           get.cnNumber(
  //             Math.min(hs.length, ts.length, player.getDamagedHp()),
  //           ) +
  //           "张牌",
  //       )
  //       next.set("list", [
  //         [`${get.translation(target)}的部分手牌`, ts, "sushou_tag"],
  //         ["你的手牌", hs],
  //       ])
  //       next.set("filterMove", (from, to, moved) => {
  //         if (typeof to === "number") {
  //           return false
  //         }
  //         var player = _status.event.player
  //         var hs = player.getCards("h")
  //         var changed = hs.filter((card) => !moved[1].includes(card))
  //         var changed2 = moved[1].filter((card) => !hs.includes(card))
  //         if (changed.length < player.getDamagedHp()) {
  //           return true
  //         }
  //         var pos1 = moved[0].includes(from.link) ? 0 : 1,
  //           pos2 = moved[0].includes(to.link) ? 0 : 1
  //         if (pos1 === pos2) {
  //           return true
  //         }
  //         if (pos1 === 0) {
  //           if (changed.includes(from.link)) {
  //             return true
  //           }
  //           return changed2.includes(to.link)
  //         }
  //         if (changed2.includes(from.link)) {
  //           return true
  //         }
  //         return changed.includes(to.link)
  //       })
  //       next.set("max", Math.min(hs.length, ts.length, player.getDamagedHp()))
  //       next.set("processAI", (list) => {
  //         if (_status.event.max) {
  //           const gain = list[0][1]
  //               .sort((a, b) => {
  //                 return (
  //                   player.getUseValue(b, null, true) -
  //                   player.getUseValue(a, null, true)
  //                 )
  //               })
  //               .slice(0, _status.event.max),
  //             give = list[1][1]
  //               .sort((a, b) => {
  //                 return get.value(a, player) - get.value(b, player)
  //               })
  //               .slice(0, _status.event.max)
  //           for (const i of gain) {
  //             if (get.value(i, player) < get.value(give[0], player)) {
  //               continue
  //             }
  //             const j = give.shift()
  //             list[0][1].remove(i)
  //             list[0][1].push(j)
  //             list[1][1].remove(j)
  //             list[1][1].push(i)
  //             if (!give.length) {
  //               break
  //             }
  //           }
  //         }
  //         return [list[0][1], list[1][1]]
  //       })
  //     }
  //     ;("step 3")
  //     var moved = result.moved
  //     var hs = player.getCards("h"),
  //       ts = target.getCards("h")
  //     var cards1 = [],
  //       cards2 = []
  //     for (var i of result.moved[0]) {
  //       if (!ts.includes(i)) {
  //         cards1.push(i)
  //       }
  //     }
  //     for (var i of result.moved[1]) {
  //       if (!hs.includes(i)) {
  //         cards2.push(i)
  //       }
  //     }
  //     if (cards1.length) {
  //       player.swapHandcards(target, cards1, cards2)
  //     }
  //   },
  // },
  // // 界满宠
  // // 峻刑
  // jx_junxing: {
  //   enable: "phaseUse",
  //   audio: 2,
  //   usable: 1,
  //   filterCard: lib.filter.cardDiscardable,
  //   selectCard: [1, Infinity],
  //   filter(event, player) {
  //     return player.countCards("h") > 0
  //   },
  //   check(card) {
  //     if (ui.selected.cards.length) {
  //       return -1
  //     }
  //     return 6 - get.value(card)
  //   },
  //   filterTarget(card, player, target) {
  //     return player !== target
  //   },
  //   allowChooseAll: true,
  //   async content(event, trigger, player) {
  //     const { target, cards } = event
  //     // step 0
  //     const result = await target
  //       .chooseToDiscard(
  //         cards.length,
  //         "弃置" +
  //           get.cnNumber(cards.length) +
  //           "张牌并失去1点体力，或点取消将武将牌翻面并摸" +
  //           get.cnNumber(cards.length) +
  //           "张牌",
  //         "he",
  //       )
  //       .set("ai", (card) => {
  //         const player = get.event().player
  //         if (
  //           get.event().cardsx?.length > 3 ||
  //           player.hasSkillTag("noturn") ||
  //           player.isTurnedOver() ||
  //           ((get.name(card) === "tao" || get.name(card) === "jiu") &&
  //             lib.filter.cardSavable(card, player, player))
  //         ) {
  //           return -1
  //         }
  //         if (player.hp <= 1) {
  //           if (
  //             cards.length < player.getEnemies().length &&
  //             player.hasCard((cardx) => {
  //               return (
  //                 (get.name(cardx) === "tao" || get.name(cardx) === "jiu") &&
  //                 lib.filter.cardSavable(cardx, player, player)
  //               )
  //             }, "hs")
  //           ) {
  //             return 7 - get.value(card)
  //           }
  //           return -1
  //         }
  //         return (
  //           24 - 5 * cards.length - 2 * Math.min(4, player.hp) - get.value(card)
  //         )
  //       })
  //       .set("cardsx", cards)
  //       .forResult()
  //     // step 1
  //     if (!result.bool) {
  //       await target.turnOver()
  //       await target.draw(cards.length)
  //     } else {
  //       await target.loseHp()
  //     }
  //   },
  //   ai: {
  //     order: 2,
  //     threaten: 1.8,
  //     result: {
  //       target(player, target) {
  //         if (target.hasSkillTag("noturn")) {
  //           return 0
  //         }
  //         if (target.isTurnedOver()) {
  //           return 2
  //         }
  //         return -1 / (target.countCards("h") + 1)
  //       },
  //     },
  //   },
  // },
  // // 御策
  // yuce: {
  //   audio: 2,
  //   audioname: ["jx_manchong"],
  //   trigger: { player: "damageEnd" },
  //   filter(event, player) {
  //     return player.countCards("h") > 0
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseCard({
  //         prompt: get.prompt2(event.skill),
  //         ai(card) {
  //           if (get.type(card) === "basic") {
  //             return 1
  //           }
  //           return Math.abs(get.value(card)) + 1
  //         },
  //       })
  //       .forResult()
  //   },
  //   logTarget: "source",
  //   async content(event, trigger, player) {
  //     const {
  //       cards: [card],
  //       targets,
  //     } = event
  //     await player.showCards(card, `${get.translation(player)}发动了【御策】`)
  //     const type = get.type2(card)
  //     let result
  //     if (targets?.length && targets[0]?.isIn()) {
  //       result = await targets[0]
  //         .chooseToDiscard({
  //           prompt:
  //             "弃置一张不为" +
  //             get.translation(type) +
  //             "牌的牌或令" +
  //             get.translation(player) +
  //             "回复1点体力",
  //           filterCard(card) {
  //             return get.type(card, "trick") !== _status.event.type
  //           },
  //           ai(card) {
  //             if (
  //               get.recoverEffect(
  //                 _status.event.getParent().player,
  //                 _status.event.player,
  //                 _status.event.player,
  //               ) < 0
  //             ) {
  //               return 7 - get.value(card)
  //             }
  //             return 0
  //           },
  //         })
  //         .set("type", type)
  //         .forResult()
  //     } else {
  //       result = { bool: false }
  //     }
  //     if (!result.bool) {
  //       await player.recover({ source: targets?.[0] })
  //     }
  //   },
  //   ai: {
  //     effect: {
  //       target(card, player, target) {
  //         if (get.tag(card, "damage") && target.countCards("h")) {
  //           return 0.8
  //         }
  //       },
  //     },
  //   },
  // },
  // // 卞玥
  // // 庇族
  // bizu: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filterTarget(card, player, target) {
  //     return target.countCards("h") === player.countCards("h")
  //   },
  //   filterCard: () => false,
  //   selectCard: [-1, -2],
  //   prompt: () => {
  //     const player = get.player()
  //     const targets = game.filterPlayer(
  //       (current) => current.countCards("h") === player.countCards("h"),
  //     )
  //     return `令${get.translation(targets)}${targets.length > 1 ? "各" : ""}摸一张牌`
  //   },
  //   selectTarget: -1,
  //   multitarget: true,
  //   multiline: true,
  //   async content(event, trigger, player) {
  //     await game.asyncDraw(event.targets.sortBySeat())
  //     if (
  //       game
  //         .getGlobalHistory(
  //           "everything",
  //           (evt) =>
  //             evt.name === "bizu" && evt.player === player && evt !== event,
  //         )
  //         .some(
  //           (evtx) =>
  //             evtx.targets.length === event.targets.length &&
  //             evtx.targets.every((i) => event.targets.includes(i)),
  //         )
  //     ) {
  //       player.tempBanSkill("bizu")
  //       await player.recover()
  //     }
  //   },
  //   ai: {
  //     order: 4,
  //     result: {
  //       player(player, target) {
  //         return game
  //           .filterPlayer(
  //             (current) => current.countCards("h") === player.countCards("h"),
  //           )
  //           .reduce(
  //             (e, p) => e + get.effect(p, { name: "draw" }, player, player),
  //             0,
  //           )
  //       },
  //     },
  //   },
  // },
  // // 无胁
  // jwuxie: {
  //   audio: 2,
  //   trigger: { player: "phaseUseEnd" },
  //   filter(event, player) {
  //     return game.hasPlayer(
  //       (current) => current !== player && current.countCards("h"),
  //     )
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt2(event.skill),
  //         (card, player, target) => target !== player && target.countCards("h"),
  //       )
  //       .set("ai", (target) => {
  //         const player = get.player()
  //         return (
  //           -get.attitude(player, target) *
  //           (target.countCards("h") - player.countCards("h"))
  //         )
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const target = event.targets[0]
  //     await player.swapHandcards(target)
  //     const cards1 = player.getCards("h", (card) => get.is.damageCard(card))
  //     if (cards1.length) {
  //       player.$throw(cards1.length, 1000)
  //       await player.lose(cards1, ui.cardPile)
  //     }
  //   },
  // },
  // // 成济成倅
  // // 透髓
  // tousui: {
  //   audio: 2,
  //   enable: "chooseToUse",
  //   viewAsFilter(player) {
  //     return player.countCards("he") > 0
  //   },
  //   viewAs: {
  //     name: "sha",
  //     /*suit: "none",
  // 		number: null,*/
  //     cards: [],
  //     isCard: true,
  //   },
  //   filterCard: true,
  //   selectCard: [1, Infinity],
  //   position: "he",
  //   check(card) {
  //     const player = get.player()
  //     return (
  //       4.5 +
  //       (player.hasSkill("chuming") ? 1 : 0) -
  //       1.5 * ui.selected.cards.length -
  //       get.value(card)
  //     )
  //   },
  //   popname: true,
  //   ignoreMod: true,
  //   log: false,
  //   allowChooseAll: true,
  //   async precontent(event, trigger, player) {
  //     var evt = event.getParent()
  //     if (evt.dialog && typeof evt.dialog === "object") {
  //       evt.dialog.close()
  //     }
  //     player.logSkill("tousui")
  //     var cards = event.result.cards
  //     await player
  //       .loseToDiscardpile(cards, ui.cardPile, false, "blank")
  //       .set("log", false)
  //     var shownCards = cards.filter((i) => get.position(i) === "e"),
  //       handcardsLength = cards.length - shownCards.length
  //     if (shownCards.length) {
  //       player.$throw(shownCards, null)
  //       game.log(player, "将", shownCards, "置于了牌堆底")
  //     }
  //     if (handcardsLength > 0) {
  //       player.$throw(handcardsLength, null)
  //       game.log(
  //         player,
  //         "将",
  //         get.cnNumber(handcardsLength),
  //         "张牌置于了牌堆底",
  //       )
  //     }
  //     await game.delayex()
  //     var viewAs = new lib.element.VCard({
  //       name: event.result.card.name,
  //       isCard: true,
  //     })
  //     event.result.card = viewAs
  //     event.result.cards = []
  //     event.result._apply_args = {
  //       shanReq: cards.length,
  //       oncard: () => {
  //         var evt = get.event()
  //         for (var target of game.filterPlayer(null, null, true)) {
  //           var id = target.playerid
  //           var map = evt.customArgs
  //           if (!map[id]) {
  //             map[id] = {}
  //           }
  //           map[id].shanRequired = evt.shanReq
  //         }
  //       },
  //     }
  //   },
  //   ai: {
  //     order(item, player) {
  //       return get.order({ name: "sha" }) + 0.1
  //     },
  //     result: { player: 1 },
  //     keepdu: true,
  //     respondSha: true,
  //     skillTagFilter: (player, tag, arg) => {
  //       if (tag === "respondSha" && arg === "respond") {
  //         return false
  //       }
  //     },
  //   },
  // },
  // // 畜鸣
  // chuming: {
  //   audio: 2,
  //   trigger: {
  //     source: "damageBegin1",
  //     player: "damageBegin3",
  //   },
  //   filter(event, player) {
  //     if (event.source === event.player) {
  //       return false
  //     }
  //     if (!event.card || !event.cards?.length) {
  //       return true
  //     }
  //     const target = event[player === event.source ? "player" : "source"]
  //     return target?.isIn()
  //   },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     if (!trigger.card || !trigger.cards?.length) {
  //       trigger.num++
  //       event.finish()
  //       return
  //     }
  //     var target = trigger[trigger.source === player ? "player" : "source"]
  //     trigger._chuming = true
  //     target.addTempSkill("chuming_effect")
  //   },
  //   ai: {
  //     effect: {
  //       player(card, player, target) {
  //         if (!get.tag(card, "damage")) {
  //           return
  //         }
  //         if (!lib.card[card.name] || !card.cards?.length) {
  //           return [1, 0, 2, 0]
  //         }
  //         return [1, -1]
  //       },
  //       target(card, player, target) {
  //         if (!get.tag(card, "damage")) {
  //           return
  //         }
  //         if (!lib.card[card.name] || !card.cards?.length) {
  //           return 2
  //         }
  //         return [1, -1]
  //       },
  //     },
  //     combo: "tousui",
  //     halfneg: true,
  //   },
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       trigger: { global: "phaseEnd" },
  //       forced: true,
  //       popup: false,
  //       async content(event, trigger, player) {
  //         var mapx = {}
  //         var history = player
  //           .getHistory("damage")
  //           .concat(player.getHistory("sourceDamage"))
  //         history.forEach((evt) => {
  //           if (!evt._chuming) {
  //             return
  //           }
  //           var target = evt[evt.source === player ? "player" : "source"]
  //           if (!target.isIn()) {
  //             return
  //           }
  //           var cards = evt.cards.filterInD("d")
  //           if (!cards.length) {
  //             return
  //           }
  //           if (!mapx[target.playerid]) {
  //             mapx[target.playerid] = []
  //           }
  //           mapx[target.playerid].addArray(cards)
  //         })
  //         var entries = Object.entries(mapx).map((entry) => {
  //           return [
  //             (_status.connectMode ? lib.playerOL : game.playerMap)[entry[0]],
  //             entry[1],
  //           ]
  //         })
  //         if (!entries.length) {
  //           event.finish()
  //           return
  //         }
  //         player.logSkill(
  //           "chuming_effect",
  //           entries.map((i) => i[0]),
  //         )
  //         entries.sort((a, b) => lib.sort.seat(a[0], b[0]))
  //         for (var entry of entries) {
  //           var current = entry[0],
  //             cards = entry[1]
  //           var list = ["jiedao", "guohe"].filter((i) =>
  //             player.canUse(
  //               new lib.element.VCard({ name: i, cards: cards }),
  //               current,
  //               false,
  //             ),
  //           )
  //           if (!list.length) {
  //             return
  //           }
  //           var result = {}
  //           if (list.length === 1) {
  //             result = { bool: true, links: [["", "", list[0]]] }
  //           } else {
  //             result = await player
  //               .chooseButton(
  //                 [
  //                   `畜鸣：请选择要对${get.translation(current)}使用的牌`,
  //                   [list, "vcard"],
  //                 ],
  //                 true,
  //               )
  //               .set("ai", (button) => {
  //                 var player = get.player()
  //                 return get.effect(
  //                   get.event().currentTarget,
  //                   { name: button.link[2] },
  //                   player,
  //                   player,
  //                 )
  //               })
  //               .set("currentTarget", current)
  //               .forResult()
  //           }
  //           if (result.bool) {
  //             var card = get.autoViewAs({ name: result.links[0][2] }, cards)
  //             if (player.canUse(card, current, false)) {
  //               player.useCard(card, cards, current, false)
  //             }
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // // 牵招
  // // 威抚
  // weifu: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filterCard: lib.filter.cardDiscardable,
  //   position: "he",
  //   filter(event, player) {
  //     return player.hasCard(
  //       (card) => lib.filter.cardDiscardable(card, player),
  //       "he",
  //     )
  //   },
  //   check(card) {
  //     var player = get.player()
  //     return (
  //       (5 - get.value(card)) / Math.max(0.1, player.getUseValue(card)) ** 0.33
  //     )
  //   },
  //   content() {
  //     "step 0"
  //     player
  //       .judge((card) => {
  //         var evt = get.event().getParent("weifu")
  //         if (evt.name !== "weifu") {
  //           return 0
  //         }
  //         var cardx = evt.cards[0]
  //         if (get.type2(card) === get.type2(cardx)) {
  //           return 0.5
  //         }
  //         return 0.1
  //       })
  //       .set("callback", () => {
  //         var card = event.judgeResult.card
  //         player.addTempSkill("weifu_clear")
  //         player.addTempSkill("weifu_add")
  //         if (!get.is.object(player.storage.weifu_add)) {
  //           player.storage.weifu_add = {}
  //         }
  //         var type = get.type2(card, player)
  //         if (typeof player.storage.weifu_add[type] !== "number") {
  //           player.storage.weifu_add[type] = 0
  //         }
  //         player.storage.weifu_add[type]++
  //         player.markSkill("weifu_add")
  //         if (type === get.type2(event.getParent(2).cards[0], player)) {
  //           player.draw()
  //         }
  //       })
  //       .set("judge2", (result) => result.bool)
  //   },
  //   ai: {
  //     order: 7,
  //     result: {
  //       player(player) {
  //         return player.hasCard((card) => {
  //           var type = get.type2(card)
  //           if (type === "equip") {
  //             return false
  //           }
  //           return (
  //             player.hasUseTarget(card) &&
  //             player.getUseValue(card) > 5 &&
  //             game.countPlayer((current) => {
  //               return (
  //                 lib.filter.targetEnabled2(card, player, current) &&
  //                 get.effect(current, card, player, player) > 0
  //               )
  //             }) +
  //               1 >
  //               (get.is.object(player.storage.weifu_add)
  //                 ? player.storage.weifu_add[type] || 0
  //                 : 0)
  //           )
  //         }, "hs")
  //           ? 1
  //           : 0
  //       },
  //     },
  //   },
  //   subSkill: {
  //     clear: {
  //       trigger: { player: "useCard1" },
  //       filter(event, player) {
  //         var type = get.type2(event.card)
  //         if (
  //           get.is.object(player.storage.weifu_add) &&
  //           typeof player.storage.weifu_add[type] === "number"
  //         ) {
  //           return true
  //         }
  //         return false
  //       },
  //       silent: true,
  //       firstDo: true,
  //       charlotte: true,
  //       content() {
  //         var type = get.type2(trigger.card)
  //         var num = player.storage.weifu_add[type]
  //         delete player.storage.weifu_add[type]
  //         if (get.is.empty(player.storage.weifu_add)) {
  //           delete player.storage.weifu_add
  //           player.unmarkSkill("weifu_add")
  //         }
  //         trigger._weifu_clear = num
  //       },
  //     },
  //     add: {
  //       trigger: { player: "useCard2" },
  //       filter(event, player) {
  //         if (!event._weifu_clear) {
  //           return false
  //         }
  //         var info = get.info(event.card)
  //         if (info.allowMultiple === false) {
  //           return false
  //         }
  //         if (event.targets && !info.multitarget) {
  //           if (
  //             game.hasPlayer((current) => {
  //               return (
  //                 !event.targets.includes(current) &&
  //                 lib.filter.targetEnabled2(event.card, player, current)
  //               )
  //             })
  //           ) {
  //             return true
  //           }
  //         }
  //         return false
  //       },
  //       onremove: true,
  //       charlotte: true,
  //       direct: true,
  //       content() {
  //         "step 0"
  //         var num = trigger._weifu_clear
  //         player
  //           .chooseTarget(
  //             get.prompt("weifu"),
  //             `为${get.translation(trigger.card)}额外指定${get.cnNumber(num)}个目标。`,
  //             [1, num],
  //             (card, player, target) => {
  //               return (
  //                 !_status.event.sourcex.includes(target) &&
  //                 lib.filter.targetEnabled2(_status.event.card, player, target)
  //               )
  //             },
  //           )
  //           .set("sourcex", trigger.targets)
  //           .set("ai", (target) => {
  //             var player = _status.event.player
  //             return get.effect(target, _status.event.card, player, player)
  //           })
  //           .set("card", trigger.card)
  //         ;("step 1")
  //         if (result.bool) {
  //           var targets = result.targets
  //           player.logSkill("weifu_add", targets)
  //           trigger.targets.addArray(targets)
  //           game.log(targets, "也成为了", trigger.card, "的目标")
  //           if (!event.isMine() && !event.isOnline()) {
  //             game.delayex()
  //           }
  //         }
  //       },
  //       intro: {
  //         markcount: () => 0,
  //         content: (storage, player) => {
  //           if (!get.is.object(storage)) {
  //             return
  //           }
  //           var str =
  //             "使用下一张以下类型的牌无距离限制，且可以额外指定对应数量个目标："
  //           for (var type in storage) {
  //             str += `<li>${get.translation(type)}牌：+${storage[type]}`
  //           }
  //           return str
  //         },
  //       },
  //       mod: {
  //         targetInRange: (card, player) => {
  //           var type = get.type2(card)
  //           if (
  //             get.is.object(player.storage.weifu_add) &&
  //             typeof player.storage.weifu_add[type] === "number"
  //           ) {
  //             return true
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // // 款塞
  // kuansai: {
  //   audio: 2,
  //   trigger: { global: "useCardToPlayered" },
  //   filter(event, player) {
  //     return event.isFirstTarget && event.targets.length >= player.getHp()
  //   },
  //   usable: 1,
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt(event.name.slice(0, -5)),
  //         "令其中一个目标选择一项：1.交给你一张牌；2.令你回复1点体力。",
  //         (card, player, target) => {
  //           return _status.event.targets.includes(target)
  //         },
  //       )
  //       .set("targets", trigger.targets)
  //       .set("ai", (target) => {
  //         const player = get.player()
  //         const att = get.attitude(player, target)
  //         if (att > 0) {
  //           return 1
  //         }
  //         return (1 - att) / Math.sqrt(1 + target.countCards("he"))
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const {
  //       targets: [target],
  //     } = event
  //     let position = "e"
  //     if (player !== target) {
  //       position += "h"
  //     }
  //     const forced = player.isHealthy()
  //     const str = `请交给其一张牌${forced ? "" : "或点击“取消”令其回复1点体力"}。`
  //     const bool = !target.countCards(position)
  //       ? false
  //       : (
  //           await target
  //             .chooseToGive(
  //               player,
  //               `${get.translation(player)}对你发动了【款塞】`,
  //               str,
  //               position,
  //               forced,
  //             )
  //             .set("ai", (card) => {
  //               const { player, target, recover } = get.event()
  //               if (recover) {
  //                 return 0
  //               }
  //               if (get.attitude(player, target) > 0) {
  //                 return get.value(card, player) - get.value(card, target)
  //               }
  //               if (get.tag(card, "recover")) {
  //                 return -1
  //               }
  //               return 6.5 - get.value(card)
  //             })
  //             .set(
  //               "recover",
  //               (() => {
  //                 if (forced) {
  //                   return false
  //                 }
  //                 var recoverEff = get.recoverEffect(player, target, target)
  //                 var att = get.attitude(target, player)
  //                 if (att < 0) {
  //                   if (recoverEff >= 0) {
  //                     return true
  //                   }
  //                   if (
  //                     target.hasCard((card) => {
  //                       return (
  //                         (get.value(card) < 6.5 &&
  //                           !get.tag(card, "recover")) ||
  //                         get.value(card) <= 0.05
  //                       )
  //                     }, position)
  //                   ) {
  //                     return false
  //                   }
  //                 } else {
  //                   if (recoverEff > 0) {
  //                     return true
  //                   }
  //                   if (
  //                     target.hasCard((card) => {
  //                       return get.value(card, target) < get.value(card, player)
  //                     }, position)
  //                   ) {
  //                     return false
  //                   }
  //                 }
  //                 return true
  //               })(),
  //             )
  //             .forResult()
  //         ).bool
  //     if (!bool) {
  //       await player.recover(target)
  //     }
  //   },
  // },
  // // 胡班
  // // 晖云
  // huiyun: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   viewAs: {
  //     name: "huogong",
  //     storage: { huiyun: true },
  //   },
  //   filterCard: true,
  //   position: "hes",
  //   onuse(links, player) {
  //     player.addTempSkill("huiyun_after")
  //     player.addTempSkill("huiyun_record")
  //   },
  //   ai: {
  //     effect: {
  //       player(card, player, target) {
  //         if (
  //           get.attitude(player, target) > 0 &&
  //           card?.name === "huogong" &&
  //           card.storage?.huiyun &&
  //           player.getStorage("huiyun_used").length < 3
  //         ) {
  //           return [0, 0.5, 0, 0.5]
  //         }
  //       },
  //     },
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //     after: {
  //       audio: "huiyun",
  //       trigger: { global: "useCardAfter" },
  //       charlotte: true,
  //       locked: true,
  //       filter(event, player) {
  //         if (player.getStorage("huiyun_used").length > 2) {
  //           return false
  //         }
  //         return (
  //           event.card.name === "huogong" &&
  //           event.card.storage?.huiyun &&
  //           event.targets.some((i) => i.isIn())
  //         )
  //       },
  //       async cost(event, trigger, player) {
  //         const choices = []
  //         const choiceList = [
  //           "使用展示牌，然后重铸所有手牌",
  //           "使用一张手牌，然后重铸展示牌",
  //           "摸一张牌",
  //         ]
  //         for (let i = 1; i <= 3; i++) {
  //           if (!player.getStorage("huiyun_used").includes(i)) {
  //             choices.push(`选项${get.cnNumber(i, true)}`)
  //           } else {
  //             choiceList[i - 1] =
  //               `<span style="opacity:0.5">${choiceList[i - 1]}</span>`
  //           }
  //         }
  //         const { control } = await player
  //           .chooseControl(choices)
  //           .set("choiceList", choiceList)
  //           .set(
  //             "prompt",
  //             `晖云：选择一项，令${get.translation(trigger.targets)}可以选择执行`,
  //           )
  //           .set("ai", () => {
  //             return get.event().choice
  //           })
  //           .set(
  //             "choice",
  //             (() => {
  //               if (choices.length === 1) {
  //                 return choices[0]
  //               }
  //               const choicesx = choices.slice()
  //               if (
  //                 get.attitude(player, trigger.targets[0]) > 0 &&
  //                 choices.includes("选项三")
  //               ) {
  //                 return "选项三"
  //               }
  //               choicesx.remove("选项三")
  //               return choicesx.randomGet()
  //             })(),
  //           )
  //           .forResult()
  //         event.result = {
  //           bool: true,
  //           cost_data: control,
  //         }
  //       },
  //       async content(event, trigger, player) {
  //         const index =
  //           ["选项一", "选项二", "选项三"].indexOf(event.cost_data) + 1
  //         game.log(player, "选择了", `#y${event.cost_data}`)
  //         player.addTempSkill("huiyun_used", "roundStart")
  //         player.markAuto("huiyun_used", [index])
  //         for (const target of trigger.targets.sortBySeat()) {
  //           if (!target.isIn()) {
  //             continue
  //           }
  //           const cards = target.getCards("h", (card) =>
  //             card.hasGaintag("huiyun_tag"),
  //           )
  //           if (index === 1 && cards.length) {
  //             const result = await target
  //               .chooseToUse({
  //                 filterCard(card) {
  //                   if (
  //                     get.itemtype(card) !== "card" ||
  //                     !card.hasGaintag("huiyun_tag")
  //                   ) {
  //                     return false
  //                   }
  //                   return lib.filter.filterCard.apply(this, arguments)
  //                 },
  //                 prompt: "是否使用一张展示牌，然后重铸所有手牌？",
  //                 addCount: false,
  //               })
  //               .forResult()
  //             if (result.bool) {
  //               const hs = target.getCards("h", lib.filter.cardRecastable)
  //               if (hs.length) {
  //                 await target.recast(hs)
  //               }
  //             }
  //           } else if (index === 2) {
  //             const result = await target
  //               .chooseToUse({
  //                 filterCard(card) {
  //                   if (
  //                     get.itemtype(card) !== "card" ||
  //                     (get.position(card) !== "h" && get.position(card) !== "s")
  //                   ) {
  //                     return false
  //                   }
  //                   return lib.filter.filterCard.apply(this, arguments)
  //                 },
  //                 prompt: "是否使用一张手牌，然后重铸展示牌？",
  //                 addCount: false,
  //               })
  //               .forResult()
  //             if (result.bool) {
  //               const hs = target.getCards("h", (card) => {
  //                 if (!card.hasGaintag("huiyun_tag")) {
  //                   return false
  //                 }
  //                 return target.canRecast(card)
  //               })
  //               if (hs.length) {
  //                 await target.recast(hs)
  //               }
  //             }
  //           } else if (index === 3) {
  //             const { bool } = await target
  //               .chooseBool("是否摸一张牌？")
  //               .set("ai", () => true)
  //               .forResult()
  //             if (bool) {
  //               await target.draw()
  //             }
  //           }
  //         }
  //       },
  //     },
  //     record: {
  //       trigger: { global: "showCardsEnd" },
  //       forced: true,
  //       charlotte: true,
  //       popup: false,
  //       firstDo: true,
  //       filter(event, player) {
  //         if (event.getParent().name !== "huogong") {
  //           return false
  //         }
  //         const card = event.getParent(2).card
  //         return card?.storage?.huiyun
  //       },
  //       content() {
  //         game.broadcastAll((cards) => {
  //           cards.forEach((card) => card.addGaintag("huiyun_tag"))
  //         }, trigger.cards)
  //       },
  //     },
  //   },
  // },
  // // 卞喜
  // // 钝袭
  // dunxi: {
  //   audio: 2,
  //   trigger: { player: "useCard" },
  //   direct: true,
  //   filter(event, player) {
  //     if (!get.tag(event.card, "damage") || get.type(event.card) === "delay") {
  //       return false
  //     }
  //     return event.targets.some((target) => target.isIn())
  //   },
  //   content() {
  //     "step 0"
  //     var targets = trigger.targets.filter((current) => current.isIn())
  //     if (targets.length === 1) {
  //       event.target = targets[0]
  //       player
  //         .chooseBool(
  //           get.prompt("dunxi", event.target),
  //           `令${get.translation(event.target)}获得一枚“钝”标记`,
  //         )
  //         .set("goon", get.attitude(player, event.target) < 0)
  //         .set("ai", () => _status.event.goon)
  //     } else {
  //       player
  //         .chooseTarget(
  //           get.prompt("dunxi"),
  //           "选择一名目标角色获得一枚“钝”标记",
  //           (card, player, target) =>
  //             _status.event.getTrigger().targets.includes(target),
  //         )
  //         .set("ai", (target) => {
  //           var att = get.attitude(_status.event.player, target)
  //           if (att >= 0) {
  //             return 0
  //           }
  //           return -att / (1 + target.hasMark("dunxi"))
  //         })
  //     }
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = event.target || result.targets[0]
  //       player.logSkill("dunxi", target)
  //       target.addMark("dunxi", 1)
  //       game.delayx()
  //     }
  //   },
  //   intro: { content: "mark", name2: "钝" },
  //   group: "dunxi_random",
  //   subSkill: {
  //     random: {
  //       audio: "dunxi",
  //       trigger: { global: "useCard" },
  //       forced: true,
  //       locked: false,
  //       filter(event, player) {
  //         if (
  //           !event.player.hasMark("dunxi") ||
  //           event.targets.length !== 1 ||
  //           event._dunxi
  //         ) {
  //           return false
  //         }
  //         // 必须在出牌阶段内
  //         var evt = event.getParent("phaseUse")
  //         if (!evt || evt.player !== event.player) {
  //           return false
  //         }
  //         var type = get.type2(event.card, false)
  //         return type === "basic" || type === "trick"
  //       },
  //       logTarget: "player",
  //       line: "fire",
  //       async content(event, trigger, player) {
  //         trigger._dunxi = true
  //         trigger.player.removeMark("dunxi", 1)
  //         const originalTarget = trigger.targets[0]
  //         // 令所有角色进行判定
  //         const judgeResults = []
  //         const allPlayers = game.filterPlayer()
  //         for (const current of allPlayers) {
  //           const judgeResult = await current.judge().forResult()
  //           judgeResults.push({
  //             player: current,
  //             number: judgeResult.number,
  //           })
  //         }
  //         // 找到点数最大值
  //         const maxNumber = Math.max(...judgeResults.map((r) => r.number))
  //         const maxPlayers = judgeResults
  //           .filter((r) => r.number === maxNumber)
  //           .map((r) => r.player)
  //         let newTarget
  //         if (maxPlayers.length === 1) {
  //           newTarget = maxPlayers[0]
  //         } else {
  //           // 点数相同由钝袭拥有者（player）选择
  //           const chooseResult = await player
  //             .chooseTarget(
  //               "钝袭：选择判定点数相同的一名角色作为新目标",
  //               true,
  //               (card, player, target) =>
  //                 _status.event.maxPlayers.includes(target),
  //             )
  //             .set("maxPlayers", maxPlayers)
  //             .set("ai", (target) =>
  //               get.effect(
  //                 target,
  //                 _status.event.getTrigger().card,
  //                 _status.event.getTrigger().player,
  //                 _status.event.player,
  //               ),
  //             )
  //             .forResult()
  //           newTarget = chooseResult.targets?.[0] || maxPlayers.randomGet()
  //         }
  //         // 将目标改为新目标
  //         trigger.targets.remove(originalTarget)
  //         trigger.targets.push(newTarget)
  //         trigger.player.line(newTarget, "fire")
  //         game.log(trigger.card, "的目标被改为", newTarget)
  //         // 若更改后目标与原目标相同
  //         if (newTarget === originalTarget) {
  //           await trigger.player.loseHp()
  //           const evt = trigger.getParent("phaseUse")
  //           if (evt && evt.player === trigger.player) {
  //             evt.skipped = true
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // // 蒋琬
  // // 自若
  // ziruo: {
  //   audio: 2,
  //   trigger: { player: "useCard" },
  //   filter(event, player) {
  //     if (!event.ziruo?.[player.playerid]) {
  //       return false
  //     }
  //     return event.ziruo[player.playerid][player.storage.ziruo ? 1 : 0]
  //   },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     player.changeZhuanhuanji("ziruo")
  //     await player.draw("nodelay")
  //   },
  //   mark: true,
  //   marktext: "☯",
  //   zhuanhuanji: true,
  //   intro: {
  //     content: (storage) =>
  //       "当你使用最" +
  //       (storage ? "右" : "左") +
  //       "侧的卡牌时，你摸一张牌。你以此法摸牌后本回合不能整理手牌。",
  //   },
  //   global: "ziruo_mark",
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (typeof card === "object") {
  //         const cards = player.getCards("h")
  //         if (
  //           cards.indexOf(card) ===
  //           (player.storage.ziruo ? cards.length - 1 : 0)
  //         ) {
  //           return num + 10
  //         }
  //       }
  //     },
  //   },
  //   group: ["ziruo_gain", "ziruo_sort"],
  //   subSkill: {
  //     mark: {
  //       charlotte: true,
  //       trigger: { player: "useCardBegin" },
  //       filter(event, player) {
  //         const cards = player.getCards("h")
  //         if (!cards.length) {
  //           return false
  //         }
  //         return (event.cards || []).some(
  //           (card) => cards[0] === card || cards[cards.length - 1] === card,
  //         )
  //       },
  //       forced: true,
  //       popup: false,
  //       content() {
  //         const cards = player.getCards("h")
  //         if (!trigger.ziruo) {
  //           trigger.ziruo = {}
  //         }
  //         trigger.ziruo[player.playerid] = [
  //           trigger.cards.some((card) => cards[0] === card),
  //           trigger.cards.some((card) => cards[cards.length - 1] === card),
  //         ]
  //       },
  //     },
  //     gain: {
  //       trigger: {
  //         player: "gainAfter",
  //       },
  //       filter(event, player) {
  //         if (player.hasSkill("ziruo_ban", null, null, false)) {
  //           return false
  //         }
  //         return (
  //           event.getParent().name === "draw" &&
  //           event.getParent(2).name === "ziruo"
  //         )
  //       },
  //       forced: true,
  //       popup: false,
  //       async content(event, trigger, player) {
  //         player.addTempSkill("ziruo_ban")
  //       },
  //     },
  //     ban: {
  //       charlotte: true,
  //       mark: true,
  //       intro: {
  //         content: "本回合不能整理手牌",
  //       },
  //       ai: { noSortCard: true },
  //     },
  //     sort: {
  //       enable: "chooseToUse",
  //       filter(event, player) {
  //         return player.countCards("h") > 1 && !player.hasSkillTag("noSortCard")
  //       },
  //       direct: true,
  //       lose: false,
  //       discard: false,
  //       delay: 0,
  //       prompt: "整理手牌顺序",
  //       async content(event, trigger, player) {
  //         event.getParent(2).goto(0)
  //         if (_status.connectMode || !event.isMine()) {
  //           player.tempBanSkill("ziruo_sort", {
  //             player: ["useCard1", "useSkillBegin", "chooseToUseEnd"],
  //           })
  //         }
  //         const next = player.chooseToMove("自若：请整理手牌顺序", true)
  //         next.set("list", [["手牌", player.getCards("h")]])
  //         next.set("processAI", (list) => {
  //           const player = get.player(),
  //             cards = list[0][1].slice(0)
  //           cards.sort((a, b) => get.useful(b, player) - get.useful(a, player))
  //           if (player.storage.ziruo) {
  //             cards.reverse()
  //           }
  //           return [cards]
  //         })
  //         const result = await next.forResult()
  //         if (!result?.bool) {
  //           return
  //         }
  //         const hs = result.moved[0].reverse()
  //         player.sortHandcardOL(hs)
  //       },
  //       ai: {
  //         order: 10,
  //         result: { player: 1 },
  //       },
  //     },
  //   },
  // },
  // // 蓄发
  // xvfa: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     const list = player.getStorage("xvfa_used")
  //     return (
  //       (!list.includes("0") && player.countCards("h")) ||
  //       (!list.includes("1") && player.getExpansions("xvfa").length)
  //     )
  //   },
  //   chooseButton: {
  //     dialog(_, player) {
  //       const dialog = ui.create.dialog("蓄发：请选择一项", "hidden")
  //       const list = [
  //         [
  //           "0",
  //           "将至少一半手牌称为“蓄发”置于武将牌上，然后可以将一张牌当作“蓄发”牌中的一张普通锦囊牌使用",
  //         ],
  //         [
  //           "1",
  //           "移去至少一半“蓄发”牌，然后可以将一张牌当作其中一张普通锦囊牌使用",
  //         ],
  //       ].filter((listx) => {
  //         if (player.getStorage("xvfa_used").includes(listx[0])) {
  //           return false
  //         }
  //         if (listx[0] === "0") {
  //           return player.countCards("h")
  //         }
  //         return player.getExpansions("xvfa").length
  //       })
  //       dialog.add([list, "textbutton"])
  //       if (list.length === 1) {
  //         dialog.direct = true
  //       }
  //       return dialog
  //     },
  //     filter(button, player) {
  //       if (player.getStorage("xvfa_used").includes(button.link)) {
  //         return false
  //       }
  //       if (button.link === "0") {
  //         return player.countCards("h")
  //       }
  //       return player.getExpansions("xvfa").length
  //     },
  //     check: () => 1 + Math.random(),
  //     backup: (links) =>
  //       get.copy(
  //         lib.skill[`xvfa_${["put", "remove"][parseInt(links[0], 10)]}`],
  //       ),
  //     prompt(links) {
  //       if (links[0] === "0") {
  //         return "###蓄发###将至少一半手牌称为“蓄发”置于武将牌上，然后可以将一张牌当作“蓄发”牌中的一张普通锦囊牌使用"
  //       }
  //       return "###蓄发###移去一半“蓄发”牌，然后可以将一张牌当作其中一张普通锦囊牌使用"
  //     },
  //   },
  //   intro: {
  //     content: "expansion",
  //     markcount: "expansion",
  //   },
  //   onremove(player, skill) {
  //     const cards = player.getExpansions(skill)
  //     if (cards.length) {
  //       player.loseToDiscardpile(cards)
  //     }
  //   },
  //   subSkill: {
  //     backup: {},
  //     used: { charlotte: true, onremove: true },
  //     put: {
  //       audio: "xvfa",
  //       filterCard: true,
  //       selectCard: () => [
  //         Math.ceil(get.event().player.countCards("h") / 2),
  //         Infinity,
  //       ],
  //       position: "h",
  //       check(card) {
  //         const player = get.event().player,
  //           value = player.getUseValue(card, true)
  //         if (value > 0) {
  //           return get.type(card) === "trick" ? 20 + value : 0
  //         }
  //         return 15 - get.value(card) - get.useful(card)
  //       },
  //       allowChooseAll: true,
  //       lose: false,
  //       discard: false,
  //       delay: 0,
  //       async content(event, trigger, player) {
  //         player.addTempSkill("xvfa_used", "phaseUseAfter")
  //         player.markAuto("xvfa_used", ["0"])
  //         await player
  //           .addToExpansion(event.cards, player, "give")
  //           .set("gaintag", ["xvfa"])
  //         const cards = player.getExpansions("xvfa")
  //         if (
  //           cards.some(
  //             (card) =>
  //               get.type(card) === "trick" &&
  //               player.hasCard(
  //                 (cardx) =>
  //                   player.hasUseTarget(
  //                     get.autoViewAs({ name: card.name }, [cardx]),
  //                     true,
  //                   ),
  //                 "hes",
  //               ),
  //           )
  //         ) {
  //           const result = await player
  //             .chooseButton([
  //               '###蓄发###<div class="text center">是否将一张牌当作一张“蓄发”牌使用？</div>',
  //               cards,
  //             ])
  //             .set("filterButton", (button) => {
  //               const player = get.event().player,
  //                 card = button.link
  //               return (
  //                 get.type(card) === "trick" &&
  //                 player.hasCard(
  //                   (cardx) =>
  //                     player.hasUseTarget(
  //                       get.autoViewAs({ name: card.name }, [cardx]),
  //                       true,
  //                     ),
  //                   "hes",
  //                 )
  //               )
  //             })
  //             .set("ai", (button) => {
  //               const player = get.event().player,
  //                 card = button.link
  //               return player.getUseValue(
  //                 { name: card.name, isCard: true },
  //                 true,
  //               )
  //             })
  //             .forResult()
  //           if (result.bool) {
  //             const card = result.links[0]
  //             game.broadcastAll((card) => {
  //               lib.skill.xvfa_backupx.viewAs = { name: card.name }
  //             }, card)
  //             await player
  //               .chooseToUse()
  //               .set(
  //                 "openskilldialog",
  //                 `###蓄发###将一张牌当作【${get.translation(card.name)}】使用`,
  //               )
  //               .set("norestore", true)
  //               .set("addCount", false)
  //               .set("_backupevent", "xvfa_backupx")
  //               .set("custom", {
  //                 add: {},
  //                 replace: { window() {} },
  //               })
  //               .backup("xvfa_backupx")
  //           }
  //         }
  //       },
  //     },
  //     remove: {
  //       audio: "xvfa",
  //       filterCard: () => false,
  //       selectCard: -1,
  //       delay: 0,
  //       async content(event, trigger, player) {
  //         player.addTempSkill("xvfa_used", "phaseUseAfter")
  //         player.markAuto("xvfa_used", ["1"])
  //         const cards = player.getExpansions("xvfa"),
  //           num = Math.ceil(cards.length / 2)
  //         const result = await player
  //           .chooseButton(
  //             [
  //               '###蓄发###<div class="text center">请移去至少' +
  //                 get.cnNumber(num) +
  //                 "张“蓄发”牌</div>",
  //               cards,
  //             ],
  //             [num, Infinity],
  //             true,
  //             "allowChooseAll",
  //           )
  //           .set("ai", (button) => {
  //             const player = get.event().player,
  //               value = player.getUseValue(button.link, true)
  //             if (value > 0 && get.type(button.link) === "trick") {
  //               if (
  //                 !ui.selected.buttons.some((but) => {
  //                   return (
  //                     get.type(but.link) === "trick" &&
  //                     player.getUseValue(but.link, true) > 0
  //                   )
  //                 })
  //               ) {
  //                 return 20 + value
  //               }
  //               return 0
  //             }
  //             return 1 / (get.useful(button.link) || 0.5)
  //           })
  //           .forResult()
  //         if (result.bool) {
  //           const cardx = result.links
  //           await player.loseToDiscardpile(cardx)
  //           if (
  //             cardx.some(
  //               (card) =>
  //                 get.type(card) === "trick" &&
  //                 player.hasCard(
  //                   (cardxx) =>
  //                     player.hasUseTarget(
  //                       get.autoViewAs({ name: card.name }, [cardxx]),
  //                       true,
  //                     ),
  //                   "hes",
  //                 ),
  //             )
  //           ) {
  //             const result2 = await player
  //               .chooseButton([
  //                 '###蓄发###<div class="text center">是否将一张牌当作一张移去的“蓄发”牌使用？</div>',
  //                 cardx,
  //               ])
  //               .set("filterButton", (button) => {
  //                 const player = get.event().player,
  //                   card = button.link
  //                 return (
  //                   get.type(card) === "trick" &&
  //                   player.hasCard(
  //                     (cardx) =>
  //                       player.hasUseTarget(
  //                         get.autoViewAs({ name: card.name }, [cardx]),
  //                         true,
  //                       ),
  //                     "hes",
  //                   )
  //                 )
  //               })
  //               .set("ai", (button) => {
  //                 const player = get.event().player,
  //                   card = button.link
  //                 return player.getUseValue(
  //                   { name: card.name, isCard: true },
  //                   true,
  //                 )
  //               })
  //               .forResult()
  //             if (result2.bool) {
  //               const card = result2.links[0]
  //               game.broadcastAll((card) => {
  //                 lib.skill.xvfa_backupx.viewAs = { name: card.name }
  //               }, card)
  //               await player
  //                 .chooseToUse()
  //                 .set(
  //                   "openskilldialog",
  //                   `###蓄发###将一张牌当作【${get.translation(card.name)}】使用`,
  //                 )
  //                 .set("norestore", true)
  //                 .set("addCount", false)
  //                 .set("_backupevent", "xvfa_backupx")
  //                 .set("custom", {
  //                   add: {},
  //                   replace: { window() {} },
  //                 })
  //                 .backup("xvfa_backupx")
  //             }
  //           }
  //         }
  //       },
  //     },
  //     backupx: {
  //       filterCard(card) {
  //         return get.itemtype(card) === "card"
  //       },
  //       position: "hes",
  //       check(card) {
  //         const player = get.event().player
  //         if (player.hasValueTarget(card, true, true)) {
  //           return 0
  //         }
  //         if (player.hasSkill("ziruo")) {
  //           const cards = player.getCards("h")
  //           if (
  //             cards.indexOf(card) ===
  //             (player.storage.ziruo ? cards.length - 1 : 0)
  //           ) {
  //             return 15 - get.value(card)
  //           }
  //         }
  //         return 5 - get.value(card)
  //       },
  //       log: false,
  //     },
  //   },
  //   ai: {
  //     order: 1,
  //     result: { player: 1 },
  //   },
  // },
  // // 费祎
  // // 晏如
  // yanru: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     if (!player.countCards("h")) {
  //       return false
  //     }
  //     var num = player.countCards("h") % 2
  //     return !player.getStorage("yanru_used").includes(num)
  //   },
  //   filterCard(card, player) {
  //     if (player.countCards("h") && player.countCards("h") % 2 === 0) {
  //       return lib.filter.cardDiscardable(card, player)
  //     }
  //     return false
  //   },
  //   selectCard() {
  //     var player = _status.event.player
  //     if (player.countCards("h") && player.countCards("h") % 2 === 0) {
  //       return [player.countCards("h") / 2, Infinity]
  //     }
  //     return -1
  //   },
  //   prompt() {
  //     var player = _status.event.player
  //     return [
  //       `${player.countCards("h") ? "弃置至少一半的手牌，然后" : ""}摸三张牌`,
  //       "摸三张牌，然后弃置至少一半的手牌",
  //     ][player.countCards("h") % 2]
  //   },
  //   check(card) {
  //     var player = _status.event.player
  //     if (
  //       player.hasSkill("hezhong") &&
  //       player.getStorage("hezhong_used").length < 2
  //     ) {
  //       if (player.countCards("h") - ui.selected.cards.length > 1) {
  //         return 1 / (get.value(card) || 0.5)
  //       }
  //       return 0
  //     }
  //     if (ui.selected.cards.length < player.countCards("h") / 2) {
  //       return 5 - get.value(card)
  //     }
  //     return 0
  //   },
  //   allowChooseAll: true,
  //   discard: false,
  //   lose: false,
  //   delay: 0,
  //   content() {
  //     "step 0"
  //     var bool = player.countCards("h") % 2
  //     if (cards) {
  //       player.discard(cards)
  //     }
  //     player.addTempSkill("yanru_used", "phaseUseAfter")
  //     player.markAuto("yanru_used", [bool])
  //     player.draw(3)
  //     if (!bool) {
  //       event.finish()
  //     }
  //     ;("step 1")
  //     player
  //       .chooseToDiscard(
  //         "h",
  //         "宴如：弃置至少一半手牌",
  //         [Math.floor(player.countCards("h") / 2), Infinity],
  //         true,
  //         "allowChooseAll",
  //       )
  //       .set("ai", (card) => {
  //         var player = _status.event.player
  //         if (
  //           player.hasSkill("hezhong") &&
  //           !(player.hasSkill("hezhong_0") && player.hasSkill("hezhong_1")) &&
  //           player.countCards("h") - ui.selected.cards.length > 2
  //         ) {
  //           return 1 / (get.value(card) || 0.5)
  //         }
  //         if (
  //           !player.hasSkill("hezhong") &&
  //           ui.selected.cards.length < Math.floor(player.countCards("h") / 2)
  //         ) {
  //           return 1 / (get.value(card) || 0.5)
  //         }
  //         return 0
  //       })
  //   },
  //   subSkill: {
  //     used: { charlotte: true, onremove: true },
  //   },
  //   ai: {
  //     order: 3,
  //     result: { player: 1 },
  //   },
  // },
  // // 和衷
  // hezhong: {
  //   audio: 2,
  //   trigger: {
  //     player: "loseAfter",
  //     global: [
  //       "equipAfter",
  //       "addJudgeAfter",
  //       "gainAfter",
  //       "loseAsyncAfter",
  //       "addToExpansionAfter",
  //     ],
  //   },
  //   filter(event, player) {
  //     if (
  //       player.countCards("h") !== 1 ||
  //       typeof get.number(player.getCards("h")[0], player) !== "number"
  //     ) {
  //       return false
  //     }
  //     if (player.getStorage("hezhong_used").length > 1) {
  //       return false
  //     }
  //     let gain = 0,
  //       lose = 0
  //     if (event.getg) {
  //       gain = event.getg(player).length
  //     }
  //     if (event.getl) {
  //       lose = event.getl(player).hs.length
  //     }
  //     return gain !== lose
  //   },
  //   prompt2(event, player) {
  //     let str = "展示最后一张手牌并摸一张牌"
  //     const list = player.getStorage("hezhong_used")
  //     if (list.length < 2) {
  //       str += "，然后令本回合使用点数"
  //       if (!list.includes("max")) {
  //         str += "大于"
  //       }
  //       if (!list.length) {
  //         str += "或"
  //       }
  //       if (!list.includes("min")) {
  //         str += "小于"
  //       }
  //       str += get.number(player.getCards("h")[0], player)
  //       str += "的普通锦囊牌额外结算一次"
  //     }
  //     return str
  //   },
  //   frequent: true,
  //   content() {
  //     "step 0"
  //     player.showHandcards(`${get.translation(player)}发动了【和衷】`)
  //     event.num = get.number(player.getCards("h")[0], player)
  //     ;("step 1")
  //     player.draw()
  //     ;("step 2")
  //     if (player.getStorage("hezhong_used").includes("max")) {
  //       event._result = { index: 1 }
  //     } else if (player.getStorage("hezhong_used").includes("min")) {
  //       event._result = { index: 0 }
  //     } else {
  //       player
  //         .chooseControl()
  //         .set("choiceList", [
  //           `本回合使用点数大于${num}的普通锦囊牌额外结算一次`,
  //           `本回合使用点数小于${num}的普通锦囊牌额外结算一次`,
  //         ])
  //         .set("ai", () => {
  //           var player = _status.event.player
  //           var num = _status.event.num
  //           if (
  //             player
  //               .getCards("h")
  //               .reduce(
  //                 (num, card) => num + (get.number(card, player) || 0),
  //                 0,
  //               ) >
  //             num * 2
  //           ) {
  //             return 0
  //           }
  //           return 1
  //         })
  //         .set("num", num)
  //     }
  //     ;("step 3")
  //     var skill = `hezhong_${result.index}`
  //     player.addTempSkill(skill)
  //     player.addTempSkill("hezhong_used")
  //     player.markAuto("hezhong_used", ["max", "min"][result.index])
  //     player.markAuto(skill, [num])
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //     0: {
  //       charlotte: true,
  //       onremove: true,
  //       marktext: "＞",
  //       intro: {
  //         markcount: (list) => {
  //           return list.reduce((str, num) => {
  //             return str + get.strNumber(num)
  //           }, "")
  //         },
  //         content: "使用的下一张点数大于$的普通锦囊牌额外结算一次",
  //       },
  //       audio: "hezhong",
  //       trigger: { player: "useCard" },
  //       filter(event, player) {
  //         if (get.type(event.card) !== "trick") {
  //           return false
  //         }
  //         if (!event.targets.length) {
  //           return false
  //         }
  //         var num = get.number(event.card, player)
  //         return (
  //           typeof num === "number" &&
  //           player.getStorage("hezhong_0").some((numx) => num > numx)
  //         )
  //       },
  //       forced: true,
  //       usable: 1,
  //       content() {
  //         player.unmarkSkill("hezhong_0")
  //         trigger.effectCount++
  //         game.log(trigger.card, "额外结算一次")
  //       },
  //       ai: {
  //         effect: {
  //           player_use(card, player, target) {
  //             if (
  //               card.name === "tiesuo" &&
  //               !player.storage.counttrigger?.hezhong_0
  //             ) {
  //               return "zerotarget"
  //             }
  //           },
  //         },
  //       },
  //     },
  //     1: {
  //       charlotte: true,
  //       onremove: true,
  //       marktext: "<",
  //       intro: {
  //         markcount: (list) => {
  //           return list.reduce((str, num) => {
  //             return str + get.strNumber(num)
  //           }, "")
  //         },
  //         content: "使用的下一张点数小于$的普通锦囊牌额外结算一次",
  //       },
  //       audio: "hezhong",
  //       trigger: { player: "useCard" },
  //       filter(event, player) {
  //         if (get.type(event.card) !== "trick") {
  //           return false
  //         }
  //         if (!event.targets.length) {
  //           return false
  //         }
  //         var num = get.number(event.card, player)
  //         return (
  //           typeof num === "number" &&
  //           player.getStorage("hezhong_1").some((numx) => num < numx)
  //         )
  //       },
  //       forced: true,
  //       usable: 1,
  //       content() {
  //         player.unmarkSkill("hezhong_1")
  //         trigger.effectCount++
  //         game.log(trigger.card, "额外结算一次")
  //       },
  //       ai: {
  //         effect: {
  //           player_use(card, player, target) {
  //             if (
  //               card.name === "tiesuo" &&
  //               !player.storage.counttrigger?.hezhong_1
  //             ) {
  //               return "zerotarget"
  //             }
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // xiaofan: {
  //   audio: 2,
  //   enable: "chooseToUse",
  //   onChooseToUse(event) {
  //     if (
  //       game.online ||
  //       !ui.cardPile.childElementCount ||
  //       Array.isArray(event.xiaofan_cards)
  //     ) {
  //       return
  //     }
  //     const num = lib.skill.xiaofan.getNum(event.player) + 1
  //     event.set(
  //       "xiaofan_cards",
  //       Array.from(ui.cardPile.childNodes).slice(-num).reverse(),
  //     )
  //   },
  //   hiddenCard(player, name) {
  //     return !player.isTempBanned("xiaofan") && lib.inpile.includes(name)
  //   },
  //   getNum(player) {
  //     return player
  //       .getHistory("useCard")
  //       .reduce((list, evt) => list.add(get.type2(evt.card)), []).length
  //   },
  //   filter(event, player) {
  //     if (
  //       !Array.isArray(event.xiaofan_cards) ||
  //       event.responded ||
  //       event.xiaofan
  //     ) {
  //       return false
  //     }
  //     return lib.inpile.some((i) =>
  //       event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event),
  //     )
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       return ui.create.dialog(
  //         lib.translate.xiaofan,
  //         event.xiaofan_cards,
  //         "hidden",
  //       )
  //     },
  //     filter(button, player) {
  //       const evt = _status.event.getParent()
  //       return evt.filterCard(button.link, player, evt)
  //     },
  //     check(button) {
  //       const card = button.link,
  //         player = get.player()
  //       if (
  //         player
  //           .getHistory("useCard")
  //           .reduce(
  //             (list, evt) => list.add(get.type2(evt.card)),
  //             [get.type(card)],
  //           ).length > 2
  //       ) {
  //         return 0
  //       }
  //       return player.getUseValue(card)
  //     },
  //     backup(links, player) {
  //       return {
  //         audio: "xiaofan",
  //         filterCard() {
  //           return false
  //         },
  //         selectCard: -1,
  //         viewAs: links[0],
  //         card: links[0],
  //         async precontent(event, trigger, player) {
  //           const card = lib.skill.xiaofan_backup.card
  //           event.result.cards = [card]
  //           event.result.card = get.autoViewAs(card, [card])
  //           event.result.card.xiaofan = true
  //           player
  //             .when("useCardAfter")
  //             .filter((evt) => evt.card.xiaofan)
  //             .step(async (event, trigger, player) => {
  //               const maxNum = Math.min(3, lib.skill.xiaofan.getNum(player))
  //               if (
  //                 maxNum > 0 &&
  //                 player.countCards("jeh".slice(0, maxNum)) > 0
  //               ) {
  //                 for (let i = 0; i < maxNum; i++) {
  //                   const pos = "jeh"[i],
  //                     hs = player.countCards(pos)
  //                   if (hs > 0) {
  //                     await player.chooseToDiscard(hs, pos, true)
  //                   }
  //                 }
  //               }
  //             })
  //         },
  //       }
  //     },
  //     prompt(links, player) {
  //       return `嚣翻：是否使用${get.translation(links[0])}？`
  //     },
  //   },
  //   ai: {
  //     effect: {
  //       target(card, player, target, effect) {
  //         if (get.tag(card, "respondShan")) {
  //           return 0.7
  //         }
  //         if (get.tag(card, "respondSha")) {
  //           return 0.7
  //         }
  //       },
  //     },
  //     order: 12,
  //     respondShan: true,
  //     respondSha: true,
  //     result: {
  //       player(player) {
  //         if (_status.event.dying) {
  //           return get.attitude(player, _status.event.dying)
  //         }
  //         return 1
  //       },
  //     },
  //   },
  //   subSkill: {
  //     backup: {},
  //   },
  // },
  // tuishi: {
  //   audio: 2,
  //   mod: {
  //     wuxieJudgeEnabled: () => false,
  //     wuxieEnabled: () => false,
  //     cardEnabled: (card) => {
  //       if (card.name === "wuxie") {
  //         return false
  //       }
  //     },
  //     targetInRange: (card) => {
  //       if (card.storage?.tuishi) {
  //         return true
  //       }
  //     },
  //     aiValue: (player, card, val) => {
  //       if (card.name === "wuxie") {
  //         return 0
  //       }
  //       var num = get.number(card)
  //       if (typeof get.strNumber(num, false) === "string") {
  //         return val * 1.1
  //       }
  //     },
  //     aiUseful: (player, card, val) => {
  //       if (card.name === "wuxie") {
  //         return 0
  //       }
  //       var num = get.number(card)
  //       if (typeof get.strNumber(num, false) === "string") {
  //         return val * 1.1
  //       }
  //     },
  //     aiOrder: (player, card, order) => {
  //       if (get.name(card) === "sha" && player.hasSkill("tuishi_unlimit")) {
  //         order += 9
  //       }
  //       var num = get.number(card)
  //       if (typeof get.strNumber(num, false) === "string") {
  //         order += 3
  //       }
  //       return order
  //     },
  //   },
  //   trigger: { player: ["useCard", "useCardAfter"] },
  //   filter(event, player, name) {
  //     if (name === "useCardAfter") {
  //       if (player.isTempBanned("xiaofan")) {
  //         return false
  //       }
  //       return (
  //         player
  //           .getHistory("useCard", (evt) => {
  //             return (
  //               !player.getHistory("sourceDamage", (evt2) => {
  //                 return evt2.card && evt2.card === evt.card
  //               }).length && get.is.damageCard(evt.card)
  //             )
  //           })
  //           .indexOf(event) >= 2
  //       )
  //     }
  //     return typeof get.strNumber(get.number(event.card), false) === "string"
  //   },
  //   forced: true,
  //   content() {
  //     "step 0"
  //     if (event.triggername === "useCardAfter") {
  //       player.tempBanSkill("xiaofan")
  //       event.finish()
  //       return
  //     }
  //     trigger.targets.length = 0
  //     trigger.all_excluded = true
  //     game.log(trigger.card, "被无效了")
  //     ;("step 1")
  //     player.draw()
  //     player.addSkill("tuishi_unlimit")
  //   },
  //   init(player) {
  //     player.addSkill("tuishi_count")
  //     const history = player.getHistory(
  //       "useCard",
  //       (evt) =>
  //         evt.finished &&
  //         get.is.damageCard(evt.card) &&
  //         !player.hasHistory("sourceDamage", (evt2) => evt2.card === evt.card),
  //     )
  //     history.length > 0 &&
  //       player.addMark("tuishi_count", history.length, false)
  //   },
  //   onremove(player) {
  //     player.removeSkill("tuishi_count")
  //     player.clearMark("tuishi_count", false)
  //   },
  //   subSkill: {
  //     count: {
  //       charlotte: true,
  //       trigger: {
  //         player: "useCardAfter",
  //         global: ["phaseBefore", "phaseAfter"],
  //       },
  //       filter(event, player) {
  //         if (event.name === "useCard") {
  //           return (
  //             get.is.damageCard(event.card) &&
  //             !player.hasHistory(
  //               "sourceDamage",
  //               (evt2) => evt2.card === event.card,
  //             )
  //           )
  //         }
  //         return player.hasMark("tuishi_count")
  //       },
  //       silent: true,
  //       content() {
  //         const list =
  //           trigger.name === "useCard"
  //             ? ["addMark", event.name, 1, false]
  //             : ["clearMark", event.name, false]
  //         player[list[0]](...list.slice(1))
  //       },
  //       marktext: "失",
  //       intro: { content: "本回合已有#张伤害牌未造成过伤害" },
  //     },
  //     unlimit: {
  //       charlotte: true,
  //       mod: {
  //         cardUsableTarget: (card, player, target) => {
  //           if (target.countCards("h") < player.countCards("h")) {
  //             return true
  //           }
  //         },
  //         targetInRange: (card, player, target) => {
  //           if (target.countCards("h") < player.countCards("h")) {
  //             return true
  //           }
  //         },
  //       },
  //       trigger: { player: "useCard1" },
  //       filter(event, player) {
  //         if (!Array.isArray(event.targets) || !event.targets.length) {
  //           return false
  //         }
  //         let num = 0
  //         if (Array.isArray(event.cards) && event.cards.length) {
  //           const history = player.getHistory("lose", (evt) => {
  //             if ((evt.relatedEvent || evt.getParent()) !== event) {
  //               return false
  //             }
  //             return event.cards.some((card) => evt.hs.includes(card))
  //           })
  //           if (history.length) {
  //             num += event.cards.filter((card) =>
  //               history[0].hs.includes(card),
  //             ).length
  //           }
  //         }
  //         return event.targets.some(
  //           (target) =>
  //             player.countCards("h") + num >
  //             target.countCards("h") + (target === player ? num : 0),
  //         )
  //       },
  //       forced: true,
  //       popup: false,
  //       silent: true,
  //       firstDo: true,
  //       content() {
  //         player.removeSkill(event.name)
  //         var card = trigger.card
  //         if (!card.storage) {
  //           card.storage = {}
  //         }
  //         card.storage.tuishi = true
  //         if (trigger.addCount !== false) {
  //           trigger.addCount = false
  //           const stat = player.getStat().card,
  //             name = trigger.card.name
  //           if (typeof stat[name] === "number") {
  //             stat[name]--
  //           }
  //         }
  //       },
  //       mark: true,
  //       marktext: "侻",
  //       intro: { content: "对手牌数小于你的角色使用的下一张牌无距离次数限制" },
  //     },
  //   },
  // },
  // // 孟达
  // // 苟得
  // goude: {
  //   audio: 2,
  //   trigger: {
  //     global: "phaseEnd",
  //   },
  //   filter(event, player) {
  //     var list = []
  //     game.countPlayer((current) => {
  //       if (current.group !== player.group) {
  //         return false
  //       }
  //       var listx = lib.skill.goude.getActed(current)
  //       list.addArray(listx)
  //     })
  //     return list.length && list.length < 4
  //   },
  //   getActed(target) {
  //     var list = []
  //     if (
  //       target.hasHistory("gain", (evt) => {
  //         return evt.getParent().name === "draw" && evt.cards.length === 1
  //       })
  //     ) {
  //       list.push(1)
  //     }
  //     if (
  //       game.hasPlayer2((current) => {
  //         return current.hasHistory("lose", (evt) => {
  //           if (evt.type !== "discard") {
  //             return false
  //           }
  //           if ((evt.discarder || evt.getParent(2).player) !== target) {
  //             return false
  //           }
  //           var evtx = evt.getl(current)
  //           if (evtx?.hs.length !== 1) {
  //             return false
  //           }
  //           return true
  //         })
  //       })
  //     ) {
  //       list.push(2)
  //     }
  //     if (
  //       target.hasHistory("useCard", (evt) => {
  //         if (evt.card.name === "sha" && evt.cards && !evt.cards.length) {
  //           return true
  //         }
  //         return false
  //       })
  //     ) {
  //       list.push(3)
  //     }
  //     if (
  //       target.hasHistory("custom", (evt) => {
  //         return evt.name === "changeGroup"
  //       })
  //     ) {
  //       list.push(4)
  //     }
  //     return list
  //   },
  //   direct: true,
  //   content() {
  //     "step 0"
  //     var list = [1, 2, 3, 4]
  //     game.countPlayer((current) => {
  //       if (current.group !== player.group) {
  //         return false
  //       }
  //       var listx = lib.skill.goude.getActed(current)
  //       list.removeArray(listx)
  //     })
  //     var list2 = list.slice()
  //     var nochai = false,
  //       nosha = false
  //     if (
  //       !game.hasPlayer((current) => {
  //         return current.countDiscardableCards(player, "h")
  //       })
  //     ) {
  //       nochai = true
  //       list2.remove(2)
  //     }
  //     if (
  //       !game.hasPlayer((current) => {
  //         return player.canUse(
  //           { name: "sha", isCard: true },
  //           current,
  //           true,
  //           false,
  //         )
  //       })
  //     ) {
  //       nosha = true
  //       list2.remove(3)
  //     }
  //     var choices = list2.map((i) => {
  //       return `选项${get.cnNumber(i, true)}`
  //     })
  //     var choiceList = [
  //       "摸一张牌",
  //       "弃置一名角色的一张手牌",
  //       "视为使用一张【杀】",
  //       "将势力改为任意一个势力",
  //     ].map((text, ind) => {
  //       var hint = ""
  //       if (list2.includes(ind + 1)) {
  //         return text
  //       }
  //       if (!list.includes(ind + 1)) {
  //         hint += "已被执行过且"
  //       }
  //       if (ind === 1 && nochai && !list2.includes(ind + 1)) {
  //         hint += "无有手牌角色且"
  //       }
  //       if (ind === 2 && nosha && !list2.includes(ind + 1)) {
  //         hint += "无可选目标且"
  //       }
  //       hint = hint.slice(0, -1)
  //       return `<span style="opacity:0.5">${text}（${hint}）</span>`
  //     })
  //     choices.push("cancel2")
  //     if (_status.connectMode) {
  //       game.broadcastAll(() => {
  //         _status.noclearcountdown = true
  //       })
  //     }
  //     player
  //       .chooseControl(choices)
  //       .set("choiceList", choiceList)
  //       .set("prompt", get.prompt("goude"))
  //       .set("ai", () => {
  //         return _status.event.choice
  //       })
  //       .set(
  //         "choice",
  //         (() => {
  //           var fn = (control) => {
  //             switch (control) {
  //               case "选项一":
  //                 return player.getUseValue({ name: "draw" })
  //               case "选项二":
  //                 return Math.max.apply(
  //                   Math,
  //                   game.filterPlayer().map((current) => {
  //                     if (current.hasSkillTag("noh")) {
  //                       return -1
  //                     }
  //                     return (
  //                       -1.5 * get.attitude(player, current) -
  //                       Math.max(0, current.countCards("h") - 2) / 3
  //                     )
  //                   }),
  //                 )
  //               case "选项三":
  //                 return player.getUseValue({ name: "sha" })
  //               case "选项四": {
  //                 var myPopulation =
  //                   game.countPlayer((current) => {
  //                     return current.group === player.group
  //                   }) - 1
  //                 var value = Math.max.apply(
  //                   Math,
  //                   lib.group.map((group) => {
  //                     return (
  //                       game.countPlayer((current) => {
  //                         return current.group === group && current !== player
  //                       }) - myPopulation
  //                     )
  //                   }),
  //                 )
  //                 return 10 * value + 0.1 * (Math.random() - 0.5)
  //               }
  //               case "cancel2":
  //                 return 0
  //             }
  //           }
  //           var choicesx = choices.map((choice) => {
  //             return [choice, fn(choice)]
  //           })
  //           choicesx = choicesx.sort((a, b) => {
  //             return b[1] - a[1]
  //           })
  //           var choice = choicesx[0]
  //           if (choice[1] < 0) {
  //             return "cancel2"
  //           }
  //           return choice[0]
  //         })(),
  //       )
  //     ;("step 1")
  //     if (result.control === "cancel2") {
  //       event.finish()
  //       return
  //     }
  //     var contents = {
  //       选项一() {
  //         player.logSkill("goude")
  //         player.draw()
  //       },
  //       选项二() {
  //         "step 0"
  //         player
  //           .chooseTarget(
  //             "苟得：弃置一名角色的一张手牌",
  //             true,
  //             (card, player, target) => {
  //               return target.countDiscardableCards(player, "h")
  //             },
  //           )
  //           .set("ai", (target) => {
  //             if (target.hasSkillTag("noh")) {
  //               return 0
  //             }
  //             return -get.attitude(_status.event.player, target)
  //           })
  //         ;("step 1")
  //         if (result.bool) {
  //           var target = result.targets[0]
  //           if (_status.connectMode) {
  //             game.broadcastAll(() => {
  //               delete _status.noclearcountdown
  //               game.stopCountChoose()
  //             })
  //           }
  //           player.logSkill("goude", target)
  //           player.discardPlayerCard(target, true, "h")
  //         }
  //       },
  //       选项三() {
  //         player
  //           .chooseUseTarget("sha", true, false)
  //           .set("logSkill", "goude")
  //           .set("prompt", "苟得：选择【杀】的目标")
  //       },
  //       选项四() {
  //         "step 0"
  //         var list = lib.group.slice()
  //         var maxGroup = list.slice().sort((a, b) => {
  //           return (
  //             game.countPlayer((current) => {
  //               return current.group === b && current !== player
  //             }) -
  //             game.countPlayer((current) => {
  //               return current.group === a && current !== player
  //             })
  //           )
  //         })[0]
  //         player
  //           .chooseControl(list)
  //           .set("prompt", "苟得：请选择要变更为的势力")
  //           .set("ai", () => {
  //             return _status.event.choice
  //           })
  //           .set("choice", maxGroup)
  //         ;("step 1")
  //         if (_status.connectMode) {
  //           game.broadcastAll(() => {
  //             delete _status.noclearcountdown
  //             game.stopCountChoose()
  //           })
  //         }
  //         var group = result.control
  //         player.logSkill("goude")
  //         player.changeGroup(group)
  //         player.popup(`${group}2`, get.groupnature(group, "raw"))
  //       },
  //     }
  //     var next = game.createEvent(`goude_${result.control}`)
  //     next.player = player
  //     next.setContent(contents[result.control])
  //   },
  //   ai: {
  //     threaten: 3,
  //     effect: {
  //       player_use(card, player, target) {
  //         if (
  //           typeof card === "object" &&
  //           card.cards &&
  //           card.cards.some((card) => {
  //             return get.position(card) === "h"
  //           }) &&
  //           !get.tag(card, "draw") &&
  //           !get.tag(card, "gain") &&
  //           !get.tag(card, "discard") &&
  //           player === _status.currentPhase &&
  //           player.needsToDiscard() === 1 &&
  //           game.countPlayer((current) => {
  //             return current.group === player.group && current !== player
  //           }) <= 1 &&
  //           lib.group.some((group) => {
  //             return (
  //               game.countPlayer((current) => {
  //                 return current.group === group && current !== player
  //               }) > 2
  //             )
  //           })
  //         ) {
  //           return "zeroplayertarget"
  //         }
  //       },
  //     },
  //   },
  // },
  // // 陈式
  // // 擎北
  // qingbei: {
  //   audio: 2,
  //   trigger: {
  //     global: "roundStart",
  //     player: "useCardAfter",
  //   },
  //   filter(event, player) {
  //     if (event.name !== "useCard") {
  //       return true
  //     }
  //     if (!player.getStorage("qingbei_effect").length) {
  //       return false
  //     }
  //     const suit = get.suit(event.card)
  //     if (!suit) {
  //       return false
  //     }
  //     return suit !== "none"
  //   },
  //   async cost(event, trigger, player) {
  //     if (trigger.name === "useCard") {
  //       event.result = {
  //         bool: true,
  //       }
  //       return
  //     }
  //     const result = await player
  //       .chooseButton(
  //         [
  //           `###${get.prompt(event.skill)}###<div class='text center'>选择任意个花色，令你本轮不能使用这些花色的牌</div>`,
  //           [lib.suit.map((i) => ["", "", `suits_${i}`]), "vcard"],
  //         ],
  //         [1, 4],
  //       )
  //       .set("ai", (button) => {
  //         const player = get.player(),
  //           suit = button.link[2].slice(6),
  //           val = player
  //             .getCards("hs", { suit: suit })
  //             .map((card) => {
  //               return get.value(card) + player.getUseValue(card) / 3
  //             })
  //             .reduce((sum, value) => {
  //               return sum + value
  //             }, 0)
  //         if (val > 10 && ui.selected.buttons.length > 0) {
  //           return -1
  //         }
  //         if (val > 6 && ui.selected.buttons.length === 2) {
  //           return -1
  //         }
  //         if (ui.selected.buttons.length === 3) {
  //           return -1
  //         }
  //         return 1 + 1 / val
  //       })
  //       .forResult()
  //     if (result?.bool && result.links?.length) {
  //       event.result = {
  //         bool: true,
  //         cost_data: result.links,
  //       }
  //     }
  //   },
  //   async content(event, trigger, player) {
  //     if (trigger.name === "useCard") {
  //       await player.draw(player.getStorage("qingbei_effect").length, "nodelay")
  //       return
  //     }
  //     const { name, cost_data: links } = event
  //     const suits = links
  //       .map((i) => i[2].slice(6))
  //       .sort((a, b) => lib.suit.indexOf(b) - lib.suit.indexOf(a))
  //     const skill = `${name}_effect`
  //     player.addTempSkill(skill, "roundStart")
  //     player.setStorage(skill, suits, true)
  //     player.addTip(
  //       skill,
  //       `${get.translation(skill)}${suits.map((i) => get.translation(i)).join("")}`,
  //     )
  //   },
  //   ai: {
  //     threaten: 2.3,
  //   },
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       onremove(player, skill) {
  //         delete player.storage[skill]
  //         player.removeTip(skill)
  //       },
  //       mark: true,
  //       intro: {
  //         content: `本轮内不能使用$花色的牌`,
  //       },
  //       mod: {
  //         cardEnabled(card, player) {
  //           if (player.getStorage("qingbei_effect").includes(get.suit(card))) {
  //             return false
  //           }
  //         },
  //         cardSavable(card, player) {
  //           if (player.getStorage("qingbei_effect").includes(get.suit(card))) {
  //             return false
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // // 杨仪
  // // 定措
  // dingcuo: {
  //   audio: 2,
  //   trigger: {
  //     player: "damageEnd",
  //     source: "damageSource",
  //   },
  //   usable: 1,
  //   async content(event, trigger, player) {
  //     const result = await player.draw(2).forResult()
  //     if (get.itemtype(result?.cards) === "cards" && result.cards.length > 1) {
  //       const { cards } = result
  //       const color = get.color(cards[0], player)
  //       for (let i = 1; i < cards.length; i++) {
  //         if (get.color(cards[i], player) !== color) {
  //           if (player.hasCards("h")) {
  //             await player.chooseToDiscard("h", true)
  //           }
  //           break
  //         }
  //       }
  //     }
  //   },
  // },
  // // 狷狭
  // juanxia: {
  //   audio: 2,
  //   trigger: { player: "phaseJieshuBegin" },
  //   direct: true,
  //   content() {
  //     "step 0"
  //     player
  //       .chooseTarget(get.prompt2("juanxia"), lib.filter.notMe)
  //       .set("ai", (target) => {
  //         var player = _status.event.player,
  //           list = []
  //         for (var name of lib.inpile) {
  //           var info = lib.card[name]
  //           if (
  //             info?.type !== "trick" ||
  //             info.notarget ||
  //             (info.selectTarget && info.selectTarget !== 1)
  //           ) {
  //             continue
  //           }
  //           if (!player.canUse(name, target, false)) {
  //             continue
  //           }
  //           var eff = get.effect(target, { name: name }, player, player)
  //           if (eff > 0) {
  //             list.push(eff)
  //           }
  //         }
  //         list.sort().reverse()
  //         if (!list.length) {
  //           return 0
  //         }
  //         return list[0] + (list[1] || 0) + (list[2] || 0)
  //       })
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       event.target = target
  //       player.logSkill("juanxia", target)
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     var list = []
  //     for (var name of lib.inpile) {
  //       var info = lib.card[name]
  //       if (
  //         info?.type !== "trick" ||
  //         info.notarget ||
  //         (info.selectTarget && info.selectTarget !== 1)
  //       ) {
  //         continue
  //       }
  //       list.push(name)
  //     }
  //     if (!list.length) {
  //       event.finish()
  //     } else {
  //       event.list = list
  //       event.count = 0
  //     }
  //     ;("step 3")
  //     var list = event.list.filter((name) => player.canUse(name, target, false))
  //     if (list.length) {
  //       var next = player
  //         .chooseButton([
  //           `视为对${get.translation(target)}使用一张牌`,
  //           [list, "vcard"],
  //         ])
  //         .set("ai", (button) => {
  //           const evt = _status.event.getParent(),
  //             eff = get.effect(
  //               evt.target,
  //               { name: button.link[2] },
  //               evt.player,
  //               evt.player,
  //             )
  //           if (
  //             evt.target.hp < 2 ||
  //             get.attitude(evt.player, evt.target) > 0 ||
  //             (evt.target.hp < 3 && get.tag(button.link, "damage"))
  //           ) {
  //             return eff
  //           }
  //           return (
  //             eff +
  //             get.effect(evt.player, { name: "sha" }, evt.target, evt.player)
  //           )
  //         })
  //       if (event.count === 0) {
  //         next.set("forced", true)
  //       }
  //     } else {
  //       event.stopped = true
  //       event.goto(5)
  //     }
  //     ;("step 4")
  //     if (result.bool) {
  //       event.count++
  //       var name = result.links[0][2]
  //       event.list.remove(name)
  //       player.useCard({ name: name, isCard: true }, target, false)
  //     } else {
  //       event.stopped = true
  //     }
  //     ;("step 5")
  //     if (target.isIn() && event.count > 0) {
  //       if (event.count < 3 && !event.stopped && event.list.length > 0) {
  //         event.goto(3)
  //       } else {
  //         target.addTempSkill("juanxia_counter", { player: "phaseAfter" })
  //         if (!target.storage.juanxia_counter) {
  //           target.storage.juanxia_counter = {}
  //         }
  //         if (!target.storage.juanxia_counter[player.playerid]) {
  //           target.storage.juanxia_counter[player.playerid] = 0
  //         }
  //         target.storage.juanxia_counter[player.playerid] += event.count
  //       }
  //     }
  //   },
  //   subSkill: {
  //     counter: {
  //       trigger: { player: "phaseEnd" },
  //       forced: true,
  //       charlotte: true,
  //       onremove: true,
  //       filter(event, player) {
  //         var map1 = _status.connectMode ? lib.playerOL : game.playerMap,
  //           map2 = player.storage.juanxia_counter
  //         if (!map2) {
  //           return false
  //         }
  //         for (var i in map2) {
  //           if (map1[i]?.isIn() && player.canUse("sha", map1[i], false)) {
  //             return true
  //           }
  //         }
  //         return false
  //       },
  //       logTarget(event, player) {
  //         var list = []
  //         var map1 = _status.connectMode ? lib.playerOL : game.playerMap,
  //           map2 = player.storage.juanxia_counter
  //         if (!map2) {
  //           return false
  //         }
  //         for (var i in map2) {
  //           if (map1[i]?.isIn()) {
  //             list.push(map1[i])
  //           }
  //         }
  //         return list
  //       },
  //       content() {
  //         "step 0"
  //         var list = []
  //         var map1 = _status.connectMode ? lib.playerOL : game.playerMap,
  //           map2 = player.storage.juanxia_counter
  //         if (!map2) {
  //           return false
  //         }
  //         for (var i in map2) {
  //           if (map1[i]?.isIn()) {
  //             list.push(map1[i])
  //           }
  //         }
  //         list.sortBySeat()
  //         event.num = 0
  //         event.targets = list
  //         ;("step 1")
  //         var target = targets[num]
  //         event.target = target
  //         if (target.isIn() && player.canUse("sha", target, false)) {
  //           player
  //             .chooseBool(
  //               "狷狭：是否视为对" +
  //                 get.translation(target) +
  //                 "依次使用" +
  //                 get.cnNumber(
  //                   player.storage.juanxia_counter[target.playerid],
  //                 ) +
  //                 "张【杀】？",
  //             )
  //             .set(
  //               "goon",
  //               get.effect(target, { name: "sha" }, player, player) > 0,
  //             )
  //             .set("ai", () => _status.event.goon)
  //         }
  //         ;("step 2")
  //         event.num++
  //         if (result.bool) {
  //           event.count = player.storage.juanxia_counter[target.playerid]
  //         } else if (event.num < targets.length) {
  //           event.goto(1)
  //         } else {
  //           event.finish()
  //         }
  //         ;("step 3")
  //         event.count--
  //         if (target.isIn() && player.canUse("sha", target, false)) {
  //           player.useCard({ name: "sha", isCard: true }, target, false)
  //         }
  //         if (event.count > 0) {
  //           event.redo()
  //         } else if (event.num < targets.length) {
  //           event.goto(1)
  //         }
  //       },
  //     },
  //   },
  // },
  // // 黄舞蝶
  // // 双锐
  // shuangrui: {
  //   onChooseTarget(event, player) {
  //     event.targetprompt2.add((target) => {
  //       if (
  //         event.getParent().skill !== "shuangrui" ||
  //         !target.classList.contains("selectable")
  //       ) {
  //         return
  //       }
  //       if (player.inRange(target)) {
  //         return "加伤"
  //       }
  //       return "不可响应"
  //     })
  //   },
  //   audio: 2,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   filter(event, player) {
  //     return game.hasPlayer((current) => {
  //       return (
  //         current !== player &&
  //         player.canUse({ name: "sha", isCard: true }, current, false)
  //       )
  //     })
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt2(event.skill),
  //         (card, player, target) =>
  //           target !== player &&
  //           player.canUse({ name: "sha", isCard: true }, target, false),
  //       )
  //       .set("ai", (target) => {
  //         const player = get.player(),
  //           card = { name: "sha", isCard: true }
  //         return get.effect(target, card, player, player)
  //       })
  //       .set("_get_card", { name: "sha", isCard: true })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const target = event.targets[0]
  //     let directHit = [],
  //       baseDamage = 1
  //     if (player.inRange(target)) {
  //       baseDamage++
  //       await player.addTempSkills("shaxue")
  //     } else {
  //       directHit.addArray(game.players)
  //       await player.addTempSkills("shouxing")
  //     }
  //     await player
  //       .useCard({ name: "sha", isCard: true }, target, false)
  //       .set("directHit", directHit)
  //       .set("baseDamage", baseDamage)
  //   },
  //   ai: {
  //     skillTagFilter(player, tag, arg) {
  //       if (!_status.event.getParent("shuangrui_cost", true, true)) {
  //         return false
  //       }
  //       return !player.inRange(arg.target)
  //     },
  //     directHit_ai: true,
  //   },
  //   derivation: ["shouxing", "shaxue"],
  // },
  // // 伏械
  // fuxie: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     return game.hasPlayer(
  //       (current) => current !== player && current.countCards("he"),
  //     )
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       const skills = player.getSkills(null, false, false).filter((skill) => {
  //         const info = get.info(skill)
  //         if (
  //           !info ||
  //           info.charlotte ||
  //           get.skillInfoTranslation(skill, player).length === 0
  //         ) {
  //           return false
  //         }
  //         return true
  //       })
  //       const dialog = ui.create.dialog("伏械：弃置一张武器牌或失去1个技能")
  //       dialog.direct = true
  //       dialog.add([
  //         [["discardEquip1", "弃置武器牌"]],
  //         (item, type, position, noclick, node) => {
  //           node = ui.create.buttonPresets.tdnodes(
  //             item,
  //             type,
  //             position,
  //             noclick,
  //           )
  //           node.link = ["discard", "equip1"]
  //           return node
  //         },
  //       ])
  //       dialog.add([skills, "skill"])
  //       return dialog
  //     },
  //     filter(button, player) {
  //       if (Array.isArray(button.link)) {
  //         return player.countDiscardableCards(
  //           player,
  //           "he",
  //           (card) => get.subtype(card) === button.link[1],
  //         )
  //       }
  //       return true
  //     },
  //     check(button) {
  //       const player = get.player()
  //       if (Array.isArray(button.link)) {
  //         if (
  //           player.countDiscardableCards(
  //             player,
  //             "he",
  //             (card) =>
  //               get.subtype(card) === button.link[1] && get.value(card) < 10,
  //           )
  //         ) {
  //           return 3
  //         }
  //         return 1
  //       }
  //       if (["shouxing", "shaxue"].includes(button.link)) {
  //         return 4
  //       }
  //       return 2
  //     },
  //     backup(result, player) {
  //       return {
  //         audio: "fuxie",
  //         choice: result[0],
  //         filterCard(card) {
  //           const { choice } = get.info("fuxie_backup")
  //           if (Array.isArray(choice)) {
  //             return (
  //               get.subtype(card) === "equip1" &&
  //               lib.filter.cardDiscardable(card, player, "fuxie")
  //             )
  //           }
  //           return false
  //         },
  //         position: "he",
  //         selectCard() {
  //           const { choice } = get.info("fuxie_backup")
  //           if (Array.isArray(choice)) {
  //             return 1
  //           }
  //           return -1
  //         },
  //         filterTarget(card, player, target) {
  //           return target !== player && target.countCards("he")
  //         },
  //         async content(event, trigger, player) {
  //           const { choice } = get.info("fuxie_backup")
  //           if (Array.isArray(choice)) {
  //             await player.modedDiscard(event.cards)
  //           } else {
  //             await player.removeSkills(choice)
  //           }
  //           const target = event.target
  //           await target.chooseToDiscard(2, true, "he")
  //         },
  //         ai1(card) {
  //           return 10 - get.value(card)
  //         },
  //         ai2(target) {
  //           const player = get.player()
  //           return get.effect(target, { name: "guohe_copy2" }, player, player)
  //         },
  //       }
  //     },
  //     prompt(result, player) {
  //       const prompt = Array.isArray(result[0])
  //         ? "弃置一张武器牌"
  //         : `失去【${get.translation(result[0])}】`
  //       return `${prompt}，令一名角色弃置两张牌`
  //     },
  //   },
  //   subSkill: {
  //     backup: {},
  //   },
  //   ai: {
  //     order: 3,
  //     result: {
  //       player(player, target) {
  //         if (["shouxing", "shaxue"].some((skill) => player.hasSkill(skill))) {
  //           return 1
  //         }
  //         if (
  //           player.countCards("he", (card) => get.subtype(card) === "equip1")
  //         ) {
  //           return 1
  //         }
  //         return 0
  //       },
  //     },
  //   },
  // },
  // // 狩星
  // shouxing: {
  //   audio: 2,
  //   enable: "chooseToUse",
  //   filterCard: true,
  //   selectCard: [1, Infinity],
  //   position: "hse",
  //   viewAs: { name: "sha" },
  //   viewAsFilter(player) {
  //     if (!player.countCards("hse")) {
  //       return false
  //     }
  //   },
  //   filterTarget(card, player, target) {
  //     const cards = ui.selected.cards
  //     if (!cards?.length) {
  //       return false
  //     }
  //     if (player.inRange(target)) {
  //       return false
  //     }
  //     if (get.distance(player, target) !== cards.length) {
  //       return false
  //     }
  //     return lib.filter.targetEnabled(card, player, target)
  //   },
  //   complexSelect: true,
  //   prompt: "将X张牌当杀对一名攻击范围外的角色使用（X为你计算与其的距离）",
  //   check(card) {
  //     return 4.5 - get.value(card)
  //   },
  //   async precontent(event) {
  //     event.getParent().addCount = false
  //   },
  //   ai: {
  //     skillTagFilter(player) {
  //       if (!player.countCards("hes")) {
  //         return false
  //       }
  //     },
  //     respondSha: true,
  //   },
  // },
  // // 铩雪
  // shaxue: {
  //   audio: 2,
  //   trigger: {
  //     source: "damageSource",
  //   },
  //   filter(event, player) {
  //     return event.player !== player
  //   },
  //   check(event, player) {
  //     return get.distance(player, event.player) <= 2
  //   },
  //   logTarget: "player",
  //   async content(event, trigger, player) {
  //     await player.draw(2)
  //     const num = get.distance(player, trigger.player)
  //     if (num > 0 && trigger.player.isIn()) {
  //       await player.chooseToDiscard(num, "he", true)
  //     }
  //   },
  // },
  // // 游龙

  // // 卧龙凤雏
  // // 游龙
  // youlong: {
  //   enable: "chooseToUse",
  //   audio: 2,
  //   zhuanhuanji: true,
  //   marktext: "☯",
  //   mark: true,
  //   intro: {
  //     content(storage, player) {
  //       return `每轮限一次，你可以废除你的一个装备栏，视为使用一张未以此法使用过的${storage ? "基本" : "普通锦囊"}牌。`
  //     },
  //   },
  //   init(player) {
  //     player.storage.youlong = false
  //     if (!player.storage.youlong2) {
  //       player.storage.youlong2 = []
  //     }
  //   },
  //   hiddenCard(player, name) {
  //     if (player.storage.youlong2.includes(name) || !player.hasEnabledSlot()) {
  //       return false
  //     }
  //     if (
  //       player
  //         .getStorage("youlong_used")
  //         .includes(player.storage.youlong || false)
  //     ) {
  //       return false
  //     }
  //     const type = get.type(name)
  //     if (player.storage.youlong) {
  //       return type === "basic"
  //     }
  //     return type === "trick"
  //   },
  //   filter(event, player) {
  //     if (player.storage.youlong2.includes(name) || !player.hasEnabledSlot()) {
  //       return false
  //     }
  //     if (
  //       player
  //         .getStorage("youlong_used")
  //         .includes(player.storage.youlong || false)
  //     ) {
  //       return false
  //     }
  //     const type = player.storage.youlong ? "basic" : "trick"
  //     return get.inpileVCardList((info) => {
  //       if (info[0] !== type) {
  //         return false
  //       }
  //       if (player.storage.youlong2.includes(info[2])) {
  //         return false
  //       }
  //       return event.filterCard(
  //         { name: info[2], nature: info[3], isCard: true },
  //         player,
  //         event,
  //       )
  //     }).length
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       const dialog = ui.create.dialog("游龙", "hidden")
  //       const equips = []
  //       for (let i = 1; i < 6; i++) {
  //         if (!player.hasEnabledSlot(i)) {
  //           continue
  //         }
  //         equips.push([i, get.translation(`equip${i}`)])
  //       }
  //       if (equips.length > 0) {
  //         dialog.add([equips, "tdnodes"])
  //       }
  //       const type = player.storage.youlong ? "basic" : "trick"
  //       const list = get.inpileVCardList((info) => {
  //         if (info[0] !== type) {
  //           return false
  //         }
  //         if (player.storage.youlong2.includes(info[2])) {
  //           return false
  //         }
  //         return event.filterCard(
  //           { name: info[2], nature: info[3], isCard: true },
  //           player,
  //           event,
  //         )
  //       })
  //       dialog.add([list, "vcard"])
  //       return dialog
  //     },
  //     filter(button) {
  //       if (
  //         ui.selected.buttons.length &&
  //         typeof button.link === typeof ui.selected.buttons[0].link
  //       ) {
  //         return false
  //       }
  //       return true
  //     },
  //     select: 2,
  //     check(button) {
  //       const player = get.player()
  //       if (typeof button.link === "number") {
  //         const card = player.getEquip(button.link)
  //         if (card) {
  //           const val = get.value(card)
  //           if (val > 0) {
  //             return 0
  //           }
  //           return 5 - val
  //         }
  //         switch (button.link) {
  //           case 3:
  //             return 4.5
  //           case 4:
  //             return 4.4
  //           case 5:
  //             return 4.3
  //           case 2:
  //             return (3 - player.hp) * 1.5
  //           case 1: {
  //             if (
  //               game.hasPlayer((current) => {
  //                 return (
  //                   (get.realAttitude || get.attitude)(player, current) < 0 &&
  //                   get.distance(player, current) > 1
  //                 )
  //               })
  //             ) {
  //               return 0
  //             }
  //             return 3.2
  //           }
  //         }
  //       }
  //       const name = button.link[2]
  //       const evt = get.event().getParent()
  //       if (evt.type === "phase") {
  //         const card = { name: name, nature: button.link[3], isCard: true }
  //         if (name === "shan") {
  //           return 2
  //         }
  //         if (evt.type === "dying") {
  //           if (get.attitude(player, evt.dying) < 2) {
  //             return false
  //           }
  //           if (name === "jiu") {
  //             return 2.1
  //           }
  //           return 1.9
  //         }
  //         return player.getUseValue(card)
  //       }
  //       return 1
  //     },
  //     backup(links, player) {
  //       if (typeof links[1] === "number") {
  //         links.reverse()
  //       }
  //       const equip = links[0]
  //       const name = links[1][2]
  //       const nature = links[1][3]
  //       return {
  //         filterCard: () => false,
  //         selectCard: -1,
  //         equip: equip,
  //         viewAs: {
  //           name: name,
  //           nature: nature,
  //           isCard: true,
  //         },
  //         popname: true,
  //         log: false,
  //         precontent() {
  //           player.logSkill("youlong")
  //           player.disableEquip(lib.skill.youlong_backup.equip)
  //           player.addTempSkill("youlong_used", "roundStart")
  //           player.markAuto("youlong_used", [player.storage.youlong || false])
  //           player.changeZhuanhuanji("youlong")
  //           player.storage.youlong2.add(event.result.card.name)
  //         },
  //       }
  //     },
  //     prompt(links, player) {
  //       if (typeof links[1] === "number") {
  //         links.reverse()
  //       }
  //       const equip = `equip${links[0]}`
  //       const name = links[1][2]
  //       const nature = links[1][3]
  //       return (
  //         "废除自己的" +
  //         get.translation(equip) +
  //         "栏，视为使用" +
  //         (get.translation(nature) || "") +
  //         get.translation(name)
  //       )
  //     },
  //   },
  //   ai: {
  //     respondSha: true,
  //     respondShan: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (arg === "respond") {
  //         return false
  //       }
  //       if (
  //         !player.storage.youlong ||
  //         player.getStorage("youlong_used").includes(true)
  //       ) {
  //         return false
  //       }
  //       const name = tag === "respondSha" ? "sha" : "shan"
  //       return !player.storage.youlong2.includes(name)
  //     },
  //     order(item, player) {
  //       if (player && _status.event.type === "phase") {
  //         let max = 0,
  //           add = false
  //         const type = player.storage.youlong ? "basic" : "trick"
  //         let list = lib.inpile.filter(
  //           (name) =>
  //             get.type(name) === type &&
  //             !player.storage.youlong2.includes(name),
  //         )
  //         if (list.includes("sha")) {
  //           add = true
  //         }
  //         list = list.map((namex) => {
  //           return { name: namex, isCard: true }
  //         })
  //         if (add) {
  //           lib.inpile_nature.forEach((naturex) =>
  //             list.push({ name: "sha", nature: naturex, isCard: true }),
  //           )
  //         }
  //         for (const card of list) {
  //           if (player.getUseValue(card) > 0) {
  //             const temp = get.order(card)
  //             if (temp > max) {
  //               max = temp
  //             }
  //           }
  //         }
  //         if (max > 0) {
  //           max += 0.3
  //         }
  //         return max
  //       }
  //       return 1
  //     },
  //     result: {
  //       player(player) {
  //         if (_status.event.dying) {
  //           return get.attitude(player, _status.event.dying)
  //         }
  //         return 1
  //       },
  //     },
  //   },
  //   subSkill: { used: { charlotte: true, onremove: true } },
  // },
  // // 鸾凤

  // // 鸾凤
  // luanfeng: {
  //   audio: 2,
  //   trigger: { global: "dying" },
  //   filter(event, player) {
  //     return event.player.maxHp >= player.maxHp && event.player.hp < 1
  //   },
  //   limited: true,
  //   skillAnimation: true,
  //   animationColor: "soil",
  //   logTarget: "player",
  //   check(event, player) {
  //     if (get.attitude(player, event.player) < 4) {
  //       return false
  //     }
  //     if (
  //       player.countCards("h", (card) => {
  //         var mod2 = game.checkMod(
  //           card,
  //           player,
  //           "unchanged",
  //           "cardEnabled2",
  //           player,
  //         )
  //         if (mod2 !== "unchanged") {
  //           return mod2
  //         }
  //         var mod = game.checkMod(
  //           card,
  //           player,
  //           event.player,
  //           "unchanged",
  //           "cardSavable",
  //           player,
  //         )
  //         if (mod !== "unchanged") {
  //           return mod
  //         }
  //         var savable = get.info(card).savable
  //         if (typeof savable === "function") {
  //           savable = savable(card, player, event.player)
  //         }
  //         return savable
  //       }) >=
  //       1 - event.player.hp
  //     ) {
  //       return false
  //     }
  //     if (event.player === player || event.player === get.zhu(player)) {
  //       return true
  //     }
  //     return !player.hasUnknown()
  //   },
  //   content() {
  //     "step 0"
  //     player.awakenSkill(event.name)
  //     trigger.player.recover(3 - trigger.player.hp)
  //     ;("step 1")
  //     var list = [],
  //       target = trigger.player
  //     for (var i = 1; i < 6; i++) {
  //       for (var j = 0; j < target.countDisabledSlot(i); j++) {
  //         list.push(i)
  //       }
  //     }
  //     if (list.length > 0) {
  //       target.enableEquip(list)
  //     }
  //     if (list.length < 6) {
  //       target.drawTo(6 - list.length)
  //     }
  //     if (target.storage.kotarou_rewrite) {
  //       target.storage.kotarou_rewrite = []
  //     }
  //     if (player === target) {
  //       player.storage.youlong2 = []
  //     }
  //   },
  // },
  // // 谋关平
  // // 武威
  // wuwei: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable(skill, player) {
  //     return 1 + player.countMark("wuwei_count")
  //   },
  //   filter(event, player) {
  //     const colors = player
  //       .getCards("h")
  //       .reduce((list, card) => list.add(get.color(card)), [])
  //     return colors.some((color) =>
  //       event.filterCard(
  //         get.autoViewAs(
  //           lib.skill.wuwei.viewAs,
  //           player.getCards("h", { color: color }),
  //         ),
  //         player,
  //         event,
  //       ),
  //     )
  //   },
  //   viewAs: { name: "sha", storage: { wuwei: true } },
  //   locked: false,
  //   mod: {
  //     targetInRange(card) {
  //       if (card.storage?.wuwei) {
  //         return true
  //       }
  //     },
  //     cardUsable(card, player, num) {
  //       if (card.storage?.wuwei) {
  //         return Infinity
  //       }
  //     },
  //   },
  //   filterCard: () => false,
  //   selectCard: -1,
  //   async precontent(event, _, player) {
  //     let colors = player
  //         .getCards("h")
  //         .reduce((list, card) => list.add(get.color(card)), []),
  //       evt = event.getParent()
  //     colors = colors.filter((color) =>
  //       evt.filterCard(
  //         get.autoViewAs(
  //           lib.skill.wuwei.viewAs,
  //           player.getCards("h", { color: color }),
  //         ),
  //         player,
  //         evt,
  //       ),
  //     )
  //     colors = colors.map((color) => (color === "none" ? "none2" : color))
  //     const result = await player
  //       .chooseControl(colors, "cancel2")
  //       .set("prompt", "武威：将一种颜色的所有手牌当作【杀】使用")
  //       .set("ai", () => {
  //         const player = get.event().player
  //         const controls = get.event().controls.slice()
  //         controls.remove("cancel2")
  //         return controls.sort((a, b) => {
  //           return (
  //             player.countCards("h", { color: a === "none2" ? "none" : a }) -
  //             player.countCards("h", { color: b === "none2" ? "none" : b })
  //           )
  //         })[0]
  //       })
  //       .forResult()
  //     const color = result.control === "none2" ? "none" : result.control
  //     if (color === "cancel2") {
  //       evt.goto(0)
  //       return
  //     }
  //     player.addTempSkill("wuwei_effect")
  //     event.result.cards = player.getCards("h", { color: color })
  //     event.result.card.cards = player.getCards("h", { color: color })
  //     event.getParent().addCount = false
  //   },
  //   ai: {
  //     order(item, player) {
  //       return get.order({ name: "sha" }, player) - 0.001
  //     },
  //   },
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       trigger: { player: "useCard" },
  //       filter(event, player) {
  //         return event.card.storage?.wuwei && (event.cards || []).length
  //       },
  //       forced: true,
  //       popup: false,
  //       async content(event, trigger, player) {
  //         const func = () => {
  //           const event = get.event()
  //           const controls = [
  //             (link) => {
  //               const evt = get.event()
  //               if (evt.dialog?.buttons) {
  //                 for (let i = 0; i < evt.dialog.buttons.length; i++) {
  //                   const button = evt.dialog.buttons[i]
  //                   button.classList.remove("selectable")
  //                   button.classList.remove("selected")
  //                   const counterNode = button.querySelector(".caption")
  //                   if (counterNode) {
  //                     counterNode.childNodes[0].innerHTML = ``
  //                   }
  //                 }
  //                 ui.selected.buttons.length = 0
  //                 game.check()
  //               }
  //               return
  //             },
  //           ]
  //           event.controls = [
  //             ui.create.control(controls.concat(["清除选择", "stayleft"])),
  //           ]
  //         }
  //         if (event.isMine()) {
  //           func()
  //         } else if (event.isOnline()) {
  //           event.player.send(func)
  //         }
  //         const types = trigger.cards.reduce(
  //           (list, card) => list.add(get.type2(card, player)),
  //           [],
  //         )
  //         const result = await player
  //           .chooseButton([
  //             `武威：请选择${get.cnNumber(types.length)}次以下项`,
  //             [
  //               [
  //                 "摸一张牌",
  //                 "令目标角色本回合非锁定技失效",
  //                 "令本回合〖武威〗可发动次数+1",
  //               ].map((item, i) => [i, item]),
  //               "textbutton",
  //             ],
  //           ])
  //           .set("forced", true)
  //           .set("selectButton", [types.length, types.length + 1])
  //           .set("filterButton", (button) => {
  //             const selected = ui.selected.buttons.slice().map((i) => i.link)
  //             if (selected.length >= get.event().selectButton[0]) {
  //               return false
  //             }
  //             return button.link !== 1 || !selected.includes(1)
  //           })
  //           .set("ai", (button) => {
  //             const selected = ui.selected.buttons.slice().map((i) => i.link)
  //             if (get.event().selectButton >= 3) {
  //               return selected.includes(button.link) ? 0 : 1
  //             }
  //             return [0, 2, 1]
  //               .slice(0, get.event().selectButton)
  //               .includes(button.link)
  //               ? 1
  //               : 0
  //           })
  //           .set("custom", {
  //             add: {
  //               confirm(bool) {
  //                 if (bool !== true) {
  //                   return
  //                 }
  //                 const event = get.event().parent
  //                 if (event.controls) {
  //                   event.controls.forEach((i) => i.close())
  //                 }
  //                 if (ui.confirm) {
  //                   ui.confirm.close()
  //                 }
  //                 game.uncheck()
  //               },
  //               button() {
  //                 if (ui.selected.buttons.length) {
  //                   return
  //                 }
  //                 const event = get.event()
  //                 if (event.dialog?.buttons) {
  //                   for (let i = 0; i < event.dialog.buttons.length; i++) {
  //                     const button = event.dialog.buttons[i]
  //                     const counterNode = button.querySelector(".caption")
  //                     if (counterNode) {
  //                       counterNode.childNodes[0].innerHTML = ``
  //                     }
  //                   }
  //                 }
  //                 if (!ui.selected.buttons.length) {
  //                   const evt = event.parent
  //                   if (evt.controls) {
  //                     evt.controls[0].classList.add("disabled")
  //                   }
  //                 }
  //               },
  //             },
  //             replace: {
  //               button(button) {
  //                 const event = get.event()
  //                 if (!event.isMine() || !event.filterButton(button)) {
  //                   return
  //                 }
  //                 if (button.classList.contains("selectable") === false) {
  //                   return
  //                 }
  //                 button.classList.add("selected")
  //                 ui.selected.buttons.push(button)
  //                 let counterNode = button.querySelector(".caption")
  //                 const count = ui.selected.buttons.filter(
  //                   (i) => i === button,
  //                 ).length
  //                 if (counterNode) {
  //                   counterNode = counterNode.childNodes[0]
  //                   counterNode.innerHTML = `×${count}`
  //                 } else {
  //                   counterNode = ui.create.caption(
  //                     `<span style="font-family:xinwei; text-shadow:#FFF 0 0 4px, #FFF 0 0 4px, rgba(74,29,1,1) 0 0 3px;">×${count}</span>`,
  //                     button,
  //                   )
  //                 }
  //                 const evt = event.parent
  //                 if (evt.controls) {
  //                   evt.controls[0].classList.remove("disabled")
  //                 }
  //                 game.check()
  //               },
  //             },
  //           })
  //           .forResult()
  //         if (result.bool) {
  //           result.links.sort((a, b) => a - b)
  //           for (const i of result.links) {
  //             game.log(
  //               player,
  //               "选择了",
  //               "#g【武威】",
  //               "的",
  //               `#y第${get.cnNumber(i + 1, true)}项`,
  //             )
  //           }
  //           if (result.links.includes(0)) {
  //             await player.draw(
  //               result.links.filter((count) => count === 0).length,
  //             )
  //           }
  //           if (result.links.includes(1)) {
  //             for (const target of trigger.targets || []) {
  //               target.addTempSkill("wuwei_fengyin")
  //             }
  //           }
  //           if (result.links.includes(2)) {
  //             player.addTempSkill("wuwei_count")
  //             player.addMark(
  //               "wuwei_count",
  //               result.links.filter((count) => count === 2).length,
  //               false,
  //             )
  //           }
  //           if (
  //             Array.from({ length: 3 })
  //               .map((_, i) => i)
  //               .every((i) => result.links.includes(i))
  //           ) {
  //             trigger.baseDamage++
  //             game.log(trigger.card, "造成的伤害", "#y+1")
  //           }
  //         }
  //       },
  //     },
  //     count: {
  //       charlotte: true,
  //       onremove: true,
  //       intro: { content: "本回合〖武威〗可发动次数+#" },
  //     },
  //     fengyin: {
  //       inherit: "fengyin",
  //     },
  //   },
  // },
  // // 庞宏
  // // 评骘
  // pingzhi: {
  //   audio: 2,
  //   mark: true,
  //   zhuanhuanji: true,
  //   marktext: "☯",
  //   usable: 1,
  //   enable: "phaseUse",
  //   filterTarget(card, player, target) {
  //     return target.countCards("h")
  //   },
  //   intro: {
  //     content(storage) {
  //       return (
  //         "转换技，出牌阶段限一次，你可观看一名角色的手牌并展示其中一张牌，" +
  //         (storage
  //           ? "然后其使用此牌，若此牌造成伤害"
  //           : "你弃置此牌，然后其视为对你使用一张【火攻】，若其未因此造成伤害") +
  //         "则此技能视为未发动过。"
  //       )
  //     },
  //   },
  //   async content(event, trigger, player) {
  //     const target = event.targets[0]
  //     player.changeZhuanhuanji(event.name)
  //     const result = await player
  //       .choosePlayerCard(
  //         target,
  //         true,
  //         `请选择${get.translation(target)}一张手牌展示`,
  //         "visible",
  //         "h",
  //       )
  //       .set("ai", (button) => {
  //         const { player, target } = get.event(),
  //           { link } = button
  //         const att = get.attitude(player, target),
  //           storage = player.storage.pingzhi,
  //           huogong = get.autoViewAs({ name: "huogong", isCard: true })
  //         if (att > 0) {
  //           return storage ? 6 - get.value(link) : player.getUseValue(link)
  //         }
  //         return storage
  //           ? get.value(link) + get.effect(player, huogong, target, player) <
  //               0 &&
  //             !player.hasCard((card) => get.suit(card) === get.suit(link))
  //             ? 2
  //             : 0
  //           : -target.getUseValue(link)
  //       })
  //       .forResult()
  //     if (!result?.cards?.length) {
  //       return
  //     }
  //     const { cards } = result
  //     player.addTempSkill(`${event.name}_check`, "phaseUseAfter")
  //     await player.showCards(
  //       cards,
  //       `${get.translation(player)}对${get.translation(target)}发动了【评骘】`,
  //     )
  //     if (player.storage[event.name]) {
  //       await target.modedDiscard(cards, player)
  //       const huogong = get.autoViewAs({ name: "huogong", isCard: true })
  //       if (target.canUse(huogong, player, false)) {
  //         await target.useCard(huogong, player, false)
  //       } else if (player.getStat("skill")[event.name]) {
  //         delete player.getStat("skill")[event.name]
  //         game.log(player, "重置了", "#g【评骘】")
  //       }
  //     } else if (target.hasUseTarget(cards[0])) {
  //       await target.chooseUseTarget(cards[0], true, false)
  //     }
  //   },
  //   ai: {
  //     order(item, player) {
  //       const storage = player.storage.pingzhi
  //       if (!storage) {
  //         return game.hasPlayer(
  //           (current) =>
  //             get.effect(current, { name: "guohe_copy2" }, player, player) +
  //               get.effect(player, { name: "huogong" }, current, player) >
  //             0,
  //         )
  //           ? 10
  //           : 1
  //       }
  //       return game.hasPlayer(
  //         (current) =>
  //           get.effect(current, { name: "guohe_copy2" }, player, player) > 0 ||
  //           (current.hasCard((card) => current.hasValueTarget(card) > 0, "h") &&
  //             get.attitude(player, current) > 0),
  //       )
  //         ? 10
  //         : 1
  //     },
  //     result: {
  //       target(player, target) {
  //         const storage = player.storage.pingzhi
  //         if (!storage) {
  //           return !player.countCards("h") ||
  //             get.effect(target, { name: "guohe_copy2" }, player, player) +
  //               get.effect(player, { name: "huogong" }, target, player) >
  //               0
  //             ? -1
  //             : 0
  //         }
  //         return get.attitude(player, target) > 0 &&
  //           target.hasCard((card) => target.hasValueTarget(card) > 0, "h")
  //           ? 1
  //           : get.effect(target, { name: "guohe_copy2" }, player, player)
  //       },
  //     },
  //   },
  //   subSkill: {
  //     check: {
  //       trigger: { global: "useCardAfter" },
  //       filter(event, player) {
  //         if (!player.getStat().skill.pingzhi) {
  //           return false
  //         }
  //         if (player.storage.pingzhi) {
  //           return (
  //             event.getParent().name === "pingzhi" &&
  //             !game.hasPlayer2((current) =>
  //               current.hasHistory(
  //                 "damage",
  //                 (evtx) => evtx.card === event.card,
  //               ),
  //             )
  //           )
  //         }
  //         return (
  //           event.getParent(2).name === "pingzhi" &&
  //           game.hasPlayer2((current) =>
  //             current.hasHistory("damage", (evtx) => evtx.card === event.card),
  //           )
  //         )
  //       },
  //       charlotte: true,
  //       silent: true,
  //       async content(event, trigger, player) {
  //         delete player.getStat("skill").pingzhi
  //         game.log(player, "重置了", "#g【评骘】")
  //       },
  //     },
  //   },
  // },
  // // 刚简
  // gangjian: {
  //   audio: 2,
  //   trigger: {
  //     global: "phaseAfter",
  //   },
  //   forced: true,
  //   filter(event, player) {
  //     if (player.getHistory("damage").length) {
  //       return false
  //     }
  //     let num = 0
  //     game
  //       .getGlobalHistory("everything", (evt) => {
  //         return evt.name === "showCards" && evt.cards.length
  //       })
  //       .forEach((evt) => {
  //         num += evt.cards.length
  //       })
  //     return num > 0
  //   },
  //   async content(event, trigger, player) {
  //     let num = 0
  //     game
  //       .getGlobalHistory("everything", (evt) => {
  //         return evt.name === "showCards" && evt.cards.length
  //       })
  //       .forEach((evt) => {
  //         num += evt.cards.length
  //       })
  //     await player.draw(Math.min(num, 5))
  //   },
  // },
  // // 邓芝
  // // 简亮
  // jianliang: {
  //   audio: 2,
  //   trigger: { player: "phaseDrawBegin2" },
  //   filter(event, player) {
  //     return !player.isMaxHandcard()
  //   },
  //   direct: true,
  //   async content(event, trigger, player) {
  //     const result = await player
  //       .chooseTarget(
  //         get.prompt("jianliang"),
  //         "令至多两名角色各摸一张牌",
  //         [1, 2],
  //       )
  //       .set("ai", (target) => {
  //         return (
  //           Math.sqrt(5 - Math.min(4, target.countCards("h"))) *
  //           get.attitude(_status.event.player, target)
  //         )
  //       })
  //       .forResult()
  //     if (result.bool) {
  //       const targets = result.targets.sortBySeat()
  //       player.logSkill("jianliang", targets)
  //       if (targets.length === 1) {
  //         await targets[0].draw()
  //       } else {
  //         await game.asyncDraw(targets)
  //       }
  //     }
  //     game.delayx()
  //   },
  // },
  // // 危盟
  // weimeng: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filterTarget(card, player, target) {
  //     return (
  //       player.hp > 0 &&
  //       target !== player &&
  //       target.countGainableCards(player, "h") > 0
  //     )
  //   },
  //   async content(event, trigger, player) {
  //     const { target } = event
  //     let result
  //     let num

  //     // step 0
  //     result = await player
  //       .gainPlayerCard(target, "h", true, [1, player.hp])
  //       .forResult()
  //     // step 1
  //     if (result.bool && target.isIn()) {
  //       num = result.cards.length
  //       const hs = player.getCards("he")
  //       let numx = 0
  //       for (const i of result.cards) {
  //         numx += get.number(i, player)
  //       }
  //       event.num = numx
  //       event.cards = result.cards
  //       if (!hs.length) {
  //         return
  //       }
  //       if (hs.length <= num) {
  //         result = { bool: true, cards: hs }
  //       } else {
  //         result = await player
  //           .chooseCard(
  //             "he",
  //             true,
  //             `选择交给${get.translation(target)}${get.cnNumber(num)}张牌`,
  //             `（已得到牌的点数和：${numx}）`,
  //             num,
  //           )
  //           .forResult()
  //       }
  //     } else {
  //       return
  //     }
  //     // step 2
  //     await player.give(result.cards, target)
  //     let numx = 0
  //     for (const i of result.cards) {
  //       numx += get.number(i, player)
  //     }
  //     if (numx > num) {
  //       await player.draw()
  //     } else if (numx < num) {
  //       await player.discardPlayerCard(target, true, "hej")
  //     }
  //   },
  //   ai: {
  //     order: 6,
  //     tag: {
  //       lose: 1,
  //       loseCard: 1,
  //       gain: 1,
  //     },
  //     result: {
  //       target(player, target) {
  //         return -(Math.min(player.hp, target.countCards("h")) ** 2) / 4
  //       },
  //     },
  //   },
  // },
  // // 胡金定
  // // 轻缘
  // qingyuan: {
  //   audio: 2,
  //   trigger: {
  //     global: ["phaseBefore", "gainAfter", "loseAsyncAfter"],
  //     player: ["enterGame", "damageEnd"],
  //   },
  //   filter(event, player) {
  //     const storage = player.getStorage("qingyuan")
  //     if (event.name === "gain" || event.name === "loseAsync") {
  //       if (player.hasSkill("qingyuan_used")) {
  //         return false
  //       }
  //       return (
  //         storage.some((target) => event.getg(target).length) &&
  //         storage.some((target) =>
  //           target.hasCard(
  //             (card) => lib.filter.canBeGained(card, target, player),
  //             "h",
  //           ),
  //         )
  //       )
  //     }
  //     if (
  //       !game.hasPlayer(
  //         (target) => !storage.includes(target) && target !== player,
  //       )
  //     ) {
  //       return false
  //     }
  //     if (
  //       event.name === "damage" &&
  //       player.getAllHistory("damage").indexOf(event) !== 0
  //     ) {
  //       return false
  //     }
  //     return event.name !== "phase" || game.phaseNumber === 0
  //   },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     if (trigger.name === "gain" || trigger.name === "loseAsync") {
  //       const target = player
  //         .getStorage("qingyuan")
  //         .filter((target) =>
  //           target.hasCard(
  //             (card) => lib.filter.canBeGained(card, target, player),
  //             "h",
  //           ),
  //         )
  //         .randomGet()
  //       player.line(target)
  //       player.addTempSkill("qingyuan_used")
  //       player.gain(
  //         target
  //           .getCards("h", (card) => {
  //             return lib.filter.canBeGained(card, target, player)
  //           })
  //           .randomGet(),
  //         target,
  //         "giveAuto",
  //       )
  //     } else {
  //       const filterTarget = (card, player, target) => {
  //           return (
  //             target !== player &&
  //             !player.getStorage("qingyuan").includes(target)
  //           )
  //         },
  //         targetsx = game.filterPlayer((current) =>
  //           filterTarget(null, player, current),
  //         )
  //       let result
  //       if (targetsx.length === 1) {
  //         result = { bool: true, targets: targetsx }
  //       } else {
  //         result = await player
  //           .chooseTarget(filterTarget, true)
  //           .set(
  //             "prompt2",
  //             "每回合限一次，当你以此法选择的角色获得牌后，你随机获得其中一名角色的一张手牌",
  //           )
  //           .set("prompt", "请选择【轻缘】的目标")
  //           .set("ai", (target) => {
  //             const player = get.event().player
  //             return get.effect(
  //               target,
  //               new lib.element.VCard({ name: "shunshou_copy2" }),
  //               player,
  //               player,
  //             )
  //           })
  //           .forResult()
  //       }
  //       if (result.bool) {
  //         const target = result.targets[0]
  //         player.line(target)
  //         game.log(player, "选择了", target)
  //         player.markAuto("qingyuan", [target])
  //       }
  //     }
  //   },
  //   subSkill: { used: { charlotte: true } },
  //   intro: { content: "已选择$为目标" },
  //   ai: {
  //     expose: 0.3,
  //   },
  // },
  // // 重身
  // chongshen: {
  //   audio: 2,
  //   locked: false,
  //   enable: "chooseToUse",
  //   filterCard(card) {
  //     return (
  //       get.itemtype(card) === "card" &&
  //       card.hasGaintag("chongshen") &&
  //       get.color(card) === "red"
  //     )
  //   },
  //   position: "h",
  //   viewAs: { name: "shan" },
  //   viewAsFilter(player) {
  //     if (
  //       !player.countCards(
  //         "h",
  //         (card) => card.hasGaintag("chongshen") && get.color(card) === "red",
  //       )
  //     ) {
  //       return false
  //     }
  //   },
  //   prompt: "将本轮得到的红色牌当作【闪】使用",
  //   check(card) {
  //     return 7 - get.value(card)
  //   },
  //   ai: {
  //     order: 2,
  //     respondShan: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (
  //         arg === "respond" ||
  //         !player.countCards(
  //           "h",
  //           (card) =>
  //             _status.connectMode ||
  //             (card.hasGaintag("chongshen") && get.color(card) === "red"),
  //         )
  //       ) {
  //         return false
  //       }
  //     },
  //     effect: {
  //       target(card, player, target, current) {
  //         if (get.tag(card, "respondShan") && current < 0) {
  //           return 0.6
  //         }
  //       },
  //     },
  //   },
  //   group: "chongshen_mark",
  //   mod: {
  //     aiValue(player, card, num) {
  //       if (
  //         get.name(card) !== "shan" &&
  //         get.itemtype(card) === "card" &&
  //         (!card.hasGaintag("chongshen") || get.color(card) !== "red")
  //       ) {
  //         return
  //       }
  //       const cards = player.getCards(
  //         "hs",
  //         (card) => get.name(card) === "shan" || card.hasGaintag("chongshen"),
  //       )
  //       cards.sort(
  //         (a, b) =>
  //           (get.name(b) === "shan" ? 1 : 2) - (get.name(a) === "shan" ? 1 : 2),
  //       )
  //       const geti = () => {
  //         if (cards.includes(card)) {
  //           return cards.indexOf(card)
  //         }
  //         return cards.length
  //       }
  //       if (get.name(card) === "shan") {
  //         return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6
  //       }
  //       return Math.max(num, [6.5, 4, 3][Math.min(geti(), 2)])
  //     },
  //     aiUseful() {
  //       return lib.skill.chongshen.mod.aiValue.apply(this, arguments)
  //     },
  //     // ignoredHandcard(card,player){
  //     // 	if(card.hasGaintag('chongshen')) return true;
  //     // },
  //     // cardDiscardable(card,player,name){
  //     // 	if(name=='phaseDiscard'&&card.hasGaintag('chongshen')) return false;
  //     // },
  //   },
  //   init(player) {
  //     if (game.phaseNumber > 0) {
  //       const hs = player.getCards("h"),
  //         history = player.getAllHistory()
  //       let cards = []
  //       for (let i = history.length - 1; i >= 0; i--) {
  //         for (const evt of history[i].gain) {
  //           cards.addArray(evt.cards)
  //         }
  //         if (history[i].isRound) {
  //           break
  //         }
  //       }
  //       cards = cards.filter((i) => hs.includes(i))
  //       if (cards.length) {
  //         player.addGaintag(cards, "chongshen")
  //       }
  //     }
  //   },
  //   onremove(player) {
  //     player.removeGaintag("chongshen")
  //   },
  //   subSkill: {
  //     mark: {
  //       charlotte: true,
  //       trigger: { player: "gainBegin", global: "roundStart" },
  //       filter(event, player) {
  //         return event.name === "gain" || game.roundNumber > 1
  //       },
  //       forced: true,
  //       popup: false,
  //       content() {
  //         if (trigger.name === "gain") {
  //           trigger.gaintag.add("chongshen")
  //         } else {
  //           player.removeGaintag("chongshen")
  //         }
  //       },
  //     },
  //   },
  // },
  // // 吴班
  // // 诱战
  // youzhan: {
  //   audio: 2,
  //   trigger: {
  //     global: [
  //       "loseAfter",
  //       "equipAfter",
  //       "addJudgeAfter",
  //       "gainAfter",
  //       "loseAsyncAfter",
  //       "addToExpansionAfter",
  //     ],
  //   },
  //   forced: true,
  //   direct: true,
  //   filter(event, player) {
  //     if (player !== _status.currentPhase) {
  //       return false
  //     }
  //     return game.hasPlayer((current) => {
  //       if (current === player) {
  //         return false
  //       }
  //       var evt = event.getl(current)
  //       return evt?.cards2.length
  //     })
  //   },
  //   async content(event, trigger, player) {
  //     const targets = game.filterPlayer((current) => {
  //       if (current === player) {
  //         return false
  //       }
  //       const evt = trigger.getl(current)
  //       return evt?.cards2.length
  //     })
  //     player.logSkill("youzhan", targets)
  //     for (const target of targets) {
  //       let num = trigger.getl(target).cards2.length
  //       while (num > 0) {
  //         const next = player.draw()
  //         next.gaintag = ["youzhan"]
  //         await next
  //         player.addTempSkill("youzhan_limit")
  //         target.addTempSkill("youzhan_effect")
  //         target.addMark("youzhan_effect", 1, false)
  //         target.addTempSkill("youzhan_draw")
  //         --num
  //       }
  //     }
  //   },
  //   ai: {
  //     damageBonus: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (!arg?.target?.hasSkill("youzhan_effect")) {
  //         return false
  //       }
  //     },
  //   },
  //   subSkill: {
  //     effect: {
  //       audio: "youzhan",
  //       trigger: {
  //         player: "damageBegin3",
  //       },
  //       filter(event, player) {
  //         return player.hasMark("youzhan_effect")
  //       },
  //       forced: true,
  //       charlotte: true,
  //       onremove: true,
  //       async content(event, trigger, player) {
  //         trigger.num += player.countMark("youzhan_effect")
  //         player.removeSkill("youzhan_effect")
  //       },
  //       mark: true,
  //       intro: {
  //         content: "本回合下一次受到的伤害+#",
  //       },
  //       ai: {
  //         effect: {
  //           target(card, player, target) {
  //             if (get.tag(card, "damage")) {
  //               return 1 + 0.5 * target.countMark("youzhan_effect")
  //             }
  //           },
  //         },
  //       },
  //     },
  //     draw: {
  //       trigger: {
  //         global: "phaseJieshuBegin",
  //       },
  //       forced: true,
  //       charlotte: true,
  //       filter(event, player) {
  //         return !player.getHistory("damage").length
  //       },
  //       async content(event, trigger, player) {
  //         await player.draw({
  //           num: Math.min(3, player.getHistory("lose").length),
  //         })
  //       },
  //     },
  //     limit: {
  //       charlotte: true,
  //       onremove(player) {
  //         player.removeGaintag("youzhan")
  //       },
  //       mod: {
  //         ignoredHandcard(card, player) {
  //           if (card.hasGaintag("youzhan")) {
  //             return true
  //           }
  //         },
  //         cardDiscardable(card, player, name) {
  //           if (name === "phaseDiscard" && card.hasGaintag("youzhan")) {
  //             return false
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // // 秦宓
  // // 专对
  // zhuandui: {
  //   audio: 2,
  //   group: ["zhuandui_respond", "zhuandui_use"],
  //   subSkill: {
  //     use: {
  //       audio: "zhuandui",
  //       trigger: { player: "useCardToPlayered" },
  //       check(event, player) {
  //         return get.attitude(player, event.target) < 0
  //       },
  //       filter(event, player) {
  //         return event.card.name === "sha" && player.canCompare(event.target)
  //       },
  //       logTarget: "target",
  //       content() {
  //         "step 0"
  //         player.chooseToCompare(trigger.target)
  //         ;("step 1")
  //         if (result.bool) {
  //           trigger.getParent().directHit.add(trigger.target)
  //         }
  //       },
  //     },
  //     respond: {
  //       audio: "zhuandui",
  //       trigger: { target: "useCardToTargeted" },
  //       check(event, player) {
  //         return get.effect(player, event.card, event.player, player) < 0
  //       },
  //       filter(event, player) {
  //         return event.card.name === "sha" && player.canCompare(event.player)
  //       },
  //       logTarget: "player",
  //       content() {
  //         "step 0"
  //         player.chooseToCompare(trigger.player)
  //         ;("step 1")
  //         if (result.bool) {
  //           trigger.getParent().excluded.add(player)
  //         }
  //       },
  //     },
  //   },
  //   ai: {
  //     directHit_ai: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (player._zhuandui_temp || tag !== "directHit_ai") {
  //         return false
  //       }
  //       player._zhuandui_temp = true
  //       var bool = (() => {
  //         if (
  //           arg.card.name !== "sha" ||
  //           get.attitude(player, arg.target) >= 0 ||
  //           !arg.target.countCards("h")
  //         ) {
  //           return false
  //         }
  //         if (
  //           arg.target.countCards("h") === 1 &&
  //           (!arg.target.hasSkillTag(
  //             "freeShan",
  //             false,
  //             {
  //               player: player,
  //               card: arg.card,
  //               type: "use",
  //             },
  //             true,
  //           ) ||
  //             player.hasSkillTag("unequip", false, {
  //               name: arg.card ? arg.card.name : null,
  //               target: arg.target,
  //               card: arg.card,
  //             }) ||
  //             player.hasSkillTag("unequip_ai", false, {
  //               name: arg.card ? arg.card.name : null,
  //               target: arg.target,
  //               card: arg.card,
  //             }))
  //         ) {
  //           return true
  //         }
  //         return (
  //           player.countCards(
  //             "h",
  //             (card) =>
  //               card !== arg.card &&
  //               !arg.card.cards?.includes(card) &&
  //               get.value(card) <= 4 &&
  //               (get.number(card) >= 11 + arg.target.countCards("h") / 2 ||
  //                 get.suit(card, player) === "heart"),
  //           ) > 0
  //         )
  //       })()
  //       delete player._zhuandui_temp
  //       return bool
  //     },
  //     effect: {
  //       target_use(card, player, target, current) {
  //         if (card.name === "sha" && current < 0) {
  //           return 0.7
  //         }
  //       },
  //     },
  //   },
  // },
  // // 谏征
  // jianzheng: {
  //   audio: 2,
  //   trigger: { global: "useCardToPlayer" },
  //   filter(event, player) {
  //     if (!player.countCards("h")) {
  //       return false
  //     }
  //     return (
  //       event.player !== player &&
  //       event.card.name === "sha" &&
  //       !event.targets.includes(player) &&
  //       event.player.inRange(player)
  //     )
  //   },
  //   async cost(event, trigger, player) {
  //     const { targets, player: playerx, card } = trigger
  //     let effect = 0
  //     for (let i = 0; i < targets.length; i++) {
  //       effect -= get.effect(targets[i], card, playerx, player)
  //     }
  //     if (effect > 0) {
  //       if (get.color(card) !== "black") {
  //         effect = 0
  //       } else {
  //         effect = 1
  //       }
  //       if (targets.length === 1) {
  //         if (targets[0].hp === 1) {
  //           effect++
  //         }
  //         if (
  //           effect > 0 &&
  //           targets[0].countCards("h") < player.countCards("h")
  //         ) {
  //           effect++
  //         }
  //       }
  //       if (effect > 0) {
  //         effect += 6
  //       }
  //     }
  //     event.result = await player
  //       .chooseCard("h", get.prompt2(event.skill, playerx))
  //       .set("ai", (card) => {
  //         if (_status.event.effect >= 0) {
  //           const val = get.value(card)
  //           if (val < 0) {
  //             return 10 - val
  //           }
  //           return _status.event.effect - val
  //         }
  //         return 0
  //       })
  //       .set("effect", effect)
  //       .forResult()
  //   },
  //   logTarget: "player",
  //   async content(event, trigger, player) {
  //     const {
  //       cards: [card],
  //     } = event
  //     game.log(player, "将", card, "置于牌堆顶")
  //     player.$throw(card, 1000)
  //     await player.lose(card, ui.cardPile, "visible", "insert")
  //     trigger.targets.length = 0
  //     trigger.getParent().triggeredTargets1.length = 0
  //     if (get.color(trigger.card) !== "black") {
  //       trigger.getParent().targets.push(player)
  //       trigger.player.line(player)
  //       await game.delay()
  //     }
  //   },
  //   ai: {
  //     threaten: 1.1,
  //     expose: 0.25,
  //   },
  // },
  // // 天辩
  // tianbian: {
  //   audio: 2,
  //   enable: "chooseCard",
  //   check(event, player) {
  //     var player = _status.event.player
  //     return !player.hasCard((card) => {
  //       var val = get.value(card)
  //       return (
  //         val < 0 ||
  //         (val <= 4 && (get.number(card) >= 11 || get.suit(card) === "heart"))
  //       )
  //     }, "h")
  //       ? 20
  //       : 0
  //   },
  //   filter(event) {
  //     return event.type === "compare" && !event.directresult
  //   },
  //   onCompare(player) {
  //     return game.cardsGotoOrdering(get.cards()).cards
  //   },
  //   ai: {
  //     forceWin: true,
  //     skillTagFilter(player, tag, arg) {
  //       return arg.card && get.suit(arg.card, false) === "heart"
  //     },
  //   },
  //   group: "tianbian_number",
  //   subSkill: {
  //     number: {
  //       trigger: { player: "compare", target: "compare" },
  //       filter(event, player) {
  //         if (event.player === player) {
  //           return !event.iwhile && get.suit(event.card1) === "heart" //&&event.card1.vanishtag.includes('tianbian');
  //         }
  //         return get.suit(event.card2) === "heart" //&&event.card2.vanishtag.includes('tianbian');
  //       },
  //       silent: true,
  //       async content(event, trigger, player) {
  //         game.log(player, "拼点牌点数视为", "#yK")
  //         if (player === trigger.player) {
  //           trigger.num1 = 13
  //         } else {
  //           trigger.num2 = 13
  //         }
  //       },
  //     },
  //   },
  // },
  // jx_benxi: {
  //   group: ["jx_benxi_summer", "jx_benxi_damage"],
  //   audio: 2,
  //   trigger: {
  //     player: "useCard2",
  //   },
  //   forced: true,
  //   mod: {
  //     globalFrom(from, to, distance) {
  //       if (_status.currentPhase === from) {
  //         return distance - from.storage.jx_benxi
  //       }
  //     },
  //     wuxieRespondable(card, player, target, current) {
  //       if (
  //         player !== current &&
  //         player.storage.jx_benxi_directHit.includes(card)
  //       ) {
  //         return false
  //       }
  //     },
  //   },
  //   init(player) {
  //     player.storage.jx_benxi_directHit = []
  //     player.storage.jx_benxi_damage = []
  //     player.storage.jx_benxi_unequip = []
  //     player.storage.jx_benxi = 0
  //   },
  //   filter(trigger, player) {
  //     return (
  //       _status.currentPhase === player &&
  //       trigger.targets &&
  //       trigger.targets.length === 1 &&
  //       (get.name(trigger.card) === "sha" ||
  //         get.type(trigger.card) === "trick") &&
  //       !game.hasPlayer((current) => get.distance(player, current) > 1)
  //     )
  //   },
  //   filterx(event, player) {
  //     var info = get.info(event.card)
  //     if (info.allowMultiple === false) {
  //       return false
  //     }
  //     if (event.targets && !info.multitarget) {
  //       if (
  //         game.hasPlayer(
  //           (current) =>
  //             lib.filter.targetEnabled2(event.card, player, current) &&
  //             !event.targets.includes(current),
  //         )
  //       ) {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   content() {
  //     "step 0"
  //     var list = [
  //         "为XXX多选择一个目标",
  //         "　令XXX无视防具牌　",
  //         "　令XXX不可被抵消　",
  //         "当XXX造成伤害时摸牌",
  //       ],
  //       card = get.translation(trigger.card)
  //     for (var i = 0; i < list.length; i++) {
  //       list[i] = [i, list[i].replace(/XXX/g, card)]
  //     }
  //     var next = player.chooseButton([
  //       "奔袭：请选择一至两项",
  //       [list.slice(0, 2), "tdnodes"],
  //       [list.slice(2, 4), "tdnodes"],
  //     ])
  //     next.set("forced", true)
  //     next.set("selectButton", [1, 2])
  //     next.set("filterButton", (button) => {
  //       if (button.link === 0) {
  //         return _status.event.bool1
  //       }
  //       return true
  //     })
  //     next.set("bool1", lib.skill.jx_benxi.filterx(trigger, player))
  //     next.set("ai", (button) => {
  //       var player = _status.event.player
  //       var event = _status.event.getTrigger()
  //       switch (button.link) {
  //         case 0: {
  //           if (
  //             game.hasPlayer(
  //               (current) =>
  //                 lib.filter.targetEnabled2(event.card, player, current) &&
  //                 !event.targets.includes(current) &&
  //                 get.effect(current, event.card, player, player) > 0,
  //             )
  //           ) {
  //             return 1.6 + Math.random()
  //           }
  //           return 0
  //         }
  //         case 1: {
  //           if (
  //             event.targets.filter((current) => {
  //               var eff1 = get.effect(current, event.card, player, player)
  //               player._jx_benxi_ai = true
  //               var eff2 = get.effect(current, event.card, player, player)
  //               delete player._jx_benxi_ai
  //               return eff1 > eff2
  //             }).length
  //           ) {
  //             return 1.9 + Math.random()
  //           }
  //           return Math.random()
  //         }
  //         case 2: {
  //           var num = 1.3
  //           if (
  //             event.card.name === "sha" &&
  //             event.targets.filter((current) => {
  //               if (
  //                 current.mayHaveShan(player, "use") &&
  //                 get.attitude(player, current) <= 0
  //               ) {
  //                 if (current.hasSkillTag("useShan", null, "use")) {
  //                   num = 1.9
  //                 }
  //                 return true
  //               }
  //               return false
  //             }).length
  //           ) {
  //             return num + Math.random()
  //           }
  //           return 0.5 + Math.random()
  //         }
  //         case 3: {
  //           return (get.tag(event.card, "damage") || 0) + Math.random()
  //         }
  //       }
  //     })
  //     ;("step 1")
  //     var map = [
  //       (trigger, player, event) => {
  //         player
  //           .chooseTarget(
  //             `请选择${get.translation(trigger.card)}的额外目标`,
  //             true,
  //             (card, player, target) => {
  //               var player = _status.event.player
  //               if (_status.event.targets.includes(target)) {
  //                 return false
  //               }
  //               return lib.filter.targetEnabled2(
  //                 _status.event.card,
  //                 player,
  //                 target,
  //               )
  //             },
  //           )
  //           .set("targets", trigger.targets)
  //           .set("card", trigger.card)
  //           .set("ai", (target) => {
  //             var trigger = _status.event.getTrigger()
  //             var player = _status.event.player
  //             return get.effect(target, trigger.card, player, player)
  //           })
  //       },
  //       (trigger, player, event) => {
  //         player.storage.jx_benxi_unequip.add(trigger.card)
  //       },
  //       (trigger, player, event) => {
  //         player.storage.jx_benxi_directHit.add(trigger.card)
  //         trigger.nowuxie = true
  //         trigger.customArgs.default.directHit2 = true
  //       },
  //       (trigger, player, event) => {
  //         player.storage.jx_benxi_damage.add(trigger.card)
  //       },
  //     ]
  //     for (var i = 0; i < result.links.length; i++) {
  //       game.log(
  //         player,
  //         "选择了",
  //         "#g【奔袭】",
  //         "的",
  //         `#y选项${get.cnNumber(result.links[i] + 1, true)}`,
  //       )
  //       map[result.links[i]](trigger, player, event)
  //     }
  //     if (!result.links.includes(0)) {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     if (result.targets) {
  //       player.line(result.targets)
  //       trigger.targets.addArray(result.targets)
  //     }
  //   },
  //   ai: {
  //     unequip: true,
  //     unequip_ai: true,
  //     directHit_ai: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (tag === "unequip") {
  //         if (arg && player.storage.jx_benxi_unequip.includes(arg.card)) {
  //           return true
  //         }
  //         return false
  //       }
  //       if (
  //         _status.currentPhase !== player ||
  //         game.hasPlayer((current) => get.distance(player, current) > 1)
  //       ) {
  //         return false
  //       }
  //       if (tag === "directHit_ai") {
  //         return arg.card.name === "sha"
  //       }
  //       if (
  //         !arg?.card ||
  //         (arg.card.name !== "sha" && arg.card.name !== "chuqibuyi")
  //       ) {
  //         return false
  //       }
  //       var card = arg.target.getEquip(2)
  //       if (card && card.name.indexOf("bagua") !== -1) {
  //         return true
  //       }
  //       if (player._jx_benxi_ai) {
  //         return false
  //       }
  //     },
  //   },
  //   subSkill: {
  //     damage: {
  //       sub: true,
  //       trigger: { global: "damageBegin1" },
  //       audio: "jx_benxi",
  //       forced: true,
  //       filter(event, player) {
  //         return (
  //           event.card && player.storage.jx_benxi_damage.includes(event.card)
  //         )
  //       },
  //       content() {
  //         player.draw()
  //       },
  //     },
  //     summer: {
  //       sub: true,
  //       trigger: { player: ["phaseAfter", "useCardAfter", "useCard"] },
  //       silent: true,
  //       filter(event, player) {
  //         return player === _status.currentPhase
  //       },
  //       content() {
  //         if (trigger.name === "phase") {
  //           player.storage.jx_benxi = 0
  //           return
  //         }
  //         if (event.triggername === "useCard") {
  //           player.logSkill("jx_benxi")
  //           player.storage.jx_benxi++
  //           player.syncStorage("jx_benxi")
  //           return
  //         }
  //         player.storage.jx_benxi_unequip.remove(event.card)
  //         player.storage.jx_benxi_directHit.remove(event.card)
  //         player.storage.jx_benxi_damage.remove(event.card)
  //       },
  //     },
  //   },
  // },
  // // 界张松
  // // 强识
  // qiangzhi: {
  //   audio: 2,
  //   audioname: ["re_zhangsong"],
  //   trigger: { player: "phaseUseBegin" },
  //   direct: true,
  //   filter(event, player) {
  //     return game.hasPlayer(
  //       (current) => current !== player && current.countCards("h") > 0,
  //     )
  //   },
  //   subfrequent: ["draw"],
  //   content() {
  //     "step 0"
  //     player
  //       .chooseTarget(
  //         get.prompt2("qiangzhi"),
  //         (card, player, target) =>
  //           target !== player && target.countCards("h") > 0,
  //       )
  //       .set("ai", () => Math.random())
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       event.target = target
  //       player.logSkill("qiangzhi", target)
  //       player.choosePlayerCard(target, "h", true)
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     var card = result.cards[0]
  //     target.showCards(card, `${get.translation(target)}因【强识】展示`)
  //     player.storage.qiangzhi_draw = get.type(card, "trick")
  //     game.addVideo("storage", player, [
  //       "qiangzhi_draw",
  //       player.storage.qiangzhi_draw,
  //     ])
  //     player.addTempSkill("qiangzhi_draw", "phaseUseEnd")
  //   },
  // },
  // qiangzhi_draw: {
  //   trigger: { player: "useCard" },
  //   frequent: true,
  //   popup: false,
  //   charlotte: true,
  //   prompt: "是否执行【强识】的效果摸一张牌？",
  //   sourceSkill: "qiangzhi",
  //   filter(event, player) {
  //     return get.type(event.card, "trick") === player.storage.qiangzhi_draw
  //   },
  //   content() {
  //     player.draw("nodelay")
  //   },
  //   onremove: true,
  //   mark: true,
  //   intro: {
  //     content(type) {
  //       return `${get.translation(type)}牌`
  //     },
  //   },
  // },
  // // 献图
  // rexiantu: {
  //   audio: 2,
  //   trigger: { global: "phaseUseBegin" },
  //   filter(event, player) {
  //     return event.player !== player
  //   },
  //   logTarget: "player",
  //   check(event, player) {
  //     if (get.attitude(_status.event.player, event.player) < 1) {
  //       return false
  //     }
  //     return (
  //       player.hp > 1 ||
  //       player.hasCard(
  //         (card) =>
  //           (get.name(card) === "tao" || get.name(card) === "jiu") &&
  //           lib.filter.cardEnabled(card, player),
  //         "hs",
  //       )
  //     )
  //   },
  //   async content(event, trigger, player) {
  //     if (get.mode() !== "identity" || player.identity !== "nei") {
  //       player.addExpose(0.2)
  //     }
  //     await player.draw(2)
  //     if (!player.countCards("he")) {
  //       return
  //     }
  //     const result = await player
  //       .chooseCard(
  //         2,
  //         "he",
  //         true,
  //         `交给${get.translation(trigger.player)}两张牌`,
  //       )
  //       .set("ai", (card) => {
  //         if (
  //           ui.selected.cards.length &&
  //           card.name === ui.selected.cards[0].name
  //         ) {
  //           return -1
  //         }
  //         if (get.tag(card, "damage")) {
  //           return 1
  //         }
  //         if (get.type(card) === "equip") {
  //           return 1
  //         }
  //         return 0
  //       })
  //       .forResult()
  //     if (result?.cards?.length) {
  //       const target = trigger.player
  //       await player.give(result.cards, target)
  //       target.addTempSkill("rexiantu_check", "phaseUseAfter")
  //       target.markAuto("rexiantu_check", [player])
  //     }
  //   },
  //   ai: {
  //     threaten(player, target) {
  //       return (
  //         1 +
  //         game.countPlayer((current) => {
  //           if (current !== target && get.attitude(target, current) > 0) {
  //             return 0.5
  //           }
  //           return 0
  //         })
  //       )
  //     },
  //     expose: 0.3,
  //   },
  //   subSkill: {
  //     check: {
  //       charlotte: true,
  //       trigger: { player: "phaseUseEnd" },
  //       forced: true,
  //       popup: false,
  //       onremove: true,
  //       filter(event, player) {
  //         return !player.getHistory("sourceDamage", (evt) => {
  //           return evt.getParent("phaseUse") === event
  //         }).length
  //       },
  //       async content(event, trigger, player) {
  //         var targets = player.getStorage("rexiantu_check")
  //         targets.sortBySeat()
  //         for (var i of targets) {
  //           if (i.isIn()) {
  //             await i.loseHp()
  //           }
  //         }
  //         player.removeSkill("rexiantu_check")
  //       },
  //     },
  //   },
  // },
  // //霍峻
  // dcgue: {
  //   audio: 2,
  //   enable: ["chooseToUse", "chooseToRespond"],
  //   hiddenCard(player, name) {
  //     if (player.hasSkill("dcgue_blocker", null, null, false)) {
  //       return false
  //     }
  //     return name === "sha" || name === "shan"
  //   },
  //   filter(event, player) {
  //     if (
  //       event.dcgue ||
  //       event.type === "wuxie" ||
  //       player === _status.currentPhase
  //     ) {
  //       return false
  //     }
  //     if (player.hasSkill("dcgue_blocker", null, null, false)) {
  //       return false
  //     }
  //     for (var name of ["sha", "shan"]) {
  //       if (event.filterCard({ name: name, isCard: true }, player, event)) {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       var vcards = []
  //       for (var name of ["sha", "shan"]) {
  //         var card = { name: name, isCard: true }
  //         if (event.filterCard(card, player, event)) {
  //           vcards.push(["基本", "", name])
  //         }
  //       }
  //       return ui.create.dialog("孤扼", [vcards, "vcard"], "hidden")
  //     },
  //     check(button) {
  //       if (
  //         _status.event.player.countCards("h", { name: ["sha", "shan"] }) > 1
  //       ) {
  //         return 0
  //       }
  //       return 1
  //     },
  //     backup(links, player) {
  //       return {
  //         filterCard: () => false,
  //         selectCard: -1,
  //         viewAs: {
  //           name: links[0][2],
  //           isCard: true,
  //         },
  //         log: false,
  //         popname: true,
  //         async precontent(event, trigger, player) {
  //           player.logSkill("dcgue")
  //           player.addTempSkill("dcgue_blocker")
  //           await player.showHandcards()
  //           if (player.countCards("h", { name: ["sha", "shan"] }) > 1) {
  //             const evt = event.getParent()
  //             evt.set("dcgue", true)
  //             evt.goto(0)
  //             delete evt.openskilldialog
  //             return
  //           }
  //           await game.delayx()
  //         },
  //       }
  //     },
  //     prompt(links, player) {
  //       return (
  //         (player.countCards ? "展示所有手牌" : "") +
  //         (player.countCards("h", { name: ["sha", "shan"] }) <= 1
  //           ? `，然后视为使用【${get.translation(links[0][2])}】`
  //           : "")
  //       )
  //     },
  //   },
  //   subSkill: { blocker: { charlotte: true } },
  //   ai: {
  //     order: 1,
  //     respondSha: true,
  //     respondShan: true,
  //     skillTagFilter(player) {
  //       if (player.hasSkill("dcgue_blocker", null, null, false)) {
  //         return false
  //       }
  //     },
  //     result: {
  //       player(player) {
  //         if (player.countCards("h", { name: ["sha", "shan"] }) > 1) {
  //           return 0
  //         }
  //         return 1
  //       },
  //     },
  //   },
  // },
  // dcsigong: {
  //   audio: 2,
  //   trigger: { global: "phaseEnd" },
  //   filter(event, player) {
  //     if (event.player === player || !event.player.isIn()) {
  //       return false
  //     }
  //     if (!player.canUse("sha", event.player, false)) {
  //       return false
  //     }
  //     let respondEvts = []
  //     for (const current of game.filterPlayer2()) {
  //       respondEvts.addArray(current.getHistory("useCard"))
  //       respondEvts.addArray(current.getHistory("respond"))
  //     }
  //     respondEvts = respondEvts
  //       .filter((i) => i.respondTo)
  //       .map((evt) => evt.respondTo)
  //     return event.player.hasHistory("useCard", (evt) => {
  //       return respondEvts.some((list) => list[1] === evt.card)
  //     })
  //   },
  //   direct: true,
  //   async content(event, trigger, player) {
  //     const num = 1 - player.countCards("h")
  //     event.num = num
  //     let prompt2 = ""
  //     let next
  //     if (num >= 0) {
  //       next = player.chooseBool().set("ai", () => _status.event.goon)
  //       prompt2 +=
  //         (num > 0 ? "摸一张牌，" : "") +
  //         "视为对" +
  //         get.translation(trigger.player) +
  //         "使用一张【杀】（伤害基数+1）"
  //     } else {
  //       next = player
  //         .chooseToDiscard(-num, "allowChooseAll")
  //         .set("ai", (card) => {
  //           if (_status.event.goon) {
  //             return 5.2 - get.value(card)
  //           }
  //           return 0
  //         })
  //         .set("logSkill", ["dcsigong", trigger.player])
  //       prompt2 +=
  //         "将手牌数弃置至1，视为对" +
  //         get.translation(trigger.player) +
  //         "使用一张【杀】（伤害基数+1）"
  //     }
  //     next.set("prompt", get.prompt("dcsigong", trigger.player))
  //     next.set("prompt2", prompt2)
  //     next.set(
  //       "goon",
  //       get.effect(trigger.player, { name: "sha" }, player, player) > 0,
  //     )
  //     const result = await next.forResult()
  //     if (!result.bool) {
  //       return
  //     }
  //     if (num >= 0) {
  //       player.logSkill("dcsigong", trigger.player)
  //     }
  //     if (num > 0) {
  //       await player.draw(num, "nodelay")
  //     }
  //     event.num = Math.max(1, Math.abs(num))
  //     if (player.canUse("sha", trigger.player, false)) {
  //       player.addTempSkill("dcsigong_check")
  //       await player
  //         .useCard({ name: "sha", isCard: true }, trigger.player, false)
  //         .set("shanReq", event.num)
  //         .set("oncard", (card) => {
  //           const evt = _status.event
  //           evt.baseDamage++
  //           for (const target of game.filterPlayer(null, null, true)) {
  //             const id = target.playerid
  //             const map = evt.customArgs
  //             if (!map[id]) {
  //               map[id] = {}
  //             }
  //             map[id].shanRequired = evt.shanReq
  //           }
  //         })
  //     }
  //   },
  //   subSkill: {
  //     check: {
  //       charlotte: true,
  //       forced: true,
  //       popup: false,
  //       trigger: { source: "damageSource" },
  //       filter(event, player) {
  //         return (
  //           event.card &&
  //           event.card.name === "sha" &&
  //           event.getParent(3).name === "dcsigong"
  //         )
  //       },
  //       async content(event, trigger, player) {
  //         player.tempBanSkill("dcsigong", "roundStart")
  //       },
  //     },
  //   },
  // }, //OL周群
  // oltianhou: {
  //   audio: 2,
  //   trigger: { player: "phaseJieshuBegin" },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     player.removeSkill("oltianhou_expire")
  //     let cards = get.cards(3, true)
  //     await game.cardsGotoOrdering(cards)
  //     if (player.countCards("h") > 0) {
  //       const hs = player.getCards("h")
  //       const result = await player
  //         .chooseToMove("天候：请选择你要交换的牌（靠左的为牌堆顶第一张）")
  //         .set("filterMove", (from, to, moved) => {
  //           return typeof to !== "number"
  //         })
  //         .set("list", [
  //           ["牌堆顶", cards, "牌堆顶"],
  //           ["手牌", player.getCards("h")],
  //         ])
  //         .set("processAI", (list) => {
  //           const player = get.player(),
  //             cards = list[0][1]
  //               .concat(list[1][1])
  //               .sort((a, b) => get.value(a) - get.value(b)),
  //             cards2 = cards.splice(0, player.countCards("h"))
  //           return [cards2, cards]
  //         })
  //         .forResult()
  //       const { moved } = result
  //       if (moved?.length) {
  //         const [top, hand] = moved
  //         const ordering = top.filter((i) => hs.includes(i))
  //         const gain = hand.filter((i) => cards.includes(i))
  //         cards = top.slice()
  //         player.$throw(ordering.length, 1000)
  //         await player.lose(ordering, ui.ordering)
  //         game.log(player, `从牌堆顶获得了${get.cnNumber(gain.length)}张牌`)
  //         await player.gain(gain, "draw")
  //       }
  //     }
  //     await game.cardsGotoPile(cards.filterInD().reverse(), "insert")
  //     cards = get.cards(3, true)
  //     const result = await player
  //       .chooseButton({
  //         createDialog: [`天候：请选择要展示的牌`, cards],
  //         forced: true,
  //         ai(button) {
  //           const card = button.link
  //           const suit = get.suit(card)
  //           if (suit === "heart") {
  //             return (
  //               1 /
  //               game.countPlayer((current) => {
  //                 if (
  //                   player !== current &&
  //                   !game.hasPlayer((tar) => tar.hp - current.hp > 1)
  //                 ) {
  //                   return get.sgnAttitude(player, current)
  //                 }
  //                 return 0
  //               })
  //             )
  //           }
  //           if (suit === "club") {
  //             return (
  //               1 /
  //               game.countPlayer((current) => {
  //                 if (
  //                   player !== current &&
  //                   (current.hp < 2 ||
  //                     !game.hasPlayer((tar) => current.hp - tar.hp > 1))
  //                 ) {
  //                   return get.sgnAttitude(player, current)
  //                 }
  //                 return 0
  //               })
  //             )
  //           }
  //           return 1 / get.rand(1, game.countPlayer())
  //         },
  //       })
  //       .forResult()
  //     const { links } = result
  //     if (!links?.length) {
  //       return
  //     }
  //     const [card] = links
  //     await player.showCards(card, `${get.translation(player)}发动了【天候】`)
  //     const suit = get.suit(card, false),
  //       skill = `oltianhou_${suit}`
  //     if (!lib.skill.oltianhou.derivation.includes(skill)) {
  //       return
  //     }
  //     event.weather_skill = skill
  //     const result = await player
  //       .chooseTarget({
  //         forced: true,
  //         prompt: `令一名角色获得技能【${get.translation(skill)}】`,
  //         prompt2: get.translation(`${skill}_info`),
  //         ai(target) {
  //           return get.attitude(_status.event.player, target)
  //         },
  //       })
  //       .forResult()
  //     if (result.bool && result.targets?.length) {
  //       const target = result.targets[0]
  //       player.line(target, "green")
  //       player.addTempSkill("oltianhou_expire", { player: "dieAfter" })
  //       game.broadcastAll((bg) => {
  //         _status.tempBackground = bg
  //         game.updateBackground()
  //       }, `${event.weather_skill}_bg`)
  //       await target.addAdditionalSkills(
  //         `oltianhou_${player.playerid}`,
  //         event.weather_skill,
  //       )
  //       game.addVideo("skill", player, [
  //         "oltianhou",
  //         [true, `${event.weather_skill}_bg`],
  //       ])
  //     }
  //   },
  //   video(player, info) {
  //     if (info[0]) {
  //       _status.tempBackground = info[1]
  //     } else {
  //       delete _status.tempBackground
  //     }
  //     game.updateBackground()
  //   },
  //   derivation: [
  //     "oltianhou_spade",
  //     "oltianhou_heart",
  //     "oltianhou_club",
  //     "oltianhou_diamond",
  //   ],
  //   subSkill: {
  //     expire: {
  //       charlotte: true,
  //       onremove(player) {
  //         var key = `oltianhou_${player.playerid}`,
  //           players = game.players.concat(game.dead)
  //         for (var current of players) {
  //           current.removeAdditionalSkill(key)
  //         }
  //         game.removeGlobalSkill(`oltianhou_${player.playerid}_ai`)
  //         game.broadcastAll(() => {
  //           delete _status.tempBackground
  //           game.updateBackground()
  //         })
  //         game.addVideo("skill", player, ["oltianhou", [false]])
  //       },
  //     },
  //     spade: {
  //       audio: true,
  //       mark: true,
  //       marktext: "雨",
  //       intro: {
  //         content:
  //           "锁定技。其他角色造成火属性伤害时，取消之；一名角色受到雷属性伤害后，所有与其座次相邻的角色失去1点体力。",
  //       },
  //       trigger: { global: "damageEnd" },
  //       forced: true,
  //       filter(event) {
  //         return (
  //           event.hasNature("thunder") &&
  //           lib.skill.oltianhou_spade.logTarget(event).length > 0
  //         )
  //       },
  //       logTarget(event) {
  //         var list = []
  //         if (!event.player.isIn()) {
  //           return []
  //         }
  //         if (event.player.getNext().isIn()) {
  //           list.push(event.player.getNext())
  //         }
  //         if (event.player.getPrevious().isIn()) {
  //           list.add(event.player.getPrevious())
  //         }
  //         return list.sortBySeat(_status.currentPhase)
  //       },
  //       async content(event, trigger, player) {
  //         var targets = lib.skill.oltianhou_spade.logTarget(trigger)
  //         for (var i of targets) {
  //           await i.loseHp()
  //         }
  //         await game.delayex()
  //       },
  //       group: "oltianhou_miehuo",
  //       global: "oltianhou_spade_ai",
  //     },
  //     spade_ai: {
  //       ai: {
  //         effect: {
  //           player(card, player, target, current) {
  //             if (
  //               ((typeof card === "object" && game.hasNature(card, "fire")) ||
  //                 get.tag(card, "fireDamage")) &&
  //               !player.hasSkill("oltianhou_spade")
  //             ) {
  //               return "zeroplayertarget"
  //             }
  //             if (
  //               (typeof card === "object" && game.hasNature(card, "thunder")) ||
  //               get.tag(card, "thunderDamage")
  //             ) {
  //               var list = lib.skill.oltianhou_spade.logTarget({
  //                 player: target,
  //               })
  //               var eff = list.reduce((eff, current) => {
  //                 eff +=
  //                   get.effect(current, { name: "losehp" }, player, player) /
  //                   get.attitude(player, player)
  //               }, 0)
  //               return [1, eff]
  //             }
  //           },
  //         },
  //       },
  //     },
  //     miehuo: {
  //       audio: "oltianhou_spade",
  //       trigger: { global: "damageBegin2" },
  //       forced: true,
  //       logTarget: "source",
  //       filter(event, player) {
  //         return (
  //           event.hasNature("fire") &&
  //           event.source?.isIn() &&
  //           event.source !== player
  //         )
  //       },
  //       async content(event, trigger, player) {
  //         trigger.cancel()
  //       },
  //     },
  //     heart: {
  //       audio: true,
  //       mark: true,
  //       marktext: "暑",
  //       intro: {
  //         content:
  //           "锁定技。其他角色的结束阶段开始时，若其体力值为全场最大，则其失去1点体力。",
  //       },
  //       trigger: { global: "phaseJieshuBegin" },
  //       forced: true,
  //       filter(event, player) {
  //         return (
  //           player !== event.player &&
  //           event.player.isIn() &&
  //           event.player.isMaxHp()
  //         )
  //       },
  //       logTarget: "player",
  //       async content(event, trigger, player) {
  //         await event.targets[0].loseHp()
  //       },
  //       global: "oltianhou_heart_ai",
  //     },
  //     heart_ai: {
  //       mod: {
  //         aiOrder(player, card, num) {
  //           if (
  //             num > 0 &&
  //             _status.event &&
  //             _status.event.type === "phase" &&
  //             !player.hasSkill("oltianhou_heart") &&
  //             get.tag(card, "recover") &&
  //             !player.isMaxHp() &&
  //             player.needsToDiscard() <= 1 &&
  //             !game.hasPlayer((current) => current.hp - player.hp > 1) &&
  //             get.effect(player, { name: "losehp" }, player, player) < 0
  //           ) {
  //             return 0
  //           }
  //         },
  //       },
  //     },
  //     club: {
  //       audio: true,
  //       mark: true,
  //       marktext: "霜",
  //       intro: {
  //         content:
  //           "锁定技。其他角色的结束阶段开始时，若其体力值为全场最小，则其失去1点体力。",
  //       },
  //       trigger: { global: "phaseJieshuBegin" },
  //       forced: true,
  //       filter(event, player) {
  //         return (
  //           player !== event.player &&
  //           event.player.isIn() &&
  //           event.player.isMinHp()
  //         )
  //       },
  //       logTarget: "player",
  //       async content(event, trigger, player) {
  //         await event.targets[0].loseHp()
  //       },
  //       global: "oltianhou_club_ai",
  //     },
  //     club_ai: {
  //       ai: {
  //         nokeep: true,
  //         skillTagFilter(player, tag, arg) {
  //           return (
  //             _status.event &&
  //             _status.event.type === "phase" &&
  //             (!arg || (arg.card && get.name(arg.card) === "tao")) &&
  //             !player.hasSkill("oltianhou_club") &&
  //             player.isMinHp() &&
  //             get.effect(player, { name: "losehp" }, player, player) < 0
  //           )
  //         },
  //       },
  //     },
  //     diamond: {
  //       audio: true,
  //       mark: true,
  //       marktext: "雾",
  //       intro: {
  //         content:
  //           "锁定技。其他角色使用【杀】指定与其座次不相邻唯一目标时，则其判定。若判定结果的点数大于此【杀】，则此【杀】对其无效。",
  //       },
  //       trigger: { global: "useCardToPlayer" },
  //       forced: true,
  //       filter(event, player) {
  //         if (
  //           event.card.name !== "sha" ||
  //           event.player === player ||
  //           event.targets.length !== 1 ||
  //           !event.player.isIn()
  //         ) {
  //           return false
  //         }
  //         return (
  //           event.target !== event.player.getNext() &&
  //           event.target !== event.player.getPrevious()
  //         )
  //       },
  //       logTarget: "player",
  //       async content(event, trigger, player) {
  //         const {
  //           targets: [target],
  //         } = event
  //         const num = get.number(trigger.card)
  //         event.num = num
  //         const result = await target
  //           .judge((card) => {
  //             var num = get.number(card),
  //               num2 = _status.event.getParent("oltianhou_diamond").num
  //             return num > num2 ? -4 : 4
  //           })
  //           .set("judge2", (result) => {
  //             if (result.bool === false) {
  //               return true
  //             }
  //             return false
  //           })
  //           .forResult()
  //         if (!result.bool) {
  //           trigger.getParent().all_excluded = true
  //           trigger.untrigger()
  //         }
  //       },
  //       global: "oltianhou_diamond_ai",
  //     },
  //     diamond_ai: {
  //       ai: {
  //         effect: {
  //           player(card, player, target) {
  //             if (
  //               get.name(card) === "sha" &&
  //               !player.hasSkill("oltianhou_diamond") &&
  //               target !== player.getNext() &&
  //               target !== player.getPrevious()
  //             ) {
  //               const num = get.number(card),
  //                 max = _status.aiyh_MAXNUM || 13
  //               return [num / max, 0, num / max, 0]
  //             }
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // olchenshuo: {
  //   audio: 2,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget({
  //         prompt: get.prompt2(event.skill),
  //         filterTarget(card, player, target) {
  //           return target.countCards("h") > 0
  //         },
  //         ai(target) {
  //           const player = get.player()
  //           return (
  //             2 -
  //             (target === player ? -0.5 : get.sgnAttitude(player, target)) +
  //             Math.random()
  //           )
  //         },
  //       })
  //       .forResult()
  //   },
  //   hasSame(info, card) {
  //     if (info.type === get.type2(card, false)) {
  //       return true
  //     }
  //     if (info.suit !== "none" && info.suit === get.suit(card, false)) {
  //       return true
  //     }
  //     if (
  //       typeof info.number === "number" &&
  //       info.number > 0 &&
  //       info.number === get.number(card, false)
  //     ) {
  //       return true
  //     }
  //     return info.length === get.cardNameLength(card)
  //   },
  //   async content(event, trigger, player) {
  //     const {
  //       targets: [target],
  //     } = event
  //     const result = await target
  //       .chooseCard({
  //         position: "h",
  //         prompt: `谶说：展示一张手牌，然后${get.translation(player)}展示并获得牌堆顶的牌`,
  //         ai(card) {
  //           const att = get.attitude(get.player(), get.event().sourcex)
  //           if (get.type(card) === "basic") {
  //             if (att > 0) {
  //               return 1 + Math.random()
  //             }
  //             return Math.random() - 0.5
  //           }
  //           return Math.random()
  //         },
  //         forced: true,
  //       })
  //       .set("sourcex", player)
  //       .forResult()
  //     if (!result.cards?.length) {
  //       return
  //     }
  //     const {
  //       cards: [card],
  //     } = result
  //     await target.showCards([card], `${get.translation(player)}发动了【谶说】`)
  //     const cardInfo = {
  //       type: get.type2(card, player),
  //       suit: get.suit(card, player),
  //       number: get.number(card, player),
  //       length: get.cardNameLength(card),
  //     }
  //     event.forceDie = true
  //     event.includeOut = true
  //     const cards = []
  //     while (true) {
  //       const judgestr =
  //         get.translation(player) +
  //         "展示的第" +
  //         get.cnNumber(cards.length + 1, true) +
  //         "张【谶说】牌"
  //       const cardsx = get.cards()
  //       const result = await player
  //         .showCards(cardsx, judgestr, true)
  //         .set("clearArena", false)
  //         .set("log", (cards, player) => [player, "亮出了牌堆顶的", cards])
  //         .forResult()
  //       if (!result?.cards) {
  //         return
  //       }
  //       cards.addArray(result.cards)
  //       if (
  //         cards.length >= 3 ||
  //         !player.isIn() ||
  //         cards.some((cardx) => !lib.skill.olchenshuo.hasSame(cardInfo, cardx))
  //       ) {
  //         game.broadcastAll(() => {
  //           ui.clear()
  //         })
  //         player.$gain2(cards, true)
  //         const owner = get.owner(card)
  //         if (get.position(card) === "h" && owner !== player) {
  //           cards.push(card)
  //           owner?.$give(card, player)
  //         }
  //         await player.gain(cards)
  //         break
  //       }
  //     }
  //   },
  // },
  // mbzhijie: {
  //   audio: 2,
  //   trigger: { global: "phaseUseBegin" },
  //   filter(event, player) {
  //     return event.player.countCards("h")
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .choosePlayerCard(
  //         trigger.player,
  //         "h",
  //         get.prompt2(event.name.slice(0, -5)),
  //       )
  //       .set("ai", (button) => {
  //         //小透不算透---by @xizifu
  //         const { player, target } = get.event(),
  //           att = get.attitude(player, target),
  //           type = get.type2(button.link)
  //         if (att === 0) {
  //           return 0
  //         }
  //         const cards = target.getCards(
  //           "hs",
  //           (card) => get.type2(card) === type && target.hasValueTarget(card),
  //         )
  //         return (cards.length > 0) ^ (att < 0)
  //           ? (() => {
  //               if (att < 0) {
  //                 return 1 + Math.random()
  //               }
  //               return Math.max(
  //                 ...cards.map((card) => target.getUseValue(card)),
  //               )
  //             })()
  //           : -1
  //       })
  //       .forResult()
  //   },
  //   round: 1,
  //   logTarget: "player",
  //   async content(event, trigger, player) {
  //     const { cards, name } = event,
  //       { player: target } = trigger
  //     await player.showCards(
  //       cards,
  //       `${get.translation(player)}对${get.translation(target)}发动了【智诫】`,
  //     )
  //     target.addTempSkill(`${name}_effect`, "phaseUseAfter")
  //     target.markAuto(`${name}_effect`, [[player, get.type2(cards[0])]])
  //   },
  //   subSkill: {
  //     effect: {
  //       mod: {
  //         aiOrder(player, card, num) {
  //           if (num > 0) {
  //             return (
  //               num +
  //               1.5 *
  //                 (player
  //                   .getStorage("mbzhijie_effect")
  //                   .some((list) => list[1] === get.type2(card))
  //                   ? 1
  //                   : -1)
  //             )
  //           }
  //         },
  //       },
  //       charlotte: true,
  //       onremove: true,
  //       intro: {
  //         content(storage, player) {
  //           const infos = []
  //           for (let i = 0; i < storage.length; i++) {
  //             const list = storage[i]
  //             infos.add(
  //               `本阶段使用${get.translation(list[1])}牌后摸一张牌并弃置本回合使用此牌类型牌的次数-1张牌；本阶段结束时，若因此获得的牌数大于因此弃置的牌数，则与${get.translation(list[0])}各摸一张牌`,
  //             )
  //           }
  //           return infos.join("<br>")
  //         },
  //       },
  //       audio: "mbzhijie",
  //       trigger: { player: ["useCardAfter", "phaseUseEnd"] },
  //       filter(event, player) {
  //         const skillName = "mbzhijie_effect",
  //           storage = player.getStorage(skillName)
  //         if (event.name === "useCard") {
  //           return storage.some((list) => list[1] === get.type2(event.card))
  //         }
  //         const num1 = player
  //             .getHistory(
  //               "gain",
  //               (evt) =>
  //                 evt.getParent(2).name === skillName &&
  //                 evt.getParent(event.name) === event,
  //             )
  //             .reduce((sum, evt) => sum + evt.cards.length, 0),
  //           num2 = player
  //             .getHistory(
  //               "lose",
  //               (evt) =>
  //                 evt.getParent(3).name === skillName &&
  //                 evt.getParent(event.name) === event,
  //             )
  //             .reduce((sum, evt) => sum + evt.cards2.length, 0)
  //         return num1 > num2 && storage.some((list) => list[0].isIn())
  //       },
  //       forced: true,
  //       async content(event, trigger, player) {
  //         const { name, card } = trigger
  //         if (name === "useCard") {
  //           await player.draw()
  //           const num =
  //             player.getHistory(
  //               name,
  //               (evt) => get.type2(evt.card) === get.type2(card),
  //             ).length - 1
  //           if (player.countCards("he") && num) {
  //             await player.chooseToDiscard("he", true, num)
  //           }
  //         } else {
  //           const targets = player
  //             .getStorage(event.name)
  //             .map((list) => list[0])
  //             .filter((i) => i.isIn())
  //             .sortBySeat()
  //           await game.asyncDraw([player].concat(targets))
  //         }
  //       },
  //     },
  //   },
  // },
  // mbshushen: {
  //   audio: 2,
  //   trigger: {
  //     player: ["gainAfter", "recoverBegin"],
  //     global: "loseAsyncAfter",
  //   },
  //   filter(event, player) {
  //     const name = event.name !== "recover" ? "gain" : "recover"
  //     if (player.getStorage("mbshushen_used").includes(name)) {
  //       return false
  //     }
  //     if (event.name === "recover") {
  //       return game.hasPlayer((current) => player !== current)
  //     }
  //     return (
  //       event.getg(player).length >= 2 &&
  //       game.hasPlayer((current) => player !== current && current.isDamaged())
  //     )
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt(event.name.slice(0, -5)),
  //         `令一名其他角色${trigger.name === "recover" ? `摸两张牌` : `回复1点体力`}`,
  //         (card, player, target) => {
  //           if (player === target) {
  //             return false
  //           }
  //           return (
  //             get.event().getTrigger().name === "recover" || target.isDamaged()
  //           )
  //         },
  //       )
  //       .set("ai", (target) => {
  //         const player = get.player()
  //         if (get.event().getTrigger().name === "recover") {
  //           return get.effect(target, { name: "draw" }, player, player) * 2
  //         }
  //         return get.recoverEffect(target, player, player)
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const name = trigger.name !== "recover" ? "gain" : "recover"
  //     player.addTempSkill(`${event.name}_used`)
  //     player.markAuto(`${event.name}_used`, [name])
  //     const target = event.targets[0]
  //     if (trigger.name !== "recover") {
  //       await target.recover()
  //     } else {
  //       await target.draw(2)
  //     }
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //   },
  // },
  // //刘谌
  // rezhanjue: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filterCard(card) {
  //     return !card.hasGaintag("reqinwang")
  //   },
  //   selectCard: -1,
  //   position: "h",
  //   filter(event, player) {
  //     var stat = player.getStat().skill
  //     if (stat.rezhanjue_draw && stat.rezhanjue_draw >= 3) {
  //       return false
  //     }
  //     var hs = player.getCards("h", (card) => !card.hasGaintag("reqinwang"))
  //     if (!hs.length) {
  //       return false
  //     }
  //     for (var i = 0; i < hs.length; i++) {
  //       var mod2 = game.checkMod(
  //         hs[i],
  //         player,
  //         "unchanged",
  //         "cardEnabled2",
  //         player,
  //       )
  //       if (mod2 === false) {
  //         return false
  //       }
  //     }
  //     return event.filterCard(get.autoViewAs({ name: "juedou" }, hs))
  //   },
  //   viewAs: { name: "juedou" },
  //   onuse(links, player) {
  //     player.addTempSkill("rezhanjue_effect", "phaseUseEnd")
  //   },
  //   ai: {
  //     order(item, player) {
  //       if (player.countCards("h") > 1) {
  //         return 0.8
  //       }
  //       return 8
  //     },
  //     tag: {
  //       respond: 2,
  //       respondSha: 2,
  //       damage: 1,
  //     },
  //     result: {
  //       player(player, target) {
  //         const td = get.damageEffect(target, player, target)
  //         if (!td) {
  //           return 0
  //         }
  //         const hs = player.getCards("h"),
  //           val = hs.reduce((acc, i) => acc - get.value(i, player), 0) / 6 + 1
  //         if (td > 0) {
  //           return val
  //         }
  //         if (
  //           player.hasSkillTag("directHit_ai", true, {
  //             target: target,
  //             card: get.autoViewAs({ name: "juedou" }, hs),
  //           })
  //         ) {
  //           return val
  //         }
  //         const pd = get.damageEffect(player, target, player),
  //           att = get.attitude(player, target)
  //         if (att > 0 && get.damageEffect(target, player, player) > pd) {
  //           return val
  //         }
  //         const ts = target.mayHaveSha(player, "respond", null, "count")
  //         if (ts < 1 && ts * 8 < player.hp ** 2) {
  //           return val
  //         }
  //         const damage = pd / get.attitude(player, player),
  //           ps = player.mayHaveSha(player, "respond", hs, "count")
  //         if (att > 0) {
  //           if (ts < 1) {
  //             return val
  //           }
  //           return val + damage + 1
  //         }
  //         if (pd >= 0) {
  //           return val + damage + 1
  //         }
  //         if (ts - ps + Math.exp(0.8 - player.hp) < 1) {
  //           return val - ts
  //         }
  //         return val + damage + 1 - ts
  //       },
  //       target(player, target) {
  //         const td =
  //           get.damageEffect(target, player, target) /
  //           get.attitude(target, target)
  //         if (!td) {
  //           return 0
  //         }
  //         const hs = player.getCards("h")
  //         if (
  //           td > 0 ||
  //           player.hasSkillTag("directHit_ai", true, {
  //             target: target,
  //             card: get.autoViewAs({ name: "juedou" }, hs),
  //           })
  //         ) {
  //           return td + 1
  //         }
  //         const pd = get.damageEffect(player, target, player),
  //           att = get.attitude(player, target)
  //         if (att > 0) {
  //           return td + 1
  //         }
  //         const ts = target.mayHaveSha(player, "respond", null, "count"),
  //           ps = player.mayHaveSha(player, "respond", hs, "count")
  //         if (ts < 1) {
  //           return td + 1
  //         }
  //         if (pd >= 0) {
  //           return 0
  //         }
  //         if (ts - ps < 1) {
  //           return td + 1 - ts
  //         }
  //         return -ts
  //       },
  //     },
  //     nokeep: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (tag === "nokeep") {
  //         return (
  //           (!arg || (arg.card && get.name(arg.card) === "tao")) &&
  //           player.isPhaseUsing() &&
  //           get.skillCount("rezhanjue_draw", player) < 3 &&
  //           player.hasCard((card) => {
  //             return get.name(card) !== "tao" && !card.hasGaintag("reqinwang")
  //           }, "h")
  //         )
  //       }
  //     },
  //   },
  // },
  // rezhanjue_effect: {
  //   audio: false,
  //   trigger: { player: "useCardAfter" },
  //   forced: true,
  //   popup: false,
  //   charlotte: true,
  //   sourceSkill: "rezhanjue",
  //   onremove(player) {
  //     delete player.getStat().skill.rezhanjue_draw
  //   },
  //   filter(event, player) {
  //     return event.skill === "rezhanjue"
  //   },
  //   async content(event, trigger, player) {
  //     const stat = player.getStat().skill
  //     if (!stat.rezhanjue_draw) {
  //       stat.rezhanjue_draw = 0
  //     }
  //     stat.rezhanjue_draw++
  //     await player.draw("nodelay")
  //     const list = game.filterPlayer((current) => {
  //       if (
  //         current.getHistory("damage", (evt) => evt.card === trigger.card)
  //           .length > 0
  //       ) {
  //         if (current === player) {
  //           stat.rezhanjue_draw++
  //         }
  //         return true
  //       }
  //       return false
  //     })
  //     if (list.length) {
  //       list.sortBySeat()
  //       await game.asyncDraw(list)
  //     }
  //     game.delay()
  //   },
  // },
  // reqinwang: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   zhuSkill: true,
  //   filter(event, player) {
  //     if (!player.hasZhuSkill("reqinwang")) {
  //       return false
  //     }
  //     return game.hasPlayer(
  //       (current) =>
  //         current !== player &&
  //         current.group === "shu" &&
  //         player.hasZhuSkill("reqinwang", current),
  //     )
  //   },
  //   selectTarget: -1,
  //   filterTarget(card, player, current) {
  //     return (
  //       current !== player &&
  //       current.group === "shu" &&
  //       player.hasZhuSkill("reqinwang", current)
  //     )
  //   },
  //   async content(event, trigger, player) {
  //     const { target } = event
  //     if (
  //       target.hasCard(
  //         (card) => _status.connectMode || get.name(card, target) === "sha",
  //         "h",
  //       )
  //     ) {
  //       const result = await target
  //         .chooseCard(
  //           `是否交给${get.translation(player)}一张【杀】？`,
  //           (card, player) => get.name(card, player) === "sha",
  //           "h",
  //         )
  //         .set("goon", get.attitude(target, player) > 0)
  //         .set("ai", (card) => (_status.event.goon ? 1 : 0))
  //         .forResult()
  //       if (result?.bool) {
  //         const card = result.cards[0]
  //         await target.give(card, player).set("gaintag", ["reqinwang"])
  //         player.addTempSkill("reqinwang_clear")
  //         const result2 = await player
  //           .chooseBool(`是否令${get.translation(target)}摸一张牌？`)
  //           .forResult()
  //         if (result2?.bool) {
  //           await target.draw()
  //         }
  //       }
  //     }
  //   },
  //   ai: {
  //     order: 5,
  //     result: { player: 1 },
  //   },
  //   subSkill: {
  //     clear: {
  //       charlotte: true,
  //       onremove(player) {
  //         player.removeGaintag("reqinwang")
  //       },
  //     },
  //   },
  // },
  // //谯周
  // zhiming: {
  //   audio: 2,
  //   trigger: { player: ["phaseZhunbeiBegin", "phaseDiscardEnd"] },
  //   frequent: true,
  //   async content(event, trigger, player) {
  //     await player.draw()
  //     if (player.countCards("he") > 0) {
  //       const next = player.chooseCard("he", "知命：是否将一张牌置于牌堆顶？")
  //       if (trigger.name === "phaseZhunbei") {
  //         next.set("ai", (card) => {
  //           var player = _status.event.player,
  //             js = player.getCards("j")
  //           if (js.length) {
  //             var judge = get.judge(js[0])
  //             if (judge && judge(card) >= 0) {
  //               return 20 - get.value(card)
  //             }
  //           }
  //           return 0
  //         })
  //       } else {
  //         next.set("ai", (card) => {
  //           var player = _status.event.player,
  //             js = player.next.getCards("j")
  //           if (js.length) {
  //             var judge = get.judge(js[0])
  //             if (
  //               judge &&
  //               (judge(card) + 0.01) * get.attitude(player, player.next) > 0
  //             ) {
  //               return 20 - get.value(card)
  //             }
  //           }
  //           return 0
  //         })
  //       }
  //       const result = await next.forResult()
  //       if (result.bool && result.cards?.length) {
  //         player.$throw(
  //           get.position(result.cards[0]) === "e" ? result.cards[0] : 1,
  //           1000,
  //         )
  //         game.log(
  //           player,
  //           "将",
  //           get.position(result.cards[0]) === "e"
  //             ? result.cards[0]
  //             : "#y一张手牌",
  //           "置于了牌堆顶",
  //         )
  //         await player.lose(result.cards, ui.cardPile, "insert")
  //         await game.delayx()
  //       }
  //     }
  //   },
  //   ai: { guanxing: true },
  // },
  // xingbu: {
  //   audio: 2,
  //   trigger: { player: "phaseJieshuBegin" },
  //   prompt2:
  //     "亮出牌堆顶的三张牌，并可以根据其中红色牌的数量，令一名其他角色获得一种效果",
  //   async content(event, trigger, player) {
  //     const cards = get.cards(3, true)
  //     await player
  //       .showCards(cards, `${get.translation(player)}发动了【星卜】`, true)
  //       .set("clearArena", false)
  //     let num = cards.filter((i) => get.color(i, false) === "red").length
  //     const result = await player
  //       .chooseTarget(
  //         `是否选择一名其他角色获得星卜效果（${get.cnNumber(num)}张）？`,
  //         lib.filter.notMe,
  //       )
  //       .set("ai", (target) => {
  //         var player = _status.event.player,
  //           num = _status.event.getParent().num
  //         var att = get.attitude(player, target)
  //         if (num < 3) {
  //           att *= -1
  //         }
  //         if (num === 2 && target.hasJudge("lebu")) {
  //           att *= -1.4
  //         }
  //         return att
  //       })
  //       .forResult()
  //     if (num === 0) {
  //       num = 1
  //     }
  //     game.broadcastAll(ui.clear)
  //     if (result.bool && result.targets?.length) {
  //       const skill = `xingbu_effect${num}`,
  //         target = result.targets[0]
  //       player.line(target, "green")
  //       game.log(player, "选择了", target)
  //       target.addTempSkill(skill, { player: "phaseEnd" })
  //       target.addMark(skill, 1, false)
  //       await game.delayx()
  //     }
  //   },
  //   subSkill: {
  //     effect1: {
  //       charlotte: true,
  //       onremove: true,
  //       intro: { content: "准备阶段开始时弃置#张手牌" },
  //       trigger: { player: "phaseZhunbeiBegin" },
  //       forced: true,
  //       filter(event, player) {
  //         return player.countCards("h") > 0
  //       },
  //       async content(event, trigger, player) {
  //         await player.chooseToDiscard(
  //           "h",
  //           true,
  //           player.countMark("xingbu_effect1"),
  //         )
  //       },
  //     },
  //     effect2: {
  //       charlotte: true,
  //       onremove: true,
  //       intro: { content: "使用【杀】的次数上限-#，跳过弃牌阶段" },
  //       mod: {
  //         cardUsable(card, player, num) {
  //           if (card.name === "sha") {
  //             return num - player.countMark("xingbu_effect2")
  //           }
  //         },
  //       },
  //       trigger: { player: "phaseDiscardBegin" },
  //       forced: true,
  //       async content(event, trigger, player) {
  //         trigger.cancel()
  //       },
  //     },
  //     effect3: {
  //       charlotte: true,
  //       onremove: true,
  //       intro: { content: "摸牌阶段多摸2*#张牌，使用【杀】的次数上限+#。" },
  //       trigger: { player: ["phaseDrawBegin2"] },
  //       forced: true,
  //       filter(event, player) {
  //         return !event.numFixed
  //       },
  //       async content(event, trigger, player) {
  //         if (trigger.name === "phaseDraw") {
  //           trigger.num += player.countMark("xingbu_effect3") * 2
  //         }
  //       },
  //       mod: {
  //         cardUsable(card, player, num) {
  //           if (card.name === "sha") {
  //             return num + player.countMark("xingbu_effect3")
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // // 吴珂
  // mbanda: {
  //   audio: 2,
  //   trigger: { global: "dying" },
  //   round: 1,
  //   check: (event, player) => get.attitude(player, event.player) > 0,
  //   filter: (event) =>
  //     event.getParent().name === "damage" && event.getParent().source?.isIn(),
  //   logTarget: "player",
  //   async content(event, trigger, player) {
  //     const source = trigger.getParent().source
  //     trigger.player.line(source)
  //     const result = await source
  //       .chooseToGive(
  //         `谙达：交给${get.translation(trigger.player)}两张不同颜色牌，否则其回复1点体力`,
  //         (card, source) => {
  //           const selected = ui.selected.cards
  //           if (!selected.length) {
  //             return true
  //           }
  //           const targetColor = get.color(card, source)
  //           return !selected.some(
  //             (selectedCard) => get.color(selectedCard, source) === targetColor,
  //           )
  //         },
  //         "he",
  //         2,
  //         trigger.player,
  //       )
  //       .set("complexCard", true)
  //       .set("ai", (card) => {
  //         const player = get.player(),
  //           source = get.event().source
  //         if (["tao", "jiu"].includes(get.name(card, source))) {
  //           return 0
  //         }
  //         if (get.attitude(player, source) > 0) {
  //           return 11 - get.value(card)
  //         }
  //         return 7 - get.value(card)
  //       })
  //       .set("source", source)
  //       .forResult()
  //     if (!result.bool) {
  //       await trigger.player.recover()
  //     }
  //   },
  // },
  // mbzhuguo: {
  //   audio: 3,
  //   logAudio: (index) =>
  //     typeof index === "number" ? `mbzhuguo${index}.mp3` : 2,
  //   usable: 1,
  //   enable: "phaseUse",
  //   filterTarget: true,
  //   async content(event, trigger, player) {
  //     const target = event.targets[0]
  //     const num = Math.min(5, target.maxHp) - target.countCards("h")
  //     if (num > 0) {
  //       await target.draw(num)
  //     } else if (num < 0 && target.countDiscardableCards(target, "h") > 0) {
  //       await target.chooseToDiscard("h", -num, true, "allowChooseAll")
  //     }
  //     const isDraw = target.hasHistory(
  //       "gain",
  //       (evt) => evt.getParent().name === "draw" && evt.getParent(2) === event,
  //     )
  //     if (!isDraw && target.isDamaged()) {
  //       await target.recover()
  //     }
  //     //按描述来说是因此成为，所以必须得是调整前不是最多，而且还必须要有摸牌且最后是最多，共三个条件（官方实际的结算也是这么回事）
  //     //描述删掉力
  //     if (target.isMaxHandcard()) {
  //       const result = await player
  //         .chooseTarget(
  //           "助国：选择一名其他角色，令" +
  //             get.translation(target) +
  //             "选择是否对其使用一张无距离限制的【杀】",
  //           (card, player, targetx) =>
  //             ![player, get.event().target].includes(targetx),
  //         )
  //         .set("ai", (targetz) => {
  //           const player = get.player(),
  //             target = get.event().target
  //           return get.effect(targetz, { name: "sha" }, target, player)
  //         })
  //         .set("target", target)
  //         .forResult()
  //       if (result.bool) {
  //         player.logSkill("mbzhuguo", [result.targets[0]], null, null, [3])
  //         await target
  //           .chooseToUse(
  //             function (card, player, event) {
  //               return (
  //                 get.name(card, player) === "sha" &&
  //                 lib.filter.filterCard.apply(this, arguments)
  //               )
  //             },
  //             `助国：是否对${get.translation(result.targets[0])}使用【杀】？`,
  //           )
  //           .set("filterTarget", function (card, player, target) {
  //             const sourcex = get.event().sourcex
  //             if (
  //               target !== sourcex &&
  //               !ui.selected.targets.includes(sourcex)
  //             ) {
  //               return false
  //             }
  //             return lib.filter.targetEnabled.apply(this, arguments)
  //           })
  //           .set("addCount", false)
  //           .set("sourcex", result.targets[0])
  //       }
  //     }
  //   },
  //   ai: {
  //     order: 8,
  //     result: {
  //       target(player, target) {
  //         return target.maxHp - target.countCards("h")
  //       },
  //     },
  //   },
  // },
  // // 张布
  // mbchengxiong: {
  //   audio: 2,
  //   trigger: { player: "useCardToTargeted" },
  //   filter(event, player) {
  //     if (
  //       get.type2(event.card) !== "trick" ||
  //       !event.isFirstTarget ||
  //       event.targets.includes(player)
  //     ) {
  //       return false
  //     }
  //     const num = lib.skill.mbchengxiong.phaseUsed(event, player)
  //     return game.hasPlayer(
  //       (current) => current !== player && current.countCards("he") >= num,
  //     )
  //   },
  //   phaseUsed(event, player) {
  //     let phase = null
  //     for (const i of lib.phaseName) {
  //       if (event.getParent(i, true)) {
  //         phase = i
  //         break
  //       }
  //     }
  //     if (!phase) {
  //       return 0
  //     }
  //     return player.getHistory(
  //       "useCard",
  //       (evt) => evt.getParent(phase) === event.getParent(phase),
  //     ).length
  //   },
  //   async cost(event, trigger, player) {
  //     const num = lib.skill.mbchengxiong.phaseUsed(trigger, player)
  //     event.result = await player
  //       .chooseTarget(get.prompt2(event.skill), (card, player, target) => {
  //         const num = get.event().num
  //         return target !== player && target.countCards("he") >= num
  //       })
  //       .set("num", num)
  //       .set("color", get.color(trigger.card))
  //       .set("ai", (target) => {
  //         let player = get.player(),
  //           eff = get.effect(target, { name: "guohe_copy2" }, player, player)
  //         const color = get.event().color
  //         if (target.getCards("e").some((card) => get.color(card) === color)) {
  //           eff += get.damageEffect(target, player, player) / 2
  //         }
  //         return eff
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const target = event.targets[0]
  //     const result = await player
  //       .discardPlayerCard("he", target, true)
  //       .set("ai", (button) => {
  //         let val = get.buttonValue(button)
  //         if (get.attitude(_status.event.player, get.owner(button.link)) > 0) {
  //           val *= -1
  //         }
  //         if (
  //           get.position(button.link) === "e" &&
  //           get.color(button.link) === get.event().color
  //         ) {
  //           return (val *= 2)
  //         }
  //         return val
  //       })
  //       .set("color", get.color(trigger.card))
  //       .forResult()
  //     if (
  //       result?.bool &&
  //       get.color(result.links[0]) === get.color(trigger.card)
  //     ) {
  //       await target.damage()
  //     }
  //   },
  //   locked: false,
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (get.type2(card) === "trick") {
  //         return num + 10
  //       }
  //     },
  //   },
  // },
  // mbwangzhuang: {
  //   audio: 2,
  //   trigger: { global: "damageEnd" },
  //   filter(event, player) {
  //     if (event.card) {
  //       return false
  //     }
  //     return [event.source, event.player].includes(player)
  //   },
  //   logTarget(event, player) {
  //     return _status.currentPhase || player
  //   },
  //   async content(event, trigger, player) {
  //     await player.draw()
  //     if (_status.currentPhase) {
  //       _status.currentPhase.addTempSkill("fengyin")
  //     }
  //   },
  // },
  // // 孙綝
  // dczigu: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filterCard: true,
  //   position: "he",
  //   selectCard: 1,
  //   check(card) {
  //     var player = _status.event.player
  //     if (!player.hasSkill("dczuowei")) {
  //       return 6 - get.value(card)
  //     }
  //     if (
  //       player.countCards("h") === player.countCards("e") + 1 &&
  //       !player.hasCard((card) => player.hasValueTarget(card), "h")
  //     ) {
  //       if (get.position(card) === "e") {
  //         return 0
  //       }
  //       return 8 - get.value(card)
  //     }
  //     return 6 - get.value(card)
  //   },
  //   async content(event, trigger, player) {
  //     let result

  //     // step 0
  //     const targets = game.filterPlayer((current) => {
  //       return current.countGainableCards(player, "e")
  //     })
  //     if (targets.length === 0) {
  //       result = { bool: false }
  //     } else if (targets.length === 1) {
  //       result = { bool: true, targets: targets }
  //     } else {
  //       result = await player
  //         .chooseTarget(
  //           "自固：获得一名角色装备区里的一张牌",
  //           true,
  //           (card, player, target) => {
  //             return target.countGainableCards(player, "e")
  //           },
  //         )
  //         .set("ai", (target) => {
  //           if (target === _status.event.player) {
  //             return 10
  //           }
  //           if (get.attitude(_status.event.player, target) < 0) {
  //             if (
  //               target.hasCard((card) => {
  //                 return get.value(card, player) >= 6
  //               })
  //             ) {
  //               return 12
  //             }
  //             return 8
  //           }
  //           return 0
  //         })
  //         .forResult()
  //     }
  //     // step 1
  //     let target
  //     if (result.bool) {
  //       target = result.targets[0]
  //       event.target = target
  //       result = await player.gainPlayerCard("e", target, true).forResult()
  //     }
  //     // step 2
  //     if (
  //       !result.bool ||
  //       target === player ||
  //       !result.cards ||
  //       !result.cards.some((i) => get.owner(i) === player)
  //     ) {
  //       await player.draw()
  //     }
  //   },
  //   ai: {
  //     order(item, player) {
  //       if (!player.hasSkill("dczuowei")) {
  //         return 9
  //       }
  //       if (
  //         player.countCards("h") === player.countCards("e") + 1 &&
  //         !player.hasCard((card) => player.hasValueTarget(card), "h")
  //       ) {
  //         return 9
  //       }
  //       return 1
  //     },
  //     result: {
  //       player: 1,
  //     },
  //   },
  // },
  // dczuowei: {
  //   audio: 2,
  //   trigger: { player: "useCard" },
  //   filter(event, player) {
  //     if (_status.currentPhase !== player) {
  //       return false
  //     }
  //     if (!player.hasSkill("dczuowei_ban")) {
  //       return true
  //     }
  //     return (
  //       Math.sign(
  //         player.countCards("h") - Math.max(1, player.countCards("e")),
  //       ) >= 0
  //     )
  //   },
  //   direct: true,
  //   locked: false,
  //   async content(event, trigger, player) {
  //     let result
  //     const hs = player.countCards("h")
  //     const es = Math.max(1, player.countCards("e"))
  //     const sign = Math.sign(hs - es)
  //     if (sign > 0) {
  //       result = await player
  //         .chooseBool(
  //           get.prompt("dczuowei"),
  //           `令${get.translation(trigger.card)}不可被响应`,
  //         )
  //         .set("ai", () => 1)
  //         .forResult()
  //     } else if (sign === 0) {
  //       result = await player
  //         .chooseTarget(
  //           get.prompt("dczuowei"),
  //           "对一名其他角色造成1点伤害",
  //           lib.filter.notMe,
  //         )
  //         .set("ai", (target) => {
  //           return get.damageEffect(
  //             target,
  //             _status.event.player,
  //             _status.event.player,
  //           )
  //         })
  //         .forResult()
  //     } else {
  //       result = await player
  //         .chooseBool(
  //           get.prompt("dczuowei"),
  //           "摸两张牌，然后本回合你不能再触发该分支",
  //         )
  //         .set("ai", () => 1)
  //         .forResult()
  //     }
  //     if (!result.bool) {
  //       return
  //     }
  //     if (sign <= 0 && !event.isMine() && !event.isOnline()) {
  //       await game.delayx()
  //     }
  //     if (sign > 0) {
  //       player.logSkill("dczuowei")
  //       trigger.directHit.addArray(game.players)
  //       return
  //     }
  //     if (sign === 0) {
  //       const target = result.targets[0]
  //       player.logSkill("dczuowei", target)
  //       await target.damage()
  //       return
  //     }
  //     player.logSkill("dczuowei")
  //     await player.draw(2)
  //     player.addTempSkill("dczuowei_ban")
  //   },
  //   subSkill: {
  //     ban: { charlotte: true },
  //   },
  //   mod: {
  //     aiValue(player, card, num) {
  //       if (_status.currentPhase !== player) {
  //         return
  //       }
  //       const event = get.event()
  //       if (!player.isPhaseUsing()) {
  //         return
  //       }
  //       if (event.type !== "phase") {
  //         return
  //       }
  //       const cardsh = [],
  //         cardse = []
  //       for (const cardx of ui.selected.cards) {
  //         const pos = get.position(cardx)
  //         if (pos === "h") {
  //           cardsh.add(cardx)
  //         } else if (pos === "e") {
  //           cardse.add(cardx)
  //         }
  //       }
  //       const hs = player.countCards("h") - cardsh.length,
  //         es = Math.max(1, player.countCards("e") - cardse.length)
  //       const delt = hs - es
  //       if (delt <= 0) {
  //         return
  //       }
  //       if (get.position(card) === "h" && delt === 1) {
  //         return num / 1.25
  //       }
  //     },
  //     aiUseful() {
  //       return lib.skill.dczuowei.mod.aiValue.apply(this, arguments)
  //     },
  //     aiOrder(player, card, num) {
  //       if (
  //         player.hasSkill("dczuowei_ban") ||
  //         _status.currentPhase !== player
  //       ) {
  //         return
  //       }
  //       const cardsh = [],
  //         cardse = []
  //       const pos = get.position(card)
  //       if (pos === "h") {
  //         cardsh.add(card)
  //       } else if (pos === "e") {
  //         cardse.add(card)
  //       }
  //       if (get.tag(card, "draw") || get.tag(card, "gain")) {
  //         const hs = player.countCards("h") - cardsh.length,
  //           es = Math.max(
  //             1,
  //             player.countCards("e") -
  //               cardse.length +
  //               (get.type(card) === "equip"),
  //           )
  //         if ((player.hasSkill("dczuowei_ban") && hs < es) || hs === es) {
  //           return num + 10
  //         }
  //         return num / 5
  //       }
  //     },
  //   },
  //   ai: {
  //     threaten: 3,
  //     reverseEquip: true,
  //     effect: {
  //       player_use(card, player, target, current) {
  //         if (_status.currentPhase !== player) {
  //           return
  //         }
  //         const cha =
  //           player.countCards("h") - Math.max(1, player.countCards("e"))
  //         if (cha === 0 || (cha < 0 && !player.hasSkill("dczuowei_ban"))) {
  //           return [1, 2]
  //         }
  //       },
  //     },
  //   },
  // },
  // // 界徐盛
  // repojun: {
  //   audio: 2,
  //   trigger: { player: "useCardToPlayered" },
  //   direct: true,
  //   filter(event, player) {
  //     return (
  //       event.card.name === "sha" &&
  //       event.target.hp > 0 &&
  //       event.target.countCards("he") > 0
  //     )
  //   },
  //   preHidden: true,
  //   async content(event, trigger, player) {
  //     // step 0
  //     var next = player.choosePlayerCard(
  //       trigger.target,
  //       "he",
  //       [1, Math.min(trigger.target.hp, trigger.target.countCards("he"))],
  //       get.prompt("repojun", trigger.target),
  //       "allowChooseAll",
  //     )
  //     next.set("ai", (button) => {
  //       if (!_status.event.goon) {
  //         return 0
  //       }
  //       var val = get.value(button.link)
  //       if (button.link === _status.event.target.getEquip(2)) {
  //         return 2 * (val + 3)
  //       }
  //       return val
  //     })
  //     next.set("goon", get.attitude(player, trigger.target) <= 0)
  //     next.set("forceAuto", true)
  //     next.setHiddenSkill(event.name)
  //     const result = await next.forResult()
  //     // step 1
  //     if (result.bool) {
  //       const target = trigger.target
  //       player.logSkill("repojun", target)
  //       target.addSkill("repojun2")
  //       const next = target.addToExpansion("giveAuto", result.cards, target)
  //       next.gaintag.add("repojun2")
  //       await next
  //     }
  //   },
  //   ai: {
  //     unequip_ai: true,
  //     directHit_ai: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (get.attitude(player, arg.target) > 0) {
  //         return false
  //       }
  //       if (tag === "directHit_ai") {
  //         return arg.target.hp >= Math.max(1, arg.target.countCards("h") - 1)
  //       }
  //       if (arg && arg.name === "sha" && arg.target.getEquip(2)) {
  //         return true
  //       }
  //       return false
  //     },
  //   },
  //   group: "repojun3",
  // },
  // repojun3: {
  //   audio: "repojun",
  //   trigger: { source: "damageBegin1" },
  //   sourceSkill: "repojun",
  //   filter(event, player) {
  //     var target = event.player
  //     return (
  //       event.card &&
  //       event.card.name === "sha" &&
  //       player.countCards("h") >= target.countCards("h") &&
  //       player.countCards("e") >= target.countCards("e")
  //     )
  //   },
  //   forced: true,
  //   locked: false,
  //   logTarget: "player",
  //   preHidden: true,
  //   check(event, player) {
  //     return get.attitude(player, event.player) < 0
  //   },
  //   async content(event, trigger, player) {
  //     trigger.num++
  //   },
  // },
  // repojun2: {
  //   trigger: { global: "phaseEnd" },
  //   forced: true,
  //   popup: false,
  //   charlotte: true,
  //   sourceSkill: "repojun",
  //   filter(event, player) {
  //     return player.getExpansions("repojun2").length > 0
  //   },
  //   async content(event, trigger, player) {
  //     // step 0
  //     const cards = player.getExpansions("repojun2")
  //     if (cards.length) {
  //       await player.gain(cards, "draw")
  //     }
  //     game.log(player, `收回了${get.cnNumber(cards.length)}张“破军”牌`)
  //     // step 1
  //     player.removeSkill("repojun2")
  //   },
  //   intro: {
  //     markcount: "expansion",
  //     mark(dialog, storage, player) {
  //       var cards = player.getExpansions("repojun2")
  //       if (player.isUnderControl(true)) {
  //         dialog.addAuto(cards)
  //       } else {
  //         return `共有${get.cnNumber(cards.length)}张牌`
  //       }
  //     },
  //   },
  // },
  // // 胆守
  // xindanshou: {
  //   audio: 2,
  //   trigger: {
  //     global: "phaseJieshuBegin",
  //     target: "useCardToTargeted",
  //   },
  //   filter(event, player) {
  //     return (
  //       ((event.name === "phaseJieshu" &&
  //         event.player !== player &&
  //         player.countCards("he") >= event.player.countCards("h")) ||
  //         (event.targets?.includes(player) &&
  //           ["basic", "trick"].includes(get.type2(event.card)))) &&
  //       !player.hasHistory(
  //         "gain",
  //         (evt) =>
  //           evt.getParent().name === "draw" &&
  //           evt.getParent(2).name === "xindanshou",
  //       )
  //     )
  //   },
  //   async cost(event, trigger, player) {
  //     const skillName = event.name.slice(0, -5)
  //     if (trigger.name === "phaseJieshu") {
  //       let next
  //       const { player: target } = trigger
  //       const num = target.countCards("h")
  //       if (num > 0) {
  //         next = player
  //           .chooseToDiscard(
  //             get.prompt(skillName, target),
  //             num,
  //             `弃置${get.cnNumber(num)}张牌并对${get.translation(target)}造成1点伤害`,
  //             "he",
  //           )
  //           .set("ai", (card) => {
  //             const player = get.player()
  //             if (
  //               get.damageEffect(
  //                 _status.event.getTrigger().player,
  //                 player,
  //                 player,
  //               ) > 0
  //             ) {
  //               return 6 - get.value(card)
  //             }
  //             return -1
  //           })
  //       } else {
  //         next = player
  //           .chooseBool(
  //             get.prompt(skillName, target),
  //             `对${get.translation(target)}造成1点伤害`,
  //           )
  //           .set("choice", get.damageEffect(target, player, player) > 0)
  //       }
  //       event.result = await next.forResult()
  //       event.result.targets = [target]
  //     } else {
  //       let num = 0
  //       game.countPlayer2((current) => {
  //         num += current
  //           .getHistory("useCard")
  //           .filter(
  //             (evt) =>
  //               ["basic", "trick"].includes(get.type2(evt.card)) &&
  //               evt.targets?.includes(player),
  //           ).length
  //       })
  //       const { bool } = await player
  //         .chooseBool(
  //           `${get.prompt(skillName)}（可摸${get.cnNumber(num)}张牌）`,
  //           get.translation(`${skillName}_info`),
  //         )
  //         .set("ai", () => {
  //           return _status.event.choice
  //         })
  //         .set(
  //           "choice",
  //           (() => {
  //             if (player.isPhaseUsing()) {
  //               if (
  //                 player.countCards(
  //                   "h",
  //                   (card) =>
  //                     ["basic", "trick"].includes(get.type(card, "trick")) &&
  //                     player.canUse(card, player, null, true) &&
  //                     get.effect(player, card, player) > 0 &&
  //                     player.getUseValue(card, null, true) > 0,
  //                 )
  //               ) {
  //                 return false
  //               }
  //               return true
  //             }
  //             if (num > 2) {
  //               return true
  //             }
  //             var card = trigger.card
  //             if (
  //               get.tag(card, "damage") &&
  //               player.hp <= trigger.getParent().baseDamage &&
  //               (!get.tag(card, "respondShan") || !player.hasShan("all")) &&
  //               (!get.tag(card, "respondSha") || !player.hasSha())
  //             ) {
  //               return true
  //             }
  //             var source = _status.currentPhase
  //             if (source?.isIn()) {
  //               var todis = source.countCards("h") - source.needsToDiscard()
  //               if (
  //                 todis <=
  //                   Math.max(
  //                     Math.min(
  //                       2 + (source.hp <= 1 ? 1 : 0),
  //                       player.countCards(
  //                         "he",
  //                         (card) =>
  //                           get.value(card, player) < Math.max(5.5, 8 - todis),
  //                       ),
  //                     ),
  //                     player.countCards(
  //                       "he",
  //                       (card) => get.value(card, player) <= 0,
  //                     ),
  //                   ) &&
  //                 get.damageEffect(source, player, player) > 0
  //               ) {
  //                 return false
  //               }
  //               if (
  //                 !source.isPhaseUsing() ||
  //                 get.attitude(player, source) > 0
  //               ) {
  //                 return true
  //               }
  //               if (card.name === "sha" && !source.getCardUsable("sha")) {
  //                 return true
  //               }
  //             }
  //             return Math.random() < num / 3
  //           })(),
  //         )
  //         .forResult()
  //       event.result = {
  //         bool: bool,
  //         cost_data: num,
  //       }
  //     }
  //   },
  //   async content(event, trigger, player) {
  //     if (trigger.name === "phaseJieshu") {
  //       await trigger.player.damage("nocard")
  //     } else {
  //       player.addTempSkill(`${event.name}_used`)
  //       await player.draw(event.cost_data)
  //     }
  //   },
  //   subSkill: { used: { charlotte: true } },
  //   ai: {
  //     threaten: 0.6,
  //     effect: {
  //       target_use(card, player, target, current) {
  //         if (
  //           typeof card !== "object" ||
  //           target.hasSkill("xindanshou_used") ||
  //           !["basic", "trick"].includes(get.type(card, "trick"))
  //         ) {
  //           return
  //         }
  //         var num = 0
  //         game.countPlayer2((current) => {
  //           var history = current.getHistory("useCard")
  //           for (var j = 0; j < history.length; j++) {
  //             if (
  //               ["basic", "trick"].includes(
  //                 get.type(history[j].card, "trick"),
  //               ) &&
  //               history[j].targets?.includes(player)
  //             ) {
  //               num++
  //             }
  //           }
  //         })
  //         if (player === target && current > 0) {
  //           return [1.1, num]
  //         }
  //         return [0.9, num]
  //       },
  //     },
  //   },
  // },
  olhongyuan: {
    audio: "hongyuan",
    trigger: { player: "gainAfter", global: "loseAsyncAfter" },
    filter(event, player) {
      if (
        !player.countCards("he") ||
        player.hasSkill("olhongyuan_blocker", null, null, false)
      ) {
        return false
      }
      return event.getg(player).length >= 2
    },
    async content(event, trigger, player) {
      player.addTempSkill("olhongyuan_blocker", [
        "phaseZhunbeiBefore",
        "phaseJudgeBefore",
        "phaseDrawBefore",
        "phaseUseBefore",
        "phaseDiscardBefore",
        "phaseJieshuBefore",
        "phaseBefore",
      ])
      const selectedTargets = []
      while (
        selectedTargets.length < 2 &&
        player.countCards("he") &&
        game.hasPlayer((target) => {
          return target !== player && !selectedTargets.includes(target)
        })
      ) {
        const { bool, targets, cards } = await player
          .chooseCardTarget({
            prompt: "弘援：将一张牌交给一名其他角色",
            filterCard: true,
            position: "he",
            filterTarget(card, player, target) {
              return (
                target !== player &&
                !get.event().selectedTargets.includes(target)
              )
            },
            complexCard: true,
            complexTarget: true,
            complexSelect: true,
            ai1(card) {
              const player = get.event().player
              if (
                !game.hasPlayer((current) => {
                  if (get.event().selectedTargets.includes(current)) {
                    return false
                  }
                  return (
                    current !== player &&
                    get.attitude(player, current) > 0 &&
                    !current.hasSkillTag("nogain")
                  )
                })
              ) {
                return -get.value(card)
              }
              return (
                4 +
                (player.hasSkill("olmingzhe") && get.color(card) === "red"
                  ? 2
                  : 0) -
                Math.max(player.getUseValue(card), get.value(card, player))
              )
            },
            ai2(target) {
              const player = _status.event.player,
                att = get.attitude(player, target)
              if (!ui.selected.cards.length) {
                return att
              }
              const card = ui.selected.cards[0],
                val = get.value(card, target)
              if (val < 0) {
                return -att * Math.sqrt(-val)
              }
              return att * Math.sqrt(val + 2)
            },
          })
          .set("selectedTargets", selectedTargets)
          .forResult()
        if (bool) {
          const target = targets[0]
          selectedTargets.push(target)
          player.line(target)
          await player.give(cards, target)
        } else {
          break
        }
      }
    },
    ai: { threaten: 0.8 },
    subSkill: { blocker: { charlotte: true } },
  },
}

export default skills
