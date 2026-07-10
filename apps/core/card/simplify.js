import { _status, ai, game, get, lib, ui } from "wtk"

game.import("card", () => ({
  name: "simplify",
  connect: true,
  card: {
    damage: {
      ai: {
        result: {
          target: -1.5,
        },
        tag: {
          damage: 1,
        },
      },
    },
    draw: {
      ai: {
        result: {
          target: 1,
        },
        tag: {
          draw: 1,
        },
      },
    },
    losehp: {
      ai: {
        result: {
          target: -1.5,
        },
        tag: {
          loseHp: 1,
        },
      },
    },
    recover: {
      ai: {
        result: {
          target: 1.5,
        },
        tag: {
          recover: 1,
        },
      },
    },
    respondShan: {
      ai: {
        result: {
          target: -1.5,
        },
        tag: {
          respond: 1,
          respondShan: 1,
          damage: 1,
        },
      },
    },
    sha: {
      audio: true,
      fullskin: true,
      nature: ["thunder", "fire", "kami", "ice"],
      type: "basic",
      enable: true,
      usable: 1,
      updateUsable: "phaseUse",
      global: "icesha_skill",
      range(card, player, target) {
        return player.inRange(target)
      },
      selectTarget: 1,
      cardPrompt(card) {
        var natures = get.natureList(Array.isArray(card) ? card[3] : card)
        if (lib.translate[`sha_nature_${natures[0]}_info`]) {
          return lib.translate[`sha_nature_${natures[0]}_info`]
        }
        var str = "出牌阶段，对你攻击范围内的一名角色使用。其须使用一张【闪】，"
        if (natures.includes("stab")) {
          str += "且在此之后需弃置一张手牌（没有则不弃），"
        }
        str += "否则你对其造成1点"
        var linked = lib.linked.filter((n) => natures.includes(n))
        if (linked.length) {
          str += `${get.translation(get.nature(linked))}属性`
        }
        str += "伤害。"
        return str
      },
      defaultYingbianEffect: "add",
      filterTarget(card, player, target) {
        return player !== target
      },
      content() {
        "step 0"
        if (
          typeof event.shanRequired !== "number" ||
          !event.shanRequired ||
          event.shanRequired < 0
        ) {
          event.shanRequired = 1
        }
        if (typeof event.baseDamage !== "number") {
          event.baseDamage = 1
        }
        if (typeof event.extraDamage !== "number") {
          event.extraDamage = 0
        }
        ;("step 1")
        if (
          event.directHit ||
          event.directHit2 ||
          (!_status.connectMode && lib.config.skip_shan && !target.hasShan())
        ) {
          event._result = { bool: false }
        } else if (event.skipShan) {
          event._result = { bool: true, result: "shaned" }
        } else {
          var next = target.chooseToUse("请使用一张闪响应杀")
          next.set("type", "respondShan")
          next.set("filterCard", (card, player) => {
            if (get.name(card) !== "shan") {
              return false
            }
            return lib.filter.cardEnabled(card, player, "forceEnable")
          })
          if (event.shanRequired > 1) {
            next.set("prompt2", `（共需使用${event.shanRequired}张闪）`)
          } else if (game.hasNature(event.card, "stab")) {
            next.set("prompt2", "（在此之后仍需弃置一张手牌）")
          }
          next
            .set("ai1", (card) => {
              if (get.event().toUse) {
                return get.order(card)
              }
              return 0
            })
            .set("shanRequired", event.shanRequired)
          next.set("respondTo", [player, card])
          next.set(
            "toUse",
            (() => {
              if (target.hasSkillTag("noShan", null, "use")) {
                return false
              }
              if (target.hasSkillTag("useShan", null, "use")) {
                return true
              }
              if (
                target.isLinked() &&
                game.hasNature(event.card) &&
                game.hasPlayer((cur) => {
                  if (cur === target || !cur.isLinked()) {
                    return false
                  }
                  return true //return get.attitude(target, cur) <= 0;
                })
              ) {
                if (get.attitude(target, player._trueMe || player) > 0) {
                  return false
                }
              }
              if (
                event.baseDamage + event.extraDamage <= 0 &&
                !game.hasNature(event.card, "ice")
              ) {
                return false
              }
              if (
                !game.hasNature(event.card, "ice") &&
                !player.hasSkillTag("jueqing", false, target) &&
                !target.hasSkill("gangzhi") &&
                get.damageEffect(
                  target,
                  player,
                  target,
                  get.nature(event.card),
                ) >= 0
              ) {
                return false
              }
              if (
                event.baseDamage + event.extraDamage >=
                target.hp +
                  (player.hasSkillTag("jueqing", false, target) ||
                  target.hasSkill("gangzhi")
                    ? 0
                    : target.hujia)
              ) {
                return true
              }
              if (
                event.shanRequired > 1 &&
                !target.hasSkillTag("freeShan", null, {
                  player: player,
                  card: event.card,
                  type: "use",
                }) &&
                target.mayHaveShan(target, "use", true, "count") <
                  event.shanRequired - (event.shanIgnored || 0)
              ) {
                return false
              }
              return true
            })(),
          )
          //next.autochoose=lib.filter.autoRespondShan;
        }
        ;("step 2")
        if (!result?.bool || !result.result || result.result !== "shaned") {
          event.trigger("shaHit")
        } else {
          event.shanRequired--
          if (event.shanRequired > 0) {
            event.goto(1)
          } else if (
            game.hasNature(event.card, "stab") &&
            target.countCards("h") > 0
          ) {
            event.responded = result
            event.goto(4)
          } else {
            event.trigger("shaMiss")
            event.responded = result
          }
        }
        ;("step 3")
        if (
          (!result?.bool || !result.result || result.result !== "shaned") &&
          !event.unhurt
        ) {
          if (
            !event.directHit &&
            !event.directHit2 &&
            lib.filter.cardEnabled(
              new lib.element.VCard({ name: "shan" }),
              target,
              "forceEnable",
            ) &&
            target.countCards("hs") > 0 &&
            get.damageEffect(target, player, target) < 0
          ) {
            target.addGaintag(target.getCards("hs"), "sha_notshan")
          }
          target.damage(get.nature(event.card))
          event.result = { bool: true }
          event.trigger("shaDamage")
        } else {
          event.result = { bool: false }
          event.trigger("shaUnhirt")
        }
        event.finish()
        ;("step 4")
        target
          .chooseToDiscard("刺杀：请弃置一张牌，否则此【杀】依然造成伤害")
          .set("ai", (card) => {
            var target = _status.event.player
            var evt = _status.event.getParent()
            var bool = true
            if (
              get.damageEffect(target, evt.player, target, evt.card.nature) >= 0
            ) {
              bool = false
            }
            if (bool) {
              return 8 - get.useful(card)
            }
            return 0
          })
        ;("step 5")
        if (!result?.bool && !event.unhurt) {
          target.damage(get.nature(event.card))
          event.result = { bool: true }
          event.trigger("shaDamage")
          event.finish()
        } else {
          event.trigger("shaMiss")
        }
        ;("step 6")
        if (!result?.bool && !event.unhurt) {
          target.damage(get.nature(event.card))
          event.result = { bool: true }
          event.trigger("shaDamage")
          event.finish()
        } else {
          event.result = { bool: false }
          event.trigger("shaUnhirt")
        }
      },
      ai: {
        yingbian(card, player, targets, viewer) {
          if (get.attitude(viewer, player) <= 0) {
            return 0
          }
          var base = 0,
            hit = false
          if (get.cardtag(card, "yingbian_hit")) {
            hit = true
            if (
              targets.some((target) => {
                return (
                  target.mayHaveShan(viewer, "use") &&
                  get.attitude(viewer, target) < 0 &&
                  get.damageEffect(
                    target,
                    player,
                    viewer,
                    get.natureList(card),
                  ) > 0
                )
              })
            ) {
              base += 5
            }
          }
          if (get.cardtag(card, "yingbian_add")) {
            if (
              game.hasPlayer(
                (current) =>
                  !targets.includes(current) &&
                  lib.filter.targetEnabled2(card, player, current) &&
                  get.effect(current, card, player, player) > 0,
              )
            ) {
              base += 5
            }
          }
          if (get.cardtag(card, "yingbian_damage")) {
            if (
              targets.some((target) => {
                return (
                  get.attitude(player, target) < 0 &&
                  (hit ||
                    !target.mayHaveShan(viewer, "use") ||
                    player.hasSkillTag(
                      "directHit_ai",
                      true,
                      {
                        target: target,
                        card: card,
                      },
                      true,
                    )) &&
                  !target.hasSkillTag("filterDamage", null, {
                    player: player,
                    card: card,
                    jiu: true,
                  })
                )
              })
            ) {
              base += 5
            }
          }
          return base
        },
        canLink(player, target, card) {
          if (!target.isLinked() && !player.hasSkill("wutiesuolian_skill")) {
            return false
          }
          if (
            player.hasSkill("jueqing") ||
            player.hasSkill("gangzhi") ||
            target.hasSkill("gangzhi")
          ) {
            return false
          }
          const obj = {}
          if (
            get.attitude(player, target) > 0 &&
            get.attitude(target, player) > 0
          ) {
            if (
              (player.hasSkill("jiu") ||
                player.hasSkillTag("damageBonus", true, {
                  target: target,
                  card: card,
                })) &&
              !target.hasSkillTag("filterDamage", null, {
                player: player,
                card: card,
                jiu: player.hasSkill("jiu"),
              })
            ) {
              obj.num = 2
            }
            if (target.hp > obj.num) {
              obj.odds = 1
            }
          }
          if (!obj.odds) {
            obj.odds = 1 - target.mayHaveShan(player, "use", true, "odds")
          }
          return obj
        },
        basic: {
          useful: [5, 3, 1],
          value: [5, 3, 1],
        },
        order(item, player) {
          let res = 3.2
          if (player.hasSkillTag("presha", true, null, true)) {
            res = 10
          }
          if (
            typeof item !== "object" ||
            !game.hasNature(item, "linked") ||
            game.countPlayer((cur) => cur.isLinked()) < 2
          ) {
            return res
          }
          //let used = player.getCardUsable('sha') - 1.5, natures = ['thunder', 'fire', 'ice', 'kami'];
          const uv = player.getUseValue(item, true)
          if (uv <= 0) {
            return res
          }
          const temp = player.getUseValue("sha", true) - uv
          if (temp < 0) {
            return res + 0.15
          }
          if (temp > 0) {
            return res - 0.15
          }
          return res
        },
        result: {
          target(player, target, card, isLink) {
            let eff = -1.5,
              odds = 1.35,
              num = 1
            if (isLink) {
              eff = isLink.eff || -2
              odds = isLink.odds || 0.65
              num = isLink.num || 1
              if (
                num > 1 &&
                target.hasSkillTag("filterDamage", null, {
                  player: player,
                  card: card,
                  jiu: player.hasSkill("jiu"),
                })
              ) {
                num = 1
              }
              return odds * eff * num
            }
            if (
              player.hasSkill("jiu") ||
              player.hasSkillTag("damageBonus", true, {
                target: target,
                card: card,
              })
            ) {
              if (
                target.hasSkillTag("filterDamage", null, {
                  player: player,
                  card: card,
                  jiu: player.hasSkill("jiu"),
                })
              ) {
                eff = -0.5
              } else {
                num = 2
                if (get.attitude(player, target) > 0) {
                  eff = -7
                } else {
                  eff = -4
                }
              }
            }
            if (
              !player.hasSkillTag(
                "directHit_ai",
                true,
                {
                  target: target,
                  card: card,
                },
                true,
              )
            ) {
              odds -= 0.7 * target.mayHaveShan(player, "use", true, "odds")
            }
            _status.event.putTempCache("sha_result", "eff", {
              bool: target.hp > num && get.attitude(player, target) > 0,
              card: ai.getCacheKey(card, true),
              eff: eff,
              odds: odds,
            })
            return odds * eff
          },
        },
        tag: {
          respond: 1,
          respondShan: 1,
          damage(card) {
            if (game.hasNature(card, "poison")) {
              return
            }
            return 1
          },
          natureDamage(card) {
            if (game.hasNature(card, "linked")) {
              return 1
            }
          },
          fireDamage(card, nature) {
            if (game.hasNature(card, "fire")) {
              return 1
            }
          },
          thunderDamage(card, nature) {
            if (game.hasNature(card, "thunder")) {
              return 1
            }
          },
          poisonDamage(card, nature) {
            if (game.hasNature(card, "poison")) {
              return 1
            }
          },
        },
      },
    },
    shacopy: {
      ai: {
        basic: {
          useful: [5, 3, 1],
          value: [5, 3, 1],
        },
        order: 3,
        result: {
          target: -1.5,
        },
        tag: {
          respond: 1,
          respondShan: 1,
          damage(card) {
            if (game.hasNature(card, "poison")) {
              return
            }
            return 1
          },
          natureDamage(card) {
            if (game.hasNature(card)) {
              return 1
            }
          },
          fireDamage(card, nature) {
            if (game.hasNature(card, "fire")) {
              return 1
            }
          },
          thunderDamage(card, nature) {
            if (game.hasNature(card, "thunder")) {
              return 1
            }
          },
          poisonDamage(card, nature) {
            if (game.hasNature(card, "poison")) {
              return 1
            }
          },
        },
      },
    },
    shan: {
      audio: true,
      fullskin: true,
      type: "basic",
      cardcolor: "red",
      notarget: true,
      nodelay: true,
      defaultYingbianEffect: "draw",
      content() {
        event.result = "shaned"
        event.getParent().delayx = false
        game.delay(0.5)
      },
      ai: {
        order: 3,
        basic: {
          useful: (card, i) => {
            let player = _status.event.player,
              basic = [7, 5.1, 2],
              num = basic[Math.min(2, i)]
            if (player.hp > 2 && player.hasSkillTag("maixie")) {
              num *= 0.57
            }
            if (
              player.hasSkillTag("freeShan", false, null, true) ||
              player.getEquip("rewrite_renwang")
            ) {
              num *= 0.8
            }
            return num
          },
          value: [7, 5.1, 2],
        },
        result: { player: 1 },
        //expose:0.2
      },
    },
    tao: {
      fullskin: true,
      type: "basic",
      cardcolor: "red",
      toself: true,
      enable(card, player) {
        return player.isDamaged()
      },
      savable: true,
      selectTarget: -1,
      filterTarget(card, player, target) {
        return target === player && target.isDamaged()
      },
      modTarget(card, player, target) {
        return target.isDamaged()
      },
      content() {
        target.recover()
      },
      ai: {
        basic: {
          order: (card, player) => {
            if (player.hasSkillTag("pretao")) {
              return 9
            }
            return 2
          },
          useful: (card, i) => {
            const player = _status.event.player
            if (
              !game.checkMod(card, player, "unchanged", "cardEnabled2", player)
            ) {
              return 2 / (1 + i)
            }
            let fs = game.filterPlayer((current) => {
                return get.attitude(player, current) > 0 && current.hp <= 2
              }),
              damaged = 0,
              needs = 0
            fs.forEach((f) => {
              if (f.hp > 3 || !lib.filter.cardSavable(card, player, f)) {
                return
              }
              if (f.hp > 1) {
                damaged++
              } else {
                needs++
              }
            })
            if (needs && damaged) {
              return 5 * needs + 3 * damaged
            }
            if (needs + damaged > 1 || player.hasSkillTag("maixie")) {
              return 8
            }
            if (player.hp / player.maxHp < 0.7) {
              return 7 + Math.abs(player.hp / player.maxHp - 0.5)
            }
            if (needs) {
              return 7
            }
            if (damaged) {
              return Math.max(3, 7.8 - i)
            }
            return Math.max(1, 7.2 - i)
          },
          value: (card, player) => {
            let fs = game.filterPlayer((current) => {
                return get.attitude(_status.event.player, current) > 0
              }),
              damaged = 0,
              needs = 0
            fs.forEach((f) => {
              if (!player.canUse("tao", f)) {
                return
              }
              if (f.hp <= 1) {
                needs++
              } else if (f.hp === 2) {
                damaged++
              }
            })
            if ((needs && damaged) || player.hasSkillTag("maixie")) {
              return Math.max(9, 5 * needs + 3 * damaged)
            }
            if (needs || damaged > 1) {
              return 8
            }
            if (damaged) {
              return 7.5
            }
            return Math.max(5, 9.2 - player.hp)
          },
        },
        result: {
          target: (player, target) => {
            if (target.hasSkillTag("maixie")) {
              return 3
            }
            return 2
          },
          target_use: (player, target, card) => {
            const mode = get.mode(),
              taos = player.getCards(
                "hs",
                (i) =>
                  get.name(i) === "tao" &&
                  lib.filter.cardEnabled(i, target, "forceEnable"),
              )
            if (target !== _status.event.dying) {
              if (
                !player.isPhaseUsing() ||
                player.needsToDiscard(0, (i, player) => {
                  return !player.canIgnoreHandcard(i) && taos.includes(i)
                }) ||
                player.hasSkillTag(
                  "nokeep",
                  true,
                  {
                    card: card,
                    target: target,
                  },
                  true,
                )
              ) {
                return 2
              }
              let min = 8.1 - (4.5 * player.hp) / player.maxHp,
                nd = player.needsToDiscard(0, (i, player) => {
                  return (
                    !player.canIgnoreHandcard(i) &&
                    (taos.includes(i) || get.value(i) >= min)
                  )
                }),
                keep = nd ? 0 : 2
              if (
                nd > 2 ||
                (taos.length > 1 &&
                  (nd > 1 || (nd && player.hp < 1 + taos.length))) ||
                (target.identity === "zhu" &&
                  (nd || target.hp < 3) &&
                  (mode === "identity" ||
                    mode === "versus" ||
                    mode === "chess")) ||
                !player.hasFriend()
              ) {
                return 2
              }
              if (
                game.hasPlayer((current) => {
                  return (
                    player !== current &&
                    current.identity === "zhu" &&
                    current.hp < 3 &&
                    (mode === "identity" ||
                      mode === "versus" ||
                      mode === "chess") &&
                    get.attitude(player, current) > 0
                  )
                })
              ) {
                keep = 3
              } else if (nd === 2 || player.hp < 2) {
                return 2
              }
              if (nd === 2 && player.hp <= 1) {
                return 2
              }
              if (keep === 3) {
                return 0
              }
              if (taos.length <= player.hp / 2) {
                keep = 1
              }
              if (
                keep &&
                game.countPlayer((current) => {
                  if (
                    player !== current &&
                    current.hp < 3 &&
                    player.hp > current.hp &&
                    get.attitude(player, current) > 2
                  ) {
                    keep += player.hp - current.hp
                    return true
                  }
                  return false
                })
              ) {
                if (keep > 2) {
                  return 0
                }
              }
              return 2
            }
            if (target.isZhu2() || target === game.boss) {
              return 2
            }
            if (player !== target) {
              if (target.hp < 0 && taos.length + target.hp <= 0) {
                return 0
              }
              if (Math.abs(get.attitude(player, target)) < 1) {
                return 0
              }
            }
            if (!player.getFriends().length) {
              return 2
            }
            let tri = _status.event.getTrigger(),
              num = game.countPlayer((current) => {
                if (get.attitude(current, target) > 0) {
                  return current.countCards(
                    "hs",
                    (i) =>
                      get.name(i) === "tao" &&
                      lib.filter.cardEnabled(i, target, "forceEnable"),
                  )
                }
              }),
              dis = 1,
              t = _status.currentPhase || game.me
            while (t !== target) {
              const att = get.attitude(player, t)
              if (att < -2) {
                dis++
              } else if (att < 1) {
                dis += 0.45
              }
              t = t.next
            }
            if (mode === "identity") {
              if (tri && tri.name === "dying") {
                if (target.identity === "fan") {
                  if (
                    (!tri.source && player !== target) ||
                    (tri.source &&
                      tri.source !== target &&
                      player.getFriends().includes(tri.source.identity))
                  ) {
                    if (
                      num > dis ||
                      (player === target &&
                        player.countCards("hs", { type: "basic" }) > 1.6 * dis)
                    ) {
                      return 2
                    }
                    return 0
                  }
                } else if (
                  tri.source?.isZhu &&
                  (target.identity === "zhong" ||
                    target.identity === "mingzhong") &&
                  (tri.source.countCards("he") > 2 ||
                    (player === tri.source &&
                      player.hasCard((i) => i.name !== "tao", "he")))
                ) {
                  return 2
                }
                //if(player!==target&&!target.isZhu&&target.countCards('hs')<dis) return 0;
              }
              if (player.identity === "zhu") {
                if (
                  player.hp <= 1 &&
                  player !== target &&
                  taos + player.countCards("hs", "jiu") <=
                    Math.min(
                      dis,
                      game.countPlayer((current) => {
                        return current.identity === "fan"
                      }),
                    )
                ) {
                  return 0
                }
              }
            } else if (
              mode === "stone" &&
              target.isMin() &&
              player !== target &&
              tri &&
              tri.name === "dying" &&
              player.side === target.side &&
              tri.source !== target.getEnemy()
            ) {
              return 0
            }
            return 2
          },
        },
        tag: {
          recover: 1,
          save: 1,
        },
      },
    },
    juedou: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      defaultYingbianEffect: "hit",
      filterTarget(card, player, target) {
        return target !== player
      },
      async content(event, trigger, player) {
        const target = event.target
        if (event.turn === undefined) {
          event.turn = target
        }
        event.source = player
        if (typeof event.baseDamage !== "number") {
          event.baseDamage = 1
        }
        if (typeof event.extraDamage !== "number") {
          event.extraDamage = 0
        }
        if (!event.shaReq) {
          event.shaReq = {}
        }
        if (typeof event.shaReq[player.playerid] !== "number") {
          event.shaReq[player.playerid] = 1
        }
        if (typeof event.shaReq[target.playerid] !== "number") {
          event.shaReq[target.playerid] = 1
        }
        event.playerCards = []
        event.targetCards = []
        while (true) {
          await event.trigger("juedou")
          event.shaRequired = event.shaReq[event.turn.playerid]
          let damaged = false
          while (event.shaRequired > 0) {
            let result = { bool: false }
            if (!event.directHit) {
              const next = event.turn.chooseToRespond()
              next.set("filterCard", (card, player) => {
                if (get.name(card) !== "sha") {
                  return false
                }
                return lib.filter.cardRespondable(card, player)
              })
              if (event.shaRequired > 1) {
                next.set("prompt2", `共需打出${event.shaRequired}张杀`)
              }
              next.set("ai", (card) => {
                if (get.event().toRespond) {
                  return get.order(card)
                }
                return -1
              })
              next.set("shaRequired", event.shaRequired)
              next.set(
                "toRespond",
                (() => {
                  const responder = event.turn
                  const opposite = event.source
                  if (responder.hasSkillTag("noSha", null, "respond")) {
                    return false
                  }
                  if (responder.hasSkillTag("useSha", null, "respond")) {
                    return true
                  }
                  if (
                    event.baseDamage + event.extraDamage <= 0 ||
                    player.hasSkillTag("notricksource", null, event) ||
                    responder.hasSkillTag("notrick", null, event)
                  ) {
                    return false
                  }
                  if (
                    event.baseDamage + event.extraDamage >=
                    responder.hp +
                      (opposite.hasSkillTag("jueqing", false, target) ||
                      target.hasSkill("gangzhi")
                        ? 0
                        : target.hujia)
                  ) {
                    return true
                  }
                  const damage = get.damageEffect(
                    responder,
                    opposite,
                    responder,
                  )
                  if (damage >= 0) {
                    return false
                  }
                  if (
                    event.shaRequired > 1 &&
                    !target.hasSkillTag("freeSha", null, {
                      player: player,
                      card: event.card,
                      type: "respond",
                    }) &&
                    event.shaRequired >
                      responder.mayHaveSha(responder, "respond", null, "count")
                  ) {
                    return false
                  }
                  if (
                    get.attitude(responder, opposite._trueMe || opposite) > 0 &&
                    damage >= get.damageEffect(opposite, responder, responder)
                  ) {
                    return false
                  }
                  // if (responder.hasSkill("naman")) {
                  // 	return true;
                  // }
                  return true
                })(),
              )
              next.set("respondTo", [player, event.card])
              next.autochoose = lib.filter.autoRespondSha
              if (event.turn === target) {
                next.source = player
              } else {
                next.source = target
              }
              result = await next.forResult()
            }
            if (result?.bool) {
              event.shaRequired--
              if (result.cards?.length) {
                if (event.turn === target) {
                  event.targetCards.addArray(result.cards)
                } else {
                  event.playerCards.addArray(result.cards)
                }
              }
            } else {
              await event.turn.damage(event.source)
              damaged = true
              break
            }
          }
          if (damaged) {
            break
          }
          ;[event.source, event.turn] = [event.turn, event.source]
        }
      },
      ai: {
        wuxie(target, card, player, viewer, status) {
          if (
            player === game.me &&
            get.attitude(viewer, player._trueMe || player) > 0
          ) {
            return 0
          }
          if (
            status *
              get.attitude(viewer, target) *
              get.effect(target, card, player, target) >=
            0
          ) {
            return 0
          }
        },
        basic: {
          order: 5,
          useful: 1,
          value: 5.5,
        },
        result: {
          player(player, target, card) {
            if (
              player.hasSkillTag(
                "directHit_ai",
                true,
                {
                  target: target,
                  card: card,
                },
                true,
              )
            ) {
              return 0
            }
            if (get.damageEffect(target, player, target) >= 0) {
              return 0
            }
            const pd = get.damageEffect(player, target, player),
              att = get.attitude(player, target)
            if (att > 0 && get.damageEffect(target, player, player) > pd) {
              return 0
            }
            const ts = target.mayHaveSha(player, "respond", null, "count"),
              ps = player.mayHaveSha(
                player,
                "respond",
                player.getCards("h", (i) => {
                  return (
                    card === i ||
                    card.cards?.includes(i) ||
                    ui.selected.cards.includes(i)
                  )
                }),
                "count",
              )
            if (ts < 1 && ts * 8 < player.hp ** 2) {
              return 0
            }
            if (att > 0) {
              if (ts < 1) {
                return 0
              }
              return -2
            }
            if (pd >= 0) {
              return pd / get.attitude(player, player)
            }
            if (ts - ps + Math.exp(0.8 - player.hp) < 1) {
              return -ts
            }
            return -2 - ts
          },
          target(player, target, card) {
            if (
              player.hasSkillTag(
                "directHit_ai",
                true,
                {
                  target: target,
                  card: card,
                },
                true,
              )
            ) {
              return -2
            }
            const td = get.damageEffect(target, player, target)
            if (td >= 0) {
              return td / get.attitude(target, target)
            }
            const pd = get.damageEffect(player, target, player),
              att = get.attitude(player, target)
            if (att > 0 && get.damageEffect(target, player, player) > pd) {
              return -2
            }
            const ts = target.mayHaveSha(player, "respond", null, "count"),
              ps = player.mayHaveSha(
                player,
                "respond",
                player.getCards("h", (i) => {
                  return (
                    card === i ||
                    card.cards?.includes(i) ||
                    ui.selected.cards.includes(i)
                  )
                }),
                "count",
              )
            if (ts < 1) {
              return -1.5
            }
            if (att > 0) {
              return -2
            }
            if (pd >= 0) {
              return -1
            }
            if (ts - ps < 1) {
              return -2 - ts
            }
            return -ts
          },
        },
        tag: {
          respond: 2,
          respondSha: 2,
          damage: 1,
        },
      },
    },
    jiedao: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      singleCard: true,
      targetprompt: ["被借刀", "出杀目标"],
      complexSelect: true,
      complexTarget: true,
      multicheck() {
        var card = { name: "sha", isCard: true }
        return game.hasPlayer((current) => {
          if (current.getEquips(1).length > 0) {
            return game.hasPlayer(
              (current2) =>
                current.inRange(current2) &&
                lib.filter.targetEnabled(card, current, current2),
            )
          }
        })
      },
      filterTarget(card, player, target) {
        var card = { name: "sha", isCard: true }
        return (
          player !== target &&
          target.getEquips(1).length > 0 &&
          game.hasPlayer(
            (current) =>
              target !== current &&
              target.inRange(current) &&
              lib.filter.targetEnabled(card, target, current),
          )
        )
      },
      filterAddedTarget(card, player, target, preTarget) {
        var card = { name: "sha", isCard: true }
        return (
          target !== preTarget &&
          preTarget.inRange(target) &&
          lib.filter.targetEnabled(card, preTarget, target)
        )
      },
      content() {
        "step 0"
        if (
          event.directHit ||
          !event.addedTarget ||
          (!_status.connectMode && lib.config.skip_shan && !target.hasSha())
        ) {
          event.directfalse = true
        } else {
          target
            .chooseToUse(
              "对" +
                get.translation(event.addedTarget) +
                "使用一张杀，或令" +
                get.translation(player) +
                "获得你的武器牌",
              function (card, player) {
                if (get.name(card) !== "sha") {
                  return false
                }
                return lib.filter.filterCard.apply(this, arguments)
              },
            )
            .set("targetRequired", true)
            .set("complexSelect", true)
            .set("complexTarget", true)
            .set("filterTarget", function (card, player, target) {
              if (
                target !== _status.event.sourcex &&
                !ui.selected.targets.includes(_status.event.sourcex)
              ) {
                return false
              }
              return lib.filter.filterTarget.apply(this, arguments)
            })
            .set("sourcex", event.addedTarget)
            .set("addCount", false)
            .set("respondTo", [player, card])
        }
        ;("step 1")
        if (event.directfalse || result.bool === false) {
          const cards = target.getGainableCards(player, "e", (card) =>
            get.subtypes(card)?.includes("equip1"),
          )
          if (cards.length) {
            player.gain(cards, target, "give", "bySelf")
          }
        }
      },
      ai: {
        wuxie(target, card, player, viewer) {
          if (
            player === game.me &&
            get.attitude(viewer, player._trueMe || player) > 0
          ) {
            return 0
          }
        },
        basic: {
          order: 8,
          value: 2,
          useful: 1,
        },
        result: {
          player: (player, target) => {
            if (
              !target.hasSkillTag("noe") &&
              get.attitude(player, target) > 0
            ) {
              return 0
            }
            return (
              (player.hasSkillTag("noe") ? 0.32 : 0.15) *
              target.getEquips(1).reduce((num, i) => {
                return num + get.value(i, player)
              }, 0)
            )
          },
          target: (player, target, card) => {
            const targets = ui.selected.targets.slice()
            if (_status.event.preTarget) {
              targets.add(_status.event.preTarget)
            }
            if (targets.length) {
              const preTarget = targets.at(-1),
                pre = _status.event.getTempCache(
                  "jiedao_result",
                  preTarget.playerid,
                )
              if (
                pre?.target?.isIn() &&
                pre.card === ai.getCacheKey(card, true)
              ) {
                return target === pre.target ? pre.res : 0
              }
              return (
                (get.effect(target, { name: "sha" }, preTarget, target) /
                  get.attitude(target, target)) *
                preTarget.mayHaveSha(player, "use", null, "odds")
              )
            }
            let odds = target.mayHaveSha(player, "use", null, "odds"),
              addTar = null,
              sha = game
                .filterPlayer((cur) => {
                  return get
                    .info({ name: "jiedao" })
                    .filterAddedTarget(null, player, cur, target)
                })
                .reduce((num, current) => {
                  const eff = get.effect(
                    current,
                    { name: "sha" },
                    target,
                    player,
                  )
                  if (eff < num) {
                    return num
                  }
                  addTar = current
                  return eff
                }, -Infinity)
            if (addTar) {
              sha = get.effect(addTar, { name: "sha" }, target, target) / 10
            }
            let res =
              target.getEquips(1).reduce((num, i) => {
                return num + get.value(i, target)
              }, 0) / (target.hasSkillTag("noe") ? -2 : -4)
            if (odds > 0.06 && sha > res) {
              res += (sha - res) * odds
            }
            _status.event.putTempCache("jiedao_result", target.playerid, {
              target: addTar,
              card: ai.getCacheKey(card, true),
              res: res,
            })
            return res
          },
        },
        tag: {
          gain: 1,
          use: 1,
          useSha: 1,
          loseCard: 1,
        },
      },
    },
    wanjian: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      selectTarget: -1,
      reverseOrder: true,
      defaultYingbianEffect: "remove",
      filterTarget(card, player, target) {
        return target !== player
      },
      async content(event, trigger, player) {
        const target = event.target
        if (
          typeof event.shanRequired !== "number" ||
          !event.shanRequired ||
          event.shanRequired < 0
        ) {
          event.shanRequired = 1
        }
        if (typeof event.baseDamage !== "number") {
          event.baseDamage = 1
        }
        while (event.shanRequired > 0) {
          let result = { bool: false }
          if (!event.directHit) {
            const next = target.chooseToRespond()
            next.set("filterCard", (card, player) => {
              if (get.name(card) !== "shan") {
                return false
              }
              return lib.filter.cardRespondable(card, player)
            })
            if (event.shanRequired > 1) {
              next.set("prompt2", `共需打出${event.shanRequired}张闪`)
            }
            next.set("ai", (card) => {
              if (get.event().toRespond) {
                return get.order(card)
              }
              return -1
            })
            next.set(
              "toRespond",
              (() => {
                if (target.hasSkillTag("noShan", null, "respond")) {
                  return false
                }
                if (target.hasSkillTag("useShan", null, "respond")) {
                  return true
                }
                if (
                  event.baseDamage <= 0 ||
                  player.hasSkillTag("notricksource", null, event) ||
                  target.hasSkillTag("notrick", null, event)
                ) {
                  return false
                }
                if (
                  event.baseDamage >=
                  target.hp +
                    (player.hasSkillTag("jueqing", false, target) ||
                    target.hasSkill("gangzhi")
                      ? 0
                      : target.hujia)
                ) {
                  return true
                }
                const damage = get.damageEffect(target, player, target)
                if (damage >= 0) {
                  return false
                }
                if (
                  event.shanRequired > 1 &&
                  !target.hasSkillTag("freeShan", null, {
                    player: player,
                    card: event.card,
                    type: "respond",
                  }) &&
                  event.shanRequired >
                    target.mayHaveShan(target, "respond", null, "count")
                ) {
                  return false
                }
                return true
              })(),
            )
            next.set("respondTo", [player, event.card])
            next.autochoose = lib.filter.autoRespondShan
            result = await next.forResult()
          }
          if (!result?.bool) {
            await target.damage()
            break
          }
          event.shanRequired--
        }
      },
      ai: {
        wuxie(target, card, player, viewer, status) {
          const att = get.attitude(viewer, target),
            eff = get.effect(target, card, player, target)
          if (Math.abs(att) < 1 || status * eff * att >= 0) {
            return 0
          }
          let evt = _status.event.getParent("useCard"),
            pri = 1,
            bonus = player.hasSkillTag("damageBonus", true, {
              target: target,
              card: card,
            }),
            damage = 1,
            isZhu = (tar) =>
              tar.isZhu ||
              tar === game.boss ||
              tar === game.trueZhu ||
              tar === game.falseZhu,
            canShan = (tar, blur) => {
              const known = tar.getKnownCards(viewer)
              if (!blur) {
                return known.some((card) => {
                  const name = get.name(card, tar)
                  return (
                    (name === "shan" || name === "hufu") &&
                    lib.filter.cardRespondable(card, tar)
                  )
                })
              }
              if (
                tar.countCards("hs", (i) => !known.includes(i)) >
                3.67 - (2 * tar.hp) / tar.maxHp
              ) {
                return true
              }
              if (!tar.hasSkillTag("respondShan", true, "respond", true)) {
                return false
              }
              if (tar.hp <= damage) {
                return false
              }
              if (tar.hp <= damage + 1) {
                return isZhu(tar)
              }
              return true
            },
            self = false
          if (canShan(target)) {
            return 0
          }
          if (
            bonus &&
            !viewer.hasSkillTag("filterDamage", null, {
              player: player,
              card: card,
            })
          ) {
            damage = 2
          }
          if (
            (viewer.hp <= damage ||
              (viewer.hp <= damage + 1 && isZhu(viewer))) &&
            !canShan(viewer)
          ) {
            if (viewer === target) {
              return status
            }
            let fv = true
            if (evt?.targets) {
              for (const i of evt.targets) {
                if (fv) {
                  if (target === i) {
                    fv = false
                  }
                  continue
                }
                if (viewer === i) {
                  if (isZhu(viewer)) {
                    return 0
                  }
                  self = true
                  break
                }
              }
            }
          }
          let mayShan = canShan(target, true)
          if (
            bonus &&
            !target.hasSkillTag("filterDamage", null, {
              player: player,
              card: card,
            })
          ) {
            damage = 2
          } else {
            damage = 1
          }
          if (isZhu(target)) {
            if (eff < 0) {
              if (
                target.hp <= damage + 1 ||
                (!mayShan && target.hp <= damage + 2)
              ) {
                return 1
              }
              if (mayShan && target.hp > damage + 2) {
                return 0
              }
              if (mayShan || target.hp > damage + 2) {
                pri = 3
              } else {
                pri = 4
              }
            } else if (target.hp > damage + 1) {
              pri = 2
            } else {
              return 0
            }
          } else if (self) {
            return 0
          } else if (eff < 0) {
            if (!mayShan && target.hp <= damage) {
              pri = 5
            } else if (mayShan) {
              return 0
            } else if (target.hp > damage + 1) {
              pri = 2
            } else if (target.hp === damage + 1) {
              pri = 3
            } else {
              pri = 4
            }
          } else if (target.hp <= damage) {
            return 0
          }
          let find = false
          if (evt?.targets) {
            for (let i = 0; i < evt.targets.length; i++) {
              if (!find) {
                if (evt.targets[i] === target) {
                  find = true
                }
                continue
              }
              let att1 = get.attitude(viewer, evt.targets[i]),
                eff1 = get.effect(evt.targets[i], card, player, evt.targets[i]),
                temp = 1
              if (
                Math.abs(att1) < 1 ||
                att1 * eff1 >= 0 ||
                canShan(evt.targets[i])
              ) {
                continue
              }
              mayShan = canShan(evt.targets[i], true)
              if (
                bonus &&
                !evt.targets[i].hasSkillTag("filterDamage", null, {
                  player: player,
                  card: card,
                })
              ) {
                damage = 2
              } else {
                damage = 1
              }
              if (isZhu(evt.targets[i])) {
                if (eff1 < 0) {
                  if (
                    evt.targets[i].hp <= damage + 1 ||
                    (!mayShan && evt.targets[i].hp <= damage + 2)
                  ) {
                    return 0
                  }
                  if (mayShan && evt.targets[i].hp > damage + 2) {
                    continue
                  }
                  if (mayShan || evt.targets[i].hp > damage + 2) {
                    temp = 3
                  } else {
                    temp = 4
                  }
                } else if (evt.targets[i].hp > damage + 1) {
                  temp = 2
                } else {
                  continue
                }
              } else if (eff1 < 0) {
                if (!mayShan && evt.targets[i].hp <= damage) {
                  temp = 5
                } else if (mayShan) {
                  continue
                } else if (evt.targets[i].hp > damage + 1) {
                  temp = 2
                } else if (evt.targets[i].hp === damage + 1) {
                  temp = 3
                } else {
                  temp = 4
                }
              } else if (evt.targets[i].hp > damage + 1) {
                temp = 2
              }
              if (temp > pri) {
                return 0
              }
            }
          }
          return 1
        },
        basic: {
          order: 7.2,
          useful: 1,
          value: 5,
        },
        result: {
          player(player, target) {
            if (
              player._wanjian_temp ||
              player.hasSkillTag("jueqing", false, target)
            ) {
              return 0
            }
            if (
              target.hp > 2 ||
              (target.hp > 1 &&
                !target.isZhu &&
                target !== game.boss &&
                target !== game.trueZhu &&
                target !== game.falseZhu)
            ) {
              return 0
            }
            player._wanjian_temp = true
            const eff = get.effect(
              target,
              new lib.element.VCard({ name: "wanjian" }),
              player,
              target,
            )
            delete player._wanjian_temp
            if (eff >= 0) {
              return 0
            }
            if (
              target.hp > 1 &&
              target.hasSkillTag("respondShan", true, "respond", true)
            ) {
              return 0
            }
            const known = target.getKnownCards(player)
            if (
              known.some((card) => {
                const name = get.name(card, target)
                if (name === "shan" || name === "hufu") {
                  return lib.filter.cardRespondable(card, target)
                }
                if (name === "wuxie") {
                  return lib.filter.cardEnabled(card, target, "forceEnable")
                }
              })
            ) {
              return 0
            }
            if (
              target.hp > 1 ||
              target.countCards("hs", (i) => !known.includes(i)) >
                3.67 - (2 * target.hp) / target.maxHp
            ) {
              return 0
            }
            let res = 0,
              att = get.sgnAttitude(player, target)
            res -=
              att *
              (0.8 * target.countCards("hs") +
                0.6 * target.countCards("e") +
                3.6)
            if (get.mode() === "identity" && target.identity === "fan") {
              res += 2.4
            }
            if (
              (get.mode() === "guozhan" &&
                player.identity !== "ye" &&
                player.identity === target.identity) ||
              (get.mode() === "identity" &&
                player.identity === "zhu" &&
                (target.identity === "zhong" ||
                  target.identity === "mingzhong"))
            ) {
              res -= 0.8 * player.countCards("he")
            }
            return res
          },
          target(player, target) {
            const zhu =
              (get.mode() === "identity" && target.isZhu) ||
              target.identity === "zhu"
            if (!lib.filter.cardRespondable({ name: "shan" }, target)) {
              if (zhu) {
                if (target.hp < 2) {
                  return -99
                }
                if (target.hp === 2) {
                  return -3.6
                }
              }
              return -2
            }
            const known = target.getKnownCards(player)
            if (
              known.some((card) => {
                const name = get.name(card, target)
                if (name === "shan" || name === "hufu") {
                  return lib.filter.cardRespondable(card, target)
                }
                if (name === "wuxie") {
                  return lib.filter.cardEnabled(card, target, "forceEnable")
                }
              })
            ) {
              return -1.2
            }
            const nh = target.countCards("hs", (i) => !known.includes(i))
            if (zhu && target.hp <= 1) {
              if (nh === 0) {
                return -99
              }
              if (nh === 1) {
                return -60
              }
              if (nh === 2) {
                return -36
              }
              if (nh === 3) {
                return -8
              }
              return -5
            }
            if (target.hasSkillTag("respondShan", true, "respond", true)) {
              return -1.35
            }
            if (!nh) {
              return -2
            }
            if (nh === 1) {
              return -1.65
            }
            return -1.5
          },
        },
        tag: {
          respond: 1,
          respondShan: 1,
          damage: 1,
          multitarget: 1,
          multineg: 1,
        },
      },
    },
    nanman: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      selectTarget: -1,
      defaultYingbianEffect: "remove",
      filterTarget(card, player, target) {
        return target !== player
      },
      reverseOrder: true,
      async content(event, trigger, player) {
        const target = event.target
        if (
          typeof event.shaRequired !== "number" ||
          !event.shaRequired ||
          event.shaRequired < 0
        ) {
          event.shaRequired = 1
        }
        if (typeof event.baseDamage !== "number") {
          event.baseDamage = 1
        }
        while (event.shaRequired > 0) {
          let result = { bool: false }
          if (!event.directHit) {
            const next = target.chooseToRespond()
            next.set("filterCard", (card, player) => {
              if (get.name(card) !== "sha") {
                return false
              }
              return lib.filter.cardRespondable(card, player)
            })
            if (event.shaRequired > 1) {
              next.set("prompt2", `共需打出${event.shaRequired}张【杀】`)
            }
            next.set("ai", (card) => {
              if (get.event().toRespond) {
                return get.order(card)
              }
              return -1
            })
            next.set(
              "toRespond",
              (() => {
                if (target.hasSkillTag("noSha", null, "respond")) {
                  return false
                }
                if (target.hasSkillTag("useSha", null, "respond")) {
                  return true
                }
                if (
                  event.baseDamage <= 0 ||
                  player.hasSkillTag("notricksource", null, event) ||
                  target.hasSkillTag("notrick", null, event)
                ) {
                  return false
                }
                if (
                  event.baseDamage >=
                  target.hp +
                    (player.hasSkillTag("jueqing", false, target) ||
                    target.hasSkill("gangzhi")
                      ? 0
                      : target.hujia)
                ) {
                  return true
                }
                const damage = get.damageEffect(target, player, target)
                if (damage >= 0) {
                  return false
                }
                if (
                  event.shaRequired > 1 &&
                  !target.hasSkillTag("freeSha", null, {
                    player: player,
                    card: event.card,
                    type: "respond",
                  }) &&
                  event.shaRequired >
                    target.mayHaveSha(target, "respond", null, "count")
                ) {
                  return false
                }
                // if (target.hasSkill("naman")) {
                // 	return true;
                // }
                return true
              })(),
            )
            next.set("respondTo", [player, event.card])
            next.autochoose = lib.filter.autoRespondSha
            result = await next.forResult()
          }
          if (!result?.bool) {
            await target.damage()
            break
          }
          event.shaRequired--
        }
      },
      ai: {
        wuxie(target, card, player, viewer, status) {
          const att = get.attitude(viewer, target),
            eff = get.effect(target, card, player, target)
          if (Math.abs(att) < 1 || status * eff * att >= 0) {
            return 0
          }
          let evt = _status.event.getParent("useCard"),
            pri = 1,
            bonus = player.hasSkillTag("damageBonus", true, {
              target: target,
              card: card,
            }),
            damage = 1,
            isZhu = (tar) =>
              tar.isZhu ||
              tar === game.boss ||
              tar === game.trueZhu ||
              tar === game.falseZhu,
            canSha = (tar, blur) => {
              const known = tar.getKnownCards(viewer)
              if (!blur) {
                return known.some((card) => {
                  const name = get.name(card, tar)
                  return (
                    (name === "sha" ||
                      name === "hufu" ||
                      name === "yuchanqian") &&
                    lib.filter.cardRespondable(card, tar)
                  )
                })
              }
              if (
                tar.countCards("hs", (i) => !known.includes(i)) >
                4.67 - (2 * tar.hp) / tar.maxHp
              ) {
                return true
              }
              if (!tar.hasSkillTag("respondSha", true, "respond", true)) {
                return false
              }
              if (tar.hp <= damage) {
                return false
              }
              if (tar.hp <= damage + 1) {
                return isZhu(tar)
              }
              return true
            },
            self = false
          if (canSha(target)) {
            return 0
          }
          if (
            bonus &&
            !viewer.hasSkillTag("filterDamage", null, {
              player: player,
              card: card,
            })
          ) {
            damage = 2
          }
          if (
            (viewer.hp <= damage ||
              (viewer.hp <= damage + 1 && isZhu(viewer))) &&
            !canSha(viewer)
          ) {
            if (viewer === target) {
              return status
            }
            let fv = true
            if (evt?.targets) {
              for (const i of evt.targets) {
                if (fv) {
                  if (target === i) {
                    fv = false
                  }
                  continue
                }
                if (viewer === i) {
                  if (isZhu(viewer)) {
                    return 0
                  }
                  self = true
                  break
                }
              }
            }
          }
          let maySha = canSha(target, true)
          if (
            bonus &&
            !target.hasSkillTag("filterDamage", null, {
              player: player,
              card: card,
            })
          ) {
            damage = 2
          } else {
            damage = 1
          }
          if (isZhu(target)) {
            if (eff < 0) {
              if (
                target.hp <= damage + 1 ||
                (!maySha && target.hp <= damage + 2)
              ) {
                return 1
              }
              if (maySha && target.hp > damage + 2) {
                return 0
              }
              if (maySha || target.hp > damage + 2) {
                pri = 3
              } else {
                pri = 4
              }
            } else if (target.hp > damage + 1) {
              pri = 2
            } else {
              return 0
            }
          } else if (self) {
            return 0
          } else if (eff < 0) {
            if (!maySha && target.hp <= damage) {
              pri = 5
            } else if (maySha) {
              return 0
            } else if (target.hp > damage + 1) {
              pri = 2
            } else if (target.hp === damage + 1) {
              pri = 3
            } else {
              pri = 4
            }
          } else if (target.hp <= damage) {
            return 0
          }
          let find = false
          if (evt?.targets) {
            for (let i = 0; i < evt.targets.length; i++) {
              if (!find) {
                if (evt.targets[i] === target) {
                  find = true
                }
                continue
              }
              let att1 = get.attitude(viewer, evt.targets[i]),
                eff1 = get.effect(evt.targets[i], card, player, evt.targets[i]),
                temp = 1
              if (
                Math.abs(att1) < 1 ||
                att1 * eff1 >= 0 ||
                canSha(evt.targets[i])
              ) {
                continue
              }
              maySha = canSha(evt.targets[i], true)
              if (
                bonus &&
                !evt.targets[i].hasSkillTag("filterDamage", null, {
                  player: player,
                  card: card,
                })
              ) {
                damage = 2
              } else {
                damage = 1
              }
              if (isZhu(evt.targets[i])) {
                if (eff1 < 0) {
                  if (
                    evt.targets[i].hp <= damage + 1 ||
                    (!maySha && evt.targets[i].hp <= damage + 2)
                  ) {
                    return 0
                  }
                  if (maySha && evt.targets[i].hp > damage + 2) {
                    continue
                  }
                  if (maySha || evt.targets[i].hp > damage + 2) {
                    temp = 3
                  } else {
                    temp = 4
                  }
                } else if (evt.targets[i].hp > damage + 1) {
                  temp = 2
                } else {
                  continue
                }
              } else if (eff1 < 0) {
                if (!maySha && evt.targets[i].hp <= damage) {
                  temp = 5
                } else if (maySha) {
                  continue
                } else if (evt.targets[i].hp > damage + 1) {
                  temp = 2
                } else if (evt.targets[i].hp === damage + 1) {
                  temp = 3
                } else {
                  temp = 4
                }
              } else if (evt.targets[i].hp > damage + 1) {
                temp = 2
              }
              if (temp > pri) {
                return 0
              }
            }
          }
          return 1
        },
        basic: {
          order: 7.2,
          useful: [5, 1],
          value: 5,
        },
        result: {
          player(player, target) {
            if (
              player._nanman_temp ||
              player.hasSkillTag("jueqing", false, target)
            ) {
              return 0
            }
            if (
              target.hp > 2 ||
              (target.hp > 1 &&
                !target.isZhu &&
                target !== game.boss &&
                target !== game.trueZhu &&
                target !== game.falseZhu)
            ) {
              return 0
            }
            player._nanman_temp = true
            const eff = get.effect(
              target,
              new lib.element.VCard({ name: "nanman" }),
              player,
              target,
            )
            delete player._nanman_temp
            if (eff >= 0) {
              return 0
            }
            if (
              target.hp > 1 &&
              target.hasSkillTag("respondSha", true, "respond", true)
            ) {
              return 0
            }
            const known = target.getKnownCards(player)
            if (
              known.some((card) => {
                const name = get.name(card, target)
                if (
                  name === "sha" ||
                  name === "hufu" ||
                  name === "yuchanqian"
                ) {
                  return lib.filter.cardRespondable(card, target)
                }
                if (name === "wuxie") {
                  return lib.filter.cardEnabled(card, target, "forceEnable")
                }
              })
            ) {
              return 0
            }
            if (
              target.hp > 1 ||
              target.countCards("hs", (i) => !known.includes(i)) >
                4.67 - (2 * target.hp) / target.maxHp
            ) {
              return 0
            }
            let res = 0,
              att = get.sgnAttitude(player, target)
            res -=
              att *
              (0.8 * target.countCards("hs") +
                0.6 * target.countCards("e") +
                3.6)
            if (get.mode() === "identity" && target.identity === "fan") {
              res += 2.4
            }
            if (
              (get.mode() === "guozhan" &&
                player.identity !== "ye" &&
                player.identity === target.identity) ||
              (get.mode() === "identity" &&
                player.identity === "zhu" &&
                (target.identity === "zhong" ||
                  target.identity === "mingzhong"))
            ) {
              res -= 0.8 * player.countCards("he")
            }
            return res
          },
          target(player, target) {
            const zhu =
              (get.mode() === "identity" && target.isZhu) ||
              target.identity === "zhu"
            if (!lib.filter.cardRespondable({ name: "sha" }, target)) {
              if (zhu) {
                if (target.hp < 2) {
                  return -99
                }
                if (target.hp === 2) {
                  return -3.6
                }
              }
              return -2
            }
            const known = target.getKnownCards(player)
            if (
              known.some((card) => {
                const name = get.name(card, target)
                if (
                  name === "sha" ||
                  name === "hufu" ||
                  name === "yuchanqian"
                ) {
                  return lib.filter.cardRespondable(card, target)
                }
                if (name === "wuxie") {
                  return lib.filter.cardEnabled(card, target, "forceEnable")
                }
              })
            ) {
              return -1.2
            }
            const nh = target.countCards("hs", (i) => !known.includes(i))
            if (zhu && target.hp <= 1) {
              if (nh === 0) {
                return -99
              }
              if (nh === 1) {
                return -60
              }
              if (nh === 2) {
                return -36
              }
              if (nh === 3) {
                return -12
              }
              if (nh === 4) {
                return -8
              }
              return -5
            }
            if (target.hasSkillTag("respondSha", true, "respond", true)) {
              return -1.35
            }
            if (!nh) {
              return -2
            }
            if (nh === 1) {
              return -1.8
            }
            return -1.5
          },
        },
        tag: {
          respond: 1,
          respondSha: 1,
          damage: 1,
          multitarget: 1,
          multineg: 1,
        },
      },
    },
    guohe: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      selectTarget: 1,
      postAi(targets) {
        return targets.length === 1 && targets[0].countCards("j")
      },
      filterTarget(card, player, target) {
        if (player === target) {
          return false
        }
        return target.hasCard(
          (card) => lib.filter.canBeDiscarded(card, player, target),
          get.is.single() ? "he" : "hej",
        )
      },
      defaultYingbianEffect: "add",
      content() {
        "step 0"
        if (get.is.single()) {
          const bool1 = target.countDiscardableCards(player, "h"),
            bool2 = target.countDiscardableCards(player, "e")
          if (bool1 && bool2) {
            player
              .chooseControl("手牌区", "装备区")
              .set("ai", () => (Math.random() < 0.5 ? 1 : 0))
              .set(
                "prompt",
                "弃置" +
                  get.translation(target) +
                  "装备区的一张牌，或观看其手牌并弃置其中的一张牌。",
              )
          } else {
            event._result = { control: bool1 ? "手牌区" : "装备区" }
          }
        } else {
          event._result = { control: "所有区域" }
        }
        ;("step 1")
        let pos,
          vis = "visible"
        if (result.control === "手牌区") {
          pos = "h"
        } else if (result.control === "装备区") {
          pos = "e"
        } else {
          pos = "hej"
          vis = undefined
        }
        if (target.countDiscardableCards(player, pos)) {
          player
            .discardPlayerCard(pos, target, true, vis)
            .set("target", target)
            .set("complexSelect", false)
            .set("ai", lib.card.guohe.ai.button)
        }
      },
      ai: {
        wuxie: (target, card, player, viewer, status) => {
          if (
            !target.countCards("hej") ||
            status * get.attitude(viewer, player._trueMe || player) > 0 ||
            (target.hp > 2 &&
              !target.hasCard((i) => {
                const val = get.value(i, target),
                  subtypes = get.subtypes(i)
                if (
                  val < 8 &&
                  target.hp < 2 &&
                  !subtypes.includes("equip2") &&
                  !subtypes.includes("equip5")
                ) {
                  return false
                }
                return val > 3 + Math.min(5, target.hp)
              }, "e") &&
              target.countCards("h") * _status.event.getRand("guohe_wuxie") >
                1.57)
          ) {
            return 0
          }
        },
        basic: {
          order: 9,
          useful: (card, i) => 10 / (3 + i),
          value: (card, player) => {
            let max = 0
            game.countPlayer((cur) => {
              max = Math.max(
                max,
                lib.card.guohe.ai.result.target(player, cur) *
                  get.attitude(player, cur),
              )
            })
            if (max <= 0) {
              return 5
            }
            return 0.42 * max
          },
        },
        yingbian(card, player, targets, viewer) {
          if (get.attitude(viewer, player) <= 0) {
            return 0
          }
          if (
            game.hasPlayer(
              (current) =>
                !targets.includes(current) &&
                lib.filter.targetEnabled2(card, player, current) &&
                get.effect(current, card, player, player) > 0,
            )
          ) {
            return 6
          }
          return 0
        },
        button: (button) => {
          const player = _status.event.player,
            target = _status.event.target
          if (!lib.filter.canBeDiscarded(button.link, player, target)) {
            return 0
          }
          let att = get.attitude(player, target),
            val = get.buttonValue(button),
            pos = get.position(button.link),
            name = get.name(button.link)
          if (pos === "j") {
            const viewAs = button.link.viewAs
            if (viewAs === "lebu") {
              const needs = target.needsToDiscard(2)
              val *= 1.08 + 0.2 * needs
            } else if (viewAs === "shandian" || viewAs === "fulei") {
              val /= 2
            }
          }
          if (att > 0) {
            val = -val
          }
          if (pos !== "e") {
            return val
          }
          const sub = get.subtypes(button.link)
          if (sub.includes("equip1")) {
            return (val * Math.min(3.6, target.hp)) / 3
          }
          if (sub.includes("equip2")) {
            if (name === "baiyin" && pos === "e" && target.isDamaged()) {
              const by = 3 - 0.6 * Math.min(5, target.hp)
              return get.sgn(get.recoverEffect(target, player, player)) * by
            }
            return 1.57 * val
          }
          if (
            att <= 0 &&
            (sub.includes("equip3") || sub.includes("equip4")) &&
            (player.hasSkill("shouli") || player.hasSkill("psshouli"))
          ) {
            return 0
          }
          if (sub.includes("equip6")) {
            return val
          }
          if (sub.includes("equip4")) {
            return val / 2
          }
          if (
            sub.includes("equip3") &&
            !game.hasPlayer((cur) => {
              return !cur.inRange(target) && get.attitude(cur, target) < 0
            })
          ) {
            return 0.4 * val
          }
          return val
        },
        result: {
          target(player, target) {
            const att = get.attitude(player, target)
            const hs = target.getDiscardableCards(player, "h")
            const es = target.getDiscardableCards(player, "e")
            const js = target.getDiscardableCards(player, "j")
            if (!hs.length && !es.length && !js.length) {
              return 0
            }
            if (att > 0) {
              if (
                js.some((card) => {
                  const cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return false
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
              ) {
                return 3
              }
              if (
                target.isDamaged() &&
                es.some((card) => card.name === "baiyin") &&
                get.recoverEffect(target, player, player) > 0
              ) {
                if (target.hp === 1 && !target.hujia) {
                  return 1.6
                }
              }
              if (
                es.some((card) => {
                  return get.value(card, target) < 0
                })
              ) {
                return 1
              }
              return -1.5
            }
            const noh = hs.length === 0 || target.hasSkillTag("noh")
            const noe = es.length === 0 || target.hasSkillTag("noe")
            const noe2 =
              noe ||
              !es.some((card) => {
                return get.value(card, target) > 0
              })
            const noj =
              js.length === 0 ||
              !js.some((card) => {
                const cardj = card.viewAs ? { name: card.viewAs } : card
                if (cardj.name === "xumou_jsrg") {
                  return true
                }
                return get.effect(target, cardj, target, player) < 0
              })
            if (noh && noe2 && noj) {
              return 1.5
            }
            return -1.5
          },
        },
        tag: {
          loseCard: 1,
          discard: 1,
        },
      },
    },
    guohe_copy: {
      ai: {
        basic: {
          order: 9,
          useful: 5,
          value: 5,
        },
        result: {
          target(player, target, card) {
            let position = "hej"
            if (card?.position) {
              position = card.position
            }
            const att = get.attitude(player, target)
            const hs = position.includes("h")
              ? target.getDiscardableCards(player, "h")
              : []
            const es = position.includes("e")
              ? target.getDiscardableCards(player, "e")
              : []
            const js = position.includes("j")
              ? target.getDiscardableCards(player, "j")
              : []
            if (!hs.length && !es.length && !js.length) {
              return 0
            }
            if (att > 0) {
              if (
                js.some((card) => {
                  const cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return false
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
              ) {
                return 3
              }
              if (
                target.isDamaged() &&
                es.some((card) => card.name === "baiyin") &&
                get.recoverEffect(target, player, player) > 0
              ) {
                if (target.hp === 1 && !target.hujia) {
                  return 1.6
                }
              }
              if (
                es.some((card) => {
                  return get.value(card, target) < 0
                })
              ) {
                return 1
              }
              return -1.5
            }
            const noh = hs.length === 0 || target.hasSkillTag("noh")
            const noe = es.length === 0 || target.hasSkillTag("noe")
            const noe2 =
              noe ||
              !es.some((card) => {
                return get.value(card, target) > 0
              })
            const noj =
              js.length === 0 ||
              !js.some((card) => {
                const cardj = card.viewAs ? { name: card.viewAs } : card
                if (cardj.name === "xumou_jsrg") {
                  return true
                }
                return get.effect(target, cardj, target, player) < 0
              })
            if (noh && noe2 && noj) {
              return 1.5
            }
            return -1.5
          },
        },
        tag: {
          loseCard: 1,
          discard: 1,
        },
      },
    },
    guohe_copy2: {
      ai: {
        basic: {
          order: 9,
          useful: 5,
          value: 5,
        },
        result: {
          target(player, target, card, isLink) {
            return lib.card.guohe_copy.ai.result.target(
              player,
              target,
              {
                name: "guohe_copy",
                position: "he",
              },
              isLink,
            )
          },
        },
        tag: {
          loseCard: 1,
          discard: 1,
        },
      },
    },
    shunshou: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      range: { global: 1 },
      selectTarget: 1,
      postAi(targets) {
        return targets.length === 1 && targets[0].countCards("j")
      },
      filterTarget(card, player, target) {
        if (player === target) {
          return false
        }
        return target.hasCard(
          (card) => lib.filter.canBeGained(card, player, target),
          get.is.single() ? "he" : "hej",
        )
      },
      async content(event, trigger, player) {
        const target = event.target
        const pos = get.is.single() ? "he" : "hej"
        if (target.countGainableCards(player, pos)) {
          await player
            .gainPlayerCard(pos, target, true)
            .set("target", target)
            .set("complexSelect", false)
            .set("ai", lib.card.shunshou.ai.button)
        }
      },
      ai: {
        wuxie(target, card, player, viewer) {
          if (
            !target.countCards("hej") ||
            get.attitude(viewer, player._trueMe || player) > 0
          ) {
            return 0
          }
        },
        basic: {
          order: 7.5,
          useful: (card, i) => 8 / (3 + i),
          value: (card, player) => {
            let max = 0
            game.countPlayer((cur) => {
              max = Math.max(
                max,
                lib.card.shunshou.ai.result.target(player, cur) *
                  get.attitude(player, cur),
              )
            })
            if (max <= 0) {
              return 2
            }
            return 0.53 * max
          },
        },
        button: (button) => {
          const player = _status.event.player,
            target = _status.event.target
          if (!lib.filter.canBeGained(button.link, player, target)) {
            return 0
          }
          let att = get.attitude(player, target),
            val = get.value(button.link, player) / 60,
            btv = get.buttonValue(button),
            pos = get.position(button.link),
            name = get.name(button.link)
          if (pos === "j") {
            const viewAs = button.link.viewAs
            if (viewAs === "lebu") {
              const needs = target.needsToDiscard(2)
              btv *= 1.08 + 0.2 * needs
            } else if (viewAs === "shandian" || viewAs === "fulei") {
              btv /= 2
            }
          }
          if (att > 0) {
            btv = -btv
          }
          if (pos !== "e") {
            if (
              pos === "h" &&
              !player.hasSkillTag("viewHandcard", null, target, true)
            ) {
              return btv + 0.1
            }
            return btv + val
          }
          const sub = get.subtype(button.link)
          if (sub === "equip1") {
            return (btv * Math.min(3.6, target.hp)) / 3
          }
          if (sub === "equip2") {
            if (name === "baiyin" && pos === "e" && target.isDamaged()) {
              const by = 3 - 0.6 * Math.min(5, target.hp)
              return get.sgn(get.recoverEffect(target, player, player)) * by
            }
            return 1.57 * btv + val
          }
          if (
            att <= 0 &&
            (sub === "equip3" || sub === "equip4") &&
            (player.hasSkill("shouli") || player.hasSkill("psshouli"))
          ) {
            return 0
          }
          if (
            sub === "equip3" &&
            !game.hasPlayer(
              (cur) => !cur.inRange(target) && get.attitude(cur, target) < 0,
            )
          ) {
            return 0.4 * btv + val
          }
          if (sub === "equip4") {
            return btv / 2 + val
          }
          return btv + val
        },
        result: {
          player(player, target) {
            const hs = target.getGainableCards(player, "h")
            const es = target.getGainableCards(player, "e")
            const js = target.getGainableCards(player, "j")
            const att = get.attitude(player, target)
            if (att < 0) {
              if (
                !hs.length &&
                !es.some((card) => {
                  return (
                    get.value(card, target) > 0 &&
                    card !== target.getEquip("jinhe")
                  )
                }) &&
                !js.some((card) => {
                  var cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return true
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
              ) {
                return 0
              }
            } else if (att > 1) {
              return es.some((card) => {
                return get.value(card, target) <= 0
              }) ||
                js.some((card) => {
                  var cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return false
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
                ? 1.5
                : 0
            }
            return 1
          },
          target(player, target) {
            const hs = target.getGainableCards(player, "h")
            const es = target.getGainableCards(player, "e")
            const js = target.getGainableCards(player, "j")

            if (get.attitude(player, target) <= 0) {
              if (hs.length > 0) {
                return -1.5
              }
              return es.some((card) => {
                return (
                  get.value(card, target) > 0 &&
                  card !== target.getEquip("jinhe")
                )
              }) ||
                js.some((card) => {
                  var cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return true
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
                ? -1.5
                : 1.5
            }
            return es.some((card) => {
              return get.value(card, target) <= 0
            }) ||
              js.some((card) => {
                var cardj = card.viewAs ? { name: card.viewAs } : card
                if (cardj.name === "xumou_jsrg") {
                  return false
                }
                return get.effect(target, cardj, target, player) < 0
              })
              ? 1.5
              : -1.5
          },
        },
        tag: {
          loseCard: 1,
          gain: 1,
        },
      },
    },
    shunshou_copy: {
      ai: {
        basic: {
          order: 7.5,
          useful: 4,
          value: 9,
        },
        result: {
          target(player, target, card) {
            let position = "hej"
            if (card?.position) {
              position = card.position
            }
            const hs = position.includes("h")
              ? target.getGainableCards(player, "h")
              : []
            const es = position.includes("e")
              ? target.getGainableCards(player, "e")
              : []
            const js = position.includes("j")
              ? target.getGainableCards(player, "j")
              : []
            if (get.attitude(player, target) <= 0) {
              if (hs.length > 0) {
                return -1.5
              }
              return es.some((card) => {
                return (
                  get.value(card, target) > 0 &&
                  card !== target.getEquip("jinhe")
                )
              }) ||
                js.some((card) => {
                  var cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return true
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
                ? -1.5
                : 1.5
            }
            return es.some((card) => {
              return get.value(card, target) <= 0
            }) ||
              js.some((card) => {
                var cardj = card.viewAs ? { name: card.viewAs } : card
                if (cardj.name === "xumou_jsrg") {
                  return false
                }
                return get.effect(target, cardj, target, player) < 0
              })
              ? 1.5
              : -1.5
          },
          player(player, target, card) {
            let position = "hej"
            if (card?.position) {
              position = card.position
            }
            const hs = position.includes("h")
              ? target.getGainableCards(player, "h")
              : []
            const es = position.includes("e")
              ? target.getGainableCards(player, "e")
              : []
            const js = position.includes("j")
              ? target.getGainableCards(player, "j")
              : []
            const att = get.attitude(player, target)
            if (att < 0) {
              if (
                !hs.length &&
                !es.some((card) => {
                  return (
                    get.value(card, target) > 0 &&
                    card !== target.getEquip("jinhe")
                  )
                }) &&
                !js.some((card) => {
                  var cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return true
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
              ) {
                return 0
              }
            } else if (att > 1) {
              return es.some((card) => {
                return get.value(card, target) <= 0
              }) ||
                js.some((card) => {
                  var cardj = card.viewAs ? { name: card.viewAs } : card
                  if (cardj.name === "xumou_jsrg") {
                    return false
                  }
                  return get.effect(target, cardj, target, player) < 0
                })
                ? 1.5
                : 0
            }
            return 1
          },
        },
        tag: {
          loseCard: 1,
          gain: 1,
        },
      },
    },
    shunshou_copy2: {
      ai: {
        basic: {
          order: 7.5,
          useful: 4,
          value: 9,
        },
        result: {
          target(player, target, card, isLink) {
            return lib.card.shunshou_copy.ai.result.target(
              player,
              target,
              {
                name: "shunshou_copy",
                position: "he",
              },
              isLink,
            )
          },
          player(player, target, card, isLink) {
            return lib.card.shunshou_copy.ai.result.player(
              player,
              target,
              {
                name: "shunshou_copy",
                position: "he",
              },
              isLink,
            )
          },
        },
        tag: {
          loseCard: 1,
          gain: 1,
        },
      },
    },
    wuzhong: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      selectTarget: -1,
      cardcolor: "red",
      toself: true,
      filterTarget(card, player, target) {
        return target === player
      },
      modTarget: true,
      content() {
        if (get.is.versus()) {
          if (game.friend.includes(target)) {
            if (game.friend.length < game.enemy.length) {
              target.draw(3)
              return
            }
          } else {
            if (game.friend.length > game.enemy.length) {
              target.draw(3)
              return
            }
          }
        }
        target.draw(2)
      },
      ai: {
        wuxie(target, card, player, viewer) {
          if (get.mode() === "guozhan") {
            if (!_status._aozhan) {
              if (!player.isMajor()) {
                if (!viewer.isMajor()) {
                  return 0
                }
              }
            }
          }
          if (target.countCards("h") * Math.max(target.hp, 5) > 6) {
            return 0
          }
        },
        basic: {
          order: 7,
          useful: 4.5,
          value(card, player) {
            if (player.hp > 2) {
              return 9.2
            }
            return 9.2 - 0.7 * Math.min(3, player.countCards("hs"))
          },
        },
        result: {
          target: 2,
        },
        tag: {
          draw: 2,
        },
      },
    },
    wugu: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      cardcolor: "red",
      selectTarget: -1,
      filterTarget: true,
      contentBefore() {
        "step 0"
        if (!targets.length) {
          event.finish()
          return
        }
        if (card.storage?.chooseDirection || get.is.versus()) {
          player
            .chooseControl("顺时针", "逆时针", (event, player) => {
              if (
                (get.event().isVersus && player.next.side === player.side) ||
                get.attitude(player, player.next) >
                  get.attitude(player, player.previous)
              ) {
                return "逆时针"
              }
              return "顺时针"
            })
            .set("prompt", `选择${get.translation(card)}的结算方向`)
            .set("isVersus", get.is.versus())
        } else {
          event.goto(2)
        }
        ;("step 1")
        if (result && result.control === "顺时针") {
          var evt = event.getParent(),
            sorter = _status.currentPhase || player
          evt.fixedSeat = true
          evt.targets.sortBySeat(sorter)
          evt.targets.reverse()
          if (evt.targets[evt.targets.length - 1] === sorter) {
            evt.targets.unshift(evt.targets.pop())
          }
        }
        ;("step 2")
        ui.clear()
        var cards
        if (get.itemtype(card.storage?.fixedShownCards) === "cards") {
          cards = card.storage.fixedShownCards.slice()
          var lose_list = [],
            cards2 = []
          cards.forEach((card) => {
            var owner = get.owner(card)
            if (owner) {
              var arr = lose_list.find((i) => i[0] === owner)
              if (arr) {
                arr[1].push(card)
              } else {
                lose_list.push([owner, [card]])
              }
            } else {
              cards2.add(card)
            }
          })
          if (lose_list.length) {
            lose_list.forEach((list) => {
              list[0].$throw(list[1])
              game.log(list[0], "将", list[1], "置于了处理区")
            })
            game
              .loseAsync({
                lose_list: lose_list,
                visible: true,
                relatedEvent: event.getParent(),
              })
              .setContent("chooseToCompareLose")
          }
          if (cards2.length) {
            game.cardsGotoOrdering(cards2).relatedEvent = event.getParent()
          }
          game.delayex()
        } else {
          let num = event.targets?.length ?? game.countPlayer()
          if (typeof card.storage?.extraCardsNum === "number") {
            num += card.storage.extraCardsNum
          }
          cards = get.cards(num)
          game.cardsGotoOrdering(cards).relatedEvent = event.getParent()
        }
        var dialog = ui.create.dialog("五谷丰登", cards, true)
        _status.dieClose.push(dialog)
        dialog.videoId = lib.status.videoId++
        game.addVideo("cardDialog", null, [
          "五谷丰登",
          get.cardsInfo(cards),
          dialog.videoId,
        ])
        event.getParent().preResult = dialog.videoId
        game.broadcast(
          (cards, id) => {
            var dialog = ui.create.dialog("五谷丰登", cards, true)
            _status.dieClose.push(dialog)
            dialog.videoId = id
          },
          cards,
          dialog.videoId,
        )
        game.log(event.card, "亮出了", cards)
      },
      content() {
        "step 0"
        for (var i = 0; i < ui.dialogs.length; i++) {
          if (ui.dialogs[i].videoId === event.preResult) {
            event.dialog = ui.dialogs[i]
            break
          }
        }
        if (!event.dialog || event.dialog.buttons.length === 0) {
          event.finish()
          return
        }
        if (event.dialog.buttons.length > 1) {
          var next = target.chooseButton(true)
          next.set("ai", (button) => {
            let player = _status.event.player,
              card = button.link,
              val = get.value(card, player)
            if (get.tag(card, "recover")) {
              val += game.countPlayer((target) => {
                return (
                  target.hp < 2 &&
                  get.attitude(player, target) > 0 &&
                  lib.filter.cardSavable(card, player, target)
                )
              })
              if (
                player.hp <= 2 &&
                game.checkMod(card, player, "unchanged", "cardEnabled2", player)
              ) {
                val *= 2
              }
            }
            return val
          })
          next.set("dialog", event.preResult)
          next.set("closeDialog", false)
          next.set("dialogdisplay", true)
        } else {
          event.directButton = event.dialog.buttons[0]
        }
        ;("step 1")
        var dialog = event.dialog
        var card
        if (event.directButton) {
          card = event.directButton.link
        } else {
          for (var i of dialog.buttons) {
            if (i.link === result.links[0]) {
              card = i.link
              break
            }
          }
          if (!card) {
            card = event.dialog.buttons[0].link
          }
        }
        var button
        for (var i = 0; i < dialog.buttons.length; i++) {
          if (dialog.buttons[i].link === card) {
            button = dialog.buttons[i]
            const innerHTML = target.getName(true)
            game.createButtonCardsetion(innerHTML, button)
            dialog.buttons.remove(button)
            break
          }
        }
        var capt = `${get.translation(target)}选择了${get.translation(button.link)}`
        if (card) {
          target.gain(card, "visible")
          target.$gain2(card)
          game.broadcast(
            (card, id, name, capt) => {
              var dialog = get.idDialog(id)
              if (dialog) {
                dialog.content.firstChild.innerHTML = capt
                for (var i = 0; i < dialog.buttons.length; i++) {
                  if (dialog.buttons[i].link === card) {
                    game.createButtonCardsetion(name, dialog.buttons[i])
                    dialog.buttons.splice(i--, 1)
                    break
                  }
                }
              }
            },
            card,
            dialog.videoId,
            target.getName(true),
            capt,
          )
        }
        dialog.content.firstChild.innerHTML = capt
        game.addVideo("dialogCapt", null, [
          dialog.videoId,
          dialog.content.firstChild.innerHTML,
        ])
        game.log(target, "选择了", button.link)
        game.delay()
      },
      contentAfter() {
        for (var i = 0; i < ui.dialogs.length; i++) {
          if (ui.dialogs[i].videoId === event.preResult) {
            var dialog = ui.dialogs[i]
            dialog.close()
            _status.dieClose.remove(dialog)
            if (dialog.buttons.length) {
              event.remained = []
              for (var i = 0; i < dialog.buttons.length; i++) {
                event.remained.push(dialog.buttons[i].link)
              }
              event.trigger("wuguRemained")
            }
            break
          }
        }
        game.broadcast((id) => {
          var dialog = get.idDialog(id)
          if (dialog) {
            dialog.close()
            _status.dieClose.remove(dialog)
          }
        }, event.preResult)
        game.addVideo("cardDialog", null, event.preResult)
      },
      ai: {
        wuxie() {
          if (Math.random() < 0.5) {
            return 0
          }
        },
        basic: {
          order: 3,
          useful: 0.5,
        },
        result: {
          target(player, target) {
            var sorter = _status.currentPhase || player
            let opt =
              6 +
              0.75 *
                (game.countPlayer() -
                  2 * get.distance(sorter, target, "absolute"))
            if (get.is.versus()) {
              if (
                target !== sorter &&
                get.attitude(player, player.next) <
                  get.attitude(player, player.previous)
              ) {
                opt =
                  6 +
                  0.75 *
                    (2 * get.distance(sorter, target, "absolute") -
                      game.countPlayer())
              }
            }
            if (player.hasUnknown(2)) {
              return 0
            }
            return opt / 6
          },
        },
        tag: {
          draw: 1,
          multitarget: 1,
        },
      },
    },
    taoyuan: {
      audio: true,
      fullskin: true,
      type: "trick",
      enable: true,
      selectTarget: -1,
      cardcolor: "red",
      reverseOrder: true,
      defaultYingbianEffect: "remove",
      filterTarget(card, player, target) {
        //return target.hp<target.maxHp;
        return true
      },
      ignoreTarget(card, player, target) {
        return target.isHealthy()
      },
      content() {
        target.recover()
      },
      ai: {
        basic: {
          order: (item, player) => {
            if (
              game.hasPlayer(
                (current) =>
                  current.hp <= 1 &&
                  get.recoverEffect(current, player, _status.event.player) < 0,
              )
            ) {
              return 1
            }
            return 10
          },
          useful: [3, 1],
          value: 0,
        },
        result: {
          target(player, target) {
            return target.hp < target.maxHp ? 2 : 0
          },
        },
        tag: {
          recover: 0.5,
          multitarget: 1,
        },
      },
    },
    wuxie: {
      audio: true,
      fullskin: true,
      type: "trick",
      ai: {
        basic: {
          useful: [6, 4, 3],
          value: [6, 4, 3],
        },
        result: { player: 1 },
        expose: 0.2,
      },
      notarget: true,
      finalDelay: false,
      defaultYingbianEffect: "draw",
      contentBefore() {
        "step 0"
        if (get.mode() === "guozhan" && get.cardtag(card, "guo")) {
          var trigger = event.getParent(2)._trigger
          if (
            trigger.name !== "phaseJudge" &&
            trigger.card.name !== "wuxie" &&
            trigger.targets.length > 1
          ) {
            player
              .chooseControl("对单体使用", "对势力使用")
              .set("prompt", `请选择${get.translation(card)}的使用方式`)
              .set("ai", () => "对势力使用")
          } else {
            event.finish()
          }
        } else {
          event.finish()
        }
        ;("step 1")
        if (result.control === "对势力使用") {
          player.chat("对势力使用")
          event.getParent().guowuxie = true
        }
      },
      content() {
        var trigger = event.getParent(2)._trigger
        if (trigger.name === "phaseJudge") {
          trigger.untrigger("currentOnly")
          trigger.cancelled = true
        } else {
          trigger.neutralize()
          if (event.getParent().guowuxie === true) {
            trigger
              .getParent()
              .excluded.addArray(
                game.filterPlayer((current) =>
                  current.isFriendOf(trigger.target),
                ),
              )
          }
        }
        /*
          event.result={
            wuxied:true,
            directHit:evt.directHit||[],
            nowuxie:evt.nowuxie,
          };*/
        if (player.isOnline()) {
          player.send((player) => {
            if (ui.tempnowuxie && !player.hasWuxie()) {
              ui.tempnowuxie.close()
              delete ui.tempnowuxie
            }
          }, player)
        } else if (player === game.me) {
          if (ui.tempnowuxie && !player.hasWuxie()) {
            ui.tempnowuxie.close()
            delete ui.tempnowuxie
          }
        }
      },
    },
    lebu: {
      audio: true,
      fullskin: true,
      type: "delay",
      filterTarget(card, player, target) {
        return lib.filter.judge(card, player, target) && player !== target
      },
      judge(card) {
        if (get.suit(card) === "heart") {
          return 1
        }
        return -2
      },
      judge2(result) {
        if (result.bool === false) {
          return true
        }
        return false
      },
      effect() {
        if (result.bool === false) {
          player.skip("phaseUse")
        }
      },
      ai: {
        basic: {
          order: 1,
          useful(card, i) {
            const player = _status.event.player
            if (_status.event.isPhaseUsing()) {
              return game.hasPlayer((cur) => {
                return (
                  cur !== player &&
                  lib.filter.judge(card, player, cur) &&
                  get.effect(cur, card, player, player) > 0
                )
              })
                ? 4.2
                : 1
            }
            return 1.3
          },
          value: 8,
        },
        result: {
          ignoreStatus: true,
          target: (player, target) => {
            if (
              target === _status.currentPhase &&
              target.skipList.includes("phaseUse")
            ) {
              const evt = _status.event.getParent("phase")
              if (evt && evt.phaseList.indexOf("phaseJudge") <= evt.num) {
                return 0
              }
            }
            let num = target.needsToDiscard(3),
              cf = (get.threaten(target, player) + 0.6) ** 2
            if (!num) {
              return -0.01 * cf
            }
            if (target.hp > 2) {
              num--
            }
            let dist = Math.sqrt(1 + get.distance(player, target, "absolute"))
            if (dist < 1) {
              dist = 1
            }
            if (target.isTurnedOver()) {
              dist++
            }
            return (Math.min(-0.1, -num) * cf) / dist
          },
        },
        tag: {
          skip: "phaseUse",
        },
      },
    },
    shandian: {
      audio: true,
      fullskin: true,
      type: "delay",
      cardnature: "thunder",
      modTarget(card, player, target) {
        return lib.filter.judge(card, player, target)
      },
      enable(card, player) {
        return player.canAddJudge(card)
      },
      filterTarget(card, player, target) {
        return lib.filter.judge(card, player, target) && player === target
      },
      selectTarget: [-1, -1],
      toself: true,
      judge(card) {
        if (
          get.suit(card) === "spade" &&
          get.number(card) > 1 &&
          get.number(card) < 10
        ) {
          return -5
        }
        return 1
      },
      judge2(result) {
        if (result.bool === false) {
          return true
        }
        return false
      },
      effect() {
        if (result.bool === false) {
          player.damage(3, "thunder", "nosource")
        } else {
          player.addJudgeNext(card)
        }
      },
      cancel() {
        player.addJudgeNext(card)
      },
      ai: {
        basic: {
          order: 1,
          useful: 0,
          value: 0,
        },
        result: {
          target(player, target) {
            var num = game.countPlayer((current) => {
              //var skills=current.getSkills();
              for (var j = 0; j < current.skills.length; j++) {
                var rejudge = get.tag(current.skills[j], "rejudge", current)
                if (rejudge !== undefined) {
                  if (
                    get.attitude(target, current) > 0 &&
                    get.attitude(current, target) > 0
                  ) {
                    return rejudge
                  }
                  return -rejudge
                }
              }
            })
            if (num > 0) {
              return num
            }
            if (num === 0) {
              var mode = get.mode()
              if (mode === "identity") {
                if (target.identity === "nei") {
                  return 1
                }
                var situ = get.situation()
                if (target.identity === "fan") {
                  if (situ > 1) {
                    return 1
                  }
                } else {
                  if (situ < -1) {
                    return 1
                  }
                }
              } else if (mode === "guozhan") {
                if (target.identity === "ye") {
                  return 1
                }
                if (
                  game.hasPlayer((current) => current.identity === "unknown")
                ) {
                  return -1
                }
                if (get.population(target.identity) === 1) {
                  if (target.maxHp > 2 && target.hp < 2) {
                    return 1
                  }
                  if (game.countPlayer() < 3) {
                    return -1
                  }
                  if (target.hp <= 2 && target.countCards("he") <= 3) {
                    return 1
                  }
                }
              }
            }
            return -1
          },
        },
        tag: {
          damage: 0.16,
          natureDamage: 0.16,
          thunderDamage: 0.16,
        },
      },
    },
    zhuge: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["诸葛亮", "马钧"],
      ai: {
        order() {
          return get.order({ name: "sha" }) - 0.1
        },
        equipValue(card, player) {
          if (player._zhuge_temp) {
            return 1
          }
          player._zhuge_temp = true
          var result = (() => {
            if (
              !game.hasPlayer(
                (current) =>
                  get.distance(player, current) <= 1 &&
                  player.canUse("sha", current) &&
                  get.effect(current, { name: "sha" }, player, player) > 0,
              )
            ) {
              return 1
            }
            if (player.hasSha() && _status.currentPhase === player) {
              if (
                (player.getEquip("zhuge") && player.countUsed("sha")) ||
                player.getCardUsable("sha") === 0
              ) {
                return 10
              }
            }
            var num = player.countCards("h", "sha")
            if (num > 1) {
              return 6 + num
            }
            return 3 + num
          })()
          delete player._zhuge_temp
          return result
        },
        basic: {
          equipValue: 5,
        },
        tag: {
          valueswap: 1,
        },
      },
      skills: ["zhuge_skill"],
    },
    cixiong: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["刘备"],
      distance: { attackFrom: -1 },
      ai: {
        basic: {
          equipValue: 2,
        },
      },
      skills: ["cixiong_skill"],
    },
    hanbing: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      distance: { attackFrom: -1 },
      skills: ["hanbing_skill"],
      ai: {
        basic: {
          equipValue: 2,
        },
      },
    },
    qinggang: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["赵云", "曹操"],
      distance: { attackFrom: -1 },
      ai: {
        basic: {
          equipValue: 2,
        },
      },
      skills: ["qinggang_skill"],
    },
    zhangba: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["张飞", "关兴", "张苞", "张星彩"],
      distance: { attackFrom: -2 },
      ai: {
        equipValue(card, player) {
          var num = 2.5 + player.countCards("h") / 3
          return Math.min(num, 4)
        },
        basic: {
          equipValue: 3.5,
        },
      },
      skills: ["zhangba_skill"],
    },
    guanshi: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["徐晃"],
      distance: { attackFrom: -2 },
      ai: {
        equipValue(card, player) {
          var num =
            2.5 + (player.countCards("h") + player.countCards("e")) / 2.5
          return Math.min(num, 5)
        },
        basic: {
          equipValue: 4.5,
        },
      },
      skills: ["guanshi_skill"],
    },
    qinglong: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["关羽", "关兴", "张苞", "关银屏"],
      distance: { attackFrom: -2 },
      ai: {
        equipValue(card, player) {
          return Math.min(2.5 + player.countCards("h", "sha"), 4)
        },
        basic: {
          equipValue: 3.5,
        },
      },
      skills: ["qinglong_skill", "qinglong_guozhan"],
    },
    fangtian: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["吕布"],
      distance: { attackFrom: -3 },
      ai: {
        basic: {
          equipValue: 2.5,
        },
      },
      skills: ["fangtian_skill", "fangtian_guozhan"],
    },
    qilin: {
      fullskin: true,
      type: "equip",
      subtype: "equip1",
      bingzhu: ["吕布"],
      distance: { attackFrom: -4 },
      ai: {
        basic: {
          equipValue: 3,
        },
      },
      skills: ["qilin_skill"],
    },
    bagua: {
      fullskin: true,
      type: "equip",
      subtype: "equip2",
      bingzhu: ["诸葛亮", "黄月英", "黄承彦"],
      ai: {
        basic: {
          equipValue: 7.5,
        },
      },
      skills: ["bagua_skill"],
    },
    renwang: {
      fullskin: true,
      type: "equip",
      subtype: "equip2",
      skills: ["renwang_skill"],
      ai: {
        basic: {
          equipValue: 7.5,
        },
      },
    },
    dayuan: {
      fullskin: true,
      type: "equip",
      subtype: "equip4",
      bingzhu: ["曹操"],
      distance: { globalFrom: -1 },
    },
    chitu: {
      fullskin: true,
      type: "equip",
      subtype: "equip4",
      bingzhu: ["吕布", "关羽"],
      distance: { globalFrom: -1 },
    },
    zixing: {
      fullskin: true,
      type: "equip",
      subtype: "equip4",
      bingzhu: ["曹操"],
      distance: { globalFrom: -1 },
    },
    jueying: {
      fullskin: true,
      type: "equip",
      subtype: "equip3",
      bingzhu: ["曹操"],
      distance: { globalTo: 1 },
      battleOfWancheng() {
        // 宛城之战
        if (get.mode() !== "doudizhu") {
          return false
        }
        const date = new Date()
        if (date.getMonth() !== 6) {
          return false
        }
        const day = date.getDate()
        if (day === 5) {
          return date.getHours() >= 8
        }
        return day > 5 && day < 22
      },
      global: "jueying_wancheng",
    },
    zhuahuang: {
      fullskin: true,
      type: "equip",
      subtype: "equip3",
      bingzhu: ["曹操"],
      distance: { globalTo: 1 },
    },
    dilu: {
      fullskin: true,
      type: "equip",
      subtype: "equip3",
      bingzhu: ["刘备"],
      distance: { globalTo: 1 },
    },
  },
  translate: {
    sha: "杀",
    sha_info:
      "出牌阶段限一次，对你攻击范围内的一名其他角色使用。你对其造成1点伤害。",
    sha_notshan: "invisible",
    shan: "闪",
    shan_info: "抵消【杀】的效果。",
    tao: "桃",
    tao_info:
      "出牌阶段回复已受伤的你1点体力或令一名处于濒死状态的角色回复1点体力。 ",

    juedou: "决斗",
    juedou_bg: "斗",
    juedou_info:
      "出牌阶段，对一名其他角色使用。由该角色开始，其与你轮流打出一张【杀】，然后首先未打出【杀】的角色受到另一名角色造成的1点伤害。",
    juedou_append:
      '<span class="text" style="font-family: yuanli">谁来与我大战三百回合！</span>',
    jiedao: "借刀杀人",
    jiedao_info:
      "出牌阶段，对一名装备区里有武器牌的其他角色使用。除非其对其攻击范围内你选择的一名角色使用一张【杀】，否则其将其装备区里的武器牌交给你。",
    jiedao_append:
      '<span class="text" style="font-family: yuanli">敌已明，友未定，引友杀敌，不自出力，以《损》推演。——《三十六计》</span>',
    wanjian: "万箭齐发",
    wanjian_bg: "箭",
    wanjian_info:
      "出牌阶段，对所有其他角色使用。每名目标角色需打出一张【闪】，否则受到你造成的1点伤害。",
    wanjian_append:
      '<span class="text" style="font-family: yuanli">安得夫差水犀手，三千强弩射潮低。——苏轼</span>',
    nanman: "南蛮入侵",
    nanman_bg: "蛮",
    nanman_info:
      "出牌阶段，对所有其他角色使用。每名目标角色需打出一张【杀】，否则受到你造成的1点伤害。",
    nanman_append:
      '<span class="text" style="font-family: yuanli">南蛮一人持矛入侵，川兵百人见而奔逃。——无名氏</span>',
    guohe: "过河拆桥",
    guohe_bg: "拆",
    guohe_info:
      "出牌阶段，对一名区域里有牌的其他角色使用。你弃置其区域里的一张牌。",
    guohe_append:
      '<span class="text" style="font-family: yuanli">你休得顺水推船，偏不许我过河拆桥。——康进之</span>',
    shunshou: "顺手牵羊",
    shunshou_info:
      "出牌阶段，对距离为1的一名区域里有牌的其他角色使用。你获得该角色区域内的一张牌。",
    shunshou_append:
      '<span class="text" style="font-family: yuanli">效马效羊者右牵之。——《礼记·曲礼上》</span>',
    wuzhong: "无中生有",
    wuzhong_bg: "生",
    wuzhong_info: "出牌阶段，对你使用。你摸两张牌。",
    wuzhong_append:
      '<span class="text" style="font-family: yuanli">天下万物生于有，有生于无。——《老子》</span>',
    wugu: "五谷丰登",
    wugu_bg: "谷",
    wugu_info:
      "出牌阶段，对所有角色使用。你亮出牌堆顶等同于目标角色数的牌，每名目标角色选择并获得其中的一张。",
    wugu_append:
      '<span class="text" style="font-family: yuanli">是故风雨时节，五谷丰熟，社稷安宁。——《六韬·龙韬·立将》</span>',
    taoyuan: "桃园结义",
    taoyuan_bg: "园",
    taoyuan_info: "出牌阶段，对所有角色使用。每名目标角色回复1点体力。",
    taoyuan_append:
      '<span class="text" style="font-family: yuanli">既结为兄弟，则同心协力，救困扶危；上报国家，下安黎庶；不求同年同月同日生，只愿同年同月同日死，皇天后土，实鉴此心，背义忘恩，天人共戮！——《三国演义》</span>',
    wuxie: "无懈可击",
    wuxie_bg: "懈",
    wuxie_info:
      "当一张锦囊牌对一名角色生效前，抵消此牌对该角色的效果；或抵消另一张【无懈可击】的效果。",
    wuxie_append:
      '<span class="text" style="font-family: yuanli">击其懈怠，出其空虚。——曹操</span>',

    lebu: "乐不思蜀",
    lebu_info:
      "出牌阶段，对一名其他角色使用。将【乐不思蜀】置入该角色的判定区，若判定结果不为红桃，其跳过本回合的出牌阶段。",
    lebu_append:
      '<span class="text" style="font-family: yuanli">问禅曰：“颇思蜀否？”，禅曰：“此间乐，不思蜀。”——《三国志·后主传》</span>',
    shandian: "闪电",
    shandian_bg: "电",
    shandian_info:
      "出牌阶段，对你使用。将【闪电】置入你的判定区。若判定结果为黑桃2-9，则目标角色受到3点雷电伤害，否则将之置入其下家的判定区。",
    shandian_append:
      '<span class="text" style="font-family: yuanli">啊啊啊！！！</span>',

    zhuge: "诸葛连弩",
    zhuge_bg: "弩",
    zhuge_skill: "诸葛连弩",
    zhuge_skill_info: "锁定技，你使用【杀】无次数限制。",
    zhuge_info: "锁定技，你使用【杀】无次数限制。",
    zhuge_append:
      '<span class="text" style="font-family: yuanli">又损益连弩，谓之元戎，以铁为矢，矢长八寸，一弩十矢俱发。——《魏氏春秋》</span>',
    cixiong: "雌雄双股剑",
    cixiong_bg: "双",
    cixiong_skill: "雌雄双股剑",
    cixiong_skill_info:
      "当你使用【杀】指定一名与你性别不同的角色为目标后，你可以令其选择一项：1.弃置一张手牌；2.令你摸一张牌。",
    cixiong_info:
      "当你使用【杀】指定一名与你性别不同的角色为目标后，你可以令其选择一项：1.弃置一张手牌；2.令你摸一张牌。",
    cixiong_append:
      '<span class="text" style="font-family: yuanli">又名鸳鸯剑，鸳剑长三尺七寸，鸯剑长三尺四寸，利可断金。——《三国演义》</span>',
    hanbing: "寒冰剑",
    hanbing_bg: "冰",
    hanbing_skill: "寒冰剑",
    hanbing_info:
      "当你使用【杀】对目标角色造成伤害时，若该角色有牌，你可以防止此伤害，改为依次弃置其两张牌。",
    hanbing_skill_info:
      "当你使用【杀】对目标角色造成伤害时，若该角色有牌，你可以防止此伤害，改为依次弃置其两张牌。",
    hanbing_append:
      '<span class="text" style="font-family: yuanli">轻挥寒光泠，踽闻叶落声。</span>',
    qinggang: "青釭剑",
    qinggang_skill: "青釭剑",
    qinggang_skill_info:
      "锁定技，当你使用【杀】指定一名角色为目标后，此【杀】无视其防具。",
    qinggang_info:
      "锁定技，当你使用【杀】指定一名角色为目标后，此【杀】无视其防具。",
    qinggang2: "破防",
    qinggang_append:
      '<span class="text" style="font-family: yuanli">云乃拔青釭剑乱砍，手起处，衣甲平过，血如涌泉。——《三国演义》</span>',
    zhangba: "丈八蛇矛",
    zhangba_bg: "蛇",
    zhangba_skill: "丈八蛇矛",
    zhangba_skill_info: "你可以将两张手牌当【杀】使用或打出。",
    zhangba_info: "你可以将两张手牌当【杀】使用或打出。",
    zhangba_append:
      '<span class="text" style="font-family: yuanli">马上所持，言其俏俏便杀也；又曰激矛，激截也，可以激截敌阵之矛也。——《释名·释兵》</span>',
    guanshi: "贯石斧",
    guanshi_skill: "贯石斧",
    guanshi_skill_info:
      "当你使用的【杀】被抵消时，你可以弃置两张牌，令此【杀】依然造成伤害。",
    guanshi_info:
      "当你使用的【杀】被抵消时，你可以弃置两张牌，令此【杀】依然造成伤害。",
    guanshi_append:
      '<span class="text" style="font-family: yuanli">斧，甫也，甫，始也。凡将制器，始用斧伐木，已乃制之也。——《释名·释用器》</span>',
    qinglong: "青龙偃月刀",
    qinglong_bg: "偃",
    qinglong_skill: "青龙偃月刀",
    qinglong_guozhan: "青龙偃月刀",
    qinglong_skill_info:
      "当你使用的【杀】被目标角色使用的【闪】抵消时，你可以对其使用【杀】。",
    qinglong_info:
      "当你使用的【杀】被目标角色使用的【闪】抵消时，你可以对其使用【杀】。",
    qinglong_guozhan_info:
      "锁定技，当你使用【杀】指定一名角色为目标后，该角色不能明置武将牌直到此【杀】结算结束。",
    qinglong_info_guozhan:
      "锁定技，当你使用【杀】指定一名角色为目标后，该角色不能明置武将牌直到此【杀】结算结束。",
    qinglong_append:
      '<span class="text" style="font-family: yuanli">刀势即大，其三十六刀法，兵仗遇之，无不屈者，刀类中以此为第一。——《三才图会·器用》</span>',
    fangtian: "方天画戟",
    fangtian_skill: "方天画戟",
    fangtian_skill_info:
      "锁定技，若你使用的【杀】是你最后的手牌，则此【杀】可以多选择两个目标。",
    fangtian_info:
      "锁定技，若你使用的【杀】是你最后的手牌，则此【杀】可以多选择两个目标。",
    fangtian_info_guozhan:
      "你使用的【杀】可以指定任意名势力各不相同的角色及未确定势力的角色为目标。当此【杀】被一名目标角色使用【闪】抵消时，此【杀】对其他目标角色无效。",
    fangtian_append:
      '<span class="text" style="font-family: yuanli">豹子尾摇穿画戟，雄兵十万脱征衣。——《三国演义·第十六回》</span>',
    qilin: "麒麟弓",
    qilin_bg: "弓",
    qilin_skill: "麒麟弓",
    qilin_skill_info:
      "当你使用【杀】对目标角色造成伤害时，你可以弃置其装备区里的一张坐骑牌。",
    qilin_info:
      "当你使用【杀】对目标角色造成伤害时，你可以弃置其装备区里的一张坐骑牌。",
    qilin_append:
      '<span class="text" style="font-family: yuanli">虎筋弦响弓开处，雕羽翅飞箭到时。——《三国演义》</span>',

    bagua: "八卦阵",
    bagua_bg: "卦",
    bagua_skill: "八卦阵",
    bagua_info:
      "当你需要使用或打出【闪】时，你可以进行判定，若结果为红色，你视为使用或打出一张【闪】。",
    bagua_skill_info:
      "当你需要使用或打出【闪】时，你可以进行判定，若结果为红色，你视为使用或打出一张【闪】。",
    bagua_append:
      '<span class="text" style="font-family: yuanli">乾三连，坤六断。震仰盂，艮覆碗。离中虚，坎中满。兑上缺，巽下断。——《八卦歌诀》</span>',
    renwang: "仁王盾",
    renwang_bg: "盾",
    renwang_skill: "仁王盾",
    renwang_info: "锁定技，黑色的【杀】对你无效。",
    renwang_skill_info: "锁定技，黑色的【杀】对你无效。",
    renwang_append:
      '<span class="text" style="font-family: yuanli">握仁王之宝镜，日月重光；驱梵帝之金轮，雷霆静祲。——王勃</span>',

    dayuan: "大宛",
    dayuan_bg: "-马",
    dayuan_info: "你计算与其他角色的距离-1。",
    dayuan_append:
      '<span class="text" style="font-family: yuanli">大宛汗血古共知，青海龙种骨更奇，网丝旧画昔尝见，不意人间今见之。——《天马歌》</span>',
    chitu: "赤兔",
    chitu_bg: "-马",
    chitu_info: "你计算与其他角色的距离-1。",
    chitu_append:
      '<span class="text" style="font-family: yuanli">人中吕布，马中赤兔！——《三国演义》</span>',
    zixing: "紫骍",
    zixing_bg: "-马",
    zixing_info: "你计算与其他角色的距离-1。",
    zixing_append:
      '<span class="text" style="font-family: yuanli">怀夏后之九代，想陈王之紫骍。——《梁书·张率传》</span>',

    jueying: "绝影",
    jueying_bg: "+马",
    jueying_info: "其他角色计算与你的距离+1。",
    jueying_append:
      '<span class="text" style="font-family: yuanli">公所乘马名绝影。——《三国志·魏书》</span>',
    zhuahuang: "爪黄飞电",
    zhuahuang_bg: "+马",
    zhuahuang_info: "其他角色计算与你的距离+1。",
    zhuahuang_append:
      '<span class="text" style="font-family: yuanli">操骑爪黄飞电马，引十万之众，与天子猎于许田。——《三国演义》</span>',
    dilu: "的卢",
    dilu_bg: "+马",
    dilu_info: "其他角色计算与你的距离+1。",
    dilu_append:
      '<span class="text" style="font-family: yuanli">备急曰：‘的卢，今日危矣，可努力。’的卢乃一踊三丈，遂得过。——《世语》</span>',
  },
  list: [
    ["spade", 1, "juedou"],
    ["spade", 1, "shandian"],
    ["spade", 2, "cixiong"],
    ["spade", 3, "guohe"],
    ["spade", 4, "guohe"],
    ["spade", 5, "qinglong"],
    ["spade", 6, "lebu"],
    ["spade", 7, "nanman"],
    ["spade", 8, "sha"],
    ["spade", 9, "sha"],
    ["spade", 10, "sha"],
    ["spade", 11, "shunshou"],
    ["spade", 12, "zhangba"],
    ["spade", 13, "dayuan"],

    ["heart", 1, "wanjian"],
    ["heart", 1, "taoyuan"],
    ["heart", 2, "shan"],
    ["heart", 3, "wugu"],
    ["heart", 4, "tao"],
    ["heart", 5, "chitu"],
    ["heart", 6, "lebu"],
    ["heart", 7, "tao"],
    ["heart", 8, "wuzhong"],
    ["heart", 9, "tao"],
    ["heart", 10, "sha"],
    ["heart", 11, "wuzhong"],
    ["heart", 12, "guohe"],
    ["heart", 13, "zhuahuang"],

    ["club", 1, "zhuge"],
    ["club", 2, "bagua"],
    ["club", 3, "sha"],
    ["club", 4, "sha"],
    ["club", 5, "dilu"],
    ["club", 6, "sha"],
    ["club", 7, "nanman"],
    ["club", 8, "sha"],
    ["club", 9, "sha"],
    ["club", 10, "sha"],
    ["club", 11, "sha"],
    ["club", 12, "wuxie"],
    ["club", 12, "jiedao"],
    ["club", 13, "jiedao"],

    ["diamond", 1, "juedou"],
    ["diamond", 2, "shan"],
    ["diamond", 3, "shan"],
    ["diamond", 4, "shunshou"],
    ["diamond", 5, "guanshi"],
    ["diamond", 6, "sha"],
    ["diamond", 7, "shan"],
    ["diamond", 8, "shan"],
    ["diamond", 9, "shan"],
    ["diamond", 10, "sha"],
    ["diamond", 11, "shan"],
    ["diamond", 12, "tao"],
    ["diamond", 13, "sha"],

    ["diamond", 12, "wuxie"],
  ],
}))
