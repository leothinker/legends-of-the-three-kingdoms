import { sort as bianSort } from "./bian.js"
import { sort as normalSort } from "./normal.js"
import { sort as quanSort } from "./quan.js"
import { sort as shiSort } from "./shi.js"
import { sort as zhenSort } from "./zhen.js"

const sortList = [normalSort, zhenSort, shiSort, bianSort, quanSort]
const sortMap = sortList.reduce((result, [id, translate]) => {
  result[id] = translate
  return result
}, {})

export default sortMap
