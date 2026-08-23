import { _status, game, get, lib } from "wtk"

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
    audioname: ["ol_zhangchunhua"],
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
    audioname: ["ol_zhangchunhua"],
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
  // 界张春华
  jianmie: {
    audio: 2,
    enable: "phaseUse",
    filterTarget: lib.filter.notMe,
    usable: 1,
    async content(event, trigger, player) {
      const target = event.target,
        targets = [player, target]
      const map = await game
        .chooseAnyOL(targets, get.info(event.name).chooseControl, [targets])
        .forResult()
      const getColor = (result) => {
          return result.control === "none2" ? "none" : result.control
        },
        cards_player = player.getDiscardableCards(
          player,
          "h",
          (card) => get.color(card) === getColor(map.get(player)),
        ),
        cards_target = target.getDiscardableCards(
          target,
          "h",
          (card) => get.color(card) === getColor(map.get(target)),
        )
      if (cards_player.length && cards_target.length) {
        await player.showHandcards()
        await target.showHandcards()
        await game
          .loseAsync({
            lose_list: [
              [player, cards_player],
              [target, cards_target],
            ],
          })
          .setContent("discardMultiple")
      } else if (cards_player.length) {
        await player.discard(cards_player)
      } else if (cards_target.length) {
        await target.discard(cards_target)
      }
      if (cards_player.length !== cards_target.length) {
        const user = cards_player.length > cards_target.length ? player : target
        const aim = user === player ? target : player
        const juedou = new lib.element.VCard({ name: "juedou", isCard: true })
        if (user.canUse(juedou, aim, false)) {
          await user.useCard(juedou, aim, false)
        }
      }
    },
    ai: {
      order: 1,
      result: {
        player(player, target) {
          const num =
            (player.hasSkill("shangshi")
              ? Math.max(0, player.getDamagedHp() - player.countCards("h") / 2)
              : 0) -
            player.countDiscardableCards(player, "h") / 2
          return (
            get.effect(player, { name: "juedou" }, target, player) +
            get.effect(player, { name: "draw" }, player, player) * num
          )
        },
        target(player, target) {
          return (
            get.effect(target, { name: "juedou" }, player, target) -
            (get.effect(target, { name: "draw" }, target, target) *
              target.countDiscardableCards(target, "h")) /
              2
          )
        },
      },
    },
    chooseControl(player, targets, eventId) {
      const colors = ["red", "black"]
      if (
        player
          .getDiscardableCards(player, "h")
          .some((card) => get.color(card) === "none")
      ) {
        colors.push("none2")
      }
      const str = get.translation(
        targets[0] === player ? targets[1] : targets[0],
      )
      return player
        .chooseControl(colors)
        .set("prompt", "翦灭：请选择一种颜色")
        .set(
          "prompt2",
          `展示所有手牌并弃置选择颜色的手牌，然后若你与${str}弃置牌较多的角色视为对另一名角色使用一张【决斗】`,
        )
        .set("ai", () => {
          const player = get.event().player
          const controls = get.event().controls.slice()
          return controls.sort((a, b) => {
            return (
              player
                .getDiscardableCards(player, "h")
                .filter((card) => {
                  return get.color(card) === (a === "none2" ? "none" : a)
                })
                .reduce((sum, card) => sum + get.value(card, player), 0) -
              player
                .getDiscardableCards(player, "h")
                .filter((card) => {
                  return get.color(card) === (b === "none2" ? "none" : b)
                })
                .reduce((sum, card) => sum + get.value(card, player), 0)
            )
          })[0]
        })
        .set("id", eventId)
        .set("_global_waiting", true)
    },
  },
}

export default skills
