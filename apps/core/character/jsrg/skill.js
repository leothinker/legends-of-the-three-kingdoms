import { game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 合姜维
  // 矜伐
  jsrgjinfa: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filterCard: true,
    position: "h",
    discard: false,
    lose: false,
    delay: false,
    check() {
      if (
        game.filterPlayer((current) => {
          return current.maxHp <= player.maxHp
        }).length < 2
      ) {
        return false
      }
      return 1 + Math.random()
    },
    async content(event, trigger, player) {
      await player.showCards(event.cards)
      player
        .chooseToDebate(
          game.filterPlayer((current) => {
            return current.maxHp <= player.maxHp
          }),
        )
        .set("callback", async (event) => {
          const result = event.debateResult
          if (result.bool && result.opinion) {
            const { cards: fixedCards } = event.getParent("jsrgjinfa")
            const color = get.color(fixedCards)
            const { opinion, targets } = result
            if (opinion === color) {
              const result = await player
                .chooseTarget(
                  "是否令其中至多两名角色将手牌摸至体力上限？",
                  [1, 2],
                  (card, player, target) => {
                    return get.event().targets.includes(target)
                  },
                )
                .set("targets", targets)
                .set("ai", (target) => {
                  const player = get.player()
                  const att = get.attitude(player, target)
                  if (att <= 0) {
                    return -1
                  }
                  return (
                    att *
                    Math.sqrt(
                      Math.max(0.1, target.maxHp - target.countCards("h")),
                    )
                  )
                })
                .forResult()
              if (result.bool) {
                const targets = result.targets
                targets.sortBySeat()
                player.line(targets, "green")
                for (const current of targets) {
                  if (current.countCards("h") < current.maxHp) {
                    await current.drawTo(current.maxHp)
                  }
                }
              }
            } else {
              await player.gain(lib.card.ying.getYing(2), "gain2")
            }
          }
          if (
            result.opinions.some(
              (idea) =>
                idea !== "others" &&
                result[idea].length === 1 &&
                result[idea][0][0] === player,
            )
          ) {
            const list = lib.group.slice()
            list.remove(player.group)
            list.push("cancel2")
            const { control } = await player
              .chooseControl(list)
              .set("prompt", "是否变更势力？")
              .set("ai", () => {
                if (!get.event().change) {
                  return "cancel2"
                }
                const controls = get.event().controls
                const groups = ["wei", "shu"].filter((g) =>
                  controls.includes(g),
                )
                if (groups.length) {
                  return groups.randomGet()
                }
                return controls.randomGet()
              })
              .set(
                "change",
                ["wei", "shu"].includes(player.group)
                  ? Math.random() < 0.5
                  : true,
              )
              .forResult()
            if (control !== "cancel2") {
              player.popup(`${control}2`, get.groupnature(control, "raw"))
              player.changeGroup(control)
            }
          }
        })
    },
    ai: {
      order(item, player) {
        if (player.countCards("h") === 1) {
          return 10
        }
        return 1
      },
      result: {
        player: 1,
      },
    },
  },
  // 复谋
  jsrgfumou: {
    audio: 2,
    trigger: { global: "chooseToDebateAfter" },
    groupSkill: "wei",
    forced: true,
    locked: false,
    filter(event, player) {
      if (player.group !== "wei") {
        return false
      }
      if (!event.targets.includes(player)) {
        return false
      }
      if (event.red.some((i) => i[0] === player)) {
        return event.black.length
      }
      if (event.black.some((i) => i[0] === player)) {
        return event.red.length
      }
      return false
    },
    async content(event, trigger, player) {
      const targets = []
      if (trigger.red.some((i) => i[0] === player)) {
        targets.addArray(trigger.black.map((i) => i[0]))
      }
      if (trigger.black.some((i) => i[0] === player)) {
        targets.addArray(trigger.red.map((i) => i[0]))
      }
      player.line(targets, "thunder")
      targets.forEach((target) => {
        target.addTempSkill("jsrgfumou_forbid")
        target.markAuto(
          "jsrgfumou_forbid",
          ["red", "black"].filter((color) => {
            return trigger[color].some((i) => i[0] === target)
          }),
        )
      })
      game.broadcastAll((targets) => {
        lib.skill.jsrgfumou_backup.targets = targets
      }, targets)
      const next = player.chooseToUse()
      next.set(
        "openskilldialog",
        `是否将一张【影】当【出其不意】对一名与你意见不同的角色使用？`,
      )
      next.set("norestore", true)
      next.set("_backupevent", "jsrgfumou_backup")
      next.set("custom", {
        add: {},
        replace: { window() {} },
      })
      next.backup("jsrgfumou_backup")
    },
    subSkill: {
      backup: {
        filterCard(card) {
          return get.itemtype(card) === "card" && get.name(card) === "ying"
        },
        viewAs: { name: "chuqibuyi" },
        selectCard: 1,
        position: "hs",
        log: false,
        filterTarget(card, player, target) {
          const targets = lib.skill.jsrgfumou_backup.targets
          if (
            !targets.includes(target) ||
            ui.selected.targets.containsSome(targets)
          ) {
            return false
          }
          return lib.filter.targetEnabled.apply(this, arguments)
        },
        ai1(card) {
          return 6 - get.value(card)
        },
      },
      forbid: {
        charlotte: true,
        onremove: true,
        mod: {
          cardEnabled(card, player) {
            const color = get.color(card)
            if (
              color !== "unsure" &&
              player.getStorage("jsrgfumou_forbid").includes(color)
            ) {
              return false
            }
          },
          cardRespondable(card, player) {
            const color = get.color(card)
            if (
              color !== "unsure" &&
              player.getStorage("jsrgfumou_forbid").includes(color)
            ) {
              return false
            }
          },
          cardSavable(card, player) {
            const color = get.color(card)
            if (
              color !== "unsure" &&
              player.getStorage("jsrgfumou_forbid").includes(color)
            ) {
              return false
            }
          },
        },
        mark: true,
        intro: {
          content: "本回合不能使用或打出$牌",
        },
      },
    },
  },
  // 选锋
  jsrgxuanfeng: {
    audio: 2,
    enable: "chooseToUse",
    filterCard: { name: "ying" },
    position: "hs",
    groupSkill: "shu",
    locked: false,
    viewAs: {
      name: "sha",
      nature: "stab",
      storage: { jsrgxuanfeng: true },
    },
    viewAsFilter(player) {
      if (player.group !== "shu") {
        return false
      }
      if (!player.countCards("hs", "ying")) {
        return false
      }
    },
    prompt: "将一张【影】当无距离次数限制的刺【杀】使用",
    check(card) {
      const val = get.value(card)
      return 5 - val
    },
    mod: {
      targetInRange(card, player, target) {
        if (card.storage?.jsrgxuanfeng) {
          return true
        }
      },
      cardUsable(card) {
        if (card.storage?.jsrgxuanfeng) {
          return Infinity
        }
      },
    },
    ai: {
      order: 2,
      combo: "jsrgjinfa",
    },
  },
}

export default skills
