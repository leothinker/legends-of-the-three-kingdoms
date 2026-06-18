import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 曹操
  // 奸雄
  jianxiong: {
    audio: 2,
    preHidden: true,
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return (
        get.itemtype(event.cards) === "cards" &&
        get.position(event.cards[0], true) === "o"
      )
    },
    async content(event, trigger, player) {
      player.gain({
        cards: trigger.cards,
        animate: "gain2",
      })
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -1]
          }
          if (get.tag(card, "damage")) {
            return [1, 0.55]
          }
        },
      },
    },
  },
  // 护驾
  hujia: {
    audio: 2,
    audioname2: { re_caocao: "rehujia", old_caocao: "rehujia" },
    zhuSkill: true,
    trigger: { player: ["chooseToRespondBefore", "chooseToUseBefore"] },
    filter(event, player) {
      if (event.responded) {
        return false
      }
      if (player.storage.hujiaing) {
        return false
      }
      if (!player.hasZhuSkill("hujia")) {
        return false
      }
      if (!event.filterCard({ name: "shan", isCard: true }, player, event)) {
        return false
      }
      return game.hasPlayer(
        (current) => current !== player && current.group === "wei",
      )
    },
    check(event, player) {
      if (get.damageEffect(player, event.player, player) >= 0) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      let current = player.next
      while (true) {
        event.current = current
        if (current === player) {
          return
        }

        let bool = false
        if (current.group === "wei") {
          if (
            (current === game.me && !_status.auto) ||
            get.attitude(current, player) > 2 ||
            current.isOnline()
          ) {
            player.storage.hujiaing = true
            const next = current.chooseToRespond({
              prompt: `是否替${get.translation(player)}使用或打出【闪】？`,
              filterCard: get.filter({ name: "shan" }),
              ai() {
                const event = get.event()
                return get.attitude(event.player, event.source) - 2
              },
            })
            next.set(
              "skillwarn",
              `替${get.translation(player)}使用或打出【闪】`,
            )
            next.autochoose = lib.filter.autoRespondShan
            next.set("source", player)
            bool = !!(await next.forResult()).bool
          }
        }
        player.storage.hujiaing = false
        if (bool) {
          trigger.result = { bool: true, card: { name: "shan", isCard: true } }
          trigger.responded = true
          trigger.animate = false
          if (typeof current.ai.shown === "number" && current.ai.shown < 0.95) {
            current.ai.shown += 0.3
            if (current.ai.shown > 0.95) {
              current.ai.shown = 0.95
            }
          }
          return
        }
        current = current.next
      }
    },
    ai: {
      respondShan: true,
      skillTagFilter(player) {
        if (player.storage.hujiaing) {
          return false
        }
        if (!player.hasZhuSkill("hujia")) {
          return false
        }
        return game.hasPlayer(
          (current) => current !== player && current.group === "wei",
        )
      },
    },
  },
  // 司马懿
  // 反馈
  fankui: {
    audio: 2,
    trigger: { player: "damageEnd" },
    logTarget: "source",
    preHidden: true,
    filter(event, player) {
      return (
        event.num > 0 &&
        event.source?.hasGainableCards(
          player,
          event.source !== player ? "he" : "e",
        )
      )
    },
    async content(event, trigger, player) {
      player.gainPlayerCard({
        target: trigger.source,
        position: trigger.source !== player ? "he" : "e",
        forced: true,
      })
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
  guicai: {
    audio: 2,
    trigger: { global: "judge" },
    preHidden: true,
    filter(event, player) {
      return player.hasCards(get.mode() === "guozhan" ? "hes" : "hs")
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCard({
          prompt: `${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`,
          filterCard(card) {
            const player = get.player()
            const mod2 = game.checkMod(
              card,
              player,
              "unchanged",
              "cardEnabled2",
              player,
            )
            if (mod2 !== "unchanged") {
              return !!mod2
            }
            const mod = game.checkMod(
              card,
              player,
              "unchanged",
              "cardRespondable",
              player,
            )
            if (mod !== "unchanged") {
              return !!mod
            }
            return true
          },
          position: get.mode() === "guozhan" ? "hes" : "hs",
          ai(card) {
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
          },
        })
        .set("judging", trigger.player.judging[0])
        .setHiddenSkill(event.skill)
        .forResult()
    },
    //技能的logSkill跟着打出牌走 不进行logSkill
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
  // 夏侯惇
  // 刚烈
  ganglie: {
    audio: 2,
    trigger: { player: "damageEnd" },
    check(event, player) {
      if (!event.source?.isIn()) {
        return Math.random() < 0.5
      }
      return get.attitude(player, event.source) <= 0
    },
    prompt2(event, player) {
      let str = "你可以进行判定。"
      if (event.source?.isIn()) {
        str += `若结果不为红桃，${get.translation(event.source)}选择一项：1.弃置两张手牌；2.受到你造成的1点伤害。`
      }
      return str
    },
    async content(event, trigger, player) {
      const { source } = trigger
      let result = await player
        .judge({
          judge(card) {
            if (get.suit(card) === "heart") {
              return -2
            }
            return 2
          },
          judge2(result) {
            return result.bool
          },
        })
        .forResult()
      if (!result?.bool || !source?.isIn()) {
        return
      }
      result =
        source.countDiscardableCards(source, "h") < 2
          ? { bool: false }
          : await source
              .chooseToDiscard({
                prompt: `弃置两张手牌，否则受到${get.translation(player)}造成的1点伤害`,
                selectCard: 2,
                ai(card) {
                  if (card.name === "tao") {
                    return -10
                  }
                  if (card.name === "jiu" && get.player().hp === 1) {
                    return -10
                  }
                  return (
                    get.unuseful(card) + 2.5 * (5 - (get.owner(card)?.hp ?? 0))
                  )
                },
              })
              .forResult()
      if (!result?.bool) {
        await source.damage()
      }
    },
    ai: {
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -1]
          }
          return 0.8
          // if(get.tag(card,'damage')&&get.damageEffect(target,player,player)>0) return [1,0,0,-1.5];
        },
      },
    },
  },
  ganglie_three: {
    audio: "ganglie",
    trigger: { player: "damageEnd" },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt2(event.skill),
          filterTarget(card, player, target) {
            return target.isEnemyOf(player)
          },
          ai(target) {
            return (
              -get.attitude(get.player(), target) /
              Math.sqrt(1 + target.countCards("h"))
            )
          },
        })
        .forResult()
    },
    async content(event, trigger, player) {
      event.target = event.targets[0]
      const { judge } = await player
        .judge({
          judge(card) {
            if (get.suit(card) === "heart") {
              return -2
            }
            return 2
          },
          judge2(result) {
            return result.bool
          },
        })
        .forResult()
      if (judge < 2) {
        return
      }
      const { bool: chooseToDiscardResultBool } = await event.target
        .chooseToDiscard({
          selectCard: 2,
          ai(card) {
            if (card.name === "tao") {
              return -10
            }
            if (card.name === "jiu" && _status.event.player.hp === 1) {
              return -10
            }
            return get.unuseful(card) + 2.5 * (5 - (get.owner(card)?.hp ?? 0))
          },
        })
        .forResult()
      if (chooseToDiscardResultBool === false) {
        await event.target.damage()
      }
    },
    ai: {
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -1]
          }
          return 0.8
          // if(get.tag(card,'damage')&&get.damageEffect(target,player,player)>0) return [1,0,0,-1.5];
        },
      },
    },
  },
  // 张辽
  // 突袭
  tuxi: {
    audio: 2,
    trigger: { player: "phaseDrawBegin1" },
    filter(event, player) {
      return !event.numFixed
    },
    async cost(event, trigger, player) {
      const num = game.countPlayer(
        (current) =>
          current !== player &&
          get.attitude(player, current) <= 0 &&
          current.hasCards("h"),
      )
      const check = num >= 2
      event.result = await player
        .chooseTarget({
          prompt: get.prompt(event.skill),
          prompt2: "获得至多两名其他角色的各一张手牌",
          filterTarget(card, player, target) {
            return player !== target && target.hasCards("h")
          },
          selectTarget: [1, 2],
          ai(target) {
            const { player, aicheck } = get.event()
            if (!aicheck) {
              return 0
            }
            const att = get.attitude(player, target)
            if (target.hasSkill("tuntian")) {
              return att / 10
            }
            return 1 - att
          },
        })
        .set("aicheck", check)
        .forResult()
    },
    async content(event, trigger, player) {
      await player.gainMultiple(event.targets)
      trigger.changeToZero()
      await game.delay()
    },
    ai: {
      threaten: 2,
      expose: 0.3,
    },
  },
  // 许褚
  // 裸衣
  luoyi: {
    audio: 2,
    trigger: { player: "phaseDrawBegin2" },
    check(event, player) {
      if (player.skipList.includes("phaseUse") || player.countCards("h") < 3) {
        return false
      }
      if (!player.hasSha()) {
        return false
      }
      return game.hasPlayer(
        (current) =>
          get.attitude(player, current) < 0 && player.canUse("sha", current),
      )
    },
    preHidden: true,
    filter(event, player) {
      return !event.numFixed && event.num > 0
    },
    async content(event, trigger, player) {
      player.addTempSkill("luoyi2", "phaseJieshuBegin")
      trigger.num--
    },
  },
  luoyi2: {
    trigger: { source: "damageBegin1" },
    sourceSkill: "luoyi",
    filter(event) {
      return (
        event.card &&
        (event.card.name === "sha" || event.card.name === "juedou") &&
        event.notLink()
      )
    },
    charlotte: true,
    forced: true,
    async content(event, trigger, player) {
      trigger.num++
    },
    ai: {
      damageBonus: true,
    },
  },
  // 郭嘉
  // 天妒
  tiandu: {
    audio: 2,
    audioname: ["re_guojia"],
    audioname2: { old_guojia: "tiandu_re_guojia" },
    trigger: { player: "judgeEnd" },
    preHidden: true,
    frequent(event) {
      //if(get.mode()=='guozhan') return false;
      return event.result.card?.name !== "du"
    },
    check(event) {
      return event.result.card?.name !== "du"
    },
    filter(event, player) {
      return get.position(event.result.card, true) === "o"
    },
    async content(event, trigger, player) {
      player.gain({
        cards: [trigger.result.card],
        animate: "gain2",
      })
    },
  },
  tiandu_re_guojia: { audio: 2 },
  // 遗计
  yiji: {
    audio: 2,
    trigger: { player: "damageEnd" },
    frequent: true,
    filter(event) {
      return event.num > 0
    },
    getIndex(event, player, triggername) {
      return event.num
    },
    async content(event, trigger, player) {
      const cards = get.cards(2)
      await game.cardsGotoOrdering(cards)
      if (_status.connectMode) {
        game.broadcastAll(() => {
          _status.noclearcountdown = true
        })
      }
      event.given_map = {}
      if (!cards.length) {
        return
      }

      do {
        const { bool, links } =
          cards.length === 1
            ? { links: cards.slice(0), bool: true }
            : await player
                .chooseCardButton({
                  prompt: "遗计：将这些牌交给任意角色",
                  cards,
                  select: [1, cards.length],
                  forced: true,
                  ai() {
                    if (ui.selected.buttons.length === 0) {
                      return 1
                    }
                    return 0
                  },
                })
                .forResult()
        if (!bool || !links?.length) {
          return
        }
        cards.removeArray(links)
        event.togive = links.slice(0)
        const { targets } = await player
          .chooseTarget({
            prompt: `将${get.translation(links)}交给一名角色`,
            forced: true,
            ai(target) {
              const { player, enemy } = get.event()
              const att = get.attitude(player, target)
              if (enemy) {
                return -att
              }
              if (att > 0) {
                return att / (1 + target.countCards("h"))
              }
              return att / 100
            },
          })
          .set("enemy", get.value(event.togive[0], player, "raw") < 0)
          .forResult()
        if (targets?.length) {
          const id = targets[0].playerid
          const map = event.given_map
          if (id != null) {
            if (!map[id]) {
              map[id] = []
            }
            map[id].addArray(event.togive)
          }
        }
      } while (cards.length > 0)
      if (_status.connectMode) {
        game.broadcastAll(() => {
          delete _status.noclearcountdown
          game.stopCountChoose()
        })
      }
      const list = []
      for (const i in event.given_map) {
        const source = (_status.connectMode ? lib.playerOL : game.playerMap)[i]
        player.line(source, "green")
        if (
          player !== source &&
          (get.mode() !== "identity" || player.identity !== "nei")
        ) {
          player.addExpose(0.2)
        }
        list.push([source, event.given_map[i]])
      }
      await game
        .loseAsync({
          gain_list: list,
          giver: player,
          animate: "draw",
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
    },
  },
  // 甄姬
  // 洛神
  luoshen: {
    audio: 2,
    audioname2: { re_zhenji: "reluoshen" },
    trigger: { player: "phaseZhunbeiBegin" },
    frequent: true,
    preHidden: true,
    async content(event, trigger, player) {
      event.cards ??= []
      while (true) {
        const judgeEvent = player.judge({
          judge(card) {
            if (get.color(card) === "black") {
              return 1.5
            }
            return -1.5
          },
          judge2(result) {
            return result.bool
          },
        })
        if (get.mode() !== "guozhan" && !player.hasSkillTag("rejudge")) {
          judgeEvent.set("callback", async (event) => {
            if (
              event.judgeResult.color === "black" &&
              get.position(event.card, true) === "o"
            ) {
              await player.gain({
                cards: [event.card],
                animate: "gain2",
              })
            }
          })
        } else {
          judgeEvent.set("callback", async (event) => {
            if (event.judgeResult.color === "black") {
              event.getParent().orderingCards.remove(event.card)
            }
          })
        }
        const result = await judgeEvent.forResult()
        if (!result?.bool || !result.card) {
          break
        }

        event.cards.push(result.card)
        const result2 = await player
          .chooseBool({
            prompt: "是否再次发动【洛神】？",
          })
          .set("frequentSkill", "luoshen")
          .forResult()
        if (!result2?.bool) {
          break
        }
      }
      if (event.cards.someInD()) {
        await player.gain({
          cards: event.cards.filterInD(),
          animate: "gain2",
        })
      }
    },
  },
  // 倾国
  qingguo: {
    mod: {
      aiValue(player, card, num) {
        if (get.name(card) !== "shan" && get.color(card) !== "black") {
          return
        }
        const cards = player.getCards(
          "hs",
          (card) => get.name(card) === "shan" || get.color(card) === "black",
        )
        cards.sort((a, b) => {
          return (
            (get.name(b) === "shan" ? 1 : 2) - (get.name(a) === "shan" ? 1 : 2)
          )
        })
        const geti = () => {
          if (cards.includes(card)) {
            cards.indexOf(card)
          }
          return cards.length
        }
        if (get.name(card) === "shan") {
          return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6
        }
        return Math.max(num, [6.5, 4, 3][Math.min(geti(), 2)])
      },
      aiUseful(...args) {
        return lib.skill.qingguo.mod?.aiValue?.(...args) ?? 0
      },
    },
    locked: false,
    audio: 2,
    audioname2: { ol_zhenji: "reqingguo" },
    enable: ["chooseToRespond", "chooseToUse"],
    filterCard(card) {
      return get.color(card) === "black"
    },
    viewAs: { name: "shan" },
    viewAsFilter(player) {
      if (!player.hasCards("hs", { color: "black" })) {
        return false
      }
    },
    position: "hs",
    prompt: "将一张黑色手牌当【闪】使用或打出",
    check() {
      return 1
    },
    ai: {
      order: 3,
      respondShan: true,
      skillTagFilter(player) {
        if (!player.hasCards("hs", { color: "black" })) {
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
  // 刘备
  // 仁德
  rende: {
    audio: 2,
    enable: "phaseUse",
    filterCard: true,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    discard: false,
    lose: false,
    delay: 0,
    filterTarget(card, player, target) {
      return player !== target
    },
    check(card) {
      if (ui.selected.cards.length > 1) {
        return 0
      }
      if (ui.selected.cards.length && ui.selected.cards[0].name === "du") {
        return 0
      }
      if (!ui.selected.cards.length && card.name === "du") {
        return 20
      }
      const player = get.owner(card)
      if (player == null) {
        return 0
      }
      // let num = 0;
      const evt2 = _status.event.getParent()
      const num = player
        .iterHistory(
          "lose",
          (evt) =>
            evt.getParent()?.skill === "rende" && evt.getParent(3) === evt2,
        )
        .map((evt) => evt.cards.length)
        .reduce((a, b) => a + b, 0)
      if (
        player.hp === player.maxHp ||
        num > 1 ||
        player.countCards("h") <= 1
      ) {
        if (ui.selected.cards.length) {
          return -1
        }
        const players = game.filterPlayer()
        for (const current of players) {
          if (
            current.hasSkill("haoshi") &&
            !current.isTurnedOver() &&
            !current.hasJudge("lebu") &&
            get.attitude(player, current) >= 3 &&
            get.attitude(current, player) >= 3
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
      const evt2 = event.getParent(3)
      const num = player
        .iterHistory(
          "lose",
          (evt) =>
            evt.getParent(2)?.name === "rende" && evt.getParent(5) === evt2,
        )
        .map((evt) => evt.cards.length)
        .reduce((a, b) => a + b, 0)
      await player.give(event.cards, event.target)
      if (num < 2 && num + event.cards.length > 1) {
        await player.recover()
      }
    },
    ai: {
      order(skill, player) {
        if (player == null) {
          return 0
        }
        if (
          player.hp < player.maxHp &&
          player.storage.rende < 2 &&
          player.countCards("h") > 1
        ) {
          return 10
        }
        return 1
      },
      result: {
        target(player, target) {
          if (target.hasSkillTag("nogain")) {
            return 0
          }
          if (ui.selected.cards.length && ui.selected.cards[0].name === "du") {
            return target.hasSkillTag("nodu") ? 0 : -10
          }
          if (target.hasJudge("lebu")) {
            return 0
          }
          const nh = target.countCards("h")
          const np = player.countCards("h")
          if (
            player.hp === player.maxHp ||
            player.storage.rende < 0 ||
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
              const players = game.filterPlayer()
              for (let i = 0; i < players.length; i++) {
                if (
                  players[i] !== player &&
                  get.attitude(player, players[i]) > 0
                ) {
                  return 0
                }
              }
            }
          }
        },
      },
      threaten: 0.8,
    },
  },
  rende1: {
    trigger: { player: "phaseUseBegin" },
    silent: true,
    sourceSkill: "rende",
    async content(event, trigger, player) {
      player.storage.rende = 0
    },
  },
  // 激将
  jijiang: {
    audio: 2,
    audioname: ["liushan"],
    audioname2: { re_liubei: "rejijiang", old_liubei: "rejijiang" },
    group: ["jijiang1"],
    zhuSkill: true,
    filter(event, player) {
      if (
        !player.hasZhuSkill("jijiang") ||
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
    filterCard() {
      return false
    },
    selectCard: -1,
    ai: {
      order() {
        return get.order({ name: "sha" }) + 0.3
      },
      respondSha: true,
      skillTagFilter(player) {
        if (
          !player.hasZhuSkill("jijiang") ||
          !game.hasPlayer(
            (current) => current !== player && current.group === "shu",
          )
        ) {
          return false
        }
      },
    },
  },
  jijiang1: {
    audio: "jijiang",
    audioname: ["liushan"],
    audioname2: { re_liubei: "rejijiang", old_liubei: "rejijiang" },
    trigger: { player: ["useCardBegin", "respondBegin"] },
    logTarget: "targets",
    sourceSkill: "jijiang",
    filter(event, player) {
      return event.skill === "jijiang"
    },
    forced: true,
    async content(event, trigger, player) {
      delete trigger.skill
      const jijiang = trigger.getParent()
      if (jijiang == null) {
        return
      }
      jijiang.set("jijiang", true)

      let current = player.next
      while (true) {
        event.current = current
        if (current === player) {
          player.addTempSkill("jijiang3")
          trigger.cancel()
          jijiang.goto(0)
          return
        }
        if (current.group === "shu") {
          const next = current.chooseToRespond({
            prompt: `是否替${get.translation(player)}使用或打出【杀】？`,
            card: get.autoViewAs({ name: "sha" }),
            ai() {
              const event = get.event()
              return get.attitude(event.player, event.source) - 2
            },
          })
          next.set("source", player)
          next.set("jijiang", true)
          next.set("skillwarn", `替${get.translation(player)}使用或打出【杀】`)
          next.noOrdering = true
          next.autochoose = lib.filter.autoRespondSha
          const { bool, card, cards } = await next.forResult()
          if (bool) {
            trigger.card = card
            trigger.cards = cards
            trigger.throw = false
            if (
              typeof event.current.ai.shown === "number" &&
              event.current.ai.shown < 0.95
            ) {
              event.current.ai.shown += 0.3
              if (event.current.ai.shown > 0.95) {
                event.current.ai.shown = 0.95
              }
            }
            return
          }
          current = current.next
        } else {
          current = current.next
        }
      }
    },
  },
  jijiang3: {
    trigger: { global: ["useCardAfter", "useSkillAfter", "phaseAfter"] },
    silent: true,
    charlotte: true,
    sourceSkill: "jijiang",
    filter(event) {
      return event.skill !== "jijiang" && event.skill !== "qinwang"
    },
    async content(event, trigger, player) {
      player.removeSkill("jijiang3")
    },
  },
  // 关羽
  // 武圣
  wusheng: {
    audio: 2,
    audioname2: { old_guanyu: "rewusheng" },
    enable: ["chooseToRespond", "chooseToUse"],
    filterCard(card, player) {
      if (get.zhu(player, "shouyue")) {
        return true
      }
      return get.color(card) === "red"
    },
    position: "hes",
    viewAs: { name: "sha" },
    viewAsFilter(player) {
      if (get.zhu(player, "shouyue")) {
        if (!player.hasCards("hes")) {
          return false
        }
      } else {
        if (!player.hasCards("hes", { color: "red" })) {
          return false
        }
      }
    },
    prompt: "将一张红色牌当【杀】使用或打出",
    check(card) {
      const val = get.value(card)
      if (get.event().name === "chooseToRespond") {
        return 1 / Math.max(0.1, val)
      }
      return 5 - val
    },
    ai: {
      skillTagFilter(player) {
        if (get.zhu(player, "shouyue")) {
          if (!player.hasCards("hes")) {
            return false
          }
        } else {
          if (!player.hasCards("hes", { color: "red" })) {
            return false
          }
        }
      },
      respondSha: true,
    },
  },
  // 张飞
  // 咆哮
  paoxiao: {
    audio: 2,
    firstDo: true,
    audioname2: { old_zhangfei: "repaoxiao" },
    trigger: { player: "useCard1" },
    forced: true,
    filter(event, player) {
      return (
        !event.audioed &&
        event.card.name === "sha" &&
        player.countUsed("sha", true) > 1 &&
        event.getParent()?.type === "phase"
      )
    },
    async content(event, trigger, player) {
      trigger.audioed = true
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
  // 诸葛亮
  // 观星
  guanxing_fail: {},
  guanxing: {
    audio: 2,
    audioname: ["jiangwei"],
    trigger: { player: "phaseZhunbeiBegin" },
    frequent: true,
    preHidden: true,
    async content(event, trigger, player) {
      const num =
        player.hasSkill("yizhi") && player.hasSkill("guanxing")
          ? 5
          : Math.min(5, game.countPlayer())
      const result = await player
        .chooseToGuanxing(num)
        .set("prompt", "观星：将这些牌以任意顺序置于牌堆顶或牌堆底")
        .forResult()
      if (!result.bool || !result.moved[0].length) {
        player.addTempSkill("guanxing_fail")
      }
    },
    ai: {
      threaten: 1.2,
      guanxing: true,
    },
  },
  // 空城
  kongcheng: {
    mod: {
      targetEnabled(card, player, target, now) {
        if (!target.hasCards("h")) {
          if (card.name === "sha" || card.name === "juedou") {
            return false
          }
        }
      },
    },
    group: "kongcheng1",
    audio: 2,
    audioname: ["re_zhugeliang"],
    ai: {
      noh: true,
      skillTagFilter(player, tag) {
        if (tag === "noh") {
          if (player.countCards("h") !== 1) {
            return false
          }
        }
      },
    },
  },
  kongcheng1: {
    audio: "kongcheng",
    trigger: { player: "loseEnd" },
    forced: true,
    firstDo: true,
    audioname: ["re_zhugeliang"],
    sourceSkill: "kongcheng",
    filter(event, player) {
      if (player.hasCards("h")) {
        return false
      }
      for (const card of event.cards) {
        if (card.original === "h") {
          return true
        }
      }
      return false
    },
    async content() {},
  },
  // 赵云
  // 龙胆
  longdan: {
    audio: 2,
    audioname2: { re_zhaoyun: "relongdan", old_zhaoyun: "relongdan" },
    group: ["longdan_sha", "longdan_shan", "longdan_draw"],
    subSkill: {
      draw: {
        trigger: { player: ["useCard", "respond"] },
        forced: true,
        popup: false,
        filter(event, player) {
          if (!get.zhu(player, "shouyue")) {
            return false
          }
          return event.skill === "longdan_sha" || event.skill === "longdan_shan"
        },
        async content(event, trigger, player) {
          await player.draw()
          player.storage.fanghun2++
        },
      },
      sha: {
        audio: "longdan",
        audioname2: { re_zhaoyun: "relongdan", old_zhaoyun: "relongdan" },
        enable: ["chooseToUse", "chooseToRespond"],
        filterCard: { name: "shan" },
        viewAs: { name: "sha" },
        viewAsFilter(player) {
          if (!player.hasCards("hs", "shan")) {
            return false
          }
        },
        position: "hs",
        prompt: "将一张【闪】当【杀】使用或打出",
        check() {
          return 1
        },
        ai: {
          effect: {
            target(card, player, target, current) {
              if (get.tag(card, "respondSha") && current < 0) {
                return 0.6
              }
            },
          },
          respondSha: true,
          skillTagFilter(player) {
            if (!player.hasCards("hs", "shan")) {
              return false
            }
          },
          order() {
            return get.order({ name: "sha" }) + 0.1
          },
          useful: -1,
          value: -1,
        },
      },
      shan: {
        audio: "longdan",
        audioname2: { re_zhaoyun: "relongdan", old_zhaoyun: "relongdan" },
        enable: ["chooseToRespond", "chooseToUse"],
        filterCard: { name: "sha" },
        viewAs: { name: "shan" },
        prompt: "将一张【杀】当【闪】使用或打出",
        check() {
          return 1
        },
        position: "hs",
        viewAsFilter(player) {
          if (!player.hasCards("hs", "sha")) {
            return false
          }
        },
        ai: {
          respondShan: true,
          skillTagFilter(player) {
            if (!player.hasCards("hs", "sha")) {
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
          order: 4,
          useful: -1,
          value: -1,
        },
      },
    },
  },
  // 马超
  // 马术
  mashu: {
    mod: {
      globalFrom(from, to, distance) {
        return distance - 1
      },
    },
  },
  // 铁骑
  tieji: {
    audio: 2,
    trigger: { player: "useCardToPlayered" },
    check(event, player) {
      return get.attitude(player, event.target) <= 0
    },
    filter(event, player) {
      return event.card.name === "sha"
    },
    logTarget: "target",
    preHidden: true,
    async content(event, trigger, player) {
      const { bool } = await player
        .judge({
          judge(card) {
            if (get.zhu(get.player(), "shouyue")) {
              if (get.suit(card) !== "spade") {
                return 2
              }
            } else {
              if (get.color(card) === "red") {
                return 2
              }
            }
            return -0.5
          },
          judge2(result) {
            return result.bool
          },
        })
        .forResult()
      if (bool) {
        trigger.getParent()?.directHit.add(trigger.target)
      }
    },
    ai: {
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (
          get.attitude(player, arg.target) > 0 ||
          arg.card.name !== "sha" ||
          !ui.cardPile.firstChild ||
          get.color(ui.cardPile.firstChild, player) !== "red"
        ) {
          return false
        }
      },
    },
  },
  // 黄月英
  // 集智
  jizhi: {
    audio: 2,
    trigger: { player: "useCard" },
    frequent: true,
    preHidden: true,
    filter(event) {
      return get.type(event.card) === "trick"
    },
    async content(event, trigger, player) {
      await player.draw({ nodelay: true })
    },
    ai: {
      threaten: 1.4,
      noautowuxie: true,
    },
  },
  // 奇才
  qicai: {
    mod: {
      targetInRange(card, player, target, now) {
        if (["trick", "delay"].includes(get.type(card))) {
          return true
        }
      },
    },
  },
  // 孙权
  // 制衡
  zhiheng: {
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
          eq != null &&
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
    filterCard: true,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    prompt: "弃置任意张牌，然后摸等量的牌",
    check(card) {
      const player = get.player()
      if (get.position(card) === "e") {
        const subs = get.subtypes(card)
        if (subs.includes("equip2") || subs.includes("equip3")) {
          return player.getHp() - get.value(card)
        }
      }
      return 6 - get.value(card)
    },
    async content(event, trigger, player) {
      await player.draw(event.cards.length)
    },
    ai: {
      order: 1,
      result: {
        player: 1,
      },
      threaten: 1.5,
    },
  },
  // 救援
  jiuyuan: {
    audio: 2,
    trigger: { target: "taoBegin" },
    zhuSkill: true,
    forced: true,
    filter(event, player) {
      if (event.player === player) {
        return false
      }
      if (!player.hasZhuSkill("jiuyuan")) {
        return false
      }
      if (event.player.group !== "wu") {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      trigger.baseDamage++
    },
  },
  // 甘宁
  // 奇袭
  qixi: {
    audio: 2,
    audioname: ["re_ganning"],
    enable: "chooseToUse",
    filterCard(card) {
      return get.color(card) === "black"
    },
    position: "hes",
    viewAs: { name: "guohe" },
    viewAsFilter(player) {
      if (!player.hasCards("hes", { color: "black" })) {
        return false
      }
    },
    prompt: "将一张黑色牌当【过河拆桥】使用",
    check(card) {
      return 4 - get.value(card)
    },
  },
  // 吕蒙
  // 克己
  keji: {
    audio: 2,
    audioname: ["re_lvmeng"],
    audioname2: { ol_lvmeng: "keji_re_lvmeng" },
    trigger: { player: "phaseDiscardBefore" },
    frequent(event, player) {
      return player.needsToDiscard()
    },
    filter(event, player) {
      if (player.getHistory("skipped").includes("phaseUse")) {
        return true
      }
      const history = player
        .getHistory("useCard")
        .concat(player.getHistory("respond"))
      for (const evt of history) {
        if (evt.card.name === "sha" && evt.isPhaseUsing()) {
          return false
        }
      }
      return true
    },
    async content(event, trigger, player) {
      trigger.cancel()
    },
  },
  keji_re_lvmeng: { audio: 2 },
  // 黄盖
  // 苦肉
  kurou: {
    audio: 2,
    enable: "phaseUse",
    prompt: "失去1点体力，然后摸两张牌",
    delay: false,
    async content(event, trigger, player) {
      player.loseHp(1)
      player.draw(2, "nodelay")
    },
    ai: {
      basic: {
        order: 1,
      },
      result: {
        player(player) {
          if (
            player.needsToDiscard(3) &&
            !player.hasValueTarget({ name: "sha" }, false)
          ) {
            return -1
          }
          if (player.countCards("h") >= player.hp - 1) {
            return -1
          }
          if (player.hp < 3) {
            return -1
          }
          return 1
        },
      },
    },
  },
  // 周瑜
  yingzi: {
    audio: 2,
    audioname: ["sp_lvmeng"],
    trigger: { player: "phaseDrawBegin2" },
    frequent: true,
    filter(event, player) {
      return !event.numFixed
    },
    async content(event, trigger, player) {
      trigger.num++
    },
    ai: {
      threaten: 1.3,
    },
  },
  // 反间
  fanjian: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.hasCards("h")
    },
    filterTarget(card, player, target) {
      return player !== target
    },
    async content(event, trigger, player) {
      const target = event.target
      const { control } = await target
        .chooseControl({
          controls: ["heart2", "diamond2", "club2", "spade2"],
          ai() {
            switch (Math.floor(Math.random() * 6)) {
              case 0:
                return "heart2"
              case 1:
              case 4:
              case 5:
                return "diamond2"
              case 2:
                return "club2"
              case 3:
                return "spade2"
            }
          },
        })
        .forResult()
      game.log(target, `选择了${get.translation(control)}`)
      event.choice = control
      target.chat(`我选${get.translation(event.choice)}`)
      const { bool, cards } = await target
        .gainPlayerCard({
          target: player,
          position: "h",
          forced: true,
        })
        .forResult()
      if (
        bool &&
        cards?.length &&
        `${get.suit(cards[0], player)}2` !== event.choice
      ) {
        await target.damage({ nocard: true })
      }
    },
    ai: {
      order: 1,
      result: {
        target(player, target) {
          const eff = get.damageEffect(target, player)
          if (eff >= 0) {
            return 1 + eff
          }
          let value = 0,
            i
          const cards = player.getCards("h")
          for (i = 0; i < cards.length; i++) {
            value += get.value(cards[i])
          }
          value /= player.countCards("h")
          if (target.hp === 1) {
            return Math.min(0, value - 7)
          }
          return Math.min(0, value - 5)
        },
      },
    },
  },
  // 大乔
  // 国色
  guose: {
    audio: 2,
    filter(event, player) {
      return player.hasCards("hes", { suit: "diamond" })
    },
    enable: "chooseToUse",
    filterCard(card) {
      return get.suit(card) === "diamond"
    },
    position: "hes",
    viewAs: { name: "lebu" },
    prompt: "将一张方块牌当【乐不思蜀】使用",
    check(card) {
      return 6 - get.value(card)
    },
    ai: {
      threaten: 1.5,
    },
  },
  // 流离
  liuli: {
    audio: 2,
    audioname: ["re_daqiao"],
    trigger: { target: "useCardToTarget" },
    preHidden: true,
    filter(event, player) {
      if (event.card.name !== "sha") {
        return false
      }
      if (!player.hasCards("he")) {
        return false
      }
      return game.hasPlayer((current) => {
        return (
          player.inRange(current) &&
          current !== event.player &&
          current !== player &&
          !!lib.filter.targetEnabled(event.card, event.player, current)
        )
      })
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCardTarget({
          filterTarget(card, player, target) {
            const trigger = _status.event
            if (player.inRange(target) && target !== trigger.source) {
              if (
                lib.filter.targetEnabled(trigger.card, trigger.source, target)
              ) {
                return true
              }
            }
            return false
          },
          filterCard: lib.filter.cardDiscardable,
          position: "he",
          ai1: (card) => get.unuseful(card) + 9,
          ai2: (target) => {
            const player = get.player()
            if (player.hasCards("h", "shan")) {
              return -get.attitude(player, target)
            }
            if (get.attitude(player, target) < 5) {
              return 6 - get.attitude(player, target)
            }
            if (player.hp === 1 && !player.hasCards("h", "shan")) {
              return 10 - get.attitude(player, target)
            }
            if (player.hp === 2 && !player.hasCards("h", "shan")) {
              return 8 - get.attitude(player, target)
            }
            return -1
          },
          prompt: get.prompt(event.skill),
          prompt2: "弃置一张牌并将此【杀】转移给你攻击范围内的另一名其他角色",
          source: trigger.player,
          card: trigger.card,
        })
        .setHiddenSkill(event.name.slice(0, -5))
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      const evt = trigger.getParent()
      if (evt) {
        evt.triggeredTargets2.remove(player)
        evt.targets.remove(player)
        evt.targets.push(target)
        await player.discard({ cards: event.cards })
      } else {
        throw new ReferenceError("找不到触发【流离】的使用牌事件")
      }
    },
    ai: {
      effect: {
        target_use(card, player, target) {
          if (!target.hasCards("he")) {
            return
          }
          if (card.name !== "sha") {
            return
          }
          let min = 1
          const friend = get.attitude(player, target) > 0
          const vcard = {
            name: "shacopy",
            nature: card.nature,
            suit: card.suit,
          }
          const players = game.filterPlayer()
          for (const current of players) {
            if (
              player !== current &&
              get.attitude(target, current) < 0 &&
              target.canUse(card, current)
            ) {
              if (!friend) {
                return 0
              }
              if (get.effect(current, vcard, player, player) > 0) {
                if (!player.canUse(card, players[0])) {
                  return [0, 0.1]
                }
                min = 0
              }
            }
          }
          return min
        },
      },
    },
  },
  // 陆逊
  // 谦逊
  qianxun: {
    mod: {
      targetEnabled(card, player, target, now) {
        if (card.name === "shunshou" || card.name === "lebu") {
          return false
        }
      },
    },
    audio: 2,
  },
  // 连营
  lianying: {
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
      if (player.hasCards("h")) {
        return false
      }
      const evt = event.getl(player)
      return evt && evt.player === player && evt.hs && evt.hs.length > 0
    },
    async content(event, trigger, player) {
      await player.draw()
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
      skillTagFilter(player, tag) {
        if (player.countCards("h") !== 1) {
          return false
        }
      },
    },
  },
  // 孙尚香
  // 结姻
  jieyin: {
    audio: 2,
    enable: "phaseUse",
    filterCard: true,
    usable: 1,
    selectCard: 2,
    check(card) {
      const player = get.owner(card)
      if (player == null) {
        return 0
      }
      if (player.countCards("h") > player.hp) {
        return 8 - get.value(card)
      }
      if (player.hp < player.maxHp) {
        return 6 - get.value(card)
      }
      return 4 - get.value(card)
    },
    filterTarget(card, player, target) {
      if (!target.hasSex("male")) {
        return false
      }
      if (target.hp >= target.maxHp) {
        return false
      }
      if (target === player) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      await player.recover()
      await event.target.recover()
    },
    ai: {
      order: 5.5,
      result: {
        player(player) {
          if (player.hp < player.maxHp) {
            return 4
          }
          if (player.countCards("h") > player.hp) {
            return 0
          }
          return -1
        },
        target: 4,
      },
      threaten: 2,
    },
  },
  // 枭姬
  xiaoji: {
    audio: 2,
    audioname2: { ol_sunshangxiang: "rexiaoji" },
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
    getIndex(event, player) {
      const evt = event.getl(player)
      if (evt?.player === player && evt.es) {
        return evt.es.length
      }
      return false
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
  // 华佗
  // 急救
  jijiu: {
    mod: {
      aiValue(player, card, num) {
        if (get.name(card) !== "tao" && get.color(card) !== "red") {
          return
        }
        const cards = player.getCards(
          "hs",
          (card) => get.name(card) === "tao" || get.color(card) === "red",
        )
        cards.sort(
          (a, b) =>
            (get.name(a) === "tao" ? 1 : 2) - (get.name(b) === "tao" ? 1 : 2),
        )
        const geti = () => {
          if (cards.includes(card)) {
            cards.indexOf(card)
          }
          return cards.length
        }
        return Math.max(num, [6.5, 4, 3, 2][Math.min(geti(), 2)])
      },
      aiUseful(...args) {
        return lib.skill.jijiu.mod?.aiValue?.(...args)
      },
    },
    locked: false,
    audio: 2,
    audioname: ["re_huatuo"],
    enable: "chooseToUse",
    viewAsFilter(player) {
      return (
        player !== _status.currentPhase &&
        player.hasCards("hes", { color: "red" })
      )
    },
    filterCard(card) {
      return get.color(card) === "red"
    },
    position: "hes",
    viewAs: { name: "tao" },
    prompt: "将一张红色牌当桃使用",
    check(card) {
      return 15 - get.value(card)
    },
    ai: {
      threaten: 1.5,
    },
  },
  // 青囊
  qingnang: {
    audio: 2,
    enable: "phaseUse",
    filterCard: true,
    usable: 1,
    check(card) {
      return 9 - get.value(card)
    },
    filterTarget(card, player, target) {
      if (target.hp >= target.maxHp) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      await event.target.recover()
    },
    ai: {
      order: 9,
      result: {
        target(player, target) {
          if (target.hp === 1) {
            return 5
          }
          if (player === target && player.countCards("h") > player.hp) {
            return 5
          }
          return 2
        },
      },
      threaten: 2,
    },
  },
  // 吕布
  // 无双
  wushuang: {
    audio: 2,
    audioname: ["re_lvbu", "shen_lvbu"],
    audioname2: { old_lvbu: "wushuang_re_lvbu" },
    forced: true,
    locked: true,
    group: ["wushuang1", "wushuang2"],
    preHidden: ["wushuang1", "wushuang2"],
  },
  wushuang1: {
    audio: "wushuang",
    audioname: ["re_lvbu", "shen_lvbu"],
    audioname2: { old_lvbu: "wushuang_re_lvbu" },
    trigger: { player: "useCardToPlayered" },
    forced: true,
    sourceSkill: "wushuang",
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        !event.getParent()?.directHit.includes(event.target)
      )
    },
    //priority:-1,
    logTarget: "target",
    async content(event, trigger, player) {
      const id = trigger.target.playerid
      const map = trigger.getParent()?.customArgs
      if (id != null) {
        if (!map[id]) {
          map[id] = {}
        }
        if (typeof map[id].shanRequired === "number") {
          map[id].shanRequired++
        } else {
          map[id].shanRequired = 2
        }
      }
    },
    ai: {
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (arg.card.name !== "sha" || arg.target.countCards("h", "shan") > 1) {
          return false
        }
      },
    },
  },
  wushuang2: {
    audio: "wushuang",
    audioname: ["re_lvbu", "shen_lvbu"],
    audioname2: { old_lvbu: "wushuang_re_lvbu" },
    trigger: { player: "useCardToPlayered", target: "useCardToTargeted" },
    forced: true,
    sourceSkill: "wushuang",
    logTarget(trigger, player) {
      return player === trigger.player ? trigger.target : trigger.player
    },
    filter(event, player) {
      return event.card.name === "juedou"
    },
    //priority:-1,
    async content(event, trigger, player) {
      const id = (player === trigger.player ? trigger.target : trigger.player)
        .playerid
      const idt = trigger.target.playerid
      const map = trigger.getParent()?.customArgs
      if (id != null && idt != null) {
        if (!map[idt]) {
          map[idt] = {}
        }
        if (!map[idt].shaReq) {
          map[idt].shaReq = {}
        }
        if (!map[idt].shaReq[id]) {
          map[idt].shaReq[id] = 1
        }
        map[idt].shaReq[id]++
      }
    },
    ai: {
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (
          arg.card.name !== "juedou" ||
          Math.floor(arg.target.countCards("h", "sha") / 2) >
            player.countCards("h", "sha")
        ) {
          return false
        }
      },
    },
  },
  wushuang_re_lvbu: { audio: 2 },
  // 貂蝉
  // 离间
  lijian: {
    audio: 2,
    audioname: ["re_diaochan"],
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return (
        game.countPlayer(
          (current) => current !== player && current.hasSex("male"),
        ) > 1
      )
    },
    check(card) {
      return 10 - get.value(card)
    },
    filterCard: true,
    position: "he",
    filterTarget(card, player, target) {
      if (player === target) {
        return false
      }
      if (!target.hasSex("male")) {
        return false
      }
      if (ui.selected.targets.length === 1) {
        return target.canUse({ name: "juedou" }, ui.selected.targets[0])
      }
      return true
    },
    targetprompt: ["先出杀", "后出杀"],
    selectTarget: 2,
    multitarget: true,
    async content(event, trigger, player) {
      const next = event.targets[1]
        .useCard({
          card: get.autoViewAs({ name: "juedou", isCard: true }),
          targets: [event.targets[0]],
          noai: true,
        })
        .set("animate", false)
      await game.delay(0.5)
      return next
    },
    ai: {
      order: 8,
      result: {
        target(player, target) {
          if (ui.selected.targets.length === 0) {
            return -3
          }
          return get.effect(
            target,
            { name: "juedou" },
            ui.selected.targets[0],
            target,
          )
        },
      },
      expose: 0.4,
      threaten: 3,
    },
  },
  // 闭月
  biyue: {
    audio: 2,
    audioname: ["old_diaochan"],
    trigger: { player: "phaseJieshuBegin" },
    frequent: true,
    preHidden: true,
    async content(event, trigger, player) {
      player.draw()
    },
  },
  // 华雄
  // 耀武
  yaowu: {
    trigger: { player: "damageBegin3" },
    audio: 2,
    filter(event, player) {
      return (
        event.card?.name === "sha" &&
        get.color(event.card) === "red" &&
        event.source?.isIn()
      )
    },
    forced: true,
    check() {
      return false
    },
    async content(event, trigger, player) {
      await trigger.source.chooseDrawRecover({ forced: true })
    },
    ai: {
      neg: true,
      effect: {
        target(card, player, target, current) {
          if (card.name === "sha" && get.color(card) === "red") {
            return [1, -2]
          }
        },
      },
    },
  },
  // 公孙瓒
  // 义从
  yicong: {
    trigger: {
      player: ["changeHp"],
    },
    audio: 2,
    audioname2: { re_gongsunzan: "reyicong" },
    forced: true,
    filter(event, player) {
      return get.sgn(player.hp - 2.5) !== get.sgn(player.hp - 2.5 - event.num)
    },
    content() {},
    mod: {
      globalFrom(from, to, current) {
        if (from.hp > 2) {
          return current - 1
        }
      },
      globalTo(from, to, current) {
        if (to.hp <= 2) {
          return current + 1
        }
      },
    },
    ai: {
      threaten: 0.8,
    },
  },
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
    async cost(event, trigger, player) {
      const target = trigger.player

      event.result = await player
        .chooseToDiscard({
          prompt: get.prompt(event.skill),
          filterCard(card, player) {
            return get.type(card) === "basic"
          },
          chooseonly: true,
          ai(card) {
            return get.event().eff - get.useful(card)
          },
        })
        .set(
          "eff",
          (() => {
            if (target.hasSkillTag("noe")) {
              return get.attitude(_status.event.player, target)
            }
            return get.damageEffect(target, player, _status.event.player)
          })(),
        )
        .forResult()
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const target = trigger.player
      await player.discard({
        cards: event.cards,
        discarder: player,
      })
      const { bool } = await target
        .chooseToDiscard({
          prompt: "弃置一张装备牌，或受到1点伤害",
          filterCard: get.filter({ type: "equip" }),
          position: "he",
          ai(card) {
            if (get.event().damage > 0) {
              return 0
            }
            if (get.event().noe) {
              return 12 - get.value(card)
            }
            return -get.event().damage - get.value(card)
          },
        })
        .set("damage", get.damageEffect(target, player, target))
        .set("noe", target.hasSkillTag("noe"))
        .forResult()
      if (!bool) {
        await target.damage()
      }
    },
  },
  // 潘凤
  // 狂斧
  kuangfu: {
    audio: 2,
    trigger: { source: "damageSource" },
    forced: true,
    filter(event, player) {
      if (player.hasSkill("kuangfu_used")) {
        return false
      }
      return (
        player.isPhaseUsing() &&
        event.card &&
        event.card.name === "sha" &&
        event.player !== player &&
        event.player.isIn()
      )
    },
    async content(event, trigger, player) {
      player.addTempSkill("kuangfu_used", "phaseChange")
      if (trigger.player.hp < player.hp) {
        await player.draw(2)
      } else {
        await player.loseHp()
      }
    },
    ai: {
      halfneg: true,
    },
    subSkill: {
      used: {
        charlotte: true,
      },
    },
  },
  // 孔融
  // 辞让
  cirang: {
    audio: 2,
    trigger: { player: "gainAfter", global: "loseAsyncAfter" },
    usable: 1,
    check(event, player) {
      return game.hasPlayer(
        (current) => current !== player && get.attitude(player, current) > 0,
      )
    },
    filter(event, player) {
      return event.getg(player).length >= 2
    },
    async content(event, trigger, player) {
      let result

      // step 0
      if (_status.connectMode) {
        game.broadcastAll(() => {
          _status.noclearcountdown = true
        })
      }
      event.given_map = {}
      event.cards = trigger.getg(player)
      await player.showCards(event.cards)
      const maxNum = Math.max(...event.cards.map((card) => get.number(card)))
      let gaveMax = false
      let first = true

      // step 1..2 (loop until all cards assigned or player cancels)
      while (event.cards.length > 0) {
        result = await player
          .chooseCardTarget({
            filterCard(card) {
              return get.itemtype(card) === "card" && event.cards.includes(card)
            },
            filterTarget: lib.filter.notMe,
            selectCard: [1, event.cards.length],
            prompt: "将其中任意张牌交给其他角色",
            forced: first,
            ai1(card) {
              if (ui.selected.cards.length > 0) {
                return -1
              }
              if (card.name === "du") {
                return 20
              }
              if (!gaveMax && get.number(card) === maxNum) {
                return 20 - get.value(card)
              }
              const player = _status.event.player
              if (player.countCards() > player.getHandcardLimit())
                return 10 - get.value(card)
              return -1
            },
            allowChooseAll: true,
            ai2(target) {
              const player = get.player()
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
          })
          .forResult()

        if (result.bool) {
          const res = result.cards
          const targetId = result.targets[0].playerid
          event.cards.removeArray(res)
          if (!event.given_map[targetId]) event.given_map[targetId] = []
          event.given_map[targetId].addArray(res)
          if (res?.some((card) => get.number(card) === maxNum)) gaveMax = true
          first = false
          // continue loop if still cards to give
          continue
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
      if (gaveMax) await player.draw()
    },
  },
  // 了了
  liaoliao: {
    audio: 2,
    trigger: { global: "phaseBegin" },
    logTarget: "player",
    filter(event, player) {
      return (
        event.player.isIn() && event.player !== player && player.hasCards("he")
      )
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseToDiscard({
          prompt: get.prompt(event.skill),
          position: "he",
          filterCard: lib.filter.cardDiscardable,
          ai(card) {
            const event = get.event()
            if (!event.att) return 0
            const useful = get.useful(card)
            const num = get.number(card)
            if (event.exceed || useful < 5 || (num < 5 && useful < 7)) {
              return 13 - num
            }
            return 0
          },
        })
        .set("att", get.attitude(player, trigger.player) < -2)
        .set("exceed", player.countCards() > player.getHandcardLimit())
        .forResult()
    },
    async content(event, trigger, player) {
      await player.discard({
        cards: event.cards,
        discarder: player,
      })
      player.addTempSkill("liaoliao_block")
      player.addMark("liaoliao_block", get.number(event.cards[0]), false)
    },
    subSkill: {
      block: {
        mark: true,
        intro: { content: "不能成为点数大于#的牌的目标" },
        mod: {
          targetEnabled: (card, player, target) => {
            if (typeof get.number(card) === "number") {
              if (get.number(card) > target.countMark("liaoliao_block"))
                return false
            }
          },
        },
        charlotte: true,
        onremove: true,
      },
    },
  },
}

export default skills
