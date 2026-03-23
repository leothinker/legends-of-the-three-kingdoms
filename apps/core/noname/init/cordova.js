//@ts-nocheck
import { checkVersion } from "../library/update.js"

export default async function cordovaReady({ lib, game, get, _status, ui }) {
  lib.path = (await import("path-browserify-esm")).default

  // 安卓端根目录的cordova.js
  const script = document.createElement("script")
  script.src = "cordova.js"
  document.body.appendChild(script)
  await new Promise((resolve) => {
    document.addEventListener("deviceready", () => resolve(void 0))
  })

  const nonameInitialized = localStorage.getItem("noname_inited")

  if (lib.device === "android") {
    // 新客户端导入扩展逻辑
    window.addEventListener(
      "importExtension",
      (e) => {
        const extensionName = e.detail.extensionName
        lib.config.extensions.add(extensionName)
        game.saveConfig("extensions", lib.config.extensions)
        game.saveConfig(`extension_${extensionName}_enable`, true)
        if (confirm(`扩展${extensionName}已导入成功，是否重启游戏？`)) {
          game.reload()
        }
      },
      false,
    )
    window.addEventListener(
      "importPackage",
      () => {
        if (confirm(`离线包/完整包已导入成功，是否重启游戏？`)) {
          game.reload()
        }
      },
      false,
    )
    document.addEventListener("pause", () => {
      if (_status.gameStarted && !_status.event.isMine()) {
        ui.click.pause()
      }
      if (ui.backgroundMusic) {
        ui.backgroundMusic.pause()
      }
    })
    document.addEventListener("resume", () => {
      if (ui.backgroundMusic && !Number.isNaN(ui.backgroundMusic.duration)) {
        ui.backgroundMusic.play()
      }
    })
    document.addEventListener("backbutton", () => {
      if (ui.arena?.classList.contains("menupaused")) {
        if (window.saveNonameInput) {
          window.saveNonameInput()
        } else {
          ui.click.configMenu()
        }
      } else if (lib.config?.confirm_exit) {
        navigator.notification.confirm(
          "是否退出游戏？",
          (index) => {
            switch (index) {
              case 2:
                game.reload()
                break
              case 3:
                navigator.app.exitApp()
                break
            }
          },
          "确认退出",
          ["取消", "重新开始", "退出"],
        )
      } else {
        navigator.app.exitApp()
      }
    })
    if (
      "cordova" in window &&
      "plugins" in window.cordova &&
      "permissions" in window.cordova.plugins
    ) {
      const permissions = cordova.plugins.permissions
      const requests = ["WRITE_EXTERNAL_STORAGE", "READ_EXTERNAL_STORAGE"]
      if (typeof device === "object") {
        // 安卓13或以上
        if (checkVersion(device.version, "13") >= 0) {
          requests.length = 0
          requests.push(
            "READ_MEDIA_IMAGES",
            "READ_MEDIA_VIDEO",
            "READ_MEDIA_AUDIO",
          )
        }
      }
      Promise.all(
        requests.map((request) => {
          return new Promise((resolve, reject) => {
            permissions.checkPermission(
              permissions[request],
              (status) => {
                resolve({
                  request: request,
                  hasPermission: status.hasPermission,
                })
              },
              reject,
            )
          })
        }),
      )
        .then((shouldRequestPermissions) => {
          return shouldRequestPermissions
            .filter(({ hasPermission }) => !hasPermission)
            .map(
              ({ request }) =>
                permissions[request] || `android.permission.${request}`,
            )
        })
        .then((willRequestPermissions) => {
          permissions.requestPermissions(
            willRequestPermissions,
            () => {},
            () => {},
          )
        })
        .catch(console.log)
    }
    // if (typeof window.NonameAndroidBridge == "undefined" || typeof window.NonameAndroidBridge.getPackageName != "function" || typeof window.NonameAndroidBridge.getPackageVersionCode != "function") {
    // 	throw new Error("您的安卓客户端版本过低，请升级至最新版");
    // }
    // const versionCode = window.NonameAndroidBridge.getPackageVersionCode();
    // switch (window.NonameAndroidBridge.getPackageName()) {
    // 	case "com.noname.shijian":
    // 		if (versionCode < 16007) {
    // 			throw new Error("您的安卓诗笺版客户端版本过低，请升级至v1.6.7或以上");
    // 		}
    // 		break;
    // 	case "yuri.nakamura.noname_android":
    // 		if (versionCode < 10904) {
    // 			throw new Error("您的安卓由理版客户端版本过低，请升级至v1.9.4或以上");
    // 		}
    // 		break;
    // 	case "yuri.nakamura.noname":
    // 		if (versionCode < 108004) {
    // 			throw new Error("您的安卓兼容版客户端版本过低，请升级至v1.8.4或以上");
    // 		}
    // 		break;
    // 	case "com.widget.noname.cola":
    // 		if (versionCode < 10320) {
    // 			throw new Error("您的安卓增强版客户端版本过低，请升级至v1.3.2或以上");
    // 		}
    // 		break;
    // 	default:
    // 	// todo: 懒人包提示
    // }
  }
  game.download = (url, folder, onsuccess, onerror, dev, onprogress) => {
    if (!url.startsWith("http")) {
      url = get.url(dev) + url
    }
    var fileTransfer = new FileTransfer()
    game.ensureDirectory(
      folder,
      () => {
        // folder = nonameInitialized + folder;
        if (onprogress) {
          fileTransfer.onprogress = (progressEvent) => {
            onprogress(progressEvent.loaded, progressEvent.total)
          }
        }
        lib.config.brokenFile.add(nonameInitialized + folder)
        game.saveConfigValue("brokenFile")
        fileTransfer.download(
          encodeURI(url),
          encodeURI(nonameInitialized + folder),
          () => {
            lib.config.brokenFile.remove(nonameInitialized + folder)
            game.saveConfigValue("brokenFile")
            if (onsuccess) {
              onsuccess()
            }
          },
          onerror,
        )
      },
      true,
    )
  }

  game.export = (data, name) => {
    if (typeof data === "string") {
      data = new Blob([data], { type: "text/plain" })
    }
    let fileNameToSaveAs = name || "noname"
    fileNameToSaveAs = fileNameToSaveAs.replace(/\\|\/|:|\?|"|\*|<|>|\|/g, "-")

    let directory
    if (lib.device === "android") {
      directory = cordova.file.externalDataDirectory
    } else {
      directory = cordova.file.documentsDirectory
    }
    window.resolveLocalFileSystemURL(directory, (entry) => {
      entry.getFile(fileNameToSaveAs, { create: true }, (fileEntry) => {
        fileEntry.createWriter((fileWriter) => {
          fileWriter.onwriteend = () => {
            alert(`文件已导出至${directory}${fileNameToSaveAs}`)
          }
          fileWriter.write(data)
        })
      })
    })
  }

  game.exit = () => {
    if (lib.device === "android") {
      if (navigator.app?.exitApp) {
        navigator.app.exitApp()
      }
    }
    //ios
    else {
      game.saveConfig("mode")
      if (_status) {
        if (_status.reloading) {
          return
        }
        _status.reloading = true
      }
      if (_status.video && !_status.replayvideo) {
        localStorage.removeItem(`${lib.configprefix}playbackmode`)
      }
      window.location.reload()
    }
  }

  game.open = (url) => {
    if (cordova.InAppBrowser) {
      cordova.InAppBrowser.open(url, "_system")
    } else {
      ui.create.iframe(url)
    }
  }

  game.checkFile = (fileName, callback, onerror) => {
    const path = lib.path.join(nonameInitialized, fileName)

    window.resolveLocalFileSystemURL(
      path,
      (entry) => {
        callback?.(entry.isFile ? 1 : 0)
      },
      (error) => {
        if (
          [FileError.NOT_FOUND_ERR, FileError.NOT_READABLE_ERR].includes(
            error.code,
          )
        ) {
          callback?.(-1)
        } else {
          onerror?.(new Error(`Code: ${error.code}`))
        }
      },
    )
  }

  game.checkDir = (dir, callback, onerror) => {
    const path = lib.path.join(nonameInitialized, dir)

    window.resolveLocalFileSystemURL(
      path,
      (entry) => {
        callback?.(entry.isDirectory ? 1 : 0)
      },
      (error) => {
        if (
          [FileError.NOT_FOUND_ERR, FileError.NOT_READABLE_ERR].includes(
            error.code,
          )
        ) {
          callback?.(-1)
        } else {
          onerror?.(new Error(`Code: ${error.code}`))
        }
      },
    )
  }

  game.readFile = (filename, callback, onerror) => {
    window.resolveLocalFileSystemURL(
      nonameInitialized,
      (entry) => {
        entry.getFile(
          filename,
          {},
          (fileEntry) => {
            fileEntry.file((fileToLoad) => {
              var fileReader = new FileReader()
              fileReader.onload = (e) => {
                callback(e.target.result)
              }
              fileReader.readAsArrayBuffer(fileToLoad, "UTF-8")
            }, onerror)
          },
          onerror,
        )
      },
      onerror,
    )
  }
  game.readFileAsText = (filename, callback, onerror) => {
    window.resolveLocalFileSystemURL(
      nonameInitialized,
      (entry) => {
        entry.getFile(
          filename,
          {},
          (fileEntry) => {
            fileEntry.file((fileToLoad) => {
              var fileReader = new FileReader()
              fileReader.onload = (e) => {
                callback(e.target.result)
              }
              fileReader.readAsText(fileToLoad, "UTF-8")
            }, onerror)
          },
          onerror,
        )
      },
      onerror,
    )
  }
  game.writeFile = (data, path, name, callback) => {
    game.ensureDirectory(path, () => {
      if (Object.prototype.toString.call(data) === "[object File]") {
        var fileReader = new FileReader()
        fileReader.onload = (e) => {
          game.writeFile(e.target.result, path, name, callback)
        }
        fileReader.readAsArrayBuffer(data, "UTF-8")
      } else {
        window.resolveLocalFileSystemURL(
          nonameInitialized + path,
          (entry) => {
            entry.getFile(
              name,
              { create: true },
              (fileEntry) => {
                fileEntry.createWriter((fileWriter) => {
                  fileWriter.onwriteend = callback
                  fileWriter.write(data)
                }, callback)
              },
              callback,
            )
          },
          callback,
        )
      }
    })
  }
  game.removeFile = (dir, callback) => {
    window.resolveLocalFileSystemURL(
      nonameInitialized,
      (entry) => {
        entry.getFile(
          dir,
          {},
          (fileEntry) => {
            fileEntry.remove()
            if (callback) {
              callback()
            }
          },
          callback || (() => {}),
        )
      },
      callback || (() => {}),
    )
  }
  game.getFileList = (dir, success, failure) => {
    var files = [],
      folders = []
    window.resolveLocalFileSystemURL(
      nonameInitialized + dir,
      (entry) => {
        var dirReader = entry.createReader()
        var entries = []
        var readEntries = () => {
          dirReader.readEntries((results) => {
            if (!results.length) {
              entries.sort()
              for (var i = 0; i < entries.length; i++) {
                if (entries[i].isDirectory) {
                  folders.push(entries[i].name)
                } else {
                  files.push(entries[i].name)
                }
              }
              success(folders, files)
            } else {
              entries = entries.concat(Array.from(results))
              readEntries()
            }
          }, failure)
        }
        readEntries()
      },
      failure,
    )
  }
  game.ensureDirectory = (list, callback, file) => {
    const directoryList =
        typeof list === "string" ? [list] : list.slice().reverse(),
      num = file ? 1 : 0,
      access = (entry, directory, createDirectory) => {
        if (directory.length <= num) {
          createDirectory()
          return
        }
        const str = directory.pop()
        return new Promise((resolve, reject) =>
          entry.getDirectory(
            str,
            {
              create: false,
            },
            resolve,
            reject,
          ),
        )
          .catch(
            () =>
              new Promise((resolve) =>
                entry.getDirectory(
                  str,
                  {
                    create: true,
                  },
                  resolve,
                ),
              ),
          )
          .then((directoryEntry) =>
            access(directoryEntry, directory, createDirectory),
          )
      }
    return new Promise((resolve, reject) =>
      window.resolveLocalFileSystemURL(
        nonameInitialized,
        (rootEntry) => {
          const createDirectory = () => {
            if (directoryList.length) {
              access(
                rootEntry,
                directoryList.pop().split("/").reverse(),
                createDirectory,
              )
            }
            if (typeof callback === "function") {
              callback()
            }
            resolve()
          }
          createDirectory()
        },
        reject,
      ),
    )
  }
  game.createDir = (directory, successCallback, errorCallback) => {
    const paths = directory.split("/").reverse()
    new Promise((resolve, reject) =>
      window.resolveLocalFileSystemURL(nonameInitialized, resolve, reject),
    ).then(
      (directoryEntry) => {
        const redo = (entry) =>
          new Promise((resolve, reject) =>
            entry.getDirectory(
              paths.pop(),
              {
                create: true,
              },
              resolve,
              reject,
            ),
          ).then((resolvedDirectoryEntry) => {
            if (paths.length) {
              return redo(resolvedDirectoryEntry)
            }
            if (typeof successCallback === "function") {
              successCallback()
            }
          })
        return redo(directoryEntry)
      },
      (reason) => {
        if (typeof errorCallback !== "function") {
          return Promise.reject(reason)
        }
        errorCallback(reason)
      },
    )
  }
  game.removeDir = (directory, successCallback, errorCallback) => {
    window.resolveLocalFileSystemURL(
      `${nonameInitialized}${directory}`,
      (directoryEntry) => {
        directoryEntry.removeRecursively(() => {
          if (typeof successCallback === "function") {
            successCallback()
          }
        })
      },
      (e) => {
        if (typeof errorCallback === "function") {
          errorCallback(e)
        } else {
          throw e
        }
      },
    )
  }
  if (ui.updateUpdate) {
    ui.updateUpdate()
  }
  var showbar = () => {
    if (window.StatusBar) {
      if (lib.device === "android") {
        if (lib.config.show_statusbar_android) {
          window.StatusBar.overlaysWebView(false)
          window.StatusBar.backgroundColorByName("black")
          window.StatusBar.show()
        }
      } else if (lib.device === "ios") {
        if (
          lib.config.show_statusbar_ios !== "off" &&
          lib.config.show_statusbar_ios !== "auto"
        ) {
          if (lib.config.show_statusbar_ios === "default") {
            window.StatusBar.overlaysWebView(false)
          } else {
            window.StatusBar.overlaysWebView(true)
          }
          window.StatusBar.backgroundColorByName("black")
          window.StatusBar.show()
        }
      }
    }
  }
  if (lib.arenaReady) {
    lib.arenaReady.push(showbar)
  } else {
    showbar()
  }
}
