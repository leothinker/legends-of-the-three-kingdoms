import {
  menuContainer,
  popupContainer,
  updateActive,
  setUpdateActive,
  updateActiveCard,
  setUpdateActiveCard,
  menux,
  menuxpages,
  menuUpdates,
  openMenu,
  clickToggle,
  clickSwitcher,
  clickContainer,
  clickMenuItem,
  createMenu,
  createConfig,
} from "../index.js"
import { ui, game, get, ai, lib, _status } from "wtk"
import { wtkInitialized } from "@/util/index.js"
import JSZip from "jszip"

export const optionsMenu = function (connectMenu) {
  if (connectMenu) {
    return
  }
  /**
   * 由于联机模式会创建第二个菜单，所以需要缓存一下可变的变量
   */
  // const cacheMenuContainer = menuContainer;
  const cachePopupContainer = popupContainer
  // const cacheMenux = menux;
  const cacheMenuxpages = menuxpages
  /** @type { HTMLDivElement } */
  // @ts-expect-error ignore
  var start = cacheMenuxpages.shift()
  var rightPane = start.lastChild

  var clickMode = function () {
    var active = this.parentNode.querySelector(".active")
    if (active === this) {
      return
    }
    active.classList.remove("active")
    active.link.remove()
    active = this
    active.classList.add("active")
    if (this.link) {
      rightPane.appendChild(this.link)
    } else {
      this._initLink()
      rightPane.appendChild(this.link)
    }
  }

  var clickAutoSkill = function (bool) {
    var name = this._link.config._name
    var list = lib.config.autoskilllist
    if (bool) {
      list.remove(name)
    } else {
      list.add(name)
    }
    game.saveConfig("autoskilllist", list)
  }
  var skilllistexpanded = game.expandSkills(lib.skilllist)
  for (var i in lib.skill) {
    if (!skilllistexpanded.includes(i)) {
      continue
    }
    if (lib.skill[i].frequent && lib.translate[i]) {
      lib.configMenu.skill.config[i] = {
        name: lib.translate[i + "_noconf"] || lib.translate[i],
        init: true,
        type: "autoskill",
        onclick: clickAutoSkill,
        intro: lib.translate[i + "_info"],
      }
    }
  }
  var clickBanSkill = function (bool) {
    var name = this._link.config._name
    var list = lib.config.forbidlist
    if (bool) {
      list.remove(name)
    } else {
      list.add(name)
    }
    game.saveConfig("forbidlist", list)
  }
  var forbid = lib.config.forbid
  if (!lib.config.forbidlist) {
    game.saveConfig("forbidlist", [])
  }
  for (var i = 0; i < forbid.length; i++) {
    var skip = false
    var str = ""
    var str2 = ""
    var str3 = ""
    for (var j = 0; j < forbid[i].length; j++) {
      if (!lib.skilllist.includes(forbid[i][j])) {
        skip = true
        break
      }
      str += get.translation(forbid[i][j]) + "+"
      str2 += forbid[i][j] + "+"
      str3 += get.translation(forbid[i][j]) + "：" + lib.translate[forbid[i][j] + "_info"]
      if (j < forbid[i].length - 1) {
        str3 += '<div class="placeholder slim" style="display:block;height:8px"></div>'
      }
    }
    if (skip) {
      continue
    }
    str = str.slice(0, str.length - 1)
    str2 = str2.slice(0, str2.length - 1)

    lib.configMenu.skill.config[str2] = {
      name: str,
      init: true,
      type: "banskill",
      onclick: clickBanSkill,
      intro: str3,
    }
  }

  var updateView = null
  var updateAppearence = null
  var createModeConfig = function (mode, position) {
    var info = lib.configMenu[mode]
    var page = ui.create.div("")
    var node = ui.create.div(".menubutton.large", info.name, position, clickMode)
    node.mode = mode
    // node._initLink=function(){
    node.link = page
    var map = {}
    if (info.config) {
      var hiddenNodes = []
      var autoskillNodes = []
      var banskillNodes = []
      var custombanskillNodes = []
      var banskill

      if (mode == "skill") {
        var autoskillexpanded = false
        var banskillexpanded = false
        ui.create.div(".config.more", "自动发动 <div>&gt;</div>", page, function () {
          if (autoskillexpanded) {
            this.classList.remove("on")
            for (var k = 0; k < autoskillNodes.length; k++) {
              autoskillNodes[k].style.display = "none"
            }
          } else {
            this.classList.add("on")
            for (var k = 0; k < autoskillNodes.length; k++) {
              autoskillNodes[k].style.display = ""
            }
          }
          autoskillexpanded = !autoskillexpanded
        })
        banskill = ui.create.div(".config.more", "双将禁配 <div>&gt;</div>", page, function () {
          if (banskillexpanded) {
            this.classList.remove("on")
            for (var k = 0; k < banskillNodes.length; k++) {
              banskillNodes[k].style.display = "none"
            }
          } else {
            this.classList.add("on")
            for (var k = 0; k < banskillNodes.length; k++) {
              banskillNodes[k].style.display = ""
            }
          }
          banskillexpanded = !banskillexpanded
        })

        var banskilladd = ui.create.div(
          ".config.indent",
          '<span class="pointerdiv">添加...</span>',
          page,
          function () {
            this.nextSibling.classList.toggle("hidden")
          },
        )
        banskilladd.style.display = "none"
        banskillNodes.push(banskilladd)

        var banskilladdNode = ui.create.div(".config.indent.hidden.banskilladd", page)
        banskilladdNode.style.display = "none"
        banskillNodes.push(banskilladdNode)

        var matchBanSkill = function (skills1, skills2) {
          if (skills1.length != skills2.length) {
            return false
          }
          for (var i = 0; i < skills1.length; i++) {
            if (!skills2.includes(skills1[i])) {
              return false
            }
          }
          return true
        }
        var deleteCustomBanSkill = function () {
          for (var i = 0; i < lib.config.customforbid.length; i++) {
            if (matchBanSkill(lib.config.customforbid[i], this.parentNode.link)) {
              lib.config.customforbid.splice(i--, 1)
              break
            }
          }
          game.saveConfig("customforbid", lib.config.customforbid)
          this.parentNode.remove()
        }
        var createCustomBanSkill = function (skills) {
          var node = ui.create.div(".config.indent.toggle")
          node.style.display = "none"
          node.link = skills
          banskillNodes.push(node)
          custombanskillNodes.push(node)
          var str = get.translation(skills[0])
          for (var i = 1; i < skills.length; i++) {
            str += "+" + get.translation(skills[i])
          }
          node.innerHTML = str
          var span = document.createElement("span")
          span.classList.add("cardpiledelete")
          span.innerHTML = "删除"
          span.onclick = deleteCustomBanSkill
          node.appendChild(span)
          page.insertBefore(node, banskilladdNode.nextSibling)
          return node
        }
        for (var i = 0; i < lib.config.customforbid.length; i++) {
          createCustomBanSkill(lib.config.customforbid[i])
        }
        ;(function () {
          var list = []
          for (var i in lib.character) {
            if (lib.character[i][3].length) {
              list.push([i, lib.translate[i]])
            }
          }
          if (!list.length) {
            return
          }
          list.sort(function (a, b) {
            a = a[0]
            b = b[0]
            var aa = a,
              bb = b
            if (aa.includes("_")) {
              aa = aa.slice(aa.lastIndexOf("_") + 1)
            }
            if (bb.includes("_")) {
              bb = bb.slice(bb.lastIndexOf("_") + 1)
            }
            if (aa != bb) {
              return aa > bb ? 1 : -1
            }
            return a > b ? 1 : -1
          })

          var list2 = []
          var skills = lib.character[list[0][0]][3]
          for (var i = 0; i < skills.length; i++) {
            list2.push([skills[i], lib.translate[skills[i]]])
          }

          var selectname = ui.create.selectlist(list, list[0], banskilladdNode)
          selectname.onchange = function () {
            var skills = lib.character[this.value][3]
            skillopt.innerHTML = ""
            for (var i = 0; i < skills.length; i++) {
              var option = document.createElement("option")
              option.value = skills[i]
              option.innerHTML = lib.translate[skills[i]]
              skillopt.appendChild(option)
            }
          }
          selectname.style.maxWidth = "85px"
          var skillopt = ui.create.selectlist(list2, list2[0], banskilladdNode)

          var span = document.createElement("span")
          span.innerHTML = "＋"
          banskilladdNode.appendChild(span)
          var br = document.createElement("br")
          banskilladdNode.appendChild(br)

          var selectname2 = ui.create.selectlist(list, list[0], banskilladdNode)
          selectname2.onchange = function () {
            var skills = lib.character[this.value][3]
            skillopt2.innerHTML = ""
            for (var i = 0; i < skills.length; i++) {
              var option = document.createElement("option")
              option.value = skills[i]
              option.innerHTML = lib.translate[skills[i]]
              skillopt2.appendChild(option)
            }
          }
          selectname2.style.maxWidth = "85px"
          var skillopt2 = ui.create.selectlist(list2, list2[0], banskilladdNode)
          var confirmbutton = document.createElement("button")
          confirmbutton.innerHTML = "确定"
          banskilladdNode.appendChild(confirmbutton)

          confirmbutton.onclick = function () {
            var skills = [skillopt.value, skillopt2.value]
            if (skills[0] == skills[1]) {
              skills.shift()
            }
            if (!lib.config.customforbid) {
              return
            }
            for (var i = 0; i < lib.config.customforbid.length; i++) {
              if (matchBanSkill(lib.config.customforbid[i], skills)) {
                return
              }
            }
            lib.config.customforbid.push(skills)
            game.saveConfig("customforbid", lib.config.customforbid)
            createCustomBanSkill(skills).style.display = ""
          }
        })()
        page.style.paddingBottom = "10px"
      }
      var config = lib.config
      if (mode == "appearence") {
        updateAppearence = function () {
          info.config.update(config, map)
        }
      } else if (mode == "view") {
        updateView = function () {
          info.config.update(config, map)
        }
      }
      for (var j in info.config) {
        if (j === "update") {
          continue
        }
        var cfg = get.copy(info.config[j])
        cfg._name = j
        if (j in config) {
          cfg.init = config[j]
        } else if (cfg.type != "autoskill" && cfg.type != "banskill") {
          game.saveConfig(j, cfg.init)
        }
        if (!cfg.onclick) {
          cfg.onclick = function (result) {
            var cfg = this._link.config
            game.saveConfig(cfg._name, result)
            if (cfg.onsave) {
              cfg.onsave.call(this, result)
            }
          }
        }
        if (info.config.update) {
          if (mode == "appearence" || mode == "view") {
            cfg.update = function () {
              if (updateAppearence) {
                updateAppearence()
              }
              if (updateView) {
                updateView()
              }
            }
          } else {
            cfg.update = function () {
              info.config.update(config, map)
            }
          }
        }
        var cfgnode = createConfig(cfg)
        if (cfg.type == "autoskill") {
          autoskillNodes.push(cfgnode)
          // cfgnode.style.transition='all 0s';
          cfgnode.classList.add("indent")
          // cfgnode.hide();
          cfgnode.style.display = "none"
        } else if (cfg.type == "banskill") {
          banskillNodes.push(cfgnode)
          // cfgnode.style.transition='all 0s';
          cfgnode.classList.add("indent")
          // cfgnode.hide();
          cfgnode.style.display = "none"
        }
        if (j == "import_data_button") {
          ui.import_data_button = cfgnode
          cfgnode.hide()
          cfgnode.querySelector("button").onclick = function () {
            var fileToLoad = this.previousSibling.files[0]
            if (fileToLoad) {
              var fileReader = new FileReader()
              fileReader.onload = function (fileLoadedEvent) {
                var data = fileLoadedEvent.target.result
                if (!data) {
                  return
                }
                try {
                  data = JSON.parse(lib.init.decode(data))
                  if (!data || typeof data != "object") {
                    throw new Error("err")
                  }
                  if (lib.db && (!data.config || !data.data)) {
                    throw new Error("err")
                  }
                } catch (e) {
                  console.log(e)
                  alert("导入失败")
                  return
                }
                alert("导入成功")
                if (!lib.db) {
                  var wtk_inited = localStorage.getItem("wtk_inited")
                  var onlineKey = localStorage.getItem(lib.configprefix + "key")
                  localStorage.clear()
                  if (wtk_inited) {
                    localStorage.setItem("wtk_inited", wtk_inited)
                  }
                  if (onlineKey) {
                    localStorage.setItem(lib.configprefix + "key", onlineKey)
                  }
                  for (var i in data) {
                    localStorage.setItem(i, data[i])
                  }
                } else {
                  for (var i in data.config) {
                    game.putDB("config", i, data.config[i])
                    lib.config[i] = data.config[i]
                  }
                  for (var i in data.data) {
                    game.putDB("data", i, data.data[i])
                  }
                }
                lib.init.background()
                game.reload()
              }
              fileReader.readAsText(fileToLoad, "UTF-8")
            }
          }
        } else if (j == "import_music") {
          cfgnode.querySelector("button").onclick = function () {
            if (_status.music_importing) {
              return
            }
            _status.music_importing = true
            var fileToLoad = this.previousSibling.files[0]
            if (fileToLoad) {
              if (!lib.config.customBackgroundMusic) {
                lib.config.customBackgroundMusic = {}
              }
              var name = fileToLoad.name
              if (name.includes(".")) {
                name = name.slice(0, name.indexOf("."))
              }
              var link = ( "custom_") + name
              if (lib.config.customBackgroundMusic[link]) {
                if (!confirm("已经存在文件名称相同的背景音乐，是否仍然要继续导入？")) {
                  _status.music_importing = false
                  return
                }
                for (var i = 1; i < 1000; i++) {
                  if (!lib.config.customBackgroundMusic[link + "_" + i]) {
                    link = link + "_" + i
                    break
                  }
                }
              }
              var callback = function () {
                var nodexx = ui.background_music_setting
                var nodeyy = nodexx._link.menu
                var nodezz = nodexx._link.config
                var musicname = link.slice(link.indexOf("_") + 1)
                game.prompt("###请输入音乐的名称###" + musicname, true, function (str) {
                  if (str) {
                    musicname = str
                  }
                  lib.config.customBackgroundMusic[link] = musicname
                  lib.config.background_music = link
                  lib.config.all.background_music.add(link)
                  game.saveConfig("background_music", link)
                  game.saveConfig("customBackgroundMusic", lib.config.customBackgroundMusic)
                  nodezz.item[link] = lib.config.customBackgroundMusic[link]
                  var textMenu = ui.create.div(
                    "",
                    lib.config.customBackgroundMusic[link],
                    nodeyy,
                    clickMenuItem,
                    nodeyy.childElementCount - 2,
                  )
                  textMenu._link = link
                  nodezz.updatex.call(nodexx, [])
                  _status.music_importing = false
                  if (!_status._aozhan) {
                    game.playBackgroundMusic()
                  }
                })
              }
                game.putDB("audio", link, fileToLoad, callback)
            }
          }
        }
        map[j] = cfgnode
        if (!cfg.unfrequent) {
          if (cfg.type == "autoskill") {
            page.insertBefore(cfgnode, banskill)
          } else {
            page.appendChild(cfgnode)
          }
        } else {
          // cfgnode.classList.add('auto-hide');
          hiddenNodes.push(cfgnode)
        }
      }
      var expanded = false
      if (hiddenNodes.length) {
        // ui.create.div('.config.more','更多 <div>&gt;</div>',page,function(){
        //     if(expanded){
        //      			this.classList.remove('on');
        //      			this.parentNode.classList.remove('expanded');
        //     }
        //     else{
        //      			this.classList.add('on');
        //      			this.parentNode.classList.add('expanded');
        //     }
        //     expanded=!expanded;
        // });
        page.classList.add("morenodes")
        for (var k = 0; k < hiddenNodes.length; k++) {
          page.appendChild(hiddenNodes[k])
        }
      }
      if (info.config.update) {
        info.config.update(config, map)
      }
    }
    // };
    // if(!get.config('menu_loadondemand')) node._initLink();
    return node
  }

  for (var i in lib.configMenu) {
    if (i != "others") {
      createModeConfig(i, start.firstChild)
    }
  }
  createModeConfig("others", start.firstChild)

  var active = start.firstChild.querySelector(".active")
  if (!active) {
    active = start.firstChild.firstChild
    active.classList.add("active")
  }
  if (!active.link) {
    active._initLink()
  }
  rightPane.appendChild(active.link)
}
