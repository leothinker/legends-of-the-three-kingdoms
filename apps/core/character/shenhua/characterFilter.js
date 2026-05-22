import { lib, game, ui, get, ai, _status } from "wtk"

const characterFilters = {
  zuoci(mode) {
    return mode != "guozhan"
  },
}

export default characterFilters
