import { lib, game, ui, get, ai, _status } from "wtk"

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
        .set("ai", function (card) {
          if (get.type(card) == "equip") {
            return 5 - get.value(card)
          }
          return -get.value(card)
        })
        .set("filterCard", lib.filter.cardDiscardable)
        .forResult()
      if (result.bool && result.cards.length) {
        const card = result.cards[0]
        if (get.type(card) == "equip" && player.hasUseTarget(card)) {
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
  // 神速
  reshensu: {
    audio: 2,
    audioname: ["xiahouba", "ol_xiahouyuan"],
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
    audioname: ["xiahouba"],
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
          function (card, player, target) {
            if (player == target) {
              return false
            }
            return player.canUse({ name: "sha" }, target, false)
          },
        )
        .set("check", check)
        .set("ai", function (target) {
          if (!_status.event.check) {
            return 0
          }
          return get.effect(target, { name: "sha" }, _status.event.player, _status.event.player)
        })
        .setHiddenSkill(event.skill)
        .forResult()
    },
    async content(event, trigger, player) {
      trigger.cancel()
      await player.turnOver()
      await player.useCard({ name: "sha", isCard: true }, event.targets[0], false)
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
        if (card.name == "sha" && typeof get.number(card) == "number") {
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
        player.countCards("hs", function (card) {
          return card.name == "sha" && player.hasValueTarget(card)
        }) >= player.getCardUsable("sha")
      ) {
        choice = "recover_hp"
      } else {
        choice = "draw_card"
      }
      const next = player.chooseDrawRecover(
        "###" + get.prompt(event.skill) + "###摸一张牌或回复1点体力",
      )
      next.set("choice", choice)
      next.set("ai", function () {
        return _status.event.getParent().choice
      })
      next.set("logSkill", event.skill)
      next.setHiddenSkill(event.skill)
      const { control } = await next.forResult()
      if (control == "cancel2") {
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
        .chooseControl(list, function () {
          return get.cnNumber(_status.event.goon, true)
        })
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
          if (player.hp == 1) {
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
            game.hasPlayer(function (current) {
              return (
                current.hp <= mindist - 1 &&
                get.distance(player, current, "attack") <= mindist &&
                player.canUse(card, current, false) &&
                get.effect(current, card, player, player) > 0
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
  qimou2: {
    onremove: true,
    mod: {
      cardUsable(card, player, num) {
        if (typeof player.storage.qimou2 == "number" && card.name == "sha") {
          return num + player.storage.qimou2
        }
      },
      globalFrom(from, to, distance) {
        if (typeof from.storage.qimou2 == "number") {
          return distance - from.storage.qimou2
        }
      },
    },
  },
  // 界小乔
  // 天香
  retianxiang: {
    audio: 2,
    audioname: ["daxiaoqiao"],
    trigger: { player: "damageBegin4" },
    preHidden: true,
    filter(event, player) {
      return (
        player.countCards("h", function (card) {
          return _status.connectMode || get.suit(card, player) == "heart"
        }) > 0 && event.num > 0
      )
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCardTarget({
          filterCard(card, player) {
            return get.suit(card) == "heart" && lib.filter.cardDiscardable(card, player)
          },
          filterTarget(card, player, target) {
            return player != target
          },
          ai1(card) {
            return 10 - get.value(card)
          },
          ai2(target) {
            const att = get.attitude(_status.event.player, target)
            const trigger = _status.event.getTrigger()
            let da = 0
            if (_status.event.player.hp == 1) {
              da = 10
            }
            const eff = get.damageEffect(target, trigger.source, target)
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
          function (event, player) {
            const target = _status.event.target
            let att = get.attitude(player, target)
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
            "令" + get.translation(target) + "失去1点体力，然后获得" + get.translation(event.cards),
          ],
        )
        .set("target", target)
        .forResult()
      if (typeof result.index != "number") {
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
    audioname: ["key_yuri"],
    trigger: { player: "chooseToUseBefore" },
    forced: true,
    preHidden: true,
    filter(event, player) {
      return (
        event.type == "dying" &&
        player.isDying() &&
        event.dying == player &&
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
        if (cards[i] != card && get.number(cards[i]) == num) {
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
        if (get.mode() != "guozhan" && player.getExpansions("rebuqu").length) {
          return player.getExpansions("rebuqu").length
        }
      },
    },
    ai: {
      save: true,
      mingzhi: true,
      skillTagFilter(player, tag, target) {
        if (player != target) {
          return false
        }
      },
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
            let num = target.getExpansions("rebuqu").length || target.getHp()
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
      if (event.player.countCards("h") == 0 && event.player.isIn()) {
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
        2 * get.effect(event.player, { name: "draw" }, player, get.event().player) +
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
    audioname: ["boss_qinglong"],
    trigger: { player: ["useCard", "respond"] },
    filter(event, player) {
      return event.card.name == "shan"
    },
    line: "thunder",
    async cost(event, trigger, player) {
      const next = player.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
        return target != player
      })
      next.ai = function (target) {
        if (target.hasSkill("hongyan")) {
          return 0
        }
        return get.damageEffect(target, _status.event.player, _status.event.player, "thunder")
      }
      event.result = await next.forResult()
    },
    async content(event, trigger, player) {
      const [target] = event.targets
      const next = target.judge(function (card) {
        const suit = get.suit(card)
        if (suit == "spade") {
          return -4
        }
        if (suit == "club") {
          return -2
        }
        return 0
      })
      next.judge2 = function (result) {
        return result.bool == false // ? true : false; 喵？
      }
      const { suit } = await next.forResult()
      if (suit == "club") {
        await player.recover()
        await target.damage("thunder")
      } else if (suit == "spade") {
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
            let pos = player.hasSkillTag("viewHandcard", null, target, true) ? "hes" : "e",
              better = club > spade ? "club" : "spade",
              max = 0
            target.hasCard(function (cardx) {
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
          (type == "basic" || type == "trick") &&
          event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)
        ) {
          return true
        }
        if (i == "sha") {
          for (const j of lib.inpile_nature) {
            if (event.filterCard(get.autoViewAs({ name: i, nature: j }, "unsure"), player, event)) {
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
          if (event.type != "phase") {
            if (!event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
              continue
            }
          }
          const type = get.type(i)
          if (type == "basic" || type == "trick") {
            list.push([type, "", i])
          }
          if (i == "sha") {
            for (const j of lib.inpile_nature) {
              if (event.type != "phase") {
                if (
                  !event.filterCard(get.autoViewAs({ name: i, nature: j }, "unsure"), player, event)
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
        return evt.filterCard({ name: button.link[2], nature: button.link[3] }, player, evt)
      },
      check(button) {
        const player = _status.event.player
        const enemyNum = game.countPlayer(function (current) {
          return (
            current != player &&
            !current.hasSkill("chanyuan") &&
            (get.realAttitude || get.attitude)(current, player) < 0
          )
        })
        const card = { name: button.link[2], nature: button.link[3] }
        const val = _status.event.getParent().type == "phase" ? player.getUseValue(card) : 1
        if (val <= 0) {
          return 0
        }
        if (enemyNum) {
          if (
            !player.hasCard(function (cardx) {
              if (card.name == cardx.name) {
                if (card.name != "sha") {
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
            const mod = game.checkMod(card, player, "unchanged", "cardEnabled2", player)
            if (mod != "unchanged") {
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
            const enemyNum = game.countPlayer(function (current) {
              return (
                current != player &&
                !current.hasSkill("chanyuan") &&
                (get.realAttitude || get.attitude)(current, player) < 0
              )
            })
            const cardx = lib.skill.reguhuo_backup.viewAs
            if (enemyNum) {
              if (
                card.name == cardx.name &&
                (card.name != "sha" || get.is.sameNature(card, cardx))
              ) {
                return 2 + Math.random() * 3
              } else if (lib.skill.reguhuo_backup.aiUse < 0.5 && !player.isDying()) {
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
        return (
          "将一张手牌当做" +
          get.translation(links[0][2]) +
          (_status.event.name == "chooseToRespond" ? "打出" : "使用")
        )
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
      return (
        event.skill &&
        (event.skill.indexOf("reguhuo_") == 0 || event.skill.indexOf("reguhuo_") == 0)
      )
    },
    async content(event, trigger, player) {
      player.addTempSkill("reguhuo_phase")
      event.fake = false
      event.betrayer = null
      const [card] = trigger.cards
      if (
        card.name != trigger.card.name ||
        (card.name == "sha" && !get.is.sameNature(trigger.card, card))
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
        trigger.targets && trigger.targets.length ? "对" : "",
        trigger.targets || "",
        trigger.name == "useCard" ? "使用" : "打出",
        trigger.card,
      )
      event.prompt =
        get.translation(player) +
        "声明" +
        (trigger.targets && trigger.targets.length ? "对" + get.translation(trigger.targets) : "") +
        (trigger.name == "useCard" ? "使用" : "打出") +
        (get.translation(trigger.card.nature) || "") +
        get.translation(trigger.card.name) +
        "，是否质疑？"
      event.targets = game
        .filterPlayer(function (current) {
          return current != player && !current.hasSkill("chanyuan")
        })
        .sortBySeat(_status.currentPhase)
      game.broadcastAll(
        function (card, player) {
          _status.reguhuoNode = card.copy("thrown")
          if (lib.config.cardback_style != "default") {
            _status.reguhuoNode.style.transitionProperty = "none"
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.classList.add("infohidden")
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transitionProperty = ""
          } else {
            _status.reguhuoNode.classList.add("infohidden")
          }
          _status.reguhuoNode.style.transform = "perspective(600px) rotateY(180deg) translateX(0)"
          player.$throwordered2(_status.reguhuoNode)
        },
        trigger.cards[0],
        player,
      )
      event.onEnd01 = function () {
        _status.reguhuoNode.removeEventListener("webkitTransitionEnd", _status.event.onEnd01)
        setTimeout(function () {
          _status.reguhuoNode.style.transition = "all ease-in 0.3s"
          _status.reguhuoNode.style.transform = "perspective(600px) rotateY(270deg)"
          const onEnd = function () {
            _status.reguhuoNode.classList.remove("infohidden")
            _status.reguhuoNode.style.transition = "all 0s"
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transform = "perspective(600px) rotateY(-90deg)"
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transition = ""
            ui.refresh(_status.reguhuoNode)
            _status.reguhuoNode.style.transform = ""
            _status.reguhuoNode.removeEventListener("webkitTransitionEnd", onEnd)
          }
          _status.reguhuoNode.listenTransition(onEnd)
        }, 300)
      }
      for (const target of event.targets) {
        const { links } = await target
          .chooseButton([event.prompt, [["guhuo_ally", "guhuo_betray"], "vcard"]], true)
          .set("ai", function (button) {
            const player = _status.event.player
            const evt = _status.event.getParent("reguhuo_guess"),
              evtx = evt.getTrigger()
            if (!evt) {
              return Math.random()
            }
            const card = { name: evtx.card.name, nature: evtx.card.nature, isCard: true }
            const ally = button.link[2] == "guhuo_ally"
            if (ally && (player.hp <= 1 || get.attitude(player, evt.player) >= 0)) {
              return 1.1
            }
            if (!ally && get.attitude(player, evt.player) < 0 && evtx.name == "useCard") {
              let eff = 0
              const targetsx = evtx.targets || []
              for (const target of targetsx) {
                const isMe = target == evt.player
                eff += get.effect(target, card, evt.player, player) / (isMe ? 1.5 : 1)
              }
              eff /= 1.5 * targetsx.length || 1
              if (eff > 0) {
                return 0
              }
              if (eff < -7) {
                return Math.random() + Math.pow(-(eff + 7) / 8, 2)
              }
              return Math.pow((get.value(card, evt.player, "raw") - 4) / (eff == 0 ? 5 : 10), 2)
            }
            return Math.random()
          })
          .forResult()
        if (links[0][2] == "guhuo_betray") {
          target.addExpose(0.2)
          game.log(target, "#y质疑")
          target.popup("质疑！", "fire")
          event.betrayer = target
          break
        } else {
          game.log(target, "#g不质疑")
          target.popup("不质疑", "wood")
        }
      }
      await game.delayx()
      game.broadcastAll(function (onEnd) {
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
      if (player.hp == 1) {
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
        player.hp == 1
      )
    },
    mark: true,
    intro: {
      content(storage, player, skill) {
        let str = "<li>锁定技，你不能质疑〖蛊惑〗；若你的体力值为1，你的其他技能失效。"
        const list = player.getSkills(null, false, false).filter(function (i) {
          return lib.skill.chanyuan.skillBlocker(i, player)
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
      return player.hp == 1
    },
    forced: true,
    async content(event, trigger, player) {},
  },
}

export default skills
