import { _status, game, get, lib, ui } from "wtk"
export const type = "mode"
/**
 * @type { () => importModeConfig }
 */
export default () => {
  return {
    name: "brawl",
    game: {
      syncMenu: true,
    },
    start() {
      ui.auto.hide()
      if (!lib.storage.scene) {
        lib.storage.scene = {}
      }
      if (!lib.storage.stage) {
        lib.storage.stage = {}
      }
      var dialog = ui.create.dialog("hidden")
      dialog.classList.add("fixed")
      dialog.classList.add("scroll1")
      dialog.classList.add("scroll2")
      dialog.classList.add("fullwidth")
      dialog.classList.add("fullheight")
      dialog.classList.add("noupdate")
      dialog.classList.add("character")
      dialog.contentContainer.style.overflow = "visible"
      dialog.style.overflow = "hidden"
      dialog.content.style.height = "100%"
      dialog.contentContainer.style.transition = "all 0s"
      if (!lib.storage.directStage) {
        dialog.open()
      }
      var packnode = ui.create.div(".packnode", dialog)
      lib.setScroll(packnode)
      var clickCapt = function () {
        var active = this.parentNode.querySelector(".active")
        if (this.link === "stage") {
          if (get.is.empty(lib.storage.scene)) {
            alert("请创建至少1个场景")
            return
          }
        }
        if (active) {
          if (active === this) {
            return
          }
          for (var i = 0; i < active.nodes.length; i++) {
            active.nodes[i].remove()
            if (active.nodes[i].showcaseinterval) {
              clearInterval(active.nodes[i].showcaseinterval)
              delete active.nodes[i].showcaseinterval
            }
          }
          active.classList.remove("active")
        }
        this.classList.add("active")
        for (var i = 0; i < this.nodes.length; i++) {
          dialog.content.appendChild(this.nodes[i])
        }
        var showcase = this.nodes[this.nodes.length - 1]
        showcase.style.height = `${dialog.content.offsetHeight - showcase.offsetTop}px`
        if (typeof showcase.action === "function") {
          if (showcase.action(!showcase._showcased) !== false) {
            showcase._showcased = true
          }
        }
        if (this._nostart) {
          start.style.display = "none"
        } else {
          start.style.display = ""
        }
        game.save("currentBrawl", this.link)
      }
      var createNode = (name) => {
        var info = lib.brawl[name]
        var node = ui.create.div(
          ".dialogbutton.menubutton.large",
          info.name,
          packnode,
          clickCapt,
        )
        node.style.transition = "all 0s"
        var caption = info.name
        var modeinfo = ""
        if (info.mode) {
          modeinfo = `${get.translation(info.mode)}模式`
        }
        if (info.submode) {
          if (modeinfo) {
            modeinfo += " - "
          }
          modeinfo += info.submode
        }
        var intro
        if (Array.isArray(info.intro)) {
          intro = '<ul style="text-align:left;margin-top:0;width:450px">'
          if (modeinfo) {
            intro += `<li>${modeinfo}`
          }
          for (var i = 0; i < info.intro.length; i++) {
            intro += `<li>${info.intro[i]}`
          }
        } else {
          intro = ""
          if (modeinfo) {
            intro += `（${modeinfo}）`
          }
          intro += info.intro
        }
        var showcase = ui.create.div()
        showcase.style.margin = "0px"
        showcase.style.padding = "0px"
        showcase.style.width = "100%"
        showcase.style.display = "block"
        showcase.action = info.showcase
        showcase.link = name
        if (info.fullshow) {
          node.nodes = [showcase]
          showcase.style.height = "100%"
        } else {
          node.nodes = [
            ui.create.div(".caption", caption),
            ui.create.div(".text center", intro),
            showcase,
          ]
        }
        node.link = name
        node._nostart = info.nostart
        if (lib.storage.currentBrawl === name) {
          clickCapt.call(node)
        }
        return node
      }
      var clickStart = function () {
        var active = packnode.querySelector(".active")
        if (active) {
          for (var i = 0; i < active.nodes.length; i++) {
            if (active.nodes[i].showcaseinterval) {
              clearInterval(active.nodes[i].showcaseinterval)
              delete active.nodes[i].showcaseinterval
            }
          }
          var info
          if (active.link.indexOf("stage_") === 0) {
            var level
            if (Array.isArray(arguments[0])) {
              level = { index: arguments[0][1] }
            } else {
              level = dialog.content.querySelector(".menubutton.large.active")
            }
            if (level) {
              var stagesave = lib.storage.stage
              var stage = stagesave[active.link.slice(6)]
              game.save("lastStage", level.index)
              if (stage.mode === "loopTest") {
                //console.log('关卡 lastStage: ', level.index, stage);
                var SSS = localStorage.getItem("SSS")
                if (!SSS) {
                  SSS = 1
                }
                var NNN = ui.create.system(
                  `LV${level.index + 1}/${SSS}`,
                  null,
                  true,
                )
              }
              lib.onover.push((bool) => {
                _status.createControl = ui.controls[0]
                //lib.storage.stage[stage.name] = stage;
                //console.log('关卡 场景对局结果: ', bool, level.index + 1, stage.scenes.length);
                if (stage.mode === "loopTest") {
                  //console.log('关卡 自动进入下一Scene场景', level.index, stage.scenes);
                  game.delay(1, 1500)
                  //next_level.click();
                  if (level.index + 1 < stage.scenes.length) {
                    game.save(
                      "directStage",
                      [stage.name, level.index + 1],
                      "brawl",
                    )
                  } else {
                    game.save("directStage", [stage.name, 0], "brawl")
                    var SSS = localStorage.getItem("SSS")
                    if (!SSS) {
                      SSS = 1
                    } else {
                      SSS = Number(SSS) + 1
                    }
                    //当前通关数
                    localStorage.setItem("SSS", SSS)
                  }
                  localStorage.setItem(`${lib.configprefix}directstart`, true)
                  game.reload()
                }

                if (bool && level.index + 1 < stage.scenes.length) {
                  ui.create.control("下一关", () => {
                    game.save(
                      "directStage",
                      [stage.name, level.index + 1],
                      "brawl",
                    )
                    localStorage.setItem(`${lib.configprefix}directstart`, true)
                    game.reload()
                  })
                  if (level.index + 1 > stage.level) {
                    stage.level = level.index + 1
                    game.save("stage", stagesave, "brawl")
                  }
                  if (stage.mode !== "sequal") {
                    game.save("lastStage", level.index + 1, "brawl")
                  }
                } else {
                  ui.create.control("重新开始", () => {
                    if (
                      stage.mode === "sequal" &&
                      bool &&
                      level.index === stage.scenes.length - 1
                    ) {
                      game.save("directStage", [stage.name, 0], "brawl")
                    } else {
                      game.save(
                        "directStage",
                        [stage.name, level.index],
                        "brawl",
                      )
                    }
                    localStorage.setItem(`${lib.configprefix}directstart`, true)
                    game.reload()
                  })
                  if (
                    stage.mode === "sequal" &&
                    level.index === stage.scenes.length - 1
                  ) {
                    stage.level = 0
                    game.save("stage", stagesave, "brawl")
                  }
                  if (stage.mode !== "sequal") {
                    game.save("lastStage", level.index, "brawl")
                  }
                }
                delete _status.createControl
              })
              var scene = stage.scenes[level.index]
              info = {
                name: scene.name,
                intro: scene.intro,
              }
              for (var i in lib.brawl.scene.template) {
                info[i] = get.copy(lib.brawl.scene.template[i])
              }
              if (!scene.gameDraw) {
                info.content.noGameDraw = true
              }
              info.content.scene = scene
            } else {
              return
            }
          } else {
            info = lib.brawl[active.link]
          }
          lib.translate.restart = "返回"
          dialog.delete()
          ui.brawlinfo = ui.create.system("乱斗", null, true)
          lib.setPopped(
            ui.brawlinfo,
            () => {
              var uiintro = ui.create.dialog("hidden")
              uiintro.add(info.name)
              var intro
              if (Array.isArray(info.intro)) {
                intro = '<ul style="text-align:left;margin-top:0;width:450px">'
                for (var i = 0; i < info.intro.length; i++) {
                  intro += `<li>${info.intro[i]}`
                }
                intro += "</ul>"
              } else {
                intro = info.intro
              }
              uiintro.add(`<div class="text center">${intro}</div>`)
              var ul = uiintro.querySelector("ul")
              if (ul) {
                ul.style.width = "180px"
              }
              uiintro.add(ui.create.div(".placeholder"))
              return uiintro
            },
            250,
          )
          ui.auto.show()
          _status.brawl = info.content
          game.switchMode(info.mode)
          if (info.init) {
            info.init()
          }
          if (stage && stage.mode === "loopTest") {
            //console.log("关卡开局就托管：brawl", info, stage);
            ui.click.auto()
          }
        }
      }
      var start = ui.create.div(
        ".menubutton.round.highlight",
        "斗",
        dialog.content,
        clickStart,
      )
      start.style.position = "absolute"
      start.style.left = "auto"
      start.style.right = "10px"
      start.style.top = "auto"
      start.style.bottom = "10px"
      start.style.width = "80px"
      start.style.height = "80px"
      start.style.lineHeight = "80px"
      start.style.margin = "0"
      start.style.padding = "5px"
      start.style.fontSize = "72px"
      start.style.zIndex = 3
      start.style.transition = "all 0s"
      game.addScene = (name, clear) => {
        var scene = lib.storage.scene[name]
        var brawl = {
          name: name,
          intro: scene.intro,
        }
        for (var i in lib.brawl.scene.template) {
          brawl[i] = get.copy(lib.brawl.scene.template[i])
        }
        if (!scene.gameDraw) {
          brawl.content.noGameDraw = true
        }
        brawl.content.scene = scene
        lib.brawl[`scene_${name}`] = brawl
        var node = createNode(`scene_${name}`)
        if (clear) {
          game.addSceneClear()
          clickCapt.call(node)
          _status.sceneChanged = true
        }
      }
      game.addStage = (name, clear) => {
        var stage = lib.storage.stage[name]
        var brawl = {
          name: name,
          intro: stage.intro,
          content: {},
        }
        for (var i in lib.brawl.stage.template) {
          brawl[i] = get.copy(lib.brawl.stage.template[i])
        }
        brawl.content.stage = stage
        lib.brawl[`stage_${name}`] = brawl
        var node = createNode(`stage_${name}`)
        if (clear) {
          game.addStageClear()
          clickCapt.call(node)
        }
      }
      game.removeScene = (name) => {
        delete lib.storage.scene[name]
        game.save("scene", lib.storage.scene)
        _status.sceneChanged = true
        for (var i = 0; i < packnode.childElementCount; i++) {
          if (packnode.childNodes[i].link === `scene_${name}`) {
            if (packnode.childNodes[i].classList.contains("active")) {
              for (var j = 0; j < packnode.childElementCount; j++) {
                if (packnode.childNodes[j].link === "scene") {
                  clickCapt.call(packnode.childNodes[j])
                }
              }
            }
            packnode.childNodes[i].remove()
            break
          }
        }
      }
      game.removeStage = (name) => {
        delete lib.storage.stage[name]
        game.save("stage", lib.storage.stage)
        for (var i = 0; i < packnode.childElementCount; i++) {
          if (packnode.childNodes[i].link === `stage_${name}`) {
            if (packnode.childNodes[i].classList.contains("active")) {
              for (var j = 0; j < packnode.childElementCount; j++) {
                if (get.is.empty(lib.storage.scene)) {
                  if (packnode.childNodes[j].link === "scene") {
                    clickCapt.call(packnode.childNodes[j])
                  }
                } else {
                  if (packnode.childNodes[j].link === "stage") {
                    clickCapt.call(packnode.childNodes[j])
                  }
                }
              }
            }
            packnode.childNodes[i].remove()
            break
          }
        }
      }
      var sceneNode
      for (var i in lib.brawl) {
        if (get.config(i) === false) {
          continue
        }
        if (i === "scene") {
          sceneNode = createNode(i)
        } else {
          createNode(i)
        }
      }
      if (sceneNode) {
        game.switchScene = () => {
          clickCapt.call(sceneNode)
        }
      }
      for (var i in lib.storage.scene) {
        game.addScene(i)
      }
      for (var i in lib.storage.stage) {
        game.addStage(i)
      }
      if (!lib.storage.currentBrawl) {
        clickCapt.call(packnode.firstChild)
      }
      game.save("lastStage")
      if (lib.storage.directStage) {
        var directStage = lib.storage.directStage
        game.save("directStage")
        clickStart(directStage)
      }
      lib.init.onfree()
    },
    brawl: {
      huanhuazhizhan: {
        name: "幻化之战",
        mode: "identity",
        intro: [
          "杀死所有其他角色，成为最后的存活者",
          "所有角色改为四血白板，依靠灵力值获得技能。灵力值可以通过各种方式获得",
        ],
        showcase: function (init) {
          if (init) {
            this.nodes = []
          } else {
            while (this.nodes.length) {
              this.nodes.shift().remove()
            }
          }
          var lx = this.offsetWidth / 2 - 120
          var ly = Math.min(lx, this.offsetHeight / 2 - 60)
          var setPos = (node) => {
            var i = node.index
            var deg = (Math.PI / 4) * i
            var dx = Math.round(lx * Math.cos(deg))
            var dy = Math.round(ly * Math.sin(deg))
            node.style.transform = `translate(${dx}px,${dy}px)`
          }
          var characterz = [
            "guyong",
            "litong",
            "mazhong",
            "fuwan",
            "chengpu",
            "liaohua",
            "xinxianying",
            "liuyu",
          ]
          for (var i = 0; i < 8; i++) {
            var node = ui.create.player(null, true)
            this.nodes.push(node)
            node.init(characterz[i])
            node.classList.add("minskin")
            node.node.marks.remove()
            node.node.hp.remove()
            node.node.count.remove()
            node.style.left = "calc(50% - 60px)"
            node.style.top = "calc(50% - 60px)"
            node.index = i
            node.style.borderRadius = "100%"
            node.node.avatar.style.borderRadius = "100%"
            node.node.name.remove()
            setPos(node)
            this.appendChild(node)
          }
          var nodes = this.nodes
          this.showcaseinterval = setInterval(() => {
            for (var i = 0; i < nodes.length; i++) {
              nodes[i].index++
              if (nodes[i].index > 7) {
                nodes[i].index = 0
              }
              setPos(nodes[i])
            }
          }, 1000)
        },
        init: () => {},
        content: {
          submode: "normal",
          chooseCharacterBefore: () => {
            game.identityVideoName = "幻化之战"
            var skills = []
            var banned = [
              "xinfu_guhuo",
              "reguhuo",
              "jixi",
              "duanchang",
              "huashen",
              "xinsheng",
              "rehuashen",
              "rexinsheng",
              "jinqu",
              "nzry_binglve",
              "nzry_huaiju",
              "nzry_yili",
              "nzry_zhenglun",
              "nzry_mingren",
              "nzry_zhenliang",
              "drlt_qingce",
              "new_wuhun",
              "qixing",
              "kuangfeng",
              "dawu",
              "baonu",
              "wumou",
              "ol_wuqian",
              "ol_shenfen",
              "renjie",
              "jilue",
              "nzry_junlve",
              "nzry_dinghuo",
              "drlt_duorui",
              "chuanxin",
              "cunsi",
              "jueqing",
              "huilei",
              "paiyi",
              "fuhun",
              "zhuiyi",
              "olddanshou",
              "yanzhu",
              "juexiang",
              "jiexun",
              "bizhuan",
              "tongbo",
              "xinfu_zhanji",
              "xinfu_jijun",
              "xinfu_fangtong",
              "xinfu_qianchong",
              "pdgyinshi",
              "shuliang",
              "zongkui",
              "guju",
              "bmcanshi",
              "dingpan",
              "xinfu_lingren",
              "new_luoyan",
              "junwei",
              "gxlianhua",
              "qizhou",
              "fenyue",
              "dianhu",
              "linglong",
              "fenxin",
              "mouduan",
              "cuorui",
              "xinmanjuan",
              "xinfu_jianjie",
              "jianjie_faq",
              "new_meibu",
              "xinfu_xingzhao",
              "jici",
              "xianfu",
              "fenyong",
              "xuehen",
              "midao",
              "yishe",
              "yinbing",
              "juedi",
              "bushi",
              "xinfu_dianhua",
              "xinfu_falu",
              "xinfu_zhenyi",
              "lskuizhu",
              "pingjian",
              "xjshijian",
              "fentian",
              "zhiri",
              "xindan",
              "xinzhengnan",
              "xinfu_xiaode",
              "komari_xueshang",
              "qiaosi_map",
            ]
            var characters = []
            for (var name in lib.character) {
              if (!lib.character[name]) {
                continue
              }
              if (lib.filter.characterDisabled(name)) {
                continue
              }
              if (name.indexOf("old_") === 0) {
                continue
              }
              var skillsx = lib.character[name][3].slice(0)
              lib.character[name].hp = 4
              lib.character[name].maxHp = 4
              lib.character[name].hujia = 0
              lib.character[name].skills = []
              lib.character[name].hasHiddenSkill = false
              characters.push(name)
              var list = skillsx.slice(0)
              for (var j = 0; j < skillsx.length; j++) {
                var info = get.info(skillsx[j])
                if (!info) {
                  skillsx.splice(j, 1)
                  list.splice(j--, 1)
                  continue
                }
                if (typeof info.derivation === "string") {
                  list.push(info.derivation)
                } else if (Array.isArray(info.derivation)) {
                  list.addArray(info.derivation)
                }
              }
              for (var j = 0; j < list.length; j++) {
                if (skills.includes(list[j]) || banned.includes(list[j])) {
                  continue
                }
                var info = get.info(list[j])
                if (
                  !info ||
                  info.zhuSkill ||
                  info.juexingji ||
                  info.charlotte ||
                  info.limited ||
                  info.hiddenSkill ||
                  info.dutySkill ||
                  info.groupSkill ||
                  info.ai?.combo
                ) {
                  continue
                }
                skills.push(list[j])
              }
            }
            _status.characterlist = characters
            var pack = {
              skills: skills,
              pack: {
                card: {
                  hhzz_toulianghuanzhu: {
                    enable: true,
                    fullskin: true,
                    recastable: true,
                    type: "trick",
                    filterTarget: (card, player, target) =>
                      target.skillH.length > 0,
                    content: () => {
                      target.removeSkillH(target.skillH.randomGet())
                      var skills = lib.huanhuazhizhan.skills
                      skills.randomSort()
                      for (var i = 0; i < skills.length; i++) {
                        if (!target.skillH.includes(skills[i])) {
                          target.addSkillH(skills[i])
                          break
                        }
                      }
                    },
                    ai: {
                      order: 10,
                      result: {
                        target: () => 0.5 - Math.random(),
                      },
                    },
                  },
                  hhzz_fudichouxin: {
                    enable: true,
                    fullskin: true,
                    type: "trick",
                    filterTarget: (card, player, target) =>
                      target.skillH.length > 0,
                    content: () => {
                      target.removeSkillH(target.skillH.randomGet())
                    },
                    ai: {
                      order: 10,
                      result: { target: -1 },
                    },
                  },
                },
                character: {
                  hhzz_shiona: {
                    sex: "female",
                    group: "key",
                    hp: 1,
                    skills: ["hhzz_huilei"],
                  },
                  hhzz_kanade: {
                    sex: "female",
                    group: "key",
                    hp: 2,
                    skills: ["hhzz_youlian"],
                  },
                  hhzz_takaramono1: {
                    sex: "male",
                    group: "qun",
                    hp: 5,
                    skills: ["hhzz_jubao", "hhzz_huizhen"],
                  },
                  hhzz_takaramono2: {
                    sex: "male",
                    group: "qun",
                    hp: 3,
                    skills: ["hhzz_jubao", "hhzz_zhencang"],
                  },
                },
                skill: {
                  _lingli_damage: {
                    trigger: { source: "damage" },
                    forced: true,
                    popup: false,
                    filter: (event, player) => event.player === player._toKill,
                    content: () => {
                      game.log(player, "对击杀目标造成了伤害")
                      player.changeLingli(trigger.num)
                    },
                  },
                  _lingli: {
                    mark: true,
                    marktext: "灵",
                    popup: "聚灵",
                    intro: {
                      name: "灵力",
                      content: "当前灵力点数：# / 5",
                    },
                    trigger: {
                      player: "phaseBeginStart",
                    },
                    prompt: "是否消耗2点灵力获得一个技能？",
                    filter: (event, player) => player.storage._lingli > 1,
                    check: (event, player) => player.skillH.length < 3,
                    content: () => {
                      "step 0"
                      player.changeLingli(-2)
                      ;("step 1")
                      event.skills = lib.huanhuazhizhan.skills
                      var skills = event.skills
                      skills.randomSort()
                      var list = []
                      for (var i = 0; i < skills[i].length; i++) {
                        if (!player.skillH.includes(skills[i])) {
                          list.push(skills[i])
                        }
                        if (list.length === 3) {
                          break
                        }
                      }
                      if (!list.length) {
                        event.finish()
                        return
                      }
                      if (player.storage._lingli > 0) {
                        list.push("刷新")
                      }
                      event.list = list
                      var dialog = game.getSkillDialog(
                        event.list,
                        "选择获得一个技能",
                      )
                      player
                        .chooseControl(event.list)
                        .set("ai", () => 0).dialog = dialog
                      ;("step 2")
                      if (result.control === "刷新") {
                        player.changeLingli(-1)
                        event.goto(1)
                        return
                      }
                      event.skill = result.control
                      if (player.skillH.length === 3) {
                        event.lose = true
                        player.chooseControl(player.skillH).prompt =
                          "选择失去1个已有技能"
                      }
                      ;("step 3")
                      if (event.lose) {
                        player.removeSkillH(result.control)
                      }
                      player.addSkillH(event.skill)
                    },
                  },
                  _lingli_round: {
                    trigger: { global: "roundStart" },
                    forced: true,
                    popup: false,
                    filter: (event, player) =>
                      _status._aozhan !== true && game.roundNumber > 1,
                    content: () => {
                      player.changeLingli(1)
                    },
                  },
                  _lingli_draw: {
                    enable: "phaseUse",
                    filter: (event, player) => player.storage._lingli > 0,
                    content: () => {
                      player.changeLingli(-1)
                      player.draw()
                    },
                    delay: 0,
                    ai: {
                      order: 10,
                      result: {
                        player: (player) =>
                          player.storage._lingli -
                            2 * (3 - player.skillH.length) >
                          0
                            ? 1
                            : 0,
                      },
                    },
                  },
                  _lingli_save: {
                    trigger: { target: "useCardToTargeted" },
                    forced: true,
                    popup: false,
                    filter: (event, player) =>
                      event.card.name === "tao" &&
                      player === event.player._toSave,
                    content: () => {
                      game.log(trigger.player, "帮助了保护目标")
                      trigger.player.changeLingli(1)
                    },
                  },
                  _hhzz_qiankunbagua: {
                    trigger: { player: "phaseAfter" },
                    forced: true,
                    forceDie: true,
                    popup: false,
                    filter: (event, player) =>
                      (_status._aozhan &&
                        !player.getStat("damage") &&
                        player.isAlive()) ||
                      event._lastDead !== undefined,
                    content: () => {
                      "step 0"
                      if (_status._aozhan && !player.getStat("damage")) {
                        player.loseHp()
                        player.changeLingli(1)
                        game.log(player, "本回合内未造成伤害，触发死战模式惩罚")
                      }
                      if (trigger._lastDead === undefined) {
                        event.goto(2)
                      }
                      ;("step 1")
                      var type = get.rand(1, 8)
                      event.type = type
                      trigger._lastDead.playerfocus(1200)
                      player.$fullscreenpop(
                        `乾坤八卦·${["离", "坎", "乾", "震", "兑", "艮", "巽", "坤"][type - 1]}`,
                        get.groupnature(trigger._lastDead.group, "raw"),
                      )
                      game.delay(1.5)
                      ;("step 2")
                      var type = event.type
                      switch (type) {
                        case 1: {
                          game.countPlayer((current) => {
                            current.loseHp()
                          })
                          break
                        }
                        case 2: {
                          game.countPlayer((current) => {
                            current.draw(2, "nodelay")
                          })
                          break
                        }
                        case 3: {
                          trigger._lastDead.revive(3)
                          trigger._lastDead.draw(3)
                          break
                        }
                        case 4: {
                          game.countPlayer((current) => {
                            var he = current.getCards("he")
                            if (he.length) {
                              current.discard(he.randomGet()).delay = false
                            }
                          })
                          break
                        }
                        case 5: {
                          game.countPlayer((current) => {
                            current.changeLingli(1)
                          })
                          break
                        }
                        case 6: {
                          var cards = []
                          game.countPlayer((current) => {
                            var card = get.cardPile(
                              (card) =>
                                !cards.includes(card) &&
                                get.type(card) === "equip",
                            )
                            if (card) {
                              cards.push(card)
                              current.$gain(card, "gain2")
                              current.gain(card)
                            }
                          })
                          break
                        }
                        case 7: {
                          game.countPlayer((current) => {
                            if (current.skillH.length < 3) {
                              var skills = lib.huanhuazhizhan.skills
                              skills.randomSort()
                              for (var i = 0; i < skills.length; i++) {
                                if (!current.skillH.includes(skills[i])) {
                                  current.addSkillH(skills[i])
                                  break
                                }
                              }
                            }
                          })
                          break
                        }
                        case 8: {
                          trigger._lastDead.revive(null, false)
                          trigger._lastDead.uninit()
                          trigger._lastDead.init(
                            [
                              "hhzz_shiona",
                              "hhzz_kanade",
                              "hhzz_takaramono1",
                              "hhzz_takaramono2",
                            ].randomGet(),
                          )
                          trigger._lastDead.skillH =
                            lib.character[trigger._lastDead.name][3].slice(0)
                          trigger._lastDead.addSkill("hhzz_noCard")
                          break
                        }
                      }
                      ;("step 3")
                      if (game.playerx().length <= 4 && !_status._aozhan) {
                        game.countPlayer2((current) => {
                          delete current._toKill
                          delete current._toSave
                        })
                        ui.huanhuazhizhan.innerHTML = "死战模式"
                        _status._aozhan = true
                        game.playBackgroundMusic()
                        trigger._lastDead.$fullscreenpop(
                          "死战模式",
                          get.groupnature(trigger._lastDead.group, "raw") ||
                            "fire",
                        )
                      } else {
                        game.randomMission()
                      }
                    },
                  },
                  hhzz_noCard: {
                    mod: {
                      cardEnabled: () => false,
                      cardSavable: () => false,
                      cardRespondable: () => false,
                    },
                  },
                  hhzz_huilei: {
                    trigger: { player: "die" },
                    forced: true,
                    forceDie: true,
                    skillAnimation: true,
                    logTarget: "source",
                    filter: (event, player) => event.source !== undefined,
                    content: () => {
                      var source = trigger.source
                      var cards = source.getCards("he")
                      if (cards.length) {
                        source.discard(cards)
                      }
                    },
                    ai: {
                      effect: {
                        target: (card, player, target) => {
                          if (get.tag(card, "damage")) {
                            return [-5, 0]
                          }
                        },
                      },
                    },
                  },
                  hhzz_youlian: {
                    trigger: { player: "die" },
                    forced: true,
                    forceDie: true,
                    skillAnimation: true,
                    logTarget: "source",
                    filter: (event, player) => event.source !== undefined,
                    content: () => {
                      var source = trigger.source
                      var cards = source.getCards("he")
                      if (cards.length) {
                        source.discard(cards)
                      }
                      var skills = source.skillH
                      if (skills.length) {
                        source.removeSkillH(skills.randomGet())
                      }
                    },
                    ai: {
                      effect: {
                        target: (card, player, target) => {
                          if (get.tag(card, "damage")) {
                            return [-5, 0]
                          }
                        },
                      },
                    },
                  },
                  hhzz_zhencang: {
                    trigger: { player: "die" },
                    forced: true,
                    filter: (event, player) => event.source !== undefined,
                    forceDie: true,
                    logTarget: "source",
                    content: () => {
                      var source = trigger.source
                      source.draw()
                      if (source.skillH.length === 3) {
                        source.removeSkillH(source.skillH.randomGet())
                      }
                      var skills = lib.huanhuazhizhan.skills
                      skills.randomSort()
                      for (var i = 0; i < skills.length; i++) {
                        if (!source.skillH.includes(skills[i])) {
                          source.addSkillH(skills[i])
                          break
                        }
                      }
                    },
                  },
                  hhzz_huizhen: {
                    trigger: { player: "die" },
                    forced: true,
                    forceDie: true,
                    logTarget: "source",
                    filter: (event, player) => event.source !== undefined,
                    content: () => {
                      var source = trigger.source
                      source.draw(3)
                      if (source.skillH.length === 3) {
                        source.removeSkillH(source.skillH.randomGet())
                      }
                      var skills = lib.huanhuazhizhan.skills
                      skills.randomSort()
                      for (var i = 0; i < skills.length; i++) {
                        if (!source.skillH.includes(skills[i])) {
                          source.addSkillH(skills[i])
                          break
                        }
                      }
                    },
                  },
                  hhzz_jubao: {
                    trigger: { player: "damage" },
                    forced: true,
                    logTarget: "source",
                    filter: (event, player) =>
                      event.source !== undefined && player.countCards("he") > 0,
                    content: () => {
                      var cards = player.getCards("he")
                      cards.randomSort()
                      cards = cards.slice(0, trigger.num)
                      trigger.source.gain("give", cards, player)
                    },
                    ai: {
                      effect: {
                        target: (card, player, target) => {
                          if (get.tag(card, "damage")) {
                            return [15, 0]
                          }
                        },
                      },
                    },
                  },
                },
                translate: {
                  _lingli: "聚灵",
                  _lingli_bg: "灵",
                  _lingli_draw: "聚灵",
                  hhzz_huilei: "挥泪",
                  hhzz_youlian: "犹怜",
                  hhzz_zhencang: "珍藏",
                  hhzz_huizhen: "汇珍",
                  hhzz_jubao: "聚宝",
                  hhzz_huilei_info: "锁定技，杀死你的角色弃置所有的牌。",
                  hhzz_youlian_info:
                    "锁定技，杀死你的角色弃置所有牌并随机失去一个技能。",
                  hhzz_zhencang_info:
                    "锁定技，杀死你的角色摸一张牌并随机获得一个技能(已满则先随机移除一个)。",
                  hhzz_huizhen_info:
                    "锁定技，杀死你的角色摸三张牌并随机获得一个技能(已满则先随机移除一个)。",
                  hhzz_jubao_info:
                    "锁定技，当你受到伤害的点数确定时，伤害来源随机获得你区域内的X张牌（X为伤害点数）。",
                  hhzz_shiona: "汐奈",
                  hhzz_kanade: "立华奏",
                  hhzz_takaramono1: "坚实宝箱",
                  hhzz_takaramono2: "普通宝箱",
                  hhzz_toulianghuanzhu: "偷梁换柱",
                  hhzz_fudichouxin: "釜底抽薪",
                  hhzz_toulianghuanzhu_info:
                    "出牌阶段，对一名角色使用，随机更换其一个技能。可重铸。",
                  hhzz_fudichouxin_info:
                    "出牌阶段，对一名角色使用，随机弃置其一个技能。",
                  nei: " ",
                  nei2: " ",
                  刷新_info: "消耗1点灵力值，刷新上述技能。",
                },
              },
              get: {
                rawAttitude: (from, to) => {
                  if (from === to || to === from._toSave) {
                    return 10
                  }
                  if (to === from._toKill) {
                    return -30
                  }
                  return -10
                },
              },
              eltc: {
                gameDraw: () => {
                  var end = player
                  var numx
                  var num = (player) => (player._hSeat > 5 ? 5 : 4)
                  do {
                    if (typeof num === "function") {
                      numx = num(player)
                    }
                    if (player._hSeat > 6) {
                      player.changeLingli(1)
                    }
                    const cards = get.cards(numx)
                    player.directgain(cards)
                    player._start_cards = cards
                    player = player.next
                  } while (player !== end)
                },
              },
              eltp: {
                addSkillH: function (skill) {
                  this.skillH.add(skill)
                  this.addSkillLog.apply(this, arguments)
                },
                removeSkillH: function (skill) {
                  this.skillH.remove(skill)
                  game.log(
                    this,
                    "失去了技能",
                    `#g【${get.translation(skill)}】`,
                  )
                  this.removeSkill(skill)
                },
                dieAfter: function () {
                  var evt = _status.event.getParent("phase")
                  if (evt) {
                    evt._lastDead = this
                  }
                  if (game.playerx().length === 1) {
                    game.over(game.me.isAlive())
                  }
                },
                $dieAfter: () => {},
                hasUnknown: () => false,
                isUnknown: () => false,
                getEnemies: function () {
                  var list = game.playerx()
                  list.remove(this)
                  return list
                },
                dieAfter2: function (source) {
                  if (source && this.name.indexOf("hhzz_") !== 0) {
                    if (source._toKill === this) {
                      game.log(source, "击杀目标成功")
                    }
                    source.draw(this === source._toKill ? 2 : 1)
                    source.changeLingli(this === source._toKill ? 3 : 2)
                  }
                  if (!_status._aozhan) {
                    game.countPlayer((current) => {
                      if (current._toSave === this) {
                        game.log(current, "保护失败")
                        var cards = current.getCards("he")
                        if (cards.length) {
                          current.discard(cards.randomGets(4))
                        }
                      }
                    })
                  }
                },
                logAi: () => {},
                changeLingli: function (num) {
                  if (typeof num !== "number") {
                    num = 1
                  }
                  if (typeof this.storage._lingli !== "number") {
                    this.storage._lingli = 0
                  }
                  if (num > 0) {
                    num = Math.min(num, 5 - this.storage._lingli)
                    if (num < 1) {
                      return
                    }
                    game.log(this, "获得了", `#y${get.cnNumber(num)}点`, "灵力")
                  } else {
                    if (-num > this.storage._lingli) {
                      num = -this.storage._lingli
                    }
                    if (num === 0) {
                      return
                    }
                    game.log(
                      this,
                      "失去了",
                      `#y${get.cnNumber(-num)}点`,
                      "灵力",
                    )
                  }
                  this.storage._lingli += num
                  this.markSkill("_lingli")
                },
              },
              game: {
                playerx: () =>
                  game.filterPlayer((current) => {
                    if (current.name.indexOf("hhzz_") === 0) {
                      return
                    }
                    return true
                  }),
                randomMission: () => {
                  if (_status._aozhan) {
                    return
                  }
                  if (!ui.huanhuazhizhan) {
                    ui.huanhuazhizhan = ui.create.div(
                      ".touchinfo.left",
                      ui.window,
                    )
                    if (ui.time3) {
                      ui.time3.style.display = "none"
                    }
                  }
                  var players = game.playerx()
                  for (var i = 0; i < players.length; i++) {
                    var player = players[i]
                    var list = players.slice(0).randomSort()
                    list.remove(player)
                    player._toKill = list[0]
                    player._toSave = list[1]
                  }
                  ui.huanhuazhizhan.innerHTML = `击杀${get.translation(game.me._toKill)}，保护${get.translation(game.me._toSave)}`
                },
                getSkillDialog: (skills, prompt) => {
                  var dialog = ui.create.dialog("hidden", "forcebutton")
                  if (prompt) {
                    dialog.addText(prompt)
                  }
                  for (var i = 0; i < skills.length; i++) {
                    dialog.add(
                      `<div class="popup pointerdiv" style="width:80%;display:inline-block"><div class="skill">【${get.translation(skills[i])}】</div><div>${lib.translate[`${skills[i]}_info`]}</div></div>`,
                    )
                  }
                  dialog.addText(" <br> ")
                  return dialog
                },
                chooseCharacter: () => {
                  var next = game.createEvent("chooseCharacter")
                  next.showConfig = true
                  next.setContent(() => {
                    "step 0"
                    game.zhu = game.players.randomGet()
                    var i = 1
                    var current = game.zhu
                    while (true) {
                      current.skillH = []
                      current._hSeat = i
                      current.identity = "nei"
                      current.setNickname(`${get.cnNumber(i, true)}号位`)
                      for (var ii in lib.huanhuazhizhan.eltp) {
                        current[ii] = lib.huanhuazhizhan.eltp[ii]
                      }
                      current = current.next
                      i++
                      if (current === game.zhu) {
                        break
                      }
                    }
                    ui.arena.classList.add("choose-character")
                    game.me.chooseButton(
                      [
                        "请选择角色形象",
                        [_status.characterlist.randomRemove(5), "character"],
                      ],
                      true,
                    ).onfree = true
                    ;("step 1")
                    game.me.init(result.links[0])
                    var list = ["xiandeng", "shulv", "xisheng"]
                    game.me.chooseControl(list).dialog = game.getSkillDialog(
                      list,
                      "选择要获得的初始技能",
                    )
                    ;("step 2")
                    var list = [
                      "_lingli",
                      "_lingli_round",
                      "_lingli_draw",
                      "_lingli_save",
                      "_hhzz_qiankunbagua",
                      "_lingli_damage",
                    ]
                    for (var i = 0; i < list.length; i++) {
                      game.addGlobalSkill(list[i])
                    }
                    game.me.addSkillH(result.control)
                    game.countPlayer((current) => {
                      if (!current.name) {
                        current.init(_status.characterlist.randomRemove(1)[0])
                        current.addSkillH(
                          ["xiandeng", "shulv", "xisheng"].randomGet(),
                        )
                      }
                      current.storage._lingli = 0
                      current.markSkill("_lingli")
                    })
                    game.showIdentity(true)
                    ;("step 3")
                    game.randomMission()
                    var list = [
                      game.createCard("hhzz_fudichouxin"),
                      game.createCard("hhzz_toulianghuanzhu"),
                      game.createCard("hhzz_toulianghuanzhu"),
                      game.createCard("hhzz_toulianghuanzhu"),
                    ]
                    for (var i = 0; i < list.length; i++) {
                      ui.cardPile.insertBefore(
                        list[i],
                        ui.cardPile.childNodes[
                          get.rand(ui.cardPile.childElementCount)
                        ],
                      )
                    }
                    game.updateRoundNumber()
                    ;("step 4")
                    setTimeout(() => {
                      ui.arena.classList.remove("choose-character")
                    }, 500)
                    _status.videoInited = true
                    game.addVideo("arrangeLib", null, {
                      skill: {
                        _lingli_damage: {},
                        _lingli: {
                          mark: true,
                          marktext: "灵",
                          popup: "聚灵",
                          intro: {
                            name: "灵力",
                            content: "当前灵力点数：# / 5",
                          },
                        },
                        _lingli_round: {},
                        _lingli_draw: {},
                        _lingli_save: {},
                        hhzz_noCard: {},
                        hhzz_huilei: {
                          skillAnimation: true,
                        },
                        hhzz_youlian: {
                          skillAnimation: true,
                        },
                        hhzz_zhencang: {},
                        hhzz_huizhen: {},
                        hhzz_jubao: {},
                      },
                      card: {
                        hhzz_toulianghuanzhu: {
                          fullskin: true,
                        },
                        hhzz_fudichouxin: {
                          fullskin: true,
                        },
                      },
                      character: {
                        hhzz_shiona: {
                          sex: "female",
                          group: "key",
                          hp: 1,
                          skills: ["hhzz_huilei"],
                        },
                        hhzz_kanade: {
                          sex: "female",
                          group: "key",
                          hp: 2,
                          skills: ["hhzz_youlian"],
                        },
                        hhzz_takaramono1: {
                          sex: "male",
                          group: "qun",
                          hp: 5,
                          skills: ["hhzz_jubao", "hhzz_huizhen"],
                        },
                        hhzz_takaramono2: {
                          sex: "male",
                          group: "qun",
                          hp: 3,
                          skills: ["hhzz_jubao", "hhzz_zhencang"],
                        },
                      },
                      translate: {
                        _lingli: "聚灵",
                        _lingli_bg: "灵",
                        _lingli_draw: "聚灵",
                        hhzz_huilei: "挥泪",
                        hhzz_youlian: "犹怜",
                        hhzz_zhencang: "珍藏",
                        hhzz_huizhen: "汇珍",
                        hhzz_jubao: "聚宝",
                        hhzz_huilei_info: "锁定技，杀死你的角色弃置所有的牌。",
                        hhzz_youlian_info:
                          "锁定技，杀死你的角色弃置所有牌并随机失去一个技能。",
                        hhzz_zhencang_info:
                          "锁定技，杀死你的角色摸一张牌并随机获得一个技能(已满则先随机移除一个)。",
                        hhzz_huizhen_info:
                          "锁定技，杀死你的角色摸三张牌并随机获得一个技能(已满则先随机移除一个)。",
                        hhzz_jubao_info:
                          "锁定技，当你受到伤害的点数确定时，伤害来源随机获得你区域内的X张牌（X为伤害点数）。",
                        nei: " ",
                        nei2: " ",
                        hhzz_shiona: "汐奈",
                        hhzz_kanade: "立华奏",
                        hhzz_takaramono1: "坚实宝箱",
                        hhzz_takaramono2: "普通宝箱",
                        hhzz_toulianghuanzhu: "偷梁换柱",
                        hhzz_fudichouxin: "釜底抽薪",
                        hhzz_toulianghuanzhu_info:
                          "出牌阶段，对一名角色使用，随机更换其一个技能。可重铸。",
                        hhzz_fudichouxin_info:
                          "出牌阶段，对一名角色使用，随机弃置其一个技能。",
                      },
                    })
                  })
                },
              },
            }
            var func = (pack) => {
              for (var i in pack.pack) {
                for (var j in pack.pack[i]) {
                  lib[i][j] = pack.pack[i][j]
                }
              }
              for (var i in pack.eltc) {
                lib.element.content[i] = pack.eltc[i]
              }
              for (var i in pack.eltp) {
                lib.element.player[i] = pack.eltp[i]
              }
              for (var i in pack.game) {
                game[i] = pack.game[i]
              }
              for (var i in pack.get) {
                get[i] = pack.get[i]
              }
              lib.huanhuazhizhan = pack
            }
            func(pack)
          },
        },
      },
      new_huanhuazhizhan: {
        name: "幻化三国",
        mode: "identity",
        intro: [
          "所有角色受到1点伤害时，随机获得一张未加入游戏的武将牌，称为“副将”",
          "一名角色至多持有3个“副将”，超过数量上限时须将相应数量的“副将”放回武将牌堆",
          "玩家持有“副将”的所有技能",
        ],
        showcase: function (init) {
          let player
          const initPlayer = (name) => {
            const player = ui.create.player(null, true)
            player.node.avatar.style.backgroundSize = "cover"
            player.node.avatar.setBackground(name, "character")
            player.node.avatar.show()
            player.node.count.remove()
            player.node.hp.remove()
            player.style.transition = "all 0.5s"
            return player
          }
          if (init) {
            player = initPlayer("pot_yuji")
            player.style.left = "calc(50% - 75px)"
            player.style.top = "20px"
            player.nowName = "pot_yuji"
            this.appendChild(player)
            this.playernode = player
          } else {
            player = this.playernode
          }
          let num = 0,
            num2 = 0,
            nameList = [
              "pot_yuji",
              "ol_nanhualaoxian",
              "pot_yuji_shadow",
              "re_zuoci",
            ],
            names = game.initCharacterList()
          this.showcaseinterval = setInterval(() => {
            let dx, dy
            if (num2 % 5 === 0) {
              player.classList.add("zoomin3")
              player.hide()
              player.style.transitionDuration = "0.7s"
              setTimeout(() => {
                player.style.transitionProperty = "none"
                player.classList.remove("zoomin3")
                player.classList.add("zoomout2")
                setTimeout(() => {
                  player.style.transitionProperty = ""
                  player.classList.remove("zoomout2")
                  num++
                  const nowName = nameList[num % 4]
                  player.node.avatar.setBackground(nowName, "character")
                  player.show()
                }, 500)
              }, 700)
              for (var i = 0; i < 5; i++) {
                switch (i) {
                  case 0:
                    dx = -180
                    dy = 0
                    break
                  case 1:
                    dx = -140
                    dy = -100
                    break
                  case 2:
                    dx = 0
                    dy = 155
                    break
                  case 3:
                    dx = 140
                    dy = -100
                    break
                  case 4:
                    dx = 180
                    dy = 0
                    break
                }
                const card = initPlayer(names.randomGet())
                card.style.left = "calc(50% - 52px)"
                card.style.top = "68px"
                card.style.position = "absolute"
                card.style.margin = 0
                card.style.zIndex = 2
                card.style.opacity = 0
                this.appendChild(card)
                ui.refresh(card)
                card.style.opacity = 1
                card.style.transform = `translate(${dx}px,${dy}px)`
                setTimeout(
                  ((card) => () => {
                    card.delete()
                  })(card),
                  700,
                )
              }
            }
            num2++
          }, 700)
        },
        init: () => {
          game.identityVideoName = "三国杀·幻"
          var pack = {
            pack: {
              card: {
                hhsg_tianshu: {
                  cardcolor: "diamond",
                  type: "equip",
                  subtype: "equip5",
                  ai: {
                    basic: {
                      equipValue: 6.5,
                    },
                  },
                  skills: ["hhsg_tianshu_skill"],
                  fullskin: true,
                },
                hhsg_sadou: {
                  audio: true,
                  fullskin: true,
                  type: "trick",
                  enable: true,
                  selectTarget: -1,
                  cardcolor: "red",
                  toself: true,
                  filterTarget(card, player, target) {
                    return target === player
                  },
                  modTarget: true,
                  async content(event, trigger, player) {
                    await event.target.chooseToGainVice()
                  },
                  ai: {
                    wuxie(target, card, player, viewer) {
                      if (get.viceCharacter(target)?.length >= 3) {
                        return 0
                      }
                    },
                    basic: {
                      order: 7,
                      useful: 4.5,
                      value: 5,
                    },
                    result: {
                      target: 1,
                    },
                  },
                },
              },
              character: {
                hhsg_zuoci: {
                  sex: "male",
                  group: "qun",
                  hp: 3,
                  skills: ["hhsg_huashen", "hhsg_xinsheng"],
                },
                hhsg_yuji: {
                  sex: "male",
                  group: "qun",
                  hp: 3,
                  skills: ["hhsg_qianhuan", "hhsg_chanyuan"],
                },
                hhsg_nanhualaoxian: {
                  sex: "male",
                  group: "qun",
                  hp: 3,
                  skills: ["hhsg_jidao", "hhsg_feisheng", "hhsg_jinghe"],
                },
              },
              skill: {
                _gainViceCharacter: {
                  trigger: {
                    player: "damageBegin4",
                  },
                  markimage2: "image/character/shibing1.jpg",
                  intro: {
                    name: "副将",
                    name2: "副将",
                    markcount(_, player) {
                      return player?.viceCharacters?.length || 0
                    },
                    mark(dialog, _, player) {
                      const list = player?.viceCharacters ?? []
                      if (list.length) {
                        dialog.addText("当前副将")
                        dialog.add([list, "character"])
                      } else {
                        dialog.addText("无副将")
                      }
                    },
                  },
                  getIndex(event, player) {
                    return event.num
                  },
                  filter(event, player) {
                    return event.num > 0
                  },
                  forced: true,
                  popup: false,
                  async content(event, trigger, player) {
                    await player.chooseToGainVice()
                  },
                },
                hhsg_tianshu_skill: {
                  enable: "phaseUse",
                  usable: 1,
                  equipSkill: true,
                  filter(event, player) {
                    return player.hp > 1
                  },
                  manualConfirm: true,
                  async content(event, trigger, player) {
                    await player.damage()
                    await player.draw(2)
                  },
                  ai: {
                    order: 6,
                    result: {
                      player(player, target) {
                        return (
                          get.damageEffect(player) + (player.hp > 1 ? 2 : 1)
                        )
                      },
                    },
                  },
                },
                hhsg_huashen: {
                  enable: "phaseUse",
                  usable: 1,
                  filterTarget(card, player, target) {
                    return (
                      player !== target &&
                      target
                        .getStockSkills("千早爱音", "长崎素世")
                        .filter((skill) => {
                          if (player.hasSkill(skill, null, null, false)) {
                            return false
                          }
                          const info = get.info(skill)
                          return info && !info.charlotte
                        }).length
                    )
                  },
                  async content(event, trigger, player) {
                    const skills = event.target
                      .getStockSkills("千早爱音", "长崎素世")
                      .filter((skill) => {
                        if (player.hasSkill(skill, null, null, false)) {
                          return false
                        }
                        const info = get.info(skill)
                        return info && !info.charlotte
                      })
                    if (!skills.length) {
                      return
                    }
                    const result = await player
                      .chooseButton(["声明一个技能", [skills, "skill"]], true)
                      .set("ai", () => Math.random())
                      .forResult()
                    if (result.bool) {
                      await player.addTempSkills(result.links)
                    }
                  },
                  ai: {
                    order: 13,
                    result: {
                      player: 1,
                    },
                  },
                },
                hhsg_xinsheng: {
                  trigger: {
                    player: "phaseZhunbeiBegin",
                  },
                  init(player, skill) {
                    player.checkMainSkill(skill)
                  },
                  mainSkill: true,
                  filter(event, player) {
                    return get.viceCharacter(player)?.some((name) => {
                      return get.character(name, 3)?.every((skill) => {
                        return !get.info(skill)?.noRemoveVice
                      })
                    })
                  },
                  async cost(event, trigger, player) {
                    const result = await player
                      .chooseButton([
                        get.prompt(event.skill),
                        "移除一张副将，然后获得一个新的副将",
                        [get.viceCharacter(player), "character"],
                      ])
                      .set("filterButton", (button) => {
                        const { canRemove } = get.event()
                        return canRemove(button)
                      })
                      .set("canRemove", (button) => {
                        return get.character(button.link, 3)?.every((skill) => {
                          return !get.info(skill)?.noRemoveVice
                        })
                      })
                      .forResult()
                    if (result.bool) {
                      event.result = {
                        bool: true,
                        cost_data: result.links[0],
                      }
                    }
                  },
                  async content(event, trigger, player) {
                    await player.removeNewVice(event.cost_data)
                    await player.chooseToGainVice()
                  },
                },
                hhsg_qianhuan: {
                  trigger: {
                    player: "damageEnd",
                    target: "useCardToTarget",
                  },
                  filter(event, player) {
                    const cards = player.getExpansions("hhsg_qianhuan")
                    if (event.name === "damage") {
                      return player.countCards("he", (card) => {
                        return cards.every((cardx) => {
                          return get.suit(cardx) !== get.suit(card)
                        })
                      })
                    }
                    if (!["basic", "trick"].includes(get.type(event.card))) {
                      return false
                    }
                    if (event.targets?.length !== 1) {
                      return false
                    }
                    return cards.length
                  },
                  async cost(event, trigger, player) {
                    const cards = player.getExpansions(event.skill)
                    if (trigger.name === "damage") {
                      event.result = await player
                        .chooseCard(
                          get.prompt(event.skill),
                          "将一张牌置于武将牌上",
                          (card) => {
                            return !get.event().suits?.includes(get.suit(card))
                          },
                          "he",
                        )
                        .set(
                          "suits",
                          cards.map((card) => get.suit(card)),
                        )
                        .set("ai", (card) => 5 - get.value(card))
                        .forResult()
                    } else {
                      const result = await player
                        .chooseButton([
                          `###${get.prompt(event.skill)}###移去一张牌并令${get.translation(trigger.card)}对你无效`,
                          cards,
                        ])
                        .set("ai", (button) => {
                          if (get.event().eff < 0) {
                            return 1
                          }
                          return 0
                        })
                        .set(
                          "eff",
                          get.effect(
                            player,
                            trigger.card,
                            trigger.player,
                            player,
                          ),
                        )
                        .forResult()
                      if (result.bool) {
                        event.result = {
                          bool: true,
                          cost_data: result.links,
                        }
                      }
                    }
                  },
                  intro: {
                    mark(dialog, storage, player) {
                      const cards = player.getExpansions("hhsg_qianhuan")
                      if (player.isUnderControl(true)) {
                        dialog.addAuto(cards)
                      } else {
                        return `共有${get.cnNumber(cards.length)}张牌`
                      }
                    },
                    markcount: "expansion",
                  },
                  onremove(player, skill) {
                    const cards = player.getExpansions(skill)
                    if (cards?.length) {
                      player.loseToDiscardpile(cards)
                    }
                  },
                  async content(event, trigger, player) {
                    if (trigger.name === "damage") {
                      const next = player.addToExpansion(
                        event.cards,
                        "giveAuto",
                        player,
                      )
                      next.gaintag.add(event.name)
                      await next
                    } else {
                      await player.loseToDiscardpile(event.cost_data)
                      trigger.getParent().excluded.add(player)
                    }
                  },
                },
                hhsg_chanyuan: {
                  viceSkill: true,
                  init(player, skill) {
                    player.checkViceSkill(skill)
                  },
                  noRemoveVice: true,
                },
                hhsg_jidao: {
                  mainSkill: true,
                  init(player, skill) {
                    player.checkMainSkill(skill)
                  },
                  trigger: {
                    global: "removeViceAfter",
                  },
                  getIndex(event) {
                    return event.vices
                  },
                  logTarget: "player",
                  frequent: true,
                  async content(event, trigger, player) {
                    await player.draw()
                  },
                },
                hhsg_feisheng: {
                  viceSkill: true,
                  init(player, skill) {
                    player.checkViceSkill(skill)
                  },
                  trigger: {
                    player: "removeViceBegin",
                  },
                  getIndex(event) {
                    return event.vices
                  },
                  filter(event, player, _3, name) {
                    return get.character(name, 3)?.includes("hhsg_feisheng")
                  },
                  frequent: true,
                  async content(event, trigger, player) {
                    await player.chooseDrawRecover(
                      `###${get.translation(event.name)}###摸两张牌或回复1点体力`,
                      2,
                      true,
                    )
                  },
                },
                hhsg_jinghe: {
                  trigger: {
                    global: "chooseToGainViceBegin",
                  },
                  filter(event, player) {
                    return event.player !== player && !event.fromJinghe
                  },
                  logTarget: "player",
                  async content(event, trigger, player) {
                    trigger.set("formJinghe", true)
                    trigger.setContent(async (event, trigger, player) => {
                      const list = get.viceCharacterList()
                      if (!list.length) {
                        game.log("武将牌堆已经空了！")
                        return
                      }
                      const gains = list.randomGets(2)
                      const result = await player
                        .chooseButton(
                          [
                            "###经合###选择作为副将的武将牌",
                            [gains, "character"],
                          ],
                          true,
                        )
                        .forResult()
                      if (!result.bool) {
                        return
                      }
                      await player.gainNewVice(result.links)
                      const num = player.viceCharacters.length - 3
                      if (num > 0) {
                        await player.chooseToRemoveVice(num)
                      }
                    })
                  },
                },
              },
              translate: {
                _gainViceCharacter: "副将",
                hhsg_tianshu: "天书残卷",
                hhsg_tianshu_info:
                  "出牌阶段限一次，若你的体力值大于1，你可以对自己造成1点伤害，然后摸两张牌。",
                hhsg_sadou: "撒豆成兵",
                hhsg_sadou_info:
                  "出牌阶段，对你使用。你随机获得一张未加入游戏的武将牌作为副将。",
                hhsg_tianshu_skill: "天书残卷",
                hhsg_tianshu_skill_info:
                  "出牌阶段限一次，若你的体力值大于1，你可以对自己造成1点伤害，然后摸两张牌。",
                hhsg_zuoci: "幻左慈",
                hhsg_zuoci_prefix: "幻",
                hhsg_huashen: "化身",
                hhsg_huashen_info:
                  "出牌阶段限一次，你可以选择一名其他角色并声明其武将牌上的一个技能，然后你获得此技能直到回合结束。",
                hhsg_xinsheng: "新生",
                hhsg_xinsheng_info:
                  "主将技，准备阶段，你可以移去一张副将，然后随机获得一张未加入游戏的武将牌作为副将。",
                hhsg_yuji: "幻于吉",
                hhsg_yuji_prefix: "幻",
                hhsg_qianhuan: "千幻",
                hhsg_qianhuan_info:
                  "当你受到伤害后，可以将一张与“千幻”牌花色均不同的牌置于武将牌上。当你成为基本牌或普通锦囊牌的唯一目标时，可以移去一张“千幻”牌，令此牌对你无效。",
                hhsg_chanyuan: "缠怨",
                hhsg_chanyuan_info: "副将技，此武将牌不可被移除。",
                hhsg_nanhualaoxian: "幻南华老仙",
                hhsg_nanhualaoxian_prefix: "幻",
                hhsg_jidao: "祭祷",
                hhsg_jidao_info:
                  "主将技，一名角色移除武将牌时，你可以摸一张牌。",
                hhsg_feisheng: "飞升",
                hhsg_feisheng_info:
                  "副将技，此武将牌被移除时，你可以选择一项：1.恢复1点体力；2.摸两张牌。",
                hhsg_jinghe: "经合",
                hhsg_jinghe_info:
                  "一名其他角色即将获得副将时，你可以令其改为随机观看两张未加入游戏的武将牌，然后其选择一张作为获得的副将。",
              },
            },
            get: {
              viceCharacterList() {
                const list = (
                  _status.characterlist ?? game.initCharacterList()
                ).slice(0)
                game.filterPlayer2().forEach((current) => {
                  list.removeArray(get.nameList(current))
                  list.removeArray(get.viceCharacter(current))
                })
                return list
              },
              viceCharacter(player) {
                if (!player) {
                  return []
                }
                player.viceCharacters ??= []
                return player.viceCharacters
              },
            },
            eltc: {
              async chooseToRemoveVice(event, trigger, player) {
                player.viceCharacters ??= []
                const num = Math.min(event.num, player.viceCharacters.length)
                if (num <= 0) {
                  return
                }
                const result = await player
                  .chooseButton(
                    [
                      `选择移除${get.cnNumber(num)}名副将`,
                      [player.viceCharacters, "character"],
                    ],
                    num,
                    true,
                  )
                  .set("filterButton", (button) => {
                    const { canRemove } = get.event()
                    return canRemove(button)
                  })
                  .set("canRemove", (button) => {
                    return get.character(button.link, 3)?.every((skill) => {
                      return !get.info(skill)?.noRemoveVice
                    })
                  })
                  .forResult()
                if (result?.bool && result.links?.length) {
                  await player.removeNewVice(result.links)
                }
              },
              async chooseToGainVice(event, trigger, player) {
                const list = get.viceCharacterList()
                if (!list.length) {
                  game.log("武将牌堆已经空了！")
                  return
                }
                const gains = list.randomGets(event.num)
                await player.gainNewVice(gains)
                const num = player.viceCharacters.length - 3
                if (num > 0) {
                  await player.chooseToRemoveVice(num)
                }
              },
            },
            eltp: {
              updateVices() {
                this.viceCharacters ??= []
                if (this.viceCharacters.length) {
                  this.markSkill("_gainViceCharacter")
                } else {
                  this.unmarkSkill("_gainViceCharacter")
                }
              },
              checkViceSkill(skill, disable) {
                if (this.hasSkillTag("alwaysViceSkill")) {
                  return true
                }
                if (
                  get.viceCharacter(this).some((name) => {
                    return game
                      .expandSkills(get.character(name, 3).slice(0))
                      .includes(skill)
                  })
                ) {
                  return true
                }
                if (disable !== false) {
                  this.awakenSkill(skill)
                }
                return false
              },
              checkMainSkill(skill, disable) {
                if (this.hasSkillTag("alwaysMainSkill")) {
                  return true
                }
                if (
                  get.nameList(this).some((name) => {
                    return game
                      .expandSkills(get.character(name, 3).slice(0))
                      .includes(skill)
                  })
                ) {
                  return true
                }
                if (disable !== false) {
                  this.awakenSkill(skill)
                }
                return false
              },
              chooseToGainVice(num = 1) {
                const next = game.createEvent("chooseToGainVice")
                next.player = this
                next.num = num
                next.setContent("chooseToGainVice")
                return next
              },
              chooseToRemoveVice(num = 1) {
                const next = game.createEvent("chooseToRemoveVice")
                next.player = this
                next.num = num
                next.setContent("chooseToRemoveVice")
                return next
              },
              gainNewVice(vices) {
                if (!Array.isArray(vices)) {
                  vices = [vices]
                }

                this.viceCharacters ??= []
                this.viceCharacters.addArray(vices)
                game.broadcastAll(
                  (player, list) => {
                    const cards = []
                    for (let i = 0; i < list.length; i++) {
                      const cardname = `huashen_card_${list[i]}`
                      lib.card[cardname] = {
                        fullimage: true,
                        image: `character/${list[i]}`,
                      }
                      lib.translate[cardname] = get.rawName2(list[i])
                      const card = game.createCard(cardname, "", "")
                      card.setBackground(list[i], "character")
                      cards.push(card)
                    }
                    player.$draw(cards, "nobroadcast")
                  },
                  this,
                  vices,
                )
                game.log(
                  this,
                  "获得了",
                  "#g副将",
                  `#y${get.translation(vices)}`,
                )
                vices.forEach((name) => this.flashAvatar(null, name))
                const next = game.createEvent("gainVice")
                next.player = this
                next.vices = vices
                next.setContent(async (event, trigger, player) => {
                  game.broadcastAll((player, list) => {
                    player.viceCharacters = list
                  }, player.viceCharacters)
                  const skills = player.viceCharacters.reduce((list, name) => {
                    return list.addArray(get.character(name, 3))
                  }, [])
                  player.updateVices()
                  await player.addAdditionalSkills("_gainViceCharacter", skills)
                  await game.delayx(2)
                })
                return next
              },
              removeNewVice(vices) {
                if (!Array.isArray(vices)) {
                  vices = [vices]
                }

                this.viceCharacters ??= []
                this.viceCharacters.removeArray(vices)
                game.broadcastAll(
                  (player, list) => {
                    const cards = []
                    for (let i = 0; i < list.length; i++) {
                      const cardname = `huashen_card_${list[i]}`
                      lib.card[cardname] = {
                        fullimage: true,
                        image: `character/${list[i]}`,
                      }
                      lib.translate[cardname] = get.rawName2(list[i])
                      const card = game.createCard(cardname, "", "")
                      card.setBackground(list[i], "character")
                      cards.push(card)
                    }
                    player.$throw(cards, 1000, "nobroadcast")
                  },
                  this,
                  vices,
                )
                game.log(
                  this,
                  "移去了",
                  "#g副将",
                  `#y${get.translation(vices)}`,
                )
                const next = game.createEvent("removeVice")
                next.player = this
                next.vices = vices
                next.setContent(async (event, trigger, player) => {
                  game.broadcastAll((player, list) => {
                    player.viceCharacters = list
                  }, player.viceCharacters)
                  const skills = player.viceCharacters.reduce((list, name) => {
                    return list.addArray(get.character(name, 3))
                  }, [])
                  player.updateVices()
                  await player.addAdditionalSkills("_gainViceCharacter", skills)
                  await game.delayx(2)
                })
                return next
              },
            },
            game: {},
          }
          var func = (pack) => {
            for (var i in pack.pack) {
              for (var j in pack.pack[i]) {
                lib[i][j] = pack.pack[i][j]
              }
            }
            for (var i in pack.eltc) {
              lib.element.content[i] = pack.eltc[i]
            }
            for (var i in pack.eltp) {
              lib.element.player[i] = pack.eltp[i]
            }
            for (var i in pack.game) {
              game[i] = pack.game[i]
            }
            for (var i in pack.get) {
              get[i] = pack.get[i]
            }
            lib.new_huanhuazhizhan = pack
          }
          func(pack)
        },
        content: {
          cardPile: (list) => {
            for (let i = 0; i < list.length; i++) {
              if (list[i][2] === "muniu") {
                list[i][2] = "hhsg_tianshu"
              }
              if (
                list[i].containsAll("lebu", 6, "heart") ||
                list[i].containsAll("wuxie", "diamond", 12)
              ) {
                list[i][2] = "hhsg_sadou"
              }
            }
            return list
          },
        },
      },
      duzhansanguo: {
        name: "毒战三国",
        mode: "identity",
        intro: "牌堆中额外添加10%的毒",
        showcase: function (init) {
          var func = () => {
            var card = game.createCard("du", "noclick")
            this.nodes.push(card)
            card.style.position = "absolute"
            var rand1 = Math.round(Math.random() * 100)
            var rand2 = Math.round(Math.random() * 100)
            var rand3 = Math.round(Math.random() * 40) - 20
            card.style.left = `calc(${rand1}% - ${rand1}px)`
            card.style.top = `calc(${rand2}% - ${rand2}px)`
            card.style.transform = `scale(0.8) rotate(${rand3}deg)`
            card.style.opacity = 0
            this.appendChild(card)
            ui.refresh(card)
            card.style.opacity = 1
            card.style.transform = `scale(1) rotate(${rand3}deg)`
            if (this.nodes.length > 7) {
              setTimeout(() => {
                while (this.nodes.length > 5) {
                  this.nodes.shift().delete()
                }
              }, 500)
            }
          }
          if (init) {
            this.nodes = []
            for (var i = 0; i < 5; i++) {
              func()
            }
          }
          this.showcaseinterval = setInterval(func, 1000)
        },
        content: {
          cardPile: (list) => {
            game.identityVideoName = "毒战三国杀"
            lib.config.bannedcards.remove("du")
            if (game.bannedcards) {
              game.bannedcards.remove("du")
            }
            var num = Math.ceil(list.length / 10)
            while (num--) {
              list.push([
                ["heart", "diamond", "club", "spade"].randomGet(),
                Math.ceil(Math.random() * 13),
                "du",
              ])
            }
            return list
          },
        },
      },
      daozhiyueying: {
        name: "导师月英",
        mode: "identity",
        intro: "牌堆中所有普通锦囊牌数量翻倍；移除拥有集智技能的角色",
        showcase: function (init) {
          var player1, player2
          if (init) {
            player1 = ui.create.player(null, true).init("huangyueying")
            player2 = ui.create.player(null, true)
            if (lib.character.jsp_huangyueying) {
              player2.init("jsp_huangyueying")
            } else if (lib.character.re_huangyueying) {
              player2.init("re_huangyueying")
            } else {
              player2.init("huangyueying")
            }
            player1.style.left = "20px"
            player1.style.top = "20px"
            player1.style.transform = "scale(0.9)"
            player1.node.count.innerHTML = "2"
            player1.node.count.dataset.condition = "mid"
            player2.style.left = "auto"
            player2.style.right = "20px"
            player2.style.top = "20px"
            player2.style.transform = "scale(0.9)"
            player2.node.count.innerHTML = "2"
            player2.node.count.dataset.condition = "mid"
            this.appendChild(player1)
            this.appendChild(player2)
            this.player1 = player1
            this.player2 = player2
          } else {
            player1 = this.player1
            player2 = this.player2
          }

          var createCard = (wuxie) => {
            var card
            if (wuxie) {
              card = game.createCard("wuxie", "noclick")
              card.style.transform = "scale(0.9)"
            } else {
              card = ui.create.card(null, "noclick", true)
            }
            card.style.opacity = 0
            card.style.position = "absolute"
            card.style.zIndex = 2
            card.style.margin = 0
            return card
          }

          var func = () => {
            game.linexy(
              [
                player1.getLeft() + player1.offsetWidth / 2,
                player1.getTop() + player1.offsetHeight / 2,
                player2.getLeft() + player2.offsetWidth / 2,
                player2.getTop() + player2.offsetHeight / 2,
              ],
              this,
            )
            var card = createCard(true)
            card.style.left = "43px"
            card.style.top = "58px"
            this.appendChild(card)
            ui.refresh(card)
            card.style.opacity = 1
            card.style.transform = "scale(0.9) translate(137px,152px)"
            setTimeout(() => {
              card.delete()
            }, 1000)
            player1.node.count.innerHTML = "1"

            setTimeout(() => {
              if (!this.showcaseinterval) {
                return
              }
              player1.node.count.innerHTML = "2"
              var card = createCard()
              card.style.left = "43px"
              card.style.top = "58px"
              card.style.transform = "scale(0.9) translate(137px,152px)"
              this.appendChild(card)
              ui.refresh(card)
              card.style.opacity = 1
              card.style.transform = "scale(0.9)"
              setTimeout(() => {
                card.delete()
              }, 1000)
            }, 300)

            setTimeout(() => {
              if (!this.showcaseinterval) {
                return
              }
              player2.node.count.innerHTML = "1"
              game.linexy(
                [
                  player2.getLeft() + player2.offsetWidth / 2,
                  player2.getTop() + player2.offsetHeight / 2,
                  player1.getLeft() + player1.offsetWidth / 2,
                  player1.getTop() + player1.offsetHeight / 2,
                ],
                this,
              )
              var card = createCard(true)
              card.style.left = "auto"
              card.style.right = "43px"
              card.style.top = "58px"
              this.appendChild(card)
              ui.refresh(card)
              card.style.opacity = 1
              card.style.transform = "scale(0.9) translate(-137px,152px)"
              setTimeout(() => {
                card.delete()
              }, 700)

              setTimeout(() => {
                if (!this.showcaseinterval) {
                  return
                }
                player2.node.count.innerHTML = "2"
                var card = createCard()
                card.style.left = "auto"
                card.style.right = "43px"
                card.style.top = "58px"
                card.style.transform = "scale(0.9) translate(-137px,152px)"
                this.appendChild(card)
                ui.refresh(card)
                card.style.opacity = 1
                card.style.transform = "scale(0.9)"
                setTimeout(() => {
                  card.delete()
                }, 700)
              }, 300)
            }, 1000)
          }
          this.showcaseinterval = setInterval(func, 2200)
          func()
        },
        init: () => {
          for (const i in lib.character) {
            const { skills } = get.character(i),
              checked = []
            const check = (skill) => {
              if (checked.includes(skill)) {
                return false
              }
              checked.add(skill)
              if (lib.translate[skill] === "集智") {
                return true
              }
              let { derivation } = get.info(skill)
              if (!derivation) {
                return false
              }
              if (!Array.isArray(derivation)) {
                derivation = [derivation]
              }
              return derivation.some(check)
            }
            if (skills.some(check)) {
              get.character(i).isUnseen = true
            }
          }
        },
        content: {
          cardPile: (list) => {
            game.identityVideoName = "导师月英"
            var list2 = []
            for (var i = 0; i < list.length; i++) {
              list2.push(list[i])
              if (get.type(list[i][2]) === "trick") {
                list2.push(list[i])
              }
            }
            return list2
          },
        },
      },
      weiwoduzun: {
        name: "唯我独尊",
        mode: "identity",
        intro: [
          "牌堆中杀的数量增加30%",
          "游戏开始时，主公获得一枚战神标记",
          "拥有战神标记的角色杀造成的伤害+1",
          "受到杀造成的伤害后战神印记将移到伤害来源的武将牌上",
        ],
        showcase: function (init) {
          var player
          if (init) {
            player = ui.create.player(null, true)
            player.node.avatar.style.backgroundSize = "cover"
            player.node.avatar.setBackgroundImage(
              "image/mode/boss/character/boss_lvbu2.jpg",
            )
            player.node.avatar.show()
            player.style.left = "calc(50% - 75px)"
            player.style.top = "20px"
            player.node.count.remove()
            player.node.hp.remove()
            player.style.transition = "all 0.5s"
            this.appendChild(player)
            this.playernode = player
          } else {
            player = this.playernode
          }
          var num = 0
          var num2 = 0
          this.showcaseinterval = setInterval(() => {
            var dx, dy
            if (num2 % 5 === 0) {
              // player.addTempClass('target');
              // player.addTempClass('zoomin');
              player.classList.add("zoomin3")
              player.hide()
              player.style.transitionDuration = "0.7s"
              setTimeout(() => {
                player.style.transitionProperty = "none"
                player.classList.remove("zoomin3")
                player.classList.add("zoomout2")
                setTimeout(() => {
                  player.style.transitionProperty = ""
                  player.classList.remove("zoomout2")
                  player.show()
                }, 500)
              }, 700)
              for (var i = 0; i < 5; i++) {
                switch (i) {
                  case 0:
                    dx = -180
                    dy = 0
                    break
                  case 1:
                    dx = -140
                    dy = 100
                    break
                  case 2:
                    dx = 0
                    dy = 155
                    break
                  case 3:
                    dx = 140
                    dy = 100
                    break
                  case 4:
                    dx = 180
                    dy = 0
                    break
                }
                var card = game.createCard("sha", "noclick")
                card.style.left = "calc(50% - 52px)"
                card.style.top = "68px"
                card.style.position = "absolute"
                card.style.margin = 0
                card.style.zIndex = 2
                card.style.opacity = 0
                this.appendChild(card)
                ui.refresh(card)
                card.style.opacity = 1
                card.style.transform = `translate(${dx}px,${dy}px)`
                setTimeout(
                  ((card) => () => {
                    card.delete()
                  })(card),
                  700,
                )
              }
            }
            num2++
            if (num >= 5) {
              num = 0
            }
          }, 700)
        },
        init: () => {
          game.identityVideoName = "唯我独尊"
          lib.skill.weiwoduzun = {
            mark: true,
            intro: {
              content: "杀造成的伤害+1",
            },
            group: ["weiwoduzun_damage", "weiwoduzun_lose"],
            subSkill: {
              damage: {
                trigger: { source: "damageBegin" },
                forced: true,
                filter: (event) =>
                  event.card && event.card.name === "sha" && event.notLink(),
                content: () => {
                  trigger.num++
                },
              },
              lose: {
                trigger: { player: "damageEnd" },
                forced: true,
                filter: (event) => event.source?.isAlive(),
                content: () => {
                  player.removeSkill("weiwoduzun")
                  trigger.source.addSkill("weiwoduzun")
                },
              },
            },
          }
          lib.translate.weiwoduzun = "战神"
          lib.translate.weiwoduzun_bg = "尊"
        },
        content: {
          cardPile: (list) => {
            var num = 0
            for (var i = 0; i < list.length; i++) {
              if (list[i][2] === "sha") {
                num++
              }
            }
            num = Math.round(num * 0.3)
            if (num <= 0) {
              return list
            }
            while (num--) {
              var nature = ""
              var rand = Math.random()
              if (rand < 0.15) {
                nature = "fire"
              } else if (rand < 0.3) {
                nature = "thunder"
              }
              var suit = ["heart", "spade", "club", "diamond"].randomGet()
              var number = Math.ceil(Math.random() * 13)
              if (nature) {
                list.push([suit, number, "sha", nature])
              } else {
                list.push([suit, number, "sha"])
              }
            }
            return list
          },
          gameStart: () => {
            if (_status.mode === "zhong") {
              game.zhong.addSkill("weiwoduzun")
            } else {
              game.zhu.addSkill("weiwoduzun")
            }
          },
        },
      },
      tongxingzhizheng: {
        name: "同姓之争",
        mode: "versus",
        submode: "2v2",
        intro: "姓氏相同的武将组合一队",
        showcase: function (init) {
          var getList = () => {
            var list = [
              ["guanyu", "guanping", "guansuo", "guanyinping"],
              ["caocao", "caopi", "caozhi", "caorui"],
              ["liubei", "liushan", "liuchen"],
              ["re_xiahouyuan", "xiahouba", "xiahoushi"],
              ["sunjian", "sunquan", "sunce"],
              ["sp_zhangjiao", "re_zhangliang", "zhangbao"],
              ["zhugeliang", "zhugeguo", "zhugejin", "zhugeke"],
              ["mateng", "machao", "old_madai", "mayunlu"],
            ]
            list.randomSort()
            var list2 = []
            for (var i = 0; i < list.length; i++) {
              list2 = list2.concat(list[i])
            }
            this.list = list2
          }
          var func = () => {
            if (!this.list.length) {
              getList()
            }
            var card = ui.create.player(null, true)
            card.init(this.list.shift())
            card.node.marks.remove()
            card.node.count.remove()
            card.node.hp.remove()
            this.nodes.push(card)
            card.style.position = "absolute"
            var rand1 = Math.round(Math.random() * 100)
            var rand2 = Math.round(Math.random() * 100)
            var rand3 = Math.round(Math.random() * 40) - 20
            card.style.left = `calc(${rand1}% - ${rand1 * 1.5}px)`
            card.style.top = `calc(${rand2}% - ${rand2 * 1.8}px)`
            card.style.transform = `scale(1.2) rotate(${rand3}deg)`
            card.style.opacity = 0
            ui.refresh(card)
            this.appendChild(card)
            ui.refresh(card)
            card.style.transform = `scale(0.9) rotate(${rand3}deg)`
            card.style.opacity = 1
            if (this.nodes.length > 4) {
              setTimeout(() => {
                while (this.nodes.length > 3) {
                  this.nodes.shift().delete()
                }
              }, 500)
            }
          }
          this.list = []
          if (init) {
            this.nodes = []
            for (var i = 0; i < 3; i++) {
              func()
            }
          }
          this.showcaseinterval = setInterval(func, 1000)
        },
        init: () => {
          var map = {}
          var map3 = []
          for (var i in lib.character) {
            if (lib.filter.characterDisabled(i)) {
              continue
            }
            if (lib.character[i][1] === "key") {
              continue
            }
            var list = get.characterSurname(i)
            for (var j of list) {
              var surname = j[0]
              if (!surname) {
                continue
              }
              if (!map[surname]) {
                map[surname] = []
              }
              map[surname].push(i)
            }
          }
          for (var i in map) {
            if (map[i].length < 6) {
              delete map[i]
            } else {
              map3.push(i)
            }
          }
          _status.brawl.map = map
          _status.brawl.map3 = map3
        },
        content: {
          submode: "two",
          chooseCharacterFixed: true,
          chooseCharacter: (list, player) => {
            game.versusVideoName = "同姓之争"
            _status.noReplaceCharacter = true
            if (player.side === game.me.side) {
              if (_status.brawl.mylist) {
                return _status.brawl.mylist.randomGets(2)
              }
            } else {
              if (_status.brawl.enemylist) {
                return _status.brawl.enemylist.randomGets(2)
              }
            }
            var surname = _status.brawl.map3.randomRemove()
            var list = _status.brawl.map[surname]
            if (player === game.me) {
              _status.brawl.mylist = list
            } else {
              _status.brawl.enemylist = list
            }
            return list.randomRemove(3)
          },
        },
      },
      tongqueduopao: {
        name: "铜雀夺袍",
        mode: "identity",
        intro: [
          "主公必选曹操",
          "其余玩家从曹休、文聘、曹洪、张郃、夏侯渊、徐晃、许褚这些武将中随机选中一个",
          "游戏开始时将麒麟弓和爪黄飞电各置于每名角色的装备区内，大宛马洗入牌堆，移除其他的武器牌和坐骑牌",
        ],
        init: () => {
          game.saveConfig("player_number", "8", "identity")
          game.saveConfig("double_character", false, "identity")
        },
        showcase: function (init) {
          var list = [
            "re_caoxiu",
            "re_wenpin",
            "tw_re_caohong",
            "re_zhanghe",
            "ol_xiahouyuan",
            "ol_xuhuang",
            "re_xuzhu",
          ]
          list.randomSort()
          list.push("re_caocao")
          var func = () => {
            var card = ui.create.player(null, true)
            card.init(list.shift())
            card.node.marks.remove()
            card.node.count.remove()
            card.node.hp.remove()
            this.nodes.push(card)
            card.style.position = "absolute"
            card.style.zIndex = 2
            card.style.transition = "all 2s"
            var rand1 = Math.round(Math.random() * 100)
            var rand2 = Math.round(Math.random() * 100)
            var rand3 = Math.round(Math.random() * 40) - 20
            card.style.left = `calc(${rand1}% - ${rand1 * 1.5}px)`
            card.style.top = `calc(${rand2}% - ${rand2 * 1.8}px)`
            card.style.transform = `scale(0.8) rotate(${rand3}deg)`
            this.appendChild(card)
            ui.refresh(card)
          }

          var list2 = ["qilin", "dayuan", "zhuahuang"]
          var func2 = () => {
            var card = game.createCard(list2.shift(), "noclick")
            this.nodes.push(card)
            card.style.position = "absolute"
            card.style.zIndex = 2
            card.style.transition = "all 2s"
            var rand1 = Math.round(Math.random() * 100)
            var rand2 = Math.round(Math.random() * 100)
            var rand3 = Math.round(Math.random() * 40) - 20
            card.style.left = `calc(${rand1}% - ${rand1}px)`
            card.style.top = `calc(${rand2}% - ${rand2}px)`
            card.style.transform = `rotate(${rand3}deg)`
            this.appendChild(card)
            ui.refresh(card)
          }

          if (init) {
            this.nodes = []
          } else {
            while (this.nodes.length) {
              this.nodes.shift().remove()
            }
          }
          for (var i = 0; i < 5; i++) {
            func()
          }
          for (var i = 0; i < 3; i++) {
            func2()
            func()
          }
          var func3 = () => {
            for (var i = 0; i < this.nodes.length; i++) {
              var card = this.nodes[i]
              if (card.classList.contains("player")) {
                var rand1 = Math.round(Math.random() * 100)
                var rand2 = Math.round(Math.random() * 100)
                var rand3 = Math.round(Math.random() * 40) - 20
                card.style.left = `calc(${rand1}% - ${rand1 * 1.5}px)`
                card.style.top = `calc(${rand2}% - ${rand2 * 1.8}px)`
                card.style.transform = `scale(0.8) rotate(${rand3}deg)`
              } else {
                var rand1 = Math.round(Math.random() * 100)
                var rand2 = Math.round(Math.random() * 100)
                var rand3 = Math.round(Math.random() * 40) - 20
                card.style.left = `calc(${rand1}% - ${rand1}px)`
                card.style.top = `calc(${rand2}% - ${rand2}px)`
                card.style.transform = `rotate(${rand3}deg)`
              }
            }
          }
          // func3();
          // node.showcaseinterval=setInterval(func3,5000);
        },
        content: {
          cardPile: (list) => {
            for (var i = 0; i < list.length; i++) {
              var subtype = get.subtype(list[i][2])
              if (
                subtype === "equip1" ||
                subtype === "equip3" ||
                subtype === "equip4"
              ) {
                list.splice(i--, 1)
              }
            }
            for (var i = 0; i < 8; i++) {
              list.push([
                ["heart", "diamond", "club", "spade"].randomGet(),
                Math.ceil(Math.random() * 13),
                "dayuan",
              ])
            }
            return list
          },
          gameStart: () => {
            game.identityVideoName = "铜雀夺袍"
            for (var i = 0; i < game.players.length; i++) {
              game.players[i].$equip(game.createCard("qilin"))
              game.players[i].$equip(game.createCard("zhuahuang"))
            }
          },
          submode: "normal",
          list: [
            "re_caoxiu",
            "re_wenpin",
            "tw_re_caohong",
            "re_zhanghe",
            "ol_xiahouyuan",
            "ol_xuhuang",
            "re_xuzhu",
          ],
          chooseCharacterFixed: true,
          chooseCharacterAi: (player) => {
            if (player === game.zhu) {
              player.init("re_caocao")
            } else {
              _status.brawl.list.remove(game.me.name)
              player.init(_status.brawl.list.randomRemove())
            }
          },
          chooseCharacter: () => {
            _status.noReplaceCharacter = true
            if (game.me === game.zhu) {
              return ["re_caocao"]
            }
            _status.brawl.list.randomSort()
            return _status.brawl.list
          },
        },
      },
      // shenrudihou:{
      //	 name:'深入敌后',
      //	 mode:'versus',
      //	 submode:'1v1',
      //	 intro:'选将阶段选择武将和对战阶段选择上场的武将都由对手替你选择，而且你不知道对手为你选择了什么武将'
      // },
      tongjiangmoshi: {
        name: "同将模式",
        mode: "identity",
        intro: "玩家选择一个武将，所有角色均使用此武将",
        showcase: function (init) {
          if (init) {
            this.nodes = []
          } else {
            while (this.nodes.length) {
              this.nodes.shift().remove()
            }
          }
          var lx = this.offsetWidth / 2 - 120
          var ly = Math.min(lx, this.offsetHeight / 2 - 60)
          var setPos = (node) => {
            var i = node.index
            var deg = (Math.PI / 4) * i
            var dx = Math.round(lx * Math.cos(deg))
            var dy = Math.round(ly * Math.sin(deg))
            node.style.transform = `translate(${dx}px,${dy}px)`
          }
          for (var i = 0; i < 8; i++) {
            var node = ui.create.player(null, true)
            this.nodes.push(node)
            node.init("zuoci")
            node.classList.add("minskin")
            node.node.marks.remove()
            node.node.hp.remove()
            node.node.count.remove()
            node.style.left = "calc(50% - 60px)"
            node.style.top = "calc(50% - 60px)"
            node.index = i
            node.style.borderRadius = "100%"
            node.node.avatar.style.borderRadius = "100%"
            node.node.name.remove()
            setPos(node)
            this.appendChild(node)
          }
          var nodes = this.nodes
          this.showcaseinterval = setInterval(() => {
            for (var i = 0; i < nodes.length; i++) {
              nodes[i].index++
              if (nodes[i].index > 7) {
                nodes[i].index = 0
              }
              setPos(nodes[i])
            }
          }, 1000)
        },
        content: {
          gameStart: () => {
            game.identityVideoName = "同将模式"
            var target = _status.mode === "zhong" ? game.zhong : game.zhu
            if (get.config("double_character")) {
              target.init(game.me.name1, game.me.name2)
            } else {
              target.init(game.me.name1)
            }
            target.hp++
            target.maxHp++
            target.update()
            if (get.config("choose_group")) {
              var list = lib.group.slice(0)
              list.remove("shen")
              game.players.forEach((i) => {
                if (i.group === "shen" && i !== game.me) {
                  var group = list.randomGet()
                  i.group = group
                  i.node.name.dataset.nature = get.groupnature(group)
                  i.update()
                }
              })
            }
          },
          chooseCharacterAi: (player, list, list2, back) => {
            if (player === game.zhu) {
              return
            }
            if (get.config("double_character")) {
              player.init(game.me.name1, game.me.name2)
            } else {
              player.init(game.me.name1)
            }
          },
          chooseCharacter: (list, list2, num) => {
            if (game.me !== game.zhu) {
              return list.slice(0, list2)
            }
            if (_status.event.zhongmode) {
              return list.slice(0, 6)
            }
            return list.concat(list2.slice(0, num))
          },
          chooseCharacterBefore: () => {
            if (_status.mode === "purple") {
              _status.mode = "normal"
            }
          },
        },
      },
      jiazuzhizheng: {
        name: "家族之争",
        mode: "versus",
        submode: "2v2",
        intro: "势力相同的武将组合一队，获得专属势力技能",
        showcase: function (init) {
          var getList = () => {
            var list = [
              ["liubei", "guanyu", "zhangfei"],
              ["caocao", "guojia", "xunyu"],
              ["sunquan", "zhangzhang", "zhouyu"],
              ["re_yuanshao", "guotufengji", "yj_jushou"],
              ["jin_simayi", "jin_simazhao", "jin_wangyuanji"],
            ]
            if (_status.keyVerified) {
              list.push(["key_yuri", "key_yuzuru", "sp_key_kanade"])
            }
            list.randomSort()
            var list2 = []
            for (var i = 0; i < list.length; i++) {
              list2 = list2.concat(list[i])
            }
            this.list = list2
          }
          var func = () => {
            if (!this.list.length) {
              getList()
            }
            var card = ui.create.player(null, true)
            card.init(this.list.shift())
            card.node.marks.remove()
            card.node.count.remove()
            card.node.hp.remove()
            this.nodes.push(card)
            card.style.position = "absolute"
            var rand1 = Math.round(Math.random() * 100)
            var rand2 = Math.round(Math.random() * 100)
            var rand3 = Math.round(Math.random() * 40) - 20
            card.style.left = `calc(${rand1}% - ${rand1 * 1.5}px)`
            card.style.top = `calc(${rand2}% - ${rand2 * 1.8}px)`
            card.style.transform = `scale(1.2) rotate(${rand3}deg)`
            card.style.opacity = 0
            ui.refresh(card)
            this.appendChild(card)
            ui.refresh(card)
            card.style.transform = `scale(0.9) rotate(${rand3}deg)`
            card.style.opacity = 1
            if (this.nodes.length > 4) {
              setTimeout(() => {
                while (this.nodes.length > 3) {
                  this.nodes.shift().delete()
                }
              }, 500)
            }
          }
          this.list = []
          if (init) {
            this.nodes = []
            for (var i = 0; i < 3; i++) {
              func()
            }
          }
          this.showcaseinterval = setInterval(func, 1000)
        },
        init: () => {},
        content: {
          submode: "two",
          chooseCharacterFixed: true,
          chooseCharacterBefore: () => {
            _status.noReplaceCharacter = true
            game.versusVideoName = "家族之争"
            var map = {
              wei: [],
              shu: [],
              wu: [],
              qun: [],
              jin: [],
              key: [],
            }
            var map3 = []
            var banned = ["zuoci", "re_zuoci", "tw_xiahouba"]
            for (var i in lib.character) {
              if (
                lib.filter.characterDisabled2(i) ||
                lib.filter.characterDisabled(i) ||
                banned.includes(i)
              ) {
                continue
              }
              var group = lib.character[i][1]
              if (group && map[group]) {
                map[group].push(i)
              }
            }
            for (var i in map) {
              if (map[i].length < 8 || (i === "key" && !_status.keyVerified)) {
                delete map[i]
              } else {
                map3.push(i)
              }
            }
            _status.brawl.map = map
            _status.brawl.map3 = map3
            var skill = {
              _jiazu_wei: {
                trigger: { player: "phaseBegin" },
                direct: true,
                popup: "魏业",
                prompt2:
                  "回合开始时，你可以弃置一张牌并指定一名敌方角色，该角色须弃置一张牌，否则你摸一张牌。",
                filter: (event, player) =>
                  player.group === "wei" && player.countCards("he") > 0,
                content: () => {
                  "step 0"
                  player.chooseCardTarget({
                    prompt: get.prompt2(event.name),
                    filterCard: lib.filter.cardDiscardable,
                    filterTarget: (card, player, target) =>
                      player.side !== target.side,
                    position: "he",
                    ai1: (card) => 6 - get.value(card),
                    ai2: (target) => 1 / (1 + target.countCards("he")),
                  })
                  ;("step 1")
                  if (result.bool) {
                    player.logSkill(event.name, result.targets)
                    player.discard(result.cards)
                    result.targets[0].chooseToDiscard(
                      `弃置一张牌，或令${get.translation(player)}摸一张牌`,
                      "he",
                    ).ai = lib.skill.zhiheng.check
                  } else {
                    event.finish()
                  }
                  ;("step 2")
                  if (!result.bool) {
                    player.draw()
                  }
                },
              },
              _jiazu_shu: {
                popup: "蜀义",
                prompt2:
                  "你使用【杀】上限+1；出牌阶段结束时，若你于此阶段使用【杀】次数不少于2，摸一张牌。",
                mod: {
                  cardUsable: (card, player, num) => {
                    if (card.name === "sha" && player.group === "shu") {
                      return num + 1
                    }
                  },
                },
                trigger: { player: "phaseUseEnd" },
                forced: true,
                filter: (event, player) =>
                  player.group === "shu" &&
                  player.getHistory(
                    "useCard",
                    (evt) =>
                      evt.card &&
                      evt.card.name === "sha" &&
                      evt.getParent("phaseUse") === event,
                  ).length > 1,
                content: () => {
                  player.draw()
                },
              },
              _jiazu_wu: {
                trigger: { player: "phaseEnd" },
                forced: true,
                popup: "吴耀",
                prompt2:
                  "回合结束时，若你的手牌数不等于你的体力值，则你摸一张牌。",
                filter: (event, player) =>
                  player.group === "wu" && player.countCards("h") !== player.hp,
                content: () => {
                  player.draw()
                },
              },
              _jiazu_qun: {
                popup: "群心",
                prompt2:
                  "锁定技，弃牌阶段开始时，若你的手牌数比体力值多2或更多，你本回合手牌上限+1；若你已损失体力值大于1，你手牌上限+1",
                trigger: { player: "phaseDiscardBegin" },
                forced: true,
                filter: (event, player) =>
                  player.group === "qun" &&
                  (player.isDamaged() ||
                    player.countCards("h") - player.hp > 1),
                content: () => {
                  var num = 0
                  if (player.isDamaged()) {
                    num++
                  }
                  if (player.countCards("h") - player.hp > 1) {
                    num++
                  }
                  player.addMark("qunxin_temp", num, false)
                  player.addTempSkill("qunxin_temp", "phaseDiscardEnd")
                },
              },
              _jiazu_jin: {
                trigger: { player: "phaseDrawEnd" },
                popup: "晋势",
                prompt2:
                  "摸牌阶段结束时，你可以展示你于此阶段内因摸牌而得到的牌。若这些牌的花色均不同，则你摸一张牌。",
                filter: (event, player) => {
                  var hs = player.getCards("h")
                  return (
                    player.group === "jin" &&
                    hs.length > 0 &&
                    player.getHistory("gain", (evt) => {
                      if (
                        evt.getParent().name !== "draw" ||
                        evt.getParent("phaseDraw") !== event
                      ) {
                        return false
                      }
                      for (var i of evt.cards) {
                        if (hs.includes(i)) {
                          return true
                        }
                      }
                      return false
                    }).length > 0
                  )
                },
                check: (event, player) => {
                  var hs = player.getCards("h"),
                    cards = [],
                    suits = []
                  player.getHistory("gain", (evt) => {
                    if (
                      evt.getParent().name !== "draw" ||
                      evt.getParent("phaseDraw") !== event
                    ) {
                      return false
                    }
                    for (var i of evt.cards) {
                      if (hs.includes(i)) {
                        cards.add(i)
                        suits.add(get.suit(i, player))
                      }
                    }
                  })
                  return cards.length === suits.length
                },
                content: () => {
                  var hs = player.getCards("h"),
                    cards = [],
                    suits = []
                  player.getHistory("gain", (evt) => {
                    if (
                      evt.getParent().name !== "draw" ||
                      evt.getParent("phaseDraw") !== trigger
                    ) {
                      return false
                    }
                    for (var i of evt.cards) {
                      if (hs.includes(i)) {
                        cards.add(i)
                        suits.add(get.suit(i, player))
                      }
                    }
                  })
                  player.showCards(
                    cards,
                    `${get.translation(player)}发动了【晋势】`,
                  )
                  if (cards.length === suits.length) {
                    player.draw()
                  }
                },
              },
              _jiazu_key: {
                enable: "phaseUse",
                usable: 1,
                popup: "键魂",
                filter: (event, player) => player.group === "key",
                prompt2:
                  "出牌阶段限一次，你可以摸一张牌并获得1点护甲。若如此做，你于当前回合结束时失去1点体力。",
                content: () => {
                  "step 0"
                  player.draw()
                  ;("step 1")
                  player.changeHujia(1)
                  ;("step 2")
                  var evt = event.getParent("phase")
                  if (evt?.after) {
                    var next = player.loseHp()
                    event.next.remove(next)
                    evt.after.push(next)
                  }
                },
                ai: {
                  order: 10,
                  result: {
                    player: (player) => player.hp - 1,
                  },
                },
              },
              qunxin_temp: {
                noGlobal: true,
                onremove: true,
                mod: {
                  maxHandcard: (player, num) =>
                    num + player.countMark("qunxin_temp"),
                },
              },
              _jiazu_awaken_wei: {
                popup: "许昌",
                intro: {
                  content: "锁定技，当你受到伤害后，你摸一张牌。",
                },
                trigger: { player: "damageEnd" },
                forced: true,
                filter: (event, player) =>
                  player._jiazuAwaken && player.group === "wei",
                content: () => {
                  player.draw()
                },
              },
              _jiazu_awaken_shu: {
                popup: "成都",
                intro: {
                  content: "锁定技，当你使用【杀】造成伤害后，你摸一张牌。",
                },
                trigger: { source: "damageEnd" },
                forced: true,
                filter: (event, player) =>
                  player._jiazuAwaken &&
                  player.group === "shu" &&
                  event.card &&
                  event.card.name === "sha",
                content: () => {
                  player.draw()
                },
              },
              _jiazu_awaken_wu: {
                popup: "武昌",
                intro: {
                  content: "锁定技，当你使用装备牌时，你摸一张牌。",
                },
                trigger: { player: "useCard" },
                forced: true,
                filter: (event, player) =>
                  player._jiazuAwaken &&
                  player.group === "wu" &&
                  get.type(event.card) === "equip",
                content: () => {
                  player.draw()
                },
              },
              _jiazu_awaken_qun: {
                popup: "邺城",
                intro: {
                  content:
                    "锁定技，当你使用锦囊牌指定其他角色为目标后，你摸一张牌。",
                },
                trigger: { player: "useCardToPlayered" },
                forced: true,
                filter: (event, player) => {
                  if (
                    !player._jiazuAwaken ||
                    player.group !== "qun" ||
                    !event.isFirstTarget ||
                    get.type(event.card, "trick") !== "trick"
                  ) {
                    return false
                  }
                  for (var i = 0; i < event.targets.length; i++) {
                    if (event.targets[i] !== player) {
                      return true
                    }
                  }
                  return false
                },
                content: () => {
                  player.draw()
                },
              },
              _jiazu_awaken_key: {
                popup: "光坂",
                intro: {
                  content: "锁定技，当你回复/失去体力后，你摸一张牌。",
                },
                trigger: { player: ["loseHpEnd", "recoverEnd"] },
                forced: true,
                filter: (event, player) =>
                  player._jiazuAwaken && player.group === "key",
                content: () => {
                  player.draw()
                },
              },
              _jiazu_awaken_jin: {
                popup: "洛阳",
                intro: {
                  content:
                    "锁定技，结束阶段，若你手牌中的花色数小于3，则你摸一张牌。",
                },
                trigger: { player: "phaseJieshuBegin" },
                forced: true,
                filter: (event, player) => {
                  if (!player._jiazuAwaken || player.group !== "jin") {
                    return false
                  }
                  var hs = player.getCards("h"),
                    suits = []
                  if (hs.length < 3) {
                    return true
                  }
                  for (var i of hs) {
                    suits.add(get.suit(i, player))
                    if (suits.length > 2) {
                      return false
                    }
                  }
                  return true
                },
                content: () => {
                  player.draw()
                },
              },
              _jiazu_awaken: {
                trigger: { global: "die" },
                forced: true,
                filter: (event, player) =>
                  !player._jiazuAwaken && event.player.side === player.side,
                content: () => {
                  player._jiazuAwaken = true
                  var name = `_jiazu_awaken_${player.group}`
                  if (lib.skill[name]) {
                    player.markSkill(name)
                  }
                },
              },
            }
            var translate = {}
            for (var i in skill) {
              lib.skill[i] = skill[i]
              if (skill[i].popup) {
                lib.translate[i] = skill[i].popup
                translate[i] = skill[i].popup
              }
              if (skill[i].prompt2) {
                lib.translate[`${i}_info`] = skill[i].prompt2
                translate[`${i}_info`] = skill[i].prompt2
              }
              if (!skill[i].noGlobal) {
                game.addGlobalSkill(i)
              }
            }
            game.addVideo("arrangeLib", null, {
              skill: {
                _jiazu_wei: {
                  popup: "魏业",
                  prompt2:
                    "回合开始时，你可以弃置一张牌并指定一名敌方角色，该角色须弃置一张牌，否则你摸一张牌。",
                },
                _jiazu_shu: {
                  popup: "蜀义",
                  prompt2:
                    "你使用【杀】上限+1；出牌阶段结束时，若你于此阶段使用【杀】次数不少于2，摸一张牌。",
                },
                _jiazu_wu: {
                  popup: "吴耀",
                  prompt2:
                    "回合结束时，若你的手牌数不等于你的体力值，则你摸一张牌。",
                },
                _jiazu_qun: {
                  popup: "群心",
                  prompt2:
                    "锁定技，弃牌阶段开始时，若你的手牌数比体力值多2或更多，你本回合手牌上限+1；若你已损失体力值大于1，你手牌上限+1",
                },
                _jiazu_jin: {
                  popup: "晋势",
                  prompt2:
                    "摸牌阶段结束时，你可以展示你于此阶段内因摸牌而得到的牌。若这些牌的花色均不同，则你摸一张牌。",
                },
                _jiazu_key: {
                  popup: "键魂",
                  prompt2:
                    "出牌阶段限一次，你可以摸一张牌并获得1点护甲。若如此做，你于当前回合结束时失去1点体力。",
                },
                _jiazu_awaken_wei: {
                  popup: "许昌",
                  intro: {
                    content: "锁定技，当你受到伤害后，你摸一张牌。",
                  },
                },
                _jiazu_awaken_shu: {
                  popup: "成都",
                  intro: {
                    content: "锁定技，当你使用【杀】造成伤害后，你摸一张牌。",
                  },
                },
                _jiazu_awaken_wu: {
                  popup: "武昌",
                  intro: {
                    content: "锁定技，当你使用装备牌时，你摸一张牌。",
                  },
                },
                _jiazu_awaken_qun: {
                  popup: "邺城",
                  intro: {
                    content:
                      "锁定技，当你使用锦囊牌指定其他角色为目标后，你摸一张牌。",
                  },
                },
                _jiazu_awaken_jin: {
                  popup: "洛阳",
                  intro: {
                    content:
                      "锁定技，结束阶段，若你手牌中的花色数小于3，则你摸一张牌。",
                  },
                },
                _jiazu_awaken_key: {
                  popup: "光坂",
                  intro: {
                    content: "锁定技，当你回复/失去体力后，你摸一张牌。",
                  },
                },
                _jiazu_awaken: {},
              },
              translate: translate,
            })
          },
          chooseCharacter: (list, player) => {
            if (player.side === game.me.side) {
              if (_status.brawl.mylist) {
                return _status.brawl.mylist.randomGets(
                  player === game.me ? 5 : 3,
                )
              }
            } else {
              if (_status.brawl.enemylist) {
                return _status.brawl.enemylist.randomGets(
                  player === game.me ? 5 : 3,
                )
              }
            }
            var surname = _status.brawl.map3.randomRemove()
            var list = _status.brawl.map[surname]
            if (player === game.me) {
              _status.brawl.mylist = list
            } else {
              _status.brawl.enemylist = list
            }
            return list.randomRemove(player === game.me ? 5 : 3)
          },
        },
      },
      baiyidujiang: {
        name: "白衣渡江",
        mode: "versus",
        submode: "2v2",
        showcase: function (init) {
          var player1, player2
          if (init) {
            player1 = ui.create.player(null, true)
            player1.classList.add("fullskin")
            player1.node.avatar.show()
            player1.node.avatar.setBackground("lvmeng", "character")
            player2 = ui.create.player(null, true)
            player2.classList.add("fullskin")
            player2.node.avatar.show()
            player2.node.avatar.setBackground("guanyu", "character")
            player1.node.marks.remove()
            player1.node.hp.remove()
            player2.node.marks.remove()
            player2.node.hp.remove()
            player1.style.left = "20px"
            player1.style.top = "20px"
            player1.style.transform = "scale(0.9)"
            player1.node.count.remove()
            player2.style.left = "auto"
            player2.style.right = "20px"
            player2.style.top = "20px"
            player2.style.transform = "scale(0.9)"
            player2.node.count.remove()
            this.appendChild(player1)
            this.appendChild(player2)
            this.player1 = player1
            this.player2 = player2
          } else {
            player1 = this.player1
            player2 = this.player2
          }
          var func = () => {
            setTimeout(() => {
              player1.smoothAvatar()
              player2.smoothAvatar()
              player1.node.avatar.setBackground("re_lvmeng", "character")
              player2.node.avatar.setBackground("re_guanyu", "character")
            }, 1500)
            setTimeout(() => {
              player1.smoothAvatar()
              player2.smoothAvatar()
              player1.node.avatar.setBackground("sp_lvmeng", "character")
              player2.node.avatar.setBackground("jsp_guanyu", "character")
            }, 3000)
            setTimeout(() => {
              player1.smoothAvatar()
              player2.smoothAvatar()
              player1.node.avatar.setBackground("shen_lvmeng", "character")
              player2.node.avatar.setBackground("shen_guanyu", "character")
            }, 4500)
            setTimeout(() => {
              player1.smoothAvatar()
              player2.smoothAvatar()
              player1.node.avatar.setBackground("lvmeng", "character")
              player2.node.avatar.setBackground("guanyu", "character")
            }, 6000)
          }
          this.showcaseinterval = setInterval(func, 6000)
          func()
        },
        intro: [
          "玩家在选将时可从8张武将牌里选择两张武将牌，一张面向大家可见（加入游戏），另一张是隐藏面孔（暗置）",
          "选择的两张武将牌需满足以下至少两个条件：1.性别相同；2.体力上限相同；3.技能数量相同",
          "每名玩家在其回合开始或回合结束时，可以选择将自己的武将牌弃置，然后使用暗置的武将牌进行剩余的游戏",
        ],
        content: {
          submode: "two",
          chooseCharacterBefore: () => {
            game.versusVideoName = "白衣渡江"
            ;(lib.skill._changeCharacter = {
              trigger: { player: ["phaseBefore", "phaseAfter"] },
              forced: true,
              silent: true,
              popup: false,
              filter: (event, player) => player._backupCharacter !== undefined,
              content: () => {
                "step 0"
                player
                  .chooseControl("确定", "取消")
                  .set("dialog", [
                    "是否替换自己的武将牌？",
                    [[player._backupCharacter], "character"],
                  ])
                  .set("ai", () => (Math.random() < 0.15 ? "确定" : "取消"))
                ;("step 1")
                if (result.control === "确定") {
                  game.log(
                    player,
                    "将",
                    player.name,
                    "替换为了",
                    player._backupCharacter,
                  )
                  player.reinit(player.name, player._backupCharacter)
                  player.changeGroup(
                    lib.character[player._backupCharacter][1],
                    false,
                  )
                  delete player._backupCharacter
                }
              },
            }),
              game.addGlobalSkill("_changeCharacter")
            game.chooseCharacterTwo = () => {
              var next = game.createEvent("chooseCharacter")
              next.setContent(() => {
                "step 0"
                ui.arena.classList.add("choose-character")
                var bool = Math.random() < 0.5
                var bool2 = Math.random() < 0.5
                var ref = game.players[0]

                ref.side = bool
                ref.next.side = bool2
                ref.next.next.side = !bool
                ref.previous.side = !bool2

                var firstChoose = game.players.randomGet()
                if (firstChoose.next.side === firstChoose.side) {
                  firstChoose = firstChoose.next
                }
                _status.firstAct = firstChoose
                for (var i = 0; i < 4; i++) {
                  firstChoose.node.name.innerHTML = get.verticalStr(
                    `${get.cnNumber(i + 1, true)}号位`,
                  )
                  firstChoose = firstChoose.next
                }

                for (var i = 0; i < game.players.length; i++) {
                  if (game.players[i].side === game.me.side) {
                    game.players[i].node.identity.firstChild.innerHTML = "友"
                  } else {
                    game.players[i].node.identity.firstChild.innerHTML = "敌"
                  }
                  game.players[i].node.identity.dataset.color =
                    `${game.players[i].side}zhu`
                }
                var list = []
                for (i in lib.character) {
                  if (!lib.filter.characterDisabled(i)) {
                    list.push(i)
                  }
                }
                var choose = []
                _status.characterlist = list
                event.filterChoice = (name1, name2) => {
                  var info1 = lib.character[name1]
                  var info2 = lib.character[name2]
                  if (!info1 || !info2) {
                    return
                  }
                  var num = 0
                  if (info1[0] === info2[0]) {
                    num++
                  }
                  if (get.infoMaxHp(info1[2]) === get.infoMaxHp(info2[2])) {
                    num++
                  }
                  if (info1[3].length === info2[3].length) {
                    num++
                  }
                  return num > 1
                }
                var list2 = list.randomGets(8)
                var next = game.me.chooseButton(2, true, [
                  "请选择您的武将牌",
                  [list2, "character"],
                ])
                next.set("onfree", true)
                next.set("filterButton", (button) => {
                  if (!ui.selected.buttons.length) {
                    for (var i = 0; i < list2.length; i++) {
                      if (
                        list2[i] !== button.link &&
                        event.filterChoice(button.link, list2[i])
                      ) {
                        return true
                      }
                    }
                    return false
                  }
                  return event.filterChoice(
                    button.link,
                    ui.selected.buttons[0].link,
                  )
                })
                ;("step 1")
                game.me.init(result.links[0])
                game.me._backupCharacter = result.links[1]
                _status.characterlist.removeArray(result.links)
                var list = _status.characterlist
                for (var i = 0; i < game.players.length; i++) {
                  if (game.players[i] !== game.me) {
                    list.randomSort()
                    var bool = false
                    for (var k = 0; k < list.length; k++) {
                      for (var j = i + 1; j < list.length; j++) {
                        if (event.filterChoice(list[k], list[j])) {
                          bool = true
                          game.players[i].init(list[k])
                          game.players[i]._backupCharacter = list[j]
                          break
                        }
                      }
                      if (bool) {
                        break
                      }
                    }
                  }
                }
                setTimeout(() => {
                  ui.arena.classList.remove("choose-character")
                }, 500)
                if (get.config("two_phaseswap")) {
                  game.addGlobalSkill("autoswap")
                  if (lib.config.show_handcardbutton) {
                    ui.versushs = ui.create.system("手牌", null, true)
                    lib.setPopped(ui.versushs, game.versusHoverHandcards, 220)
                  }
                }
              })
            }
          },
        },
      },
      qianlidanji: {
        name: "千里单骑",
        mode: "identity",
        showcase: function (init) {
          var player1
          if (init) {
            player1 = ui.create.player(null, true).init("jsp_guanyu")
            player1.node.marks.remove()
            player1.node.hp.remove()
            player1.style.left = "20px"
            player1.style.top = "20px"
            player1.style.transform = "scale(0.9)"
            player1.node.count.remove()
            this.appendChild(player1)
            this.player1 = player1
          } else {
            player1 = this.player1
          }
          var func = () => {
            var player2 = ui.create.player(null, true).init("caiyang")
            player2.node.marks.remove()
            player2.node.hp.remove()
            player2.style.left = "auto"
            player2.style.right = "20px"
            player2.style.top = "20px"
            player2.node.count.remove()
            player2.style.transform = "scale(0.7)"
            player2.style.opacity = 0
            this.appendChild(player2)
            ui.refresh(player2)
            player2.style.opacity = 1
            player2.style.transform = "scale(0.9)"
            setTimeout(() => {
              if (!player2) {
                return
              }
              game.linexy(
                [
                  player1.getLeft() + player1.offsetWidth / 2,
                  player1.getTop() + player1.offsetHeight / 2,
                  player2.getLeft() + player2.offsetWidth / 2,
                  player2.getTop() + player2.offsetHeight / 2,
                ],
                this,
              )
              setTimeout(() => {
                var popup = ui.create.div(".damage")
                popup.innerHTML = "-1"
                popup.dataset.nature = "soil"
                player2.appendChild(popup)
                ui.refresh(popup)
                popup.classList.add("damageadded")
                popup.listenTransition(() => {
                  setTimeout(() => {
                    popup.delete()
                  }, 300)
                })
              }, 250)
            }, 600)
            setTimeout(() => {
              if (!player2) {
                return
              }
              player2.style.transition = "all 0.5s"
              player2.style.transform = "scale(1.2)"
              player2.delete()
            }, 1200)
          }
          this.showcaseinterval = setInterval(func, 2600)
          func()
        },
        intro: [
          "无尽而漫长的单挑试炼",
          lib.config.qianlidanji_level
            ? `你的最高纪录是连续通过${lib.config.qianlidanji_level}关，是否能够突破这一记录呢？`
            : "你能否过五关斩六将，击败古城战神蔡阳呢？",
        ],
        init: () => {
          if (!_status.qianlidanji) {
            _status.qianlidanji = {
              completeNumber: 0,
              used: ["pujing", "huban", "caiyang"],
              addFellow: (name) => {
                game.fan.dataset.position = 2
                ui.arena.setNumber(3)
                game.fellow = game.addFellow(1, name)
                game.fellow.gain(get.cards(4))
                game.fellow.identity = "zhong"
                game.fellow.setIdentity()
                game.fellow.identityShown = true
                game.fellow.node.identity.classList.remove("guessing")
                _status.event.getParent("phaseLoop").player = game.fellow
                game.fellow.actionHistory ??= []
                while (
                  game.fellow.actionHistory.length <
                  game.zhu.actionHistory.length
                ) {
                  game.fellow.actionHistory.push({
                    useCard: [],
                    respond: [],
                    skipped: [],
                    lose: [],
                    gain: [],
                    sourceDamage: [],
                    damage: [],
                    custom: [],
                    useSkill: [],
                  })
                  game.fellow.stat.push({ card: {}, skill: {} })
                }
              },
              completeReward: [
                [
                  "回复1点体力并摸一张牌",
                  () => {
                    game.zhu.recover()
                    game.zhu.draw()
                  },
                ],
                [
                  "摸三张牌",
                  () => {
                    game.zhu.draw(3)
                  },
                ],
                [
                  "将一张防具牌置入装备区并摸一张牌",
                  () => {
                    var card = get.cardPile(
                      (card) =>
                        get.subtype(card) === "equip2" &&
                        !get.cardtag(card, "gifts"),
                    )
                    if (card) {
                      game.zhu.equip(card)
                    }
                    game.zhu.draw()
                  },
                ],
                [
                  "将一张武器牌置入装备区并摸一张牌",
                  () => {
                    var card = get.cardPile(
                      (card) =>
                        get.subtype(card) === "equip1" &&
                        !get.cardtag(card, "gifts"),
                    )
                    if (card) {
                      game.zhu.equip(card)
                    }
                    game.zhu.draw()
                  },
                ],
                [
                  "回复2点体力并弃置一张牌",
                  () => {
                    game.zhu.recover(2)
                    game.zhu.chooseToDiscard("he", true)
                  },
                ],
                [
                  "摸五张牌，然后弃置三张牌",
                  () => {
                    game.zhu.draw(5)
                    game.zhu.chooseToDiscard(3, "he", true)
                  },
                ],
                [
                  "摸五张牌，然后对手摸两张牌",
                  () => {
                    game.zhu.draw(5)
                    game.fan.draw(2)
                  },
                ],
                [
                  "将一张武器牌和一张防具牌置入装备区",
                  () => {
                    var card = get.cardPile(
                      (card) =>
                        get.subtype(card) === "equip1" &&
                        !get.cardtag(card, "gifts"),
                    )
                    if (card) {
                      game.zhu.equip(card)
                    }
                    var card2 = get.cardPile(
                      (card) =>
                        get.subtype(card) === "equip2" &&
                        !get.cardtag(card, "gifts"),
                    )
                    if (card2) {
                      game.zhu.equip(card2)
                    }
                  },
                ],
                [
                  "将一张武器牌和一张防御坐骑牌置入装备区",
                  () => {
                    var card = get.cardPile(
                      (card) =>
                        get.subtype(card) === "equip1" &&
                        !get.cardtag(card, "gifts"),
                    )
                    if (card) {
                      game.zhu.equip(card)
                    }
                    var card2 = get.cardPile(
                      (card) =>
                        get.subtype(card) === "equip3" &&
                        !get.cardtag(card, "gifts"),
                    )
                    if (card2) {
                      game.zhu.equip(card2)
                    }
                  },
                ],
                [
                  "弃置所有手牌并于下一关获得【涅槃】(标)",
                  () => {
                    var hs = game.zhu.getCards("h")
                    if (hs.length) {
                      game.zhu.discard(hs)
                    }
                    game.zhu.addSkill("oldniepan")
                    game.zhu.restoreSkill("oldniepan")
                    game.zhu._oldniepan = true
                  },
                ],
                [
                  "获得两张锦囊牌",
                  () => {
                    var list = []
                    while (list.length < 2) {
                      var card = get.cardPile(
                        (card) =>
                          !list.includes(card) &&
                          get.type(card, "trick") === "trick",
                      )
                      if (!card) {
                        break
                      }
                      list.push(card)
                    }
                    if (list.length) {
                      game.zhu.gain(list, "gain2", "log")
                    }
                  },
                ],
                [
                  "将体力回复至体力上限，然后弃置一张牌",
                  () => {
                    var num = game.zhu.maxHp - game.zhu.hp
                    if (num) {
                      game.zhu.recover(num)
                    }
                    game.zhu.chooseToDiscard("he", true)
                  },
                ],
                [
                  "弃置两张牌，在下一关的第一个回合后进行一个额外的回合",
                  () => {
                    game.zhu.chooseToDiscard(2, true, "he")
                    game.zhu.addSkill("qianlidanji_phase")
                  },
                ],
                [
                  "摸一张牌，然后将对手翻面",
                  () => {
                    game.zhu.draw()
                    game.fan.turnOver(true)
                  },
                ],
                [
                  "摸一张牌，然后令对手受到1点伤害",
                  () => {
                    game.zhu.draw()
                    game.fan.damage(game.zhu)
                  },
                ],
                [
                  "获得五张基本牌",
                  () => {
                    var list = []
                    while (list.length < 5) {
                      var card = get.cardPile(
                        (card) =>
                          !list.includes(card) && get.type(card) === "basic",
                      )
                      if (!card) {
                        break
                      }
                      list.push(card)
                    }
                    if (list.length) {
                      game.zhu.gain(list, "gain2", "log")
                    }
                  },
                ],
                [
                  "失去1点体力，然后摸五张牌",
                  () => {
                    game.zhu.loseHp()
                    game.zhu.draw(5)
                  },
                ],
                [
                  "失去体力至1点，然后摸七张牌",
                  () => {
                    var num = game.zhu.hp - 1
                    if (num) {
                      game.zhu.loseHp(num)
                    }
                    game.zhu.draw(7)
                  },
                ],
                [
                  "弃置一张牌，然后令对手受到2点伤害",
                  () => {
                    game.zhu.chooseToDiscard("he", true)
                    game.fan.damage(game.zhu, 2)
                  },
                ],
                [
                  "在下一关中召唤普净一同战斗",
                  () => {
                    _status.qianlidanji.addFellow("pujing")
                  },
                ],
                [
                  "在下一关中召唤胡班一同战斗",
                  () => {
                    _status.qianlidanji.addFellow("huban")
                  },
                ],
                [
                  "将一张宝物牌置入装备区并摸一张牌",
                  () => {
                    var card = get.cardPile(
                      (card) =>
                        get.subtype(card) === "equip5" &&
                        !get.cardtag(card, "gifts"),
                    )
                    if (card) {
                      game.zhu.equip(card)
                    }
                    game.zhu.draw()
                  },
                ],
                [
                  "摸五张牌，然后将自己翻面",
                  () => {
                    game.zhu.draw(5)
                    game.zhu.turnOver(true)
                  },
                ],
                [
                  "获得一张【酒】和一张【杀】",
                  () => {
                    var list = []
                    var card = get.cardPile((card) => card.name === "sha")
                    if (card) {
                      list.push(card)
                    }
                    var card = get.cardPile((card) => card.name === "jiu")
                    if (card) {
                      list.push(card)
                    }
                    if (list.length) {
                      game.zhu.gain(list, "gain2", "log")
                    }
                  },
                ],
              ],
              replace_character: () => {
                "step 0"
                if (game.zhu._oldniepan) {
                  game.zhu.removeSkill("oldniepan")
                  delete game.zhu._oldniepan
                }
                _status.qianlidanji.completeNumber++
                if (
                  !lib.config.qianlidanji_level ||
                  lib.config.qianlidanji_level <
                    _status.qianlidanji.completeNumber
                ) {
                  lib.config.qianlidanji_level =
                    _status.qianlidanji.completeNumber
                  game.saveConfig(
                    "qianlidanji_level",
                    lib.config.qianlidanji_level,
                  )
                }
                if (game.fellow?.isAlive()) {
                  if (ui.land && ui.land.player === game.fellow) {
                    game.addVideo("destroyLand")
                    ui.land.destroy()
                  }
                  game.zhu.next = game.fan
                  game.fan.next = game.zhu
                  game.zhu.nextSeat = game.fan
                  game.fan.nextSeat = game.zhu
                  game.players.remove(game.fellow)
                  _status.dying.remove(game.fellow)
                  game.fellow.out()
                  for (var mark in game.fellow.marks) {
                    game.fellow.unmarkSkill(mark)
                  }
                  while (game.fellow.node.marks.childNodes.length > 1) {
                    game.fellow.node.marks.lastChild.remove()
                  }
                  for (var i in game.fellow.tempSkills) {
                    game.fellow.removeSkill(i)
                  }
                  var skills = game.fellow.getSkills()
                  for (var i = 0; i < skills.length; i++) {
                    if (lib.skill[skills[i]].temp) {
                      game.fellow.removeSkill(skills[i])
                    }
                  }
                  var cards = game.fellow.getCards("hej")
                  while (cards.length) {
                    ui.discardPile.appendChild(cards.shift())
                  }
                }
                ;("step 1")
                if (game.fellow) {
                  game.dead.remove(game.fellow)
                  game.fellow.remove()
                  game.fan.dataset.position = 1
                  ui.arena.setNumber(2)
                  game.zhu.next = game.fan
                  game.fan.next = game.zhu
                  game.zhu.nextSeat = game.fan
                  game.fan.nextSeat = game.zhu
                }
                if (_status.qianlidanji.completeNumber !== 5) {
                  var list = _status.qianlidanji.completeReward.randomGets(3)
                  var list2 = []
                  for (var i = 0; i < list.length; i++) {
                    list2.push(list[i][1])
                    list[i] = list[i][0]
                  }
                  if (_status.qianlidanji.completeNumber >= 6) {
                    list.push("我不想再打了，直接在这里结束吧！")
                    list2.push(() => {
                      game.over(true)
                    })
                  }
                  event.list = list2
                  game.zhu
                    .chooseControl()
                    .set("choiceList", list)
                    .set(
                      "prompt",
                      `请选择一项奖励（当前已通过${_status.qianlidanji.completeNumber}关）`,
                    )
                }
                ;("step 2")
                if (_status.qianlidanji.completeNumber !== 5) {
                  if (result.index === 3) {
                    game.over(true)
                    return
                  }
                  event.reward = event.list[result.index]
                }
                _status.characterlist.removeArray(_status.qianlidanji.used)
                if (_status.qianlidanji.completeNumber === 5) {
                  event._result = { links: ["caiyang"] }
                } else {
                  game.zhu.chooseButton(
                    [
                      "选择下一关出战的对手",
                      [_status.characterlist.randomGets(3), "character"],
                    ],
                    true,
                  )
                }
                ;("step 3")
                _status.event.getParent("phaseLoop").player = game.zhu
                var source = game.fan
                var name = result.links[0]
                source.revive(null, false)
                _status.characterlist.remove(name)
                _status.qianlidanji.used.push(name)
                source.uninit()
                source.init(name)
                game.addVideo("reinit", source, [name])
                source.lose(source.getCards("hej"))._triggered = null
                var gain = 4
                var add = 0
                switch (_status.qianlidanji.completeNumber) {
                  case 5:
                    break
                  case 1:
                    gain = 5
                    break
                  case 2:
                    gain = 5
                    add = 1
                    break
                  case 3:
                    gain = 6
                    add = 1
                    break
                  default:
                    gain = 6
                    add = 2
                    break
                }
                source.hp += add
                source.maxHp += add
                source.update()
                source.gain(get.cards(gain))._triggered = null
                game.triggerEnter(source)
                if (event.reward) {
                  event.reward()
                }
                ;("step 4")
                var cards = Array.from(ui.ordering.childNodes)
                while (cards.length) {
                  cards.shift().discard()
                }
                var evt = _status.event.getParent("phase")
                if (evt) {
                  game.resetSkills()
                  let evtx = _status.event
                  while (evtx !== evt) {
                    evtx.finish()
                    evtx.untrigger(true)
                    evtx = evtx.getParent()
                  }
                  evtx.finish()
                  evtx.untrigger(true)
                }
              },
            }
          }
          _status.qianlidanji.player_number = get.config("player_number")
          game.saveConfig("player_number", "2", "identity")
        },
        content: {
          submode: "normal",
          chooseCharacterBefore: () => {
            game.identityVideoName = "千里单骑"
            game.saveConfig(
              "player_number",
              _status.qianlidanji.player_number,
              "identity",
            )
            game.chooseCharacter = () => {
              var next = game.createEvent("chooseCharacter")
              next.showConfig = true
              next.setContent(() => {
                "step 0"
                ui.arena.classList.add("choose-character")
                game.me.identity = "zhu"
                game.zhu = game.me
                game.fan = game.me.next
                game.fan.identity = "fan"
                game.zhu.setIdentity()
                game.zhu.identityShown = true
                game.zhu.node.identity.classList.remove("guessing")
                game.fan.setIdentity()
                game.fan.identityShown = true
                game.fan.node.identity.classList.remove("guessing")

                event.list = []
                for (var i in lib.character) {
                  if (lib.filter.characterDisabled(i)) {
                    continue
                  }
                  event.list.push(i)
                }
                event.list.randomSort()
                _status.characterlist = event.list.slice(0)
                var list = event.list.slice(0, 5)
                delete event.swapnochoose
                var dialog
                if (event.swapnodialog) {
                  dialog = ui.dialog
                  event.swapnodialog(dialog, list)
                  delete event.swapnodialog
                } else {
                  var str = "选择角色"
                  dialog = ui.create.dialog(str, "hidden", [list, "character"])
                }
                dialog.setCaption("选择角色")
                game.me.chooseButton(dialog, true).set("onfree", true)

                ui.create.cheat = () => {
                  _status.createControl = ui.cheat2
                  ui.cheat = ui.create.control("更换", () => {
                    if (
                      ui.cheat2 &&
                      ui.cheat2.dialog === _status.event.dialog
                    ) {
                      return
                    }
                    if (game.changeCoin) {
                      game.changeCoin(-3)
                    }

                    event.list.randomSort()
                    list = event.list.slice(0, 5)

                    var buttons = ui.create.div(".buttons")
                    var node = _status.event.dialog.buttons[0].parentNode
                    _status.event.dialog.buttons = ui.create.buttons(
                      list,
                      "character",
                      buttons,
                    )
                    _status.event.dialog.content.insertBefore(buttons, node)
                    buttons.addTempClass("start")
                    node.remove()
                    game.uncheck()
                    game.check()
                  })
                  delete _status.createControl
                }
                if (lib.onfree) {
                  lib.onfree.push(() => {
                    event.dialogxx = ui.create.characterDialog("heightset")
                    if (ui.cheat2) {
                      ui.cheat2.addTempClass("controlpressdownx", 500)
                      ui.cheat2.classList.remove("disabled")
                    }
                  })
                } else {
                  event.dialogxx = ui.create.characterDialog("heightset")
                }

                ui.create.cheat2 = () => {
                  ui.cheat2 = ui.create.control("自由选将", function () {
                    if (this.dialog === _status.event.dialog) {
                      if (game.changeCoin) {
                        game.changeCoin(10)
                      }
                      this.dialog.close()
                      _status.event.dialog = this.backup
                      this.backup.open()
                      delete this.backup
                      game.uncheck()
                      game.check()
                      if (ui.cheat) {
                        ui.cheat.addTempClass("controlpressdownx", 500)
                        ui.cheat.classList.remove("disabled")
                      }
                    } else {
                      if (game.changeCoin) {
                        game.changeCoin(-10)
                      }
                      this.backup = _status.event.dialog
                      _status.event.dialog.close()
                      _status.event.dialog = _status.event.parent.dialogxx
                      this.dialog = _status.event.dialog
                      this.dialog.open()
                      game.uncheck()
                      game.check()
                      if (ui.cheat) {
                        ui.cheat.classList.add("disabled")
                      }
                    }
                  })
                  if (lib.onfree) {
                    ui.cheat2.classList.add("disabled")
                  }
                }
                if (!_status.brawl?.chooseCharacterFixed) {
                  if (!ui.cheat && get.config("change_choice")) {
                    ui.create.cheat()
                  }
                  if (!ui.cheat2 && get.config("free_choose")) {
                    ui.create.cheat2()
                  }
                }
                ;("step 1")
                if (ui.cheat) {
                  ui.cheat.close()
                  delete ui.cheat
                }
                if (ui.cheat2) {
                  ui.cheat2.close()
                  delete ui.cheat2
                }
                game.addRecentCharacter(result.buttons[0].link)
                game.zhu.init(result.buttons[0].link)
                _status.characterlist.remove(result.buttons[0].link)
                _status.qianlidanji.used.add(result.buttons[0].link)
                game.zhu
                  .chooseControl("地狱", "困难", "普通", "简单", "无双")
                  .set("prompt", "请选择游戏难度")
                ;("step 2")
                var hp = Math.floor(result.index / 2)
                event.draw = Math.floor((result.index + 1) / 2)
                if (hp) {
                  game.zhu.hp += hp
                  game.zhu.maxHp += hp
                  game.zhu.update()
                }
                game.zhu.chooseButton(
                  [
                    "请选择对手的登场武将",
                    [_status.characterlist.randomGets(3), "character"],
                  ],
                  true,
                )
                ;("step 3")
                game.fan.init(result.links[0])
                _status.characterlist.remove(result.links[0])
                _status.qianlidanji.used.add(result.links[0])
                if (event.draw) {
                  game.zhu.directgain(get.cards(event.draw))
                }
                setTimeout(() => {
                  ui.arena.classList.remove("choose-character")
                }, 500)

                var pack = {
                  character: {
                    pujing: {
                      sex: "male",
                      group: "qun",
                      hp: 1,
                    },
                    huban: {
                      sex: "male",
                      group: "qun",
                      hp: 2,
                    },
                    caiyang: {
                      sex: "male",
                      group: "qun",
                      hp: 1,
                      skills: ["zhuishe"],
                    },
                  },
                  translate: {
                    pujing: "普净",
                    huban: "胡班",
                  },
                  skill: {
                    qianlidanji_phase: {
                      trigger: { global: "phaseBefore" },
                      forced: true,
                      silent: true,
                      firstDo: true,
                      content: () => {
                        player.removeSkill("qianlidanji_phase")
                        player.insertPhase()
                      },
                    },
                  },
                }
                for (var i in pack) {
                  for (var j in pack[i]) {
                    lib[i][j] = pack[i][j]
                  }
                }
                delete pack.skill
                game.addVideo("arrangeLib", null, pack)
                game.addOverDialog = (dialog) => {
                  dialog.addText(
                    `共计通过${_status.qianlidanji.completeNumber}关`,
                  )
                }
                lib.element.player.dieAfter2 = function () {
                  if (this === game.fellow) {
                    return
                  }
                  _status.characterlist.removeArray(_status.qianlidanji.used)
                  if (game.zhu === this || !_status.characterlist.length) {
                    var bool = false
                    if (_status.qianlidanji.completeNumber > 5) {
                      bool = true
                    }
                    game.over(bool)
                  } else {
                    var next = game.createEvent("qianlidanji_replace", false)
                    next.setContent(_status.qianlidanji.replace_character)
                  }
                }
                lib.element.player.dieAfter = function (source) {
                  _status.characterlist.removeArray(_status.qianlidanji.used)
                  const next = game.createEvent("dieAfter", false)
                  next.player = this
                  next.forceDie = true
                  next.source = source
                  next.setContent("emptyEvent")
                }
                game.zhu.dieAfter = lib.element.player.dieAfter
                game.fan.dieAfter = lib.element.player.dieAfter
                game.zhu.dieAfter2 = lib.element.player.dieAfter2
                game.fan.dieAfter2 = lib.element.player.dieAfter2
              })
            }
          },
        },
      },
      liangjunduilei: {
        name: "两军对垒",
        mode: "versus",
        submode: "2v2",
        showcase: function (init) {
          var player1, player2
          var list = [
            ["re_sp_zhugeliang", "yujin_yujin", "re_zhangliao", "re_lusu"],
            ["re_huangzhong", "re_xiahouyuan", "zhanghe", "xin_fazheng"],
            ["re_caocao", "re_yuanshao", "guotufengji", "re_guojia"],
            ["chunyuqiong", "sp_xuyou", "re_xuhuang", "gaolan"],
            ["re_sp_zhugeliang", "re_zhangzhang", "guyong", "re_lusu"],
            ["yj_jushou", "re_caocao", "jsp_guanyu", "re_yanwen"],
            ["re_lingtong", "re_lidian", "re_zhangliao", "re_ganning"],
            ["re_guanyu", "caoren", "re_lvmeng", "guanping"],
          ].randomGet()
          if (_status.keyVerified) {
            list = [
              ["caozhen", "key_hisako", "key_iwasawa", "sp_key_kanade"],
            ].randomGet()
          }
          if (init) {
            player1 = ui.create.player(null, true)
            player2 = ui.create.player(null, true)
            player1.node.marks.remove()
            player1.node.hp.remove()
            player2.node.marks.remove()
            player2.node.hp.remove()
            player1.style.left = "20px"
            player1.style.top = "20px"
            player1.style.transform = "scale(0.9)"
            player1.node.count.remove()
            player2.style.left = "auto"
            player2.style.right = "20px"
            player2.style.top = "20px"
            player2.style.transform = "scale(0.9)"
            player2.node.count.remove()
            this.appendChild(player1)
            this.appendChild(player2)
            this.player1 = player1
            this.player2 = player2
          } else {
            player1 = this.player1
            player2 = this.player2
          }
          var player3, player4
          if (init) {
            player3 = ui.create.player(null, true)
            player4 = ui.create.player(null, true)
            player3.node.marks.remove()
            player3.node.hp.remove()
            player4.node.marks.remove()
            player4.node.hp.remove()
            player3.style.left = "60px"
            player3.style.top = "120px"
            player3.style.transform = "scale(0.9)"
            player3.node.count.remove()
            player4.style.left = "auto"
            player4.style.right = "60px"
            player4.style.top = "120px"
            player4.style.transform = "scale(0.9)"
            player4.node.count.remove()
            this.appendChild(player3)
            this.appendChild(player4)
            this.player3 = player3
            this.player4 = player4
          } else {
            player3 = this.player3
            player4 = this.player4
          }
          player1.init(list[0])
          player2.init(list[1])
          player3.init(list[3])
          player4.init(list[2])
        },
        intro: ["双方使用特定的武将，搭配特定的技能，还原特定的经典场景"],
        content: {
          submode: "two",
          chooseCharacterBefore: () => {
            var list = [
              {
                name: "草船借箭",
                place: [true, false, false, true],
                character: [
                  "re_sp_zhugeliang",
                  "yujin_yujin",
                  "re_zhangliao",
                  "re_lusu",
                ],
                lib: {
                  character: {
                    re_sp_zhugeliang: {
                      sex: "male",
                      group: "shu",
                      hp: 3,
                      skills: ["tiaoxin", "bazhen", "feiying"],
                      names: "诸葛|亮",
                    },
                    yujin_yujin: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["jiangchi", "danshou"],
                      dieAudios: ["xin_yujin.mp3"],
                    },
                    re_zhangliao: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["benxi", "tuifeng", "qingxi"],
                    },
                    re_lusu: {
                      sex: "male",
                      group: "wu",
                      hp: 3,
                      skills: ["kaikang", "shenxian"],
                    },
                  },
                  translate: {
                    re_sp_zhugeliang: "诸葛卧龙",
                    yujin_yujin: "于文则",
                    re_zhangliao: "张文远",
                    re_lusu: "鲁子敬",
                  },
                },
              },
              {
                name: "定军山之战",
                place: [true, false, false, true],
                character: [
                  "re_huangzhong",
                  "re_xiahouyuan",
                  "zhanghe",
                  "xin_fazheng",
                ],
                lib: {
                  character: {
                    re_huangzhong: {
                      sex: "male",
                      group: "shu",
                      hp: 4,
                      skills: ["yingjian", "weikui", "gzyinghun"],
                    },
                    re_xiahouyuan: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["benxi", "yaowu", "dujin", "juesi"],
                      names: "夏侯|渊",
                    },
                    zhanghe: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["kaikang", "xingshang", "zhiheng"],
                    },
                    xin_fazheng: {
                      sex: "male",
                      group: "shu",
                      hp: 4,
                      skills: ["xinfu_zhanji", "nzry_chenglve", "yiji"],
                    },
                  },
                  translate: {
                    re_huangzhong: "定军黄忠",
                    re_xiahouyuan: "定军妙才",
                    zhanghe: "定军张郃",
                    xin_fazheng: "定军法正",
                  },
                },
              },
              {
                name: "官渡追击战",
                place: [false, true, true, false],
                character: [
                  "re_caocao",
                  "re_yuanshao",
                  "guotufengji",
                  "re_guojia",
                ],
                lib: {
                  character: {
                    re_caocao: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["fankui", "zhuiji", "duanbing"],
                    },
                    re_yuanshao: {
                      sex: "male",
                      group: "qun",
                      hp: 3,
                      maxHp: 6,
                      skills: ["reluanji", "kuanggu", "benghuai", "weizhong"],
                    },
                    guotufengji: {
                      sex: "male",
                      group: "qun",
                      hp: 2,
                      skills: ["sijian", "jigong", "shifei", "jianying"],
                      names: "null|null",
                    },
                    re_guojia: {
                      sex: "male",
                      group: "wei",
                      hp: 3,
                      skills: ["yiji", "sanyao", "gongxin"],
                    },
                  },
                  translate: {
                    re_caocao: "官渡曹操",
                    re_yuanshao: "官渡袁绍",
                    guotufengji: "袁军智囊",
                    re_guojia: "官渡郭嘉",
                  },
                },
              },
              {
                name: "奇袭乌巢",
                place: [true, false, false, true],
                character: ["chunyuqiong", "sp_xuyou", "re_xuhuang", "gaolan"],
                lib: {
                  character: {
                    chunyuqiong: {
                      sex: "male",
                      group: "qun",
                      hp: 8,
                      skills: ["ranshang", "duliang", "jiuchi"],
                      names: "淳于|琼",
                    },
                    sp_xuyou: {
                      sex: "male",
                      group: "qun",
                      hp: 3,
                      skills: ["qice", "lianying", "nzry_jianxiang"],
                    },
                    re_xuhuang: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["shenduan", "xiaoguo", "nzry_juzhan"],
                    },
                    gaolan: {
                      sex: "male",
                      group: "qun",
                      hp: 4,
                      skills: ["yuanhu", "shensu", "benyu", "suishi"],
                    },
                  },
                  translate: {
                    chunyuqiong: "乌巢淳于琼",
                    sp_xuyou: "乌巢许攸",
                    re_xuhuang: "乌巢徐晃",
                    gaolan: "乌巢高览",
                  },
                },
              },
              {
                name: "舌战群儒",
                place: [false, true, false, true],
                character: [
                  "re_zhangzhang",
                  "re_sp_zhugeliang",
                  "guyong",
                  "re_lusu",
                ],
                lib: {
                  character: {
                    re_sp_zhugeliang: {
                      sex: "male",
                      group: "shu",
                      hp: 3,
                      skills: ["tianbian", "jyzongshi", "xinfu_guolun"],
                      names: "诸葛|亮",
                    },
                    re_zhangzhang: {
                      sex: "male",
                      group: "wu",
                      hp: 3,
                      skills: ["zhuandui", "tiaoxin", "guzheng"],
                      names: "张|昭-张|纮",
                    },
                    guyong: {
                      sex: "male",
                      group: "wu",
                      hp: 3,
                      skills: ["qiaoshui", "qicai", "bingyi"],
                    },
                    re_lusu: {
                      sex: "male",
                      group: "wu",
                      hp: 3,
                      skills: ["qingzhongx", "shuimeng"],
                    },
                  },
                  translate: {
                    re_sp_zhugeliang: "诸葛卧龙",
                    re_zhangzhang: "张子布",
                    guyong: "顾元叹",
                    re_lusu: "鲁子敬",
                  },
                },
              },
              {
                name: "武圣战双雄",
                place: [true, false, false, true],
                character: [
                  "yj_jushou",
                  "re_caocao",
                  "jsp_guanyu",
                  "re_yanwen",
                ],
                lib: {
                  character: {
                    yj_jushou: {
                      sex: "male",
                      group: "qun",
                      hp: 3,
                      skills: ["mingce", "jianyan", "shibei"],
                    },
                    re_caocao: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["miji", "beige", "feiying"],
                    },
                    jsp_guanyu: {
                      sex: "male",
                      group: "wei",
                      hp: 4,
                      skills: ["nuzhan", "jianchu", "new_rewusheng"],
                    },
                    re_yanwen: {
                      sex: "male",
                      group: "qun",
                      hp: 4,
                      skills: ["shuangxiong", "zhanyi", "zhichi"],
                      names: "颜|良-文|丑",
                    },
                  },
                  translate: {
                    yj_jushou: "白马沮授",
                    re_caocao: "白马曹操",
                    jsp_guanyu: "武圣关羽",
                    re_yanwen: "颜文双雄",
                  },
                },
              },
              {
                name: "合肥之战",
                place: [true, false, false, true],
                character: [
                  "re_lingtong",
                  "re_lidian",
                  "re_zhangliao",
                  "re_ganning",
                ],
                lib: {
                  character: {
                    re_lingtong: {
                      sex: "male",
                      group: "wu",
                      hp: 4,
                      skills: ["xuanfeng", "zishou", "tiaoxin"],
                    },
                    re_lidian: {
                      sex: "male",
                      group: "wei",
                      hp: 3,
                      skills: ["weijing", "wangxi", "zhuandui"],
                      dieAudios: ["lidian"],
                    },
                    re_zhangliao: {
                      sex: "male",
                      group: "wei",
                      hp: 3,
                      skills: ["retuxi", "mashu", "reyingzi", "xinpojun"],
                    },
                    re_ganning: {
                      sex: "male",
                      group: "wu",
                      hp: 5,
                      skills: ["lizhan", "jiang", "zhenwei"],
                    },
                  },
                  translate: {
                    re_lingtong: "合肥凌统",
                    re_lidian: "合肥李典",
                    re_zhangliao: "合肥张辽",
                    re_ganning: "合肥甘宁",
                  },
                },
              },
              {
                name: "荆州之战",
                place: [true, false, false, true],
                character: ["re_guanyu", "caoren", "re_lvmeng", "guanping"],
                lib: {
                  character: {
                    re_guanyu: {
                      sex: "male",
                      group: "shu",
                      hp: 5,
                      skills: ["wusheng", "zishou", "zhongyong"],
                    },
                    caoren: {
                      sex: "male",
                      group: "wei",
                      hp: 1,
                      skills: ["xinjiewei", "qiuyuan", "gzbuqu", "xinjushou"],
                    },
                    re_lvmeng: {
                      sex: "male",
                      group: "wu",
                      hp: 4,
                      skills: ["gongxin", "duodao", "dujin", "huituo"],
                    },
                    guanping: {
                      sex: "male",
                      group: "shu",
                      hp: 5,
                      skills: ["longyin", "suishi"],
                    },
                  },
                  translate: {
                    re_guanyu: "荆州关羽",
                    caoren: "樊城曹仁",
                    re_lvmeng: "江东吕蒙",
                    guanping: "荆州关平",
                  },
                },
              },
              {
                name: "雒城之战",
                place: [true, false, false, true],
                character: ["liubei", "re_wuyi", "zhangren", "pangtong"],
                lib: {
                  character: {
                    liubei: {
                      sex: "male",
                      group: "shu",
                      hp: 4,
                      skills: ["rezhijian", "jijiu", "reyingzi"],
                    },
                    re_wuyi: {
                      sex: "male",
                      group: "qun",
                      hp: 4,
                      skills: ["weijing", "rerende"],
                      clans: ["陈留吴氏"],
                    },
                    zhangren: {
                      sex: "male",
                      group: "qun",
                      hp: 4,
                      skills: ["shefu", "gnsheque"],
                    },
                    pangtong: {
                      sex: "male",
                      group: "shu",
                      hp: 3,
                      skills: ["dujin"],
                    },
                  },
                  translate: {
                    liubei: "雒城刘备",
                    re_wuyi: "雒城吴懿",
                    zhangren: "雒城张任",
                    pangtong: "雒城庞统",
                    rezhijian: "厚恩",
                    zhijian: "厚恩",
                    jijiu: "驰援",
                    reyingzi: "征令",
                    rerende: "遣军",
                  },
                },
              },
            ]
            if (_status.keyVerified) {
              list = [
                {
                  name: "My Song",
                  place: [false, true, true, false],
                  character: [
                    "caozhen",
                    "key_hisako",
                    "key_iwasawa",
                    "sp_key_kanade",
                  ],
                  lib: {
                    character: {
                      caozhen: {
                        sex: "male",
                        group: "wei",
                        hp: 4,
                        skills: ["xinsidi", "tuxi"],
                      },
                      key_hisako: {
                        sex: "female",
                        group: "key",
                        hp: 2,
                        maxHp: 3,
                        skills: [
                          "hisako_yinbao",
                          "shenzhi",
                          "shiorimiyuki_banyin",
                          "hisako_zhuanyun",
                        ],
                      },
                      key_iwasawa: {
                        sex: "female",
                        group: "key",
                        hp: "-999/3",
                        skills: [
                          "iwasawa_yinhang",
                          "iwasawa_mysong",
                          "hisako_zhuanyun",
                        ],
                      },
                      sp_key_kanade: {
                        sex: "female",
                        group: "key",
                        hp: 3,
                        skills: ["xinwuyan", "xinbenxi"],
                      },
                    },
                    translate: {
                      caozhen: "突袭教师",
                      key_hisako: "绝望恶魔",
                      key_iwasawa: "引吭孤鸦",
                      sp_key_kanade: "学生会长",
                    },
                  },
                },
                {
                  name: "Day Game",
                  place: [false, true, true, false],
                  character: [
                    "key_yuzuru",
                    "sp_key_kanade",
                    "key_ayato",
                    "key_hinata",
                  ],
                  lib: {
                    character: {
                      key_yuzuru: {
                        sex: "male",
                        group: "key",
                        hp: 4,
                        skills: ["hinata_qiulve", "kurou"],
                      },
                      sp_key_kanade: {
                        sex: "female",
                        group: "key",
                        hp: 3,
                        skills: ["hinata_qiulve", "benxi"],
                      },
                      key_ayato: {
                        sex: "male",
                        group: "key",
                        hp: 3,
                        skills: ["hinata_qiulve", "retieji"],
                      },
                      key_hinata: {
                        sex: "female",
                        group: "key",
                        hp: 4,
                        skills: ["hinata_qiulve", "hinata_ehou"],
                      },
                    },
                    translate: {
                      key_yuzuru: "新秀球王",
                      sp_key_kanade: "学生会长",
                      key_ayato: "副会长",
                      key_hinata: "球队领袖",
                    },
                  },
                },
              ]
            }
            game.liangjunduilei = list
            game.chooseCharacterTwo = () => {
              var next = game.createEvent("chooseCharacter")
              next.setContent(() => {
                "step 0"
                ui.arena.classList.add("choose-character")
                var list = game.liangjunduilei
                var id = lib.status.videoId++
                var choiceList = ui.create.dialog(
                  "请选择要游玩的剧情",
                  "forcebutton",
                )
                choiceList.videoId = id
                choiceList.add([
                  list.map((item, i) => {
                    return [
                      i,
                      `<div class="popup text center" style="width:calc(100% - 10px);display:inline-block">${item.name}</div>`,
                    ]
                  }),
                  "textbutton",
                ])
                game.me.chooseButton(true).set("dialog", id).set("onfree", true)
                ;("step 1")
                var pack = game.liangjunduilei[result.links[0]]
                game.versusVideoName = pack.name
                if (get.is.phoneLayout()) {
                  ui.duileiInfo = ui.create.div(".touchinfo.left", ui.window)
                } else {
                  ui.duileiInfo = ui.create.div(ui.gameinfo)
                }
                ui.duileiInfo.innerHTML = `当前剧情：${pack.name}`
                for (var i in pack.lib) {
                  for (var j in pack.lib[i]) {
                    lib[i][j] = pack.lib[i][j]
                  }
                }
                var player = game.players.randomGet()
                _status.firstAct = player
                for (var i = 0; i < 4; i++) {
                  player.init(pack.character[i])
                  player.side = pack.place[i]
                  player = player.next
                }

                for (var i = 0; i < game.players.length; i++) {
                  if (game.players[i].side === game.me.side) {
                    game.players[i].node.identity.firstChild.innerHTML = "友"
                  } else {
                    game.players[i].node.identity.firstChild.innerHTML = "敌"
                  }
                  game.players[i].node.identity.dataset.color =
                    `${game.players[i].side}zhu`
                }
                game.addVideo("arrangeLib", null, pack.lib)
                setTimeout(() => {
                  ui.arena.classList.remove("choose-character")
                }, 500)
                if (get.config("two_phaseswap")) {
                  game.addGlobalSkill("autoswap")
                  if (lib.config.show_handcardbutton) {
                    ui.versushs = ui.create.system("手牌", null, true)
                    lib.setPopped(ui.versushs, game.versusHoverHandcards, 220)
                  }
                }
              })
            }
          },
        },
      },
    },
  }
}
