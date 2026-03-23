import { _status, game, get, lib, ui } from "noname"

/** @type { importCharacterConfig['skill'] } */
const skills = {
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
    async content(event, _trigger, player) {
      let result = await player
        .chooseTarget(
          get.prompt2("meihun"),
          (_card, player, target) =>
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
            "h",
            `交给${get.translation(player)}一张${get.translation(suit)}花色的手牌`,
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
  //Connect Mode support after Angel Beats! -2nd beat-
  huoxin: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(_event, player) {
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
    async content(event, _trigger, player) {
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
        target(_player, target) {
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
    async content(_event, trigger, player) {
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
    async content(_event, _trigger, player) {
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
  //神典韦
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
    async content(_event, _trigger, player) {
      await player.disableEquip(2)
      await player.expandEquip(1)
    },
  },
  qiexie: {
    audio: 2,
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    filter(_event, player) {
      return player.countEmptySlot(1) > 0
    },
    async content(_event, _trigger, player) {
      if (!_status.characterlist) {
        game.initCharacterList()
      }
      _status.characterlist.randomSort()

      const list = []
      outer: for (const name of _status.characterlist) {
        const info = lib.character[name]

        for (const skill of info[3]) {
          const info = get.skillInfoTranslation(skill)
          if (!info.includes("【杀】")) {
            continue outer
          }

          const list = get.skillCategoriesOf(skill, player)
          list.remove("锁定技")
          if (list.length === 0) {
            break
          }
          continue outer
        }

        list.push(name)
        if (list.length >= 5) {
          break
        }
      }
      if (!list.length) {
        return
      }

      const num = player.countEmptySlot(1)
      const vcards = [list, createCard]
      const title = `挈挟：选择${num > 1 ? "至多" : ""}${get.cnNumber(num)}张武将置入武器栏`

      const page = [title, vcards]
      const next = player.chooseButton(page, [1, num], true, "allowChooseAll")
      next.set("ai", processAI)

      const result = await next.forResult()
      if (result.bool) {
        const list = result.links
        game.addVideo("skill", player, ["qiexie", [list]])
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
        // player.equip(cards);
        for (const card of cards) {
          player.equip(card)
        }
      }

      return

      function createCard(item, type, position, noclick, node) {
        return lib.skill.qiexie.$createButton(
          item,
          type,
          position,
          noclick,
          node,
        )
      }

      function processAI(button) {
        const name = button.link
        const info = lib.character[name]
        const skills = info[3].filter((skill) => {
          const info = get.skillInfoTranslation(skill)
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
      }
    },
    $createButton(item, _type, position, noclick, node) {
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
      node._customintro = (uiintro, _evt) => {
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
                '<div><div class="skilln">' +
                  get.translation(skills[i]) +
                  "</div><div>" +
                  get.skillInfoTranslation(skills[i], null, false) +
                  "</div></div>",
              )
            } else {
              uiintro.add(
                '<div><div class="skill">【' +
                  translation +
                  "】</div><div>" +
                  get.skillInfoTranslation(skills[i], null, false) +
                  "</div></div>",
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
    video(_player, info) {
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
          card.ai.equipValue = (_card, player) => {
            let val = maxHp
            if (player.hasSkill("qiexie")) {
              val *= 0.4
            } else {
              val *= 0.6
            }
            return (val += skills.length)
          }
        }
        str += "此牌离开你的装备区后，改为置入剩余武将牌牌堆。"
        lib.translate[`qiexie_${name}_info`] = str
        var append = ""
        if (skills.length) {
          for (var skill of skills) {
            if (lib.skill[skill].nobracket) {
              append +=
                '<div class="skilln">' +
                get.translation(skill) +
                '</div><div><span style="font-family: yuanli">' +
                get.skillInfoTranslation(skill) +
                "</span></div><br><br>"
            } else {
              var translation =
                lib.translate[`${skill}_ab`] ||
                get.translation(skill).slice(0, 2)
              append +=
                '<div class="skill">【' +
                translation +
                '】</div><div><span style="font-family: yuanli">' +
                get.skillInfoTranslation(skill) +
                "</span></div><br><br>"
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
        filter(event, _player) {
          return event.cards.some((card) => card.name.indexOf("qiexie_") === 0)
        },
        async content(_event, trigger, player) {
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
  cuijue: {
    audio: 2,
    enable: "phaseUse",
    filter(_event, player) {
      return player.countCards("he") > 0 //&&game.hasPlayer(target=>lib.skill.cuijue.filterTarget('SB',player,target));
    },
    filterCard: true,
    filterTarget(_card, player, target) {
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
    async content(event, _trigger, player) {
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
  //神贾诩
  zclianpo: {
    init: () => {
      game.addGlobalSkill("zclianpo_global")
    },
    onremove: () => {
      if (
        !game.hasPlayer((i) => i.hasSkill("zclianpo", null, null, false), true)
      ) {
        game.removeGlobalSkill("zclianpo_global")
      }
    },
    trigger: { global: "dieAfter" },
    filter(event, _player) {
      if (lib.skill.zclianpo.getMax(event.player).length <= 1) {
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
          num += current.countMark("zclianpo_mark_zhong")
          return num + count
        }, 0),
        fan: curs.reduce((count, current) => {
          let num = 0
          if (current.identity === "fan") {
            num++
          }
          num += current.countMark("zclianpo_mark_fan")
          return num + count
        }, 0),
        nei: curs.reduce((count, current) => {
          let num = 0
          if (current.identity === "nei") {
            num++
          }
          num += current.countMark("zclianpo_mark_nei")
          return num + count
        }, 0),
        commoner: curs.reduce((count, current) => {
          let num = 0
          if (current.identity === "commoner") {
            num++
          }
          num += current.countMark("zclianpo_mark_commoner")
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
    group: "zclianpo_show",
    async content(_event, trigger, _player) {
      var source = trigger.source
      source.chooseDrawRecover(2, true)
    },
    mark: true,
    intro: {
      content: () =>
        `场上最大阵营为${lib.skill.zclianpo
          .getMax()
          .map((i) => {
            if (i === "zhu") {
              return "主忠"
            }
            return get.translation(`${i}2`)
          })
          .join("、")}`,
    },
    $createButton(item, _type, position, noclick, node) {
      node = ui.create.identityCard(item, position, noclick)
      node.link = item
      return node
    },
    subSkill: {
      show: {
        audio: "zclianpo",
        trigger: { global: "roundStart" },
        filter(_event, _player) {
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
            '###炼魄：请选择一个身份###<div class="text center">你选择的身份对应的阵营角色数于本轮内视为+1</div>'
          const next = player.chooseButton([title, cards], true)

          const result = await next.forResult()
          const choice = result.links[0]
          const mark = `zclianpo_mark_${choice}`

          player
            .when({ global: "roundStart" }, false)
            .assign({
              firstDo: true,
            })
            .filter((evt) => evt !== trigger)
            .step(async (_event, _trigger, player) => {
              for (const storage in player.storage) {
                if (storage.startsWith("zclianpo_mark_")) {
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
            return lib.skill.zclianpo.$createButton(
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
            if (!lib.skill.zclianpo.getMax().includes("fan")) {
              return
            }
            return (
              num -
              game.countPlayer((current) => {
                return current !== player && current.hasSkill("zclianpo")
              })
            )
          },
          cardUsable(card, _player, num) {
            if (card.name === "sha") {
              if (!lib.skill.zclianpo.getMax().includes("fan")) {
                return
              }
              return (
                num +
                game.countPlayer((current) => {
                  return current.hasSkill("zclianpo")
                })
              )
            }
          },
          attackRange(_player, num) {
            if (!lib.skill.zclianpo.getMax().includes("fan")) {
              return
            }
            return (
              num +
              game.countPlayer((current) => {
                return current.hasSkill("zclianpo")
              })
            )
          },
          cardSavable(card, player, target) {
            if (card.name === "tao" && !player.hasSkill("zclianpo")) {
              if (!lib.skill.zclianpo.getMax().includes("zhu")) {
                return
              }
              if (player === target) {
                return
              }
              return false
            }
          },
          playerEnabled(card, player, target) {
            if (card.name === "tao" && !player.hasSkill("zclianpo")) {
              if (!lib.skill.zclianpo.getMax().includes("zhu")) {
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
            (i) => i.hasSkill("zclianpo", null, null, false),
            true,
          )
        },
        silent: true,
        forceDie: true,
        content: () => {
          game.removeGlobalSkill("zclianpo_global")
        },
      },
    },
  },
  zhaoluan: {
    trigger: { global: "dieBegin" },
    filter(event, _player) {
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
        audio: "zhaoluan",
        enable: "phaseUse",
        filter(_event, player) {
          return player.getStorage("zhaoluan_effect").some((i) => i.isIn())
        },
        filterTarget(_card, player, target) {
          return !player.getStorage("zhaoluan_hit").includes(target)
        },
        line: false,
        locked: true,
        charlotte: true,
        promptfunc() {
          var bodies = _status.event.player
            .getStorage("zhaoluan_effect")
            .filter((i) => i.isIn())
          return `选择一名角色，你令${get.translation(bodies)}${bodies.length > 1 ? "中的一人" : ""}减1点体力上限，然后你对选择的角色造成1点伤害。`
        },
        delay: false,
        async content(event, _trigger, player) {
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
                (_card, _player, target) => {
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
              .step(async (_event, _trigger, player) => {
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
  cangqiao: {
    trigger: {
      player: "useCard",
      global: "roundStart",
    },
    filter(event, player) {
      if (event.name === "useCard") {
        if (!["duanjian", "serafuku", "yonglv"].includes(event.card.name)) {
          return false
        }
        return player.countCards("h") < player.maxHp
      }
      return true
    },
    async cost(event, _trigger, player) {
      event.result = await player
        .chooseBool(get.prompt(event.skill), () => true)
        .forResult()
    },
    async content(_event, trigger, player) {
      if (trigger.name === "useCard") {
        await player.drawTo(player.maxHp)
      } else {
        if (!_status.cangqiao) {
          game.broadcastAll(() => {
            _status.cangqiao = [
              { name: "duanjian", number: 13, suit: "club" },
              { name: "serafuku", number: 9, suit: "heart" },
              { name: "yonglv", number: 13, suit: "club" },
            ]
            for (const info of _status.cangqiao) {
              if (!lib.inpile.includes(info.name)) {
                lib.inpile.add(info.name)
              }
            }
          })
        }
        const list = ["duanjian", "serafuku", "yonglv"],
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
  shenji: {
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
    async cost(event, _trigger, player) {
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
        .chooseTarget(get.prompt2(event.skill), (_, _player, target) =>
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
    async content(event, _trigger, player) {
      const {
        targets: [target],
        cost_data: choice,
      } = event
      const result = await player
        .choosePlayerCard(
          target,
          `###神械###将${get.translation(target)}场上的一张牌当作延时锦囊牌使用`,
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
    usable: 1,
    enable: "phaseUse",
    onChooseToUse(event) {
      if (game.online) {
        return
      }
      event.set(
        "huaxiu",
        ["duanjian", "serafuku", "yonglv"].filter((i) => i in lib.card),
      )
    },
    filter(event, _player) {
      return event.huaxiu?.length
    },
    manualConfirm: true,
    async content(event, _trigger, player) {
      const list = event
        .getParent(2)
        .huaxiu.map((name) => [get.type(name), "", name])
      const result = await player
        .chooseButton(true, ["化朽", "选择要升级的装备", [list, "vcard"]])
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
            duanjian: "hun_zhuge",
            serafuku: "hun_bagua",
            yonglv: "lingling",
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
              for (const name of ["duanjian", "serafuku", "yonglv"]) {
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
        filter(_event, player) {
          for (const name of ["duanjian", "serafuku", "yonglv"]) {
            if (_status.huaxiu?.[name]?.includes(player)) {
              return true
            }
          }
          return false
        },
        forced: true,
        popup: false,
        async content(event, _trigger, _player) {
          get.info(event.name).contentx.apply(this, arguments)
        },
        contentx(_event, _trigger, player) {
          game.broadcastAll((player) => {
            for (const name of ["duanjian", "serafuku", "yonglv"]) {
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
            duanjian: "hun_zhuge",
            serafuku: "hun_bagua",
            yonglv: "lingling",
          }
          for (const name of ["duanjian", "serafuku", "yonglv"]) {
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
          } catch (_e) {
            return
          }
          if (!cardz || cardz.name !== "sha") {
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
    filter(event, player, _triggername) {
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
            `###${get.prompt(event.skill)}###令任意名死亡角色依次观看${get.translation(trigger.target)}手牌并可以重铸其中一张牌`,
            [1, game.dead.length],
          )
          .set("filterTarget", (_, _player, target) => target.isDead())
          .set("ai", (target) => get.attitude(get.player(), target) > 0)
          .set("deadTarget", true)
          .forResult()
      }
    },
    async content(event, trigger, _player) {
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
              `请选择重铸${get.translation(trigger.target)}的一张手牌`,
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
        !event.filterCard ||
        !event.filterCard(get.autoViewAs({ name: "shan" }, []), player, event)
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
        !evt ||
        !evt.card ||
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
          .set("filterTarget", (_, _player, target) => target.isDead())
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
        if (!arg || !arg.player) {
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
        target(card, player, target, _effect) {
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
          if (!vcard || !vcard.storage?.equipEnable) {
            return false
          }
          return vcard.cards.some(
            (cardx) => get.info(cardx)?.name === "lingling",
          )
        })
      return es.concat(js)
    },
    filter(event, _player, _triggername, card) {
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
          .chooseTarget(`軨軨：选择一名角色对其造成1点雷电伤害`, true)
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
            .setContent(async (event, _trigger, player) => {
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
                  if (!event.card.cards?.length) {
                    source.removeVirtualEquip(event.card)
                  }
                  await aim.equip(event.card)
                } else {
                  if (!event.card.cards?.length) {
                    source.removeVirtualJudge(event.card)
                  }
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
        .set("prompt", "軨軨：秘密选择一个方向")
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
}

export default skills
