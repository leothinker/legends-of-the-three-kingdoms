import { lib, game, ui, get, ai, _status } from "wtk"
game.import("card", function () {
  return {
    name: "refresh",
    connect: true,
    card: {
      muniu: {
        fullskin: true,
        type: "equip",
        subtype: "equip5",
        nomod: true,
        onEquip() {
          if (card && card.storages?.length) {
            player.directgains(card.storages, null, "muniu")
          }
          player.markSkill("muniu_skill")
        },
        forceDie: true,
        onLose() {
          if (card?.storage?.used) {
            card.storage.used = 0
          }
          if (!player.getVCards("e", (i) => i.name == "muniu").length) {
            player.unmarkSkill("muniu_skill")
          } else {
            player.markSkill("muniu_skill")
          }
          if (!card || !card.storages || !card.storages.length) {
            return
          }
          if (
            (!event.getParent(3) || event.getParent(3).name != "swapEquip") &&
            (event.getParent().type != "equip" || event.getParent().swapEquip)
          ) {
            player.lose(card.storages, ui.discardPile)
            player.$throw(card.storages, 1000)
            player.popup("muniu")
            game.log(card, "掉落了", card.storages)
            card.storages.length = 0
          } else {
            player.lose(card.storages, ui.special)
          }
        },
        clearLose: true,
        equipDelay: false,
        loseDelay: false,
        skills: ["muniu_skill", "muniu_skill7"],
        ai: {
          equipValue(card) {
            if (card.storages) {
              return 7 + card.storages.length
            }
            return 7
          },
          basic: {
            equipValue: 7,
          },
        },
      },
    },
    skill: {
      muniu_skill: {
        equipSkill: true,
        enable: "phaseUse",
        onChooseToUse(event) {
          if (game.online) {
            return
          }
          const cards = event.player
            .getVCards("e")
            .filter((card) => card.name == "muniu" && !card?.storage?.used)
          event.set("muniu_skill", cards)
        },
        sync(muniu) {
          if (game.online) {
            return
          }
          if (!muniu.storages) {
            muniu.storages = []
          }
          for (var i = 0; i < muniu.storages.length; i++) {
            if (get.position(muniu.storages[i]) != "s") {
              muniu.storages.splice(i--, 1)
            }
          }
          game.broadcast(
            (muniu, cards) => {
              muniu.storages = cards
            },
            muniu,
            muniu.storages,
          )
        },
        filter(event, player) {
          return player.countCards("h") && event?.muniu_skill?.length
        },
        chooseButton: {
          dialog(event, player) {
            const cards = event.muniu_skill
            let list = []
            for (let data of cards) {
              list.push([data.number || 0, get.translation(data.suit), data.name])
            }
            const dialog = ui.create.dialog("木牛流马", [list, "vcard"], "hidden")
            dialog.direct = true
            for (let i = 0; i < dialog.buttons.length; i++) {
              const button = dialog.buttons[i]
              const num = cards[i]?.storages?.length || 0
              button.node.gaintag.innerHTML = get.cnNumber(num) + "牌"
              button._number = num
              button.link = cards[i]
              button._customintro = function (uiintro, evt) {
                uiintro.add("木牛流马")
                let str = "此牌下没有扣置牌"
                if (button.link?.storages?.length) {
                  str = "此牌下扣置了"
                }
                uiintro.add('<div class="text" style="display:inline">' + str + "</div>")
                if (button.link?.storages?.length) {
                  uiintro.addSmall(button.link?.storages)
                }
                return button
              }
            }
            return dialog
          },
          check(button) {
            return -button._number + 1
          },
          backup(links, player) {
            return {
              muniu: links[0].vcardID,
              filterCard: true,
              ai1(card) {
                if (card.name == "du") {
                  return 20
                }
                var player = _status.event.player
                var nh = player.countCards("h")
                if (!player.needsToDiscard()) {
                  if (nh < 3) {
                    return 0
                  }
                  if (nh == 3) {
                    return 5 - get.value(card)
                  }
                  return 7 - get.value(card)
                }
                return 10 - get.useful(card)
              },
              discard: false,
              lose: false,
              delay: false,
              prepare(cards, player) {
                player.$give(1, player, false)
              },
              async content(event, trigger, player) {
                await player.loseToSpecial(event.cards, "muniu")
                for (var i = 0; i < event.cards.length; i++) {
                  if (
                    event.cards[i]._selfDestroyed ||
                    !event.cards[i].hasGaintag("muniu") ||
                    get.position(event.cards[i]) != "s"
                  ) {
                    event.cards[i].remove()
                    event.cards.splice(i--, 1)
                  }
                }
                const muniu = player
                  .getVCards("e")
                  .find((card) => card.vcardID == lib.skill.muniu_skill_backup.muniu)
                if (!muniu || !event.cards.length) {
                  game.broadcastAll((cards) => {
                    for (var i = 0; i < cards.length; i++) {
                      cards[i].discard()
                    }
                  }, event.cards)
                  event.finish()
                  return
                }
                muniu.storages ??= []
                muniu.storage ??= {}
                if (typeof muniu.storage.used != "number") {
                  muniu.storage.used = 0
                }
                muniu.storage.used++
                muniu.storages.push(event.cards[0])
                game.broadcast(
                  (muniu, cards) => {
                    muniu.storages = cards
                  },
                  muniu,
                  muniu.storages,
                )
                await game.delayx()
                player.updateMarks()
                const players = game.filterPlayer((current) => {
                  return (
                    current.canEquip(muniu) &&
                    current != player &&
                    !current.isTurnedOver() &&
                    get.attitude(player, current) >= 3 &&
                    get.attitude(current, player) >= 3
                  )
                })
                players.sort(lib.sort.seat)
                const choice = players[0]
                const next = player
                  .chooseTarget("是否移动木牛流马？", (card, player, target) => {
                    return (
                      !target.isMin() && player != target && target.canEquip(_status.event.muniu)
                    )
                  })
                  .set("muniu", muniu)
                next.set("ai", (target) => {
                  return target == _status.event.choice ? 1 : -1
                })
                next.set("choice", choice)
                const result = await next.forResult()
                if (result?.bool && result?.targets?.length) {
                  const card = player.getCards("e", (i) => i[i.cardSymbol] == muniu)[0]
                  if (card) {
                    await result.targets[0].equip(card)
                    player.$give(card, result.targets[0])
                    player.line(result.targets, "green")
                    await game.delay()
                  }
                } else {
                  player.updateMarks()
                }
              },
              ai: { result: { player: 1 } },
            }
          },
          prompt(links, player) {
            return (
              "###木牛###将一张手牌扣置于你装备区里的" +
              get.translation(links[0]) +
              "下，然后可以将此装备移动到一名其他角色的装备区里。"
            )
          },
        },
        ai: {
          order: 1,
          expose: 0.1,
          result: { player: 1 },
        },
        mod: {
          cardEnabled2(card, player) {
            if (!ui.selected.cards.length) {
              return
            }
            const cards = player.getVCards("e").filter((i) => i.name == "muniu")
            for (let muniu of cards) {
              if (!muniu || !muniu.storages || !muniu.storages.length) {
                return
              }
              for (var i of ui.selected.cards) {
                if (muniu.cards?.includes(i) && muniu.storages.includes(card)) {
                  return false
                }
                if (muniu.storages.includes(i) && card == muniu) {
                  return false
                }
              }
            }
          },
        },
        mark: true,
        markimage2: "image/card/muniu_small.png",
        intro: {
          content(storage, player) {
            const munius = player.getVCards("e").filter((i) => i.name == "muniu")
            let cards = []
            for (let muniu of munius) {
              if (muniu?.storages?.length) {
                cards.addArray(muniu.storages)
              }
            }
            if (!cards.length) {
              return "共有零张牌"
            }
            if (player.isUnderControl(true)) {
              return get.translation(cards)
            } else {
              return "共有" + get.cnNumber(cards.length) + "张牌"
            }
          },
          mark(dialog, storage, player) {
            const munius = player.getVCards("e").filter((i) => i.name == "muniu")
            let cards = []
            for (let muniu of munius) {
              if (muniu?.storages?.length) {
                cards.addArray(muniu.storages)
              }
            }
            if (!cards.length) {
              return "共有零张牌"
            }
            if (player.isUnderControl(true)) {
              dialog.addAuto(cards)
            } else {
              return "共有" + get.cnNumber(cards.length) + "张牌"
            }
          },
          markcount(storage, player) {
            const munius = player.getVCards("e").filter((i) => i.name == "muniu")
            let cards = []
            for (let muniu of munius) {
              if (muniu?.storages?.length) {
                cards.addArray(muniu.storages)
              }
            }
            return cards.length
          },
        },
        subSkill: { backup: {} },
      },
      muniu_skill7: {
        charlotte: true,
        trigger: { player: ["phaseUseBefore", "loseEnd"] },
        firstDo: true,
        forced: true,
        silent: true,
        delay: false,
        filter(event, player) {
          if (event.name == "phaseUse") {
            return true
          }
          if (!event.ss || !event.ss.length || event.parent.name == "lose_muniu") {
            return false
          }
          const munius = player.getVCards("e").filter((i) => i.name == "muniu")
          let cards = []
          for (let muniu of munius) {
            if (muniu?.storages?.length) {
              cards.addArray(muniu.storages)
            }
          }
          if (!cards.length) {
            return false
          }
          return (
            event.ss.filter(function (card) {
              return cards.includes(card)
            }).length > 0
          )
        },
        content() {
          const munius = player.getVCards("e").filter((i) => i.name == "muniu")
          let cards = []
          for (let muniu of munius) {
            if (muniu?.storages?.length) {
              cards.addArray(muniu.storages)
            }
          }
          if (trigger.name == "phaseUse") {
            for (let muniu of munius) {
              if (muniu?.storage?.used) {
                muniu.storage.used = 0
              }
            }
          } else {
            player.logSkill(event.name)
            for (let muniu of munius) {
              if (muniu && muniu.storages) {
                muniu.storages.removeArray(trigger.ss)
                lib.skill.muniu_skill.sync(muniu)
              }
            }
            player.updateMarks()
          }
        },
      },
    },
    translate: {
      muniu: "木牛流马",
      muniu_bg: "牛",
      muniu_skill: "木牛",
      muniu_skill7: "木牛流马",
      muniu_skill_bg: "辎",
      muniu_info:
        "出牌阶段限一次，你可以将一张手牌扣置于装备区里的【木牛流马】下，然后可以将【木牛流马】放入一名其他角色的装备区；你可以如手牌般使用或打出【木牛流马】下的牌。",
      muniu_skill_info:
        "出牌阶段限一次，你可以将一张手牌扣置于装备区里的【木牛流马】下，然后可以将【木牛流马】放入一名其他角色的装备区；你可以如手牌般使用或打出【木牛流马】下的牌。",
      muniu_append:
        '<span class="text" style="font-family: yuanli">“十年，亮休士劝农于黄沙，作流马木牛毕，教兵讲武。”——《三国志·后主传》</span>',
    },
    list: [["diamond", 5, "muniu"]],
  }
})
