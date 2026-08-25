import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // SP姜维
  // 困奋
  kunfen: {
    audio: 2,
    audioname2: { ol_sb_jiangwei: "kunfen_ol_sb_jiangwei" },
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
  // 张春华
  // 绝情
  jueqing: {
    audio: 2,
    audioname: ["ol_zhangchunhua"],
    trigger: { source: "damageBefore" },
    forced: true,
    async content(event, trigger, player) {
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
    audioname: ["ol_zhangchunhua"],
    trigger: {
      player: ["loseAfter", "changeHp", "gainMaxHpAfter", "loseMaxHpAfter"],
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
      if (event.getl && !event.getl(player)) {
        return false
      }
      return player.countCards("h") < player.getDamagedHp()
    },
    async content(event, trigger, player) {
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
  // 界张春华
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
        await player.showHandcards()
        await target.showHandcards()
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
        .set("prompt", "翦灭：请选择一种颜色")
        .set(
          "prompt2",
          `展示所有手牌并弃置选择颜色的手牌，然后若你与${str}弃置牌较多的角色视为对另一名角色使用一张【决斗】`,
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
  // 游龙
  youlong: {
    enable: "chooseToUse",
    audio: 2,
    zhuanhuanji: true,
    marktext: "☯",
    mark: true,
    intro: {
      content(storage, player) {
        return `每轮限一次，你可以废除一个装备栏，视为使用一张未以此法使用过的${storage ? "基本" : "普通锦囊"}牌。`
      },
    },
    init(player) {
      player.storage.youlong = false
      if (!player.storage.youlong2) {
        player.storage.youlong2 = []
      }
    },
    hiddenCard(player, name) {
      if (!player.hasEnabledSlot()) {
        return false
      }
      if (
        get
          .inpileVCardList()
          .some(
            (info) =>
              info[2] === name &&
              player
                .getStorage("youlong2")
                .some(
                  (item) => item.name === info[2] && item.nature === info[3],
                ),
          )
      ) {
        return false
      }
      if (
        player
          .getStorage("youlong_used")
          .includes(player.storage.youlong || false)
      ) {
        return false
      }
      const type = get.type(name)
      if (player.storage.youlong) {
        return type === "basic"
      }
      return type === "trick"
    },
    filter(event, player) {
      if (!player.hasEnabledSlot()) {
        return false
      }
      if (
        player
          .getStorage("youlong_used")
          .includes(player.storage.youlong || false)
      ) {
        return false
      }
      const type = player.storage.youlong ? "basic" : "trick"
      return get.inpileVCardList((info) => {
        if (info[0] !== type) {
          return false
        }
        if (
          player
            .getStorage("youlong2")
            .some((item) => item.name === info[2] && item.nature === info[3])
        ) {
          return false
        }
        return event.filterCard(
          { name: info[2], nature: info[3], isCard: true },
          player,
          event,
        )
      }).length
    },
    chooseButton: {
      dialog(event, player) {
        const dialog = ui.create.dialog("游龙", "hidden")
        const equips = []
        for (let i = 1; i < 6; i++) {
          if (!player.hasEnabledSlot(i)) {
            continue
          }
          equips.push([i, get.translation(`equip${i}`)])
        }
        if (equips.length > 0) {
          dialog.add([equips, "tdnodes"])
        }
        const type = player.storage.youlong ? "basic" : "trick"
        const list = get.inpileVCardList((info) => {
          if (info[0] !== type) {
            return false
          }
          if (
            player
              .getStorage("youlong2")
              .some((item) => item.name === info[2] && item.nature === info[3])
          ) {
            return false
          }
          return event.filterCard(
            { name: info[2], nature: info[3], isCard: true },
            player,
            event,
          )
        })
        dialog.add([list, "vcard"])
        return dialog
      },
      filter(button) {
        if (
          ui.selected.buttons.length &&
          typeof button.link === typeof ui.selected.buttons[0].link
        ) {
          return false
        }
        return true
      },
      select: 2,
      check(button) {
        const player = get.player()
        if (typeof button.link === "number") {
          const card = player.getEquip(button.link)
          if (card) {
            const val = get.value(card)
            if (val > 0) {
              return 0
            }
            return 5 - val
          }
          switch (button.link) {
            case 3:
              return 4.5
            case 4:
              return 4.4
            case 5:
              return 4.3
            case 2:
              return (3 - player.hp) * 1.5
            case 1: {
              if (
                game.hasPlayer((current) => {
                  return (
                    (get.realAttitude || get.attitude)(player, current) < 0 &&
                    get.distance(player, current) > 1
                  )
                })
              ) {
                return 0
              }
              return 3.2
            }
          }
        }
        const name = button.link[2]
        const evt = get.event().getParent()
        if (evt.type === "phase") {
          const card = { name: name, nature: button.link[3], isCard: true }
          if (name === "shan") {
            return 2
          }
          if (evt.type === "dying") {
            if (get.attitude(player, evt.dying) < 2) {
              return false
            }
            if (name === "jiu") {
              return 2.1
            }
            return 1.9
          }
          return player.getUseValue(card)
        }
        return 1
      },
      backup(links, player) {
        if (typeof links[1] === "number") {
          links.reverse()
        }
        const equip = links[0]
        const name = links[1][2]
        const nature = links[1][3]
        return {
          filterCard: () => false,
          selectCard: -1,
          equip: equip,
          viewAs: {
            name: name,
            nature: nature,
            isCard: true,
          },
          popname: true,
          log: false,
          async precontent(event, trigger, player) {
            player.logSkill("youlong")
            await player.disableEquip(lib.skill.youlong_backup.equip)
            player.addTempSkill("youlong_used", "roundStart")
            player.markAuto("youlong_used", [player.storage.youlong || false])
            player.changeZhuanhuanji("youlong")
            player.storage.youlong2.add(event.result.card)
          },
        }
      },
      prompt(links, player) {
        if (typeof links[1] === "number") {
          links.reverse()
        }
        const equip = `equip${links[0]}`
        const name = links[1][2]
        const nature = links[1][3]
        return `废除自己的${get.translation(equip)}栏，视为使用一张${get.translation(nature) || ""}${get.translation(name)}`
      },
    },
    ai: {
      respondSha: true,
      respondShan: true,
      fireAttack: true,
      skillTagFilter(player, tag, arg) {
        if (arg === "respond") {
          return false
        }
        if (
          !player.storage.youlong ||
          player.getStorage("youlong_used").includes(true)
        ) {
          return false
        }
        const name = tag === "respondSha" ? "sha" : "shan"
        if (name === "shan") {
          if (
            player.getStorage("youlong2").some((item) => item.name === "shan")
          ) {
            return false
          }
        } else if (name === "sha") {
          if (
            [undefined]
              .concat(lib.inpile_nature.slice(0))
              .every((nature) =>
                player
                  .getStorage("youlong2")
                  .some(
                    (item) => item.name === "sha" && item.nature === nature,
                  ),
              )
          ) {
            return false
          }
        } else if (tag === "fireAttack") {
          const type = player.storage.youlong ? "basic" : "trick"
          return get
            .inpileVCardList((info) => {
              if (info[0] !== type) {
                return false
              }
              return !player
                .getStorage("youlong2")
                .some(
                  (item) => item.name === info[2] && item.nature === info[3],
                )
            })
            .some((info) => {
              return get.tag(
                { name: info[2], nature: info[3], isCard: true },
                "fireDamage",
              )
            })
        }
      },
      order(item, player) {
        if (player && _status.event.type === "phase") {
          let max = 0,
            add = false
          const type = player.storage.youlong ? "basic" : "trick"
          const list = get
            .inpileVCardList((info) => {
              if (info[0] !== type) {
                return false
              }
              return !player
                .getStorage("youlong2")
                .some(
                  (item) => item.name === info[2] && item.nature === info[3],
                )
            })
            .map((info) => {
              return { name: info[2], nature: info[3], isCard: true }
            })
          for (const card of list) {
            if (player.getUseValue(card) > 0) {
              const temp = get.order(card)
              if (temp > max) {
                max = temp
              }
            }
          }
          if (max > 0) {
            max += 0.3
          }
          return max
        }
        return 1
      },
      result: {
        player(player) {
          if (_status.event.dying) {
            return get.attitude(player, _status.event.dying)
          }
          return 1
        },
      },
    },
    subSkill: { used: { charlotte: true, onremove: true } },
  },
  // 鸾凤
  luanfeng: {
    audio: 2,
    trigger: { global: "dying" },
    filter(event, player) {
      return event.player.maxHp >= player.maxHp && event.player.hp < 1
    },
    limited: true,
    skillAnimation: true,
    animationColor: "soil",
    logTarget: "player",
    check(event, player) {
      if (get.attitude(player, event.player) < 4) {
        return false
      }
      if (
        player.countCards("h", (card) => {
          var mod2 = game.checkMod(
            card,
            player,
            "unchanged",
            "cardEnabled2",
            player,
          )
          if (mod2 !== "unchanged") {
            return mod2
          }
          var mod = game.checkMod(
            card,
            player,
            event.player,
            "unchanged",
            "cardSavable",
            player,
          )
          if (mod !== "unchanged") {
            return mod
          }
          var savable = get.info(card).savable
          if (typeof savable === "function") {
            savable = savable(card, player, event.player)
          }
          return savable
        }) >=
        1 - event.player.hp
      ) {
        return false
      }
      if (event.player === player || event.player === get.zhu(player)) {
        return true
      }
      return !player.hasUnknown()
    },
    content() {
      "step 0"
      player.awakenSkill(event.name)
      trigger.player.recover(3 - trigger.player.hp)
      ;("step 1")
      var list = [],
        target = trigger.player
      for (var i = 1; i < 6; i++) {
        for (var j = 0; j < target.countDisabledSlot(i); j++) {
          list.push(i)
        }
      }
      if (list.length > 0) {
        target.enableEquip(list)
      }
      if (list.length < 6) {
        target.drawTo(6 - list.length)
      }
      if (target.storage.kotarou_rewrite) {
        target.storage.kotarou_rewrite = []
      }
      if (player === target) {
        player.storage.youlong2 = []
      }
    },
  },
}

export default skills
