import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 辛宪英
  // 忠鉴
  rezhongjian: {
    enable: "phaseUse",
    audio: 2,
    usable(skill, player) {
      return (
        1 + (player.hasSkill(`${skill}_rewrite`, null, null, false) ? 1 : 0)
      )
    },
    filter(event, player) {
      return game.hasPlayer((current) =>
        lib.skill.rezhongjian.filterTarget(null, player, current),
      )
    },
    filterTarget(card, player, target) {
      if (!player.storage.rezhongjian_effect) {
        return true
      }
      return (
        !player.storage.rezhongjian_effect[0]?.includes(target) &&
        !player.storage.rezhongjian_effect[1]?.includes(target)
      )
    },
    line: false,
    log: "notarget",
    async content(event, trigger, player) {
      const { target } = event
      const result = await player
        .chooseControl()
        .set(
          "prompt",
          `忠鉴：为${get.translation(target)}选择一项直到你的下回合开始`,
        )
        .set("choiceList", [
          "其下次造成伤害后弃置两张牌，你摸一张牌",
          "其下次受到伤害后摸两张牌，你摸一张牌",
        ])
        .set("ai", () => {
          const player = get.player()
          const { target } = get.event().getParent()
          return get.attitude(player, target) > 0 ? 1 : 0
        })
        .forResult()
      if (typeof result?.index !== "number") {
        return
      }
      const skill = `${event.name}_effect`
      player.addTempSkill(skill, { player: "phaseBeginStart" })
      player.storage[skill][result.index].push(target)
      player.markSkill(skill)
    },
    ai: {
      order: 10,
      expose: 0,
      result: {
        player(player, target) {
          if (get.attitude(player, target) === 0) {
            return false
          }
          var sgn = get.sgn((get.realAttitude || get.attitude)(player, target))
          if (
            game.countPlayer(
              (current) =>
                get.sgn((get.realAttitude || get.attitude)(player, current)) ===
                sgn,
            ) <=
            game.countPlayer(
              (current) =>
                get.sgn((get.realAttitude || get.attitude)(player, current)) !==
                sgn,
            )
          ) {
            return 1
          }
          return 0.9
        },
      },
    },
    subSkill: {
      rewrite: { charlotte: true },
      effect: {
        init(player, skill) {
          player.storage[skill] ??= [[], []]
        },
        charlotte: true,
        onremove: true,
        trigger: { global: ["damageSource", "damageEnd"] },
        filter(event, player, name) {
          const index = name === "damageSource" ? 0 : 1
          const target = name === "damageSource" ? event.source : event.player
          return (
            target?.isIn() &&
            player.storage.rezhongjian_effect[index].includes(target)
          )
        },
        forced: true,
        logTarget(event, player, name) {
          return name === "damageSource" ? event.source : event.player
        },
        async content(event, trigger, player) {
          const [target] = event.targets
          const index = event.triggername === "damageSource" ? 0 : 1
          const storage = player.storage[event.name]
          storage[index].remove(target)
          if (storage[0].length + storage[1].length) {
            player.markSkill(event.name)
          } else {
            player.removeSkill(event.name)
          }
          await target[
            event.triggername === "damageSource" ? "chooseToDiscard" : "draw"
          ](2, true, "he")
          await player.draw()
        },
        intro: {
          markcount(storage) {
            if (!storage) {
              return 0
            }
            return storage[0].length + storage[1].length
          },
          mark(dialog, storage, player) {
            if (!storage) {
              return "尚未选择"
            }
            if (player === game.me || player.isUnderControl()) {
              if (storage?.[0]?.length) {
                dialog.addText("弃牌")
                dialog.add([storage[0], "player"])
              }
              if (storage?.[1]?.length) {
                dialog.addText("摸牌")
                dialog.add([storage[1], "player"])
              }
            } else {
              dialog.addText(
                `${get.translation(player)}共选择了${get.cnNumber(storage[0].length + storage[1].length)}人`,
              )
            }
          },
        },
      },
    },
  },
  // 才识
  recaishi: {
    getCard(event) {
      const cards = []
      event.player.getHistory("gain", (evt) => {
        if (
          evt.getParent().name === "draw" &&
          evt.getParent("phaseDraw") === event
        ) {
          cards.addArray(evt.cards)
        }
      })
      return cards
    },
    audio: 2,
    trigger: { player: "phaseDrawEnd" },
    filter(event, player) {
      const cards = lib.skill.recaishi.getCard(event)
      return cards.length > 0
    },
    async cost(event, trigger, player) {
      const cards = lib.skill.recaishi.getCard(trigger)
      const list = cards.map((card) => get.suit(card)).toUniqued()
      const isSame = list.length === 1
      const result = await player
        .chooseBool(
          get.prompt(event.skill),
          isSame
            ? "本回合〖忠鉴〗改为“出牌阶段限两次”（不能选择相同的角色）"
            : "回复1点体力，然后本回合不能对自己使用牌",
        )
        .set(
          "choice",
          (() => {
            if (isSame) {
              return true
            }
            if (!player.isDamaged() || player.countCards("h", "tao")) {
              return false
            }
            if (player.hp < 2) {
              return true
            }
            return (
              player.countCards("h", (card) => {
                const info = get.info(card)
                return (
                  info &&
                  (info.toself || info.selectTarget === -1) &&
                  player.canUse(card, player) &&
                  player.getUseValue(card) > 0
                )
              }) === 0
            )
          })(),
        )
        .forResult()
      if (result.bool) {
        await player.showCards(cards, "才识")
        if (isSame) {
          event.result = {
            bool: true,
            cost_data: "rewrite",
          }
        } else {
          event.result = result
        }
      } else {
        event.result = { bool: false }
      }
    },
    async content(event, trigger, player) {
      if (event.cost_data === "rewrite") {
        player.addTempSkill("rezhongjian_rewrite")
      } else {
        await player.recover()
        player.addTempSkill(`${event.name}_effect`)
      }
    },
    subSkill: {
      effect: {
        charlotte: true,
        mark: true,
        intro: { content: "本回合不能对自己使用牌" },
        mod: {
          targetEnabled(card, player, target) {
            if (player === target) {
              return false
            }
          },
        },
      },
    },
  },
  // 薛灵芸
  // 霞泪
  xialei: {
    audio: 2,
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
      if (player.countMark("xialei_clear") >= 3) {
        return false
      }
      return event
        .getd(player, "cards2")
        .some((i) => get.color(i, player) === "red")
    },
    async content(event, trigger, player) {
      const cards = get.cards(3 - player.countMark("xialei_clear"))
      await game.cardsGotoOrdering(cards)
      let result
      if (cards.length === 1) {
        result = { bool: true, links: cards }
      } else {
        result = await player
          .chooseButton(["霞泪：获得其中一张", cards], true)
          .forResult()
      }
      if (result.bool) {
        const card = result.links[0]
        await player.gain(card, "draw")
        cards.remove(card)
        if (cards.length) {
          const result2 = await player
            .chooseBool()
            .set("createDialog", ["是否将其余牌置于牌堆底？", cards])
            .set("ai", () => _status.event.bool)
            .set(
              "bool",
              (() => {
                if (!player.hasSkill("anzhi")) {
                  return Math.random() < 0.5
                }
                if (player.isTempBanned("anzhi")) {
                  const next = _status.currentPhase?.getNext()
                  if (!next) {
                    return Math.random() < 0.5
                  }
                  const judges = next.getCards("j")
                  let val = 0
                  if (judges.length && !next.hasWuxie()) {
                    const att = get.attitude(player, next)
                    for (var i = 0; judges.length; i++) {
                      var judge = judges[i] && get.judge(judges[i]),
                        card = cards[i]
                      if (!judge || !card) {
                        break
                      }
                      val += judge(card) * att
                    }
                  }
                  if (val > 0) {
                    return false
                  }
                  if (val === 0) {
                    return Math.random() < 0.5
                  }
                  return true
                }
                var card = cards[0]
                if (
                  get.color(card, player) === "red" &&
                  player.isPhaseUsing() &&
                  player.countCards("hs", (card) => {
                    return (
                      get.color(card) === "red" &&
                      player.hasValueTarget(card) &&
                      ["basic", "trick"].includes(get.type(card))
                    )
                  }) > 0
                ) {
                  return false
                }
                if (get.color(card, player) === "black") {
                  return false
                }
                return true
              })(),
            )
            .forResult()
          if (result2.bool) {
            player.popup("牌堆底")
            game.log(player, `将${get.cnNumber(cards.length)}张牌置于牌堆底`)
            await game.cardsGotoPile(cards)
          } else {
            player.popup("牌堆顶")
            await game.cardsGotoPile(cards.slice().reverse(), "insert")
          }
        }
      }
      player.addMark("xialei_clear", 1, false)
      player.addTempSkill("xialei_clear")
    },
    subSkill: { clear: { onremove: true } },
  },
  // 暗织
  anzhi: {
    audio: 2,
    enable: "phaseUse",
    trigger: { player: "damageEnd" },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseBool(get.prompt(event.skill))
        .set(
          "prompt2",
          "你可以进行判定，若结果为：红色，重置〖霞泪〗；黑色，你可以令一名非当前回合角色获得本回合进入弃牌堆的两张牌，且此技能本回合失效。",
        )
        .set(
          "choice",
          game.hasPlayer(
            (current) =>
              get.attitude(player, current) > 0 &&
              current !== _status.currentPhase,
          ),
        )
        .forResult()
    },
    async content(event, trigger, player) {
      const next = player.judge((result) => {
        if (get.color(result) === "red") {
          return get.event().getParent().player.countMark("xialei_clear") / 2
        }
        return 2
      })
      next.judge2 = (result) => result.bool
      const result = await next.forResult()
      if (result?.color && ["red", "black"].includes(result.color)) {
        const { color } = result
        if (color === "red") {
          player.removeSkill("xialei_clear")
        } else {
          player.tempBanSkill(event.name)
          let cards = get.discarded().filterInD("d")
          if (
            !cards.length ||
            !game.hasPlayer((current) => current !== _status.currentPhase)
          ) {
            return
          }
          const result = await player
            .chooseTarget(
              "暗织：是否令一名非当前回合角色获得本回合进入弃牌堆的两张牌？",
              (card, player, target) => {
                return target !== _status.currentPhase
              },
            )
            .set("ai", (target) => {
              const player = get.player()
              return get.effect(target, { name: "wuzhong" }, player, player)
            })
            .forResult()
          if (result?.bool && result?.targets?.length) {
            cards = cards.filterInD("d")
            if (!cards.length) {
              return
            }
            const [target] = result.targets
            const result2 = await player
              .chooseButton(
                [`暗织：选择令${get.translation(target)}获得的两张牌`, cards],
                true,
                Math.min(cards.length, 2),
              )
              .set("ai", (button) => {
                const { player, target } = get.event()
                return (
                  get.sgnAttitude(player, target) *
                  get.value(button.link, target)
                )
              })
              .set("target", target)
              .forResult()
            if (result2?.bool && result2?.links?.length) {
              await target.gain(result2.links, "gain2")
            }
          }
        }
      }
    },
    ai: {
      combo: "xialei",
      order(item, player) {
        if (player.countMark("xialei_clear") >= 2) {
          return 10
        }
        if (
          player.hasHistory("useSkill", (evt) => evt.skill === "xialei") &&
          get.color(ui.cardPile.firstChild, player) === "red" &&
          player.countMark("xialei_clear") > 0
        ) {
          return 9
        }
        return 1
      },
      result: { player: 1 },
    },
  },
  // 田尚衣
  // 婆娑
  posuo: {
    onChooseToUse(event) {
      if (!game.online && !event.posuo_cards) {
        var player = event.player
        var evtx = event.getParent("phaseUse")
        var suits = lib.suit.slice(0).reverse()
        suits = suits.filter(
          (suit) =>
            !player.getStorage("posuo_suits").includes(suit) &&
            player.countCards("hs", (card) => get.suit(card, player) === suit),
        )
        if (
          !suits.length ||
          player.getHistory("sourceDamage", (evt) => {
            return evt.player !== player && evt.getParent("phaseUse") === evtx
          }).length
        ) {
          event.set("posuo_cards", undefined)
        } else {
          var list = [],
            cards = Array.from(ui.cardPile.childNodes)
          cards.addArray(Array.from(ui.discardPile.childNodes))
          game.countPlayer((current) =>
            cards.addArray(current.getCards("hejxs")),
          )
          for (var name of lib.inpile) {
            if (
              !get.tag({ name: name }, "damage") ||
              get.type(new lib.element.VCard({ name: name })) === "delay"
            ) {
              continue
            }
            let same = cards.filter(
              (card) =>
                get.name(card, false) === name &&
                !get.natureList(card, false).length,
            )
            if (same.length) {
              for (var suit of suits) {
                if (same.some((card) => get.suit(card, false) === suit)) {
                  list.push([suit, "", name, undefined, suit])
                }
              }
            }
            for (var nature of lib.inpile_nature) {
              same = cards.filter(
                (card) =>
                  get.name(card, false) === name &&
                  get.is.sameNature(get.natureList(card, false), nature),
              )
              if (same.length) {
                for (var suit of suits) {
                  if (same.some((card) => get.suit(card, false) === suit)) {
                    list.push([suit, "", name, nature, suit])
                  }
                }
              }
            }
          }
          event.set("posuo_cards", list)
        }
      }
    },
    audio: 2,
    audioname: ["re_tianshangyi"],
    enable: "phaseUse",
    filter(event, player) {
      return event.posuo_cards?.length
    },
    chooseButton: {
      dialog(event, player) {
        return ui.create.dialog("婆娑", [event.posuo_cards, "vcard"], "hidden")
      },
      check(button) {
        var player = _status.event.player
        return player.getUseValue({
          name: button.link[2],
          nature: button.link[3],
        })
      },
      backup(links, player) {
        return {
          suit: links[0][4],
          filterCard(card, player) {
            return get.suit(card, player) === lib.skill.posuo_backup.suit
          },
          viewAs: {
            name: links[0][2],
            nature: links[0][3],
          },
          check(card) {
            return 6.5 - get.value(card)
          },
          log: false,
          precontent() {
            player.logSkill("posuo")
            player.addTempSkill("posuo_suits", "phaseUseAfter")
            player.markAuto("posuo_suits", [get.suit(event.result.cards[0])])
          },
        }
      },
      prompt(links, player) {
        var suit = links[0][4]
        var name = links[0][2]
        var nature = links[0][3]
        return `将一张${get.translation(suit)}手牌当一张${get.translation(nature) || ""}${get.translation(name)}使用`
      },
    },
    ai: {
      order: 10,
      result: { player: 1 },
    },
    subSkill: {
      suits: {
        charlotte: true,
        onremove: true,
      },
    },
  },
  // 绡刃
  xiaoren: {
    audio: 2,
    audioname: ["re_tianshangyi"],
    trigger: {
      source: "damageSource",
    },
    usable: 1,
    check: (event, player) => {
      const rev = game.countPlayer((i) => {
        return i.isDamaged() && get.attitude(_status.event.player, i) > 0
      })
      if (!event.player.isIn() || game.countPlayer() < 2) {
        return rev
      }
      if (
        get.damageEffect(
          event.player.getPrevious(),
          player,
          _status.event.player,
        ) > -rev
      ) {
        return true
      }
      return (
        get.damageEffect(event.player.getNext(), player, _status.event.player) >
        -rev
      )
    },
    content() {
      "step 0"
      player.addTempSkill("xiaoren_dying")
      event.target = trigger.player
      ;("step 1")
      player.judge()
      ;("step 2")
      if (result.color === "red") {
        player
          .chooseTarget(
            "绡刃：是否令一名角色回复1点体力，然后若其未受伤，其摸一张牌？",
          )
          .set("ai", (target) => {
            const rec = get.recoverEffect(
              target,
              _status.event.player,
              _status.event.player,
            )
            if (target.getDamagedHp() <= 1) {
              return (
                rec +
                get.effect(
                  target,
                  { name: "draw" },
                  target,
                  _status.event.player,
                )
              )
            }
            return rec
          })
      } else if (result.color !== "black" || game.countPlayer() < 2) {
        event.goto(9)
      } else {
        event.goto(5)
      }
      ;("step 3")
      if (result.bool) {
        var target = result.targets[0]
        event.target = target
        player.line(target)
        target.recover()
      } else {
        event.goto(9)
      }
      ;("step 4")
      if (event.target.isHealthy()) {
        event.target.draw()
      }
      event.goto(9)
      ;("step 5")
      var targets = [].addArray([target.getPrevious(), target.getNext()])
      if (targets.length > 1) {
        player
          .chooseTarget(
            "绡刃：对受伤角色的上家或下家造成1点伤害",
            (card, player, target) => {
              return _status.event.targets.includes(target)
            },
            true,
          )
          .set("ai", (target) => {
            const player = _status.event.player
            return get.damageEffect(target, player, player)
          })
          .set("targets", targets)
      } else if (targets.length) {
        event._result = { bool: true, targets: targets }
      }
      ;("step 6")
      if (result.bool) {
        const target = result.targets[0]
        event.target = target
        player.line(target)
        target.damage("nocard")
      } else {
        event.goto(9)
      }
      ;("step 7")
      if (player.storage.xiaoren_dying || get.is.blocked(event.name, player)) {
        event._result = { bool: false }
      } else if (event.frequent) {
        event._result = { bool: true }
      } else {
        player
          .chooseBool("绡刃：是否再次进行判定并执行对应效果？")
          .set("ai", () => _status.event.bool)
          .set(
            "bool",
            lib.skill.xiaoren.check({ player: event.target }, player),
          )
      }
      ;("step 8")
      if (result.bool) {
        event.frequent = true
        event.goto(1)
      }
      ;("step 9")
      player.removeSkill("xiaoren_dying")
    },
    subSkill: {
      dying: {
        init: (player) => {
          delete player.storage.xiaoren_dying
        },
        onremove: (player) => {
          delete player.storage.xiaoren_dying
        },
        trigger: { global: "dying" },
        forced: true,
        popup: false,
        charlotte: true,
        content() {
          player.storage.xiaoren_dying = true
        },
      },
    },
  },
  // 花鬘
  // 蛮裔
  manyi: {
    audio: 2,
    trigger: { target: "useCardToBefore" },
    filter(event, player) {
      return event.card.name === "nanman"
    },
    forced: true,
    content() {
      trigger.cancel()
    },
    ai: {
      effect: {
        target(card) {
          if (card.name === "nanman") {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 蛮嗣
  mansi: {
    audio: 2,
    trigger: { global: "damageEnd" },
    filter(event, player) {
      return event.card?.name === "nanman"
    },
    frequent: true,
    async content(event, trigger, player) {
      player.addMark(event.name, 1, false)
      await player.draw()
    },
    intro: { content: "因此技能累计获得过#张牌" },
    group: "mansi_viewas",
    subSkill: {
      viewas: {
        audio: "mansi",
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
          const hs = player.getCards("h")
          if (!hs.length) {
            return false
          }
          if (
            hs.some(
              (card) =>
                game.checkMod(
                  card,
                  player,
                  "unchanged",
                  "cardEnabled2",
                  player,
                ) === false,
            )
          ) {
            return false
          }
          return true
        },
        viewAs: { name: "nanman" },
        filterCard: true,
        selectCard: -1,
        position: "h",
        ai: {
          order: 0.1,
          nokeep: true,
          skillTagFilter(player, tag, arg) {
            if (tag === "nokeep") {
              return (
                (!arg || (arg.card && get.name(arg.card) === "tao")) &&
                player.isPhaseUsing() &&
                !player.getStat("skill").mansi_viewas &&
                player.hasCard((card) => get.name(card) !== "tao", "h")
              )
            }
          },
        },
      },
    },
  },
  // 薮影
  souying: {
    audio: 2,
    trigger: {
      player: "useCardToPlayered",
      target: "useCardToTargeted",
    },
    filter(event, player, name) {
      if (!player.countCards("he")) {
        return false
      }
      if (event.targets?.length !== 1 || event.player === event.target) {
        return false
      }
      if (event.card.name !== "sha" && get.type(event.card) !== "trick") {
        return false
      }
      if (name === "useCardToPlayered") {
        if (!event.cards.filterInD().length) {
          return false
        }
        const { target } = event
        return (
          player
            .getHistory("useCard", (evt) => evt.targets?.includes(target))
            .indexOf(event.getParent()) > 0
        )
      }
      const { player: source } = event
      return (
        source
          .getHistory("useCard", (evt) => evt.targets?.includes(player))
          .indexOf(event.getParent()) > 0
      )
    },
    usable: 1,
    async cost(event, trigger, player) {
      let prompt, target
      const next = player.chooseToDiscard("he")
      if (event.triggername === "useCardToTargeted") {
        target = trigger.player
        prompt = `令${get.translation(trigger.card)}对你无效`
        next.set(
          "goon",
          -get.effect(player, trigger.card, trigger.player, player),
        )
      } else {
        target = trigger.targets[0]
        prompt = `弃置一张牌，获得${get.translation(trigger.cards.filterInD())}`
        next.set("goon", get.value(trigger.cards.filterInD()))
      }
      next.set("prompt", get.prompt(event.skill, target))
      next.set("prompt2", prompt)
      next.set("ai", (card) => {
        return get.event().goon - get.value(card)
      })
      next.set("logSkill", [event.skill, target])
      event.result = await next.forResult()
    },
    popup: false,
    async content(event, trigger, player) {
      if (event.triggername === "useCardToTargeted") {
        trigger.excluded.add(player)
      } else if (trigger.cards?.someInD()) {
        await player.gain(trigger.cards.filterInD(), "gain2")
      }
    },
    ai: { expose: 0.25 },
  },
  // 战缘
  zhanyuan: {
    audio: 2,
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      return (
        player
          .getAllHistory(
            "gain",
            (evt) =>
              evt.getParent().name === "draw" &&
              evt.getParent(2).name === "mansi",
          )
          .reduce((num, evt) => num + evt.cards.length, 0) >= 7
      )
    },
    forced: true,
    juexingji: true,
    skillAnimation: true,
    animationColor: "soil",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.gainMaxHp()
      await player.recover()
      if (
        !game.hasPlayer(
          (current) => current !== player && current.hasSex("male"),
        )
      ) {
        return
      }
      const result = await player
        .chooseTarget(
          "是否选择一名男性角色，若如此做，你与其获得〖系力〗，然后你失去〖蛮嗣〗？",
          (card, player, target) => {
            return target !== player && target.hasSex("male")
          },
        )
        .set("ai", (target) => {
          const player = get.player()
          return get.attitude(player, target)
        })
        .forResult()
      if (result?.bool && result?.targets?.length) {
        const target = result.targets[0]
        player.line(target, "fire")
        await player.changeSkills(["xili"], ["mansi"])
        await target.addSkills("xili")
      }
    },
    derivation: "xili",
    ai: { combo: "mansi" },
  },
  // 系力
  xili: {
    audio: 2,
    trigger: { global: "damageBegin1" },
    filter(event, player) {
      return (
        event.source?.hasSkill("xili") &&
        event.source !== player &&
        player !== _status.currentPhase &&
        !event.player.hasSkill("xili") &&
        player.countCards("he") > 0
      )
    },
    usable: 1,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseToDiscard(
          get.prompt(event.skill, trigger.source),
          `是否弃置一张牌，令${get.translation(trigger.source)}对${get.translation(trigger.player)}的伤害+1，然后你与其各摸两张牌？`,
          "he",
          "chooseonly",
        )
        .set("ai", (card) => {
          if (get.event().eff > 0) {
            return 7 - get.value(card)
          }
          return 0
        })
        .set(
          "eff",
          get.damageEffect(trigger.player, trigger.source, player) +
            0.2 * get.attitude(player, trigger.source),
        )
        .forResult()
    },
    logTarget: "source",
    async content(event, trigger, player) {
      await player.discard(event.cards)
      await game.asyncDraw([trigger.source, player].sortBySeat(), 2)
      trigger.num++
      await game.delayx()
    },
  },
  // 诸葛果
  // 祈禳
  qirang: {
    audio: 2,
    trigger: { player: "useCard" },
    frequent: true,
    filter(event, player) {
      return get.type(event.card) === "equip"
    },
    async content(event, trigger, player) {
      const cards = []
      let card
      while (true) {
        const drawn = get.cards()
        if (!drawn?.length) {
          break
        }
        card = drawn[0]
        cards.push(card)
        await player
          .showCards(
            card,
            `${get.translation(player)}【祈禳】亮出的第${get.cnNumber(cards.length, true)}张牌`,
            true,
          )
          .set("clearArena", false)
        if (get.type2(card) === "trick") {
          cards.remove(card)
          break
        }
      }
      game.broadcastAll(ui.clear)
      if (card) {
        const next = player.gain(card, "gain2")
        if (get.type(card) === "trick") {
          next.gaintag.add("qirang")
          player.addTempSkill("qirang_use")
          player.addTempSkill("qirang_clear")
        }
        await next
      }
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.type(card) === "equip" && !get.cardtag(card, "gifts")) {
            return [1, 3]
          }
        },
      },
      threaten: 1.3,
    },
    subSkill: {
      clear: {
        charlotte: true,
        onremove(player) {
          player.removeGaintag("qirang")
        },
      },
      use: {
        audio: "qirang",
        trigger: { player: "useCard2" },
        direct: true,
        filter(event, player) {
          if (get.type(event.card) !== "trick") {
            return false
          }
          return player.hasHistory("lose", (evt) => {
            if ((evt.relatedEvent || evt.getParent()) !== event) {
              return false
            }
            return Object.values(evt.gaintag_map).flat().includes("qirang")
          })
        },
        async content(event, trigger, player) {
          const result = await player
            .chooseTarget({
              prompt: get.prompt("qirang"),
              filterTarget(card, player, target) {
                const event = get.event()
                return (
                  !event.targets.includes(target) &&
                  lib.filter.targetEnabled2(event.card, player, target) &&
                  lib.filter.targetInRange(event.card, player, target)
                )
              },
            })
            .set("prompt2", `为${get.translation(trigger.card)}增加一个目标`)
            .set("ai", (target) => {
              var trigger = _status.event.getTrigger()
              var player = _status.event.player
              return (
                get.effect(target, trigger.card, player, player) *
                (_status.event.targets.includes(target) ? -1 : 1)
              )
            })
            .set("targets", trigger.targets)
            .set("card", trigger.card)
            .forResult()
          if (result?.bool && result.targets) {
            if (!event.isMine() && !event.isOnline()) {
              await game.delayex()
            }
            const targets = result.targets
            player.logSkill("qirang_use", targets)
            trigger.targets.addArray(targets)
          }
        },
      },
    },
  },
  // 羽化
  yuhua: {
    audio: 2,
    trigger: { player: "phaseDiscardBegin" },
    frequent: true,
    async content(event, trigger, player) {
      const result = await player
        .chooseCard({
          prompt: "展示任意张非基本牌，令这些牌本阶段不计入手牌上限",
          position: "h",
          filterCard(card) {
            return get.type(card) !== "basic"
          },
          selectCard: [1, Infinity],
          allowChooseAll: true,
          ai(card) {
            const { nonbasic } = get.event()
            return nonbasic.includes(card) ? 1 : 0
          },
        })
        .set(
          "nonbasic",
          player
            .getCards("h", (card) => get.type(card) !== "basic")
            .sort((a, b) => get.value(a, player) - get.value(b, player))
            .slice(
              0,
              Math.max(0, player.countCards("h") - player.getHandcardLimit()),
            ),
        )
        .forResult()
      if (result.bool && result.cards?.length) {
        await player.showCards(result.cards, "羽化")
        player.addGaintag(result.cards, "yuhua")
        player.addTempSkill("yuhua_add", "phaseChange")
      }
    },
    group: ["yuhua2"],
    subSkill: {
      add: {
        mod: {
          ignoredHandcard(card, player) {
            if (card.hasGaintag("yuhua")) {
              return true
            }
          },
          cardDiscardable(card, player, name) {
            if (name === "phaseDiscard" && card.hasGaintag("yuhua")) {
              return false
            }
          },
        },
        onremove(player) {
          player.removeGaintag("yuhua")
        },
      },
    },
  },
  yuhua2: {
    audio: "yuhua",
    trigger: { player: "phaseJieshuBegin" },
    frequent: true,
    filter(event, player) {
      return player.countCards("h") > player.maxHp
    },
    async content(event, trigger, player) {
      await player.chooseToGuanxing(1)
    },
    ai: {
      guanxing: true,
    },
  },
  // 芮姬
  // 妄缘
  wangyuan: {
    audio: 2,
    trigger: {
      player: ["loseAfter", "logSkill"],
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    frequent: true,
    filter(event, player, name) {
      if (player === _status.currentPhase) {
        return (
          name === "logSkill" &&
          event.skill === "liying" &&
          player.getExpansions("wangyuan").length < game.countPlayer2()
        )
      }
      if (name === "logSkill") {
        return false
      }
      if (player.getExpansions("wangyuan").length >= game.countPlayer2()) {
        return false
      }
      if (event.name === "gain" && event.player === player) {
        return false
      }
      var evt = event.getl(player)
      return evt?.cards2 && evt.cards2.length > 0
    },
    async content(event, trigger, player) {
      var cards = player.getExpansions("wangyuan")
      let drawn = get.cards(2)
      if (!drawn.length) {
        return
      }
      const next = game.cardsGotoOrdering(drawn)
      await next
      drawn = next.cards.slice()
      if (!drawn.length) {
        return
      }
      await player.showCards(drawn, "妄缘")
      const result = await player
        .chooseCardButton({
          cards: drawn,
          prompt: "妄缘：将其中一张牌置于你的武将牌上",
          filter(button) {
            const cardx = button.link
            var type = get.type2(cardx)
            return (
              (type === "basic" || type === "trick") &&
              !cards.some(
                (cardxx) => get.name(cardx, false) === get.name(cardxx, false),
              )
            )
          },
          forced: true,
          ai(button) {
            return get.player().getUseValue(button.link)
          },
        })
        .forResult()

      if (result.bool) {
        const card = result.links[0]
        player.addToExpansion(card, "gain2").gaintag.add("wangyuan")
      }
    },
    ai: {
      combo: "lingyin",
    },
    marktext: "妄",
    intro: {
      name: "妄(妄缘/铃音)",
      content: "expansion",
      markcount: "expansion",
    },
  },
  lingyin: {
    audio: 2,
    trigger: { player: "phaseUseBegin" },
    filter(event, player) {
      return player.getExpansions("wangyuan").length
    },
    direct: true,
    content() {
      "step 0"
      var cards = player.getExpansions("wangyuan")
      player
        .chooseButton(
          [
            `${get.prompt("lingyin")}（当前轮数：${get.cnNumber(game.roundNumber, true)}）`,
            cards,
          ],
          [1, game.roundNumber],
        )
        .set("ai", (button) => {
          var color = _status.event.color,
            player = _status.event.player
          if (
            ui.selected.buttons.length > 0 &&
            ui.selected.buttons.length ===
              player.getExpansions("wangyuan").length - 1
          ) {
            return 0
          }
          if (color === 1) {
            return get.value(button.link)
          }
          if (color) {
            return get.color(button.link) === color ? 1 : 0
          }
          return 0
        })
        .set(
          "color",
          (() => {
            var cardsR = cards.filter((i) => get.color(i) === "red")
            if (
              cardsR.length === cards.length ||
              cardsR.length === 0 ||
              cards.length <= game.roundNumber
            ) {
              return 1
            }
            if (cardsR.length <= game.roundNumber) {
              return "red"
            }
            if (cards.length - cardsR.length <= game.roundNumber) {
              return "black"
            }
            return 1
          })(),
        )
      ;("step 1")
      if (result.bool) {
        player.logSkill("lingyin")
        var cards = result.links
        player.gain(cards, "gain2")
        var cardsx = player.getExpansions("wangyuan").removeArray(cards)
        if (cardsx.length <= 1 || get.color(cardsx) !== "none") {
          player.addTempSkill("lingyin_effect")
          player.addMark("lingyin_effect", 1, false)
          game.log(player, "获得了", "#g【铃音】", "的后续效果")
        }
      }
    },
    ai: {
      combo: "wangyuan",
      threaten: 3,
    },
    subSkill: {
      effect: {
        audio: "lingyin",
        enable: "phaseUse",
        trigger: { source: "damageBegin1" },
        viewAs: { name: "juedou" },
        charlotte: true,
        forced: true,
        onremove: true,
        prompt: "将武器或防具牌当【决斗】使用",
        filterCard(card) {
          return (
            get.subtype(card) === "equip1" || get.subtype(card) === "equip2"
          )
        },
        position: "hes",
        filter(event, player) {
          if (event.name === "chooseToUse") {
            return (
              player.countCards("hes", { subtype: ["equip1", "equip2"] }) > 0
            )
          }
          return event.player !== player
        },
        content() {
          trigger.num += player.countMark("lingyin_effect")
        },
        ai: {
          damageBonus: true,
        },
      },
    },
  },
  liying: {
    audio: 2,
    usable: 1,
    trigger: {
      player: "gainAfter",
      global: "loseAsyncAfter",
    },
    filter(event, player) {
      const cards = event
        .getg(player)
        .filter((i) => get.owner(i) === player && get.position(i) === "h")
      if (!cards.length) {
        return false
      }
      const evt = event.getParent("phaseDraw")
      if (evt?.name === "phaseDraw") {
        return false
      }
      return true
    },
    async cost(event, trigger, player) {
      const cards = trigger
        .getg(player)
        .filter((i) => get.owner(i) === player && get.position(i) === "h")
      event.result = await player
        .chooseCardTarget({
          prompt: get.prompt(event.name.slice(0, -5)),
          prompt2: "是否将这些牌交给一名其他角色，然后摸一张牌",
          filterTarget: lib.filter.notMe,
          filterCard: (card) => _status.event.cards.includes(card),
          cards: cards,
          selectCard: [1, cards.length],
          ai1(card) {
            if (ui.selected.cards.length) {
              return 0
            }
            return 3 / (Math.abs(get.value(card)) + 0.1)
          },
          ai2(target) {
            return (
              get.value(ui.selected.cards, target) *
              get.attitude(_status.event.player, target)
            )
          },
          allowChooseAll: true,
        })
        .set("cards", cards)
        .forResult()
    },
    async content(event, trigger, player) {
      await player.give(event.cards, event.targets[0])
      await player.draw()
    },
  },
}

export default skills
