import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
    // 曹昂
    // 慷忾
    kangkai: {
        audio: 2,
        trigger: { global: "useCardToTargeted" },
        filter(event, player) {
            return event.card.name == "sha" && get.distance(player, event.target) <= 1 && event.target.isIn();
        },
        check(event, player) {
            return get.attitude(player, event.target) >= 0;
        },
        preHidden: true,
        logTarget: "target",
        content() {
            "step 0";
            player.draw();
            if (trigger.target != player) {
                player.chooseCard(true, "he", "交给" + get.translation(trigger.target) + "一张牌").set("ai", function (card) {
                    if (get.position(card) == "e") {
                        return -1;
                    }
                    if (card.name == "shan") {
                        return 1;
                    }
                    if (get.type(card) == "equip") {
                        return 0.5;
                    }
                    return 0;
                });
            } else {
                event.finish();
            }
            "step 1";
            player.give(result.cards, trigger.target, "give");
            game.delay();
            event.card = result.cards[0];
            "step 2";
            if (trigger.target.getCards("h").includes(card) && get.type(card) == "equip") {
                trigger.target.chooseUseTarget(card);
            }
        },
        ai: {
            threaten: 1.1,
        },
    },
    // 薛灵芸
    // 思泣
    siqi: {
        audio: 2,
        trigger: { player: "damageEnd" },
        filter(event, player) {
            const cardPile = Array.from(ui.cardPile.childNodes).reverse();
            return cardPile[0] && get.color(cardPile[0]) === "red";
        },
        frequent: true,
        async content(event, trigger, player) {
            let cards = [];
            const cardPile = Array.from(ui.cardPile.childNodes).reverse();
            for (const card of cardPile) {
                if (get.color(card) == "red") {
                    cards.push(card);
                    if (cards.length >= 3 /*event.cost_data*/) {
                        break;
                    }
                } else {
                    break;
                }
            }
            if (!cards.length) {
                return;
            }
            const next = game.cardsGotoOrdering(cards);
            await next;
            cards = next.cards.slice();
            if (!cards.length) {
                return;
            }
            await player.showCards(cards, get.translation(player) + "发动了【思泣】");
            while (cards.length) {
                if (
                    cards.every(card => {
                        const name = ["tao", "wuzhong"];
                        if (name.includes(card.name) || get.type(card) == "equip") {
                            return !game.hasPlayer(target => lib.filter.targetEnabled2(card, player, target));
                        }
                        return true;
                    })
                ) {
                    break;
                }
                const result2 = await player
                    .chooseCardButton({
                        cards,
                        prompt: "思泣：请选择要使用的牌",
                        filter(button) {
                            const card = button.link;
                            if (["tao", "wuzhong"].includes(card.name) || get.type(card) == "equip") {
                                return game.hasPlayer(target => lib.filter.targetEnabled2(card, get.player(), target));
                            }
                            return false;
                        },
                        ai(button) {
                            return get.player().getUseValue(button.link);
                        },
                    })
                    .forResult();
                if (result2.bool) {
                    const card = result2.links[0];
                    game.broadcastAll(card => {
                        lib.skill.siqi_backup.viewAs = card;
                        lib.skill.siqi_backup.card = card;
                    }, card);
                    player.addTempSkill("siqi_target");
                    const next = player.chooseToUse();
                    next.set("openskilldialog", `思泣：请选择${get.translation(card)}的目标`);
                    next.set("forced", true);
                    next.set("norestore", true);
                    next.set("_backupevent", "siqi_backup");
                    next.set("custom", {
                        add: {},
                        replace: { window() { } },
                    });
                    next.backup("siqi_backup");
                    next.set("addCount", false);
                    player
                        .when("chooseToUseBegin")
                        .filter(evt => evt === next)
                        .step(async (event, trigger, player) => (trigger.filterCard = () => false));
                    const result3 = await next.forResult();
                    player.removeSkill("siqi_target");
                    if (result3.bool) {
                        cards.remove(card);
                        continue;
                    }
                }
                break;
            }
            if (cards.length) {
                await player.draw({
                    num: cards.filter(card => {
                        const name = ["tao", "wuzhong"];
                        if (name.includes(card.name) || get.type(card) == "equip") {
                            return !game.hasPlayer(target => lib.filter.targetEnabled2(card, player, target));
                        }
                        return true;
                    }).length,
                });
            }
        },
        group: "siqi_lose",
        subSkill: {
            backup: {
                filterCard: () => false,
                selectCard: -1,
                filterTarget: lib.filter.targetEnabled2,
                log: false,
                async precontent(event, trigger, player) {
                    const { card } = get.info("siqi_backup");
                    event.result.cards = [card];
                    event.result.card = get.autoViewAs(card, [card]);
                },
            },
            lose: {
                audio: "siqi",
                trigger: {
                    player: "loseAfter",
                    global: ["loseAsyncAfter", "cardsDiscardAfter", "equipAfter", "addJudgeAfter", "addToExpansionAfter"],
                },
                filter(event, player) {
                    return event.getd(player, "cards2").some(i => get.color(i, player) === "red");
                },
                forced: true,
                locked: true,
                async content(event, trigger, player) {
                    const list = trigger.getd(player).filter(i => get.color(i, player) === "red");
                    await game.cardsGotoPile(list);
                    game.log(player, "将", list, "置入了牌堆底");
                },
            },
            target: {
                mod: {
                    selectTarget(card, player, range) {
                        if (_status._siqi_check) {
                            return;
                        }
                        const event = get.event();
                        if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
                            return;
                        }
                        _status._siqi_check = true;
                        const bool = game.countPlayer(target => lib.filter.targetEnabled2(card, player, target)) > 1;
                        delete _status._siqi_check;
                        if (bool) {
                            if (range[0] !== 1) {
                                range[0] = 1;
                            }
                            if (range[1] !== 1) {
                                range[1] = 1;
                            }
                        }
                    },
                    cardEnabled2(card, player) {
                        if (_status._siqi_check) {
                            return;
                        }
                        const event = get.event();
                        if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
                            return;
                        }
                        _status._siqi_check = true;
                        const bool = game.hasPlayer(target => lib.filter.targetEnabled2(card, player, target));
                        delete _status._siqi_check;
                        if (bool) {
                            return true;
                        }
                    },
                    cardEnabled(card, player) {
                        if (_status._siqi_check) {
                            return;
                        }
                        const event = get.event();
                        if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
                            return;
                        }
                        _status._siqi_check = true;
                        const bool = game.hasPlayer(target => lib.filter.targetEnabled2(card, player, target));
                        delete _status._siqi_check;
                        if (bool) {
                            return true;
                        }
                    },
                    playerEnabled(card, player, target) {
                        if (_status._siqi_check) {
                            return;
                        }
                        const event = get.event();
                        if (!event || event.name !== "chooseToUse" || event.getParent().name !== "siqi") {
                            return;
                        }
                        _status._siqi_check = true;
                        const bool = lib.filter.targetEnabled2(card, player, target);
                        delete _status._siqi_check;
                        if (bool) {
                            return true;
                        }
                    },
                },
                charlotte: false,
            },
        },
    },
    // 巧织
    qiaozhi: {
        audio: 2,
        enable: "phaseUse",
        filter(event, player) {
            if (!player.hasCard(card => lib.filter.cardDiscardable(card, player), "he")) {
                return false;
            }
            return !player.hasCard(card => card.hasGaintag("qiaozhi"), "h");
        },
        filterCard: lib.filter.cardDiscardable,
        position: "he",
        check(card) {
            const player = get.player();
            return 7 - get.value(card) + (player.hasSkill("olshqi") && get.color(card) === "red" ? 3 : 0);
        },
        async content(event, trigger, player) {
            const next = game.cardsGotoOrdering(get.cards(2));
            await next;
            const cards = next.cards;
            const videoId = lib.status.videoId++;
            game.broadcastAll(
                (player, id, cards) => {
                    const dialog = ui.create.dialog(get.translation(player) + "发动了【巧织】", cards);
                    dialog.videoId = id;
                },
                player,
                videoId,
                cards
            );
            const time = get.utc();
            game.addVideo("showCards", player, [get.translation(player) + "发动了【巧织】", get.cardsInfo(cards)]);
            await game.delay(2.5);
            game.broadcastAll(
                (player, id) => {
                    const dialog = get.idDialog(id);
                    if (player === game.me && !_status.auto) {
                        dialog.content.childNodes[0].textContent = "巧织：选择获得其中一张牌";
                    }
                },
                player,
                videoId
            );
            const { links } = await player
                .chooseButton([1, 1], true)
                .set("ai", button => {
                    return Math.max(get.value(button.link), get.useful(button.link));
                })
                .set("dialog", videoId)
                .forResult();
            const time2 = 1000 - (get.utc() - time);
            if (time2 > 0) {
                await game.delay(0, time2);
            }
            game.broadcastAll("closeDialog", videoId);
            if (!links?.length) {
                return;
            }
            const next2 = player.gain(links, "gain2");
            next2.gaintag.add("qiaozhi");
            await next2;
        },
        ai: {
            order: 1,
            result: { player: 1 },
        },
    },
    // 夏侯玄
    // 宦浮
    huanfu: {
        audio: 2,
        trigger: {
            player: "useCardToPlayered",
            target: "useCardToTargeted",
        },
        filter(event, player) {
            if (event.card.name != "sha") {
                return false;
            }
            if (player == event.player && !event.isFirstTarget) {
                return false;
            }
            if (event.huanfu_map && event.huanfu_map[player.playerid]) {
                return false;
            }
            return player.maxHp > 0 && player.countCards("he") > 0;
        },
        direct: true,
        content() {
            "step 0";
            player
                .chooseToDiscard(
                    "he",
                    [1, player.maxHp],
                    get.prompt("huanfu"),
                    "通过弃牌，预测" +
                    (player == trigger.player ? "你" : get.translation(trigger.player)) +
                    "使用的" +
                    get.translation(trigger.card) +
                    "能造成多少伤害。如果弃置的牌数等于总伤害，则你摸两倍的牌。",
                    "allowChooseAll"
                )
                .set(
                    "predict",
                    (function () {
                        var target = trigger.target;
                        if (player == target) {
                            if (trigger.targets.length > 1 || player.hasShan() || get.effect(player, trigger.card, trigger.player, player) == 0) {
                                return 0;
                            }
                        } else {
                            var target = trigger.target;
                            if (trigger.targets.length > 1 || target.mayHaveShan(player, "use")) {
                                return 0;
                            }
                        }
                        var num = trigger.getParent().baseDamage;
                        var map = trigger.getParent().customArgs,
                            id = target.playerid;
                        if (map[id]) {
                            if (typeof map[id].baseDamage == "number") {
                                num = map[id].baseDamage;
                            }
                            if (typeof map[id].extraDamage == "number") {
                                num += map[id].extraDamage;
                            }
                        }
                        if (
                            target.hasSkillTag("filterDamage", null, {
                                player: trigger.player,
                                card: trigger.card,
                            })
                        ) {
                            num = 1;
                        }
                        return num;
                    })()
                )
                .set("ai", function (card) {
                    var num = _status.event.predict,
                        player = _status.event.player;
                    if (ui.selected.cards.length >= num) {
                        return 0;
                    }
                    if (
                        player.countCards("he", function (card) {
                            return get.value(card) < 6 + num;
                        }) < num
                    ) {
                        return 0;
                    }
                    return 6 + num - get.value(card);
                }).logSkill = "huanfu";
            "step 1";
            if (result.bool) {
                player.addTempSkill("huanfu_lottery");
                var evt = trigger.getParent();
                if (!evt.huanfu_map) {
                    evt.huanfu_map = {};
                }
                evt.huanfu_map[player.playerid] = result.cards.length;
            }
        },
        ai: {
            effect: {
                target_use(card, player, target, current) {
                    if (card.name == "sha" && target.hp > 0 && current < 0 && target.countCards("he") > 0) {
                        return 0.7;
                    }
                },
            },
        },
        subSkill: {
            lottery: {
                audio: "huanfu",
                trigger: { global: "useCardAfter" },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    var map = event.huanfu_map;
                    if (!map || !map[player.playerid]) {
                        return false;
                    }
                    var num = 0;
                    event.player.getHistory("sourceDamage", function (evt) {
                        if (evt.card == event.card && evt.getParent().type == "card") {
                            num += evt.num;
                        }
                    });
                    return num == map[player.playerid];
                },
                content() {
                    player.draw(2 * trigger.huanfu_map[player.playerid]);
                },
            },
        },
    },
    // 清议
    qingyi: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return (
                player.hasCard(function (card) {
                    return lib.filter.cardDiscardable(card, player, "qingyi");
                }, "he") && game.hasPlayer(current => lib.skill.qingyi.filterTarget(null, player, current))
            );
        },
        selectTarget: [1, 2],
        filterTarget(card, player, target) {
            return target != player && target.countCards("he") > 0;
        },
        multitarget: true,
        multiline: true,
        content() {
            "step 0";
            var list = [player];
            list.addArray(targets);
            list.sortBySeat();
            event.list = list;
            for (var target of event.list) {
                if (
                    !target.hasCard(function (card) {
                        return lib.filter.cardDiscardable(card, target, "qingyi");
                    }, "he")
                ) {
                    event.finish();
                    break;
                }
            }
            "step 1";
            player
                .chooseCardOL(event.list, "he", true, "清议：选择弃置一张牌", function (card, player) {
                    return lib.filter.cardDiscardable(card, player, "qingyi");
                })
                .set("ai", get.unuseful);
            "step 2";
            var lose_list = [],
                cards = [];
            for (var i = 0; i < result.length; i++) {
                var current = event.list[i],
                    card = result[i].cards[0];
                lose_list.push([current, result[i].cards]);
                cards.push(card);
            }
            game.loseAsync({
                lose_list: lose_list,
            }).setContent("discardMultiple");
            var type = get.type2(cards[0]);
            for (var i = 1; i < cards.length; i++) {
                if (get.type2(cards[i]) != type) {
                    event.finish();
                }
            }
            "step 3";
            event.goto(1);
            for (var target of event.list) {
                if (
                    !target.hasCard(function (card) {
                        return lib.filter.cardDiscardable(card, target, "qingyi");
                    }, "he")
                ) {
                    event.finish();
                    break;
                }
            }
        },
        ai: {
            threaten: 1.2,
            order: 9.1,
            result: {
                player(player) {
                    let min = 24;
                    player.countCards("he", function (card) {
                        min = Math.min(min, get.value(card));
                    });
                    if (ui.selected.targets.length == 1) {
                        return 1 - min / 6;
                    }
                    return 0.75 - min / 48;
                },
                target(player, target) {
                    if (
                        target.hasCard(function (card) {
                            return lib.filter.cardDiscardable(card, player, "qingyi");
                        }, "he")
                    ) {
                        return -1;
                    }
                    return 0;
                },
            },
        },
        group: "qingyi_gain",
        subSkill: {
            gain: {
                audio: "qingyi",
                trigger: { player: "phaseJieshuBegin" },
                direct: true,
                filter(event, player) {
                    var history = player.getHistory("useSkill", evt => evt.skill == "qingyi");
                    if (!history.length) {
                        return false;
                    }
                    var color = false;
                    for (var evt of history) {
                        var list = [player];
                        list.addArray(evt.targets);
                        for (var target of list) {
                            target.getHistory("lose", function (evtx) {
                                if (color === true || evtx.getParent(2).name != "qingyi") {
                                    return false;
                                }
                                for (var card of evtx.cards) {
                                    if (color === true || get.position(card, true) != "d") {
                                        continue;
                                    }
                                    var color2 = get.color(card, false);
                                    if (!color) {
                                        color = color2;
                                    } else if (color != color2) {
                                        color = true;
                                    }
                                }
                            });
                            if (color === true) {
                                return true;
                            }
                        }
                    }
                    return false;
                },
                content() {
                    "step 0";
                    var history = player.getHistory("useSkill", evt => evt.skill == "qingyi"),
                        cards = [];
                    for (var evt of history) {
                        var list = [player];
                        list.addArray(evt.targets);
                        for (var target of list) {
                            target.getHistory("lose", function (evtx) {
                                if (evtx.getParent(2).name != "qingyi") {
                                    return false;
                                }
                                for (var card of evtx.cards) {
                                    if (get.position(card, true) == "d") {
                                        cards.add(card);
                                    }
                                }
                            });
                        }
                    }
                    player
                        .chooseButton(["清议：选择获得两张异色牌", cards], 2)
                        .set("filterButton", function (button) {
                            if (!ui.selected.buttons.length) {
                                return true;
                            }
                            return get.color(button.link, false) != get.color(ui.selected.buttons[0].link, false);
                        })
                        .set("ai", function (button) {
                            return get.value(button.link, _status.event.player);
                        });
                    "step 1";
                    if (result.bool) {
                        player.logSkill("qingyi_gain");
                        player.gain(result.links, "gain2");
                    }
                },
            },
        },
    },
    // 迮阅
    zeyue: {
        audio: 2,
        trigger: { player: "phaseZhunbeiBegin" },
        limited: true,
        skillAnimation: true,
        animationColor: "water",
        direct: true,
        filter(event, player) {
            var sources = [],
                history = player.actionHistory;
            for (var i = history.length - 1; i >= 0; i--) {
                if (i < history.length - 1 && history[i].isMe) {
                    break;
                }
                for (var evt of history[i].damage) {
                    if (evt.source && evt.source != player && evt.source.isIn()) {
                        sources.add(evt.source);
                    }
                }
            }
            for (var source of sources) {
                var skills = source.getStockSkills("一！", "五！");
                for (var skill of skills) {
                    var info = get.info(skill);
                    if (
                        info &&
                        !info.persevereSkill &&
                        !info.charlotte &&
                        !get.is.locked(skill, source) &&
                        source.hasSkill(skill, null, null, false)
                    ) {
                        return true;
                    }
                }
            }
            return false;
        },
        content() {
            "step 0";
            var sources = [],
                history = player.actionHistory;
            for (var i = history.length - 1; i >= 0; i--) {
                if (i < history.length - 1 && history[i].isMe) {
                    break;
                }
                for (var evt of history[i].damage) {
                    if (evt.source && evt.source != player && evt.source.isIn()) {
                        sources.add(evt.source);
                    }
                }
            }
            sources = sources.filter(function (source) {
                var skills = source.getStockSkills("一！", "五！");
                for (var skill of skills) {
                    var info = get.info(skill);
                    if (
                        info &&
                        !info.persevereSkill &&
                        !info.charlotte &&
                        !get.is.locked(skill, source) &&
                        source.hasSkill(skill, null, null, false)
                    ) {
                        return true;
                    }
                }
                return false;
            });
            player
                .chooseTarget(get.prompt("zeyue"), "令一名可选角色的一个非锁定技失效", function (card, player, target) {
                    return _status.event.sources.includes(target);
                })
                .set("sources", sources)
                .set("ai", function (target) {
                    var player = _status.event.player,
                        att = get.attitude(player, target);
                    if (att >= 0) {
                        return 0;
                    }
                    return get.threaten(target, player);
                });
            "step 1";
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill("zeyue", target);
                player.awakenSkill(event.name);
                event.target = target;
                var skills = target.getStockSkills("一！", "五！");
                skills = skills.filter(function (skill) {
                    var info = get.info(skill);
                    if (info && !info.charlotte && !get.is.locked(skill, target) && target.hasSkill(skill, null, null, false)) {
                        return true;
                    }
                });
                if (skills.length == 1) {
                    event._result = { control: skills[0] };
                } else {
                    player.chooseControl(skills).set("prompt", "令" + get.translation(target) + "的一个技能失效");
                }
            } else {
                event.finish();
            }
            "step 2";
            var skill = result.control;
            target.disableSkill("zeyue_" + player.playerid, skill);
            target.storage["zeyue_" + player.playerid] = true;
            player.addSkill("zeyue_round");
            player.markAuto("zeyue_round", [target]);
            if (!player.storage.zeyue_map) {
                player.storage.zeyue_map = {};
            }
            player.storage.zeyue_map[target.playerid] = 0;
            game.log(target, "的技能", "#g【" + get.translation(skill) + "】", "被失效了");
        },
        ai: { threaten: 3 },
        subSkill: {
            round: {
                charlotte: true,
                trigger: { global: "roundEnd" },
                filter(event, player) {
                    var storage = player.getStorage("zeyue_round");
                    for (var source of storage) {
                        if (source.isIn() && source.canUse("sha", player, false)) {
                            return true;
                        }
                    }
                    return false;
                },
                forced: true,
                popup: false,
                content() {
                    "step 0";
                    event.targets = player.storage.zeyue_round.slice(0).sortBySeat();
                    event.target = event.targets.shift();
                    event.forceDie = true;
                    "step 1";
                    var map = player.storage.zeyue_map;
                    if (target.storage["zeyue_" + player.playerid]) {
                        map[target.playerid]++;
                    }
                    event.num = map[target.playerid] - 1;
                    if (event.num <= 0) {
                        event.finish();
                    }
                    "step 2";
                    event.num--;
                    target.useCard(player, { name: "sha", isCard: true }, false, "zeyue_round");
                    "step 3";
                    var key = "zeyue_" + player.playerid;
                    if (
                        target.storage[key] &&
                        player.hasHistory("damage", function (evt) {
                            return evt.card.name == "sha" && evt.getParent().type == "card" && evt.getParent(3) == event;
                        })
                    ) {
                        for (var skill in target.disabledSkills) {
                            if (target.disabledSkills[skill].includes(key)) {
                                game.log(target, "恢复了技能", "#g【" + get.translation(skill) + "】");
                            }
                        }
                        delete target.storage[key];
                        target.enableSkill(key);
                    }
                    if (event.num > 0 && player.isIn() && target.isIn() && target.canUse("sha", player, false)) {
                        event.goto(2);
                    } else if (event.targets.length > 0) {
                        event.target = event.targets.shift();
                        event.goto(1);
                    }
                },
            },
        },
    },
    // 阎柔
    // 仇讨
    choutao: {
        audio: 2,
        trigger: {
            player: "useCard",
            target: "useCardToTargeted",
        },
        filter(event, player) {
            if (event.card.name != "sha" || !event.player.isIn()) {
                return false;
            }
            if (player == event.player) {
                return player.hasCard(function (card) {
                    return lib.filter.cardDiscardable(card, player, "choutao");
                }, "he");
            }
            return event.player.hasCard(function (card) {
                return lib.filter.canBeDiscarded(card, player, event.player);
            }, "he");
        },
        check(event, player) {
            if (player == event.player) {
                if (
                    !player.hasCard(function (card) {
                        return get.value(card) <= 5;
                    }, "he")
                ) {
                    return false;
                }
                for (var i of event.targets) {
                    var eff1 = get.damageEffect(i, player, player);
                    if (eff1 < 0) {
                        return false;
                    }
                    if (i.hasShan() && eff1 > 0) {
                        return true;
                    }
                }
                var sha = false;
                return (
                    player.getCardUsable({ name: "sha" }) <= 0 &&
                    player.hasCard(function (card) {
                        if (!sha && get.name(card) == "sha" && player.getUseValue(card) > 0) {
                            sha = true;
                            return false;
                        }
                        return sha && get.value(card) <= 5;
                    }, "hs")
                );
            } else {
                var eff1 = get.effect(event.player, { name: "guohe_copy2" }, player, player);
                var eff2 = get.damageEffect(player, event.player, player);
                if (!player.hasShan()) {
                    return eff1 > 0;
                }
                if (eff2 > 0) {
                    return eff1 > 0;
                }
                return player.hp > 2 && eff2 < eff1;
            }
        },
        logTarget: "player",
        content() {
            "step 0";
            if (player != game.me && !player.isOnline() && !player.isUnderControl()) {
                game.delayx();
            }
            if (player == trigger.player) {
                player.chooseToDiscard("he", true).set("ai", function (card) {
                    var player = _status.event.player;
                    var val = player.getUseValue(card);
                    if (get.name(card) == "sha" && player.getUseValue(card) > 0) {
                        val += 5;
                    }
                    return 20 - val;
                });
            } else {
                player.discardPlayerCard(trigger.player, true, "he");
            }
            "step 1";
            trigger.directHit.addArray(game.players);
            if (player == trigger.player && trigger.addCount !== false) {
                trigger.addCount = false;
                const stat = player.getStat().card,
                    name = trigger.card.name;
                if (typeof stat[name] === "number") {
                    stat[name]--;
                }
            }
        },
    },
    // 襄戍
    xiangshu: {
        audio: 2,
        trigger: { player: "phaseJieshuBegin" },
        direct: true,
        limited: true,
        skillAnimation: true,
        animationColor: "gray",
        filter(event, player) {
            return (player.getStat("damage") || 0) > 0 && game.hasPlayer(current => current.isDamaged());
        },
        content() {
            "step 0";
            event.num = Math.min(5, player.getStat("damage"));
            player
                .chooseTarget(
                    "是否发动限定技【襄戍】？",
                    "令一名角色回复" + event.num + "点体力并摸" + get.cnNumber(event.num) + "张牌",
                    function (card, player, target) {
                        return target.isDamaged();
                    }
                )
                .set("ai", function (target) {
                    var num = _status.event.getParent().num,
                        player = _status.event.player;
                    var att = get.attitude(player, target);
                    if (att > 0 && num >= Math.min(player.hp, 2)) {
                        return att * Math.sqrt(target.getDamagedHp());
                    }
                    return 0;
                });
            "step 1";
            if (result.bool) {
                var target = result.targets[0];
                player.awakenSkill(event.name);
                player.logSkill("xiangshu", target);
                target.recover(num);
                target.draw(num);
                if (player != target) {
                    player.addExpose(0.2);
                }
            }
        },
    },
    zengou: {
        audio: 2,
        trigger: { global: "useCard" },
        filter(event, player) {
            return (
                event.card.name == "shan" &&
                player.inRange(event.player) &&
                (player.hp > 0 ||
                    player.hasCard(function (card) {
                        return get.type(card) != "basic" && lib.filter.cardDiscardable(card, player, "zengou");
                    }, "eh"))
            );
        },
        logTarget: "player",
        check(event, player) {
            if (get.attitude(player, event.player) >= 0) {
                return false;
            }
            if (get.damageEffect(event.player, event.getParent(3).player, player, get.nature(event.card)) <= 0) {
                return false;
            }
            if (
                player.hasCard(function (card) {
                    return get.type(card) != "basic" && get.value(card) < 7 && lib.filter.cardDiscardable(card, player, "zengou");
                }, "eh")
            ) {
                return true;
            }
            return player.hp > Math.max(1, event.player.hp);
        },
        content() {
            "step 0";
            trigger.all_excluded = true;
            var str = "弃置一张非基本牌";
            if (player.hp > 0) {
                str += "，或点「取消」失去1点体力";
            }
            var next = player
                .chooseToDiscard(
                    str,
                    function (card) {
                        return get.type(card) != "basic";
                    },
                    "he"
                )
                .set("ai", function (card) {
                    return 7 - get.value(card);
                });
            if (player.hp <= 0) {
                next.set("forced", true);
            }
            "step 1";
            if (!result.bool) {
                player.loseHp();
            }
            "step 2";
            var cards = trigger.cards.filterInD();
            if (cards.length) {
                player.gain(cards, "gain2");
            }
        },
    },
    zhangji: {
        audio: 2,
        trigger: { global: "phaseJieshuBegin" },
        direct: true,
        filter(event, player) {
            if (!event.player.isIn()) {
                return false;
            }
            if (player.getHistory("sourceDamage").length > 0) {
                return true;
            }
            if (player.getHistory("damage").length > 0) {
                return event.player.countCards("he") > 0;
            }
            return false;
        },
        content() {
            "step 0";
            event.target = trigger.player;
            if (player.getHistory("sourceDamage").length) {
                player
                    .chooseBool(get.prompt("zhangji", event.target), "令" + get.translation(event.target) + "摸两张牌")
                    .set("choice", get.attitude(player, event.target) > 0)
                    .set("ai", () => _status.event.choice);
            } else {
                event.goto(2);
            }
            "step 1";
            if (result.bool) {
                player.logSkill("zhangji", target);
                event.logged = true;
                target.draw(2);
            }
            "step 2";
            if (target.isIn() && target.countCards("he") > 0 && player.getHistory("damage").length > 0) {
                player
                    .chooseBool(get.prompt("zhangji", event.target), "令" + get.translation(event.target) + "弃置两张牌")
                    .set("choice", get.attitude(player, event.target) < 0)
                    .set("ai", () => _status.event.choice);
            } else {
                event.finish();
            }
            "step 3";
            if (result.bool) {
                if (!event.logged) {
                    player.logSkill("zhangji", target);
                }
                target.chooseToDiscard("he", true, 2);
            }
        },
    },
    zhimin: {
        audio: 2,
        trigger: { global: "roundStart" },
        filter(event, player) {
            return game.hasPlayer(current => current != player && current.countCards("h")) && player.getHp() > 0;
        },
        forced: true,
        group: ["zhimin_mark", "zhimin_draw"],
        async content(event, trigger, player) {
            const result = await player
                .chooseTarget(
                    `置民：请选择至多${get.cnNumber(player.getHp())}名其他角色`,
                    "你获得这些角色各自手牌中的随机一张点数最小的牌",
                    (card, player, target) => {
                        return target !== player && target.countCards("h");
                    },
                    [1, player.getHp()],
                    true
                )
                .set("ai", target => {
                    const player = get.player();
                    return get.effect(target, { name: "shunshou_copy", position: "h" }, player, player) + 0.1;
                })
                .forResult();
            if (!result?.targets?.length) {
                return;
            }
            const targets = result.targets.sortBySeat();
            player.line(targets, "thunder");
            const toGain = [];
            for (const target of targets) {
                const cards = target.getCards("h"),
                    minNumber = cards.map(card => get.number(card)).sort((a, b) => a - b)[0];
                const gainableCards = cards
                    .filter(card => {
                        return get.number(card) === minNumber && lib.filter.canBeGained(card, player, target);
                    })
                    .randomSort();
                toGain.push(gainableCards[0]);
            }
            if (toGain.length) {
                await player.gain(toGain, "giveAuto");
            }
            await game.delayx();
        },
        ai: { threaten: 5.8 },
        mod: {
            aiOrder(player, card, num) {
                if (
                    num > 0 &&
                    get.itemtype(card) === "card" &&
                    card.hasGaintag("zhimin_tag") &&
                    player.countCards("h", cardx => {
                        return cardx.hasGaintag("zhimin_tag") && cardx !== card;
                    }) < player.maxHp
                ) {
                    return num / 10;
                }
            },
        },
        subSkill: {
            mark: {
                audio: "zhimin",
                trigger: {
                    player: "gainAfter",
                    global: "loseAsyncAfter",
                },
                forced: true,
                filter(event, player) {
                    if (
                        _status.currentPhase === player ||
                        !event.getg(player).some(card => get.position(card) === "h" && get.owner(card) === player)
                    ) {
                        return false;
                    }
                    return true;
                },
                async content(event, trigger, player) {
                    player.addGaintag(
                        trigger.getg(player).filter(card => get.position(card) === "h" && get.owner(card) === player),
                        "zhimin_tag"
                    );
                },
            },
            draw: {
                audio: "zhimin",
                trigger: {
                    player: "loseAfter",
                    global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
                },
                forced: true,
                filter(event, player) {
                    const evt = event.getl(player);
                    if (!evt.hs.length || player.maxHp <= player.countCards("h")) {
                        return false;
                    }
                    return Object.values(evt.gaintag_map).flat().includes("zhimin_tag");
                },
                async content(event, trigger, player) {
                    await player.drawTo(player.maxHp);
                },
            },
        },
    },
    jujian: {
        audio: 2,
        enable: "phaseUse",
        usable: 1,
        zhuSkill: true,
        filter(event, player) {
            return game.hasPlayer(current => {
                return player.hasZhuSkill("jujian", current) && current.group === "wei" && current !== player;
            });
        },
        filterTarget(_, player, target) {
            return player.hasZhuSkill("jujian", target) && target.group === "wei" && target !== player;
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            await target.draw();
            target.addTempSkill("jujian_forbid", "roundStart");
            target.markAuto("jujian_forbid", player);
        },
        ai: {
            result: {
                target(player, target) {
                    const num = target.countCards("hs", card => {
                        return get.type(card) == "trick" && target.canUse(card, player) && get.effect(player, card, target, player) < -2;
                    }),
                        att = get.attitude(player, target);
                    if (att < 0) {
                        return -0.74 * num;
                    }
                    return 1.5;
                },
            },
        },
        subSkill: {
            forbid: {
                audio: "jujian",
                trigger: {
                    player: "useCardToBefore",
                },
                filter(event, player) {
                    if (get.type(event.card) !== "trick") {
                        return false;
                    }
                    return player.getStorage("jujian_forbid").includes(event.target);
                },
                forced: true,
                charlotte: true,
                onremove: true,
                direct: true,
                async content(event, trigger, player) {
                    await trigger.target.logSkill("jujian_forbid", player);
                    trigger.cancel();
                },
                intro: {
                    content: "使用普通锦囊牌对$无效",
                },
                ai: {
                    effect: {
                        player(card, player, target, current) {
                            if (get.type(card) == "trick" && player.getStorage("jujian_forbid").includes(target)) {
                                return "zeroplayertarget";
                            }
                        },
                    },
                },
            },
        },
    },
};

export default skills;
