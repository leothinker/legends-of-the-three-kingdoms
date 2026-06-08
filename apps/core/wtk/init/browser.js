//@ts-nocheck
export default async function browserReady({ lib, game }) {
  lib.path = (await import("path-browserify-esm")).default

  try {
    await fetch(`/checkFile?fileName=wtk.js`)
      .then((response) => response.json())
      .then((result) => {
        if (!result?.success) throw new Error(result.errorMsg)
      })
  } catch (e) {
    console.error("文件读写函数初始化失败:", e)
    return
  }

  game.export = (data, name) => {
    if (typeof data === "string") {
      data = new Blob([data], { type: "text/plain" })
    }
    let fileNameToSaveAs = name || "wtk"
    fileNameToSaveAs = fileNameToSaveAs.replace(/\\|\/|:|\?|"|\*|<|>|\|/g, "-")

    const downloadLink = document.createElement("a")
    downloadLink.download = fileNameToSaveAs
    downloadLink.innerHTML = "Download File"
    downloadLink.href = window.URL.createObjectURL(data)
    downloadLink.click()
  }

  game.exit = () => {
    window.onbeforeunload = null
    window.close()
  }

  game.open = (url) => {
    window.open(url)
  }

  /**
   * 检查指定的路径是否是一个文件
   *
   * @param {string} fileName - 需要查询的路径
   * @param {(result: -1 | 0 | 1) => void} [callback] - 回调函数；接受的参数意义如下:
   *  - `-1`: 路径不存在或无法访问
   *  - `0`: 路径的内容不是文件
   *  - `1`: 路径的内容是文件
   * @param {(err: Error) => void} [onerror] - 接收错误的回调函数
   * @return {void} - 由于三端的异步需求和历史原因，文件管理必须为回调异步函数
   */
  game.checkFile = function checkFile(fileName, callback, onerror) {
    fetch(`/checkFile?fileName=${fileName}`)
      .then((response) => response.json())
      .then((result) => {
        if (result) {
          if (result.success) {
            switch (result.data) {
              case "file":
                callback?.(1)
                return
              case "directory":
                callback?.(0)
                return
              default:
                callback?.(-1)
                return
            }
          }
        }

        onerror?.(result?.errorMsg)
      })
      .catch(onerror)
  }

  /**
   * 检查指定的路径是否是一个目录
   *
   * @param {string} dir - 需要查询的路径
   * @param {(result: -1 | 0 | 1) => void} [callback] - 回调函数；接受的参数意义如下:
   *  - `-1`: 路径不存在或无法访问
   *  - `0`: 路径的内容不是目录
   *  - `1`: 路径的内容是目录
   * @param {(err: Error) => void} [onerror] - 接收错误的回调函数
   * @return {void} - 由于三端的异步需求和历史原因，文件管理必须为回调异步函数
   */
  game.checkDir = function checkDir(dir, callback, onerror) {
    fetch(`/checkDir?dir=${dir}`)
      .then((response) => response.json())
      .then((result) => {
        if (result) {
          if (result.success) {
            switch (result.data) {
              case "file":
                callback?.(0)
                return
              case "directory":
                callback?.(1)
                return
              default:
                callback?.(-1)
                return
            }
          }
        }

        onerror?.(result?.errorMsg)
      })
      .catch(onerror)
  }

  game.readFile = function readFile(
    fileName,
    callback = () => {},
    error = () => {},
  ) {
    fetch(`/readFile?fileName=${fileName}`)
      .then((response) => response.json())
      .then((result) => {
        if (result?.success) {
          const data = result.data

          /** @type {Uint8Array} */
          let buffer
          if (typeof data === "string") {
            buffer = Uint8Array.fromBase64(data)
          } else if (Array.isArray(data)) {
            buffer = new Uint8Array(data)
          }

          callback(buffer.buffer)
        } else {
          error(result?.errorMsg)
        }
      })
      .catch(error)
  }

  game.readFileAsText = function readFileAsText(
    fileName,
    callback = () => {},
    error = () => {},
  ) {
    fetch(`/readFileAsText?fileName=${fileName}`)
      .then((response) => response.json())
      .then((result) => {
        if (result?.success) {
          callback(result.data)
        } else {
          error(result?.errorMsg)
        }
      })
      .catch(error)
  }

  game.getFileList = function getFileList(dir, callback = () => {}, onerror) {
    fetch(`/getFileList?dir=${dir}`)
      .then((response) => response.json())
      .then((result) => {
        if (!result) {
          throw new Error("Cannot get available resource.")
        }

        if (result.success) {
          callback(result.data.folders, result.data.files)
        } else if (onerror) {
          onerror(new Error(result.errorMsg))
        }
      })
  }
}
