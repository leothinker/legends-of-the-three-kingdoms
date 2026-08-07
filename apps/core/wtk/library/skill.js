import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
export default {
  _equipEnable: {
    chalotte: true,
    mod: {
      globalFrom(from, to, distance) {
        const num = from
          .getVCards("j", (vcard) => {
            if (get.type(vcard) !== "delay") {
              false
            } else if (!vcard.storage?.equipEnable) {
              return false
            }
            return vcard.cards.some((card) => get.type(card) === "equip")
          })
          .map((vcard) => {
            const sum = vcard.cards?.reduce((sum, card) => {
              if (get.type(card) !== "equip") {
                return sum
              }
              const globalFrom = get.info(card)?.distance?.globalFrom || 0
              return sum + globalFrom
            }, 0)
            return sum || 0
          })
          .reduce((a, b) => a + b, 0)
        return distance + num
      },
      globalTo(from, to, distance) {
        const num = to
          .getVCards("j", (vcard) => {
            if (get.type(vcard) !== "delay") {
              false
            } else if (!vcard.storage?.equipEnable) {
              return false
            }
            return vcard.cards.some((card) => get.type(card) === "equip")
          })
          .map((vcard) => {
            const sum = vcard.cards?.reduce((sum, card) => {
              if (get.type(card) !== "equip") {
                return sum
              }
              const globalTo = get.info(card)?.distance?.globalTo || 0
              return sum + globalTo
            }, 0)
            return sum || 0
          })
          .reduce((a, b) => a + b, 0)
        return distance + num
      },
      attackRangeBase(player) {
        const num = player
          .getVCards("j", (vcard) => {
            if (get.type(vcard) !== "delay") {
              false
            } else if (!vcard.storage?.equipEnable) {
              return false
            }
            return vcard.cards.some((card) => get.type(card) === "equip")
          })
          .map((vcard) => {
            const num = vcard.cards?.reduce((sum, card) => {
              if (get.type(card) !== "equip") {
                return sum
              }
              const attackFrom = get.info(card)?.distance?.attackFrom || 0
              return sum + attackFrom
            }, 0)
            return num || 0
          })
          .reduce((a, b) => a + b, 0)
        return Math.max(player.getEquipRange(player.getCards("e")), 1 - num)
      },
    },
  },
  stratagem_fury: {
    marktext: "🔥",
    intro: {
      name: "怒气",
      content: (storage, player) => {
        const stratagemFuryMax = _status.stratagemFuryMax,
          fury = storage || 0
        return `当前怒气值：${typeof stratagemFuryMax === "number" ? `${fury}/${stratagemFuryMax}` : fury}`
      },
    },
  },
  _stratagem_add_buff: {
    log: false,
    enable: "chooseToUse",
    filter: (event, player) => {
      const fury = player.storage.stratagem_fury
      if (!fury) {
        return false
      }
      const stratagemSettings = event.stratagemSettings
      if (
        !stratagemSettings ||
        (!stratagemSettings.roundOneUseFury && game.roundNumber < 2)
      ) {
        return false
      }
      const cards = player.getCards("hs")
      if (!cards.length) {
        return false
      }
      const cost = lib.stratagemBuff.cost,
        names = Array.from(cost.keys())
      if (!names.length) {
        return false
      }
      return cards.some(
        (card) =>
          game.checkMod(card, player, "unchanged", "cardEnabled2", player) &&
          names.some(
            (availableName) =>
              availableName === get.name(card, player) &&
              event.filterCard(
                new lib.element.VCard({
                  name: availableName,
                  nature: get.nature(card, player),
                  isCard: true,
                  cards: [card],
                }),
                player,
                event,
              ) &&
              fury >= cost.get(availableName),
          ),
      )
    },
    onChooseToUse: (event) => {
      const { player } = event,
        fury = player.storage.stratagem_fury
      if (!fury) {
        return
      }
      if (!event.stratagemSettings && !game.online) {
        event.set("stratagemSettings", {
          roundOneUseFury: _status.connectMode
            ? lib.configOL.round_one_use_fury
            : get.config("round_one_use_fury"),
        })
      }
      const cost = lib.stratagemBuff.cost.get("shan")
      if (typeof cost !== "number" || !event.shanRequired) {
        return
      }
      if (!event.shanIgnored) {
        event.shanIgnored = 0
      }
      event.shanIgnored += Math.min(
        player.countCards(lib.skill._stratagem_add_buff.position, {
          name: "shan",
        }),
        Math.floor(fury / cost),
      )
    },
    check: (card) => {
      const player = _status.event.player
      if (_status.event.type === "phase") {
        const cardName = get.name(card, player)
        if (cardName === "sha") {
          if (
            game.hasPlayer((current) => {
              if (!player.canUse(card, current)) {
                return false
              }
              const storage = player.storage,
                zhibi = storage.zhibi
              return (
                ((zhibi && !zhibi.includes(current)) ||
                  get.effect(current, card, player, player) >=
                    2 - Math.max(0, (storage.stratagem_fury || 0) - 1)) &&
                current.mayHaveShan(player, "use") &&
                player.hasSkill("jiu")
              )
            })
          ) {
            return 1
          }
          return 0
        }
        if (cardName === "tao") {
          if (player.hp <= 2 && player.getDamagedHp() >= 2) {
            return 1
          }
          return 0
        }
        return 1
      }
      if (_status.event.type === "dying") {
        return get.attitude(player, _status.event.dying) > 3 ? 1 : 0
      }
      return (_status.event.getParent().shanRequired || 1) > 1 &&
        get.damageEffect(
          player,
          _status.event.getParent().player || player,
          player,
        ) < 0
        ? 1
        : 0
    },
    position: "hs",
    filterCard: (card, player, event) => {
      if (!event) {
        event = _status.event
      }
      const filterCard = event._backup.filterCard
      const cost = lib.stratagemBuff.cost
      return Array.from(cost.keys()).some(
        (availableName) =>
          availableName === get.name(card, player) &&
          filterCard(
            new lib.element.VCard({
              name: availableName,
              nature: get.nature(card, player),
              isCard: true,
              cards: [card],
            }),
            player,
            _status.event,
          ) &&
          player.storage.stratagem_fury >= cost.get(availableName),
      )
    },
    viewAs: (cards, player) => {
      if (cards.length) {
        const cardName = get.name(cards[0], player)
        return cardName
          ? new lib.element.VCard({
              name: cardName,
              nature: get.nature(cards[0], player),
              suit: get.suit(cards[0], player),
              number: get.number(cards[0], player),
              isCard: true,
              cards: [cards[0]],
              storage: {
                stratagem_buffed: 1,
              },
            })
          : new lib.element.VCard()
      }
      return null
    },
    prompt: () => {
      const span = document.createElement("span")
      span.classList.add("text")
      span.style.fontFamily = "yuanli"
      const stratagemBuff = lib.stratagemBuff,
        cost = stratagemBuff.cost
      stratagemBuff.prompt.forEach((prompt, cardName) => {
        const li = document.createElement("li")
        li.innerHTML = `【${get.translation(cardName)}】：${cost.get(cardName)}点怒气。${prompt()}`
        span.appendChild(li)
      })
      return `当你需要使用位于“强化表”内的非虚拟卡牌时，你可以消耗对应数量的怒气将其强化并使用。${document.createElement("hr").outerHTML}${span.outerHTML}`
    },
    onuse: (result, player) => {
      player.logSkill(result.skill)
      const stratagemBuff = lib.stratagemBuff,
        cardName = result.card.name
      player.changeFury(-stratagemBuff.cost.get(cardName), true)
      const gameEvent = get.event(),
        effect = stratagemBuff.effect.get(cardName)
      if (typeof effect === "function") {
        gameEvent.pushHandler("onNextUseCard", effect)
      }
      gameEvent.pushHandler("onNextUseCard", (event, option) => {
        if (event.step === 0 && option.state === "end") {
          game.broadcastAll(
            (cards) =>
              cards.forEach((card) =>
                card.clone.classList.add("stratagem-fury-glow"),
              ),
            event.cards,
          )
        }
      })
    },
    ai: {
      order: (item, player) => {
        if (!player) {
          player = _status.event.player
        }
        if (_status.event.type === "phase") {
          for (const card of player.getCards("hs")) {
            if (
              !game.checkMod(card, player, "unchanged", "cardEnabled2", player)
            ) {
              continue
            }
            const cardName = get.name(card, player)
            if (cardName === "sha") {
              if (
                game.hasPlayer((current) => {
                  if (!player.canUse(card, current)) {
                    return false
                  }
                  const storage = player.storage,
                    zhibi = storage.zhibi
                  return (
                    ((zhibi && !zhibi.includes(current)) ||
                      get.effect(current, card, player, player) >=
                        2 - Math.max(0, (storage.stratagem_fury || 0) - 1)) &&
                    current.mayHaveShan(player, "use")
                  )
                })
              ) {
                return get.order(card, player) + 0.5
              }
            } else if (
              cardName === "tao" &&
              player.hp <= 2 &&
              player.getDamagedHp() >= 2
            ) {
              return get.order(card, player) + 0.5
            }
            return 8
          }
        }
        return 3.5
      },
      directHit_ai: true,
      skillTagFilter: (player, tag, arg) => {
        if (!arg?.card) {
          return false
        }
        const card = get.autoViewAs(arg.card)
        if (card.name !== "sha" || !card.storage.stratagem_buffed) {
          return false
        }
        const target = arg.target
        if (
          target.countCards("h", "shan") >= 1 &&
          !target.storage.stratagem_fury
        ) {
          return false
        }
      },
    },
  },
  expandedSlots: {
    markimage: "image/card/expandedSlots.png",
    intro: {
      markcount: (storage, player) => {
        var all = 0,
          storage = player.expandedSlots
        if (!storage) {
          return 0
        }
        for (var key in storage) {
          var num = storage[key]
          if (typeof num === "number" && num > 0) {
            all += num
          }
        }
        return all
      },
      content: (storage, player) => {
        storage = player.expandedSlots
        if (!storage) {
          return "当前没有扩展装备栏"
        }
        const keys = Object.keys(storage).sort()
        let str = ""
        for (const key of keys) {
          const num = storage[key]
          if (typeof num === "number" && num > 0) {
            const trans = get.translation(key)
            str += `<li>${trans}栏：${num}个<br>`
          }
        }
        if (str.length) {
          return str.slice(0, str.length - 4)
        }
        return "当前没有扩展装备栏"
      },
    },
  },
  //不计入次数模版
  nocount: {
    charlotte: true,
    forced: true,
    popup: false,
    firstDo: true,
    trigger: { player: "useCard1" },
    filter(event, player) {
      return event.addCount !== false
    },
    async content(event, trigger, player) {
      trigger.addCount = false
      const stat = player.getStat().card,
        name = trigger.card.name
      if (typeof stat[name] === "number") {
        stat[name]--
      }
      game.log(trigger.card, "不计入次数")
    },
  },
  danqi_hufu: {
    markimage: "image/card/danqi_hufu.png",
    intro: {
      content: "当前拥有虎符：#",
    },
  },
  charge: {
    markimage: "image/card/charge.png",
    intro: {
      content(storage, player) {
        let max = player.getMaxCharge()
        if (max === Infinity) {
          max = "∞"
        }
        return `当前蓄力值数：${storage || 0}/${max}`
      },
    },
  },
  cooperation: {
    charlotte: true,
    trigger: {
      global: ["phaseAfter", "dieAfter"],
    },
    forced: true,
    lastDo: true,
    filter: (event, player) => {
      if (event.name === "die" && event.player.isAlive()) {
        return false
      }
      var storage = player.getStorage("cooperation")
      for (var info of storage) {
        if (info.target === event.player) {
          return true
        }
      }
      return false
    },
    async content(event, trigger, player) {
      for (var i = 0; i < player.storage.cooperation.length; i++) {
        var info = player.storage.cooperation[i]
        if (info.target === trigger.player) {
          player.removeCooperation(info)
          i--
        }
      }
    },
    onremove: (player, skill) => {
      var storage = player.getStorage(skill)
      var reasons = []
      for (var i of storage) {
        reasons.add(i.type)
      }
      for (var i of reasons) {
        player.removeSkill(`${skill}_${i}`)
      }
      delete player.storage[i]
    },
    subSkill: {
      damage: {
        mark: true,
        trigger: { global: "damage" },
        forced: true,
        charlotte: true,
        popup: false,
        nopop: true,
        firstDo: true,
        filter: (event, player) => {
          if (!event.source) {
            return false
          }
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "damage" &&
              (event.source === player || event.source === info.target)
            ) {
              return true
            }
          }
          return false
        },
        checkx: (info) => info.damage && info.damage > 3,
        async content(event, trigger, player) {
          var source = trigger.source
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "damage" &&
              (source === player || source === info.target)
            ) {
              if (!info.damage) {
                info.damage = 0
              }
              info.damage += trigger.num
            }
          }
          player.markSkill("cooperation_damage")
        },
        marktext: "仇",
        intro: {
          name: "协力 - 同仇",
          markcount: (storage, player) =>
            Math.max.apply(
              Math,
              player.getStorage("cooperation").map((info) => info.damage || 0),
            ),
          content: (storage, player) => {
            var str = "",
              storage = player.getStorage("cooperation")
            for (var info of storage) {
              if (info.type === "damage") {
                str += `<br><li>协力角色：${get.translation(info.target)}`
                str += `<br><li>协力原因：${get.translation(info.reason)}`
                str += "<br><li>协力进度："
                var num = info.damage || 0
                str += num
                str += "/4"
                str += num > 3 ? " (已完成)" : " (未完成)"
                str += "<br>　　"
              }
            }
            return str.slice(4, str.length - 6)
          },
        },
      },
      draw: {
        mark: true,
        trigger: { global: "gainAfter" },
        forced: true,
        charlotte: true,
        popup: false,
        nopop: true,
        firstDo: true,
        filter: (event, player) => {
          if (event.getParent().name !== "draw") {
            return false
          }
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "draw" &&
              (event.player === player || event.player === info.target)
            ) {
              return true
            }
          }
          return false
        },
        checkx: (info) => info.draw && info.draw > 7,
        async content(event, trigger, player) {
          var source = trigger.player
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "draw" &&
              (source === player || source === info.target)
            ) {
              if (!info.draw) {
                info.draw = 0
              }
              info.draw += trigger.cards.length
            }
          }
          player.markSkill("cooperation_draw")
        },
        marktext: "进",
        intro: {
          name: "协力 - 并进",
          markcount: (storage, player) =>
            Math.max.apply(
              Math,
              player.getStorage("cooperation").map((info) => info.draw || 0),
            ),
          content: (storage, player) => {
            var str = "",
              storage = player.getStorage("cooperation")
            for (var info of storage) {
              if (info.type === "draw") {
                str += `<br><li>协力角色：${get.translation(info.target)}`
                str += `<br><li>协力原因：${get.translation(info.reason)}`
                str += "<br><li>协力进度："
                var num = info.draw || 0
                str += num
                str += "/8"
                str += num > 7 ? " (已完成)" : " (未完成)"
                str += "<br>　　"
              }
            }
            return str.slice(4, str.length - 6)
          },
        },
      },
      discard: {
        mark: true,
        trigger: { global: "loseAfter" },
        forced: true,
        charlotte: true,
        popup: false,
        nopop: true,
        firstDo: true,
        filter: (event, player) => {
          if (event.type !== "discard") {
            return false
          }
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "discard" &&
              (event.player === player || event.player === info.target)
            ) {
              return true
            }
          }
          return false
        },
        checkx: (info) => info.discard && info.discard.length > 3,
        async content(event, trigger, player) {
          var source = trigger.player
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "discard" &&
              (source === player || source === info.target)
            ) {
              if (!info.discard) {
                info.discard = []
              }
              for (var i of trigger.cards2) {
                var suit = get.suit(i, player)
                if (lib.suit.includes(suit)) {
                  info.discard.add(suit)
                }
              }
            }
          }
          player.markSkill("cooperation_discard")
        },
        marktext: "财",
        intro: {
          name: "协力 - 疏财",
          markcount: (storage, player) =>
            Math.max.apply(
              Math,
              player
                .getStorage("cooperation")
                .map((info) => (info.discard ? info.discard.length : 0)),
            ),
          content: (storage, player) => {
            var str = "",
              storage = player.getStorage("cooperation")
            for (var info of storage) {
              if (info.type === "discard") {
                str += `<br><li>协力角色：${get.translation(info.target)}`
                str += `<br><li>协力原因：${get.translation(info.reason)}`
                str += "<br><li>进度："
                var suits = info.discard || []
                var suits2 = [
                  ["spade", "♠", "♤"],
                  ["heart", "♥", "♡"],
                  ["club", "♣", "♧"],
                  ["diamond", "♦", "♢"],
                ]
                for (var i of suits2) {
                  str += suits.includes(i[0]) ? i[1] : i[2]
                }
                str += suits.length > 3 ? " (已完成)" : " (未完成)"
                str += "<br>　　"
              }
            }
            return str.slice(4, str.length - 6)
          },
        },
      },
      use: {
        mark: true,
        trigger: { global: "useCard1" },
        forced: true,
        charlotte: true,
        popup: false,
        nopop: true,
        firstDo: true,
        filter: (event, player) => {
          var suit = get.suit(event.card)
          if (!lib.suit.includes(suit)) {
            return false
          }
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "use" &&
              (event.player === player || event.player === info.target) &&
              !info.used?.includes(suit)
            ) {
              return true
            }
          }
          return false
        },
        checkx: (info) => info.used && info.used.length > 3,
        async content(event, trigger, player) {
          var source = trigger.player,
            suit = get.suit(trigger.card)
          var storage = player.getStorage("cooperation")
          for (var info of storage) {
            if (
              info.type === "use" &&
              (source === player || source === info.target)
            ) {
              if (!info.used) {
                info.used = []
              }
              info.used.add(suit)
            }
          }
          player.markSkill("cooperation_use")
        },
        marktext: "戮",
        intro: {
          name: "协力 - 戮力",
          markcount: (storage, player) =>
            Math.max.apply(
              Math,
              player
                .getStorage("cooperation")
                .map((info) => (info.used ? info.used.length : 0)),
            ),
          content: (storage, player) => {
            var str = "",
              storage = player.getStorage("cooperation")
            for (var info of storage) {
              if (info.type === "use") {
                str += `<br><li>协力角色：${get.translation(info.target)}`
                str += `<br><li>协力原因：${get.translation(info.reason)}`
                str += "<br><li>进度："
                var suits = info.used || []
                var suits2 = [
                  ["spade", "♠", "♤"],
                  ["heart", "♥", "♡"],
                  ["club", "♣", "♧"],
                  ["diamond", "♦", "♢"],
                ]
                for (var i of suits2) {
                  str += suits.includes(i[0]) ? i[1] : i[2]
                }
                str += suits.length > 3 ? " (已完成)" : " (未完成)"
                str += "<br>　　"
              }
            }
            return str.slice(4, str.length - 6)
          },
        },
      },
    },
  },
  zhengsu: {
    trigger: { player: "phaseDiscardEnd" },
    forced: true,
    charlotte: true,
    filter: (event, player) =>
      player.storage.zhengsu_leijin ||
      player.storage.zhengsu_bianzhen ||
      player.storage.zhengsu_mingzhi,
    filterx: (skill, player) => {
      const zhengsus = player.storage[skill]
      if (!zhengsus?.length) {
        return false
      }
      return zhengsus.some((zhengsu) => player.storage[zhengsu])
    },
    async content(event, trigger, player) {
      await player.chooseDrawRecover(2, "整肃奖励：摸两张牌或回复1点体力", true)
    },
    subSkill: {
      leijin: {
        mod: {
          aiOrder: (player, card, num) => {
            if (typeof card.number !== "number") {
              return
            }
            var history = player.getHistory("useCard", (evt) =>
              evt.isPhaseUsing(),
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
        mark: true,
        trigger: { player: "useCard1" },
        lastDo: true,
        charlotte: true,
        forced: true,
        popup: false,
        nopop: true,
        onremove: true,
        filter: (event, player) =>
          player.isPhaseUsing() && player.storage.zhengsu_leijin !== false,
        async content(event, trigger, player) {
          var list = player.getHistory("useCard", (evt) =>
            evt.isPhaseUsing(player),
          )
          var goon = true
          for (var i = 0; i < list.length; i++) {
            var num = get.number(list[i].card)
            if (typeof num !== "number") {
              goon = false
              break
            }
            if (i > 0) {
              var num2 = get.number(list[i - 1].card)
              if (typeof num2 !== "number" || num2 >= num) {
                goon = false
                break
              }
            }
          }
          if (!goon) {
            game.broadcastAll((player) => {
              player.storage.zhengsu_leijin = false
              if (player.marks.zhengsu_leijin) {
                player.marks.zhengsu_leijin.firstChild.innerHTML = "╳"
              }
              delete player.storage.zhengsu_leijin_markcount
            }, player)
          } else {
            if (list.length > 2) {
              game.broadcastAll(
                (player, num) => {
                  if (player.marks.zhengsu_leijin) {
                    player.marks.zhengsu_leijin.firstChild.innerHTML = "○"
                  }
                  player.storage.zhengsu_leijin = true
                  player.storage.zhengsu_leijin_markcount = num
                },
                player,
                num,
              )
            } else {
              game.broadcastAll(
                (player, num) => {
                  player.storage.zhengsu_leijin_markcount = num
                },
                player,
                num,
              )
            }
          }
          player.markSkill("zhengsu_leijin")
        },
        intro: {
          content:
            "<li>条件：回合内所有于出牌阶段使用的牌点数递增且不少于三张。",
        },
      },
      bianzhen: {
        mark: true,
        trigger: { player: "useCard1" },
        firstDo: true,
        charlotte: true,
        forced: true,
        popup: false,
        nopop: true,
        onremove: true,
        filter: (event, player) =>
          player.isPhaseUsing() && player.storage.zhengsu_bianzhen !== false,
        async content(event, trigger, player) {
          var list = player.getHistory("useCard", (evt) => evt.isPhaseUsing())
          var goon = true,
            suit = get.suit(list[0].card, false)
          if (suit === "none") {
            goon = false
          } else {
            for (var i = 1; i < list.length; i++) {
              if (get.suit(list[i]) !== suit) {
                goon = false
                break
              }
            }
          }
          if (!goon) {
            game.broadcastAll((player) => {
              player.storage.zhengsu_bianzhen = false
              if (player.marks.zhengsu_bianzhen) {
                player.marks.zhengsu_bianzhen.firstChild.innerHTML = "╳"
              }
            }, player)
          } else {
            if (list.length > 1) {
              game.broadcastAll((player) => {
                if (player.marks.zhengsu_bianzhen) {
                  player.marks.zhengsu_bianzhen.firstChild.innerHTML = "○"
                }
                player.storage.zhengsu_bianzhen = true
              }, player)
            } else {
              game.broadcastAll(
                (player, suit) => {
                  if (player.marks.zhengsu_bianzhen) {
                    player.marks.zhengsu_bianzhen.firstChild.innerHTML =
                      get.translation(suit)
                  }
                },
                player,
                suit,
              )
            }
          }
          player.markSkill("zhengsu_bianzhen")
        },
        intro: {
          content:
            "<li>条件：回合内所有于出牌阶段使用的牌花色相同且不少于两张。",
        },
        ai: {
          effect: {
            player_use: (card, player, target) => {
              if (typeof card !== "object" || !player.isPhaseUsing()) {
                return
              }
              var suitx = get.suit(card)
              var history = player.getHistory("useCard")
              if (!history.length) {
                var val = 0
                if (
                  player.hasCard(
                    (cardx) =>
                      get.suit(cardx) === suitx &&
                      card !== cardx &&
                      !card.cards?.includes(cardx) &&
                      player.hasValueTarget(cardx),
                    "hs",
                  )
                ) {
                  val = [2, 0.1]
                }
                if (val) {
                  return val
                }
                return
              }
              var num = 0
              var suit = false
              for (var i = 0; i < history.length; i++) {
                var suit2 = get.suit(history[i].card)
                if (!lib.suit.includes(suit2)) {
                  return
                }
                if (suit && suit !== suit2) {
                  return
                }
                suit = suit2
                num++
              }
              if (suitx === suit && num === 1) {
                return [1, 0.1]
              }
              if (
                suitx !== suit &&
                (num > 1 ||
                  (num <= 1 &&
                    player.hasCard(
                      (cardx) =>
                        get.suit(cardx) === suit &&
                        player.hasValueTarget(cardx),
                      "hs",
                    )))
              ) {
                return "zeroplayertarget"
              }
            },
          },
        },
      },
      mingzhi: {
        mark: true,
        trigger: { player: "loseAfter" },
        firstDo: true,
        charlotte: true,
        forced: true,
        popup: false,
        nopop: true,
        onremove: true,
        filter: (event, player) => {
          if (
            player.storage.zhengsu_mingzhi === false ||
            event.type !== "discard"
          ) {
            return false
          }
          var evt = event.getParent("phaseDiscard")
          return evt && evt.player === player
        },
        async content(event, trigger, player) {
          var goon = true,
            list = []
          player.getHistory("lose", (event) => {
            if (!goon || event.type !== "discard") {
              return false
            }
            var evt = event.getParent("phaseDiscard")
            if (evt && evt.player === player) {
              for (var i of event.cards2) {
                var suit = get.suit(i, player)
                if (list.includes(suit)) {
                  goon = false
                  break
                }
                list.push(suit)
              }
            }
          })
          if (!goon) {
            game.broadcastAll((player) => {
              player.storage.zhengsu_mingzhi = false
              if (player.marks.zhengsu_mingzhi) {
                player.marks.zhengsu_mingzhi.firstChild.innerHTML = "╳"
              }
              delete player.storage.zhengsu_mingzhi_list
            }, player)
          } else {
            if (list.length > 1) {
              game.broadcastAll(
                (player, list) => {
                  if (player.marks.zhengsu_mingzhi) {
                    player.marks.zhengsu_mingzhi.firstChild.innerHTML = "○"
                  }
                  player.storage.zhengsu_mingzhi = true
                  player.storage.zhengsu_mingzhi_list = list
                  player.storage.zhengsu_mingzhi_markcount = list.length
                },
                player,
                list,
              )
            } else {
              game.broadcastAll(
                (player, list) => {
                  player.storage.zhengsu_mingzhi_list = list
                  player.storage.zhengsu_mingzhi_markcount = list.length
                },
                player,
                list,
              )
            }
          }
          player.markSkill("zhengsu_mingzhi")
        },
        intro: {
          content:
            "<li>条件：回合内所有于弃牌阶段弃置的牌花色均不相同且不少于两张。",
        },
      },
    },
  },
  renku: {
    intro: {
      markcount: () => _status.renku.length,
      mark: (dialog, content, player) => {
        if (!_status.renku.length) {
          return "仁库中没有牌"
        }
        dialog.addAuto(_status.renku)
      },
      content: () => {
        if (!_status.renku.length) {
          return "仁库中没有牌"
        }
        return get.translation(_status.renku)
      },
    },
  },
  _showHiddenCharacter: {
    trigger: {
      player: [
        "changeHp",
        "phaseBeginStart",
        "loseMaxHpBegin",
        "gainMaxHpBegin",
      ],
    },
    firstDo: true,
    forced: true,
    popup: false,
    priority: 25,
    filter: (event, player, name) =>
      player.isUnseen(2) && get.mode() !== "guozhan",
    async content(event, trigger, player) {
      player.showCharacter(2)
      player.removeSkill("g_hidden_ai")
    },
  },
  _kamisha: {
    trigger: { source: "damageBegin2" },
    //forced:true,
    popup: false,
    prompt: (event, player) =>
      `是否防止即将对${get.translation(event.player)}造成的伤害，改为令其减少${get.cnNumber(event.num)}点体力上限？`,
    filter: (event, player) => event.hasNature("kami") && event.num > 0,
    ruleSkill: true,
    check: (event, player) => {
      var att = get.attitude(player, event.player)
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
    async content(event, trigger, player) {
      trigger.cancel()
      trigger.player.loseMaxHp(trigger.num).source = player
    },
  },
  _doublegroup_choice: {
    trigger: {
      global: "gameStart",
      player: "enterGame",
    },
    firstDo: true,
    forced: true,
    popup: false,
    priority: 25,
    charlotte: true,
    filter: (event, player) => {
      const groups = get.selectGroup(player.name1),
        type = get.selectGroup(player.name1, true)
      return (
        get.mode() !== "guozhan" &&
        groups.length > 0 &&
        type === "double" &&
        !player._groupChosen
      )
    },
    async content(event, trigger, player) {
      const groups = get.selectGroup(player.name1),
        type = get.selectGroup(player.name1, true)
      player._groupChosen = type
      const result = await player
        .chooseButton(
          [
            "请选择你的势力",
            [groups.map((group) => ["", "", `group_${group}`]), "vcard"],
          ],
          true,
        )
        .set("direct", true)
        .forResult()
      if (result?.bool && result.links?.length) {
        await player.changeGroup(result.links[0][2].slice(6))
      }
    },
  },
  aozhan: {
    charlotte: true,
    ruleSkill: true,
    mod: {
      cardname(card, player) {
        if (card.name === "tao") {
          const evt = get.event(),
            viewAs = (name) =>
              get.autoViewAs({ name: name, cards: [card] }, [card])
          if (
            typeof evt.filterCard === "function" &&
            evt.filterCard(viewAs("shan"), player, evt) &&
            !evt.filterCard(viewAs("sha"), player, evt)
          ) {
            return "shan"
          }
          return "sha"
        }
      },
    },
    trigger: {
      player: ["useCardBefore", "respondBefore"],
    },
    silent: true,
    direct: true,
    firstDo: true,
    priority: Infinity,
    filter(event, player) {
      if (
        !event.card ||
        !event.cards ||
        !["sha", "shan"].includes(event.card.name) ||
        event.card === event.cards[0] ||
        event.cards.length !== 1 ||
        event.cards[0].name !== "tao"
      ) {
        return false
      }
      const evt = event.getParent()
      return (
        typeof evt.filterCard === "function" &&
        evt.filterCard({ name: "shan" }, player, evt) &&
        evt.filterCard({ name: "sha" }, player, evt)
      )
    },
    async content(event, trigger, player) {
      const { control } = await player
        .chooseControl(["sha", "shan"])
        .set(
          "prompt",
          `鏖战：请选择${get.translation(trigger.cards[0])}视为${trigger.name === "respond" ? "打出" : "使用"}的牌名`,
        )
        .set("ai", () => {
          const choice = _status.event.getParent(5).choice
          if (choice && ["sha", "shan"].includes(choice)) {
            return choice
          }
          return ["sha", "shan"].randomGet()
        })
        .forResult()
      const card = get.autoViewAs({ name: control }, trigger.cards)
      trigger.card = card
      trigger.getParent().result.card = card
    },
    hiddenCard(player, name) {
      return (
        ["sha", "shan"].includes(name) &&
        player.countCards("hs", (card) => card.name === "tao")
      )
    },
    ai: {
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag, arg) {
        if (!player.countCards("hs", (card) => card.name === "tao")) {
          return false
        }
      },
    },
  },
  global: [],
  globalmap: {},
  storage: {},
  undist: { charlotte: true },
  others: {},
  zhu: {},
  zhuSkill: {},
  land_used: {},
  unequip: { ai: { unequip: true } },
  subplayer: {
    trigger: { player: "dieBefore" },
    forced: true,
    priority: -9,
    onremove: true,
    mark: "character",
    intro: {
      content: (storage, player) => {
        if (typeof storage.intro2 === "string") {
          return storage.intro2
        }
        if (typeof storage.intro2 === "function") {
          return storage.intro2(storage, player)
        }
        return "死亡前切换回主武将"
      },
      name: (storage) => get.rawName(storage.name),
    },
    async content(event, trigger, player) {
      trigger.cancel()
      var evt = trigger.getParent("damage")
      if (evt.player === player) {
        evt.untrigger(false, player)
      }
      player.exitSubPlayer(true)
    },
    ai: {
      nosave: true,
    },
  },
  autoswap: {
    firstDo: true,
    trigger: {
      player: [
        "chooseToUseBegin",
        "chooseToRespondBegin",
        "chooseToDiscardBegin",
        "chooseToCompareBegin",
        "chooseButtonBegin",
        "chooseCardBegin",
        "chooseTargetBegin",
        "chooseCardTargetBegin",
        "chooseControlBegin",
        "chooseBoolBegin",
        "choosePlayerCardBegin",
        "discardPlayerCardBegin",
        "gainPlayerCardBegin",
        "chooseToMoveBegin",
        "chooseToPlayBeatmapBegin",
        "chooseToGiveBegin",
        "chooseToGuanxingBegin",
        "chooseButtonTargetBegin",
        "chooseNumbersBegin",
      ],
    },
    forced: true,
    priority: 100,
    forceDie: true,
    popup: false,
    filter: (event, player) => {
      if (event.autochoose?.()) {
        return false
      }
      if (lib.filter.wuxieSwap(event)) {
        return false
      }
      if (_status.auto || !player.isUnderControl()) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      game.swapPlayerAuto(player)
    },
  },
  dualside: {
    charlotte: true,
    subSkill: {
      turn: {
        trigger: { player: ["turnOverAfter", "dieBefore"] },
        silent: true,
        filter: (event, player) => {
          if (player.storage.dualside_over) {
            return false
          }
          return Array.isArray(player.storage.dualside)
        },
        async content(event, trigger, player) {
          var cfg = player.storage.dualside
          var bool = player.isTurnedOver()
          if (trigger.name === "die") {
            bool = !bool
          }
          if (bool) {
            cfg[1] = player.hp
            cfg[2] = player.maxHp
            player.reinit(cfg[0], cfg[3], [cfg[4], cfg[5]])
            player.unmarkSkill("dualside")
            player.markSkillCharacter(
              "dualside",
              { name: cfg[0] },
              "正面",
              `当前体力：${cfg[1]}/${cfg[2]}`,
            )
          } else {
            cfg[4] = player.hp
            cfg[5] = player.maxHp
            player.reinit(cfg[3], cfg[0], [cfg[1], cfg[2]])
            player.unmarkSkill("dualside")
            player.markSkillCharacter(
              "dualside",
              { name: cfg[3] },
              "背面",
              `当前体力：${cfg[4]}/${cfg[5]}`,
            )
          }

          if (trigger.name === "die") {
            trigger.cancel()
            delete player.storage.dualside
            player.storage.dualside_over = true
            player.unmarkSkill("dualside")
          }
        },
      },
      init: {
        trigger: { global: "gameStart", player: "enterGame" },
        silent: true,
        async content(event, trigger, player) {
          var list = [player.name1, player.name2]
          for (var i = 0; i < list.length; i++) {
            if (list[i] && lib.character[list[i]]) {
              var info = lib.character[list[i]]
              if (info.skills.includes("dualside") && info.dualSideCharacter) {
                player.storage.dualside = [list[i], player.hp, player.maxHp]
                var name2 = info.dualSideCharacter
                var info2 = lib.character[name2]
                player.storage.dualside.push(name2)
                player.storage.dualside.push(info2.hp)
                player.storage.dualside.push(info2.maxHp)
              }
              break
            }
          }
          var cfg = player.storage.dualside
          if (!Array.isArray(cfg)) {
            return
          }
          if (get.mode() === "guozhan") {
            if (player.name1 === cfg[0]) {
              player.showCharacter(0)
            } else {
              player.showCharacter(1)
            }
          }
          player.markSkillCharacter(
            "dualside",
            { name: cfg[3] },
            "背面",
            `当前体力：${cfg[4]}/${cfg[5]}`,
          )
        },
      },
    },
    group: ["dualside_init", "dualside_turn"],
  },
  fengyin: {
    init: (player, skill) => {
      player.addSkillBlocker(skill)
      player.addTip(skill, "非锁定技失效")
    },
    onremove: (player, skill) => {
      player.removeSkillBlocker(skill)
      player.removeTip(skill)
    },
    charlotte: true,
    skillBlocker: (skill, player) =>
      !lib.skill[skill].persevereSkill &&
      !lib.skill[skill].charlotte &&
      !get.is.locked(skill, player),
    mark: true,
    intro: {
      content: (storage, player, skill) => {
        var list = player
          .getSkills(null, false, false)
          .filter((i) => lib.skill.fengyin.skillBlocker(i, player))
        if (list.length) {
          return `失效技能：${get.translation(list)}`
        }
        return "无失效技能"
      },
    },
  },
  baiban: {
    init: (player, skill) => {
      player.addSkillBlocker(skill)
    },
    onremove: (player, skill) => {
      player.removeSkillBlocker(skill)
    },
    charlotte: true,
    skillBlocker: (skill, player) =>
      !lib.skill[skill].persevereSkill && !lib.skill[skill].charlotte,
    mark: true,
    intro: {
      content: (storage, player, skill) => {
        var list = player
          .getSkills(null, false, false)
          .filter((i) => lib.skill.baiban.skillBlocker(i, player))
        if (list.length) {
          return `失效技能：${get.translation(list)}`
        }
        return "无失效技能"
      },
    },
  },
  qianxing: {
    mark: true,
    nopop: true,
    init: (player) => {
      game.log(player, "获得了", "【潜行】")
    },
    intro: {
      content: "锁定技，你不能成为其他角色的卡牌的目标",
    },
    mod: {
      targetEnabled: (card, player, target) => {
        if (player !== target) {
          return false
        }
      },
    },
  },
  mianyi: {
    trigger: { player: "damageBefore" },
    mark: true,
    forced: true,
    init: (player) => {
      game.log(player, "获得了", "【免疫】")
    },
    async content(event, trigger, player) {
      trigger.cancel()
    },
    ai: {
      nofire: true,
      nothunder: true,
      nodamage: true,
      effect: {
        target: (card, player, target, current) => {
          if (get.tag(card, "damage")) {
            return "zeroplayertarget"
          }
        },
      },
    },
    intro: {
      content: "防止一切伤害",
    },
  },
  mad: {
    mark: true,
    locked: true,
    intro: {
      content: "已进入混乱状态",
      name: "混乱",
      onunmark: (storage, player) => {
        game.log(player, "解除混乱状态")
      },
    },
  },
  ghujia: {
    intro: {
      content: (content, player) => `已有${get.cnNumber(player.hujia)}点护甲值`,
    },
    markimage: "image/card/shield.png",
  },
  _usecard: {
    trigger: { global: "useCardAfter" },
    forced: true,
    popup: false,
    priority: -100,
    lastDo: true,
    silent: true,
    filter: (event) => !event._cleared && event.card.name !== "wuxie",
    async content(event, trigger, player) {
      game.broadcastAll(() => {
        ui.clear()
      })
      event._cleared = true
    },
  },
  _discard: {
    trigger: {
      global: ["discardAfter", "loseToDiscardpileAfter", "loseAsyncAfter"],
    },
    forced: true,
    popup: false,
    priority: -100,
    lastDo: true,
    silent: true,
    filter: (event) => !!ui.todiscard[event.discardid],
    async content(event, trigger, player) {
      game.broadcastAll((id) => {
        var todiscard = ui.todiscard[id]
        delete ui.todiscard[id]
        if (todiscard) {
          var time = 1000
          if (typeof todiscard._discardtime === "number") {
            time += todiscard._discardtime - get.time()
          }
          if (time < 0) {
            time = 0
          }
          setTimeout(() => {
            for (var i = 0; i < todiscard.length; i++) {
              todiscard[i].delete()
            }
          }, time)
        }
      }, trigger.discardid)
    },
  },
  _ismin: {
    mod: {
      cardEnabled: (card, player) => {
        if (player.isMin()) {
          if (get.type(card) === "equip") {
            return false
          }
        }
      },
    },
  },
  _recasting: {
    enable: "phaseUse",
    logv: false,
    prompt: "将要重铸的牌置入弃牌堆并摸一张牌",
    filter: (event, player) =>
      player.hasCard(
        (card) => lib.skill._recasting.filterCard(card, player),
        lib.skill._recasting.position,
      ),
    position: "he",
    filterCard: (card, player) => player.canRecast(card, null, true),
    discard: false,
    lose: false,
    delay: false,
    async content(event, trigger, player) {
      player.recast(event.cards, void 0, (player, cards) => {
        var numberOfCardsToDraw = cards.length
        cards.forEach((value) => {
          if (get.subtype(value) === "spell_gold") {
            var libCard = get.libCard((info) => info.subtype === "spell_silver")
            if (!libCard.length) {
              return
            }
            numberOfCardsToDraw--
            player.gain(game.createCard(libCard.randomGet()), "draw")
          } else if (get.subtype(value) === "spell_silver") {
            var libCard = get.libCard((info) => info.subtype === "spell_bronze")
            if (!libCard.length) {
              return
            }
            numberOfCardsToDraw--
            player.gain(game.createCard(libCard.randomGet()), "draw")
          }
        })
        if (numberOfCardsToDraw) {
          player.draw(numberOfCardsToDraw, "nodelay").log = false
        }
      })
    },
    ai: {
      basic: {
        order: 6,
      },
      result: {
        player: 1,
      },
    },
  },
  _lianhuan: {
    trigger: { player: "damageAfter" },
    filter: (event, player) => event.lianhuanable === true,
    forced: true,
    popup: false,
    logv: false,
    forceDie: true,
    silent: true,
    forceOut: true,
    //priority:-5,
    content: [
      async (event, trigger, player) => {
        event.logvid = trigger.getLogv()
      },
      async (event, trigger, player) => {
        event.targets = game.filterPlayer(
          (current) => current !== event.player && current.isLinked(),
        )
        lib.tempSortSeat = _status.currentPhase || player
        event.targets.sort(lib.sort.seat)
        delete lib.tempSortSeat
        event._args = [trigger.num, trigger.nature, trigger.cards, trigger.card]
        if (trigger.source) {
          event._args.push(trigger.source)
        } else {
          event._args.push("nosource")
        }
      },
      async (event, trigger, player) => {
        if (event.targets.length) {
          var target = event.targets.shift()
          if (target.isLinked()) {
            target.damage.apply(target, event._args.slice(0))
          }
          event.redo()
        }
      },
    ],
  },
  _lianhuan4: {
    trigger: { player: "changeHp" },
    priority: -10,
    forced: true,
    popup: false,
    forceDie: true,
    silent: true,
    filter: (event, player) => {
      var evt = event.getParent()
      return (
        evt &&
        evt.name === "damage" &&
        evt.hasNature("linked") &&
        player.isLinked()
      )
    },
    async content(event, trigger, player) {
      player.link()
      if (trigger.getParent().notLink()) {
        trigger.getParent().lianhuanable = true
      }
    },
  },
  //休整
  _rest_return: {
    trigger: { global: "phaseBefore" },
    forced: true,
    charlotte: true,
    silent: true,
    forceDie: true,
    forceOut: true,
    filter(event, player) {
      const map = _status._rest_return?.[player.playerid]
      if (!map?.count || map?.count < 0) {
        return false
      }
      if (map?.type === "round" && (event.player !== player || event.skill)) {
        return false
      }
      if (player.isIn()) {
        delete _status._rest_return?.[player.playerid]
      }
      return !event._rest_return && player.isOut()
    },
    async content(event, trigger, player) {
      const map = _status._rest_return?.[player.playerid]
      if (map?.count && map?.count > 0) {
        game.broadcastAll((map) => {
          map.count--
        }, map)
      }
      player.markSkill("_rest_return")
      trigger[event.name] = true
      if (!map.count) {
        await player.restEnd()
      }
    },
    intro: {
      markcount(storage, player) {
        const { type, count } = _status._rest_return?.[player.playerid] || {}
        return !count || !type || count < 0 ? "∞" : count
      },
      content(storage, player) {
        const { type, count } = _status._rest_return?.[player.playerid] || {}
        if (!count || !type || count < 0) {
          return `无限休整中，撅醒时机未知`
        }
        return `还需休整${count}${type === "phase" ? "回合" : "轮"}`
      },
    },
  },
  /**
   * @deprecated
   */
  _chongzhu: {
    get filter() {
      return lib.skill._recasting.filter
    },
    set filter(filter) {
      lib.skill._recasting.filter = filter
    },
    get filterCard() {
      return lib.skill._recasting.filterCard
    },
    set filterCard(filterCard) {
      lib.skill._recasting.filterCard = filterCard
    },
    get content() {
      return lib.skill._recasting.content
    },
    set content(content) {
      lib.skill._recasting.content = content
    },
    get ai() {
      return lib.skill._recasting.ai
    },
    set ai(ai) {
      lib.skill._recasting.ai = ai
    },
  },
  dongcha: {
    mode: ["identity"],
    available(mode) {
      if (mode === "identity" && _status.mode !== "zhong") {
        return false
      }
    },
    trigger: { player: "phaseZhunbeiBegin" },
    unique: true,
    filter(event, player) {
      return game.hasPlayer(
        (current) => current.countDiscardableCards(player, "ej") > 0,
      )
    },
    charlotte: true,
    forceunique: true,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt(event.skill),
          "弃置场上的一张牌",
          (card, player, target) => {
            return target.countDiscardableCards(player, "ej") > 0
          },
        )
        .set("ai", (target) => {
          const player = get.player()
          return get.effect(
            target,
            { name: "guohe_copy", position: "ej" },
            player,
            player,
          )
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const [target] = event.targets
      target.addExpose(0.1)
      await game.delayx()
      await player.discardPlayerCard("ej", true, target)
    },
    group: ["dongcha_begin", "dongcha_log"],
    subSkill: {
      begin: {
        charlotte: true,
        trigger: {
          global: "phaseBefore",
          player: "enterGame",
        },
        forced: true,
        popup: false,
        filter(event, player) {
          return (
            game.hasPlayer((current) => current.identity === "fan") &&
            (event.name !== "phase" || game.phaseNumber === 0)
          )
        },
        async content(event, trigger, player) {
          const list = game.filterPlayer(
            (current) => current.identity === "fan",
          )
          const target = list.randomGet()
          player.storage.dongcha = target
          if (!_status.connectMode) {
            if (player === game.me) {
              target.setIdentity("fan")
              target.node.identity.classList.remove("guessing")
              target.fanfixed = true
              player.line(target, "green")
              player.popup("dongcha")
            }
          } else {
            await player
              .chooseControl("ok")
              .set("dialog", [
                `${get.translation(target)}是反贼`,
                [[target.name], "character"],
              ])
          }
        },
      },
      log: {
        charlotte: true,
        trigger: { player: "useCard" },
        forced: true,
        popup: false,
        filter(event, player) {
          return (
            event.targets?.length === 1 &&
            event.targets[0] === player.storage.dongcha &&
            event.targets[0].ai.shown < 0.95
          )
        },
        async content(event, trigger, player) {
          trigger.targets[0].addExpose(0.2)
        },
      },
    },
  },
  sheshen: {
    mode: ["identity"],
    available(mode) {
      if (mode === "identity" && _status.mode !== "zhong") {
        return false
      }
    },
    trigger: { global: "dieBefore" },
    forced: true,
    unique: true,
    charlotte: true,
    forceunique: true,
    filter(event, player) {
      return event.player === game.zhu && player.hp > 0
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const { player: target } = trigger
      await target.gainMaxHp()
      await target.recoverTo(player.hp)
      const cards = player.getCards("he")
      if (cards.length) {
        await target.gain(cards, player, "giveAuto")
      }
      trigger.cancel()
      await player.die()
    },
  },
  identity_mingcha: {
    mode: ["identity"],
    trigger: {
      global: "phaseBefore",
      player: "enterGame",
    },
    filter(event, player) {
      return (
        game.hasPlayer((current) => current !== player) &&
        (event.name !== "phase" || game.phaseNumber === 0)
      )
    },
    unique: true,
    charlotte: true,
    forceunique: true,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt(event.skill),
          "请选择一名你要查看身份的目标",
          lib.filter.notMe,
        )
        .set("ai", (target) => {
          const player = get.player()
          return get.threaten(target)
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const [target] = event.targets
      target.addExpose(0.15)
      await game.delayx()
      const { identity } = target
      if (identity === "fan") {
        game.broadcastAll((player) => {
          player.showIdentity()
        }, target)
        event.videoId = lib.status.videoId++
        const createDialog = (player, target, identity, id) => {
          const dialog = ui.create.dialog(
            `${get.translation(player)}展示了${get.translation(target)}的身份牌<br>`,
            "forcebutton",
          )
          dialog.videoId = id
          ui.create.spinningIdentityCard(identity, dialog)
        }
        game.broadcastAll(createDialog, player, target, identity, event.videoId)
        game.log(target, "的身份为", `#g${get.translation(`${identity}2`)}`)
        await game.delay(3)
        game.broadcastAll("closeDialog", event.videoId)
      }
    },
  },
  _sxrm_connect: {
    marktext: "🔗",
    intro: {
      name: "连接",
      markcount(storage, player) {
        return player.countConnectedCards()
      },
      mark(dialog, content, player) {
        const cards = player.getConnectedCards()
        if (cards.length) {
          dialog.addAuto(cards)
        } else {
          return "无连接牌"
        }
      },
    },
    isConnect(cards) {
      if (get.itemtype(cards) === "cards") {
        return cards.filter((card) => get.is.connectedCard(card))
      }
      return get.is.connectedCard(cards)
    },
    addConnect(cards) {
      game.addConnectedCards(cards)
    },
    removeConnect(cards) {
      game.removeConnectedCards(cards)
    },
    refreshMark() {
      game.updateConnectedCards()
    },
    trigger: {
      player: "loseAfter",
      global: [
        "loseAsyncAfter",
        "equipAfter",
        "addJudgeAfter",
        "addToExpansionAfter",
        "gainAfter",
      ],
    },
    firstDo: true,
    forceDie: true,
    filter(event, player) {
      if (!event.getl) {
        return false
      }
      return game.hasPlayer2((current) => {
        const cards = event.getl(current)?.hs ?? []
        return cards.some((card) => get.is.connectedCard(card))
      })
    },
    async cost(event, trigger, player) {
      const lose_map = new Map()
      const cards = game.filterPlayer2().flatMap((current) => {
        const lose = (trigger.getl(current).hs ?? []).filter((card) =>
          get.is.connectedCard(card),
        )
        if (lose.length) {
          lose_map.set(current, lose)
        }
        return lose
      })
      if (!cards.length) {
        return
      }
      game.removeConnectedCards(cards)
      const bool1 = ["useCard", "respond"].includes(
          (trigger.relatedEvent || trigger.getParent()).name,
        ),
        bool2 =
          trigger.type === "discard" &&
          trigger.getlx !== false &&
          !trigger.getParent(event.skill, true)
      if (["lose", "loseAsync"].includes(trigger.name) && (bool1 || bool2)) {
        const map = game.filterPlayer2().reduce((map, current) => {
          const cards = current.getConnectedCards()
          if (cards.length) {
            map.set(current, cards)
            const lose = lose_map.get(current) ?? []
            lose.addArray(cards)
            lose_map.set(current, lose)
          }
          return map
        }, new Map())
        if (map.size) {
          event.result = {
            bool: true,
            skill_popup: false,
            targets: Array.from(map.keys()),
            cost_data: map,
          }
        }
      }
      if (lose_map.size) {
        trigger.set("sxrmConnectCardsMap", lose_map)
      }
    },
    async content(event, trigger, player) {
      const { targets, cost_data: map } = event
      for (const target of targets.sortBySeat()) {
        const cards = map.get(target)
        if (cards?.length) {
          await target.modedDiscard(cards)
        }
      }
    },
  },
}
