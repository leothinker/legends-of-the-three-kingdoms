import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 刘备
  // 仁德
  oldrende: {
    audio: "rerende",
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    filterTarget: lib.filter.notMe,
    filterCard: true,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    position: "h",
    discard: false,
    lose: false,
    delay: false,
    async content(event, trigger, player) {
      const { cards, target, targets } = event
      const assignedTargets = targets.slice(0)
      let result

      event.num = cards.length
      event.targets = assignedTargets

      await player.give(cards, target)
      if (event.num > 1) {
        await player.recover()
      }

      while (
        player.countCards("h") > 0 &&
        game.hasPlayer(
          (current) => current !== player && !assignedTargets.includes(current),
        )
      ) {
        result = await player
          .chooseCardTarget({
            prompt: "是否继续将任意张手牌交给其他角色",
            prompt2: "操作提示：请先选择任意张手牌，然后再选择一名其他角色。",
            filterCard: true,
            selectCard: [1, Infinity],
            filterTarget(card, player, target) {
              return target !== player && !assignedTargets.includes(target)
            },
          })
          .forResult()

        if (!result.bool) {
          break
        }

        const currentTarget = result.targets[0]
        const selectedCards = result.cards

        player.line(currentTarget, "green")
        await player.give(selectedCards, currentTarget)
        assignedTargets.push(currentTarget)

        const prevNum = event.num
        event.num += selectedCards.length

        if (prevNum < 2 && event.num > 1) {
          await player.recover()
        }
      }
    },
  },
  // 黄月英
  // 集智
  oldjizhi: {
    audio: "rejizhi",
    trigger: { player: "useCard" },
    frequent: true,
    filter(event, player) {
      return get.type(event.card, "trick") === "trick" && event.card.isCard
    },
    async content(event, trigger, player) {
      let result

      // step 0
      const card = get.cards()[0]
      await game.cardsGotoOrdering(card)
      await player.showCards(card, `${get.translation(player)}发动了【集智】`)

      if (get.type(card) !== "basic") {
        await player.gain(card, "gain2")
        return
      }
      if (!player.countCards("h")) {
        return
      }

      // step 1
      result = await player
        .chooseCard(
          "h",
          `是否将一张手牌与${get.translation(card)}交换？`,
          `若选择「取消」，则将${get.translation(card)}置入弃牌堆。`,
        )
        .forResult()

      // step 2
      if (result.bool && result.cards?.length) {
        const handcard = result.cards[0]
        player.$throw(handcard, 1000)
        game.log(player, "将", handcard, "置于牌堆顶")
        await player.lose(handcard, ui.cardPile, "visible", "insert")
        await player.gain(card, "gain2")
      }
    },
  },
  // 奇才
  oldqicai: {
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
          !get
            .subtypes(card)
            .some((subtype) =>
              ["equip3", "equip4", "equip6"].includes(subtype),
            ) &&
          player !== target
        ) {
          return false
        }
      },
    },
  },
  // 袁术
  // 妄尊
  wangzun: {
    audio: 2,
    trigger: { global: "phaseZhunbeiBegin" },
    check(event, player) {
      return event.player === player || get.attitude(player, event.player) <= 0
    },
    filter(event, player) {
      return event.player.isZhu
    },
    logTarget: "player",
    async content(event, trigger, player) {
      await player.draw()
      const target = trigger.player
      target.addTempSkill("wangzun2")
      target.addMark("wangzun2", 1, false)
    },
    ai: {
      expose: 0.2,
    },
  },
  wangzun2: {
    onremove: true,
    mod: {
      maxHandcard(player, num) {
        return num - player.countMark("wangzun2")
      },
    },
    intro: { content: "手牌上限-#" },
  },
  // 同疾
  tongji: {
    global: "tongji_disable",
    audio: 2,
    trigger: { global: "useCard1" },
    forced: true,
    filter(event, player) {
      return (
        event.targets.includes(player) &&
        player !== event.player &&
        event.card.name === "sha" &&
        player.hp < player.countCards("h")
      )
    },
    content() {},
    ai: { neg: true },
    gainable: true,
    subSkill: {
      disable: {
        mod: {
          targetEnabled(card, player, target) {
            if (card.name === "sha") {
              if (player.hasSkill("tongji")) {
                return
              }
              if (target.hasSkill("tongji")) {
                return
              }
              if (
                game.hasPlayer(
                  (current) =>
                    current.hasSkill("tongji") &&
                    current.hp < current.countCards("h") &&
                    player.inRange(current),
                )
              ) {
                return false
              }
            }
          },
        },
      },
    },
  },
  // 界关羽
  // 义绝
  oldyijue: {
    audio: "yijue",
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return player !== target && target.countCards("h")
    },
    filter(event, player) {
      return player.countCards("h") > 0
    },
    async content(event, trigger, player) {
      const { target } = event
      let result

      // step 0
      result = await player
        .chooseToCompare(target)
        .set("small", true)
        .forResult()

      // step 1
      if (result.bool) {
        if (!target.hasSkill("fengyin")) {
          target.addTempSkill("fengyin")
        }
        target.addTempSkill("oldyijue2")
        return
      }
      if (target.hp < target.maxHp) {
        result = await player
          .chooseBool("是否令其回复1点体力？")
          .set("ai", () => get.recoverEffect(target, player, player) > 0)
          .forResult()
      } else {
        return
      }

      // step 2
      if (result.bool) {
        await target.recover()
      }
    },
    ai: {
      result: {
        target(player, target) {
          var hs = player.getCards("h")
          if (hs.length < 3) {
            return 0
          }
          var bool = false
          for (var i = 0; i < hs.length; i++) {
            if (get.number(hs[i]) >= 9 && get.value(hs[i]) < 7) {
              bool = true
              break
            }
          }
          if (!bool) {
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
    },
  },
  oldyijue2: {
    charlotte: true,
    mark: true,
    mod: {
      cardEnabled2(card) {
        if (get.position(card) === "h") {
          return false
        }
      },
    },
    intro: { content: "不能使用或打出手牌" },
  },
  // 界张飞
  // 替身
  oldtishen: {
    audio: "tishen",
    skillAnimation: true,
    animationColor: "soil",
    limited: true,
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      if (typeof player.storage.oldtishen2 === "number") {
        return player.hp < player.storage.oldtishen2
      }
      return false
    },
    check(event, player) {
      if (player.hp <= 1) {
        return true
      }
      return player.hp < player.storage.oldtishen2 - 1
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      const next = await player.recover(player.storage.oldtishen2 - player.hp)
      await player.draw(next.num)
    },
    intro: {
      mark(dialog, content, player) {
        if (player.storage.oldtishen) {
          return
        }
        if (typeof player.storage.oldtishen2 !== "number") {
          return "上回合结束后的体力：无"
        }
        return `上回合结束后的体力：${player.storage.oldtishen2}`
      },
      content: "limited",
    },
    group: ["oldtishen2"],
  },
  oldtishen2: {
    trigger: { player: "phaseJieshuBegin" },
    priority: -10,
    silent: true,
    sourceSkill: "oldtishen",
    async content(event, trigger, player) {
      player.storage.oldtishen2 = player.hp
      game.broadcast((pl) => {
        pl.storage.oldtishen2 = pl.hp
      }, player)
      game.addVideo("storage", player, [
        "oldtishen2",
        player.storage.oldtishen2,
      ])
    },
    intro: {
      content(storage, player) {
        if (player.storage.oldtishen) {
          return
        }
        return `上回合结束后的体力：${storage}`
      },
    },
  },
  // 界赵云
  // 涯角
  oldyajiao: {
    audio: "yajiao",
    trigger: { player: ["respond", "useCard"] },
    frequent: true,
    filter(event, player) {
      return (
        player !== _status.currentPhase && get.itemtype(event.cards) === "cards"
      )
    },
    async content(event, trigger, player) {
      let result

      // step 0
      event.card = get.cards()[0]
      game.broadcast((card) => {
        ui.arena.classList.add("thrownhighlight")
        card
          .copy("thrown", "center", "thrownhighlight", ui.arena)
          .addTempClass("start")
      }, event.card)
      event.node = event.card
        .copy("thrown", "center", "thrownhighlight", ui.arena)
        .addTempClass("start")
      ui.arena.classList.add("thrownhighlight")
      game.addVideo("thrownhighlight1")
      game.addVideo("centernode", null, get.cardInfo(event.card))

      if (get.type(event.card, "trick") === get.type(trigger.card, "trick")) {
        result = await player
          .chooseTarget("将此牌交给一名角色")
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
          .set("du", event.card.name === "du")
          .forResult()
      } else {
        result = await player
          .chooseBool(`是否将${get.translation(event.card)}置入弃牌堆？`)
          .forResult()
        event.disbool = true
      }

      await game.delay(2)

      // step 1
      if (event.disbool) {
        if (!result.bool) {
          game.log(player, "展示了", event.card)
          ui.cardPile.insertBefore(event.card, ui.cardPile.firstChild)
        } else {
          game.log(player, "展示并弃掉了", event.card)
          await event.card.discard()
        }
        game.addVideo("deletenode", player, [get.cardInfo(event.node)])
        event.node.delete()
        game.broadcast((card) => {
          ui.arena.classList.remove("thrownhighlight")
          if (card.clone) {
            card.clone.delete()
          }
        }, event.card)
      } else if (result.targets) {
        player.line(result.targets, "green")
        await result.targets[0].gain(event.card, "log")
        event.node.moveDelete(result.targets[0])
        game.addVideo("gain2", result.targets[0], [get.cardInfo(event.node)])
        game.broadcast(
          (card, target) => {
            ui.arena.classList.remove("thrownhighlight")
            if (card.clone) {
              card.clone.moveDelete(target)
            }
          },
          event.card,
          result.targets[0],
        )
      } else {
        game.log(player, "展示了", event.card)
        ui.cardPile.insertBefore(event.card, ui.cardPile.firstChild)
        game.addVideo("deletenode", player, [get.cardInfo(event.node)])
        event.node.delete()
        game.broadcast((card) => {
          ui.arena.classList.remove("thrownhighlight")
          if (card.clone) {
            card.clone.delete()
          }
        }, event.card)
      }
      game.addVideo("thrownhighlight2")
      ui.arena.classList.remove("thrownhighlight")
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
  // 徐庶
  // 诛害
  zhuhai: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    direct: true,
    filter(event, player) {
      return (
        event.player.isIn() &&
        event.player.getStat("damage") &&
        lib.filter.targetEnabled({ name: "sha" }, player, event.player) &&
        (player.hasSha() || (_status.connectMode && player.countCards("h") > 0))
      )
    },
    clearTime: true,
    async content(event, trigger, player) {
      await player
        .chooseToUse(
          function (card, player, event) {
            if (get.name(card) !== "sha") {
              return false
            }
            return lib.filter.filterCard.apply(this, arguments)
          },
          `诛害：是否对${get.translation(trigger.player)}使用一张【杀】？`,
        )
        .set("logSkill", "zhuhai")
        .set("complexSelect", true)
        .set("complexTarget", true)
        .set("filterTarget", function (card, player, target) {
          if (
            target !== _status.event.sourcex &&
            !ui.selected.targets.includes(_status.event.sourcex)
          ) {
            return false
          }
          return lib.filter.targetEnabled.apply(this, arguments)
        })
        .set("sourcex", trigger.player)
    },
  },
  // 潜心
  qianxin: {
    skillAnimation: true,
    animationColor: "orange",
    audio: 2,
    juexingji: true,
    trigger: { source: "damageSource" },
    forced: true,
    derivation: "jianyan",
    filter(event, player) {
      return player.hp < player.maxHp
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.addSkills("jianyan")
      await player.loseMaxHp()
    },
  },
  // 荐言
  jianyan: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    delay: false,
    filter(event, player) {
      return game.hasPlayer((current) => current.hasSex("male"))
    },
    async content(event, trigger, player) {
      let result

      // step 0
      result = await player
        .chooseControl(["red", "black", "basic", "trick", "equip"])
        .set("ai", () => {
          var player = _status.event.player
          if (!player.hasShan()) {
            return "basic"
          }
          if (player.countCards("e") <= 1) {
            return "equip"
          }
          if (player.countCards("h") > 2) {
            return "trick"
          }
          return "red"
        })
        .forResult()

      // step 1
      while (true) {
        const next = get.cards()[0]
        await player.showCards(
          next,
          `${get.translation(player)}发动了【荐言】`,
          true,
        )
        if (
          get.color(next) === result.control ||
          get.type(next, "trick") === result.control
        ) {
          event.card = next
          break
        }
        if (
          !ui.cardPile.hasChildNodes() &&
          !get.discardPile(
            (card) =>
              get.color(card) === result.control ||
              get.type(card, "trick") === result.control,
          )
        ) {
          return
        }
      }
      await player.showCards([event.card])

      // step 2
      result = await player
        .chooseTarget(
          true,
          `令一名男性角色获得${get.translation(event.card)}`,
          (card, player, target) => target.hasSex("male"),
        )
        .set("ai", (target) => {
          var att = get.attitude(_status.event.player, target)
          if (_status.event.neg) {
            return -att
          }
          return att
        })
        .set("neg", get.value(event.card, player, "raw") < 0)
        .forResult()

      // step 3
      player.line(result.targets, "green")
      await result.targets[0].gain(event.card, "gain2")
    },
    ai: {
      order: 9,
      result: {
        player(player) {
          if (
            game.hasPlayer(
              (current) =>
                current.hasSex("male") && get.attitude(player, current) > 0,
            )
          ) {
            return 2
          }
          return 0
        },
      },
      threaten: 1.2,
    },
  },
  // 界曹操
  // 奸雄
  oldjianxiong: {
    audio: "rejianxiong",
    trigger: { player: "damageEnd" },
    async cost(event, trigger, player) {
      const list = ["摸牌"]
      if (
        get.itemtype(trigger.cards) === "cards" &&
        trigger.cards.filterInD().length
      ) {
        list.push("拿牌")
      }
      list.push("cancel2")
      const { control } = await player
        .chooseControl(list)
        .set("prompt", get.prompt2(event.skill))
        .set("ai", () => {
          const player = get.event().player,
            trigger = get.event().getTrigger()
          const cards = trigger.cards ? trigger.cards.filterInD() : []
          if (get.event().controls.includes("拿牌")) {
            if (
              cards.reduce((sum, card) => {
                return sum + (card.name === "du" ? -1 : 1)
              }, 0) > 1 ||
              player.getUseValue(cards[0]) > 6
            ) {
              return "拿牌"
            }
          }
          return "摸牌"
        })
        .forResult()
      event.result = { bool: control !== "cancel2", cost_data: control }
    },
    async content(event, trigger, player) {
      if (event.cost_data === "摸牌") {
        await player.draw()
      } else {
        await player.gain(trigger.cards.filterInD(), "gain2")
      }
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
            return [1, 0.6]
          }
        },
      },
    },
  },
  // 界夏侯惇
  // 清俭
  oldqingjian: {
    audio: "qingjian",
    trigger: { player: "gainAfter", global: "loseAsyncAfter" },
    direct: true,
    filter(event, player) {
      var evt = event.getParent("phaseDraw")
      if (evt && evt.player === player) {
        return false
      }
      return event.getg(player).length > 0
    },
    async content(event, trigger, player) {
      let result
      // step 0
      event.cards = trigger.getg(player)
      // step 1..n
      while (true) {
        result = await player
          .chooseCardTarget({
            filterCard(card) {
              return _status.event.getParent().cards.includes(card)
            },
            selectCard: [1, event.cards.length],
            filterTarget(card, player, target) {
              return player !== target
            },
            allowChooseAll: true,
            ai1(card) {
              if (ui.selected.cards.length > 0) {
                return -1
              }
              if (card.name === "du") {
                return 20
              }
              return (
                _status.event.player.countCards("h") - _status.event.player.hp
              )
            },
            ai2(target) {
              var att = get.attitude(_status.event.player, target)
              if (
                ui.selected.cards.length &&
                ui.selected.cards[0].name === "du"
              ) {
                if (target.hasSkillTag("nodu")) {
                  return 0
                }
                return 1 - att
              }
              if (
                target.countCards("h") > _status.event.player.countCards("h")
              ) {
                return 0
              }
              return att - 4
            },
            prompt: "将其中任意张牌交给其他角色",
          })
          .forResult()

        // step 2
        if (result.bool) {
          player.logSkill("oldqingjian", result.targets)
          await player.give(result.cards, result.targets[0])
          for (var i = 0; i < result.cards.length; i++) {
            event.cards.remove(result.cards[i])
          }
          if (event.cards.length) {
            continue
          }
          break
        }
        break
      }
    },
    ai: {
      expose: 0.3,
    },
  },
  // 界张辽
  // 突袭
  oldtuxi: {
    audio: "retuxi",
    trigger: { player: "phaseDrawBegin2" },
    direct: true,
    filter(event) {
      return event.num > 0
    },
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .chooseTarget(
          get.prompt("oldtuxi"),
          [1, trigger.num],
          (card, player, target) =>
            target.countCards("h") > 0 &&
            player !== target &&
            target.countCards("h") >= player.countCards("h"),
          (target) => {
            var att = get.attitude(_status.event.player, target)
            if (target.hasSkill("tuntian")) {
              return att / 10
            }
            return 1 - att
          },
        )
        .forResult()
      // step 1
      if (result.bool) {
        player.logSkill("oldtuxi", result.targets)
        await player.gainMultiple(result.targets)
        trigger.num -= result.targets.length
      } else {
        event.finish()
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
  oldluoyi: {
    audio: "reluoyi",
    trigger: { player: "phaseDrawBegin1" },
    filter(event, player) {
      return !event.numFixed
    },
    check(event, player) {
      if (player.countCards("h", "sha")) {
        return true
      }
      return Math.random() < 0.5
    },
    async content(event, trigger, player) {
      // step 0
      player.addTempSkill("reluoyi2", { player: "phaseBefore" })
      trigger.changeToZero()

      // step 1
      event.cards = get.cards(3)
      await player.showCards(event.cards, "裸衣")

      // step 2
      const cards = event.cards
      for (let i = 0; i < cards.length; i++) {
        if (
          get.type(cards[i]) !== "basic" &&
          cards[i].name !== "juedou" &&
          (get.type(cards[i]) !== "equip" || get.subtype(cards[i]) !== "equip1")
        ) {
          cards[i].discard()
          cards.splice(i--, 1)
        }
      }
      await player.gain(cards, "gain2")
    },
  },
  // 界郭嘉
  // 遗计
  oldyiji: {
    audio: "reyiji",
    trigger: { player: "damageEnd" },
    frequent: true,
    filter(event) {
      return event.num > 0
    },
    async content(event, trigger, player) {
      // initialize counters (mimic step 0)
      event.num = 1
      event.count = 1

      let result
      // repeat for trigger.num times (event.count starts at 1)
      while (event.count <= trigger.num) {
        // step 1: draw/gain two cards
        await player.gain(get.cards(2))
        player.$draw(2)

        // step 2/3: allow up to two give-aways per iteration
        while (true) {
          result = await player
            .chooseCardTarget({
              filterCard: true,
              selectCard: [1, 2],
              filterTarget(card, player, target) {
                return player !== target && target !== event.temp
              },
              ai1(card) {
                if (ui.selected.cards.length > 0) return -1
                if (card.name === "du") return 20
                return (
                  _status.event.player.countCards("h") - _status.event.player.hp
                )
              },
              ai2(target) {
                var att = get.attitude(_status.event.player, target)
                if (
                  ui.selected.cards.length &&
                  ui.selected.cards[0].name === "du"
                ) {
                  if (target.hasSkillTag("nodu")) return 0
                  return 1 - att
                }
                return att - 4
              },
              prompt: "在至多两名其他角色的武将牌旁分别扣置至多两张手牌",
            })
            .forResult()

          if (result?.bool) {
            // move chosen cards to storage
            await player.lose(result.cards, ui.special, "toStorage")
            const tar = result.targets[0]
            if (tar.hasSkill("oldyiji2")) {
              tar.storage.oldyiji2 = tar.storage.oldyiji2.concat(result.cards)
            } else {
              tar.addSkill("oldyiji2")
              tar.storage.oldyiji2 = result.cards
            }
            player.$give(result.cards.length, tar, false)
            player.line(result.targets, "green")
            game.addVideo("storage", tar, [
              "oldyiji2",
              get.cardsInfo(tar.storage.oldyiji2),
              "cards",
            ])

            // if this is the first give in this iteration, allow a second give (to a different target)
            if (event.num === 1) {
              event.temp = tar
              event.num++
              continue // go back to chooseCardTarget (step 2)
            }

            // finished gives for this iteration -> prepare next iteration (if any)
            delete event.temp
            event.num = 1
            event.count++
            break
          }
          // player declined to give; if more iterations remain, continue loop; otherwise finish
          if (event.count < trigger.num) {
            delete event.temp
            event.num = 1
            event.count++
            break
          }
          return
        }

        // loop continues while(event.count <= trigger.num)
      }
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
            var num = 1
            if (get.attitude(player, target) > 0) {
              if (player.needsToDiscard()) {
                num = 0.7
              } else {
                num = 0.5
              }
            }
            if (player.hp >= 4) {
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
  oldyiji2: {
    trigger: { player: "phaseDrawBegin" },
    forced: true,
    mark: true,
    popup: "遗计获得牌",
    audio: false,
    sourceSkill: "oldyiji",
    async content(event, trigger, player) {
      await player.$draw(player.storage.oldyiji2.length)
      await player.gain(player.storage.oldyiji2, "fromStorage")
      delete player.storage.oldyiji2
      player.removeSkill("oldyiji2")
      await game.delay()
    },
    intro: {
      content: "cardCount",
    },
  },
  // 界吕布
  // 利驭
  oldliyu: {
    audio: "liyu",
    trigger: { source: "damageSource" },
    forced: true,
    filter(event, player) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return (
        event.card &&
        event.card.name === "sha" &&
        event.player.isIn() &&
        event.player.countGainableCards(player, "he") > 0
      )
    },
    check() {
      return false
    },
    async content(event, trigger, player) {
      // step 0
      const result = await trigger.player
        .chooseTarget((card, player, target) => {
          var evt = _status.event.getParent()
          return (
            evt.player.canUse({ name: "juedou" }, target) &&
            target !== _status.event.player
          )
        }, get.prompt("oldliyu"))
        .set("ai", (target) => {
          var evt = _status.event.getParent()
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

      // step 1
      if (result.bool) {
        await player.gainPlayerCard(trigger.player, "he", true)
        event.target = result.targets[0]
        trigger.player.line(player, "green")
      } else {
        return
      }

      // step 2
      if (event.target) {
        await player.useCard(
          { name: "juedou", isCard: true },
          event.target,
          "noai",
        )
      }
    },
    ai: {
      halfneg: true,
    },
  },
  // 旧于禁
  // 毅重
  yizhong: {
    trigger: { target: "shaBefore" },
    forced: true,
    audio: 2,
    filter(event, player) {
      if (!player.hasEmptySlot(2)) {
        return false
      }
      return event.card.name === "sha" && get.color(event.card) === "black"
    },
    async content(event, trigger, player) {
      trigger.cancel()
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (player === target && get.subtypes(card).includes("equip2")) {
            if (get.equipValue(card) <= 8) {
              return 0
            }
          }
          if (!player.hasEmptySlot(2)) {
            return
          }
          if (card.name === "sha" && get.color(card) === "black") {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 旧法正
  // 恩怨
  oldenyuan: {
    audio: 4,
    locked: true,
    group: ["oldenyuan1", "oldenyuan2"],
  },
  oldenyuan1: {
    audio: ["oldenyuan3.mp3", "oldenyuan4.mp3"],
    trigger: { player: "damageEnd" },
    forced: true,
    sourceSkill: "oldenyuan",
    filter(event, player) {
      return event.source?.isIn() && event.source !== player && event.num > 0
    },
    logTarget: "source",
    getIndex: (event) => event.num,
    async content(event, trigger, player) {
      const result = await trigger.source
        .chooseToGive(
          `恩怨：交给${get.translation(player)}一张红桃手牌，或失去1点体力`,
          (card, player) => {
            return get.suit(card) === "heart"
          },
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
            return [1, -2]
          }
          if (!target.hasFriend()) {
            return
          }
          if (get.tag(card, "damage")) {
            return [1, 0, 0, -1]
          }
        },
      },
    },
  },
  oldenyuan2: {
    audio: ["oldenyuan1.mp3", "oldenyuan2.mp3"],
    trigger: { player: "recoverEnd" },
    forced: true,
    logTarget: "source",
    sourceSkill: "oldenyuan",
    filter(event, player) {
      return event.source?.isIn() && event.source !== player && event.num > 0
    },
    getIndex: (event) => event.num,
    async content(event, trigger, player) {
      await trigger.source.draw()
    },
  },
  // 眩惑
  oldxuanhuo: {
    audio: 2,
    usable: 1,
    enable: "phaseUse",
    discard: false,
    lose: false,
    delay: 0,
    filter(event, player) {
      return player.countCards("he", { suit: "heart" })
    },
    filterCard(card) {
      return get.suit(card) === "heart"
    },
    filterTarget(card, player, target) {
      if (game.countPlayer() === 2) {
        return false
      }
      return player !== target
    },
    check(card) {
      var player = get.owner(card)
      var players = game.filterPlayer()
      for (var i = 0; i < players.length; i++) {
        if (players[i] !== player && get.attitude(player, players[i]) > 3) {
          break
        }
      }
      if (i === players.length) {
        return -1
      }
      return 5 - get.value(card)
    },
    async content(event, trigger, player) {
      const { cards, target } = event

      await player.give(cards, target)

      let result = await player
        .gainPlayerCard({
          target,
          position: "he",
          forced: true,
        })
        .forResult()

      if (!result.bool || !result.cards?.length) {
        return
      }

      const card = result.cards[0]
      if (!player.hasCard((cardx) => cardx === card, "h")) {
        return
      }

      result = await player
        .chooseTarget({
          prompt: `将${get.translation(card)}交给另一名其他角色`,
          filterTarget(card, player, target) {
            return target !== get.event().sourcex && target !== player
          },
          ai(target) {
            return get.attitude(get.event().player, target)
          },
        })
        .set("sourcex", target)
        .forResult()

      if (result.bool && result.targets?.length) {
        await player.give(card, result.targets[0], "give")
        await game.delay()
      }
    },
    ai: {
      result: {
        target: -0.5,
      },
      basic: {
        order: 9,
      },
    },
  },
  // 旧马谡
  // 心战
  xinzhan: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return player.countCards("h") > player.maxHp
    },
    usable: 1,
    async content(event, trigger, player) {
      const cards = get.cards(3)
      const result = await player
        .chooseCardButton({
          prompt: "选择获得的红桃牌",
          cards,
          filter(button) {
            return get.suit(button.link) === "heart"
          },
          select: [1, Infinity],
        })
        .forResult()
      if (result.bool) {
        await player.gain({
          cards: result.links,
          animate: "draw",
        })
        cards.removeArray(result.links)
      }
      for (const card of cards.slice(0).reverse()) {
        ui.cardPile.insertBefore(card, ui.cardPile.firstChild)
      }
    },
    ai: {
      order: 11,
      result: {
        player: 1,
      },
    },
  },
  // 挥泪
  huilei: {
    audio: 2,
    trigger: { player: "die" },
    forced: true,
    forceDie: true,
    filter(event) {
      return event.source?.isIn()
    },
    logTarget: "source",
    skillAnimation: true,
    animationColor: "thunder",
    async content(event, trigger, player) {
      trigger.source.discard(trigger.source.getCards("he"))
    },
    ai: {
      threaten: 0.7,
    },
  },
  // 旧马谡
  // 无言
  oldwuyan: {
    audio: 2,
    trigger: { target: "useCardToBefore", player: "useCardToBefore" },
    forced: true,
    check(event, player) {
      return get.effect(event.target, event.card, event.player, player) < 0
    },
    filter(event, player) {
      if (!event.target) {
        return false
      }
      if (event.player === player && event.target === player) {
        return false
      }
      return get.type(event.card) === "trick"
    },
    async content(event, trigger, player) {
      trigger.cancel()
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "trick" && player !== target) {
            return "zeroplayertarget"
          }
        },
        player(card, player, target, current) {
          if (get.type(card) === "trick" && player !== target) {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 举荐
  oldjujian: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    filterCard: true,
    position: "he",
    selectCard: [1, 3],
    check(card) {
      var player = get.owner(card)
      if (get.type(card) === "trick") {
        return 10
      }
      if (player.countCards("h") - player.hp - ui.selected.cards.length > 0) {
        return 8 - get.value(card)
      }
      return 4 - get.value(card)
    },
    filterTarget(card, player, target) {
      return player !== target
    },
    async content(event, trigger, player) {
      const { cards, target } = event
      target.draw(cards.length)
      if (cards.length === 3) {
        if (
          get.type(cards[0], "trick") === get.type(cards[1], "trick") &&
          get.type(cards[0], "trick") === get.type(cards[2], "trick")
        ) {
          player.recover()
        }
      }
    },
    ai: {
      expose: 0.2,
      order: 1,
      result: {
        target: 1,
      },
    },
  },
  // 旧凌统
  // 旋风
  oldxuanfeng: {
    audio: "xuanfeng",
    trigger: {
      player: ["loseAfter"],
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    filter(event, player) {
      var evt = event.getl(player)
      return evt?.es && evt.es.length > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt("oldxuanfeng"),
          filterTarget(card, player, target) {
            if (target === player) {
              return false
            }
            return (
              get.distance(player, target) <= 1 ||
              player.canUse("sha", target, false)
            )
          },
          ai(target) {
            if (get.distance(player, target) <= 1) {
              return get.damageEffect(target, player, player) * 2
            }
            return get.effect(target, { name: "sha" }, player, player)
          },
        })
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]
      const distance = get.distance(player, target)
      if (distance <= 1 && player.canUse("sha", target, false)) {
        const result = await player
          .chooseControl({
            controls: ["出杀", "造成伤害"],
            ai() {
              return "造成伤害"
            },
          })
          .forResult()
        if (result.control === "出杀") {
          await player
            .useCard({
              card: get.autoViewAs({ name: "sha", isCard: true }),
              targets: [target],
              addCount: false,
            })
            .set("animate", false)
          await game.delay()
        } else {
          await target.damage()
        }
      } else if (distance <= 1) {
        await target.damage()
      } else {
        await player
          .useCard({
            card: get.autoViewAs({ name: "sha", isCard: true }),
            targets: [target],
            addCount: false,
          })
          .set("animate", false)
        await game.delay()
      }
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "equip") {
            return [1, 3]
          }
        },
      },
      reverseEquip: true,
      noe: true,
    },
  },
  // 旧徐盛
  // 破军
  oldpojun: {
    audio: "pojun",
    trigger: { source: "damageSource" },
    check(event, player) {
      if (event.player.isTurnedOver()) {
        return get.attitude(player, event.player) > 0
      }
      if (event.player.hp < 3) {
        return get.attitude(player, event.player) < 0
      }
      return get.attitude(player, event.player) > 0
    },
    filter(event) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return event.card && event.card.name === "sha" && event.player.isIn()
    },
    logTarget: "player",
    async content(event, trigger, player) {
      await trigger.player.draw(Math.min(5, trigger.player.hp))
      await trigger.player.turnOver()
    },
  },
  // 旧曹彰
  // 将驰
  oldjiangchi: {
    audio: "jiangchi",
    trigger: { player: "phaseDrawBegin2" },
    logAudio: (event, player, name, indexedData, costResult) =>
      costResult.cost_data.control === "oldjiangchi_less"
        ? "jiangchi2.mp3"
        : "jiangchi1.mp3",
    filter(event, player) {
      return !event.numFixed
    },
    async cost(event, trigger, player) {
      const result = await player
        .chooseControl({
          controls: ["oldjiangchi_less", "oldjiangchi_more", "cancel2"],
          ai() {
            const player = get.player()
            if (
              player.countCards("h") > 3 &&
              player.countCards("h", "sha") > 1
            ) {
              return "oldjiangchi_less"
            }
            if (player.countCards("h", "sha") > 2) {
              return "oldjiangchi_less"
            }
            if (player.hp - player.countCards("h") > 1) {
              return "oldjiangchi_more"
            }
            return "cancel2"
          },
        })
        .forResult()

      event.result = {
        bool: result.control !== "cancel2",
        cost_data: {
          control: result.control,
        },
      }
    },
    async content(event, trigger, player) {
      const { control } = event.cost_data
      if (control === "oldjiangchi_less") {
        trigger.num--
        player.addTempSkill("jiangchi2", "phaseEnd")
      } else if (control === "oldjiangchi_more") {
        trigger.num++
        player.addTempSkill("oldjiangchi3", "phaseEnd")
      }
    },
  },
  oldjiangchi3: {
    mod: {
      cardEnabled2(card) {
        if (card.name === "sha") {
          return false
        }
      },
    },
  },
  // 旧王异
  // 贞烈
  oldzhenlie: {
    audio: 2,
    trigger: {
      player: "judge",
    },
    check(event, player) {
      return event.judge(player.judging[0]) < 0
    },
    async content(event, trigger, player) {
      const card = get.cards()[0]

      const next = game.cardsGotoOrdering(card)
      next.relatedEvent = trigger
      await next

      player.$throw(card)
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
      trigger.player.judging[0] = card
      game.log(trigger.player, "的判定牌改为", card)
      await game.cardsDiscard(trigger.player.judging[0])
      await game.delay(2)
    },
  },
  // 秘计
  oldmiji: {
    trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
    audio: 2,
    filter(event, player) {
      return player.isDamaged()
    },
    async content(event, trigger, player) {
      let result = await player
        .judge({
          judge(card) {
            return get.color(card) === "black" ? 1 : -1
          },
          judge2(result) {
            return result.bool
          },
        })
        .forResult()

      if (!result.bool || player.maxHp <= player.hp) {
        return
      }

      const cards = get.cards(player.maxHp - player.hp)
      result = await player
        .chooseTarget({
          forced: true,
          ai(target) {
            const player = get.player()
            return (
              get.attitude(player, target) /
              Math.sqrt(1 + target.countCards("h"))
            )
          },
        })
        .set("createDialog", ["请选择将这些牌交给一名角色", cards])
        .forResult()

      if (result.bool && result.targets?.length) {
        player.line(result.targets)
        await result.targets[0].gain({
          cards,
          animate: "draw",
        })
      }
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.tag(card, "recover") && target.hp === target.maxHp - 1) {
            return [0, 0]
          }
          if (target.hasFriend()) {
            if (
              (get.tag(card, "damage") === 1 || get.tag(card, "loseHp")) &&
              target.hp === target.maxHp
            ) {
              return [0, 1]
            }
          }
        },
      },
      threaten(player, target) {
        if (target.hp === 1) {
          return 3
        }
        if (target.hp === 2) {
          return 2
        }
        return 1
      },
    },
  },
  // 旧关兴张苞
  // 父魂
  oldfuhun: {
    audio: 2,
    trigger: { player: "phaseDrawBegin1" },
    filter(event, player) {
      return !event.numFixed
    },
    async content(event, trigger, player) {
      trigger.changeToZero()

      const cards = get.cards(2)
      await player.showCards(cards, `${get.translation(player)}发动了【父魂】`)

      await player.gain({
        cards,
        animate: "gain2",
      })
      if (get.color(cards[0]) !== get.color(cards[1])) {
        player.addTempSkills(["wusheng", "paoxiao"])
      }
    },
    derivation: ["wusheng", "paoxiao"],
  },
  // 旧廖化
  // 当先
  olddangxian: {
    trigger: { player: "phaseBegin" },
    forced: true,
    audio: "dangxian",
    async content(event, trigger, player) {
      trigger.phaseList.splice(trigger.num, 0, `phaseUse|${event.name}`)
    },
  },
  // 伏枥
  oldfuli: {
    skillAnimation: true,
    animationColor: "soil",
    audio: "fuli",
    limited: true,
    enable: "chooseToUse",
    filter(event, player) {
      if (event.type !== "dying") {
        return false
      }
      if (player !== event.dying) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.recoverTo(game.countGroup())
      await player.turnOver()
    },
    ai: {
      save: true,
      skillTagFilter(player, arg, target) {
        return player === target && player.storage.oldfuli !== true
      },
      result: {
        player: 10,
      },
      threaten(player, target) {
        if (!target.storage.oldfuli) {
          return 0.9
        }
      },
    },
  },
  // 旧马岱
  // 潜袭
  oldqianxi: {
    audio: 2,
    trigger: { source: "damageBegin2" },
    check(event, player) {
      const att = get.attitude(player, event.player)
      if (event.player.hp === event.player.maxHp) {
        return att < 0
      }
      if (
        event.player.hp === event.player.maxHp - 1 &&
        (event.player.maxHp <= 3 || event.player.hasSkillTag("maixie"))
      ) {
        return att < 0
      }
      return att > 0
    },
    filter(event, player) {
      return (
        event.card &&
        event.card.name === "sha" &&
        get.distance(player, event.player) <= 1
      )
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const result = await player
        .judge({
          judge(card) {
            return get.suit(card) !== "heart" ? 1 : -1
          },
          judge2(result) {
            return result.bool
          },
        })
        .forResult()

      if (result.bool) {
        trigger.cancel()
        trigger.player.loseMaxHp({ forced: true })
      }
    },
  },
  // 旧韩当
  // 弓骑
  oldgongqi: {
    audio: "gongqi",
    enable: ["chooseToUse", "chooseToRespond"],
    locked: false,
    filterCard: { type: "equip" },
    position: "hes",
    viewAs: {
      name: "sha",
      storage: { oldgongqi: true },
    },
    viewAsFilter(player) {
      if (!player.countCards("hes", { type: "equip" })) {
        return false
      }
    },
    prompt: "将一张装备牌当无距离限制的【杀】使用或打出",
    check(card) {
      var val = get.value(card)
      if (_status.event.name === "chooseToRespond") {
        return 1 / Math.max(0.1, val)
      }
      return 5 - val
    },
    mod: {
      targetInRange(card) {
        if (card.storage?.oldgongqi) {
          return true
        }
      },
    },
    ai: {
      respondSha: true,
      skillTagFilter(player) {
        if (!player.countCards("hes", { type: "equip" })) {
          return false
        }
      },
    },
  },
  // 解烦
  oldjiefan: {
    audio: "jiefan",
    trigger: { player: "chooseToUseBegin" },
    filter(event, player) {
      return event.type === "dying" && _status.currentPhase !== player
    },
    direct: true,
    clearTime: true,
    async content(event, trigger, player) {
      const list = [event.name, trigger.dying]
      await player
        .chooseToUse({
          filterCard(card, player, event) {
            if (get.name(card) !== "sha") {
              return false
            }
            // @ts-expect-error
            return lib.filter.filterCard.apply(this, arguments)
          },
          prompt: get.prompt2(...list),
        })
        .set("targetRequired", true)
        .set("complexSelect", true)
        .set("complexTarget", true)
        .set("filterTarget", function (card, player, target) {
          if (
            target !== _status.currentPhase &&
            !ui.selected.targets.includes(_status.currentPhase)
          ) {
            return false
          }
          return lib.filter.filterTarget.apply(this, arguments)
        })
        .set("logSkill", list)
        .set("oncard", () => {
          _status.event.player.addTempSkill("oldjiefan_recover")
        })
        .set("custom", {
          add: {},
          replace: {
            window: () => {
              ui.click.cancel()
            },
          },
        })
    },
    ai: {
      save: true,
      order: 3,
      result: { player: 1 },
    },
    subSkill: {
      recover: {
        // audio:'jiefan',
        trigger: { source: "damageBegin2" },
        filter(event, player) {
          return event.getParent(4).name === "oldjiefan"
        },
        forced: true,
        popup: false,
        charlotte: true,
        async content(event, trigger, player) {
          trigger.cancel()
          const evt = event.getParent("_save")
          const card = { name: "tao", isCard: true }
          if (evt?.dying && player.canUse(card, evt.dying)) {
            await player.useCard({
              card: get.autoViewAs(card),
              targets: [evt.dying],
              skill: "oldjiefan_recover",
            })
          }
        },
      },
    },
  },
  // 将华雄
  // 恃勇
  shiyong: {
    audio: 2,
    trigger: { player: "damageEnd" },
    forced: true,
    check() {
      return false
    },
    filter(event, player) {
      return (
        event.card &&
        event.card.name === "sha" &&
        (get.color(event.card) === "red" || event.getParent(2).jiu === true)
      )
    },
    async content(event, trigger, player) {
      await player.loseMaxHp()
    },
    ai: {
      neg: true,
    },
  },
  // 旧刘表
  // 自守
  oldzishou: {
    audio: "zishou",
    audioname: ["re_liubiao"],
    trigger: { player: "phaseDrawBegin2" },
    check(event, player) {
      return (
        (player.countCards("h") <= 2 && player.getDamagedHp() >= 2) ||
        player.skipList.includes("phaseUse")
      )
    },
    filter(event, player) {
      return !event.numFixed && player.isDamaged()
    },
    async content(event, trigger, player) {
      trigger.num += player.getDamagedHp()
      player.skip("phaseUse")
    },
    ai: {
      threaten: 1.5,
    },
  },
  // 旧曹冲
  // 称象
  oldchengxiang: {
    audio: "chengxiang",
    inherit: "chengxiang",
    maxNum: 12,
  },
  // 仁心
  oldrenxin: {
    audio: "renxin",
    trigger: { global: "dying" },
    //priority:6,
    filter(event, player) {
      return (
        event.player !== player &&
        event.player.hp <= 0 &&
        player.countCards("h") > 0
      )
    },
    check(event, player) {
      if (get.attitude(player, event.player) <= 0) {
        return false
      }
      if (
        player.countCards("h", { name: ["tao", "jiu"] }) + event.player.hp <
        0
      ) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      await player.turnOver()
      await player.give(player.getCards("h"), trigger.player)
      await trigger.player.recover()
    },
  },
  // 旧郭淮
  // 精策
  oldjingce: {
    trigger: { player: "phaseUseEnd" },
    frequent: true,
    filter(event, player) {
      return player.countUsed(null, true) >= player.hp
    },
    async content(event, trigger, player) {
      player.draw(2)
    },
    audio: "jingce",
  },
  // 旧满宠
  // 峻刑
  oldjunxing: {
    enable: "phaseUse",
    audio: "junxing",
    usable: 1,
    filterCard: true,
    selectCard: [1, Infinity],
    filter(event, player) {
      return player.countCards("h") > 0
    },
    check(card) {
      if (ui.selected.cards.length) {
        return -1
      }
      var val = get.value(card)
      if (get.type(card) === "basic") {
        return 8 - get.value(card)
      }
      return 5 - get.value(card)
    },
    filterTarget(card, player, target) {
      return player !== target
    },
    allowChooseAll: true,
    async content(event, trigger, player) {
      const { cards, target } = event
      const types = new Set(cards.map((card) => get.type2(card, player)))
      const result = await target
        .chooseToDiscard({
          filterCard(card) {
            return !_status.event.types.has(get.type2(card))
          },
          ai(card) {
            if (_status.event.player.isTurnedOver()) {
              return -1
            }
            return 8 - get.value(card)
          },
        })
        .set("types", types)
        .set("dialog", [
          `弃置与${get.translation(player)}弃置的牌类别均不同的一张手牌，或翻面`,
          "hidden",
          cards,
        ])
        .forResult()
      if (!result.bool) {
        await target.turnOver()
        await target.draw(cards.length)
      }
    },
    ai: {
      order: 2,
      expose: 0.3,
      threaten: 1.8,
      result: {
        target(player, target) {
          if (target.hasSkillTag("noturn")) {
            return 0
          }
          if (target.isTurnedOver()) {
            return 2
          }
          return -1 / (target.countCards("h") + 1)
        },
      },
    },
  },
  // 旧朱然
  // 胆守
  olddanshou: {
    audio: "danshou",
    derivation: "olddanshou_faq",
    trigger: { source: "damageSource" },
    //priority:9,
    check(event, player) {
      return get.attitude(player, event.player) <= 0
    },
    async content(event, trigger, player) {
      await player.draw()
      const cards = Array.from(ui.ordering.childNodes)
      cards.forEach((card) => card.discard())
      const evt = _status.event.getParent("phase", true)
      if (evt) {
        game.resetSkills()
        _status.event = evt
        _status.event.finish()
        _status.event.untrigger(true)
      }
    },
    ai: {
      jueqing: true,
    },
  },
  // 旧伏皇后
  // 惴恐
  oldzhuikong: {
    audio: "zhuikong",
    inherit: "zhuikong",
  },
  // 求援
  oldqiuyuan: {
    audio: "qiuyuan",
    inherit: "qiuyuan",
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        game.hasPlayer((current) => {
          return (
            current !== player &&
            !event.targets.includes(current) &&
            current.countCards("h") > 0 &&
            lib.filter.targetEnabled(event.card, event.player, current)
          )
        })
      )
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      const { card } = trigger
      const result = await target
        .chooseToGive(
          "h",
          `交给${get.translation(player)}一张手牌，若此牌不为【闪】，你也成为${get.translation(card)}的目标`,
          player,
          true,
        )
        .set("ai", (card) => {
          const { player, target } = get.event()
          return (
            Math.sign(Math.sign(get.attitude(player, target)) - 0.5) *
            get.value(card, player, "raw")
          )
        })
        .forResult()
      if (
        !result?.bool ||
        !result?.cards?.length ||
        get.name(result.cards[0], target) !== "shan"
      ) {
        trigger.getParent().targets.push(target)
        trigger.getParent().triggeredTargets2.push(target)
        game.log(target, "成为了", card, "的额外目标")
      }
    },
  },
  // 旧李儒
  // 绝策
  oldjuece: {
    audio: "juece",
    trigger: {
      global: [
        "loseAfter",
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    getIndex(event, player) {
      if (_status.currentPhase !== player) {
        return []
      }
      return game.filterPlayer((current) => {
        if (current === player || current.countCards("h") > 0) {
          return false
        }
        const evt = event.getl(current)
        return evt?.hs?.length > 0
      })
    },
    filter(event, player, _name, target) {
      return _status.currentPhase === player
    },
    check(event, player) {
      return get.damageEffect(event.player, player, player) > 0
    },
    async cost(event, trigger, player) {
      /** @type {Player} */
      const target = event.indexedData

      const result = await player
        .chooseBool({
          prompt: get.prompt2("oldjuece", target),
          ai() {
            const { player, target } = get.event()
            return get.damageEffect(target, player, player) >= 0
          },
        })
        .set("target", target)
        .forResult()

      event.result = {
        bool: result.bool,
        targets: [target],
      }
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]
      await target.damage()
    },
    ai: {
      threaten: 1.1,
    },
  },
  // 灭计
  oldmieji: {
    trigger: { player: "useCard2" },
    audio: "mieji",
    filter(event, player) {
      if (
        get.type(event.card) !== "trick" ||
        get.color(event.card) !== "black"
      ) {
        return false
      }
      if (event.targets?.length !== 1) {
        return false
      }
      var info = get.info(event.card)
      if (info.allowMultiple === false) {
        return false
      }
      if (event.targets && !info.multitarget) {
        if (
          game.hasPlayer(
            (current) =>
              !event.targets.includes(current) &&
              lib.filter.targetEnabled2(event.card, player, current) &&
              lib.filter.targetInRange(event.card, player, current),
          )
        ) {
          return true
        }
      }
      return false
    },
    position: "he",
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt("oldmieji"),
          prompt2: `为${get.translation(trigger.card)}增加一个额外目标`,
          filterTarget(_card, _player, target) {
            const { player, card, targets } = get.event()
            if (targets.includes(target)) {
              return false
            }
            return (
              lib.filter.targetEnabled2(card, player, target) &&
              lib.filter.targetInRange(card, player, target)
            )
          },
          ai(target) {
            const event = get.event()
            const trigger = event.getTrigger()
            const player = event.player
            return get.effect(target, trigger.card, player, player)
          },
        })
        .set("autodelay", true)
        .set("targets", trigger.targets)
        .set("card", trigger.card)
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      trigger.targets.push(event.targets[0])
    },
  },
  // 焚城
  oldfencheng: {
    skillAnimation: "epic",
    animationColor: "gray",
    audio: "fencheng",
    enable: "phaseUse",
    filterTarget(card, player, target) {
      return player !== target
    },
    limited: true,
    selectTarget: -1,
    line: "fire",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      const { target } = event
      const res = get.damageEffect(target, player, target, "fire")
      const num = Math.max(1, target.countCards("e"))
      const result = await target
        .chooseToDiscard({
          prompt: `弃置${get.cnNumber(num)}张牌或受到1点火焰伤害`,
          selectCard: num,
          position: "he",
          allowChooseAll: true,
          ai(card) {
            const res = _status.event.res
            const num = _status.event.num
            const player = _status.event.player
            if (res >= 0) {
              return -1
            }
            if (num > 2 && player.hp > 1) {
              return -1
            }
            if (num > 1 && player.hp > 2) {
              return -1
            }
            if (get.position(card) === "e") {
              return 10 - get.value(card)
            }
            return 6 - get.value(card)
          },
        })
        .set("res", res)
        .set("num", num)
        .forResult()
      if (!result?.bool) {
        await target.damage({ nature: "fire" })
      }
    },
    ai: {
      order: 1,
      result: {
        player(player) {
          var num = 0,
            players = game.filterPlayer()
          for (var i = 0; i < players.length; i++) {
            if (
              player !== players[i] &&
              get.damageEffect(players[i], player, players[i], "fire") < 0
            ) {
              var att = get.attitude(player, players[i])
              if (att > 0) {
                num -= Math.max(1, players[i].countCards("e"))
              } else if (att < 0) {
                num += Math.max(1, players[i].countCards("e"))
              }
            }
          }
          if (players.length < 5) {
            return num - 1
          }
          return num - 2
        },
      },
    },
  },
  // 旧曹真
  // 司敌
  oldsidi: {
    audio: "sidi",
    trigger: { global: "useCard" },
    filter(event, player) {
      if (event.card.name !== "shan") {
        return false
      }
      if (event.player === player) {
        return true
      }
      return _status.currentPhase === player
    },
    frequent: true,
    marktext: "钤",
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    async content(event, trigger, player) {
      player.addToExpansion(get.cards(), "gain2").gaintag.add("oldsidi")
    },
    group: "oldsidi2",
  },
  oldsidi2: {
    audio: "sidi",
    trigger: { global: "phaseUseBegin" },
    sourceSkill: "oldsidi",
    filter(event, player) {
      if (event.player === player || event.player.isDead()) {
        return false
      }
      if (!player.getExpansions("oldsidi").length) {
        return false
      }
      return true
    },
    check(event, player) {
      if (get.attitude(player, event.player) >= 0) {
        return false
      }
      if (event.player.getEquip("zhuge")) {
        return false
      }
      if (event.player.hasSkill("paoxiao")) {
        return false
      }
      var players = game.filterPlayer()
      for (var i = 0; i < players.length; i++) {
        if (
          event.player.canUse("sha", players[i]) &&
          get.attitude(player, players[i]) > 0
        ) {
          break
        }
      }
      if (i === players.length) {
        return false
      }
      var nh = event.player.countCards("h")
      var nsha = event.player.countCards("h", "sha")
      if (nh < 2) {
        return false
      }
      switch (nh) {
        case 2:
          if (nsha) {
            return Math.random() < 0.4
          }
          return Math.random() < 0.2
        case 3:
          if (nsha) {
            return Math.random() < 0.8
          }
          return Math.random() < 0.3
        case 4:
          if (nsha > 1) {
            return true
          }
          if (nsha) {
            return Math.random() < 0.9
          }
          return Math.random() < 0.5
        default:
          return true
      }
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const cards = player.getExpansions("oldsidi")
      let button
      if (cards.length === 1) {
        button = cards[0]
      } else {
        const result = await player
          .chooseCardButton({
            prompt: "移去一张“钤”",
            cards,
            forced: true,
          })
          .forResult()
        if (result.bool && result.links?.length) {
          button = result.links[0]
        }
      }
      if (button) {
        await player.loseToDiscardpile(button)
        trigger.player.addTempSkill("oldsidi3", "phaseUseAfter")
        trigger.player.addMark("oldsidi3", 1, false)
      }
    },
  },
  oldsidi3: {
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") {
          return num - player.countMark("oldsidi3")
        }
      },
    },
    onremove: true,
  },
  // 旧陈群
  // 定品
  dingpin: {
    audio: "pindi",
    enable: "phaseUse",
    onChooseToUse(event) {
      if (event.type !== "phase" || game.online) {
        return
      }
      var list = [],
        player = event.player
      player.getHistory("useCard", (evt) => {
        list.add(get.type2(evt.card))
      })
      player.getHistory("lose", (evt) => {
        if (evt.type !== "discard") {
          return
        }
        for (var i of evt.cards2) {
          list.add(get.type2(i, evt.hs.includes(i) ? player : false))
        }
      })
      event.set("dingpin_types", list)
    },
    filter(event, player) {
      var list = event.dingpin_types || []
      return (
        player.countCards("h", (card) => !list.includes(get.type2(card))) > 0
      )
    },
    filterCard(card) {
      var list = _status.event.dingpin_types || []
      return !list.includes(get.type2(card))
    },
    position: "h",
    filterTarget(card, player, target) {
      return !target.hasSkill("dingpin2") && target.getDamagedHp() > 0
    },
    async content(event, trigger, player) {
      const { target } = event
      const result = await target
        .judge({
          judge(card) {
            const evt = _status.event.getParent("dingpin")
            if (evt == null) {
              return 0
            }
            const color = get.color(card)
            switch (color) {
              case "black":
                return evt.target.getDamagedHp()
              case "red":
                return get.sgn(get.attitude(evt.target, evt.player)) * -3
            }
            return 0
          },
          judge2(result) {
            return result.color === "black"
          },
        })
        .forResult()
      switch (result.color) {
        case "black":
          if (target.getDamagedHp() > 0) {
            await target.draw(target.getDamagedHp())
          }
          target.addTempSkill("dingpin2")
          break
        case "red":
          await player.turnOver()
          break
      }
    },
    ai: {
      order: 9,
      result: {
        target(player, target) {
          if (player.isTurnedOver()) {
            return target.getDamagedHp()
          }
          var card = ui.cardPile.firstChild
          if (!card) {
            return
          }
          if (get.color(card) === "black") {
            return target.getDamagedHp()
          }
          return 0
        },
      },
    },
  },
  dingpin2: { charlotte: true },
  // 法恩
  oldfaen: {
    audio: "faen",
    trigger: { global: ["turnOverAfter", "linkAfter"] },
    filter(event, player) {
      if (event.name === "link") {
        return event.player.isLinked()
      }
      return true
    },
    check(event, player) {
      return get.attitude(player, event.player) > 0
    },
    logTarget: "player",
    async content(event, trigger, player) {
      await trigger.player.draw()
    },
    ai: {
      expose: 0.2,
    },
    global: "faen_global",
  },
  // 旧吴懿
  // 奔袭
  oldbenxi: {
    audio: "benxi",
    trigger: { player: "useCard2" },
    forced: true,
    filter(event, player) {
      return player.isPhaseUsing()
    },
    async content(event, trigger, player) {},
    mod: {
      globalFrom(from, to, distance) {
        if (_status.currentPhase === from) {
          return distance - from.countUsed()
        }
      },
      selectTarget(card, player, range) {
        if (_status.currentPhase === player) {
          if (card.name === "sha" && range[1] !== -1) {
            if (
              !game.hasPlayer((current) => get.distance(player, current) > 1)
            ) {
              range[1]++
            }
          }
        }
      },
    },
    ai: {
      unequip: true,
      skillTagFilter(player) {
        if (game.hasPlayer((current) => get.distance(player, current) > 1)) {
          return false
        }
      },
    },
  },
  // 旧周仓
  // 忠勇
  oldzhongyong: {
    audio: "zhongyong",
    trigger: {
      player: "shaMiss",
    },
    filter(event, player) {
      return (
        player.isPhaseUsing() &&
        event.responded &&
        get.itemtype(event.responded.cards) === "cards"
      )
    },
    async cost(event, trigger, player) {
      const cards = trigger.responded.cards

      event.result = await player
        .chooseTarget({
          prompt: `忠勇：将${get.translation(trigger.responded.cards)}交给另一名角色`,
          filterTarget(card, player, target) {
            return target !== get.event().source
          },
          ai(target) {
            let att = get.attitude(get.player(), target)
            const cards = target.getCards("h")
            if (
              cards.length >= 2 &&
              cards.some((card) => card.name === "shan")
            ) {
              att /= 1.5
            }
            return att
          },
        })
        .set("source", trigger.target)
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const cards = trigger.responded.cards
      const target = event.targets[0]
      await target.gain({
        cards,
        animate: "gain2",
      })
      if (target === player) {
        return
      }

      await player
        .chooseToUse({
          prompt: `是否对${get.translation(trigger.target)}使用一张【杀】？`,
          filterCard(card) {
            return card.name === "sha"
          },
          filterTarget(card, player, target) {
            return target === get.event().target
          },
          selectTarget: -1,
        })
        .set("target", trigger.target)
        .set("addCount", false)
    },
  },
  // 旧朱桓
  // 诱敌
  youdi: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return player.countCards("he") > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt("youdi"),
          filterTarget: lib.filter.notMe,
          ai(target) {
            if (!_status.event.goon) {
              return 0
            }
            if (target.countCards("he") === 0) {
              return 0
            }
            return -get.attitude(_status.event.player, target)
          },
        })
        .set(
          "goon",
          player.countCards("h", "sha") <= player.countCards("h") / 3,
        )
        .forResult()
    },
    async content(event, trigger, player) {
      await game.delay()
      const target = event.targets[0]

      const result = await target
        .discardPlayerCard({
          target: player,
          position: "he",
          forced: true,
        })
        .forResult()
      if (
        result.links?.length &&
        result.links[0].name !== "sha" &&
        target.countGainableCards(player, "he")
      ) {
        await player.gainPlayerCard({
          target,
          position: "he",
          forced: true,
        })
      }
    },
    ai: {
      expose: 0.2,
    },
  },
  // 旧曹叡
  // 明鉴
  oldmingjian: {
    audio: "mingjian",
    trigger: { player: "phaseUseBefore" },
    filter(event, player) {
      return player.countCards("h")
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt(event.skill),
          "跳过出牌阶段并将所有手牌交给一名其他角色，然后结束此回合。若如此做，其获得一个额外的出牌阶段",
          lib.filter.notMe,
        )
        .set("ai", (target) => {
          var player = _status.event.player,
            att = get.attitude(player, target)
          if (target.hasSkillTag("nogain")) {
            return 0.01 * att
          }
          if (player.countCards("h") === player.countCards("h", "du")) {
            return -att
          }
          if (target.hasJudge("lebu")) {
            att *= 1.25
          }
          if (get.attitude(player, target) > 3) {
            var basis = get.threaten(target) * att
            if (
              player === get.zhu(player) &&
              player.hp <= 2 &&
              player.countCards("h", "shan") &&
              !game.hasPlayer(
                (current) =>
                  get.attitude(current, player) > 3 &&
                  current.countCards("h", "tao") > 0,
              )
            ) {
              return 0
            }
            if (
              target.countCards("h") + player.countCards("h") >
              target.hp + 2
            ) {
              return basis * 0.8
            }
            return basis
          }
          return 0
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      await player.give(player.getCards("h"), target)
      trigger.cancel()
      const evt = trigger.getParent("phase", true)
      if (evt) {
        game.log(player, "结束了回合")
        evt.num = evt.phaseList.length
        evt.goto(11)
      }
      const next = target.insertPhase()
      next._noTurnOver = true
      next.phaseList = ["phaseUse"]
      //next.setContent(lib.skill.oldmingjian.phase);
    },
    async phase(event, trigger, player) {
      await player.phaseUse()
      game.broadcastAll(() => {
        if (ui.tempnowuxie) {
          ui.tempnowuxie.close()
          delete ui.tempnowuxie
        }
      })
    },
  },
  // 旧曹休
  // 讨袭
  taoxi: {
    audio: "qingxi",
    trigger: { player: "useCardToPlayered" },
    check(event, player) {
      if (get.attitude(player, event.target) >= 0) {
        return false
      }
      var cards = event.target.getCards("h")
      if (
        cards.filter((card) => player.hasUseTarget(card)).length >=
        cards.length / 2
      ) {
        return true
      }
      return false
    },
    filter(event, player) {
      return (
        player.isPhaseUsing() &&
        event.targets.length === 1 &&
        event.target.countCards("h") > 0 &&
        player !== event.target &&
        !player.hasSkill("taoxi_used")
      )
    },
    logTarget: "target",
    async content(event, trigger, player) {
      const result = await player
        .choosePlayerCard({
          target: trigger.target,
          position: "h",
          forced: true,
        })
        .forResult()
      if (result.bool && result.links?.length) {
        const card = result.links[0]
        await player.showCards(
          card,
          `${get.translation(player)}对${get.translation(trigger.target)}发动了【讨袭】`,
        )
        if (!player.storage.taoxi_list) {
          player.storage.taoxi_list = [[], []]
        }
        if (
          !player.storage.taoxi_list[1].some((i) => i._cardid === card.cardid)
        ) {
          const cardx = ui.create.card()
          cardx.init(get.cardInfo(card))
          cardx._cardid = card.cardid
          player.directgains([cardx], null, "taoxi")
          player.storage.taoxi_list[0].push(trigger.target)
          player.storage.taoxi_list[1].push(cardx)
          player.markSkill("taoxi_list")
          player.addTempSkill("taoxi_list")
          player.addTempSkill("taoxi_use")
          player.addTempSkill("taoxi_used", "phaseUseAfter")
        }
      }
    },
    subSkill: {
      used: {},
      use: {
        trigger: { player: "useCardBefore" },
        charlotte: true,
        forced: true,
        popup: false,
        firstDo: true,
        group: "taoxi_lose",
        filter(event, player) {
          if (!player.storage.taoxi_list?.length) {
            return false
          }
          var list = player.storage.taoxi_list[1]
          return event.cards?.some((card) => {
            return list.includes(card)
          })
        },
        async content(event, trigger, player) {
          const cards = []
          const list = player.storage.taoxi_list
          for (const card of trigger.cards) {
            let bool = false
            for (const [i, owner] of list[0].entries()) {
              if (list[1][i] === card) {
                const cardid = card._cardid
                const cardx = owner.getCards(
                  "h",
                  (cardxx) => cardxx.cardid === cardid,
                )[0]
                if (cardx && get.position(cardx) === "h") {
                  cards.push(cardx)
                  owner.$throw(cardx)
                  bool = true
                  break
                }
              }
            }
            if (!bool) {
              cards.push(card)
            }
          }
          trigger.cards = cards
          trigger.card.cards = cards
          trigger.throw = false
        },
        mod: {
          aiOrder(player, card, num) {
            var list = player.storage.taoxi_list
            if (!list?.[1]) {
              return
            }
            if (list[1].includes(card)) {
              return num + 0.5
            }
          },
          cardEnabled2(card) {
            if (
              get.itemtype(card) === "card" &&
              card.hasGaintag("taoxi") &&
              _status.event.name === "chooseToRespond"
            ) {
              return false
            }
          },
        },
        ai: {
          effect: {
            player_use(card, player, target) {
              var list = player.storage.taoxi_list
              if (!list?.[1]) {
                return
              }
              if (list[1].includes(card)) {
                return [1, 1]
              }
            },
          },
        },
      },
      lose: {
        trigger: {
          global: [
            "loseEnd",
            "equipEnd",
            "addJudgeEnd",
            "gainEnd",
            "loseAsyncEnd",
            "addToExpansionEnd",
          ],
        },
        charlotte: true,
        forced: true,
        popup: false,
        firstDo: true,
        filter(event, player) {
          var list = player.storage.taoxi_list
          if (!list?.[0].length) {
            return false
          }
          return game.hasPlayer((current) => {
            if (!list[0].includes(current)) {
              return
            }
            var evt = event.getl(current)
            if (
              evt?.hs?.some((card) => {
                return list[1].some((i) => i._cardid === card.cardid)
              })
            ) {
              return true
            }
            return false
          })
        },
        async content(event, trigger, player) {
          const list = player.storage.taoxi_list
          const targets = game.filterPlayer((current) => {
            if (!list[0].includes(current)) {
              return
            }
            const evt = trigger.getl(current)
            if (
              evt?.hs?.some((card) => {
                return list[1].some((i) => i._cardid === card.cardid)
              })
            ) {
              return true
            }
            return false
          })
          for (const target of targets) {
            const hs = trigger.getl(target).hs
            for (let i = 0; i < list[0].length; i++) {
              if (hs.some((j) => j.cardid === list[1][i]._cardid)) {
                if (player.isOnline2()) {
                  player.send(
                    (list, i) => {
                      game.me.storage.taoxi_list = list
                      list[1][i].delete()
                      list[0].splice(i, 1)
                      list[1].splice(i, 1)
                    },
                    player.storage.taoxi_list,
                    i,
                  )
                }
                list[1][i].delete()
                list[0].splice(i, 1)
                list[1].splice(i, 1)
                i--
              }
            }
          }
        },
      },
      list: {
        audio: "qingxi",
        trigger: { player: "phaseEnd" },
        charlotte: true,
        forced: true,
        onremove(player) {
          game.broadcastAll((player) => {
            player.storage.taoxi_list[1].forEach((i) => i.delete())
            delete player.storage.taoxi_list
          }, player)
        },
        filter(event, player) {
          return (
            player.storage.taoxi_list && player.storage.taoxi_list[0].length > 0
          )
        },
        async content(event, trigger, player) {
          player.loseHp()
        },
      },
    },
  },
  // 全琮
  // 振赡
  zhenshan: {
    audio: "yaoming",
    enable: ["chooseToUse", "chooseToRespond"],
    filter(event, player) {
      if (event.type === "wuxie" || player.hasSkill("zhenshan_used")) {
        return false
      }
      const nh = player.countCards("h")
      if (
        !game.hasPlayer(
          (current) => current !== player && current.countCards("h") < nh,
        )
      ) {
        return false
      }
      for (const i of lib.inpile) {
        if (get.type(i) !== "basic") {
          continue
        }
        const card = { name: i, isCard: true }
        if (event.filterCard(card, player, event)) {
          return true
        }
        if (i === "sha") {
          for (const j of lib.inpile_nature) {
            card.nature = j
            if (event.filterCard(card, player, event)) {
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
          if (get.type(i) !== "basic") {
            continue
          }
          const card = { name: i, isCard: true }
          if (event.filterCard(card, player, event)) {
            list.push(["基本", "", i])
          }
          if (i === "sha") {
            for (const j of lib.inpile_nature) {
              card.nature = j
              if (event.filterCard(card, player, event)) {
                list.push(["基本", "", i, j])
              }
            }
          }
        }
        return ui.create.dialog("振赡", [list, "vcard"], "hidden")
      },
      check(button) {
        const player = _status.event.player
        const card = { name: button.link[2], nature: button.link[3] }
        if (card.name === "jiu") {
          return 0
        }
        if (
          game.hasPlayer(
            (current) => get.effect(current, card, player, player) > 0,
          )
        ) {
          if (card.name === "sha") {
            const eff = player.getUseValue(card)
            if (eff > 0) {
              return 2.9 + eff / 10
            }
            return 0
          }
          if (card.name === "tao" || card.name === "shan") {
            return 4
          }
        }
        return 0
      },
      backup(links, player) {
        return {
          filterCard: () => false,
          viewAs: {
            name: links[0][2],
            nature: links[0][3],
            isCard: true,
          },
          selectCard: -1,
          log: false,
          async precontent(event, trigger, player) {
            const result = await player
              .chooseTarget({
                prompt: "赈赡：选择与手牌数小于你的一名角色交换手牌",
                filterTarget(card, player, target) {
                  return (
                    target !== player &&
                    target.countCards("h") < player.countCards("h")
                  )
                },
                forced: true,
                ai(target) {
                  return (
                    get.attitude(get.player(), target) *
                    Math.sqrt(target.countCards("h") + 1)
                  )
                },
              })
              .forResult()
            if (result?.bool) {
              player.logSkill("zhenshan", result.targets)
              player.addTempSkill("zhenshan_used")
              await player.swapHandcards(result.targets[0])
            } else {
              event.result.cancel = true
            }
            await game.delayx()
          },
        }
      },
      prompt(links, player) {
        return `选择${get.translation(links[0][3] || "")}【${get.translation(links[0][2])}】的目标`
      },
    },
    ai: {
      order() {
        const player = _status.event.player
        const event = _status.event
        const nh = player.countCards("h")
        if (
          game.hasPlayer(
            (current) =>
              get.attitude(player, current) > 0 && current.countCards("h") < nh,
          )
        ) {
          if (event.type === "dying") {
            if (event.filterCard({ name: "tao" }, player, event)) {
              return 0.5
            }
          } else {
            if (
              event.filterCard({ name: "tao" }, player, event) ||
              event.filterCard({ name: "shan" }, player, event)
            ) {
              return 4
            }
            if (event.filterCard({ name: "sha" }, player, event)) {
              return 2.9
            }
          }
        }
        return 0
      },
      save: true,
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag, arg) {
        if (player.getStat().skill.olzhenshan > 0) {
          return false
        }
        const nh = player.countCards("h")
        return game.hasPlayer(
          (current) => current !== player && current.countCards("h") < nh,
        )
      },
      result: {
        player(player) {
          if (_status.event.type === "dying") {
            return get.attitude(player, _status.event.dying)
          }
          return 1
        },
      },
    },
  },
}

export default skills
