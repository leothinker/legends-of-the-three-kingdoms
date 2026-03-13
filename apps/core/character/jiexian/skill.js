import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	// 界刘备
	// 仁德
	jx_rende: {
		audio: 2,
		audioname: ["gz_jun_liubei"],
		audioname2: { shen_caopi: "jx_rende_shen_caopi" },
		enable: "phaseUse",
		filter(event, player) {
			return player.countCards("h") && game.hasPlayer(current => get.info("jx_rende").filterTarget(null, player, current));
		},
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			return !player.getStorage("jx_rende_targeted").includes(target);
		},
		filterCard: true,
		selectCard: [1, Infinity],
		allowChooseAll: true,
		discard: false,
		lose: false,
		delay: false,
		check(card) {
			if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
				return 0;
			}
			if (!ui.selected.cards.length && card.name == "du") {
				return 20;
			}
			var player = get.owner(card);
			if (ui.selected.cards.length >= Math.max(2, player.countCards("h") - player.hp)) {
				return 0;
			}
			if (player.hp == player.maxHp || player.countMark("jx_rende") < 0 || player.countCards("h") <= 1) {
				var players = game.filterPlayer();
				for (var i = 0; i < players.length; i++) {
					if (
						players[i].hasSkill("haoshi") &&
						!players[i].isTurnedOver() &&
						!players[i].hasJudge("lebu") &&
						get.attitude(player, players[i]) >= 3 &&
						get.attitude(players[i], player) >= 3
					) {
						return 11 - get.value(card);
					}
				}
				if (player.countCards("h") > player.hp) {
					return 10 - get.value(card);
				}
				if (player.countCards("h") > 2) {
					return 6 - get.value(card);
				}
				return -1;
			}
			return 10 - get.value(card);
		},
		async content(event, trigger, player) {
			const { target, cards, name } = event;
			player.addTempSkill(name + "_targeted", "phaseUseAfter");
			player.markAuto(name + "_targeted", [target]);
			let num = 0;
			player.getHistory("lose", evt => {
				if (evt.getParent(2).name == name && evt.getParent("phaseUse") == event.getParent(3)) {
					num += evt.cards.length;
				}
			});
			if (!player.storage[event.name]) {
				player.when({ player: "phaseUseEnd" }).step(async () => {
					player.clearMark(event.name, false);
				});
			}
			player.addMark(event.name, num + cards.length, false);
			await player.give(cards, target);
			const list = get.inpileVCardList(info => {
				return info[0] == "basic" && player.hasUseTarget(new lib.element.VCard({ name: info[2], nature: info[3], isCard: true }), null, true);
			});
			if (num < 2 && num + cards.length > 1 && list.length) {
				const result = await player
					.chooseButton(["是否视为使用一张基本牌？", [list, "vcard"]])
					.set("ai", button => {
						return get.player().getUseValue({ name: button.link[2], nature: button.link[3], isCard: true });
					})
					.forResult();
				if (!result?.links?.length) {
					return;
				}
				await player.chooseUseTarget(get.autoViewAs({ name: result.links[0][2], nature: result.links[0][3], isCard: true }), true);
			}
		},
		ai: {
			fireAttack: true,
			order(skill, player) {
				if (player.hp < player.maxHp && player.countMark("jx_rende") < 2 && player.countCards("h") > 1) {
					return 10;
				}
				return 4;
			},
			result: {
				target(player, target) {
					if (target.hasSkillTag("nogain")) {
						return 0;
					}
					if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
						if (target.hasSkillTag("nodu")) {
							return 0;
						}
						return -10;
					}
					if (target.hasJudge("lebu")) {
						return 0;
					}
					var nh = target.countCards("h");
					var np = player.countCards("h");
					if (player.hp == player.maxHp || player.countMark("jx_rende") < 0 || player.countCards("h") <= 1) {
						if (nh >= np - 1 && np <= player.hp && !target.hasSkill("haoshi")) {
							return 0;
						}
					}
					return Math.max(1, 5 - nh);
				},
			},
			effect: {
				target_use(card, player, target) {
					if (player == target && get.type(card) == "equip") {
						if (player.countCards("e", { subtype: get.subtype(card) })) {
							if (game.hasPlayer(current => current != player && get.attitude(player, current) > 0)) {
								return 0;
							}
						}
					}
				},
			},
			threaten: 0.8,
		},
		marktext: "仁",
		onremove: true,
		intro: {
			content: "本阶段已仁德牌数：#",
			onunmark: true,
		},
		subSkill: {
			targeted: {
				onremove: true,
				charlotte: true,
			},
		},
	},
	// 界关羽
	// 武圣
	jx_wusheng: {
		mod: {
			targetInRange(card) {
				if (get.suit(card) == "diamond" && card.name == "sha") {
					return true;
				}
			},
		},
		locked: false,
		audio: "wusheng",
		audioname: ["re_guanyu", "jsp_guanyu", "re_guanzhang", "dc_jsp_guanyu"],
		audioname2: {
			dc_guansuo: "wusheng_guansuo",
			guanzhang: "wusheng_guanzhang",
			guansuo: "wusheng_guansuo",
			gz_jun_liubei: "shouyue_wusheng",
			std_guanxing: "wusheng_guanzhang",
			ty_guanxing: "wusheng_guanzhang",
			ol_guanzhang: "wusheng_ol_guanzhang",
		},
		enable: ["chooseToRespond", "chooseToUse"],
		filterCard(card, player) {
			if (get.zhu(player, "shouyue")) {
				return true;
			}
			return get.color(card) == "red";
		},
		position: "hes",
		viewAs: {
			name: "sha",
		},
		viewAsFilter(player) {
			if (get.zhu(player, "shouyue")) {
				if (!player.countCards("hes")) {
					return false;
				}
			} else {
				if (!player.countCards("hes", { color: "red" })) {
					return false;
				}
			}
		},
		prompt: "将一张红色牌当杀使用或打出",
		check(card) {
			var val = get.value(card);
			if (_status.event.name == "chooseToRespond") {
				return 1 / Math.max(0.1, val);
			}
			return 5 - val;
		},
		ai: {
			respondSha: true,
			skillTagFilter(player) {
				if (get.zhu(player, "shouyue")) {
					if (!player.countCards("hes")) {
						return false;
					}
				} else {
					if (!player.countCards("hes", { color: "red" })) {
						return false;
					}
				}
			},
		},
	},
	// 义绝
	yijue: {
		initSkill(skill) {
			if (!lib.skill[skill]) {
				lib.skill[skill] = {
					charlotte: true,
					onremove: true,
					mark: true,
					marktext: "绝",
					intro: {
						markcount: () => 0,
						content: storage => `本回合不能使用或打出手牌、非锁定技失效且受到${get.translation(storage[1])}红桃【杀】的伤害+1`,
					},
					group: "yijue_ban",
				};
				lib.translate[skill] = "义绝";
				lib.translate[skill + "_bg"] = "绝";
			}
		},
		audio: "yijue",
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return player != target && target.countCards("h");
		},
		filterCard: lib.filter.cardDiscardable,
		position: "he",
		check(card) {
			return 8 - get.value(card);
		},
		async content(event, trigger, player) {
			const { target } = event;
			if (!target.countCards("h")) {
				return;
			}
			const result = await target
				.chooseCard(true, "h")
				.set("ai", card => {
					const player = get.player();
					if (get.color(card) == "black") {
						return 18 - get.event().black - get.value(card);
					}
					return 18 - get.value(card);
				})
				.set(
					"black",
					(() => {
						if (get.attitude(target, player) > 0) {
							return 18;
						}
						if (
							target.hasCard(card => {
								const name = get.name(card, target);
								return name === "shan" || name === "tao" || (name === "jiu" && target.hp < 3);
							})
						) {
							return 18 / target.hp;
						}
						if (target.hp < 3) {
							return 12 / target.hp;
						}
						return 0;
					})()
				)
				.forResult();
			if (result?.bool && result?.cards?.length) {
				const { cards } = result;
				await target.showCards(cards);
				const [card] = cards;
				if (get.color(card) == "black") {
					if (!target.hasSkill("fengyin")) {
						target.addTempSkill("fengyin");
					}
					const skill = "yijue_" + player.playerid;
					game.broadcastAll(lib.skill.yijue.initSkill, skill);
					target.addTempSkill(skill);
					target.storage[skill] ??= [0, player];
					target.storage[skill][0]++;
					target.markSkill(skill);
					player.addTempSkill("yijue_effect");
				} else if (get.color(card) == "red") {
					await player.gain(card, target, "give", "bySelf");
					if (target.isDamaged()) {
						const result = await player
							.chooseBool(`是否让${get.translation(target)}回复1点体力？`)
							.set("choice", get.recoverEffect(target, player, player) > 0)
							.forResult();
						if (result?.bool) {
							await target.recover();
						}
					}
				}
			}
		},
		ai: {
			result: {
				target(player, target) {
					var hs = player.getCards("h");
					if (hs.length < 3) {
						return 0;
					}
					if (target.countCards("h") > target.hp + 1 && get.recoverEffect(target) > 0) {
						return 1;
					}
					if (player.canUse("sha", target) && (player.countCards("h", "sha") || player.countCards("he", { color: "red" }))) {
						return -2;
					}
					return -0.5;
				},
			},
			order: 9,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (!arg?.target?.hasSkill("yijue_" + player.playerid)) {
					return false;
				}
			},
		},
		subSkill: {
			effect: {
				charlotte: true,
				trigger: { source: "damageBegin1" },
				filter(event, player) {
					return (
						event.card?.name == "sha" &&
						get.suit(event.card) == "heart" &&
						event.notLink() &&
						event.player.storage["yijue_" + player.playerid]?.[1] == player
					);
				},
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					trigger.num += trigger.player.storage["yijue_" + player.playerid][0];
				},
			},
			ban: {
				charlotte: true,
				mod: {
					cardEnabled2(card) {
						if (get.position(card) == "h") {
							return false;
						}
					},
				},
			},
		},
	},
	// 张飞
	// 咆哮
	jx_paoxiao: {
		audio: "paoxiao",
		firstDo: true,
		audioname2: {
			old_guanzhang: "old_fuhun",
			xin_zhangfei: "paoxiao_re_zhangfei",
			old_zhangfei: "paoxiao_re_zhangfei",
		},
		audioname: ["re_zhangfei", "guanzhang", "xiahouba", "re_guanzhang"],
		trigger: { player: "useCard1" },
		forced: true,
		filter(event, player) {
			return event.card.name == "sha" && (!event.audioed || !player.hasSkill("jx_paoxiao2"));
		},
		async content(event, trigger, player) {
			trigger.audioed = true;
			player.addTempSkill("jx_paoxiao2");
		},
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return Infinity;
				}
			},
		},
		ai: {
			unequip: true,
			skillTagFilter(player, tag, arg) {
				if (!get.zhu(player, "shouyue")) {
					return false;
				}
				if (arg && arg.name == "sha") {
					return true;
				}
				return false;
			},
		},
	},
	jx_paoxiao2: {
		charlotte: true,
		mod: {
			targetInRange(card, player) {
				if (card.name == "sha") {
					return true;
				}
			},
		},
	},
	// 替身
	tishen: {
		trigger: {
			player: "phaseUseEnd",
		},
		check(event, player) {
			var num = 0;
			var he = player.getCards("he");
			for (var i = 0; i < he.length; i++) {
				if (get.type(he[i], "trick") == "trick") {
					num++;
				}
				if (get.type(he[i]) == "equip") {
					var subtype = get.subtype(he[i]);
					if (subtype == "equip3" || subtype == "equip4" || subtype == "equip6") {
						num++;
					}
				}
			}
			return num == 0 || num <= player.countCards("h") - player.getHandcardLimit();
		},
		async content(event, trigger, player) {
			const list = [];
			const he = player.getCards("he");
			for (const card of he) {
				if (get.type(card, "trick") == "trick") {
					list.push(card);
				}
				if (get.type(card) == "equip") {
					const subtype = get.subtype(card);
					if (subtype == "equip3" || subtype == "equip4" || subtype == "equip6") {
						list.push(card);
					}
				}
			}
			if (list.length) {
				await player.discard(list);
			}
			player.addTempSkill("tishen2", { player: "phaseBefore" });
		},
		audio: "retishen",
	},
	tishen2: {
		audio: "retishen",
		trigger: {
			global: "useCardAfter",
		},
		filter(event, player) {
			return (
				event.card.name == "sha" &&
				event.targets &&
				event.targets.includes(player) &&
				!player.hasHistory("damage", evt => evt.card == event.card) &&
				event.cards.filterInD("od").length
			);
		},
		forced: true,
		charlotte: true,
		sourceSkill: "tishen",
		async content(event, trigger, player) {
			await player.gain(trigger.cards.filterInD("od"), "gain2");
		},
	},
	// 诸葛亮
	// 观星
	jx_guanxing: {
		audio: "guanxing",
		audioname: ["jiangwei", "re_jiangwei", "re_zhugeliang", "ol_jiangwei"],
		audioname2: { gexuan: "guanxing_gexuan" },
		trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
		frequent: true,
		filter(event, player, name) {
			if (name == "phaseJieshuBegin") {
				return player.hasSkill("jx_guanxing_on");
			}
			return true;
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseToGuanxing(game.countPlayer() < 4 ? 3 : 5)
				.set("prompt", "观星：点击或拖动将牌移动到牌堆顶或牌堆底")
				.forResult();
			if ((!result.bool || !result.moved[0].length) && event.triggername == "phaseZhunbeiBegin") {
				player.addTempSkill(["jx_guanxing_on", "guanxing_fail"]);
			}
		},
		subSkill: {
			on: { charlotte: true },
		},
		ai: {
			guanxing: true,
		},
	},
	// 赵云
	// 涯角
	yajiao: {
		audio: "reyajiao",
		trigger: {
			player: "loseEnd",
		},
		frequent: true,
		filter(event, player) {
			return player != _status.currentPhase && event.hs && event.hs.length > 0 && ["useCard", "respond"].includes(event.getParent().name);
		},
		async content(event, trigger, player) {
			let result;

			// step 0
			event.card = get.cards();
			await player.showCards(event.card);
			event.same = get.type(event.card, "trick") == get.type(trigger.getParent().card, "trick");

			result = await player
				.chooseTarget("选择获得此牌的角色", true)
				.set("ai", function (target) {
					let att = get.attitude(_status.event.player, target);
					if (_status.event.du) {
						if (target.hasSkillTag("nodu")) {
							return 0;
						}
						return -att;
					}
					if (!_status.event.same) {
						att += target == _status.event.player ? 1 : 0;
					}
					if (att > 0) {
						return att + Math.max(0, 5 - target.countCards("h"));
					}
					return att;
				})
				.set("du", event.card.name == "du")
				.set("same", event.same)
				.forResult();

			// step 1
			if (result?.targets?.length) {
				player.line(result.targets, "green");
				await result.targets[0].gain(event.card, "gain2");
				if (!event.same) {
					await player.chooseToDiscard(true, "he");
				}
			}
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (get.tag(card, "respond") && target.countCards("h") > 1) {
						return [1, 0.2];
					}
				},
			},
		},
	},
	// 马超
	// 铁骑
	jx_tieji: {
		audio: 2,
		audioname: ["boss_lvbu3", "tw_dm_quyi"],
		trigger: { player: "useCardToPlayered" },
		check(event, player) {
			return get.attitude(player, event.target) <= 0;
		},
		filter(event, player) {
			return event.card.name == "sha";
		},
		logTarget: "target",
		async content(event, trigger, player) {
			let result;
			// step 0
			result = await player
				.judge(function () {
					return 0;
				})
				.forResult();
			if (!trigger.target.hasSkill("fengyin")) {
				trigger.target.addTempSkill("fengyin");
			}
			// step 1
			const suit = result.suit;
			const target = trigger.target;
			const num = target.countCards("h", "shan");
			result = await target
				.chooseToDiscard("请弃置一张" + get.translation(suit) + "牌，否则不能使用闪抵消此杀", "he", function (card) {
					return get.suit(card) == _status.event.suit;
				})
				.set("ai", function (card) {
					var num = _status.event.num;
					if (num == 0) {
						return 0;
					}
					if (card.name == "shan") {
						return num > 1 ? 2 : 0;
					}
					return 8 - get.value(card);
				})
				.set("num", num)
				.set("suit", suit)
				.forResult();
			// step 2
			if (!result.bool) {
				trigger.getParent().directHit.add(trigger.target);
			}
		},
		ai: {
			ignoreSkill: true,
			skillTagFilter(player, tag, arg) {
				if (tag == "directHit_ai") {
					return arg?.target && get.attitude(player, arg.target) <= 0;
				}
				if (!arg || arg.isLink || !arg.card || arg.card.name != "sha") {
					return false;
				}
				if (!arg.target || get.attitude(player, arg.target) >= 0) {
					return false;
				}
				if (
					!arg.skill ||
					!lib.skill[arg.skill] ||
					lib.skill[arg.skill].charlotte ||
					lib.skill[arg.skill].persevereSkill ||
					get.is.locked(arg.skill) ||
					!arg.target.getSkills(true, false).includes(arg.skill)
				) {
					return false;
				}
			},
			directHit_ai: true,
		},
	},
	// 黄月英
	// 集智
	jizhi: {
		audio: 2,
		trigger: { player: "useCard" },
		frequent: true,
		preHidden: true,
		filter(event) {
			return get.type(event.card) == "trick";
		},
		async content(event, trigger, player) {
			player.draw("nodelay");
		},
		ai: {
			threaten: 1.4,
			noautowuxie: true,
		},
	},
	// 奇才
	qicai: {
		mod: {
			targetInRange(card, player, target, now) {
				if (["trick", "delay"].includes(get.type(card))) {
					return true;
				}
			},
		},
	},
	// 孙权
	// 制衡
	zhiheng: {
		audio: 2,
		mod: {
			aiOrder(player, card, num) {
				if (num <= 0 || get.itemtype(card) !== "card" || get.type(card) !== "equip") {
					return num;
				}
				let eq = player.getEquip(get.subtype(card));
				if (eq && get.equipValue(card) - get.equipValue(eq) < Math.max(1.2, 6 - player.hp)) {
					return 0;
				}
			},
		},
		locked: false,
		enable: "phaseUse",
		usable: 1,
		position: "he",
		filterCard: true,
		selectCard: [1, Infinity],
		allowChooseAll: true,
		prompt: "弃置任意张牌并摸等量的牌",
		check(card) {
			let player = _status.event.player;
			if (get.position(card) == "e") {
				let subs = get.subtypes(card);
				if (subs.includes("equip2") || subs.includes("equip3")) {
					return player.getHp() - get.value(card);
				}
			}
			return 6 - get.value(card);
		},
		async content(event, trigger, player) {
			player.draw(event.cards.length);
		},
		ai: {
			order: 1,
			result: {
				player: 1,
			},
			threaten: 1.5,
		},
	},
	// 救援
	jiuyuan: {
		audio: 2,
		trigger: { target: "taoBegin" },
		zhuSkill: true,
		forced: true,
		filter(event, player) {
			if (event.player == player) {
				return false;
			}
			if (!player.hasZhuSkill("jiuyuan")) {
				return false;
			}
			if (event.player.group != "wu") {
				return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			trigger.baseDamage++;
		},
	},
	// 甘宁
	// 奇袭
	qixi: {
		audio: 2,
		enable: "chooseToUse",
		filterCard(card) {
			return get.color(card) == "black";
		},
		position: "hes",
		viewAs: { name: "guohe" },
		viewAsFilter(player) {
			if (!player.countCards("hes", { color: "black" })) {
				return false;
			}
		},
		prompt: "将一张黑色牌当过河拆桥使用",
		check(card) {
			return 4 - get.value(card);
		},
	},
	// 吕蒙
	// 克己
	keji: {
		audio: 2,
		trigger: { player: "phaseDiscardBefore" },
		frequent(event, player) {
			return player.needsToDiscard();
		},
		filter(event, player) {
			if (player.getHistory("skipped").includes("phaseUse")) {
				return true;
			}
			const history = player.getHistory("useCard").concat(player.getHistory("respond"));
			for (let i = 0; i < history.length; i++) {
				if (history[i].card.name == "sha" && history[i].isPhaseUsing()) {
					return false;
				}
			}
			return true;
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
	},
	// 黄盖
	// 苦肉
	kurou: {
		audio: 2,
		enable: "phaseUse",
		prompt: "失去1点体力并摸两张牌",
		delay: false,
		async content(event, trigger, player) {
			player.loseHp(1);
			player.draw(2, "nodelay");
		},
		ai: {
			basic: {
				order: 1,
			},
			result: {
				player(player) {
					if (player.needsToDiscard(3) && !player.hasValueTarget({ name: "sha" }, false)) {
						return -1;
					}
					if (player.countCards("h") >= player.hp - 1) {
						return -1;
					}
					if (player.hp < 3) {
						return -1;
					}
					return 1;
				},
			},
		},
	},
	// 周瑜
	// 英姿
	yingzi: {
		audio: 2,
		audioname: ["sunce"],
		trigger: { player: "phaseDrawBegin2" },
		frequent: true,
		filter(event, player) {
			return !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.num++;
		},
		ai: {
			threaten: 1.3,
		},
	},
	// 反间
	fanjian: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		filterTarget(card, player, target) {
			return player != target;
		},
		async content(event, trigger, player) {
			const target = event.target;
			const { control } = await target
				.chooseControl("heart2", "diamond2", "club2", "spade2")
				.set("ai", event => {
					switch (Math.floor(Math.random() * 6)) {
						case 0:
							return "heart2";
						case 1:
						case 4:
						case 5:
							return "diamond2";
						case 2:
							return "club2";
						case 3:
							return "spade2";
					}
				})
				.forResult();
			game.log(target, "选择了" + get.translation(control));
			event.choice = control;
			target.chat("我选" + get.translation(event.choice));
			const { bool, cards } = await target.gainPlayerCard(player, true, "h").forResult();
			if (bool && get.suit(cards[0], player) + "2" != event.choice) {
				target.damage("nocard");
			}
		},
		ai: {
			order: 1,
			result: {
				target(player, target) {
					const eff = get.damageEffect(target, player);
					if (eff >= 0) {
						return 1 + eff;
					}
					let value = 0,
						i;
					const cards = player.getCards("h");
					for (i = 0; i < cards.length; i++) {
						value += get.value(cards[i]);
					}
					value /= player.countCards("h");
					if (target.hp == 1) {
						return Math.min(0, value - 7);
					}
					return Math.min(0, value - 5);
				},
			},
		},
	},
	// 大乔
	// 国色
	guose: {
		audio: 2,
		filter(event, player) {
			return player.countCards("hes", { suit: "diamond" }) > 0;
		},
		enable: "chooseToUse",
		filterCard(card) {
			return get.suit(card) == "diamond";
		},
		position: "hes",
		viewAs: { name: "lebu" },
		prompt: "将一张方片牌当乐不思蜀使用",
		check(card) {
			return 6 - get.value(card);
		},
		ai: {
			threaten: 1.5,
		},
	},
	// 流离
	liuli: {
		audio: 2,
		trigger: { target: "useCardToTarget" },
		preHidden: true,
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			if (player.countCards("he") == 0) {
				return false;
			}
			return game.hasPlayer(current => {
				return player.inRange(current) && current != event.player && current != player && lib.filter.targetEnabled(event.card, event.player, current);
			});
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCardTarget({
					position: "he",
					filterCard: lib.filter.cardDiscardable,
					filterTarget: (card, player, target) => {
						const trigger = _status.event;
						if (player.inRange(target) && target != trigger.source) {
							if (lib.filter.targetEnabled(trigger.card, trigger.source, target)) {
								return true;
							}
						}
						return false;
					},
					ai1: card => get.unuseful(card) + 9,
					ai2: target => {
						const player = get.player();
						if (player.countCards("h", "shan")) {
							return -get.attitude(player, target);
						}
						if (get.attitude(player, target) < 5) {
							return 6 - get.attitude(player, target);
						}
						if (player.hp == 1 && player.countCards("h", "shan") == 0) {
							return 10 - get.attitude(player, target);
						}
						if (player.hp == 2 && player.countCards("h", "shan") == 0) {
							return 8 - get.attitude(player, target);
						}
						return -1;
					},
					prompt: get.prompt(event.skill),
					prompt2: "弃置一张牌，将此【杀】转移给攻击范围内的一名其他角色",
					source: trigger.player,
					card: trigger.card,
				})
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			player.discard(event.cards);
			const evt = trigger.getParent();
			evt.triggeredTargets2.remove(player);
			evt.targets.remove(player);
			evt.targets.push(target);
		},
		ai: {
			effect: {
				target_use(card, player, target) {
					if (target.countCards("he") == 0) {
						return;
					}
					if (card.name != "sha") {
						return;
					}
					let min = 1;
					const friend = get.attitude(player, target) > 0;
					const vcard = { name: "shacopy", nature: card.nature, suit: card.suit };
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						if (player != players[i] && get.attitude(target, players[i]) < 0 && target.canUse(card, players[i])) {
							if (!friend) {
								return 0;
							}
							if (get.effect(players[i], vcard, player, player) > 0) {
								if (!player.canUse(card, players[0])) {
									return [0, 0.1];
								}
								min = 0;
							}
						}
					}
					return min;
				},
			},
		},
	},
	// 陆逊
	// 谦逊
	qianxun: {
		mod: {
			targetEnabled(card, player, target, now) {
				if (card.name == "shunshou" || card.name == "lebu") {
					return false;
				}
			},
		},
	},
	// 连营
	lianying: {
		audio: 2,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		filter(event, player) {
			if (player.countCards("h")) {
				return false;
			}
			const evt = event.getl(player);
			return evt && evt.player == player && evt.hs && evt.hs.length > 0;
		},
		async content(event, trigger, player) {
			player.draw();
		},
		ai: {
			threaten: 0.8,
			effect: {
				player_use(card, player, target) {
					if (player.countCards("h") === 1) {
						return [1, 0.8];
					}
				},
				target(card, player, target) {
					if (get.tag(card, "loseCard") && target.countCards("h") === 1) {
						return 0.5;
					}
				},
			},
			noh: true,
			freeSha: true,
			freeShan: true,
			skillTagFilter(player, tag) {
				if (player.countCards("h") !== 1) {
					return false;
				}
			},
		},
	},
	// 孙尚香
	// 结姻
	jieyin: {
		audio: 2,
		enable: "phaseUse",
		filterCard: true,
		usable: 1,
		selectCard: 2,
		check(card) {
			const player = get.owner(card);
			if (player.countCards("h") > player.hp) {
				return 8 - get.value(card);
			}
			if (player.hp < player.maxHp) {
				return 6 - get.value(card);
			}
			return 4 - get.value(card);
		},
		filterTarget(card, player, target) {
			if (!target.hasSex("male")) {
				return false;
			}
			if (target.hp >= target.maxHp) {
				return false;
			}
			if (target == player) {
				return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			player.recover();
			event.target.recover();
		},
		ai: {
			order: 5.5,
			result: {
				player(player) {
					if (player.hp < player.maxHp) {
						return 4;
					}
					if (player.countCards("h") > player.hp) {
						return 0;
					}
					return -1;
				},
				target: 4,
			},
			threaten: 2,
		},
	},
	// 枭姬
	xiaoji: {
		audio: 2,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		getIndex(event, player) {
			const evt = event.getl(player);
			if (evt && evt.player === player && evt.es) {
				return evt.es.length;
			}
			return false;
		},
		async content(event, trigger, player) {
			player.draw(2);
		},
		ai: {
			noe: true,
			reverseEquip: true,
			effect: {
				target(card, player, target, current) {
					if (get.type(card) == "equip" && !get.cardtag(card, "gifts")) {
						return [1, 3];
					}
				},
			},
		},
	},
	// 曹操
	// 奸雄
	jianxiong: {
		audio: 2,
		preHidden: true,
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return get.itemtype(event.cards) == "cards" && get.position(event.cards[0], true) == "o";
		},
		async content(event, trigger, player) {
			player.gain(trigger.cards, "gain2");
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -1];
					}
					if (get.tag(card, "damage")) {
						return [1, 0.55];
					}
				},
			},
		},
	},
	// 护驾
	hujia: {
		audio: 2,
		zhuSkill: true,
		trigger: { player: ["chooseToRespondBefore", "chooseToUseBefore"] },
		filter(event, player) {
			if (event.responded) {
				return false;
			}
			if (player.storage.hujiaing) {
				return false;
			}
			if (!player.hasZhuSkill("hujia")) {
				return false;
			}
			if (!event.filterCard({ name: "shan", isCard: true }, player, event)) {
				return false;
			}
			return game.hasPlayer(current => current != player && current.group == "wei");
		},
		check(event, player) {
			if (get.damageEffect(player, event.player, player) >= 0) {
				return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			while (true) {
				let bool;
				if (!event.current) {
					event.current = player.next;
				}
				if (event.current == player) {
					return;
				} else if (event.current.group == "wei") {
					if ((event.current == game.me && !_status.auto) || get.attitude(event.current, player) > 2 || event.current.isOnline()) {
						player.storage.hujiaing = true;
						const next = event.current.chooseToRespond("是否替" + get.translation(player) + "打出一张闪？", { name: "shan" });
						next.set("ai", () => {
							const event = _status.event;
							return get.attitude(event.player, event.source) - 2;
						});
						next.set("skillwarn", "替" + get.translation(player) + "打出一张闪");
						next.autochoose = lib.filter.autoRespondShan;
						next.set("source", player);
						bool = (await next.forResult()).bool;
					}
				}
				player.storage.hujiaing = false;
				if (bool) {
					trigger.result = { bool: true, card: { name: "shan", isCard: true } };
					trigger.responded = true;
					trigger.animate = false;
					if (typeof event.current.ai.shown == "number" && event.current.ai.shown < 0.95) {
						event.current.ai.shown += 0.3;
						if (event.current.ai.shown > 0.95) {
							event.current.ai.shown = 0.95;
						}
					}
					return;
				} else {
					event.current = event.current.next;
				}
			}
		},
		ai: {
			respondShan: true,
			skillTagFilter(player) {
				if (player.storage.hujiaing) {
					return false;
				}
				if (!player.hasZhuSkill("hujia")) {
					return false;
				}
				return game.hasPlayer(current => current != player && current.group == "wei");
			},
		},
	},
	// 司马懿
	// 反馈
	fankui: {
		audio: 2,
		trigger: { player: "damageEnd" },
		logTarget: "source",
		preHidden: true,
		filter(event, player) {
			return event.source && event.source.countGainableCards(player, event.source != player ? "he" : "e") > 0 && event.num > 0;
		},
		async content(event, trigger, player) {
			player.gainPlayerCard(true, trigger.source, trigger.source != player ? "he" : "e");
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.countCards("he") > 1 && get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -1.5];
						}
						if (get.attitude(target, player) < 0) {
							return [1, 1];
						}
					}
				},
			},
		},
	},
	// 鬼才
	guicai: {
		audio: 2,
		trigger: { global: "judge" },
		preHidden: true,
		filter(event, player) {
			return player.countCards(get.mode() == "guozhan" ? "hes" : "hs") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard(`${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`, get.mode() == "guozhan" ? "hes" : "hs", card => {
					const player = get.player();
					const mod2 = game.checkMod(card, player, "unchanged", "cardEnabled2", player);
					if (mod2 != "unchanged") {
						return mod2;
					}
					const mod = game.checkMod(card, player, "unchanged", "cardRespondable", player);
					if (mod != "unchanged") {
						return mod;
					}
					return true;
				})
				.set("ai", card => {
					const trigger = get.event().getTrigger();
					const { player, judging } = get.event();
					const result = trigger.judge(card) - trigger.judge(judging);
					const attitude = get.attitude(player, trigger.player);
					let val = get.value(card);
					if (get.subtype(card) == "equip2") {
						val /= 2;
					} else {
						val /= 4;
					}
					if (attitude == 0 || result == 0) {
						return 0;
					}
					if (attitude > 0) {
						return result - val;
					}
					return -result - val;
				})
				.set("judging", trigger.player.judging[0])
				.setHiddenSkill(event.skill)
				.forResult();
		},
		//技能的logSkill跟着打出牌走 不进行logSkill
		popup: false,
		async content(event, trigger, player) {
			const next = player.respond(event.cards, event.name, "highlight", "noOrdering");
			await next;
			const { cards } = next;
			if (cards?.length) {
				if (trigger.player.judging[0].clone) {
					trigger.player.judging[0].clone.classList.remove("thrownhighlight");
					game.broadcast(function (card) {
						if (card.clone) {
							card.clone.classList.remove("thrownhighlight");
						}
					}, trigger.player.judging[0]);
					game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
				}
				await game.cardsDiscard(trigger.player.judging[0]);
				trigger.player.judging[0] = cards[0];
				trigger.orderingCards.addArray(cards);
				game.log(trigger.player, "的判定牌改为", cards);
				await game.delay(2);
			}
		},
		ai: {
			rejudge: true,
			tag: { rejudge: 1 },
		},
	},
	// 夏侯惇
	// 刚烈
	ganglie: {
		audio: 2,
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return event.source?.isIn();
		},
		check(event, player) {
			return get.attitude(player, event.source) <= 0;
		},
		logTarget: "source",
		async content(event, trigger, player) {
			const { source } = trigger;
			const judgeEvent = player.judge(card => {
				if (get.suit(card) == "heart") {
					return -2;
				}
				return 2;
			});
			judgeEvent.judge2 = result => result.bool;
			let result;
			result = await judgeEvent.forResult();
			if (!result?.bool) {
				return;
			}
			result =
				source.countCards("h") < 2
					? { bool: false }
					: await source
							.chooseToDiscard(2, `弃置两张手牌，否则${get.translation(player)}对你造成1点伤害`)
							.set("ai", card => {
								if (card.name == "tao") {
									return -10;
								}
								if (card.name == "jiu" && get.player().hp == 1) {
									return -10;
								}
								return get.unuseful(card) + 2.5 * (5 - get.owner(card).hp);
							})
							.forResult();
			if (!result?.bool) {
				await source.damage();
			}
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -1];
					}
					return 0.8;
					// if(get.tag(card,'damage')&&get.damageEffect(target,player,player)>0) return [1,0,0,-1.5];
				},
			},
		},
	},
	ganglie_three: {
		audio: "ganglie",
		trigger: { player: "damageEnd" },
		async cost(event, trigger, player) {
			const result = await player
				.chooseTarget(get.prompt2(event.skill), (card, player, target) => {
					return target.isEnemyOf(player);
				})
				.set("ai", target => {
					return -get.attitude(_status.event.player, target) / Math.sqrt(1 + target.countCards("h"));
				})
				.forResult();
			event.result = result;
		},
		async content(event, trigger, player) {
			event.target = event.targets[0];
			const judgeEvent = player.judge(card => {
				if (get.suit(card) == "heart") {
					return -2;
				}
				return 2;
			});
			judgeEvent.judge2 = result => result.bool;
			const { judge } = await judgeEvent.forResult();
			if (judge < 2) {
				return;
			}
			const { bool: chooseToDiscardResultBool } = await event.target.chooseToDiscard(2).set("ai", card => {
				if (card.name == "tao") {
					return -10;
				}
				if (card.name == "jiu" && _status.event.player.hp == 1) {
					return -10;
				}
				return get.unuseful(card) + 2.5 * (5 - get.owner(card).hp);
			}).forResult();
			if (chooseToDiscardResultBool === false) {
				event.target.damage();
			}
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -1];
					}
					return 0.8;
					// if(get.tag(card,'damage')&&get.damageEffect(target,player,player)>0) return [1,0,0,-1.5];
				},
			},
		},
	},
	// 张辽
	// 突袭
	tuxi: {
		audio: 2,
		trigger: { player: "phaseDrawBegin1" },
		filter(event, player) {
			return !event.numFixed;
		},
		async cost(event, trigger, player) {
			let num = game.countPlayer(current => current != player && current.countCards("h") > 0 && get.attitude(player, current) <= 0);
			let check = num >= 2;
			const result = await player
				.chooseTarget(
					get.prompt(event.skill),
					"获得其他一至两名角色的各一张手牌",
					[1, 2],
					(card, player, target) => {
						return target.countCards("h") > 0 && player != target;
					},
					target => {
						if (!_status.event.aicheck) {
							return 0;
						}
						const att = get.attitude(_status.event.player, target);
						if (target.hasSkill("tuntian")) {
							return att / 10;
						}
						return 1 - att;
					}
				)
				.set("aicheck", check)
				.forResult();
			event.result = result;
		},
		async content(event, trigger, player) {
			player.gainMultiple(event.targets);
			trigger.changeToZero();
			await game.delay();
		},
		ai: {
			threaten: 2,
			expose: 0.3,
		},
	},
	// 许褚
	// 裸衣
	luoyi: {
		audio: 2,
		trigger: { player: "phaseDrawBegin2" },
		check(event, player) {
			if (player.skipList.includes("phaseUse") || player.countCards("h") < 3) {
				return false;
			}
			if (!player.hasSha()) {
				return false;
			}
			return game.hasPlayer(current => get.attitude(player, current) < 0 && player.canUse("sha", current));
		},
		preHidden: true,
		filter(event, player) {
			return !event.numFixed && event.num > 0;
		},
		async content(event, trigger, player) {
			player.addTempSkill("luoyi2", "phaseJieshuBegin");
			trigger.num--;
		},
	},
	luoyi2: {
		trigger: { source: "damageBegin1" },
		sourceSkill: "luoyi",
		filter(event) {
			return event.card && (event.card.name == "sha" || event.card.name == "juedou") && event.notLink();
		},
		charlotte: true,
		forced: true,
		async content(event, trigger, player) {
			trigger.num++;
		},
		ai: {
			damageBonus: true,
		},
	},
	// 郭嘉
	// 天妒
	tiandu: {
		audio: 2,
		trigger: { player: "judgeEnd" },
		preHidden: true,
		frequent(event) {
			//if(get.mode()=='guozhan') return false;
			return event.result.card.name !== "du";
		},
		check(event) {
			return event.result.card.name !== "du";
		},
		filter(event, player) {
			return get.position(event.result.card, true) == "o";
		},
		async content(event, trigger, player) {
			player.gain(trigger.result.card, "gain2");
		},
	},
	// 遗计
	yiji: {
		audio: 2,
		trigger: { player: "damageEnd" },
		frequent: true,
		filter(event) {
			return event.num > 0;
		},
		getIndex(event, player, triggername) {
			return event.num;
		},
		async content(event, trigger, player) {
			const cards = get.cards(2);
			await game.cardsGotoOrdering(cards);
			if (_status.connectMode) {
				game.broadcastAll(function () {
					_status.noclearcountdown = true;
				});
			}
			event.given_map = {};
			if (!cards.length) {
				return;
			}
			// event.goto -> do while
			do {
				const { bool, links } =
					cards.length == 1
						? { links: cards.slice(0), bool: true }
						: await player.chooseCardButton("遗计：请选择要分配的牌", true, cards, [1, cards.length]).set("ai", () => {
								if (ui.selected.buttons.length == 0) {
									return 1;
								}
								return 0;
						  }).forResult();
				if (!bool) {
					return;
				}
				cards.removeArray(links);
				event.togive = links.slice(0);
				const { targets } = await player
					.chooseTarget("选择一名角色获得" + get.translation(links), true)
					.set("ai", target => {
						const att = get.attitude(_status.event.player, target);
						if (_status.event.enemy) {
							return -att;
						} else if (att > 0) {
							return att / (1 + target.countCards("h"));
						} else {
							return att / 100;
						}
					})
					.set("enemy", get.value(event.togive[0], player, "raw") < 0)
					.forResult();
				if (targets.length) {
					const id = targets[0].playerid,
						map = event.given_map;
					if (!map[id]) {
						map[id] = [];
					}
					map[id].addArray(event.togive);
				}
			} while (cards.length > 0);
			if (_status.connectMode) {
				game.broadcastAll(function () {
					delete _status.noclearcountdown;
					game.stopCountChoose();
				});
			}
			const list = [];
			for (const i in event.given_map) {
				const source = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
				player.line(source, "green");
				if (player !== source && (get.mode() !== "identity" || player.identity !== "nei")) {
					player.addExpose(0.2);
				}
				list.push([source, event.given_map[i]]);
			}
			game.loseAsync({
				gain_list: list,
				giver: player,
				animate: "draw",
			}).setContent("gaincardMultiple");
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -2];
						}
						if (!target.hasFriend()) {
							return;
						}
						let num = 1;
						if (get.attitude(player, target) > 0) {
							if (player.needsToDiscard()) {
								num = 0.7;
							} else {
								num = 0.5;
							}
						}
						if (target.hp >= 4) {
							return [1, num * 2];
						}
						if (target.hp == 3) {
							return [1, num * 1.5];
						}
						if (target.hp == 2) {
							return [1, num * 0.5];
						}
					}
				},
			},
		},
	},
	// 甄姬
	// 倾国
	qingguo: {
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "shan" && get.color(card) != "black") {
					return;
				}
				const cards = player.getCards("hs", card => get.name(card) == "shan" || get.color(card) == "black");
				cards.sort((a, b) => {
					return (get.name(b) == "shan" ? 1 : 2) - (get.name(a) == "shan" ? 1 : 2);
				});
				const geti = () => {
					if (cards.includes(card)) {
						cards.indexOf(card);
					}
					return cards.length;
				};
				if (get.name(card) == "shan") {
					return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
				}
				return Math.max(num, [6.5, 4, 3][Math.min(geti(), 2)]);
			},
			aiUseful() {
				return lib.skill.qingguo.mod.aiValue.apply(this, arguments);
			},
		},
		locked: false,
		audio: 2,
		enable: ["chooseToRespond", "chooseToUse"],
		filterCard(card) {
			return get.color(card) == "black";
		},
		viewAs: { name: "shan" },
		viewAsFilter(player) {
			if (!player.countCards("hs", { color: "black" })) {
				return false;
			}
		},
		position: "hs",
		prompt: "将一张黑色手牌当闪使用或打出",
		check() {
			return 1;
		},
		ai: {
			order: 3,
			respondShan: true,
			skillTagFilter(player) {
				if (!player.countCards("hs", { color: "black" })) {
					return false;
				}
			},
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "respondShan") && current < 0) {
						return 0.6;
					}
				},
			},
		},
	},
	// 洛神
	luoshen: {
		audio: 2,
		trigger: { player: "phaseZhunbeiBegin" },
		frequent: true,
		preHidden: true,
		async content(event, trigger, player) {
			event.cards ??= [];
			while (true) {
				const judgeEvent = player.judge(card => {
					if (get.color(card) == "black") {
						return 1.5;
					}
					return -1.5;
				});
				judgeEvent.judge2 = result => result.bool;
				if (get.mode() != "guozhan" && !player.hasSkillTag("rejudge")) {
					judgeEvent.set("callback", async event => {
						if (event.judgeResult.color == "black" && get.position(event.card, true) == "o") {
							await player.gain(event.card, "gain2");
						}
					});
				} else {
					judgeEvent.set("callback", async event => {
						if (event.judgeResult.color == "black") {
							event.getParent().orderingCards.remove(event.card);
						}
					});
				}
				let result;
				result = await judgeEvent.forResult();
				if (result?.bool && result?.card) {
					event.cards.push(result.card);
					result = await player.chooseBool("是否再次发动【洛神】？").set("frequentSkill", "luoshen").forResult();
					if (!result?.bool) {
						break;
					}
				} else {
					break;
				}
			}
			if (event.cards.someInD()) {
				await player.gain(event.cards.filterInD(), "gain2");
			}
		},
	},
	// 华佗
	// 急救
	jijiu: {
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "tao" && get.color(card) != "red") {
					return;
				}
				const cards = player.getCards("hs", card => get.name(card) == "tao" || get.color(card) == "red");
				cards.sort((a, b) => (get.name(a) == "tao" ? 1 : 2) - (get.name(b) == "tao" ? 1 : 2));
				var geti = () => {
					if (cards.includes(card)) {
						cards.indexOf(card);
					}
					return cards.length;
				};
				return Math.max(num, [6.5, 4, 3, 2][Math.min(geti(), 2)]);
			},
			aiUseful() {
				return lib.skill.jijiu.mod.aiValue.apply(this, arguments);
			},
		},
		locked: false,
		audio: 2,
		enable: "chooseToUse",
		viewAsFilter(player) {
			return player != _status.currentPhase && player.countCards("hes", { color: "red" }) > 0;
		},
		filterCard(card) {
			return get.color(card) == "red";
		},
		position: "hes",
		viewAs: { name: "tao" },
		prompt: "将一张红色牌当桃使用",
		check(card) {
			return 15 - get.value(card);
		},
		ai: {
			threaten: 1.5,
		},
	},
	// 青囊
	qingnang: {
		audio: 2,
		enable: "phaseUse",
		filterCard: true,
		usable: 1,
		check(card) {
			return 9 - get.value(card);
		},
		filterTarget(card, player, target) {
			if (target.hp >= target.maxHp) {
				return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			event.target.recover();
		},
		ai: {
			order: 9,
			result: {
				target(player, target) {
					if (target.hp == 1) {
						return 5;
					}
					if (player == target && player.countCards("h") > player.hp) {
						return 5;
					}
					return 2;
				},
			},
			threaten: 2,
		},
	},
	// 吕布
	// 无双
	wushuang: {
		audio: 2,
		audioname: ["le_lvbu"],
		forced: true,
		locked: true,
		group: ["wushuang1", "wushuang2"],
		preHidden: ["wushuang1", "wushuang2"],
	},
	wushuang1: {
		audio: "wushuang",
		trigger: { player: "useCardToPlayered" },
		forced: true,
		sourceSkill: "wushuang",
		filter(event, player) {
			return event.card.name == "sha" && !event.getParent().directHit.includes(event.target);
		},
		//priority:-1,
		logTarget: "target",
		async content(event, trigger, player) {
			const id = trigger.target.playerid;
			const map = trigger.getParent().customArgs;
			if (!map[id]) {
				map[id] = {};
			}
			if (typeof map[id].shanRequired == "number") {
				map[id].shanRequired++;
			} else {
				map[id].shanRequired = 2;
			}
		},
		ai: {
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (arg.card.name != "sha" || arg.target.countCards("h", "shan") > 1) {
					return false;
				}
			},
		},
	},
	wushuang2: {
		audio: "wushuang",
		trigger: { player: "useCardToPlayered", target: "useCardToTargeted" },
		forced: true,
		sourceSkill: "wushuang",
		logTarget(trigger, player) {
			return player == trigger.player ? trigger.target : trigger.player;
		},
		filter(event, player) {
			return event.card.name == "juedou";
		},
		//priority:-1,
		async content(event, trigger, player) {
			const id = (player == trigger.player ? trigger.target : trigger.player)["playerid"];
			const idt = trigger.target.playerid;
			const map = trigger.getParent().customArgs;
			if (!map[idt]) {
				map[idt] = {};
			}
			if (!map[idt].shaReq) {
				map[idt].shaReq = {};
			}
			if (!map[idt].shaReq[id]) {
				map[idt].shaReq[id] = 1;
			}
			map[idt].shaReq[id]++;
		},
		ai: {
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (arg.card.name != "juedou" || Math.floor(arg.target.countCards("h", "sha") / 2) > player.countCards("h", "sha")) {
					return false;
				}
			},
		},
	},
	// 貂蝉
	// 离间
	lijian: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return game.countPlayer(current => current != player && current.hasSex("male")) > 1;
		},
		check(card) {
			return 10 - get.value(card);
		},
		filterCard: true,
		position: "he",
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			if (!target.hasSex("male")) {
				return false;
			}
			if (ui.selected.targets.length == 1) {
				return target.canUse({ name: "juedou" }, ui.selected.targets[0]);
			}
			return true;
		},
		targetprompt: ["先出杀", "后出杀"],
		selectTarget: 2,
		multitarget: true,
		async content(event, trigger, player) {
			const useCardEvent = event.targets[1].useCard({ name: "juedou", isCard: true }, event.targets[0], "noai");
			useCardEvent.animate = false;
			await game.delay(0.5);
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					if (ui.selected.targets.length == 0) {
						return -3;
					} else {
						return get.effect(target, { name: "juedou" }, ui.selected.targets[0], target);
					}
				},
			},
			expose: 0.4,
			threaten: 3,
		},
	},
	// 闭月
	biyue: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		frequent: true,
		preHidden: true,
		async content(event, trigger, player) {
			player.draw();
		},
	},
	// 华雄
	// 耀武
	yaowu: {
		trigger: { player: "damageBegin3" },
		audio: 2,
		filter(event, player) {
			return event.card?.name == "sha" && get.color(event.card) == "red" && event.source?.isIn();
		},
		forced: true,
		check() {
			return false;
		},
		async content(event, trigger, player) {
			await trigger.source.chooseDrawRecover(true);
		},
		ai: {
			neg: true,
			effect: {
				target(card, player, target, current) {
					if (card.name == "sha" && get.color(card) == "red") {
						return [1, -2];
					}
				},
			},
		},
	},
	// 公孙瓒
	// 义从
	yicong: {
		trigger: {
			player: ["changeHp"],
		},
		audio: 2,
		forced: true,
		filter(event, player) {
			return get.sgn(player.hp - 2.5) != get.sgn(player.hp - 2.5 - event.num);
		},
		content() {},
		mod: {
			globalFrom(from, to, current) {
				if (from.hp > 2) {
					return current - 1;
				}
			},
			globalTo(from, to, current) {
				if (to.hp <= 2) {
					return current + 1;
				}
			},
		},
		ai: {
			threaten: 0.8,
		},
	},
	// 潘凤
	// 狂斧
	kuangfu: {
		audio: 2,
		trigger: { source: "damageSource" },
		forced: true,
		filter(event, player) {
			if (player.hasSkill("kuangfu_used")) {
				return false;
			}
			return player.isPhaseUsing() && event.card && event.card.name == "sha" && event.player != player && event.player.isIn();
		},
		async content(event, trigger, player) {
			player.addTempSkill("kuangfu_used", "phaseChange");
			if (trigger.player.hp < player.hp) {
				player.draw(2);
			} else {
				player.loseHp();
			}
		},
		ai: {
			halfneg: true,
		},
		subSkill: {
			used: {
				charlotte: true,
			},
		},
	},
	// 甘夫人
	// 神智
	shenzhi: {
		audio: 2,
		trigger: { player: "phaseBegin" },
		check(event, player) {
			if (player.hp > 2) {
				return false;
			}
			var cards = player.getCards("h");
			if (cards.length <= player.hp) {
				return false;
			}
			if (cards.length > 3) {
				return false;
			}
			for (var i = 0; i < cards.length; i++) {
				if (get.value(cards[i]) > 7 || get.tag(cards[i], "recover") >= 1) {
					return false;
				}
			}
			return true;
		},
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		preHidden: true,
		content() {
			"step 0";
			var cards = player.getCards("h");
			event.bool = cards.length > player.hp;
			player.discard(cards);
			"step 1";
			if (event.bool) {
				player.recover();
			}
		},
	},
	// 淑慎
	shushen: {
		audio: 2,
		trigger: { player: "recoverEnd" },
		getIndex(event) {
			return event.num || 1;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), lib.filter.notMe)
				.set("ai", target => get.attitude(_status.event.player, target))
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			await target.draw(target.countCards("h") > 0 ? 1 : 2);
		},
		ai: { threaten: 0.8, expose: 0.1 },
	},
	// 乐进
	// 骁果
	xiaoguo: {
		audio: 2,
		trigger: { global: "phaseEnd" },
		filter(event, player) {
			return (
				event.player.isIn() &&
				event.player != player &&
				player.countCards("h", card => {
					if (_status.connectMode) {
						return true;
					}
					return get.type(card) == "basic" && lib.filter.cardDiscardable(card, player);
				})
			);
		},
		async cost(event, trigger, player) {
			const target = trigger.player;
			const next = player.chooseToDiscard(get.prompt(event.name.slice(0, -5)), (card, player) => {
				return get.type(card) == "basic";
			});
			next.set("ai", card => {
				return get.event().eff - get.useful(card);
			});
			next.set(
				"eff",
				(function () {
					if (target.hasSkillTag("noe")) {
						return get.attitude(_status.event.player, target);
					}
					return get.damageEffect(target, player, _status.event.player);
				})()
			);
			next.set("logSkill", [event.name.slice(0, -5), target]);
			event.result = await next.forResult();
		},
		popup: false,
		async content(event, trigger, player) {
			const target = trigger.player;
			const { bool } = await target
				.chooseToDiscard("he", "弃置一张装备牌，或受到1点伤害", { type: "equip" })
				.set("ai", card => {
					if (get.event().damage > 0) {
						return 0;
					}
					if (get.event().noe) {
						return 12 - get.value(card);
					}
					return -get.event().damage - get.value(card);
				})
				.set("damage", get.damageEffect(target, player, target))
				.set("noe", target.hasSkillTag("noe"))
				.forResult();
			if (!bool) {
				await target.damage();
			}
		},
	},
};

export default skills;
