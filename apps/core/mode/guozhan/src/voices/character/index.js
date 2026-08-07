import bianVoice from "./bian.js"
import normalVoice from "./normal.js"
import quanVoice from "./quan.js"
import shiVoice from "./shi.js"
import zhenVoice from "./zhen.js"

export default {
  ...normalVoice,
  ...zhenVoice,
  ...shiVoice,
  ...bianVoice,
  ...quanVoice,
}
