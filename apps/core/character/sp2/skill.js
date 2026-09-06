import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 张芝
  // 笔心
  olbixin: {
    audio: 2,
    trigger: { global: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
    onremove: ["olbixin", "olbixin_basic", "olbixin_trick", "olbixin_equip"],
    map: { 基本: "basic", 锦囊: "trick", 装备: "equip" },
    filter(event, player) {
      const count = player.countMark("olbixin")
      if (count > 0 && event.player !== player) {
        return false
      }
      if (count > 1 && event.name === "phaseZhunbei") {
        return false
      }
      if (count > 2) {
        return false
      }
      const num = count >= 3 ? 3 : 1
      const types = ["basic", "trick", "equip"].filter((type) => {
        return player.countMark(`olbixin_${type}`) < num
      })
      if (!types.length) {
        return false
      }
      return lib.skill.olbixin.getList(player).length > 0
    },
    getList(player, event) {
      const vcards = get.inpileVCardList((info) => {
        if (info[0] !== "basic") {
          return false
        }
        if (
          player.getRoundHistory(
            "useCard",
            (evt) => evt.card.name === info[2] && evt.card.nature === info[3],
          ).length
        ) {
          return false
        }
        if (!event) {
          return player.hasUseTarget({ name: info[2], nature: info[3] })
        }
        return event.filterCard(
          get.autoViewAs({ name: info[2], nature: info[3] }, "unsure"),
          player,
          event,
        )
      })
      return vcards
    },
    async cost(event, trigger, player) {
      const types = ["basic", "trick", "equip"]
      const list = get.info(event.skill).getList(player)
      const dialog = [
        `###${get.prompt("olbixin")}###<div class="text center">摸${get.cnNumber(player.countMark("olbixin") >= 3 ? 1 : 3)}张牌，将所有此类别手牌当你本轮未使用过的基本牌使用</div>`,
      ]
      dialog.push([types.map((i) => get.translation(i)), "tdnodes"])
      dialog.push([list, "vcard"])
      const result = await player
        .chooseButton(dialog, 2)
        .set("filterButton", (button) => {
          const player = get.player(),
            count = player.countMark("olbixin"),
            num = count >= 3 ? 3 : 1
          const type = typeof button.link
          if (
            ui.selected.buttons.length &&
            type === typeof ui.selected.buttons[0].link
          ) {
            return false
          }
          if (
            type === "string" &&
            player.countMark(`olbixin_${lib.skill.olbixin.map[button.link]}`) >=
              num
          ) {
            return false
          }
          if (
            type !== "string" &&
            !player.hasUseTarget({
              name: button.link[2],
              nature: button.link[3],
            })
          ) {
            return false
          }
          return true
        })
        .set("ai", (button) => {
          const { player, list } = get.event()
          const type = typeof button.link
          if (type === "string") {
            return (1.2 - list.indexOf(lib.skill.olbixin.map[button.link])) * 10
          }
          return player.getUseValue({
            name: button.link[2],
            nature: button.link[3],
          })
        })
        .set(
          "list",
          types
            .map((i) => [
              i,
              player
                .getCards("h", { type: i })
                .map((i) => get.value(i))
                .reduce((p, c) => p + c, 0),
            ])
            .sort((a, b) => a[1] - b[1])
            .map((i) => i[0]),
        )
        .forResult()
      event.result = {
        bool: result?.bool,
        cost_data: result?.links,
      }
    },
    async content(event, trigger, player) {
      if (typeof event.cost_data[0] !== "string") {
        event.cost_data.reverse()
      }
      let type = event.cost_data[0],
        name = event.cost_data[1][2],
        nature = event.cost_data[1][3]
      game.log(player, "声明了", `${type}牌`)
      type = lib.skill.olbixin.map[type]
      event.type = type
      event.card = { name: name, nature: nature }
      player.addMark(`${event.name}_${type}`, 1, false)
      await player.draw(player.countMark(event.name) >= 3 ? 1 : 3)
      await game.delayx()
      if (player.hasCard((card) => get.type2(card) === event.type, "h")) {
        const cards = player.getCards(
          "h",
          (card) => get.type2(card) === event.type,
        )
        const cardx = get.autoViewAs(event.card, cards)
        if (player.hasUseTarget(cardx, true, false)) {
          await player
            .chooseUseTarget(cardx, cards, true, false)
            .set(
              "prompt",
              `选择${get.translation(cardx)}（${get.translation(cards)}）的目标`,
            )
        }
      }
    },
    group: "olbixin_full",
    subSkill: {
      full: {
        audio: "olbixin",
        onChooseToUse(event) {
          if (game.online || event.olbixin_list) {
            return
          }
          const player = event.player
          const list = lib.skill.olbixin.getList(player, event)
          event.set("olbixin_list", list)
        },
        enable: "chooseToUse",
        filter(event, player) {
          if (event.olbixin) {
            return false
          }
          const count = player.countMark("olbixin")
          if (count <= 2) {
            return false
          }
          const num = count >= 3 ? 3 : 1
          const types = ["basic", "trick", "equip"].filter((type) => {
            return player.countMark(`olbixin_${type}`) < num
          })
          if (!types.length) {
            return false
          }
          return event.olbixin_list?.length > 0
        },
        prompt:
          "你可以声明一种类别并摸1张牌（每种类别限3次），将所有此类别手牌当你本轮未使用过的基本牌使用",
        chooseButton: {
          dialog(event, player) {
            const list = event.olbixin_list
            const types = ["basic", "trick", "equip"]
            return ui.create.dialog(
              '###笔心###<div class="text center">摸一张牌，将所有此类别手牌当你本轮未使用过的基本牌使用</div>',
              [types.map((i) => get.translation(i)), "tdnodes"],
              [list, "vcard"],
            )
          },
          filter(button, player) {
            const count = player.countMark("olbixin"),
              num = count >= 3 ? 3 : 1
            const type = typeof button.link
            if (
              ui.selected.buttons.length &&
              type === typeof ui.selected.buttons[0].link
            ) {
              return false
            }
            if (
              type === "string" &&
              player.countMark(
                `olbixin_${lib.skill.olbixin.map[button.link]}`,
              ) >= num
            ) {
              return false
            }
            if (
              type !== "string" &&
              !_status.event
                .getParent()
                .filterCard(
                  { name: button.link[2], nature: button.link[3] },
                  player,
                  _status.event.getParent(),
                )
            ) {
              return false
            }
            return true
          },
          select: 2,
          check(button) {
            const types = ["basic", "trick", "equip"]
            const type = typeof button.link
            const player = _status.event.player
            const list = types
              .map((i) => [
                i,
                player
                  .getCards("h", { type: i })
                  .map((i) => get.value(i))
                  .reduce((p, c) => p + c, 0),
              ])
              .sort((a, b) => a[1] - b[1])
              .map((i) => i[0])
            if (type === "string") {
              return (
                (1.2 -
                  list.indexOf(button.link) +
                  Math.sqrt(
                    3 -
                      player.countMark(
                        `olbixin_${lib.skill.olbixin.map[button.link]}`,
                      ),
                  )) *
                10
              )
            }
            if (_status.event.getParent().type !== "phase") {
              return 1
            }
            return player.getUseValue({
              name: button.link[2],
              nature: button.link[3],
            })
          },
          backup(links, player) {
            if (typeof links[0] !== "string") {
              links.reverse()
            }
            return {
              audio: "olbixin",
              popname: true,
              position: "h",
              filterCard: () => false,
              selectCard: -1,
              type: lib.skill.olbixin.map[links[0]],
              viewAs: { name: links[1][2], nature: links[1][3] },
              log: false,
              async precontent(event, trigger, player) {
                player.logSkill("olbixin")
                const type = lib.skill.olbixin_full_backup.type
                game.log(player, "声明了", type, "牌")
                player.addMark(`olbixin_${type}`, 1, false)
                await player.draw(player.countMark("olbixin") >= 3 ? 1 : 3)
                const cards = player.getCards(
                  "h",
                  (card) =>
                    get.type2(card) === lib.skill.olbixin_full_backup.type,
                )
                const cardsx = cards.filter(
                  (i) =>
                    game.checkMod(
                      i,
                      player,
                      "unchanged",
                      "cardEnabled2",
                      player,
                    ) !== false,
                )
                if (cardsx.length && cardsx.length === cards.length) {
                  event.result.cards = cards
                  await game.delayx()
                } else {
                  event.cancel()
                  // event.getParent().set('olbixin',true);
                  event.getParent().goto(0)
                  delete event.getParent().openskilldialog
                }
              },
            }
          },
          prompt(links, player) {
            return `摸1张牌，将所有${get.translation(links[0])}牌当${get.translation(links[1][3]) || ""}${get.translation(links[1][2])}使用`
          },
        },
        hiddenCard(player, name) {
          const count = player.countMark("olbixin")
          if (
            !lib.inpile.includes(name) ||
            get.type(name) !== "basic" ||
            count < 3
          ) {
            return false
          }
          const types = ["basic", "trick", "equip"].filter((type) => {
            return player.countMark(`olbixin_${type}`) < 3
          })
          return types.length
        },
        ai: {
          fireAttack: true,
          respondSha: true,
          respondShan: true,
          skillTagFilter(player) {
            const count = player.countMark("olbixin")
            if (count < 3) {
              return
            }
            const types = ["basic", "trick", "equip"].filter((type) => {
              return player.countMark(`olbixin_${type}`) < 3
            })
            if (types.length) {
              return true
            }
          },
          order: 1,
          result: {
            player(player) {
              if (_status.event.dying) {
                return get.attitude(player, _status.event.dying)
              }
              return 1
            },
          },
        },
      },
      full_backup: {},
    },
  },
  // 洗墨
  olximo: {
    audio: 3,
    trigger: { player: "logSkill" },
    derivation: "olfeibai",
    filter(event, player) {
      return event.skill === "olbixin" && player.countMark("olbixin") < 3
    },
    forced: true,
    logAudio(event, player) {
      return `olximo${1 + player.countMark("olbixin")}.mp3`
    },
    content() {
      player.addMark("olbixin", 1, false)
      game.log(player, "删除了", "#g【笔心】", "描述的前五个字符")
      if (player.countMark("olbixin") === 3) {
        game.log(player, "交换了", "#g【笔心】", "描述中的两个数字")
        //player.removeSkill('olximo');
        //game.log(player,'失去了技能','#g【洗墨】');
        player.changeSkills(["olfeibai"], ["olximo"])
      }
    },
    ai: {
      combo: "olbixin",
    },
  },
  // 飞白
  olfeibai: {
    audio: 2,
    trigger: {
      source: "damageBegin1",
      player: "recoverBegin",
    },
    filter(event, player) {
      var storage = player.storage.olfeibai
      var evt = event.getParent(),
        card = event.card
      if (evt.player !== player || !card) {
        return false
      }
      if (storage && event.name === "recover") {
        return get.color(card) !== "red"
      }
      if (!storage && event.name === "damage") {
        return get.color(card) !== "black"
      }
      return false
    },
    content() {
      player.changeZhuanhuanji("olfeibai")
      trigger.num++
    },
    zhuanhuanji: true,
    forced: true,
    mark: true,
    marktext: "☯",
    intro: {
      content(storage, player) {
        if (storage) {
          return "转换技，锁定技，当你的非红色牌回复体力时，此回复值+1。"
        }
        return "转换技，锁定技，当你的非黑色牌造成伤害时，此伤害值+1。"
      },
    },
  },
}

export default skills
