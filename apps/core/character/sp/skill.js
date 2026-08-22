import { _status, get } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // SP姜维
  // 困奋
  kunfen: {
    audio: 2,
    audioname2: { ol_sb_jiangwei: "kunfen_ol_sb_jiangwei" },
    trigger: { player: "phaseJieshuBegin" },
    locked(skill, player) {
      if (!player?.storage.kunfen) {
        return true
      }
      return false
    },
    direct: true,
    content() {
      "step 0"
      if (
        player.storage.kunfen ||
        (get.mode() === "guozhan" && player.hiddenSkills.includes("kunfen"))
      ) {
        if (!player.storage.kunfen) {
          event.skillHidden = true
        }
        player
          .chooseBool(get.prompt("kunfen"), "失去1点体力，然后摸两张牌")
          .set("ai", () => {
            var player = _status.event.player
            if (player.hp > 3) {
              return true
            }
            if (player.hp === 3 && player.countCards("h") < 3) {
              return true
            }
            if (player.hp === 2 && player.countCards("h") === 0) {
              return true
            }
            return false
          })
      } else {
        event._result = { bool: true }
      }
      ;("step 1")
      if (result.bool) {
        player.logSkill("kunfen")
        player.loseHp()
      } else {
        event.finish()
      }
      ;("step 2")
      player.draw(2)
    },
    ai: { threaten: 1.5 },
  },
  // 逢亮
  fengliang: {
    skillAnimation: true,
    animationColor: "thunder",
    juexingji: true,
    audio: 2,
    derivation: "tiaoxin",
    trigger: { player: "dying" },
    //priority:10,
    forced: true,
    content() {
      "step 0"
      player.awakenSkill(event.name)
      player.loseMaxHp()
      ;("step 1")
      if (player.hp < 2) {
        player.recover(2 - player.hp)
      }
      ;("step 2")
      player.storage.kunfen = true
      player.addSkills("tiaoxin")
    },
  },
  // 张春华
  // 绝情
  jueqing: {
    audio: 2,
    trigger: { source: "damageBefore" },
    forced: true,
    async content(event, trigger, player) {
      trigger.cancel()
      trigger.player.loseHp(trigger.num)
    },
    ai: {
      jueqing: true,
    },
  },
  // 伤逝
  shangshi: {
    audio: 2,
    trigger: {
      player: ["loseAfter", "changeHp", "gainMaxHpAfter", "loseMaxHpAfter"],
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    frequent: true,
    filter(event, player) {
      if (event.getl && !event.getl(player)) {
        return false
      }
      return player.countCards("h") < player.getDamagedHp()
    },
    async content(event, trigger, player) {
      player.draw(player.getDamagedHp() - player.countCards("h"))
    },
    ai: {
      noh: true,
      freeSha: true,
      freeShan: true,
      skillTagFilter(player, tag) {
        if (player.maxHp - player.hp < player.countCards("h")) {
          return false
        }
      },
    },
  },
}

export default skills
