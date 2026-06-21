import { _status, game, get, lib, ui } from "wtk"
export const type = "mode"
/**
 * @type { () => importModeConfig }
 */
export default () => {
  return {
    name: "connect",
    start() {
      var directstartmode = lib.config.directstartmode
      ui.create.menu(true)
      event.textnode = ui.create.div("", "正在连接...")
      var createNode = () => {
        if (event.created) {
          return
        }
        if (directstartmode && lib.node) {
          ui.exitroom = ui.create.system(
            "退出房间",
            () => {
              game.saveConfig("directstartmode")
              game.reload()
            },
            true,
          )
          game.switchMode(directstartmode)
          return
        }
        if (lib.node && window.require) {
          ui.startServer = ui.create.system(
            "启动服务器",
            (e) => {
              ui.click.shortcut(false)
              e.stopPropagation()
              ui.click.connectMenu()
            },
            true,
          )
        }

        event.created = true
        const connectUrl = lib.hallURL

        var connect = () => {
          event.textnode.textContent = "正在连接..."
          if (ui.ipbutton) {
            ui.ipbutton.style.display = "none"
          }
          clearTimeout(event.timeout)
          game.requireSandboxOn(connectUrl)
          game.saveConfig("last_ip", connectUrl)
          game.connect(connectUrl, (success) => {
            if (success) {
              var info = lib.config.reconnect_info
              if (info && info[0] === _status.ip) {
                game.onlineID = info[1]
                if (typeof (game.roomId = info[2]) === "string") {
                  game.roomIdServer = true
                }
              }
              return
            }
            if (event.textnode) {
              alert("连接失败")
              event.textnode.textContent = "连接失败"
            }
            if (ui.ipbutton) {
              ui.ipbutton.style.display = ""
            }
          })
        }

        var text = event.textnode
        text.style.width = "400px"
        text.style.height = "30px"
        text.style.lineHeight = "30px"
        text.style.fontFamily = "xinwei"
        text.style.fontSize = "30px"
        text.style.padding = "10px"
        text.style.left = "calc(50% - 200px)"
        text.style.top = "calc(50% - 80px)"
        text.style.textAlign = "center"
        ui.window.appendChild(text)
        ui.iptext = text

        var button = ui.create.div(
          ".menubutton.highlight.large.pointerdiv",
          "重试",
          connect,
        )
        button.style.width = "70px"
        button.style.left = "calc(50% - 35px)"
        button.style.top = "calc(50% + 60px)"
        button.style.display = "none"
        ui.window.appendChild(button)
        ui.ipbutton = button

        if (get.config("read_clipboard", "connect")) {
          var read = (text) => {
            try {
              var text2 = text.split("\n")[2]
              if (text2?.startsWith("联机地址:")) {
                _status.read_clipboard_text = text
              }
            } catch (e) {
              console.log(e)
            }
          }
          window.focus()
          if (navigator.clipboard && lib.node) {
            navigator.clipboard
              .readText()
              .then(read)
              .catch((_) => {})
          } else {
            var input = ui.create.node("textarea", ui.window, { opacity: "0" })
            input.select()
            var result = document.execCommand("paste")
            input.blur()
            ui.window.removeChild(input)
            if (result || input.value.length > 0) {
              read(input.value)
            }
          }
        }
        connect()
        lib.init.onfree()
      }
      createNode()
      if (!game.onlineKey) {
        game.onlineKey = localStorage.getItem(`${lib.configprefix}key`)
        if (!game.onlineKey) {
          game.onlineKey = get.id()
          localStorage.setItem(`${lib.configprefix}key`, game.onlineKey)
        }
      }
      _status.connectDenied = createNode
      setTimeout(lib.init.onfree, 1000)
    },
  }
}
