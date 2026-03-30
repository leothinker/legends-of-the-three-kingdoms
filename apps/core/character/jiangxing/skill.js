import { lib, game, ui, get, ai, _status } from "noname"

/** @type { importCharacterConfig['skill'] } */
const skills = {
  // 曹昂
  // 慷忾
  kangkai: {
    audio: 2,
    trigger: { global: "useCardToTargeted" },
    filter(event, player) {
      return (
        event.card.name == "sha" && get.distance(player, event.target) <= 1 && event.target.isIn()
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
      if (trigger.target != player) {
        player
          .chooseCard(true, "he", "交给" + get.translation(trigger.target) + "一张牌")
          .set("ai", function (card) {
            if (get.position(card) == "e") {
              return -1
            }
            if (card.name == "shan") {
              return 1
            }
            if (get.type(card) == "equip") {
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
      if (trigger.target.getCards("h").includes(card) && get.type(card) == "equip") {
        trigger.target.chooseUseTarget(card)
      }
    },
    ai: {
      threaten: 1.1,
    },
  },
  // 薛灵芸
  // 思泣
  siqi: {
    audio: 2,
    trigger: { player: "damageEnd" },
    filter(event, player) {
      const cardPile = Array.from(ui.cardPile.childNodes).reverse()
      return cardPile[0] && get.color(cardPile[0]) === "red"
    },
    frequent: true,
    async content(event, trigger, player) {
      let cards = []
      const cardPile = Array.from(ui.cardPile.childNodes).reverse()
      for (const card of cardPile) {
        if (get.color(card) == "red") {
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
      await player.showCards(cards, get.translation(player) + "发动了【思泣】")
      while (cards.length) {
        if (
          cards.every((card) => {
            const name = ["tao", "wuzhong"]
            if (
              name.includes(card.name) ||
              (get.type(card) == "equip" && get.color(card) == "red")
            ) {
              return !game.hasPlayer((target) => lib.filter.targetEnabled2(card, player, target))
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
              if (
                ["tao", "wuzhong"].includes(card.name) ||
                (get.type(card) == "equip" && get.color(card) == "red")
              ) {
                return game.hasPlayer((target) =>
                  lib.filter.targetEnabled2(card, get.player(), target),
                )
              }
              return false
            },
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
          next.set("openskilldialog", `思泣：请选择${get.translation(card)}的目标`)
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
            .step(async (event, trigger, player) => (trigger.filterCard = () => false))
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
            if (!(get.color(card) == "red")) {
              return false
            }
            const name = ["tao", "wuzhong"]
            if (name.includes(card.name) || get.type(card) == "equip") {
              return !game.hasPlayer((target) => lib.filter.targetEnabled2(card, player, target))
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
          return event.getd(player, "cards2").some((i) => get.color(i, player) === "red")
        },
        forced: true,
        locked: true,
        async content(event, trigger, player) {
          const list = trigger.getd(player).filter((i) => get.color(i, player) === "red")
          await game.cardsGotoPile(list)
          game.log(player, "将", list, "置入了牌堆底")
        },
      },
      target: {
        mod: {
          selectTarget(card, player, range) {
            if (_status._siqi_check) {
              return
            }
            const event = get.event()
            if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
              return
            }
            _status._siqi_check = true
            const bool =
              game.countPlayer((target) => lib.filter.targetEnabled2(card, player, target)) > 1
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
            if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
              return
            }
            _status._siqi_check = true
            const bool = game.hasPlayer((target) => lib.filter.targetEnabled2(card, player, target))
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
            if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
              return
            }
            _status._siqi_check = true
            const bool = game.hasPlayer((target) => lib.filter.targetEnabled2(card, player, target))
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
            if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
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
      if (!player.hasCard((card) => lib.filter.cardDiscardable(card, player), "he")) {
        return false
      }
      return !player.hasCard((card) => card.hasGaintag("qiaozhi"), "h")
    },
    filterCard: lib.filter.cardDiscardable,
    position: "he",
    check(card) {
      const player = get.player()
      return 7 - get.value(card) + (player.hasSkill("olshqi") && get.color(card) === "red" ? 3 : 0)
    },
    async content(event, trigger, player) {
      const next = game.cardsGotoOrdering(get.cards(2))
      await next
      const cards = next.cards
      const videoId = lib.status.videoId++
      game.broadcastAll(
        (player, id, cards) => {
          const dialog = ui.create.dialog(get.translation(player) + "发动了【巧织】", cards)
          dialog.videoId = id
        },
        player,
        videoId,
        cards,
      )
      const time = get.utc()
      game.addVideo("showCards", player, [
        get.translation(player) + "发动了【巧织】",
        get.cardsInfo(cards),
      ])
      await game.delay(2.5)
      game.broadcastAll(
        (player, id) => {
          const dialog = get.idDialog(id)
          if (player === game.me && !_status.auto) {
            dialog.content.childNodes[0].textContent = "巧织：选择获得其中一张牌"
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
  // 夏侯玄
  // 宦浮
  huanfu: {
    audio: 2,
    trigger: {
      player: "useCardToPlayered",
      target: "useCardToTargeted",
    },
    filter(event, player) {
      if (event.card.name != "sha") {
        return false
      }
      if (player == event.player && !event.isFirstTarget) {
        return false
      }
      if (event.huanfu_map && event.huanfu_map[player.playerid]) {
        return false
      }
      return player.maxHp > 0 && player.countCards("he") > 0
    },
    direct: true,
    content() {
      "step 0"
      player
        .chooseToDiscard(
          "he",
          [1, player.maxHp],
          get.prompt("huanfu"),
          "通过弃牌，预测" +
            (player == trigger.player ? "你" : get.translation(trigger.player)) +
            "使用的" +
            get.translation(trigger.card) +
            "能造成多少伤害。如果弃置的牌数等于总伤害，则你摸两倍的牌。",
          "allowChooseAll",
        )
        .set(
          "predict",
          (function () {
            var target = trigger.target
            if (player == target) {
              if (
                trigger.targets.length > 1 ||
                player.hasShan() ||
                get.effect(player, trigger.card, trigger.player, player) == 0
              ) {
                return 0
              }
            } else {
              var target = trigger.target
              if (trigger.targets.length > 1 || target.mayHaveShan(player, "use")) {
                return 0
              }
            }
            var num = trigger.getParent().baseDamage
            var map = trigger.getParent().customArgs,
              id = target.playerid
            if (map[id]) {
              if (typeof map[id].baseDamage == "number") {
                num = map[id].baseDamage
              }
              if (typeof map[id].extraDamage == "number") {
                num += map[id].extraDamage
              }
            }
            if (
              target.hasSkillTag("filterDamage", null, {
                player: trigger.player,
                card: trigger.card,
              })
            ) {
              num = 1
            }
            return num
          })(),
        )
        .set("ai", function (card) {
          var num = _status.event.predict,
            player = _status.event.player
          if (ui.selected.cards.length >= num) {
            return 0
          }
          if (
            player.countCards("he", function (card) {
              return get.value(card) < 6 + num
            }) < num
          ) {
            return 0
          }
          return 6 + num - get.value(card)
        }).logSkill = "huanfu"
      ;("step 1")
      if (result.bool) {
        player.addTempSkill("huanfu_lottery")
        var evt = trigger.getParent()
        if (!evt.huanfu_map) {
          evt.huanfu_map = {}
        }
        evt.huanfu_map[player.playerid] = result.cards.length
      }
    },
    ai: {
      effect: {
        target_use(card, player, target, current) {
          if (card.name == "sha" && target.hp > 0 && current < 0 && target.countCards("he") > 0) {
            return 0.7
          }
        },
      },
    },
    subSkill: {
      lottery: {
        audio: "huanfu",
        trigger: { global: "useCardAfter" },
        forced: true,
        charlotte: true,
        filter(event, player) {
          var map = event.huanfu_map
          if (!map || !map[player.playerid]) {
            return false
          }
          var num = 0
          event.player.getHistory("sourceDamage", function (evt) {
            if (evt.card == event.card && evt.getParent().type == "card") {
              num += evt.num
            }
          })
          return num == map[player.playerid]
        },
        content() {
          player.draw(2 * trigger.huanfu_map[player.playerid])
        },
      },
    },
  },
  // 清议
  qingyi: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return (
        player.hasCard(function (card) {
          return lib.filter.cardDiscardable(card, player, "qingyi")
        }, "he") &&
        game.hasPlayer((current) => lib.skill.qingyi.filterTarget(null, player, current))
      )
    },
    selectTarget: [1, 2],
    filterTarget(card, player, target) {
      return target != player && target.countCards("he") > 0
    },
    multitarget: true,
    multiline: true,
    content() {
      "step 0"
      var list = [player]
      list.addArray(targets)
      list.sortBySeat()
      event.list = list
      for (var target of event.list) {
        if (
          !target.hasCard(function (card) {
            return lib.filter.cardDiscardable(card, target, "qingyi")
          }, "he")
        ) {
          event.finish()
          break
        }
      }
      ;("step 1")
      player
        .chooseCardOL(event.list, "he", true, "清议：选择弃置一张牌", function (card, player) {
          return lib.filter.cardDiscardable(card, player, "qingyi")
        })
        .set("ai", get.unuseful)
      ;("step 2")
      var lose_list = [],
        cards = []
      for (var i = 0; i < result.length; i++) {
        var current = event.list[i],
          card = result[i].cards[0]
        lose_list.push([current, result[i].cards])
        cards.push(card)
      }
      game
        .loseAsync({
          lose_list: lose_list,
        })
        .setContent("discardMultiple")
      var type = get.type2(cards[0])
      for (var i = 1; i < cards.length; i++) {
        if (get.type2(cards[i]) != type) {
          event.finish()
        }
      }
      ;("step 3")
      for (var target of event.list) {
        if (
          !target.hasCard(function (card) {
            return lib.filter.cardDiscardable(card, target, "qingyi")
          }, "he")
        ) {
          event.finish()
          return
        }
      }
      player.chooseBool("清议：是否重复此流程？").set("ai", function () {
        return true
      })
      ;("step 4")
      if (result.bool) {
        event.goto(1)
      }
    },
    ai: {
      threaten: 1.2,
      order: 9.1,
      result: {
        player(player) {
          let min = 24
          player.countCards("he", function (card) {
            min = Math.min(min, get.value(card))
          })
          if (ui.selected.targets.length == 1) {
            return 1 - min / 6
          }
          return 0.75 - min / 48
        },
        target(player, target) {
          if (
            target.hasCard(function (card) {
              return lib.filter.cardDiscardable(card, player, "qingyi")
            }, "he")
          ) {
            return -1
          }
          return 0
        },
      },
    },
    group: "qingyi_gain",
    subSkill: {
      gain: {
        audio: "qingyi",
        trigger: { player: "phaseJieshuBegin" },
        direct: true,
        filter(event, player) {
          var history = player.getHistory("useSkill", (evt) => evt.skill == "qingyi")
          if (!history.length) {
            return false
          }
          for (var evt of history) {
            var list = [player]
            list.addArray(evt.targets)
            for (var target of list) {
              var found = false
              target.getHistory("lose", function (evtx) {
                if (found || evtx.getParent(2).name != "qingyi") {
                  return false
                }
                for (var card of evtx.cards) {
                  if (get.position(card, true) == "d") {
                    found = true
                  }
                }
              })
              if (found) {
                return true
              }
            }
          }
          return false
        },
        content() {
          "step 0"
          var history = player.getHistory("useSkill", (evt) => evt.skill == "qingyi"),
            cards = []
          for (var evt of history) {
            var list = [player]
            list.addArray(evt.targets)
            for (var target of list) {
              target.getHistory("lose", function (evtx) {
                if (evtx.getParent(2).name != "qingyi") {
                  return false
                }
                for (var card of evtx.cards) {
                  if (get.position(card, true) == "d") {
                    cards.add(card)
                  }
                }
              })
            }
          }
          var colors = []
          for (var card of cards) {
            colors.add(get.color(card, false))
          }
          var numColors = colors.length
          if (!numColors || !cards.length) {
            event.finish()
            return
          }
          player
            .chooseButton(["清议：选择获得每种颜色的牌各一张", cards], numColors)
            .set("filterButton", function (button) {
              var selected = ui.selected.buttons
              for (var i = 0; i < selected.length; i++) {
                if (get.color(selected[i].link, false) == get.color(button.link, false)) {
                  return false
                }
              }
              return true
            })
            .set("ai", function (button) {
              return get.value(button.link, _status.event.player)
            })
          ;("step 1")
          if (result.bool) {
            player.logSkill("qingyi_gain")
            player.gain(result.links, "gain2")
          }
        },
      },
    },
  },
  // 迮阅
  zeyue: {
    audio: 2,
    trigger: { player: "phaseZhunbeiBegin" },
    limited: true,
    skillAnimation: true,
    animationColor: "water",
    direct: true,
    filter(event, player) {
      var sources = [],
        history = player.actionHistory
      for (var i = history.length - 1; i >= 0; i--) {
        if (i < history.length - 1 && history[i].isMe) {
          break
        }
        for (var evt of history[i].damage) {
          if (evt.source && evt.source != player && evt.source.isIn()) {
            sources.add(evt.source)
          }
        }
      }
      for (var source of sources) {
        var skills = source.getStockSkills("一！", "五！")
        for (var skill of skills) {
          var info = get.info(skill)
          if (
            info &&
            !info.persevereSkill &&
            !info.charlotte &&
            !get.is.locked(skill, source) &&
            source.hasSkill(skill, null, null, false)
          ) {
            return true
          }
        }
      }
      return false
    },
    content() {
      "step 0"
      var sources = [],
        history = player.actionHistory
      for (var i = history.length - 1; i >= 0; i--) {
        if (i < history.length - 1 && history[i].isMe) {
          break
        }
        for (var evt of history[i].damage) {
          if (evt.source && evt.source != player && evt.source.isIn()) {
            sources.add(evt.source)
          }
        }
      }
      sources = sources.filter(function (source) {
        var skills = source.getStockSkills("一！", "五！")
        for (var skill of skills) {
          var info = get.info(skill)
          if (
            info &&
            !info.persevereSkill &&
            !info.charlotte &&
            !get.is.locked(skill, source) &&
            source.hasSkill(skill, null, null, false)
          ) {
            return true
          }
        }
        return false
      })
      player
        .chooseTarget(
          get.prompt("zeyue"),
          "令一名可选角色的一个非锁定技失效",
          function (card, player, target) {
            return _status.event.sources.includes(target)
          },
        )
        .set("sources", sources)
        .set("ai", function (target) {
          var player = _status.event.player,
            att = get.attitude(player, target)
          if (att >= 0) {
            return 0
          }
          return get.threaten(target, player)
        })
      ;("step 1")
      if (result.bool) {
        var target = result.targets[0]
        player.logSkill("zeyue", target)
        player.awakenSkill(event.name)
        event.target = target
        var skills = target.getStockSkills("一！", "五！")
        skills = skills.filter(function (skill) {
          var info = get.info(skill)
          if (
            info &&
            !info.charlotte &&
            !get.is.locked(skill, target) &&
            target.hasSkill(skill, null, null, false)
          ) {
            return true
          }
        })
        if (skills.length == 1) {
          event._result = { control: skills[0] }
        } else {
          player
            .chooseControl(skills)
            .set("prompt", "令" + get.translation(target) + "的一个技能失效")
        }
      } else {
        event.finish()
      }
      ;("step 2")
      var skill = result.control
      target.disableSkill("zeyue_" + player.playerid, skill)
      target.storage["zeyue_" + player.playerid] = true
      player.addSkill("zeyue_round")
      player.markAuto("zeyue_round", [target])
      if (!player.storage.zeyue_map) {
        player.storage.zeyue_map = {}
      }
      player.storage.zeyue_map[target.playerid] = 0
      game.log(target, "的技能", "#g【" + get.translation(skill) + "】", "被失效了")
    },
    ai: { threaten: 3 },
    subSkill: {
      round: {
        charlotte: true,
        trigger: { global: "roundEnd" },
        filter(event, player) {
          var storage = player.getStorage("zeyue_round")
          for (var source of storage) {
            if (source.isIn() && source.canUse("sha", player, false)) {
              return true
            }
          }
          return false
        },
        forced: true,
        popup: false,
        content() {
          "step 0"
          event.targets = player.storage.zeyue_round.slice(0).sortBySeat()
          event.target = event.targets.shift()
          event.forceDie = true
          ;("step 1")
          var map = player.storage.zeyue_map
          if (target.storage["zeyue_" + player.playerid]) {
            map[target.playerid]++
          }
          event.num = map[target.playerid] - 1
          if (event.num <= 0) {
            event.finish()
          }
          ;("step 2")
          event.num--
          target.useCard(player, { name: "sha", isCard: true }, false, "zeyue_round")
          ;("step 3")
          var key = "zeyue_" + player.playerid
          if (
            target.storage[key] &&
            player.hasHistory("damage", function (evt) {
              return (
                evt.card.name == "sha" &&
                evt.getParent().type == "card" &&
                evt.getParent(3) == event
              )
            })
          ) {
            for (var skill in target.disabledSkills) {
              if (target.disabledSkills[skill].includes(key)) {
                game.log(target, "恢复了技能", "#g【" + get.translation(skill) + "】")
              }
            }
            delete target.storage[key]
            target.enableSkill(key)
          }
          if (
            event.num > 0 &&
            player.isIn() &&
            target.isIn() &&
            target.canUse("sha", player, false)
          ) {
            event.goto(2)
          } else if (event.targets.length > 0) {
            event.target = event.targets.shift()
            event.goto(1)
          }
        },
      },
    },
  },
  // 阎柔
  // 仇讨
  choutao: {
    audio: 2,
    trigger: {
      player: "useCard",
      target: "useCardToTargeted",
    },
    filter(event, player) {
      if (event.card.name != "sha" || !event.player.isIn()) {
        return false
      }
      if (player == event.player) {
        return player.hasCard(function (card) {
          return lib.filter.cardDiscardable(card, player, "choutao")
        }, "he")
      }
      return event.player.hasCard(function (card) {
        return lib.filter.canBeDiscarded(card, player, event.player)
      }, "he")
    },
    check(event, player) {
      if (player == event.player) {
        if (
          !player.hasCard(function (card) {
            return get.value(card) <= 5
          }, "he")
        ) {
          return false
        }
        for (var i of event.targets) {
          var eff1 = get.damageEffect(i, player, player)
          if (eff1 < 0) {
            return false
          }
          if (i.hasShan() && eff1 > 0) {
            return true
          }
        }
        var sha = false
        return (
          player.getCardUsable({ name: "sha" }) <= 0 &&
          player.hasCard(function (card) {
            if (!sha && get.name(card) == "sha" && player.getUseValue(card) > 0) {
              sha = true
              return false
            }
            return sha && get.value(card) <= 5
          }, "hs")
        )
      } else {
        var eff1 = get.effect(event.player, { name: "guohe_copy2" }, player, player)
        var eff2 = get.damageEffect(player, event.player, player)
        if (!player.hasShan()) {
          return eff1 > 0
        }
        if (eff2 > 0) {
          return eff1 > 0
        }
        return player.hp > 2 && eff2 < eff1
      }
    },
    logTarget: "player",
    content() {
      "step 0"
      if (player != game.me && !player.isOnline() && !player.isUnderControl()) {
        game.delayx()
      }
      if (player == trigger.player) {
        player.chooseToDiscard("he", true).set("ai", function (card) {
          var player = _status.event.player
          var val = player.getUseValue(card)
          if (get.name(card) == "sha" && player.getUseValue(card) > 0) {
            val += 5
          }
          return 20 - val
        })
      } else {
        player.discardPlayerCard(trigger.player, true, "he")
      }
      ;("step 1")
      trigger.directHit.addArray(game.players)
      if (player == trigger.player && trigger.addCount !== false) {
        trigger.addCount = false
        const stat = player.getStat().card,
          name = trigger.card.name
        if (typeof stat[name] === "number") {
          stat[name]--
        }
      }
    },
  },
  // 襄戍
  xiangshu: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    direct: true,
    limited: true,
    skillAnimation: true,
    animationColor: "gray",
    filter(event, player) {
      return (player.getStat("damage") || 0) > 0 && game.hasPlayer((current) => current.isDamaged())
    },
    content() {
      "step 0"
      event.num = Math.min(5, player.getStat("damage"))
      player
        .chooseTarget(
          "是否发动限定技【襄戍】？",
          "令一名角色回复" + event.num + "点体力并摸" + get.cnNumber(event.num) + "张牌",
          function (card, player, target) {
            return target.isDamaged()
          },
        )
        .set("ai", function (target) {
          var num = _status.event.getParent().num,
            player = _status.event.player
          var att = get.attitude(player, target)
          if (att > 0 && num >= Math.min(player.hp, 2)) {
            return att * Math.sqrt(target.getDamagedHp())
          }
          return 0
        })
      ;("step 1")
      if (result.bool) {
        var target = result.targets[0]
        player.awakenSkill(event.name)
        player.logSkill("xiangshu", target)
        target.recover(num)
        target.draw(num)
        if (player != target) {
          player.addExpose(0.2)
        }
      }
    },
  },
  // 清河公主
  // 谮构
  zengou: {
    audio: 2,
    trigger: { global: "useCard" },
    filter(event, player) {
      return (
        event.card.name == "shan" &&
        player.inRange(event.player) &&
        (player.hp > 0 ||
          player.hasCard(function (card) {
            return get.type(card) != "basic" && lib.filter.cardDiscardable(card, player, "zengou")
          }, "eh"))
      )
    },
    logTarget: "player",
    check(event, player) {
      if (get.attitude(player, event.player) >= 0) {
        return false
      }
      if (
        get.damageEffect(event.player, event.getParent(3).player, player, get.nature(event.card)) <=
        0
      ) {
        return false
      }
      if (
        player.hasCard(function (card) {
          return (
            get.type(card) != "basic" &&
            get.value(card) < 7 &&
            lib.filter.cardDiscardable(card, player, "zengou")
          )
        }, "eh")
      ) {
        return true
      }
      return player.hp > Math.max(1, event.player.hp)
    },
    content() {
      "step 0"
      trigger.all_excluded = true
      var str = "弃置一张非基本牌"
      if (player.hp > 0) {
        str += "，或点「取消」失去1点体力"
      }
      var next = player
        .chooseToDiscard(
          str,
          function (card) {
            return get.type(card) != "basic"
          },
          "he",
        )
        .set("ai", function (card) {
          return 7 - get.value(card)
        })
      if (player.hp <= 0) {
        next.set("forced", true)
      }
      ;("step 1")
      if (!result.bool) {
        player.loseHp()
      }
      ;("step 2")
      var cards = trigger.cards.filterInD()
      if (cards.length) {
        player.gain(cards, "gain2")
      }
    },
  },
  // 长姬
  zhangji: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    direct: true,
    filter(event, player) {
      if (!event.player.isIn()) {
        return false
      }
      if (player.getHistory("sourceDamage").length > 0) {
        return true
      }
      if (player.getHistory("damage").length > 0) {
        return event.player.countCards("he") > 0
      }
      return false
    },
    content() {
      "step 0"
      event.target = trigger.player
      if (player.getHistory("sourceDamage").length) {
        player
          .chooseBool(
            get.prompt("zhangji", event.target),
            "令" + get.translation(event.target) + "摸两张牌",
          )
          .set("choice", get.attitude(player, event.target) > 0)
          .set("ai", () => _status.event.choice)
      } else {
        event.goto(2)
      }
      ;("step 1")
      if (result.bool) {
        player.logSkill("zhangji", target)
        event.logged = true
        target.draw(2)
      }
      ;("step 2")
      if (target.isIn() && target.countCards("he") > 0 && player.getHistory("damage").length > 0) {
        player
          .chooseBool(
            get.prompt("zhangji", event.target),
            "令" + get.translation(event.target) + "弃置两张牌",
          )
          .set("choice", get.attitude(player, event.target) < 0)
          .set("ai", () => _status.event.choice)
      } else {
        event.finish()
      }
      ;("step 3")
      if (result.bool) {
        if (!event.logged) {
          player.logSkill("zhangji", target)
        }
        target.chooseToDiscard("he", true, 2)
      }
    },
  },
  // 曹芳
  // 置民
  zhimin: {
    audio: 2,
    trigger: { global: "roundStart" },
    filter(event, player) {
      return (
        game.hasPlayer((current) => current != player && current.countCards("h")) &&
        player.getHp() > 0
      )
    },
    forced: true,
    group: ["zhimin_mark", "zhimin_draw"],
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          `置民：请选择至多${get.cnNumber(player.getHp())}名其他角色`,
          "你获得这些角色各自手牌中的随机一张牌",
          (card, player, target) => {
            return target !== player && target.countCards("h")
          },
          [1, player.getHp()],
          true,
        )
        .set("ai", (target) => {
          const player = get.player()
          return get.effect(target, { name: "shunshou_copy", position: "h" }, player, player) + 0.1
        })
        .forResult()
      if (!result?.targets?.length) {
        return
      }
      const targets = result.targets.sortBySeat()
      player.line(targets, "thunder")
      const toGain = []
      for (const target of targets) {
        const cards = target.getCards("h")
        const gainableCards = cards
          .filter((card) => {
            return lib.filter.canBeGained(card, player, target)
          })
          .randomSort()
        toGain.push(gainableCards[0])
      }
      if (toGain.length) {
        await player.gain(toGain, "giveAuto")
      }
      await game.delayx()
    },
    ai: { threaten: 5.8 },
    mod: {
      aiOrder(player, card, num) {
        if (
          num > 0 &&
          get.itemtype(card) === "card" &&
          card.hasGaintag("zhimin_tag") &&
          player.countCards("h", (cardx) => {
            return cardx.hasGaintag("zhimin_tag") && cardx !== card
          }) < player.maxHp
        ) {
          return num / 10
        }
      },
    },
    subSkill: {
      mark: {
        audio: "zhimin",
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
        forced: true,
        silent: true,
        filter(event, player) {
          if (
            !event.getl(player).hs.length &&
            !event
              .getg(player)
              .some((card) => get.position(card) === "h" && get.owner(card) === player)
          ) {
            return false
          }
          return true
        },
        async content(event, trigger, player) {
          player.removeGaintag("zhimin_tag")
          const cards = player.getCards("h"),
            minNumber = cards.map((card) => get.number(card)).sort((a, b) => a - b)[0]
          player.addGaintag(
            cards.filter((card) => get.number(card) === minNumber),
            "zhimin_tag",
          )
        },
      },
      draw: {
        audio: "zhimin",
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
        filter(event, player) {
          const evt = event.getl(player)
          if (!evt.hs.length || player.maxHp <= player.countCards("h")) {
            return false
          }
          return Object.values(evt.gaintag_map).flat().includes("zhimin_tag")
        },
        async content(event, trigger, player) {
          player.showHandcards(get.translation(player) + "发动了【置民】")
          await player.drawTo(player.maxHp)
        },
      },
    },
  },
  // 拒谏
  jujian: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    zhuSkill: true,
    filter(event, player) {
      return game.hasPlayer((current) => {
        return (
          player.hasZhuSkill("jujian", current) && current.group === "wei" && current !== player
        )
      })
    },
    filterTarget(_, player, target) {
      return player.hasZhuSkill("jujian", target) && target.group === "wei" && target !== player
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      await target.draw()
      target.addTempSkill("jujian_forbid", "roundStart")
      target.markAuto("jujian_forbid", player)
    },
    ai: {
      result: {
        target(player, target) {
          const num = target.countCards("hs", (card) => {
              return (
                get.type(card) == "trick" &&
                target.canUse(card, player) &&
                get.effect(player, card, target, player) < -2
              )
            }),
            att = get.attitude(player, target)
          if (att < 0) {
            return -0.74 * num
          }
          return 1.5
        },
      },
    },
    subSkill: {
      forbid: {
        audio: "jujian",
        trigger: {
          player: "useCardToBefore",
        },
        filter(event, player) {
          if (get.type(event.card) !== "trick") {
            return false
          }
          return player.getStorage("jujian_forbid").includes(event.target)
        },
        forced: true,
        charlotte: true,
        onremove: true,
        direct: true,
        async content(event, trigger, player) {
          await trigger.target.logSkill("jujian_forbid", player)
          trigger.cancel()
        },
        intro: {
          content: "使用普通锦囊牌对$无效",
        },
        ai: {
          effect: {
            player(card, player, target, current) {
              if (
                get.type(card) == "trick" &&
                player.getStorage("jujian_forbid").includes(target)
              ) {
                return "zeroplayertarget"
              }
            },
          },
        },
      },
    },
  },
  // 杜预
  // 谏国
  jianguo: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return ["discard", "draw"].some((i) => !player.getStorage("jianguo_used").includes(i))
    },
    chooseButton: {
      dialog(event, player) {
        var dialog = ui.create.dialog("谏国：请选择一项", "hidden")
        dialog.add([
          [
            ["discard", "令一名角色摸一张牌，然后弃置一半手牌"],
            ["draw", "令一名角色弃置一张牌，然后摸等同于手牌数一半的牌"],
          ],
          "textbutton",
        ])
        return dialog
      },
      filter(button, player) {
        return !player.getStorage("jianguo_used").includes(button.link)
      },
      check(button) {
        var player = _status.event.player
        if (button.link == "discard") {
          var discard = Math.max.apply(
            Math,
            game
              .filterPlayer((current) => {
                return lib.skill.jianguo_discard.filterTarget(null, player, current)
              })
              .map((current) => {
                return get.effect(current, "jianguo_discard", player, player)
              }),
          )
          return discard
        }
        if (button.link == "draw") {
          var draw = Math.max.apply(
            Math,
            game
              .filterPlayer((current) => {
                return lib.skill.jianguo_draw.filterTarget(null, player, current)
              })
              .map((current) => {
                return get.effect(current, "jianguo_draw", player, player)
              }),
          )
          return draw
        }
        return 0
      },
      backup(links) {
        return get.copy(lib.skill["jianguo_" + links[0]])
      },
      prompt(links) {
        if (links[0] == "discard") {
          return "令一名角色摸一张牌，然后弃置一半手牌"
        }
        return "令一名角色弃置一张牌，然后摸等同于手牌数一半的牌"
      },
    },
    ai: {
      order: 10,
      threaten: 2.8,
      result: {
        //想让杜预两个技能自我联动写起来太累了，开摆
        player: 1,
      },
    },
    subSkill: {
      used: {
        charlotte: true,
        onremove: true,
      },
      backup: { audio: "jianguo" },
      discard: {
        audio: "jianguo",
        filterTarget: () => true,
        filterCard: () => false,
        selectCard: -1,
        content() {
          "step 0"
          player.addTempSkill("jianguo_used", "phaseUseAfter")
          player.markAuto("jianguo_used", ["discard"])
          target.draw()
          game.delayex()
          ;("step 1")
          var num = Math.ceil(target.countCards("h") / 2)
          if (num > 0) {
            target.chooseToDiscard(num, true, "谏国：请弃置" + get.cnNumber(num) + "张手牌")
          }
        },
        ai: {
          result: {
            target(player, target) {
              return 1.1 - Math.floor(target.countCards("h") / 2)
            },
          },
          tag: {
            gain: 1,
            loseCard: 2,
          },
        },
      },
      draw: {
        audio: "jianguo",
        filterTarget(card, player, target) {
          return target.countCards("he")
        },
        filterCard: () => false,
        selectCard: -1,
        content() {
          "step 0"
          player.addTempSkill("jianguo_used", "phaseUseAfter")
          player.markAuto("jianguo_used", ["draw"])
          target.chooseToDiscard("he", true, "谏国：请弃置一张牌")
          ;("step 1")
          var num = Math.ceil(target.countCards("h") / 2)
          if (num > 0) {
            target.draw(num)
          }
        },
        ai: {
          result: {
            target(player, target) {
              var fix = 0
              var num = target.countCards("h")
              if (player == target && num % 2 == 1 && num >= 5) {
                fix += 1
              }
              return Math.ceil(num / 2 - 0.5) + fix
            },
          },
          tag: {
            loseCard: 1,
            gain: 2,
          },
        },
      },
    },
  },
  // 倾势
  qingshi: {
    audio: 2,
    trigger: {
      player: "useCardToPlayered",
    },
    filter(event, player) {
      if (player != _status.currentPhase) {
        return false
      }
      if (!event.isFirstTarget) {
        return false
      }
      if (event.card.name != "sha" && get.type(event.card, null, false) != "trick") {
        return false
      }
      if (player.countCards("h") != player.getHistory("useCard").indexOf(event.getParent()) + 1) {
        return false
      }
      return event.targets.some((target) => {
        return target != player && target.isIn()
      })
    },
    direct: true,
    locked: false,
    content() {
      "step 0"
      var targets = trigger.targets.filter((target) => {
        return target != player && target.isIn()
      })
      player
        .chooseTarget(
          get.prompt("qingshi"),
          "对一名不为你的目标角色造成1点伤害",
          (card, player, target) => {
            return _status.event.targets.includes(target)
          },
        )
        .set("ai", (target) => {
          var player = _status.event.player
          return get.damageEffect(target, player, player)
        })
        .set("targets", targets)
      ;("step 1")
      if (result.bool) {
        var target = result.targets[0]
        player.logSkill("qingshi", target)
        target.damage()
      }
    },
    mod: {
      aiOrder(player, card, num) {
        if (_status.currentPhase != player) {
          return
        }
        var cardsh = []
        if (Array.isArray(card.cards)) {
          cardsh.addArray(
            card.cards.filter((card) => {
              return get.position(card) == "h"
            }),
          )
        }
        var del = player.countCards("h") - cardsh.length - player.getHistory("useCard").length - 1
        if (del < 0) {
          return
        }
        if (del > 0) {
          if (card.name == "sha" || get.type(card, null, player) != "trick") {
            return num / 3
          }
          return num + 1
        }
        return num + 15
      },
    },
  },
  // 桓范
  // 谏诤
  jianzheng: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return target.countCards("h") && target != player
    },
    content() {
      "step 0"
      var forced = target.hasCard((i) => player.hasUseTarget(i), "h")
      player
        .choosePlayerCard(target, "h", "visible", forced, "获得并使用其中一张牌")
        .set("filterButton", (button) => {
          return _status.event.player.hasUseTarget(button.link)
        })
        .set("ai", (button) => {
          return _status.event.player.getUseValue(button.link)
        })
      ;("step 1")
      if (result.bool) {
        var card = result.links[0]
        event.card = card
        player.gain(card, "giveAuto")
      } else {
        event.goto(3)
      }
      ;("step 2")
      if (get.position(card) == "h" && get.owner(card) == player && player.hasUseTarget(card)) {
        if (get.name(card, player) == "sha") {
          player.chooseUseTarget(card, true, false)
        } else {
          player.chooseUseTarget(card, true)
        }
      }
      ;("step 3")
      if (
        player.hasHistory("useCard", (evt) => {
          return evt.getParent(2).name == "jianzheng" && evt.targets.includes(target)
        })
      ) {
        player.link(true)
        target.link(true)
      } else {
        event.finish()
      }
      ;("step 4")
      target.viewHandcards(player)
    },
    ai: {
      order: 10,
      expose: 0.2,
      result: {
        target(player, target) {
          return -Math.sqrt(target.countCards("h"))
        },
      },
    },
  },
  // 腹谋
  fumou: {
    audio: 2,
    trigger: { player: "damageEnd" },
    direct: true,
    filter(event, player) {
      return player.getDamagedHp() > 0
    },
    content() {
      "step 0"
      event.num = trigger.num
      ;("step 1")
      player.chooseTarget(get.prompt2("fumou"), [1, player.getDamagedHp()]).set("ai", (target) => {
        var att = get.attitude(_status.event.player, target)
        if (target.countCards("h") >= 3 && (!target.isDamaged() || !target.countCards("e"))) {
          if (!target.canMoveCard()) {
            return -att
          } else if (!target.canMoveCard(true)) {
            return -att / 5
          }
        }
        return att
      })
      ;("step 2")
      if (result.bool) {
        var targets = result.targets
        targets.sortBySeat(player)
        event.targets = targets
        player.logSkill("fumou", targets)
        event.num--
      } else {
        event.finish()
      }
      ;("step 3")
      var target = targets.shift()
      event.target = target
      var choices = []
      var choiceList = [
        "移动场上的一张牌",
        "弃置所有手牌并摸两张牌",
        "弃置装备区里的所有牌并回复1点体力",
      ]
      if (target.canMoveCard()) {
        choices.push("选项一")
      } else {
        choiceList[0] = '<span style="opacity:0.5">' + choiceList[0] + "</span>"
      }
      if (
        target.countCards("h") &&
        !target.hasCard((card) => {
          return !lib.filter.cardDiscardable(card, target, "fumou")
        }, "h")
      ) {
        choices.push("选项二")
      } else {
        choiceList[1] = '<span style="opacity:0.5">' + choiceList[1] + "</span>"
      }
      if (
        target.countCards("e") &&
        !target.hasCard((card) => {
          return !lib.filter.cardDiscardable(card, target, "fumou")
        }, "h")
      ) {
        choices.push("选项三")
      } else {
        choiceList[2] = '<span style="opacity:0.5">' + choiceList[2] + "</span>"
      }
      if (choices.length) {
        target
          .chooseControl(choices)
          .set("prompt", "腹谋：请选择一项")
          .set("choiceList", choiceList)
          .set("ai", () => {
            return _status.event.choice
          })
          .set(
            "choice",
            (function () {
              if (choices.length == 1) {
                return choices[0]
              }
              var func = (choice, target) => {
                switch (choice) {
                  case "选项一":
                    if (target.canMoveCard(true)) {
                      return 5
                    }
                    return 0
                  case "选项二":
                    return (
                      4 -
                      target.getCards("h").reduce((acc, card) => {
                        return acc + get.value(card)
                      }, 0) /
                        3
                    )
                  case "选项三": {
                    var e2 = target.getEquip(2)
                    if (target.isHealthy()) {
                      return -1.8 * target.countCards("e") - (e2 ? 1 : 0)
                    }
                    if (!e2 && target.hp + target.countCards("hs", ["tao", "jiu"]) < 2) {
                      return 6
                    }
                    let rec =
                      get.recoverEffect(target, target, target) / 4 -
                      target.getCards("e").reduce((acc, card) => {
                        return acc + get.value(card)
                      }, 0) /
                        3
                    if (!e2) {
                      rec += 2
                    }
                    return rec
                  }
                }
              }
              var choicesx = choices.map((i) => [i, func(i, target)]).sort((a, b) => b[1] - a[1])
              return choicesx[0][0]
            })(),
          )
      } else {
        event.goto(5)
      }
      ;("step 4")
      game.log(target, "选择了", "#y" + result.control)
      if (result.control == "选项一") {
        target.moveCard(true)
      } else if (result.control == "选项二") {
        target.chooseToDiscard(true, "h", target.countCards("h"))
        target.draw(2)
      } else {
        target.chooseToDiscard(true, "e", target.countCards("e"))
        target.recover()
      }
      ;("step 5")
      if (event.targets.length) {
        event.goto(3)
      }
      // else if(event.num) event.goto(1);
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
            if (target.hp == 2 && target.hasFriend()) {
              return [1, num * 1.5]
            }
            if (target.hp >= 2) {
              return [1, num]
            }
          }
        },
      },
    },
  },
  // 郑浑
  // 强峙
  qiangzhi: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      if (target == player) {
        return false
      }
      return (
        target.countDiscardableCards(player, "he") + player.countDiscardableCards(player, "he") >= 3
      )
    },
    content() {
      "step 0"
      var dialog = []
      dialog.push("强峙：弃置你与" + get.translation(target) + "的共计三张牌")
      if (player.countCards("h")) {
        dialog.addArray(['<div class="text center">你的手牌</div>', player.getCards("h")])
      }
      if (player.countCards("e")) {
        dialog.addArray(['<div class="text center">你的装备</div>', player.getCards("e")])
      }
      if (target.countCards("h")) {
        dialog.add('<div class="text center">' + get.translation(target) + "的手牌</div>")
        if (player.hasSkillTag("viewHandcard", null, target, true)) {
          dialog.push(target.getCards("h"))
        } else {
          dialog.push([target.getCards("h"), "blank"])
        }
      }
      if (target.countCards("e")) {
        dialog.addArray([
          '<div class="text center">' + get.translation(target) + "的装备</div>",
          target.getCards("e"),
        ])
      }
      player
        .chooseButton(3, true)
        .set("createDialog", dialog)
        .set("filterButton", (button) => {
          if (
            !lib.filter.canBeDiscarded(button.link, _status.event.player, get.owner(button.link))
          ) {
            return false
          }
          return true
        })
        .set("filterOk", () => {
          return ui.selected.buttons.length == 3
        })
        .set("ai", (button) => {
          var player = _status.event.player
          var target = _status.event.getParent().target
          var card = button.link
          if (get.owner(card) == player) {
            if (_status.event.damage) {
              return 15 - get.value(card)
            }
            if (
              player.hp >= 3 ||
              get.damageEffect(player, target, player) >= 0 ||
              (player.hasSkill("pitian") &&
                player.getHandcardLimit() - player.countCards("h") >= 1 &&
                player.hp > 1)
            ) {
              return 0
            }
            if (ui.selected.buttons.length == 0) {
              return 10 - get.value(card)
            }
            return 0
          } else {
            if (_status.event.damage) {
              return 0
            }
            return -(get.sgnAttitude(player, target) || 1) * get.value(card)
          }
        })
        .set(
          "damage",
          get.damageEffect(target, player, player) > 10 &&
            player.countCards("he", (card) => {
              return lib.filter.canBeDiscarded(card, player, player) && get.value(card) < 5
            }) >= 3,
        )
      ;("step 1")
      if (result.bool) {
        var links = result.links
        var list1 = [],
          list2 = []
        event.players = [player, target]
        for (var card of links) {
          if (get.owner(card) == player) {
            list1.push(card)
          } else {
            list2.push(card)
          }
        }
        if (list1.length && list2.length) {
          game
            .loseAsync({
              lose_list: [
                [player, list1],
                [target, list2],
              ],
              discarder: player,
            })
            .setContent("discardMultiple")
          event.finish()
        } else if (list2.length) {
          target.discard(list2)
        } else {
          player.discard(list1)
        }
        if (list2.length >= 3) {
          event.players.reverse()
        }
      } else {
        event.finish()
      }
      ;("step 2")
      event.players[0].line(event.players[1])
      event.players[1].damage(event.players[0])
    },
    ai: {
      expose: 0.2,
      order: 4,
      result: {
        target(player, target) {
          return (
            (get.effect(target, { name: "guohe_copy2" }, player, target) / 2) *
              (target.countDiscardableCards(player, "he") >= 2 ? 1.25 : 1) +
            get.damageEffect(target, player, target) / 3
          )
        },
      },
    },
  },
  // 辟田
  pitian: {
    audio: 2,
    trigger: {
      player: ["loseAfter", "damageEnd"],
      global: "loseAsyncAfter",
    },
    forced: true,
    locked: false,
    group: "pitian_draw",
    filter(event, player) {
      if (event.name == "damage") {
        return true
      }
      return event.type == "discard" && event.getl(player).cards2.length > 0
    },
    content() {
      player.addMark("pitian_handcard", 1, false)
      player.addSkill("pitian_handcard")
      game.log(player, "的手牌上限", "#y+1")
    },
    subSkill: {
      draw: {
        audio: "pitian",
        trigger: { player: "phaseJieshuBegin" },
        filter(event, player) {
          return player.countCards("h") < player.getHandcardLimit()
        },
        prompt2(event, player) {
          return (
            "摸" +
            get.cnNumber(Math.min(5, player.getHandcardLimit() - player.countCards("h"))) +
            "张牌，重置因〖辟田〗增加的手牌上限"
          )
        },
        check(event, player) {
          return player.getHandcardLimit() - player.countCards("h") > Math.min(2, player.hp - 1)
        },
        content() {
          "step 0"
          var num = Math.min(5, player.getHandcardLimit() - player.countCards("h"))
          if (num > 0) {
            player.draw(num)
          }
          ;("step 1")
          player.removeMark("pitian_handcard", player.countMark("pitian_handcard"), false)
          game.log(player, "重置了", "#g【辟田】", "增加的手牌上限")
        },
      },
      handcard: {
        markimage: "image/card/handcard.png",
        intro: {
          content(storage, player) {
            return "手牌上限+" + storage
          },
        },
        charlotte: true,
        mod: {
          maxHandcard(player, num) {
            return num + player.countMark("pitian_handcard")
          },
        },
      },
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.tag(card, "discard")) {
            return 0.9
          }
          if (get.tag(card, "damage")) {
            return 0.95
          }
        },
      },
    },
  },
  // 赵俨
  // 抚宁
  funing: {
    audio: 2,
    trigger: { player: "useCard" },
    prompt2(event, player) {
      return (
        "摸两张牌，然后弃置" +
        get.cnNumber(
          1 +
            player.getHistory("useSkill", function (evt) {
              return evt.skill == "funing"
            }).length,
        ) +
        "张牌"
      )
    },
    check(event, player) {
      return (
        player.getHistory("useSkill", function (evt) {
          return evt.skill == "funing"
        }).length < 2
      )
    },
    content() {
      player.draw(2)
      player.chooseToDiscard(
        "he",
        true,
        +player.getHistory("useSkill", function (evt) {
          return evt.skill == "funing"
        }).length,
      )
    },
  },
  // 秉纪
  bingji: {
    mod: {
      cardUsable(card, player, num) {
        if (card.storage?.bingji) {
          return Infinity
        }
      },
      cardEnabled(card, player) {
        if (card.storage?.bingji) {
          return true
        }
      },
    },
    locked: false,
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      var hs = player.getCards("h"),
        suits = player.getStorage("bingji_used")
      if (!hs.length) {
        return false
      }
      var suit = get.suit(hs[0], player)
      if (suit == "none" || suits.includes(suit)) {
        return false
      }
      for (var i = 1; i < hs.length; i++) {
        if (get.suit(hs[i], player) != suit) {
          return false
        }
      }
      return true
    },
    ai: {
      order: 10,
      result: { player: 1 },
    },
    chooseButton: {
      dialog(event, player) {
        return ui.create.dialog("秉纪", [["sha", "tao"], "vcard"], "hidden")
      },
      filter(button, player) {
        return lib.filter.cardEnabled(
          {
            name: button.link[2],
            isCard: true,
            storage: { bingji: true },
          },
          player,
          "forceEnable",
        )
      },
      check(button) {
        var card = {
            name: button.link[2],
            isCard: true,
            storage: { bingji: true },
          },
          player = _status.event.player
        return Math.max.apply(
          Math,
          game
            .filterPlayer(function (target) {
              if (player == target) {
                return false
              }
              return (
                lib.filter.targetEnabled2(card, player, target) &&
                lib.filter.targetInRange(card, player, target)
              )
            })
            .map(function (target) {
              return get.effect(target, card, player, player)
            }),
        )
      },
      backup(links, player) {
        return {
          viewAs: {
            name: links[0][2],
            isCard: true,
            storage: { bingji: true },
          },
          filterCard: () => false,
          selectCard: -1,
          filterTarget(card, player, target) {
            if (!card) {
              card = get.card()
            }
            if (player == target) {
              return false
            }
            return (
              lib.filter.targetEnabled2(card, player, target) &&
              lib.filter.targetInRange(card, player, target)
            )
          },
          selectTarget: 1,
          ignoreMod: true,
          filterOk: () => true,
          log: false,
          precontent() {
            player.logSkill("bingji")
            var hs = player.getCards("h")
            event.getParent().addCount = false
            player.showCards(hs, get.translation(player) + "发动了【秉纪】")
            player.markAuto("bingji_used", [get.suit(hs[0], player)])
            player.addTempSkill("bingji_used")
          },
        }
      },
      prompt(links, player) {
        return "请选择【" + get.translation(links[0][2]) + "】的目标"
      },
    },
    subSkill: {
      used: {
        charlotte: true,
        onremove: true,
      },
    },
  },
  // 文钦
  // 犷骜
  guangao: {
    audio: 2,
    trigger: {
      global: "useCard2",
    },
    filter(event, player) {
      var card = event.card
      if (card.name != "sha") {
        return false
      }
      if (event.player == player) {
        return game.hasPlayer((current) => {
          return current.isIn() && !event.targets.includes(current) && player.canUse(card, current)
        })
      }
      return (
        event.player.isIn() && !event.targets.includes(player) && event.player.canUse(card, player)
      )
    },
    direct: true,
    content() {
      "step 0"
      if (trigger.player == player) {
        player
          .chooseTarget(
            get.prompt("guangao"),
            "为" +
              get.translation(trigger.card) +
              "额外指定一个目标。然后若你手牌数为偶数，你摸一张牌并令此牌对任意目标无效。",
            (card, player, target) => {
              return (
                !_status.event.sourcex.includes(target) && player.canUse(_status.event.card, target)
              )
            },
          )
          .set("sourcex", trigger.targets)
          .set("ai", function (target) {
            var player = _status.event.player
            if (player.countCards("h") % 2 == 0) {
              return true
            }
            var eff = get.effect(target, _status.event.card, player, player)
            if (
              player.hasSkill("xieju") &&
              player.isPhaseUsing() &&
              !player.getStat().skill.xieju &&
              get.attitude(player, target) > 0 &&
              !game.hasGlobalHistory("useCard", (evt) => {
                return evt.targets && evt.targets.includes(target)
              })
            ) {
              return 6 + eff
            }
            return eff
          })
          .set("card", trigger.card)
      } else {
        trigger.player
          .chooseBool(
            "是否发动" + get.translation(player) + "的【犷骜】？",
            "令其成为" +
              get.translation(trigger.card) +
              "的额外目标。然后若其手牌数为偶数，其摸一张牌并令此牌对任意目标无效。",
          )
          .set("ai", () => {
            return _status.event.bool
          })
          .set(
            "bool",
            (function () {
              var att = get.attitude(trigger.player, player)
              if (player.countCards("h") % 2 == 0) {
                if (att > 0) {
                  return true
                }
                return false
              }
              if (get.effect(player, trigger.card, trigger.player, trigger.player) > 0) {
                return true
              }
              return false
            })(),
          )
      }
      ;("step 1")
      if (result.bool) {
        var target = result.targets && result.targets[0]
        if (!target) {
          target = player
          trigger.player.logSkill("guangao", player)
        } else {
          player.logSkill("guangao", target)
        }
        trigger.targets.add(target)
        game.delayex()
      } else {
        event.finish()
      }
      ;("step 2")
      if (player.countCards("h") % 2 == 0) {
        player.draw()
        player
          .chooseTarget("犷骜：令此杀对其任意个目标无效", [1, Infinity], (card, player, target) => {
            return _status.event.targetsx.includes(target)
          })
          .set("ai", (target) => {
            const evt = _status.event.getTrigger(),
              player = _status.event.player
            return -get.effect(target, evt.card, evt.player, player)
          })
          .set("targetsx", trigger.targets)
      } else {
        event.finish()
      }
      ;("step 3")
      if (result.bool) {
        player.line(result.targets)
        trigger.excluded.addArray(result.targets)
      }
    },
  },
  // 彗企
  huiqi: {
    audio: 2,
    trigger: {
      global: "phaseEnd",
    },
    juexingji: true,
    forced: true,
    skillAnimation: true,
    animationColor: "thunder",
    derivation: "xieju",
    filter(event, player) {
      const targets = []
      game.getGlobalHistory("useCard", (evt) => {
        if (evt.targets?.length) {
          targets.addArray(evt.targets)
        }
      })
      return targets.length == 3 && targets.includes(player)
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.addSkills("xieju")
      player.insertPhase()
    },
  },
  // 偕举
  xieju: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return event.xieju?.length
    },
    onChooseToUse(event) {
      if (!event.xieju && !game.online) {
        const targets = []
        game.getGlobalHistory("useCard", (evt) => {
          if (evt.targets?.length) {
            targets.addArray(evt.targets)
          }
        })
        event.set("xieju", targets)
      }
    },
    filterTarget(card, player, target) {
      return get.event().xieju.includes(target) && target.hasUseTarget({ name: "sha" }, true, false)
    },
    selectTarget: [1, Infinity],
    async content(event, trigger, player) {
      await event.target.chooseUseTarget({ name: "sha" }, "偕举：视为使用一张【杀】", true, false)
    },
    ai: {
      order: 1,
      result: {
        target(player, target) {
          var val = target.getUseValue({ name: "sha" }, true)
          return Math.sign(val)
        },
      },
    },
  },
  // 界钟会
  // 权计
  quanji: {
    audio: 2,
    trigger: { player: "damageEnd" },
    frequent: true,
    locked: false,
    filter(event) {
      return event.num > 0
    },
    getIndex: (event) => event.num,
    async content(event, trigger, player) {
      await player.draw()
      const hs = player.getCards("h")
      if (!hs.length) {
        return
      }
      const result =
        hs.length == 1
          ? { bool: true, cards: hs }
          : await player.chooseCard("h", true, "选择一张牌作为“权”").forResult()
      if (result?.bool && result?.cards?.length) {
        const next = player.addToExpansion(result.cards, player, "give")
        next.gaintag.add(event.name)
        await next
      }
    },
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    onremove(player, skill) {
      const cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    mod: {
      maxHandcard(player, num) {
        return num + player.getExpansions("quanji").length
      },
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      notemp: true,
      threaten: 0.8,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage") && (player.hasSkill("paiyi") || player.hasSkill("zili"))) {
            if (player.hasSkillTag("jueqing", false, target)) {
              return [1, -2]
            }
            if (!target.hasFriend()) {
              return
            }
            if (target.hp >= 4) {
              return [0.5, get.tag(card, "damage") * 2]
            }
            if (!target.hasSkill("paiyi") && target.hp > 1) {
              return [0.5, get.tag(card, "damage") * 1.5]
            }
            if (target.hp == 3) {
              return [0.5, get.tag(card, "damage") * 1.5]
            }
            if (target.hp == 2) {
              return [1, get.tag(card, "damage") * 0.5]
            }
          }
        },
      },
    },
  },
  jx_quanji: {
    audio: 2,
    trigger: { player: ["damageEnd", "phaseUseEnd"] },
    frequent: true,
    locked: false,
    filter(event, player) {
      if (event.name == "phaseUse") {
        return player.countCards("h") > player.hp
      }
      return event.num > 0
    },
    getIndex(event, player) {
      return event.num || 1
    },
    async content(event, trigger, player) {
      await player.draw()
      if (!player.countCards("h")) {
        return
      }
      const result = await player.chooseCard("将一张手牌置于武将牌上作为“权”", true).forResult()
      if (result?.bool && result?.cards?.length) {
        const next = player.addToExpansion(result.cards, player, "give")
        next.gaintag.add("quanji")
        await next
      }
    },
    mod: {
      maxHandcard(player, num) {
        return num + player.getExpansions("quanji").length
      },
      aiOrder(player, card, num) {
        if (num <= 0 || typeof card !== "object" || !player.isPhaseUsing()) {
          return num
        }
        if (player.countCards("h") > player.hp + 1) {
          return num
        }
        if (!player.hasSkill("zili") || player.hasSkill("paiyi")) {
          return num
        }
        if (player.getExpansions("quanji").length < 3) {
          if (get.type(card) == "equip" && !["equip2", "equip3"].includes(get.subtype(card))) {
            return 0
          }
          let eff = 6 + player.hp
          if (!get.tag(card, "gain") && !get.tag(card, "draw")) {
            eff += 3
          }
          if (player.getUseValue(card) < eff) {
            return 0
          }
        }
      },
    },
    onremove(player, skill) {
      const cards = player.getExpansions("quanji")
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      notemp: true,
      threaten: 0.8,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage")) {
            if (player.hasSkillTag("jueqing", false, target)) {
              return [1, -2]
            }
            if (!target.hasFriend()) {
              return
            }
            if (target.hp >= 4) {
              return [0.5, get.tag(card, "damage") * 2]
            }
            if (!target.hasSkill("paiyi") && target.hp > 1) {
              return [0.5, get.tag(card, "damage") * 1.5]
            }
            if (target.hp == 3) {
              return [0.5, get.tag(card, "damage") * 1.5]
            }
            if (target.hp == 2) {
              return [1, get.tag(card, "damage") * 0.5]
            }
          }
        },
      },
    },
  },
  // 自立
  zili: {
    skillAnimation: true,
    animationColor: "thunder",
    audio: 2,
    audioname: ["jx_zhonghui"],
    juexingji: true,
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    derivation: "paiyi",
    filter(event, player) {
      return player.countExpansions("quanji") >= 3
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.loseMaxHp()
      await player.chooseDrawRecover(2, true, (event, player) => {
        if (player.hp == 1 && player.isDamaged()) {
          return "recover_hp"
        }
        return "draw_card"
      })
      await player.addSkills("paiyi")
    },
    ai: { combo: "quanji" },
  },
  // 排异
  paiyi: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    audioname: ["jx_zhonghui"],
    filter(event, player) {
      return player.getExpansions("quanji").length > 0
    },
    chooseButton: {
      dialog(event, player) {
        return ui.create.dialog("排异", player.getExpansions("quanji"), "hidden")
      },
      backup(links, player) {
        return {
          audio: "paiyi",
          audioname: ["jx_zhonghui"],
          filterTarget: true,
          filterCard() {
            return false
          },
          selectCard: -1,
          card: links[0],
          delay: false,
          content: lib.skill.paiyi.contentx,
          ai: {
            order: 10,
            result: {
              target(player, target) {
                if (player != target) {
                  return 0
                }
                if (
                  player.hasSkill("quanji") ||
                  player.countCards("h") + 2 <= player.hp + player.getExpansions("quanji").length
                ) {
                  return 1
                }
                return 0
              },
            },
          },
        }
      },
      prompt() {
        return "请选择〖排异〗的目标"
      },
    },
    contentx() {
      "step 0"
      var card = lib.skill.paiyi_backup.card
      player.loseToDiscardpile(card)
      ;("step 1")
      target.draw(2)
      ;("step 2")
      if (target.countCards("h") > player.countCards("h")) {
        target.damage()
      }
    },
    ai: {
      order: 1,
      combo: "quanji",
      result: {
        player: 1,
      },
    },
  },
  // 羊徽瑜
  // 弘仪
  hongyi: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    //filter:function(event,player){
    //	return player.countCards('he')>=Math.min(2,game.dead.length);
    //},
    //selectCard:function(){
    //	return Math.min(2,game.dead.length);
    //},
    //filterCard:true,
    filterTarget: lib.filter.notMe,
    check(card) {
      var num = Math.min(2, game.dead.length)
      if (!num) {
        return 1
      }
      if (num == 1) {
        return 7 - get.value(card)
      }
      return 5 - get.value(card)
    },
    position: "he",
    content() {
      const skill = event.name + "_effect"
      player.addTempSkill(skill, { player: "phaseBeginStart" })
      player.markAuto(skill, target)
    },
    ai: {
      order: 1,
      result: {
        target(player, target) {
          if (target.hasJudge("lebu")) {
            return -0.5
          }
          return -1 - target.countCards("h")
        },
      },
    },
    subSkill: {
      effect: {
        audio: "hongyi",
        trigger: { global: "damageBegin1" },
        charlotte: true,
        forced: true,
        logTarget: "source",
        filter(event, player) {
          return player.getStorage("hongyi_effect").includes(event.source)
        },
        async content(event, trigger, player) {
          const result = await trigger.source.judge().forResult()
          if (result.color == "black") {
            trigger.num--
          } else {
            await trigger.player.draw()
          }
        },
        onremove: true,
        intro: {
          content: "已选中$为技能目标",
        },
      },
    },
  },
  // 劝封
  quanfeng: {
    audio: 2,
    enable: "chooseToUse",
    limited: true,
    skillAnimation: true,
    animationColor: "thunder",
    prompt2:
      "（限定技）失去技能【劝封】，并获得该角色武将牌上的所有技能，然后加1点体力上限并回复1点体力",
    logTarget: "player",
    trigger: { global: "die" },
    check: (event, player) => {
      if (
        event.player
          .getStockSkills("仲村由理", "天下第一")
          .filter((skill) => {
            let info = get.info(skill)
            return info && !info.hiddenSkill && !info.zhuSkill && !info.charlotte
          })
          .some((i) => {
            let info = get.info(i)
            if (info && info.ai) {
              return info.ai.neg || info.ai.halfneg
            }
          })
      ) {
        return false
      }
      return true
    },
    filter(event, player) {
      if (event.name == "die") {
        return (
          player.hasSkill("hongyi") &&
          event.player.getStockSkills("仲村由理", "天下第一").filter(function (skill) {
            var info = get.info(skill)
            return info && !info.hiddenSkill && !info.zhuSkill && !info.charlotte
          }).length > 0
        )
      }
      return event.type == "dying" && player == event.dying
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      if (trigger?.name == "die") {
        await player.removeSkills("hongyi")
        const skills = trigger.player
          .getStockSkills("仲村由理", "天下第一")
          .filter(function (skill) {
            const info = get.info(skill)
            return info && !info.hiddenSkill && !info.zhuSkill && !info.charlotte
          })
        if (skills.length) {
          await player.addSkills(skills)
          game.broadcastAll(function (list) {
            game.expandSkills(list)
            for (const i of list) {
              const info = lib.skill[i]
              if (!info) {
                continue
              }
              if (!info.audioname2) {
                info.audioname2 = {}
              }
              info.audioname2.yanghuiyu = "quanfeng"
            }
          }, skills)
        }
        await player.gainMaxHp()
        await player.recover()
      } else {
        await player.gainMaxHp(2)
        await player.recover(4)
      }
    },
    ai: {
      save: true,
      skillTagFilter(player, tag, arg) {
        return player == arg
      },
      order: 10,
      result: {
        player: 1,
      },
    },
  },
  // 戏志才
  // 先辅
  xianfu: {
    trigger: {
      global: "phaseBefore",
      player: "enterGame",
    },
    locked: true,
    filter(event, player) {
      return (
        game.hasPlayer((current) => current != player) &&
        (event.name != "phase" || game.phaseNumber == 0)
      )
    },
    audio: 6,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          "请选择【先辅】的目标",
          lib.translate.xianfu_info,
          true,
          function (card, player, target) {
            return (
              target != player &&
              (!player.storage.xianfu2 || !player.storage.xianfu2.includes(target))
            )
          },
        )
        .set("ai", function (target) {
          let att = get.attitude(_status.event.player, target)
          if (att > 0) {
            return att + 1
          }
          if (att == 0) {
            return Math.random()
          }
          return att
        })
        .set("animate", false)
        .forResult()
    },
    logAudio: () => 2,
    logLine: false,
    async content(event, trigger, player) {
      let [target] = event.targets
      player.storage.xianfu2 ??= []
      player.storage.xianfu2.push(target)
      player.addSkill("xianfu2")
      const func = (player, target) => {
        target.storage.xianfu_mark ??= []
        target.storage.xianfu_mark.add(player)
        target.storage.xianfu_mark.sortBySeat()
        target.markSkill("xianfu_mark", null, null, true)
      }
      if (event.isMine()) {
        func(player, target)
      } else if (player.isOnline2()) {
        player.send(func, player, target)
      }
    },
  },
  xianfu_mark: {
    marktext: "辅",
    intro: {
      name: "先辅",
      content: "当你受到伤害后，$受到等量的伤害，当你回复体力后，$回复等量的体力",
    },
  },
  xianfu2: {
    audio: "xianfu",
    charlotte: true,
    trigger: { global: ["damageEnd", "recoverEnd"] },
    forced: true,
    sourceSkill: "xianfu",
    filter(event, player) {
      if (
        event.player.isDead() ||
        !player.storage.xianfu2 ||
        !player.storage.xianfu2.includes(event.player) ||
        event.num <= 0
      ) {
        return false
      }
      if (event.name == "damage") {
        return true
      }
      return player.isDamaged()
    },
    logAudio(event, player) {
      if (event.name == "damage") {
        return ["xianfu5.mp3", "xianfu6.mp3"]
      }
      return ["xianfu3.mp3", "xianfu4.mp3"]
    },
    logTarget: "player",
    content() {
      "step 0"
      var target = trigger.player
      if (!target.storage.xianfu_mark) {
        target.storage.xianfu_mark = []
      }
      target.storage.xianfu_mark.add(player)
      target.storage.xianfu_mark.sortBySeat()
      target.markSkill("xianfu_mark")
      game.delayx()
      ;("step 1")
      player[trigger.name](trigger.num, "nosource")
    },
    onremove(player) {
      if (!player.storage.xianfu2) {
        return
      }
      game.countPlayer(function (current) {
        if (player.storage.xianfu2.includes(current) && current.storage.xianfu_mark) {
          current.storage.xianfu_mark.remove(player)
          if (!current.storage.xianfu_mark.length) {
            current.unmarkSkill("xianfu_mark")
          } else {
            current.markSkill("xianfu_mark")
          }
        }
      })
      delete player.storage.xianfu2
    },
    group: "xianfu3",
  },
  xianfu3: {
    trigger: { global: "dieBegin" },
    silent: true,
    sourceSkill: "xianfu",
    filter(event, player) {
      return (
        event.player == player ||
        (player.storage.xianfu2 && player.storage.xianfu2.includes(event.player))
      )
    },
    content() {
      if (player == trigger.player) {
        lib.skill.xianfu2.onremove(player)
      } else {
        player.storage.xianfu2.remove(event.player)
      }
    },
  },
  // 筹策
  chouce: {
    audio: 2,
    trigger: { player: "damageEnd" },
    getIndex: (event) => event.num,
    filter(event) {
      return event.num > 0
    },
    async content(event, trigger, player) {
      const result = await player.judge().forResult()
      const color = result?.color
      let result2
      switch (color) {
        case "black":
          if (game.hasPlayer((current) => current.countDiscardableCards(player, "hej"))) {
            result2 = await player
              .chooseTarget(
                "弃置一名角色区域内的一张牌",
                (card, player, target) => {
                  return target.countDiscardableCards(player, "hej")
                },
                true,
              )
              .set("ai", (target) => {
                const player = get.player()
                let att = get.attitude(player, target)
                if (att < 0) {
                  att = -Math.sqrt(-att)
                } else {
                  att = Math.sqrt(att)
                }
                return att * lib.card.guohe.ai.result.target(player, target)
              })
              .forResult()
          }
          break

        case "red": {
          const next = player.chooseTarget("令一名角色摸一张牌")
          if (player.storage.xianfu2?.length) {
            next.set(
              "prompt2",
              "（若目标为" + get.translation(player.storage.xianfu2) + "则改为摸两张牌）",
            )
          }
          next.set("ai", (target) => {
            const player = get.player()
            let att = get.attitude(player, target) / Math.sqrt(1 + target.countCards("h"))
            if (target.hasSkillTag("nogain")) {
              att /= 10
            }
            if (player.storage.xianfu2?.includes(target)) {
              return att * 2
            }
            return att
          })
          result2 = await next.forResult()
          break
        }

        default:
          break
      }
      if (result2?.bool && result2?.targets?.length) {
        const target = result2.targets[0]
        player.line(target, "green")
        if (color == "black") {
          if (target.countDiscardableCards(player, "hej")) {
            await player.discardPlayerCard(target, "hej", true)
          }
        } else {
          if (player.storage.xianfu2?.includes(target)) {
            target.storage.xianfu_mark ??= []
            target.storage.xianfu_mark.add(player)
            target.storage.xianfu_mark.sortBySeat()
            target.markSkill("xianfu_mark")
            await target.draw(2)
          } else {
            await target.draw()
          }
        }
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
            if (target.hp >= 4) {
              return [1, get.tag(card, "damage") * 1.5]
            }
            if (target.hp == 3) {
              return [1, get.tag(card, "damage") * 1]
            }
            if (target.hp == 2) {
              return [1, get.tag(card, "damage") * 0.5]
            }
          }
        },
      },
    },
  },
  // 界张春华
  // 绝情
  jueqing: {
    audio: 2,
    audioname: ["jx_zhangchunhua"],
    trigger: { source: "damageBefore" },
    forced: true,
    content() {
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
    audioname: ["jx_zhangchunhua"],
    trigger: {
      player: ["loseAfter", "changeHp", "gainMaxHpAfter", "loseMaxHpAfter"],
      global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
    },
    frequent: true,
    filter(event, player) {
      if (event.getl && !event.getl(player)) {
        return false
      }
      return player.countCards("h") < player.getDamagedHp()
    },
    content() {
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
          return result.control == "none2" ? "none" : result.control
        },
        cards_player = player.getDiscardableCards(
          player,
          "h",
          (card) => get.color(card) == getColor(map.get(player)),
        ),
        cards_target = target.getDiscardableCards(
          target,
          "h",
          (card) => get.color(card) == getColor(map.get(target)),
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
      if (cards_player.length != cards_target.length) {
        const user = cards_player.length > cards_target.length ? player : target
        const aim = user == player ? target : player
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
          let num =
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
      let colors = ["red", "black"]
      if (player.getDiscardableCards(player, "h").some((card) => get.color(card) == "none")) {
        colors.push("none2")
      }
      const str = get.translation(targets[0] == player ? targets[1] : targets[0])
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
          let controls = get.event().controls.slice()
          return controls.sort((a, b) => {
            return (
              player
                .getDiscardableCards(player, "h")
                .filter((card) => {
                  return get.color(card) == (a == "none2" ? "none" : a)
                })
                .reduce((sum, card) => sum + get.value(card, player), 0) -
              player
                .getDiscardableCards(player, "h")
                .filter((card) => {
                  return get.color(card) == (b == "none2" ? "none" : b)
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
  qianchong: {
    audio: 1,
    init(player, skill) {
      const es = player.getCards("e")
      if (es.length) {
        if (es.every((card) => get.color(card) == "red")) {
          player.addAdditionalSkill(skill, "mingzhe")
        } else if (es.every((card) => get.color(card) == "black")) {
          player.addAdditionalSkill(skill, "jx_weimu")
        } else {
          player.removeAdditionalSkill(skill)
        }
      } else {
        player.removeAdditionalSkill(skill)
      }
    },
    onremove(player, skill) {
      player.removeAdditionalSkill(skill)
    },
    trigger: { player: "phaseUseBegin" },
    filter(event, player) {
      if (
        ["basic", "trick", "equip"].every((type) =>
          player.getStorage("qianchong_effect").includes(type),
        )
      ) {
        return false
      }
      const es = player.getCards("e")
      if (!es.length) {
        return true
      }
      const col = get.color(es[0])
      for (let i = 0; i < es.length; i++) {
        if (get.color(es[i]) != col) {
          return true
        }
      }
      return false
    },
    locked: true,
    async cost(event, trigger, player) {
      const list = ["basic", "trick", "equip", "cancel2"]
      list.removeArray(player.getStorage("qianchong_effect"))
      const result = await player
        .chooseControl(list)
        .set("ai", () => {
          const player = get.player()
          const choices = get.event().controls.slice().remove("cancel2")
          return choices.includes("basic")
            ? "basic"
            : choices.includes("trick")
              ? "trick"
              : choices.randomGet()
        })
        .set("prompt", get.prompt(event.skill))
        .set(
          "prompt2",
          "你可以选择一种类别的牌，然后你本回合内使用该类别的牌时没有次数和距离限制。",
        )
        .forResult()
      event.result = {
        bool: result?.control != "cancel2",
        cost_data: result?.control,
      }
    },
    async content(event, trigger, player) {
      const { cost_data: type } = event
      player.addTempSkill(event.name + "_effect")
      player.markAuto(event.name + "_effect", [type])
      const str = get.translation(type) + "牌"
      game.log(player, "声明了", "#y" + str)
      player.popup(str, "thunder")
    },
    derivation: ["jx_weimu", "mingzhe"],
    group: "qianchong_change",
    subSkill: {
      effect: {
        charlotte: true,
        onremove: true,
        intro: { content: "本回合内使用$牌没有次数和距离限制" },
        mod: {
          cardUsable(card, player) {
            const type = get.type2(card)
            if (player.getStorage("qianchong_effect").includes(type)) {
              return Infinity
            }
          },
          targetInRange(card, player) {
            const type = get.type2(card)
            if (player.getStorage("qianchong_effect").includes(type)) {
              return true
            }
          },
        },
      },
      change: {
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
        filter(event, player) {
          if (event.name == "equip" && event.player == player) {
            return true
          }
          return event.getl?.(player)?.es?.length
        },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          const skill = "qianchong"
          get.info(skill).init(player, skill)
        },
      },
    },
  },
  mingzhe: {
    audio: 2,
    audioname: ["wangyuanji"],
    trigger: {
      player: "loseAfter",
      global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
    },
    forced: true,
    filter(event, player) {
      if (player.isPhaseUsing()) {
        return false
      }
      var evt = event.getl(player)
      for (var i of evt.cards2) {
        if (get.color(i, player) == "red") {
          return true
        }
      }
      return false
    },
    content() {
      if (!trigger.visible) {
        var cards = trigger.getl(player).hs.filter(function (i) {
          return get.color(i, player) == "red"
        })
        if (cards.length > 0) {
          player.showCards(cards, get.translation(player) + "发动了【明哲】")
        }
      }
      player.draw()
    },
  },
  // 尚俭
  shangjian: {
    audio: 2,
    getNum(player) {
      let num = 0
      player.getHistory("lose", (evt) => {
        const evt2 = evt.relatedEvent || evt.getParent()
        if (
          evt2.name == "useCard" &&
          evt2.player == player &&
          get.type(evt2.card, null, false) == "equip"
        ) {
          return
        }
        if (evt.cards2?.length) {
          num += evt.cards2.length
        }
      })
      return num
    },
    trigger: { global: "phaseJieshuBegin" },
    filter(event, player) {
      const num = get.info("shangjian").getNum(player)
      return num > 0 && num <= player.hp
    },
    forced: true,
    async content(event, trigger, player) {
      const num = get.info(event.name).getNum(player)
      if (num > 0) {
        await player.draw(num)
      }
    },
  },
  // 曹婴
  // 凌人
  lingren: {
    audio: 2,
    trigger: { player: "useCardToPlayered" },
    filter(event, player) {
      if (event.getParent().triggeredTargets3.length > 1) {
        return false
      }
      if (!["basic", "trick"].includes(get.type(event.card))) {
        return false
      }
      return get.tag(event.card, "damage")
    },
    usable: 1,
    derivation: ["jx_jianxiong", "jx_xingshang"],
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt(event.name.slice(0, -5)),
          "选择一名目标角色并猜测其手牌构成",
          (card, player, target) => {
            return _status.event.targets.includes(target)
          },
        )
        .set("ai", (target) => {
          return 2 - get.attitude(get.player(), target)
        })
        .set("targets", trigger.targets)
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      const list = ["basic", "trick", "equip"].map((type) => ["", "", "caoying_" + type])
      const result = await player
        .chooseButton(["凌人：猜测其有哪些类别的手牌", [list, "vcard"]], [0, 3], true)
        .set("ai", (button) => {
          return get.event().choice.includes(button.link[2].slice(8))
        })
        .set(
          "choice",
          (() => {
            if (!target.countCards("h")) {
              return []
            }
            let choice = [],
              known = target.getKnownCards(player),
              unknown = target.getCards("h", (i) => !known.includes(i))
            for (let i of known) {
              choice.add(get.type2(i, target))
            }
            if (!unknown.length || choice.length > 2) {
              return choice
            }
            let rand = 0.05
            if (!choice.includes("basic")) {
              if (unknown.some((i) => get.type(i, null, target) === "basic")) {
                rand = 0.95
              }
              if (Math.random() < rand) {
                choice.push("basic")
              }
            }
            if (!choice.includes("trick")) {
              if (unknown.some((i) => get.type(i, "trick", target) === "trick")) {
                rand = 0.9
              } else {
                rand = 0.1
              }
              if (Math.random() < rand) {
                choice.push("trick")
              }
            }
            if (!choice.includes("equip")) {
              if (unknown.some((i) => get.type(i, null, target) === "equip")) {
                rand = 0.75
              } else {
                rand = 0.25
              }
              if (Math.random() < rand) {
                choice.push("equip")
              }
            }
            return choice
          })(),
        )
        .forResult()
      if (!result?.bool) {
        return
      }
      const choices = result.links.map((i) => i[2].slice(8))
      if (!event.isMine() && !event.isOnline()) {
        await game.delayx()
      }
      let num = 0
      ;["basic", "trick", "equip"].forEach((type) => {
        if (
          choices.includes(type) == target.hasCard((card) => get.type2(card, target) === type, "h")
        ) {
          num++
        }
      })
      player.popup("猜对" + get.cnNumber(num) + "项")
      game.log(player, "猜对了" + get.cnNumber(num) + "项")
      if (num > 0) {
        const map = trigger.customArgs
        const id = target.playerid
        map[id] ??= {}
        if (typeof map[id].extraDamage != "number") {
          map[id].extraDamage = 0
        }
        map[id].extraDamage++
      }
      if (num > 1) {
        await player.draw(2)
      }
      if (num > 2) {
        await player.addTempSkills(get.info(event.name).derivation, { player: "phaseBegin" })
      }
    },
    ai: { threaten: 2.4 },
  },
  // 伏间
  fujian: {
    audio: 2,
    trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
    filter(event, player) {
      return !game.hasPlayer((target) => target != player && target.countCards("h") == 0)
    },
    forced: true,
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          "伏间：请选择一名手牌数最少的其他角色",
          (card, player, target) => {
            return target != player && target.isMinHandcard(null, (current) => current != player)
          },
          true,
        )
        .set("ai", (target) => {
          return -get.attitude(player, target)
        })
        .forResult()
      if (result.bool) {
        const target = result.targets[0]
        player.line(target)
        game.log(player, "观看了", target, "的手牌")
        await player.viewHandcards(target)
      }
    },
  },
  // 曹纯
  // 缮甲
  shanjia: {
    init(player, skill) {
      player.addSkill("shanjia_count")
    },
    onremove(player, skill) {
      player.removeSkill("shanjia_count")
    },
    locked: false,
    mod: {
      aiValue(player, card, num) {
        if (
          (player.storage.shanjia || 0) < 3 &&
          get.type(card) == "equip" &&
          !get.cardtag(card, "gifts")
        ) {
          return num / player.hp
        }
      },
    },
    audio: 2,
    trigger: {
      player: "phaseUseBegin",
    },
    intro: {
      content: "本局游戏内已失去过#张装备牌",
    },
    frequent: true,
    sync(player) {
      var history = player.actionHistory
      var num = 0
      for (var i = 0; i < history.length; i++) {
        for (var j = 0; j < history[i].lose.length; j++) {
          if (history[i].lose[j].getParent().name == "useCard") {
            continue
          }
          num += history[i].lose[j].cards2.filter(function (card) {
            return get.type(card) == "equip"
          }).length
        }
      }
      player.storage.shanjia = num
      if (num > 0) {
        player.markSkill("shanjia")
      }
    },
    async content(event, trigger, player) {
      await player.draw(3)
      lib.skill.shanjia.sync(player)
      const num = 3 - player.storage.shanjia
      let result
      if (num > 0) {
        result = await player.chooseToDiscard("he", true, num).set("ai", get.disvalue).forResult()
      }
      let bool1 = true,
        bool2 = true
      if (result?.cards?.length) {
        const cards = result.cards
        for (let i = 0; i < result.cards.length; i++) {
          var type = get.type(
            result.cards[i],
            "trick",
            result.cards[i].original == "h" ? player : false,
          )
          if (type == "basic") {
            bool1 = false
          }
          if (type == "trick") {
            bool2 = false
          }
        }
      }
      if (bool1) {
        player.addTempSkill("shanjia_sha", "phaseChange")
      }
      if (bool2) {
        player.addTempSkill("shanjia_nodis", "phaseChange")
      }
      if (bool1 && bool2) {
        await player.chooseUseTarget({ name: "sha" }, "是否视为使用一张【杀】？", false)
      }
    },
    ai: {
      threaten: 3,
      noe: true,
      reverseOrder: true,
      skillTagFilter(player) {
        if (player.storage.shanjia > 2) {
          return false
        }
      },
      effect: {
        target(card, player, target) {
          if (
            player.storage.shanjia < 3 &&
            get.type(card) == "equip" &&
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
          return event.cards2 && event.cards2.length > 0
        },
        content() {
          lib.skill.shanjia.sync(player)
        },
      },
      sha: {
        mark: true,
        charlotte: true,
        intro: { content: "使用【杀】的次数上限+1" },
        mod: {
          cardUsable(card, player, num) {
            if (card.name == "sha") {
              return num + 1
            }
          },
        },
      },
      nodis: {
        mark: true,
        charlotte: true,
        intro: { content: "使用牌无距离限制" },
        mod: {
          targetInRange: () => true,
        },
      },
    },
  },
  // 赵昂
  // 忠节
  zhongjie: {
    audio: 2,
    round: 1,
    trigger: { global: "dying" },
    logTarget: "player",
    filter(event, player) {
      return event.player.hp < 1 && event.reason && event.reason.name == "loseHp"
    },
    check(event, player) {
      return get.attitude(player, event.player) > 2
    },
    content() {
      trigger.player.recover()
      trigger.player.draw()
    },
    ai: {
      combo: "sushou",
    },
  },
  // 夙守
  sushou: {
    audio: 2,
    trigger: { global: "phaseUseBegin" },
    filter(event, player) {
      return player.hp > 0 && event.player.isMaxHandcard(true)
    },
    logTarget: "player",
    check(event, player) {
      var num = player.hp
      if (
        player.hasSkill("zhongjie") &&
        (player.storage.zhongjie_roundcount || 0) < game.roundNumber
      ) {
        num++
      }
      return num > 1
    },
    content() {
      "step 0"
      player.loseHp()
      event.target = trigger.player
      ;("step 1")
      var num = player.getDamagedHp()
      if (num > 0) {
        player.draw(num)
      }
      if (player == target) {
        event.finish()
      }
      ;("step 2")
      var ts = target.getCards("h")
      if (ts.length < 2) {
        event.finish()
      } else {
        var hs = player.getCards("h")
        ts = ts.randomGets(Math.floor(ts.length / 2))
        if (!hs.length) {
          player.viewCards(get.translation(target) + "的部分手牌", ts)
          event.finish()
          return
        }
        var next = player.chooseToMove(
          "夙守：交换至多" +
            get.cnNumber(Math.min(hs.length, ts.length, player.getDamagedHp())) +
            "张牌",
        )
        next.set("list", [
          [get.translation(target) + "的部分手牌", ts, "sushou_tag"],
          ["你的手牌", hs],
        ])
        next.set("filterMove", function (from, to, moved) {
          if (typeof to == "number") {
            return false
          }
          var player = _status.event.player
          var hs = player.getCards("h")
          var changed = hs.filter(function (card) {
            return !moved[1].includes(card)
          })
          var changed2 = moved[1].filter(function (card) {
            return !hs.includes(card)
          })
          if (changed.length < player.getDamagedHp()) {
            return true
          }
          var pos1 = moved[0].includes(from.link) ? 0 : 1,
            pos2 = moved[0].includes(to.link) ? 0 : 1
          if (pos1 == pos2) {
            return true
          }
          if (pos1 == 0) {
            if (changed.includes(from.link)) {
              return true
            }
            return changed2.includes(to.link)
          }
          if (changed2.includes(from.link)) {
            return true
          }
          return changed.includes(to.link)
        })
        next.set("max", Math.min(hs.length, ts.length, player.getDamagedHp()))
        next.set("processAI", function (list) {
          if (_status.event.max) {
            let gain = list[0][1]
                .sort((a, b) => {
                  return player.getUseValue(b, null, true) - player.getUseValue(a, null, true)
                })
                .slice(0, _status.event.max),
              give = list[1][1]
                .sort((a, b) => {
                  return get.value(a, player) - get.value(b, player)
                })
                .slice(0, _status.event.max)
            for (let i of gain) {
              if (get.value(i, player) < get.value(give[0], player)) {
                continue
              }
              let j = give.shift()
              list[0][1].remove(i)
              list[0][1].push(j)
              list[1][1].remove(j)
              list[1][1].push(i)
              if (!give.length) {
                break
              }
            }
          }
          return [list[0][1], list[1][1]]
        })
      }
      ;("step 3")
      var moved = result.moved
      var hs = player.getCards("h"),
        ts = target.getCards("h")
      var cards1 = [],
        cards2 = []
      for (var i of result.moved[0]) {
        if (!ts.includes(i)) {
          cards1.push(i)
        }
      }
      for (var i of result.moved[1]) {
        if (!hs.includes(i)) {
          cards2.push(i)
        }
      }
      if (cards1.length) {
        player.swapHandcards(target, cards1, cards2)
      }
    },
  },
  // 界满宠
  // 峻刑
  jx_junxing: {
    enable: "phaseUse",
    audio: 2,
    usable: 1,
    filterCard: lib.filter.cardDiscardable,
    selectCard: [1, Infinity],
    filter(event, player) {
      return player.countCards("h") > 0
    },
    check(card) {
      if (ui.selected.cards.length) {
        return -1
      }
      return 6 - get.value(card)
    },
    filterTarget(card, player, target) {
      return player != target
    },
    allowChooseAll: true,
    async content(event, trigger, player) {
      const { target, cards } = event
      // step 0
      const result = await target
        .chooseToDiscard(
          cards.length,
          "弃置" +
            get.cnNumber(cards.length) +
            "张牌并失去1点体力，或点取消将武将牌翻面并摸" +
            get.cnNumber(cards.length) +
            "张牌",
          "he",
        )
        .set("ai", function (card) {
          const player = get.event().player
          if (
            get.event().cardsx?.length > 3 ||
            player.hasSkillTag("noturn") ||
            player.isTurnedOver() ||
            ((get.name(card) == "tao" || get.name(card) == "jiu") &&
              lib.filter.cardSavable(card, player, player))
          ) {
            return -1
          }
          if (player.hp <= 1) {
            if (
              cards.length < player.getEnemies().length &&
              player.hasCard((cardx) => {
                return (
                  (get.name(cardx) == "tao" || get.name(cardx) == "jiu") &&
                  lib.filter.cardSavable(cardx, player, player)
                )
              }, "hs")
            ) {
              return 7 - get.value(card)
            }
            return -1
          }
          return 24 - 5 * cards.length - 2 * Math.min(4, player.hp) - get.value(card)
        })
        .set("cardsx", cards)
        .forResult()
      // step 1
      if (!result.bool) {
        await target.turnOver()
        await target.draw(cards.length)
      } else {
        await target.loseHp()
      }
    },
    ai: {
      order: 2,
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
  // 御策
  yuce: {
    audio: 2,
    audioname: ["jx_manchong"],
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return player.countCards("h") > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCard({
          prompt: get.prompt2(event.skill),
          ai(card) {
            if (get.type(card) == "basic") {
              return 1
            }
            return Math.abs(get.value(card)) + 1
          },
        })
        .forResult()
    },
    logTarget: "source",
    async content(event, trigger, player) {
      const {
        cards: [card],
        targets,
      } = event
      await player.showCards(card, get.translation(player) + "发动了【御策】")
      const type = get.type2(card)
      let result
      if (targets?.length && targets[0]?.isIn()) {
        result = await targets[0]
          .chooseToDiscard({
            prompt:
              "弃置一张不为" +
              get.translation(type) +
              "牌的牌或令" +
              get.translation(player) +
              "回复1点体力",
            filterCard(card) {
              return get.type(card, "trick") != _status.event.type
            },
            ai(card) {
              if (
                get.recoverEffect(
                  _status.event.getParent().player,
                  _status.event.player,
                  _status.event.player,
                ) < 0
              ) {
                return 7 - get.value(card)
              }
              return 0
            },
          })
          .set("type", type)
          .forResult()
      } else {
        result = { bool: false }
      }
      if (!result.bool) {
        await player.recover({ source: targets?.[0] })
      }
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage") && target.countCards("h")) {
            return 0.8
          }
        },
      },
    },
  },
  bizu: {
    audio: 2,
    enable: "phaseUse",
    filterTarget(card, player, target) {
      return target.countCards("h") == player.countCards("h")
    },
    filterCard: () => false,
    selectCard: [-1, -2],
    prompt: () => {
      const player = get.player()
      const targets = game.filterPlayer(
        (current) => current.countCards("h") == player.countCards("h"),
      )
      return "令" + get.translation(targets) + (targets.length > 1 ? "各" : "") + "摸一张牌"
    },
    selectTarget: -1,
    multitarget: true,
    multiline: true,
    async content(event, trigger, player) {
      await game.asyncDraw(event.targets.sortBySeat())
      if (
        game
          .getGlobalHistory(
            "everything",
            (evt) => evt.name == "bizu" && evt.player == player && evt != event,
          )
          .some(
            (evtx) =>
              evtx.targets.length == event.targets.length &&
              evtx.targets.every((i) => event.targets.includes(i)),
          )
      ) {
        player.tempBanSkill("bizu")
        await player.recover()
      }
    },
    ai: {
      order: 4,
      result: {
        player(player, target) {
          return game
            .filterPlayer((current) => current.countCards("h") == player.countCards("h"))
            .reduce((e, p) => e + get.effect(p, { name: "draw" }, player, player), 0)
        },
      },
    },
  },
  jwuxie: {
    audio: 2,
    trigger: { player: "phaseUseEnd" },
    filter(event, player) {
      return game.hasPlayer((current) => current != player && current.countCards("h"))
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(get.prompt2(event.skill), function (card, player, target) {
          return target != player && target.countCards("h")
        })
        .set("ai", (target) => {
          const player = get.player()
          return -get.attitude(player, target) * (target.countCards("h") - player.countCards("h"))
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      await player.swapHandcards(target)
      const cards1 = player.getCards("h", (card) => get.is.damageCard(card))
      if (cards1.length) {
        player.$throw(cards1.length, 1000)
        await player.lose(cards1, ui.cardPile)
      }
    },
  },
  tousui: {
    audio: 2,
    enable: "chooseToUse",
    viewAsFilter(player) {
      return player.countCards("he") > 0
    },
    viewAs: {
      name: "sha",
      /*suit: "none",
			number: null,*/
      cards: [],
      isCard: true,
    },
    filterCard: true,
    selectCard: [1, Infinity],
    position: "he",
    check(card) {
      const player = get.player()
      return (
        4.5 +
        (player.hasSkill("chuming") ? 1 : 0) -
        1.5 * ui.selected.cards.length -
        get.value(card)
      )
    },
    popname: true,
    ignoreMod: true,
    log: false,
    allowChooseAll: true,
    async precontent(event, trigger, player) {
      var evt = event.getParent()
      if (evt.dialog && typeof evt.dialog == "object") {
        evt.dialog.close()
      }
      player.logSkill("tousui")
      var cards = event.result.cards
      await player.loseToDiscardpile(cards, ui.cardPile, false, "blank").set("log", false)
      var shownCards = cards.filter((i) => get.position(i) == "e"),
        handcardsLength = cards.length - shownCards.length
      if (shownCards.length) {
        player.$throw(shownCards, null)
        game.log(player, "将", shownCards, "置于了牌堆底")
      }
      if (handcardsLength > 0) {
        player.$throw(handcardsLength, null)
        game.log(player, "将", get.cnNumber(handcardsLength), "张牌置于了牌堆底")
      }
      await game.delayex()
      var viewAs = new lib.element.VCard({ name: event.result.card.name, isCard: true })
      event.result.card = viewAs
      event.result.cards = []
      event.result._apply_args = {
        shanReq: cards.length,
        oncard: () => {
          var evt = get.event()
          for (var target of game.filterPlayer(null, null, true)) {
            var id = target.playerid
            var map = evt.customArgs
            if (!map[id]) {
              map[id] = {}
            }
            map[id].shanRequired = evt.shanReq
          }
        },
      }
    },
    ai: {
      order(item, player) {
        return get.order({ name: "sha" }) + 0.1
      },
      result: { player: 1 },
      keepdu: true,
      respondSha: true,
      skillTagFilter: (player, tag, arg) => {
        if (tag == "respondSha" && arg === "respond") {
          return false
        }
      },
    },
  },
  chuming: {
    audio: 2,
    trigger: {
      source: "damageBegin1",
      player: "damageBegin3",
    },
    filter(event, player) {
      if (event.source === event.player) {
        return false
      }
      if (!event.card || !event.cards || !event.cards.length) {
        return true
      }
      let target = event[player === event.source ? "player" : "source"]
      return target && target.isIn()
    },
    forced: true,
    async content(event, trigger, player) {
      if (!trigger.card || !trigger.cards || !trigger.cards.length) {
        trigger.num++
        event.finish()
        return
      } else {
        var target = trigger[trigger.source == player ? "player" : "source"]
        trigger._chuming = true
        target.addTempSkill("chuming_effect")
      }
    },
    ai: {
      effect: {
        player(card, player, target) {
          if (!get.tag(card, "damage")) {
            return
          }
          if (!lib.card[card.name] || !card.cards || !card.cards.length) {
            return [1, 0, 2, 0]
          }
          return [1, -1]
        },
        target(card, player, target) {
          if (!get.tag(card, "damage")) {
            return
          }
          if (!lib.card[card.name] || !card.cards || !card.cards.length) {
            return 2
          }
          return [1, -1]
        },
      },
      combo: "tousui",
      halfneg: true,
    },
    subSkill: {
      effect: {
        charlotte: true,
        trigger: { global: "phaseEnd" },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          var mapx = {}
          var history = player.getHistory("damage").concat(player.getHistory("sourceDamage"))
          history.forEach((evt) => {
            if (!evt._chuming) {
              return
            }
            var target = evt[evt.source == player ? "player" : "source"]
            if (!target.isIn()) {
              return
            }
            var cards = evt.cards.filterInD("d")
            if (!cards.length) {
              return
            }
            if (!mapx[target.playerid]) {
              mapx[target.playerid] = []
            }
            mapx[target.playerid].addArray(cards)
          })
          var entries = Object.entries(mapx).map((entry) => {
            return [(_status.connectMode ? lib.playerOL : game.playerMap)[entry[0]], entry[1]]
          })
          if (!entries.length) {
            event.finish()
            return
          }
          player.logSkill(
            "chuming_effect",
            entries.map((i) => i[0]),
          )
          entries.sort((a, b) => lib.sort.seat(a[0], b[0]))
          for (var entry of entries) {
            var current = entry[0],
              cards = entry[1]
            var list = ["jiedao", "guohe"].filter((i) =>
              player.canUse(new lib.element.VCard({ name: i, cards: cards }), current, false),
            )
            if (!list.length) {
              return
            }
            var result = {}
            if (list.length == 1) {
              result = { bool: true, links: [["", "", list[0]]] }
            } else {
              result = await player
                .chooseButton(
                  [`畜鸣：请选择要对${get.translation(current)}使用的牌`, [list, "vcard"]],
                  true,
                )
                .set("ai", (button) => {
                  var player = get.player()
                  return get.effect(
                    get.event().currentTarget,
                    { name: button.link[2] },
                    player,
                    player,
                  )
                })
                .set("currentTarget", current)
                .forResult()
            }
            if (result.bool) {
              var card = get.autoViewAs({ name: result.links[0][2] }, cards)
              if (player.canUse(card, current, false)) {
                player.useCard(card, cards, current, false)
              }
            }
          }
        },
      },
    },
  },
  weifu: {
    audio: 2,
    enable: "phaseUse",
    filterCard: lib.filter.cardDiscardable,
    position: "he",
    filter(event, player) {
      return player.hasCard((card) => lib.filter.cardDiscardable(card, player), "he")
    },
    check(card) {
      var player = get.player()
      return (5 - get.value(card)) / Math.pow(Math.max(0.1, player.getUseValue(card)), 0.33)
    },
    content() {
      "step 0"
      player
        .judge((card) => {
          var evt = get.event().getParent("weifu")
          if (evt.name !== "weifu") {
            return 0
          }
          var cardx = evt.cards[0]
          if (get.type2(card) == get.type2(cardx)) {
            return 0.5
          }
          return 0.1
        })
        .set("callback", function () {
          var card = event.judgeResult.card
          player.addTempSkill("weifu_clear")
          player.addTempSkill("weifu_add")
          if (!get.is.object(player.storage.weifu_add)) {
            player.storage.weifu_add = {}
          }
          var type = get.type2(card, player)
          if (typeof player.storage.weifu_add[type] != "number") {
            player.storage.weifu_add[type] = 0
          }
          player.storage.weifu_add[type]++
          player.markSkill("weifu_add")
          if (type == get.type2(event.getParent(2).cards[0], player)) {
            player.draw()
          }
        })
        .set("judge2", (result) => result.bool)
    },
    ai: {
      order: 7,
      result: {
        player(player) {
          return player.hasCard((card) => {
            var type = get.type2(card)
            if (type == "equip") {
              return false
            }
            return (
              player.hasUseTarget(card) &&
              player.getUseValue(card) > 5 &&
              game.countPlayer((current) => {
                return (
                  lib.filter.targetEnabled2(card, player, current) &&
                  get.effect(current, card, player, player) > 0
                )
              }) +
                1 >
                (get.is.object(player.storage.weifu_add) ? player.storage.weifu_add[type] || 0 : 0)
            )
          }, "hs")
            ? 1
            : 0
        },
      },
    },
    subSkill: {
      clear: {
        trigger: { player: "useCard1" },
        filter(event, player) {
          var type = get.type2(event.card)
          if (
            get.is.object(player.storage.weifu_add) &&
            typeof player.storage.weifu_add[type] == "number"
          ) {
            return true
          }
          return false
        },
        silent: true,
        firstDo: true,
        charlotte: true,
        content() {
          var type = get.type2(trigger.card)
          var num = player.storage.weifu_add[type]
          delete player.storage.weifu_add[type]
          if (get.is.empty(player.storage.weifu_add)) {
            delete player.storage.weifu_add
            player.unmarkSkill("weifu_add")
          }
          trigger._weifu_clear = num
        },
      },
      add: {
        trigger: { player: "useCard2" },
        filter(event, player) {
          if (!event._weifu_clear) {
            return false
          }
          var info = get.info(event.card)
          if (info.allowMultiple == false) {
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
        onremove: true,
        charlotte: true,
        direct: true,
        content() {
          "step 0"
          var num = trigger._weifu_clear
          player
            .chooseTarget(
              get.prompt("weifu"),
              "为" + get.translation(trigger.card) + "额外指定" + get.cnNumber(num) + "个目标。",
              [1, num],
              (card, player, target) => {
                return (
                  !_status.event.sourcex.includes(target) &&
                  lib.filter.targetEnabled2(_status.event.card, player, target)
                )
              },
            )
            .set("sourcex", trigger.targets)
            .set("ai", function (target) {
              var player = _status.event.player
              return get.effect(target, _status.event.card, player, player)
            })
            .set("card", trigger.card)
          ;("step 1")
          if (result.bool) {
            var targets = result.targets
            player.logSkill("weifu_add", targets)
            trigger.targets.addArray(targets)
            game.log(targets, "也成为了", trigger.card, "的目标")
            if (!event.isMine() && !event.isOnline()) {
              game.delayex()
            }
          }
        },
        intro: {
          markcount: () => 0,
          content: (storage, player) => {
            if (!get.is.object(storage)) {
              return
            }
            var str = "使用下一张以下类型的牌无距离限制，且可以额外指定对应数量个目标："
            for (var type in storage) {
              str += "<li>" + get.translation(type) + "牌：+" + storage[type]
            }
            return str
          },
        },
        mod: {
          targetInRange: (card, player) => {
            var type = get.type2(card)
            if (
              get.is.object(player.storage.weifu_add) &&
              typeof player.storage.weifu_add[type] == "number"
            ) {
              return true
            }
          },
        },
      },
    },
  },
  kuansai: {
    audio: 2,
    trigger: { global: "useCardToPlayered" },
    filter(event, player) {
      return event.isFirstTarget && event.targets.length >= player.getHp()
    },
    usable: 1,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt(event.name.slice(0, -5)),
          "令其中一个目标选择一项：1.交给你一张牌；2.令你回复1点体力。",
          (card, player, target) => {
            return _status.event.targets.includes(target)
          },
        )
        .set("targets", trigger.targets)
        .set("ai", (target) => {
          const player = get.player()
          const att = get.attitude(player, target)
          if (att > 0) {
            return 1
          }
          return (1 - att) / Math.sqrt(1 + target.countCards("he"))
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      let position = "e"
      if (player != target) {
        position += "h"
      }
      const forced = player.isHealthy()
      const str = `请交给其一张牌${forced ? "" : "或点击“取消”令其回复1点体力"}。`
      const bool = !target.countCards(position)
        ? false
        : (
            await target
              .chooseToGive(
                player,
                `${get.translation(player)}对你发动了【款塞】`,
                str,
                position,
                forced,
              )
              .set("ai", (card) => {
                const { player, target, recover } = get.event()
                if (recover) {
                  return 0
                }
                if (get.attitude(player, target) > 0) {
                  return get.value(card, player) - get.value(card, target)
                }
                if (get.tag(card, "recover")) {
                  return -1
                }
                return 6.5 - get.value(card)
              })
              .set(
                "recover",
                (() => {
                  if (forced) {
                    return false
                  }
                  var recoverEff = get.recoverEffect(player, target, target)
                  var att = get.attitude(target, player)
                  if (att < 0) {
                    if (recoverEff >= 0) {
                      return true
                    }
                    if (
                      target.hasCard((card) => {
                        return (
                          (get.value(card) < 6.5 && !get.tag(card, "recover")) ||
                          get.value(card) <= 0.05
                        )
                      }, position)
                    ) {
                      return false
                    }
                  } else {
                    if (recoverEff > 0) {
                      return true
                    }
                    if (
                      target.hasCard((card) => {
                        return get.value(card, target) < get.value(card, player)
                      }, position)
                    ) {
                      return false
                    }
                  }
                  return true
                })(),
              )
              .forResult()
          ).bool
      if (!bool) {
        await player.recover(target)
      }
    },
  },
  huiyun: {
    audio: 2,
    enable: "phaseUse",
    viewAs: {
      name: "huogong",
      storage: { huiyun: true },
    },
    filterCard: true,
    position: "hes",
    onuse(links, player) {
      player.addTempSkill("huiyun_after")
      player.addTempSkill("huiyun_record")
    },
    ai: {
      effect: {
        player(card, player, target) {
          if (
            get.attitude(player, target) > 0 &&
            card?.name === "huogong" &&
            card.storage?.huiyun &&
            player.getStorage("huiyun_used").length < 3
          ) {
            return [0, 0.5, 0, 0.5]
          }
        },
      },
    },
    subSkill: {
      used: {
        charlotte: true,
        onremove: true,
      },
      after: {
        audio: "huiyun",
        trigger: { global: "useCardAfter" },
        charlotte: true,
        locked: true,
        filter(event, player) {
          if (player.getStorage("huiyun_used").length > 2) {
            return false
          }
          return (
            event.card.name == "huogong" &&
            event.card.storage?.huiyun &&
            event.targets.some((i) => i.isIn())
          )
        },
        async cost(event, trigger, player) {
          const choices = []
          const choiceList = [
            "使用展示牌，然后重铸所有手牌",
            "使用一张手牌，然后重铸展示牌",
            "摸一张牌",
          ]
          for (let i = 1; i <= 3; i++) {
            if (!player.getStorage("huiyun_used").includes(i)) {
              choices.push("选项" + get.cnNumber(i, true))
            } else {
              choiceList[i - 1] = '<span style="opacity:0.5">' + choiceList[i - 1] + "</span>"
            }
          }
          const { control } = await player
            .chooseControl(choices)
            .set("choiceList", choiceList)
            .set("prompt", "晖云：选择一项，令" + get.translation(trigger.targets) + "可以选择执行")
            .set("ai", () => {
              return get.event().choice
            })
            .set(
              "choice",
              (() => {
                if (choices.length == 1) {
                  return choices[0]
                }
                const choicesx = choices.slice()
                if (get.attitude(player, trigger.targets[0]) > 0 && choices.includes("选项三")) {
                  return "选项三"
                }
                choicesx.remove("选项三")
                return choicesx.randomGet()
              })(),
            )
            .forResult()
          event.result = {
            bool: true,
            cost_data: control,
          }
        },
        async content(event, trigger, player) {
          const index = ["选项一", "选项二", "选项三"].indexOf(event.cost_data) + 1
          game.log(player, "选择了", "#y" + event.cost_data)
          player.addTempSkill("huiyun_used", "roundStart")
          player.markAuto("huiyun_used", [index])
          for (const target of trigger.targets.sortBySeat()) {
            if (!target.isIn()) {
              continue
            }
            const cards = target.getCards("h", (card) => card.hasGaintag("huiyun_tag"))
            if (index == 1 && cards.length) {
              const result = await target
                .chooseToUse({
                  filterCard(card) {
                    if (get.itemtype(card) != "card" || !card.hasGaintag("huiyun_tag")) {
                      return false
                    }
                    return lib.filter.filterCard.apply(this, arguments)
                  },
                  prompt: "是否使用一张展示牌，然后重铸所有手牌？",
                  addCount: false,
                })
                .forResult()
              if (result.bool) {
                const hs = target.getCards("h", lib.filter.cardRecastable)
                if (hs.length) {
                  await target.recast(hs)
                }
              }
            } else if (index == 2) {
              const result = await target
                .chooseToUse({
                  filterCard(card) {
                    if (
                      get.itemtype(card) != "card" ||
                      (get.position(card) != "h" && get.position(card) != "s")
                    ) {
                      return false
                    }
                    return lib.filter.filterCard.apply(this, arguments)
                  },
                  prompt: "是否使用一张手牌，然后重铸展示牌？",
                  addCount: false,
                })
                .forResult()
              if (result.bool) {
                const hs = target.getCards("h", (card) => {
                  if (!card.hasGaintag("huiyun_tag")) {
                    return false
                  }
                  return target.canRecast(card)
                })
                if (hs.length) {
                  await target.recast(hs)
                }
              }
            } else if (index == 3) {
              const { bool } = await target
                .chooseBool("是否摸一张牌？")
                .set("ai", () => true)
                .forResult()
              if (bool) {
                await target.draw()
              }
            }
          }
        },
      },
      record: {
        trigger: { global: "showCardsEnd" },
        forced: true,
        charlotte: true,
        popup: false,
        firstDo: true,
        filter(event, player) {
          if (event.getParent().name != "huogong") {
            return false
          }
          const card = event.getParent(2).card
          return card?.storage?.huiyun
        },
        content() {
          game.broadcastAll((cards) => {
            cards.forEach((card) => card.addGaintag("huiyun_tag"))
          }, trigger.cards)
        },
      },
    },
  },
  // 卞喜
  // 钝袭
  dunxi: {
    audio: 2,
    trigger: { player: "useCard" },
    direct: true,
    filter(event, player) {
      if (!get.tag(event.card, "damage") || get.type(event.card) == "delay") {
        return false
      }
      return event.targets.some((target) => target.isIn())
    },
    content() {
      "step 0"
      var targets = trigger.targets.filter(function (current) {
        return current.isIn()
      })
      if (targets.length == 1) {
        event.target = targets[0]
        player
          .chooseBool(
            get.prompt("dunxi", event.target),
            "令" + get.translation(event.target) + "获得一枚“钝”标记",
          )
          .set("goon", get.attitude(player, event.target) < 0)
          .set("ai", () => _status.event.goon)
      } else {
        player
          .chooseTarget(
            get.prompt("dunxi"),
            "选择一名目标角色获得一枚“钝”标记",
            function (card, player, target) {
              return _status.event.getTrigger().targets.includes(target)
            },
          )
          .set("ai", function (target) {
            var att = get.attitude(_status.event.player, target)
            if (att >= 0) {
              return 0
            }
            return -att / (1 + target.hasMark("dunxi"))
          })
      }
      ;("step 1")
      if (result.bool) {
        var target = event.target || result.targets[0]
        player.logSkill("dunxi", target)
        target.addMark("dunxi", 1)
        game.delayx()
      }
    },
    intro: { content: "mark", name2: "钝" },
    group: "dunxi_random",
    subSkill: {
      random: {
        audio: "dunxi",
        trigger: { global: "useCard" },
        forced: true,
        locked: false,
        filter(event, player) {
          if (!event.player.hasMark("dunxi") || event.targets.length != 1 || event._dunxi) {
            return false
          }
          // 必须在出牌阶段内
          var evt = event.getParent("phaseUse")
          if (!evt || evt.player != event.player) {
            return false
          }
          var type = get.type2(event.card, false)
          return type == "basic" || type == "trick"
        },
        logTarget: "player",
        line: "fire",
        async content(event, trigger, player) {
          trigger._dunxi = true
          trigger.player.removeMark("dunxi", 1)
          const originalTarget = trigger.targets[0]
          // 令所有角色进行判定
          const judgeResults = []
          const allPlayers = game.filterPlayer()
          for (const current of allPlayers) {
            const judgeResult = await current.judge().forResult()
            judgeResults.push({
              player: current,
              number: judgeResult.number,
            })
          }
          // 找到点数最大值
          const maxNumber = Math.max(...judgeResults.map((r) => r.number))
          const maxPlayers = judgeResults.filter((r) => r.number == maxNumber).map((r) => r.player)
          let newTarget
          if (maxPlayers.length == 1) {
            newTarget = maxPlayers[0]
          } else {
            // 点数相同由钝袭拥有者（player）选择
            const chooseResult = await player
              .chooseTarget(
                "钝袭：选择判定点数相同的一名角色作为新目标",
                true,
                function (card, player, target) {
                  return _status.event.maxPlayers.includes(target)
                },
              )
              .set("maxPlayers", maxPlayers)
              .set("ai", function (target) {
                return get.effect(
                  target,
                  _status.event.getTrigger().card,
                  _status.event.getTrigger().player,
                  _status.event.player,
                )
              })
              .forResult()
            newTarget = chooseResult.targets?.[0] || maxPlayers.randomGet()
          }
          // 将目标改为新目标
          trigger.targets.remove(originalTarget)
          trigger.targets.push(newTarget)
          trigger.player.line(newTarget, "fire")
          game.log(trigger.card, "的目标被改为", newTarget)
          // 若更改后目标与原目标相同
          if (newTarget == originalTarget) {
            await trigger.player.loseHp()
            const evt = trigger.getParent("phaseUse")
            if (evt && evt.player == trigger.player) {
              evt.skipped = true
            }
          }
        },
      },
    },
  },
}

export default skills
