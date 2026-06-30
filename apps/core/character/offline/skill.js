import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig['skill'] } */
const skills = {
  // 神貂蝉
  // 魅魂
  meihun: {
    audio: 2,
    trigger: {
      player: "phaseJieshuBegin",
      target: "useCardToTargeted",
    },
    direct: true,
    filter(event, player) {
      if (event.name !== "phaseJieshu" && event.card.name !== "sha") {
        return false
      }
      return game.hasPlayer(
        (current) => current !== player && current.countCards("h"),
      )
    },
    async content(event, trigger, player) {
      let result = await player
        .chooseTarget(
          get.prompt2("meihun"),
          (card, player, target) =>
            target !== player && target.countCards("h") > 0,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          var att = get.attitude(player, target)
          if (att > 0) {
            return 0
          }
          return 0.1 - att / target.countCards("h")
        })
        .forResult()
      if (!result.bool) {
        return
      }

      const target = result.targets[0]
      player.logSkill("meihun", target)
      event.target = target
      result = await player
        .chooseControl(lib.suit)
        .set("prompt", "请选择一种花色")
        .set("ai", () => lib.suit.randomGet())
        .forResult()

      const suit = result.control
      player.chat(get.translation(suit + 2))
      game.log(player, "选择了", `#y${get.translation(suit + 2)}`)
      if (target.countCards("h", { suit })) {
        result = await target
          .chooseCard(
            "he",
            `交给${get.translation(player)}一张${get.translation(suit)}花色的牌`,
            true,
            (card, player) => get.suit(card, player) === _status.event.suit,
          )
          .set("suit", suit)
          .forResult()
      } else {
        await player.discardPlayerCard(target, true, "h", "visible")
        return
      }
      if (result.bool && result.cards?.length) {
        await target.give(result.cards, player, "give")
      }
    },
  },
  // 惑心
  huoxin: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      if (game.countPlayer() < 3) {
        return false
      }
      for (var i of lib.suit) {
        if (player.countCards("h", { suit: i }) > 1) {
          return true
        }
      }
      return false
    },
    complexCard: true,
    position: "h",
    filterCard(card, player) {
      if (!ui.selected.cards.length) {
        var suit = get.suit(card)
        return (
          player.countCards(
            "h",
            (card2) => card !== card2 && get.suit(card2, player) === suit,
          ) > 0
        )
      }
      return get.suit(card, player) === get.suit(ui.selected.cards[0], player)
    },
    selectCard: 2,
    selectTarget: 2,
    filterTarget: lib.filter.notMe,
    multitarget: true,
    multiline: true,
    delay: false,
    discard: false,
    lose: false,
    check(card) {
      return 6 - get.value(card)
    },
    targetprompt: ["拼点发起人", "拼点目标"],
    async content(event, trigger, player) {
      const { targets, cards } = event
      const list = []
      for (let i = 0; i < targets.length; i++) {
        list.push([targets[i], cards[i]])
      }
      await game
        .loseAsync({
          gain_list: list,
          player: player,
          cards: cards,
          giver: player,
          animate: "giveAuto",
        })
        .setContent("gaincardMultiple")
      await game.delayx()

      if (!targets[0].canCompare(targets[1])) {
        return
      }

      const result = await targets[0].chooseToCompare(targets[1]).forResult()
      if (result.winner !== targets[0]) {
        targets[0].addMark("huoxin", 1)
      }
      if (result.winner !== targets[1]) {
        targets[1].addMark("huoxin", 1)
      }
    },
    marktext: "魅",
    intro: {
      name: "魅惑",
      name2: "魅惑",
      content: "mark",
    },
    group: "huoxin_control",
    ai: {
      order: 1,
      result: {
        target(player, target) {
          if (target.hasMark("huoxin")) {
            return -2
          }
          return -1
        },
      },
    },
  },
  huoxin_control: {
    audio: "huoxin",
    forced: true,
    trigger: { global: "phaseBeginStart" },
    sourceSkill: "huoxin",
    filter(event, player) {
      return (
        player !== event.player &&
        !event.player._trueMe &&
        event.player.countMark("huoxin") > 1
      )
    },
    logTarget: "player",
    skillAnimation: true,
    animationColor: "key",
    async content(event, trigger, player) {
      trigger.player.removeMark("huoxin", trigger.player.countMark("huoxin"))
      trigger.player._trueMe = player
      game.addGlobalSkill("autoswap")
      if (trigger.player === game.me) {
        game.notMe = true
        if (!_status.auto) {
          ui.click.auto()
        }
      }
      trigger.player.addSkill("huoxin2")
    },
  },
  huoxin2: {
    trigger: {
      player: ["phaseAfter", "dieAfter"],
      global: "phaseBeforeStart",
    },
    lastDo: true,
    charlotte: true,
    forceDie: true,
    forced: true,
    silent: true,
    sourceSkill: "huoxin",
    async content(event, trigger, player) {
      player.removeSkill("huoxin2")
    },
    onremove(player) {
      if (player === game.me) {
        if (!game.notMe) {
          game.swapPlayerAuto(player._trueMe)
        } else {
          delete game.notMe
        }
        if (_status.auto) {
          ui.click.auto()
        }
      }
      delete player._trueMe
    },
  },
  // 神典韦
  // 捐甲
  juanjia: {
    audio: 2,
    trigger: {
      global: "phaseBefore",
      player: "enterGame",
    },
    forced: true,
    filter(event, player) {
      return (
        (event.name !== "phase" || game.phaseNumber === 0) &&
        player.hasEnabledSlot(2)
      )
    },
    async content(event, trigger, player) {
      await player.disableEquip(2)
      await player.expandEquip(1)
    },
  },
  // 挈挟
  qiexie: {
    audio: 2,
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    filter(event, player) {
      return player.countEmptySlot(1) > 0
    },
    async content(event, trigger, player) {
      if (!_status.characterlist) {
        game.initCharacterList()
      }
      _status.characterlist.randomSort()

      const list = []
      for (const name of _status.characterlist) {
        if (
          get.character(name, 3).some((skill) => {
            const info = get.plainText(get.skillInfoTranslation(skill))
            if (!info.includes("【杀】")) {
              return false
            }
            const list = get.skillCategoriesOf(skill, player)
            list.remove("锁定技")
            return list.length === 0
          })
        ) {
          list.push(name)
          if (list.length >= 5) {
            break
          }
        }
      }
      const num = player.countEmptySlot(1)
      if (!list.length || !num) {
        return
      }
      const result = await player
        .chooseButton(
          [
            `挈挟：选择${num > 1 ? "至多" : ""}${get.cnNumber(num)}张武将牌当武器牌置入装备区`,
            [
              list,
              (item, type, position, noclick, node) => {
                return lib.skill.qiexie.$createButton(
                  item,
                  type,
                  position,
                  noclick,
                  node,
                )
              },
            ],
          ],
          [1, num],
          true,
        )
        .set("ai", (button) => {
          const name = button.link
          const skills = get.character(name, 3).filter((skill) => {
            const info = get.plainText(get.skillInfoTranslation(skill))
            if (!info.includes("【杀】")) {
              return false
            }
            const list = get.skillCategoriesOf(skill, get.player())
            list.remove("锁定技")
            return list.length === 0
          })
          let eff = 0.2
          for (const skill of skills) {
            eff += get.skillRank(skill, "in")
          }
          return eff
        })
        .forResult()
      if (result?.bool) {
        const list = result.links
        game.addVideo("skill", player, [event.name, [list]])
        _status.characterlist.removeArray(list)
        game.broadcastAll(
          (player, list) => {
            player.tempname.addArray(list)
            for (var name of list) {
              lib.skill.qiexie.createCard(name)
            }
          },
          player,
          list,
        )
        const cards = list.map((name) => {
          const card = game.createCard(`qiexie_${name}`, "none", "none")
          return card
        })
        player.$gain2(cards)
        await game.delayx()
        for (const card of cards) {
          await player.equip(card)
        }
      }
    },
    $createButton(item, type, position, noclick, node) {
      node = ui.create.buttonPresets.character(
        item,
        "character",
        position,
        noclick,
      )
      const info = lib.character[item]
      const skills = info[3].filter((skill) => {
        var info = get.skillInfoTranslation(skill)
        if (!info.includes("【杀】")) {
          return false
        }
        var list = get.skillCategoriesOf(skill, get.player())
        list.remove("锁定技")
        return list.length === 0
      })
      if (skills.length) {
        const skillstr = skills
          .map((i) => `[${get.translation(i)}]`)
          .join("<br>")
        const skillnode = ui.create.caption(
          `<div class="text" data-nature=${get.groupnature(info[1], "raw")}m style="font-family: ${lib.config.name_font || "xinwei"},xinwei">${skillstr}</div>`,
          node,
        )
        skillnode.style.left = "2px"
        skillnode.style.bottom = "2px"
      }
      node._customintro = (uiintro, evt) => {
        const character = node.link,
          characterInfo = get.character(node.link)
        let capt = get.translation(character)
        if (characterInfo) {
          const infoHp = get.infoMaxHp(characterInfo[2])
          capt += `&nbsp;&nbsp;范围：${infoHp}`
        }
        uiintro.add(capt)
        if (lib.characterTitle[node.link]) {
          uiintro.addText(get.colorspan(lib.characterTitle[node.link]))
        }
        for (let i = 0; i < skills.length; i++) {
          if (lib.translate[`${skills[i]}_info`]) {
            const translation =
              lib.translate[`${skills[i]}_ab`] ||
              get.translation(skills[i]).slice(0, 2)
            if (lib.skill[skills[i]] && lib.skill[skills[i]].nobracket) {
              uiintro.add(
                `<div><div class="skilln">${get.translation(skills[i])}</div><div>${get.skillInfoTranslation(skills[i], null, false)}</div></div>`,
              )
            } else {
              uiintro.add(
                `<div><div class="skill">【${translation}】</div><div>${get.skillInfoTranslation(skills[i], null, false)}</div></div>`,
              )
            }
            if (lib.translate[`${skills[i]}_append`]) {
              uiintro._place_text = uiintro.add(
                `<div class="text">${lib.translate[`${skills[i]}_append`]}</div>`,
              )
            }
          }
        }
      }
      return node
    },
    video(player, info) {
      for (var name of info[0]) {
        lib.skill.qiexie.createCard(name)
      }
    },
    createCard(name) {
      if (!_status.postReconnect.qiexie) {
        _status.postReconnect.qiexie = [
          (list) => {
            for (var name of list) {
              lib.skill.qiexie.createCard(name)
            }
          },
          [],
        ]
      }
      _status.postReconnect.qiexie[1].add(name)
      if (!lib.card[`qiexie_${name}`]) {
        if (lib.translate[`${name}_ab`]) {
          lib.translate[`qiexie_${name}`] = lib.translate[`${name}_ab`]
        } else {
          lib.translate[`qiexie_${name}`] = lib.translate[name]
        }
        var info = lib.character[name]
        var card = {
          fullimage: true,
          image: `character:${name}`,
          type: "equip",
          subtype: "equip1",
          enable: true,
          selectTarget: -1,
          filterTarget(card, player, target) {
            if (player !== target) {
              return false
            }
            return target.canEquip(card, true)
          },
          modTarget: true,
          allowMultiple: false,
          content: lib.element.content.equipCard,
          toself: true,
          ai: {},
          skills: ["qiexie_destroy"],
        }
        var maxHp = get.infoMaxHp(info[2])
        if (maxHp !== 1) {
          card.distance = { attackFrom: 1 - maxHp }
        }
        var skills = info[3].filter((skill) => {
          var info = get.skillInfoTranslation(skill)
          if (!info.includes("【杀】")) {
            return false
          }
          var list = get.skillCategoriesOf(skill, get.player())
          list.remove("锁定技")
          return list.length === 0
        })
        var str = "锁定技。"
        if (skills.length) {
          card.skills.addArray(skills)
          str += "你视为拥有技能"
          for (var skill of skills) {
            str += `〖${get.translation(skill)}〗`
            str += "、"
          }
          str = str.slice(0, str.length - 1)
          str += "；"
          card.ai.equipValue = (card, player) => {
            let val = maxHp
            if (player.hasSkill("qiexie")) {
              val *= 0.4
            } else {
              val *= 0.6
            }
            return (val += skills.length)
          }
        }
        str += "此牌离开你的装备区时你令之销毁。"
        lib.translate[`qiexie_${name}_info`] = str
        var append = ""
        if (skills.length) {
          for (var skill of skills) {
            if (lib.skill[skill].nobracket) {
              append += `<div class="skilln">${get.translation(skill)}</div><div><span style="font-family: yuanli">${get.skillInfoTranslation(skill)}</span></div><br><br>`
            } else {
              var translation =
                lib.translate[`${skill}_ab`] ||
                get.translation(skill).slice(0, 2)
              append += `<div class="skill">【${translation}】</div><div><span style="font-family: yuanli">${get.skillInfoTranslation(skill)}</span></div><br><br>`
            }
          }
          str = str.slice(0, str.length - 8)
        }
        lib.translate[`qiexie_${name}_append`] = append
        lib.card[`qiexie_${name}`] = card
        game.finishCard(`qiexie_${name}`)
      }
    },
    subSkill: {
      destroy: {
        trigger: { player: "loseBegin" },
        equipSkill: true,
        forceDie: true,
        charlotte: true,
        forced: true,
        popup: false,
        filter(event, player) {
          return event.cards.some((card) => card.name.indexOf("qiexie_") === 0)
        },
        async content(event, trigger, player) {
          for (const card of trigger.cards) {
            if (card.name.indexOf("qiexie_") === 0) {
              card._destroy = true
              game.log(card, "被放回武将牌堆")
              const name = card.name.slice(7)
              if (player.tempname?.includes(name)) {
                game.broadcastAll(
                  (player, name) => {
                    player.tempname.remove(name)
                  },
                  player,
                  name,
                )
              }
              if (lib.character[name]) {
                _status.characterlist.add(name)
              }
            }
          }
        },
      },
    },
  },
  // 摧决
  cuijue: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return player.countCards("he") > 0 //&&game.hasPlayer(target=>lib.skill.cuijue.filterTarget('SB',player,target));
    },
    filterCard: true,
    filterTarget(card, player, target) {
      if (
        player.getStorage("cuijue_used").includes(target) ||
        !player.inRange(target)
      ) {
        return false
      }
      var distance = get.distance(player, target)
      return !game.hasPlayer(
        (current) =>
          current !== target &&
          player.inRange(current) &&
          get.distance(player, current) > distance,
      )
    },
    selectTarget: [0, 1],
    filterOk() {
      var player = _status.event.player
      if (
        game.hasPlayer((target) =>
          lib.skill.cuijue.filterTarget("SB", player, target),
        )
      ) {
        return ui.selected.targets.length > 0
      }
      return true
    },
    position: "he",
    complexTarget: true,
    check: (card) => {
      var player = _status.event.player,
        goon = 0
      try {
        ui.selected.cards.add(card)
        if (
          game.hasPlayer((target) => {
            return lib.skill.cuijue.filterTarget("SB", player, target)
          })
        ) {
          goon = 6
        }
      } catch (e) {
        console.trace(e)
      }
      ui.selected.cards.remove(card)
      return goon - get.value(card)
    },
    async content(event, trigger, player) {
      const { target } = event
      if (target) {
        player.addTempSkill("cuijue_used", "phaseUseAfter")
        player.markAuto("cuijue_used", [target])
        target.damage("nocard")
      }
    },
    ai: {
      order: 2,
      result: {
        target: -1.5,
      },
      tag: {
        damage: 1,
      },
    },
    subSkill: {
      used: {
        onremove: true,
        charlotte: true,
      },
    },
  },
  // 神贾诩
  // 炼魄
  jxlianpo: {
    audio: 2,
    init: () => {
      game.addGlobalSkill("jxlianpo_global")
    },
    onremove: () => {
      if (
        !game.hasPlayer((i) => i.hasSkill("jxlianpo", null, null, false), true)
      ) {
        game.removeGlobalSkill("jxlianpo_global")
      }
    },
    trigger: { global: "dieAfter" },
    filter(event, player) {
      if (lib.skill.jxlianpo.getMax(event.player).length <= 1) {
        return false
      }
      return event.source?.isIn()
    },
    forced: true,
    logTarget: "source",
    getMax: (dead) => {
      const curs = game.players.slice(0)
      if (get.itemtype(dead) === "player" && !curs.includes(dead)) {
        curs.push(dead)
      }
      const map = {
        zhu: curs.reduce((count, current) => {
          let num = 0
          if (["zhu", "zhong", "mingzhong"].includes(current.identity)) {
            num++
          }
          num += current.countMark("jxlianpo_mark_zhong")
          return num + count
        }, 0),
        fan: curs.reduce((count, current) => {
          let num = 0
          if (current.identity === "fan") {
            num++
          }
          num += current.countMark("jxlianpo_mark_fan")
          return num + count
        }, 0),
        nei: curs.reduce((count, current) => {
          let num = 0
          if (current.identity === "nei") {
            num++
          }
          num += current.countMark("jxlianpo_mark_nei")
          return num + count
        }, 0),
        commoner: curs.reduce((count, current) => {
          let num = 0
          if (current.identity === "commoner") {
            num++
          }
          num += current.countMark("jxlianpo_mark_commoner")
          return num + count
        }, 0),
      }
      let population = 0,
        identities = []
      for (const i in map) {
        const curPopulation = map[i]
        if (curPopulation >= population) {
          if (curPopulation > population) {
            identities = []
          }
          identities.add(i)
          population = curPopulation
        }
      }
      return identities
    },
    group: "jxlianpo_show",
    async content(event, trigger, player) {
      var source = trigger.source
      source.chooseDrawRecover(2, true)
    },
    mark: true,
    intro: {
      content: () =>
        `场上最大阵营为${lib.skill.jxlianpo
          .getMax()
          .map((i) => {
            if (i === "zhu") {
              return "主忠"
            }
            return get.translation(`${i}2`)
          })
          .join("、")}`,
    },
    $createButton(item, type, position, noclick, node) {
      node = ui.create.identityCard(item, position, noclick)
      node.link = item
      return node
    },
    subSkill: {
      show: {
        audio: "jxlianpo",
        trigger: { global: "roundStart" },
        filter(event, player) {
          var list = lib.config.mode_config.identity.identity.lastItem.slice()
          list.removeArray(
            game.filterPlayer().map((i) => {
              let identity = i.identity
              if (identity === "mingzhong") {
                identity = "zhong"
              }
              return identity
            }),
          )
          return list.length
        },
        forced: true,
        async content(event, trigger, player) {
          const list = lib.config.mode_config.identity.identity.lastItem.slice()

          const needRemoved = game.filterPlayer().map((current) => {
            var identity = current.identity
            return identity === "mingzhong" ? "zhong" : identity
          })
          list.removeArray(needRemoved).unique()

          const cards = [list, createCard]
          const title =
            '###炼魄：请展示一张未加入游戏或死亡角色的身份牌###<div class="text center">本轮该阵营角色数视为+1</div>'
          const next = player.chooseButton([title, cards], true)

          const result = await next.forResult()
          const choice = result.links[0]
          const mark = `jxlianpo_mark_${choice}`

          player
            .when({ global: "roundStart" }, false)
            .assign({
              firstDo: true,
            })
            .filter((evt) => evt !== trigger)
            .step(async (event, trigger, player) => {
              for (const storage in player.storage) {
                if (storage.startsWith("jxlianpo_mark_")) {
                  player.clearMark(storage)
                }
              }
            })

          player.addMark(mark, 1, false)
          event.videoId = lib.status.videoId++
          const createDialog = (player, identity, id) => {
            var dialog = ui.create.dialog(
              `${get.translation(player)}展示了“${get.translation(`${identity}2`)}”的身份牌<br>`,
              "forcebutton",
            )
            dialog.videoId = id
            ui.create.spinningIdentityCard(identity, dialog)
          }
          game.broadcastAll(createDialog, player, choice, event.videoId)
          let color = ""
          if (choice === "zhong") {
            color = "#y"
          } else if (choice === "fan") {
            color = "#g"
          } else if (choice === "nei") {
            color = "#b"
          }
          game.log(
            player,
            "展示了",
            `${color}${get.translation(`${choice}2`)}`,
            "的身份牌",
          )
          await game.delay(3)
          game.broadcastAll("closeDialog", event.videoId)

          return

          function createCard(item, type, position, noclick, node) {
            return lib.skill.jxlianpo.$createButton(
              item,
              type,
              position,
              noclick,
              node,
            )
          }
        },
      },
      global: {
        mod: {
          maxHandcard(player, num) {
            if (!lib.skill.jxlianpo.getMax().includes("fan")) {
              return
            }
            return (
              num -
              game.countPlayer((current) => {
                return current !== player && current.hasSkill("jxlianpo")
              })
            )
          },
          cardUsable(card, player, num) {
            if (card.name === "sha") {
              if (!lib.skill.jxlianpo.getMax().includes("fan")) {
                return
              }
              return (
                num +
                game.countPlayer((current) => {
                  return current.hasSkill("jxlianpo")
                })
              )
            }
          },
          attackRange(player, num) {
            if (!lib.skill.jxlianpo.getMax().includes("fan")) {
              return
            }
            return (
              num +
              game.countPlayer((current) => {
                return current.hasSkill("jxlianpo")
              })
            )
          },
          cardSavable(card, player, target) {
            if (card.name === "tao" && !player.hasSkill("jxlianpo")) {
              if (!lib.skill.jxlianpo.getMax().includes("zhu")) {
                return
              }
              if (player === target) {
                return
              }
              return false
            }
          },
          playerEnabled(card, player, target) {
            if (card.name === "tao" && !player.hasSkill("jxlianpo")) {
              if (!lib.skill.jxlianpo.getMax().includes("zhu")) {
                return
              }
              if (player === target) {
                return
              }
              return false
            }
          },
        },
        trigger: { player: "dieAfter" },
        filter: () => {
          return !game.hasPlayer(
            (i) => i.hasSkill("jxlianpo", null, null, false),
            true,
          )
        },
        silent: true,
        forceDie: true,
        content: () => {
          game.removeGlobalSkill("jxlianpo_global")
        },
      },
    },
  },
  // 兆乱
  zhaoluan: {
    audio: 2,
    trigger: { global: "dieBegin" },
    filter(event, player) {
      return event.getParent().name === "dying" && event.player.isIn()
    },
    limited: true,
    skillAnimation: true,
    animationColor: "metal",
    logTarget: "player",
    check(event, player) {
      if (
        event.source?.isIn() &&
        get.attitude(player, event.source) > 0 &&
        player.identity === "fan"
      ) {
        return false
      }
      return get.attitude(player, event.player) > 3.5
    },
    async content(event, trigger, player) {
      var target = trigger.player
      player.awakenSkill(event.name)
      trigger.cancel()
      const skills = target.getSkills(null, false, false).filter((skill) => {
        var info = get.info(skill)
        if (info && !info.charlotte && !get.is.locked(skill)) {
          return true
        }
      })
      if (skills.length) {
        await target.removeSkills(skills)
      }
      await target.gainMaxHp(3)
      var num = 3 - target.getHp(true)
      if (num > 0) {
        await target.recover(num)
      }
      target.draw(4)
      player.addSkill("zhaoluan_effect")
      player.markAuto("zhaoluan_effect", target)
    },
    ai: {
      expose: 0.5,
      threaten: 3,
    },
    subSkill: {
      effect: {
        audio: 2,
        enable: "phaseUse",
        filter(event, player) {
          return player.getStorage("zhaoluan_effect").some((i) => i.isIn())
        },
        filterTarget(card, player, target) {
          return !player.getStorage("zhaoluan_hit").includes(target)
        },
        line: false,
        locked: true,
        charlotte: true,
        promptfunc() {
          var bodies = _status.event.player
            .getStorage("zhaoluan_effect")
            .filter((i) => i.isIn())
          return `你可以令${get.translation(bodies)}${bodies.length > 1 ? "中的一人" : ""}减1点体力上限并对一名你选择的角色造成1点伤害。`
        },
        delay: false,
        async content(event, trigger, player) {
          const bodies = player
            .getStorage("zhaoluan_effect")
            .filter((target) => target.isIn())

          let result
          if (bodies.length === 1) {
            result = { bool: true, targets: bodies }
          } else {
            result = await player
              .chooseTarget(
                "兆乱：请选择被减上限的傀儡",
                true,
                (card, player, target) => {
                  return get.event().targets.includes(target)
                },
              )
              .set("targets", bodies)
              .set("ai", (target) => {
                return 8 - get.attitude(_status.event.player, target)
              })
              .forResult()
          }

          if (!result.bool) {
            return
          }

          const target = result.targets[0]
          player.line(target)
          await target.loseMaxHp()
          await game.delayex()

          player.line(target)
          await event.targets[0].damage()
          if (!player.storage.zhaoluan_hit) {
            player
              .when("phaseUseAfter")
              .step(async (event, trigger, player) => {
                delete player.storage.zhaoluan_hit
              })
          }
          player.markAuto("zhaoluan_hit", event.targets)
        },
        ai: {
          order: 9,
          result: {
            player(player) {
              var bodies = player
                .getStorage("zhaoluan_effect")
                .filter((i) => i.isIn())
              var body
              if (bodies.length === 1) {
                body = bodies[0]
              } else {
                body = bodies.sort(
                  (a, b) => get.attitude(player, a) - get.attitude(player, b),
                )[0]
              }
              if (
                get.attitude(player, body) > 4 &&
                !body.isDamaged() &&
                body.getHp() <= 2
              ) {
                return -10
              }
              return 0
            },
            target(player, target) {
              return Math.sign(get.damageEffect(target, player, target))
            },
          },
        },
      },
    },
  },
  //神黄月英
  // 藏巧
  cangqiao: {
    audio: 2,
    trigger: {
      player: "useCard",
      global: "roundStart",
    },
    filter(event, player) {
      if (event.name === "useCard") {
        if (!["zheji", "nvzhuang", "numa"].includes(event.card.name)) {
          return false
        }
        return player.countCards("h") < player.maxHp
      }
      return true
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseBool(get.prompt(event.skill), () => true)
        .forResult()
    },
    async content(event, trigger, player) {
      if (trigger.name === "useCard") {
        await player.drawTo(player.maxHp)
      } else {
        if (!_status.cangqiao) {
          game.broadcastAll(() => {
            _status.cangqiao = [
              { name: "zheji", number: 13, suit: "club" },
              { name: "nvzhuang", number: 9, suit: "heart" },
              { name: "numa", number: 13, suit: "club" },
            ]
            for (const info of _status.cangqiao) {
              if (!lib.inpile.includes(info.name)) {
                lib.inpile.add(info.name)
              }
            }
          })
        }
        const list = ["zheji", "nvzhuang", "numa"],
          cards = []
        for (const name of list) {
          let card = get.discardPile(name)
          if (card) {
            cards.add(card)
          } else {
            const info = _status.cangqiao.find((i) => i.name === name)
            if (info) {
              game.broadcastAll((info) => {
                _status.cangqiao.remove(info)
              }, info)
              card = game.createCard2(name, info.suit, info.number)
              card.addCardtag("gifts")
              cards.add(card)
            }
          }
        }
        if (cards.length) {
          await player.gain(cards, "draw2")
        }
      }
    },
  },
  // 神机
  shenji: {
    audio: 2,
    usable: 1,
    trigger: { global: "useCardAfter" },
    filter(event, player) {
      if (!event.targets.includes(player) || event.targets.length !== 1) {
        return false
      }
      if (get.color(event.card) !== "black") {
        return false
      }
      const storage = player.getStorage(
        "shenji",
        lib.inpile.filter((name) => get.type(name) === "delay"),
      )
      if (!storage.some((name) => player.hasUseTarget(name))) {
        return false
      }
      return game.hasPlayer((current) => {
        return current.countCards("ej", { type: "equip" })
      })
    },
    async cost(event, trigger, player) {
      const storage = player
        .getStorage(
          event.skill,
          lib.inpile.filter((name) => get.type(name) === "delay"),
        )
        .filter((name) => player.hasUseTarget(name))
      const choice = storage
        .map((name) => [
          name,
          player.getUseValue(get.autoViewAs({ name, isCard: false }, "unsure")),
        ])
        .reduce(
          (max, info) => {
            if (max[1] < info[1]) {
              return info
            }
            return max
          },
          [null, 0],
        )[0]
      const result = await player
        .chooseTarget(get.prompt2(event.skill), (_, player, target) =>
          target.countCards("ej", { type: "equip" }),
        )
        .set("ai", (target) => {
          const { player, choice } = get.event(),
            es = target.getCards("ej", { type: "equip" })
          if (!choice) {
            return 0
          }
          if (get.attitude(player, target) > 0) {
            return 10 - Math.min(...es.map((card) => get.equipValue(card)))
          }
          return Math.max(...es.map((card) => get.equipValue(card)))
        })
        .set("choice", choice)
        .forResult()
      event.result = {
        bool: result?.bool,
        targets: result?.targets,
        cost_data: choice,
      }
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
        cost_data: choice,
      } = event
      const result = await player
        .choosePlayerCard(
          target,
          `###神械###将${get.translation(target)}场上一张装备牌当未以此法使用过的延时锦囊牌使用（均使用过后重置）`,
          "ej",
          true,
        )
        .set("filterButton", ({ link }) => get.type(link) === "equip")
        .set("ai", ({ link }) => {
          const { player, target } = get.event()
          if (get.attitude(player, target) > 0) {
            return 10 - get.equipValue(link)
          }
          return get.equipValue(link)
        })
        .forResult()
      if (result?.bool && result.cards?.length) {
        const storage = player
          .getStorage(
            event.name,
            lib.inpile.filter((name) => get.type(name) === "delay"),
          )
          .filter((name) => player.hasUseTarget(name))
        const { links } = await player
          .chooseVCardButton(
            true,
            "神械：请选择要使用的延时锦囊牌",
            storage.slice(),
          )
          .set("ai", ({ link: [_, __, name] }) => {
            const { player, choice } = get.event()
            if (choice) {
              return name === choice
            }
            return player.getUseValue(name)
          })
          .set("choice", choice)
          .forResult()
        if (links?.length) {
          const name = links[0][2]
          storage.remove(name)
          if (!storage.length) {
            storage.addArray(
              lib.inpile.filter((name) => get.type(name) === "delay"),
            )
          }
          player.setStorage(event.name, storage, true)
          await player.chooseUseTarget(
            { name, storage: { equipEnable: true }, isCard: false },
            result.cards,
            true,
          )
        }
      }
    },
  },
  huaxiu: {
    audio: 2,
    usable: 1,
    enable: "phaseUse",
    onChooseToUse(event) {
      if (game.online) {
        return
      }
      event.set(
        "huaxiu",
        ["zheji", "nvzhuang", "numa"].filter((i) => i in lib.card),
      )
    },
    filter(event, player) {
      return event.huaxiu?.length
    },
    manualConfirm: true,
    async content(event, trigger, player) {
      const list = event
        .getParent(2)
        .huaxiu.map((name) => [get.type(name), "", name])
      const result = await player
        .chooseButton(true, [
          "化朽",
          "选择要修改一种“藏巧”装备牌",
          [list, "vcard"],
        ])
        .set("ai", (button) => {
          const player = get.player(),
            name = button.link[2]
          const num = game.countPlayer((current) => {
            const hs = current.countVCards("h", (card) => name === card.name),
              es = current.countVCards("e", (card) => name === card.name),
              js = current.countVCards(
                "j",
                (card) =>
                  get.type(card) === "delay" &&
                  card.storage.equipEnable &&
                  name === get.name(card, false),
              )
            return (
              get.sgnAttitude(player, current) *
              (es + js + current === player ? hs : 0)
            )
          })
          return num
        })
        .forResult()
      if (result?.bool && result.links?.length) {
        const name = result.links[0][2],
          map = {
            zheji: "hun_zhuge",
            nvzhuang: "hun_bagua",
            numa: "lingling",
          }
        game.log(
          player,
          "将",
          `#y${get.translation({ name })}`,
          "升级为",
          `#y${get.translation({ name: map[name] })}`,
        )
        player.addTempSkill("huaxiu_restore", { player: "phaseBegin" })
        game.broadcastAll(
          (name, player, map) => {
            if (!_status.huaxiu_origin) {
              _status.huaxiu_origin = {}
              for (const name of ["zheji", "nvzhuang", "numa"]) {
                _status.huaxiu_origin[name] = {
                  info: lib.card[name],
                  translate: lib.translate[name],
                  translate2: lib.translate[`${name}_info`],
                }
              }
            }
            lib.card[name] = lib.card[map[name]]
            lib.translate[name] = lib.translate[map[name]]
            lib.translate[`${name}_info`] = lib.translate[`${map[name]}_info`]
            _status.huaxiu ??= {}
            _status.huaxiu[name] ??= []
            _status.huaxiu[name].add(player)
            lib.init.sheet(`
							.card[data-card-name = "${name}"]>.image {
								background-image: url(${lib.assetURL}image/card/${map[name]}.png) !important;
							}
						`)
          },
          name,
          player,
          map,
        )
        function check(name, target, method) {
          if (method === "e") {
            return target.hasVCard({ name }, "e")
          }
          if (method === "j") {
            return target.hasVCard((card) => {
              if (!card.storage?.equipEnable) {
                return false
              }
              return card.cards.some((cardx) => cardx.name === name)
            }, "j")
          }
          return false
        }
        const removeSkill = get.skillsFromEquips([{ name }]),
          addSkill = get.skillsFromEquips([{ name: map[name] }])
        for (const current of game.players) {
          const keepSkills = Object.values(current.additionalSkills).flat(),
            removeSkill2 = removeSkill.slice().removeArray(keepSkills)
          if (removeSkill2.length) {
            current.removeSkill(removeSkill2)
          }
          if (check(name, current, "j")) {
            current.addSkill(addSkill)
          }
          if (check(name, current, "e")) {
            current.addEquipTrigger({ name: map[name] })
          }
          const vcards = current.getVCards("e", { name })
          while (vcards.length) {
            const vcard = vcards.shift()
            current.$addVirtualEquip(vcard, vcard.cards)
          }
        }
      }
    },
    subSkill: {
      restore: {
        charlotte: true,
        onremove(player, skill) {
          get.info(skill).contentx.apply(this, [null, null, player])
        },
        trigger: { player: "phaseBegin" },
        filter(event, player) {
          for (const name of ["zheji", "nvzhuang", "numa"]) {
            if (_status.huaxiu?.[name]?.includes(player)) {
              return true
            }
          }
          return false
        },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          get.info(event.name).contentx.apply(this, arguments)
        },
        contentx(event, trigger, player) {
          game.broadcastAll((player) => {
            for (const name of ["zheji", "nvzhuang", "numa"]) {
              if (_status.huaxiu?.[name]?.includes(player)) {
                _status.huaxiu[name].remove(player)
                lib.init.sheet(`
									.card[data-card-name = "${name}"]>.image {
										background-image: url(${lib.assetURL}image/card/${name}.png) !important;
									}
								`)
              }
            }
          }, player)
          function check(name, target, method) {
            if (method === "e") {
              return target.hasVCard({ name }, "e")
            }
            if (method === "j") {
              return target.hasVCard((card) => {
                if (!card.storage?.equipEnable) {
                  return false
                }
                return card.cards.some((cardx) => cardx.name === name)
              }, "j")
            }
            return false
          }
          const map = {
            zheji: "hun_zhuge",
            nvzhuang: "hun_bagua",
            numa: "lingling",
          }
          for (const name of ["zheji", "nvzhuang", "numa"]) {
            if (name in _status.huaxiu && !_status.huaxiu[name].length) {
              game.log(`#y${get.translation({ name })}`, "的效果还原了")
              game.broadcastAll((name) => {
                delete _status.huaxiu[name]
              }, name)
              lib.card[name] = _status.huaxiu_origin[name].info
              lib.translate[name] = _status.huaxiu_origin[name].translate
              lib.translate[`${name}_info`] =
                _status.huaxiu_origin[name].translate2
              const addSkill = get.skillsFromEquips([{ name }]),
                removeSkill = get.skillsFromEquips([{ name: map[name] }])
              for (const current of game.players) {
                const keepSkills = Object.values(
                    current.additionalSkills,
                  ).flat(),
                  removeSkill2 = removeSkill.slice().removeArray(keepSkills)
                if (removeSkill2.length) {
                  current.removeSkill(removeSkill2)
                }
                if (check(name, current, "j")) {
                  current.addSkill(addSkill)
                } else if (check(name, current, "e")) {
                  current.addEquipTrigger({ name })
                }
                const vcards = current.getVCards("e", { name })
                while (vcards.length) {
                  const vcard = vcards.shift()
                  current.$addVirtualEquip(vcard, vcard.cards)
                }
              }
            }
          }
        },
      },
    },
    ai: {
      order: 10,
      result: {
        player: 1,
      },
    },
  },
  hun_zhuge_skill: {
    equipSkill: true,
    firstDo: true,
    locked: true,
    audio: "zhuge_skill",
    mod: {
      cardUsable(card, player, num) {
        const cards = player.getCards(
          "e",
          (card) => get.name(card) === "hun_zhuge",
        )
        if (card.name === "sha") {
          if (
            !cards.length ||
            player.hasSkill("hun_zhuge_skill", null, false) ||
            cards.some(
              (card) =>
                card !== _status.hun_zhuge_temp &&
                !ui.selected.cards.includes(card),
            )
          ) {
            if (get.is.versus() || get.is.changban()) {
              return num + 3
            }
            return Infinity
          }
        }
      },
      cardEnabled2(card, player) {
        if (
          !_status.event.addCount_extra ||
          player.hasSkill("hun_zhuge_skill", null, false)
        ) {
          return
        }
        const cards = player.getCards(
          "e",
          (card) => get.name(card) === "hun_zhuge",
        )
        if (card && cards.includes(card)) {
          let cardz
          try {
            cardz = get.card()
          } catch (e) {
            return
          }
          if (cardz?.name !== "sha") {
            return
          }
          _status.hun_zhuge_temp = card
          const bool = lib.filter.cardUsable(
            get.autoViewAs(cardz, ui.selected.cards.concat([card])),
            player,
          )
          delete _status.hun_zhuge_temp
          if (!bool) {
            return false
          }
        }
      },
    },
    trigger: { player: ["useCard1", "useCardToPlayered"] },
    filter(event, player, triggername) {
      if (event.card.name !== "sha") {
        return false
      }
      if (event.name === "useCard") {
        return (
          !event.audioed &&
          player.countUsed("sha", true) > 1 &&
          event.getParent().type === "phase"
        )
      }
      return game.dead.length && event.target.countCards("h")
    },
    async cost(event, trigger, player) {
      if (trigger.name === "useCard") {
        event.result = { bool: true }
      } else {
        event.result = await player
          .chooseTarget(
            `###${get.prompt(event.skill)}###令任意名死亡角色依次观看${get.translation(trigger.target)}的手牌并可以重铸其中一张牌`,
            [1, game.dead.length],
          )
          .set("filterTarget", (_, player, target) => target.isDead())
          .set("ai", (target) => get.attitude(get.player(), target) > 0)
          .set("deadTarget", true)
          .forResult()
      }
    },
    async content(event, trigger, player) {
      if (trigger.name === "useCard") {
        trigger.audioed = true
      } else {
        event.targets.sortBySeat(_status.currentPhase)
        for (const current of event.targets) {
          if (!current.isDead()) {
            continue
          }
          await current.viewHandcards(trigger.target)
          const cards = trigger.target.getCards("h", (card) =>
            lib.filter.cardRecastable(card, trigger.target, trigger.target),
          )
          if (!cards.length) {
            return
          }
          const result = await current
            .chooseCardButton(
              `请选择重铸${get.translation(trigger.target)}的一张牌`,
              cards,
            )
            .set("ai", ({ link }) => {
              const { player, target } = get.event()
              if (get.attitude(player, target) > 0) {
                return 20 - get.value(link)
              }
              return get.value(link)
            })
            .set("target", trigger.target)
            .set("forceDie", true)
            .forResult()
          if (result?.bool && result.links?.length) {
            await trigger.target.recast(result.links)
          }
        }
      }
    },
  },
  hun_bagua_skill: {
    equipSkill: true,
    audio: "bagua_skill",
    trigger: { player: ["chooseToRespondBegin", "chooseToUseBegin"] },
    filter(event, player) {
      if (event.responded) {
        return false
      }
      if (event.hun_bagua_skill) {
        return false
      }
      if (
        !event.filterCard?.(get.autoViewAs({ name: "shan" }, []), player, event)
      ) {
        return false
      }
      if (
        event.name === "chooseToRespond" &&
        !lib.filter.cardRespondable(
          get.autoViewAs({ name: "shan" }, []),
          player,
          event,
        )
      ) {
        return false
      }
      if (player.hasSkillTag("unequip2")) {
        return false
      }
      const evt = event.getParent()
      if (
        evt.player?.hasSkillTag("unequip", false, {
          name: evt.card ? evt.card.name : null,
          target: player,
          card: evt.card,
        })
      ) {
        return false
      }
      return true
    },
    check(event, player) {
      if (!event) {
        return true
      }
      if (event.ai) {
        const ai = event.ai
        const tmp = _status.event
        _status.event = event
        const result = ai({ name: "shan" }, _status.event.player, event)
        _status.event = tmp
        return result > 0
      }
      const type = event.name === "chooseToRespond" ? "respond" : "use"
      const evt = event.getParent()
      if (player.hasSkillTag("noShan", null, type)) {
        return false
      }
      if (
        !evt?.card ||
        !evt.player ||
        player.hasSkillTag("useShan", null, type)
      ) {
        return true
      }
      if (
        evt.card &&
        evt.player &&
        player.isLinked() &&
        game.hasNature(evt.card) &&
        get.attitude(player, evt.player._trueMe || evt.player) > 0
      ) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      trigger.hun_bagua_skill = true
      if (game.dead.length) {
        const { targets } = await player
          .chooseTarget(`###${get.prompt(event.name)}###令一名死亡角色卜算3`)
          .set("filterTarget", (_, player, target) => target.isDead())
          .set("ai", (target) => get.attitude(get.player(), target) > 0)
          .set("deadTarget", true)
          .forResult()
        if (targets?.length) {
          player.line(targets[0])
          game.log(player, "令", targets[0], "卜算3")
          await targets[0].chooseToGuanxing(3).set("forceDie", true)
        }
      }
      const result = await player
        .judge("hun_bagua", (card) => (get.color(card) === "red" ? 1.5 : -0.5))
        .set("judge2", (result) => result.bool)
        .forResult()
      if (result.bool > 0) {
        trigger.untrigger()
        trigger.set("responded", true)
        trigger.result = {
          bool: true,
          card: get.autoViewAs({ name: "shan", isCard: true }, []),
          cards: [],
        }
      }
    },
    ai: {
      respondShan: true,
      freeShan: true,
      skillTagFilter(player, tag, arg) {
        if (tag !== "respondShan" && tag !== "freeShan") {
          return
        }
        if (player.hasSkillTag("unequip2")) {
          return false
        }
        if (!arg?.player) {
          return true
        }
        if (
          arg.player.hasSkillTag("unequip", false, {
            target: player,
          })
        ) {
          return false
        }
        return true
      },
      effect: {
        target(card, player, target, effect) {
          if (target.hasSkillTag("unequip2")) {
            return
          }
          if (
            player.hasSkillTag("unequip", false, {
              name: card ? card.name : null,
              target: target,
              card: card,
            }) ||
            player.hasSkillTag("unequip_ai", false, {
              name: card ? card.name : null,
              target: target,
              card: card,
            })
          ) {
            return
          }
          if (get.tag(card, "respondShan")) {
            return 0.5
          }
        },
      },
    },
  },
  lingling_skill: {
    equipSkill: true,
    trigger: {
      player: "phaseZhunbeiBegin",
      global: "roundEnd",
    },
    getIndex(event, player) {
      if (event.name === "phaseZhunbei") {
        return 1
      }
      const es = player.getCards(
          "e",
          (card) => get.info(card)?.name === "lingling",
        ),
        js = player.getCards("j", (card) => {
          if (get.type(card) !== "delay") {
            false
          }
          const vcard = card[card.cardSymbol]
          if (!vcard?.storage?.equipEnable) {
            return false
          }
          return vcard.cards.some(
            (cardx) => get.info(cardx)?.name === "lingling",
          )
        })
      return es.concat(js)
    },
    filter(event, player, triggername, card) {
      if (event.name === "phaseZhunbei") {
        return true
      }
      if (!game.dead.length) {
        return false
      }
      return !event.next[event.next.length - 1]?.lingling?.includes(card)
    },
    forced: true,
    async content(event, trigger, player) {
      if (trigger.name === "phaseZhunbei") {
        const { targets } = await player
          .chooseTarget(`軨軨：选择对一名角色造成1点雷电伤害`, true)
          .set("ai", (target) =>
            get.damageEffect(target, get.player(), get.player(), "thunder"),
          )
          .forResult()
        if (targets?.length) {
          await targets[0].damage(player, "thunder")
        }
      } else {
        trigger.next[trigger.next.length - 1].lingling ??= []
        trigger.next[trigger.next.length - 1].lingling.add(event.indexedData)
        const targets = game.dead.slice()
        const map = await game
          .chooseAnyOL(targets, get.info(event.name).chooseControl, [
            player,
            event.indexedData,
          ])
          .forResult()
        for (const target of targets) {
          let source = game.findPlayer((current) =>
              current.hasCard((card) => card === event.indexedData, "ej"),
            ),
            aim
          const control = map.get(target).control
          if (control === "上家") {
            aim = source?.previous
          } else if (control === "下家") {
            aim = source?.next
          }
          if (!source || !aim) {
            return
          }
          await target
            .moveCard(true, source, aim, (card) => {
              const cardx = get.event().card
              if (get.itemtype(card) === "card") {
                return card === cardx
              }
              return card === cardx[cardx.cardSymbol]
            })
            .set("card", event.indexedData)
            .set("forceDie", true)
            .setContent(async (event, trigger, player) => {
              if (
                player.canMoveCard(
                  null,
                  event.nojudge,
                  event.sourceTargets,
                  event.aimTargets,
                  event.filter,
                  event.canReplace ? "canReplace" : "noReplace",
                )
              ) {
                const source = event.sourceTargets[0],
                  aim = event.aimTargets[0]
                let position = "j"
                event.result = {
                  bool: true,
                  links: [event.card],
                  card: event.card,
                }
                if (source.getCards("e").includes(event.card)) {
                  position = "e"
                  await aim.equip(event.card)
                } else {
                  await aim.addJudge(event.card, event.card?.cards)
                }
                if (event.card.cards?.length) {
                  source.$give(event.card.cards, aim, false)
                }
                game.log(source, "的", event.card, "被移动给了", aim)
                event.result.position = position
                await game.delay()
              }
            })
        }
      }
    },
    chooseControl(player, source, card, eventId) {
      return player
        .chooseControl(["上家", "下家"])
        .set("prompt", "軨軨：秘密选择上家或下家")
        .set(
          "prompt2",
          `令${get.translation(source)}的${get.translation(card)}移动至其上家或下家`,
        )
        .set("ai", () => {
          //哪管死后洪水滔天
          const controls = get.event().controls.slice()
          return get.event().getRand() < 0.5 ? controls[0] : controls[1]
        })
        .set("id", eventId)
        .set("_global_waiting", true)
    },
  },
  chixueqingfeng: {
    equipSkill: true,
    trigger: { player: "useCardToPlayered" },
    filter(event) {
      return event.card.name === "sha"
    },
    logTarget: "target",
    forced: true,
    content() {
      var target = trigger.target
      target.addTempSkill("chixueqingfeng2")
      target.markAuto("chixueqingfeng2", [trigger.card])
    },
    ai: {
      unequip_ai: true,
      directHit_ai: true,
      skillTagFilter(player, tag, arg) {
        if (arg?.card && arg.card.name === "sha") {
          return true
        }
        return false
      },
    },
  },
  chixueqingfeng2: {
    equipSkill: true,
    trigger: { global: "useCardAfter" },
    forced: true,
    charlotte: true,
    popup: false,
    firstDo: true,
    onremove: true,
    filter(event, player) {
      return player.storage.chixueqingfeng2?.includes(event.card)
    },
    content() {
      player.storage.chixueqingfeng2.remove(trigger.card)
      if (!player.storage.chixueqingfeng2.length) {
        player.removeSkill("chixueqingfeng2")
      }
    },
    mark: true,
    marktext: "※",
    intro: {
      content: "无视防具且不能使用或打出手牌",
    },
    mod: {
      cardEnabled2(card) {
        if (get.position(card) === "h") {
          return false
        }
      },
    },
    ai: {
      unequip2: true,
    },
  },
  // 神马超
  // 狩骊
  shouli: {
    audio: 2,
    mod: {
      cardUsable(card) {
        if (card.storage?.shouli) {
          return Infinity
        }
      },
    },
    enable: ["chooseToUse", "chooseToRespond"],
    hiddenCard(player, name) {
      if (
        player !== _status.currentPhase &&
        (name === "sha" || name === "shan")
      ) {
        return true
      }
    },
    filter(event, player) {
      if (event.responded || event.shouli || event.type === "wuxie") {
        return false
      }
      if (
        game.hasPlayer(
          (current) =>
            current.getCards("e", (card) => get.is.attackingMount(card))
              .length > 0,
        ) &&
        event.filterCard(
          get.autoViewAs(
            {
              name: "sha",
              storage: { shouli: true },
            },
            "unsure",
          ),
          player,
          event,
        )
      ) {
        return true
      }
      if (
        game.hasPlayer(
          (current) =>
            current.getCards("e", (card) => get.is.defendingMount(card))
              .length > 0,
        ) &&
        event.filterCard(
          get.autoViewAs(
            {
              name: "shan",
              storage: { shouli: true },
            },
            "unsure",
          ),
          player,
          event,
        )
      ) {
        return true
      }
      return false
    },
    delay: false,
    locked: false,
    filterTarget(card, player, target) {
      var event = _status.event,
        evt = event
      if (event._backup) {
        evt = event._backup
      }
      var equip3 = target.getCards("e", (card) =>
        get.is.defendingMount(card, false),
      )
      var equip4 = target.getCards("e", (card) =>
        get.is.attackingMount(card, false),
      )
      if (
        equip3.length &&
        equip3.some((card) =>
          evt.filterCard(
            get.autoViewAs(
              {
                name: "shan",
                storage: { shouli: true },
              },
              [card],
            ),
            player,
            event,
          ),
        )
      ) {
        return true
      }
      return equip4.some((card) => {
        var sha = get.autoViewAs(
          {
            name: "sha",
            storage: { shouli: true },
          },
          [card],
        )
        if (evt.filterCard(sha, player, event)) {
          if (!evt.filterTarget) {
            return true
          }
          return game.hasPlayer((current) =>
            evt.filterTarget(sha, player, current),
          )
        }
      })
    },
    prompt: "将场上的一张坐骑牌当做【杀】或【闪】使用或打出",
    async content(event, trigger, player) {
      /** @type {GameEvent} */
      // @ts-expect-error 类型必然存在
      const evt = event.getParent(2)
      evt.set("shouli", true)

      const equip3 = event.target.getCards("e", (card) =>
        get.is.defendingMount(card, false),
      )
      const equip4 = event.target.getCards("e", (card) =>
        get.is.attackingMount(card, false),
      )

      const cardsCanUse = []
      const backupx = _status.event
      _status.event = evt
      try {
        if (
          equip3.length &&
          equip3.some((card) => {
            var shan = get.autoViewAs(
              {
                name: "shan",
                storage: { shouli: true },
              },
              [card],
            )
            if (evt.filterCard(shan, player, event)) {
              return true
            }
            return false
          })
        ) {
          cardsCanUse.push("shan")
        }
        if (
          equip4.length &&
          equip4.some((card) => {
            var sha = get.autoViewAs(
              {
                name: "sha",
                storage: { shouli: true },
              },
              [card],
            )
            if (
              evt.filterCard(sha, player, evt) &&
              (!evt.filterTarget ||
                game.hasPlayer((current) => {
                  return evt.filterTarget(sha, player, current)
                }))
            ) {
              return true
            }
            return false
          })
        ) {
          cardsCanUse.push("sha")
        }
      } catch (e) {
        game.print(e)
      }
      _status.event = backupx

      let result
      if (cardsCanUse.length === 1) {
        event.cardName = cardsCanUse[0]
        const cards = cardsCanUse[0] === "shan" ? equip3 : equip4
        if (cards.length === 1) {
          result = {
            bool: true,
            links: [cards[0]],
          }
        } else {
          result = await player
            .choosePlayerCard(true, event.target, "e")
            .set("filterButton", (button) => {
              return _status.event.cards.includes(button.link)
            })
            .set("cards", cards)
            .forResult()
        }
      } else {
        result = await player
          .choosePlayerCard(true, event.target, "e")
          .set("filterButton", (button) => {
            const card = button.link
            return get.is.attackingMount(card) || get.is.defendingMount(card)
          })
          .forResult()
      }

      if (result.bool && result.links?.length) {
        const name =
          event.cardName ||
          (get.is.attackingMount(result.links[0]) ? "sha" : "shan")
        if (evt.name === "chooseToUse") {
          game.broadcastAll(
            (result, name) => {
              lib.skill.shouli_backup.viewAs = {
                name: name,
                cards: [result],
                storage: { shouli: true },
              }
              lib.skill.shouli_backup.prompt = `选择${get.translation(name)}（${get.translation(result)}）的目标`
            },
            result.links[0],
            name,
          )
          evt.set("_backupevent", "shouli_backup")
          evt.backup("shouli_backup")
          evt.set(
            "openskilldialog",
            `选择${get.translation(name)}（${get.translation(result.links[0])}）的目标`,
          )
          evt.set("norestore", true)
          evt.set("custom", {
            add: {},
            replace: { window() {} },
          })
        } else {
          delete evt.result.used
          delete evt.result.skill
          evt.result.card = get.autoViewAs(
            {
              name: name,
              cards: [result.links[0]],
              storage: { shouli: true },
            },
            result.links,
          )
          evt.result.cards = [result.links[0]]
          event.target.$give(result.links[0], player, false)
          if (player !== event.target) {
            event.target.addTempSkill("fengyin")
          }
          event.target.addTempSkill("shouli_thunder")
          player.addTempSkill("shouli_thunder")
          evt.redo()
          return
        }
      }
      evt.goto(0)
    },
    ai: {
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag) {
        var func =
          get.is[tag === "respondSha" ? "attackingMount" : "defendingMount"]
        return game.hasPlayer((current) =>
          current.hasCard((card) => func(card, false), "e"),
        )
      },
      order: 2,
      result: {
        player(player, target) {
          var att = Math.max(8, get.attitude(player, target))
          if (_status.event.type !== "phase") {
            return 9 - att
          }
          if (!player.hasValueTarget({ name: "sha" })) {
            return 0
          }
          return 9 - att
        },
      },
    },
    group: "shouli_init",
    subSkill: {
      thunder: {
        charlotte: true,
        trigger: { player: "damageBegin1" },
        forced: true,
        mark: true,
        async content(event, trigger, player) {
          trigger.num++
          game.setNature(trigger, "thunder")
        },
        marktext: "⚡",
        intro: { content: "受到的伤害+1且视为雷电伤害" },
        ai: {
          effect: {
            target: (card, player, target) => {
              if (!get.tag(card, "damage")) {
                return
              }
              if (
                target.hasSkillTag("nodamage", null, {
                  natures: ["thunder"],
                }) ||
                target.hasSkillTag("nothunder")
              ) {
                return "zeroplayertarget"
              }
              if (
                target.hasSkillTag("filterDamage", null, {
                  player: player,
                  card: new lib.element.VCard(
                    {
                      name: card.name,
                      nature: "thunder",
                    },
                    [card],
                  ),
                })
              ) {
                return
              }
              return 2
            },
          },
        },
      },
      init: {
        audio: "shouli",
        trigger: {
          global: "phaseBefore",
          player: "enterGame",
        },
        forced: true,
        locked: false,
        filter(event, player) {
          return event.name !== "phase" || game.phaseNumber === 0
        },
        logTarget: () => game.filterPlayer(),
        equips: [
          ["spade", 13, "dayuan"],
          ["heart", 5, "chitu"],
          ["diamond", 13, "zixing"],
          ["spade", 5, "jueying"],
          ["heart", 13, "zhuahuang"],
          ["club", 5, "dilu"],
          ["diamond", 13, "hualiu"],
        ],
        async content(event, trigger, player) {
          // @ts-expect-error player.getNext()
          const targets = game.filterPlayer().sortBySeat(player.getNext())
          event.targets = targets

          for (const target of targets) {
            if (target.isIn()) {
              let cardx = lib.skill.shouli_init.equips.randomRemove()
              if (!cardx) {
                return
              }
              cardx = {
                suit: cardx[0],
                number: cardx[1],
                name: cardx[2],
              }
              const card = game.createCard(cardx)
              if (!_status.shouli_equips) {
                _status.shouli_equips = []
              }
              _status.shouli_equips.push(card.cardid)
              if (card) {
                await target.chooseUseTarget(card, "nopopup", "noanimate", true)
                player.addSkill("shouli_remove")
              }
            }
          }
        },
      },
      remove: {
        trigger: {
          global: [
            "loseAfter",
            "loseAsyncAfter",
            "cardsDiscardAfter",
            "equipAfter",
          ],
        },
        forced: true,
        charlotte: true,
        popup: false,
        firstDo: true,
        forceDie: true,
        filter(event, player) {
          if (!_status.shouli_equips?.length) {
            return false
          }
          var cards = event.getd()
          return cards.filter((i) => _status.shouli_equips.includes(i.cardid))
            .length
        },
        content() {
          var cards = trigger.getd(),
            remove = []
          for (var card of cards) {
            if (_status.shouli_equips.includes(card.cardid)) {
              _status.shouli_equips.remove(card.cardid)
              remove.push(card)
            }
          }
          if (remove.length) {
            game.cardsGotoSpecial(remove)
            lib.skill.shouli_init.equips.addArray(
              remove.map((i) => [i.suit, i.number, i.name]),
            )
            game.log("坐骑牌", remove, "被移出了游戏")
          }
        },
      },
      backup: {
        async precontent(event, trigger, player) {
          const cards = event.result.card?.cards
          event.result.cards = cards
          event.result._apply_args = { addSkillCount: false }
          const owner = get.owner(cards[0])
          event.target = owner
          owner.$give(cards[0], player, false)
          player.popup(event.result.card.name, "metal")
          await game.delayx()
          event.getParent().addCount = false
          if (player !== event.target) {
            event.target.addTempSkill("fengyin")
          }
          event.target.addTempSkill("shouli_thunder")
          player.addTempSkill("shouli_thunder")
        },
        filterCard: () => false,
        prompt: "请选择【杀】的目标",
        selectCard: -1,
        log: false,
      },
    },
  },
  // 横骛
  hengwu: {
    audio: 2,
    trigger: { player: ["useCard", "respond"] },
    filter(event, player) {
      var suit = get.suit(event.card)
      if (
        !lib.suit.includes(suit) ||
        player.hasCard((card) => get.suit(card, player) === suit, "h")
      ) {
        return false
      }
      return game.hasPlayer((current) =>
        current.hasCard((card) => get.suit(card, current) === suit, "e"),
      )
    },
    async content(event, trigger, player) {
      await player.showHandcards()
      const suit = get.suit(trigger.card)

      const num = game.countPlayer((current) => {
        return current.countCards(
          "e",
          (card) => get.suit(card, current) === suit,
        )
      })
      await player.draw(num)
    },
    ai: {
      effect: {
        player_use(card, player, target) {
          if (typeof card !== "object") {
            return
          }
          const suit = get.suit(card)
          if (
            !lib.suit.includes(suit) ||
            player.hasCard((i) => get.suit(i, player) === suit, "h")
          ) {
            return
          }
          return [
            1,
            0.8 *
              game.countPlayer((current) => {
                return current.countCards("e", (card) => {
                  return get.suit(card, current) === suit
                })
              }),
          ]
        },
        target: (card, player, target) => {
          if (
            card.name === "sha" &&
            !player.hasSkillTag(
              "directHit_ai",
              true,
              {
                target: target,
                card: card,
              },
              true,
            ) &&
            game.hasPlayer((current) => {
              return current.hasCard((cardx) => {
                return get.subtype(cardx) === "equip3"
              }, "e")
            })
          ) {
            return [0, -0.5]
          }
        },
      },
    },
  },
  // 神马超
  // 狩骊
  mark_shouli: {
    audio: 2,
    addMark(player, name) {
      const next = game.createEvent("gainShouli", false)
      next.player = player
      next.num = 1
      next.mark = name
      next.setContent("emptyEvent")
      if (player.countMark(name)) {
        next.hasMark = true
      }
      player.addMark(name, 1)
      return next
    },
    changeMark(player, target, name) {
      const num = player.countMark(name)
      const next = game.createEvent("gainShouli", false)
      next.player = target
      next.num = num
      next.mark = name
      next.setContent("emptyEvent")
      if (target.countMark(name)) {
        next.hasMark = true
      }
      player.removeMark(name, num, false)
      target.addMark(name, num, false)
      game.log(
        player,
        "的",
        `#g“${get.translation(name)}”`,
        "被移动给了",
        target,
      )
      return next
    },
    enable: ["chooseToUse", "chooseToRespond"],
    hiddenCard(player, name) {
      if (name !== "sha" && name !== "shan") {
        return false
      }
      return (
        !player.getStorage("mark_shouli_used").includes(name) &&
        game.hasPlayer((current) => {
          return (
            current !== player &&
            current.hasMark(`mark_shouli_${name === "sha" ? "jun" : "li"}`)
          )
        })
      )
    },
    filter(event, player) {
      if (event.responded || event.mark_shouli || event.type === "wuxie") {
        return false
      }
      return ["sha", "shan"].some((name) => {
        if (
          !game.hasPlayer((current) => {
            return (
              current !== player &&
              current.hasMark(`mark_shouli_${name === "sha" ? "jun" : "li"}`)
            )
          })
        ) {
          return false
        }
        if (player.getStorage("mark_shouli_used").includes(name)) {
          return false
        }
        return event.filterCard(
          get.autoViewAs(
            { name: name, storage: { mark_shouli: true }, isCard: true },
            "unsure",
          ),
          player,
          event,
        )
      })
    },
    filterTarget(card, player, target) {
      if (ui.selected.targets?.length) {
        const owner = ui.selected.targets[0]
        return target === owner.getNext() || target === owner.getPrevious()
      }
      if (target === player) {
        return false
      }
      let event = _status.event,
        evt = event
      if (event._backup) {
        evt = event._backup
      }
      return ["sha", "shan"].some((name) => {
        const card = get.autoViewAs(
            { name: name, storage: { mark_shouli: true }, isCard: true },
            "unsure",
          ),
          mark = `mark_shouli_${name === "sha" ? "jun" : "li"}`
        if (
          !target.hasMark(mark) ||
          player.getStorage("mark_shouli_used").includes(name)
        ) {
          return false
        }
        if (!evt.filterCard(card, player, event)) {
          return false
        }
        if (name === "sha") {
          return (
            !evt.filterTarget ||
            game.hasPlayer((current) => evt.filterTarget(card, player, current))
          )
        }
        return true
      })
    },
    selectTarget: 2,
    complexTarget: true,
    multitarget: true,
    delay: false,
    locked: false,
    prompt:
      "移动一名其他角色的所有“骏”/“骊”至其上家或下家，并视为使用或打出一张【杀】/【闪】",
    async content(event, trigger, player) {
      const evt = event.getParent(2)
      evt.set("mark_shouli", true)
      const list = []
      const backupx = _status.event
      _status.event = evt
      ;["sha", "shan"].forEach((name) => {
        const card = get.autoViewAs(
            { name: name, storage: { mark_shouli: true }, isCard: true },
            "unsure",
          ),
          mark = `mark_shouli_${name === "sha" ? "jun" : "li"}`
        if (
          !event.targets[0].hasMark(mark) ||
          player.getStorage("mark_shouli_used").includes(name)
        ) {
          return false
        }
        if (name === "sha") {
          if (!evt.filterCard(card, player, evt)) {
            return false
          }
          if (
            evt.filterTarget &&
            !game.hasPlayer((current) =>
              evt.filterTarget(card, player, current),
            )
          ) {
            return false
          }
        } else if (!evt.filterCard(card, player, event)) {
          return false
        }
        list.push(["", "", name])
      })
      _status.event = backupx
      const result =
        list.length > 1
          ? await player
              .chooseButton(
                ["狩骊：选择你要视为使用或打出的牌", [list, "vcard"]],
                true,
              )
              .set("ai", (button) => {
                return Math.random()
              })
              .forResult()
          : {
              bool: true,
              links: list,
            }
      if (!result?.bool) {
        return
      }
      const name = result.links[0][2],
        mark = `mark_shouli_${name === "sha" ? "jun" : "li"}`
      get.info(event.name).changeMark(...event.targets, mark)
      player.addTempSkill("mark_shouli_used")
      player.markAuto("mark_shouli_used", name)
      if (evt.name === "chooseToUse") {
        game.broadcastAll((name) => {
          lib.skill.mark_shouli_backup.viewAs = {
            name: name,
            storage: { mark_shouli: true },
            isCard: true,
          }
          lib.skill.mark_shouli_backup.prompt = `选择${get.translation(name)}的目标`
        }, name)
        evt.set("_backupevent", "mark_shouli_backup")
        evt.backup("mark_shouli_backup")
        evt.set("openskilldialog", `选择${get.translation(name)}的目标`)
        evt.set("norestore", true)
        evt.set("custom", {
          add: {},
          replace: { window() {} },
        })
      } else {
        delete evt.result.used
        delete evt.result.skill
        evt.result.card = get.autoViewAs({
          name: name,
          storage: { mark_shouli: true },
          isCard: true,
        })
        evt.result.cards = []
        evt.redo()
        return
      }
      evt.goto(0)
    },
    mod: {
      targetInRange(card, player) {
        if (card?.storage?.mark_shouli) {
          return true
        }
      },
      cardUsable(card, player) {
        if (card?.storage?.mark_shouli) {
          return Infinity
        }
      },
    },
    ai: {
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag) {
        return get
          .info("mark_shouli")
          .hiddenCard(player, tag === "respondSha" ? "sha" : "shan")
      },
      order: 2,
      result: {
        player(player, target) {
          var att = Math.max(8, get.attitude(player, target))
          if (ui.selected.targets?.length) {
            return 10 + att
          }
          if (_status.event.type !== "phase") {
            return 9 - att
          }
          if (!player.hasValueTarget({ name: "sha" }, false)) {
            return 0
          }
          return 9 - att
        },
      },
    },
    group: "mark_shouli_init",
    global: ["mark_shouli_effect", "mark_shouli_noequip"],
    subSkill: {
      effect: {
        trigger: {
          player: [
            "phaseDrawBegin2",
            "useCardToPlayer",
            "damageBegin3",
            "damageBegin4",
          ],
          source: "damageBegin1",
        },
        filter(event, player, name) {
          const target = name === "damageBegin1" ? event.source : event.player
          if (
            !target?.isIn() ||
            !game.hasPlayer((current) => current.hasSkill("mark_shouli"))
          ) {
            return false
          }
          const jun = target.countMark("mark_shouli_jun"),
            li = target.countMark("mark_shouli_li")
          if (name === "damageBegin4") {
            if (jun + li <= 0) {
              return false
            }
            if (event.hasNature()) {
              return true
            }
            return (
              event.card?.name &&
              ["wanjian", "nanman"].includes(event.card.name)
            )
          }
          if (name === "useCardToPlayer") {
            return event.card?.name === "sha" && jun > 2
          }
          if (event.name === "damage") {
            return li > 2
          }
          return (jun > 1 || li > 1) && !event.numFixed
        },
        async cost(event, trigger, player) {
          event.result = {
            bool: true,
            skill_popup: false,
          }
        },
        async content(event, trigger, player) {
          const name = event.triggername,
            target = trigger[name === "damageBegin1" ? "source" : "player"],
            jun = target.countMark("mark_shouli_jun"),
            li = target.countMark("mark_shouli_li"),
            num = game.countPlayer((current) => current.hasSkill("mark_shouli"))
          switch (name) {
            case "phaseDrawBegin2": {
              if (jun > 1) {
                trigger.num += num
              }
              if (li > 1) {
                trigger.num += num
              }
              break
            }
            case "useCardToPlayer": {
              trigger.target.addTempSkill("fengyin")
              break
            }
            case "damageBegin1": {
              if (li > 2) {
                game.setNature(trigger, "thunder")
              }
              if (li > 3) {
                trigger.num += num
              }
              break
            }
            case "damageBegin3": {
              if (li > 2) {
                game.setNature(trigger, "thunder")
              }
              if (li > 3) {
                trigger.num += num
              }
              break
            }
            default: {
              if (
                jun > 0 &&
                target.getPrevious()?.isIn() &&
                target.getPrevious() !== target
              ) {
                get
                  .info("mark_shouli")
                  .changeMark(target, target.getPrevious(), "mark_shouli_jun")
              }
              if (
                li > 0 &&
                target.getNext()?.isIn() &&
                target.getNext() !== target
              ) {
                get
                  .info("mark_shouli")
                  .changeMark(target, target.getNext(), "mark_shouli_li")
              }
              break
            }
          }
        },
        locked: false,
        mod: {
          globalFrom(from, to, distance) {
            if (!from.countMark("mark_shouli_jun")) {
              return
            }
            const num = game.countPlayer((current) =>
              current.hasSkill("mark_shouli"),
            )
            return distance - num
          },
          globalTo(from, to, distance) {
            if (!to.countMark("mark_shouli_li")) {
              return
            }
            const num = game.countPlayer((current) =>
              current.hasSkill("mark_shouli"),
            )
            return distance + num
          },
        },
      },
      noequip: {
        trigger: {
          player: "equipBefore",
        },
        filter(event, player) {
          return (
            (get.is.attackingMount(event.card) &&
              player.countMark("mark_shouli_jun")) ||
            (get.is.defendingMount(event.card) &&
              player.countMark("mark_shouli_li"))
          )
        },
        forced: true,
        async content(event, trigger, player) {
          trigger.cancel()
          if (trigger.cards?.length) {
            const map = new Map(),
              targets = []
            for (const card of trigger.cards) {
              const owner = get.owner(card)
              if (owner) {
                targets.add(owner)
                map.set(owner, (map.get(owner) ?? []).concat([card]))
              }
            }
            if (targets.length) {
              await game
                .loseAsync({
                  map: map,
                  targets: targets,
                  cards: trigger.cards,
                })
                .setContent(async (event, trigger, player) => {
                  const { map, targets, cards } = event
                  for (const target of targets) {
                    const lose = map.get(target)
                    const next = target.lose(lose, ui.discardPile)
                    next.getlx = false
                    await next
                  }
                  game.log(cards, "进入了弃牌堆")
                })
            }
          }
        },
        mod: {
          targetEnabled(card, player, target) {
            if (
              (get.is.attackingMount(card) &&
                target.countMark("mark_shouli_jun")) ||
              (get.is.defendingMount(card) &&
                target.countMark("mark_shouli_li"))
            ) {
              return false
            }
          },
        },
      },
      used: {
        charlotte: true,
        onremove: true,
      },
      backup: {
        async precontent(event, trigger, player) {
          event.result._apply_args = { addSkillCount: false }
          player.popup(event.result.card.name, "metal")
          await game.delayx()
          event.getParent().addCount = false
        },
        filterCard: () => false,
        prompt: "请选择【杀】的目标",
        selectCard: -1,
        log: false,
      },
      init: {
        audio: "mark_shouli",
        trigger: {
          player: "enterGame",
          global: "phaseBefore",
        },
        filter(event, player) {
          if (!game.hasPlayer((current) => current !== player)) {
            return false
          }
          return event.name !== "phase" || game.phaseNumber === 0
        },
        async cost(event, trigger, player) {
          event.result = {
            bool: true,
            targets: game.filterPlayer((current) => current !== player),
          }
        },
        async content(event, trigger, player) {
          const marks = []
          for (let i = 0; i < 4; i++) {
            marks.push("mark_shouli_li")
            if (i < 3) {
              marks.push("mark_shouli_jun")
            }
          }
          for (const target of event.targets) {
            if (!marks.length) {
              break
            }
            const mark = marks.randomRemove()
            await get.info("mark_shouli").addMark(target, mark)
          }
        },
      },
      jun: {
        markimage2: "image/card/chitu.png",
        nopop: true,
        intro: {
          name: "骏",
          content(storage, player) {
            const list = [
              "⚡你与其他角色的距离-1",
              "⚡摸牌阶段，你多摸一张牌",
              "⚡当你使用【杀】指定目标后，该角色本回合非锁定技失效",
            ]
            const str =
              "⚡当你受到属性伤害或【南蛮入侵】、【万箭齐发】造成的伤害时，你的所有“骏”移动至你上家<br>⚡有“骏”的角色装备区里不能置入进攻坐骑牌"
            if (typeof storage !== "number" || storage <= 0) {
              return str
            }
            return `${list.slice(0, storage).join("<br>")}<br>${str}`
          },
        },
      },
      li: {
        markimage2: "image/card/dilu.png",
        nopop: true,
        intro: {
          name: "骊",
          content(storage, player) {
            const list = [
              "⚡其他角色与你的距离+1",
              "⚡摸牌阶段，你多摸一张牌",
              "⚡你造成或受到的伤害均视为雷电伤害",
              "⚡你造成或受到的伤害+1",
            ]
            const str =
              "⚡当你受到属性伤害或【南蛮入侵】、【万箭齐发】造成的伤害时，你的所有“骊”移动至你下家<br>⚡有“骊”的角色装备区里不能置入防御坐骑牌"
            if (typeof storage !== "number" || storage <= 0) {
              return str
            }
            return `${list.slice(0, storage).join("<br>")}<br>${str}`
          },
        },
      },
    },
  },
  // 横骛
  mark_hengwu: {
    audio: 2,
    trigger: {
      global: "gainShouli",
    },
    filter(event, player) {
      const mark = event.mark
      return event.hasMark && event.player.countMark(mark)
    },
    forced: true,
    logTarget: "player",
    async content(event, trigger, player) {
      await player.draw(trigger.player.countMark(trigger.mark))
    },
    ai: {
      combo: "mark_shouli",
    },
  },
  // 魔貂蝉
  // 幻惑
  huanhuo: {
    audio: 2,
    trigger: { global: "roundStart" },
    forced: true,
    locked: false,
    async content(event, trigger, player) {
      await player.draw(2)
      const num = Math.min(
        2,
        game.countPlayer((target) => target !== player),
      )
      if (!num) {
        return
      }
      const result = await player
        .chooseCardTarget({
          prompt: get.prompt(event.name),
          prompt2: `弃置至多两张牌并选择等量的其他角色。其下回合出牌阶段强制选中一张可以使用的手牌，且使用一张牌后随机弃置一张牌，直到其使用了两张牌后`,
          filterCard: lib.filter.cardDiscardable,
          selectCard: [1, num],
          filterTarget: lib.filter.notMe,
          selectTarget: [1, num],
          complexCard: true,
          position: "he",
          filterOk() {
            if (!ui.selected.cards.length) {
              return false
            }
            return ui.selected.cards.length === ui.selected.targets.length
          },
          ai1(card) {
            return get.event().resultAI.cards.includes(card)
          },
          ai2(target) {
            return get.event().resultAI.targets.includes(target)
          },
        })
        .set(
          "resultAI",
          (() => {
            let cards = player
                .getDiscardableCards(
                  player,
                  "he",
                  (card) => get.value(card) < 7.5,
                )
                .sort((a, b) => get.value(a) - get.value(b)),
              targets = game
                .filterPlayer(
                  (current) =>
                    current !== player &&
                    -get.attitude(player, current) * current.countCards("hs") >
                      0,
                )
                .sort((a, b) => {
                  const num1 =
                      -get.attitude(get.player(), a) * a.countCards("hs"),
                    num2 = -get.attitude(get.player(), b) * b.countCards("hs")
                  return num2 - num1
                })
            const num2 = Math.min(cards.length, targets.length, num)
            cards = cards.slice(0, num2)
            targets = targets.slice(0, num2)
            return { cards, targets }
          })(),
        )
        .forResult()
      if (result?.cards?.length && result.targets?.length) {
        const { cards, targets } = result
        await player.discard(cards)
        player.line(targets)
        targets.forEach((target) => target.addSkill(`${event.name}_mark`))
      }
    },
    subSkill: {
      backup: {
        filterCard(card, player, event) {
          return (
            get.itemtype(card) === "card" && card === get.event().huanhuo_debuff
          )
        },
        viewAs(cards, player) {
          if (cards.length) {
            const card = get.event().huanhuo_debuff
            return {
              name: get.name(card, player),
              nature: get.nature(card, player),
              cards: [card],
              isCard: true,
            }
          }
          return null
        },
        popname: true,
        log: false,
      },
      mark: {
        charlotte: true,
        mark: true,
        intro: {
          content:
            "下回合出牌阶段强制选中一张可以使用的手牌，且使用一张牌后随机弃置一张牌，直到使用了两张牌后",
        },
        trigger: { player: "phaseBegin" },
        firstDo: true,
        silent: true,
        async content(event, trigger, player) {
          player.removeSkill(event.name)
          player.addTempSkill("huanhuo_limit")
        },
      },
      limit: {
        charlotte: true,
        trigger: { player: "phaseUseBegin" },
        silent: true,
        async content(event, trigger, player) {
          player.addTempSkill("huanhuo_debuff", "phaseUseAfter")
          player.addMark("huanhuo_debuff", 2, false)
        },
      },
      debuff: {
        charlotte: true,
        onremove: true,
        intro: { content: "当前“幻惑”剩余次数：#" },
        trigger: { player: ["chooseToUseBegin", "useCardAfter"] },
        filter(event, player) {
          if (event.name === "chooseToUse") {
            return event.type === "phase"
          }
          return event.isPhaseUsing(player)
        },
        forced: true,
        popup: false,
        firstDo: true,
        async content(event, trigger, player) {
          if (trigger.name === "useCard") {
            player.removeMark(event.name, 1, false)
            const hs = player.getDiscardableCards(player, "h"),
              es = player.getDiscardableCards(player, "e")
            const card = hs.length ? hs.randomGet() : es?.randomGet()
            if (card) {
              await player.discard(card)
            }
            if (!player.hasMark(event.name)) {
              player.removeSkill(event.name)
            }
          } else {
            game.broadcastAll(() => (_status._huanhuo_debuff_check = true))
            const cards = player.getCards("h", (card) =>
              player.hasUseTarget(card, null, trigger),
            )
            game.broadcastAll(() => delete _status._huanhuo_debuff_check)
            if (!cards.length) {
              return
            }
            const card = cards.randomGet()
            trigger.set(event.name, card)
            const name = "huanhuo_backup"
            trigger.set(
              "openskilldialog",
              `受【${get.translation(event.name)}】影响，须使用${get.translation(card)}`,
            )
            trigger.set("norestore", true)
            trigger.set("_backupevent", name)
            trigger.set("custom", {
              add: {},
              replace: { window() {} },
            })
            trigger.backup(name)
          }
        },
      },
    },
  },
  // 倾世
  olqingshi: {
    audio: 2,
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      return (
        !player.hasSkill("rumo") ||
        !game.hasPlayer((target) =>
          target.countCards("h", (card) => card.hasGaintag("olqingshi_tag")),
        )
      )
    },
    async cost(event, trigger, player) {
      let result
      if (!player.hasSkill("rumo")) {
        result = await player
          .chooseBool(get.prompt2(event.skill))
          .set("choice", true)
          .forResult()
      } else {
        result = { bool: true }
      }
      if (result.bool) {
        event.result = {
          bool: true,
          targets: game.filterPlayer().sortBySeat(),
        }
      }
    },
    async content(event, trigger, player) {
      if (!player.hasSkill("rumo")) {
        const name = `${event.name}_animate`
        player.trySkillAnimate(name, name, player.checkShow(name))
        player.addSkill("rumo")
      }
      const { targets } = event
      const effect = async (target) => {
        const card = get.cardPile((card) => {
          const info = get.info(card)
          return (
            get.is.damageCard(card) &&
            info.selectTarget &&
            get.select(info.selectTarget).every((num) => num === 1)
          )
        })
        if (card) {
          const next = target.gain(card, "draw")
          next.gaintag.add("olqingshi_tag")
          await next
        } else {
          target.chat("无牌可拿")
        }
      }
      await game.doAsyncInOrder(targets, effect)
    },
    group: ["olqingshi_effect"],
    subSkill: {
      tag: {},
      animate: {
        skillAnimation: true,
        animationColor: "metal",
      },
      effect: {
        audio: "olqingshi",
        trigger: {
          global: [
            "damageSource",
            "loseAfter",
            "cardsDiscardAfter",
            "loseAsyncAfter",
            "useCardToPlayer",
          ],
        },
        filter(event, player, name) {
          const tag = "olqingshi_tag"
          if (name === "useCardToPlayer") {
            const evtx = event.getParent()
            return (
              event.targets.length === 1 &&
              event.player !== player &&
              event.isFirstTarget &&
              game.hasPlayer2((target) => {
                return target.hasHistory("lose", (evt) => {
                  if ((evt.relatedEvent || evt.getParent()) !== evtx) {
                    return false
                  }
                  return Object.values(evt.gaintag_map || {})
                    .flat()
                    .includes(tag)
                })
              })
            )
          }
          if (event.name === "damage") {
            return (
              event.card &&
              event.cards &&
              game.hasPlayer2((target) => {
                return target.hasHistory("lose", (evt) => {
                  if (
                    evt.getParent().card !== event.card ||
                    evt.relatedEvent?.card === event.card
                  ) {
                    return false
                  }
                  return Object.values(evt.gaintag_map || {})
                    .flat()
                    .includes(tag)
                })
              })
            )
          }
          if (event.name.indexOf("lose") === 0) {
            if (event.getlx === false || event.position !== ui.discardPile) {
              return false
            }
          } else {
            var evt = event.getParent()
            if (evt.relatedEvent?.name === "useCard") {
              return false
            }
          }
          return lib.skill.olqingshi_effect.getCards(event, tag).length
        },
        getCards(event, tag) {
          const cards = []
          const targets = game.filterPlayer2()
          for (const target of targets) {
            if (event.name.startsWith("lose")) {
              const evt = event.getl(target)
              cards.addArray(
                evt.cards2.filter(
                  (card) =>
                    evt.gaintag_map?.[card.cardid]?.includes(tag) &&
                    get.position(card) === "d",
                ),
              )
            } else {
              game.checkGlobalHistory("cardMove", (evt) => {
                if (evt.name !== "cardsDiscard" || evt !== event) {
                  return false
                }
                const evtx = evt.getParent()
                if (evtx.name !== "orderingDiscard") {
                  return false
                }
                const evt2 = evtx.relatedEvent || evtx.getParent()
                target.checkHistory("lose", (evt3) => {
                  const evt4 = evt3.relatedEvent || evt3.getParent()
                  if (evt2 !== evt4) {
                    return false
                  }
                  cards.addArray(
                    evt3
                      .getl(target)
                      .cards2.filter(
                        (card) =>
                          evt3.gaintag_map?.[card.cardid]?.includes(tag) &&
                          get.position(card) === "d",
                      ),
                  )
                })
              })
            }
          }
          return cards
        },
        async cost(event, trigger, player) {
          const name = event.triggername
          if (name === "useCardToPlayer") {
            const targets = game.filterPlayer((target) =>
              lib.filter.targetEnabled2(trigger.card, trigger.player, target),
            )
            const next = player.chooseCardTarget({
              prompt: `###${get.prompt(event.skill, trigger.player)}###弃置一张牌，重新指定${get.translation(trigger.card)}的目标（无距离限制）`,
              filterCard: lib.filter.cardDiscardable,
              position: "he",
              filterTarget(card, player, target) {
                return get.event().targets.includes(target)
              },
              ai1(card) {
                if (get.event().goon) {
                  return 7 - get.value(card)
                }
                return 0
              },
              ai2(target) {
                return get.effect(
                  target,
                  get.event().getTrigger().card,
                  get.event().getTrigger().player,
                  get.player(),
                )
              },
              targets: targets,
              goon:
                Math.max(
                  ...targets
                    .filter((target) => target !== trigger.target)
                    .map((target) =>
                      get.effect(target, trigger.card, trigger.player, player),
                    ),
                ) >
                get.effect(
                  trigger.target,
                  trigger.card,
                  trigger.player,
                  player,
                ),
            })
            next.targetprompt2.add((target) => {
              if (
                !target.isIn() ||
                target !== get.event().getTrigger().target
              ) {
                return false
              }
              return "原目标"
            })
            event.result = await next.forResult()
          } else {
            event.result = {
              bool: true,
            }
          }
        },
        async content(event, trigger, player) {
          const name = event.triggername
          if (name === "useCardToPlayer") {
            const { cards, targets } = event
            await player.discard(cards)
            const evt = trigger.getParent()
            player.line(targets)
            evt.targets.length = 0
            evt.targets.addArray(targets)
            game.log(targets, "成为了", trigger.card, "的新目标")
          } else if (trigger.name === "damage") {
            await player.draw()
          } else {
            const cards = lib.skill[event.name].getCards(
              trigger,
              "olqingshi_tag",
            )
            await player.gain(cards, "gain2")
          }
        },
      },
    },
  },
  rumo: {
    charlotte: true,
    trigger: { global: "roundEnd" },
    filter(event, player) {
      return !player.getRoundHistory("sourceDamage", (evt) => evt.num > 0)
        .length
    },
    forced: true,
    popup: false,
    content() {
      player.loseHp()
    },
    nopop: true,
    mark: true,
    marktext: "魔",
    intro: { content: "你已入魔" },
  },
}

export default skills
