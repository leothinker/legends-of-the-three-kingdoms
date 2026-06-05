import { lib, game, ui, get, ai, _status } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 界曹操
  // 奸雄
  oldjianxiong: {
    audio: "rejianxiong",
    trigger: { player: "damageEnd" },
    async cost(event, trigger, player) {
      let list = ["摸牌"]
      if (get.itemtype(trigger.cards) == "cards" && trigger.cards.filterInD().length) {
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
                return sum + (card.name == "du" ? -1 : 1)
              }, 0) > 1 ||
              player.getUseValue(cards[0]) > 6
            ) {
              return "拿牌"
            }
          }
          return "摸牌"
        })
        .forResult()
      event.result = { bool: control != "cancel2", cost_data: control }
    },
    async content(event, trigger, player) {
      if (event.cost_data == "摸牌") {
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
          if (get.tag(card, "damage") && player != target) {
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
    trigger: { player: "gainAfter" },
    direct: true,
    filter(event, player) {
      var evt = event.getParent("phaseDraw")
      if (evt && evt.player == player) {
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
              return player != target
            },
            allowChooseAll: true,
            ai1(card) {
              if (ui.selected.cards.length > 0) {
                return -1
              }
              if (card.name == "du") {
                return 20
              }
              return _status.event.player.countCards("h") - _status.event.player.hp
            },
            ai2(target) {
              var att = get.attitude(_status.event.player, target)
              if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
                if (target.hasSkillTag("nodu")) {
                  return 0
                }
                return 1 - att
              }
              if (target.countCards("h") > _status.event.player.countCards("h")) {
                return 0
              }
              return att - 4
            },
            prompt: "请选择要送人的卡牌",
          })
          .forResult()

        // step 2
        if (result.bool) {
          player.storage.oldqingjian++
          player.logSkill("oldqingjian", result.targets)
          await result.targets[0].gain(result.cards, player, "give")
          for (var i = 0; i < result.cards.length; i++) {
            event.cards.remove(result.cards[i])
          }
          if (event.cards.length) {
            continue
          }
          break
        } else {
          player.storage.counttrigger.oldqingjian--
          break
        }
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
          function (card, player, target) {
            return (
              target.countCards("h") > 0 &&
              player != target &&
              target.countCards("h") >= player.countCards("h")
            )
          },
          function (target) {
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
          get.type(cards[i]) != "basic" &&
          cards[i].name != "juedou" &&
          (get.type(cards[i]) != "equip" || get.subtype(cards[i]) != "equip1")
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
                return player != target && target != event.temp
              },
              ai1(card) {
                if (ui.selected.cards.length > 0) return -1
                if (card.name == "du") return 20
                return _status.event.player.countCards("h") - _status.event.player.hp
              },
              ai2(target) {
                var att = get.attitude(_status.event.player, target)
                if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
                  if (target.hasSkillTag("nodu")) return 0
                  return 1 - att
                }
                return att - 4
              },
              prompt: "请选择要扣置的手牌",
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
          } else {
            // player declined to give; if more iterations remain, continue loop; otherwise finish
            if (event.count < trigger.num) {
              delete event.temp
              event.num = 1
              event.count++
              break
            }
            return
          }
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
            if (target.hp == 3) {
              return [1, num * 1.5]
            }
            if (target.hp == 2) {
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
        .chooseToMove("恂恂：获得其中的两张牌，其余以任意顺序置于牌堆底", true)
        .set("list", [["获得", cards], ["牌堆底"]])
        .set("filterMove", function (from, to, moved) {
          if (to == 1 && moved[1].length >= 2) {
            return false
          }
          return true
        })
        .set("filterOk", function (moved) {
          return moved[1].length == 2
        })
        .set("processAI", function (list) {
          var cards = list[0][1].slice(0).sort(function (a, b) {
            return get.value(b) - get.value(a)
          })
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
        event.num && event.source?.isIn() && event.player?.isIn() && event.source != event.player
      )
    },
    check(event, player) {
      if (player.isPhaseUsing()) {
        return true
      }
      if (event.player == player) {
        return get.attitude(player, event.source) > -3
      }
      return get.attitude(player, event.player) > -3
    },
    logTarget(event, player) {
      if (event.player == player) {
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
  // 界刘备
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
        game.hasPlayer((current) => current != player && !assignedTargets.includes(current))
      ) {
        result = await player
          .chooseCardTarget({
            prompt: "是否继续将任意张手牌交给其他角色",
            prompt2: "操作提示：请先选择任意张手牌，然后再选择一名其他角色。",
            filterCard: true,
            selectCard: [1, Infinity],
            filterTarget(card, player, target) {
              return target != player && !assignedTargets.includes(target)
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
  // 界关羽
  // 义绝
  oldyijue: {
    audio: "yijue",
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return player != target && target.countCards("h")
    },
    filter(event, player) {
      return player.countCards("h") > 0
    },
    async content(event, trigger, player) {
      const { target } = event
      let result

      // step 0
      result = await player.chooseToCompare(target).set("small", true).forResult()

      // step 1
      if (result.bool) {
        if (!target.hasSkill("fengyin")) {
          target.addTempSkill("fengyin")
        }
        target.addTempSkill("oldyijue2")
        return
      } else if (target.hp < target.maxHp) {
        result = await player
          .chooseBool("是否让目标回复1点体力？")
          .set("ai", function () {
            return get.recoverEffect(target, player, player) > 0
          })
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
          if (target.countCards("h") > target.hp + 1 && get.recoverEffect(target) > 0) {
            return 1
          }
          if (
            player.canUse("sha", target) &&
            (player.countCards("h", "sha") || player.countCards("he", { color: "red" }))
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
        if (get.position(card) == "h") {
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
      if (typeof player.storage.oldtishen2 == "number") {
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
        if (typeof player.storage.oldtishen2 != "number") {
          return "上回合体力：无"
        }
        return "上回合体力：" + player.storage.oldtishen2
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
      game.addVideo("storage", player, ["oldtishen2", player.storage.oldtishen2])
    },
    intro: {
      content(storage, player) {
        if (player.storage.oldtishen) {
          return
        }
        return "上回合体力：" + storage
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
      return player != _status.currentPhase && get.itemtype(event.cards) == "cards"
    },
    async content(event, trigger, player) {
      let result

      // step 0
      event.card = get.cards()[0]
      game.broadcast(function (card) {
        ui.arena.classList.add("thrownhighlight")
        card.copy("thrown", "center", "thrownhighlight", ui.arena).addTempClass("start")
      }, event.card)
      event.node = event.card
        .copy("thrown", "center", "thrownhighlight", ui.arena)
        .addTempClass("start")
      ui.arena.classList.add("thrownhighlight")
      game.addVideo("thrownhighlight1")
      game.addVideo("centernode", null, get.cardInfo(event.card))

      if (get.type(event.card, "trick") == get.type(trigger.card, "trick")) {
        result = await player
          .chooseTarget("选择获得此牌的角色")
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
          .set("du", event.card.name == "du")
          .forResult()
      } else {
        result = await player
          .chooseBool("是否弃置" + get.translation(event.card) + "？")
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
        game.broadcast(function (card) {
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
          function (card, target) {
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
        game.broadcast(function (card) {
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
  // 界黄月英
  // 集智
  oldjizhi: {
    audio: "rejizhi",
    trigger: { player: "useCard" },
    frequent: true,
    filter(event, player) {
      return get.type(event.card, "trick") == "trick" && event.card.isCard
    },
    async content(event, trigger, player) {
      let result

      // step 0
      const card = get.cards()[0]
      await game.cardsGotoOrdering(card)
      await player.showCards(card, get.translation(player) + "发动了【集智】")

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
          "是否将一张手牌与" + get.translation(card) + "交换？",
          "若选择「取消」，则将" + get.translation(card) + "置入弃牌堆。",
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
    audio: "reqicai",
    mod: {
      targetInRange(card, player, target, now) {
        var type = get.type(card)
        if (type == "trick" || type == "delay") {
          return true
        }
      },
      canBeDiscarded(card, player, target) {
        if (
          get.position(card) == "e" &&
          !get.subtypes(card).some((subtype) => ["equip3", "equip4", "equip6"].includes(subtype)) &&
          player != target
        ) {
          return false
        }
      },
    },
  },
}

export default skills
