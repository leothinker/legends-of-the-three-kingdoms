import { lib, game, ui, get, ai, _status } from "wtk"
game.import("card", function () {
  return {
    name: "extra",
    connect: true,
    card: {
      firedamage: {
        ai: {
          result: {
            target: -1.5,
          },
          tag: {
            damage: 1,
            fireDamage: 1,
            natureDamage: 1,
          },
        },
      },
      thunderdamage: {
        ai: {
          result: {
            target: -1.5,
          },
          tag: {
            damage: 1,
            thunderDamage: 1,
            natureDamage: 1,
          },
        },
      },
      jiu: {
        audio: true,
        fullskin: true,
        type: "basic",
        toself: true,
        enable(event, player) {
          //return !player.hasSkill('jiu');
          return true
        },
        lianheng: true,
        logv: false,
        savable(card, player, dying) {
          return dying == player || player.hasSkillTag("jiuOther", null, dying, true)
        },
        usable: 1,
        selectTarget: -1,
        modTarget: true,
        filterTarget(card, player, target) {
          return target == player
        },
        content() {
          if (typeof event.baseDamage != "number") {
            event.baseDamage = 1
          }
          if (target.isDying() || event.getParent(2).type == "dying") {
            target.recover()
            if (_status.currentPhase == target && typeof target.getStat().card.jiu == "number") {
              target.getStat().card.jiu--
            }
          } else {
            game.addVideo("jiuNode", target, true)
            if (cards && cards.length) {
              card = cards[0]
            }
            if (!target.storage.jiu) {
              target.storage.jiu = 0
            }
            target.storage.jiu += event.baseDamage
            game.broadcastAll(
              function (target, card, gain2) {
                target.addSkill("jiu")
                if (!target.node.jiu && lib.config.jiu_effect) {
                  target.node.jiu = ui.create.div(".playerjiu", target.node.avatar)
                  target.node.jiu2 = ui.create.div(".playerjiu", target.node.avatar2)
                }
                if (
                  gain2 &&
                  card.clone &&
                  (card.clone.parentNode == target.parentNode || card.clone.parentNode == ui.arena)
                ) {
                  card.clone.moveDelete(target)
                }
              },
              target,
              card,
              target == targets[0] && cards.length == 1,
            )
            if (target == targets[0] && cards.length == 1) {
              if (
                card.clone &&
                (card.clone.parentNode == target.parentNode || card.clone.parentNode == ui.arena)
              ) {
                game.addVideo("gain2", target, get.cardsInfo([card]))
              }
            }
          }
        },
        ai: {
          basic: {
            useful: (card, i) => {
              if (_status.event.player.hp > 1) {
                if (i === 0) {
                  return 4
                }
                return 1
              }
              if (i === 0) {
                return 7.3
              }
              return 3
            },
            value: (card, player, i) => {
              if (player.hp > 1) {
                if (i === 0) {
                  return 5
                }
                return 1
              }
              if (i === 0) {
                return 7.3
              }
              return 3
            },
          },
          order(item, player) {
            if (_status.event.dying) {
              return 9
            }
            let sha = get.order({ name: "sha" })
            if (sha <= 0) {
              return 0
            }
            let usable = player.getCardUsable("sha")
            if (
              usable < 2 &&
              player.hasCard((i) => {
                return get.name(i, player) == "zhuge"
              }, "hs")
            ) {
              usable = Infinity
            }
            let shas = Math.min(usable, player.mayHaveSha(player, "use", item, "count"))
            if (
              shas != 1 ||
              (lib.config.mode === "stone" &&
                !player.isMin() &&
                player.getActCount() + 1 >= player.actcount)
            ) {
              return 0
            }
            return sha + 0.2
          },
          result: {
            target: (player, target, card) => {
              if (target && target.isDying()) {
                return 2
              }
              if (!target || target._jiu_temp || !target.isPhaseUsing()) {
                return 0
              }
              let effs = { order: 0 },
                temp
              target.getCards("hs", (i) => {
                if (get.name(i) !== "sha" || ui.selected.cards.includes(i)) {
                  return false
                }
                temp = get.order(i, target)
                if (temp < effs.order) {
                  return false
                }
                if (temp > effs.order) {
                  effs = { order: temp }
                }
                effs[i.cardid] = {
                  card: i,
                  target: null,
                  eff: 0,
                }
              })
              delete effs.order
              for (let i in effs) {
                if (!lib.filter.filterCard(effs[i].card, target)) {
                  continue
                }
                game.filterPlayer((current) => {
                  if (
                    get.attitude(target, current) >= 0 ||
                    !target.canUse(effs[i].card, current, null, true) ||
                    current.hasSkillTag("filterDamage", null, {
                      player: target,
                      card: effs[i].card,
                      jiu: true,
                    })
                  ) {
                    return false
                  }
                  temp = get.effect(current, effs[i].card, target, player)
                  if (temp <= effs[i].eff) {
                    return false
                  }
                  effs[i].target = current
                  effs[i].eff = temp
                  return false
                })
                if (!effs[i].target) {
                  continue
                }
                if (
                  target.hasSkillTag(
                    "directHit_ai",
                    true,
                    {
                      target: effs[i].target,
                      card: i,
                    },
                    true,
                  ) ||
                  //(Math.min(target.getCardUsable("sha"), target.mayHaveSha(player, "use", item, "count")) === 1 && (
                  target.needsToDiscard() > Math.max(0, 3 - target.hp) ||
                  !effs[i].target.mayHaveShan(player, "use")
                  //))
                ) {
                  delete target._jiu_temp
                  return 1
                }
              }
              delete target._jiu_temp
              return 0
            },
          },
          tag: {
            save: 1,
            recover: 0.1,
          },
        },
      },
      huogong: {
        audio: true,
        fullskin: true,
        type: "trick",
        enable: true,
        cardnature: "fire",
        filterTarget(card, player, target) {
          //if(player!=game.me&&player.countCards('h')<2) return false;
          return target.countCards("h") > 0
        },
        async content(event, trigger, player) {
          const { target, showPosition = "h" } = event
          if (target.countCards(showPosition) == 0) {
            return event.finish()
          }
          //返回目标选展示牌的结果，给出默认逻辑
          event.chooseToShow ??= async (event, player, target) => {
            const { showPosition = "h", filterShow = () => true } = event
            let result
            if (target.countCards(showPosition) == 1) {
              result = { bool: true, cards: target.getCards(showPosition) }
            } else {
              result = await target
                .chooseCard(true, showPosition, "请选择【火攻】要展示的牌", filterShow)
                .set("ai", function (card) {
                  if (_status.event.getRand() < 0.5) {
                    return Math.random()
                  }
                  return get.value(card)
                })
                .forResult()
            }
            return result
          }
          const result = await event.chooseToShow(event, player, target)
          event.showResult = result
          const { cards } = result
          event.cards2 = cards
          const showEvent = target
            .showCards(cards, `${get.translation(target)}因【火攻】展示的牌`)
            .set("closeDialog", false)
          await showEvent
          const videoId = showEvent.videoId
          event.videoId = videoId
          //返回玩家弃牌/其他操作的结果，给出默认逻辑
          event.chooseToDiscard ??= async (event, player, target) => {
            const {
              discardPostion = "h",
              cards2,
              filterDiscard = { suit: get.suit(cards2[0]) },
            } = event
            const result = await player
              .chooseToDiscard(discardPostion, filterDiscard)
              .set("ai", (card) => {
                const evt = _status.event.getParent()
                if (get.damageEffect(evt.target, evt.player, evt.player, "fire") > 0) {
                  return 6.2 + Math.min(4, evt.player.hp) - get.value(card, evt.player)
                }
                return -1
              })
              .set("prompt", false)
              .forResult()
            return result
          }
          const result2 = await event.chooseToDiscard(event, player, target)
          event.discardResult = result2
          if (result2?.bool) {
            await target.damage("fire")
          } else {
            target.addTempSkill("huogong2")
          }
          game.addVideo("cardDialog", null, videoId)
          game.broadcastAll("closeDialog", videoId)
        },
        ai: {
          basic: {
            order: 9.2,
            value: [3, 1],
            useful: 0.6,
          },
          wuxie(target, card, player, viewer, status) {
            if (get.attitude(viewer, player._trueMe || player) > 0) {
              return 0
            }
            if (
              status * get.attitude(viewer, target) * get.effect(target, card, player, target) >=
              0
            ) {
              return 0
            }
            if (_status.event.getRand("huogong_wuxie") * 4 > player.countCards("h")) {
              return 0
            }
          },
          result: {
            player(player) {
              var nh = player.countCards("h")
              if (nh <= player.hp && nh <= 4 && _status.event.name == "chooseToUse") {
                if (
                  typeof _status.event.filterCard == "function" &&
                  _status.event.filterCard(
                    new lib.element.VCard({ name: "huogong" }),
                    player,
                    _status.event,
                  )
                ) {
                  return -10
                }
                if (_status.event.skill) {
                  var viewAs = get.info(_status.event.skill).viewAs
                  if (viewAs == "huogong") {
                    return -10
                  }
                  if (viewAs && viewAs.name == "huogong") {
                    return -10
                  }
                }
              }
              return 0
            },
            target(player, target) {
              if (target.hasSkill("huogong2") || target.countCards("h") == 0) {
                return 0
              }
              if (player.countCards("h") <= 1) {
                return 0
              }
              if (_status.event.player == player) {
                if (target.isAllCardsKnown(player)) {
                  if (
                    !target.countCards("h", (card) => {
                      return player.countCards("h", (card2) => {
                        return get.suit(card2) == get.suit(card)
                      })
                    })
                  ) {
                    return 0
                  }
                }
              }
              if (target == player) {
                if (
                  typeof _status.event.filterCard == "function" &&
                  _status.event.filterCard(
                    new lib.element.VCard({ name: "huogong" }),
                    player,
                    _status.event,
                  )
                ) {
                  return -1.15
                }
                if (_status.event.skill) {
                  var viewAs = get.info(_status.event.skill).viewAs
                  if (viewAs == "huogong") {
                    return -1.15
                  }
                  if (viewAs && viewAs.name == "huogong") {
                    return -1.15
                  }
                }
                return 0
              }
              return -1.15
            },
          },
          tag: {
            damage: 1,
            fireDamage: 1,
            natureDamage: 1,
            norepeat: 1,
          },
        },
      },
      tiesuo: {
        audio: true,
        fullskin: true,
        type: "trick",
        enable: true,
        filterTarget: true,
        selectTarget: [1, 2],
        complexTarget: true,
        content() {
          target.link()
        },
        recastable: true,
        ai: {
          wuxie: (target, card, player, viewer, status) => {
            if (
              status * get.attitude(viewer, player._trueMe || player) > 0 ||
              target.hasSkillTag("noLink") ||
              target.hasSkillTag("nodamage") ||
              target.hasSkillTag("nofire") ||
              target.hasSkillTag("nothunder")
            ) {
              return 0
            }
            if (
              get.damageEffect(target, player, viewer, "thunder") >= 0 ||
              get.damageEffect(target, player, viewer, "fire") >= 0
            ) {
              return 0
            }
            if (target.hp + target.hujia > 2 && target.mayHaveShan(viewer, "use")) {
              return 0
            }
          },
          basic: {
            order: 7.3,
            useful: 1.2,
            value: 4,
          },
          result: {
            target: (player, target) => {
              if (target.hasSkillTag("link") || target.hasSkillTag("noLink")) {
                return 0
              }
              let curs = game.filterPlayer((current) => {
                if (current.hasSkillTag("noLink") || current.hasSkillTag("nodamage")) {
                  return false
                }
                return !current.hasSkillTag("nofire") || !current.hasSkillTag("nothunder")
              })
              if (curs.length < 2) {
                return 0
              }
              let f = target.hasSkillTag("nofire"),
                t = target.hasSkillTag("nothunder"),
                res = 0.9
              if ((f && t) || target.hasSkillTag("nodamage")) {
                return 0
              }
              if (f || t) {
                res = 0.45
              }
              if (!f && target.getEquip("tengjia")) {
                res *= 2
              }
              if (!target.isLinked()) {
                res = -res
              }
              if (ui.selected.targets.length) {
                return res
              }
              let fs = 0,
                es = 0,
                att = get.attitude(player, target),
                linkf = false,
                alink = true
              curs.forEach((i) => {
                let atti = get.attitude(player, i)
                if (atti > 0) {
                  fs++
                  if (i.isLinked()) {
                    linkf = true
                  }
                } else if (atti < 0) {
                  es++
                  if (!i.isLinked()) {
                    alink = false
                  }
                }
              })
              if (es < 2 && !alink) {
                if (att <= 0 || (att > 0 && linkf && fs < 2)) {
                  return 0
                }
              }
              return res
            },
          },
          tag: {
            multitarget: 1,
            multineg: 1,
            norepeat: 1,
          },
        },
      },
      bingliang: {
        audio: true,
        fullskin: true,
        type: "delay",
        range: { global: 1 },
        filterTarget(card, player, target) {
          return lib.filter.judge(card, player, target) && player != target
        },
        judge(card) {
          if (get.suit(card) == "club") {
            return 1
          }
          return -2
        },
        judge2(result) {
          if (result.bool == false) {
            return true
          }
          return false
        },
        effect() {
          if (result.bool == false) {
            if (get.is.changban()) {
              player.addTempSkill("bingliang_changban")
            } else {
              player.skip("phaseDraw")
            }
          }
        },
        ai: {
          basic: {
            order: 1,
            useful(card, i) {
              let player = _status.event.player
              if (_status.event.isPhaseUsing()) {
                return game.hasPlayer((cur) => {
                  return (
                    cur !== player &&
                    lib.filter.judge(card, player, cur) &&
                    get.effect(cur, card, player, player) > 0
                  )
                })
                  ? 3.2
                  : 1
              }
              return 0.6
            },
            value: 4,
          },
          result: {
            target(player, target) {
              if (target.hasJudge("caomu")) {
                return 0
              }
              return -2.7 / Math.sqrt(target.countCards("h") + 1)
            },
          },
          tag: {
            skip: "phaseDraw",
          },
        },
      },
      guding: {
        fullskin: true,
        type: "equip",
        subtype: "equip1",
        bingzhu: ["孙坚"],
        distance: { attackFrom: -1 },
        ai: {
          basic: {
            equipValue: 2,
          },
        },
        skills: ["guding_skill"],
      },
      zhuque: {
        fullskin: true,
        type: "equip",
        subtype: "equip1",
        bingzhu: ["周瑜"],
        distance: { attackFrom: -3 },
        ai: {
          basic: {
            equipValue: 2,
          },
        },
        skills: ["zhuque_skill"],
      },
      tengjia: {
        fullskin: true,
        type: "equip",
        subtype: "equip2",
        bingzhu: ["兀突骨", "孟获", "祝融"],
        ai: {
          value(card, player, index, method) {
            if (player.isDisabled(2)) {
              return 0.01
            }
            if (player.getEquips("tengjia").includes(card)) {
              if (player.hasSkillTag("noDirectDamage")) {
                return 10
              }
              if (
                game.hasPlayer(function (current) {
                  return (
                    current != player &&
                    get.attitude(current, player) < 0 &&
                    current.hasSkillTag("fireAttack", null, null, true)
                  )
                })
              ) {
                return 0
              }
              return 6
            }
            var value = 0
            var info = get.info(card)
            var current = player.getEquip(info.subtype)
            if (current && card != current) {
              value = get.value(current, player)
            }
            var equipValue = info.ai.equipValue
            if (equipValue == undefined) {
              equipValue = info.ai.basic.equipValue
            }
            if (typeof equipValue == "function") {
              if (method == "raw") {
                return equipValue(card, player)
              }
              if (method == "raw2") {
                return equipValue(card, player) - value
              }
              return Math.max(0.1, equipValue(card, player) - value)
            }
            if (typeof equipValue != "number") {
              equipValue = 0
            }
            if (method == "raw") {
              return equipValue
            }
            if (method == "raw2") {
              return equipValue - value
            }
            return Math.max(0.1, equipValue - value)
          },
          equipValue(card, player) {
            if (player._tengjiaEv_temp) {
              return Math.max(1, 6 - player.hp)
            }
            if (player.hasSkillTag("maixie") && player.hp > 1) {
              return 0
            }
            if (player.hasSkillTag("noDirectDamage")) {
              return 10
            }
            player._tengjiaEv_temp = true
            let eff = get.damageEffect(player, player, player, "fire")
            delete player._tengjiaEv_temp
            if (eff >= 0) {
              return 10
            }
            let num =
              4 -
              game.countPlayer(function (current) {
                if (get.attitude(current, player) < 0) {
                  if (current.hasSkillTag("fireAttack", null, null, true)) {
                    return 3
                  }
                  return 1
                }
                return false
              })
            if (player.hp == 1) {
              num += 3
            }
            if (player.hp == 2) {
              num += 1
            }
            return num
          },
          basic: {
            equipValue: 3,
          },
        },
        skills: ["tengjia1", "tengjia2", "tengjia3"],
      },
      baiyin: {
        fullskin: true,
        type: "equip",
        subtype: "equip2",
        bingzhu: ["马超"],
        loseDelay: false,
        onLose() {
          player.addTempSkill("baiyin_skill_lose")
        },
        skills: ["baiyin_skill"],
        tag: {
          recover: 1,
        },
        ai: {
          order: 9.5,
          equipValue(card, player) {
            if (player.hp == player.maxHp) {
              return 5
            }
            if (player.countCards("h", "baiyin")) {
              return 6
            }
            return 0
          },
          basic: {
            equipValue: 5,
            useful: (card, i) => {
              let player = get.event().player,
                num
              if (
                player.isDamaged() &&
                player.hp < 2 &&
                get.recoverEffect(player, player, player) > 0
              ) {
                return -10
              }
              num = player.hasSkillTag(
                "filterDamage",
                null,
                {
                  card: new lib.element.VCard("sha"),
                  jiu: true,
                },
                true,
              )
                ? 0.6
                : 1.2
              if (
                player.canAddJudge("shandian") &&
                get.effect(player, { name: "shandian" }, player, player) < 0 &&
                !player.hasSkillTag("rejudge")
              ) {
                if (game.hasPlayer((cur) => cur.hasJudge("shandian"))) {
                  num += 2
                } else {
                  num++
                }
              }
              num += game.countPlayer((cur) => {
                if (get.attitude(cur, player) <= 0) {
                  return cur.hasSkillTag("damageBonus")
                }
              })
              if (player.isDamaged()) {
                num /= player.getDamagedHp()
              }
              return num
            },
          },
        },
      },
      hualiu: {
        fullskin: true,
        type: "equip",
        subtype: "equip3",
        bingzhu: ["徐晃"],
        distance: { globalTo: 1 },
      },
    },
    skill: {
      jiu: {
        trigger: { player: "useCard1" },
        filter(event) {
          return event.card && event.card.name == "sha"
        },
        forced: true,
        charlotte: true,
        firstDo: true,
        content() {
          if (!trigger.baseDamage) {
            trigger.baseDamage = 1
          }
          trigger.baseDamage += player.storage.jiu
          trigger.jiu = true
          trigger.jiu_add = player.storage.jiu
          if (lib.skill.jiu2.filter(trigger, player)) {
            game.broadcastAll(function (player) {
              player.removeSkill("jiu")
            }, player)
            game.addVideo("jiuNode", player, false)
          }
        },
        temp: true,
        vanish: true,
        silent: true,
        popup: false,
        nopop: true,
        onremove(player) {
          if (player.node.jiu) {
            player.node.jiu.delete()
            player.node.jiu2.delete()
            delete player.node.jiu
            delete player.node.jiu2
          }
          delete player.storage.jiu
        },
        ai: {
          damageBonus: true,
          skillTagFilter(player, tag, arg) {
            if (tag === "damageBonus") {
              return arg && arg.card && arg.card.name === "sha"
            }
          },
        },
        group: "jiu2",
      },
      jiu2: {
        trigger: { player: "useCardAfter", global: "phaseAfter" },
        priority: 2,
        firstDo: true,
        charlotte: true,
        filter(event, player) {
          if (player.hasSkillTag("jiuSustain", null, event.name)) {
            return false
          }
          if (event.name == "useCard") {
            return event.card && event.card.name == "sha"
          }
          return true
        },
        forced: true,
        popup: false,
        audio: false,
        content() {
          game.broadcastAll(function (player) {
            player.removeSkill("jiu")
          }, player)
          game.addVideo("jiuNode", player, false)
        },
      },
      huogong2: { charlotte: true },
      bingliang_changban: {
        cardSkill: true,
        unique: true,
        trigger: { player: "phaseDrawBegin" },
        silent: true,
        content() {
          trigger.num--
        },
        group: "bingliang_changban2",
      },
      bingliang_changban2: {
        cardSkill: true,
        trigger: { player: "phaseDrawAfter" },
        silent: true,
        content() {
          if (player.enemy) {
            player.enemy.draw()
          }
        },
      },
      guding_skill: {
        equipSkill: true,
        audio: true,
        trigger: { source: "damageBegin1" },
        filter(event) {
          if (event.parent.name == "_lianhuan" || event.parent.name == "_lianhuan2") {
            return false
          }
          if (event.card && event.card.name == "sha") {
            if (event.player.countCards("h") == 0) {
              return true
            }
          }
          return false
        },
        forced: true,
        content() {
          trigger.num++
        },
        ai: {
          effect: {
            player(card, player, target, current, isLink) {
              if (
                card.name == "sha" &&
                !isLink &&
                target.countCards("h") == 0 &&
                !target.hasSkillTag("filterDamage", null, {
                  player: player,
                  card: card,
                })
              ) {
                return [1, 0, 1, -3]
              }
            },
          },
        },
      },
      zhuque_skill: {
        equipSkill: true,
        trigger: { player: "useCard1" },
        //priority:7,
        filter(event, player) {
          if (event.card.name == "sha" && !game.hasNature(event.card)) {
            return true
          }
        },
        audio: true,
        check(event, player) {
          let eff = 0,
            nature = event.card.nature
          for (let i = 0; i < event.targets.length; i++) {
            eff -= get.effect(event.targets[i], event.card, player, player)
            event.card.nature = "fire"
            eff += get.effect(event.targets[i], event.card, player, player)
            event.card.nature = nature
          }
          return eff > 0
        },
        prompt2(event, player) {
          return "将" + get.translation(event.card) + "改为火属性"
        },
        content() {
          game.setNature(trigger.card, "fire")
          if (get.itemtype(trigger.card) == "card") {
            var next = game.createEvent("zhuque_clear")
            next.card = trigger.card
            event.next.remove(next)
            trigger.after.push(next)
            next.setContent(function () {
              game.setNature(trigger.card, [])
            })
          }
        },
      },
      zhuque_skill2: {
        trigger: { player: "useCardAfter" },
        forced: true,
        popup: false,
        content() {
          delete player.storage.zhuque_skill.nature
        },
      },
      tengjia1: {
        equipSkill: true,
        trigger: { target: ["useCardToBefore"] },
        forced: true,
        priority: 6,
        audio: true,
        filter(event, player) {
          if (player.hasSkillTag("unequip2")) {
            return false
          }
          if (
            event.player.hasSkillTag("unequip", false, {
              name: event.card ? event.card.name : null,
              target: player,
              card: event.card,
            })
          ) {
            return false
          }
          if (event.card.name == "nanman") {
            return true
          }
          if (event.card.name == "wanjian") {
            return true
          }
          //if(event.card.name=='chuqibuyi') return true;
          return false
        },
        content() {
          trigger.cancel()
        },
        ai: {
          effect: {
            target(card, player, target, current) {
              if (target.hasSkillTag("unequip2")) {
                return
              }
              if (
                player.hasSkillTag("unequip", false, {
                  name: card ? card.name : null,
                  target: target,
                  card: card,
                }) ||
                player.hasSkillTag("unequip_ai", false, {
                  name: card ? card.name : null,
                  target: target,
                  card: card,
                })
              ) {
                return
              }
              if (card.name == "nanman" || card.name == "wanjian") {
                return "zeroplayertarget"
              }
              if (card.name == "sha") {
                var equip1 = player.getEquip("zhuque")
                if (equip1 && equip1.name == "zhuque") {
                  return 1.9
                }
                if (!game.hasNature(card)) {
                  return "zeroplayertarget"
                }
              }
            },
          },
        },
      },
      tengjia2: {
        equipSkill: true,
        trigger: { player: "damageBegin3" },
        filter(event, player) {
          if (!event.hasNature("fire")) {
            return false
          }
          if (player.hasSkillTag("unequip2")) {
            return false
          }
          if (
            event.source &&
            event.source.hasSkillTag("unequip", false, {
              name: event.card ? event.card.name : null,
              target: player,
              card: event.card,
            })
          ) {
            return false
          }
          return true
        },
        audio: true,
        forced: true,
        content() {
          trigger.num++
        },
        ai: {
          effect: {
            target(card, player, target, current) {
              if (card.name == "sha") {
                if (game.hasNature(card, "fire")) {
                  return 2
                }
                if (player.hasSkill("zhuque_skill")) {
                  return 1.9
                }
              }
              if (get.tag(card, "fireDamage") && current < 0) {
                return 2
              }
            },
          },
        },
      },
      tengjia3: {
        equipSkill: true,
        audio: "tengjia1",
        trigger: { target: "shaBefore" },
        forced: true,
        filter(event, player) {
          if (player.hasSkillTag("unequip2")) {
            return false
          }
          if (
            event.player.hasSkillTag("unequip", false, {
              name: event.card ? event.card.name : null,
              target: player,
              card: event.card,
            })
          ) {
            return false
          }
          if (event.card.name == "sha" && !game.hasNature(event.card)) {
            return true
          }
          return false
        },
        content() {
          trigger.cancel()
        },
      },
      baiyin_skill: {
        equipSkill: true,
        trigger: { player: "damageBegin4" },
        forced: true,
        audio: true,
        filter(event, player) {
          if (event.num <= 1) {
            return false
          }
          if (player.hasSkillTag("unequip2")) {
            return false
          }
          if (
            event.source &&
            event.source.hasSkillTag("unequip", false, {
              name: event.card ? event.card.name : null,
              target: player,
              card: event.card,
            })
          ) {
            return false
          }
          return true
        },
        //priority:-10,
        content() {
          trigger.num = 1
        },
        subSkill: {
          lose: {
            audio: "baiyin_skill",
            forced: true,
            charlotte: true,
            equipSkill: true,
            trigger: {
              player: "loseAfter",
              global: [
                "equipAfter",
                "addJudgeAfter",
                "gainAfter",
                "loseAsyncAfter",
                "addToExpansionAfter",
              ],
            },
            filter: (event, player, name, card) => {
              if (!card || card.name != "baiyin") {
                return false
              }
              return player.isDamaged() && !player.hasSkillTag("unequip2")
            },
            getIndex(event, player) {
              const evt = event.getl(player)
              const lostCards = []
              evt.es.forEach((card) => {
                const VEquip = evt.vcard_map.get(card)
                if (VEquip?.name === "baiyin") {
                  lostCards.add(VEquip)
                }
              })
              return lostCards
            },
            async content(event, trigger, player) {
              await player.recover()
            },
          },
        },
        ai: {
          filterDamage: true,
          skillTagFilter(player, tag, arg) {
            if (player.hasSkillTag("unequip2")) {
              return false
            }
            if (arg && arg.player) {
              if (
                arg.player.hasSkillTag("unequip", false, {
                  name: arg.card ? arg.card.name : null,
                  target: player,
                  card: arg.card,
                })
              ) {
                return false
              }
              if (
                arg.player.hasSkillTag("unequip_ai", false, {
                  name: arg.card ? arg.card.name : null,
                  target: player,
                  card: arg.card,
                })
              ) {
                return false
              }
              if (arg.player.hasSkillTag("jueqing", false, player)) {
                return false
              }
            }
          },
        },
      },
    },
    translate: {
      jiu: "酒",
      jiu_info: "出牌阶段令你本回合使用的下一张【杀】伤害+1或令处于濒死状态的你回复1点体力。",
      leisha: "雷杀",
      leisha_info: "出牌阶段限一次，对你攻击范围内的一名其他角色使用。你对其造成1点雷电伤害。",
      huosha: "火杀",
      huosha_info: "出牌阶段限一次，对你攻击范围内的一名其他角色使用。你对其造成1点火焰伤害。",

      huogong: "火攻",
      huogong_bg: "攻",
      huogong_info:
        "出牌阶段，对一名有手牌的角色使用。目标角色展示一张手牌，然后你可以弃置一张与其展示牌花色相同的手牌，对其造成1点火焰伤害。",
      huogong_append:
        '<span class="text" style="font-family: yuanli">行火必有因，烟火必素具。——《孙子·火攻》</span>',
      tiesuo: "铁索连环",
      tiesuo_info:
        "出牌阶段，对一至两名角色使用。目标角色横置或重置。<br>重铸：出牌阶段，你可以将此牌置入弃牌堆，然后摸一张牌。",
      tiesuo_bg: "索",
      tiesuo_append:
        '<span class="text" style="font-family: yuanli">或三十为一排，或五十为一排，首尾用铁环连锁，上铺阔板，休言人可渡，马亦可走矣。乘此而行，任他风浪潮水上下，复何惧哉？——《三国演义》</span>',

      bingliang: "兵粮寸断",
      bingliang_bg: "粮",
      bingliang_info:
        "出牌阶段，对距离为1的一名其他角色使用。将【兵粮寸断】置入该角色的判定区，若判定结果不为梅花，其跳过本回合的摸牌阶段。",
      bingliang_append:
        '<span class="text" style="font-family: yuanli">人是铁，饭是钢，一顿不吃……</span>',

      guding: "古锭刀",
      guding_info: "锁定技，当你使用【杀】对目标角色造成伤害时，若该角色没有手牌，则此伤害+1。",
      guding_skill: "古锭刀",
      guding_append:
        '<span class="text" style="font-family: yuanli">孙坚披烂银铠，裹赤帻，横古锭刀，骑花鬃马……——《三国演义》</span>',
      zhuque: "朱雀羽扇",
      zhuque_bg: "扇",
      zhuque_skill: "朱雀羽扇",
      zhuque_info: "当你使用普通【杀】时，你可以将此【杀】改为火【杀】。",
      zhuque_append:
        '<span class="text" style="font-family: yuanli">羽扇纶巾，谈笑间，樯橹灰飞烟灭。——《念奴娇·赤壁怀古》</span>',

      tengjia: "藤甲",
      tengjia_info:
        "锁定技，【南蛮入侵】、【万箭齐发】和普【杀】对你无效；当你受到火焰伤害时，你令伤害值+1。",
      tengjia1: "藤甲",
      tengjia2: "藤甲",
      tengjia3: "藤甲",
      tengjia_append:
        '<span class="text" style="font-family: yuanli">……穿在身上，渡江不沉，经水不湿，刀箭皆不能入……——《三国演义》</span>',
      baiyin: "白银狮子",
      baiyin_info:
        "锁定技，当你受到大于1点的伤害时，你将伤害值改为1；当你失去装备区里的【白银狮子】后，你回复1点体力。",
      baiyin_skill: "白银狮子",
      baiyin_append:
        '<span class="text" style="font-family: yuanli">马超纵骑持枪而出；狮盔兽带，银甲白袍：一来结束非凡，二者人才出众。——《三国演义》</span>',

      hualiu: "骅骝",
      hualiu_bg: "+马",
      hualiu_info: "锁定技，其他角色计算与你的距离+1。",
      hualiu_append:
        '<span class="text" style="font-family: yuanli">枥下骅骝思鼓角，门前老将识风云。——《上将行》</span>',
    },
    list: [
      ["heart", 1, "wuxie"],
      ["heart", 2, "huogong"],
      ["heart", 3, "huogong"],
      ["heart", 4, "sha", "fire"],
      ["heart", 5, "tao"],
      ["heart", 6, "tao"],
      ["heart", 7, "sha", "fire"],
      ["heart", 8, "shan"],
      ["heart", 9, "shan"],
      ["heart", 10, "sha", "fire"],
      ["heart", 11, "shan"],
      ["heart", 12, "shan"],
      ["heart", 13, "wuxie"],

      ["diamond", 1, "zhuque"],
      ["diamond", 2, "tao"],
      ["diamond", 3, "tao"],
      ["diamond", 4, "sha", "fire"],
      ["diamond", 5, "sha", "fire"],
      ["diamond", 6, "shan"],
      ["diamond", 7, "shan"],
      ["diamond", 8, "shan"],
      ["diamond", 9, "jiu"],
      ["diamond", 10, "shan"],
      ["diamond", 11, "shan"],
      ["diamond", 12, "huogong"],
      ["diamond", 13, "hualiu"],

      ["club", 1, "baiyin"],
      ["club", 2, "tengjia"],
      ["club", 3, "jiu"],
      ["club", 4, "bingliang"],
      ["club", 5, "sha", "thunder"],
      ["club", 6, "sha", "thunder"],
      ["club", 7, "sha", "thunder"],
      ["club", 8, "sha", "thunder"],
      ["club", 9, "jiu"],
      ["club", 10, "tiesuo"],
      ["club", 11, "tiesuo"],
      ["club", 12, "tiesuo"],
      ["club", 13, "tiesuo"],

      ["spade", 1, "guding"],
      ["spade", 2, "tengjia"],
      ["spade", 3, "jiu"],
      ["spade", 4, "sha", "thunder"],
      ["spade", 5, "sha", "thunder"],
      ["spade", 6, "sha", "thunder"],
      ["spade", 7, "sha", "thunder"],
      ["spade", 8, "sha", "thunder"],
      ["spade", 9, "jiu"],
      ["spade", 10, "bingliang"],
      ["spade", 11, "tiesuo"],
      ["spade", 12, "tiesuo"],
      ["spade", 13, "wuxie"],
    ],
  }
})
