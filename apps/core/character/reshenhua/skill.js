import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig['skill'] } */
const skills = {
  // 界曹仁
  // 据守
  rejushou: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    async content(event, trigger, player) {
      await player.draw(4)
      await player.turnOver()
      const result = await player
        .chooseCard("h", true, "弃置一张手牌，若此牌为装备牌，则你改为使用之")
        .set("ai", (card) => {
          if (get.type(card) === "equip") {
            return 5 - get.value(card)
          }
          return -get.value(card)
        })
        .set("filterCard", lib.filter.cardDiscardable)
        .forResult()
      if (result.bool && result.cards.length) {
        const card = result.cards[0]
        if (get.type(card) === "equip" && player.hasUseTarget(card)) {
          player.chooseUseTarget(card, true, "nopopup")
        } else {
          player.discard(card)
        }
      }
    },
  },
  // 解围
  jiewei: {
    audio: 2,
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
    group: "jiewei_move",
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
              "h",
              get.prompt("jiewei"),
              "弃置一张手牌，然后可以移动场上的一张牌",
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
        async content(event, trigger, player) {
          await player.moveCard()
        },
      },
    },
  },
  // 界夏侯渊
  // 神速
  reshensu: {
    audio: 2,
    audioname: ["ol_xiahouyuan"],
    group: ["reshensu_1", "reshensu_2", "shensu4"],
    preHidden: ["reshensu_1", "reshensu_2", "shensu4"],
    subSkill: {
      1: {
        audio: "reshensu",
        inherit: "shensu1",
        sourceSkill: "reshensu",
      },
      2: {
        audio: "reshensu",
        inherit: "shensu2",
        sourceSkill: "reshensu",
      },
    },
  },
  shensu4: {
    audio: "reshensu",
    trigger: { player: "phaseDiscardBefore" },
    sourceSkill: "reshensu",
    async cost(event, trigger, player) {
      const check =
        player.needsToDiscard() ||
        player.isTurnedOver() ||
        (player.hasSkill("shebian") && player.canMoveCard(true, true))
      event.result = await player
        .chooseTarget(
          get.prompt(event.skill),
          "跳过弃牌阶段并翻面，视为使用一张无距离限制的【杀】",
          (card, player, target) => {
            if (player === target) {
              return false
            }
            return player.canUse({ name: "sha" }, target, false)
          },
        )
        .set("check", check)
        .set("ai", (target) => {
          if (!_status.event.check) {
            return 0
          }
          return get.effect(
            target,
            { name: "sha" },
            _status.event.player,
            _status.event.player,
          )
        })
        .setHiddenSkill(event.skill)
        .forResult()
    },
    async content(event, trigger, player) {
      trigger.cancel()
      await player.turnOver()
      await player.useCard(
        { name: "sha", isCard: true },
        event.targets[0],
        false,
      )
    },
  },
  // 界黄忠
  // 烈弓
  reliegong: {
    mod: {
      aiOrder(player, card, num) {
        if (num > 0 && (card.name === "sha" || get.tag(card, "draw"))) {
          return num + 6
        }
      },
      targetInRange(card, player, target) {
        if (card.name === "sha" && typeof get.number(card) === "number") {
          if (get.distance(player, target) <= get.number(card)) {
            return true
          }
        }
      },
    },
    targetprompt2: (target) => {
      const player = get.player(),
        card = get.card(),
        list = []
      if (card?.name !== "sha" || !target.classList.contains("selectable")) {
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
      event.targetprompt2.add(lib.skill.reliegong.targetprompt2)
    },
    onChooseTarget(event) {
      event.targetprompt2.add(lib.skill.reliegong.targetprompt2)
    },
    audio: 2,
    trigger: { player: "useCardToTargeted" },
    logTarget: "target",
    locked: false,
    check(event, player) {
      return get.attitude(player, event.target) <= 0
    },
    filter(event, player) {
      if (event.card.name !== "sha") {
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
        if (typeof map[id].extraDamage !== "number") {
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
          arg.card.name === "sha" &&
          player.countCards(
            "h",
            (card) => card !== arg.card && !arg.card.cards?.includes(card),
          ) >= arg.target.countCards("h")
        ) {
          return true
        }
        return false
      },
    },
  },
  // 界魏延
  // 狂骨
  rekuanggu: {
    audio: 2,
    audioname: ["ol_weiyan"],
    trigger: { source: "damageSource" },
    filter(event, player) {
      return event.checkKuanggu && event.num > 0
    },
    getIndex(event, player, triggername) {
      return event.num
    },
    preHidden: true,
    async cost(event, trigger, player) {
      let choice
      if (
        player.isDamaged() &&
        get.recoverEffect(player) > 0 &&
        player.countCards(
          "hs",
          (card) => card.name === "sha" && player.hasValueTarget(card),
        ) >= player.getCardUsable("sha")
      ) {
        choice = "recover_hp"
      } else {
        choice = "draw_card"
      }
      const next = player.chooseDrawRecover(
        `###${get.prompt(event.skill)}###回复1点体力或摸一张牌`,
      )
      next.set("choice", choice)
      next.set("ai", () => _status.event.getParent().choice)
      next.set("logSkill", event.skill)
      next.setHiddenSkill(event.skill)
      const { control } = await next.forResult()
      if (control === "cancel2") {
        return
      }
      event.result = { bool: true, skill_popup: false } // 好像在content里面不能中断getIndex喵
    },
    async content(event, trigger, player) {},
  },
  // 奇谋
  qimou: {
    limited: true,
    audio: 2,
    enable: "phaseUse",
    skillAnimation: true,
    animationColor: "orange",
    async content(event, trigger, player) {
      const shas = player.getCards("h", "sha")
      let num
      if (player.hp >= 4 && shas.length >= 3) {
        num = 3
      } else if (player.hp >= 3 && shas.length >= 2) {
        num = 2
      } else {
        num = 1
      }
      const map = {}
      const list = []
      for (let i = 1; i <= player.hp; i++) {
        const cn = get.cnNumber(i, true)
        map[cn] = i
        list.push(cn)
      }
      player.awakenSkill(event.name)
      player.storage.qimou = true
      const result = await player
        .chooseControl(list, () => get.cnNumber(_status.event.goon, true))
        .set("prompt", "失去任意点体力")
        .set("goon", num)
        .forResult()
      num = map[result.control] || 1
      player.storage.qimou2 = num
      player.addTempSkill("qimou2", "phaseUseAfter")
      await player.loseHp(num)
    },
    ai: {
      order: 2,
      result: {
        player(player) {
          if (player.hp === 1) {
            return 0
          }
          const shas = player.getCards("h", "sha")
          if (!shas.length) {
            return 0
          }
          const card = shas[0]
          if (!lib.filter.cardEnabled(card, player)) {
            return 0
          }
          if (lib.filter.cardUsable(card, player)) {
            return 0
          }
          let mindist
          if (player.hp >= 4 && shas.length >= 3) {
            mindist = 4
          } else if (player.hp >= 3 && shas.length >= 2) {
            mindist = 3
          } else {
            mindist = 2
          }
          if (
            game.hasPlayer(
              (current) =>
                current.hp <= mindist - 1 &&
                get.distance(player, current, "attack") <= mindist &&
                player.canUse(card, current, false) &&
                get.effect(current, card, player, player) > 0,
            )
          ) {
            return 1
          }
          return 0
        },
      },
    },
  },
  qimou2: {
    onremove: true,
    mod: {
      cardUsable(card, player, num) {
        if (typeof player.storage.qimou2 === "number" && card.name === "sha") {
          return num + player.storage.qimou2
        }
      },
      globalFrom(from, to, distance) {
        if (typeof from.storage.qimou2 === "number") {
          return distance - from.storage.qimou2
        }
      },
    },
  },
  // 界小乔
  // 天香
  retianxiang: {
    audio: 2,
    trigger: { player: "damageBegin4" },
    preHidden: true,
    filter(event, player) {
      return (
        player.countCards(
          "h",
          (card) => _status.connectMode || get.suit(card, player) === "heart",
        ) > 0 && event.num > 0
      )
    },
    async cost(event, trigger, player) {
      event.result = await player
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
          ai1(card) {
            return 10 - get.value(card)
          },
          ai2(target) {
            const att = get.attitude(_status.event.player, target)
            const trigger = _status.event.getTrigger()
            let da = 0
            if (_status.event.player.hp === 1) {
              da = 10
            }
            const eff = get.damageEffect(target, trigger.source, target)
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
          prompt: get.prompt(event.skill),
          prompt2: lib.translate[`${event.skill}_info`],
        })
        .setHiddenSkill(event.name.slice(0, -5))
        .forResult()
    },
    async content(event, trigger, player) {
      const [target] = event.targets
      const [card] = event.cards
      trigger.cancel()
      await player.discard(event.cards)
      const result = await player
        .chooseControlList(
          true,
          (event, player) => {
            const target = _status.event.target
            let att = get.attitude(player, target)
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
            `令${get.translation(target)}失去1点体力，然后其获得${get.translation(event.cards)}`,
          ],
        )
        .set("target", target)
        .forResult()
      if (typeof result.index !== "number") {
        return
      }
      if (result.index) {
        event.related = target.loseHp()
      } else {
        event.related = target.damage(trigger.source || "nosource", "nocard")
      }
      await event.related
      //if(event.related.cancelled||target.isDead()) return;
      if (result.index && card.isInPile()) {
        await target.gain(card, "gain2")
      } else if (target.getDamagedHp()) {
        await target.draw(Math.min(5, target.getDamagedHp()))
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
  // 界周泰
  // 不屈
  rebuqu: {
    audio: 2,
    trigger: { player: "chooseToUseBefore" },
    forced: true,
    preHidden: true,
    filter(event, player) {
      return (
        event.type === "dying" &&
        player.isDying() &&
        event.dying === player &&
        !event.getParent()._rebuqu
      )
    },
    async content(event, trigger, player) {
      trigger.getParent()._rebuqu = true
      const [card] = get.cards()
      const next = player.addToExpansion(card, "gain2")
      next.gaintag.add("rebuqu")
      await next
      const cards = player.getExpansions("rebuqu"),
        num = get.number(card)
      player.showCards(cards, "不屈")
      for (let i = 0; i < cards.length; i++) {
        if (cards[i] !== card && get.number(cards[i]) === num) {
          await player.loseToDiscardpile(card)
          return
        }
      }
      trigger.cancel()
      trigger.result = { bool: true }
      if (player.hp <= 0) {
        await player.recover(1 - player.hp)
      }
    },
    mod: {
      maxHandcardBase(player, num) {
        if (get.mode() !== "guozhan" && player.getExpansions("rebuqu").length) {
          return player.getExpansions("rebuqu").length
        }
      },
    },
    ai: {
      save: true,
      mingzhi: true,
      skillTagFilter(player, tag, target) {
        if (player !== target) {
          return false
        }
      },
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
            const num = target.getExpansions("rebuqu").length || target.getHp()
            return (num + 1) / 5
          }
        },
      },
    },
    onremove(player, skill) {
      const cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
  },
  // 奋激
  fenji: {
    audio: 2,
    trigger: { global: "phaseAfter" },
    filter(event, player) {
      if (event.player.countCards("h") === 0 && event.player.isIn()) {
        return true
      }
      return false
    },
    preHidden: true,
    check(event, player) {
      if (get.attitude(get.event().player, event.player) <= 0) {
        return false
      }
      return (
        2 *
          get.effect(
            event.player,
            { name: "draw" },
            player,
            get.event().player,
          ) +
          get.effect(player, { name: "losehp" }, player, get.event().player) >
        0
      )
    },
    logTarget: "player",
    async content(event, trigger, player) {
      player.line(trigger.player, "green")
      await trigger.player.draw(2)
      await player.loseHp()
    },
  },
  // 界张角
  // 雷击
  releiji: {
    audio: 2,
    trigger: { player: ["useCard", "respond"] },
    filter(event, player) {
      return event.card.name === "shan"
    },
    line: "thunder",
    async cost(event, trigger, player) {
      const next = player.chooseTarget(
        get.prompt2(event.skill),
        (card, player, target) => target !== player,
      )
      next.ai = (target) => {
        if (target.hasSkill("hongyan")) {
          return 0
        }
        return get.damageEffect(
          target,
          _status.event.player,
          _status.event.player,
          "thunder",
        )
      }
      event.result = await next.forResult()
    },
    async content(event, trigger, player) {
      const [target] = event.targets
      const next = target.judge((card) => {
        const suit = get.suit(card)
        if (suit === "spade") {
          return -4
        }
        if (suit === "club") {
          return -2
        }
        return 0
      })
      next.judge2 = (result) => {
        return result.bool === false // ? true : false; 喵？
      }
      const { suit } = await next.forResult()
      if (suit === "club") {
        await player.recover()
        await target.damage("thunder")
      } else if (suit === "spade") {
        await target.damage(2, "thunder")
      }
    },
    ai: {
      useShan: true,
      effect: {
        target_use(card, player, target, current) {
          if (
            get.tag(card, "respondShan") &&
            !player.hasSkillTag(
              "directHit_ai",
              true,
              {
                target: target,
                card: card,
              },
              true,
            )
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
            if (card.name === "sha") {
              if (!target.mayHaveShan(player, "use")) {
                return
              }
            } else if (!target.mayHaveShan(player)) {
              return 1 - 0.1 * Math.min(5, target.countCards("hs"))
            }
            if (!target.hasSkillTag("rejudge")) {
              return [1, (club + spade) / 4]
            }
            let pos = player.hasSkillTag("viewHandcard", null, target, true)
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
      },
    },
  },
  // 界于吉
  // 蛊惑
  reguhuo: {
    audio: 2,
    derivation: ["chanyuan"],
    enable: ["chooseToUse", "chooseToRespond"],
    hiddenCard(player, name) {
      return (
        lib.inpile.includes(name) &&
        player.countCards("hs") > 0 &&
        !player.hasSkill("reguhuo_phase")
      )
    },
    filter(event, player) {
      if (player.hasSkill("reguhuo_phase")) {
        return false
      }
      if (!player.countCards("hs")) {
        return false
      }
      for (const i of lib.inpile) {
        const type = get.type(i)
        if (
          (type === "basic" || type === "trick") &&
          event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)
        ) {
          return true
        }
        if (i === "sha") {
          for (const j of lib.inpile_nature) {
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
      dialog(event, player) {
        const list = []
        for (const i of lib.inpile) {
          if (event.type !== "phase") {
            if (
              !event.filterCard(
                get.autoViewAs({ name: i }, "unsure"),
                player,
                event,
              )
            ) {
              continue
            }
          }
          const type = get.type(i)
          if (type === "basic" || type === "trick") {
            list.push([type, "", i])
          }
          if (i === "sha") {
            for (const j of lib.inpile_nature) {
              if (event.type !== "phase") {
                if (
                  !event.filterCard(
                    get.autoViewAs({ name: i, nature: j }, "unsure"),
                    player,
                    event,
                  )
                ) {
                  continue
                }
              }
              list.push(["基本", "", "sha", j])
            }
          }
        }
        return ui.create.dialog("蛊惑", [list, "vcard"])
      },
      filter(button, player) {
        const evt = _status.event.getParent()
        return evt.filterCard(
          { name: button.link[2], nature: button.link[3] },
          player,
          evt,
        )
      },
      check(button) {
        const player = _status.event.player
        const enemyNum = game.countPlayer(
          (current) =>
            current !== player &&
            !current.hasSkill("chanyuan") &&
            (get.realAttitude || get.attitude)(current, player) < 0,
        )
        const card = { name: button.link[2], nature: button.link[3] }
        const val =
          _status.event.getParent().type === "phase"
            ? player.getUseValue(card)
            : 1
        if (val <= 0) {
          return 0
        }
        if (enemyNum) {
          if (
            !player.hasCard((cardx) => {
              if (card.name === cardx.name) {
                if (card.name !== "sha") {
                  return true
                }
                return get.is.sameNature(card, cardx)
              }
              return false
            }, "hs")
          ) {
            if (get.value(card, player, "raw") < 6) {
              return Math.sqrt(val) * (0.25 + Math.random() / 1.5)
            }
            if (enemyNum <= 2) {
              return Math.sqrt(val) / 1.5
            }
            return 0
          }
          return 3 * val
        }
        return val
      },
      backup(links, player) {
        return {
          filterCard(card, player, target) {
            let result = true
            const suit = card.suit,
              number = card.number
            card.suit = "none"
            card.number = null
            const mod = game.checkMod(
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
          selectCard: 1,
          position: "hs",
          ignoreMod: true,
          aiUse: Math.random(),
          viewAs: {
            name: links[0][2],
            nature: links[0][3],
            suit: "none",
            number: null,
          },
          ai1(card) {
            const player = _status.event.player
            const enemyNum = game.countPlayer(
              (current) =>
                current !== player &&
                !current.hasSkill("chanyuan") &&
                (get.realAttitude || get.attitude)(current, player) < 0,
            )
            const cardx = lib.skill.reguhuo_backup.viewAs
            if (enemyNum) {
              if (
                card.name === cardx.name &&
                (card.name !== "sha" || get.is.sameNature(card, cardx))
              ) {
                return 2 + Math.random() * 3
              }
              if (lib.skill.reguhuo_backup.aiUse < 0.5 && !player.isDying()) {
                return 0
              }
            }
            return 6 - get.value(card)
          },
          async precontent(event, trigger, player) {
            player.logSkill("reguhuo")
            player.addTempSkill("reguhuo_guess")
            const [card] = event.result.cards
            event.result.card.suit = get.suit(card)
            event.result.card.number = get.number(card)
          },
        }
      },
      prompt(links, player) {
        return `将一张手牌当做${get.translation(links[0][2])}${_status.event.name === "chooseToRespond" ? "打出" : "使用"}`
      },
    },
    ai: {
      save: true,
      respondSha: true,
      respondShan: true,
      fireAttack: true,
      skillTagFilter(player) {
        if (!player.countCards("hs") || player.hasSkill("reguhuo_phase")) {
          return false
        }
      },
      threaten: 1.2,
      order: 8.1,
      result: { player: 1 },
    },
  },
  reguhuo_guess: {
    audio: "reguhuo",
    trigger: {
      player: ["useCardBefore", "respondBefore"],
    },
    forced: true,
    silent: true,
    popup: false,
    firstDo: true,
    charlotte: true,
    filter(event, player) {
      return event.skill && event.skill.indexOf("reguhuo_") === 0
    },
    async content(event, trigger, player) {
      player.addTempSkill("reguhuo_phase")
      event.fake = false
      event.betrayer = null
      const [card] = trigger.cards
      if (
        card.name !== trigger.card.name ||
        (card.name === "sha" && !get.is.sameNature(trigger.card, card))
      ) {
        event.fake = true
      }
      player.popup(trigger.card.name, "metal")
      const next = player.lose(card, ui.ordering)
      next.relatedEvent = trigger
      await next
      // player.line(trigger.targets,trigger.card.nature);
      trigger.throw = false
      trigger.skill = "reguhuo_backup"
      game.log(
        player,
        "声明",
        trigger.targets?.length ? "对" : "",
        trigger.targets || "",
        trigger.name === "useCard" ? "使用" : "打出",
        trigger.card,
      )
      event.prompt = `${get.translation(player)}声明${trigger.targets?.length ? `对${get.translation(trigger.targets)}` : ""}${trigger.name === "useCard" ? "使用" : "打出"}${get.translation(trigger.card.nature) || ""}${get.translation(trigger.card.name)}，是否质疑？`
      event.targets = game
        .filterPlayer(
          (current) => current !== player && !current.hasSkill("chanyuan"),
        )
        .sortBySeat(_status.currentPhase)
      game.broadcastAll(
        (card, player) => {
          _status.reguhuoNode = card.copy("thrown")
          if (lib.config.cardback_style !== "default") {
            _status.reguhuoNode.style.transitionProperty = "none"
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.classList.add("infohidden")
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transitionProperty = ""
          } else {
            _status.reguhuoNode.classList.add("infohidden")
          }
          _status.reguhuoNode.style.transform =
            "perspective(600px) rotateY(180deg) translateX(0)"
          player.$throwordered2(_status.reguhuoNode)
        },
        trigger.cards[0],
        player,
      )
      event.onEnd01 = () => {
        _status.reguhuoNode.removeEventListener(
          "webkitTransitionEnd",
          _status.event.onEnd01,
        )
        setTimeout(() => {
          _status.reguhuoNode.style.transition = "all ease-in 0.3s"
          _status.reguhuoNode.style.transform =
            "perspective(600px) rotateY(270deg)"
          const onEnd = () => {
            _status.reguhuoNode.classList.remove("infohidden")
            _status.reguhuoNode.style.transition = "all 0s"
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transform =
              "perspective(600px) rotateY(-90deg)"
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transition = ""
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transform = ""
            _status.reguhuoNode.removeEventListener(
              "webkitTransitionEnd",
              onEnd,
            )
          }
          _status.reguhuoNode.listenTransition(onEnd)
        }, 300)
      }
      for (const target of event.targets) {
        const { links } = await target
          .chooseButton(
            [event.prompt, [["guhuo_ally", "guhuo_betray"], "vcard"]],
            true,
          )
          .set("ai", (button) => {
            const player = _status.event.player
            const evt = _status.event.getParent("reguhuo_guess"),
              evtx = evt.getTrigger()
            if (!evt) {
              return Math.random()
            }
            const card = {
              name: evtx.card.name,
              nature: evtx.card.nature,
              isCard: true,
            }
            const ally = button.link[2] === "guhuo_ally"
            if (
              ally &&
              (player.hp <= 1 || get.attitude(player, evt.player) >= 0)
            ) {
              return 1.1
            }
            if (
              !ally &&
              get.attitude(player, evt.player) < 0 &&
              evtx.name === "useCard"
            ) {
              let eff = 0
              const targetsx = evtx.targets || []
              for (const target of targetsx) {
                const isMe = target === evt.player
                eff +=
                  get.effect(target, card, evt.player, player) /
                  (isMe ? 1.5 : 1)
              }
              eff /= 1.5 * targetsx.length || 1
              if (eff > 0) {
                return 0
              }
              if (eff < -7) {
                return Math.random() + (-(eff + 7) / 8) ** 2
              }
              return (
                ((get.value(card, evt.player, "raw") - 4) /
                  (eff === 0 ? 5 : 10)) **
                2
              )
            }
            return Math.random()
          })
          .forResult()
        if (links[0][2] === "guhuo_betray") {
          target.addExpose(0.2)
          game.log(target, "#y质疑")
          target.popup("质疑！", "fire")
          event.betrayer = target
          break
        }
        game.log(target, "#g不质疑")
        target.popup("不质疑", "wood")
      }
      await game.delayx()
      game.broadcastAll((onEnd) => {
        _status.event.onEnd01 = onEnd
        if (_status.reguhuoNode) {
          _status.reguhuoNode.listenTransition(onEnd, 300)
        }
      }, event.onEnd01)
      await game.delay(2)
      if (!event.betrayer) {
        return
      }
      if (event.fake) {
        event.betrayer.popup("质疑正确", "wood")
        game.log(player, "声明的", trigger.card, "作废了")
        trigger.cancel()
        trigger.getParent().goto(0)
        trigger.line = false
      } else {
        event.betrayer.popup("质疑错误", "fire")
        await event.betrayer.addSkills("chanyuan")
      }
      await game.delay(2)
      if (event.fake) {
        game.broadcastAll(() => ui.clear())
      } // game.broadcastAll(ui.clear); 原来的代码抽象喵
    },
  },
  reguhuo_phase: {},
  // 缠怨
  chanyuan: {
    init(player, skill) {
      if (player.hp === 1) {
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
        player.hp === 1
      )
    },
    mark: true,
    intro: {
      content(storage, player, skill) {
        let str =
          "<li>锁定技，你不能质疑〖蛊惑〗；若你的体力值为1，你的其他技能失效。"
        const list = player
          .getSkills(null, false, false)
          .filter((i) => lib.skill.chanyuan.skillBlocker(i, player))
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
      return player.hp === 1
    },
    forced: true,
    async content(event, trigger, player) {},
  },
  // 界典韦
  // 强袭
  reqiangxi: {
    subSkill: {
      off: {
        sub: true,
      },
    },
    audio: 2,
    enable: "phaseUse",
    filterCard(card) {
      return get.subtype(card) === "equip1"
    },
    selectCard() {
      return [0, 1]
    },
    filterTarget(card, player, target) {
      if (player === target) {
        return false
      }
      if (target.hasSkill("reqiangxi_off")) {
        return false
      }
      return player.inRange(target)
    },
    async content(event, trigger, player) {
      const { cards, target } = event
      // step 0
      if (cards.length === 0) {
        await player.loseHp()
      }
      // step 1
      target.addTempSkill("reqiangxi_off", "phaseUseAfter")
      await target.damage("nocard")
    },
    check(card) {
      return 10 - get.value(card)
    },
    position: "he",
    ai: {
      order: 8.5,
      result: {
        target(player, target) {
          if (!ui.selected.cards.length) {
            if (player.hp < 2) {
              return 0
            }
            if (target.hp >= player.hp) {
              return 0
            }
          }
          return get.damageEffect(target, player)
        },
      },
    },
    threaten: 1.5,
  },
  // 界荀彧
  rejieming: {
    audio: 2,
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return event.num > 0
    },
    getIndex: (event) => event.num,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(get.prompt2(event.skill))
        .set("ai", (target) => {
          const att = get.attitude(get.player(), target)
          if (att > 2) {
            if (target.maxHp - target.countCards("h") > 2) {
              return 2 * att
            }
            return att
          }
          return att / 3
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      player.line(target, "thunder")
      await target.draw(2)
      if (target.countCards("h") < target.maxHp) {
        await player.draw()
      }
    },
    ai: {
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
  rehuoji: {
    position: "hes",
    audio: 2,
    enable: "chooseToUse",
    filterCard(card) {
      return get.color(card) === "red"
    },
    viewAs: {
      name: "huogong",
    },
    viewAsFilter(player) {
      if (!player.countCards("hes", { color: "red" })) {
        return false
      }
    },
    prompt: "将一张红色牌当【火攻】使用",
    check(card) {
      var player = get.player()
      if (player.countCards("h") > player.hp) {
        return 6 - get.value(card)
      }
      return 4 - get.value(card)
    },
    ai: {
      fireAttack: true,
    },
  },
  // 看破
  rekanpo: {
    mod: {
      aiValue(player, card, num) {
        if (get.name(card) !== "wuxie" && get.color(card) !== "black") {
          return
        }
        var cards = player.getCards(
          "hs",
          (card) => get.name(card) === "wuxie" || get.color(card) === "black",
        )
        cards.sort(
          (a, b) =>
            (get.name(b) === "wuxie" ? 1 : 2) -
            (get.name(a) === "wuxie" ? 1 : 2),
        )
        var geti = () => {
          if (cards.includes(card)) {
            return cards.indexOf(card)
          }
          return cards.length
        }
        if (get.name(card) === "wuxie") {
          return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6
        }
        return Math.max(num, [6, 4, 3][Math.min(geti(), 2)])
      },
      aiUseful() {
        return lib.skill.rekanpo.mod.aiValue.apply(this, arguments)
      },
    },
    locked: false,
    audio: 2,
    position: "hes",
    enable: "chooseToUse",
    filterCard(card) {
      return get.color(card) === "black"
    },
    viewAsFilter(player) {
      return player.countCards("hes", { color: "black" }) > 0
    },
    viewAs: {
      name: "wuxie",
    },
    prompt: "将一张黑色牌当【无懈可击】使用",
    check(card) {
      return 8 - get.value(card)
    },
  },
  // 界庞统
  // 连环
  relianhuan: {
    audio: 2,
    inherit: "lianhuan",
    group: "relianhuan_add",
    subSkill: {
      add: {
        audio: "relianhuan",
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
        content() {
          "step 0"
          player
            .chooseTarget(
              get.prompt("relianhuan"),
              `为${get.translation(trigger.card)}多指定一名角色为目标`,
              (card, player, target) => {
                return (
                  !_status.event.sourcex.includes(target) &&
                  lib.filter.targetEnabled2(_status.event.card, player, target)
                )
              },
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
              game.delayex()
            }
          } else {
            event.finish()
          }
          ;("step 2")
          if (result.bool) {
            var targets = result.targets
            player.logSkill("relianhuan_add", targets)
            trigger.targets.addArray(targets)
            game.log(targets, "也成为了", trigger.card, "的目标")
          }
        },
      },
    },
  },
  // 涅槃
  reniepan: {
    audio: 2,
    enable: "chooseToUse",
    limited: true,
    skillAnimation: true,
    animationColor: "fire",
    filter(event, player) {
      if (event.type === "dying") {
        if (player !== event.dying) {
          return false
        }
        return true
      }
      if (event.getParent().name === "phaseUse") {
        return true
      }
      return false
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      player.storage.reniepan = true
      await player.discard(player.getCards("hej"))
      await player.link(false)
      await player.turnOver(false)
      await player.draw(3)
      if (player.hp < 3) {
        await player.recover(3 - player.hp)
      }
    },
    ai: {
      order: 0.5,
      skillTagFilter(player, tag, target) {
        if (player !== target || player.storage.reniepan) {
          return false
        }
      },
      save: true,
      result: {
        player(player) {
          if (player.hp <= 0) {
            return 10
          }
          if (player.hp <= 1 && player.countCards("he") <= 1) {
            return 10
          }
          return 0
        },
      },
      threaten(player, target) {
        if (!target.storage.reniepan) {
          return 0.6
        }
      },
    },
  },
  // 界太史慈
  // 天义
  retianyi: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget: (card, player, target) => player.canCompare(target),
    filter(event, player) {
      return game.hasPlayer((curr) => player.canCompare(curr))
    },
    async content(event, trigger, player) {
      const result = await player.chooseToCompare(event.targets[0]).forResult()
      if (result.bool) {
        player.addTempSkill("retianyi_effect")
      } else {
        player.addTempSkill("retianyi_diseffect")
      }
    },
    subSkill: {
      effect: {
        charlotte: true,
        mark: true,
        marktext: "天义",
        intro: {
          name: "天义",
          content: "本回合使用【杀】无距离限制、次数上限和目标上限均+1",
        },
        mod: {
          cardUsable(card, player, num) {
            if (get.name(card) === "sha") {
              return num + 1
            }
          },
          targetInRange(card, player, bool) {
            if (get.name(card) === "sha") {
              return true
            }
          },
          selectTarget(card, player, range) {
            if (get.name(card) === "sha") {
              range[1]++
            }
          },
        },
      },
      diseffect: {
        trigger: { player: "useCard" },
        charlotte: true,
        forced: true,
        mark: true,
        marktext: "天义",
        intro: {
          name: "天义",
          content: "本回合使用下一张牌时取消之并令唯一目标摸两张牌",
        },
        async content(event, trigger, player) {
          trigger.cancel()
          player.removeSkill(event.name)
          if (trigger.targets.length === 1) {
            await trigger.targets[0].draw(2)
          }
        },
        ai: {
          effect: {
            player_use(card, player, target) {
              return [0, 0, 0, 2]
            },
          },
        },
      },
    },
    ai: {
      order: 10,
      result: {
        player(player, target) {
          if (player.countCards("h") > 1) {
            return -get.attitude(player, target)
          }
          return 0
        },
      },
    },
  },
  // 荡魔
  dangmo: {
    audio: 2,
    trigger: { player: "useCardAfter" },
    filter(event, player) {
      const evts = player.getHistory("useCard")
      if (evts.length < 2) {
        return false
      }
      const targets = get.info("dangmo").logTarget(event, player)
      return targets?.length
    },
    logTarget(event, player) {
      const evts = player.getHistory("useCard")
      if (evts.length < 2) {
        return []
      }
      const index = evts.indexOf(event),
        nows = event?.targets,
        olds = evts[index - 1]?.targets
      if (
        !olds?.length ||
        !nows?.length ||
        (olds.containsAll(...nows) && nows.containsAll(...olds))
      ) {
        return []
      }
      return olds.filter((current) => current?.isIn() && nows.includes(current))
    },
    check(event, player) {
      const targets = get.info("dangmo").logTarget(event, player)
      return (
        targets.reduce((total, target) => {
          return total + get.damageEffect(target, player, player)
        }, 0) > 0
      )
    },
    async content(event, trigger, player) {
      await game.doAsyncInOrder(
        event.targets,
        async (target) => await target.damage(),
      )
    },
    locked: false,
    mod: {
      aiOrder(player, card, num) {
        const num1 = get.info(card).selectTarget ?? 0,
          num2 = game.countPlayer()
        if (typeof num1 === "number") {
          return Math.abs(num1 - num2)
        }
        if (typeof num1 === "function") {
          return Math.abs(num1(card, player) - nmu2)
        }
        return Math.abs(num1[1] - num2)
      },
    },
    ai: {
      effct: {
        target(card, player, target) {
          if (
            !player.getHistory("useCard", (evt) => evt.targets.length > 0)
              .length &&
            player.hasSkill("retianyi_effct") &&
            ui.selected.targets.length > 0
          ) {
            return 0
          }
          return [1, 0]
        },
      },
    },
  },
  // 界庞德
  // 鞬出
  jianchu: {
    audio: 2,
    trigger: { player: "useCardToPlayered" },
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        event.target.countDiscardableCards(player, "he") > 0
      )
    },
    preHidden: true,
    check(event, player) {
      return get.attitude(player, event.target) <= 0
    },
    logTarget: "target",
    async content(event, trigger, player) {
      const result = await player
        .discardPlayerCard(
          trigger.target,
          get.prompt("jianchu", trigger.target),
          true,
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
        .set("att", get.attitude(player, trigger.target) <= 0)
        .forResult()
      if (result.bool && result.links?.length) {
        if (
          get.type(
            result.links[0],
            null,
            result.links[0].original === "h" ? player : false,
          ) === "equip"
        ) {
          trigger.getParent().directHit.add(trigger.target)
        } else if (trigger.cards) {
          const list = []
          for (let i = 0; i < trigger.cards.length; i++) {
            if (get.position(trigger.cards[i], true) === "o") {
              list.push(trigger.cards[i])
            }
          }
          if (list.length) {
            trigger.target.gain(list, "gain2", "log")
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
  // 界袁绍
  // 乱击
  reluanji: {
    audio: 2,
    enable: "phaseUse",
    viewAs: { name: "wanjian" },
    filterCard(card, player) {
      if (!player.storage.reluanji) {
        return true
      }
      return !player.storage.reluanji.includes(get.suit(card))
    },
    position: "hs",
    selectCard: 2,
    check(card) {
      const player = _status.event.player
      const targets = game.filterPlayer((current) =>
        player.canUse("wanjian", current),
      )
      let num = 0
      for (let i = 0; i < targets.length; i++) {
        let eff = get.sgn(
          get.effect(targets[i], { name: "wanjian" }, player, player),
        )
        if (targets[i].hp === 1) {
          eff *= 1.5
        }
        num += eff
      }
      if (!player.needsToDiscard(-1)) {
        if (targets.length >= 7) {
          if (num < 2) {
            return 0
          }
        } else if (targets.length >= 5) {
          if (num < 1.5) {
            return 0
          }
        }
      }
      return 6 - get.value(card)
    },
    ai: {
      basic: {
        order: 8.9,
      },
    },
    group: [
      "reluanji_count",
      "reluanji_reset",
      "reluanji_respond",
      "reluanji_damage",
      "reluanji_draw",
    ],
    subSkill: {
      reset: {
        trigger: { player: "phaseAfter" },
        silent: true,
        async content(event, trigger, player) {
          delete player.storage.reluanji
          delete player.storage.reluanji2
        },
      },
      count: {
        trigger: { player: "useCard" },
        silent: true,
        filter(event) {
          return event.skill === "reluanji"
        },
        async content(event, trigger, player) {
          player.storage.reluanji2 = trigger.card
          if (!player.storage.reluanji) {
            player.storage.reluanji = []
          }
          player.storage.reluanji.addArray(
            trigger.cards.map((c) => get.suit(c)),
          )
        },
      },
      respond: {
        trigger: { global: "respond" },
        silent: true,
        filter(event) {
          return event.getParent(2).skill === "reluanji"
        },
        async content(event, trigger, player) {
          await trigger.player.draw()
        },
      },
      damage: {
        trigger: { source: "damage" },
        forced: true,
        silent: true,
        popup: false,
        filter(event, player) {
          return (
            player.storage.reluanji2 && event.card === player.storage.reluanji2
          )
        },
        async content(event, trigger, player) {
          delete player.storage.reluanji2
        },
      },
      draw: {
        trigger: { player: "useCardAfter" },
        forced: true,
        silent: true,
        popup: false,
        filter(event, player) {
          return (
            player.storage.reluanji2 && event.card === player.storage.reluanji2
          )
        },
        async content(event, trigger, player) {
          await player.draw()
          delete player.storage.reluanji2
        },
      },
    },
  },
  // 界颜良文丑
  // 双雄
  reshuangxiong: {
    audio: 2,
    group: ["reshuangxiong_judge", "reshuangxiong_gain"],
    subSkill: {
      judge: {
        audio: "reshuangxiong",
        logAudio: () => 1,
        trigger: { player: "phaseDrawBegin1" },
        check(event, player) {
          if (player.countCards("h") > player.hp) {
            return true
          }
          if (player.countCards("h") > 3) {
            return true
          }
          return false
        },
        filter(event, player) {
          return !event.numFixed
        },
        prompt2() {
          return "放弃摸牌，然后亮出牌堆顶的两张牌并选择获得其中的一张。本回合内可以将与此牌颜色不同的一张手牌当做【决斗】使用"
        },
        async content(event, trigger, player) {
          // step 0
          trigger.changeToZero()
          event.cards = get.cards(2)
          event.videoId = lib.status.videoId++
          game.broadcastAll(
            (player, id, cards) => {
              const str =
                player === game.me && !_status.auto
                  ? "【双雄】选择获得其中一张牌"
                  : "双雄"
              const dialog = ui.create.dialog(str, cards)
              dialog.videoId = id
            },
            player,
            event.videoId,
            event.cards,
          )
          event.time = get.utc()
          game.addVideo("showCards", player, [
            "双雄",
            get.cardsInfo(event.cards),
          ])
          game.addVideo("delay", null, 2)

          // step 1
          const result = await player
            .chooseButton([1, 1], true)
            .set("dialog", event.videoId)
            .set("ai", (button) => {
              const playerx = _status.event.player
              const color = get.color(button.link)
              let value = get.value(button.link, playerx)
              if (
                playerx.countCards("h", { color: color }) >
                playerx.countCards("h", ["red", "black"].remove(color)[0])
              ) {
                value += 5
              }
              return value
            })
            .forResult()

          // step 2
          if (result.bool && result.links) {
            const cards2 = []
            for (const link of result.links) {
              cards2.push(link)
              event.cards.remove(link)
            }
            await game.cardsDiscard(event.cards)
            event.card2 = cards2[0]
          }

          const time = 1000 - (get.utc() - event.time)
          if (time > 0) {
            await game.delay(0, time)
          }

          // step 3
          game.broadcastAll("closeDialog", event.videoId)
          const card2 = event.card2
          if (card2) {
            await player.gain(card2, "gain2")
            player.addTempSkill("reshuangxiong_viewas")
            player.markAuto("reshuangxiong_viewas", [get.color(card2, false)])
          }
        },
      },
      gain: {
        trigger: {
          player: "damageEnd",
        },
        audio: "reshuangxiong",
        filter(event, player) {
          const evt = event.getParent()
          return (
            evt?.name === "juedou" &&
            evt[player === evt.player ? "targetCards" : "playerCards"]?.someInD(
              "od",
            )
          )
        },
        async cost(event, trigger, player) {
          const evt = trigger.getParent()
          const cards = evt[
            player === evt.player ? "targetCards" : "playerCards"
          ]
            .slice(0)
            .filterInD("od")
          event.result = await player
            .chooseBool(`是否发动【双雄】，获得${get.translation(cards)}?`)
            .forResult()
          event.result.cards = cards
        },
        async content(event, trigger, player) {
          await player.gain(event.cards, "gain2")
        },
      },
      viewas: {
        charlotte: true,
        onremove: true,
        audio: "reshuangxiong",
        logAudio: () => "reshuangxiong2.mp3",
        enable: "chooseToUse",
        viewAs: { name: "juedou" },
        position: "hs",
        viewAsFilter(player) {
          return player.hasCard(
            (card) => lib.skill.reshuangxiong_viewas.filterCard(card, player),
            "hs",
          )
        },
        filterCard(card, player) {
          const color = get.color(card),
            colors = player.getStorage("reshuangxiong_viewas")
          for (const i of colors) {
            if (color !== i) {
              return true
            }
          }
          return false
        },
        prompt() {
          const colors = _status.event.player.getStorage("reshuangxiong_viewas")
          let str = "将一张颜色"
          for (let i = 0; i < colors.length; i++) {
            if (i > 0) {
              str += "或"
            }
            str += "不为"
            str += get.translation(colors[i])
          }
          str += "的手牌当做【决斗】使用"
          return str
        },
        check(card) {
          const player = _status.event.player
          const raw = player.getUseValue(card, null, true)
          const eff = player.getUseValue(
            get.autoViewAs({ name: "juedou" }, [card]),
          )
          return eff - raw
        },
        ai: { order: 7 },
      },
    },
  },
}

export default skills
