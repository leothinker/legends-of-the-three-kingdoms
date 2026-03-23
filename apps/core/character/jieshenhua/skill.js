import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
    jx_buqu: {
        audio: 2,
        audioname: ["key_yuri"],
        trigger: { player: "chooseToUseBefore" },
        forced: true,
        preHidden: true,
        filter(event, player) {
            return event.type == "dying" && player.isDying() && event.dying == player && !event.getParent()._jx_buqu;
        },
        async content(event, trigger, player) {
            trigger.getParent()._jx_buqu = true;
            const [card] = get.cards();
            const next = player.addToExpansion(card, "gain2");
            next.gaintag.add("jx_buqu");
            await next;
            const cards = player.getExpansions("jx_buqu"),
                num = get.number(card);
            player.showCards(cards, "不屈");
            for (let i = 0; i < cards.length; i++) {
                if (cards[i] != card && get.number(cards[i]) == num) {
                    await player.loseToDiscardpile(card);
                    return;
                }
            }
            trigger.cancel();
            trigger.result = { bool: true };
            if (player.hp <= 0) {
                await player.recover(1 - player.hp);
            }
        },
        mod: {
            maxHandcardBase(player, num) {
                if (get.mode() != "guozhan" && player.getExpansions("jx_buqu").length) {
                    return player.getExpansions("jx_buqu").length;
                }
            },
        },
        ai: {
            save: true,
            mingzhi: true,
            skillTagFilter(player, tag, target) {
                if (player != target) {
                    return false;
                }
            },
            effect: {
                target(card, player, target) {
                    if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
                        let num = target.getExpansions("jx_buqu").length || target.getHp();
                        return (num + 1) / 5;
                    }
                },
            },
        },
        onremove(player, skill) {
            const cards = player.getExpansions(skill);
            if (cards.length) {
                player.loseToDiscardpile(cards);
            }
        },
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
    },
    fenji: {
        audio: "fenji",
        trigger: {
            global: "phaseJieshuBegin",
        },
        filter(event, player) {
            if (event.player.countCards("h") == 0 && event.player.isIn()) {
                return true;
            }
            return false;
        },
        preHidden: true,
        check(event, player) {
            if (get.attitude(get.event().player, event.player) <= 0) {
                return false;
            }
            return 2 * get.effect(event.player, { name: "draw" }, player, get.event().player) + get.effect(player, { name: "losehp" }, player, get.event().player) > 0;
        },
        logTarget: "player",
        async content(event, trigger, player) {
            player.line(trigger.player, "green");
            await trigger.player.draw(2);
            await player.loseHp();
        },
    },
    jx_guhuo: {
        audio: "guhuo_guess",
        derivation: ["chanyuan"],
        enable: ["chooseToUse", "chooseToRespond"],
        hiddenCard(player, name) {
            return lib.inpile.includes(name) && player.countCards("hs") > 0 && !player.hasSkill("guhuo_phase");
        },
        filter(event, player) {
            if (player.hasSkill("guhuo_phase")) {
                return false;
            }
            if (!player.countCards("hs")) {
                return false;
            }
            for (const i of lib.inpile) {
                const type = get.type(i);
                if ((type == "basic" || type == "trick") && event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
                    return true;
                }
                if (i == "sha") {
                    for (const j of lib.inpile_nature) {
                        if (event.filterCard(get.autoViewAs({ name: i, nature: j }, "unsure"), player, event)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },
        chooseButton: {
            dialog(event, player) {
                const list = [];
                for (const i of lib.inpile) {
                    if (event.type != "phase") {
                        if (!event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
                            continue;
                        }
                    }
                    const type = get.type(i);
                    if (type == "basic" || type == "trick") {
                        list.push([type, "", i]);
                    }
                    if (i == "sha") {
                        for (const j of lib.inpile_nature) {
                            if (event.type != "phase") {
                                if (!event.filterCard(get.autoViewAs({ name: i, nature: j }, "unsure"), player, event)) {
                                    continue;
                                }
                            }
                            list.push(["基本", "", "sha", j]);
                        }
                    }
                }
                return ui.create.dialog("蛊惑", [list, "vcard"]);
            },
            filter(button, player) {
                const evt = _status.event.getParent();
                return evt.filterCard({ name: button.link[2], nature: button.link[3] }, player, evt);
            },
            check(button) {
                const player = _status.event.player;
                const enemyNum = game.countPlayer(function (current) {
                    return current != player && !current.hasSkill("chanyuan") && (get.realAttitude || get.attitude)(current, player) < 0;
                });
                const card = { name: button.link[2], nature: button.link[3] };
                const val = _status.event.getParent().type == "phase" ? player.getUseValue(card) : 1;
                if (val <= 0) {
                    return 0;
                }
                if (enemyNum) {
                    if (
                        !player.hasCard(function (cardx) {
                            if (card.name == cardx.name) {
                                if (card.name != "sha") {
                                    return true;
                                }
                                return get.is.sameNature(card, cardx);
                            }
                            return false;
                        }, "hs")
                    ) {
                        if (get.value(card, player, "raw") < 6) {
                            return Math.sqrt(val) * (0.25 + Math.random() / 1.5);
                        }
                        if (enemyNum <= 2) {
                            return Math.sqrt(val) / 1.5;
                        }
                        return 0;
                    }
                    return 3 * val;
                }
                return val;
            },
            backup(links, player) {
                return {
                    filterCard(card, player, target) {
                        let result = true;
                        const suit = card.suit,
                            number = card.number;
                        card.suit = "none";
                        card.number = null;
                        const mod = game.checkMod(card, player, "unchanged", "cardEnabled2", player);
                        if (mod != "unchanged") {
                            result = mod;
                        }
                        card.suit = suit;
                        card.number = number;
                        return result;
                    },
                    selectCard: 1,
                    position: "hs",
                    ignoreMod: true,
                    aiUse: Math.random(),
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3],
                        suit: "none",
                        number: null,
                    },
                    ai1(card) {
                        const player = _status.event.player;
                        const enemyNum = game.countPlayer(function (current) {
                            return current != player && !current.hasSkill("chanyuan") && (get.realAttitude || get.attitude)(current, player) < 0;
                        });
                        const cardx = lib.skill.jx_guhuo_backup.viewAs;
                        if (enemyNum) {
                            if (card.name == cardx.name && (card.name != "sha" || get.is.sameNature(card, cardx))) {
                                return 2 + Math.random() * 3;
                            } else if (lib.skill.jx_guhuo_backup.aiUse < 0.5 && !player.isDying()) {
                                return 0;
                            }
                        }
                        return 6 - get.value(card);
                    },
                    async precontent(event, trigger, player) {
                        player.logSkill("jx_guhuo");
                        player.addTempSkill("guhuo_guess");
                        const [card] = event.result.cards;
                        event.result.card.suit = get.suit(card);
                        event.result.card.number = get.number(card);
                    },
                };
            },
            prompt(links, player) {
                return "将一张手牌当做" + get.translation(links[0][2]) + (_status.event.name == "chooseToRespond" ? "打出" : "使用");
            },
        },
        ai: {
            save: true,
            respondSha: true,
            respondShan: true,
            fireAttack: true,
            skillTagFilter(player) {
                if (!player.countCards("hs") || player.hasSkill("guhuo_phase")) {
                    return false;
                }
            },
            threaten: 1.2,
            order: 8.1,
            result: { player: 1 },
        },
    },
    guhuo_guess: {
        audio: 2,
        trigger: {
            player: ["useCardBefore", "respondBefore"],
        },
        forced: true,
        silent: true,
        popup: false,
        firstDo: true,
        charlotte: true,
        filter(event, player) {
            return event.skill && (event.skill.indexOf("guhuo_") == 0 || event.skill.indexOf("jx_guhuo_") == 0);
        },
        async content(event, trigger, player) {
            player.addTempSkill("guhuo_phase");
            event.fake = false;
            event.betrayer = null;
            const [card] = trigger.cards;
            if (card.name != trigger.card.name || (card.name == "sha" && !get.is.sameNature(trigger.card, card))) {
                event.fake = true;
            }
            player.popup(trigger.card.name, "metal");
            const next = player.lose(card, ui.ordering);
            next.relatedEvent = trigger;
            await next;
            // player.line(trigger.targets,trigger.card.nature);
            trigger.throw = false;
            trigger.skill = "jx_guhuo_backup";
            game.log(player, "声明", trigger.targets && trigger.targets.length ? "对" : "", trigger.targets || "", trigger.name == "useCard" ? "使用" : "打出", trigger.card);
            event.prompt = get.translation(player) + "声明" + (trigger.targets && trigger.targets.length ? "对" + get.translation(trigger.targets) : "") + (trigger.name == "useCard" ? "使用" : "打出") + (get.translation(trigger.card.nature) || "") + get.translation(trigger.card.name) + "，是否质疑？";
            event.targets = game
                .filterPlayer(function (current) {
                    return current != player && !current.hasSkill("chanyuan");
                })
                .sortBySeat(_status.currentPhase);
            game.broadcastAll(
                function (card, player) {
                    _status.guhuoNode = card.copy("thrown");
                    if (lib.config.cardback_style != "default") {
                        _status.guhuoNode.style.transitionProperty = "none";
                        ui.refresh(_status.guhuoNode);
                        _status.guhuoNode.classList.add("infohidden");
                        ui.refresh(_status.guhuoNode);
                        _status.guhuoNode.style.transitionProperty = "";
                    } else {
                        _status.guhuoNode.classList.add("infohidden");
                    }
                    _status.guhuoNode.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";
                    player.$throwordered2(_status.guhuoNode);
                },
                trigger.cards[0],
                player
            );
            event.onEnd01 = function () {
                _status.guhuoNode.removeEventListener("webkitTransitionEnd", _status.event.onEnd01);
                setTimeout(function () {
                    _status.guhuoNode.style.transition = "all ease-in 0.3s";
                    _status.guhuoNode.style.transform = "perspective(600px) rotateY(270deg)";
                    const onEnd = function () {
                        _status.guhuoNode.classList.remove("infohidden");
                        _status.guhuoNode.style.transition = "all 0s";
                        ui.refresh(_status.guhuoNode);
                        _status.guhuoNode.style.transform = "perspective(600px) rotateY(-90deg)";
                        ui.refresh(_status.guhuoNode);
                        _status.guhuoNode.style.transition = "";
                        ui.refresh(_status.guhuoNode);
                        _status.guhuoNode.style.transform = "";
                        _status.guhuoNode.removeEventListener("webkitTransitionEnd", onEnd);
                    };
                    _status.guhuoNode.listenTransition(onEnd);
                }, 300);
            };
            for (const target of event.targets) {
                const { links } = await target
                    .chooseButton([event.prompt, [["reguhuo_ally", "reguhuo_betray"], "vcard"]], true)
                    .set("ai", function (button) {
                        const player = _status.event.player;
                        const evt = _status.event.getParent("guhuo_guess"),
                            evtx = evt.getTrigger();
                        if (!evt) {
                            return Math.random();
                        }
                        const card = { name: evtx.card.name, nature: evtx.card.nature, isCard: true };
                        const ally = button.link[2] == "reguhuo_ally";
                        if (ally && (player.hp <= 1 || get.attitude(player, evt.player) >= 0)) {
                            return 1.1;
                        }
                        if (!ally && get.attitude(player, evt.player) < 0 && evtx.name == "useCard") {
                            let eff = 0;
                            const targetsx = evtx.targets || [];
                            for (const target of targetsx) {
                                const isMe = target == evt.player;
                                eff += get.effect(target, card, evt.player, player) / (isMe ? 1.5 : 1);
                            }
                            eff /= 1.5 * targetsx.length || 1;
                            if (eff > 0) {
                                return 0;
                            }
                            if (eff < -7) {
                                return Math.random() + Math.pow(-(eff + 7) / 8, 2);
                            }
                            return Math.pow((get.value(card, evt.player, "raw") - 4) / (eff == 0 ? 5 : 10), 2);
                        }
                        return Math.random();
                    })
                    .forResult();
                if (links[0][2] == "reguhuo_betray") {
                    target.addExpose(0.2);
                    game.log(target, "#y质疑");
                    target.popup("质疑！", "fire");
                    event.betrayer = target;
                    break;
                } else {
                    game.log(target, "#g不质疑");
                    target.popup("不质疑", "wood");
                }
            }
            await game.delayx();
            game.broadcastAll(function (onEnd) {
                _status.event.onEnd01 = onEnd;
                if (_status.guhuoNode) {
                    _status.guhuoNode.listenTransition(onEnd, 300);
                }
            }, event.onEnd01);
            await game.delay(2);
            if (!event.betrayer) {
                return;
            }
            if (event.fake) {
                event.betrayer.popup("质疑正确", "wood");
                game.log(player, "声明的", trigger.card, "作废了");
                trigger.cancel();
                trigger.getParent().goto(0);
                trigger.line = false;
            } else {
                event.betrayer.popup("质疑错误", "fire");
                await event.betrayer.addSkills("chanyuan");
            }
            await game.delay(2);
            if (event.fake) {
                game.broadcastAll(() => ui.clear());
            } // game.broadcastAll(ui.clear); 原来的代码抽象喵
        },
    },
    chanyuan: {
        init(player, skill) {
            if (player.hp == 1) {
                player.logSkill(skill);
            }
            player.addSkillBlocker(skill);
        },
        onremove(player, skill) {
            player.removeSkillBlocker(skill);
        },
        skillBlocker(skill, player) {
            return skill != "chanyuan" && skill != "rechanyuan" && !lib.skill[skill].charlotte && !lib.skill[skill].persevereSkill && player.hp == 1;
        },
        mark: true,
        intro: {
            content(storage, player, skill) {
                let str = "<li>锁定技。你不能于〖蛊惑〗的结算流程中进行质疑。当你的体力值为1时，你的其他技能失效。";
                const list = player.getSkills(null, false, false).filter(function (i) {
                    return lib.skill.rechanyuan.skillBlocker(i, player);
                });
                if (list.length) {
                    str += "<br><li>失效技能：" + get.translation(list);
                }
                return str;
            },
        },
        audio: 2,
        trigger: { player: "changeHp" },
        filter(event, player) {
            return player.hp == 1;
        },
        forced: true,
        async content(event, trigger, player) { },
    },
    guhuo_phase: {},
    jx_leiji: {
        audio: 2,
        trigger: { player: ["useCard", "respond"] },
        filter(event, player) {
            return event.card.name == "shan";
        },
        line: "thunder",
        async cost(event, trigger, player) {
            const next = player.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
                return target != player;
            });
            next.ai = function (target) {
                if (target.hasSkill("hongyan")) {
                    return 0;
                }
                return get.damageEffect(target, _status.event.player, _status.event.player, "thunder");
            };
            event.result = await next.forResult();
        },
        async content(event, trigger, player) {
            const [target] = event.targets;
            const next = target.judge(function (card) {
                const suit = get.suit(card);
                if (suit == "spade") {
                    return -4;
                }
                if (suit == "club") {
                    return -2;
                }
                return 0;
            });
            next.judge2 = function (result) {
                return result.bool == false; // ? true : false; 喵？
            };
            const { suit } = await next.forResult();
            if (suit == "club") {
                await player.recover();
                await target.damage("thunder");
            } else if (suit == "spade") {
                await target.damage(2, "thunder");
            }
        },
        ai: {
            useShan: true,
            effect: {
                target_use(card, player, target, current) {
                    if (
                        get.tag(card, "respondShan") &&
                        !player.hasSkillTag(
                            "directHit_ai",
                            true,
                            {
                                target: target,
                                card: card,
                            },
                            true
                        )
                    ) {
                        let club = 0,
                            spade = 0;
                        if (
                            game.hasPlayer(function (current) {
                                return get.attitude(target, current) < 0 && get.damageEffect(current, target, target, "thunder") > 0;
                            })
                        ) {
                            club = 2;
                            spade = 4;
                        }
                        if (!target.isHealthy()) {
                            club += 2;
                        }
                        if (!club && !spade) {
                            return 1;
                        }
                        if (card.name === "sha") {
                            if (!target.mayHaveShan(player, "use")) {
                                return;
                            }
                        } else if (!target.mayHaveShan(player)) {
                            return 1 - 0.1 * Math.min(5, target.countCards("hs"));
                        }
                        if (!target.hasSkillTag("rejudge")) {
                            return [1, (club + spade) / 4];
                        }
                        let pos = player.hasSkillTag("viewHandcard", null, target, true) ? "hes" : "e",
                            better = club > spade ? "club" : "spade",
                            max = 0;
                        target.hasCard(function (cardx) {
                            if (get.suit(cardx) === better) {
                                max = 2;
                                return true;
                            }
                            if (spade && get.color(cardx) === "black") {
                                max = 1;
                            }
                        }, pos);
                        if (max === 2) {
                            return [1, Math.max(club, spade)];
                        }
                        if (max === 1) {
                            return [1, Math.min(club, spade)];
                        }
                        if (pos === "e") {
                            return [1, Math.min((Math.max(1, target.countCards("hs")) * (club + spade)) / 4, Math.max(club, spade))];
                        }
                        return [1, (club + spade) / 4];
                    }
                },
            },
        },
    },
    jx_liegong: {
        mod: {
            aiOrder(player, card, num) {
                if (num > 0 && (card.name === "sha" || get.tag(card, "draw"))) {
                    return num + 6;
                }
            },
            targetInRange(card, player, target) {
                if (card.name == "sha" && typeof get.number(card) == "number") {
                    if (get.distance(player, target) <= get.number(card)) {
                        return true;
                    }
                }
            },
        },
        targetprompt2: target => {
            const player = get.player(),
                card = get.card(),
                list = [];
            if (card?.name != "sha" || !target.classList.contains("selectable")) {
                return list;
            }
            const num = card.cards?.length ?? 0;
            if (target.countCards("h") <= player.countCards("h") - num) {
                list.add("不可响应");
            }
            if (target.hp >= player.hp) {
                list.add("加伤");
            }
            return list;
        },
        onChooseToUse(event) {
            event.targetprompt2.add(lib.skill.jx_liegong.targetprompt2);
        },
        onChooseTarget(event) {
            event.targetprompt2.add(lib.skill.jx_liegong.targetprompt2);
        },
        audio: 2,
        trigger: { player: "useCardToTargeted" },
        logTarget: "target",
        locked: false,
        check(event, player) {
            return get.attitude(player, event.target) <= 0;
        },
        filter(event, player) {
            if (event.card.name != "sha") {
                return false;
            }
            if (event.target.countCards("h") <= player.countCards("h")) {
                return true;
            }
            if (event.target.hp >= player.hp) {
                return true;
            }
            return false;
        },
        async content(event, trigger, player) {
            if (trigger.target.countCards("h") <= player.countCards("h")) {
                trigger.getParent().directHit.push(trigger.target);
            }
            if (trigger.target.hp >= player.hp) {
                const id = trigger.target.playerid;
                const map = trigger.getParent().customArgs;
                if (!map[id]) {
                    map[id] = {};
                }
                if (typeof map[id].extraDamage != "number") {
                    map[id].extraDamage = 0;
                }
                map[id].extraDamage++;
            }
        },
        ai: {
            threaten: 0.5,
            directHit_ai: true,
            skillTagFilter(player, tag, arg) {
                if (
                    arg?.target &&
                    arg?.card &&
                    get.attitude(player, arg.target) <= 0 &&
                    arg.card.name == "sha" &&
                    player.countCards("h", function (card) {
                        return card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card));
                    }) >= arg.target.countCards("h")
                ) {
                    return true;
                }
                return false;
            },
        },
    },
    jx_kuanggu: {
        audio: 2,
        trigger: { source: "damageSource" },
        filter(event, player) {
            return event.checkKuanggu && event.num > 0;
        },
        getIndex(event, player, triggername) {
            return event.num;
        },
        preHidden: true,
        async cost(event, trigger, player) {
            let choice;
            if (
                player.isDamaged() &&
                get.recoverEffect(player) > 0 &&
                player.countCards("hs", function (card) {
                    return card.name == "sha" && player.hasValueTarget(card);
                }) >= player.getCardUsable("sha")
            ) {
                choice = "recover_hp";
            } else {
                choice = "draw_card";
            }
            const next = player.chooseDrawRecover("###" + get.prompt(event.skill) + "###摸一张牌或回复1点体力");
            next.set("choice", choice);
            next.set("ai", function () {
                return _status.event.getParent().choice;
            });
            next.set("logSkill", event.skill);
            next.setHiddenSkill(event.skill);
            const { control } = await next.forResult();
            if (control == "cancel2") {
                return;
            }
            event.result = { bool: true, skill_popup: false }; // 好像在content里面不能中断getIndex喵
        },
        async content(event, trigger, player) { },
    },
    qimou: {
        limited: true,
        audio: 2,
        enable: "phaseUse",
        skillAnimation: true,
        animationColor: "orange",
        async content(event, trigger, player) {
            const shas = player.getCards("h", "sha");
            let num;
            if (player.hp >= 4 && shas.length >= 3) {
                num = 3;
            } else if (player.hp >= 3 && shas.length >= 2) {
                num = 2;
            } else {
                num = 1;
            }
            const map = {};
            const list = [];
            for (let i = 1; i <= player.hp; i++) {
                const cn = get.cnNumber(i, true);
                map[cn] = i;
                list.push(cn);
            }
            player.awakenSkill(event.name);
            player.storage.qimou = true;
            const result = await player
                .chooseControl(list, function () {
                    return get.cnNumber(_status.event.goon, true);
                })
                .set("prompt", "失去任意点体力")
                .set("goon", num)
                .forResult();
            num = map[result.control] || 1;
            player.storage.qimou2 = num;
            player.addTempSkill("qimou2");
            await player.loseHp(num);
        },
        ai: {
            order: 2,
            result: {
                player(player) {
                    if (player.hp == 1) {
                        return 0;
                    }
                    const shas = player.getCards("h", "sha");
                    if (!shas.length) {
                        return 0;
                    }
                    const card = shas[0];
                    if (!lib.filter.cardEnabled(card, player)) {
                        return 0;
                    }
                    if (lib.filter.cardUsable(card, player)) {
                        return 0;
                    }
                    let mindist;
                    if (player.hp >= 4 && shas.length >= 3) {
                        mindist = 4;
                    } else if (player.hp >= 3 && shas.length >= 2) {
                        mindist = 3;
                    } else {
                        mindist = 2;
                    }
                    if (
                        game.hasPlayer(function (current) {
                            return current.hp <= mindist - 1 && get.distance(player, current, "attack") <= mindist && player.canUse(card, current, false) && get.effect(current, card, player, player) > 0;
                        })
                    ) {
                        return 1;
                    }
                    return 0;
                },
            },
        },
    },
    qimou2: {
        onremove: true,
        mod: {
            cardUsable(card, player, num) {
                if (typeof player.storage.qimou2 == "number" && card.name == "sha") {
                    return num + player.storage.qimou2;
                }
            },
            globalFrom(from, to, distance) {
                if (typeof from.storage.qimou2 == "number") {
                    return distance - from.storage.qimou2;
                }
            },
        },
    },
    jx_shensu: {
        audio: 2,
        group: ["jx_shensu_1", "jx_shensu_2", "shensu4"],
        preHidden: ["jx_shensu_1", "jx_shensu_2", "shensu4"],
        subSkill: {
            1: {
                audio: "shensu1",
                inherit: "shensu1",
                sourceSkill: "jx_shensu",
            },
            2: {
                inherit: "shensu2",
                sourceSkill: "jx_shensu",
            },
        },
    },
    shensu4: {
        audio: "shensu1",
        audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
        trigger: { player: "phaseDiscardBefore" },
        sourceSkill: "xinshensu",
        async cost(event, trigger, player) {
            const check = player.needsToDiscard() || player.isTurnedOver() || (player.hasSkill("shebian") && player.canMoveCard(true, true));
            event.result = await player
                .chooseTarget(get.prompt(event.skill), "跳过弃牌阶段并将武将牌翻面，视为对一名其他角色使用一张【杀】", function (card, player, target) {
                    if (player == target) {
                        return false;
                    }
                    return player.canUse({ name: "sha" }, target, false);
                })
                .set("check", check)
                .set("ai", function (target) {
                    if (!_status.event.check) {
                        return 0;
                    }
                    return get.effect(target, { name: "sha" }, _status.event.player, _status.event.player);
                })
                .setHiddenSkill(event.skill)
                .forResult();
        },
        async content(event, trigger, player) {
            trigger.cancel();
            await player.turnOver();
            await player.useCard({ name: "sha", isCard: true }, event.targets[0], false);
        },
    },
    jx_jushou: {
        audio: 2,
        trigger: { player: "phaseJieshuBegin" },
        async content(event, trigger, player) {
            await player.draw(4);
            await player.turnOver();
            const result = await player
                .chooseCard("h", true, "弃置一张手牌，若以此法弃置的是装备牌，则你改为使用之")
                .set("ai", function (card) {
                    if (get.type(card) == "equip") {
                        return 5 - get.value(card);
                    }
                    return -get.value(card);
                })
                .set("filterCard", lib.filter.cardDiscardable)
                .forResult();
            if (result.bool && result.cards.length) {
                const card = result.cards[0];
                if (get.type(card) == "equip" && player.hasUseTarget(card)) {
                    player.chooseUseTarget(card, true, "nopopup");
                } else {
                    player.discard(card);
                }
            }
        },
    },
    jiewei: {
        audio: 2,
        enable: "chooseToUse",
        filterCard: true,
        position: "e",
        viewAs: { name: "wuxie" },
        filter(event, player) {
            return player.countCards("e") > 0;
        },
        viewAsFilter(player) {
            return player.countCards("e") > 0;
        },
        prompt: "将一张装备区内的牌当无懈可击使用",
        check(card) {
            return 8 - get.equipValue(card);
        },
        threaten: 1.2,
        group: "jiewei_move",
        subSkill: {
            move: {
                trigger: { player: "turnOverEnd" },
                audio: "jiewei",
                filter(event, player) {
                    return !player.isTurnedOver() && player.canMoveCard();
                },
                async cost(event, trigger, player) {
                    event.result = await player
                        .chooseToDiscard("he", get.prompt("jiewei"), "弃置一张牌并移动场上的一张牌", lib.filter.cardDiscardable)
                        .set("ai", function (card) {
                            if (!_status.event.check) {
                                return 0;
                            }
                            return 7 - get.value(card);
                        })
                        .set("check", player.canMoveCard(true))
                        .forResult();
                },
                async content(event, trigger, player) {
                    await player.moveCard(true);
                },
            },
        },
    },
    jx_tianxiang: {
        audio: 2,
        trigger: { player: "damageBegin4" },
        preHidden: true,
        filter(event, player) {
            return (
                player.countCards("h", function (card) {
                    return _status.connectMode || get.suit(card, player) == "heart";
                }) > 0 && event.num > 0
            );
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseCardTarget({
                    filterCard(card, player) {
                        return get.suit(card) == "heart" && lib.filter.cardDiscardable(card, player);
                    },
                    filterTarget(card, player, target) {
                        return player != target;
                    },
                    ai1(card) {
                        return 10 - get.value(card);
                    },
                    ai2(target) {
                        const att = get.attitude(_status.event.player, target);
                        const trigger = _status.event.getTrigger();
                        let da = 0;
                        if (_status.event.player.hp == 1) {
                            da = 10;
                        }
                        const eff = get.damageEffect(target, trigger.source, target);
                        if (att == 0) {
                            return 0.1 + da;
                        }
                        if (eff >= 0 && att > 0) {
                            return att + da;
                        }
                        if (att > 0 && target.hp > 1) {
                            if (target.maxHp - target.hp >= 3) {
                                return att * 1.1 + da;
                            }
                            if (target.maxHp - target.hp >= 2) {
                                return att * 0.9 + da;
                            }
                        }
                        return -att + da;
                    },
                    prompt: get.prompt(event.skill),
                    prompt2: lib.translate[`${event.skill}_info`],
                })
                .setHiddenSkill(event.name.slice(0, -5))
                .forResult();
        },
        async content(event, trigger, player) {
            const [target] = event.targets;
            const [card] = event.cards;
            trigger.cancel();
            await player.discard(event.cards);
            const result = await player
                .chooseControlList(
                    true,
                    function (event, player) {
                        const target = _status.event.target;
                        let att = get.attitude(player, target);
                        if (target.hasSkillTag("maihp")) {
                            att = -att;
                        }
                        if (att > 0) {
                            return 0;
                        } else {
                            return 1;
                        }
                    },
                    ["令" + get.translation(target) + "受到伤害来源对其造成的1点伤害，然后摸X张牌（X为其已损失体力值且至多为5）", "令" + get.translation(target) + "失去1点体力，然后获得" + get.translation(event.cards)]
                )
                .set("target", target)
                .forResult();
            if (typeof result.index != "number") {
                return;
            }
            if (result.index) {
                event.related = target.loseHp();
            } else {
                event.related = target.damage(trigger.source || "nosource", "nocard");
            }
            await event.related;
            //if(event.related.cancelled||target.isDead()) return;
            if (result.index && card.isInPile()) {
                await target.gain(card, "gain2");
            } else if (target.getDamagedHp()) {
                await target.draw(Math.min(5, target.getDamagedHp()));
            }
        },
        ai: {
            maixie_defend: true,
            effect: {
                target(card, player, target) {
                    if (player.hasSkillTag("jueqing", false, target)) {
                        return;
                    }
                    if (get.tag(card, "damage") && target.countCards("he") > 1) {
                        return 0.7;
                    }
                },
            },
        },
    },
    jx_tianxiang3: {
        trigger: { player: "loseHpAfter" },
        forced: true,
        popup: false,
        sourceSkill: "jx_tianxiang",
        filter(event) {
            return event.type == "jx_tianxiang";
        },
        vanish: true,
        async content(event, trigger, player) {
            await player.gain(player.storage.jx_tianxiang3, "gain2");
            player.removeSkill("jx_tianxiang3");
        },
        onremove(player) {
            const card = player.storage.jx_tianxiang3;
            if (get.position(card) == "s") {
                game.cardsDiscard(card);
            }
            delete player.storage.jx_tianxiang3;
        },
    },
    jx_tianxiang2: {
        trigger: { player: "damageAfter" },
        forced: true,
        popup: false,
        sourceSkill: "jx_tianxiang",
        filter(event) {
            return event.type == "jx_tianxiang";
        },
        vanish: true,
        async content(event, trigger, player) {
            if (player.isDamaged()) {
                await player.draw(player.getDamagedHp());
            }
            player.removeSkill("jx_tianxiang2");
        },
    },
    jx_huoji: {
        position: "hes",
        audio: 2,
        audioname: ["ol_sp_zhugeliang", "ol_pangtong"],
        enable: "chooseToUse",
        filterCard(card) {
            return get.color(card) == "red";
        },
        viewAs: {
            name: "huogong",
        },
        viewAsFilter(player) {
            if (!player.countCards("hes", { color: "red" })) {
                return false;
            }
        },
        prompt: "将一张红色牌当火攻使用",
        check(card) {
            var player = get.player();
            if (player.countCards("h") > player.hp) {
                return 6 - get.value(card);
            }
            return 4 - get.value(card);
        },
        ai: {
            fireAttack: true,
        },
    },
    jx_kanpo: {
        mod: {
            aiValue(player, card, num) {
                if (get.name(card) != "wuxie" && get.color(card) != "black") {
                    return;
                }
                var cards = player.getCards("hs", function (card) {
                    return get.name(card) == "wuxie" || get.color(card) == "black";
                });
                cards.sort(function (a, b) {
                    return (get.name(b) == "wuxie" ? 1 : 2) - (get.name(a) == "wuxie" ? 1 : 2);
                });
                var geti = function () {
                    if (cards.includes(card)) {
                        return cards.indexOf(card);
                    }
                    return cards.length;
                };
                if (get.name(card) == "wuxie") {
                    return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
                }
                return Math.max(num, [6, 4, 3][Math.min(geti(), 2)]);
            },
            aiUseful() {
                return lib.skill.jx_kanpo.mod.aiValue.apply(this, arguments);
            },
        },
        locked: false,
        audio: 2,
        audioname: ["ol_sp_zhugeliang", "ol_pangtong"],
        position: "hes",
        enable: "chooseToUse",
        filterCard(card) {
            return get.color(card) == "black";
        },
        viewAsFilter(player) {
            return player.countCards("hes", { color: "black" }) > 0;
        },
        viewAs: {
            name: "wuxie",
        },
        prompt: "将一张黑色牌当无懈可击使用",
        check(card) {
            return 8 - get.value(card);
        },
    },
    jx_qiangxi: {
        subSkill: {
            off: {
                sub: true,
            },
        },
        audio: 2,
        enable: "phaseUse",
        filterCard(card) {
            return get.subtype(card) == "equip1";
        },
        selectCard() {
            return [0, 1];
        },
        filterTarget(card, player, target) {
            if (player == target) {
                return false;
            }
            if (target.hasSkill("jx_qiangxi_off")) {
                return false;
            }
            return player.inRange(target);
        },
        async content(event, trigger, player) {
            const { cards, target } = event;
            // step 0
            if (cards.length === 0) {
                await player.loseHp();
            }
            // step 1
            target.addTempSkill("jx_qiangxi_off", "phaseUseAfter");
            await target.damage("nocard");
        },
        check(card) {
            return 10 - get.value(card);
        },
        position: "he",
        ai: {
            order: 8.5,
            result: {
                target(player, target) {
                    if (!ui.selected.cards.length) {
                        if (player.hp < 2) {
                            return 0;
                        }
                        if (target.hp >= player.hp) {
                            return 0;
                        }
                    }
                    return get.damageEffect(target, player);
                },
            },
        },
        threaten: 1.5,
    },
    jx_jieming: {
        audio: 2,
        trigger: { player: "damageEnd" },
        filter(event, player) {
            return event.num > 0;
        },
        getIndex: event => event.num,
        async cost(event, trigger, player) {
            event.result = await player
                .chooseTarget(get.prompt2(event.skill))
                .set("ai", target => {
                    const att = get.attitude(get.player(), target);
                    if (att > 2) {
                        if (target.maxHp - target.countCards("h") > 2) {
                            return 2 * att;
                        }
                        return att;
                    }
                    return att / 3;
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const {
                targets: [target],
            } = event;
            player.line(target, "thunder");
            await target.draw(2);
            if (target.countCards("h") < target.maxHp) {
                await player.draw();
            }
        },
        ai: {
            maixie: true,
            maixie_hp: true,
            effect: {
                target(card, player, target, current) {
                    if (get.tag(card, "damage") && target.hp > 1) {
                        if (player.hasSkillTag("jueqing", false, target)) {
                            return [1, -2];
                        }
                        var max = 0;
                        var players = game.filterPlayer();
                        for (var i = 0; i < players.length; i++) {
                            if (get.attitude(target, players[i]) > 0) {
                                max = Math.max(Math.min(5, players[i].hp) - players[i].countCards("h"), max);
                            }
                        }
                        switch (max) {
                            case 0:
                                return 2;
                            case 1:
                                return 1.5;
                            case 2:
                                return [1, 2];
                            default:
                                return [0, max];
                        }
                    }
                    if ((card.name == "tao" || card.name == "caoyao") && target.hp > 1 && target.countCards("h") <= target.hp) {
                        return [0, 0];
                    }
                },
            },
        },
    },
    jianchu: {
        audio: 2,
        audioname: ["re_pangde"],
        trigger: { player: "useCardToPlayered" },
        filter(event, player) {
            return event.card.name == "sha" && event.target.countDiscardableCards(player, "he") > 0;
        },
        preHidden: true,
        check(event, player) {
            return get.attitude(player, event.target) <= 0;
        },
        logTarget: "target",
        async content(event, trigger, player) {
            const result = await player
                .discardPlayerCard(trigger.target, get.prompt("jianchu", trigger.target), true)
                .set("ai", function (button) {
                    if (!_status.event.att) {
                        return 0;
                    }
                    if (get.position(button.link) == "e") {
                        if (get.subtype(button.link) == "equip2") {
                            return 5 * get.value(button.link);
                        }
                        return get.value(button.link);
                    }
                    return 1;
                })
                .set("att", get.attitude(player, trigger.target) <= 0)
                .forResult();
            if (result.bool && result.links && result.links.length) {
                if (get.type(result.links[0], null, result.links[0].original == "h" ? player : false) == "equip") {
                    trigger.getParent().directHit.add(trigger.target);
                } else if (trigger.cards) {
                    const list = [];
                    for (let i = 0; i < trigger.cards.length; i++) {
                        if (get.position(trigger.cards[i], true) == "o") {
                            list.push(trigger.cards[i]);
                        }
                    }
                    if (list.length) {
                        trigger.target.gain(list, "gain2", "log");
                    }
                }
            }
        },
        ai: {
            unequip_ai: true,
            directHit_ai: true,
            skillTagFilter(player, tag, arg) {
                if (tag == "directHit_ai") {
                    return (
                        arg.card.name == "sha" &&
                        arg.target.countCards("e", function (card) {
                            return get.value(card) > 1;
                        }) > 0
                    );
                }
                if (arg && arg.name == "sha" && arg.target.getEquip(2)) {
                    return true;
                }
                return false;
            },
        },
    },
    jx_lianhuan: {
        audio: 2,
        inherit: "lianhuan",
        group: "jx_lianhuan_add",
        subSkill: {
            add: {
                audio: "jx_lianhuan",
                trigger: { player: "useCard2" },
                filter(event, player) {
                    if (event.card.name != "tiesuo") {
                        return false;
                    }
                    var info = get.info(event.card);
                    if (info.allowMultiple == false) {
                        return false;
                    }
                    if (event.targets && !info.multitarget) {
                        if (
                            game.hasPlayer(current => {
                                return !event.targets.includes(current) && lib.filter.targetEnabled2(event.card, player, current);
                            })
                        ) {
                            return true;
                        }
                    }
                    return false;
                },
                charlotte: true,
                forced: true,
                popup: false,
                content() {
                    "step 0";
                    player
                        .chooseTarget(
                            get.prompt("jx_lianhuan"),
                            "为" + get.translation(trigger.card) + "额外指定一个目标",
                            (card, player, target) => {
                                return !_status.event.sourcex.includes(target) && lib.filter.targetEnabled2(_status.event.card, player, target);
                            }
                        )
                        .set("sourcex", trigger.targets)
                        .set("ai", function (target) {
                            var player = _status.event.player;
                            return get.effect(target, _status.event.card, player, player);
                        })
                        .set("card", trigger.card);
                    "step 1";
                    if (result.bool) {
                        if (!event.isMine() && !event.isOnline()) {
                            game.delayex();
                        }
                    } else {
                        event.finish();
                    }
                    "step 2";
                    if (result.bool) {
                        var targets = result.targets;
                        player.logSkill("jx_lianhuan_add", targets);
                        trigger.targets.addArray(targets);
                        game.log(targets, "也成为了", trigger.card, "的目标");
                    }
                },
            },
        },
    },
    jx_niepan: {
        audio: 2,
        enable: "chooseToUse",
        limited: true,
        skillAnimation: true,
        animationColor: "fire",
        filter(event, player) {
            if (event.type == "dying") {
                if (player != event.dying) {
                    return false;
                }
                return true;
            } else if (event.getParent().name == "phaseUse") {
                return true;
            }
            return false;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            player.storage.jx_niepan = true;
            await player.discard(player.getCards("hej"));
            await player.link(false);
            await player.turnOver(false);
            await player.draw(3);
            if (player.hp < 3) {
                await player.recover(3 - player.hp);
            }
        },
        ai: {
            order: 0.5,
            skillTagFilter(player, tag, target) {
                if (player != target || player.storage.jx_niepan) {
                    return false;
                }
            },
            save: true,
            result: {
                player(player) {
                    if (player.hp <= 0) {
                        return 10;
                    }
                    if (player.hp <= 1 && player.countCards("he") <= 1) {
                        return 10;
                    }
                    return 0;
                },
            },
            threaten(player, target) {
                if (!target.storage.jx_niepan) {
                    return 0.6;
                }
            },
        },
    },
    jx_shuangxiong: {
        audio: "shuangxiong",
        audioname: ["re_yanwen"],
        group: ["jx_shuangxiong_judge", "jx_shuangxiong_gain"],
        subSkill: {
            judge: {
                audio: "jx_shuangxiong",
                logAudio: () => 1,
                trigger: { player: "phaseDrawBegin1" },
                check(event, player) {
                    if (player.countCards("h") > player.hp) {
                        return true;
                    }
                    if (player.countCards("h") > 3) {
                        return true;
                    }
                    return false;
                },
                filter(event, player) {
                    return !event.numFixed;
                },
                prompt2() {
                    return "放弃摸牌，然后亮出牌堆顶的两张牌并选择获得其中的一张。本回合内可以将与此牌颜色不同的一张手牌当做【决斗】使用";
                },
                async content(event, trigger, player) {
                    // step 0
                    trigger.changeToZero();
                    event.cards = get.cards(2);
                    event.videoId = lib.status.videoId++;
                    game.broadcastAll(
                        function (player, id, cards) {
                            const str = player == game.me && !_status.auto ? "【双雄】选择获得其中一张牌" : "双雄";
                            const dialog = ui.create.dialog(str, cards);
                            dialog.videoId = id;
                        },
                        player,
                        event.videoId,
                        event.cards
                    );
                    event.time = get.utc();
                    game.addVideo("showCards", player, ["双雄", get.cardsInfo(event.cards)]);
                    game.addVideo("delay", null, 2);

                    // step 1
                    const result = await player
                        .chooseButton([1, 1], true)
                        .set("dialog", event.videoId)
                        .set("ai", function (button) {
                            const playerx = _status.event.player;
                            const color = get.color(button.link);
                            let value = get.value(button.link, playerx);
                            if (playerx.countCards("h", { color: color }) > playerx.countCards("h", ["red", "black"].remove(color)[0])) {
                                value += 5;
                            }
                            return value;
                        })
                        .forResult();

                    // step 2
                    if (result.bool && result.links) {
                        const cards2 = [];
                        for (const link of result.links) {
                            cards2.push(link);
                            event.cards.remove(link);
                        }
                        await game.cardsDiscard(event.cards);
                        event.card2 = cards2[0];
                    }

                    const time = 1000 - (get.utc() - event.time);
                    if (time > 0) {
                        await game.delay(0, time);
                    }

                    // step 3
                    game.broadcastAll("closeDialog", event.videoId);
                    const card2 = event.card2;
                    if (card2) {
                        await player.gain(card2, "gain2");
                        player.addTempSkill("jx_shuangxiong_viewas");
                        player.markAuto("jx_shuangxiong_viewas", [get.color(card2, false)]);
                    }
                },
            },
            gain: {
                trigger: {
                    player: "damageEnd",
                },
                audio: "jx_shuangxiong",
                filter(event, player) {
                    const evt = event.getParent();
                    return evt?.name == "juedou" && evt[player == evt.player ? "targetCards" : "playerCards"]?.someInD("od");
                },
                async cost(event, trigger, player) {
                    let evt = trigger.getParent();
                    let cards = evt[player == evt.player ? "targetCards" : "playerCards"].slice(0).filterInD("od");
                    event.result = await player.chooseBool("是否发动【双雄】，获得" + get.translation(cards) + "?").forResult();
                    event.result.cards = cards;
                },
                async content(event, trigger, player) {
                    await player.gain(event.cards, "gain2");
                },
            },
            viewas: {
                charlotte: true,
                onremove: true,
                audio: "jx_shuangxiong",
                logAudio: () => "shuangxiong_re_yanwen2.mp3",
                enable: "chooseToUse",
                viewAs: { name: "juedou" },
                position: "hs",
                viewAsFilter(player) {
                    return player.hasCard(card => lib.skill.jx_shuangxiong_viewas.filterCard(card, player), "hs");
                },
                filterCard(card, player) {
                    const color = get.color(card),
                        colors = player.getStorage("jx_shuangxiong_viewas");
                    for (const i of colors) {
                        if (color != i) {
                            return true;
                        }
                    }
                    return false;
                },
                prompt() {
                    const colors = _status.event.player.getStorage("jx_shuangxiong_viewas");
                    let str = "将一张颜色";
                    for (let i = 0; i < colors.length; i++) {
                        if (i > 0) {
                            str += "或";
                        }
                        str += "不为";
                        str += get.translation(colors[i]);
                    }
                    str += "的手牌当做【决斗】使用";
                    return str;
                },
                check(card) {
                    const player = _status.event.player;
                    const raw = player.getUseValue(card, null, true);
                    const eff = player.getUseValue(get.autoViewAs({ name: "juedou" }, [card]));
                    return eff - raw;
                },
                ai: { order: 7 },
            },
        },
    },
    jx_shuangxiong1: {
        audio: "shuangxiong1",
        audioname2: {
            re_yanwen: "shuangxiong_re_yanwen1",
        },
        trigger: { player: "phaseDrawBegin1" },
        sourceSkill: "jx_shuangxiong",
        check(event, player) {
            if (player.countCards("h") > player.hp) {
                return true;
            }
            if (player.countCards("h") > 3) {
                return true;
            }
            return false;
        },
        filter(event, player) {
            return !event.numFixed;
        },
        prompt2() {
            return "放弃摸牌，然后亮出牌堆顶的两张牌并选择获得其中的一张。本回合内可以将与此牌颜色不同的一张手牌当做【决斗】使用";
        },
        async content(event, trigger, player) {
            const cards = event.cards.slice(0);
            let result;

            // step 0
            trigger.changeToZero();
            event.cards = get.cards(2);
            event.videoId = lib.status.videoId++;
            game.broadcastAll(
                (player, id, cardsInner) => {
                    const str = player == game.me && !_status.auto ? "【双雄】选择获得其中一张牌" : "双雄";
                    const dialog = ui.create.dialog(str, cardsInner);
                    dialog.videoId = id;
                },
                player,
                event.videoId,
                event.cards
            );
            event.time = get.utc();
            game.addVideo("showCards", player, ["双雄", get.cardsInfo(event.cards)]);
            game.addVideo("delay", null, 2);

            // step 1
            result = await player
                .chooseButton([1, 1], true)
                .set("dialog", event.videoId)
                .set("ai", function (button) {
                    const playerx = _status.event.player;
                    const color = get.color(button.link);
                    let value = get.value(button.link, playerx);
                    if (playerx.countCards("h", { color }) > playerx.countCards("h", ["red", "black"].remove(color)[0])) {
                        value += 5;
                    }
                    return value;
                })
                .forResult();

            // step 2
            if (result?.bool && result.links) {
                const cards2 = [];
                for (const link of result.links) {
                    cards2.push(link);
                    cards.remove(link);
                }
                await game.cardsDiscard(cards);
                event.card2 = cards2[0];
            }

            const time = 1000 - (get.utc() - event.time);
            if (time > 0) {
                await game.delay(0, time);
            }

            // step 3
            game.broadcastAll("closeDialog", event.videoId);
            const card2 = event.card2;
            if (card2) {
                await player.gain(card2, "gain2");
                player.addTempSkill("shuangxiong2");
                player.markAuto("shuangxiong2", [get.color(card2, false)]);
            }
        },
    },
    jx_shuangxiong2: {
        trigger: {
            player: "damageEnd",
        },
        direct: true,
        sourceSkill: "jx_shuangxiong",
        filter(event, player) {
            var evt = event.getParent();
            return (evt && evt.name == "juedou" && evt[player == evt.player ? "targetCards" : "playerCards"].length) > 0;
        },
        async content(event, trigger, player) {
            const evt = trigger.getParent();
            let cards = (evt[player == evt.player ? "targetCards" : "playerCards"] || []).slice(0);
            cards = cards.filter(card => get.position(card) == "d");
            if (!cards.length) {
                return;
            }
            event.cards = cards;

            const result = await player
                .chooseBool("是否发动【双雄】，获得" + get.translation(event.cards) + "?")
                .set("ai", () => true)
                .forResult();

            if (result.bool) {
                player.logSkill("jx_shuangxiong");
                await player.gain(cards, "gain2");
            }
        },
    },
    jx_luanji: {
        audio: 2,
        enable: "phaseUse",
        viewAs: { name: "wanjian" },
        filterCard(card, player) {
            if (!player.storage.jx_luanji) {
                return true;
            }
            return !player.storage.jx_luanji.includes(get.suit(card));
        },
        position: "hs",
        selectCard: 2,
        check(card) {
            const player = _status.event.player;
            const targets = game.filterPlayer(function (current) {
                return player.canUse("wanjian", current);
            });
            let num = 0;
            for (let i = 0; i < targets.length; i++) {
                let eff = get.sgn(get.effect(targets[i], { name: "wanjian" }, player, player));
                if (targets[i].hp == 1) {
                    eff *= 1.5;
                }
                num += eff;
            }
            if (!player.needsToDiscard(-1)) {
                if (targets.length >= 7) {
                    if (num < 2) {
                        return 0;
                    }
                } else if (targets.length >= 5) {
                    if (num < 1.5) {
                        return 0;
                    }
                }
            }
            return 6 - get.value(card);
        },
        ai: {
            basic: {
                order: 8.9,
            },
        },
        group: ["jx_luanji_count", "jx_luanji_reset", "jx_luanji_respond", "jx_luanji_damage", "jx_luanji_draw"],
        subSkill: {
            reset: {
                trigger: { player: "phaseAfter" },
                silent: true,
                async content(event, trigger, player) {
                    delete player.storage.jx_luanji;
                    delete player.storage.jx_luanji2;
                },
            },
            count: {
                trigger: { player: "useCard" },
                silent: true,
                filter(event) {
                    return event.skill == "jx_luanji";
                },
                async content(event, trigger, player) {
                    player.storage.jx_luanji2 = trigger.card;
                    if (!player.storage.jx_luanji) {
                        player.storage.jx_luanji = [];
                    }
                    player.storage.jx_luanji.addArray(trigger.cards.map(c => get.suit(c)));
                },
            },
            respond: {
                trigger: { global: "respond" },
                silent: true,
                filter(event) {
                    return event.getParent(2).skill == "jx_luanji";
                },
                async content(event, trigger, player) {
                    await trigger.player.draw();
                },
            },
            damage: {
                trigger: { source: "damage" },
                forced: true,
                silent: true,
                popup: false,
                filter(event, player) {
                    return player.storage.jx_luanji2 && event.card == player.storage.jx_luanji2;
                },
                async content(event, trigger, player) {
                    delete player.storage.jx_luanji2;
                },
            },
            draw: {
                trigger: { player: "useCardAfter" },
                forced: true,
                silent: true,
                popup: false,
                filter(event, player) {
                    return player.storage.jx_luanji2 && event.card == player.storage.jx_luanji2;
                },
                async content(event, trigger, player) {
                    await player.draw(trigger.targets.length);
                    delete player.storage.jx_luanji2;
                },
            },
        },
    },
    jx_tianyi: {
        enable: "phaseUse",
        usable: 1,
        filterTarget: (card, player, target) => player.canCompare(target),
        filter(event, player) {
            return game.hasPlayer(curr => player.canCompare(curr));
        },
        async content(event, trigger, player) {
            const result = await player.chooseToCompare(event.targets[0]).forResult();
            if (result.bool) {
                player.addTempSkill("jx_tianyi_effect");
            } else {
                player.addTempSkill("jx_tianyi_diseffect");
            }
        },
        subSkill: {
            effect: {
                charlotte: true,
                mark: true,
                marktext: "天义",
                intro: {
                    name: "天义",
                    content: "本回合使用【杀】次数上限+1、目标上限+1、无距离限制",
                },
                mod: {
                    cardUsable(card, player, num) {
                        if (get.name(card) == "sha") {
                            return num + 1;
                        }
                    },
                    targetInRange(card, player, bool) {
                        if (get.name(card) == "sha") {
                            return true;
                        }
                    },
                    selectTarget(card, player, range) {
                        if (get.name(card) == "sha") {
                            range[1]++;
                        }
                    },
                },
            },
            diseffect: {
                trigger: { player: "useCard" },
                charlotte: true,
                forced: true,
                mark: true,
                marktext: "天义",
                intro: {
                    name: "天义",
                    content: "本回合使用下一张牌时取消之并令唯一目标摸两张牌",
                },
                async content(event, trigger, player) {
                    trigger.cancel();
                    player.removeSkill(event.name);
                    if (trigger.targets.length == 1) {
                        await trigger.targets[0].draw(2);
                    }
                },
                ai: {
                    effect: {
                        player_use(card, player, target) {
                            return [0, 0, 0, 2];
                        },
                    },
                },
            },
        },
        ai: {
            order: 10,
            result: {
                player(player, target) {
                    if (player.countCards("h") > 1) {
                        return -get.attitude(player, target);
                    }
                    return 0;
                },
            },
        },
    },
    dangmo: {
        trigger: { player: "useCardAfter" },
        filter(event, player) {
            const evts = player.getHistory("useCard");
            if (evts.length < 2) {
                return false;
            }
            const targets = get.info("dangmo").logTarget(event, player);
            return targets?.length;
        },
        logTarget(event, player) {
            const evts = player.getHistory("useCard");
            if (evts.length < 2) {
                return [];
            }
            const index = evts.indexOf(event),
                nows = event?.targets,
                olds = evts[index - 1]?.targets;
            if (!olds?.length || !nows?.length || (olds.containsAll(...nows) && nows.containsAll(...olds))) {
                return [];
            }
            return olds.filter(current => current?.isIn() && nows.includes(current));
        },
        check(event, player) {
            const targets = get.info("dangmo").logTarget(event, player);
            return (
                targets.reduce((total, target) => {
                    return total + get.damageEffect(target, player, player);
                }, 0) > 0
            );
        },
        async content(event, trigger, player) {
            await game.doAsyncInOrder(event.targets, async target => await target.damage());
        },
        mod: {
            aiOrder(player, card, num) {
                const num1 = get.info(card).selectTarget ?? 0,
                    num2 = game.countPlayer();
                if (typeof num1 == "number") {
                    return Math.abs(num1 - num2);
                } else if (typeof num1 == "function") {
                    return Math.abs(num1(card, player) - nmu2);
                } else {
                    return Math.abs(num1[1] - num2);
                }
            },
        },
        ai: {
            effct: {
                target(card, player, target) {
                    if (
                        !player.getHistory("useCard", evt => evt.targets.length > 0).length &&
                        player.hasSkill("jx_tianyi_effct") &&
                        ui.selected.targets.length > 0
                    ) {
                        return 0;
                    }
                    return [1, 0];
                },
            },
        },
    },
    jx_duanliang: {
        audio: 2,
        audioname: ["re_xuhuang"],
        group: ["jx_duanliang1", "jx_duanliang3"],
        ai: {
            threaten: 1.2,
        },
    },
    jx_duanliang1: {
        audio: 2,
        audioname: ["re_xuhuang"],
        enable: "chooseToUse",
        sourceSkill: "jx_duanliang",
        filterCard(card) {
            if (get.type(card) != "basic" && get.type(card) != "equip") {
                return false;
            }
            return get.color(card) == "black";
        },
        filter(event, player) {
            return player.countCards("hes", { type: ["basic", "equip"], color: "black" });
        },
        position: "hes",
        viewAs: { name: "bingliang" },
        prompt: "将一黑色的基本牌或装备牌当兵粮寸断使用",
        check(card) {
            return 6 - get.value(card);
        },
        ai: {
            order: 9,
        },
    },
    jx_duanliang3: {
        mod: {
            targetInRange(card, player, target) {
                if (card.name == "bingliang") {
                    if (target.countCards("h") >= player.countCards("h")) {
                        return true;
                    }
                }
            },
        },
    },
    jiezi: {
        trigger: { global: ["phaseDrawSkipped", "phaseDrawCancelled"] },
        audio: 2,
        forced: true,
        filter(event, player) {
            return event.player != player;
        },
        async content(event, trigger, player) {
            await player.draw();
        },
    },
    jx_zaiqi: {
        audio: 2,
        direct: true,
        filter(event, player) {
            return lib.skill.jx_zaiqi.count() > 0;
        },
        trigger: {
            player: "phaseJieshuBegin",
        },
        async content(event, trigger, player) {
            let result;

            // step 0
            result = await player
                .chooseTarget([1, lib.skill.jx_zaiqi.count()], get.prompt2("jx_zaiqi"))
                .set("ai", function (target) {
                    return get.attitude(_status.event.player, target);
                })
                .forResult();

            // step 1
            if (result.bool) {
                var targets = result.targets;
                targets.sortBySeat();
                player.line(targets, "fire");
                player.logSkill("jx_zaiqi", targets);
                event.targets = targets;
            } else {
                return;
            }

            // step 2 & 3 (loop through targets)
            while (event.targets.length) {
                event.current = event.targets.shift();
                if (player.isHealthy()) {
                    result = { index: 0 };
                } else {
                    result = await event.current
                        .chooseControl()
                        .set("choiceList", ["摸一张牌", "令" + get.translation(player) + "回复1点体力"])
                        .set("ai", function () {
                            if (get.attitude(event.current, player) > 0) {
                                return 1;
                            }
                            return 0;
                        })
                        .forResult();
                }

                if (result.index == 1) {
                    event.current.line(player);
                    await player.recover(event.current);
                } else {
                    await event.current.draw();
                }
                await game.delay();
            }
        },
        count: () => get.discarded().filter(card => get.color(card) === "red").length,
    },
    jx_lieren: {
        audio: 2,
        trigger: { player: "useCardToPlayered" },
        filter(event, player) {
            return event.card.name == "sha" && player.canCompare(event.target);
        },
        check(event, player) {
            return get.attitude(player, event.target) < 0;
        },
        //priority:5,
        content() {
            "step 0";
            player.chooseToCompare(trigger.target).clear = false;
            "step 1";
            if (result.bool) {
                if (trigger.target.countGainableCards(player, "he")) {
                    player.gainPlayerCard(trigger.target, true, "he");
                }
                ui.clear();
            } else {
                var card1 = result.player;
                var card2 = result.target;
                if (get.position(card1) == "d") {
                    trigger.target.gain(card1, "gain2");
                }
                if (get.position(card2) == "d") {
                    player.gain(card2, "gain2");
                }
            }
        },
    },
    jx_xingshang: {
        audio: 2,
        audioname: ["caoying"],
        trigger: { global: "die" },
        filter(event, player) {
            return player.isDamaged() || event.player.countCards("he") > 0;
        },
        direct: true,
        async content(event, trigger, player) {
            let result;

            // step 0
            const choice = [];
            if (player.isDamaged()) {
                choice.push("回复体力");
            }
            if (trigger.player.countCards("he")) {
                choice.push("获得牌");
            }
            choice.push("cancel2");

            result = await player
                .chooseControl(choice)
                .set("prompt", get.prompt2("jx_xingshang"))
                .set("ai", function () {
                    if (choice.length == 2) {
                        return 0;
                    }
                    if (get.value(trigger.player.getCards("he")) > 8) {
                        return 1;
                    }
                    return 0;
                })
                .forResult();

            // step 1
            if (result.control != "cancel2") {
                player.logSkill(event.name, trigger.player);
                if (result.control == "获得牌") {
                    const togain = trigger.player.getCards("he");
                    await player.gain(togain, trigger.player, "giveAuto", "bySelf");
                } else {
                    await player.recover();
                }
            }
        },
    },
    jx_fangzhu: {
        audio: 2,
        trigger: {
            player: "damageEnd",
        },
        direct: true,
        async content(event, trigger, player) {
            let result;
            // step 0
            let next = player.chooseTarget(get.prompt2("jx_fangzhu"), function (card, player, target) {
                return player != target;
            });
            next.ai = function (target) {
                if (target.hasSkillTag("noturn")) {
                    return 0;
                }
                var player = _status.event.player;
                if (get.attitude(_status.event.player, target) == 0) {
                    return 0;
                }
                if (get.attitude(_status.event.player, target) > 0) {
                    if (target.classList.contains("turnedover")) {
                        return 1000 - target.countCards("h");
                    }
                    if (player.getDamagedHp() < 3) {
                        return -1;
                    }
                    return 100 - target.countCards("h");
                } else {
                    if (target.classList.contains("turnedover")) {
                        return -1;
                    }
                    if (player.getDamagedHp() >= 3) {
                        return -1;
                    }
                    return 1 + target.countCards("h");
                }
            };
            result = await next.forResult();

            // step 1
            if (result.bool) {
                player.logSkill("jx_fangzhu", result.targets);
                event.target = result.targets[0];
                if (player.isHealthy()) {
                    result = { bool: false };
                } else {
                    let next2 = event.target.chooseToDiscard("he", player.getDamagedHp());
                    next2.set("ai", function (card) {
                        var player = _status.event.player;
                        if (player.isTurnedOver() || _status.event.getTrigger().player.getDamagedHp() > 2) {
                            return -1;
                        }
                        return player.hp * player.hp - get.value(card);
                    });
                    next2.set(
                        "prompt",
                        "弃置" +
                        get.cnNumber(player.getDamagedHp()) +
                        "张牌并失去1点体力；或选择不弃置，将武将牌翻面并摸" +
                        get.cnNumber(player.getDamagedHp()) +
                        "张牌。"
                    );
                    result = await next2.forResult();
                }
            } else {
                return;
            }

            // step 2
            if (result.bool) {
                await event.target.loseHp();
            } else {
                if (player.isDamaged()) {
                    await event.target.draw(player.getDamagedHp()).forResult();
                }
                await event.target.turnOver().forResult();
            }
        },
        ai: {
            maixie: true,
            maixie_hp: true,
            effect: {
                target(card, player, target) {
                    if (get.tag(card, "damage")) {
                        if (player.hasSkillTag("jueqing", false, target)) {
                            return [1, -1.5];
                        }
                        if (target.hp <= 1) {
                            return;
                        }
                        if (!target.hasFriend()) {
                            return;
                        }
                        var hastarget = false;
                        var turnfriend = false;
                        var players = game.filterPlayer();
                        for (var i = 0; i < players.length; i++) {
                            if (get.attitude(target, players[i]) < 0 && !players[i].isTurnedOver()) {
                                hastarget = true;
                            }
                            if (get.attitude(target, players[i]) > 0 && players[i].isTurnedOver()) {
                                hastarget = true;
                                turnfriend = true;
                            }
                        }
                        if (get.attitude(player, target) > 0 && !hastarget) {
                            return;
                        }
                        if (turnfriend || target.hp == target.maxHp) {
                            return [0.5, 1];
                        }
                        if (target.hp > 1) {
                            return [1, 0.5];
                        }
                    }
                },
            },
        },
    },
    polu: {
        audio: 1,
        trigger: {
            source: "dieAfter",
            player: "die",
        },
        forceDie: true,
        filter(event, player, name) {
            return name == "die" || player.isIn();
        },
        direct: true,
        async content(event, trigger, player) {
            let result;

            // step 0
            if (!player.storage.polu) {
                player.storage.polu = 0;
            }
            event.num = player.storage.polu + 1;
            result = await player
                .chooseTarget([1, Infinity], get.prompt("polu"), "令任意名角色摸" + get.cnNumber(event.num) + "张牌")
                .set("forceDie", true)
                .set("ai", target => {
                    return get.attitude(_status.event.player, target);
                })
                .forResult();

            // step 1
            if (result.bool) {
                player.storage.polu++;
                result.targets.sortBySeat();
                player.logSkill("polu", result.targets);
                await game.asyncDraw(result.targets, event.num);
            } else {
                return;
            }

            // step 2
            await game.delay();
        },
    },
    jx_jiuchi: {
        group: ["jiuchi"],
        audioname: ["re_dongzhuo"],
        trigger: { source: "damage" },
        forced: true,
        popup: false,
        locked: false,
        audio: "jiuchi",
        filter(event, player) {
            return event.card && event.card.name == "sha" && event.getParent(2).jiu == true && !player.isTempBanned("benghuai");
        },
        content() {
            player.logSkill("jx_jiuchi");
            player.tempBanSkill("benghuai");
        },
    },
    jx_haoshi: {
        trigger: { player: "phaseDrawBegin2" },
        filter(event, player) {
            return !event.numFixed;
        },
        check(event, player) {
            let maxList = game.filterPlayer().map(current => {
                let num = current.countCards("h");
                if (current == player) {
                    num += event.num + 2;
                }
                return num;
            }),
                minList = game.filterPlayer(current => current.isMinHandcard());
            let max = Math.max(...maxList);
            if (maxList.filter(i => i == max).length > 1) {
                max = null;
            }
            if (!max) {
                return true;
            }
            if (minList.some(min => get.attitude(player, min) > 0)) {
                return true;
            }
            return false;
        },
        async content(event, trigger, player) {
            trigger.num += 2;
            player
                .when({ player: "phaseDrawEnd" })
                .filter(evt => evt == trigger)
                .step(async function (event, trigger, player) {
                    const max = game.findPlayer(current => current.isMaxHandcard(true)),
                        minList = game.filterPlayer(current => current.isMinHandcard());
                    if (!max) {
                        return;
                    }
                    let targets;
                    if (minList.length == 1) {
                        targets = minList;
                    } else {
                        targets = (
                            await player
                                .chooseTarget(true, `好施：选择一名手牌最少的角色获得${get.translation(max)}的一半手牌（向下取整）`)
                                .set("filterTarget", (_, player, target) => target.isMinHandcard())
                                .set("ai", target => get.attitude(get.player(), target) * (target.getDamagedHp() + 1))
                                .forResult()
                        ).targets;
                    }
                    if (targets?.length) {
                        const min = targets[0];
                        if (max.countGainableCards(min, "h") && Math.floor(max.countCards("h") / 2)) {
                            await max.chooseToGive(true, min, Math.floor(max.countCards("h") / 2));
                        }
                    }
                });
        },
    },
    jx_dimeng: {
        usable: 1,
        enable: "phaseUse",
        filter(event, player) {
            return game.hasPlayer(current => {
                if (current == player) {
                    return false;
                }
                const num = current.countCards("h");
                return game.hasPlayer(current2 => {
                    if (current2 == current || current2 == player) {
                        return false;
                    }
                    return Math.abs(num - current2.countCards("h")) < 3;
                });
            });
        },
        selectTarget: 2,
        complexTarget: true,
        filterTarget(_, player, target) {
            if (target == player) {
                return false;
            }
            if (!ui.selected.targets.length) {
                return true;
            }
            return Math.abs(ui.selected.targets[0].countCards("h") - target.countCards("h")) < 3;
        },
        multitarget: true,
        multiline: true,
        async content(event, trigger, player) {
            const targets = event.targets.slice().sortBySeat(_status.currentPhase);
            while (targets.length) {
                let num = 3;
                const target = targets.shift();
                while (num > 0) {
                    num--;
                    if (!target.isIn()) {
                        break;
                    }
                    const result = await target
                        .chooseToUse()
                        .set("filterCard", (card, player, event) => {
                            if (get.position(card) != "h") {
                                return false;
                            }
                            return lib.filter.filterCard.apply(this, [card, player, event]);
                        })
                        .forResult();
                    if (!result?.bool) {
                        break;
                    }
                }
            }
            if (event.targets.every(target => target.isIn())) {
                await event.targets[0].swapHandcards(event.targets[1]);
            }
        },
        ai: {
            order: 10,
            threaten: 3,
            expose: 0.9,
            result: {
                target(player, target) {
                    //只考虑队内流通牌
                    if (get.attitude(player, target) < 0) {
                        return 0;
                    }
                    return (target.countCards("h") + 1) * get.sgnAttitude(player, target);
                },
            },
        },
    },
    jx_wansha: {
        trigger: { player: "phaseBegin" },
        forced: true,
        async content(event, trigger, player) {
            const targets = game.filterPlayer(curr => curr != player);
            targets.forEach(target => target.addTempSkill("jx_wansha_effect"));
        },
        group: "jx_wansha_draw",
        subSkill: {
            draw: {
                audio: "jx_wansha",
                trigger: { global: "useCard" },
                filter(event, player) {
                    return event.modSkill?.cardname == "jx_wansha_effect";
                },
                logTarget: "player",
                forced: true,
                async content(event, trigger, player) {
                    await player.draw(2);
                },
            },
            effect: {
                mark: true,
                marktext: "完杀",
                intro: {
                    name: "完杀",
                    content: "本回合红色牌均视为杀",
                },
                charlotte: true,
                mod: {
                    cardname(card, player, name) {
                        if (get.color(card) == "red" && lib.card[card.name].type == "basic") {
                            return "sha";
                        }
                    },
                },
            },
        },
    },
    jx_weimu: {
        audio: 2,
        audioname: ["wangyuanji"],
        trigger: {
            target: "useCardToTarget",
            player: "addJudgeBefore",
        },
        forced: true,
        priority: 15,
        preHidden: true,
        check(event, player) {
            return event.name == "addJudge" || (event.card.name != "chiling" && get.effect(event.target, event.card, event.player, player) < 0);
        },
        filter(event, player) {
            if (event.name == "addJudge") {
                return get.color(event.card) == "black";
            }
            return get.type(event.card, null, false) == "trick" && get.color(event.card) == "black";
        },
        async content(event, trigger, player) {
            if (trigger.name == "addJudge") {
                trigger.cancel(undefined, undefined, undefined);
                const owner = get.owner(trigger.card);
                if (owner?.getCards("hej").includes(trigger.card)) {
                    await owner.lose(trigger.card, ui.discardPile);
                } else {
                    await game.cardsDiscard(trigger.card);
                }
                game.log(trigger.card, "进入了弃牌堆");
            } else {
                // @ts-expect-error 类型系统未来可期
                trigger.getParent()?.targets.remove(player);
            }
        },
        group: ["jx_weimu_effect"],
        subSkill: {
            effect: {
                audio: "jx_weimu",
                enable: "chooseToUse",
                viewAs: {
                    name: "jiedao",
                },
                filterCard(card) {
                    return get.color(card) == "black" && get.type(card) != "trick" && get.type(card) != "delay";
                },
                position: "hes",
                check(card) {
                    return 4.5 - get.value(card);
                },
            },
        },
        ai: {
            effect: {
                target(card, player, target, current) {
                    if (get.type(card, "trick") == "trick" && get.color(card) == "black") {
                        return "zeroplayertarget";
                    }
                },
            },
        },
    },
    jx_tuntian: {
        audio: 2,
        trigger: {
            player: "loseAfter",
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        frequent: true,
        filter(event, player) {
            if (player == _status.currentPhase) {
                return false;
            }
            if (event.name == "gain" && event.player == player) {
                return false;
            }
            var evt = event.getl(player);
            return evt && evt.cards2 && evt.cards2.length > 0;
        },
        async content(event, trigger, player) {
            const judgeEvent = player.judge(function (card) {
                return 1;
            });
            judgeEvent.callback = lib.skill.jx_tuntian.callback;
            await judgeEvent;
        },
        async callback(event, trigger, player) {
            let result;
            const { card } = event;
            // step 0
            if (event.judgeResult.suit == "heart") {
                player.gain(card, "gain2");
                return;
            } else if (get.mode() == "guozhan") {
                result = await player
                    .chooseBool("是否将" + get.translation(card) + "作为“田”置于武将牌上？")
                    .set("frequentSkill", "jx_tuntian")
                    .set("ai", function () {
                        return true;
                    })
                    .forResult();
            } else {
                result = { bool: true };
            }

            // step 1
            if (!result.bool) {
                //game.cardsDiscard(card);
                return;
            }
            const next = player.addToExpansion(card, "gain2");
            next.gaintag.add("tuntian");
            await next;
        },
        group: "tuntian_dist",
        locked: false,
        ai: {
            effect: {
                target() {
                    return lib.skill.tuntian.ai.effect.target.apply(this, arguments);
                },
            },
            threaten(player, target) {
                if (target.countCards("h") == 0) {
                    return 2;
                }
                return 0.5;
            },
            nodiscard: true,
            nolose: true,
            notemp: true,
        },
    },
    jx_tiaoxin: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        filterTarget(card, player, target) {
            return target != player && target.countCards("he");
        },
        content() {
            "step 0";
            target
                .chooseToUse(
                    function (card, player, event) {
                        if (get.name(card) != "sha") {
                            return false;
                        }
                        return lib.filter.filterCard.apply(this, arguments);
                    },
                    "挑衅：对" + get.translation(player) + "使用一张杀，或令其弃置你的一张牌"
                )
                .set("targetRequired", true)
                .set("complexSelect", true)
                .set("complexTarget", true)
                .set("filterTarget", function (card, player, target) {
                    if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
                        return false;
                    }
                    return lib.filter.filterTarget.apply(this, arguments);
                })
                .set("sourcex", player);
            "step 1";
            if (result.bool == false && target.countCards("he") > 0) {
                player.discardPlayerCard(target, "he", true);
            } else {
                event.finish();
            }
        },
        ai: {
            order: 4,
            expose: 0.2,
            result: {
                target: -1,
                player(player, target) {
                    if (!target.canUse("sha", player)) {
                        return 0;
                    }
                    if (target.countCards("h") == 0) {
                        return 0;
                    }
                    if (target.countCards("h") == 1) {
                        return -0.1;
                    }
                    if (player.hp <= 2) {
                        return -2;
                    }
                    if (player.countCards("h", "shan") == 0) {
                        return -1;
                    }
                    return -0.5;
                },
            },
            threaten: 1.1,
        },
    },
    jx_zhiji: {
        skillAnimation: true,
        animationColor: "fire",
        audio: 2,
        juexingji: true,
        derivation: "jx_guanxing",
        trigger: { player: "phaseZhunbeiBegin" },
        forced: true,
        filter(event, player) {
            if (player.storage.jx_zhiji) {
                return false;
            }
            return player.countCards("h") == 0;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            await player.chooseDrawRecover(2, true);
            await player.loseMaxHp();
            await player.addSkills("jx_guanxing");
        },
    },
    jx_beige: {
        audio: "beige",
        audioname: ["re_caiwenji"],
        trigger: { global: "damageEnd" },
        filter(event, player) {
            return (
                event.card && event.card.name == "sha" && event.source && event.player.classList.contains("dead") == false && player.countCards("he")
            );
        },
        direct: true,
        checkx(event, player) {
            var att1 = get.attitude(player, event.player);
            var att2 = get.attitude(player, event.source);
            return att1 > 0 && att2 <= 0;
        },
        async content(event, trigger, player) {
            let result;

            // step 0
            const next = player.chooseToDiscard("he", get.prompt2("jx_beige", trigger.player));
            const check = lib.skill.beige.checkx(trigger, player);
            next.set("ai", function (card) {
                if (_status.event.goon) {
                    return 8 - get.value(card);
                }
                return 0;
            });
            next.set("logSkill", "jx_beige");
            next.set("goon", check);
            result = await next.forResult();

            // step 1
            if (result.bool) {
                result = await trigger.player.judge().forResult();
            } else {
                return;
            }

            // step 2
            switch (result.suit) {
                case "heart":
                    trigger.player.recover(trigger.num);
                    break;
                case "diamond":
                    trigger.player.draw(3);
                    break;
                case "club":
                    await trigger.source.chooseToDiscard("he", 2, true);
                    break;
                case "spade":
                    trigger.source.turnOver();
                    break;
            }
        },
        ai: {
            expose: 0.3,
        },
    },
    jx_huashen: {
        unique: true,
        audio: 2,
        trigger: {
            global: "phaseBefore",
            player: ["enterGame", "phaseBegin", "phaseEnd"],
        },
        filter(event, player, name) {
            if (event.name != "phase") {
                return true;
            }
            if (name == "phaseBefore") {
                return game.phaseNumber == 0;
            }
            return player.storage.jx_huashen?.character?.length > 0;
        },
        async cost(event, trigger, player) {
            if (trigger.name !== "phase" || event.triggername === "phaseBefore") {
                event.result = { bool: true, cost_data: ["替换当前化身"] };
                return;
            }
            const prompt = "###" + get.prompt(event.skill) + '###<div class="text center">替换当前化身牌或制衡至多两张其他化身牌</div>';
            const result = await player
                .chooseControl("替换当前化身", "制衡其他化身", "cancel2")
                .set("ai", () => {
                    const { player, cond } = get.event();
                    let skills = player.storage.jx_huashen.character.map(i => get.character(i).skills).flat();
                    skills.randomSort();
                    skills.sort((a, b) => get.skillRank(b, cond) - get.skillRank(a, cond));
                    if (skills[0] === player.storage.jx_huashen.current2 || get.skillRank(skills[0], cond) < 1) {
                        return "制衡其他化身";
                    }
                    return "替换当前化身";
                })
                .set("cond", event.triggername)
                .set("prompt", prompt)
                .forResult();
            const control = result.control;
            event.result = { bool: typeof control === "string" && control !== "cancel2", cost_data: control };
        },
        async content(event, trigger, player) {
            let choice = event.cost_data;
            if (Array.isArray(choice)) {
                lib.skill.jx_huashen.addHuashens(player, 3);
                [choice] = choice;
            }
            _status.noclearcountdown = true;
            const id = lib.status.videoId++,
                prompt = choice === "替换当前化身" ? "化身：请选择你要更换的武将牌" : "化身：选择制衡至多两张武将牌";
            const cards = player.storage.jx_huashen.character;
            if (player.isOnline2()) {
                player.send(
                    (cards, prompt, id) => {
                        const dialog = ui.create.dialog(prompt, [cards, lib.skill.jx_huashen.$createButton]);
                        dialog.videoId = id;
                    },
                    cards,
                    prompt,
                    id
                );
            }
            const dialog = ui.create.dialog(prompt, [cards, lib.skill.jx_huashen.$createButton]);
            dialog.videoId = id;
            if (!event.isMine()) {
                dialog.style.display = "none";
            }
            if (choice === "替换当前化身") {
                const buttons = dialog.content.querySelector(".buttons");
                const array = dialog.buttons.filter(item => !item.classList.contains("nodisplay") && item.style.display !== "none");
                const choosed = player.storage.jx_huashen.choosed;
                const groups = array
                    .map(i => get.character(i.link).group)
                    .unique()
                    .sort((a, b) => {
                        const getNum = g => (lib.group.includes(g) ? lib.group.indexOf(g) : lib.group.length);
                        return getNum(a) - getNum(b);
                    });
                if (choosed.length > 0 || groups.length > 1) {
                    dialog.style.bottom = (parseInt(dialog.style.top || "0", 10) + get.is.phoneLayout() ? 230 : 220) + "px";
                    dialog.addPagination({
                        data: array,
                        totalPageCount: groups.length + Math.sign(choosed.length),
                        container: dialog.content,
                        insertAfter: buttons,
                        onPageChange(state) {
                            const { pageNumber, data, pageElement } = state;
                            const { groups, choosed } = pageElement;
                            data.forEach(item => {
                                item.classList[
                                    (() => {
                                        const name = item.link,
                                            goon = choosed.length > 0;
                                        if (goon && pageNumber === 1) {
                                            return choosed.includes(name);
                                        }
                                        const group = get.character(name).group;
                                        return groups.indexOf(group) + (1 + goon) === pageNumber;
                                    })()
                                        ? "remove"
                                        : "add"
                                ]("nodisplay");
                            });
                            ui.update();
                        },
                        pageLimitForCN: ["←", "→"],
                        pageNumberForCN: (choosed.length > 0 ? ["常用"] : []).concat(
                            groups.map(i => {
                                const isChineseChar = char => {
                                    const regex =
                                        /[\u4e00-\u9fff\u3400-\u4dbf\ud840-\ud86f\udc00-\udfff\ud870-\ud87f\udc00-\udfff\ud880-\ud88f\udc00-\udfff\ud890-\ud8af\udc00-\udfff\ud8b0-\ud8bf\udc00-\udfff\ud8c0-\ud8df\udc00-\udfff\ud8e0-\ud8ff\udc00-\udfff\ud900-\ud91f\udc00-\udfff\ud920-\ud93f\udc00-\udfff\ud940-\ud97f\udc00-\udfff\ud980-\ud9bf\udc00-\udfff\ud9c0-\ud9ff\udc00-\udfff]/u;
                                    return regex.test(char);
                                }; //友情提醒：regex为基本汉字区间到扩展G区的Unicode范围的正则表达式，非加密/混淆
                                const str = get.plainText(lib.translate[i + "2"] || lib.translate[i] || "无");
                                return isChineseChar(str.slice(0, 1)) ? str.slice(0, 1) : str;
                            })
                        ),
                        changePageEvent: "click",
                        pageElement: {
                            groups: groups,
                            choosed: choosed,
                        },
                    });
                }
            }
            const finish = () => {
                if (player.isOnline2()) {
                    player.send("closeDialog", id);
                }
                dialog.close();
                delete _status.noclearcountdown;
                if (!_status.noclearcountdown) {
                    game.stopCountChoose();
                }
            };
            while (true) {
                const next = player.chooseButton(true).set("dialog", id);
                if (choice === "制衡其他化身") {
                    next.set("selectButton", [1, 2]);
                    next.set("filterButton", button => button.link !== get.event().current);
                    next.set("current", player.storage.jx_huashen.current);
                } else {
                    next.set("ai", button => {
                        const { player, cond } = get.event();
                        let skills = player.storage.jx_huashen.character.map(i => get.character(i).skills).flat();
                        skills.randomSort();
                        skills.sort((a, b) => get.skillRank(b, cond) - get.skillRank(a, cond));
                        return player.storage.jx_huashen.map[button.link].includes(skills[0]) ? 2.5 : 1 + Math.random();
                    });
                    next.set("cond", event.triggername);
                }
                const result = await next.forResult();
                if (choice === "制衡其他化身") {
                    finish();
                    lib.skill.jx_huashen.removeHuashen(player, result.links);
                    lib.skill.jx_huashen.addHuashens(player, result.links.length);
                    return;
                } else {
                    const card = result.links[0];
                    const func = function (card, id) {
                        const dialog = get.idDialog(id);
                        if (dialog) {
                            //禁止翻页
                            const paginationInstance = dialog.paginationMap?.get(dialog.content.querySelector(".buttons"));
                            if (paginationInstance?.state) {
                                paginationInstance.state.pageRefuseChanged = true;
                            }
                            for (let i = 0; i < dialog.buttons.length; i++) {
                                if (dialog.buttons[i].link == card) {
                                    dialog.buttons[i].classList.add("selectedx");
                                } else {
                                    dialog.buttons[i].classList.add("unselectable");
                                }
                            }
                        }
                    };
                    if (player.isOnline2()) {
                        player.send(func, card, id);
                    } else if (event.isMine()) {
                        func(card, id);
                    }
                    const result2 = await player
                        .chooseControl(player.storage.jx_huashen.map[card], "返回")
                        .set("ai", () => {
                            const { player, cond, controls } = get.event();
                            let skills = controls.slice();
                            skills.randomSort();
                            skills.sort((a, b) => get.skillRank(b, cond) - get.skillRank(a, cond));
                            return skills[0];
                        })
                        .set("cond", event.triggername)
                        .forResult();
                    const control = result2.control;
                    if (control === "返回") {
                        const func2 = function (card, id) {
                            const dialog = get.idDialog(id);
                            if (dialog) {
                                //允许翻页
                                const paginationInstance = dialog.paginationMap?.get(dialog.content.querySelector(".buttons"));
                                if (paginationInstance?.state) {
                                    paginationInstance.state.pageRefuseChanged = false;
                                }
                                for (let i = 0; i < dialog.buttons.length; i++) {
                                    dialog.buttons[i].classList.remove("selectedx");
                                    dialog.buttons[i].classList.remove("unselectable");
                                }
                            }
                        };
                        if (player.isOnline2()) {
                            player.send(func2, card, id);
                        } else if (event.isMine()) {
                            func2(card, id);
                        }
                    } else {
                        finish();
                        player.storage.jx_huashen.choosed.add(card);
                        if (player.storage.jx_huashen.current != card) {
                            const old = player.storage.jx_huashen.current;
                            player.storage.jx_huashen.current = card;
                            game.broadcastAll(
                                (player, character, old) => {
                                    player.tempname.remove(old);
                                    player.tempname.add(character);
                                    player.sex = lib.character[character][0];
                                },
                                player,
                                card,
                                old
                            );
                            game.log(player, "将性别变为了", "#y" + get.translation(get.character(card).sex) + "性");
                            player.changeGroup(get.character(card).group);
                        }
                        player.storage.jx_huashen.current2 = control;
                        if (!player.additionalSkills.jx_huashen?.includes(control)) {
                            player.flashAvatar("jx_huashen", card);
                            player.syncStorage("jx_huashen");
                            player.updateMarks("jx_huashen");
                            await player.addAdditionalSkills("jx_huashen", control);
                            // lib.skill.jx_huashen.createAudio(card,link,'re_zuoci');
                        }
                        return;
                    }
                }
            }
        },
        init(player, skill) {
            if (!player.storage[skill]) {
                player.storage[skill] = {
                    character: [],
                    choosed: [],
                    map: {},
                };
            }
        },
        banned: ["lisu", "sp_xiahoudun", "xushao", "jsrg_xushao", "zhoutai", "old_zhoutai", "shixie", "xin_zhoutai", "dc_shixie", "old_shixie"],
        bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技"],
        addHuashen(player) {
            if (!player.storage.jx_huashen) {
                return;
            }
            if (!_status.characterlist) {
                game.initCharacterList();
            }
            _status.characterlist.randomSort();
            for (let i = 0; i < _status.characterlist.length; i++) {
                let name = _status.characterlist[i];
                if (
                    name.indexOf("zuoci") != -1 ||
                    name.indexOf("key_") == 0 ||
                    name.indexOf("sp_key_") == 0 ||
                    get.is.double(name) ||
                    lib.skill.jx_huashen.banned.includes(name) ||
                    player.storage.jx_huashen.character.includes(name)
                ) {
                    continue;
                }
                let skills = lib.character[name][3].filter(skill => {
                    const categories = get.skillCategoriesOf(skill, player);
                    return !categories.some(type => lib.skill.jx_huashen.bannedType.includes(type));
                });
                if (skills.length) {
                    player.storage.jx_huashen.character.push(name);
                    player.storage.jx_huashen.map[name] = skills;
                    _status.characterlist.remove(name);
                    return name;
                }
            }
        },
        addHuashens(player, num) {
            var list = [];
            for (var i = 0; i < num; i++) {
                var name = lib.skill.jx_huashen.addHuashen(player);
                if (name) {
                    list.push(name);
                }
            }
            if (list.length) {
                player.syncStorage("jx_huashen");
                player.updateMarks("jx_huashen");
                game.log(player, "获得了", get.cnNumber(list.length) + "张", "#g化身");
                lib.skill.jx_huashen.drawCharacter(player, list);
            }
        },
        removeHuashen(player, links) {
            player.storage.jx_huashen.character.removeArray(links);
            _status.characterlist.addArray(links);
            game.log(player, "移去了", get.cnNumber(links.length) + "张", "#g化身");
        },
        drawCharacter(player, list) {
            game.broadcastAll(
                function (player, list) {
                    if (player.isUnderControl(true)) {
                        var cards = [];
                        for (var i = 0; i < list.length; i++) {
                            var cardname = "huashen_card_" + list[i];
                            lib.card[cardname] = {
                                fullimage: true,
                                image: "character:" + list[i],
                            };
                            lib.translate[cardname] = get.rawName2(list[i]);
                            cards.push(game.createCard(cardname, "", ""));
                        }
                        player.$draw(cards, "nobroadcast");
                    }
                },
                player,
                list
            );
        },
        $createButton(item, type, position, noclick, node) {
            node = ui.create.buttonPresets.character(item, "character", position, noclick);
            const info = lib.character[item];
            const skills = info[3].filter(function (skill) {
                const categories = get.skillCategoriesOf(skill, get.player());
                return !categories.some(type => lib.skill.jx_huashen.bannedType.includes(type));
            });
            if (skills.length) {
                const skillstr = skills.map(i => `[${get.translation(i)}]`).join("<br>");
                const skillnode = ui.create.caption(
                    `<div class="text" data-nature=${get.groupnature(info[1], "raw")}m style="font-family: ${lib.config.name_font || "xinwei"},xinwei">${skillstr}</div>`,
                    node
                );
                skillnode.style.left = "2px";
                skillnode.style.bottom = "2px";
            }
            node._customintro = function (uiintro, evt) {
                const character = node.link,
                    characterInfo = get.character(node.link);
                let capt = get.translation(character);
                if (characterInfo) {
                    capt += `&nbsp;&nbsp;${get.translation(characterInfo.sex)}`;
                    let charactergroup;
                    const charactergroups = get.is.double(character, true);
                    if (charactergroups) {
                        charactergroup = charactergroups.map(i => get.translation(i)).join("/");
                    } else {
                        charactergroup = get.translation(characterInfo.group);
                    }
                    capt += `&nbsp;&nbsp;${charactergroup}`;
                }
                uiintro.add(capt);

                if (lib.characterTitle[node.link]) {
                    uiintro.addText(get.colorspan(lib.characterTitle[node.link]));
                }
                for (let i = 0; i < skills.length; i++) {
                    if (lib.translate[skills[i] + "_info"]) {
                        let translation = lib.translate[skills[i] + "_ab"] || get.translation(skills[i]).slice(0, 2);
                        if (lib.skill[skills[i]] && lib.skill[skills[i]].nobracket) {
                            uiintro.add(
                                '<div><div class="skilln">' +
                                get.translation(skills[i]) +
                                "</div><div>" +
                                get.skillInfoTranslation(skills[i], null, false) +
                                "</div></div>"
                            );
                        } else {
                            uiintro.add(
                                '<div><div class="skill">【' +
                                translation +
                                "】</div><div>" +
                                get.skillInfoTranslation(skills[i], null, false) +
                                "</div></div>"
                            );
                        }
                        if (lib.translate[skills[i] + "_append"]) {
                            uiintro._place_text = uiintro.add('<div class="text">' + lib.translate[skills[i] + "_append"] + "</div>");
                        }
                    }
                }
            };
            return node;
        },
        // createAudio:(character,skillx,name)=>{
        // 	var skills=game.expandSkills([skillx]);
        // 	skills=skills.filter(skill=>get.info(skill));
        // 	if(!skills.length) return;
        // 	var skillss=skills.filter(skill=>get.info(skill).derivation);
        // 	if(skillss.length){
        // 		skillss.forEach(skill=>{
        // 			var derivationSkill=get.info(skill).derivation;
        // 			skills[Array.isArray(derivationSkill)?'addArray':'add'](derivationSkill);
        // 		});
        // 	}
        // 	skills.forEach(skill=>{
        // 		var info=lib.skill[skill];
        // 		if(info){
        // 			if(!info.audioname2) info.audioname2={};
        // 			if(info.audioname&&info.audioname.includes(character)){
        // 				if(info.audio){
        // 					if(typeof info.audio=='string') skill=info.audio;
        // 					if(Array.isArray(info.audio)) skill=info.audio[0];
        // 				}
        // 				if(!lib.skill[skill+'_'+character]) lib.skill[skill+'_'+character]={audio:2};
        // 				info.audioname2[name]=(skill+'_'+character);
        // 			}
        // 			else if(info.audioname2[character]){
        // 				info.audioname2[name]=info.audioname2[character];
        // 			}
        // 			else{
        // 				if(info.audio){
        // 					if(typeof info.audio=='string') skill=info.audio;
        // 					if(Array.isArray(info.audio)) skill=info.audio[0];
        // 				}
        // 				info.audioname2[name]=skill;
        // 			}
        // 		}
        // 	});
        // },
        mark: true,
        intro: {
            onunmark(storage, player) {
                _status.characterlist.addArray(storage.character);
                storage.character = [];
                const name = player.name ? player.name : player.name1;
                if (name) {
                    const sex = get.character(name).sex;
                    const group = get.character(name).group;
                    if (player.sex !== sex) {
                        game.broadcastAll(
                            (player, sex) => {
                                player.sex = sex;
                            },
                            player,
                            sex
                        );
                        game.log(player, "将性别变为了", "#y" + get.translation(sex) + "性");
                    }
                    if (player.group !== group) {
                        game.broadcastAll(
                            (player, group) => {
                                player.group = group;
                                player.node.name.dataset.nature = get.groupnature(group);
                            },
                            player,
                            group
                        );
                        game.log(player, "将势力变为了", "#y" + get.translation(group + 2));
                    }
                }
            },
            mark(dialog, storage, player) {
                if (storage && storage.current) {
                    dialog.addSmall([
                        [storage.current],
                        (item, type, position, noclick, node) => lib.skill.jx_huashen.$createButton(item, type, position, noclick, node),
                    ]);
                }
                if (storage && storage.current2) {
                    dialog.add(
                        '<div><div class="skill">【' +
                        get.translation(lib.translate[storage.current2 + "_ab"] || get.translation(storage.current2).slice(0, 2)) +
                        "】</div><div>" +
                        get.skillInfoTranslation(storage.current2, player, false) +
                        "</div></div>"
                    );
                }
                if (storage && storage.character.length) {
                    if (player.isUnderControl(true)) {
                        dialog.addSmall([
                            storage.character,
                            (item, type, position, noclick, node) => lib.skill.jx_huashen.$createButton(item, type, position, noclick, node),
                        ]);
                    } else {
                        dialog.addText("共有" + get.cnNumber(storage.character.length) + "张“化身”");
                    }
                } else {
                    return "没有化身";
                }
            },
            content(storage, player) {
                return "共有" + get.cnNumber(storage.character.length) + "张“化身”";
            },
            markcount(storage, player) {
                if (storage && storage.character) {
                    return storage.character.length;
                }
                return 0;
            },
        },
    },
    jx_xinsheng: {
        inherit: "xinsheng",
        async content(event, trigger, player) {
            lib.skill.jx_huashen.addHuashens(player, 1);
        },
        ai: { combo: "jx_huashen" },
    },
    jx_hunzi: {
        inherit: "hunzi",
        filter(event, player) {
            return player.hp <= 2 && !player.storage.jx_hunzi;
        },
        ai: {
            threaten(player, target) {
                if (target.hp <= 2) {
                    return 2;
                }
                return 0.5;
            },
            maixie: true,
            effect: {
                target(card, player, target) {
                    if (!target.hasFriend()) {
                        return;
                    }
                    if (
                        target.hp === 3 &&
                        get.tag(card, "damage") == 1 &&
                        !target.isTurnedOver() &&
                        _status.currentPhase != target &&
                        get.distance(_status.currentPhase, target, "absolute") <= 3
                    ) {
                        return [0.5, 1];
                    }
                    if (
                        target.hp === 1 &&
                        get.tag(card, "recover") &&
                        !target.isTurnedOver() &&
                        _status.currentPhase !== target &&
                        get.distance(_status.currentPhase, target, "absolute") <= 3
                    ) {
                        return [1, -3];
                    }
                },
            },
        },
    },
    jx_zhijian: {
        inherit: "zhijian",
        group: ["jx_zhijian_use"],
        subfrequent: ["use"],
        subSkill: {
            use: {
                audio: "jx_zhijian",
                trigger: { player: "useCard" },
                frequent: true,
                filter(event, player) {
                    return get.type(event.card) == "equip";
                },
                prompt: "是否发动【直谏】摸一张牌？",
                async content(event, trigger, player) {
                    await player.draw("nodelay");
                },
            },
        },
    },
    jx_fangquan: {
        audio: 2,
        trigger: { player: "phaseUseBefore" },
        filter(event, player) {
            return player.countCards("h") > 0 && !player.hasSkill("fangquan3");
        },
        direct: true,
        async content(event, trigger, player) {
            let result;

            // step 0
            var fang = player.countMark("fangquan2") == 0 && player.hp >= 2 && player.countCards("h") <= player.maxHp + 1;
            result = await player
                .chooseBool(get.prompt2("jx_fangquan"))
                .set("ai", function () {
                    if (!_status.event.fang) {
                        return false;
                    }
                    return game.hasPlayer(function (target) {
                        if (target.hasJudge("lebu") || target == player) {
                            return false;
                        }
                        if (get.attitude(player, target) > 4) {
                            return get.threaten(target) / Math.sqrt(target.hp + 1) / Math.sqrt(target.countCards("h") + 1) > 0;
                        }
                        return false;
                    });
                })
                .set("fang", fang)
                .forResult();

            // step 1
            if (result.bool) {
                player.logSkill("jx_fangquan");
                trigger.cancel();
                player.addTempSkill("fangquan2", "phaseAfter");
                player.addMark("fangquan2", 1, false);
                player.addTempSkill("jx_fangquan2");
                //player.storage.fangquan=result.targets[0];
            }
        },
    },
    jx_fangquan2: {
        mod: {
            maxHandcardBase(player, num) {
                return player.maxHp;
            },
        },
    },
    jx_qiaobian: {
        trigger: { global: "roundStart" },
        filter(event, player) {
            const lastTarget = get.info("jx_qiaobian").getLastTarget(player);
            return game.hasPlayer(current => current != lastTarget);
        },
        async cost(event, trigger, player) {
            const lastTarget = get.info("jx_qiaobian").getLastTarget(player);
            event.result = await player
                .chooseTarget(get.prompt2(event.skill), (_, player, target) => target != get.event().lastTarget)
                .set("ai", target => get.attitude(get.player(), target) * target.countCards("h"))
                .set("lastTarget", lastTarget)
                .forResult();
        },
        async content(event, trigger, player) {
            await game.asyncDraw([player, ...event.targets].sortBySeat());
            player.setStorage("jx_qiaobian_effect", event.targets[0], true);
            player.addTempSkill("jx_qiaobian_effect", { global: "roundEnd" });
        },
        getLastTarget(player) {
            const historys = player.getRoundHistory("useSkill", evt => evt.skill == "jx_qiaobian", 1);
            if (!historys.length) {
                return null;
            }
            return historys[0]?.targets?.[0];
        },
        subSkill: {
            effect: {
                charlotte: true,
                init(player, skill) {
                    const target = player.getStorage(skill);
                    if (target) {
                        player.markSkillCharacter(skill, target, "巧变", `本轮指定${get.translation(target)}为目标`);
                    }
                },
                onremove: true,
                trigger: { global: ["phaseJudgeBefore", "phaseDrawBefore", "phaseUseBefore", "phaseDiscardBefore"] },
                filter(event, player) {
                    if (!player.countDiscardableCards(player, "he")) {
                        return false;
                    }
                    return player.getStorage("jx_qiaobian_effect") == event.player;
                },
                async cost(event, trigger, player) {
                    let check,
                        str = `弃置一张手牌并跳过其${get.translation(trigger.name)}`;
                    if (trigger.name == "phaseDraw") {
                        str += "，然后其可以获得至多两名角色各一张手牌";
                    }
                    if (trigger.name == "phaseUse") {
                        str += "，然后其可以移动场上的一张牌";
                    }
                    switch (trigger.name) {
                        case "phaseJudge":
                            check = trigger.player.countCards("j");
                            break;
                        case "phaseDraw": {
                            let num = 0,
                                num2 = 0;
                            const players = game.filterPlayer(current => current != trigger.player);
                            for (const current of players) {
                                let hs = current.countGainableCards(trigger.player, "h");
                                if (current == player) {
                                    hs--;
                                }
                                if (hs) {
                                    const att = get.attitude(trigger.player, current);
                                    if (att <= 0) {
                                        num++;
                                    }
                                    if (att < 0) {
                                        num2++;
                                    }
                                }
                            }
                            if (trigger.num < 2) {
                                check = true;
                            }
                            check = num >= 2 && num2 > 0;
                            break;
                        }
                        case "phaseUse":
                            if (!trigger.player.canMoveCard(true)) {
                                check = false;
                            } else {
                                check = game.hasPlayer(function (current) {
                                    return get.attitude(trigger.player, current) > 0 && current.countCards("j");
                                });
                                if (!check) {
                                    if (trigger.player.countCards("h") > trigger.player.hp + 1) {
                                        check = false;
                                    } else if (trigger.player.mayHaveSha() && trigger.player.getUseValue("sha") > 0) {
                                        check = false;
                                    } else {
                                        check = true;
                                    }
                                }
                            }
                            break;
                        case "phaseDiscard":
                            check = trigger.player.needsToDiscard();
                            break;
                    }
                    event.result = await player
                        .chooseToDiscard(get.prompt(event.skill, trigger.player), str)
                        .set("ai", card => {
                            if (!_status.event.check) {
                                return -1;
                            }
                            return 7 - get.value(card);
                        })
                        .set("check", check)
                        .set("chooseonly", true)
                        .forResult();
                },
                async content(event, trigger, player) {
                    await player.discard(event.cards);
                    trigger.cancel();
                    game.log(trigger.player, "跳过了", `#y${get.translation(trigger.name)}`);
                    if (trigger.name == "phaseUse") {
                        if (trigger.player.canMoveCard()) {
                            await trigger.player.moveCard();
                        }
                    } else if (trigger.name == "phaseDraw") {
                        const result = await trigger.player
                            .chooseTarget([1, 2], "获得至多两名角色各一张手牌", function (card, player, target) {
                                return target != player && target.countGainableCards(player, "h");
                            })
                            .set("ai", target => get.effect(target, { name: "shunshou_copy2" }, get.player(), get.player()))
                            .forResult();
                        if (!result?.bool || !result.targets?.length) {
                            return;
                        }
                        result.targets.sortBySeat();
                        trigger.player.line(result.targets, "green");
                        await trigger.player.gainMultiple(result.targets);
                        await game.delay();
                    }
                },
                ai: {
                    threaten: 3,
                },
            },
        },
    },
    qizhi: {
        audio: 2,
        trigger: { player: "useCardToPlayered" },
        filter(event, player) {
            if (!event.targets || !event.isFirstTarget) {
                return false;
            }
            if (_status.currentPhase != player) {
                return false;
            }
            var type = get.type(event.card, "trick");
            if (type != "basic" && type != "trick") {
                return false;
            }
            if (event.noai) {
                return false;
            }
            return game.hasPlayer(function (target) {
                return !event.targets.includes(target) && target.countCards("he") > 0;
            });
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseTarget(get.prompt(event.skill), "弃置一名角色的一张牌，然后其摸一张牌", function (card, player, target) {
                    return !_status.event.targets.includes(target) && target.countCards("he") > 0;
                })
                .set("ai", function (target) {
                    var player = _status.event.player;
                    if (target == player) {
                        return 2;
                    }
                    if (get.attitude(player, target) <= 0) {
                        return 1;
                    }
                    return 0.5;
                })
                .set("targets", trigger.targets)
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            player.getHistory("custom").push({ [event.name]: true });
            await player.discardPlayerCard(target, true, "he");
            await target.draw();
        },
    },
    jinqu: {
        audio: 2,
        trigger: { player: "phaseJieshuBegin" },
        check(event, player) {
            return (
                player.getHistory("custom", function (evt) {
                    return evt.qizhi == true;
                }).length >= player.countCards("h")
            );
        },
        prompt(event, player) {
            var num = player.getHistory("custom", function (evt) {
                return evt.qizhi == true;
            }).length;
            return "进趋：是否摸两张牌并将手牌弃置至" + get.cnNumber(num) + "张？";
        },
        content() {
            "step 0";
            player.draw(2);
            "step 1";
            var dh =
                player.countCards("h") -
                player.getHistory("custom", function (evt) {
                    return evt.qizhi == true;
                }).length;
            if (dh > 0) {
                player.chooseToDiscard(dh, true, "allowChooseAll");
            }
        },
        ai: { combo: "qizhi" },
    },
    juzhan: {
        audio: ["juzhan_11.mp3", "juzhan_12.mp3"],
        mark: true,
        zhuanhuanji: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                if (storage) {
                    return "当你使用【杀】指定一名角色为目标后，你可以获得其一张牌，然后你本回合内不能再对其使用牌";
                }
                return "当你成为其他角色【杀】的目标后，你可以与其各摸一张牌，然后其本回合内不能再对你使用牌";
            },
        },
        trigger: {
            player: "useCardToPlayered",
            target: "useCardToTargeted",
        },
        filter(event, player) {
            if (event.card.name != "sha") {
                return false;
            }
            if (!player.storage.juzhan) {
                return player != event.player;
            }
            return player == event.player && event.target.countGainableCards(player, "he");
        },
        logTarget(event, player) {
            return player.storage.juzhan ? event.target : event.player;
        },
        check(event, player) {
            const target = get.info("juzhan").logTarget(event, player);
            return get.attitude(player, target) < 0;
        },
        prompt2(event, player) {
            const target = get.info("juzhan").logTarget(event, player);
            return player.storage.juzhan ? `获得${get.translation(target)}一张牌，然后你本回合内不能再对其使用牌` : `与${get.translation(target)}各摸一张牌，然后其本回合内不能再对你使用牌`;
        },
        async content(event, trigger, player) {
            const { name: skill } = event,
                target = get.info(skill).logTarget(trigger, player);
            player.changeZhuanhuanji(skill);
            const storage = player.storage[skill];
            const list = [player, target];
            if (storage) {
                await game.asyncDraw([player, target].sortBySeat());
                await game.delayx();
                list.reverse();
            } else {
                await player.gainPlayerCard(target, "he", true);
            }
            list[0].addTempSkill(skill + "_effect");
            list[0].markAuto(skill + "_effect", [list[1]]);
        },
        subSkill: {
            effect: {
                charlotte: true,
                onremove: true,
                mod: {
                    playerEnabled(card, player, target) {
                        if (player.getStorage("juzhan_effect").includes(target)) {
                            return false;
                        }
                    },
                },
                intro: { content: "本回合不能对$使用牌" },
            },
        },
    },
    feijun: {
        init: player => {
            if (!Array.isArray(player.storage.feijun)) {
                player.storage.feijun = [];
            }
        },
        intro: {
            content(storage) {
                if (!storage || !storage.length) {
                    return "尚未发动";
                }
                const str = get.translation(storage);
                return "已对" + str + "发动过〖飞军〗";
            },
        },
        mark: true,
        enable: "phaseUse",
        usable: 1,
        position: "he",
        audio: 2,
        filter(event, player) {
            return (
                game.hasPlayer(function (current) {
                    return current.countCards("h") >= player.countCards("h");
                }) ||
                game.hasPlayer(function (current) {
                    return current.countCards("e") >= player.countCards("e");
                }) > 0
            );
        },
        filterCard: true,
        check(card) {
            return 5 - get.value(card);
        },
        async content(event, trigger, player) {
            const list = [];
            if (
                game.hasPlayer(function (current) {
                    return current.countCards("h") > player.countCards("h");
                })
            ) {
                list.push("令一名手牌数大于你的角色交给你一张牌");
            }
            if (
                game.hasPlayer(function (current) {
                    return current.countCards("e") > player.countCards("e");
                }) > 0
            ) {
                list.push("令一名装备区内牌数大于你的角色弃置一张装备牌");
            }
            if (list.length == 0) {
                return;
            }
            let index;
            if (list.length < 2) {
                if (
                    game.hasPlayer(function (current) {
                        return current.countCards("h") > player.countCards("h");
                    })
                ) {
                    index = 0;
                } else {
                    index = 1;
                }
            } else {
                ({ index } = await player
                    .chooseControl()
                    .set("ai", function () {
                        if (
                            game.hasPlayer(function (current) {
                                return current.countCards("h") > player.countCards("h") && get.attitude(player, current) < 0;
                            })
                        ) {
                            return 0;
                        }
                        return 1;
                    })
                    .set("choiceList", list)
                    .forResult());
            }
            let result;
            if (index == 0) {
                result = await player
                    .chooseTarget(function (card, player, target) {
                        return target != player && target.countCards("h") > player.countCards("h");
                    }, "选择一名手牌数大于你的角色")
                    .set("ai", function (target) {
                        return -get.attitude(player, target);
                    })
                    .forResult();
            } else {
                const next = player.chooseTarget(function (card, player, target) {
                    return target.countCards("e") > player.countCards("e") && target != player;
                }, "选择一名装备区里牌数大于你的角色");
                next.ai = function (target) {
                    return -get.attitude(player, target);
                };
                result = await next.forResult();
            }
            if (!result.bool) {
                return;
            }
            const target = result.targets[0];
            const list2 = player.getStorage("feijun");
            if (!list2.includes(target)) {
                event._binglve = true;
                player.markAuto("feijun", [target]);
            }
            player.line(target, "green");
            if (index == 0) {
                const result = await target
                    .chooseCard("he", true, "选择一张牌交给" + get.translation(player))
                    .set("ai", function (card) {
                        return 6 - get.value(card);
                    })
                    .forResult();
                if (result.bool) {
                    target.give(result.cards, player);
                }
            } else {
                await target.chooseToDiscard("he", true, { type: "equip" }, "请弃置一张装备牌");
            }
        },
        ai: {
            order: 11,
            result: {
                player(player) {
                    if (
                        game.hasPlayer(function (current) {
                            return (current.countCards("h") > player.countCards("h") || current.countCards("e") > player.countCards("e")) && get.attitude(player, current) < 0 && player.getStorage("feijun").includes(current);
                        }) ||
                        game.hasPlayer(function (current) {
                            return current.countCards("h") > player.countCards("h") && get.attitude(player, current) < 0;
                        }) ||
                        (player.countCards("h") >= 2 &&
                            game.hasPlayer(function (current) {
                                return current.countCards("e") > player.countCards("e") && get.attitude(player, current) < 0;
                            }))
                    ) {
                        return 1;
                    }
                },
            },
        },
    },
    binglve: {
        audio: 2,
        trigger: { player: "feijunAfter" },
        forced: true,
        filter(event, player) {
            return event._binglve == true;
        },
        async content(event, trigger, player) {
            await player.draw(2);
        },
        ai: { combo: "feijun" },
    },
    huaiju: {
        marktext: "橘",
        intro: {
            name: "怀橘",
            name2: "橘",
            content: "当前有#个“橘”",
        },
        audio: 2,
        trigger: {
            global: "phaseBefore",
            player: "enterGame",
        },
        forced: true,
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            player.addMark("huaiju", 3);
            player.addSkill("huaiju_ai");
        },
        group: ["tachibana_effect"],
    },
    yili: {
        audio: 2,
        trigger: { player: "phaseUseBegin" },
        async cost(event, trigger, player) {
            const next = player.chooseTarget(get.prompt(event.skill), "移去一个【橘】或失去1点体力，然后令一名其他角色获得一个【橘】", function (card, player, target) {
                return target != player;
            });
            next.ai = function (target) {
                const player = _status.event.player;
                if (player.storage.huaiju > 2 || player.hp > 2) {
                    return get.attitude(player, target);
                }
                return -1;
            };
            event.result = await next.forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            let index = 0;
            if (player.hasMark("huaiju")) {
                ({ index } = await player
                    .chooseControl()
                    .set("choiceList", ["失去1点体力", "移去一个“橘”"])
                    .set("ai", function () {
                        if (player.hp > 2) {
                            return 0;
                        }
                        return 1;
                    })
                    .forResult());
            }
            if (index == 1) {
                player.removeMark("huaiju", 1);
            } else {
                await player.loseHp();
            }
            target.addMark("huaiju", 1);
            target.addSkill("huaiju_ai");
        },
        ai: {
            combo: "huaiju",
        },
    },
    zhenglun: {
        audio: 2,
        trigger: {
            player: "phaseDrawBefore",
        },
        filter(event, player) {
            return !player.hasMark("huaiju");
        },
        check(event, player) {
            return player.countCards("h") >= 2 || player.skipList.includes("phaseUse");
        },
        async content(event, trigger, player) {
            trigger.cancel();
            player.addMark("huaiju", 1);
        },
        ai: {
            combo: "huaiju",
        },
    },
    kuizhu: {
        audio: 2,
        trigger: {
            player: "phaseDiscardAfter",
        },
        filter(event, player) {
            const cards = [];
            player.getHistory("lose", function (evt) {
                if (evt.type == "discard" && evt.getParent("phaseDiscard") == event) {
                    cards.addArray(evt.cards2);
                }
            });
            return cards.length > 0;
        },
        async cost(event, trigger, player) {
            const cards = [];
            player.getHistory("lose", function (evt) {
                if (evt.type == "discard" && evt.getParent("phaseDiscard") == trigger) {
                    cards.addArray(evt.cards2);
                }
            });
            event.num = cards.length;
            event.str1 = "令至多" + event.num + "名角色摸一张牌";
            event.str2 = "对任意名体力值之和为" + event.num + "的角色造成1点伤害";
            const result = await player
                .chooseControl("cancel2")
                .set("ai", function () {
                    const player = get.player();
                    const { num } = get.event().getParent();
                    if (
                        game.countPlayer(function (current) {
                            return get.attitude(player, current) < 0 && current.hp == num;
                        }) > 0 &&
                        num <= 3
                    ) {
                        return 1;
                    }
                    return 0;
                })
                .set("choiceList", [event.str1, event.str2])
                .set("prompt", "是否发动【溃诛】？")
                .forResult();
            if (result.control == "cancel2") {
                return;
            }
            if (result.index == 1) {
                event.result = await player
                    .chooseTarget("请选择〖溃诛〗造成伤害的目标", function (card, player, target) {
                        const num = ui.selected.targets.map(t => t.hp).reduce((a, b) => a + b, 0);
                        return num + target.hp <= _status.event.num;
                    })
                    .set("filterOk", function () {
                        const num = ui.selected.targets.map(t => t.hp).reduce((a, b) => a + b);
                        return num == _status.event.num;
                    })
                    .set("ai", function (target) {
                        const player = get.player();
                        if (ui.selected.targets[0] != undefined) {
                            return -1;
                        }
                        return get.attitude(player, target) < 0;
                    })
                    .set("complexTarget", true)
                    .set("promptbar", "none")
                    .set("num", event.num)
                    .set("selectTarget", [1, Infinity])
                    .forResult();
                event.result.cost_data = "damage";
            } else {
                const next = player.chooseTarget("请选择〖溃诛〗摸牌的目标", [1, event.num]);
                next.ai = function (target) {
                    const player = get.player();
                    return get.attitude(player, target);
                };
                event.result = await next.forResult();
            }
        },
        async content(event, trigger, player) {
            const targets = event.targets.sortBySeat();
            if (event.cost_data == "damage") {
                await Promise.all(targets.map(target => target.damage()));
            } else {
                game.asyncDraw(targets);
            }
        },
    },
    zhizheng: {
        audio: 2,
        //mod:{
        //	playerEnabled:function(card,player,target){
        //		const info=get.info(card);
        //		if(target!=player&&(!info||!info.singleCard||!ui.selected.targets.length)&&player.isPhaseUsing()&&!target.inRange(player)) return false;
        //	},
        //},
        trigger: {
            player: "phaseUseEnd",
        },
        forced: true,
        filter(event, player) {
            return (
                player.getHistory("useCard", function (evt) {
                    return evt.getParent("phaseUse") == event;
                }).length <
                game.countPlayer(function (current) {
                    return current != player && !current.inRange(player);
                }) &&
                game.hasPlayer(function (target) {
                    return target != player && !target.inRange(player) && target.countDiscardableCards(player, "he");
                })
            );
        },
        async content(event, trigger, player) {
            const next = player.chooseTarget("请选择〖掣政〗的目标", "弃置一名攻击范围内不包含你的角色的一张牌", true, function (card, player, target) {
                return target != player && !target.inRange(player) && target.countDiscardableCards(player, "he");
            });
            next.ai = function (target) {
                return -get.attitude(player, target);
            };
            const result = await next.forResult();
            if (result.bool) {
                player.line(result.targets);
                player.discardPlayerCard(result.targets[0], "he", 1, true);
            }
        },
        group: "rechezheng",
    },
    lijun: {
        global: "lijun1",
        audio: "lijun1",
        zhuSkill: true,
    },
    lijun2: {
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") {
                    return num + player.countMark("lijun2");
                }
            },
        },
        charlotte: true,
        onremove: true,
    },
    lijun1: {
        audio: 2,
        //forceaudio:true,
        trigger: {
            player: "useCardAfter",
        },
        log: false, // 实际发动者是主公，所以给牌的人不log喵
        filter(event, player) {
            if (event.card.name != "sha" || player.group != "wu") {
                return false;
            }
            if (player.hasSkill("lijun2")) {
                return false;
            }
            if (!player.isPhaseUsing()) {
                return false;
            }
            if (
                !game.hasPlayer(function (target) {
                    return player != target && target.hasZhuSkill("lijun", player);
                })
            ) {
                return false;
            }
            for (let i = 0; i < event.cards.length; i++) {
                if (get.position(event.cards[i], true) == "o") {
                    return true;
                }
            }
            return false;
        },
        async cost(event, trigger, player) {
            const list = game.filterPlayer(function (target) {
                return player != target && target.hasZhuSkill("lijun", player);
            });
            const next = player.chooseTarget(get.prompt("lijun"), "将" + get.translation(trigger.cards) + "交给" + get.translation(list) + (list.length > 1 ? "中的一人" : ""), function (card, player, target) {
                return player != target && target.hasZhuSkill("lijun", player);
            });
            next.ai = function (target) {
                return get.attitude(_status.event.player, target);
            };
            event.result = await next.forResult();
        },
        async content(event, trigger, player) {
            player.addTempSkill("lijun2", "phaseUseEnd");
            const [zhu] = event.targets;
            player.line(zhu, "green");
            zhu.logSkill("lijun"); // 给牌的人去logSkill好像还是不太好喵？
            const list = trigger.cards.filter(function (card) {
                return get.position(card, true) == "o";
            });
            const next = zhu.gain(list, "gain2");
            next.giver = player;
            await next;
            const result = await zhu
                .chooseBool()
                .set("ai", function () {
                    if (get.attitude(zhu, player) > 0) {
                        return true;
                    }
                    return false;
                })
                .set("prompt", "是否令" + get.translation(player) + "摸一张牌？")
                .forResult();
            if (!result.bool) {
                return;
            }
            await player.draw();
            player.addMark("lijun2", 1, false);
        },
    },
    jianxiang: {
        audio: 2,
        trigger: { target: "useCardToTargeted" },
        filter(event, player) {
            return event.player != player && game.hasPlayer(current => current.isMinHandcard());
        },
        async cost(event, trigger, player) {
            const next = player.chooseTarget(get.prompt(event.skill), "令场上手牌数最少的一名角色摸一张牌", function (card, player, target) {
                return target.isMinHandcard();
            });
            next.ai = function (target) {
                const player = get.player();
                return get.attitude(player, target);
            };
            event.result = await next.forResult();
        },
        async content(event, trigger, player) {
            await event.targets[0].draw();
        },
    },
    shenshi: {
        audio: ["shenshi_11.mp3", "shenshi_12.mp3"],
        mark: true,
        locked: false,
        zhuanhuanji: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                if (storage) {
                    return "其他角色对你造成伤害后，你可以观看该角色的手牌，然后交给其一张牌，当前角色回合结束时，若此牌仍在该角色的手牌区或装备区，你将手牌摸至四张";
                }
                return "出牌阶段限一次，你可以将一张牌交给一名手牌数最多的角色，然后对其造成1点伤害，若该角色因此死亡，则你可以令一名角色将手牌摸至四张";
            },
        },
        enable: "phaseUse",
        trigger: { global: "damageSource" },
        filter(event, player) {
            if (!player.countCards("he")) {
                return false;
            }
            if (event.name == "chooseToUse") {
                return !player.storage.shenshi && !player.hasSkill("shenshi_used", null, null, false) && game.hasPlayer(current => get.info("shenshi").filterTarget(null, player, current));
            }
            return event.source?.isIn() && event.source != player && event.player == player && player.storage.shenshi;
        },
        discard: false,
        line: true,
        lose: false,
        delay: false,
        position: "he",
        filterCard: true,
        filterTarget(card, player, target) {
            return target != player && !game.hasPlayer(current => current != player && current.countCards("h") > target.countCards("h"));
        },
        check(card) {
            if (get.position(card) == "h") {
                return 1;
            }
            return 5 - get.value(card);
        },
        async cost(event, trigger, player) {
            const { source } = trigger;
            const { bool } = await player
                .chooseBool(get.prompt(event.name.slice(0, -5), source))
                .set("choice", (source.countCards("h") <= source.getHp() && player.countCards("h") < 4 && !source.hasSkillTag("nogain")) || get.attitude(player, source) > 0)
                .set("prompt2", "其他角色对你造成伤害后，你可以观看该角色的手牌，然后交给其一张牌，当前角色回合结束时，若此牌仍在该角色的手牌区或装备区，你将手牌摸至四张")
                .forResult();
            event.result = {
                bool: bool,
                targets: [source],
            };
        },
        prompt: "出牌阶段限一次，你可以将一张牌交给一名手牌数最多的角色，然后对其造成1点伤害，若该角色因此死亡，则你可以令一名角色将手牌摸至四张",
        async content(event, trigger, player) {
            const target = event.targets[0];
            player.changeZhuanhuanji(event.name);
            if (!trigger) {
                player.addTempSkill(event.name + "_used", "phaseUseAfter");
                await player.give(event.cards, target);
                await target.damage("nocard");
                if (
                    !game.getGlobalHistory("everything", evt => {
                        if (evt.name != "die" || evt.player != target) {
                            return false;
                        }
                        return evt.reason?.getParent() == event;
                    }).length ||
                    !game.hasPlayer(current => current.countCards("h") < 4)
                ) {
                    return;
                }
                const result = await player
                    .chooseTarget("令一名角色将手牌摸至四张", (card, player, target) => {
                        return target.countCards("h") < 4;
                    })
                    .set("ai", target => {
                        return get.attitude(player, target);
                    })
                    .forResult();
                if (result.bool) {
                    player.line(result.targets);
                    await result.targets[0].drawTo(4);
                }
            } else {
                await player.viewHandcards(target);
                const result = await player.chooseToGive(target, "he", true, `交给${get.translation(target)}一张牌`).set("ai", card => {
                    return 5 - get.value(card);
                }).forResult();
                if (result.bool) {
                    const card = result.cards[0];
                    target.addGaintag(result.cards, event.name);
                    player
                        .when({ global: "phaseJieshuBegin" })
                        .filter(evt => evt.getParent() == trigger.getParent("phase", true) && target.getCards("he").includes(card) && player.countCards("h") < 4)
                        .step(async () => {
                            target.removeGaintag(event.name);
                            await player.drawTo(4);
                        });
                }
            }
        },
        ai: {
            order: 1,
            result: {
                target(player, target) {
                    return get.damageEffect(target, player, target);
                },
            },
        },
        subSkill: { used: { charlotte: true } },
    },
    chenglve: {
        audio: 2,
        mark: true,
        zhuanhuanji: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                const num = storage ? 2 : 1;
                return `出牌阶段限一次，你可以摸${get.cnNumber(num)}张牌，然后弃置${get.cnNumber(3 - num)}张手牌。若如此做，直到本回合结束，你使用与弃置牌花色相同的牌无距离和次数限制`;
            },
        },
        enable: "phaseUse",
        usable: 1,
        async content(event, trigger, player) {
            player.changeZhuanhuanji("chenglve");
            const num = player.storage.chenglve ? 1 : 2;
            await player.draw(num);
            if (!player.hasCard(card => lib.filter.cardDiscardable(card, player, "chenglve"), "h")) {
                return;
            }
            await game.delayx();
            const { bool, cards } = await player.chooseToDiscard(true, "h", 3 - num).set("ai", card => {
                const player = get.player(),
                    effect = player.getStorage("chenglve_effect");
                const cards = player.getCards("h").filter(i => get.tag(i, "damage") && get.type(i) != "delay" && player.hasValueTarget(i, true, false)),
                    map = {};
                for (const cardx of cards) {
                    const suit = get.suit(cardx, player);
                    if (typeof map[suit] != "number") {
                        map[suit] = 0;
                    }
                    map[suit]++;
                }
                const list = [];
                for (let i in map) {
                    if (map[i] > 0) {
                        list.push([i, map[i]]);
                    }
                }
                list.sort((a, b) => b[1] - a[1]);
                if (effect.includes(get.suit(card, player))) {
                    return 0;
                }
                if (list.some(i => i[0] == get.suit(card, player)) && !player.hasUseTarget(card, false)) {
                    return 10;
                }
                if (player.storage.chenglve && ui.selected.cards.length && !ui.selected.cards.some(i => get.suit(i) == get.suit(card, player))) {
                    return 2;
                }
                return 6 - get.value(card);
            }).forResult();
            if (bool) {
                const effect = "chenglve_effect";
                player.addTempSkill(effect);
                player.markAuto(effect, cards.map(card => get.suit(card, player)).unique());
                player.storage[effect].sort((a, b) => lib.suits.indexOf(b) - lib.suits.indexOf(a));
                player.addTip(effect, get.translation(effect) + player.getStorage(effect).reduce((str, suit) => str + get.translation(suit), ""));
            }
        },
        ai: {
            order(item, player) {
                if (player.countCards("h", card => get.tag(card, "damage") && get.type(card) != "delay" && player.hasValueTarget(card, true, false)) > 2) {
                    return get.order({ name: "sha" }) + 0.14;
                }
                return 2.7;
            },
            result: {
                player(player) {
                    if (!player.storage.chenglve && player.countCards("h") < 3) {
                        return 0;
                    }
                    return 1;
                },
            },
        },
        subSkill: {
            effect: {
                charlotte: true,
                onremove(player, skill) {
                    delete player.storage[skill];
                    player.removeTip(skill);
                },
                mod: {
                    cardUsable(card, player) {
                        const suit = get.suit(card);
                        if (suit == "unsure" || player.getStorage("chenglve_effect").includes(suit)) {
                            return Infinity;
                        }
                    },
                    targetInRange(card, player) {
                        const suit = get.suit(card);
                        if (suit == "unsure" || player.getStorage("chenglve_effect").includes(suit)) {
                            return true;
                        }
                    },
                },
                marktext: "略",
                intro: { content: `本回合使用$花色的牌无距离和次数限制` },
            },
        },
    },
    shicai: {
        audio: "shicai_2",
        locked: false,
        mod: {
            aiOrder(player, card, num) {
                if (num <= 0 || player.shicai_aiOrder || get.itemtype(card) !== "card" || player.hasSkillTag("abnormalDraw")) {
                    return num;
                }
                let type = get.type2(card, false);
                if (
                    player.hasHistory("useCard", evt => {
                        return get.type2(evt.card, false) == type;
                    })
                ) {
                    return num;
                }
                player.shicai_aiOrder = true;
                let val = player.getUseValue(card, true, true);
                delete player.shicai_aiOrder;
                return 20 * val;
            },
        },
        trigger: { player: ["useCardAfter", "useCardToTargeted"] },
        prompt2(event, player) {
            const cards = event.cards.filterInD("oe");
            return "你可以将" + get.translation(cards) + (cards.length > 1 ? "以任意顺序" : "") + "置于牌堆顶，然后摸一张牌";
        },
        filter(event, player) {
            if (!event.cards.someInD()) {
                return false;
            }
            let evt = event,
                type = get.type2(evt.card, false);
            if (event.name == "useCardToTargeted") {
                if (type != "equip" || player != event.target) {
                    return false;
                }
                evt = evt.getParent();
            } else {
                if (type == "equip") {
                    return false;
                }
            }
            return !player.hasHistory(
                "useCard",
                evtx => {
                    return evtx != evt && get.type2(evtx.card, false) == type;
                },
                evt
            );
        },
        check(event, player) {
            if (get.type(event.card) == "equip") {
                if (get.subtype(event.card) == "equip6") {
                    return true;
                }
                if (get.equipResult(player, player, event.card) <= 0) {
                    return true;
                }
                const eff1 = player.getUseValue(event.card);
                const subtype = get.subtype(event.card);
                return (
                    player.countCards("h", function (card) {
                        return get.subtype(card) == subtype && player.getUseValue(card) >= eff1;
                    }) > 0
                );
            }
            return true;
        },
        async content(event, trigger, player) {
            let cards = trigger.cards.filterInD();
            if (cards.length > 1) {
                const result = await player
                    .chooseToMove("恃才：将牌按顺序置于牌堆顶", true)
                    .set("list", [["牌堆顶", cards]])
                    .set("reverse", _status.currentPhase?.next && get.attitude(player, _status.currentPhase.next) > 0)
                    .set("processAI", function (list) {
                        const cards = list[0][1].slice(0);
                        cards.sort(function (a, b) {
                            return (_status.event.reverse ? 1 : -1) * (get.value(b) - get.value(a));
                        });
                        return [cards];
                    })
                    .forResult();
                if (!result.bool) {
                    return;
                }
                cards = result.moved[0];
            }
            cards.reverse();
            await game.cardsGotoPile(cards, "insert");
            game.log(player, "将", cards, "置于了牌堆顶");
            await player.draw();
        },
        subSkill: { 2: { audio: 2 } },
        ai: {
            reverseOrder: true,
            skillTagFilter(player) {
                if (
                    player.getHistory("useCard", function (evt) {
                        return get.type(evt.card) == "equip";
                    }).length > 0
                ) {
                    return false;
                }
            },
            effect: {
                target_use(card, player, target) {
                    if (
                        player == target &&
                        get.type(card) == "equip" &&
                        !player.getHistory("useCard", function (evt) {
                            return get.type(evt.card) == "equip";
                        }).length
                    ) {
                        return [1, 3];
                    }
                },
            },
        },
    },
    cunmu: {
        audio: 2,
        audioname: ["ol_pengyang"],
        trigger: {
            player: "drawBegin",
        },
        forced: true,
        async content(event, trigger, player) {
            trigger.bottom = true;
        },
        ai: {
            abnormalDraw: true,
            skillTagFilter(player, tag, arg) {
                if (tag === "abnormalDraw") {
                    return !arg || arg === "bottom";
                }
            },
        },
    },
    mingren: {
        audio: "mingren_1",
        drawNum: 2,
        audioname: ["sb_yl_luzhi"],
        trigger: {
            global: "phaseBefore",
            player: "enterGame",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return (event.name != "phase" || game.phaseNumber == 0) && !player.getExpansions("mingren").length;
        },
        async content(event, trigger, player) {
            await player.draw(get.info(event.name).drawNum || 2);
            if (!player.countCards("h")) {
                return;
            }
            const result = await player.chooseCard("h", "将一张手牌置于武将牌上，称为“任”", true).set("ai", function (card) {
                return 6 - get.value(card);
            }).forResult();
            if (result.bool) {
                const next = player.addToExpansion(result.cards[0], player, "give", "log");
                next.gaintag.add("mingren");
                await next;
            }
        },
        marktext: "任",
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove(player, skill) {
            const cards = player.getExpansions(skill);
            if (cards.length) {
                player.loseToDiscardpile(cards);
            }
        },
        group: ["mingren_1"],
        ai: { notemp: true },
        subSkill: {
            1: {
                audio: 2,
                audioname: ["sb_yl_luzhi"],
                trigger: { player: "phaseJieshuBegin" },
                filter(event, player) {
                    return player.countCards("h") > 0 && player.getExpansions("mingren").length > 0;
                },
                async cost(event, trigger, player) {
                    event.result = await player
                        .chooseCard("h", get.prompt(event.skill), "选择一张手牌替换“任”（" + get.translation(player.getExpansions("mingren")[0]) + "）")
                        .set("ai", function (card) {
                            const player = _status.event.player;
                            const color = get.color(card);
                            if (color == get.color(player.getExpansions("mingren")[0])) {
                                return false;
                            }
                            let num = 0;
                            const list = [];
                            player.countCards("h", function (cardx) {
                                if (cardx != card || get.color(cardx) != color) {
                                    return false;
                                }
                                if (list.includes(cardx.name)) {
                                    return false;
                                }
                                list.push(cardx.name);
                                switch (cardx.name) {
                                    case "wuxie":
                                        num += game.countPlayer() / 2.2;
                                        break;
                                    case "caochuan":
                                        num += 1.1;
                                        break;
                                    case "shan":
                                        num += 1;
                                        break;
                                }
                            });
                            return num * (30 - get.value(card));
                        })
                        .forResult();
                },
                async content(event, trigger, player) {
                    // 考虑到getExpansions的实际执行在addToExpansion之前喵，此处调换顺序
                    const card = player.getExpansions("mingren")[0];
                    const next = player.addToExpansion(event.cards[0], "log", "give", player);
                    next.gaintag.add("mingren");
                    await next;
                    if (card) {
                        await player.gain(card, "gain2");
                    }
                },
            },
        },
    },
    zhenliang: {
        audio: ["zhenliang_11.mp3", "zhenliang_12.mp3"],
        drawNum: 1,
        mark: true,
        zhuanhuanji: true,
        marktext: "☯",
        intro: {
            content(storage) {
                if (storage) {
                    return "当你于回合外使用或打出的牌结算完成后，若此牌与“任”颜色相同，则你可以令一名角色摸一张牌。";
                }
                return "出牌阶段限一次，你可以弃置一张与“任”颜色相同的牌并对攻击范围内的一名角色造成1点伤害。";
            },
        },
        enable: "phaseUse",
        trigger: {
            player: ["useCardAfter", "respondAfter"],
        },
        filter(event, player) {
            const cards = player.getExpansions("mingren");
            if (!cards.length) {
                return false;
            }
            if (event.name == "chooseToUse") {
                if (player.storage.zhenliang || player.hasSkill("zhenliang_used", null, null, false)) {
                    return false;
                }
                const color = get.color(cards[0]);
                if (!player.countCards("he", card => get.color(card) == color)) {
                    return false;
                }
                return game.hasPlayer(current => player.inRange(current));
            } else {
                if (_status.currentPhase == player || !player.storage.zhenliang) {
                    return false;
                }
                return get.color(event.card) == get.color(cards[0]);
            }
        },
        position: "he",
        filterCard(card, player) {
            return get.color(card) == get.color(player.getExpansions("mingren")[0]);
        },
        filterTarget(card, player, target) {
            return player.inRange(target);
        },
        check(card) {
            return 6.5 - get.value(card);
        },
        prompt: "弃置一张与“任”颜色相同的牌，并对攻击范围内的一名角色造成1点伤害。",
        async cost(event, trigger, player) {
            const skillName = event.name.slice(0, -5),
                num = get.info(skillName).drawNum;
            event.result = await player
                .chooseTarget(get.prompt(skillName), `令${(num > 1 ? "至多" : "") + get.cnNumber(num)}名角色${num > 1 ? "各" : ""}摸${get.cnNumber(num)}张牌`)
                .set("selectTarget", [1, num])
                .set("ai", target => {
                    const player = get.player();
                    return get.effect(target, { name: "draw" }, player, player);
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const skill = event.name;
            player.changeZhuanhuanji(skill);
            if (!trigger) {
                const target = event.target;
                player.addTempSkill(skill + "_used", "phaseUseAfter");
                await target.damage("nocard");
            } else {
                const targets = event.targets;
                if (targets.length === 1) {
                    await targets[0].draw(get.info(skill).drawNum);
                } else {
                    await game.asyncDraw(targets, get.info(skill).drawNum);
                    await game.delayx();
                }
            }
        },
        ai: {
            order: 5,
            result: {
                player(player, target) {
                    return get.damageEffect(target, player, player);
                },
            },
            combo: "mingren",
        },
        subSkill: { used: { charlotte: true } },
    },
    zhengrong: {
        trigger: { player: "useCardToPlayered" },
        audio: "drlt_zhenrong",
        filter(event, player) {
            if (!event.isFirstTarget) {
                return false;
            }
            if (!["basic", "trick"].includes(get.type(event.card))) {
                return false;
            }
            if (get.tag(event.card, "damage")) {
                return game.hasPlayer(function (current) {
                    return event.targets.includes(current) && current.countCards("h") >= player.countCards("h") && current.countCards("he") > 0;
                });
            }
            return false;
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseTarget(get.prompt(event.skill), "将一名手牌数不小于你的目标角色的一张牌置于你的武将牌上，成为「荣」", function (card, player, target) {
                    return _status.event.targets.includes(target) && target.countCards("h") >= player.countCards("h") && target.countCards("he") > 0;
                })
                .set("ai", function (target) {
                    return (1 - get.attitude(_status.event.player, target)) / target.countCards("he");
                })
                .set("targets", trigger.targets)
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            const next = player.choosePlayerCard(target, "he", true);
            next.ai = get.buttonValue;
            const result = await next.forResult();
            if (result.bool) {
                const card = result.links[0];
                const next = player.addToExpansion(card, "give", "log", target);
                next.gaintag.add("zhengrong");
                await next;
            }
        },
        onremove(player, skill) {
            const cards = player.getExpansions(skill);
            if (cards.length) {
                player.loseToDiscardpile(cards);
            }
        },
        marktext: "荣",
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
    },
    hongju: {
        trigger: { player: "phaseZhunbeiBegin" },
        audio: "drlt_hongju",
        forced: true,
        juexingji: true,
        skillAnimation: true,
        animationColor: "thunder",
        derivation: "qingce",
        filter(event, player) {
            return player.getExpansions("zhengrong").length >= 3;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            const cards = player.getExpansions("zhengrong");
            if (cards.length && player.countCards("h")) {
                const next = player.chooseToMove("征荣：是否交换“荣”和手牌？");
                next.set("list", [
                    [get.translation(player) + "（你）的“荣”", cards],
                    ["手牌区", player.getCards("h")],
                ]);
                next.set("filterMove", function (from, to) {
                    return typeof to != "number";
                });
                next.set("processAI", function (list) {
                    const player = _status.event.player,
                        cards = list[0][1].concat(list[1][1]).sort(function (a, b) {
                            return get.value(a) - get.value(b);
                        }),
                        cards2 = cards.splice(0, player.getExpansions("zhengrong").length);
                    return [cards2, cards];
                });
                const result = await next.forResult();
                if (result.bool) {
                    const pushs = result.moved[0],
                        gains = result.moved[1];
                    pushs.removeArray(player.getExpansions("zhengrong"));
                    gains.removeArray(player.getCards("h"));
                    if (pushs.length && pushs.length == gains.length) {
                        const next = player.addToExpansion(pushs);
                        next.gaintag.add("zhengrong");
                        await next;
                        await player.gain(gains, "gain2", "log");
                    }
                }
            }
            await player.addSkills("qingce");
            game.log(player, "获得了技能", "#g【清侧】");
            await player.loseMaxHp();
        },
        ai: { combo: "zhengrong" },
    },
    qingce: {
        enable: "phaseUse",
        audio: "drlt_qingce",
        filter(event, player) {
            return player.getExpansions("zhengrong").length > 0 && player.countCards("h") > 0;
        },
        chooseButton: {
            dialog(event, player) {
                return ui.create.dialog("请选择要获得的「荣」", player.getExpansions("zhengrong"), "hidden");
            },
            backup(links, player) {
                return {
                    card: links[0],
                    filterCard: true,
                    position: "h",
                    filterTarget(card, player, target) {
                        return target.countDiscardableCards(player, "ej") > 0;
                    },
                    delay: false,
                    audio: "drlt_qingce",
                    content: lib.skill.qingce.contentx,
                    ai: {
                        result: {
                            target(player, target) {
                                const att = get.attitude(player, target);
                                if (
                                    att > 0 &&
                                    (target.countCards("j") > 0 ||
                                        target.countCards("e", function (card) {
                                            return get.value(card, target) < 0;
                                        }))
                                ) {
                                    return 2;
                                }
                                if (att < 0 && target.countCards("e") > 0 && !target.hasSkillTag("noe")) {
                                    return -1;
                                }
                                return 0;
                            },
                        },
                    },
                };
            },
            prompt(links, player) {
                return "选择弃置一张手牌，获得" + get.translation(links[0]) + "并弃置一名角色装备区或判定区内的一张牌";
            },
        },
        async contentx(event, trigger, player) {
            const card = lib.skill.qingce_backup.card;
            await player.gain(card, "gain2", "log");
            if (event.target.countDiscardableCards(player, "ej") > 0) {
                await player.discardPlayerCard("ej", true, event.target);
            }
        },
        ai: {
            combo: "zhengrong",
            order: 8,
            result: {
                player(player) {
                    if (
                        game.hasPlayer(function (current) {
                            const att = get.attitude(player, current);
                            if ((att > 0 && current.countCards("j") > 0) || (att < 0 && current.countCards("e") > 0)) {
                                return true;
                            }
                            return false;
                        })
                    ) {
                        return 1;
                    }
                    return 0;
                },
            },
        },
    },
    wanglie: {
        audio: "drlt_wanglie",
        locked: false,
        mod: {
            targetInRange(card, player, target) {
                if (player.hasSkill("wanglie_effect", null, null, false)) {
                    return true;
                }
            },
        },
        trigger: {
            player: "useCard",
        },
        filter(event, player) {
            return player.isPhaseUsing() && (event.card.name == "sha" || get.type(event.card) == "trick");
        },
        preHidden: true,
        check(event, player) {
            if (player.hasSkill("wanglie2", null, null, false)) {
                return true;
            }
            if (["wuzhong", "kaihua", "dongzhuxianji"].includes(event.card.name)) {
                return false;
            }
            player._wanglie_temp = true;
            let eff = 0;
            for (const i of event.targets) {
                eff += get.effect(i, event.card, player, player);
            }
            delete player._wanglie_temp;
            if (eff < 0) {
                return true;
            }
            if (
                !player.countCards("h", function (card) {
                    return player.hasValueTarget(card, null, true);
                })
            ) {
                return true;
            }
            if (
                get.tag(event.card, "damage") &&
                !player.needsToDiscard() &&
                !player.countCards("h", function (card) {
                    return get.tag(card, "damage") && player.hasValueTarget(card, null, true);
                })
            ) {
                return true;
            }
            return false;
        },
        prompt2(event) {
            return "令" + get.translation(event.card) + "不能被响应，然后本阶段你使用牌只能指定自己为目标";
        },
        group: "wanglie_startup",
        async content(event, trigger, player) {
            trigger.nowuxie = true;
            trigger.directHit.addArray(game.players);
            player.addTempSkill("wanglie2", "phaseUseAfter");
        },
        subSkill: {
            startup: {
                trigger: { player: "phaseUseBegin" },
                forced: true,
                popup: false,
                async content(event, trigger, player) {
                    player.addTempSkill("wanglie_effect", "phaseUseAfter");
                },
            },
            effect: {
                forced: true,
                charlotte: true,
                firstDo: true,
                popup: false,
                trigger: { player: "useCard1" },
                filter(event, player) {
                    return event.targets.some(target => target != player);
                },
                async content(event, trigger, player) {
                    player.addMark("wanglie_effect", 1, false);
                    if (player.countMark("wanglie_effect") >= 2) {
                        player.removeSkill("wanglie_effect");
                    }
                },
                onremove: true,
            },
        },
        ai: {
            //pretao:true,
            directHit_ai: true,
            skillTagFilter(player, tag, arg) {
                //if(tag=='pretao') return true;
                if (player._wanglie_temp) {
                    return false;
                }
                player._wanglie_temp = true;
                const bool = (function () {
                    if (["wuzhong", "kaihua", "dongzhuxianji"].includes(arg.card.name)) {
                        return false;
                    }
                    if (get.attitude(player, arg.target) > 0 || !player.isPhaseUsing()) {
                        return false;
                    }
                    let cards = player.getCards("h", function (card) {
                        return card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card));
                    });
                    let sha = player.getCardUsable("sha");
                    if (arg.card.name == "sha") {
                        sha--;
                    }
                    cards = cards.filter(function (card) {
                        if (card.name == "sha" && sha <= 0) {
                            return false;
                        }
                        return player.hasValueTarget(card, null, true);
                    });
                    if (!cards.length) {
                        return true;
                    }
                    if (!get.tag(arg.card, "damage")) {
                        return false;
                    }
                    if (
                        !player.needsToDiscard() &&
                        !cards.filter(function (card) {
                            return get.tag(card, "damage");
                        }).length
                    ) {
                        return true;
                    }
                    return false;
                })();
                delete player._wanglie_temp;
                return bool;
            },
        },
    },
    wanglie2: {
        charlotte: true,
        mod: {
            playerEnabled(card, player, target) {
                if (player != target) {
                    return false;
                }
            },
        },
    },
    zuilun: {
        audio: 2,
        trigger: {
            player: "phaseJieshuBegin",
        },
        check(event, player) {
            let num = 0;
            if (
                player.hasHistory("lose", function (evt) {
                    return evt.type == "discard";
                })
            ) {
                num++;
            }
            if (!player.isMinHandcard()) {
                num++;
            }
            if (!player.getStat("damage")) {
                num++;
            }
            if (num == 3) {
                return player.hp >= 2;
            }
            return true;
        },
        prompt(event, player) {
            let num = 3;
            if (
                player.hasHistory("lose", function (evt) {
                    return evt.type == "discard";
                })
            ) {
                num--;
            }
            if (!player.isMinHandcard()) {
                num--;
            }
            if (!player.getStat("damage")) {
                num--;
            }
            return get.prompt("zuilun") + "（可获得" + get.cnNumber(num) + "张牌）";
        },
        async content(event, trigger, player) {
            let num = 0;
            const cards = get.cards(3);
            await game.cardsGotoOrdering(cards);
            if (
                player.hasHistory("lose", function (evt) {
                    return evt.type == "discard";
                })
            ) {
                num++;
            }
            if (!player.isMinHandcard()) {
                num++;
            }
            if (!player.getStat("damage")) {
                num++;
            }
            if (num == 0) {
                await player.gain(cards, "draw");
                return;
            }
            let prompt = "罪论：将" + get.cnNumber(num) + "张牌置于牌堆顶";
            if (num < 3) {
                prompt += "并获得其余的牌";
            }
            const chooseToMove = player.chooseToMove(prompt, true);
            if (num < 3) {
                chooseToMove.set("list", [["牌堆顶", cards], ["获得"]]);
                chooseToMove.set("filterMove", function (from, to, moved) {
                    if (to == 1 && moved[0].length <= _status.event.num) {
                        return false;
                    }
                    return true;
                });
                chooseToMove.set("filterOk", function (moved) {
                    return moved[0].length == _status.event.num;
                });
            } else {
                chooseToMove.set("list", [["牌堆顶", cards]]);
            }
            chooseToMove.set("num", num);
            chooseToMove.set("processAI", function (list) {
                const check = function (card) {
                    const player = _status.event.player;
                    const next = player.next;
                    const att = get.attitude(player, next);
                    const judge = next.getCards("j")[tops.length];
                    if (judge) {
                        return get.judge(judge)(card) * att;
                    }
                    return next.getUseValue(card) * att;
                };
                const cards = list[0][1].slice(0),
                    tops = [];
                while (tops.length < _status.event.num) {
                    list.sort(function (a, b) {
                        return check(b) - check(a);
                    });
                    tops.push(cards.shift());
                }
                return [tops, cards];
            });
            let result = await chooseToMove.forResult();
            if (result.bool) {
                const list = result.moved[0];
                cards.removeArray(list);
                await game.cardsGotoPile(list.reverse(), "insert");
            }
            game.updateRoundNumber();
            if (cards.length) {
                await player.gain(cards, "draw");
                return;
            }
            const chooseTarget = player.chooseTarget("请选择一名角色，与其一同失去1点体力", true, function (card, player, target) {
                return target != player;
            });
            chooseTarget.ai = function (target) {
                return -get.attitude(_status.event.player, target);
            };
            result = await chooseTarget.forResult();
            player.line(result.targets[0], "fire");
            await player.loseHp();
            await result.targets[0].loseHp();
        },
    },
    fuyin: {
        trigger: {
            target: "useCardToTargeted",
        },
        forced: true,
        audio: 2,
        filter(event, player) {
            if (event.player.countCards("h") < player.countCards("h")) {
                return false;
            }
            if (event.card.name != "sha" && event.card.name != "juedou") {
                return false;
            }
            return !game.hasPlayer2(function (current) {
                return (
                    current.getHistory("useCard", function (evt) {
                        return evt != event.getParent() && evt.card && ["sha", "juedou"].includes(evt.card.name) && evt.targets.includes(player);
                    }).length > 0
                );
            });
        },
        async content(event, trigger, player) {
            trigger.getParent().excluded.add(player);
        },
        ai: {
            effect: {
                target(card, player, target) {
                    let hs = player.getCards("h", i => i !== card && (!card.cards || !card.cards.includes(i))),
                        num = player.getCardUsable("sha");
                    if ((card.name !== "sha" && card.name !== "juedou") || hs.length < target.countCards("h")) {
                        return 1;
                    }
                    if (
                        game.hasPlayer2(function (current) {
                            return (
                                current.getHistory("useCard", function (evt) {
                                    return evt.card && ["sha", "juedou"].includes(evt.card.name) && evt.targets.includes(player);
                                }).length > 0
                            );
                        })
                    ) {
                        return 1;
                    }
                    if (card.name === "sha") {
                        num--;
                    }
                    hs = hs.filter(i => {
                        if (!player.canUse(i, target)) {
                            return false;
                        }
                        if (i.name === "juedou") {
                            return true;
                        }
                        if (num && i.name === "sha") {
                            num--;
                            return true;
                        }
                        return false;
                    });
                    if (!hs.length) {
                        return "zeroplayertarget";
                    }
                    num = 1 - 2 / 3 / hs.length;
                    return [num, 0, num, 0];
                },
            },
        },
    },
    liangyin: {
        audio: 2,
        group: ["liangyin_1", "liangyin_2"],
        subSkill: {
            1: {
                audio: "liangyin",
                trigger: {
                    global: ["loseAfter", "addToExpansionAfter", "cardsGotoSpecialAfter", "loseAsyncAfter"],
                },
                filter(event, player, name) {
                    if (event.name == "lose" || event.name == "loseAsync") {
                        return event.getlx !== false && event.toStorage == true;
                    }
                    if (event.name == "cardsGotoSpecial") {
                        return !event.notrigger;
                    }
                    return true;
                },
                async cost(event, trigger, player) {
                    const next = player.chooseTarget("是否发动【良姻】令手牌数大于你的一名角色摸一张牌？", function (card, player, target) {
                        return target != player && target.countCards("h") > player.countCards("h");
                    });
                    next.ai = function (target) {
                        const player = get.player();
                        return get.attitude(player, target);
                    };
                    event.result = await next.forResult();
                },
                async content(event, trigger, player) {
                    await event.targets[0].draw();
                },
            },
            2: {
                audio: "liangyin",
                trigger: {
                    global: "gainAfter",
                },
                filter(event, player) {
                    return (
                        event.fromStorage == true ||
                        game.hasPlayer2(function (current) {
                            const evt = event.getl(current);
                            return evt && evt.xs && evt.xs.length > 0;
                        })
                    );
                },
                async cost(event, trigger, player) {
                    const next = player.chooseTarget("是否发动【良姻】令手牌数小于你的一名角色弃置一张牌？", function (card, player, target) {
                        return target != player && target.countCards("h") < player.countCards("h") && target.countCards("he") > 0;
                    });
                    next.ai = function (target) {
                        const player = get.player();
                        return -get.attitude(player, target);
                    };
                    event.result = await next.forResult();
                },
                async content(event, trigger, player) {
                    await event.targets[0].chooseToDiscard("he", 1, true);
                },
            },
        },
    },
    kongsheng: {
        audio: 2,
        trigger: { player: "phaseZhunbeiBegin" },
        filter(event, player) {
            return player.countCards("he") > 0;
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseCard(get.prompt(event.skill), "将任意张牌置于武将牌上", "he", [1, player.countCards("he")], "allowChooseAll")
                .set("ai", function (card) {
                    const player = get.player();
                    if (get.position(card) == "e") {
                        return 1 - get.value(card);
                    }
                    if (card.name == "shan" || card.name == "du" || !player.hasValueTarget(card)) {
                        return 1;
                    }
                    return 4 - get.value(card);
                })
                .forResult();
        },
        async content(event, trigger, player) {
            player.addSkill("kongsheng2");
            const next = player.addToExpansion(event.cards, "log", "give", player);
            next.gaintag.add("kongsheng2");
            await next;
        },
    },
    qianjie: {
        audio: 2,
        group: ["qianjie_1", "qianjie_2", "qianjie_3"],
        locked: true,
        ai: {
            effect: {
                target(card) {
                    if (card.name == "tiesuo") {
                        return "zeroplayertarget";
                    }
                },
            },
        },
        subSkill: {
            1: {
                audio: "qianjie",
                trigger: {
                    player: "linkBegin",
                },
                forced: true,
                filter(event, player) {
                    return !player.isLinked();
                },
                async content(event, trigger, player) {
                    trigger.cancel();
                },
                ai: {
                    noLink: true,
                },
            },
            2: {
                mod: {
                    targetEnabled(card, player, target) {
                        if (get.type(card) == "delay") {
                            return false;
                        }
                    },
                },
            },
            3: {
                ai: { noCompareTarget: true },
            },
        },
    },
    jueyan: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return player.hasEnabledSlot(1) || player.hasEnabledSlot(2) || player.hasEnabledSlot(5) || player.hasEnabledSlot("horse");
        },
        async content(event, trigger, player) {
            const { control } = await player
                .chooseToDisable(true)
                .set("ai", function (event, player, list) {
                    if (list.includes("equip5") && !player.hasSkill("jueyan_effect")) {
                        return "equip5";
                    }
                    if (list.includes("equip2")) {
                        return "equip2";
                    }
                    if (
                        list.includes("equip1") &&
                        player.countCards("h", function (card) {
                            return get.name(card, player) == "sha" && player.hasUseTarget(card);
                        }) -
                        player.getCardUsable("sha") >
                        1
                    ) {
                        return "equip1";
                    }
                    if (
                        list.includes("equip5") &&
                        player.countCards("h", function (card) {
                            return get.type2(card, player) == "trick" && player.hasUseTarget(card);
                        }) > 1
                    ) {
                        return "equip5";
                    }
                })
                .forResult();
            const bool = !player.hasSkill("jueyan_effect");
            switch (control) {
                case "equip1":
                    player.addTempSkill("jueyan1");
                    if (bool) {
                        player.addSkill("jueyan_sha");
                    }
                    break;
                case "equip2":
                    await player.draw(3);
                    player[bool ? "addSkill" : "addTempSkill"]("jueyan3");
                    break;
                case "equip3_4":
                    player[bool ? "addSkill" : "addTempSkill"]("jueyan2");
                    break;
                case "equip5":
                    await player[bool ? "addSkills" : "addTempSkills"]("rejizhi");
                    break;
            }
            if (bool) {
                player.addSkill("jueyan_effect");
            }
        },
        ai: {
            order: 13,
            result: {
                player(player) {
                    if (player.hasEnabledSlot("equip2")) {
                        return 1;
                    }
                    if (
                        player.hasEnabledSlot("equip1") &&
                        player.countCards("h", function (card) {
                            return get.name(card, player) == "sha" && player.hasValueTarget(card);
                        }) -
                        player.getCardUsable("sha") >
                        1
                    ) {
                        return 1;
                    }
                    if (
                        player.hasEnabledSlot("equip5") &&
                        player.countCards("h", function (card) {
                            return get.type2(card, player) == "trick" && player.hasUseTarget(card);
                        }) > 1
                    ) {
                        return 1;
                    }
                    return -1;
                },
            },
        },
        subSkill: {
            effect: {
                charlotte: true,
                onremove: true,
            },
            sha: {
                mod: {
                    cardUsable(card, player, num) {
                        if (card.name == "sha") {
                            return num + 1;
                        }
                    },
                },
                mark: true,
                marktext: "决",
                charlotte: true,
                locked: false,
                intro: { name: "决堰 - 武器", content: "本局游戏可以多使用一张【杀】" },
            },
        },
        derivation: ["jueyan_rewrite", "rejizhi"],
    },
    jueyan1: {
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") {
                    return num + 3;
                }
            },
        },
        mark: true,
        marktext: "决",
        charlotte: true,
        locked: false,
        intro: { name: "决堰 - 武器", content: "本回合内可以多使用三张【杀】" },
    },
    jueyan2: {
        mod: {
            targetInRange(card, player, target, now) {
                return true;
            },
        },
        mark: true,
        marktext: "决",
        charlotte: true,
        locked: false,
        intro: { name: "决堰 - 坐骑", content: "使用牌没有距离限制" },
    },
    jueyan3: {
        mod: {
            maxHandcard(player, num) {
                return num + 3;
            },
        },
        mark: true,
        marktext: "决",
        charlotte: true,
        locked: false,
        intro: { name: "决堰 - 防具", content: "手牌上限+3" },
    },
    poshi: {
        audio: 2,
        skillAnimation: true,
        animationColor: "wood",
        trigger: { player: "phaseZhunbeiBegin" },
        forced: true,
        juexingji: true,
        derivation: ["drlt_huairou"],
        filter(event, player) {
            return !player.hasEnabledSlot() || player.hp == 1;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            await player.loseMaxHp();
            const num = player.maxHp - player.countCards("h");
            if (num > 0) {
                await player.draw(num);
            }
            await player.changeSkills(["drlt_huairou"], ["jueyan"]);
        },
    },
    xiongluan: {
        audio: 2,
        mod: {
            aiOrder(player, card, num) {
                if (num <= 0 || !player.isPhaseUsing() || player.needsToDiscard() || !get.tag(card, "damage")) {
                    return;
                }
                return 0;
            },
            aiUseful(player, card, num) {
                if (num <= 0 || !get.tag(card, "damage")) {
                    return;
                }
                return num * player.getHp();
            },
        },
        locked: false,
        enable: "phaseUse",
        skillAnimation: true,
        animationColor: "gray",
        limited: true,
        filter(event, player) {
            return !player.isDisabledJudge() || player.hasEnabledSlot();
        },
        filterTarget(card, player, target) {
            return target != player;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            const disables = [];
            for (let i = 1; i <= 5; i++) {
                for (let j = 0; j < player.countEnabledSlot(i); j++) {
                    disables.push(i);
                }
            }
            if (disables.length > 0) {
                await player.disableEquip(disables);
            }
            await player.disableJudge();
            const { target } = event;
            player.addTempSkill(event.name + "_effect");
            player.markAuto(event.name + "_effect", [target]);
            target.addTempSkill(event.name + "_ban");
        },
        ai: {
            order: 13,
            result: {
                target: (player, target) => {
                    let hs = player.countCards("h", card => {
                        if (!get.tag(card, "damage") || get.effect(target, card, player, player) <= 0) {
                            return 0;
                        }
                        if (get.name(card, player) === "sha") {
                            if (target.getEquip("bagua")) {
                                return 0.5;
                            }
                            if (target.getEquip("rewrite_bagua")) {
                                return 0.25;
                            }
                        }
                        return 1;
                    }),
                        ts =
                            target.hp +
                            target.hujia +
                            game.countPlayer(current => {
                                if (get.attitude(current, target) > 0) {
                                    return current.countCards("hs") / 8;
                                }
                                return 0;
                            });
                    if (hs >= ts) {
                        return -hs;
                    }
                    return 0;
                },
            },
        },
        subSkill: {
            effect: {
                charlotte: true,
                onremove: true,
                mod: {
                    targetInRange(card, player, target) {
                        if (player.getStorage("xiongluan_effect").includes(target)) {
                            return true;
                        }
                    },
                    cardUsableTarget(card, player, target) {
                        if (player.getStorage("xiongluan_effect").includes(target)) {
                            return true;
                        }
                    },
                },
                intro: { content: "本回合对$使用牌无距离和次数限制且其不能使用和打出手牌" },
            },
            ban: {
                charlotte: true,
                mark: true,
                mod: {
                    cardEnabled2(card, player) {
                        if (get.position(card) == "h") {
                            return false;
                        }
                    },
                },
                intro: { content: "本回合不能使用或打出手牌" },
                ai: {
                    effect: {
                        target(card, player, target) {
                            if (!target._xiongluan2_effect && get.tag(card, "damage")) {
                                target._xiongluan2_effect = true;
                                const eff = get.effect(target, card, player, target);
                                delete target._xiongluan2_effect;
                                if (eff > 0) {
                                    return [1, -999999];
                                }
                                if (eff < 0) {
                                    return 114514;
                                }
                            }
                        },
                    },
                },
            },
        },
    },
    congjian: {
        audio: 2,
        audioname2: { tongyuan: "ocongjian_tongyuan" },
        trigger: { target: "useCardToTargeted" },
        filter(event, player) {
            return get.type(event.card) == "trick" && event.targets.length > 1 && player.countCards("he") > 0;
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseCardTarget({
                    filterCard: true,
                    position: "he",
                    filterTarget(card, player, target) {
                        return player != target && _status.event.targets.includes(target);
                    },
                    ai1(card) {
                        const player = get.player();
                        if (card.name == "du") {
                            return 20;
                        }
                        if (player.storage.xiongluan && get.type(card) == "equip") {
                            return 15;
                        }
                        return 6 - get.value(card);
                    },
                    ai2(target) {
                        const player = get.player();
                        const att = get.attitude(player, target);
                        if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
                            if (target.hasSkillTag("nodu")) {
                                return 0.1;
                            }
                            return 1 - att;
                        }
                        return att - 3;
                    },
                    prompt: get.prompt2(event.skill),
                    targets: trigger.targets,
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            await player.give(event.cards, target, "give");
            const num = get.type(event.cards[0]) == "equip" ? 2 : 1;
            await player.draw(num);
        },
    },
    zhengu: {
        audio: 2,
        trigger: { player: "phaseJieshuBegin" },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseTarget(get.prompt2(event.skill), function (card, player, target) {
                    //if(target.storage.zhengu_mark&&target.storage.zhengu_mark.includes(player)) return false;
                    return target != player;
                })
                .set("ai", function (target) {
                    const player = _status.event.player;
                    //if(target.storage.zhengu_mark&&target.storage.zhengu_mark.includes(player)) return 0;
                    const num = Math.min(5, player.countCards("h")) - target.countCards("h");
                    const att = get.attitude(player, target);
                    return num * att;
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            player.addSkill("zhengu2");
            target.addSkill("zhengu_mark");
            target.storage.zhengu_mark.push(player);
            target.markSkill("zhengu_mark");
            lib.skill.zhengu.sync(player, target);
        },
        sync(player, target) {
            const num = player.countCards("h");
            const num2 = target.countCards("h");
            if (num < num2) {
                target.chooseToDiscard(num2 - num, true, "h", "allowChooseAll");
            } else {
                target.drawTo(Math.min(5, num));
            }
        },
    },
    zhengu2: {
        audio: "zhengu",
        trigger: {
            global: "phaseEnd",
        },
        forced: true,
        charlotte: true,
        logTarget: "player",
        sourceSkill: "zhengu",
        filter(event, player) {
            return event.player.storage.zhengu_mark && event.player.storage.zhengu_mark.includes(player);
        },
        async content(event, trigger, player) {
            while (trigger.player.storage.zhengu_mark.includes(player)) {
                trigger.player.storage.zhengu_mark.remove(player);
            }
            if (trigger.player.storage.zhengu_mark.length == 0) {
                trigger.player.unmarkSkill("zhengu_mark");
            }
            lib.skill.zhengu.sync(player, trigger.player);
        },
    },
    zhengu_mark: {
        charlotte: true,
        init(player, skill) {
            if (!player.storage[skill]) {
                player.storage[skill] = [];
            }
        },
        marktext: "镇",
        intro: {
            name: "镇骨",
            content: "已成为$〖镇骨〗的目标",
        },
    },
    yongsi: {
        audio: 2,
        group: ["yongsi_1", "yongsi_2"],
        locked: true,
        subSkill: {
            1: {
                audio: "yongsi",
                trigger: {
                    player: "phaseDrawBegin2",
                },
                forced: true,
                filter(event, player) {
                    return !event.numFixed;
                },
                async content(event, trigger, player) {
                    trigger.num = game.countGroup();
                },
            },
            2: {
                audio: "yongsi",
                trigger: {
                    player: "phaseUseEnd",
                },
                forced: true,
                filter(event, player) {
                    let num = 0;
                    player.getHistory("sourceDamage", function (evt) {
                        if (evt.getParent("phaseUse") == event) {
                            num += evt.num;
                        }
                    });
                    return !num || num > 1;
                },
                async content(event, trigger, player) {
                    let numx = 0;
                    player.getHistory("sourceDamage", function (evt) {
                        if (evt.getParent("phaseUse") == trigger) {
                            numx += evt.num;
                        }
                    });
                    if (!numx) {
                        const num = player.hp - player.countCards("h");
                        if (num > 0) {
                            await player.draw(num);
                        }
                    } else {
                        player.addTempSkill("yongsi1", { player: "phaseDiscardAfter" });
                    }
                },
            },
        },
    },
    yongsi1: {
        mod: {
            maxHandcard(player, num) {
                return num + player.maxHp - 2 * Math.max(0, player.hp);
            },
        },
    },
    weidi: {
        audio: 2,
        forceaudio: true,
        zhuSkill: true,
        trigger: { player: "phaseDiscardBegin" },
        filter(event, player) {
            if (!player.hasZhuSkill("weidi")) {
                return false;
            }
            return (
                player.needsToDiscard() > 0 &&
                game.countPlayer(function (current) {
                    return current != player && current.group == "qun";
                }) > 0
            );
        },
        async cost(event, trigger, player) {
            const num = Math.min(
                player.needsToDiscard(),
                game.countPlayer(function (target) {
                    return target != player && target.group == "qun";
                })
            );
            if (!num) {
                return;
            }
            event.result = await player
                .chooseCardTarget({
                    prompt: get.prompt(event.skill),
                    prompt2: "你可以将" + (num > 1 ? "至多" : "") + get.cnNumber(num) + "张手牌交给等量的其他群势力角色。先按顺序选中所有要给出的手牌，然后再按顺序选择等量的目标角色",
                    selectCard: [1, num],
                    selectTarget() {
                        return ui.selected.cards.length;
                    },
                    filterTarget(card, player, target) {
                        return target != player && target.group == "qun";
                    },
                    complexSelect: true,
                    filterOk() {
                        return ui.selected.cards.length == ui.selected.targets.length;
                    },
                    ai1(card) {
                        const player = _status.event.player;
                        const value = get.value(card, player, "raw");
                        if (
                            game.hasPlayer(function (target) {
                                return target != player && target.group == "qun" && !ui.selected.targets.includes(target) && get.sgn(value) == get.sgn(get.attitude(player, target));
                            })
                        ) {
                            return 1 / Math.max(1, get.useful(card));
                        }
                        return -1;
                    },
                    ai2(target) {
                        const player = _status.event.player;
                        const card = ui.selected.cards[ui.selected.targets.length];
                        if (card && get.value(card, player, "raw") < 0) {
                            return -get.attitude(player, target);
                        }
                        return get.attitude(player, target);
                    },
                })
                .forResult();
            if (event.result.bool) {
                event.result.bool = event.result.cards.length > 0;
            }
        },
        async content(event, trigger, player) {
            const list = [];
            for (let i = 0; i < event.targets.length; i++) {
                const target = event.targets[i];
                const card = event.cards[i];
                list.push([target, card]);
            }
            await game
                .loseAsync({
                    gain_list: list,
                    player: player,
                    cards: event.cards,
                    giver: player,
                    animate: "giveAuto",
                })
                .setContent("gaincardMultiple");
        },
    },
    longnu: {
        mark: true,
        locked: true,
        zhuanhuanji: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                if (player.storage.longnu == true) {
                    return "锁定技，出牌阶段开始时，你减1点体力上限并摸一张牌，然后本阶段内你的锦囊牌均视为雷杀且无使用次数限制";
                }
                return "锁定技，出牌阶段开始时，你失去1点体力并摸一张牌，然后本阶段内你的红色手牌均视为火杀且无距离限制";
            },
        },
        audio: 2,
        trigger: {
            player: "phaseUseBegin",
        },
        forced: true,
        async content(event, trigger, player) {
            player.changeZhuanhuanji("longnu");
            if (player.storage.longnu != true) {
                await player.loseMaxHp();
            } else {
                await player.loseHp();
            }
            await player.draw();

            if (player.storage.longnu != true) {
                player.addTempSkill("longnu_2", "phaseUseAfter");
            } else {
                player.addTempSkill("longnu_1", "phaseUseAfter");
            }
        },
        subSkill: {
            1: {
                mod: {
                    cardname(card, player) {
                        if (get.color(card) == "red") {
                            return "sha";
                        }
                    },
                    cardnature(card, player) {
                        if (get.color(card) == "red") {
                            return "fire";
                        }
                    },
                    targetInRange(card) {
                        if (get.color(card) == "red") {
                            return true;
                        }
                    },
                },
                ai: {
                    effect: {
                        target(card, player, target, current) {
                            if (get.tag(card, "respondSha") && current < 0) {
                                return 0.6;
                            }
                        },
                    },
                    respondSha: true,
                },
            },
            2: {
                mod: {
                    cardname(card, player) {
                        if (["trick", "delay"].includes(lib.card[card.name].type)) {
                            return "sha";
                        }
                    },
                    cardnature(card, player) {
                        if (["trick", "delay"].includes(lib.card[card.name].type)) {
                            return "thunder";
                        }
                    },
                    cardUsable(card, player) {
                        if (card.name == "sha" && game.hasNature(card, "thunder")) {
                            return Infinity;
                        }
                    },
                },
                ai: {
                    effect: {
                        target(card, player, target, current) {
                            if (get.tag(card, "respondSha") && current < 0) {
                                return 0.6;
                            }
                        },
                    },
                    respondSha: true,
                },
            },
        },
        ai: {
            fireAttack: true,
            halfneg: true,
            threaten: 1.05,
        },
    },
    jieying: {
        audio: 2,
        locked: true,
        global: "g_jieying",
        ai: {
            effect: {
                target(card) {
                    if (card.name == "tiesuo") {
                        return "zeroplayertarget";
                    }
                },
            },
        },
        group: ["jieying_1", "jieying_2"],
        subSkill: {
            1: {
                audio: "jieying",
                trigger: {
                    player: ["linkBefore", "enterGame"],
                    global: "phaseBefore",
                },
                forced: true,
                filter(event, player) {
                    if (event.name == "link") {
                        return player.isLinked();
                    }
                    return (event.name != "phase" || game.phaseNumber == 0) && !player.isLinked();
                },
                async content(event, trigger, player) {
                    if (trigger.name != "link") {
                        await player.link(true);
                    } else {
                        trigger.cancel();
                    }
                },
                ai: {
                    noLink: true,
                },
            },
            2: {
                audio: "jieying",
                trigger: {
                    player: "phaseJieshuBegin",
                },
                filter(event, player) {
                    return game.hasPlayer(function (current) {
                        return current != player && !current.isLinked();
                    });
                },
                async cost(event, trigger, player) {
                    const next = player.chooseTarget("请选择【结营】的目标");
                    next.set("forced", true);
                    next.set("filterTarget", (card, player, target) => target != player && !target.isLinked());
                    next.set("ai", () => 1 + Math.random());

                    event.result = await next.forResult();
                },
                async content(event, trigger, player) {
                    const { targets } = event;
                    await targets[0].link(true);
                },
            },
        },
    },
    g_jieying: {
        mod: {
            maxHandcard(player, num) {
                if (
                    game.countPlayer(function (current) {
                        return current.hasSkill("jieying");
                    }) > 0 &&
                    player.isLinked()
                ) {
                    return num + 2;
                }
            },
        },
    },
    junlve: {
        audio: 2,
        //marktext:"军",
        intro: {
            content: "当前有#个标记",
        },
        trigger: {
            player: "damageAfter",
            source: "damageSource",
        },
        forced: true,
        async content(event, trigger, player) {
            player.addMark("junlve", trigger.num);
        },
        ai: {
            combo: "cuike",
        },
    },
    cuike: {
        audio: 2,
        trigger: {
            player: "phaseUseBegin",
        },
        async cost(event, trigger, player) {
            /** @type {string} */
            let prompt;
            if (player.countMark("junlve") % 2 == 1) {
                prompt = "是否发动【摧克】，对一名角色造成1点伤害？";
            } else {
                prompt = "是否发动【摧克】，横置一名角色并弃置其区域内的一张牌？";
            }

            const next = player.chooseTarget(prompt);
            next.set("ai", target => -get.attitude(player, target));

            event.result = await next.forResult();
        },
        async content(event, trigger, player) {
            const { targets } = event;
            const [target] = targets;

            if (player.countMark("junlve") % 2 == 1) {
                await target.damage();
            } else {
                await target.link(true);
                await player.discardPlayerCard(target, 1, "hej", true);
            }

            if (player.countMark("junlve") <= 7) {
                return;
            }

            const next = player.chooseBool();
            next.set("ai", () => true);
            next.set("prompt", "是否弃置所有“军略”标记并对所有其他角色造成1点伤害？");

            const result = await next.forResult();
            if (result.bool) {
                const players = game.filterPlayer(target => target !== player);
                player.line(players);
                player.removeMark("junlve", player.countMark("junlve"));
                await game.doAsyncInOrder(players, target => target.damage());
            }
        },
        ai: {
            notemp: true,
        },
    },
    zhanhuo: {
        audio: 2,
        limited: true,
        skillAnimation: true,
        animationColor: "metal",
        enable: "phaseUse",
        filter(event, player) {
            return player.countMark("junlve") > 0;
        },
        check(event, player) {
            var num = game.countPlayer(function (current) {
                return get.attitude(player, current) < 0 && current.isLinked();
            });
            return (
                player.storage.junlve >= num &&
                num ==
                game.countPlayer(function (current) {
                    return get.attitude(player, current) < 0;
                })
            );
        },
        filterTarget(card, player, target) {
            return target.isLinked();
        },
        selectTarget() {
            return [1, _status.event.player.countMark("junlve")];
        },
        multiline: true,
        multitarget: true,
        async content(event, trigger, player) {
            const { targets } = event;

            player.awakenSkill(event.name);
            player.storage.zhanhuo = true;
            player.removeMark("junlve", player.countMark("junlve"));
            for (const target of targets) {
                await target.discard(target.getCards("e"));
            }

            const result = await player
                .chooseTarget(true, "对一名目标角色造成1点火焰伤害", (card, player, target) => {
                    return _status.event.targets.includes(target);
                })
                .set("targets", targets)
                .set("ai", () => 1)
                .forResult();
            if (result.bool) {
                await result.targets[0].damage("fire", "nocard");
            }
        },
        ai: {
            order: 1,
            fireAttack: true,
            combo: "junlve",
            result: {
                target(player, target) {
                    if (target.hasSkillTag("nofire")) {
                        return 0;
                    }
                    if (lib.config.mode == "versus") {
                        return -1;
                    }
                    if (player.hasUnknown()) {
                        return 0;
                    }
                    return get.damageEffect(target, player) - target.countCards("e");
                },
            },
        },
    },
    duorui: {
        audio: 2,
        init(player, skill) {
            if (!player.storage.duorui) {
                player.storage.duorui = [];
            }
        },
        trigger: {
            source: "damageSource",
        },
        filter(event, player) {
            if (player.storage.duorui.length) {
                return false;
            }
            return event.player.isIn() && _status.currentPhase == player;
        },
        check(event, player) {
            if (get.attitude(_status.event.player, event.player) >= 0) {
                return false;
            }
            if (player.hasEnabledSlot() && !player.hasEnabledSlot(5)) {
                return false;
            }
            return true;
        },
        bannedList: [
            "bifa",
            "buqu",
            "gzbuqu",
            "songci",
            "funan",
            "xinfu_guhuo",
            "reguhuo",
            "huashen",
            "rehuashen",
            "old_guhuo",
            "shouxi",
            "xinpojun",
            "taoluan",
            "xintaoluan",
            "xinfu_yingshi",
            "zhenwei",
            "zhengnan",
            "xinzhengnan",
        ],
        logTarget: "player",
        async content(event, trigger, player) {
            const skills = getFilteredSkills(trigger.player);
            event.skills = skills;

            if (player.hasEnabledSlot()) {
                const next = player.chooseToDisable();
                next.set("ai", (event, player, list) => {
                    if (list.includes("equip5")) {
                        return "equip5";
                    }
                    return list.randomGet();
                });
                await next;
            }

            if (!skills.length) {
                return;
            }

            const result = await player
                .chooseButton(["请选择要获得的技能", [skills, "skill"]], true)
                .set("ai", () => Math.random())
                .forResult();

            player.addTempSkills(result.links, { player: "dieAfter" });
            player.storage.duorui = result.links;
            player.storage.duorui_player = trigger.player;
            trigger.player.storage.duorui = result.links;
            trigger.player.addTempSkill("duorui1", { player: "phaseAfter" });

            return;

            /**
             * 获取能获得的技能列表
             *
             * @param {Player} player - 角色对象
             * @returns {string[]} 技能列表
             */
            function getFilteredSkills(player) {
                const result = [];

                if (player.name1 != null) {
                    result.push(...lib.character[player.name1][3]);
                } else {
                    result.push(...lib.character[player.name][3]);
                }

                if (player.name2 != null) {
                    result.push(...lib.character[player.name2][3]);
                }

                return result.filter(skill => {
                    const info = get.info(skill);
                    return (
                        info &&
                        !info.charlotte &&
                        !info.persevereSkill &&
                        !info.hiddenSkill &&
                        !info.zhuSkill &&
                        !info.juexingji &&
                        !info.limited &&
                        !info.dutySkill &&
                        !(info.unique && !info.gainable) &&
                        !lib.skill.duorui.bannedList.includes(skill)
                    );
                });
            }
        },
        group: ["duorui_clear"],
    },
    duorui_clear: {
        trigger: { global: ["phaseAfter", "dieAfter"] },
        filter(event, player) {
            if (!player.storage.duorui_player || !player.storage.duorui) {
                return false;
            }
            return player.storage.duorui_player == event.player && player.storage.duorui.length;
        },
        silent: true,
        forced: true,
        popup: false,
        async content(event, trigger, player) {
            player.removeSkills(player.storage.duorui[0]);
            delete player.storage.duorui_player;
            player.storage.duorui = [];
        },
    },
    duorui1: {
        init(player, skill) {
            player.disableSkill(skill, player.storage.duorui);
        },
        onremove(player, skill) {
            player.enableSkill(skill);
        },
        locked: true,
        mark: true,
        charlotte: true,
        intro: {
            content(storage, player, skill) {
                var list = [];
                for (var i in player.disabledSkills) {
                    if (player.disabledSkills[i].includes(skill)) {
                        list.push(i);
                    }
                }
                if (list.length) {
                    var str = "失效技能：";
                    for (var i = 0; i < list.length; i++) {
                        if (lib.translate[list[i] + "_info"]) {
                            str += get.translation(list[i]) + "、";
                        }
                    }
                    return str.slice(0, str.length - 1);
                }
            },
        },
    },
    zhiti: {
        audio: 2,
        trigger: {
            global: ["juedouAfter", "chooseToCompareAfter", "compareMultipleAfter"],
            player: "damageEnd",
        },
        filter(event, player) {
            if (!player.hasDisabledSlot()) {
                return false;
            }
            if (event.name == "juedou") {
                if (![event.player, event.target].includes(player)) {
                    return false;
                }
                if (!event.turn || event.turn === player) {
                    return false;
                }
                const opposite = event.player === player ? event.target : event.player;
                return opposite?.isIn() && opposite.inRangeOf(player) && opposite.isDamaged();
            } else if (event.name == "damage") {
                const opposite = event.source;
                return opposite?.isIn() && opposite.inRangeOf(player) && opposite.isDamaged();
            } else {
                if (![event.player, event.target].includes(player)) {
                    return false;
                }
                if (event.preserve) {
                    return false;
                }
                let opposite;
                if (player === event.player) {
                    if (event.num1 > event.num2) {
                        opposite = event.target;
                    } else {
                        return false;
                    }
                } else {
                    if (event.num1 < event.num2) {
                        opposite = event.player;
                    } else {
                        return false;
                    }
                }
                return opposite?.isIn() && opposite.inRangeOf(player) && opposite.isDamaged();
            }
        },
        forced: true,
        async content(event, trigger, player) {
            await player.chooseToEnable();
        },
        global: "g_zhiti",
    },
    g_zhiti: {
        mod: {
            maxHandcard(player, num) {
                if (player.isDamaged()) {
                    return (
                        num -
                        game.countPlayer(function (current) {
                            return current != player && current.hasSkill("zhiti") && current.inRange(player);
                        })
                    );
                }
            },
        },
    },
    poxi: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        filterTarget(card, player, target) {
            return target != player && target.countCards("h") > 0;
            //return target!=player;
        },
        async content(event, trigger, player) {
            const { target } = event;
            const playerCards = player.getCards("h");
            const targetCards = target.getCards("h");
            const playerDiscarding = [];
            const targetDiscarding = [];
            event.list1 = playerDiscarding;
            event.list2 = targetDiscarding;

            /** @type {GameEvent} */
            let next;
            if (playerCards.length > 0) {
                next = player.chooseButton(4, ["你的手牌", playerCards, `${get.translation(target.name)}的手牌`, targetCards]);
            } else {
                next = player.chooseButton(4, [`${get.translation(target.name)}的手牌`, target.getCards("h")]);
            }
            next.set("target", target);
            next.set("filterButton", filterButton);
            next.set("ai", processAI);

            const result = await next.forResult();
            if (!result.bool) {
                return;
            }

            // 弃牌
            const cards = result.links;
            for (const card of cards) {
                if (get.owner(card) === player) {
                    playerDiscarding.push(card);
                } else {
                    targetDiscarding.push(card);
                }
            }
            await discardMultiples([
                [player, playerDiscarding],
                [target, targetDiscarding],
            ]);

            switch (playerDiscarding.length) {
                case 0:
                    await player.loseMaxHp();
                    break;
                case 1: {
                    let evt = get.event();
                    const records = new Set();
                    while (true) {
                        if (records.has(evt)) {
                            break;
                        }
                        if (evt && evt.getParent) {
                            records.add(evt);
                            evt = evt.getParent();
                        }
                        if (evt.name === "phaseUse") {
                            evt.skipped = true;
                            break;
                        }
                    }
                    player.addTempSkill("poxi1", { player: "phaseAfter" });
                    break;
                }
                case 3:
                    await player.recover();
                    break;
                case 4:
                    await player.draw(4);
                    break;
            }

            return;

            /**
             * @param {Button} button
             * @returns {boolean}
             */
            function filterButton(button) {
                const player = get.player();

                if (get.owner(button.link) && !lib.filter.canBeDiscarded(button.link, get.owner(button.link), player)) {
                    return false;
                }

                return ui.selected.buttons.every(other => get.suit(button.link) !== get.suit(other.link));
            }

            /**
             * @param {Button} button
             * @returns {number}
             */
            function processAI(button) {
                const { player, target } = get.event();

                const targetCards = target.getCards("h");
                /** @type {Card[]} */
                const chosenCards = ui.selected.buttons.map(buttonx => buttonx.link);
                const targetChosen = chosenCards.filter(card => targetCards.includes(card));

                const card = button.link;
                const owner = get.owner(card);
                const val = get.value(card) || 1;

                if (owner == target) {
                    if (targetChosen.length > 1) {
                        return 0;
                    }
                    if (targetChosen.length == 0 || player.hp > 3) {
                        return val;
                    }
                    return 2 * val;
                }

                return 7 - val;
            }

            /**
             * @param {[Player, Card[]][]} items
             * @returns {GameEvent?}
             */
            async function discardMultiples(items) {
                const losingList = items.filter(([_, cards]) => cards.length);
                if (losingList.length > 1) {
                    return game
                        .loseAsync({
                            lose_list: losingList,
                            discarder: losingList[0][0],
                        })
                        .setContent("discardMultiple");
                } else if (losingList.length === 1) {
                    const [loser, cards] = losingList[0];
                    return loser.discard(cards);
                } else {
                    return null;
                }
            }
        },
        ai: {
            order: 6,
            result: {
                target(target, player) {
                    return -1;
                },
            },
        },
    },
    poxi1: {
        mod: {
            maxHandcard(player, num) {
                return num - 1;
            },
        },
    },
    ljieying: {
        audio: 2,
        trigger: { global: "phaseDrawBegin2" },
        filter(event, player) {
            return !event.numFixed && event.player.hasMark("ljieying_mark");
        },
        forced: true,
        locked: false,
        logTarget: "player",
        async content(event, trigger, player) {
            trigger.num++;
        },
        global: "ljieying_mark",
        group: ["ljieying_1", "ljieying_2", "ljieying_3"],
        subSkill: {
            1: {
                audio: "ljieying",
                trigger: { player: "phaseBegin" },
                filter(event, player) {
                    return !game.hasPlayer(current => current.hasMark("ljieying_mark"));
                },
                forced: true,
                async content(event, trigger, player) {
                    player.addMark("ljieying_mark", 1);
                },
            },
            2: {
                audio: "ljieying",
                trigger: { player: "phaseJieshuBegin" },
                filter(event, player) {
                    return (
                        player.hasMark("ljieying_mark") &&
                        game.hasPlayer(target => {
                            return target != player && !target.hasMark("ljieying_mark");
                        })
                    );
                },
                async cost(event, trigger, player) {
                    const prompt = get.prompt("ljieying");
                    const prompt2 =
                        "将“营”交给一名角色；其摸牌阶段多摸一张牌，出牌阶段使用【杀】的次数上限+1且手牌上限+1。该角色回合结束后，其移去“营”标记，然后你获得其所有手牌。";
                    const filterTarget = (card, player, target) => target !== player && !target.hasMark("ljieying_mark");
                    const next = player.chooseTarget(prompt, prompt2, filterTarget);
                    next.set("ai", processAI);

                    event.result = await next.forResult();

                    return;

                    /**
                     * @param {Player} target
                     * @returns {number}
                     */
                    function processAI(target) {
                        const th = target.countCards("h");
                        const att = get.attitude(_status.event.player, target);
                        for (const skill in target.skills) {
                            const info = get.info(skill);
                            if (!info) {
                                continue;
                            }
                            if (get.skillInfoTranslation(skill, target).includes("【杀】")) {
                                return Math.abs(att);
                            }
                        }
                        if (att > 0) {
                            if (th > 3 && target.hp > 2) {
                                return 0.6 * th;
                            }
                        }
                        if (att < 1) {
                            if (target.countCards("j", { name: "lebu" })) {
                                return 1 + Math.min((1.5 + th) * 0.8, target.getHandcardLimit() * 0.7);
                            }
                            if (!th || target.getEquip("zhangba") || target.getEquip("guanshi")) {
                                return 0;
                            }
                            if (!target.inRange(player) || player.countCards("hs", { name: "shan" }) > 1) {
                                return Math.min((1 + th) * 0.3, target.getHandcardLimit() * 0.2);
                            }
                        }
                        return 0;
                    }
                },
                async content(event, trigger, player) {
                    const { targets } = event;
                    const [target] = targets;

                    const mark = player.countMark("ljieying_mark");
                    player.removeMark("ljieying_mark", mark);
                    target.addMark("ljieying_mark", mark);
                },
                ai: {
                    effect: {
                        player(card, player, target) {
                            if (get.name(card) === "lebu" && get.attitude(player, target) < 0) {
                                return 1 + Math.min((target.countCards("h") + 1.5) * 0.8, target.getHandcardLimit() * 0.7);
                            }
                        },
                    },
                },
            },
            3: {
                audio: "ljieying",
                trigger: { global: "phaseEnd" },
                filter(event, player) {
                    return player != event.player && event.player.hasMark("ljieying_mark") && event.player.isIn();
                },
                forced: true,
                logTarget: "player",
                async content(event, trigger, player) {
                    let next = null;
                    if (trigger.player.countCards("h") > 0) {
                        next = trigger.player.give(trigger.player.getCards("h"), player);
                    }
                    trigger.player.clearMark("ljieying_mark");
                    if (next) {
                        await next;
                    }
                },
            },
            mark: {
                marktext: "营",
                intro: {
                    name2: "营",
                    content: "mark",
                },
                mod: {
                    cardUsable(card, player, num) {
                        if (player.hasMark("ljieying_mark") && card.name == "sha") {
                            return (
                                num +
                                game.countPlayer(function (current) {
                                    return current.hasSkill("ljieying");
                                })
                            );
                        }
                    },
                    maxHandcard(player, num) {
                        if (player.hasMark("ljieying_mark")) {
                            return (
                                num +
                                game.countPlayer(function (current) {
                                    return current.hasSkill("ljieying");
                                })
                            );
                        }
                    },
                    aiOrder(player, card, num) {
                        if (
                            player.hasMark("ljieying_mark") &&
                            game.hasPlayer(current => {
                                return current.hasSkill("ljieying") && current != player && get.attitude(player, current) <= 0;
                            })
                        ) {
                            return Math.max(num, 0) + 1;
                        }
                    },
                },
                ai: {
                    nokeep: true,
                    skillTagFilter(player) {
                        return (
                            player.hasMark("ljieying_mark") &&
                            game.hasPlayer(current => {
                                return current.hasSkill("ljieying") && current != player;
                            })
                        );
                    },
                },
            },
        },
    },
    jx_juejing: {
        mod: {
            maxHandcard(player, num) {
                return 2 + num;
            },
            aiOrder(player, card, num) {
                if (num <= 0 || !player.isPhaseUsing() || !get.tag(card, "recover")) {
                    return num;
                }
                if (player.needsToDiscard() > 1) {
                    return num;
                }
                return 0;
            },
        },
        audio: 2,
        trigger: { player: ["dying", "dyingAfter"] },
        forced: true,
        async content(event, trigger, player) {
            await player.draw();
        },
        ai: {
            effect: {
                target(card, player, target) {
                    if (target.getHp() > 1) {
                        return;
                    }
                    if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
                        return [1, 1];
                    }
                },
            },
        },
    },
    jx_longhun: {
        audio: 2,
        mod: {
            aiOrder(player, card, num) {
                if (num <= 0 || !player.isPhaseUsing() || player.needsToDiscard() < 2) {
                    return num;
                }
                let suit = get.suit(card, player);
                if (suit === "heart") {
                    return num - 3.6;
                }
            },
            aiValue(player, card, num) {
                if (num <= 0) {
                    return num;
                }
                let suit = get.suit(card, player);
                if (suit === "heart") {
                    return num + 3.6;
                }
                if (suit === "club") {
                    return num + 1;
                }
                if (suit === "spade") {
                    return num + 1.8;
                }
            },
            aiUseful(player, card, num) {
                if (num <= 0) {
                    return num;
                }
                let suit = get.suit(card, player);
                if (suit === "heart") {
                    return num + 3;
                }
                if (suit === "club") {
                    return num + 1;
                }
                if (suit === "spade") {
                    return num + 1;
                }
            },
        },
        locked: false,
        //技能发动时机
        enable: ["chooseToUse", "chooseToRespond"],
        //发动时提示的技能描述
        prompt: "将♦牌当做杀，♥牌当做桃，♣牌当做闪，♠牌当做无懈可击使用或打出",
        //动态的viewAs
        viewAs(cards, player) {
            if (cards.length) {
                var name = false,
                    nature = null;
                //根据选择的卡牌的花色 判断要转化出的卡牌是闪还是火杀还是无懈还是桃
                switch (get.suit(cards[0], player)) {
                    case "club":
                        name = "shan";
                        break;
                    case "diamond":
                        name = "sha";
                        nature = "fire";
                        break;
                    case "spade":
                        name = "wuxie";
                        break;
                    case "heart":
                        name = "tao";
                        break;
                }
                //返回判断结果
                if (name) {
                    return { name: name, nature: nature };
                }
            }
            return null;
        },
        //AI选牌思路
        check(card) {
            if (ui.selected.cards.length) {
                return 0;
            }
            var player = _status.event.player;
            if (_status.event.type == "phase") {
                var max = 0;
                var name2;
                var list = ["sha", "tao"];
                var map = { sha: "diamond", tao: "heart" };
                for (var i = 0; i < list.length; i++) {
                    var name = list[i];
                    if (
                        player.countCards("hes", function (card) {
                            return (name != "sha" || get.value(card) < 5) && get.suit(card, player) == map[name];
                        }) > 0 &&
                        player.getUseValue({ name: name, nature: name == "sha" ? "fire" : null }) > 0
                    ) {
                        var temp = get.order({ name: name, nature: name == "sha" ? "fire" : null });
                        if (temp > max) {
                            max = temp;
                            name2 = map[name];
                        }
                    }
                }
                if (name2 == get.suit(card, player)) {
                    return name2 == "diamond" ? 5 - get.value(card) : 20 - get.value(card);
                }
                return 0;
            }
            return 1;
        },
        //选牌数量
        selectCard: [1, 2],
        //确保选择第一张牌后 重新检测第二张牌的合法性 避免选择两张花色不同的牌
        complexCard: true,
        //选牌范围：手牌区和装备区和木马
        position: "hes",
        //选牌合法性判断
        filterCard(card, player, event) {
            //如果已经选了一张牌 那么第二张牌和第一张花色相同即可
            if (ui.selected.cards.length) {
                return get.suit(card, player) == get.suit(ui.selected.cards[0], player);
            }
            event = event || _status.event;
            //获取当前时机的卡牌选择限制
            var filter = event._backup.filterCard;
            //获取卡牌花色
            var name = get.suit(card, player);
            //如果这张牌是梅花并且当前时机能够使用/打出闪 那么这张牌可以选择
            if (name == "club" && filter(get.autoViewAs({ name: "shan" }, "unsure"), player, event)) {
                return true;
            }
            //如果这张牌是方片并且当前时机能够使用/打出火杀 那么这张牌可以选择
            if (name == "diamond" && filter(get.autoViewAs({ name: "sha", nature: "fire" }, "unsure"), player, event)) {
                return true;
            }
            //如果这张牌是黑桃并且当前时机能够使用/打出无懈 那么这张牌可以选择
            if (name == "spade" && filter(get.autoViewAs({ name: "wuxie" }, "unsure"), player, event)) {
                return true;
            }
            //如果这张牌是红桃并且当前时机能够使用/打出桃 那么这张牌可以选择
            if (name == "heart" && filter(get.autoViewAs({ name: "tao" }, "unsure"), player, event)) {
                return true;
            }
            //上述条件都不满足 那么就不能选择这张牌
            return false;
        },
        //判断当前时机能否发动技能
        filter(event, player) {
            //获取当前时机的卡牌选择限制
            var filter = event.filterCard;
            //如果当前时机能够使用/打出火杀并且角色有方片 那么可以发动技能
            if (filter(get.autoViewAs({ name: "sha", nature: "fire" }, "unsure"), player, event) && player.countCards("hes", { suit: "diamond" })) {
                return true;
            }
            //如果当前时机能够使用/打出闪并且角色有梅花 那么可以发动技能
            if (filter(get.autoViewAs({ name: "shan" }, "unsure"), player, event) && player.countCards("hes", { suit: "club" })) {
                return true;
            }
            //如果当前时机能够使用/打出桃并且角色有红桃 那么可以发动技能
            if (filter(get.autoViewAs({ name: "tao" }, "unsure"), player, event) && player.countCards("hes", { suit: "heart" })) {
                return true;
            }
            //如果当前时机能够使用/打出无懈可击并且角色有黑桃 那么可以发动技能
            if (filter(get.autoViewAs({ name: "wuxie" }, "unsure"), player, event) && player.countCards("hes", { suit: "spade" })) {
                return true;
            }
            return false;
        },
        ai: {
            respondSha: true,
            respondShan: true,
            //让系统知道角色“有杀”“有闪”
            skillTagFilter(player, tag) {
                var name;
                switch (tag) {
                    case "respondSha":
                        name = "diamond";
                        break;
                    case "respondShan":
                        name = "club";
                        break;
                    case "save":
                        name = "heart";
                        break;
                }
                if (!player.countCards("hes", { suit: name })) {
                    return false;
                }
            },
            //AI牌序
            order(item, player) {
                if (player && _status.event.type == "phase") {
                    var max = 0;
                    var list = ["sha", "tao"];
                    var map = { sha: "diamond", tao: "heart" };
                    for (var i = 0; i < list.length; i++) {
                        var name = list[i];
                        if (
                            player.countCards("hes", function (card) {
                                return (name != "sha" || get.value(card) < 5) && get.suit(card, player) == map[name];
                            }) > 0 &&
                            player.getUseValue({
                                name: name,
                                nature: name == "sha" ? "fire" : null,
                            }) > 0
                        ) {
                            var temp = get.order({
                                name: name,
                                nature: name == "sha" ? "fire" : null,
                            });
                            if (temp > max) {
                                max = temp;
                            }
                        }
                    }
                    max /= 1.1;
                    return max;
                }
                return 2;
            },
        },
        //让系统知道玩家“有无懈”“有桃”
        hiddenCard(player, name) {
            if (name == "wuxie" && _status.connectMode && player.countCards("hs") > 0) {
                return true;
            }
            if (name == "wuxie") {
                return player.countCards("hes", { suit: "spade" }) > 0;
            }
            if (name == "tao") {
                return player.countCards("hes", { suit: "heart" }) > 0;
            }
        },
        group: ["jx_longhun_num", "jx_longhun_discard"],
        subSkill: {
            num: {
                trigger: { player: "useCard" },
                forced: true,
                popup: false,
                filter(event) {
                    var evt = event;
                    return ["sha", "tao"].includes(evt.card.name) && evt.skill == "jx_longhun" && evt.cards && evt.cards.length == 2;
                },
                async content(event, trigger, player) {
                    trigger.baseDamage++;
                },
            },
            discard: {
                trigger: { player: ["useCardAfter", "respondAfter"] },
                forced: true,
                popup: false,
                logTarget() {
                    return _status.currentPhase;
                },
                autodelay(event) {
                    return event.name == "respond" ? 0.5 : false;
                },
                filter(evt, player) {
                    return (
                        ["shan", "wuxie"].includes(evt.card.name) &&
                        evt.skill == "jx_longhun" &&
                        evt.cards &&
                        evt.cards.length == 2 &&
                        _status.currentPhase &&
                        _status.currentPhase != player &&
                        _status.currentPhase.countDiscardableCards(player, "he")
                    );
                },
                async content(event, trigger, player) {
                    //game.log(trigger.card)
                    //game.log(trigger.cards)
                    player.line(_status.currentPhase, "green");
                    await player.discardPlayerCard(_status.currentPhase, "he", true);
                },
            },
        },
    },
};

export default skills;
