import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 许劭
  // 评荐
  pingjian: {
    initList() {
      game.initCharacterList()
    },
    init(player) {
      player.addSkill("pingjian_check")
      if (!player.storage.pingjian_check) {
        player.storage.pingjian_check = {}
      }
    },
    audio: 2,
    trigger: { player: ["damageEnd", "phaseJieshuBegin"] },
    frequent: true,
    content() {
      "step 0"
      if (Object.keys(player.storage.pingjian_check)?.length) {
        Object.keys(player.storage.pingjian_check).forEach((skill) => {
          player.removeSkill(skill)
          const names = player.tempname?.filter((i) =>
            get.character(i, 3)?.includes(skill),
          )
          if (names) {
            get.nameList(player).forEach((name) => {
              const { tempname } = get.character(name)
              if (tempname && Array.isArray(tempname)) {
                names.removeArray(tempname)
              }
            })
            game.broadcastAll(
              (player, names) => player.tempname.removeArray(names),
              player,
              names,
            )
          }
          delete player.storage.pingjian_check[skill]
        })
      }
      if (!_status.characterlist) {
        game.initCharacterList()
      }
      var allList = _status.characterlist.slice(0)
      game.countPlayer((current) => {
        if (
          current.name &&
          lib.character[current.name] &&
          current.name.indexOf("gz_shibing") !== 0 &&
          current.name.indexOf("gz_jun_") !== 0
        ) {
          allList.add(current.name)
        }
        if (
          current.name1 &&
          lib.character[current.name1] &&
          current.name1.indexOf("gz_shibing") !== 0 &&
          current.name1.indexOf("gz_jun_") !== 0
        ) {
          allList.add(current.name1)
        }
        if (
          current.name2 &&
          lib.character[current.name2] &&
          current.name2.indexOf("gz_shibing") !== 0 &&
          current.name2.indexOf("gz_jun_") !== 0
        ) {
          allList.add(current.name2)
        }
      })
      var list = []
      var skills = []
      var map = []
      allList.randomSort()
      var name2 = event.triggername
      for (var i = 0; i < allList.length; i++) {
        var name = allList[i]
        if (name.indexOf("zuoci") !== -1 || name.indexOf("xushao") !== -1) {
          continue
        }
        var skills2 = lib.character[name][3]
        for (var j = 0; j < skills2.length; j++) {
          if (player.getStorage("pingjian").includes(skills2[j])) {
            continue
          }
          if (player.hasSkill(skills2[j], null, null, false)) {
            continue
          }
          if (skills.includes(skills2[j])) {
            list.add(name)
            if (!map[name]) {
              map[name] = []
            }
            map[name].push(skills2[j])
            skills.add(skills2[j])
            continue
          }
          var list2 = [skills2[j]]
          game.expandSkills(list2)
          for (var k = 0; k < list2.length; k++) {
            var info = lib.skill[list2[k]]
            if (get.is.zhuanhuanji(list2[k], player)) {
              continue
            }
            if (
              !info?.trigger?.player ||
              info.silent ||
              info.limited ||
              info.juexingji ||
              info.hiddenSkill ||
              info.dutySkill ||
              (info.zhuSkill && !player.isZhu2())
            ) {
              continue
            }
            if (
              info.trigger.player === name2 ||
              (Array.isArray(info.trigger.player) &&
                info.trigger.player.includes(name2))
            ) {
              if (info.ai && (info.ai.combo || info.ai.notemp || info.ai.neg)) {
                continue
              }
              if (info.init) {
                continue
              }
              if (info.filter) {
                try {
                  var bool = info.filter(trigger, player, name2)
                  if (!bool) {
                    continue
                  }
                } catch (e) {
                  continue
                }
              }
              list.add(name)
              if (!map[name]) {
                map[name] = []
              }
              map[name].push(skills2[j])
              skills.add(skills2[j])
              break
            }
          }
        }
        if (list.length > 2) {
          break
        }
      }
      if (skills.length) {
        event.list = list
        player
          .chooseControl(skills)
          .set("dialog", [
            "评鉴：选择并视为拥有其中一个技能",
            [list, "character"],
          ])
      } else {
        event.finish()
      }
      ;("step 1")
      player.markAuto("pingjian", [result.control])
      player.addTempSkill(result.control)
      player.storage.pingjian_check[result.control] =
        trigger.name === "damage" ? trigger : "phaseJieshu"
      var name = event.list.find((name) =>
        lib.character[name][3].includes(result.control),
      )
      // if(name) lib.skill.rehuashen.createAudio(name,result.control,'xushao');
      if (name) {
        game.broadcastAll(
          (player, name) => player.tempname.add(name),
          player,
          name,
        )
      }
    },
    group: "pingjian_use",
    phaseUse_special: [],
    ai: { threaten: 5 },
  },
  pingjian_use: {
    audio: "pingjian",
    enable: "phaseUse",
    usable: 1,
    sourceSkill: "pingjian",
    prompt: () => lib.translate.pingjian_info,
    content() {
      "step 0"
      if (Object.keys(player.storage.pingjian_check)?.length) {
        Object.keys(player.storage.pingjian_check).forEach((skill) => {
          player.removeSkill(skill)
          const names = player.tempname?.filter((i) =>
            get.character(i, 3)?.includes(skill),
          )
          if (names) {
            get.nameList(player).forEach((name) => {
              const { tempname } = get.character(name)
              if (tempname && Array.isArray(tempname)) {
                names.removeArray(tempname)
              }
            })
            game.broadcastAll(
              (player, names) => player.tempname.removeArray(names),
              player,
              names,
            )
          }
          delete player.storage.pingjian_check[skill]
        })
      }
      var list = []
      var skills = []
      var map = []
      var evt = event.getParent(2)
      if (!_status.characterlist) {
        game.initCharacterList()
      }
      var allList = _status.characterlist.slice(0)
      game.countPlayer((current) => {
        if (
          current.name &&
          lib.character[current.name] &&
          current.name.indexOf("gz_shibing") !== 0 &&
          current.name.indexOf("gz_jun_") !== 0
        ) {
          allList.add(current.name)
        }
        if (
          current.name1 &&
          lib.character[current.name1] &&
          current.name1.indexOf("gz_shibing") !== 0 &&
          current.name1.indexOf("gz_jun_") !== 0
        ) {
          allList.add(current.name1)
        }
        if (
          current.name2 &&
          lib.character[current.name2] &&
          current.name2.indexOf("gz_shibing") !== 0 &&
          current.name2.indexOf("gz_jun_") !== 0
        ) {
          allList.add(current.name2)
        }
      })
      allList.randomSort()
      for (var i = 0; i < allList.length; i++) {
        var name = allList[i]
        if (name.indexOf("zuoci") !== -1 || name.indexOf("xushao") !== -1) {
          continue
        }
        var skills2 = lib.character[name][3]
        for (var j = 0; j < skills2.length; j++) {
          if (player.getStorage("pingjian").includes(skills2[j])) {
            continue
          }
          if (player.hasSkill(skills2[j], null, null, false)) {
            continue
          }
          if (get.is.locked(skills2[j], player)) {
            continue
          }
          var info = get.plainText(lib.translate[`${skills2[j]}_info`] || "")
          if (
            skills.includes(skills2[j]) ||
            (info.includes("当你于出牌阶段") &&
              !info.includes("当你于出牌阶段外"))
          ) {
            list.add(name)
            map[name] ??= []
            map[name].push(skills2[j])
            skills.add(skills2[j])
            continue
          }
          var list2 = [skills2[j]]
          game.expandSkills(list2)
          for (var k = 0; k < list2.length; k++) {
            var info = lib.skill[list2[k]]
            if (get.is.zhuanhuanji(list2[k], player)) {
              continue
            }
            if (
              !info?.enable ||
              info.charlotte ||
              info.limited ||
              info.juexingji ||
              info.hiddenSkill ||
              info.dutySkill ||
              (info.zhuSkill && !player.isZhu2())
            ) {
              continue
            }
            if (
              info.enable === "phaseUse" ||
              (Array.isArray(info.enable) &&
                info.enable.includes("phaseUse")) ||
              info.enable === "chooseToUse" ||
              (Array.isArray(info.enable) &&
                info.enable.includes("chooseToUse"))
            ) {
              if (info.ai && (info.ai.combo || info.ai.notemp || info.ai.neg)) {
                continue
              }
              if (info.init || info.onChooseToUse) {
                continue
              }
              if (info.filter) {
                try {
                  var bool = info.filter(evt, player)
                  if (!bool) {
                    continue
                  }
                } catch (e) {
                  continue
                }
              } else if (info.viewAs && typeof info.viewAs !== "function") {
                try {
                  if (
                    evt.filterCard &&
                    !evt.filterCard(info.viewAs, player, evt)
                  ) {
                    continue
                  }
                  if (
                    info.viewAsFilter &&
                    info.viewAsFilter(player) === false
                  ) {
                    continue
                  }
                } catch (e) {
                  continue
                }
              }
              list.add(name)
              if (!map[name]) {
                map[name] = []
              }
              map[name].push(skills2[j])
              skills.add(skills2[j])
              break
            }
          }
        }
        if (list.length > 2) {
          break
        }
      }
      if (skills.length) {
        event.list = list
        player
          .chooseControl(skills)
          .set("dialog", [
            "评鉴：选择并视为拥有其中一个技能",
            [list, "character"],
          ])
      } else {
        event.finish()
      }
      ;("step 1")
      player.markAuto("pingjian", [result.control])
      player.addTempSkill(result.control)
      player.storage.pingjian_check[result.control] = "phaseUse"
      var name = event.list.find((name) =>
        lib.character[name][3].includes(result.control),
      )
      // if(name) lib.skill.rehuashen.createAudio(name,result.control,'xushao');
      if (name) {
        game.broadcastAll(
          (player, name) => player.tempname.add(name),
          player,
          name,
        )
      }
    },
    ai: { order: 12, result: { player: 1 } },
  },
  pingjian_check: {
    charlotte: true,
    trigger: { player: ["useSkill", "logSkillBegin"] },
    sourceSkill: "pingjian",
    filter(event, player) {
      var info = get.info(event.skill)
      if (info?.charlotte) {
        return false
      }
      var skill = get.sourceSkillFor(event)
      return player.storage.pingjian_check[skill]
    },
    direct: true,
    firstDo: true,
    priority: Infinity,
    content() {
      var skill = get.sourceSkillFor(trigger)
      player.removeSkill(skill)
      const names = player.tempname?.filter((i) =>
        get.character(i, 3)?.includes(skill),
      )
      if (names) {
        get.nameList(player).forEach((name) => {
          const { tempname } = get.character(name)
          if (tempname && Array.isArray(tempname)) {
            names.removeArray(tempname)
          }
        })
        game.broadcastAll(
          (player, names) => player.tempname.removeArray(names),
          player,
          names,
        )
      }
      delete player.storage.pingjian_check[skill]
    },
    group: "pingjian_check2",
  },
  pingjian_check2: {
    charlotte: true,
    trigger: { player: ["phaseUseEnd", "damageEnd", "phaseJieshuBegin"] },
    sourceSkill: "pingjian",
    filter(event, player) {
      return Object.keys(player.storage.pingjian_check).find((skill) => {
        if (event.name !== "damage") {
          return player.storage.pingjian_check[skill] === event.name
        }
        return player.storage.pingjian_check[skill] === event
      })
    },
    direct: true,
    lastDo: true,
    priority: -Infinity,
    content() {
      var skills = Object.keys(player.storage.pingjian_check).filter(
        (skill) => {
          if (trigger.name !== "damage") {
            return player.storage.pingjian_check[skill] === trigger.name
          }
          return player.storage.pingjian_check[skill] === trigger
        },
      )
      player.removeSkill(skills)
      const names = player.tempname?.filter((i) =>
        skills.some((skill) => get.character(i, 3)?.includes(skill)),
      )
      if (names) {
        get.nameList(player).forEach((name) => {
          const { tempname } = get.character(name)
          if (tempname && Array.isArray(tempname)) {
            names.removeArray(tempname)
          }
        })
        game.broadcastAll(
          (player, names) => player.tempname.removeArray(names),
          player,
          names,
        )
      }
      for (var skill of skills) {
        delete player.storage.pingjian_check[skill]
      }
    },
  },
  // 神孙权
  // 驭衡
  yuheng: {
    audio: 2,
    trigger: { player: "phaseBegin" },
    forced: true,
    keepSkill: true,
    filter(event, player) {
      return player.hasCard(
        (card) => lib.filter.cardDiscardable(card, player, "yuheng"),
        "he",
      )
    },
    content() {
      "step 0"
      const num = player
        .getCards("he")
        .reduce((arr, card) => arr.add(get.suit(card, player)), []).length
      player
        .chooseToDiscard("he", true, [1, num], (card, player) => {
          if (!ui.selected.cards.length) {
            return true
          }
          var suit = get.suit(card, player)
          for (var i of ui.selected.cards) {
            if (get.suit(i, player) === suit) {
              return false
            }
          }
          return true
        })
        .set("complexCard", true)
        .set("ai", (card) => {
          if (!player.hasValueTarget(card)) {
            return 5
          }
          return 5 - get.value(card)
        })
      ;("step 1")
      if (result.bool) {
        var skills = lib.skill.yuheng.derivation.randomGets(result.cards.length)
        player.addAdditionalSkills("yuheng", skills, true)
      }
    },
    group: "yuheng_remove",
    derivation: [
      "jx_zhiheng",
      "lanjiang",
      "dimeng",
      "anguo",
      "diaodu",
      "jiexun",
      "xiashu",
      "hongyuan",
      "anxu",
      "youdi",
      "guanwei",
      "bizheng",
      "olbingyi",
      "shenxing",
      "xingxue",
    ],
    subSkill: {
      remove: {
        audio: "yuheng",
        trigger: { player: "phaseEnd" },
        forced: true,
        filter(event, player) {
          return (
            player.additionalSkills.yuheng &&
            player.additionalSkills.yuheng.length > 0
          )
        },
        async content(event, trigger, player) {
          const skillslength = player.additionalSkills.yuheng.length
          await player.removeAdditionalSkills("yuheng")
          await player.draw(skillslength)
        },
      },
    },
  },
  // 帝力
  dili: {
    audio: 2,
    trigger: { player: "changeSkillsAfter" },
    forced: true,
    juexingji: true,
    skillAnimation: true,
    animationColor: "wood",
    filter(event, player) {
      if (!event.addSkill.length) {
        return false
      }
      var skills = player.getSkills(null, false, false).filter((i) => {
        var info = get.info(i)
        return info && !info.charlotte
      })
      return skills.length > player.maxHp
    },
    content() {
      "step 0"
      player.awakenSkill(event.name)
      player.loseMaxHp()
      ;("step 1")
      var skills = player.getSkills(null, false, false).filter((i) => {
        if (i === "dili") {
          return false
        }
        var info = get.info(i)
        return info && !info.charlotte
      })
      var next = player.chooseButton([
        "请选择失去任意个技能",
        [skills, "skill"],
      ])
      next.set("forced", true)
      next.set("selectButton", [1, skills.length])
      next.set("ai", (button) => {
        var skill = button.link,
          skills = _status.event.skills.slice(0)
        skills.removeArray(["anguo", "lanjiang", "rezhiheng", "yuheng"])
        switch (ui.selected.buttons.length) {
          case 0:
            if (skills.includes(skill)) {
              return 2
            }
            if (skill === "yuheng") {
              return 1
            }
            return Math.random()
          case 1:
            if (skills.length < 2) {
              return 0
            }
            if (skills.includes(skill)) {
              return 2
            }
            if (skill === "yuheng") {
              return 1
            }
            return 0
          case 2:
            if (skills.includes(skill)) {
              return 2
            }
            if (skill === "yuheng") {
              return 1
            }
            return 0
          default:
            return 0
        }
      })
      next.set("skills", skills)
      ;("step 2")
      if (result.bool) {
        var skills = result.links
        player.removeSkills(skills.slice(0))
      }
      var list = lib.skill.dili.derivation
      list = list.slice(0, Math.min(skills.length, list.length))
      player.addSkills(list)
    },
    ai: {
      combo: "yuheng",
    },
    derivation: ["shengzhi", "quandao", "chigang"],
  },
  // 圣质
  shengzhi: {
    audio: 2,
    trigger: { player: ["logSkill", "useSkillAfter"] },
    forced: true,
    filter(event, player) {
      if (event.type !== "player") {
        return false
      }
      var skill = get.sourceSkillFor(event)
      if (get.is.locked(skill)) {
        return false
      }
      var info = get.info(skill)
      return !info.charlotte
    },
    content() {
      player.addTempSkill("shengzhi_effect")
    },
    subSkill: {
      effect: {
        mod: {
          cardUsable: () => Infinity,
          targetInRange: () => true,
        },
        trigger: { player: "useCard1" },
        forced: true,
        charlotte: true,
        popup: false,
        firstDo: true,
        content() {
          player.removeSkill(event.name)
          if (trigger.addCount !== false) {
            trigger.addCount = false
            const stat = player.getStat().card,
              name = trigger.card.name
            if (typeof stat[name] === "number") {
              stat[name]--
            }
          }
        },
        mark: true,
        intro: { content: "使用下一张牌无距离和次数限制" },
      },
    },
  },
  // 权道
  quandao: {
    audio: 2,
    trigger: { player: "useCard" },
    forced: true,
    filter(event, player) {
      return (
        event.card.name === "sha" ||
        get.type(event.card, null, false) === "trick"
      )
    },
    async content(event, trigger, player) {
      const cards1 = player.getCards("h", (card) => get.name(card) === "sha"),
        cards2 = player.getCards("h", (card) => get.type(card) === "trick")
      if (cards1.length !== cards2.length) {
        const num = cards1.length - cards2.length,
          cards = num > 0 ? cards1 : cards2
        let i = 0
        cards.forEach((card) => {
          if (
            i < Math.abs(num) &&
            lib.filter.cardDiscardable(card, player, "quandao")
          ) {
            i++
          }
        })
        if (i > 0) {
          await player.chooseToDiscard(
            i,
            true,
            `权道：请弃置${get.cnNumber(i)}张${num > 0 ? "杀" : "普通锦囊牌"}`,
            num > 0
              ? (card) => get.name(card) === "sha"
              : (card) => get.type(card) === "trick",
          )
        }
      }
      await player.draw()
    },
  },
  // 持纲
  chigang: {
    audio: 2,
    trigger: { player: "phaseChange" },
    forced: true,
    zhuanhuanji: true,
    mark: true,
    marktext: "☯",
    filter(event, player) {
      return event.phaseList[event.num].indexOf("phaseJudge") !== -1
    },
    content() {
      player.changeZhuanhuanji(event.name)
      const phase = player.storage.chigang ? "phaseDraw" : "phaseUse"
      trigger.phaseList[trigger.num] = `${phase}|${event.name}`
      game.delayx()
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.type(card) === "delay") {
            return "zeroplayertarget"
          }
        },
      },
    },
    intro: {
      content(storage) {
        return `转换技，锁定技，你的判定阶段改为${storage ? "出牌阶段" : "摸牌阶段"}。`
      },
    },
  },
  // 澜疆
  lanjiang: {
    audio: 2,
    audioname2: { heqi: "lanjiang_heqi" },
    trigger: { player: "phaseJieshuBegin" },
    logTarget(event, player) {
      return game
        .filterPlayer(
          (current) => current.countCards("h") >= player.countCards("h"),
        )
        .sortBySeat()
    },
    async content(event, trigger, player) {
      for (const target of event.targets) {
        if (!target.isIn()) {
          continue
        }
        const result = await target
          .chooseBool(
            `是否令${player === target ? "自己" : get.translation(player)}摸一张牌？`,
          )
          .set("choice", get.attitude(target, player) > 0)
          .forResult()
        if (result?.bool) {
          target.line(player)
          if (
            player !== target &&
            (get.mode() !== "identity" || target.identity !== "nei")
          ) {
            target.addExpose(0.15)
          }
          await player.draw()
        }
      }
      const result = await player
        .chooseTarget(
          "是否对一名手牌数等于自己的目标角色造成1点伤害？",
          (card, player, target) => {
            return (
              get.event().getParent().targets.includes(target) &&
              target.countCards("h") === player.countCards("h")
            )
          },
        )
        .set("ai", (target) => {
          const player = get.player()
          return get.damageEffect(target, player, player)
        })
        .forResult()
      if (!result?.targets?.length) {
        return
      }
      const [target] = result.targets
      player.line(target, "green")
      if (get.mode() !== "identity" || player.identity !== "nei") {
        player.addExpose(0.15)
      }
      await target.damage()
      if (
        event.targets.some(
          (target) =>
            target.isIn() && target.countCards("h") < player.countCards("h"),
        )
      ) {
        const result = await player
          .chooseTarget(
            "请选择一名手牌数小于自己的目标角色，令其摸一张牌",
            (card, player, target) => {
              return (
                get.event().getParent().targets.includes(target) &&
                target.countCards("h") < player.countCards("h")
              )
            },
            true,
          )
          .set("ai", (target) => {
            const player = get.player()
            return get.effect(target, { name: "draw" }, player, player)
          })
          .forResult()
        if (!result?.targets?.length) {
          return
        }
        const [target] = result.targets
        player.line(target)
        if (
          player !== target &&
          (get.mode() !== "identity" || player.identity !== "nei")
        ) {
          player.addExpose(0.1)
        }
        await target.draw()
      }
    },
  },
  // 安国
  anguo: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterTarget: lib.filter.notMe,
    content() {
      "step 0"
      if (target.isMinHandcard()) {
        target.draw()
        event.h = true
      }
      ;("step 1")
      if (target.isMinHp() && target.isDamaged()) {
        target.recover()
        event.hp = true
      }
      ;("step 2")
      var equip = get.cardPile(
        (card) => get.type(card) === "equip" && target.hasUseTarget(card),
        false,
        "random",
      )
      if (target.isMinEquip() && equip) {
        target.chooseUseTarget(equip, "nothrow", "nopopup", true)
        event.e = true
      }
      ;("step 3")
      game.updateRoundNumber()
      if (!event.h && player.isMinHandcard()) {
        player.draw()
      }
      ;("step 4")
      if (!event.hp && player.isMinHp() && player.isDamaged()) {
        player.recover()
      }
      ;("step 5")
      if (!event.e && player.isMinEquip()) {
        var equip = get.cardPile(
          (card) => get.type(card) === "equip" && player.hasUseTarget(card),
          false,
          "random",
        )
        if (equip) {
          player.chooseUseTarget(equip, "nothrow", "nopopup", true)
        }
      }
      ;("step 6")
      game.updateRoundNumber()
    },
    ai: {
      threaten: 1.6,
      order: 9,
      result: {
        player(player, target) {
          if (get.attitude(player, target) <= 0) {
            if (
              target.isMinHandcard() ||
              target.isMinEquip() ||
              target.isMinHp()
            ) {
              return -1
            }
          }
          var num = 0
          if (player.isMinHandcard() || target.isMinHandcard()) {
            num++
          }
          if (player.isMinEquip() || target.isMinEquip()) {
            num++
          }
          if (
            (player.isMinHp() && player.isDamaged()) ||
            (target.isMinHp() && target.isDamaged())
          ) {
            num += 2.1
          }
          return num
        },
      },
    },
  },
  // 调度
  diaodu: {
    audio: 2,
    trigger: {
      player: "phaseUseBegin",
    },
    filter(event, player) {
      return game.hasPlayer((current) => {
        if (!current.isFriendOf(player)) {
          return false
        }
        return current.countGainableCards(player, "e") > 0
      })
    },
    frequent: true,
    preHidden: true,
    async cost(event, trigger, player) {
      const next = player.chooseTarget(
        get.prompt2("diaodu"),
        (_card, player, current) =>
          current.isFriendOf(player) &&
          current.countGainableCards(player, "e") > 0,
      )

      next.set("ai", (target) => {
        let num = 0

        if (target.hasSkill("gz_xiaoji")) {
          num += 2.5
        }
        if (target.isDamaged() && target.getEquip("baiyin")) {
          num += 2.5
        }
        if (target.hasSkill("xuanlve")) {
          num += 2
        }

        return num
      })

      next.setHiddenSkill("diaodu")

      event.result = await next.forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]
      const result = await player.gainPlayerCard(target, "e", true).forResult()

      if (!result.bool) {
        return
      }

      const card = result.cards[0]
      if (!player.getCards("h").includes(card)) {
        return
      }

      const result2 = await player
        .chooseTarget(
          `将${get.translation(card, void 0)}交给另一名角色`,
          (_card, player, current) =>
            current !== player && current !== _status.event.target,
          true,
        )
        .set("target", target)
        .forResult()

      if (result2.bool) {
        const target2 = result2.targets[0]
        player.line(target2, "green")
        await player.give(card, target2)
      }
    },
    group: "diaodu_use",
    subSkill: {
      use: {
        audio: "diaodu",
        trigger: {
          global: "useCard",
        },
        filter(event, player) {
          if (get.type(event.card) !== "equip") {
            return false
          }
          if (!event.player.isIn()) {
            return false
          }
          if (!event.player.isFriendOf(player)) {
            return false
          }
          return player === event.player || player.hasSkill("diaodu")
        },
        logTarget: "player",
        async cost(event, trigger, player) {
          const next = trigger.player.chooseBool(
            get.prompt("diaodu"),
            "摸一张牌",
          )

          if (player.hasSkill("diaodu")) {
            next.set("frequentSkill", "diaodu")
          }
          if (player === trigger.player) {
            next.setHiddenSkill("diaodu")
          }

          event.result = await next.forResult()
        },
        async content(event, trigger, player) {
          trigger.player.draw("nodelay")
        },
      },
    },
  },
  // 诫训
  jiexun: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    onremove: true,
    direct: true,
    content() {
      "step 0"
      var num1 = game.countPlayer((current) =>
        current.countCards("ej", { suit: "diamond" }),
      )
      var num2 = player.countMark("jiexun")
      event.num1 = num1
      event.num2 = num2
      var str = `令目标摸${get.cnNumber(num1)}张牌`
      if (num2) {
        str +=
          "，然后弃置" +
          get.cnNumber(num2) +
          "张牌；若目标因此法弃置了所有牌，则你失去“诫训”，然后你发动“复难”时，无须令其获得你使用的牌"
      }
      player
        .chooseTarget(
          get.prompt("jiexun"),
          (card, player, target) => target !== player,
        )
        .set(
          "ai",
          (target) =>
            _status.event.coeff * get.attitude(_status.event.player, target),
        )
        .set("coeff", num1 >= num2 ? 1 : -1)
        .set("prompt2", str)
      ;("step 1")
      if (result.bool) {
        var target = result.targets[0]
        event.target = target
        player.logSkill("jiexun", target)
        if (event.num1) {
          target.draw(event.num1)
        }
        player.addMark("jiexun", 1, false)
      } else {
        event.finish()
      }
      ;("step 2")
      if (event.num2) {
        event.target.chooseToDiscard(event.num2, true, "he")
      } else {
        event.finish()
      }
      ;("step 3")
      if (
        result.bool &&
        result.autochoose &&
        result.cards.length === result.rawcards.length
      ) {
        player.removeSkills("jiexun")
        player.addSkill("funan_jiexun")
      }
    },
  },
  // 下书
  xiashu: {
    audio: 2,
    trigger: { player: "phaseUseBegin" },
    direct: true,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    content() {
      "step 0"
      var maxval = 0
      var hs = player.getCards("h")
      for (var i = 0; i < hs.length; i++) {
        maxval = Math.max(maxval, get.value(hs[i]))
      }
      player
        .chooseTarget(get.prompt2("xiashu"), lib.filter.notMe)
        .set("ai", (target) => {
          var player = _status.event.player
          var maxval = _status.event.maxval
          var dh = target.countCards("h") - player.countCards("h")
          var att = get.attitude(player, target)
          if (target.hasSkill("qingjian")) {
            return false
          }
          if (dh <= 0) {
            return 0
          }
          if (att > 0) {
            return 0.1
          }
          if (maxval >= 8) {
            return 0
          }
          if (att === 0) {
            return 0.2
          }
          if (dh >= 3) {
            return dh
          }
          if (dh === 2) {
            if (maxval <= 7) {
              return dh
            }
          }
          if (maxval <= 6) {
            return dh
          }
          return 0
        })
        .set("maxval", maxval)
      ;("step 1")
      if (result.bool) {
        player.logSkill("xiashu", result.targets)
        event.target = result.targets[0]
        var hs = player.getCards("h")
        player.give(hs, event.target)
      } else {
        event.finish()
      }
      ;("step 2")
      var hs = event.target.getCards("h")
      if (!hs.length) {
        event.finish()
        return
      }
      hs.sort(
        (a, b) => get.value(b, player, "raw") - get.value(a, player, "raw"),
      )
      event.target
        .chooseCard([1, hs.length], "展示至少一张手牌", true, "allowChooseAll")
        .set("ai", (card) => {
          var rand = _status.event.rand
          var list = _status.event.list
          if (_status.event.att) {
            if (ui.selected.cards.length >= Math.ceil(list.length / 2)) {
              return 0
            }
            var value = get.value(card)
            if (_status.event.getParent().player.isHealthy()) {
              value +=
                (get.tag(card, "damage") ? 1.5 : 0) +
                (get.tag(card, "draw") ? 2 : 0)
            }
            return value
          }
          if (ui.selected.cards.length >= Math.floor(list.length / 2)) {
            return 0
          }
          return list.indexOf(card) % 2 === rand ? 1 : 0
        })
        .set("rand", Math.random() < 0.6 ? 1 : 0)
        .set("list", hs)
        .set("att", get.attitude(event.target, player) > 0)
      ;("step 3")
      event.target.showCards(result.cards)
      event.cards1 = result.cards
      event.cards2 = event.target.getCards(
        "h",
        (card) => !event.cards1.includes(card),
      )
      ;("step 4")
      var choice
      var num1 = event.cards1.length
      var num2 = event.cards2.length
      if (get.attitude(event.target, player) > 0 && num1 >= num2) {
        choice = 0
      } else if (num1 === num2) {
        choice = Math.random() < 0.45 ? 0 : 1
      } else if (num1 > num2) {
        if (num1 - num2 === 1) {
          choice = Math.random() < 0.6 ? 0 : 1
        } else {
          choice = 0
        }
      } else {
        if (num2 - num1 === 1) {
          choice = Math.random() < 0.6 ? 1 : 0
        } else {
          choice = 1
        }
      }
      player
        .chooseControl((event, player) => _status.event.choice)
        .set("choiceList", [
          `获得${get.translation(event.target)}展示的牌`,
          `获得${get.translation(event.target)}未展示的牌`,
        ])
        .set("choice", choice)
      ;("step 5")
      if (result.index === 0) {
        player.gain(event.cards1, target, "give", "bySelf")
      } else {
        player.gain(event.cards2, target, "giveAuto", "bySelf")
      }
    },
    ai: {
      expose: 0.1,
    },
  },
  // 弘援
  hongyuan: {
    audio: 2,
    trigger: { player: "gainAfter", global: "loseAsyncAfter" },
    filter(event, player) {
      if (
        !player.countCards("he") ||
        player.hasSkill("hongyuan_blocker", null, null, false)
      ) {
        return false
      }
      return event.getg(player).length >= 2
    },
    async content(event, trigger, player) {
      player.addTempSkill("hongyuan_blocker", [
        "phaseZhunbeiBefore",
        "phaseJudgeBefore",
        "phaseDrawBefore",
        "phaseUseBefore",
        "phaseDiscardBefore",
        "phaseJieshuBefore",
        "phaseBefore",
      ])
      const selectedTargets = []
      while (
        selectedTargets.length < 2 &&
        player.countCards("he") &&
        game.hasPlayer((target) => {
          return target !== player && !selectedTargets.includes(target)
        })
      ) {
        const { bool, targets, cards } = await player
          .chooseCardTarget({
            prompt: "弘援：将一张牌交给一名其他角色",
            filterCard: true,
            position: "he",
            filterTarget(card, player, target) {
              return (
                target !== player &&
                !get.event().selectedTargets.includes(target)
              )
            },
            complexCard: true,
            complexTarget: true,
            complexSelect: true,
            ai1(card) {
              const player = get.event().player
              if (
                !game.hasPlayer((current) => {
                  if (get.event().selectedTargets.includes(current)) {
                    return false
                  }
                  return (
                    current !== player &&
                    get.attitude(player, current) > 0 &&
                    !current.hasSkillTag("nogain")
                  )
                })
              ) {
                return -get.value(card)
              }
              return (
                4 +
                (player.hasSkill("olmingzhe") && get.color(card) === "red"
                  ? 2
                  : 0) -
                Math.max(player.getUseValue(card), get.value(card, player))
              )
            },
            ai2(target) {
              const player = _status.event.player,
                att = get.attitude(player, target)
              if (!ui.selected.cards.length) {
                return att
              }
              const card = ui.selected.cards[0],
                val = get.value(card, target)
              if (val < 0) {
                return -att * Math.sqrt(-val)
              }
              return att * Math.sqrt(val + 2)
            },
          })
          .set("selectedTargets", selectedTargets)
          .forResult()
        if (bool) {
          const target = targets[0]
          selectedTargets.push(target)
          player.line(target)
          await player.give(cards, target)
        } else {
          break
        }
      }
    },
    ai: { threaten: 0.8 },
    subSkill: { blocker: { charlotte: true } },
  },
  // 安恤
  anxu: {
    enable: "phaseUse",
    usable: 1,
    multitarget: true,
    audio: 2,
    filterTarget(card, player, target) {
      if (player === target) {
        return false
      }
      var num = target.countCards("h")
      if (ui.selected.targets.length) {
        return num < ui.selected.targets[0].countCards("h")
      }
      var players = game.filterPlayer()
      for (var i = 0; i < players.length; i++) {
        if (num > players[i].countCards("h")) {
          return true
        }
      }
      return false
    },
    selectTarget: 2,
    content() {
      "step 0"
      var gainner, giver
      if (targets[0].countCards("h") < targets[1].countCards("h")) {
        gainner = targets[0]
        giver = targets[1]
      } else {
        gainner = targets[1]
        giver = targets[0]
      }
      gainner.gainPlayerCard(giver, true, "h", "visibleMove")
      event.gainner = gainner
      event.giver = giver
      ;("step 1")
      if (result.cards) {
        event.bool = false
        var card = result.cards[0]
        if (get.suit(card) !== "spade") {
          event.bool = true
        }
      }
      ;("step 2")
      if (event.bool) {
        player.draw()
      }
    },
    ai: {
      order: 10.5,
      threaten: 2.3,
      result: {
        target(player, target) {
          var num = target.countCards("h")
          var att = get.attitude(player, target)
          if (ui.selected.targets.length === 0) {
            if (att > 0) {
              return -1
            }
            var players = game.filterPlayer()
            for (var i = 0; i < players.length; i++) {
              var num2 = players[i].countCards("h")
              var att2 = get.attitude(player, players[i])
              if (num2 < num) {
                if (att2 > 0) {
                  return -3
                }
                return -1
              }
            }
            return 0
          }
          return 1
        },
        player: 1,
      },
    },
  },
  // 诱敌
  youdi: {
    audio: 2,
    trigger: {
      player: "phaseJieshuBegin",
    },
    direct: true,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    content() {
      "step 0"
      player
        .chooseTarget(
          get.prompt2("youdi"),
          (card, player, target) => player !== target,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          if (
            player.countCards("h", "sha") > player.countCards("h") / 3 &&
            player.countCards("h", { color: "red" }) >
              player.countCards("h") / 2
          ) {
            return 0
          }
          if (target.countCards("he") === 0) {
            return 0.1
          }
          return -get.attitude(_status.event.player, target)
        })
      ;("step 1")
      if (result.bool) {
        game.delay()
        player.logSkill("youdi", result.targets)
        event.target = result.targets[0]
        event.target.discardPlayerCard(player, "h", true)
      } else {
        event.finish()
      }
      ;("step 2")
      if (get.color(result.links[0]) !== "black") {
        player.draw("nodelay")
      }
      if (result.links[0].name !== "sha" && event.target.countCards("he")) {
        player.gainPlayerCard("he", event.target, true)
      }
    },
    ai: {
      expose: 0.3,
      threaten: 1.4,
    },
  },
  // 观微
  guanwei: {
    audio: 2,
    usable: 1,
    init: () => {
      game.addGlobalSkill("guanwei_ai")
    },
    onremove: () => {
      if (
        !game.hasPlayer((i) => i.hasSkill("guanwei", null, null, false), true)
      ) {
        game.removeGlobalSkill("guanwei_ai")
      }
    },
    trigger: { global: "phaseUseEnd" },
    filter(event, player) {
      var history = event.player.getHistory("useCard")
      var num = 0
      var suit = false
      for (var i = 0; i < history.length; i++) {
        var suit2 = get.suit(history[i].card)
        if (!lib.suit.includes(suit2)) {
          return false
        }
        if (suit && suit !== suit2) {
          return false
        }
        suit = suit2
        num++
      }
      return num > 1
    },
    async cost(event, trigger, player) {
      const { player: target } = trigger
      event.result = await player
        .chooseToDiscard(
          "he",
          get.prompt(event.name.slice(0, -5), target),
          "弃置一张牌，令其摸两张牌并进行一个额外的出牌阶段。",
        )
        .set("ai", (card) => {
          const { player, targetx } = get.event()
          if (get.attitude(player, targetx) < 1) {
            return 0
          }
          return 9 - get.value(card)
        })
        .set("targetx", target)
        .forResult()
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const { player: target } = trigger
      player.line(target, "green")
      await target.draw(2)
      const evt = trigger.getParent("phase", true)
      if (evt) {
        evt.phaseList.splice(evt.num + 1, 0, `phaseUse|${event.name}`)
      }
    },
    ai: { expose: 0.5 },
    subSkill: {
      ai: {
        trigger: { player: "dieAfter" },
        filter: () => {
          return !game.hasPlayer(
            (i) => i.hasSkill("guanwei", null, null, false),
            true,
          )
        },
        silent: true,
        forceDie: true,
        content: () => {
          game.removeGlobalSkill("guanwei_ai")
        },
        ai: {
          effect: {
            player_use(card, player, target) {
              if (typeof card !== "object" || !player.isPhaseUsing()) {
                return
              }
              var hasPanjun = game.hasPlayer(
                (current) =>
                  current.hasSkill("guanwei") &&
                  !current.storage.counttrigger?.guanwei &&
                  get.attitude(current, player) >= 1 &&
                  current.hasCard(
                    (card) =>
                      get.value(card) < 7 ||
                      (current !== game.me &&
                        !current.isUnderControl() &&
                        !current.isOnline() &&
                        get.value(card) < 9),
                    "he",
                  ),
              )
              if (!hasPanjun) {
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
    },
  },
  // 弼政
  bizheng: {
    trigger: { player: "phaseDrawEnd" },
    direct: true,
    audio: 2,
    content() {
      "step 0"
      player
        .chooseTarget(get.prompt2("bizheng"), lib.filter.notMe)
        .set("ai", (target) => {
          var player = _status.event.player
          if (player.countCards("h") > player.maxHp) {
            return 0
          }
          var att = get.attitude(player, target)
          if (att <= 0 || target.hasSkillTag("nogain")) {
            return 0
          }
          if (target.maxHp - target.countCards("h") >= 2) {
            return att
          }
          return att / 2
        })
      ;("step 1")
      if (result.bool) {
        var target = result.targets[0]
        event.target = target
        player.logSkill("bizheng", target)
        target.draw(2)
      } else {
        event.finish()
      }
      ;("step 2")
      if (player.countCards("h") > player.maxHp) {
        player.chooseToDiscard(2, "he", true)
      }
      ;("step 3")
      if (target.countCards("h") > target.maxHp) {
        target.chooseToDiscard(2, "he", true)
      }
    },
    ai: {
      expose: 0.25,
    },
  },
  // 秉壹
  olbingyi: {
    audio: "bingyi",
    trigger: {
      player: "loseAfter",
      global: "loseAsyncAfter",
    },
    filter(event, player) {
      return (
        event.type === "discard" &&
        event.getl(player).cards2.length > 0 &&
        player.hasCards("h") &&
        !player.hasSkill("olbingyi_blocker", null, null, false)
      )
    },
    prompt2(event, player) {
      let str = "展示所有手牌，然后"
      const hs = player.getCards("h")
      const colors = hs.map((card) => get.color(card)).toUniqued()
      if (colors.length !== 1) {
        return `${str}无事发生`
      }
      str += `令至多${get.cnNumber(hs.length)}名其他角色和自己各摸一张牌`
      return str
    },
    check(event, player) {
      const colors = player
        .getCards("h")
        .map((card) => get.color(card))
        .toUniqued()
      return colors.length === 1
    },
    async content(event, trigger, player) {
      player.addTempSkill("olbingyi_blocker", [
        "phaseZhunbeiAfter",
        "phaseJudgeAfter",
        "phaseDrawAfter",
        "phaseUseAfter",
        "phaseDiscardAfter",
        "phaseJieshuAfter",
      ])

      const cards = player.getCards("h")
      await player.showCards(cards, `${get.translation(player)}发动了【秉壹】`)

      const colors = cards.map((card) => get.color(card)).toUniqued()
      if (colors.length !== 1) {
        return
      }

      const num = cards.length
      const result = !game.hasPlayer((current) => current !== player)
        ? { bool: false }
        : await player
            .chooseTarget({
              prompt: `秉壹：令至多${get.cnNumber(num)}名其他角色也各摸一张牌`,
              filterTarget(card, player, target) {
                return player !== target
              },
              selectTarget: [1, num],
              ai(target) {
                const player = get.player()
                let att =
                  get.attitude(player, target) /
                  Math.sqrt(1 + target.countCards("h"))
                if (target.hasSkillTag("nogain")) {
                  att /= 10
                }
                return att
              },
            })
            .forResult()

      if (!result?.bool || !result.targets?.length) {
        await player.draw()
        return
      }

      const targets = result.targets
      player.line(targets, "green")
      targets.push(player)
      await game.asyncDraw(targets.sortBySeat())
      await game.delayx()
    },
    subSkill: {
      blocker: {
        charlotte: true,
      },
    },
  },
  // 慎行
  shenxing: {
    audio: 2,
    enable: "phaseUse",
    position: "he",
    filterCard: true,
    selectCard: 2,
    prompt: "弃置两张牌并摸一张牌",
    check(card) {
      var player = _status.event.player
      if (
        !player.hasSkill("olbingyi") ||
        player.hasSkill("olbingyi_blocker", null, null, false)
      ) {
        return 4 - get.value(card)
      }
      var red = 0,
        black = 0,
        hs = player.getCards("h")
      for (var i of hs) {
        if (ui.selected.cards.includes(i)) {
          continue
        }
        var color = get.color(i, player)
        if (color === "red") {
          red++
        }
        if (color === "black") {
          black++
        }
      }
      if (red > 2 && black > 2) {
        return 4 - get.value(card)
      }
      if (red === 0 || black === 0) {
        return 8 - get.value(card)
      }
      var color = get.color(card)
      if (black <= red) {
        return (
          (color === "black" && get.position(card) === "h" ? 8 : 4) -
          get.value(card)
        )
      }
      return (
        (color === "red" && get.position(card) === "h" ? 8 : 4) -
        get.value(card)
      )
    },
    content() {
      player.draw()
    },
    ai: {
      order: 9,
      result: {
        player(player, target) {
          if (!ui.selected.cards.length) {
            return 1
          }
          if (
            !player.hasSkill("olbingyi") ||
            player.hasSkill("olbingyi_blocker", null, null, false)
          ) {
            return 1
          }
          var red = 0,
            black = 0,
            hs = player.getCards("h")
          for (var i of hs) {
            if (ui.selected.cards.includes(i)) {
              continue
            }
            var color = get.color(i)
            if (color === "red") {
              red++
            }
            if (color === "black") {
              black++
            }
          }
          var val = 0
          for (var i of ui.selected.cards) {
            val += get.value(i, player)
          }
          if (red === 0 || black === 0) {
            if (red + black === 0) {
              return 0
            }
            var num =
              Math.min(
                red + black,
                game.countPlayer(
                  (current) =>
                    current !== player &&
                    get.attitude(player, current) > 0 &&
                    !current.hasSkillTag("nogain"),
                ),
              ) + 1
            if (num * 7 > val) {
              return 1
            }
          }
          if (val < 8) {
            return 1
          }
          return 0
        },
      },
    },
  },
  // 兴学
  xingxue: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    direct: true,
    async content(event, trigger, player) {
      var num = player.hp
      if (!player.hasSkill("yanzhu")) {
        num = player.maxHp
      }
      const { targets, bool } = await player
        .chooseTarget([1, num], get.prompt2("xingxue"))
        .set("ai", (target) => {
          var att = get.attitude(_status.event.player, target)
          if (target.countCards("he")) {
            return att
          }
          return att / 10
        })
        .forResult()
      if (bool) {
        player.logSkill("xingxue", targets)
        const chooseToPutCard = async (target) => {
          await target.draw()
          if (target.countCards("he")) {
            const { cards, bool } = await target
              .chooseCard("选择一张牌置于牌堆顶", "he", true)
              .forResult()
            if (bool) {
              await target.lose(cards, ui.cardPile, "insert")
            }
            game.broadcastAll((player) => {
              var cardx = ui.create.card()
              cardx.classList.add("infohidden")
              cardx.classList.add("infoflip")
              player.$throw(cardx, 1000, "nobroadcast")
            }, target)
            if (player === game.me) {
              await game.delay(0.5)
            }
          }
        }
        await game.doAsyncInOrder(targets, chooseToPutCard)
      }
    },
  },
}

export default skills
