import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // SP姜维
  // 困奋
  kunfen: {
    audio: 2,
    audioname2: { ol_sb_jiangwei: "kunfen_ol_sb_jiangwei" },
    derivation: "kunfen_rewrite",
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
    derivation: "tiaoxin",
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
      player.addSkills("tiaoxin")
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
  // // 曹纯
  // // 缮甲
  // shanjia: {
  //   init(player, skill) {
  //     player.addSkill("shanjia_count")
  //   },
  //   onremove(player, skill) {
  //     player.removeSkill("shanjia_count")
  //   },
  //   locked: false,
  //   mod: {
  //     aiValue(player, card, num) {
  //       if (
  //         (player.storage.shanjia || 0) < 3 &&
  //         get.type(card) === "equip" &&
  //         !get.cardtag(card, "gifts")
  //       ) {
  //         return num / player.hp
  //       }
  //     },
  //   },
  //   audio: 2,
  //   trigger: {
  //     player: "phaseUseBegin",
  //   },
  //   intro: {
  //     content: "本局游戏内已失去过#张装备牌",
  //   },
  //   frequent: true,
  //   sync(player) {
  //     var history = player.actionHistory
  //     var num = 0
  //     for (var i = 0; i < history.length; i++) {
  //       for (var j = 0; j < history[i].lose.length; j++) {
  //         if (history[i].lose[j].getParent().name === "useCard") {
  //           continue
  //         }
  //         num += history[i].lose[j].cards2.filter(
  //           (card) => get.type(card) === "equip",
  //         ).length
  //       }
  //     }
  //     player.storage.shanjia = num
  //     if (num > 0) {
  //       player.markSkill("shanjia")
  //     }
  //   },
  //   async content(event, trigger, player) {
  //     await player.draw(3)
  //     lib.skill.shanjia.sync(player)
  //     const num = 3 - player.storage.shanjia
  //     let result
  //     if (num > 0) {
  //       result = await player
  //         .chooseToDiscard("he", true, num)
  //         .set("ai", get.disvalue)
  //         .forResult()
  //     }
  //     let bool1 = true,
  //       bool2 = true
  //     if (result?.cards?.length) {
  //       const cards = result.cards
  //       for (let i = 0; i < result.cards.length; i++) {
  //         var type = get.type(
  //           result.cards[i],
  //           "trick",
  //           result.cards[i].original === "h" ? player : false,
  //         )
  //         if (type === "basic") {
  //           bool1 = false
  //         }
  //         if (type === "trick") {
  //           bool2 = false
  //         }
  //       }
  //     }
  //     if (bool1) {
  //       player.addTempSkill("shanjia_sha", "phaseChange")
  //     }
  //     if (bool2) {
  //       player.addTempSkill("shanjia_nodis", "phaseChange")
  //     }
  //     if (bool1 && bool2) {
  //       await player.chooseUseTarget(
  //         { name: "sha" },
  //         "是否视为使用一张【杀】？",
  //         false,
  //       )
  //     }
  //   },
  //   ai: {
  //     threaten: 3,
  //     noe: true,
  //     reverseOrder: true,
  //     skillTagFilter(player) {
  //       if (player.storage.shanjia > 2) {
  //         return false
  //       }
  //     },
  //     effect: {
  //       target(card, player, target) {
  //         if (
  //           player.storage.shanjia < 3 &&
  //           get.type(card) === "equip" &&
  //           !get.cardtag(card, "gifts")
  //         ) {
  //           return [1, 3]
  //         }
  //       },
  //     },
  //   },
  //   subSkill: {
  //     count: {
  //       forced: true,
  //       silent: true,
  //       popup: false,
  //       trigger: {
  //         player: "loseEnd",
  //       },
  //       filter(event, player) {
  //         return event.cards2 && event.cards2.length > 0
  //       },
  //       content() {
  //         lib.skill.shanjia.sync(player)
  //       },
  //     },
  //     sha: {
  //       mark: true,
  //       charlotte: true,
  //       intro: { content: "使用【杀】的次数上限+1" },
  //       mod: {
  //         cardUsable(card, player, num) {
  //           if (card.name === "sha") {
  //             return num + 1
  //           }
  //         },
  //       },
  //     },
  //     nodis: {
  //       mark: true,
  //       charlotte: true,
  //       intro: { content: "使用牌无距离限制" },
  //       mod: {
  //         targetInRange: () => true,
  //       },
  //     },
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
  // // 马良
  // // 应援
  // yingyuan: {
  //   audio: 2,
  //   trigger: { player: "useCardAfter" },
  //   direct: true,
  //   filter(event, player) {
  //     if (_status.currentPhase !== player) {
  //       return false
  //     }
  //     if (
  //       player.getHistory(
  //         "custom",
  //         (evt) => evt.yingyuan_name === event.card.name,
  //       ).length > 0
  //     ) {
  //       return false
  //     }
  //     return event.cards.filterInD().length > 0
  //   },
  //   content() {
  //     "step 0"
  //     player
  //       .chooseTarget(
  //         get.prompt("yingyuan"),
  //         `将${get.translation(trigger.cards)}交给一名其他角色`,
  //         (card, player, target) => target !== player,
  //       )
  //       .set("ai", (target) => {
  //         if (target.hasJudge("lebu")) {
  //           return 0
  //         }
  //         let att = get.attitude(_status.event.player, target),
  //           name = _status.event.cards[0].name
  //         if (att < 3) {
  //           return 0
  //         }
  //         if (target.hasSkillTag("nogain")) {
  //           att /= 10
  //         }
  //         if (name === "sha" && target.hasSha()) {
  //           att /= 5
  //         }
  //         if (name === "wuxie" && target.needsToDiscard(_status.event.cards)) {
  //           att /= 5
  //         }
  //         return att / (1 + get.distance(player, target, "absolute"))
  //       })
  //       .set("cards", trigger.cards)
  //     ;("step 1")
  //     if (result.bool) {
  //       player.logSkill("yingyuan", result.targets[0])
  //       result.targets[0].gain(trigger.cards.filterInD(), "gain2")
  //       player.getHistory("custom").push({ yingyuan_name: trigger.card.name })
  //     }
  //   },
  // },
  // // 自书
  // zishu: {
  //   audio: 2,
  //   locked: true,
  //   subSkill: {
  //     discard: {
  //       trigger: { global: "phaseEnd" },
  //       audio: "zishu",
  //       forced: true,
  //       filter(event, player) {
  //         if (_status.currentPhase !== player) {
  //           var he = player.getCards("h")
  //           var bool = false
  //           player.getHistory("gain", (evt) => {
  //             if (!bool && evt && evt.cards) {
  //               for (var i = 0; i < evt.cards.length; i++) {
  //                 if (he.includes(evt.cards[i])) {
  //                   bool = true
  //                 }
  //                 break
  //               }
  //             }
  //           })
  //           return bool
  //         }
  //         return false
  //       },
  //       content() {
  //         var he = player.getCards("h")
  //         var list = []
  //         player.getHistory("gain", (evt) => {
  //           if (evt?.cards) {
  //             for (var i = 0; i < evt.cards.length; i++) {
  //               if (he.includes(evt.cards[i])) {
  //                 list.add(evt.cards[i])
  //               }
  //             }
  //           }
  //         })
  //         player.$throw(list, 1000)
  //         player.lose(list, ui.discardPile, "visible")
  //         game.log(player, "将", list, "置入弃牌堆")
  //       },
  //     },
  //     mark: {
  //       trigger: {
  //         player: "gainBegin",
  //         global: "phaseBeginStart",
  //       },
  //       silent: true,
  //       filter(event, player) {
  //         return event.name !== "gain" || player !== _status.currentPhase
  //       },
  //       content() {
  //         if (trigger.name === "gain") {
  //           trigger.gaintag.add("zishu")
  //         } else {
  //           player.removeGaintag("zishu")
  //         }
  //       },
  //     },
  //     draw: {
  //       trigger: {
  //         player: "gainAfter",
  //         global: "loseAsyncAfter",
  //       },
  //       audio: "zishu",
  //       forced: true,
  //       filter(event, player) {
  //         if (
  //           _status.currentPhase !== player ||
  //           event.getg(player).length === 0
  //         ) {
  //           return false
  //         }
  //         return event.getParent(2).name !== "zishu_draw"
  //       },
  //       content() {
  //         player.draw("nodelay")
  //       },
  //     },
  //   },
  //   ai: {
  //     threaten: 1.2,
  //     nogain: 1,
  //     skillTagFilter(player) {
  //       return player !== _status.currentPhase
  //     },
  //   },
  //   group: ["zishu_draw", "zishu_discard", "zishu_mark"],
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
  // // 张翼
  // // 执义
  // zhiyi: {
  //   audio: 2,
  //   trigger: { global: "phaseJieshuBegin" },
  //   forced: true,
  //   filter(event, player) {
  //     return (
  //       player.getHistory("useCard", (card) => get.type(card.card) === "basic")
  //         .length > 0 ||
  //       player.getHistory("respond", (card) => get.type(card.card) === "basic")
  //         .length > 0
  //     )
  //   },
  //   content() {
  //     "step 0"
  //     var list = []
  //     player.getHistory("useCard", (evt) => {
  //       if (get.type(evt.card) !== "basic") {
  //         return
  //       }
  //       var name = evt.card.name
  //       if (name === "sha") {
  //         var nature = evt.card.nature
  //         switch (nature) {
  //           case "fire":
  //             name = "huosha"
  //             break
  //           case "thunder":
  //             name = "leisha"
  //             break
  //           case "kami":
  //             name = "kamisha"
  //             break
  //           case "ice":
  //             name = "icesha"
  //             break
  //           case "stab":
  //             name = "cisha"
  //             break
  //         }
  //       }
  //       list.add(name)
  //     })
  //     player.getHistory("respond", (evt) => {
  //       if (get.type(evt.card) !== "basic") {
  //         return
  //       }
  //       var name = evt.card.name
  //       if (name === "sha") {
  //         var nature = evt.card.nature
  //         switch (nature) {
  //           case "fire":
  //             name = "huosha"
  //             break
  //           case "thunder":
  //             name = "leisha"
  //             break
  //           case "kami":
  //             name = "kamisha"
  //             break
  //           case "ice":
  //             name = "icesha"
  //             break
  //           case "stab":
  //             name = "cisha"
  //             break
  //         }
  //       }
  //       list.add(name)
  //     })
  //     player.chooseButton(
  //       [
  //         "执义：选择要使用的牌，或点取消摸一张牌",
  //         [list.map((name) => ["基本", "", name]), "vcard"],
  //       ],
  //       (button) =>
  //         _status.event.player.getUseValue({
  //           name: button.link[2],
  //           nature: button.link[3],
  //         }),
  //       (button) =>
  //         _status.event.player.hasUseTarget({
  //           name: button.link[2],
  //           nature: button.link[3],
  //         }),
  //     )
  //     ;("step 1")
  //     if (!result.bool) {
  //       player.draw()
  //     } else {
  //       player.chooseUseTarget(
  //         {
  //           name: result.links[0][2],
  //           isCard: true,
  //           nature: result.links[0][3],
  //         },
  //         true,
  //       )
  //     }
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
  // // 沙摩柯
  // // 蒺藜
  // jili: {
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (
  //         player.isPhaseUsing() &&
  //         get.subtype(card) === "equip1" &&
  //         !get.cardtag(card, "gifts")
  //       ) {
  //         var range0 = player.getAttackRange()
  //         var range = 0
  //         var info = get.info(card)
  //         if (info?.distance?.attackFrom) {
  //           range -= info.distance.attackFrom
  //         }
  //         if (player.getEquip(1)) {
  //           var num = 0
  //           var info = get.info(player.getEquip(1))
  //           if (info?.distance?.attackFrom) {
  //             num -= info.distance.attackFrom
  //           }
  //           range0 -= num
  //         }
  //         range0 += range
  //         if (
  //           range0 ===
  //             player.getHistory("useCard").length +
  //               player.getHistory("respond").length +
  //               2 &&
  //           player.countCards(
  //             "h",
  //             (cardx) =>
  //               get.subtype(cardx) !== "equip1" &&
  //               player.getUseValue(cardx) > 0,
  //           )
  //         ) {
  //           return num + 10
  //         }
  //       }
  //     },
  //   },
  //   trigger: { player: ["useCard", "respond"] },
  //   frequent: true,
  //   locked: false,
  //   preHidden: true,
  //   onremove(player) {
  //     player.removeTip("jili")
  //   },
  //   filter(event, player) {
  //     const count =
  //       player.getHistory("useCard").length +
  //       player.getHistory("respond").length
  //     player.addTip("jili", `蒺藜 ${count}`, true)
  //     return count === player.getAttackRange()
  //   },
  //   audio: 2,
  //   content() {
  //     player.draw(
  //       player.getHistory("useCard").length +
  //         player.getHistory("respond").length,
  //     )
  //   },
  //   ai: {
  //     threaten: 1.8,
  //     effect: {
  //       target_use(card, player, target, current) {
  //         const used =
  //           target.getHistory("useCard").length +
  //           target.getHistory("respond").length
  //         if (get.subtype(card) === "equip1" && !get.cardtag(card, "gifts")) {
  //           if (player !== target || !player.isPhaseUsing()) {
  //             return
  //           }
  //           let range0 = player.getAttackRange()
  //           let range = 0
  //           const info = get.info(card)
  //           if (info?.distance?.attackFrom) {
  //             range -= info.distance.attackFrom
  //           }
  //           if (player.getEquip(1)) {
  //             let num = 0
  //             const info = get.info(player.getEquip(1))
  //             if (info?.distance?.attackFrom) {
  //               num -= info.distance.attackFrom
  //             }
  //             range0 -= num
  //           }
  //           range0 += range
  //           const delta = range0 - used
  //           if (delta < 0) {
  //             return
  //           }
  //           const num = player.countCards(
  //             "h",
  //             (card) =>
  //               (get.cardtag(card, "gifts") ||
  //                 get.subtype(card) !== "equip1") &&
  //               player.getUseValue(card) > 0,
  //           )
  //           if (delta === 2 && num > 0) {
  //             return [1, 3]
  //           }
  //           if (num >= delta) {
  //             return "zeroplayertarget"
  //           }
  //         } else if (get.tag(card, "respondShan") > 0) {
  //           if (current < 0 && used === target.getAttackRange() - 1) {
  //             if (card.name === "sha") {
  //               if (!target.mayHaveShan(player, "use")) {
  //                 return
  //               }
  //             } else if (!target.mayHaveShan(player)) {
  //               return 0.9
  //             }
  //             return [1, (used + 1) / 2]
  //           }
  //         } else if (get.tag(card, "respondSha") > 0) {
  //           if (
  //             current < 0 &&
  //             used === target.getAttackRange() - 1 &&
  //             target.mayHaveSha(player)
  //           ) {
  //             return [1, (used + 1) / 2]
  //           }
  //         }
  //       },
  //     },
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
  // // 张星彩
  // // 甚贤
  // shenxian: {
  //   audio: 2,
  //   trigger: { global: ["loseAfter", "loseAsyncAfter"] },
  //   filter(event, player) {
  //     if (
  //       event.type !== "discard" ||
  //       _status.currentPhase === player ||
  //       event.getlx === false
  //     ) {
  //       return false
  //     }
  //     if (event.name === "lose" && event.player === player) {
  //       return false
  //     }
  //     if (player.hasSkill("shenxian2")) {
  //       return false
  //     }
  //     var cards = event.cards.slice(0)
  //     var evt = event.getl(player)
  //     if (evt?.cards) {
  //       cards.removeArray(evt.cards)
  //     }
  //     for (var i = 0; i < cards.length; i++) {
  //       if (
  //         get.type(
  //           cards[i],
  //           null,
  //           event.hs?.includes(cards[i]) ? event.player : false,
  //         ) === "basic" &&
  //         cards[i].original !== "j"
  //       ) {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   frequent: true,
  //   preHidden: true,
  //   content() {
  //     "step 0"
  //     if (trigger.delay === false) {
  //       game.delay()
  //     }
  //     ;("step 1")
  //     player.draw()
  //     if (event.name === "shenxian") {
  //       player.addTempSkill("shenxian2")
  //     }
  //   },
  //   ai: {
  //     threaten: 1.5,
  //   },
  // },
  // shenxian2: { charlotte: true },
  // oldshenxian: {
  //   audio: "shenxian",
  //   inherit: "shenxian",
  // },
  // // 枪舞
  // qiangwu: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   content() {
  //     "step 0"
  //     player.judge((card) => {
  //       if (
  //         game.hasPlayer((cur) => {
  //           return get.event().player.canUse("sha", cur)
  //         })
  //       ) {
  //         return get.number(card)
  //       }
  //       return 1 / get.number(card)
  //     })
  //     ;("step 1")
  //     player.storage.qiangwu = result.number
  //     player.addTempSkill("qiangwu3", "phaseUseEnd")
  //   },
  //   ai: {
  //     result: {
  //       player: 1,
  //     },
  //     order: 11,
  //   },
  // },
  // qiangwu3: {
  //   mod: {
  //     targetInRange(card, player) {
  //       if (card.name === "sha") {
  //         const num = get.number(card)
  //         if (num === "unsure" || num < player.storage.qiangwu) {
  //           return true
  //         }
  //       }
  //     },
  //     cardUsable(card, player) {
  //       if (card.name === "sha") {
  //         const num = get.number(card)
  //         if (num === "unsure" || num > player.storage.qiangwu) {
  //           return true
  //         }
  //       }
  //     },
  //   },
  //   trigger: { player: "useCard1" },
  //   sourceSkill: "qiangwu",
  //   filter(event, player) {
  //     if (
  //       _status.currentPhase === player &&
  //       event.card.name === "sha" &&
  //       get.number(event.card) > player.storage.qiangwu &&
  //       event.addCount !== false
  //     ) {
  //       return true
  //     }
  //     return false
  //   },
  //   forced: true,
  //   popup: false,
  //   firstDo: true,
  //   content() {
  //     trigger.addCount = false
  //     if (player.stat[player.stat.length - 1].card.sha > 0) {
  //       player.stat[player.stat.length - 1].card.sha--
  //     }
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
  // // 诸葛瑾
  // // 缓释
  // huanshi: {
  //   audio: 2,
  //   trigger: { global: "judge" },
  //   filter(event, player) {
  //     return player.countCards("he") > 0
  //   },
  //   logTarget: "player",
  //   check(event, player) {
  //     if (get.attitude(player, event.player) <= 0) {
  //       return false
  //     }
  //     var cards = player.getCards("he")
  //     var judge = event.judge(event.player.judging[0])
  //     for (var i = 0; i < cards.length; i++) {
  //       var judge2 = event.judge(cards[i])
  //       if (judge2 > judge) {
  //         return true
  //       }
  //       if (
  //         _status.currentPhase !== player &&
  //         judge2 === judge &&
  //         get.color(cards[i]) === "red" &&
  //         get.useful(cards[i]) < 5
  //       ) {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   content() {
  //     "step 0"
  //     var target = trigger.player
  //     var judge = trigger.judge(target.judging[0])
  //     var attitude = get.attitude(target, player)
  //     target
  //       .choosePlayerCard("请选择代替判定的牌", "he", "visible", true, player)
  //       .set("ai", (button) => {
  //         var card = button.link
  //         var judge = _status.event.judge
  //         var attitude = _status.event.attitude
  //         var result = trigger.judge(card) - judge
  //         var player = _status.event.player
  //         if (result > 0) {
  //           return 20 + result
  //         }
  //         if (result === 0) {
  //           if (_status.currentPhase === player) {
  //             return 0
  //           }
  //           if (attitude >= 0) {
  //             return get.color(card) === "red" ? 7 : 0 - get.value(card)
  //           }
  //           return get.color(card) === "black" ? 10 : 0 + get.value(card)
  //         }
  //         if (attitude >= 0) {
  //           return get.color(card) === "red" ? 0 : -10 + result
  //         }
  //         return get.color(card) === "black" ? 0 : -10 + result
  //       })
  //       .set("filterButton", (button) => {
  //         var player = _status.event.target
  //         var card = button.link
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
  //           "unchanged",
  //           "cardRespondable",
  //           player,
  //         )
  //         if (mod !== "unchanged") {
  //           return mod
  //         }
  //         return true
  //       })
  //       .set("judge", judge)
  //       .set("attitude", attitude)
  //     ;("step 1")
  //     if (result.bool) {
  //       event.card = result.links[0]
  //       player.respond(event.card, "highlight", "noOrdering").nopopup = true
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     if (result.bool) {
  //       if (trigger.player.judging[0].clone) {
  //         trigger.player.judging[0].clone.classList.remove("thrownhighlight")
  //         game.broadcast((card) => {
  //           if (card.clone) {
  //             card.clone.classList.remove("thrownhighlight")
  //           }
  //         }, trigger.player.judging[0])
  //         game.addVideo(
  //           "deletenode",
  //           player,
  //           get.cardsInfo([trigger.player.judging[0].clone]),
  //         )
  //       }
  //       game.cardsDiscard(trigger.player.judging[0])
  //       trigger.player.judging[0] = event.card
  //       trigger.orderingCards.add(event.card)
  //       game.log(trigger.player, "的判定牌改为", event.card)
  //       game.delay(2)
  //     }
  //   },
  //   ai: {
  //     rejudge: true,
  //     tag: {
  //       rejudge: 1,
  //     },
  //   },
  // },
  // olhongyuan: {
  //   audio: "hongyuan",
  //   trigger: { player: "gainAfter", global: "loseAsyncAfter" },
  //   filter(event, player) {
  //     if (
  //       !player.countCards("he") ||
  //       player.hasSkill("olhongyuan_blocker", null, null, false)
  //     ) {
  //       return false
  //     }
  //     return event.getg(player).length >= 2
  //   },
  //   async content(event, trigger, player) {
  //     player.addTempSkill("olhongyuan_blocker", [
  //       "phaseZhunbeiBefore",
  //       "phaseJudgeBefore",
  //       "phaseDrawBefore",
  //       "phaseUseBefore",
  //       "phaseDiscardBefore",
  //       "phaseJieshuBefore",
  //       "phaseBefore",
  //     ])
  //     const selectedTargets = []
  //     while (
  //       selectedTargets.length < 2 &&
  //       player.countCards("he") &&
  //       game.hasPlayer((target) => {
  //         return target !== player && !selectedTargets.includes(target)
  //       })
  //     ) {
  //       const { bool, targets, cards } = await player
  //         .chooseCardTarget({
  //           prompt: "弘援：将一张牌交给一名其他角色",
  //           filterCard: true,
  //           position: "he",
  //           filterTarget(card, player, target) {
  //             return (
  //               target !== player &&
  //               !get.event().selectedTargets.includes(target)
  //             )
  //           },
  //           complexCard: true,
  //           complexTarget: true,
  //           complexSelect: true,
  //           ai1(card) {
  //             const player = get.event().player
  //             if (
  //               !game.hasPlayer((current) => {
  //                 if (get.event().selectedTargets.includes(current)) {
  //                   return false
  //                 }
  //                 return (
  //                   current !== player &&
  //                   get.attitude(player, current) > 0 &&
  //                   !current.hasSkillTag("nogain")
  //                 )
  //               })
  //             ) {
  //               return -get.value(card)
  //             }
  //             return (
  //               4 +
  //               (player.hasSkill("olmingzhe") && get.color(card) === "red"
  //                 ? 2
  //                 : 0) -
  //               Math.max(player.getUseValue(card), get.value(card, player))
  //             )
  //           },
  //           ai2(target) {
  //             const player = _status.event.player,
  //               att = get.attitude(player, target)
  //             if (!ui.selected.cards.length) {
  //               return att
  //             }
  //             const card = ui.selected.cards[0],
  //               val = get.value(card, target)
  //             if (val < 0) {
  //               return -att * Math.sqrt(-val)
  //             }
  //             return att * Math.sqrt(val + 2)
  //           },
  //         })
  //         .set("selectedTargets", selectedTargets)
  //         .forResult()
  //       if (bool) {
  //         const target = targets[0]
  //         selectedTargets.push(target)
  //         player.line(target)
  //         await player.give(cards, target)
  //       } else {
  //         break
  //       }
  //     }
  //   },
  //   ai: { threaten: 0.8 },
  //   subSkill: { blocker: { charlotte: true } },
  // },
  // olmingzhe: {
  //   audio: "mingzhe",
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
  // recanshi: {
  //   audio: 2,
  //   trigger: { player: "phaseDrawBegin2" },
  //   check(event, player) {
  //     if (
  //       player.skipList.includes("phaseUse") ||
  //       !player.countCards(
  //         "h",
  //         (card) =>
  //           get.type(card, "trick") === "trick" && player.hasUseTarget(card),
  //       )
  //     ) {
  //       return true
  //     }
  //     const num = game.countPlayer((current) => {
  //       if (player.hasZhuSkill("guiming") && current.group === "wu") {
  //         return true
  //       }
  //       return current.isDamaged()
  //     })
  //     return num > 1
  //   },
  //   prompt(event, player) {
  //     const num = game.countPlayer((current) => {
  //       if (
  //         player.hasZhuSkill("guiming") &&
  //         current.group === "wu" &&
  //         current !== player
  //       ) {
  //         return true
  //       }
  //       return current.isDamaged()
  //     })
  //     return `残蚀：是否多摸${get.cnNumber(num)}张牌？`
  //   },
  //   filter(event, player) {
  //     return (
  //       !event.numFixed &&
  //       game.hasPlayer((current) => {
  //         if (
  //           player.hasZhuSkill("guiming") &&
  //           current.group === "wu" &&
  //           current !== player
  //         ) {
  //           return true
  //         }
  //         return current.isDamaged()
  //       })
  //     )
  //   },
  //   async content(event, trigger, player) {
  //     const num = game.countPlayer((current) => {
  //       if (
  //         player.hasZhuSkill("guiming") &&
  //         current.group === "wu" &&
  //         current !== player
  //       ) {
  //         return true
  //       }
  //       return current.isDamaged()
  //     })
  //     if (num > 0) {
  //       trigger.num += num
  //     }
  //     player.addTempSkill("recanshi2")
  //   },
  // },
  // recanshi2: {
  //   sourceSkill: "recanshi",
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (!get.type(card) === "trick" && get.name(card, player) !== "sha") {
  //         return
  //       }
  //       if (!player.needsToDiscard()) {
  //         return 0.1
  //       }
  //     },
  //   },
  //   trigger: { player: "useCard" },
  //   forced: true,
  //   filter(event, player) {
  //     if (player.countCards("he") === 0) {
  //       return false
  //     }
  //     if (event.card.name === "sha") {
  //       return true
  //     }
  //     return get.type(event.card) === "trick"
  //   },
  //   autodelay: true,
  //   async content(event, trigger, player) {
  //     await player
  //       .chooseToDiscard(true, "he", (card) => {
  //         const { player, usefulCards } = get.event()
  //         if (usefulCards.includes(card)) {
  //           return 0.1
  //         }
  //         return 20 - get.value(card)
  //       })
  //       .set(
  //         "usefulCards",
  //         player.getDiscardableCards(player, "h", (card) =>
  //           player.getUseValue(card),
  //         ),
  //       )
  //   },
  // },
  // rechouhai: {
  //   audio: "chouhai",
  //   trigger: { player: "damageBegin3" },
  //   forced: true,
  //   check() {
  //     return false
  //   },
  //   filter(event, player) {
  //     return (
  //       event.card && event.card.name === "sha" && player.countCards("h") === 0
  //     )
  //   },
  //   content() {
  //     trigger.num++
  //   },
  //   ai: {
  //     neg: true,
  //     effect: {
  //       target(card, player, target, current) {
  //         if (card.name === "sha" && target.countCards("h") === 0) {
  //           return [1, -2]
  //         }
  //       },
  //     },
  //   },
  // },
  // guiming: {
  //   audio: 2,
  //   zhuSkill: true,
  //   locked: true,
  //   ai: { combo: "recanshi" },
  // },
  // //陆凯
  // olxuanzhu: {
  //   mark: true,
  //   marktext: "☯",
  //   zhuanhuanji: true,
  //   audio: 2,
  //   enable: "chooseToUse",
  //   filter(event, player) {
  //     if (!player.countCards("he") || event.type === "wuxie") {
  //       return false
  //     }
  //     return get
  //       .inpileVCardList((info) => {
  //         const name = info[2],
  //           type = get.type(name),
  //           infox = get.info({ name: name })
  //         if (type !== "basic" && type !== "trick") {
  //           return false
  //         }
  //         if (
  //           type === "trick" &&
  //           (!infox?.filterTarget ||
  //             get.info("xunshi").isXunshi({ name: name }))
  //         ) {
  //           return false
  //         }
  //         return (type !== "basic") === (player.storage.olxuanzhu || false)
  //       })
  //       .some((card) =>
  //         event.filterCard({ name: card[2], nature: card[3] }, player, event),
  //       )
  //   },
  //   usable: 1,
  //   chooseButton: {
  //     dialog(event, player) {
  //       const list = get
  //         .inpileVCardList((info) => {
  //           const name = info[2],
  //             type = get.type(name),
  //             infox = get.info({ name: name })
  //           if (type !== "basic" && type !== "trick") {
  //             return false
  //           }
  //           if (
  //             type === "trick" &&
  //             (!infox?.filterTarget ||
  //               get.info("xunshi").isXunshi({ name: name }))
  //           ) {
  //             return false
  //           }
  //           return (type !== "basic") === (player.storage.olxuanzhu || false)
  //         })
  //         .filter((card) =>
  //           event.filterCard({ name: card[2], nature: card[3] }, player, event),
  //         )
  //       return ui.create.dialog("玄注", [list, "vcard"])
  //     },
  //     check(button) {
  //       if (get.event().getParent().type !== "phase") {
  //         return 1
  //       }
  //       return get
  //         .event()
  //         .player.getUseValue({ name: button.link[2], nature: button.link[3] })
  //     },
  //     backup(links, player) {
  //       const next = {
  //         audio: "olxuanzhu",
  //         filterCard: true,
  //         popname: true,
  //         check(card) {
  //           return 1 / (get.value(card) || 0.5)
  //         },
  //         position: "he",
  //         ignoreMod: true,
  //         precontent() {
  //           const cards = event.result.cards.slice()
  //           player
  //             .addToExpansion(cards, player, "give")
  //             .gaintag.add("olxuanzhu")
  //           const viewAs = {
  //             name: event.result.card.name,
  //             nature: event.result.card.nature,
  //           }
  //           event.result.card = viewAs
  //           event.result.cards = []
  //           player
  //             .when("useCardAfter")
  //             .filter((evt) => evt.skill === "olxuanzhu_backup")
  //             .step(async () => {
  //               const card = cards[0]
  //               if (get.type(card) !== "equip") {
  //                 await player.chooseToDiscard("he", true)
  //               } else {
  //                 const cardx = player.getExpansions("olxuanzhu")
  //                 if (cardx.length) {
  //                   await player.loseToDiscardpile(cardx)
  //                   await player.draw(cardx.length)
  //                 }
  //               }
  //             })
  //         },
  //         onuse(result, player) {
  //           player.changeZhuanhuanji("olxuanzhu")
  //         },
  //       }
  //       const viewAs = {
  //         name: links[0][2],
  //         nature: links[0][3],
  //         suit: "none",
  //         number: null,
  //         isCard: true,
  //       }
  //       next.viewAs = viewAs
  //       if (get.info("xunshi").isXunshi(viewAs)) {
  //         next.filterTarget = (card, player, target) => {
  //           const info = get.info(card)
  //           if (info.changeTarget) {
  //             const targets = [target]
  //             info.changeTarget(player, targets)
  //             if (targets.length > 1) {
  //               return false
  //             }
  //           }
  //           return lib.filter.filterTarget(card, player, target)
  //         }
  //         next.selectTarget = 1
  //       }
  //       return next
  //     },
  //     prompt(links, player) {
  //       const viewAs = {
  //         name: links[0][2],
  //         nature: links[0][3],
  //         suit: "none",
  //         number: null,
  //         isCard: true,
  //       }
  //       const str =
  //         "将一张牌称为“玄”置于武将牌上，然后视为使用" +
  //         (get.translation(links[0][3]) || "") +
  //         "【" +
  //         get.translation(links[0][2]) +
  //         "】"
  //       return (
  //         str +
  //         (get.info("xunshi").isXunshi(viewAs) ? "（仅能指定一个目标）" : "")
  //       )
  //     },
  //   },
  //   hiddenCard(player, name) {
  //     if (
  //       !lib.inpile.includes(name) ||
  //       player.getStat("skill").olxuanzhu ||
  //       !player.countCards("he")
  //     ) {
  //       return false
  //     }
  //     return get
  //       .inpileVCardList((info) => {
  //         const name = info[2],
  //           type = get.type(name),
  //           infox = get.info({ name: name })
  //         if (type !== "basic" && type !== "trick") {
  //           return false
  //         }
  //         if (
  //           type === "trick" &&
  //           (!infox?.filterTarget ||
  //             get.info("xunshi").isXunshi({ name: name }))
  //         ) {
  //           return false
  //         }
  //         return (type !== "basic") === (player.storage.olxuanzhu || false)
  //       })
  //       .map((card) => card[2])
  //       .includes(name)
  //   },
  //   ai: {
  //     order(item, player) {
  //       if (player && get.event().type === "phase") {
  //         const list = get
  //           .inpileVCardList((info) => {
  //             const name = info[2],
  //               type = get.type(name),
  //               infox = get.info({ name: name })
  //             if (type !== "basic" && type !== "trick") {
  //               return false
  //             }
  //             if (
  //               type === "trick" &&
  //               (!infox?.filterTarget ||
  //                 get.info("xunshi").isXunshi({ name: name }))
  //             ) {
  //               return false
  //             }
  //             return (type !== "basic") === (player.storage.olxuanzhu || false)
  //           })
  //           .map((card) => {
  //             return { name: card[2], nature: card[3] }
  //           })
  //           .filter((card) => player.getUseValue(card, true, true) > 0)
  //         if (!list.length) {
  //           return 0
  //         }
  //         list.sort((a, b) => {
  //           const getNum = (card) => {
  //             if (get.info("xunshi").isXunshi(card)) {
  //               return get.effect(
  //                 game
  //                   .filterPlayer((target) => {
  //                     return player.canUse(card, target, true, true)
  //                   })
  //                   .sort(
  //                     (a, b) =>
  //                       get.effect(b, card, player, player) -
  //                       get.effect(a, card, player, player),
  //                   )[0],
  //                 card,
  //                 player,
  //                 player,
  //               )
  //             }
  //             return player.getUseValue(card, true, true)
  //           }
  //           return (getNum(b) || 0) - (getNum(a) || 0)
  //         })
  //         return get.order(list[0], player) * 0.99
  //       }
  //       return 0.001
  //     },
  //     respondSha: true,
  //     respondShan: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (arg === "respond") {
  //         return false
  //       }
  //       const name = tag === "respondSha" ? "sha" : "shan"
  //       return get.info("olxuanzhu").hiddenCard(player, name)
  //     },
  //     result: { player: 1 },
  //   },
  //   intro: {
  //     markcount: "expansion",
  //     mark(dialog, storage, player) {
  //       const cards = player.getExpansions("olxuanzhu")
  //       if (cards.length) {
  //         dialog.addSmall(player.getExpansions("olxuanzhu"))
  //       }
  //       dialog.addText(
  //         (() => {
  //           if (storage) {
  //             return "每回合限一次，你可以将一张牌称为“玄”置于武将牌上，然后视为使用任意普通锦囊牌（须指定目标且仅指定一个目标）。若此次置于武将牌上的“玄”：不为装备牌，你弃置一张牌；为装备牌，你将所有“玄”置入弃牌堆，然后摸等量的牌。"
  //           }
  //           return "每回合限一次，你可以将一张牌称为“玄”置于武将牌上，然后视为使用任意基本牌。若此次置于武将牌上的“玄”：不为装备牌，你弃置一张牌；为装备牌，你将所有“玄”置入弃牌堆，然后摸等量的牌。"
  //         })(storage),
  //       )
  //     },
  //   },
  //   onremove(player, skill) {
  //     const cards = player.getExpansions(skill)
  //     if (cards.length) {
  //       player.loseToDiscardpile(cards)
  //     }
  //   },
  //   subSkill: { backup: {} },
  // },
  // oljiane: {
  //   audio: 2,
  //   trigger: { player: ["shaDamage", "useCardToEnd"] },
  //   filter(event, player, name) {
  //     if (
  //       event.type !== "card" ||
  //       !event.target ||
  //       !event.target.isIn() ||
  //       event.target === player
  //     ) {
  //       return false
  //     }
  //     if (name === "shaDamage") {
  //       return true
  //     }
  //     return event.card.name !== "sha" && !event.getParent()._neutralized
  //   },
  //   logTarget: "target",
  //   forced: true,
  //   async content(event, trigger, player) {
  //     trigger.target.addTempSkill("oljiane_neutralized")
  //   },
  //   group: "oljiane_neutralize",
  //   global: "oljiane_ai",
  //   subSkill: {
  //     neutralize: {
  //       audio: "oljiane",
  //       trigger: {
  //         target: "shaMiss",
  //         global: "eventNeutralized",
  //       },
  //       filter(event, player, name) {
  //         if (event.type !== "card") {
  //           return false
  //         }
  //         return name === "shaMiss" || event._neutralize_event.player === player
  //       },
  //       forced: true,
  //       async content(event, trigger, player) {
  //         player.addTempSkill("oljiane_nouse")
  //       },
  //     },
  //     ai: {
  //       ai: {
  //         directHit_ai: true,
  //         skillTagFilter(player, tag, arg) {
  //           if (!arg?.target?.hasSkill("oljiane_neutralized")) {
  //             return false
  //           }
  //         },
  //       },
  //     },
  //     neutralized: {
  //       charlotte: true,
  //       mark: true,
  //       marktext: "牌",
  //       intro: { content: "本回合无法抵消牌" },
  //       trigger: { global: "useCard" },
  //       forced: true,
  //       popup: false,
  //       async content(event, trigger, player) {
  //         const id = player.playerid
  //         const map = trigger.customArgs
  //         if (!map[id]) {
  //           map[id] = {}
  //         }
  //         map[id].directHit2 = true
  //       },
  //       mod: {
  //         wuxieJudgeEnabled: () => false,
  //         wuxieEnabled: () => false,
  //       },
  //     },
  //     nouse: {
  //       charlotte: true,
  //       mark: true,
  //       marktext: '<span style="text-decoration: line-through;">牌</span>',
  //       intro: { content: "本回合无法成为牌的目标" },
  //       mod: { targetEnabled: () => false },
  //     },
  //   },
  // },
  // xunshi: {
  //   audio: 2,
  //   mod: {
  //     cardname(card) {
  //       if (lib.skill.xunshi.isXunshi(card)) {
  //         return "sha"
  //       }
  //     },
  //     cardnature(card) {
  //       if (lib.skill.xunshi.isXunshi(card)) {
  //         return false
  //       }
  //     },
  //     suit(card) {
  //       if (lib.skill.xunshi.isXunshi(card)) {
  //         return "none"
  //       }
  //     },
  //     targetInRange(card) {
  //       const suit = get.color(card)
  //       if (suit === "none" || suit === "unsure") {
  //         return true
  //       }
  //     },
  //     cardUsable(card) {
  //       const suit = get.color(card)
  //       if (suit === "none" || suit === "unsure") {
  //         return Infinity
  //       }
  //     },
  //   },
  //   isXunshi(card) {
  //     var info = lib.card[card.name]
  //     if (!info || (info.type !== "trick" && info.type !== "delay")) {
  //       return false
  //     }
  //     if (info.notarget) {
  //       return false
  //     }
  //     if (info.selectTarget !== undefined) {
  //       if (Array.isArray(info.selectTarget)) {
  //         if (info.selectTarget[0] < 0) {
  //           return !info.toself
  //         }
  //         return info.selectTarget[0] !== 1 || info.selectTarget[1] !== 1
  //       }
  //       if (info.selectTarget < 0) {
  //         return !info.toself
  //       }
  //       return info.selectTarget !== 1
  //     }
  //     return false
  //   },
  //   trigger: { player: "useCard2" },
  //   forced: true,
  //   filter(event, player) {
  //     return get.color(event.card) === "none"
  //   },
  //   async content(event, trigger, player) {
  //     if (
  //       player.countMark("shencai") < 4 &&
  //       player.hasSkill("shencai", null, null, false)
  //     ) {
  //       player.addMark("shencai", 1, false)
  //     }

  //     if (trigger.addCount !== false) {
  //       trigger.addCount = false
  //       const stat = player.getStat().card
  //       const name = trigger.card.name
  //       if (typeof stat[name] === "number") {
  //         stat[name]--
  //       }
  //     }

  //     const info = get.info(trigger.card)
  //     if (info.allowMultiple === false) {
  //       return
  //     }

  //     if (!trigger.targets || info.multitarget) {
  //       return
  //     }

  //     if (
  //       !game.hasPlayer(
  //         (current) =>
  //           !trigger.targets.includes(current) &&
  //           lib.filter.targetEnabled2(trigger.card, player, current),
  //       )
  //     ) {
  //       return
  //     }

  //     const prompt2 = `为${get.translation(trigger.card)}增加任意个目标`
  //     const result = await player
  //       .chooseTarget(
  //         get.prompt("xunshi"),
  //         (card, _player, target) => {
  //           const player = get.player()
  //           return (
  //             !_status.event.targets.includes(target) &&
  //             lib.filter.targetEnabled2(_status.event.card, player, target)
  //           )
  //         },
  //         [1, Infinity],
  //       )
  //       .set("prompt2", prompt2)
  //       .set("ai", (target) => {
  //         var trigger = _status.event.getTrigger()
  //         var player = _status.event.player
  //         return get.effect(target, trigger.card, player, player)
  //       })
  //       .set("card", trigger.card)
  //       .set("targets", trigger.targets)
  //       .forResult()

  //     if (!result.bool || !result.targets?.length) {
  //       return
  //     }
  //     if (!event.isMine() && !event.isOnline()) {
  //       await game.delayx()
  //     }
  //     player.line(result.targets, "fire")
  //     trigger.targets.addArray(result.targets)
  //   },
  // },
  // //OL孙茹
  // //持室神将
  // olchishi: {
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
  //   filter(event, player) {
  //     const target = _status.currentPhase
  //     if (!target?.isIn()) {
  //       return false
  //     }
  //     const evt = event.getl(target)
  //     return (
  //       evt &&
  //       ["h", "e", "j"].some(
  //         (pos) => (evt[`${pos}s`] || []).length > 0 && !target.countCards(pos),
  //       )
  //     )
  //   },
  //   check(event, player) {
  //     return (
  //       get.effect(_status.currentPhase, { name: "draw" }, player, player) > 0
  //     )
  //   },
  //   usable: 1,
  //   logTarget: () => _status.currentPhase,
  //   async content(event, trigger, player) {
  //     const target = _status.currentPhase
  //     await target.draw(2)
  //     target.addTempSkill("olchishi_effect")
  //     target.addMark("olchishi_effect", 2, false)
  //   },
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       onremove: true,
  //       markimage: "image/card/handcard.png",
  //       intro: { content: "手牌上限+#" },
  //       mod: {
  //         maxHandcard(player, num) {
  //           return num + player.countMark("olchishi_effect")
  //         },
  //       },
  //     },
  //   },
  // },
  // olweimian: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     return player.hasEnabledSlot()
  //   },
  //   usable: 1,
  //   chooseButton: {
  //     dialog(event, player) {
  //       const dialog = ui.create.dialog(
  //         `###${get.translation("olweimian")}###${lib.translate.olweimian_info}`,
  //         "hidden",
  //       )
  //       const equips = []
  //       for (let i = 1; i < 6; i++) {
  //         if (!player.hasEnabledSlot(i)) {
  //           continue
  //         }
  //         for (let j = 1; j <= player.countEnabledSlot(i); j++) {
  //           equips.push([`equip${i}`, get.translation(`equip${i}`)])
  //         }
  //       }
  //       if (equips.length > 0) {
  //         dialog.add([equips, "tdnodes"])
  //       }
  //       return dialog
  //     },
  //     check(button) {
  //       const player = get.event().player
  //       if (
  //         player.countCards("e") <= 3 &&
  //         _status.currentPhase === player &&
  //         (player.storage.counttrigger?.olchishi || 0) <= 0
  //       ) {
  //         if (
  //           player
  //             .getCards("e")
  //             .slice()
  //             .map((i) => get.subtype(i))
  //             .includes(button.link)
  //         ) {
  //           return 10
  //         }
  //       }
  //       if (
  //         ui.selected.buttons.length >=
  //         Math.max(
  //           ...game.filterPlayer().map((target) => {
  //             let max = 0
  //             if (
  //               get.attitude(player, target) > 0 &&
  //               (target === player || target.hasDisabledSlot())
  //             ) {
  //               max++
  //             }
  //             if (get.recoverEffect(target, player, player) > 0) {
  //               max++
  //             }
  //             if (
  //               target.countCards("h") > 0 &&
  //               target
  //                 .getCards("h", (card) => {
  //                   return lib.filter.cardDiscardable(card, target)
  //                 })
  //                 .reduce((sum, card) => {
  //                   return sum + get.value(card, target)
  //                 }, 0) <=
  //                 get.effect(target, { name: "draw" }, player, player) * 4
  //             ) {
  //               max++
  //             }
  //             return max
  //           }),
  //         )
  //       ) {
  //         return 0
  //       }
  //       return (
  //         [2, 1, 4, 3, 5].indexOf(
  //           parseInt(button.link.slice("equip".length), 10),
  //         ) + 1
  //       )
  //     },
  //     select: [1, 3],
  //     backup(links, player) {
  //       return {
  //         audio: "olweimian",
  //         types: links
  //           .slice()
  //           .sort(
  //             (a, b) =>
  //               parseInt(a.slice("equip".length), 10) -
  //               parseInt(b.slice("equip".length), 10),
  //           ),
  //         filterTarget(card, player, target) {
  //           return true
  //         },
  //         async content(event, trigger, player) {
  //           const target = event.target,
  //             types = lib.skill.olweimian_backup.types
  //           for (const t of types) {
  //             await player.disableEquip(t)
  //           }
  //           const num = Math.min(
  //               target.hasDisabledSlot() + target.isDamaged() + 1,
  //               types.length,
  //             ),
  //             selected = []
  //           while (selected.length < num) {
  //             const result = await target
  //               .chooseButton([
  //                 "慰勉：是否执行其中一项？",
  //                 [
  //                   [
  //                     ["equip", "恢复一个装备栏"],
  //                     ["recover", "回复1点体力"],
  //                     ["discard", "弃置所有手牌，然后摸四张牌"],
  //                   ],
  //                   "textbutton",
  //                 ],
  //               ])
  //               .set("forceAuto", true)
  //               .set("filterButton", (button) => {
  //                 const player = get.event().player
  //                 if (get.event().selected.includes(button.link)) {
  //                   return false
  //                 }
  //                 switch (button.link) {
  //                   case "equip":
  //                     return player.hasDisabledSlot()
  //                   case "recover":
  //                     return player.isDamaged()
  //                   case "discard":
  //                     return true
  //                 }
  //               })
  //               .set("ai", (button) => {
  //                 const player = get.event().player
  //                 switch (button.link) {
  //                   case "equip":
  //                     return 1
  //                   case "recover":
  //                     return get.recoverEffect(player, player, player)
  //                   case "discard":
  //                     return (
  //                       get.effect(player, { name: "draw" }, player, player) *
  //                         4 -
  //                       player
  //                         .getCards("h", (card) => {
  //                           return lib.filter.cardDiscardable(card, player)
  //                         })
  //                         .reduce((sum, card) => {
  //                           return sum + get.value(card, player)
  //                         }, 0)
  //                     )
  //                 }
  //               })
  //               .set("selected", selected)
  //               .forResult()
  //             if (result.bool) {
  //               selected.addArray(result.links)
  //               if (result.links.includes("equip")) {
  //                 await target.chooseToEnable()
  //               }
  //               if (result.links.includes("recover")) {
  //                 await target.recover()
  //               }
  //               if (result.links.includes("discard")) {
  //                 const cards = target.getDiscardableCards(target, "h")
  //                 if (cards.length) {
  //                   await target.discard(cards)
  //                 }
  //                 await target.draw(4)
  //               }
  //             } else {
  //               break
  //             }
  //           }
  //         },
  //         ai1: () => 1,
  //         ai2(target) {
  //           game.log(target)
  //           let max = 0,
  //             player = get.player()
  //           if (
  //             get.attitude(player, target) > 0 &&
  //             (target === player || target.hasDisabledSlot())
  //           ) {
  //             max++
  //           }
  //           if (get.recoverEffect(target, player, player) > 0) {
  //             max++
  //           }
  //           if (
  //             target.countCards("h") > 0 &&
  //             target
  //               .getCards("h", (card) => {
  //                 return lib.filter.cardDiscardable(card, target)
  //               })
  //               .reduce((sum, card) => {
  //                 return sum + get.value(card, target)
  //               }, 0) <=
  //               get.effect(target, { name: "draw" }, player, player) * 4
  //           ) {
  //             max++
  //           }
  //           return max
  //         },
  //       }
  //     },
  //     prompt(links, player) {
  //       const types = links
  //         .slice()
  //         .sort(
  //           (a, b) =>
  //             parseInt(a.slice("equip".length), 10) -
  //             parseInt(b.slice("equip".length), 10),
  //         )
  //       return (
  //         "废除" +
  //         types.map((i) => `${get.translation(i)}栏`).join("、") +
  //         "，令一名角色选择执行等量项"
  //       )
  //     },
  //   },
  //   ai: {
  //     order: 7,
  //     result: { player: 1 },
  //   },
  //   subSkill: {
  //     backup: {},
  //   },
  // },
  // //滕胤
  // gzchenjian: {
  //   audio: "chenjian",
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   content() {
  //     "step 0"
  //     var cards = get.cards(3)
  //     event.cards = cards
  //     player.showCards(cards, `${get.translation(player)}发动了【陈见】`)
  //     ;("step 1")
  //     var list = []
  //     if (
  //       player.countCards("he", (i) => {
  //         return lib.filter.cardDiscardable(i, player, "gzchenjian")
  //       })
  //     ) {
  //       list.push("选项一")
  //     }
  //     if (
  //       event.cards.some((i) => {
  //         return player.hasUseTarget(i)
  //       })
  //     ) {
  //       list.push("选项二")
  //     }
  //     if (list.length === 1) {
  //       event._result = { control: list[0] }
  //     } else if (list.length > 1) {
  //       player
  //         .chooseControl(list)
  //         .set("choiceList", [
  //           "弃置一张牌，然后令一名角色获得与你弃置牌花色相同的牌",
  //           `使用${get.translation(event.cards)}中的一张牌`,
  //         ])
  //         .set("prompt", "陈见：请选择一项")
  //         .set("ai", () => {
  //           const player = _status.event.player,
  //             cards = _status.event.getParent().cards
  //           if (
  //             cards.some((i) => {
  //               return player.getUseValue(i) > 0
  //             })
  //           ) {
  //             return "选项二"
  //           }
  //           return "选项一"
  //         })
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     event.choosed = result.control
  //     if (result.control === "cancel2") {
  //       event.finish()
  //     } else if (result.control === "选项二") {
  //       event.goto(6)
  //     }
  //     ;("step 3")
  //     if (
  //       player.countCards("he", (i) => {
  //         return lib.filter.cardDiscardable(i, player, "chenjian")
  //       })
  //     ) {
  //       player
  //         .chooseToDiscard("he", true)
  //         .set("ai", (card) => {
  //           let evt = _status.event.getParent(),
  //             val = evt.player.countMark("chenjian") < 2 ? 0 : -get.value(card),
  //             suit = get.suit(card)
  //           for (const i of evt.cards) {
  //             if (get.suit(i, false) === suit) {
  //               val += get.value(i, "raw")
  //             }
  //           }
  //           return val
  //         })
  //         .set(
  //           "prompt",
  //           "陈见：请弃置一张牌，然后令一名角色获得" +
  //             get.translation(event.cards) +
  //             "中花色与之相同的牌" +
  //             (event.goon ? "？" : ""),
  //         )
  //     } else if (event.choosed === "选项一") {
  //       event.goto(6)
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 4")
  //     if (result.bool) {
  //       var suit = get.suit(result.cards[0], player)
  //       var cards2 = event.cards.filter((i) => get.suit(i, false) === suit)
  //       if (cards2.length) {
  //         event.cards2 = cards2
  //         player
  //           .chooseTarget(true, `选择一名角色获得${get.translation(cards2)}`)
  //           .set("ai", (target) => {
  //             var att = get.attitude(_status.event.player, target)
  //             if (att > 0) {
  //               return att + Math.max(0, 5 - target.countCards("h"))
  //             }
  //             return att
  //           })
  //       } else {
  //         event.finish()
  //       }
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 5")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       player.line(target, "green")
  //       target.gain(event.cards2, "gain2")
  //     }
  //     event.finish()
  //     ;("step 6")
  //     var cards2 = cards.filter((i) => player.hasUseTarget(i))
  //     if (cards2.length) {
  //       player
  //         .chooseButton(
  //           [
  //             `陈见：${event.goon ? "是否" : "请"}使用其中一张牌${event.goon ? "？" : ""}`,
  //             cards2,
  //           ],
  //           !event.goon,
  //         )
  //         .set("ai", (button) => player.getUseValue(button.link))
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 7")
  //     if (result.bool) {
  //       player.chooseUseTarget(true, result.links[0], false)
  //     }
  //   },
  // },
  // gzxixiu: {
  //   audio: "xixiu",
  //   trigger: {
  //     player: "loseBegin",
  //     target: "useCardToTargeted",
  //   },
  //   filter(event, player) {
  //     if (event.name === "lose") {
  //       if (event.type !== "discard" || event.getlx === false) {
  //         return false
  //       }
  //       if (
  //         event.getParent(2).player === player ||
  //         player.countCards("e") !== 1
  //       ) {
  //         return false
  //       }
  //       return event.cards.includes(player.getCards("e")[0])
  //     }
  //     if (player === event.player || !player.countCards("e")) {
  //       return false
  //     }
  //     var suit = get.suit(event.card, false)
  //     if (suit === "none") {
  //       return false
  //     }
  //     return player.hasCard((card) => get.suit(card, player) === suit, "e")
  //   },
  //   forced: true,
  //   content() {
  //     if (trigger.name === "lose") {
  //       trigger.cards.remove(player.getCards("e")[0])
  //     } else {
  //       player.draw()
  //     }
  //   },
  //   ai: {
  //     effect: {
  //       target_use(card, player, target) {
  //         if (typeof card === "object" && player !== target) {
  //           var suit = get.suit(card)
  //           if (suit === "none") {
  //             return
  //           }
  //           if (
  //             player.hasCard((card) => get.suit(card, player) === suit, "e")
  //           ) {
  //             return [1, 0.08]
  //           }
  //         }
  //       },
  //     },
  //   },
  // },

  // // 威孙权
  // // 斡衡
  // dcwoheng: {
  //   audio: 2,
  //   mark: true,
  //   intro: {
  //     markcount() {
  //       const useCnt = game.getRoundHistory(
  //         "everything",
  //         (evt) => evt.name === "dcwoheng",
  //         0,
  //       ).length
  //       return useCnt + 1
  //     },
  //     content() {
  //       const useCnt = game.getRoundHistory(
  //         "everything",
  //         (evt) => evt.name === "dcwoheng",
  //         0,
  //       ).length
  //       return `令一名其他角色摸${get.cnNumber(useCnt + 1)}张牌或弃置${get.cnNumber(useCnt + 1)}张牌`
  //     },
  //   },
  //   trigger: { player: "damageEnd" },
  //   enable: "phaseUse",
  //   filterTarget: lib.filter.notMe,
  //   prompt() {
  //     const num = game.getRoundHistory(
  //       "everything",
  //       (evt) => evt.name === "dcwoheng",
  //       0,
  //     ).length
  //     return `令一名其他角色摸${get.cnNumber(num + 1)}张牌或弃置${get.cnNumber(num + 1)}张牌`
  //   },
  //   async cost(event, trigger, player) {
  //     const num = game.getRoundHistory(
  //       "everything",
  //       (evt) => evt.name === "dcwoheng",
  //       0,
  //     ).length
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt(event.skill),
  //         `令一名其他角色摸${get.cnNumber(num + 1)}张牌或弃置${get.cnNumber(num + 1)}张牌`,
  //         lib.filter.notMe,
  //       )
  //       .set("ai", (target) => {
  //         const player = get.player()
  //         return get.effect(target, "dcwoheng", player, player)
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const target = event.target || event.targets[0]
  //     const goon = event.getParent(2).name !== "dcyuhui_buff",
  //       useCnt = game.getRoundHistory(
  //         "everything",
  //         (evt) => evt.name === "dcwoheng",
  //         0,
  //       ).length
  //     const num = goon ? useCnt : 1
  //     if (!target?.isIn()) {
  //       return
  //     }
  //     const str1 = `摸${get.cnNumber(num)}张牌`
  //     const str2 = `弃${get.cnNumber(num)}张牌`
  //     const list = [str1]
  //     if (target.countCards("he")) {
  //       list.push(str2)
  //     }
  //     const directcontrol =
  //       str1 ===
  //       (
  //         await player
  //           .chooseControl(list)
  //           .set("ai", () => get.event().choice)
  //           .set(
  //             "choice",
  //             get.effect(target, { name: "draw" }, player, player) *
  //               (() => {
  //                 if (goon && useCnt <= 3) {
  //                   if (
  //                     target.countCards("h") + num ===
  //                     player.countCards("h")
  //                   ) {
  //                     return 100 * num
  //                   }
  //                 }
  //                 return num
  //               })() >
  //               get.effect(target, { name: "guohe_copy2" }, target, player) *
  //                 (() => {
  //                   const numx = Math.min(
  //                     num,
  //                     target.countDiscardableCards(target, "he"),
  //                   )
  //                   if (goon && useCnt <= 3) {
  //                     if (
  //                       target.countCards("h") - numx ===
  //                       player.countCards("h")
  //                     ) {
  //                       return 100 * numx
  //                     }
  //                   }
  //                   return numx
  //                 })()
  //               ? str1
  //               : str2,
  //           )
  //           .set(
  //             "prompt",
  //             `${get.translation("dcwoheng")}：令${get.translation(target)}…`,
  //           )
  //           .forResult()
  //       ).control
  //     if (directcontrol) {
  //       await target.draw(num)
  //     } else {
  //       await target.chooseToDiscard(num, true, "he")
  //     }
  //     if (useCnt > 3 || player.countCards("h") !== target.countCards("h")) {
  //       await player.draw(2)
  //       if (player.hasSkill("dcwoheng", null, null, false)) {
  //         player.tempBanSkill("dcwoheng")
  //       }
  //     }
  //   },
  //   group: "dcwoheng_refresh",
  //   subSkill: {
  //     refresh: {
  //       charlotte: true,
  //       trigger: { global: "roundStart" },
  //       forced: true,
  //       popup: false,
  //       async content(event, trigger, player) {
  //         player.markSkill("dcwoheng")
  //       },
  //     },
  //   },
  //   ai: {
  //     order(item, player) {
  //       const num =
  //         game.getRoundHistory(
  //           "everything",
  //           (evt) => evt.name === "dcwoheng",
  //           0,
  //         ).length + 1
  //       if (
  //         game.hasPlayer((target) => {
  //           if (get.effect(target, { name: "draw" }, player, player) > 0) {
  //             if (target.countCards("h") + num === player.countCards("h")) {
  //               return true
  //             }
  //           }
  //           if (
  //             get.effect(target, { name: "guohe_copy2" }, player, player) > 0
  //           ) {
  //             const numx = Math.min(
  //               num,
  //               target.countDiscardableCards(target, "he"),
  //             )
  //             if (target.countCards("h") - numx === player.countCards("h")) {
  //               return true
  //             }
  //           }
  //           return false
  //         })
  //       ) {
  //         return 100
  //       }
  //       return 7
  //     },
  //     result: {
  //       player(player, target) {
  //         const goon = !get.event()?.getParent()?.name.includes("dcyuhui_buff"),
  //           useCnt = game.getRoundHistory(
  //             "everything",
  //             (evt) => evt.name === "dcwoheng",
  //             0,
  //           ).length
  //         const num = goon ? useCnt + 1 : 1
  //         return Math.max(
  //           get.effect(target, { name: "draw" }, player, player) *
  //             (() => {
  //               if (goon && useCnt < 3) {
  //                 if (target.countCards("h") + num === player.countCards("h")) {
  //                   return 100 * num
  //                 }
  //               }
  //               return num
  //             })(),
  //           get.effect(target, { name: "guohe_copy2" }, target, player) *
  //             (() => {
  //               const numx = Math.min(
  //                 num,
  //                 target.countDiscardableCards(target, "he"),
  //               )
  //               if (goon && useCnt < 3) {
  //                 if (
  //                   target.countCards("h") - numx ===
  //                   player.countCards("h")
  //                 ) {
  //                   return 100 * numx
  //                 }
  //               }
  //               return numx
  //             })(),
  //         )
  //       },
  //     },
  //   },
  // },
  // // 斡衡
  // dcyuhui: {
  //   audio: 2,
  //   trigger: { player: "phaseJieshuBegin" },
  //   filter(event, player) {
  //     return game.hasPlayer((target) => {
  //       if (target === player) {
  //         return false
  //       }
  //       return target.group === "wu"
  //     })
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(get.prompt2(event.skill))
  //       .set("filterTarget", (_, player, target) => {
  //         if (target === player) {
  //           return false
  //         }
  //         return target.group === "wu"
  //       })
  //       .set("ai", (target) => get.attitude(get.player(), target))
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const { targets } = event
  //     for (const target of targets) {
  //       target.addSkill("dcyuhui_buff")
  //       target.markAuto("dcyuhui_buff", [player])
  //     }
  //   },
  //   derivation: "dcwoheng",
  //   subSkill: {
  //     buff: {
  //       charlotte: true,
  //       trigger: { player: "phaseUseBegin" },
  //       getIndex(event, player) {
  //         return player.getStorage("dcyuhui_buff")
  //       },
  //       async cost(event, trigger, player) {
  //         const target = event.indexedData
  //         player.unmarkAuto("dcyuhui_buff", [target])
  //         if (!player.getStorage("dcyuhui_buff").length) {
  //           player.removeSkill("dcyuhui_buff")
  //         }
  //         if (
  //           !target?.isIn() ||
  //           !game.hasPlayer((target) => target !== player)
  //         ) {
  //           event.result = { bool: false }
  //           return
  //         }
  //         const list = ["dcyuhui_buff", target]
  //         event.result = await player
  //           .chooseToGive(
  //             target,
  //             (card) => {
  //               return get.color(card) === "red" && get.type(card) === "basic"
  //             },
  //             "he",
  //             get.prompt(...list),
  //           )
  //           .set("ai", (card) => {
  //             const player = get.player()
  //             if (
  //               get.attitude(player, get.event().getParent().indexedData) < 0
  //             ) {
  //               return 0
  //             }
  //             return (
  //               Math.max(
  //                 ...game
  //                   .filterPlayer((target) => target !== player)
  //                   .map((target) => {
  //                     return get.effect(target, "dcwoheng", player, player)
  //                   }),
  //               ) - get.value(card)
  //             )
  //           })
  //           .set(
  //             "prompt2",
  //             `交给${get.translation(target)}一张红色基本牌，发动一次X为1的〖斡衡〗`,
  //           )
  //           .set("logSkill", list)
  //           .forResult()
  //       },
  //       popup: false,
  //       async content(event, trigger, player) {
  //         const result = await player
  //           .chooseTarget(
  //             get.prompt("dcwoheng"),
  //             `令一名其他角色摸一张牌或弃置一张牌`,
  //             lib.filter.notMe,
  //           )
  //           .set("ai", (target) => {
  //             const player = get.player()
  //             return get.effect(target, "dcwoheng", player, player)
  //           })
  //           .forResult()
  //         if (result?.bool && result.targets?.length) {
  //           await player.useSkill("dcwoheng", result.targets)
  //         }
  //       },
  //       intro: {
  //         content:
  //           "出牌阶段开始时，你可以交给$一张红色基本牌，发动一次X为1的〖斡衡〗",
  //       },
  //     },
  //   },
  // }, //陆逊
  // sbqianxun: {
  //   audio: 2,
  //   trigger: {
  //     target: "useCardToBegin",
  //     player: "judgeBefore",
  //   },
  //   filter(event, player) {
  //     if (
  //       !event.card ||
  //       player
  //         .getStorage("sbqianxun")
  //         .includes(event.card.viewAs || event.card.name)
  //     ) {
  //       return false
  //     }
  //     if (event.getParent().name === "phaseJudge") {
  //       return true
  //     }
  //     if (event.name === "judge") {
  //       return false
  //     }
  //     if (get.type(event.card) === "trick" && event.player !== player) {
  //       return true
  //     }
  //   },
  //   forced: true,
  //   locked: false,
  //   async content(event, trigger, player) {
  //     player.markAuto("sbqianxun", [trigger.card.viewAs || trigger.card.name])
  //     if (player.countCards("he")) {
  //       const num = Math.min(5, player.getStorage("sbqianxun").length)
  //       const result = await player
  //         .chooseCard(
  //           get.prompt(event.name),
  //           `将至多${get.cnNumber(num)}张牌置于武将牌上`,
  //           "he",
  //           [1, num],
  //         )
  //         .set("ai", (card) => 4 - get.value(card))
  //         .forResult()
  //       if (result.bool) {
  //         player
  //           .addToExpansion(result.cards, "giveAuto", player)
  //           .gaintag.add("sbqianxun_gain")
  //         player.addSkill("sbqianxun_gain")
  //       }
  //     }
  //   },
  //   onremove: true,
  //   intro: {
  //     content: "已记录牌名：$",
  //   },
  //   group: "sbqianxun_use",
  //   subSkill: {
  //     use: {
  //       audio: "sbqianxun",
  //       trigger: {
  //         player: "phaseUseBegin",
  //       },
  //       filter(event, player) {
  //         return player.getStorage("sbqianxun").some((name) => {
  //           if (get.type(name) !== "trick") {
  //             return false
  //           }
  //           return player.hasUseTarget(name)
  //         })
  //       },
  //       async cost(event, trigger, player) {
  //         const list = player
  //           .getStorage("sbqianxun")
  //           .map((name) => ["锦囊", "", name])
  //         const result = await player
  //           .chooseButton([
  //             get.prompt(event.skill),
  //             "移去一个记录的牌名，若为普通锦囊牌则可以视为使用之",
  //             [list, "vcard"],
  //           ])
  //           .set("ai", (button) => {
  //             const player = get.player()
  //             const card = { name: button.link[2], isCard: true }
  //             return player.getUseValue(card)
  //           })
  //           .set("filterButton", (button) => true)
  //           .forResult()
  //         event.result = {
  //           bool: result.bool,
  //           cost_data: result.bool ? result.links[0][2] : [],
  //         }
  //       },
  //       async content(event, trigger, player) {
  //         const name = event.cost_data
  //         player.unmarkAuto("sbqianxun", [name])
  //         const card = { name: name, isCard: true }
  //         if (get.type(card) === "trick" && player.hasUseTarget(card)) {
  //           await player.chooseUseTarget(
  //             card,
  //             `是否视为使用【${get.translation(name)}】？`,
  //           )
  //         }
  //       },
  //     },
  //     gain: {
  //       trigger: {
  //         global: "phaseEnd",
  //       },
  //       forced: true,
  //       charlotte: true,
  //       async content(event, trigger, player) {
  //         var cards = player.getExpansions("sbqianxun_gain")
  //         if (cards.length) {
  //           await player.gain(cards, "draw")
  //         }
  //         player.removeSkill("sbqianxun_gain")
  //       },
  //       intro: {
  //         mark(dialog, storage, player) {
  //           var cards = player.getExpansions("sbqianxun_gain")
  //           if (player.isUnderControl(true)) {
  //             dialog.addAuto(cards)
  //           } else {
  //             return `共有${get.cnNumber(cards.length)}张牌`
  //           }
  //         },
  //         markcount: "expansion",
  //       },
  //     },
  //   },
  // },
  // sblianying: {
  //   audio: 2,
  //   trigger: { global: "phaseEnd" },
  //   filter(event, player) {
  //     return event.player !== player
  //   },
  //   frequent: true,
  //   async content(event, trigger, player) {
  //     let num = 0
  //     player.getHistory("lose", (evt) => {
  //       if (evt.cards2) {
  //         num += evt.cards2.length
  //       }
  //     })
  //     num = Math.min(5, num)
  //     const cards = get.cards(num)
  //     await game.cardsGotoOrdering(cards)
  //     if (!cards.length) {
  //       return
  //     }
  //     do {
  //       const result =
  //         cards.length > 1
  //           ? await player
  //               .chooseButtonTarget({
  //                 createDialog: [`连营：请选择要分配的牌和目标`, cards],
  //                 forced: true,
  //                 allowChooseAll: true,
  //                 selectButton: [1, Infinity],
  //                 cardsx: cards,
  //                 ai1(button) {
  //                   return get.value(button.link)
  //                 },
  //                 ai2(target) {
  //                   const player = get.player()
  //                   const card = ui.selected.buttons[0].link
  //                   if (card) {
  //                     return (
  //                       get.value(card, target) * get.attitude(player, target)
  //                     )
  //                   }
  //                   return 1
  //                 },
  //               })
  //               .forResult()
  //           : await player
  //               .chooseTarget(`选择一名角色获得${get.translation(cards)}`, true)
  //               .set("ai", (target) => {
  //                 const att = get.attitude(_status.event.player, target)
  //                 if (_status.event.enemy) {
  //                   return -att
  //                 }
  //                 if (att > 0) {
  //                   return att / (1 + target.countCards("h"))
  //                 }
  //                 return att / 100
  //               })
  //               .set("enemy", get.value(cards[0], player, "raw") < 0)
  //               .forResult()
  //       if (result?.bool) {
  //         if (!result.links?.length) {
  //           result.links = cards.slice(0)
  //         }
  //         cards.removeArray(result.links)
  //         player.line(result.targets, "green")
  //         const gainEvent = result.targets[0].gain(result.links, "draw")
  //         gainEvent.giver = player
  //         await gainEvent
  //       }
  //     } while (cards.length > 0)
  //   },
  // },
  // //滕胤
  // chenjian: {
  //   audio: 2,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   prompt2(event, player) {
  //     return (
  //       "亮出牌堆顶的" +
  //       get.cnNumber(3 + player.countMark("chenjian")) +
  //       "张牌，然后执行以下一至两项：⒈弃置一张牌，然后令一名角色获得与你弃置牌花色相同的牌。⒉使用其中剩余的一张牌。若你执行了所有选项，则你获得一枚“陈见”并重铸所有手牌"
  //     )
  //   },
  //   async content(event, trigger, player) {
  //     const cards = get.cards(3 + player.countMark("chenjian"))
  //     event.cards = cards
  //     await player.showCards(cards, `${get.translation(player)}发动了【陈见】`)

  //     const list = []
  //     if (
  //       player.countCards("he", (i) => {
  //         return lib.filter.cardDiscardable(i, player, "chenjian")
  //       })
  //     ) {
  //       list.push("选项一")
  //     }
  //     if (
  //       event.cards.some((i) => {
  //         return player.hasUseTarget(i)
  //       })
  //     ) {
  //       list.push("选项二")
  //     }

  //     let control
  //     if (list.length === 1) {
  //       control = list[0]
  //     } else if (list.length > 1) {
  //       const result = await player
  //         .chooseControl(list)
  //         .set("choiceList", [
  //           "弃置一张牌，然后令一名角色获得与你弃置牌花色相同的牌",
  //           `使用${get.translation(event.cards)}中的一张牌`,
  //         ])
  //         .set("prompt", "陈见：请选择一项")
  //         .set("ai", () => {
  //           const player = _status.event.player,
  //             cards = _status.event.getParent().cards
  //           if (
  //             cards.some((i) => {
  //               return player.getUseValue(i) > 0
  //             })
  //           ) {
  //             return "选项二"
  //           }
  //           return "选项一"
  //         })
  //         .forResult()
  //       control = result.control
  //     } else {
  //       return
  //     }

  //     let goon = 0
  //     const choosed = control
  //     if (choosed === "cancel2") {
  //       return
  //     }

  //     let step = choosed === "选项二" ? 6 : 3
  //     let shouldEnd = false
  //     while (true) {
  //       if (step === 3) {
  //         if (
  //           player.countCards("he", (i) => {
  //             return lib.filter.cardDiscardable(i, player, "chenjian")
  //           })
  //         ) {
  //           const result = await player
  //             .chooseToDiscard("he", !goon)
  //             .set("ai", (card) => {
  //               let evt = _status.event.getParent(),
  //                 val =
  //                   goon && evt.player.countMark("chenjian") < 2
  //                     ? 0
  //                     : -get.value(card),
  //                 suit = get.suit(card)
  //               for (const i of evt.cards) {
  //                 if (get.suit(i, false) === suit) {
  //                   val += get.value(i, "raw")
  //                 }
  //               }
  //               return val
  //             })
  //             .set(
  //               "prompt",
  //               "陈见：" +
  //                 (goon ? "是否" : "请") +
  //                 "弃置一张牌，然后令一名角色获得" +
  //                 get.translation(event.cards) +
  //                 "中花色与之相同的牌" +
  //                 (goon ? "？" : ""),
  //             )
  //             .forResult()
  //           if (!result.bool) {
  //             return
  //           }

  //           goon++
  //           const suit = get.suit(result.cards[0], player)
  //           const cards2 = event.cards.filter(
  //             (i) => get.suit(i, false) === suit,
  //           )
  //           if (cards2.length) {
  //             const targetResult = await player
  //               .chooseTarget(
  //                 true,
  //                 `选择一名角色获得${get.translation(cards2)}`,
  //               )
  //               .set("ai", (target) => {
  //                 const att = get.attitude(_status.event.player, target)
  //                 if (att > 0) {
  //                   return att + Math.max(0, 5 - target.countCards("h"))
  //                 }
  //                 return att
  //               })
  //               .forResult()
  //             if (targetResult.bool) {
  //               const target = targetResult.targets[0]
  //               player.line(target, "green")
  //               await target.gain(cards2, "gain2")
  //               event.cards.removeArray(cards2)
  //             }
  //             if (choosed === "选项二") {
  //               shouldEnd = true
  //               break
  //             }
  //             step = 6
  //             continue
  //           }
  //           if (choosed === "选项一") {
  //             step = 6
  //             continue
  //           }
  //           shouldEnd = true
  //           break
  //         }
  //         if (choosed === "选项一") {
  //           step = 6
  //           continue
  //         }
  //         return
  //       }

  //       const cards2 = cards.filter((i) => player.hasUseTarget(i))
  //       if (cards2.length) {
  //         const result = await player
  //           .chooseButton(
  //             [
  //               `陈见：${goon ? "是否" : "请"}使用其中一张牌${goon ? "？" : ""}`,
  //               cards2,
  //             ],
  //             !goon,
  //           )
  //           .set("ai", (button) => player.getUseValue(button.link))
  //           .forResult()
  //         if (!result.bool) {
  //           return
  //         }

  //         await player.chooseUseTarget(true, result.links[0], false)
  //         event.cards.removeArray(result.links)
  //         goon += 2
  //         if (choosed === "选项二") {
  //           step = 3
  //           continue
  //         }
  //         shouldEnd = true
  //         break
  //       }

  //       if (choosed === "选项二") {
  //         step = 3
  //         continue
  //       }
  //       return
  //     }

  //     if (shouldEnd && goon > 2) {
  //       if (player.countMark("chenjian") < 2) {
  //         player.addMark("chenjian", 1, false)
  //       }
  //       await player.recast(player.getCards("h", lib.filter.cardRecastable))
  //     }
  //   },
  //   marktext: "见",
  //   intro: { content: "展示牌数量+#" },
  // },
  // xixiu: {
  //   mod: {
  //     canBeDiscarded(card, player, target) {
  //       if (
  //         player !== target &&
  //         get.position(card) === "e" &&
  //         target.countCards("e") === 1
  //       ) {
  //         return false
  //       }
  //     },
  //   },
  //   audio: 2,
  //   trigger: { target: "useCardToTargeted" },
  //   forced: true,
  //   filter(event, player) {
  //     if (player === event.player || !player.countCards("e")) {
  //       return false
  //     }
  //     var suit = get.suit(event.card, false)
  //     if (suit === "none") {
  //       return false
  //     }
  //     return player.hasCard((card) => get.suit(card, player) === suit, "e")
  //   },
  //   async content(event, trigger, player) {
  //     player.draw()
  //   },
  //   ai: {
  //     effect: {
  //       target_use(card, player, target) {
  //         if (typeof card === "object" && player !== target) {
  //           var suit = get.suit(card)
  //           if (suit === "none") {
  //             return
  //           }
  //           if (
  //             player.hasCard((card) => get.suit(card, player) === suit, "e")
  //           ) {
  //             return [1, 0.08]
  //           }
  //         }
  //       },
  //     },
  //   },
  // },

  // refenyin: {
  //   audio: 2,
  //   audioname: ["wufan"],
  //   trigger: {
  //     global: [
  //       "loseAfter",
  //       "cardsDiscardAfter",
  //       "loseAsyncAfter",
  //       "equipAfter",
  //     ],
  //   },
  //   forced: true,
  //   filter(event, player) {
  //     if (player !== _status.currentPhase) {
  //       return false
  //     }
  //     var cards = event.getd()
  //     if (!cards.length) {
  //       return false
  //     }
  //     var list = []
  //     var num = cards.length
  //     for (var i = 0; i < cards.length; i++) {
  //       var card = cards[i]
  //       list.add(get.suit(card, false))
  //     }
  //     game.getGlobalHistory("cardMove", (evt) => {
  //       if (evt.name !== "lose" && evt.name !== "cardsDiscard") {
  //         return false
  //       }
  //       if (evt.name === "lose" && evt.position !== ui.discardPile) {
  //         return false
  //       }
  //       if (evt === event || evt.getParent() === event) {
  //         return false
  //       }
  //       num += evt.cards.length
  //       for (var i = 0; i < evt.cards.length; i++) {
  //         var card = evt.cards[i]
  //         list.remove(
  //           get.suit(card, evt.cards2?.includes(card) ? evt.player : false),
  //         )
  //       }
  //     })
  //     player.storage.refenyin_mark2 = num
  //     return list.length > 0
  //   },
  //   content() {
  //     var list = []
  //     var list2 = []
  //     var cards = trigger.getd()
  //     for (var i = 0; i < cards.length; i++) {
  //       var card = cards[i]
  //       var suit = get.suit(card, false)
  //       list.add(suit)
  //       list2.add(suit)
  //     }
  //     game.getGlobalHistory("cardMove", (evt) => {
  //       if (evt.name !== "lose" && evt.name !== "cardsDiscard") {
  //         return false
  //       }
  //       if (evt.name === "lose" && evt.position !== ui.discardPile) {
  //         return false
  //       }
  //       if (evt === trigger || evt.getParent() === trigger) {
  //         return false
  //       }
  //       for (var i = 0; i < evt.cards.length; i++) {
  //         var card = evt.cards[i]
  //         var suit = get.suit(card, false)
  //         list.remove(suit)
  //         list2.add(suit)
  //       }
  //     })
  //     list2.sort()
  //     player.draw(list.length)
  //     player.storage.refenyin_mark = list2
  //     player.addTempSkill("refenyin_mark")
  //     player.markSkill("refenyin_mark")
  //   },
  //   subSkill: {
  //     mark: {
  //       charlotte: true,
  //       onremove(player) {
  //         delete player.storage.refenyin_mark
  //         delete player.storage.refenyin_mark2
  //       },
  //       intro: {
  //         content(s, p) {
  //           var str = "本回合已经进入过弃牌堆的卡牌的花色："
  //           for (var i = 0; i < s.length; i++) {
  //             str += get.translation(s[i])
  //           }
  //           str += "<br>本回合进入过弃牌堆的牌数："
  //           str += p.storage.refenyin_mark2
  //           return str
  //         },
  //       },
  //     },
  //   },
  // },
  // liji: {
  //   enable: "phaseUse",
  //   usable(skill, player) {
  //     return get.event().liji_num
  //   },
  //   audio: 2,
  //   onChooseToUse(event) {
  //     if (game.online) {
  //       return
  //     }
  //     var num = 0
  //     var evt2 = event.getParent()
  //     if (!evt2.liji_all) {
  //       evt2.liji_all = game.players.length > 4 ? 8 : 4
  //     }
  //     game.getGlobalHistory("cardMove", (evt) => {
  //       if (
  //         evt.name === "cardsDiscard" ||
  //         (evt.name === "lose" && evt.position === ui.discardPile)
  //       ) {
  //         num += evt.cards.length
  //       }
  //     })
  //     event.set("liji_num", Math.floor(num / evt2.liji_all))
  //   },
  //   filterCard: true,
  //   position: "he",
  //   check(card) {
  //     var val = get.value(card)
  //     if (
  //       !_status.event.player
  //         .getStorage("refenyin_mark")
  //         .includes(get.suit(card))
  //     ) {
  //       return 12 - val
  //     }
  //     return 8 - val
  //   },
  //   filterTarget: lib.filter.notMe,
  //   content() {
  //     target.damage("nocard")
  //   },
  //   ai: {
  //     order: 1,
  //     result: {
  //       target: -1.5,
  //     },
  //     tag: {
  //       damage: 1,
  //     },
  //   },
  // },
  // //骆统
  // renzheng: {
  //   audio: 2,
  //   trigger: { global: ["damageCancelled", "damageZero", "damageAfter"] },
  //   forced: true,
  //   filter(event, player, name) {
  //     if (name === "damageCancelled") {
  //       return true
  //     }
  //     for (var i of event.change_history) {
  //       if (i < 0) {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   content() {
  //     player.draw(2)
  //   },
  // },
  // jinjian: {
  //   audio: 2,
  //   trigger: { source: "damageBegin1" },
  //   logTarget: "player",
  //   filter(event, player) {
  //     return !event.jinjian_source2 && !player.hasSkill("jinjian_source2")
  //   },
  //   prompt2: "令即将对其造成的伤害+1",
  //   check(event, player) {
  //     return (
  //       get.attitude(player, event.player) < 0 &&
  //       !event.player.hasSkillTag("filterDamage", null, {
  //         player: player,
  //         card: event.card,
  //       })
  //     )
  //   },
  //   content() {
  //     trigger.jinjian_source = true
  //     trigger.num++
  //     player.addTempSkill("jinjian_source2")
  //   },
  //   group: "jinjian_player",
  //   subSkill: {
  //     player: {
  //       audio: "jinjian",
  //       trigger: { player: "damageBegin4" },
  //       filter(event, player) {
  //         return !event.jinjian_player2 && !player.hasSkill("jinjian_player2")
  //       },
  //       prompt2: "令即将受到的伤害-1",
  //       content() {
  //         trigger.jinjian_player = true
  //         trigger.num--
  //         player.addTempSkill("jinjian_player2")
  //       },
  //     },
  //     source2: {
  //       trigger: { source: "damageBegin1" },
  //       forced: true,
  //       charlotte: true,
  //       filter(event, player) {
  //         return !event.jinjian_source
  //       },
  //       content() {
  //         trigger.num--
  //         trigger.jinjian_source2 = true
  //         player.removeSkill("jinjian_source2")
  //       },
  //       marktext: " -1 ",
  //       intro: {
  //         content: "下次造成的伤害-1",
  //       },
  //     },
  //     player2: {
  //       trigger: { player: "damageBegin3" },
  //       forced: true,
  //       charlotte: true,
  //       filter(event, player) {
  //         return !event.jinjian_player
  //       },
  //       content() {
  //         trigger.num++
  //         trigger.jinjian_player2 = true
  //         player.removeSkill("jinjian_player2")
  //       },
  //       marktext: " +1 ",
  //       intro: {
  //         content: "下次受到的伤害+1",
  //       },
  //     },
  //   },
  //   ai: {
  //     maixie_defend: true,
  //     threaten: 0.9,
  //     effect: {
  //       target(card, player, target) {
  //         if (player.hasSkillTag("jueqing", false, target)) {
  //           return
  //         }
  //         //if(target.hujia) return;
  //         if (player._jinjian_tmp) {
  //           return
  //         }
  //         if (
  //           _status.event.getParent("useCard", true) ||
  //           _status.event.getParent("_wuxie", true)
  //         ) {
  //           return
  //         }
  //         if (get.tag(card, "damage")) {
  //           if (target.hasSkill("jinjian_player2")) {
  //             return [1, -2]
  //           }
  //           if (get.attitude(player, target) > 0) {
  //             return [0, 0.2]
  //           }
  //           if (
  //             get.attitude(player, target) < 0 &&
  //             !player.hasSkillTag("damageBonus")
  //           ) {
  //             var sha = player.getCardUsable({ name: "sha" })
  //             player._jinjian_tmp = true
  //             var num = player.countCards("h", (card) => {
  //               if (card.name === "sha") {
  //                 if (sha === 0) {
  //                   return false
  //                 }
  //                 sha--
  //               }
  //               return (
  //                 get.tag(card, "damage") &&
  //                 player.canUse(card, target) &&
  //                 get.effect(target, card, player, player) > 0
  //               )
  //             })
  //             delete player._jinjian_tmp
  //             if (player.hasSkillTag("damage")) {
  //               num++
  //             }
  //             if (num < 2) {
  //               return [0, 0.8]
  //             }
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // //滕芳兰
  // dcluochong: {
  //   audio: 2,
  //   trigger: { global: "roundStart" },
  //   filter(event, player) {
  //     return game.hasPlayer(
  //       (current) => current.countDiscardableCards(player, "hej") > 0,
  //     )
  //   },
  //   direct: true,
  //   async content(event, trigger, player) {
  //     if (_status.connectMode) {
  //       game.broadcastAll(() => {
  //         _status.noclearcountdown = true
  //       })
  //     }
  //     const lose_list = []
  //     let num = 4 - player.countMark("dcluochong")
  //     let log = false
  //     while (num > 0) {
  //       const result = await player
  //         .chooseTarget(
  //           get.prompt("dcluochong"),
  //           `弃置任意名角色区域内的累计至多${num}张牌`,
  //           (card, player, target) => {
  //             return target.hasCard((card) => {
  //               return lib.filter.canBeDiscarded(
  //                 card,
  //                 player,
  //                 target,
  //                 "dcluochong",
  //               )
  //             }, "hej")
  //           },
  //         )
  //         .set("ai", (target) => {
  //           const player = _status.event.player,
  //             discarded = _status.event.lose_list.find(
  //               (item) => item[0] === target,
  //             )
  //           if (discarded) {
  //             if (target === player) {
  //               return 0
  //             }
  //             const num = discarded[1].length
  //             if (num > 1 && player.hp + player.hujia > 2) {
  //               return 0
  //             }
  //           }
  //           if (target === player) {
  //             if (
  //               ui.cardPile.childNodes.length > 80 &&
  //               player.hasCard((card) => get.value(card) < 8)
  //             ) {
  //               return 20
  //             }
  //             return 0
  //           }
  //           return get.effect(target, { name: "guohe_copy2" }, player, player)
  //         })
  //         .set("lose_list", lose_list)
  //         .forResult()
  //       if (result.bool) {
  //         if (!log) {
  //           player.logSkill("dcluochong")
  //           log = true
  //         }
  //         const target = result.targets[0]
  //         const { cards } = await player
  //           .choosePlayerCard(
  //             target,
  //             true,
  //             "hej",
  //             [1, num],
  //             `选择弃置${get.translation(target)}区域内的牌`,
  //             "allowChooseAll",
  //           )
  //           .set("filterButton", (button) => {
  //             const card = button.link,
  //               target = _status.event.target,
  //               player = get.player()
  //             return lib.filter.canBeDiscarded(
  //               card,
  //               player,
  //               target,
  //               "dcluochong",
  //             )
  //           })
  //           .set("lose_list", lose_list)
  //           .set("ai", (button) => {
  //             if (ui.selected.buttons.length > 0) {
  //               return false
  //             }
  //             var val = get.buttonValue(button)
  //             if (
  //               get.attitude(_status.event.player, _status.event.target) > 0
  //             ) {
  //               return -val
  //             }
  //             return val
  //           })
  //           .forResult()
  //         num -= cards.length
  //         const index = lose_list.find((item) => item[0] === target)
  //         if (!index) {
  //           lose_list.push([target, cards])
  //         } else {
  //           index[1].addArray(cards)
  //         }
  //         await target.modedDiscard(cards, player)
  //       } else {
  //         break
  //       }
  //     }
  //     if (_status.connectMode) {
  //       game.broadcastAll(() => {
  //         delete _status.noclearcountdown
  //         game.stopCountChoose()
  //       })
  //     }
  //     if (lose_list.length > 0 && lose_list.some((i) => i[1].length > 2)) {
  //       game.log(player, "可弃置牌数", "#g-1")
  //       player.addMark("dcluochong", 1, false)
  //     }
  //   },
  //   ai: {
  //     threaten: 2.5,
  //     effect: {
  //       target(card, player, target, current) {
  //         if (get.type(card) === "delay" && current < 0) {
  //           var current2 = _status.currentPhase
  //           if (current2 && current2.getSeatNum() > target.getSeatNum()) {
  //             return 0.1
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // dcaichen: {
  //   audio: 2,
  //   init(player) {
  //     game.addGlobalSkill("dcaichen_hit")
  //   },
  //   onremove(player) {
  //     if (
  //       !game.hasPlayer(
  //         (current) => current.hasSkill("dcaichen", null, null, false),
  //         true,
  //       )
  //     ) {
  //       game.removeGlobalSkill("dcaichen_hit")
  //     }
  //   },
  //   trigger: {
  //     player: ["loseAfter", "phaseDiscardBefore"],
  //     target: "useCardToTargeted",
  //   },
  //   filter(event, player, name) {
  //     if (event.name === "phaseDiscard") {
  //       return ui.cardPile.childNodes.length > 40
  //     }
  //     if (name === "useCardToTargeted") {
  //       return (
  //         ui.cardPile.childNodes.length < 40 && get.suit(event.card) === "spade"
  //       )
  //     }
  //     const evt = event.getParent(2)
  //     if (
  //       evt.name !== "dcluochong" ||
  //       evt.player !== player ||
  //       player.hasHistory(
  //         "lose",
  //         (evtx) =>
  //           evtx.getParent("dcluochong", true) === evt && evtx !== event,
  //       )
  //     ) {
  //       return false
  //     }
  //     if (!event.getl(player).cards.length) {
  //       return false
  //     }
  //     return ui.cardPile.childNodes.length > 80
  //   },
  //   forced: true,
  //   content() {
  //     if (trigger.name.indexOf("lose") === 0) {
  //       player.draw(2)
  //     } else if (trigger.name === "phaseDiscard") {
  //       trigger.cancel()
  //       game.log(player, "跳过了弃牌阶段")
  //     } else {
  //       trigger.directHit.add(player)
  //       game.log(player, "不可响应", trigger.card)
  //     }
  //   },
  //   subSkill: {
  //     hit: {
  //       trigger: { player: "dieAfter" },
  //       filter(event, player) {
  //         return !game.hasPlayer(
  //           (current) => current.hasSkill("dcaichen", null, null, false),
  //           true,
  //         )
  //       },
  //       silent: true,
  //       forceDie: true,
  //       content() {
  //         game.removeGlobalSkill("dcaichen_hit")
  //       },
  //       ai: {
  //         directHit_ai: true,
  //         skillTagFilter(player, tag, arg) {
  //           return (
  //             arg?.card &&
  //             arg.target?.hasSkill("dcaichen") &&
  //             ui.cardPile.childNodes.length < 40 &&
  //             get.suit(arg.card) === "spade"
  //           )
  //         },
  //       },
  //     },
  //   },
  // },
  // //凌操
  // dcdufeng: {
  //   audio: 2,
  //   trigger: { player: "phaseUseBegin" },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     const result = await player
  //       .chooseButton(
  //         [
  //           `${get.translation(event.name)}：请选择你要执行的选项`,
  //           `<div class="text center">${lib.translate[`${event.name}_info`]}</div>`,
  //           [
  //             [
  //               "失去体力",
  //               ...Array.from({ length: 5 })
  //                 .map((_, i) => {
  //                   const sub = `equip${(i + 1).toString()}`
  //                   return [sub, get.translation(sub)]
  //                 })
  //                 .filter((sub) => player.hasEnabledSlot(sub[0])),
  //             ],
  //             "tdnodes",
  //           ],
  //         ],
  //         [1, 2],
  //         true,
  //       )
  //       .set("filterButton", (button) => {
  //         if (!ui.selected.buttons.length) {
  //           return true
  //         }
  //         return (
  //           (button.link === "失去体力") !==
  //           (ui.selected.buttons[0].link === "失去体力")
  //         )
  //       })
  //       .set("ai", (button) => {
  //         const player = get.player(),
  //           choice = button.link
  //         const list = Array.from({ length: 5 })
  //           .map((_, i) => `equip${(i + 1).toString()}`)
  //           .filter((sub) => player.hasEnabledSlot(sub))
  //         if (player.getHp() <= 2 && list.length > 1) {
  //           list.remove("失去体力")
  //         }
  //         const listx = list.filter(
  //           (subtype) =>
  //             subtype !== "失去体力" && !player.getEquips(subtype).length,
  //         )
  //         return choice === (listx.length ? listx : list).randomGet() ? 10 : 0
  //       })
  //       .forResult()
  //     if (!result?.links?.length) {
  //       return
  //     }
  //     if (result.links.includes("失去体力")) {
  //       await player.loseHp()
  //     }
  //     if (result.links.some((sub) => sub !== "失去体力")) {
  //       await player.disableEquip(
  //         result.links.filter((sub) => sub !== "失去体力")[0],
  //       )
  //     }
  //     if (!player.isIn()) {
  //       return
  //     }
  //     const num = Math.min(
  //       player.countDisabled() + player.getDamagedHp(),
  //       player.maxHp,
  //     )
  //     if (num) {
  //       await player.draw(num)
  //       player.addTempSkill("dcdufeng_effect")
  //       player.addMark("dcdufeng_effect", num, false)
  //     }
  //   },
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       onremove: true,
  //       intro: { content: "本回合攻击范围与使用【杀】的次数上限均为#" },
  //       mod: {
  //         attackRangeBase(player, num) {
  //           return player.countMark("dcdufeng_effect")
  //         },
  //         cardUsable(card, player, num) {
  //           if (card.name === "sha") {
  //             return player.countMark("dcdufeng_effect")
  //           }
  //         },
  //       },
  //     },
  //   },
  // },

  // songshu: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     return player.countCards("h") > 0
  //   },
  //   filterTarget(card, player, target) {
  //     return target !== player && player.canCompare(target)
  //   },
  //   content() {
  //     "step 0"
  //     player
  //       .chooseToCompare(target)
  //       .set("small", get.attitude(player, target) > 0)
  //     ;("step 1")
  //     if (!result.bool) {
  //       player.draw(2, "nodelay")
  //       target.draw(2)
  //       player.tempBanSkill("songshu", "phaseUseAfter")
  //     } else {
  //       target.addTempSkill("songshu_ai")
  //     }
  //   },
  //   ai: {
  //     basic: {
  //       order: 1,
  //     },
  //     expose: 0.2,
  //     result: {
  //       target(player, target) {
  //         if (target.hasSkill("songshu_ai", null, null, false)) {
  //           return 0
  //         }
  //         var maxnum = 0
  //         var cards2 = target.getCards("h")
  //         for (var i = 0; i < cards2.length; i++) {
  //           if (get.number(cards2[i]) > maxnum) {
  //             maxnum = get.number(cards2[i])
  //           }
  //         }
  //         if (maxnum > 10) {
  //           maxnum = 10
  //         }
  //         if (maxnum < 5 && cards2.length > 1) {
  //           maxnum = 5
  //         }
  //         var cards = player.getCards("h")
  //         for (var i = 0; i < cards.length; i++) {
  //           if (get.number(cards[i]) < maxnum) {
  //             return 1
  //           }
  //         }
  //         return 0
  //       },
  //     },
  //   },
  // },
  // songshu_ai: { charlotte: true },
  // sibian: {
  //   audio: 2,
  //   trigger: { player: "phaseDrawBegin1" },
  //   filter(event, player) {
  //     return !event.numFixed
  //   },
  //   content() {
  //     "step 0"
  //     trigger.changeToZero()
  //     event.cards = get.cards(4)
  //     game.cardsGotoOrdering(event.cards)
  //     player.showCards(event.cards)
  //     ;("step 1")
  //     cards.sort((a, b) => b.number - a.number)
  //     var gains = []
  //     var mx = [cards[0].number, cards[3].number]
  //     for (var i = 0; i < cards.length; i++) {
  //       if (mx.includes(cards[i].number)) {
  //         gains.addArray(cards.splice(i--, 1))
  //       }
  //     }
  //     player.gain(gains, "gain2")
  //     if (cards.length > 0) {
  //       player
  //         .chooseTarget(
  //           `是否令一名手牌数最少的角色获得${get.translation(cards)}`,
  //           (card, player, target) => target.isMinHandcard(),
  //         )
  //         .set("ai", (target) => get.attitude(_status.event.player, target))
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       player.line(target)
  //       player.addExpose(0.2)
  //       target.gain(cards, "gain2")
  //     }
  //   },
  // },

  // //屈晃
  // olqiejian: {
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
  //   getIndex(event, player) {
  //     return game
  //       .filterPlayer((current) => {
  //         if (current.countCards("h")) {
  //           return false
  //         }
  //         const evt = event.getl(current)
  //         return (
  //           evt?.hs?.length &&
  //           !player.getStorage("olqiejian_ban").includes(current)
  //         )
  //       })
  //       .sortBySeat(_status.currentPhase)
  //   },
  //   filter: (event, player, name, target) => target?.isIn(),
  //   logTarget: (event, player, name, target) => target,
  //   check: (event, player, name, target) =>
  //     get.attitude(player, target) > 0 ||
  //     target.hasCard((card) => {
  //       return get.value(card, target) * get.sgnAttitude(player, target) < -6
  //     }, "ej"),
  //   async content(event, trigger, player) {
  //     const {
  //       targets: [target],
  //     } = event
  //     await player.draw("nodelay")
  //     await target.draw()
  //     const targets = [player, target].filter((i) =>
  //       i.countDiscardableCards(player, "ej"),
  //     )
  //     const result = !targets.length
  //       ? { bool: false, targets: [] }
  //       : await player
  //           .chooseTarget(
  //             "切谏：选择一名角色",
  //             `弃置你或${get.translation(target)}场上的一张牌；或点击“取消”令你于本轮不能再对其发动此技能`,
  //             (card, player, target) => {
  //               return get.event().targets.includes(target)
  //             },
  //           )
  //           .set("ai", (target) => {
  //             const player = get.player()
  //             const sign = get.sgnAttitude(player, target)
  //             return (
  //               6 -
  //               target
  //                 .getCards("ej")
  //                 .map((i) => {
  //                   let val = 0
  //                   if (get.position(i) === "e") {
  //                     val = get.value(i, target)
  //                   } else {
  //                     val = get.effect(
  //                       player,
  //                       {
  //                         name: i.viewAs || i.name,
  //                         cards: [i],
  //                       },
  //                       target,
  //                       target,
  //                     )
  //                   }
  //                   return sign * val
  //                 })
  //                 .sort((a, b) => a - b)[0]
  //             )
  //           })
  //           .set("targets", targets)
  //           .forResult()
  //     if (result.bool) {
  //       const targetx = result.targets[0]
  //       if (targetx.countDiscardableCards(player, "ej")) {
  //         await player.discardPlayerCard(targetx, "ej", true)
  //       }
  //     } else {
  //       player.addTempSkill(`${event.name}_ban`, "roundStart")
  //       player.markAuto(`${event.name}_ban`, [target])
  //     }
  //   },
  //   subSkill: {
  //     ban: {
  //       onremove: true,
  //       charlotte: true,
  //       intro: { content: "本轮不能再对$发动〖切谏〗" },
  //     },
  //   },
  // },
  // olnishou: {
  //   audio: 2,
  //   trigger: {
  //     player: "loseAfter",
  //     global: ["loseAsyncAfter", "equipAfter"],
  //   },
  //   forced: true,
  //   filter(event, player) {
  //     var phaseName
  //     for (var name of lib.phaseName) {
  //       var evt = event.getParent(name)
  //       if (!evt || evt.name !== name) {
  //         continue
  //       }
  //       phaseName = name
  //     }
  //     var cards = event.getd(player, "es")
  //     return (
  //       cards.length &&
  //       (cards.some((card) => {
  //         if (get.position(card, true) !== "d") {
  //           return false
  //         }
  //         return player.hasUseTarget(
  //           get.autoViewAs({ name: "shandian" }, [card]),
  //         )
  //       }) ||
  //         (phaseName && !player.hasSkill("olnishou_swap")))
  //     )
  //   },
  //   direct: true,
  //   content() {
  //     "step 0"
  //     var cards = trigger.getd(player, "es")
  //     var choices = []
  //     var choiceList = [
  //       "将" +
  //         (cards.length
  //           ? get.translation(cards[0])
  //           : "这些牌中第一张能当【闪电】对你使用的牌") +
  //         "当【闪电】使用",
  //       "本阶段结束时，你与一名手牌数最少的角色交换手牌",
  //     ]
  //     cards = cards.filter((card) => {
  //       if (get.position(card, true) !== "d") {
  //         return false
  //       }
  //       return player.hasUseTarget(get.autoViewAs({ name: "shandian" }, [card]))
  //     })
  //     event.cards = cards
  //     var phaseName
  //     for (var name of lib.phaseName) {
  //       var evt = trigger.getParent(name)
  //       if (!evt || evt.name !== name) {
  //         continue
  //       }
  //       phaseName = name
  //     }
  //     if (cards.length) {
  //       choices.push("选项一")
  //     } else {
  //       choiceList[0] = `<span style="opacity:0.5">${choiceList[0]}</span>`
  //     }
  //     if (phaseName && !player.hasSkill("olnishou_swap")) {
  //       choices.push("选项二")
  //     } else {
  //       choiceList[1] = `<span style="opacity:0.5">${choiceList[1]}</span>`
  //     }
  //     event.phaseName = phaseName
  //     if (!choices.length) {
  //       event.finish()
  //     } else {
  //       player
  //         .chooseControl(choices)
  //         .set("choiceList", choiceList)
  //         .set("prompt", "泥首：选择一项")
  //         .set("ai", (event, player) => {
  //           if (get.event().controls.length === 1) {
  //             return 0
  //           }
  //           if (
  //             game.hasPlayer((current) => {
  //               return (
  //                 current !== player &&
  //                 current.isMinHandcard() &&
  //                 get.attitude(player, current) > 0
  //               )
  //             })
  //           ) {
  //             return 1
  //           }
  //           return 0
  //         })
  //     }
  //     ;("step 1")
  //     player.logSkill("olnishou")
  //     game.log(player, "选择了", `#y${result.control}`)
  //     if (result.control === "选项一") {
  //       var card = cards[0]
  //       player.chooseUseTarget({ name: "shandian" }, [card], true)
  //     } else {
  //       var name = event.phaseName
  //       player.storage.olnishou_swap = name
  //       player.addTempSkill("olnishou_swap", `${name}After`)
  //     }
  //   },
  //   ai: {
  //     neg: true,
  //   },
  //   subSkill: {
  //     swap: {
  //       audio: "olnishou",
  //       charlotte: true,
  //       forced: true,
  //       direct: true,
  //       onremove: true,
  //       trigger: {
  //         global: [
  //           "phaseZhunbeiEnd",
  //           "phaseJudgeEnd",
  //           "phaseDrawEnd",
  //           "phaseUseEnd",
  //           "phaseDiscardEnd",
  //           "phaseJieshuEnd",
  //         ],
  //       },
  //       content() {
  //         "step 0"
  //         if (
  //           trigger.name !== player.storage.olnishou_swap ||
  //           !event.player.isIn()
  //         ) {
  //           player.removeSkill("olnishou_swap")
  //           event.finish()
  //           return
  //         }
  //         player.chooseTarget(
  //           "泥首：与一名手牌数最少的角色交换手牌",
  //           true,
  //           (card, player, target) => {
  //             return target.isMinHandcard()
  //           },
  //         )
  //         ;("step 1")
  //         if (result.bool) {
  //           var target = result.targets[0]
  //           player.logSkill("olnishou_swap", target)
  //           if (target !== player) {
  //             player.swapHandcards(target)
  //           }
  //         }
  //         ;("step 2")
  //         player.removeSkill("olnishou_swap")
  //       },
  //     },
  //   },
  // },
  // //OL陆郁生
  // olcangxin: {
  //   audio: 2,
  //   trigger: { player: "damageBegin4" },
  //   filter(event, player) {
  //     return (
  //       game
  //         .getGlobalHistory(
  //           "everything",
  //           (evt) => {
  //             return evt.name === "damage" && evt.player === player
  //           },
  //           event,
  //         )
  //         .indexOf(event) === 0
  //     )
  //   },
  //   checkx(event, player) {
  //     var target = event.source
  //     return get.damageEffect(player, target, player) <= 0
  //   },
  //   forced: true,
  //   content() {
  //     "step 0"
  //     var cards = get.bottomCards(3, true)
  //     player
  //       .chooseButton(
  //         [
  //           "###藏心：请选择要弃置的牌###若以此法弃置了红桃牌，则减少弃置红桃牌数的伤害",
  //           cards,
  //         ],
  //         [1, cards.length],
  //         true,
  //         "allowChooseAll",
  //       )
  //       .set("ai", (button) => {
  //         if (!_status.event.bool && get.suit(button.link, false) === "heart") {
  //           return 0
  //         }
  //         if (get.suit(button.link, false) !== "heart") {
  //           return 1
  //         }
  //         const num = get.event().getTrigger().num
  //         if (
  //           num >
  //           ui.selected.buttons.filter(
  //             (but) => get.suit(but.link, false) === "heart",
  //           ).length
  //         ) {
  //           return 1
  //         }
  //         return 0
  //       })
  //       .set("bool", lib.skill.olcangxin.checkx(trigger, player))
  //     ;("step 1")
  //     if (result.bool) {
  //       player.$throw(result.links, 1000)
  //       game.cardsDiscard(result.links)
  //       const num = result.links.filter(
  //         (card) => get.suit(card, false) === "heart",
  //       ).length
  //       if (num) {
  //         trigger.num -= Math.min(trigger.num, num)
  //       }
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     game.delayx()
  //   },
  //   group: "olcangxin_yingzi",
  //   subSkill: {
  //     yingzi: {
  //       audio: "olcangxin",
  //       trigger: { player: "phaseDrawBegin" },
  //       forced: true,
  //       content() {
  //         var cards = get.bottomCards(3, true)
  //         player.showCards(cards, `${get.translation(player)}发动了【藏心】`)
  //         var num = cards.filter(
  //           (card) => get.suit(card, false) === "heart",
  //         ).length
  //         if (num) {
  //           player.draw(num)
  //         }
  //       },
  //     },
  //   },
  // },
  // olrunwei: {
  //   audio: 2,
  //   trigger: { global: "phaseDiscardBegin" },
  //   filter(event, player) {
  //     return event.player.isDamaged()
  //   },
  //   async cost(event, trigger, player) {
  //     const str = get.translation(trigger.player)
  //     const result = await player
  //       .chooseControl("弃牌，+1", "摸牌，-1", "cancel2")
  //       .set("choiceList", [
  //         `令${str}弃置一张牌，且其本回合手牌上限+1`,
  //         `令${str}摸一张牌，且其本回合手牌上限-1`,
  //       ])
  //       .set("ai", () => {
  //         const player = _status.event.player,
  //           target = _status.event.getTrigger().player,
  //           att = get.sgn(get.attitude(player, target))
  //         if (!att) {
  //           return 2
  //         }
  //         const dis = target.needsToDiscard(0, null, true),
  //           res = [
  //             -att *
  //               (1 +
  //                 Math.max(
  //                   0,
  //                   dis -
  //                     (target.hasCard((i) => {
  //                       return get.value(i, target) <= 6
  //                     }, "e")
  //                       ? 1
  //                       : 2),
  //                 )),
  //             att * (1 - Math.max(0, dis + 2)),
  //             -att * dis,
  //           ]
  //         return res.indexOf(Math.max(...res))
  //       })
  //       .set("prompt", get.prompt(event.skill, trigger.player))
  //       .forResult()
  //     event.result = {
  //       bool: result.control !== "cancel2",
  //       cost_data: result.index,
  //     }
  //   },
  //   logTarget: "player",
  //   async content(event, trigger, player) {
  //     if (event.cost_data === 0) {
  //       await trigger.player
  //         .chooseToDiscard("he", true)
  //         .set("ai", (card) => {
  //           if (get.position(card) === "e") {
  //             return get.event().e - get.value(card)
  //           }
  //           return 1 / (get.value(card) || 0.5)
  //         })
  //         .set(
  //           "e",
  //           (() => {
  //             if (
  //               !trigger.player.hasCard((i) => {
  //                 return get.value(i, trigger.player) <= 6
  //               }, "e")
  //             ) {
  //               return 0
  //             }
  //             if (!trigger.player.needsToDiscard(-2)) {
  //               return 0
  //             }
  //             return 6.2
  //           })(),
  //         )
  //       trigger.player.addTempSkill("olrunwei_+")
  //       trigger.player.addMark("olrunwei_+", 1, false)
  //     }
  //     if (event.cost_data === 1) {
  //       await trigger.player.draw()
  //       trigger.player.addTempSkill("olrunwei_-")
  //       trigger.player.addMark("olrunwei_-", 1, false)
  //     }
  //   },
  //   subSkill: {
  //     "+": {
  //       charlotte: true,
  //       onremove: true,
  //       marktext: "+",
  //       intro: { content: "手牌上限+#" },
  //       mod: {
  //         maxHandcard(player, num) {
  //           return num + player.countMark("olrunwei_+")
  //         },
  //       },
  //     },
  //     "-": {
  //       charlotte: true,
  //       onremove: true,
  //       marktext: "-",
  //       intro: { content: "手牌上限-#" },
  //       mod: {
  //         maxHandcard(player, num) {
  //           return num - player.countMark("olrunwei_-")
  //         },
  //       },
  //     },
  //   },
  // },
  // //潘淑
  // weiyi: {
  //   audio: 2,
  //   trigger: { global: "damageEnd" },
  //   filter(event, player) {
  //     if (
  //       player.getStorage("weiyi").includes(event.player) ||
  //       !event.player.isIn()
  //     ) {
  //       return false
  //     }
  //     return event.player.hp >= player.hp || event.player.isDamaged()
  //   },
  //   direct: true,
  //   content() {
  //     "step 0"
  //     var list = []
  //     if (trigger.player.hp >= player.hp) {
  //       list.push("失去体力")
  //     }
  //     if (trigger.player.hp <= player.hp && trigger.player.isDamaged()) {
  //       list.push("回复体力")
  //     }
  //     list.push("cancel2")
  //     player
  //       .chooseControl(list)
  //       .set("prompt", get.prompt2("weiyi", trigger.player))
  //       .set("ai", () => {
  //         var player = _status.event.player,
  //           target = _status.event.getTrigger().player
  //         var att = get.attitude(player, target),
  //           eff = get.recoverEffect(target, player, player)
  //         if (
  //           target.hp <= player.hp &&
  //           target.isDamaged() &&
  //           att > 2 &&
  //           eff > 0
  //         ) {
  //           if (player === target) {
  //             var storage = player.getStorage("weiyi")
  //             if (
  //               player.hp >= 2 &&
  //               game.hasPlayer(
  //                 (current) =>
  //                   current.hp === player.hp + 1 &&
  //                   !storage.includes(current) &&
  //                   get.attitude(player, current) < 0,
  //               )
  //             ) {
  //               return "cancel2"
  //             }
  //           }
  //           return "回复体力"
  //         }
  //         if (target.hp >= player.hp && att < -2 && eff < 0) {
  //           return "失去体力"
  //         }
  //         return "cancel2"
  //       })
  //     ;("step 1")
  //     if (result.control !== "cancel2") {
  //       var target = trigger.player
  //       player.logSkill("weiyi", target)
  //       player.markAuto("weiyi", [target])
  //       target[result.control === "失去体力" ? "loseHp" : "recover"]()
  //     }
  //   },
  //   onremove: true,
  //   intro: {
  //     content: "已令$对汝威服",
  //   },
  // },
  // jinzhi: {
  //   audio: 2,
  //   enable: ["chooseToUse", "chooseToRespond"],
  //   hiddenCard(player, name) {
  //     if (
  //       get.type(name) === "basic" &&
  //       lib.inpile.includes(name) &&
  //       player.countMark("jinzhi_used") < player.countCards("he")
  //     ) {
  //       return true
  //     }
  //   },
  //   filter(event, player) {
  //     if (
  //       event.responded ||
  //       event.jinzhi ||
  //       player.countMark("jinzhi_used") >= player.countCards("he")
  //     ) {
  //       return false
  //     }
  //     for (var i of lib.inpile) {
  //       if (
  //         get.type(i) === "basic" &&
  //         event.filterCard({ name: i, isCard: true }, player, event)
  //       ) {
  //         return true
  //       }
  //     }
  //     return false
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       var list = []
  //       for (var i of lib.inpile) {
  //         if (
  //           get.type(i) === "basic" &&
  //           event.filterCard({ name: i, isCard: true }, player, event)
  //         ) {
  //           list.push(["基本", "", i])
  //           if (i === "sha") {
  //             for (var j of lib.inpile_nature) {
  //               list.push(["基本", "", "sha", j])
  //             }
  //           }
  //         }
  //       }
  //       return ui.create.dialog("锦织", [list, "vcard"], "hidden")
  //     },
  //     check(button) {
  //       if (_status.event.getParent().type !== "phase") {
  //         return 1
  //       }
  //       if (button.link[2] === "shan") {
  //         return 3
  //       }
  //       var player = _status.event.player
  //       if (button.link[2] === "jiu") {
  //         if (player.getUseValue({ name: "jiu" }) <= 0) {
  //           return 0
  //         }
  //         if (player.countCards("h", "sha")) {
  //           return player.getUseValue({ name: "jiu" })
  //         }
  //       }
  //       return (
  //         player.getUseValue({ name: button.link[2], nature: button.link[3] }) /
  //         4
  //       )
  //     },
  //     backup(links, player) {
  //       return {
  //         selectCard: player.countMark("jinzhi_used") + 1,
  //         filterCard(card, player) {
  //           if (ui.selected.cards.length) {
  //             if (get.color(card) !== get.color(ui.selected.cards[0])) {
  //               return false
  //             }
  //           }
  //           return lib.filter.cardDiscardable.apply(this, arguments)
  //         },
  //         complexCard: true,
  //         viewAs: {
  //           name: links[0][2],
  //           nature: links[0][3],
  //           suit: "none",
  //           number: null,
  //           isCard: true,
  //         },
  //         position: "he",
  //         ignoreMod: true,
  //         check(card) {
  //           var player = _status.event.player,
  //             color = get.color(card, player)
  //           if (
  //             player.countCards("he", { color: color }) <=
  //               player.countMark("jinzhi_used") ||
  //             (ui.selected.cards.length &&
  //               get.color(ui.selected.cards[0], player) !== color)
  //           ) {
  //             return -1
  //           }
  //           if (
  //             lib.skill.jinzhi_backup.viewAs.name === "jiu" &&
  //             !player.countCards(
  //               "h",
  //               (cardx) =>
  //                 card !== cardx &&
  //                 !ui.selected.cards.includes(cardx) &&
  //                 get.name(cardx, player) === "sha",
  //             )
  //           ) {
  //             return 0
  //           }
  //           return Math.min(0.01, 6 - get.value(card))
  //         },
  //         log: false,
  //         precontent() {
  //           player.logSkill("jinzhi")
  //           player.addTempSkill("jinzhi_used", "roundStart")
  //           player.addMark("jinzhi_used", 1, false)
  //           var cards = event.result.cards
  //           player.discard(cards)
  //           player.draw()
  //           event.result.card = {
  //             name: event.result.card.name,
  //             nature: event.result.card.nature,
  //             isCard: true,
  //           }
  //           event.result.cards = []
  //           if (cards.length > 1) {
  //             var color = get.color(cards[0], player)
  //             for (var i = 1; i < cards.length; i++) {
  //               if (get.color(cards[i], player) !== color) {
  //                 var evt = event.getParent()
  //                 evt.set("jinzhi", true)
  //                 evt.goto(0)
  //                 return
  //               }
  //             }
  //           }
  //         },
  //       }
  //     },
  //     prompt(links, player) {
  //       var name = links[0][2]
  //       var nature = links[0][3]
  //       return (
  //         "弃置" +
  //         get.cnNumber(player.countMark("jinzhi_used") + 1) +
  //         "张颜色相同的牌并摸一张牌，然后视为使用" +
  //         (get.translation(nature) || "") +
  //         get.translation(name)
  //       )
  //     },
  //   },
  //   ai: {
  //     order(item, player) {
  //       if (
  //         _status.event.type === "phase" &&
  //         !player.countMark("jinzhi_used") &&
  //         player.getUseValue({ name: "jiu" }, null, true) > 0 &&
  //         player.countCards("h", "sha")
  //       ) {
  //         return get.order({ name: "jiu" }) + 1
  //       }
  //       return 1
  //     },
  //     respondShan: true,
  //     respondSha: true,
  //     skillTagFilter(player) {
  //       if (player.countMark("jinzhi_used") >= player.countCards("he")) {
  //         return false
  //       }
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
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //       intro: { content: "本轮已发动过#次" },
  //     },
  //   },
  // },
  // xinfu_guanwei: {
  //   audio: 2,
  //   usable: 1,
  //   init: () => {
  //     game.addGlobalSkill("xinfu_guanwei_ai")
  //   },
  //   onremove: () => {
  //     if (
  //       !game.hasPlayer(
  //         (i) => i.hasSkill("xinfu_guanwei", null, null, false),
  //         true,
  //       )
  //     ) {
  //       game.removeGlobalSkill("xinfu_guanwei_ai")
  //     }
  //   },
  //   trigger: { global: "phaseUseEnd" },
  //   filter(event, player) {
  //     var history = event.player.getHistory("useCard")
  //     var num = 0
  //     var suit = false
  //     for (var i = 0; i < history.length; i++) {
  //       var suit2 = get.suit(history[i].card)
  //       if (!lib.suit.includes(suit2)) {
  //         return false
  //       }
  //       if (suit && suit !== suit2) {
  //         return false
  //       }
  //       suit = suit2
  //       num++
  //     }
  //     return num > 1
  //   },
  //   async cost(event, trigger, player) {
  //     const { player: target } = trigger
  //     event.result = await player
  //       .chooseToDiscard(
  //         "he",
  //         get.prompt(event.name.slice(0, -5), target),
  //         "弃置一张牌，令其摸两张牌并进行一个额外的出牌阶段。",
  //       )
  //       .set("ai", (card) => {
  //         const { player, targetx } = get.event()
  //         if (get.attitude(player, targetx) < 1) {
  //           return 0
  //         }
  //         return 9 - get.value(card)
  //       })
  //       .set("targetx", target)
  //       .forResult()
  //   },
  //   logTarget: "player",
  //   async content(event, trigger, player) {
  //     const { player: target } = trigger
  //     player.line(target, "green")
  //     await target.draw(2)
  //     const evt = trigger.getParent("phase", true)
  //     if (evt) {
  //       evt.phaseList.splice(evt.num + 1, 0, `phaseUse|${event.name}`)
  //     }
  //   },
  //   ai: { expose: 0.5 },
  //   subSkill: {
  //     ai: {
  //       trigger: { player: "dieAfter" },
  //       filter: () => {
  //         return !game.hasPlayer(
  //           (i) => i.hasSkill("xinfu_guanwei", null, null, false),
  //           true,
  //         )
  //       },
  //       silent: true,
  //       forceDie: true,
  //       content: () => {
  //         game.removeGlobalSkill("xinfu_guanwei_ai")
  //       },
  //       ai: {
  //         effect: {
  //           player_use(card, player, target) {
  //             if (typeof card !== "object" || !player.isPhaseUsing()) {
  //               return
  //             }
  //             var hasPanjun = game.hasPlayer(
  //               (current) =>
  //                 current.hasSkill("xinfu_guanwei") &&
  //                 !current.storage.counttrigger?.xinfu_guanwei &&
  //                 get.attitude(current, player) >= 1 &&
  //                 current.hasCard(
  //                   (card) =>
  //                     get.value(card) < 7 ||
  //                     (current !== game.me &&
  //                       !current.isUnderControl() &&
  //                       !current.isOnline() &&
  //                       get.value(card) < 9),
  //                   "he",
  //                 ),
  //             )
  //             if (!hasPanjun) {
  //               return
  //             }
  //             var suitx = get.suit(card)
  //             var history = player.getHistory("useCard")
  //             if (!history.length) {
  //               var val = 0
  //               if (
  //                 player.hasCard(
  //                   (cardx) =>
  //                     get.suit(cardx) === suitx &&
  //                     card !== cardx &&
  //                     !card.cards?.includes(cardx) &&
  //                     player.hasValueTarget(cardx),
  //                   "hs",
  //                 )
  //               ) {
  //                 val = [2, 0.1]
  //               }
  //               if (val) {
  //                 return val
  //               }
  //               return
  //             }
  //             var num = 0
  //             var suit = false
  //             for (var i = 0; i < history.length; i++) {
  //               var suit2 = get.suit(history[i].card)
  //               if (!lib.suit.includes(suit2)) {
  //                 return
  //               }
  //               if (suit && suit !== suit2) {
  //                 return
  //               }
  //               suit = suit2
  //               num++
  //             }
  //             if (suitx === suit && num === 1) {
  //               return [1, 0.1]
  //             }
  //             if (
  //               suitx !== suit &&
  //               (num > 1 ||
  //                 (num <= 1 &&
  //                   player.hasCard(
  //                     (cardx) =>
  //                       get.suit(cardx) === suit &&
  //                       player.hasValueTarget(cardx),
  //                     "hs",
  //                   )))
  //             ) {
  //               return "zeroplayertarget"
  //             }
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // xinfu_gongqing_gz_panjun: { audio: 2 },
  // xinfu_gongqing: {
  //   audio: 2,
  //   audioname2: { gz_panjun: "xinfu_gongqing_gz_panjun" },
  //   trigger: {
  //     player: ["damageBegin3", "damageBegin4"],
  //   },
  //   forced: true,
  //   filter(event, player, name) {
  //     if (!event.source) {
  //       return false
  //     }
  //     var range = event.source.getAttackRange()
  //     if (name === "damageBegin3") {
  //       return range > 3
  //     }
  //     return event.num > 1 && range < 3
  //   },
  //   preHidden: true,
  //   content() {
  //     trigger.num = event.triggername === "damageBegin4" ? 1 : trigger.num + 1
  //   },
  //   ai: {
  //     filterDamage: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (arg?.player) {
  //         if (arg.player.hasSkillTag("jueqing", false, player)) {
  //           return false
  //         }
  //         if (arg.player.getAttackRange() < 3) {
  //           return true
  //         }
  //       }
  //       return false
  //     },
  //   },
  // },
  // //黄盖
  // sbkurou: {
  //   audio: 2,
  //   trigger: { player: "phaseUseBegin" },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseCardTarget({
  //         prompt: get.prompt(event.skill),
  //         prompt2:
  //           "交给其他角色一张牌，若此牌为【桃】或【酒】，你失去2点体力，否则你失去1点体力",
  //         filterCard: true,
  //         position: "he",
  //         filterTarget: lib.filter.notMe,
  //         ai1(card) {
  //           const player = get.player()
  //           if (
  //             (player.hp <= 1 && !player.canSave(player)) ||
  //             player.hujia >= 5
  //           ) {
  //             return 0
  //           }
  //           if (
  //             get.value(card, player) > 6 &&
  //             !game.hasPlayer((current) => {
  //               return (
  //                 current !== player &&
  //                 get.attitude(current, player) > 0 &&
  //                 !current.hasSkillTag("nogain")
  //               )
  //             })
  //           ) {
  //             return 0
  //           }
  //           if (
  //             player.hp >= 2 &&
  //             (card.name === "tao" ||
  //               (card.name === "jiu" &&
  //                 player.countCards("hs", (cardx) => {
  //                   return cardx !== card && get.tag(cardx, "save")
  //                 }))) &&
  //             player.hujia <= 1
  //           ) {
  //             return 10
  //           }
  //           if (player.hp <= 1 && !player.canSave(player)) {
  //             return 0
  //           }
  //           return 1 / Math.max(0.1, get.value(card))
  //         },
  //         ai2(target) {
  //           let player = get.player(),
  //             att = get.attitude(player, target)
  //           if (ui.selected.cards.length) {
  //             const val = get.value(ui.selected.cards[0])
  //             att *= val >= 0 ? 1 : -1
  //           }
  //           if (target.hasSkillTag("nogain")) {
  //             att /= 9
  //           }
  //           return 15 + att
  //         },
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const {
  //       cards,
  //       targets: [target],
  //     } = event
  //     if (get.mode() !== "identity" || player.identity !== "nei") {
  //       player.addExpose(0.15)
  //     }
  //     await player.give(cards, target)
  //     await player.loseHp(
  //       ["tao", "jiu"].includes(get.name(cards[0], target)) ? 2 : 1,
  //     )
  //   },
  //   group: "sbkurou_gain",
  //   ai: {
  //     nokeep: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (tag === "nokeep") {
  //         return (
  //           (!arg || (arg.card && get.name(arg.card) === "tao")) &&
  //           player.hp <= 0 &&
  //           player.isPhaseUsing()
  //         )
  //       }
  //     },
  //   },
  //   subSkill: {
  //     gain: {
  //       audio: "sbkurou",
  //       trigger: { player: "loseHpEnd" },
  //       forced: true,
  //       locked: false,
  //       filter(event, player) {
  //         return player.isIn() && player.hujia < 5 && event.num > 0
  //       },
  //       getIndex: (event) => event.num,
  //       async content(event, trigger, player) {
  //         await player.changeHujia(2, null, true)
  //       },
  //       ai: {
  //         maihp: true,
  //         effect: {
  //           target(card, player, target) {
  //             if (get.tag(card, "damage")) {
  //               if (player.hasSkillTag("jueqing", false, target)) {
  //                 return [1, 1]
  //               }
  //               return 1.2
  //             }
  //             if (get.tag(card, "loseHp")) {
  //               if (target.hp <= 1 || target.hujia >= 5) {
  //                 return
  //               }
  //               return [1, 1]
  //             }
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // sbzhaxiang: {
  //   audio: 2,
  //   trigger: { player: "useCard1" },
  //   forced: true,
  //   group: ["sbzhaxiang_draw", "sbzhaxiang_mark"],
  //   filter(event, player) {
  //     return (
  //       player.getHistory("useCard").length <= player.getDamagedHp() &&
  //       player === _status.currentPhase
  //     )
  //   },
  //   content() {
  //     trigger.directHit.addArray(game.filterPlayer())
  //     game.log(trigger.card, "不可被响应")
  //   },
  //   ai: {
  //     threaten: 1.5,
  //     directHit_ai: true,
  //     skillTagFilter(player, tag, arg) {
  //       return player.countUsed() < player.getDamagedHp()
  //     },
  //   },
  //   mod: {
  //     targetInRange(card, player) {
  //       if (player.countUsed() < player.getDamagedHp()) {
  //         return true
  //       }
  //     },
  //     cardUsable(card, player) {
  //       if (player.countUsed() < player.getDamagedHp()) {
  //         return Infinity
  //       }
  //     },
  //     aiOrder(player, card, num) {
  //       if (player.countUsed() >= player.getDamagedHp()) {
  //         return
  //       }
  //       var numx = get.info(card).usable
  //       if (typeof numx === "function") {
  //         return numx(card, player) + 10
  //       }
  //       if (typeof numx === "number") {
  //         return num + 10
  //       }
  //     },
  //   },
  //   subSkill: {
  //     mark: {
  //       charlotte: true,
  //       silent: true,
  //       firstDo: true,
  //       trigger: {
  //         player: ["changeHp", "useCard"],
  //         global: ["phaseBegin", "phaseAfter"],
  //       },
  //       filter(event, player) {
  //         return player === _status.currentPhase
  //       },
  //       content() {
  //         const skill = event.name
  //         if (event.triggername !== "phaseAfter") {
  //           const num = Math.max(
  //             0,
  //             player.getDamagedHp() - player.getHistory("useCard").length,
  //           )
  //           if (player.countMark(skill) !== num) {
  //             player.setMark(skill, num, false)
  //           }
  //           player.addTip(skill, `${get.translation(skill)}剩余${num}`)
  //         } else {
  //           player.clearMark(skill, false)
  //           player.removeTip(skill)
  //         }
  //       },
  //       intro: {
  //         content: "还剩 # 张牌无距离次数限制且不可被响应",
  //       },
  //     },
  //     draw: {
  //       audio: "sbzhaxiang",
  //       mod: {
  //         aiOrder(player, card, num) {
  //           if (
  //             num > 0 &&
  //             _status.event &&
  //             _status.event.type === "phase" &&
  //             get.tag(card, "recover")
  //           ) {
  //             return num / 5
  //           }
  //         },
  //       },
  //       trigger: { player: "phaseDrawBegin2" },
  //       forced: true,
  //       filter(event, player) {
  //         return !event.numFixed && player.getDamagedHp() > 0
  //       },
  //       content() {
  //         trigger.num += player.getDamagedHp()
  //       },
  //       ai: {
  //         effect: {
  //           target(card, player, target) {
  //             if (
  //               get.tag(card, "recover") &&
  //               target.hp > 0 &&
  //               target.needsToDiscard() < 1
  //             ) {
  //               return [0, 0]
  //             }
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // //韩当
  // sbgongqi: {
  //   audio: 2,
  //   trigger: { player: "phaseUseBegin" },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseToDiscard(
  //         get.prompt(event.skill),
  //         "你可以弃置一张牌，令你本阶段使用牌时，其他角色不能使用或打出与你弃置的牌颜色不同的手牌进行响应。",
  //         "he",
  //         "chooseonly",
  //       )
  //       .set("ai", (card) => {
  //         const ind = get.event().colors.indexOf(get.color(card)) + 1
  //         if (ind <= 0) {
  //           return 0
  //         }
  //         return 1.5 + 2 * ind - get.value(card)
  //       })
  //       .set(
  //         "colors",
  //         (() => {
  //           if (
  //             !player.countCards("hs", (card) => player.hasValueTarget(card))
  //           ) {
  //             return []
  //           }
  //           const colors = Object.keys(lib.color)
  //           const infos = colors.map((color) => {
  //             return [
  //               color,
  //               game.filterPlayer().map((current) => {
  //                 const att = get.attitude(player, current)
  //                 return current
  //                   .getCards("hes", (card) => {
  //                     if (get.color(card) !== color) {
  //                       return false
  //                     }
  //                     if (current.hasUseTarget(card, false, false)) {
  //                       return false
  //                     }
  //                     if (
  //                       !lib.filter.cardEnabled(card, current, "forceEnable")
  //                     ) {
  //                       return false
  //                     }
  //                     return true
  //                   })
  //                   .map((card) => {
  //                     return get.value(card) * (att > 0 ? -0.2 : 1)
  //                   })
  //                   .reduce((p, c) => p + c, 0)
  //               }),
  //             ]
  //           })
  //           infos.sort((a, b) => {
  //             return a[1] - b[1]
  //           })
  //           return infos.map((info) => info[0])
  //         })(),
  //       )
  //       .forResult()
  //   },
  //   locked: false,
  //   async content(event, trigger, player) {
  //     const { cards } = event
  //     await player.discard(cards)
  //     await game.delayx()
  //     player.addTempSkill("sbgongqi_effect", "phaseChange")
  //     player.markAuto("sbgongqi_effect", [get.color(cards[0], player)])
  //     player.line(game.filterPlayer())
  //     await game.delayx()
  //   },
  //   updateBlocker(player) {
  //     const list = [],
  //       storage = player.storage.sbgongqi_block
  //     if (storage?.length) {
  //       list.addArray(...storage.map((i) => i[1]))
  //     }
  //     player.storage.sbgongqi_blocker = list
  //   },
  //   mod: {
  //     attackRange(player, num) {
  //       return num + 4
  //     },
  //   },
  //   subSkill: {
  //     effect: {
  //       audio: "sbgongqi",
  //       trigger: {
  //         player: "useCard",
  //       },
  //       onremove: true,
  //       charlotte: true,
  //       forced: true,
  //       async content(event, trigger, player) {
  //         game.countPlayer((current) => {
  //           if (current === player) {
  //             return
  //           }
  //           current.addTempSkill("sbgongqi_block", "phaseChange")
  //           if (!current.storage.sbgongqi_block) {
  //             current.storage.sbgongqi_block = []
  //           }
  //           current.storage.sbgongqi_block.push([
  //             trigger.card,
  //             player.getStorage("sbgongqi_effect"),
  //           ])
  //           lib.skill.sbgongqi.updateBlocker(current)
  //         })
  //       },
  //       intro: {
  //         content: "所有其他角色不能使用或打出不为$的手牌响应你使用的牌",
  //       },
  //     },
  //     block: {
  //       trigger: {
  //         player: ["damageBefore", "damageCancelled", "damageZero"],
  //         target: ["shaMiss", "useCardToExcluded", "useCardToEnd"],
  //         global: ["useCardEnd"],
  //       },
  //       forced: true,
  //       firstDo: true,
  //       popup: false,
  //       charlotte: true,
  //       onremove: ["sbgongqi_block", "sbgongqi_blocker"],
  //       filter(event, player) {
  //         const evt = event.getParent("useCard", true, true)
  //         if (evt && evt.effectedCount < evt.effectCount) {
  //           return false
  //         }
  //         if (!event.card || !player.storage.sbgongqi_block) {
  //           return false
  //         }
  //         return player.getStorage("sbgongqi_block").some((info) => {
  //           return info[0] === event.card
  //         })
  //       },
  //       async content(event, trigger, player) {
  //         const storage = player.storage.sbgongqi_block
  //         for (let i = 0; i < storage.length; i++) {
  //           if (storage[i][0] === trigger.card) {
  //             storage.splice(i--, 1)
  //           }
  //         }
  //         if (!storage.length) {
  //           player.removeSkill("sbgongqi_block")
  //         } else {
  //           lib.skill.sbgongqi.updateBlocker(player)
  //         }
  //       },
  //       mod: {
  //         cardEnabled(card, player) {
  //           if (!player.storage.sbgongqi_blocker) {
  //             return
  //           }
  //           const color = get.color(card)
  //           if (color === "none") {
  //             return
  //           }
  //           const hs = player.getCards("h"),
  //             cards = [card]
  //           if (Array.isArray(card.cards)) {
  //             cards.addArray(card.cards)
  //           }
  //           if (
  //             cards.containsSome(...hs) &&
  //             !player.storage.sbgongqi_blocker.includes(color)
  //           ) {
  //             return false
  //           }
  //         },
  //         cardRespondable(card, player) {
  //           if (!player.storage.sbgongqi_blocker) {
  //             return
  //           }
  //           const color = get.color(card)
  //           if (color === "none") {
  //             return
  //           }
  //           const hs = player.getCards("h"),
  //             cards = [card]
  //           if (Array.isArray(card.cards)) {
  //             cards.addArray(card.cards)
  //           }
  //           const evt = _status.event
  //           if (
  //             evt.name === "chooseToRespond" &&
  //             cards.containsSome(...hs) &&
  //             !player.storage.sbgongqi_blocker.includes(color)
  //           ) {
  //             return false
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // sbjiefan: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filterTarget: true,
  //   async content(event, trigger, player) {
  //     const { target } = event
  //     const targets = game.filterPlayer((current) => {
  //       return current.inRange(target)
  //     })
  //     const count = targets.length
  //     if (!count) {
  //       target.chat("没人打得到我喔！")
  //       return
  //     }
  //     const controls = ["选项一", "选项二", "背水！"]
  //     const { control } = await target
  //       .chooseControl(controls)
  //       .set("choiceList", [
  //         `令所有攻击范围内含有你的角色依次弃置一张牌（${get.translation(targets)}）`,
  //         `你摸等同于攻击范围内含有你的角色数的牌（${get.cnNumber(count)}张牌）`,
  //         `背水！令${get.translation(player)}的〖解烦〗失效直到其杀死一名角色，然后你依次执行上述所有选项`,
  //       ])
  //       .set("ai", () => {
  //         return get.event().choice
  //       })
  //       .set(
  //         "choice",
  //         (() => {
  //           const eff1 = targets
  //             .map((current) => {
  //               let position = "h"
  //               if (!current.countCards("h")) {
  //                 position += "e"
  //               }
  //               return get.effect(
  //                 current,
  //                 { name: "guohe_copy", position },
  //                 target,
  //                 target,
  //               )
  //             })
  //             .reduce((p, c) => p + c, 0)
  //           const eff2 =
  //             (get.effect(target, { name: "wuzhong" }, target) * count) / 2
  //           if (
  //             game.hasPlayer((current) => {
  //               const att1 = get.attitude(player, current),
  //                 att2 = get.attitude(target, current)
  //               if (att1 < 0 && att2 < 0) {
  //                 return current.getHp() <= 1
  //               }
  //               return false
  //             }) &&
  //             eff1 > 15 &&
  //             eff2 > 0
  //           ) {
  //             return "背水！"
  //           }
  //           if (eff1 > 3 * eff2) {
  //             return "选项一"
  //           }
  //           return "选项二"
  //         })(),
  //       )
  //       .forResult()
  //     game.log(target, "选择了", `#g${control}`)
  //     if (control !== "选项二") {
  //       for (const current of targets) {
  //         target.line(current, "thunder")
  //         await current.chooseToDiscard("解烦：请弃置一张牌", "he", true)
  //       }
  //     }
  //     if (control !== "选项一") {
  //       await target.draw(count)
  //     }
  //     if (control === "背水！") {
  //       player.tempBanSkill("sbjiefan", { source: "die" })
  //     }
  //   },
  //   ai: {
  //     order: 8,
  //     result: {
  //       target(player, target) {
  //         const targets = game.filterPlayer((current) => {
  //           return current.inRange(target)
  //         })
  //         return Math.min(2, targets.length) / 2
  //       },
  //     },
  //   },
  // },
  // new_meibu: {
  //   audio: "meibu",
  //   trigger: {
  //     global: "phaseUseBegin",
  //   },
  //   filter(event, player) {
  //     return (
  //       event.player !== player &&
  //       event.player.isIn() &&
  //       player.countCards("he") > 0 &&
  //       event.player.inRange(player)
  //     )
  //   },
  //   direct: true,
  //   derivation: ["new_zhixi"],
  //   checkx(event, player) {
  //     if (get.attitude(player, event.player) >= 0) {
  //       return false
  //     }
  //     var e2 = player.getEquip(2)
  //     if (e2) {
  //       if (e2.name === "tengjia" || e2.name === "rewrite_tengjia") {
  //         return true
  //       }
  //       if (e2.name === "bagua" || e2.name === "rewrite_bagua") {
  //         return true
  //       }
  //     }
  //     return event.player.countCards("h") > event.player.hp
  //   },
  //   content() {
  //     "step 0"
  //     var check = lib.skill.new_meibu.checkx(trigger, player)
  //     player
  //       .chooseToDiscard(get.prompt2("new_meibu", trigger.player), "he")
  //       .set("ai", (card) => {
  //         if (_status.event.check) {
  //           return 6 - get.value(card)
  //         }
  //         return 0
  //       })
  //       .set("check", check)
  //       .set("logSkill", ["new_meibu", trigger.player])
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = trigger.player
  //       var card = result.cards[0]
  //       player.line(target, "green")
  //       target.addTempSkills("new_zhixi", "phaseUseAfter")
  //       if (
  //         card.name !== "sha" &&
  //         !(get.type(card, "trick") === "trick" && get.color(card) === "black")
  //       ) {
  //         target.addTempSkill("new_meibu_range", "phaseUseAfter")
  //         target.markAuto("new_meibu_range", player)
  //       }
  //       target.markSkillCharacter(
  //         "new_meibu",
  //         player,
  //         "魅步",
  //         "锁定技，出牌阶段，你至多可使用X张牌，你使用了锦囊牌后不能再使用牌（X为你的体力值）。",
  //       )
  //     }
  //   },
  //   ai: {
  //     expose: 0.2,
  //   },
  //   subSkill: {
  //     range: {
  //       onremove: true,
  //       charlotte: true,
  //       mod: {
  //         globalFrom(from, to, num) {
  //           if (from.getStorage("new_meibu_range").includes(to)) {
  //             return -Infinity
  //           }
  //         },
  //       },
  //       sub: true,
  //     },
  //   },
  // },
  // new_mumu: {
  //   audio: "mumu",
  //   trigger: {
  //     player: "phaseUseBegin",
  //   },
  //   filter(event, player) {
  //     return game.hasPlayer((current) => {
  //       if (current === player) {
  //         return current.getEquips(2).length > 0
  //       }
  //       return current.countCards("e") > 0
  //     })
  //   },
  //   direct: true,
  //   content() {
  //     "step 0"
  //     player
  //       .chooseTarget(
  //         get.prompt("new_mumu"),
  //         "弃置一名其他角色装备区内的一张牌，或者获得一名角色装备区内的防具牌",
  //         (card, player, target) => {
  //           if (target === player) {
  //             return target.getEquips(2).length > 0
  //           }
  //           return target.countCards("e") > 0
  //         },
  //       )
  //       .set("ai", (target) => {
  //         var player = _status.event.player
  //         var att = get.attitude(player, target)
  //         if (target.getEquip(2) && player.hasEmptySlot(2)) {
  //           return -2 * att
  //         }
  //         return -att
  //       })
  //     ;("step 1")
  //     if (result.bool && result.targets?.length) {
  //       event.target = result.targets[0]
  //       player.logSkill("new_mumu", event.target)
  //       player.line(event.target, "green")
  //       var e = event.target.getEquips(2)
  //       event.e = e
  //       if (target === player) {
  //         event.choice = "获得一张防具牌"
  //       } else if (e.length > 0) {
  //         player
  //           .chooseControl("弃置一张装备牌", "获得一张防具牌")
  //           .set("ai", () => {
  //             if (_status.event.player.getEquips(2).length > 0) {
  //               return "弃置一张装备牌"
  //             }
  //             return "获得一张防具牌"
  //           })
  //       } else {
  //         event.choice = "弃置一张装备牌"
  //       }
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     var choice = event.choice || result.control
  //     if (choice === "弃置一张装备牌") {
  //       player.discardPlayerCard(event.target, "e", true)
  //     } else {
  //       if (event.e) {
  //         player.gain(event.e, event.target, "give", "bySelf")
  //         player.addTempSkill("new_mumu_notsha")
  //       }
  //     }
  //   },
  //   subSkill: {
  //     notsha: {
  //       mark: true,
  //       intro: {
  //         content: "不能使用【杀】",
  //       },
  //       charlotte: true,
  //       mod: {
  //         cardEnabled(card) {
  //           if (card.name === "sha") {
  //             return false
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // new_zhixi: {
  //   mod: {
  //     cardEnabled(card, player) {
  //       if (
  //         player.storage.new_zhixi2 ||
  //         player.countMark("new_zhixi") >= player.hp
  //       ) {
  //         return false
  //       }
  //     },
  //     cardUsable(card, player) {
  //       if (
  //         player.storage.new_zhixi2 ||
  //         player.countMark("new_zhixi") >= player.hp
  //       ) {
  //         return false
  //       }
  //     },
  //     cardSavable(card, player) {
  //       if (
  //         player.storage.new_zhixi2 ||
  //         player.countMark("new_zhixi") >= player.hp
  //       ) {
  //         return false
  //       }
  //     },
  //   },
  //   trigger: {
  //     player: "useCard1",
  //   },
  //   forced: true,
  //   popup: false,
  //   firstDo: true,
  //   init(player, skill) {
  //     player.storage[skill] = 0
  //     var evt = _status.event.getParent("phaseUse")
  //     if (evt && evt.player === player) {
  //       player.getHistory("useCard", (evtx) => {
  //         if (evtx.getParent("phaseUse") === evt) {
  //           player.storage[skill]++
  //           if (get.type2(evtx.card) === "trick") {
  //             player.storage.new_zhixi2 = true
  //           }
  //         }
  //       })
  //     }
  //   },
  //   onremove(player) {
  //     player.unmarkSkill("new_meibu")
  //     delete player.storage.new_zhixi
  //     delete player.storage.new_zhixi2
  //   },
  //   content() {
  //     player.addMark("new_zhixi", 1, false)
  //     if (get.type2(trigger.card) === "trick") {
  //       player.storage.new_zhixi2 = true
  //     }
  //   },
  //   ai: {
  //     presha: true,
  //     pretao: true,
  //     neg: true,
  //     nokeep: true,
  //   },
  // },
  // //步练师
  // reanxu: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filter(event, player) {
  //     return (
  //       game.countPlayer() > 2 &&
  //       game.hasPlayer(
  //         (current) => current !== player && current.countCards("he"),
  //       )
  //     )
  //   },
  //   selectTarget: 2,
  //   filterTarget(card, player, target) {
  //     if (target === player) {
  //       return false
  //     }
  //     if (!ui.selected.targets.length) {
  //       return target.countCards("he") > 0
  //     }
  //     return (
  //       target !== ui.selected.targets[0] &&
  //       ui.selected.targets[0].countGainableCards(target, "he") > 0
  //     )
  //   },
  //   multitarget: true,
  //   targetprompt: ["被拿牌", "得到牌"],
  //   content() {
  //     "step 0"
  //     targets[1].gainPlayerCard(targets[0], "he", true)
  //     ;("step 1")
  //     if (
  //       targets[0].getHistory(
  //         "lose",
  //         (evt) => evt.getParent(3) === event && !evt.es.length,
  //       ).length
  //     ) {
  //       player.draw()
  //     }
  //     ;("step 2")
  //     if (
  //       targets[0].isIn() &&
  //       targets[1].isIn() &&
  //       targets[0].countCards("h") !== targets[1].countCards("h")
  //     ) {
  //       event.target =
  //         targets[
  //           targets[0].countCards("h") > targets[1].countCards("h") ? 1 : 0
  //         ]
  //       player
  //         .chooseBool(`是否令${get.translation(event.target)}摸一张牌？`)
  //         .set("ai", () => {
  //           var evt = _status.event.getParent()
  //           return get.attitude(evt.player, evt.target) > 0
  //         })
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 3")
  //     if (result.bool) {
  //       target.draw()
  //     }
  //   },
  //   ai: {
  //     expose: 0.2,
  //     threaten: 2,
  //     order: 9,
  //     result: {
  //       player(player, target) {
  //         if (ui.selected.targets.length) {
  //           return 0.01
  //         }
  //         return target.countCards("e") ? 0 : 0.5
  //       },
  //       target(player, target) {
  //         if (ui.selected.targets.length) {
  //           player = target
  //           target = ui.selected.targets[0]
  //           if (get.attitude(player, target) > 1) {
  //             return 0
  //           }
  //           return target.countCards("h") - player.countCards("h") >
  //             (target.countCards("e") ? 2 : 1)
  //             ? 2
  //             : 1
  //         }
  //         if (get.attitude(player, target) <= 0) {
  //           return target.countCards(
  //             "he",
  //             (card) => card.name === "tengjia" || get.value(card) > 0,
  //           ) > 0
  //             ? -1.5
  //             : 1.5
  //         }
  //         return target.countCards(
  //           "he",
  //           (card) => card.name !== "tengjia" && get.value(card) <= 0,
  //         ) > 0
  //           ? 1.5
  //           : -1.5
  //       },
  //     },
  //   },
  // },
  // zhuiyi: {
  //   audio: 2,
  //   audioname: ["re_bulianshi"],
  //   trigger: { player: "die" },
  //   direct: true,
  //   skillAnimation: true,
  //   animationColor: "wood",
  //   forceDie: true,
  //   content() {
  //     "step 0"
  //     player
  //       .chooseTarget(
  //         get.prompt2("zhuiyi"),
  //         (card, player, target) =>
  //           player !== target && _status.event.sourcex !== target,
  //       )
  //       .set("forceDie", true)
  //       .set("ai", (target) => {
  //         var num = get.attitude(_status.event.player, target)
  //         if (num > 0) {
  //           if (target.hp === 1) {
  //             num += 2
  //           }
  //           if (target.hp < target.maxHp) {
  //             num += 2
  //           }
  //         }
  //         return num
  //       })
  //       .set("sourcex", trigger.source)
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       player.logSkill("zhuiyi", target)
  //       player.line(target, "green")
  //       target.recover()
  //       target.draw(3)
  //     }
  //   },
  //   ai: {
  //     expose: 0.5,
  //   },
  // },
  // //笮融
  // dccansi: {
  //   audio: 2,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   forced: true,
  //   content() {
  //     "step 0"
  //     player.recover()
  //     if (!game.hasPlayer((current) => current !== player)) {
  //       event.finish()
  //     } else {
  //       player
  //         .chooseTarget("残肆：选择一名其他角色", true, lib.filter.notMe)
  //         .set("ai", (target) => {
  //           var player = _status.event.player
  //           var list = ["recover", "sha", "juedou", "huogong"]
  //           return list.reduce((p, c) => {
  //             return p + get.effect(target, { name: c }, player, player)
  //           }, 0)
  //         })
  //     }
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       event.target = target
  //       player.line(target, "fire")
  //       target.recover()
  //       event.list = ["sha", "juedou", "huogong"]
  //       player.addTempSkill("dccansi_draw")
  //       player.storage.dccansi_draw = target
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     var card = { name: event.list.shift(), isCard: true }
  //     if (target.isIn() && player.canUse(card, target, false)) {
  //       player.useCard(card, target, false)
  //     }
  //     if (event.list.length) {
  //       event.redo()
  //     }
  //     ;("step 3")
  //     player.removeSkill("dccansi_draw")
  //   },
  //   subSkill: {
  //     draw: {
  //       audio: "dccansi",
  //       trigger: { global: "damageEnd" },
  //       forced: true,
  //       charlotte: true,
  //       onremove: true,
  //       filter(event, player) {
  //         return (
  //           event.getParent(3).name === "dccansi" &&
  //           player.storage.dccansi_draw === event.player
  //         )
  //       },
  //       content() {
  //         for (var i = 0; i < trigger.num; i++) {
  //           player.draw(2)
  //         }
  //       },
  //     },
  //   },
  //   ai: {
  //     threaten: 5,
  //     expose: 0.3,
  //   },
  // },
  // dcfozong: {
  //   audio: 2,
  //   trigger: { player: "phaseUseBegin" },
  //   filter(event, player) {
  //     return player.countCards("h") > 7
  //   },
  //   forced: true,
  //   direct: true,
  //   intro: {
  //     markcount: "expansion",
  //     content: "expansion",
  //   },
  //   content() {
  //     "step 0"
  //     var num = player.countCards("h") - 7
  //     player.chooseCard(
  //       `佛宗：将${get.cnNumber(num)}张手牌置于武将上`,
  //       true,
  //       num,
  //     )
  //     ;("step 1")
  //     if (result.bool) {
  //       var cards = result.cards
  //       player.logSkill("dcfozong")
  //       player.addToExpansion(cards, player, "give").gaintag.add("dcfozong")
  //     }
  //     ;("step 2")
  //     var cards = player.getExpansions("dcfozong")
  //     if (cards.length < 7) {
  //       event.finish()
  //     } else {
  //       event.targets = game
  //         .filterPlayer((i) => i !== player)
  //         .sortBySeat(player)
  //       game.delayx()
  //     }
  //     ;("step 3")
  //     var target = targets.shift()
  //     event.target = target
  //     player.line(target)
  //     var cards = player.getExpansions("dcfozong")
  //     if (!cards.length) {
  //       event._result = { bool: false }
  //     } else {
  //       target
  //         .chooseButton([
  //           '###佛宗###<div class="text center">获得一张牌并令' +
  //             get.translation(player) +
  //             "回复1点体力，或点击“取消”令其失去1点体力</div>",
  //           cards,
  //         ])
  //         .set("ai", (button) => {
  //           if (_status.event.refuse) {
  //             return get.value(button.link) - 7.5
  //           }
  //           return get.value(button.link)
  //         })
  //         .set(
  //           "refuse",
  //           get.attitude(target, player) < 1 &&
  //             get.effect(player, { name: "losehp" }, player, target) > 0,
  //         )
  //     }
  //     ;("step 4")
  //     if (result.bool) {
  //       var card = result.links[0]
  //       target.gain(card, "give", player)
  //       player.recover(target)
  //     } else {
  //       player.loseHp()
  //     }
  //     ;("step 5")
  //     if (targets.length) {
  //       event.goto(3)
  //     }
  //   },
  //   ai: { halfneg: true },
  // },
  // //韩馥
  // olshuzi: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     return (
  //       game.hasPlayer((target) => target !== player) &&
  //       player.countCards("he") >= 2
  //     )
  //   },
  //   filterCard: true,
  //   selectCard: 2,
  //   position: "he",
  //   filterTarget: lib.filter.notMe,
  //   check(card) {
  //     return 7 - get.value(card)
  //   },
  //   usable: 1,
  //   lose: false,
  //   discard: false,
  //   delay: false,
  //   async content(event, trigger, player) {
  //     const { cards, target } = event
  //     await player.give(cards, target)
  //     const names = cards
  //       .slice()
  //       .map((i) => get.name(i, false))
  //       .unique()
  //     const resultx = await target.chooseToGive(player, "he", true).forResult()
  //     if (resultx?.bool && resultx.cards?.length) {
  //       if (names.includes(get.name(resultx.cards[0], false))) {
  //         const str = get.translation(target)
  //         const choices = ["造成伤害"],
  //           choiceList = [`对${str}造成1点伤害`]
  //         if (
  //           player.canMoveCard(
  //             null,
  //             null,
  //             game.filterPlayer((i) => i !== target),
  //             target,
  //           )
  //         ) {
  //           choices.push("给其移牌")
  //           choiceList.push(`将场上的一张牌移动至${str}的对应区域`)
  //         }
  //         choices.push("cancel2")
  //         const result = await player
  //           .chooseControl(choices)
  //           .set("ai", () => {
  //             const { player, target } = get.event().getParent(),
  //               choices = get.event().controls
  //             if (get.damageEffect(target, player, player) > 0) {
  //               return "造成伤害"
  //             }
  //             if (
  //               player.canMoveCard(
  //                 true,
  //                 null,
  //                 game.filterPlayer((i) => i !== target),
  //                 target,
  //               ) &&
  //               choices.includes("给其移牌")
  //             ) {
  //               return "给其移牌"
  //             }
  //             return "cancel2"
  //           })
  //           .set("prompt", "束辎：是否选择一项执行？")
  //           .set("choiceList", choiceList)
  //           .forResult()
  //         if (result.control !== "cancel2") {
  //           if (result.index === 0) {
  //             await target.damage()
  //           } else {
  //             await player.moveCard(
  //               true,
  //               game.filterPlayer((i) => i !== target),
  //               target,
  //             )
  //           }
  //         }
  //       }
  //     }
  //   },
  //   ai: {
  //     order: 7,
  //     result: {
  //       player(player, target) {
  //         return (
  //           get.damageEffect(target, player, player) +
  //           player.canMoveCard(
  //             true,
  //             null,
  //             game.filterPlayer((i) => i !== target),
  //             target,
  //           )
  //         )
  //       },
  //     },
  //   },
  // },
  // olkuangshou: {
  //   audio: 2,
  //   trigger: { player: "damageEnd" },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     await player.draw(3)
  //     await player.chooseToDiscard(
  //       "he",
  //       true,
  //       game.countPlayer2((target) => target.hasHistory("damage")),
  //     )
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
  //           const limit = game.countPlayer2(
  //             (i) => i === target || i.getHistory("sourceDamage").length,
  //           )
  //           return [1, 2.5 - limit]
  //         }
  //       },
  //     },
  //   },
  // },
  // //刘辩
  // shiyuan: {
  //   audio: 2,
  //   trigger: { target: "useCardToTargeted" },
  //   frequent: true,
  //   filter(event, player) {
  //     var num = 1
  //     if (
  //       _status.currentPhase &&
  //       _status.currentPhase !== player &&
  //       _status.currentPhase.group === "qun" &&
  //       player.hasZhuSkill("yuwei", _status.currentPhase)
  //     ) {
  //       num = 2
  //     }
  //     return (
  //       player !== event.player &&
  //       player.getHistory(
  //         "gain",
  //         (evt) =>
  //           evt.getParent(2).name === "shiyuan" &&
  //           evt.cards.length === 2 + get.sgn(event.player.hp - player.hp),
  //       ).length < num
  //     )
  //   },
  //   content() {
  //     player.draw(2 + get.sgn(trigger.player.hp - player.hp))
  //   },
  //   ai: {
  //     effect: {
  //       target_use(card, player, target) {
  //         if (get.itemtype(player) !== "player" || player === target) {
  //           return 1
  //         }
  //         let num = 1,
  //           ds = 2 + get.sgn(player.hp - target.hp)
  //         if (
  //           player === _status.currentPhase &&
  //           _status.currentPhase?.group === "qun" &&
  //           target.hasZhuSkill("yuwei", player)
  //         ) {
  //           num = 2
  //         }
  //         if (
  //           target.getHistory(
  //             "gain",
  //             (evt) =>
  //               evt.getParent(2).name === "shiyuan" && evt.cards.length === ds,
  //           ).length >= num
  //         ) {
  //           return 1
  //         }
  //         const name = get.name(card)
  //         if (
  //           get.tag(card, "lose") ||
  //           name === "huogong" ||
  //           name === "juedou" ||
  //           name === "tiesuo"
  //         ) {
  //           return [1, ds]
  //         }
  //         if (!target.hasFriend()) {
  //           return 1
  //         }
  //         return [1, 0.5 * ds]
  //       },
  //     },
  //   },
  // },
  // dushi: {
  //   audio: 2,
  //   global: "dushi2",
  //   locked: true,
  //   trigger: { player: "die" },
  //   forceDie: true,
  //   direct: true,
  //   skillAnimation: true,
  //   animationColor: "gray",
  //   filter(event, player) {
  //     return game.hasPlayer((current) => current !== player)
  //   },
  //   content() {
  //     "step 0"
  //     player
  //       .chooseTarget(
  //         "请选择【毒逝】的目标",
  //         "选择一名其他角色，令其获得技能【毒逝】",
  //         true,
  //         lib.filter.notMe,
  //       )
  //       .set("forceDie", true)
  //       .set("ai", (target) => -get.attitude(_status.event.player, target))
  //     ;("step 1")
  //     if (result.bool) {
  //       var target = result.targets[0]
  //       player.logSkill("dushi", target)
  //       target.markSkill("dushi")
  //       target.addSkills("dushi")
  //     }
  //   },
  //   intro: { content: "您已经获得弘农王的诅咒" },
  // },
  // dushi2: {
  //   mod: {
  //     cardSavable(card, player, target) {
  //       if (
  //         card.name === "tao" &&
  //         target !== player &&
  //         target.hasSkill("dushi")
  //       ) {
  //         return false
  //       }
  //     },
  //   },
  // },
  // yuwei: {
  //   trigger: { player: "shiyuanBegin" },
  //   filter(event, player) {
  //     return _status.currentPhase && _status.currentPhase.group === "qun"
  //   },
  //   zhuSkill: true,
  //   forced: true,
  //   content() {},
  //   ai: { combo: "shiyuan" },
  // },
  // //沮授
  // xinjianying: {
  //   audio: 2,
  //   subfrequent: ["draw"],
  //   enable: "phaseUse",
  //   usable: 1,
  //   filter(event, player) {
  //     if (!player.countCards("he")) {
  //       return false
  //     }
  //     for (var i of lib.inpile) {
  //       if (i !== "du" && get.type(i, null, false) === "basic") {
  //         if (event.filterCard({ name: i }, player, event)) {
  //           return true
  //         }
  //         if (i === "sha") {
  //           for (var j of lib.inpile_nature) {
  //             if (event.filterCard({ name: i, nature: j }, player, event)) {
  //               return true
  //             }
  //           }
  //         }
  //       }
  //     }
  //     return false
  //   },
  //   onChooseToUse(event) {
  //     if (event.type === "phase" && !game.online) {
  //       var last = event.player.getLastUsed()
  //       if (last && last.getParent("phaseUse") === event.getParent()) {
  //         var suit = get.suit(last.card, false)
  //         if (suit !== "none") {
  //           event.set("xinjianying_suit", suit)
  //         }
  //       }
  //     }
  //   },
  //   chooseButton: {
  //     dialog(event, player) {
  //       var list = []
  //       var suit = event.xinjianying_suit || "",
  //         str = get.translation(suit)
  //       for (var i of lib.inpile) {
  //         if (i !== "du" && get.type(i, null, false) === "basic") {
  //           if (event.filterCard({ name: i }, player, event)) {
  //             list.push(["基本", str, i])
  //           }
  //           if (i === "sha") {
  //             for (var j of lib.inpile_nature) {
  //               if (event.filterCard({ name: i, nature: j }, player, event)) {
  //                 list.push(["基本", str, i, j])
  //               }
  //             }
  //           }
  //         }
  //       }
  //       return ui.create.dialog("渐营", [list, "vcard"])
  //     },
  //     check(button) {
  //       if (button.link[2] === "jiu") {
  //         return 0
  //       }
  //       return _status.event.player.getUseValue({
  //         name: button.link[2],
  //         nature: button.link[3],
  //       })
  //     },
  //     backup(links, player) {
  //       var next = {
  //         audio: "xinjianying",
  //         filterCard: true,
  //         popname: true,
  //         position: "he",
  //         viewAs: {
  //           name: links[0][2],
  //           nature: links[0][3],
  //         },
  //         ai1(card) {
  //           return 7 - _status.event.player.getUseValue(card, null, true)
  //         },
  //       }
  //       if (_status.event.xinjianying_suit) {
  //         next.viewAs.suit = _status.event.xinjianying_suit
  //       }
  //       return next
  //     },
  //     prompt(links) {
  //       return (
  //         "将一张牌当做" +
  //         (get.translation(links[0][3]) || "") +
  //         get.translation(links[0][2]) +
  //         (_status.event.xinjianying_suit
  //           ? `(${get.translation(_status.event.xinjianying_suit)})`
  //           : "") +
  //         "使用"
  //       )
  //     },
  //   },
  //   ai: {
  //     order(item, player) {
  //       if (_status.event.xinjianying_suit) {
  //         return 16
  //       }
  //       return 3
  //     },
  //     result: { player: 7 },
  //   },
  //   group: ["xinjianying_draw", "jianying_mark"],
  //   init(player) {
  //     if (player.isPhaseUsing()) {
  //       var evt = _status.event.getParent("phaseUse")
  //       var history = player.getHistory(
  //         "useCard",
  //         (evt2) => evt2.getParent("phaseUse") === evt,
  //       )
  //       if (history.length) {
  //         var trigger = history[history.length - 1]
  //         player.storage.jianying_mark = trigger.card
  //         player.markSkill("jianying_mark")
  //         game.broadcastAll(
  //           (player, suit) => {
  //             if (player.marks.jianying_mark) {
  //               player.marks.jianying_mark.firstChild.innerHTML =
  //                 get.translation(suit)
  //             }
  //           },
  //           player,
  //           get.suit(trigger.card, player),
  //         )
  //         player.when("phaseUseAfter").step(async () => {
  //           player.unmarkSkill("jianying_mark")
  //           delete player.storage.jianying_mark
  //         })
  //       }
  //     }
  //   },
  //   onremove(player) {
  //     player.unmarkSkill("jianying_mark")
  //     delete player.storage.jianying_mark
  //   },
  //   subSkill: {
  //     draw: { inherit: "jianying", audio: "xinjianying" },
  //   },
  // },
  // shibei: {
  //   trigger: { player: "damageEnd" },
  //   forced: true,
  //   audio: 2,
  //   audioname: ["xin_jushou"],
  //   check(event, player) {
  //     return player.getHistory("damage").indexOf(event) === 0
  //   },
  //   content() {
  //     if (player.getHistory("damage").indexOf(trigger) > 0) {
  //       player.loseHp()
  //     } else {
  //       player.recover()
  //     }
  //   },
  //   subSkill: {
  //     damaged: {},
  //     ai: {},
  //   },
  //   ai: {
  //     maixie_defend: true,
  //     threaten: 0.9,
  //     effect: {
  //       target(card, player, target) {
  //         if (player.hasSkillTag("jueqing", false, target)) {
  //           return
  //         }
  //         if (target.hujia) {
  //           return
  //         }
  //         if (player._shibei_tmp) {
  //           return
  //         }
  //         if (target.hasSkill("shibei_ai")) {
  //           return
  //         }
  //         if (
  //           _status.event.getParent("useCard", true) ||
  //           _status.event.getParent("_wuxie", true)
  //         ) {
  //           return
  //         }
  //         if (get.tag(card, "damage")) {
  //           if (target.getHistory("damage").length > 0) {
  //             return [1, -2]
  //           }
  //           if (get.attitude(player, target) > 0 && target.hp > 1) {
  //             return 0
  //           }
  //           if (
  //             get.attitude(player, target) < 0 &&
  //             !player.hasSkillTag("damageBonus")
  //           ) {
  //             if (card.name === "sha") {
  //               return
  //             }
  //             var sha = false
  //             player._shibei_tmp = true
  //             var num = player.countCards("h", (card) => {
  //               if (card.name === "sha") {
  //                 if (sha) {
  //                   return false
  //                 }
  //                 sha = true
  //               }
  //               return (
  //                 get.tag(card, "damage") &&
  //                 player.canUse(card, target) &&
  //                 get.effect(target, card, player, player) > 0
  //               )
  //             })
  //             delete player._shibei_tmp
  //             if (player.hasSkillTag("damage")) {
  //               num++
  //             }
  //             if (num < 2) {
  //               var enemies = player.getEnemies()
  //               if (
  //                 enemies.length === 1 &&
  //                 enemies[0] === target &&
  //                 player.needsToDiscard()
  //               ) {
  //                 return
  //               }
  //               return 0
  //             }
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // xinxhzhiyan: {
  //   audio: "xhzhiyan",
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     const list = player.getStorage("xinxhzhiyan_used")
  //     return (
  //       (!list.includes("give") && player.countCards("h") > player.hp) ||
  //       (!list.includes("draw") && player.countCards("h") < player.maxHp)
  //     )
  //   },
  //   filterCard: true,
  //   selectCard() {
  //     var player = _status.event.player
  //     const list = player.getStorage("xinxhzhiyan_used")
  //     if (list.includes("give")) {
  //       return 0
  //     }
  //     var num = Math.max(0, player.countCards("h") - player.hp)
  //     if (
  //       ui.selected.cards.length ||
  //       !list.includes("draw") ||
  //       player.countCards("h") >= player.maxHp
  //     ) {
  //       return [num, num]
  //     }
  //     return [0, num]
  //   },
  //   filterTarget: lib.filter.notMe,
  //   selectTarget() {
  //     if (ui.selected.cards.length) {
  //       return [1, 1]
  //     }
  //     return [0, 0]
  //   },
  //   check(card) {
  //     var player = _status.event.player
  //     var checkx = (card) => {
  //       if (
  //         player.getUseValue(card, null, true) <= 0 &&
  //         game.hasPlayer(
  //           (current) =>
  //             current !== player &&
  //             get.value(card, current) > 0 &&
  //             get.attitude(player, current) > 0,
  //         )
  //       ) {
  //         return 2
  //       }
  //       return 1
  //     }
  //     if (
  //       player.countCards("h", (card) => checkx(card) > 0) <
  //       player.countCards("h") - player.hp
  //     ) {
  //       return 0
  //     }
  //     return checkx(card)
  //   },
  //   delay: false,
  //   discard: false,
  //   lose: false,
  //   allowChooseAll: true,
  //   content() {
  //     var bool = cards && cards.length > 0
  //     player.addTempSkill("xinxhzhiyan_used", "phaseUseEnd")
  //     if (!bool) {
  //       player.markAuto("xinxhzhiyan_used", "draw")
  //       player.addTempSkill("xinxhzhiyan_false", "phaseUseEnd")
  //       player.draw(player.maxHp - player.countCards("h"))
  //     } else {
  //       player.markAuto("xinxhzhiyan_used", "give")
  //       player.give(cards, target)
  //     }
  //   },
  //   ai: {
  //     order(obj, player) {
  //       if (player.countCards("h") > player.hp) {
  //         return 10
  //       }
  //       return 0.5
  //     },
  //     result: {
  //       player(player, target) {
  //         if (
  //           !ui.selected.cards.length &&
  //           player.countCards("h") < player.maxHp
  //         ) {
  //           return 1
  //         }
  //         return 0
  //       },
  //       target: 1,
  //     },
  //   },
  // },
  // xinxhzhiyan_used: {
  //   charlotte: true,
  //   onremove: true,
  // },
  // xinxhzhiyan_false: {
  //   mod: {
  //     playerEnabled(card, player, target) {
  //       if (
  //         player !== target &&
  //         (!get.info(card)?.singleCard || !ui.selected.targets.length)
  //       ) {
  //         return false
  //       }
  //     },
  //   },
  //   charlotte: true,
  //   mark: true,
  //   intro: {
  //     content: "不能对其他角色使用牌",
  //   },
  // },
  // //星董卓
  // xiongjin: {
  //   audio: 2,
  //   trigger: { global: "phaseUseBegin" },
  //   filter(event, player) {
  //     return !player
  //       .getStorage("xiongjin_used")
  //       .includes((event.player === player).toString())
  //   },
  //   logTarget: "player",
  //   prompt2(event, player) {
  //     const goon = event.player === player
  //     return (
  //       (goon ? "" : "令其") +
  //       "摸" +
  //       get.cnNumber(Math.min(4, Math.max(1, player.getDamagedHp()))) +
  //       "张牌，本回合的弃牌阶段开始时，" +
  //       (goon ? "弃置所有非基本牌" : "其弃置所有基本牌")
  //     )
  //   },
  //   content() {
  //     const target = trigger.player
  //     const goon = target === player
  //     player.addTempSkill("xiongjin_used", "roundStart")
  //     player.markAuto("xiongjin_used", [goon.toString()])
  //     player.addTempSkill("xiongjin_effect")
  //     player.storage.xiongjin_effect_target ??= []
  //     player.storage.xiongjin_effect_target.add(target)
  //     target.markAuto("xiongjin_effect", [goon ? "nobasic" : "basic"])
  //     target.draw(Math.min(4, Math.max(1, player.getDamagedHp())))
  //     if (target !== player) {
  //       player.addExpose(0.2)
  //     }
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //     effect: {
  //       charlotte: true,
  //       onremove(player, skill) {
  //         player.storage.xiongjin_effect_target.forEach((target) => {
  //           target.unmarkAuto(skill, target.storage[skill])
  //         })
  //         delete player.storage.xiongjin_effect_target
  //       },
  //       intro: {
  //         markcount: () => 0,
  //         content(storage) {
  //           if (storage.length > 1) {
  //             return "弃牌阶段开始时，弃置所有牌"
  //           }
  //           return `弃牌阶段开始时，弃置所有${storage[0] === "basic" ? "基本" : "非基本"}牌`
  //         },
  //       },
  //       trigger: { global: "phaseDiscardBegin" },
  //       forced: true,
  //       popup: false,
  //       content() {
  //         const targets = player.storage.xiongjin_effect_target
  //         if (targets?.length) {
  //           for (const target of targets.sortBySeat()) {
  //             const storage = target.getStorage("xiongjin_effect")
  //             const cards = target.getCards("he", (card) => {
  //               if (!lib.filter.cardDiscardable(card, target)) {
  //                 return false
  //               }
  //               const type = get.type(card)
  //               return (
  //                 (type === "basic" && storage.includes("basic")) ||
  //                 (type !== "basic" && storage.includes("nobasic"))
  //               )
  //             })
  //             if (cards.length) {
  //               target.discard(cards)
  //             }
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // zhenbian: {
  //   audio: 2,
  //   trigger: { global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter"] },
  //   filter(event, player) {
  //     if (event.name.indexOf("lose") === 0) {
  //       if (event.getlx === false || event.position !== ui.discardPile) {
  //         return false
  //       }
  //     } else if (event.getParent()?.relatedEvent?.name === "useCard") {
  //       return false
  //     }
  //     return event.cards.length
  //   },
  //   forced: true,
  //   async content(event, trigger, player) {
  //     if (
  //       trigger.cards.some(
  //         (card) =>
  //           !player.getStorage("zhenbian").includes(get.suit(card, false)),
  //       )
  //     ) {
  //       player.markAuto(
  //         "zhenbian",
  //         trigger.cards.reduce(
  //           (list, card) => list.add(get.suit(card, false)),
  //           [],
  //         ),
  //       )
  //       player.storage.zhenbian.sort(
  //         (a, b) => lib.suit.indexOf(b) - lib.suit.indexOf(a),
  //       )
  //       player.addTip(
  //         "zhenbian",
  //         get.translation("zhenbian") +
  //           player
  //             .getStorage("zhenbian")
  //             .reduce((str, suit) => str + get.translation(suit), ""),
  //       )
  //     }
  //     if (player.getStorage("zhenbian").length >= 4 && player.maxHp < 8) {
  //       player.unmarkSkill("zhenbian")
  //       await player.gainMaxHp()
  //     }
  //   },
  //   intro: {
  //     content: "已记录花色$",
  //     onunmark(storage, player) {
  //       delete player.storage.zhenbian
  //       player.removeTip("zhenbian")
  //     },
  //   },
  //   mod: { maxHandcardBase: (player) => player.maxHp },
  //   onremove: (player, skill) => player.removeTip(skill),
  // },
  // baoxi: {
  //   audio: 2,
  //   group: ["baoxi_juedou", "baoxi_sha"], //同时机沟槽技能改个翻译方便区分
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //     backup: {
  //       filterCard: (card) => get.itemtype(card) === "card",
  //       filterTarget: lib.filter.targetEnabled,
  //       check(card) {
  //         const player = get.player()
  //         if (player.maxHp <= 1) {
  //           return 0
  //         }
  //         return (
  //           player.getUseValue(
  //             get.autoViewAs(get.info("baoxi_backup").viewAs, [card]),
  //             false,
  //           ) - get.value(card)
  //         )
  //       },
  //       log: false,
  //       precontent() {
  //         player.logSkill("baoxi")
  //         player.loseMaxHp()
  //         player.addTempSkill("baoxi_used", "roundStart")
  //         player.markAuto("baoxi_used", [event.result.card.name])
  //       },
  //     },
  //     juedou: {
  //       trigger: {
  //         global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter"],
  //       },
  //       filter(event, player) {
  //         if (player.getStorage("baoxi_used").includes("juedou")) {
  //           return false
  //         }
  //         if (
  //           event.name.indexOf("lose") === 0 &&
  //           (event.getlx === false || event.position !== ui.discardPile)
  //         ) {
  //           return false
  //         }
  //         return (
  //           event.cards.filter((card) => get.type(card) === "basic").length >
  //             1 &&
  //           player.hasCard((card) => {
  //             return (
  //               _status.connectMode ||
  //               player.hasUseTarget(
  //                 get.autoViewAs({ name: "juedou" }, [card]),
  //                 false,
  //               )
  //             )
  //           }, "h")
  //         )
  //       },
  //       direct: true,
  //       content() {
  //         game.broadcastAll(
  //           () => (lib.skill.baoxi_backup.viewAs = { name: "juedou" }),
  //         )
  //         const next = player.chooseToUse()
  //         next.set("openskilldialog", "暴袭：是否将一张手牌当作【决斗】使用？")
  //         next.set("norestore", true)
  //         next.set("_backupevent", "baoxi_backup")
  //         next.set("custom", {
  //           add: {},
  //           replace: { window: () => {} },
  //         })
  //         next.backup("baoxi_backup")
  //         next.set("addCount", false)
  //       },
  //     },
  //     sha: {
  //       trigger: {
  //         global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter"],
  //       },
  //       filter(event, player) {
  //         if (player.getStorage("baoxi_used").includes("sha")) {
  //           return false
  //         }
  //         if (
  //           event.name.indexOf("lose") === 0 &&
  //           (event.getlx === false || event.position !== ui.discardPile)
  //         ) {
  //           return false
  //         }
  //         return (
  //           event.cards.filter((card) => get.type(card) !== "basic").length >
  //             1 &&
  //           player.hasCard((card) => {
  //             return (
  //               _status.connectMode ||
  //               player.hasUseTarget(
  //                 get.autoViewAs({ name: "sha" }, [card]),
  //                 false,
  //               )
  //             )
  //           }, "h")
  //         )
  //       },
  //       direct: true,
  //       content() {
  //         game.broadcastAll(
  //           () => (lib.skill.baoxi_backup.viewAs = { name: "sha" }),
  //         )
  //         const next = player.chooseToUse()
  //         next.set("openskilldialog", "暴袭：是否将一张手牌当作【杀】使用？")
  //         next.set("norestore", true)
  //         next.set("_backupevent", "baoxi_backup")
  //         next.set("custom", {
  //           add: {},
  //           replace: { window: () => {} },
  //         })
  //         next.backup("baoxi_backup")
  //         next.set("addCount", false)
  //       },
  //     },
  //   },
  // },
  // // 鲍信
  // mutao: {
  //   audio: "twmutao",
  //   inherit: "twmutao",
  //   filterTarget(card, player, target) {
  //     return target.countCards("h")
  //   },
  //   async content(event, trigger, player) {
  //     const source = event.target
  //     const cards = source.getCards("h", { name: "sha" })
  //     if (!cards.length) {
  //       game.log("但", source, "没有", "#y杀", "！")
  //       return
  //     }
  //     const next = source.addToExpansion(cards, source, "give")
  //     next.gaintag.add("mutao")
  //     await next
  //     let togive = source
  //     while (source.getExpansions("mutao").length) {
  //       togive = togive.getNext()
  //       await source.give(source.getExpansions("mutao").randomGet(), togive)
  //     }
  //     source.line(togive)
  //     const num = togive.countCards("h", { name: "sha" })
  //     if (num) {
  //       await togive.damage(Math.min(2, num), source)
  //     }
  //   },
  //   intro: {
  //     content: "expansion",
  //     markcount: "expansion",
  //   },
  // },
  // yimou: {
  //   audio: ["twyimou1.mp3", "yimou.mp3"],
  //   filter(event, player) {
  //     return event.player.isIn() && get.distance(event.player, player) <= 1
  //   },
  //   inherit: "twyimou",
  //   content() {
  //     "step 0"
  //     if (trigger.player !== player) {
  //       player.addExpose(0.3)
  //     }
  //     var target = get.translation(trigger.player)
  //     var choiceList = [
  //       `令${target}获得牌堆里的一张【杀】`,
  //       `令${target}将一张手牌交给另一名角色，然后${target}摸一张牌`,
  //     ]
  //     var list = ["选项一"]
  //     if (
  //       trigger.player.countCards("h") &&
  //       game.hasPlayer((t) => t !== trigger.player)
  //     ) {
  //       list.push("选项二")
  //     } else {
  //       choiceList[1] = `<span style="opacity:0.5">${choiceList[1]}</span>`
  //     }
  //     player
  //       .chooseControl(list)
  //       .set("prompt", "毅谋：请选择一项")
  //       .set("choiceList", choiceList)
  //       .set("ai", () => {
  //         var evt = _status.event.getTrigger(),
  //           list = _status.event.list
  //         var player = _status.event.player
  //         var target = evt.player
  //         if (target.countCards("h") && list.includes("选项二")) {
  //           return "选项二"
  //         }
  //         return "选项一"
  //       })
  //       .set("list", list)
  //     ;("step 1")
  //     event.choice = result.control
  //     ;("step 2")
  //     if (event.choice !== "选项二") {
  //       var card = get.cardPile2((card) => card.name === "sha")
  //       if (card) {
  //         trigger.player.gain(card, "gain2")
  //       } else {
  //         game.log("但牌堆里已经没有", "#y杀", "了！")
  //       }
  //       if (event.choice === "选项一") {
  //         event.finish()
  //       }
  //     }
  //     ;("step 3")
  //     if (event.choice !== "选项一") {
  //       if (
  //         trigger.player.countCards("h") &&
  //         game.hasPlayer((t) => t !== trigger.player)
  //       ) {
  //         trigger.player.chooseCardTarget({
  //           prompt: "毅谋：将一张手牌交给另一名其他角色",
  //           filterCard: true,
  //           forced: true,
  //           filterTarget: lib.filter.notMe,
  //           ai1(card) {
  //             return 1 / Math.max(0.1, get.value(card))
  //           },
  //           ai2(target) {
  //             var player = _status.event.player,
  //               att = get.attitude(player, target)
  //             if (target.hasSkillTag("nogain")) {
  //               att /= 9
  //             }
  //             return 4 + att
  //           },
  //         })
  //       } else {
  //         event.finish()
  //       }
  //     }
  //     ;("step 4")
  //     if (!result?.bool || !result.cards?.length || !result.targets?.length) {
  //       return
  //     }
  //     var target = result.targets[0]
  //     trigger.player.line(target)
  //     trigger.player.give(result.cards, target)
  //     trigger.player.draw()
  //   },
  // },
  // //SP甄宓
  // dcjijie: {
  //   audio: 2,
  //   trigger: {
  //     global: ["gainAfter", "loseAsyncAfter", "recoverAfter"],
  //   },
  //   getIndex(event, player) {
  //     if (event.name !== "loseAsync") {
  //       return [[event.player]]
  //     }
  //     return [
  //       game
  //         .filterPlayer((current) => {
  //           return (
  //             current !== player &&
  //             _status.currentPhase !== current &&
  //             event.getg(current).length > 0
  //           )
  //         })
  //         .sortBySeat(),
  //     ]
  //   },
  //   filter(event, player, triggername, targets) {
  //     if (
  //       player
  //         .getStorage("dcjijie_used")
  //         .includes(event.name === "recover" ? "recover" : "draw")
  //     ) {
  //       return false
  //     }
  //     if (event.name === "recover") {
  //       return (
  //         targets[0] !== player &&
  //         _status.currentPhase !== targets[0] &&
  //         player.isDamaged()
  //       )
  //     }
  //     return targets.some((current) => {
  //       return (
  //         current !== player &&
  //         _status.currentPhase !== current &&
  //         event.getg(current).length > 0
  //       )
  //     })
  //   },
  //   forced: true,
  //   logTarget(event, player, triggername, targets) {
  //     return targets
  //   },
  //   async content(event, trigger, player) {
  //     player.addTempSkill("dcjijie_used")
  //     if (trigger.name === "recover") {
  //       player.markAuto("dcjijie_used", ["recover"])
  //       await player.recover(trigger.num)
  //     } else {
  //       const count = game.countPlayer((current) => {
  //         if (current === player || _status.currentPhase === current) {
  //           return 0
  //         }
  //         return trigger.getg(current).length
  //       })
  //       player.markAuto("dcjijie_used", ["draw"])
  //       await player.draw(count)
  //     }
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //   },
  // },
  // dchuiji: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filterTarget: true,
  //   chooseButton: {
  //     dialog(event, player) {
  //       const name = get.translation(event.result.targets[0])
  //       const dialog = ui.create.dialog(
  //         `惠济：请选择要令${name}执行的选项`,
  //         [
  //           [
  //             ["draw", "令其摸两张牌"],
  //             ["equip", "令其随机使用牌堆中的一张装备牌"],
  //           ],
  //           "textbutton",
  //         ],
  //         "hidden",
  //       )
  //       return dialog
  //     },
  //     filter(button, player) {
  //       const target = get.event().getParent().result.targets[0]
  //       if (button.link === "equip" && target.isMin()) {
  //         return false
  //       }
  //       return true
  //     },
  //     check(button) {
  //       const player = get.player(),
  //         target = get.event().getParent().result.targets[0]
  //       const link = button.link
  //       const att = Math.sign(get.attitude(player, target))
  //       const drawWugu = target.countCards("h") + 2 >= game.countPlayer()
  //       if (link === "draw") {
  //         return (drawWugu ? -1 : 2) * att
  //       }
  //       return 1
  //     },
  //     backup(links) {
  //       return {
  //         audio: "dchuiji",
  //         target: get.event().result.targets[0],
  //         link: links[0],
  //         filterTarget(card, player, target) {
  //           return target === lib.skill.dchuiji_backup.target
  //         },
  //         selectTarget: -1,
  //         async content(event, trigger, player) {
  //           const link = lib.skill.dchuiji_backup.link
  //           const { target } = event
  //           if (link === "draw") {
  //             await target.draw(2)
  //           } else {
  //             const card = get.cardPile2((card) => {
  //               if (get.type(card) !== "equip") {
  //                 return false
  //               }
  //               return (
  //                 target.canUse(card, target) && !get.cardtag(card, "gifts")
  //               )
  //             })
  //             if (card) {
  //               await target.chooseUseTarget(card, true).set("nopopup", true)
  //             } else {
  //               game.log("但是牌堆里没有", target, "的装备！")
  //               await game.delayx()
  //             }
  //           }
  //           if (target.countCards("h") >= game.countPlayer()) {
  //             target.addTempSkill("dchuiji_effect")
  //             target.markAuto("dchuiji_effect", [event])
  //             const card = new lib.element.VCard({
  //               name: "wugu",
  //               storage: { fixedShownCards: [] },
  //               isCard: true,
  //             })
  //             if (target.hasUseTarget(card)) {
  //               await target.chooseUseTarget(card, true, false)
  //             }
  //           }
  //         },
  //       }
  //     },
  //     prompt(links) {
  //       return "点击“确定”以执行效果"
  //     },
  //   },
  //   subSkill: {
  //     backup: {},
  //     effect: {
  //       charlotte: true,
  //       onremove: true,
  //       trigger: { player: "wuguContentBeforeBefore", global: "wuguRemained" },
  //       filter(event, player) {
  //         if (
  //           !player.getStorage("dchuiji_effect").includes(event.getParent(3))
  //         ) {
  //           return false
  //         }
  //         return event.name === "wuguContentBefore" || event.remained.someInD()
  //       },
  //       forced: true,
  //       popup: false,
  //       async content(event, trigger, player) {
  //         if (trigger.name === "wuguContentBefore") {
  //           trigger.card.storage ??= {}
  //           trigger.card.storage.fixedShownCards = player.getCards("h")
  //         } else {
  //           const remained = trigger.remained.filterInD()
  //           if (remained.length) {
  //             player.gain(remained, "gain2")
  //           }
  //         }
  //       },
  //     },
  //   },
  //   ai: {
  //     order(item, player) {
  //       if (
  //         !game.hasPlayer(
  //           (current) =>
  //             current !== player && get.attitude(player, current) > 0,
  //         ) &&
  //         game.hasPlayer((current) => get.attitude(player, current) <= 0)
  //       ) {
  //         return 10
  //       }
  //       if (
  //         game.hasPlayer((current) => {
  //           const del = player.countCards("h") - current.countCards("h"),
  //             toFind = [2, 4].find((num) => Math.abs(del) === num)
  //           if (toFind === 4 && del < 0 && get.attitude(player, current) <= 0) {
  //             return true
  //           }
  //           return false
  //         })
  //       ) {
  //         return 10
  //       }
  //       return 1
  //     },
  //     result: {
  //       target(player, target) {
  //         const att = get.attitude(player, target)
  //         const wugu = target.countCards("h") + 2 > game.countPlayer()
  //         if (wugu) {
  //           return Math.min(0, att) * Math.min(3, target.countCards("h"))
  //         }
  //         return Math.max(0, att) * Math.min(3, target.countCards("h"))
  //       },
  //     },
  //   },
  // },
  // //吕玲绮
  // guowu: {
  //   audio: 2,
  //   trigger: { player: "phaseUseBegin" },
  //   filter(event, player) {
  //     return player.countCards("h") > 0
  //   },
  //   preHidden: true,
  //   async content(event, trigger, player) {
  //     const hs = player.getCards("h")
  //     await player.showCards(hs, `${get.translation(player)}发动了【帼武】`)
  //     const list = []
  //     for (const c of hs) {
  //       list.add(get.type2(c, player))
  //       if (list.length >= 3) {
  //         break
  //       }
  //     }
  //     if (list.length >= 1) {
  //       const card = get.discardPile((i) => i.name === "sha")
  //       if (card) {
  //         await player.gain(card, "gain2")
  //       }
  //     }
  //     if (list.length >= 2) {
  //       player.addTempSkill("guowu_dist", "phaseUseAfter")
  //     }
  //     if (list.length >= 3) {
  //       player.addTempSkill("guowu_add", "phaseUseAfter")
  //     }
  //   },
  //   subSkill: {
  //     dist: {
  //       charlotte: true,
  //       mod: { targetInRange: () => true },
  //     },
  //     used: { charlotte: true },
  //     add: {
  //       audio: "guowu",
  //       charlotte: true,
  //       trigger: { player: "useCard1" },
  //       direct: true,
  //       filter(event, player) {
  //         var info = get.info(event.card, false)
  //         if (info.allowMultiple === false) {
  //           return false
  //         }
  //         if (
  //           event.card.name !== "sha" &&
  //           (info.type !== "trick" ||
  //             get.mode() === "guozhan" ||
  //             player.hasSkill("guowu_used"))
  //         ) {
  //           return false
  //         }
  //         if (event.targets && !info.multitarget) {
  //           if (
  //             game.hasPlayer(
  //               (current) =>
  //                 !event.targets.includes(current) &&
  //                 lib.filter.targetEnabled2(event.card, player, current) &&
  //                 lib.filter.targetInRange(event.card, player, current),
  //             )
  //           ) {
  //             return true
  //           }
  //         }
  //         return false
  //       },
  //       async content(event, trigger, player) {
  //         let result

  //         // step 0
  //         const num = game.countPlayer((current) => {
  //           return (
  //             !trigger.targets.includes(current) &&
  //             lib.filter.targetEnabled2(trigger.card, player, current) &&
  //             lib.filter.targetInRange(trigger.card, player, current)
  //           )
  //         })
  //         result = await player
  //           .chooseTarget(
  //             "帼武：是否为" +
  //               get.translation(trigger.card) +
  //               "增加" +
  //               (num > 1 ? "至多两个" : "一个") +
  //               "目标？",
  //             [1, Math.min(2, num)],
  //             (card, player, target) => {
  //               const trigger = _status.event.getTrigger()
  //               card = trigger.card
  //               return (
  //                 !trigger.targets.includes(target) &&
  //                 lib.filter.targetEnabled2(card, player, target) &&
  //                 lib.filter.targetInRange(card, player, target)
  //               )
  //             },
  //           )
  //           .set("ai", (target) => {
  //             const player = _status.event.player
  //             const card = _status.event.getTrigger().card
  //             return get.effect(target, card, player, player)
  //           })
  //           .forResult()
  //         // step 1
  //         if (!result.bool) {
  //           return
  //         }

  //         if (player !== game.me && !player.isOnline()) {
  //           await game.delayx()
  //         }
  //         // step 2
  //         const targets = result.targets.sortBySeat()
  //         player.logSkill("guowu_add", targets)
  //         trigger.targets.addArray(targets)
  //         if (get.mode() === "guozhan") {
  //           player.addTempSkill("guowu_used", "phaseUseAfter")
  //         }
  //       },
  //     },
  //   },
  // },
  // zhuangrong: {
  //   derivation: ["llqshenwei", "wushuang"],
  //   audio: 2,
  //   trigger: { global: "phaseEnd" },
  //   forced: true,
  //   juexingji: true,
  //   skillAnimation: true,
  //   animationColor: "gray",
  //   filter(event, player) {
  //     return player.hp === 1 || player.countCards("h") === 1
  //   },
  //   async content(event, trigger, player) {
  //     player.awakenSkill(event.name)
  //     await player.loseMaxHp()
  //     if (player.maxHp > player.hp) {
  //       await player.recover(player.maxHp - player.hp)
  //     }
  //     await player.drawTo(Math.min(5, player.maxHp))
  //     await player.addSkills(["llqshenwei", "wushuang"])
  //   },
  // },
  // llqshenwei: {
  //   audio: 2,
  //   trigger: { player: "phaseDrawBegin2" },
  //   forced: true,
  //   filter: (event) => !event.numFixed,
  //   async content(event, trigger, player) {
  //     trigger.num += 2
  //   },
  //   mod: {
  //     maxHandcard: (player, num) => num + 2,
  //   },
  // },
  // //猩黄忠
  // spshidi: {
  //   audio: 2,
  //   trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
  //   zhuanhuanji: "number",
  //   filter(event, player) {
  //     return (
  //       player.countMark("spshidi") % 2 ===
  //       ["phaseJieshu", "phaseZhunbei"].indexOf(event.name)
  //     )
  //   },
  //   logAudio(event, player) {
  //     return `spshidi${2 - (player.countMark("spshidi") % 2)}.mp3`
  //   },
  //   forced: true,
  //   content() {
  //     player.changeZhuanhuanji("spshidi")
  //   },
  //   mod: {
  //     globalFrom(from, to, distance) {
  //       if (from.countMark("spshidi") % 2 === 0) {
  //         return distance - 1
  //       }
  //     },
  //     globalTo(from, to, distance) {
  //       if (to.countMark("spshidi") % 2 === 1) {
  //         return distance + 1
  //       }
  //     },
  //     aiOrder(player, card, num) {
  //       if (
  //         player.countMark("spshidi") % 2 === 0 &&
  //         card.name === "sha" &&
  //         get.color(card) === "black"
  //       ) {
  //         return num + 0.1
  //       }
  //     },
  //   },
  //   mark: true,
  //   marktext: "☯",
  //   intro: {
  //     content(storage, player) {
  //       return `已转换过${storage || 0}次`
  //     },
  //   },
  //   ai: {
  //     directHit_ai: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (!arg?.card || !arg.target || arg.card.name !== "sha") {
  //         return false
  //       }
  //       return (
  //         player.countMark("spshidi") % 2 === 0 &&
  //         get.color(arg.card) === "black"
  //       )
  //     },
  //   },
  //   group: ["spshidi_use", "spshidi_beused"],
  //   subSkill: {
  //     use: {
  //       audio: "spshidi1.mp3",
  //       trigger: { player: "useCard" },
  //       forced: true,
  //       filter(event, player) {
  //         return (
  //           event.card.name === "sha" &&
  //           player.countMark("spshidi") % 2 === 0 &&
  //           get.color(event.card, false) === "black"
  //         )
  //       },
  //       content() {
  //         trigger.directHit.addArray(game.players)
  //       },
  //     },
  //     beused: {
  //       audio: "spshidi2.mp3",
  //       trigger: { target: "useCardToTargeted" },
  //       forced: true,
  //       filter(event, player) {
  //         return (
  //           event.card.name === "sha" &&
  //           player.countMark("spshidi") % 2 === 1 &&
  //           get.color(event.card, false) === "red"
  //         )
  //       },
  //       content() {
  //         trigger.directHit.add(player)
  //       },
  //     },
  //   },
  // },
  // spyishi: {
  //   audio: 2,
  //   trigger: { source: "damageBegin2" },
  //   filter(event, player) {
  //     return player !== event.player && event.player.countCards("e") > 0
  //   },
  //   check(event, player) {
  //     return (
  //       get.damageEffect(event.player, player, player) <= 0 ||
  //       (get.attitude(player, event.player) <= 0 &&
  //         !event.player.hasSkillTag("noe") &&
  //         event.player.hasCard(
  //           (card) => get.value(card) > 9 - event.player.hp,
  //           "e",
  //         ))
  //     )
  //   },
  //   logTarget: "player",
  //   content() {
  //     trigger.num--
  //     player.gainPlayerCard(trigger.player, "e", true)
  //   },
  // },
  // spqishe: {
  //   audio: 2,
  //   enable: "chooseToUse",
  //   viewAs: { name: "jiu" },
  //   filterCard: { type: "equip" },
  //   position: "hes",
  //   viewAsFilter(player) {
  //     return player.hasCard({ type: "equip" }, "ehs")
  //   },
  //   check(card) {
  //     if (_status.event.type === "dying") {
  //       return 1 / (get.value(card) || 0.5)
  //     }
  //     return 5 - get.value(card)
  //   },
  //   locked: false,
  //   mod: {
  //     maxHandcard(player, num) {
  //       return num + player.countCards("e")
  //     },
  //   },
  // },
  // //OL界李儒
  // oljuece: {
  //   audio: 2,
  //   trigger: { player: "phaseJieshuBegin" },
  //   filter(event, player) {
  //     return game.hasPlayer(
  //       (target) =>
  //         target !== player && player.countCards("h") >= target.countCards("h"),
  //     )
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt2(event.skill),
  //         (card, player, target) =>
  //           target !== player &&
  //           player.countCards("h") >= target.countCards("h"),
  //       )
  //       .set("ai", (target) => {
  //         const player = get.player()
  //         return get.damageEffect(target, player, player)
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     await event.targets[0].damage()
  //   },
  // },
  // olmieji: {
  //   audio: 2,
  //   inherit: "xinmieji",
  //   filter(event, player) {
  //     return player.countCards("h", { type: ["trick", "delay"] })
  //   },
  //   filterCard(card) {
  //     return get.type2(card) === "trick"
  //   },
  //   async content(event, trigger, player) {
  //     const { target, cards } = event
  //     player.$throw(cards.length, 1000)
  //     if (
  //       !target.countCards("he", (card) =>
  //         lib.filter.cardDiscardable(card, target),
  //       )
  //     ) {
  //       return
  //     }
  //     const result = await target
  //       .chooseToDiscard("he", true)
  //       .set("prompt", "请弃置一张锦囊牌，或依次弃置两张牌。")
  //       .forResult()
  //     if (
  //       (!result.cards ||
  //         get.type(
  //           result.cards[0],
  //           "trick",
  //           result.cards[0].original === "h" ? target : false,
  //         ) !== "trick") &&
  //       target.countCards("he", (card) =>
  //         lib.filter.cardDiscardable(card, target),
  //       )
  //     ) {
  //       await target.chooseToDiscard("he", true).set("prompt", "请弃置第二张牌")
  //     }
  //   },
  // },
  // dcfencheng: {
  //   audio: 2,
  //   audioname: ["ol_liru"],
  //   audioname2: {
  //     ol_sb_dongzhuo: "dcfencheng_ol_sb_dongzhuo",
  //   },
  //   enable: "phaseUse",
  //   filterTarget: lib.filter.notMe,
  //   limited: true,
  //   line: "fire",
  //   skillAnimation: "epic",
  //   animationColor: "fire",
  //   async content(event, trigger, player) {
  //     player.awakenSkill(event.name)
  //     const targets = game.filterPlayer((current) => current !== player)
  //     targets.sortBySeat(event.target)
  //     let num = 1
  //     if (targets.length) {
  //       for (const target of targets) {
  //         if (target.isIn()) {
  //           player.line(target, "fire")
  //           const result = await target
  //             .chooseToDiscard(
  //               "he",
  //               `焚城：弃置至少${get.cnNumber(num)}张牌，或受到2点火焰伤害`,
  //               [num, Infinity],
  //               "allowChooseAll",
  //             )
  //             .set("ai", (card) => {
  //               if (ui.selected.cards.length >= get.event().num) {
  //                 return -1
  //               }
  //               if (get.player().hasSkillTag("nofire")) {
  //                 return -1
  //               }
  //               if (get.event().res >= 0) {
  //                 return 6 - get.value(card)
  //               }
  //               if (get.type(card) !== "basic") {
  //                 return 10 - get.value(card)
  //               }
  //               return 8 - get.value(card)
  //             })
  //             .set("num", num)
  //             .set("res", get.damageEffect(target, player, target, "fire"))
  //             .forResult()

  //           if (!result?.bool) {
  //             await target.damage(2, "fire")
  //             num = 1
  //           } else {
  //             num = result.cards.length + 1
  //           }
  //         }
  //       }
  //     }
  //   },
  //   subSkill: { ol_sb_dongzhuo: { audio: 1 } },
  //   ai: {
  //     order: 1,
  //     result: {
  //       player(player, target) {
  //         if (player.hasUnknown(2)) {
  //           return 0
  //         }
  //         let num = 0,
  //           eff = 0,
  //           players = game
  //             .filterPlayer((current) => {
  //               return current !== player
  //             })
  //             .sortBySeat(target)
  //         for (const target of players) {
  //           if (get.damageEffect(target, player, target, "fire") >= 0) {
  //             num = 0
  //             continue
  //           }
  //           let shao = false
  //           num++
  //           if (
  //             target.countCards("he", (card) => {
  //               if (get.type(card) !== "basic") {
  //                 return get.value(card) < 10
  //               }
  //               return get.value(card) < 8
  //             }) < num
  //           ) {
  //             shao = true
  //           }
  //           if (shao) {
  //             eff -= 4 * (get.realAttitude || get.attitude)(player, target)
  //             num = 0
  //           } else {
  //             eff -=
  //               (num * (get.realAttitude || get.attitude)(player, target)) / 4
  //           }
  //         }
  //         if (eff < 4) {
  //           return 0
  //         }
  //         return eff
  //       },
  //     },
  //   },
  // },
  // // 刘辟
  // olyicheng: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   async content(event, trigger, player) {
  //     let num = player.maxHp,
  //       cards = get.cards(num, true)
  //     await player.showCards(cards, `${get.translation(player)}发动了【易城】`)
  //     if (player.countCards("h")) {
  //       const sum = cards.reduce((num, card) => num + get.number(card), 0)
  //       const { bool, moved } = await player
  //         .chooseToMove("易城：请选择你要交换的牌")
  //         .set("filterMove", (from, to) => {
  //           return typeof to !== "number"
  //         })
  //         .set("list", [
  //           [
  //             "牌堆顶",
  //             cards,
  //             (list) => {
  //               const { sum } = get.event()
  //               const sum2 = list.reduce(
  //                 (num, card) => num + get.number(card, false),
  //                 0,
  //               )
  //               return (
  //                 "牌堆顶（现" +
  //                 sum2 +
  //                 { 0: "=", "-1": "<", 1: ">" }[
  //                   get.sgn(sum2 - sum).toString()
  //                 ] +
  //                 "原" +
  //                 sum +
  //                 "）"
  //               )
  //             },
  //           ],
  //           ["手牌", player.getCards("h")],
  //         ])
  //         .set("filterOk", (moved) => moved[1].some((i) => !get.owner(i)))
  //         .set("processAI", (list) => {
  //           const player = get.event().player,
  //             limit = Math.min(get.event().num, player.countCards("h"))
  //           const cards = list[0][1].slice(),
  //             hs = player.getCards("h")
  //           if (
  //             cards.reduce((num, card) => num + get.value(card), 0) >
  //             player
  //               .getCards("h")
  //               .reduce((num, card) => num + get.value(card), 0)
  //           ) {
  //             cards.sort((a, b) => get.number(a) - get.number(b))
  //             hs.sort((a, b) => get.number(b) - get.number(a))
  //             const cards2 = cards.slice(0, limit),
  //               hs2 = hs.slice(0, limit)
  //             if (
  //               hs2.reduce((num, card) => num + get.number(card), 0) >
  //               cards2.reduce((num, card) => num + get.number(card), 0)
  //             ) {
  //               cards.removeArray(cards2)
  //               hs.removeArray(hs2)
  //               return [cards.concat(hs2), hs.concat(cards2)]
  //             }
  //             return [cards, hs]
  //           }
  //           cards.sort((a, b) => get.value(b) - get.value(a))
  //           hs.sort((a, b) => get.value(a) - get.value(b))
  //           const cards2 = cards.slice(0, limit),
  //             hs2 = hs.slice(0, limit),
  //             list = [cards, hs]
  //           for (let i = 0; i < limit; i++) {
  //             if (get.value(cards2[i]) > get.value(hs2[i])) {
  //               const change = [cards2[i], hs2[i]]
  //               cards[i] = change[1]
  //               hs[i] = change[0]
  //             } else {
  //               break
  //             }
  //           }
  //           return list
  //         })
  //         .set("sum", sum)
  //         .set("num", num)
  //         .forResult()
  //       if (bool) {
  //         const puts = player.getCards("h", (i) => moved[0].includes(i))
  //         const gains = cards.filter((i) => moved[1].includes(i))
  //         if (puts.length && gains.length) {
  //           player.$throw(puts, 1000)
  //           await player.lose(puts, ui.special)
  //           await player.gain(gains, "gain2")
  //           //调整手牌顺序
  //           player.getCards("h").forEach((i) => i.goto(ui.special))
  //           player.directgain(moved[1].reverse(), false)

  //           cards = moved[0].slice()
  //           if (cards.length) {
  //             await game.cardsGotoOrdering(cards)
  //             await game.cardsGotoPile(cards.slice().reverse(), "insert")
  //             game.log(cards, "被放回了牌堆顶")
  //             game.updateRoundNumber()
  //           }
  //           await player.showCards(
  //             cards,
  //             `${get.translation(player)}【易城】第一次交换后`,
  //           )
  //           if (
  //             cards.reduce((num, card) => num + get.number(card), 0) > sum &&
  //             player.countCards("h")
  //           ) {
  //             const { bool } = await player
  //               .chooseBool(
  //                 `易城：是否使用全部手牌交换${get.translation(cards)}？`,
  //               )
  //               .set(
  //                 "choice",
  //                 (() => {
  //                   return (
  //                     cards.reduce((num, card) => num + get.value(card), 0) >
  //                     player
  //                       .getCards("h")
  //                       .reduce((num, card) => num + get.value(card), 0)
  //                   )
  //                 })(),
  //               )
  //               .forResult()
  //             if (bool) {
  //               const hs = player.getCards("h")
  //               player.$throw(hs, 1000)
  //               await player.lose(hs, ui.special)
  //               await player.gain(cards, "gain2")
  //               cards = hs.slice()
  //               if (cards.length) {
  //                 await game.cardsGotoOrdering(cards)
  //                 await game.cardsGotoPile(cards.slice().reverse(), "insert")
  //                 game.log(cards, "被放回了牌堆顶")
  //                 game.updateRoundNumber()
  //               }
  //               await player.showCards(
  //                 cards,
  //                 `${get.translation(player)}【易城】第二次交换后`,
  //               )
  //             }
  //           }
  //         }
  //       }
  //     }
  //   },
  //   ai: {
  //     order: 9,
  //     result: { player: 1 },
  //   },
  // },
  // //卢氏
  // olzhuyan: {
  //   audio: 2,
  //   trigger: { player: "phaseDiscardEnd" },
  //   init(player) {
  //     player.addSkill("olzhuyan_record")
  //   },
  //   onremove: ["olzhuyan_true", "olzhuyan_false"],
  //   filter(event, player) {
  //     return game.hasPlayer((current) => {
  //       return [true, false].some(
  //         (bool) =>
  //           !player.getStorage(`olzhuyan_${bool}`).includes(current) &&
  //           lib.skill.olzhuyan.getNum(current, bool),
  //       )
  //     })
  //   },
  //   getNum(player, status) {
  //     if (!_status.olzhuyan?.[player.playerid]) {
  //       return 0
  //     }
  //     let num = _status.olzhuyan[player.playerid][status ? 1 : 0]
  //     if (status) {
  //       const no = num > 5
  //       num -= player.countCards("h")
  //       if (no) {
  //         num = Math.min(0, num)
  //       }
  //     } else {
  //       num -= player.hp
  //       if (num + player.hp < 1) {
  //         num = 1 - player.hp
  //       }
  //     }
  //     return num
  //   },
  //   getMap(player) {
  //     const map = {}
  //     for (const bool of [true, false]) {
  //       const targeted = player.getStorage(`olzhuyan_${bool}`)
  //       game.countPlayer((current) => {
  //         if (targeted.includes(current)) {
  //           return false
  //         }
  //         if (!map[current.playerid]) {
  //           map[current.playerid] = []
  //         }
  //         map[current.playerid][bool ? 1 : 0] = lib.skill.olzhuyan.getNum(
  //           current,
  //           bool,
  //         )
  //       })
  //     }
  //     return map
  //   },
  //   async cost(event, trigger, player) {
  //     const map = get.info(event.skill).getMap(player)
  //     const targetprompt = (map, target) => {
  //       const list = map[target.playerid] || []
  //       let str = ""
  //       for (let i = 0; i < 2; i++) {
  //         if (list[i] === undefined) {
  //           str += "--"
  //         } else {
  //           str += (list[i] > 0 ? "+" : "") + list[i]
  //         }
  //         str += "/"
  //       }
  //       return str.slice(0, -1)
  //     }
  //     const func = (targetprompt, map) => {
  //       game.countPlayer((target) => {
  //         const text = targetprompt(map, target)
  //         target.prompt(`体力值${text.replaceAll("/", "<br>手牌数")}`)
  //       })
  //     }
  //     if (event.player === game.me) {
  //       func(targetprompt, map)
  //     } else if (event.isOnline()) {
  //       player.send(func, targetprompt, map)
  //     }
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt(event.skill),
  //         "令一名角色将{体力值/手牌数}调整至与其上个结束阶段相同(“--”表示已对其发动过该分支)",
  //         (card, player, target) => {
  //           const list = get.event().map[target.playerid]
  //           return list && (list[0] || list[1])
  //         },
  //       )
  //       .set("map", map)
  //       .set("ai", (target) => {
  //         const list = get.event().map[target.playerid]
  //         const att = get.attitude(get.player(), target)
  //         const v1 = list[0],
  //           v2 = get.sgn(list[1]) * Math.sqrt(Math.abs(list[1]))
  //         return Math[att > 0 ? "max" : "min"](v1, v2) * att
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const {
  //       targets: [target],
  //     } = event
  //     const map = get.info(event.name).getMap(player)
  //     const list = map[target.playerid]
  //     const choices = ["体力值", "手牌数"]
  //     let result
  //     if (list[0] && list[1]) {
  //       result = await player
  //         .chooseControl(choices)
  //         .set("choiceList", [
  //           "令" +
  //             get.translation(target) +
  //             (list[0] > 0 ? "回复" : "失去") +
  //             Math.abs(list[0]) +
  //             "点体力" +
  //             (list[0] < 0 ? "（至多失去至1）" : ""),
  //           "令" +
  //             get.translation(target) +
  //             (list[1] > 0 ? "摸" : "弃置") +
  //             get.cnNumber(Math.abs(list[1])) +
  //             "张" +
  //             (list[1] > 0 ? "" : "手") +
  //             "牌" +
  //             (list[1] > 0 ? "（至多摸至5）" : ""),
  //         ])
  //         .set("prompt", "驻颜：请选择一项")
  //         .set("ai", () => _status.event.choice)
  //         .set(
  //           "choice",
  //           (() => {
  //             const v1 = list[0],
  //               v2 = get.sgn(list[1]) * Math.sqrt(Math.abs(list[1]))
  //             if (get.attitude(player, target) > 0) {
  //               return v1 > v2 ? 0 : 1
  //             }
  //             return v1 > v2 ? 1 : 0
  //           })(),
  //         )
  //         .forResult()
  //     } else {
  //       result = { index: list[0] ? 0 : 1 }
  //     }
  //     const ind = result.index
  //     player.markAuto(`olzhuyan_${Boolean(ind)}`, [target])
  //     let num = map[target.playerid][ind]
  //     if (ind === 0) {
  //       if (num > 0) {
  //         await target.recover(num)
  //       } else {
  //         await target.loseHp(Math.min(target.hp - 1, -num))
  //       }
  //     } else {
  //       if (num > 0) {
  //         num = Math.min(5 - target.countCards("h"), num)
  //         if (num > 0) {
  //           await target.draw(num)
  //         }
  //       } else {
  //         num = -num
  //         if (target.countCards("h")) {
  //           await target
  //             .chooseToDiscard(num, true)
  //             .set(
  //               "prompt",
  //               `驻颜：请弃置${get.cnNumber(Math.abs(num))}张手牌`,
  //               "allowChooseAll",
  //             )
  //         }
  //       }
  //     }
  //   },
  //   subSkill: {
  //     record: {
  //       trigger: { global: ["phaseJieshuAfter", "phaseBefore", "enterGame"] },
  //       lastDo: true,
  //       charlotte: true,
  //       forced: true,
  //       popup: false,
  //       forceDie: true,
  //       filter(event, player) {
  //         return event.name !== "phase" || game.phaseNumber === 0
  //       },
  //       content() {
  //         if (!_status.olzhuyan) {
  //           _status.olzhuyan = {}
  //         }
  //         if (event.triggername === "phaseBefore") {
  //           game.countPlayer((current) => {
  //             _status.olzhuyan[current.playerid] = [
  //               current.hp,
  //               current.countCards("h"),
  //             ]
  //           })
  //         } else {
  //           _status.olzhuyan[trigger.player.playerid] = [
  //             trigger.player.hp,
  //             trigger.player.countCards("h"),
  //           ]
  //         }
  //       },
  //     },
  //   },
  // },
  // olleijie: {
  //   audio: 2,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(
  //         get.prompt(event.skill),
  //         "令一名角色判定。若结果为♠2~9，其受到2点雷电伤害，否则其摸两张牌。",
  //       )
  //       .set("ai", (target) => {
  //         const { player, sgn } = get.event()
  //         if (sgn > 0) {
  //           return get.damageEffect(target, target, player, "thunder")
  //         }
  //         if (sgn === 0) {
  //           return get.attitude(player, target)
  //         }
  //         return 0
  //       })
  //       .set(
  //         "sgn",
  //         (() => {
  //           let sgn = 0
  //           game.countPlayer((current) => {
  //             if (!current.hasSkillTag("rejudge")) {
  //               return
  //             }
  //             sgn = get.sgnAttitude(player, current)
  //           })
  //           return sgn
  //         })(),
  //       )
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const {
  //       targets: [target],
  //     } = event
  //     const { bool } = await target
  //       .judge((card) => {
  //         const number = get.number(card)
  //         if (get.suit(card) === "spade" && number >= 2 && number <= 9) {
  //           return -4
  //         }
  //         return 2
  //       })
  //       .set("judge2", (result) => {
  //         return result.bool === false
  //       })
  //       .forResult()
  //     if (bool) {
  //       await target.draw(2)
  //     } else {
  //       await target.damage(2, "thunder")
  //     }
  //   },
  // },
  // //OL谋文丑
  // olsblunzhan: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     const nums = Array.from({ length: 5 })
  //       .map((_, i) => i + 1)
  //       .removeArray(player.getStorage("olsblunzhan_used"))
  //     return nums.length > 0 && player.countCards("hes") >= Math.min(...nums)
  //   },
  //   onChooseToUse(event) {
  //     if (!game.online && !event.olsblunzhan) {
  //       const player = get.player()
  //       event.set("olsblunzhan", player.getHistory("useCard"))
  //     }
  //     event.targetprompt2.add((target) => {
  //       if (
  //         !target.isIn() ||
  //         get.event().skill !== "olsblunzhan" ||
  //         !get.event().filterTarget(get.card(), get.player(), target)
  //       ) {
  //         return false
  //       }
  //       const player = get.player(),
  //         history = get.event().olsblunzhan
  //       const num = history?.filter((evt) =>
  //         evt.targets?.includes(target),
  //       ).length
  //       return `轮战${num}`
  //     })
  //   },
  //   filterCard: true,
  //   selectCard: () => [1, 5],
  //   position: "hes",
  //   filterOk: () =>
  //     !get
  //       .player()
  //       .getStorage("olsblunzhan_used")
  //       .includes(ui.selected.cards.length),
  //   viewAs: { name: "juedou", storage: { olsblunzhan: true } },
  //   allowChooseAll: true,
  //   precontent() {
  //     player.addTempSkill("olsblunzhan_used")
  //     player.markAuto("olsblunzhan_used", event.result.cards.length)
  //     player.addTempSkill("olsblunzhan_effect")
  //   },
  //   ai: {
  //     order(item, player) {
  //       return get.order({ name: "juedou" }, player) - 0.1
  //     },
  //   },
  //   locked: false,
  //   mod: {
  //     playerEnabled(card, player, target) {
  //       if (
  //         card.storage?.olsblunzhan &&
  //         player.getStorage("olsblunzhan_ban").includes(target)
  //       ) {
  //         return false
  //       }
  //     },
  //   },
  //   subSkill: {
  //     used: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //     ban: {
  //       charlotte: true,
  //       onremove: true,
  //     },
  //     effect: {
  //       charlottte: true,
  //       audio: "olsblunzhan",
  //       trigger: { source: "damageSource" },
  //       filter(event, player) {
  //         const evt = event.getParent(2)
  //         if (
  //           evt?.name !== "useCard" ||
  //           evt.player !== player ||
  //           !evt.card?.storage?.olsblunzhan
  //         ) {
  //           return false
  //         }
  //         return evt.targets?.length === 1 && evt.targets[0] === event.player
  //       },
  //       prompt2(event, player) {
  //         const num = player.getHistory("useCard", (evt) =>
  //           evt.targets?.includes(event.player),
  //         ).length
  //         return `摸${get.cnNumber(num)}张牌，本回合不能再对其发动〖轮战〗`
  //       },
  //       logTarget: "player",
  //       async content(event, trigger, player) {
  //         await player.draw(
  //           player.getHistory("useCard", (evt) =>
  //             evt.targets?.includes(trigger.player),
  //           ).length,
  //         )
  //         player.addTempSkill("olsblunzhan_ban")
  //         player.markAuto("olsblunzhan_ban", [trigger.player])
  //       },
  //     },
  //   },
  // },
  // olsbjuejue: {
  //   audio: 2,
  //   trigger: { player: "useCardToPlayer" },
  //   filter(event, player) {
  //     if (_status.currentPhase !== player) {
  //       return false
  //     }
  //     if (
  //       !event.isFirstTarget ||
  //       event.targets.length !== 1 ||
  //       event.target === player
  //     ) {
  //       return false
  //     }
  //     return (
  //       player
  //         .getHistory("useCard", (evt) => {
  //           if (!evt.olsbjuejue) {
  //             return false
  //           }
  //           return (evt.targets ?? []).length === 1 && evt.targets[0] !== player
  //         })
  //         .indexOf(event.getParent()) === 0
  //     )
  //   },
  //   forced: true,
  //   logTarget: "target",
  //   content() {
  //     const { target } = trigger
  //     target.chooseToDiscard(
  //       "he",
  //       true,
  //       player.getHistory("useCard", (evt) => evt.targets?.includes(target))
  //         .length,
  //     )
  //   },
  //   init(player, skill) {
  //     player.addSkill(`${skill}_mark`)
  //   },
  //   onremove(player, skill) {
  //     player.removeSkill(`${skill}_mark`)
  //   },
  //   subSkill: {
  //     mark: {
  //       charlotte: true,
  //       trigger: {
  //         player: "loseEnd",
  //         global: [
  //           "equipEnd",
  //           "addJudgeEnd",
  //           "gainEnd",
  //           "loseAsyncEnd",
  //           "addToExpansionEnd",
  //         ],
  //       },
  //       filter(event, player) {
  //         if (_status.currentPhase !== player) {
  //           return false
  //         }
  //         if (player.countCards("h") || event.getParent().name !== "useCard") {
  //           return false
  //         }
  //         const evt = event.getl(player)
  //         return (
  //           evt?.player === player &&
  //           evt.hs?.length > 0 &&
  //           evt.hs.length === evt.cards.length
  //         )
  //       },
  //       forced: true,
  //       popup: false,
  //       firstDo: true,
  //       content() {
  //         trigger.getParent().set("olsbjuejue", true)
  //       },
  //     },
  //   },
  // },
  // // SP张郃
  // spolzhouxuan: {
  //   audio: 2,
  //   trigger: { player: ["phaseDiscardBegin", "useCard", "phaseUseEnd"] },
  //   filter(event, player) {
  //     if (event.name === "phaseDiscard") {
  //       return (
  //         player.countCards("h") &&
  //         player.getExpansions("spolzhouxuan").length < 5
  //       )
  //     }
  //     return player.countExpansions("spolzhouxuan")
  //   },
  //   preHidden: true,
  //   async cost(event, trigger, player) {
  //     if (trigger.name !== "phaseDiscard") {
  //       event.result = { bool: true }
  //     } else {
  //       event.result = await player
  //         .chooseCard(
  //           "h",
  //           get.prompt(event.skill),
  //           [1, 5 - player.countExpansions(event.skill)],
  //           `将至多${get.cnNumber(5 - player.countExpansions(event.skill))}张手牌置于武将牌上`,
  //         )
  //         .set("allowChooseAll", true)
  //         .set("ai", (card) => {
  //           const player = get.player()
  //           if (ui.selected.cards.length >= player.needsToDiscard()) {
  //             return 6 - get.value(card)
  //           }
  //           return 100 - get.useful(card)
  //         })
  //         .setHiddenSkill(event.skill)
  //         .forResult()
  //     }
  //   },
  //   async content(event, trigger, player) {
  //     if (trigger.name === "phaseDiscard") {
  //       const next = player.addToExpansion(event.cards, player, "give")
  //       next.gaintag.add(event.name)
  //       await next
  //     } else if (trigger.name === "useCard") {
  //       await player.loseToDiscardpile(
  //         player.getExpansions(event.name).randomGet(),
  //       )
  //       let num = 1
  //       if (!player.isMaxHandcard(true)) {
  //         num += player.countExpansions(event.name)
  //       }
  //       await player.draw(num)
  //     } else {
  //       await player.loseToDiscardpile(player.getExpansions(event.name))
  //     }
  //   },
  //   marktext: "旋",
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
  // },
  // //OL陶谦
  // olzongluan: {
  //   audio: 2,
  //   trigger: { player: "phaseZhunbeiBegin" },
  //   filter(event, player) {
  //     return game.hasPlayer((t) =>
  //       t.hasUseTarget(
  //         new lib.element.VCard({
  //           name: "sha",
  //           storage: { olzongluan: true },
  //           isCard: true,
  //         }),
  //       ),
  //     )
  //   },
  //   async cost(event, trigger, player) {
  //     event.result = await player
  //       .chooseTarget(get.prompt2(event.skill), (card, player, target) => {
  //         return target.hasUseTarget(
  //           new lib.element.VCard({
  //             name: "sha",
  //             storage: { olzongluan: true },
  //             isCard: true,
  //           }),
  //         )
  //       })
  //       .set("ai", (target) => {
  //         const player = get.player(),
  //           card = new lib.element.VCard({
  //             name: "sha",
  //             storage: { olzongluan: true },
  //             isCard: true,
  //           })
  //         let targets = game.filterPlayer((current) => {
  //           if (!target.canUse(card, current)) {
  //             return false
  //           }
  //           return get.effect(current, card, target, player) > 0
  //         })
  //         if (!targets.length) {
  //           return 0
  //         }
  //         if (
  //           targets.some(
  //             (current) => get.effect(current, card, target, target) > 0,
  //           )
  //         ) {
  //           targets = targets.filter(
  //             (current) => get.effect(current, card, target, target) > 0,
  //           )
  //         } else {
  //           targets = [
  //             targets.sort(
  //               (a, b) =>
  //                 get.effect(b, card, target, target) -
  //                 get.effect(a, card, target, target),
  //             )[0],
  //           ]
  //         }
  //         return targets.reduce(
  //           (sum, current) => sum + get.effect(current, card, target, player),
  //           0,
  //         )
  //       })
  //       .forResult()
  //   },
  //   async content(event, trigger, player) {
  //     const target = event.targets[0]
  //     target
  //       .chooseUseTarget(
  //         new lib.element.VCard({
  //           name: "sha",
  //           storage: { olzongluan: true },
  //           isCard: true,
  //         }),
  //         true,
  //         false,
  //       )
  //       .set("selectTarget", [1, Infinity])
  //     const num = game.countPlayer2(
  //       (c) =>
  //         c.hasHistory(
  //           "damage",
  //           (evt) => evt.getParent(4).name === "olzongluan",
  //         ),
  //       true,
  //     )
  //     if (num > 0) {
  //       await player.chooseToDiscard(num, true, "he")
  //     }
  //   },
  //   init(player, skill) {
  //     game.addGlobalSkill(`${skill}_effect`)
  //   },
  //   subSkill: {
  //     effect: {
  //       mod: {
  //         playerEnabled(card, player, target) {
  //           if (card.storage?.olzongluan && !player.inRange(target)) {
  //             return false
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // olzhaohuo: {
  //   audio: 2,
  //   trigger: { global: "damageEnd" },
  //   filter(event, player) {
  //     if (
  //       event.player === player ||
  //       player !== _status.currentPhase ||
  //       !event.player.isIn()
  //     ) {
  //       return false
  //     }
  //     return (
  //       event.player.getHistory("damage").indexOf(event) === 0 &&
  //       event.player.countCards("h")
  //     )
  //   },
  //   forced: true,
  //   logTarget: "player",
  //   async content(event, trigger, player) {
  //     player.addTempSkill("olzhaohuo_tag")
  //     const next = trigger.player.chooseToGive(player, true, "h")
  //     next.gaintag.add("olzhaohuo_tag")
  //     await next
  //   },
  //   subSkill: {
  //     tag: {
  //       charlotte: true,
  //       onremove(player, skill) {
  //         player.removeGaintag(skill)
  //       },
  //       mod: {
  //         cardEnabled2(card) {
  //           if (
  //             [card]
  //               .concat(card.cards || [])
  //               .some(
  //                 (c) =>
  //                   get.itemtype(c) === "card" && c.hasGaintag("olzhaohuo_tag"),
  //               )
  //           ) {
  //             return false
  //           }
  //         },
  //         ignoredHandcard(card) {
  //           if (card.hasGaintag("olzhaohuo_tag")) {
  //             return true
  //           }
  //         },
  //         cardDiscardable(card, player, name) {
  //           if (name === "phaseDiscard" && card.hasGaintag("olzhaohuo_tag")) {
  //             return false
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // olwenren: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filterTarget: true,
  //   selectTarget: [1, Infinity],
  //   async content(event, trigger, player) {
  //     const { target } = event
  //     const num =
  //       !target.countCards("h") +
  //       (target.countCards("h") <= player.countCards("h"))
  //     if (num) {
  //       await target.draw(num)
  //     }
  //   },
  //   ai: {
  //     order: 10,
  //     result: {
  //       target(player, target) {
  //         return !target.countCards("h") ||
  //           target.countCards("h") <= player.countCards("h")
  //           ? 1
  //           : 0
  //       },
  //     },
  //   },
  // },
  // xinfu_tushe: {
  //   audio: 2,
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (get.tag(card, "multitarget")) {
  //         if (player.countCards("h", { type: "basic" })) {
  //           return num / 10
  //         }
  //         return num * 10
  //       }
  //       if (get.type(card) === "basic") {
  //         return num + 10
  //       }
  //     },
  //     aiValue(player, card, num) {
  //       if (card.name === "zhangba") {
  //         return 114514
  //       }
  //       if (["shan", "tao", "jiu"].includes(card.name)) {
  //         if (player.getEquip("zhangba") && player.countCards("hs") > 1) {
  //           return 0.01
  //         }
  //         return num / 2
  //       }
  //       if (get.tag(card, "multitarget")) {
  //         return num + game.players.length
  //       }
  //     },
  //     aiUseful(player, card, num) {
  //       if (card.name === "zhangba") {
  //         return 114514
  //       }
  //       if (get.name(card, player) === "shan") {
  //         if (
  //           player.countCards("hs", (i) => {
  //             if (card === i || card.cards?.includes(i)) {
  //               return false
  //             }
  //             return get.name(i, player) === "shan"
  //           })
  //         ) {
  //           return -1
  //         }
  //         return num / Math.max(1, player.hp) ** 2
  //       }
  //     },
  //   },
  //   trigger: {
  //     player: "useCardToPlayered",
  //   },
  //   locked: false,
  //   frequent: true,
  //   filter(event, player) {
  //     if (get.type(event.card) === "equip") {
  //       return false
  //     }
  //     if (event.getParent().triggeredTargets3.length > 1) {
  //       return false
  //     }
  //     return (
  //       event.targets.length > 0 && !player.countCards("h", { type: "basic" })
  //     )
  //   },
  //   content() {
  //     player.draw(trigger.targets.length)
  //   },
  //   ai: {
  //     presha: true,
  //     pretao: true,
  //     threaten: 1.8,
  //     effect: {
  //       player_use(card, player, target) {
  //         if (
  //           typeof card === "object" &&
  //           card.name !== "shan" &&
  //           get.type(card) !== "equip" &&
  //           !player.countCards("h", (i) => {
  //             if (card === i || card.cards?.includes(i)) {
  //               return false
  //             }
  //             return get.type(i) === "basic"
  //           })
  //         ) {
  //           const targets = [],
  //             evt = _status.event.getParent("useCard")
  //           targets.addArray(ui.selected.targets)
  //           if (evt && evt.card === card) {
  //             targets.addArray(evt.targets)
  //           }
  //           if (targets.length) {
  //             return [1, targets.length]
  //           }
  //           if (get.tag(card, "multitarget")) {
  //             return [1, game.players.length - 1]
  //           }
  //           return [1, 1]
  //         }
  //       },
  //     },
  //   },
  // },
  // xinfu_limu: {
  //   mod: {
  //     targetInRange(card, player, target) {
  //       if (player.countCards("j") && player.inRange(target)) {
  //         return true
  //       }
  //     },
  //     cardUsableTarget(card, player, target) {
  //       if (player.countCards("j") && player.inRange(target)) {
  //         return true
  //       }
  //     },
  //     aiOrder(player, card, num) {
  //       if (
  //         get.type(card, null, player) === "trick" &&
  //         player.canUse(card, player) &&
  //         player.canAddJudge(card)
  //       ) {
  //         return 15
  //       }
  //     },
  //   },
  //   locked: false,
  //   audio: 2,
  //   enable: "phaseUse",
  //   discard: false,
  //   filter(event, player) {
  //     if (player.hasJudge("lebu")) {
  //       return false
  //     }
  //     return player.countCards("hes", { suit: "diamond" }) > 0
  //   },
  //   viewAs: { name: "lebu" },
  //   //prepare:"throw",
  //   position: "hes",
  //   filterCard(card, player, event) {
  //     const lebu = get.autoViewAs({ name: "lebu", cards: [card] }, [card])
  //     return (
  //       get.suit(card) === "diamond" && lib.filter.judge(lebu, player, player)
  //     )
  //   },
  //   selectTarget: -1,
  //   filterTarget(card, player, target) {
  //     return player === target
  //   },
  //   check(card) {
  //     var player = _status.event.player
  //     if (!player.getEquip("zhangba")) {
  //       let damaged = player.maxHp - player.hp - 1
  //       if (
  //         player.countCards("h", (cardx) => {
  //           if (cardx === card) {
  //             return false
  //           }
  //           if (cardx.name === "tao") {
  //             if (damaged < 1) {
  //               return true
  //             }
  //             damaged--
  //           }
  //           return ["shan", "jiu"].includes(cardx.name)
  //         }) > 0
  //       ) {
  //         return 0
  //       }
  //     }
  //     if (card.name === "shan") {
  //       return 15
  //     }
  //     if (card.name === "tao" || card.name === "jiu") {
  //       return 10
  //     }
  //     return 9 - get.value(card)
  //   },
  //   onuse(links, player) {
  //     var next = game.createEvent(
  //       "limu_recover",
  //       false,
  //       _status.event.getParent(),
  //     )
  //     next.player = player
  //     next.setContent(() => {
  //       player.recover()
  //     })
  //   },
  //   ai: {
  //     result: {
  //       target(player, target) {
  //         if (player.countCards("hes", "zhangba")) {
  //           return player.countCards("h", { type: "basic" })
  //         }
  //         let res = lib.card.lebu.ai.result.target(player, target)
  //         if (player.countCards("hs", "sha") >= player.hp) {
  //           res++
  //         }
  //         if (target.isDamaged()) {
  //           return res + 2 * Math.abs(get.recoverEffect(target, player, target))
  //         }
  //         return res
  //       },
  //       ignoreStatus: true,
  //     },
  //     order(item, player) {
  //       if (player.hp > 1 && player.countCards("j")) {
  //         return 0
  //       }
  //       return 12
  //     },
  //     effect: {
  //       target(card, player, target) {
  //         if (
  //           target.isPhaseUsing() &&
  //           typeof card === "object" &&
  //           get.type(card, null, target) === "delay" &&
  //           !target.countCards("j")
  //         ) {
  //           const shas =
  //             target.getCards("hs", (i) => {
  //               if (card === i || card.cards?.includes(i)) {
  //                 return false
  //               }
  //               return (
  //                 get.name(i, target) === "sha" && target.getUseValue(i) > 0
  //               )
  //             }) - target.getCardUsable("sha")
  //           if (shas > 0) {
  //             return [1, 1.5 * shas]
  //           }
  //         }
  //       },
  //     },
  //   },
  // },
  // //卫兹
  // yuanzi: {
  //   audio: 2,
  //   trigger: { global: "phaseZhunbeiBegin" },
  //   logTarget: "player",
  //   filter(event, player) {
  //     return (
  //       player !== event.player &&
  //       event.player.isIn() &&
  //       player.countCards("h") > 0 &&
  //       !player.hasSkill("yuanzi_round", null, null, false)
  //     )
  //   },
  //   check(event, player) {
  //     if (
  //       event.player.hasJudge("lebu") ||
  //       get.attitude(player, event.player) < 2
  //     ) {
  //       return false
  //     }
  //     return game.hasPlayer(
  //       (current) =>
  //         current !== player &&
  //         current !== event.player &&
  //         event.player.inRange(current) &&
  //         get.attitude(event.player, current) < 0,
  //     )
  //   },
  //   content() {
  //     var cards = player.getCards("h")
  //     player.give(cards, trigger.player)
  //     player.addTempSkill("yuanzi_effect")
  //     player.addTempSkill("yuanzi_round", "roundStart")
  //   },
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       audio: "yuanzi",
  //       trigger: { global: "damageSource" },
  //       forced: true,
  //       filter(event, player) {
  //         var source = event.source
  //         return (
  //           source &&
  //           source === _status.currentPhase &&
  //           player.countCards("h") <= source.countCards("h")
  //         )
  //       },
  //       content() {
  //         player.draw(2)
  //       },
  //     },
  //     round: { charlotte: true },
  //   },
  // },
  // liejie: {
  //   audio: 2,
  //   trigger: { player: "damageEnd" },
  //   direct: true,
  //   filter(event, player) {
  //     return player.countCards("he") > 0
  //   },
  //   content() {
  //     "step 0"
  //     var source = trigger.source
  //     var prompt2 = "弃置至多三张牌并摸等量的牌"
  //     if (source) {
  //       prompt2 += `，若弃置的牌中有红色牌，则弃置${get.translation(source)}至多等量的牌`
  //     }
  //     var next = player.chooseToDiscard(
  //       "he",
  //       [1, 3],
  //       get.prompt("liejie"),
  //       prompt2,
  //     )
  //     next.set("ai", (card) => 6 - get.value(card))
  //     if (source) {
  //       next.logSkill = ["liejie", source]
  //     } else {
  //       next.logSkill = "liejie"
  //     }
  //     ;("step 1")
  //     if (result.bool) {
  //       var cards = result.cards
  //       player.draw(cards.length)
  //       if (trigger.source) {
  //         var num = cards.filter((i) => get.color(i, player) === "red").length
  //         if (num > 0) {
  //           player
  //             .discardPlayerCard(trigger.source, "he", [1, num])
  //             .set("forceAuto", true)
  //         }
  //       }
  //     }
  //   },
  // },
  // //田畴
  // olshandao: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     return game.hasPlayer((target) =>
  //       lib.skill.olshandao.filterTarget(null, player, target),
  //     )
  //   },
  //   filterTarget(card, player, target) {
  //     return target.countCards("hej")
  //   },
  //   usable: 1,
  //   selectTarget: [1, Infinity],
  //   multitarget: true,
  //   multiline: true,
  //   async content(event, trigger, player) {
  //     const wugu = new lib.element.VCard({ name: "wugu", isCard: true })
  //     const wanjian = new lib.element.VCard({ name: "wanjian", isCard: true })
  //     const targets = game.filterPlayer((target) => {
  //         if (target === player) {
  //           return false
  //         }
  //         return (
  //           !event.targets.includes(target) &&
  //           player.canUse(wanjian, target, false)
  //         )
  //       }),
  //       targetx = event.targets.sortBySeat()
  //     const dialog = [
  //       "将这些角色的各一张牌置于牌堆顶，然后视为对这些角色使用【五谷丰登】",
  //     ]
  //     for (const target of targetx) {
  //       const name = target === player ? "你" : get.translation(target)
  //       if (target.countCards("h")) {
  //         dialog.add(`<div class="text center">${name}的手牌区</div>`)
  //         if (
  //           player.hasSkillTag("viewHandcard", null, target, true) ||
  //           player === target
  //         ) {
  //           dialog.push(target.getCards("h"))
  //         } else {
  //           dialog.push([target.getCards("h"), "blank"])
  //         }
  //       }
  //       if (target.countCards("e")) {
  //         dialog.addArray([
  //           `<div class="text center">${name}的装备区</div>`,
  //           target.getCards("e"),
  //         ])
  //       }
  //       if (target.countCards("j")) {
  //         dialog.addArray([
  //           `<div class="text center">${name}的判定区</div>`,
  //           target.getCards("j"),
  //         ])
  //       }
  //     }
  //     const { bool, links } = await player
  //       .chooseButton(dialog, event.targets.length, true)
  //       .set("filterButton", (button) => {
  //         return !ui.selected.buttons.some(
  //           (but) => get.owner(but.link) === get.owner(button.link),
  //         )
  //       })
  //       .set(
  //         "ai",
  //         (button) =>
  //           1 / (get.value(button.link, get.owner(button.link)) || 0.5),
  //       )
  //       .forResult()
  //     if (bool) {
  //       const cards = links.sort(
  //         (a, b) =>
  //           targetx.indexOf(get.owner(a)) - targetx.indexOf(get.owner(b)),
  //       )
  //       for (const card of cards) {
  //         const target = get.owner(card)
  //         target.$throw(1, 1000)
  //         await target.lose([card], ui.cardPile, "insert")
  //       }
  //       const targety = targetx.filter((target) =>
  //         player.canUse(wugu, target, false),
  //       )
  //       if (targety.length) {
  //         await player.useCard(wugu, targety, false)
  //       }
  //       if (targets.length) {
  //         await player.useCard(wanjian, targets, false)
  //       }
  //     }
  //   },
  //   ai: {
  //     order: 9,
  //     result: { target: 1 },
  //   },
  // },
  // //SP孟获
  // spmanwang: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filter(event, player) {
  //     return player.countCards("he") > 0
  //   },
  //   filterCard: lib.filter.cardDiscardable,
  //   position: "he",
  //   selectCard: [1, Infinity],
  //   check(card) {
  //     var player = _status.event.player
  //     var max = Math.min(
  //       player.isDamaged() ? 3 : 2,
  //       4 - player.countMark("spmanwang"),
  //     )
  //     if (!max && !player.hasSkill("sppanqin")) {
  //       return 0
  //     }
  //     if (max === 0 && ui.selected.length > 0) {
  //       return 0
  //     }
  //     return 7 - ui.selected.cards.length - get.value(card)
  //   },
  //   allowChooseAll: true,
  //   content() {
  //     var num = Math.min(cards.length, 4 - player.countMark("spmanwang"))
  //     if (num >= 1) {
  //       player.addSkills("sppanqin")
  //     }
  //     if (num >= 2) {
  //       player.draw()
  //     }
  //     if (num >= 3) {
  //       player.recover()
  //     }
  //     if (num >= 4) {
  //       player.draw(2)
  //       player.removeSkills("sppanqin")
  //     }
  //   },
  //   intro: { content: "已经移去过#个选项" },
  //   ai: {
  //     order: 2,
  //     result: {
  //       player(player, target) {
  //         if (player.getUseValue({ name: "nanman" }) <= 0) {
  //           return 0
  //         }
  //         if (
  //           player.getStat("skill").spmanwang &&
  //           player.hasSkill("sppanqin")
  //         ) {
  //           return 0
  //         }
  //         return 1
  //       },
  //     },
  //   },
  //   derivation: "sppanqin",
  // },
  // sppanqin: {
  //   audio: 2,
  //   trigger: { player: ["phaseUseEnd", "phaseDiscardEnd"] },
  //   filter(event, player) {
  //     var cards = [],
  //       bool = true
  //     player.getHistory("lose", (evt) => {
  //       if (
  //         !bool ||
  //         evt.type !== "discard" ||
  //         evt.getParent(event.name) !== event
  //       ) {
  //         return false
  //       }
  //       for (var i of evt.cards2) {
  //         if (get.position(i, true) === "d") {
  //           cards.add(i)
  //           if (
  //             !game.checkMod(i, player, "unchanged", "cardEnabled2", player)
  //           ) {
  //             bool = false
  //           }
  //         }
  //       }
  //     })
  //     if (!bool || !cards.length) {
  //       return false
  //     }
  //     return player.hasUseTarget(get.autoViewAs({ name: "nanman" }, cards))
  //   },
  //   prompt2(event, player) {
  //     var cards = []
  //     player.getHistory("lose", (evt) => {
  //       if (evt.type !== "discard" || evt.getParent(event.name) !== event) {
  //         return false
  //       }
  //       for (var i of evt.cards2) {
  //         if (get.position(i, true) === "d") {
  //           cards.add(i)
  //         }
  //       }
  //     })
  //     return (
  //       "将" +
  //       get.translation(cards) +
  //       "（共计" +
  //       get.cnNumber(cards.length) +
  //       "张牌）当做【南蛮入侵】使用"
  //     )
  //   },
  //   check(event, player) {
  //     var cards = [],
  //       bool = true
  //     player.getHistory("lose", (evt) => {
  //       if (
  //         !bool ||
  //         evt.type !== "discard" ||
  //         evt.getParent(event.name) !== event
  //       ) {
  //         return false
  //       }
  //       for (var i of evt.cards2) {
  //         if (get.position(i, true) === "d") {
  //           cards.add(i)
  //           if (
  //             !game.checkMod(i, player, "unchanged", "cardEnabled2", player)
  //           ) {
  //             bool = false
  //           }
  //         }
  //       }
  //     })
  //     if (!bool || !cards.length) {
  //       return false
  //     }
  //     return player.hasValueTarget(get.autoViewAs({ name: "nanman" }, cards))
  //   },
  //   content() {
  //     "step 0"
  //     var cards = []
  //     player.getHistory("lose", (evt) => {
  //       if (evt.type !== "discard" || evt.getParent(trigger.name) !== trigger) {
  //         return false
  //       }
  //       for (var i of evt.cards2) {
  //         if (get.position(i, true) === "d") {
  //           cards.add(i)
  //         }
  //       }
  //     })
  //     player.chooseUseTarget(true, { name: "nanman" }, cards)
  //     player.addTempSkill("sppanqin_eff")
  //   },
  //   subSkill: {
  //     eff: {
  //       trigger: { player: "useCard" },
  //       charlotte: true,
  //       forced: true,
  //       popup: false,
  //       filter(event, player) {
  //         return (
  //           event.card.name === "nanman" &&
  //           event.getParent(2).name === "sppanqin" &&
  //           player.countMark("spmanwang") < 4 &&
  //           player.hasSkill("spmanwang", null, null, false) &&
  //           event.cards.length <= event.targets.length
  //         )
  //       },
  //       content() {
  //         player.addMark("spmanwang", 1, false)
  //         switch (player.countMark("spmanwang")) {
  //           case 1:
  //             player.draw(2)
  //             player.removeSkills("sppanqin")
  //             break
  //           case 2:
  //             player.recover()
  //             break
  //           case 3:
  //             player.draw()
  //             break
  //           case 4:
  //             player.addSkills("sppanqin")
  //             break
  //         }
  //       },
  //     },
  //   },
  // },
  // gnjinfan: {
  //   trigger: { player: "phaseDiscardBegin" },
  //   direct: true,
  //   locked: false,
  //   audio: 2,
  //   filter(event, player) {
  //     var list = []
  //     player.getCards("s", (card) => {
  //       if (card.hasGaintag("gnjinfan")) {
  //         list.add(get.suit(card))
  //       }
  //     })
  //     if (list.length >= lib.suit.length) {
  //       return false
  //     }
  //     return (
  //       player.countCards(
  //         "h",
  //         (card) => _status.connectMode || !list.includes(get.suit(card)),
  //       ) > 0
  //     )
  //   },
  //   content() {
  //     "step 0"
  //     player
  //       .chooseCard(
  //         "h",
  //         get.prompt("gnjinfan"),
  //         "将任意张手牌当做“铃”置于武将牌上",
  //         [
  //           1,
  //           (() => {
  //             var list = []
  //             var list2 = []
  //             player.getCards("s", (card) => {
  //               if (card.hasGaintag("gnjinfan")) {
  //                 list.add(get.suit(card))
  //               }
  //             })
  //             player.getCards("h", (card) => {
  //               list2.add(get.suit(card))
  //             })
  //             list2.removeArray(list)
  //             return Math.max(1, list2.length)
  //           })(),
  //         ],
  //         (card, player) =>
  //           !player.countCards(
  //             "s",
  //             (cardx) =>
  //               cardx.hasGaintag("gnjinfan") &&
  //               get.suit(cardx, false) === get.suit(card, player),
  //           ) &&
  //           !ui.selected.cards.filter(
  //             (cardx) => get.suit(cardx, player) === get.suit(card, player),
  //           ).length,
  //       )
  //       .set("ai", (card) => {
  //         var player = _status.event.player
  //         if (player.hasUseTarget(card) && !player.hasValueTarget(card)) {
  //           return 0
  //         }
  //         if (["sha", "shan", "wuxie", "caochuan"].includes(card.name)) {
  //           return 2 + Math.random()
  //         }
  //         return 1 + Math.random()
  //       })
  //       .set("complexCard", true)
  //     ;("step 1")
  //     if (result.bool) {
  //       player.logSkill("gnjinfan")
  //       game.log(player, "将", result.cards, "放到了武将牌上")
  //       player.loseToSpecial(result.cards, "gnjinfan").visible = true
  //     } else {
  //       event.finish()
  //     }
  //     ;("step 2")
  //     player.markSkill("gnjinfan")
  //   },
  //   group: ["gnjinfan_gain"],
  //   marktext: "铃",
  //   intro: {
  //     mark(dialog, storage, player) {
  //       dialog.addAuto(
  //         player.getCards("s", (card) => card.hasGaintag("gnjinfan")),
  //       )
  //     },
  //     markcount(storage, player) {
  //       return player.getCards("s", (card) => card.hasGaintag("gnjinfan"))
  //         .length
  //     },
  //     onunmark(storage, player) {
  //       var cards = player.getCards("s", (card) => card.hasGaintag("gnjinfan"))
  //       if (cards.length) {
  //         player.lose(cards, ui.discardPile)
  //         player.$throw(cards, 1000)
  //         game.log(cards, "进入了弃牌堆")
  //       }
  //     },
  //   },
  //   mod: {
  //     aiOrder(player, card, num) {
  //       if (get.itemtype(card) === "card" && card.hasGaintag("gnjinfan")) {
  //         return num + 0.5
  //       }
  //     },
  //   },
  //   init(player, skill) {
  //     player.addSkill("gnjinfan_nouse")
  //   },
  //   onremove(player, skill) {
  //     player.removeSkill("gnjinfan_nouse")
  //   },
  //   subSkill: {
  //     nouse: {
  //       charlotte: true,
  //       locked: true,
  //       mod: {
  //         cardEnabled2(card, player) {
  //           if (get.itemtype(card) === "card" && card.hasGaintag("gnjinfan")) {
  //             if (!player.hasSkill("gnjinfan")) {
  //               return false
  //             }
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // gnjinfan_gain: {
  //   audio: "gnjinfan",
  //   trigger: { player: "loseAfter" },
  //   forced: true,
  //   sourceSkill: "gnjinfan",
  //   filter(event, player) {
  //     if (!event.ss?.length) {
  //       return false
  //     }
  //     for (var i in event.gaintag_map) {
  //       if (event.gaintag_map[i].includes("gnjinfan")) {
  //         return true
  //       }
  //       return false
  //     }
  //   },
  //   content() {
  //     "step 0"
  //     var cards = []
  //     for (var i of trigger.ss) {
  //       if (
  //         !trigger.gaintag_map[i.cardid] ||
  //         !trigger.gaintag_map[i.cardid].includes("gnjinfan")
  //       ) {
  //         continue
  //       }
  //       var suit = get.suit(i, false)
  //       var card = get.cardPile2(
  //         (card) => !cards.includes(card) && get.suit(card, false) === suit,
  //       )
  //       if (card) {
  //         cards.push(card)
  //       }
  //     }
  //     if (cards.length) {
  //       player.gain(cards, "gain2")
  //     }
  //     var num = player.getCards("s", (card) =>
  //       card.hasGaintag("gnjinfan"),
  //     ).length
  //     if (num) {
  //       player.markSkill("gnjinfan")
  //     } else {
  //       player.unmarkSkill("gnjinfan")
  //     }
  //     ;("step 1")
  //     game.updateRoundNumber()
  //   },
  // },
  // gnsheque: {
  //   audio: 2,
  //   trigger: { global: "phaseZhunbeiBegin" },
  //   direct: true,
  //   filter(event, player) {
  //     return (
  //       event.player.isIn() &&
  //       event.player.countCards("e") > 0 &&
  //       lib.filter.targetEnabled({ name: "sha" }, player, event.player) &&
  //       (player.hasSha() || (_status.connectMode && player.countCards("h") > 0))
  //     )
  //   },
  //   clearTime: true,
  //   content() {
  //     player
  //       .chooseToUse(
  //         function (card, player, event) {
  //           if (get.name(card) !== "sha") {
  //             return false
  //           }
  //           return lib.filter.filterCard.apply(this, arguments)
  //         },
  //         `射却：是否对${get.translation(trigger.player)}使用一张杀？`,
  //       )
  //       .set("logSkill", "gnsheque")
  //       .set("complexSelect", true)
  //       .set("filterTarget", function (card, player, target) {
  //         if (
  //           target !== _status.event.sourcex &&
  //           !ui.selected.targets.includes(_status.event.sourcex)
  //         ) {
  //           return false
  //         }
  //         return lib.filter.targetEnabled.apply(this, arguments)
  //       })
  //       .set("sourcex", trigger.player)
  //       .set("oncard", (card) => {
  //         try {
  //           card.gnsheque_tag = true
  //         } catch (e) {
  //           alert(
  //             "发生了一个导致【射却】无法正常触发无视防具效果的错误。请关闭十周年UI/手杀ui等扩展以解决",
  //           )
  //         }
  //       })
  //   },
  //   ai: {
  //     unequip: true,
  //     unequip_ai: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (tag === "unequip_ai") {
  //         if (_status.event.getParent().name !== "gnsheque") {
  //           return false
  //         }
  //       } else if (!arg?.card?.gnsheque_tag) {
  //         return false
  //       }
  //     },
  //   },
  // },
  // //张奂
  // dcyiju: {
  //   audio: 2,
  //   trigger: { target: "useCardToPlayered" },
  //   forced: true,
  //   filter(event, player) {
  //     return (
  //       event.player !== player &&
  //       event.targets.length === 1 &&
  //       player.countDiscardableCards(player, "he")
  //     )
  //   },
  //   async content(event, trigger, player) {
  //     await player
  //       .chooseToDiscard(`义拒：请弃置一张牌`, "he", true)
  //       .set("ai", (card) => {
  //         const player = get.player()
  //         if (player.hasSkill("dcshuguo", null, false, false)) {
  //           return Math.max(
  //             ...game
  //               .filterPlayer2((target) =>
  //                 player.canUse(card, target, true, false),
  //               )
  //               .map((target) => get.effect_use(target, card, player, player)),
  //           )
  //         }
  //         return 6 - get.value(card)
  //       })
  //   },
  //   ai: {
  //     neg: true,
  //     combo: "dcshuguo",
  //   },
  // },
  // dcshuguo: {
  //   audio: 2,
  //   trigger: { global: "phaseEnd" },
  //   filter(event, player) {
  //     return game.hasGlobalHistory("cardMove", (evt) => {
  //       if (evt.type !== "discard" || evt.getlx === false) {
  //         return false
  //       }
  //       return evt.getd().someInD("d")
  //     })
  //   },
  //   async content(event, trigger, player) {
  //     const cards = [],
  //       cards2 = []
  //     game.checkGlobalHistory("cardMove", (evt) => {
  //       if (evt.type !== "discard" || evt.getlx === false) {
  //         return false
  //       }
  //       game.filterPlayer2().forEach((target) => {
  //         const cardsx = evt.getd(target, "cards2").filterInD("d")
  //         if (cardsx.length) {
  //           cards.addArray(cardsx)
  //           if (target !== player) {
  //             cards2.addArray(cardsx)
  //           }
  //         }
  //       })
  //     })
  //     const goon = () =>
  //       cards.some(
  //         (card) => player.hasUseTarget(card) && get.position(card) === "d",
  //       )
  //     while (goon()) {
  //       const result = await player
  //         .chooseButton([
  //           "戍国：请选择要使用的牌",
  //           [
  //             cards.map((card) => [
  //               card,
  //               (() => {
  //                 return cards2.includes(card) ? "其他角色" : ""
  //               })(),
  //             ]),
  //             (item, type, position, noclick, node) => {
  //               node = ui.create.buttonPresets.card(
  //                 item[0],
  //                 type,
  //                 position,
  //                 noclick,
  //               )
  //               game.createButtonCardsetion(item[1], node)
  //               return node
  //             },
  //           ],
  //         ])
  //         .set("filterButton", (button) => {
  //           return get.event().canUse.includes(button.link)
  //         })
  //         .set("ai", (button) => {
  //           return get.player().getUseValue(button.link)
  //         })
  //         .set(
  //           "canUse",
  //           cards.filter(
  //             (card) => player.hasUseTarget(card) && get.position(card) === "d",
  //           ),
  //         )
  //         .forResult()
  //       if (result?.bool && result.links?.length) {
  //         const card = result.links[0]
  //         cards.remove(card)
  //         await player.chooseUseTarget(card, true)
  //         if (cards2.includes(card)) {
  //           break
  //         }
  //       } else {
  //         break
  //       }
  //     }
  //     if (!player.isMaxHandcard(true)) {
  //       await player.draw(Math.min(cards.length, 5))
  //     }
  //   },
  // },
  // //☆胃炎
  // mbguli: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   filterCard: true,
  //   selectCard: -1,
  //   position: "h",
  //   usable: 1,
  //   filter(event, player) {
  //     var hs = player.getCards("h")
  //     if (!hs.length) {
  //       return false
  //     }
  //     for (var card of hs) {
  //       var mod2 = game.checkMod(
  //         card,
  //         player,
  //         "unchanged",
  //         "cardEnabled2",
  //         player,
  //       )
  //       if (mod2 === false) {
  //         return false
  //       }
  //     }
  //     return event.filterCard(get.autoViewAs({ name: "sha" }, hs))
  //   },
  //   viewAs: {
  //     name: "sha",
  //     storage: { mbguli: true },
  //   },
  //   onuse(links, player) {
  //     player.addTempSkill("mbguli_effect", "phaseUseAfter")
  //   },
  //   locked: false,
  //   mod: {
  //     cardUsable(card, player) {
  //       if (card?.storage?.mbguli) {
  //         return Infinity
  //       }
  //     },
  //   },
  //   ai: {
  //     order: 1,
  //     threaten: 1.14514,
  //     unequip_ai: true,
  //     skillTagFilter(player, tag, arg) {
  //       if (arg && arg.name === "sha" && arg.card?.storage?.mbguli) {
  //         return true
  //       }
  //       return false
  //     },
  //   },
  //   subSkill: {
  //     effect: {
  //       audio: "mbguli",
  //       trigger: { global: "useCardAfter" },
  //       charlotte: true,
  //       prompt2: "将手牌摸至体力上限，然后若此牌未造成过伤害，你失去1点体力",
  //       check(event, player) {
  //         var num = player.maxHp - player.countCards("h")
  //         return (num >= 3 && player.hp >= 2) || (num >= 2 && player.hp >= 3)
  //       },
  //       filter(event, player) {
  //         return event.card.storage?.mbguli
  //       },
  //       async content(event, trigger, player) {
  //         await player.drawTo(player.maxHp)
  //         if (
  //           game.hasPlayer2((current) => {
  //             return current.hasHistory(
  //               "damage",
  //               (evt) => evt.card === trigger.card,
  //             )
  //           }, true)
  //         ) {
  //           return
  //         }
  //         await player.loseHp()
  //       },
  //       group: "mbguli_unequip",
  //     },
  //     unequip: {
  //       trigger: {
  //         player: "useCardToPlayered",
  //       },
  //       filter({ card }) {
  //         return card.name === "sha" && card.storage && card.storage.mbguli
  //       },
  //       forced: true,
  //       popup: false,
  //       logTarget: "target",
  //       async content(event, trigger, player) {
  //         trigger.target.addTempSkill("qinggang2")
  //         trigger.target.storage.qinggang2.add(trigger.card)
  //         trigger.target.markSkill("qinggang2")
  //       },
  //     },
  //   },
  // },
  // mbaosi: {
  //   audio: 2,
  //   trigger: { source: "damageSource" },
  //   forced: true,
  //   filter(event, player) {
  //     return (
  //       player.inRange(event.player) &&
  //       player.isPhaseUsing() &&
  //       event.player.isIn() &&
  //       !player.getStorage("mbaosi_inf").includes(event.player)
  //     )
  //   },
  //   logTarget: "player",
  //   content() {
  //     player.addTempSkill("mbaosi_inf", "phaseUseAfter")
  //     player.markAuto("mbaosi_inf", [trigger.player])
  //   },
  //   group: ["mbaosi_directHit"],
  //   subSkill: {
  //     directHit: {
  //       forced: true,
  //       trigger: { player: "useCard" },
  //       filter(event, player) {
  //         const evt = event.getParent("phaseUse")
  //         return (
  //           evt?.player === player &&
  //           player
  //             .getHistory(
  //               "useCard",
  //               (evtx) => evtx.getParent("phaseUse") === evt,
  //             )
  //             .indexOf(event) ===
  //             game.roundNumber - 1
  //         )
  //       },
  //       async content(event, trigger, player) {
  //         trigger.directHit.addArray(game.players)
  //         game.log(trigger.card, "不可被响应")
  //       },
  //     },
  //     inf: {
  //       charlotte: true,
  //       onremove: true,
  //       forced: true,
  //       intro: { content: "对$使用牌无次数限制" },
  //       mod: {
  //         cardUsableTarget(card, player, target) {
  //           if (player.getStorage("mbaosi_inf").includes(target)) {
  //             return true
  //           }
  //         },
  //       },
  //     },
  //   },
  // },
  // //谋吕布
  // sbwushuang: {
  //   audio: 6,
  //   trigger: { source: "damageBegin1" },
  //   filter(event, player) {
  //     const target = event.player
  //     const evtx = event.getParent(2)
  //     const card = event.card
  //     const name = card?.name
  //     if (!card || !["sha", "juedou"].includes(name)) {
  //       return false
  //     }
  //     if (name === "sha") {
  //       return !target.hasHistory("useCard", (evt) => {
  //         return (
  //           evt.card.name === "shan" &&
  //           evt.respondTo &&
  //           evt.getParent(3) === evtx
  //         )
  //       })
  //     }
  //     return !target.hasHistory("respond", (evt) => {
  //       return (
  //         evt.card.name === "sha" && evt.respondTo && evt.getParent(3) === evtx
  //       )
  //     })
  //   },
  //   forced: true,
  //   logTarget: "player",
  //   usable: 2,
  //   logAudio: () => ["sbwushuang4.mp3", "sbwushuang5.mp3"],
  //   content() {
  //     trigger.num++
  //   },
  //   group: ["sbwushuang_1", "sbwushuang_2"],
  //   preHidden: ["sbwushuang_1", "sbwushuang_2"],
  //   subSkill: {
  //     1: {
  //       audio: "sbwushuang",
  //       sourceSkill: "sbwushuang",
  //       logAudio: () => ["sbwushuang1.mp3", "sbwushuang6.mp3"],
  //       inherit: "wushuang1",
  //       audioname: [],
  //       audioname2: {},
  //     },
  //     2: {
  //       audio: "sbwushuang",
  //       sourceSkill: "sbwushuang",
  //       logAudio: () => ["sbwushuang1.mp3", "sbwushuang6.mp3"],
  //       inherit: "wushuang2",
  //       audioname: [],
  //       audioname2: {},
  //     },
  //   },
  // },
  // sbliyu: {
  //   audio: 5,
  //   logAudio: (index) => (typeof index === "number" ? `sbliyu${index}.mp3` : 2),
  //   trigger: { source: "damageSource" },
  //   filter(event, player) {
  //     return (
  //       event.player !== player &&
  //       event?.card?.name === "sha" &&
  //       event.player.countGainableCards(player, "hej") > 0 &&
  //       event.player.isIn()
  //     )
  //   },
  //   async cost(event, trigger, player) {
  //     const target = trigger.player
  //     event.result = await player
  //       .gainPlayerCard(get.prompt2(event.skill), trigger.player, "hej", [
  //         1,
  //         trigger.num,
  //       ])
  //       .set("logSkill", [event.skill, [target], null, null, [get.rand(1, 2)]])
  //       .forResult()
  //   },
  //   popup: false,
  //   async content(event, trigger, player) {
  //     const cards = event.cards
  //     const target = trigger.player
  //     const draw = (await target.draw(cards.length).forResult()).cards
  //     if (Array.isArray(cards) && Array.isArray(draw)) {
  //       const types = [cards, draw]
  //         .flatMap((list) => list.map((card) => get.type2(card)))
  //         .unique()
  //       if (types.length >= 3) {
  //         const list = [
  //           `${get.translation(player)}视为对你指定的另一名其他角色使用一张【决斗】`,
  //           `你获得技能〖无双〗直至你下个回合结束`,
  //         ]
  //         let result
  //         const juedou = game.hasPlayer(
  //           (current) =>
  //             current !== player &&
  //             current !== target &&
  //             player.canUse(
  //               new lib.element.VCard({ name: "juedou", isCard: true }),
  //               current,
  //               false,
  //             ),
  //         )
  //         const wushuang = !target.hasSkill("wushuang", null, false, false)
  //         if (juedou || wushuang) {
  //           if (!juedou) {
  //             result = { control: "选项二" }
  //           } else if (!wushuang) {
  //             result = { control: "选项一" }
  //           } else {
  //             result = await target
  //               .chooseControl()
  //               .set("prompt", `${get.translation(event.name)}：请选择一项`)
  //               .set("choiceList", list)
  //               .set("ai", () => {
  //                 const player = get.player()
  //                 const source = get.event().getParent().player
  //                 const juedou = new lib.element.VCard({
  //                   name: "juedou",
  //                   isCard: true,
  //                 })
  //                 return game.hasPlayer((target) => {
  //                   return (
  //                     ![player, source].includes(target) &&
  //                     source.canUse(juedou, target, false) &&
  //                     get.effect(target, juedou, source, player) > 0
  //                   )
  //                 })
  //                   ? "选项一"
  //                   : "选项二"
  //               })
  //               .forResult()
  //           }
  //           player.logSkill("sbliyu", null, null, null, [
  //             result.control === "选项一" ? get.rand(3, 4) : 5,
  //           ])
  //           if (result.control === "选项一") {
  //             const result2 = await target
  //               .chooseTarget(
  //                 true,
  //                 (card, player, target) => {
  //                   var evt = get.event().getParent()
  //                   return (
  //                     evt.player.canUse({ name: "juedou" }, target) &&
  //                     target !== get.player()
  //                   )
  //                 },
  //                 `利驭：请选择一名角色，视为${get.translation(player)}对其使用【决斗】`,
  //               )
  //               .set("ai", (target) => {
  //                 var evt = get.event().getParent()
  //                 return get.effect(
  //                   target,
  //                   { name: "juedou" },
  //                   evt.player,
  //                   get.player(),
  //                 )
  //               })
  //               .set("animate", false)
  //               .forResult()
  //             if (result2?.bool && result2.targets?.length) {
  //               target.line2([player, result2.targets[0]])
  //               await game.delayx()
  //               await player
  //                 .useCard(
  //                   new lib.element.VCard({ name: "juedou", isCard: true }),
  //                   result2.targets[0],
  //                   false,
  //                   "noai",
  //                 )
  //                 .set("animate", false)
  //             }
  //           } else {
  //             const skill = `${event.name}_effect`
  //             await target.addAdditionalSkills(skill, "wushuang")
  //             target.addTempSkill(skill, { player: "phaseAfter" })
  //           }
  //         }
  //       }
  //     }
  //   },
  //   derivation: "wushuang",
  //   subSkill: {
  //     effect: {
  //       charlotte: true,
  //       init(player) {
  //         game.broadcastAll(
  //           (player) =>
  //             Array.isArray(player.tempname) && player.tempname.add("sb_lvbu"),
  //           player,
  //         )
  //       },
  //       onremove(player) {
  //         game.broadcastAll(
  //           (player) =>
  //             Array.isArray(player.tempname) &&
  //             player.tempname.remove("sb_lvbu"),
  //           player,
  //         )
  //       },
  //       mark: true,
  //       audio: ["sbwushuang2.mp3", "sbwushuang3.mp3"],
  //       intro: { content: "这熟悉的力量！！！" },
  //     },
  //   },
  // },
  // //严夫人
  // channi: {
  //   audio: 2,
  //   enable: "phaseUse",
  //   usable: 1,
  //   filter(event, player) {
  //     return player.countCards("h") > 0
  //   },
  //   filterTarget: lib.filter.notMe,
  //   filterCard: true,
  //   selectCard: [1, Infinity],
  //   allowChooseAll: true,
  //   check(card) {
  //     const player = _status.event.player,
  //       num = player.hasSkill("nifu") ? 15 : 8
  //     if (
  //       ui.selected.cards.length <=
  //       Math.max(1, player.needsToDiscard(), player.countCards("h") - 4)
  //     ) {
  //       return num - get.value(card)
  //     }
  //     return num / 2 - get.value(card)
  //   },
  //   position: "h",
  //   discard: false,
  //   lose: false,
  //   delay: false,
  //   content() {
  //     "step 0"
  //     player.give(cards, target)
  //     player.addTempSkill("channi_effect")
  //     ;("step 1")
  //     if (target.countCards("h") > 0) {
  //       game.broadcastAll((num) => {
  //         lib.skill.channi_backup.selectCard = [1, num]
  //       }, cards.length)
  //       var next = target.chooseToUse()
  //       next.set(
  //         "openskilldialog",
  //         `将至多${get.cnNumber(cards.length)}张手牌当做【决斗】使用`,
  //       )
  //       next.set("norestore", true)
  //       next.set("addCount", false)
  //       next.set("_backupevent", "channi_backup")
  //       next.set("custom", {
  //         add: {},
  //         replace: { window() {} },
  //       })
  //       next.backup("channi_backup")
  //     }
  //     ;("step 2")
  //     player.removeSkill("channi_effect")
  //   },
  //   subSkill: {
  //     effect: {
  //       trigger: { global: ["damageSource", "damageEnd"] },
  //       filter(event, player, name) {
  //         if (event.card?.name !== "juedou") {
  //           return false
  //         }
  //         const evt = event.getParent(2)
  //         if (evt?.name !== "useCard" || evt.card.name !== "juedou") {
  //           return false
  //         }
  //         const user = evt.player
  //         const evtx = event.getParent("channi", true)
  //         if (!evtx || evtx.player !== player) {
  //           return false
  //         }
  //         if (name === "damageSource") {
  //           return event.source === user && evt.cards.length
  //         }
  //         return event.player === user && player.countCards("h")
  //       },
  //       forced: true,
  //       charlotte: true,
  //       logTarget(event, player, name) {
  //         return event[name === "damageSource" ? "source" : "player"]
  //       },
  //       content() {
  //         const evt = trigger.getParent(2)
  //         if (event.triggername === "damageSource") {
  //           evt.player.draw(evt.cards.length)
  //         } else {
  //           player.chooseToDiscard("h", true, player.countCards("h"))
  //         }
  //       },
  //     },
  //     backup: {
  //       filterCard(card) {
  //         return get.itemtype(card) === "card"
  //       },
  //       viewAs: { name: "juedou" },
  //       position: "h",
  //       filterTarget: lib.filter.targetEnabled,
  //       ai1: (card) => {
  //         if (get.name(card) === "sha") {
  //           return 0
  //         }
  //         return 5.5 - get.value(card)
  //       },
  //       log: false,
  //       allowChooseAll: true,
  //     },
  //   },
  //   ai: {
  //     order: 0.3,
  //     result: {
  //       target(player, target) {
  //         if (
  //           target === game.me ||
  //           target.isOnline() ||
  //           target.hasValueTarget({ name: "juedou" })
  //         ) {
  //           return 2
  //         }
  //         if (player.needsToDiscard()) {
  //           return 0.5
  //         }
  //         return 0
  //       },
  //     },
  //   },
  // },
  // nifu: {
  //   audio: 2,
  //   trigger: { global: "phaseEnd" },
  //   forced: true,
  //   filter(event, player) {
  //     return player.countCards("h") !== 4
  //   },
  //   content() {
  //     var num = player.countCards("h") - 4
  //     if (num > 0) {
  //       player.chooseToDiscard("h", num, true, "allowChooseAll")
  //     } else {
  //       player.draw(-num)
  //     }
  //   },
  // },
}

export default skills
