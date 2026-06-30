import { _status } from "wtk"

const characterFilters = {
  shen_diaochan(mode) {
    return (
      mode === "identity" ||
      mode === "doudizhu" ||
      mode === "single" ||
      (mode === "versus" &&
        _status.mode !== "standard" &&
        _status.mode !== "three")
    )
  },
  shen_jiaxu(mode) {
    return mode === "identity" && _status.mode !== "purple"
  },
}

export default characterFilters
