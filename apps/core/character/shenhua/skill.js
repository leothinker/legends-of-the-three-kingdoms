import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	// 黄忠
	// 烈弓
	liegong: {
		audio: 2,
		audioname: ["re_huangzhong"],
		trigger: { player: "useCardToPlayered" },
		check(event, player) {
			return get.attitude(player, event.target) <= 0;
		},
		logTarget: "target",
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			const length = event.target.countCards("h");
			return length >= player.hp || length <= player.getAttackRange();
		},
		preHidden: true,
		async content(event, trigger, player) {
			trigger.getParent().directHit.push(trigger.target);
		},
		locked: false,
		mod: {
			attackRange(player, distance) {
				if (get.zhu(player, "shouyue")) {
					return distance + 1;
				}
			},
		},
		ai: {
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (get.attitude(player, arg.target) > 0 || arg.card.name != "sha") {
					return false;
				}
				const length = arg.target.countCards("h");
				return length >= player.hp || length <= player.getAttackRange();
			},
		},
	},
	// 魏延
	// 狂骨
	kuanggu: {
		audio: 2,
		audioname: ["re_weiyan", "ol_weiyan"],
		trigger: { source: "damageSource" },
		forced: true,
		filter(event, player) {
			return event.checkKuanggu && player.isDamaged();
		},
		async content(event, trigger, player) {
			await player.recover(trigger.num);
		},
	},
	// 夏侯渊
	// 神速
	shensu: {
		audio: "shensu1",
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		group: ["shensu1", "shensu2"],
		preHidden: ["shensu1", "shensu2"],
	},
	shensu1: {
		audio: 2,
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		trigger: { player: "phaseJudgeBefore" },
		sourceSkill: "shensu",
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt(event.skill), "跳过判定阶段和摸牌阶段，视为对一名其他角色使用一张【杀】", function (card, player, target) {
					if (player == target) {
						return false;
					}
					return player.canUse({ name: "sha" }, target, false);
				})
				.set("check", player.countCards("h") > 2)
				.set("ai", function (target) {
					if (!_status.event.check) {
						return 0;
					}
					return get.effect(target, { name: "sha" }, _status.event.player);
				})
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.skip("phaseDraw");
			await player.useCard({ name: "sha", isCard: true }, event.targets[0], false);
		},
	},
	shensu2: {
		audio: "shensu1",
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		trigger: { player: "phaseUseBefore" },
		sourceSkill: "shensu",
		filter(event, player) {
			return (
				player.countCards("he", function (card) {
					if (_status.connectMode) {
						return true;
					}
					return get.type(card) == "equip";
				}) > 0
			);
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCardTarget({
					prompt: get.prompt(event.skill),
					prompt2: "弃置一张装备牌并跳过出牌阶段，视为对一名其他角色使用一张【杀】",
					filterCard(card, player) {
						return get.type(card) == "equip" && lib.filter.cardDiscardable(card, player);
					},
					position: "he",
					filterTarget(card, player, target) {
						if (player == target) {
							return false;
						}
						return player.canUse({ name: "sha" }, target, false);
					},
					ai1(card) {
						if (_status.event.check) {
							return 0;
						}
						return 6 - get.value(card);
					},
					ai2(target) {
						if (_status.event.check) {
							return 0;
						}
						return get.effect(target, { name: "sha" }, _status.event.player);
					},
					check:
						player.countCards("hs", i => {
							return player.hasValueTarget(i, null, true);
						}) >
						player.hp - 1,
				})
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.discard(event.cards[0]);
			await player.useCard({ name: "sha", isCard: true }, event.targets[0], false);
		},
	},
	// 曹仁
	// 据守
	jushou: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		check(event, player) {
			return event.player.hp + player.countCards("h") < 4;
		},
		async content(event, trigger, player) {
			await player.draw(3);
			await player.turnOver();
		},
	},
	// 小乔
	// 天香
	tianxiang: {
		audio: 2,
		audioname: ["daxiaoqiao", "re_xiaoqiao", "ol_xiaoqiao"],
		trigger: { player: "damageBegin3" },
		filter(event, player) {
			return player.countCards("h", { suit: "heart" }) > 0 && event.num > 0;
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
						if (trigger.num > 1) {
							if (target.maxHp > 5 && target.hp > 1) {
								return -att / 10 + da;
							}
							return -att + da;
						}
						const eff = get.damageEffect(target, trigger.source, target, trigger.nature);
						if (att == 0) {
							return 0.1 + da;
						}
						if (eff >= 0 && trigger.num == 1) {
							return att + da;
						}
						if (target.hp == target.maxHp) {
							return -att + da;
						}
						if (target.hp == 1) {
							if (target.maxHp <= 4 && !target.hasSkillTag("maixie")) {
								if (target.maxHp <= 3) {
									return -att + da;
								}
								return -att / 2 + da;
							}
							return da;
						}
						if (target.hp == target.maxHp - 1) {
							if (target.hp > 2 || target.hasSkillTag("maixie")) {
								return att / 5 + da;
							}
							if (att > 0) {
								return 0.02 + da;
							}
							return 0.05 + da;
						}
						return att / 2 + da;
					},
					prompt: get.prompt2(event.skill),
				})
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.player = event.targets[0];
			trigger.player.addSkill("tianxiang2");
			await player.discard(event.cards[0]);
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return;
					}
					if (get.tag(card, "damage") && target.countCards("h") > 1) {
						return 0.7;
					}
				},
			},
			threaten(player, target) {
				if (target.countCards("h") == 0) {
					return 2;
				}
			},
		},
	},
	tianxiang2: {
		trigger: { player: ["damageAfter", "damageCancelled", "damageZero"] },
		forced: true,
		popup: false,
		audio: false,
		vanish: true,
		charlotte: true,
		sourceSkill: "tianxiang",
		async content(event, trigger, player) {
			player.removeSkill("tianxiang2");
			player.popup("tianxiang");
			if (player.getDamagedHp()) {
				await player.draw(player.getDamagedHp());
			}
		},
	},
	// 红颜
	hongyan: {
		audio: true,
		mod: {
			suit(card, suit) {
				if (suit == "spade") {
					return "heart";
				}
			},
		},
	},
	// 周泰
	// 不屈
	buqu: {
		audio: 2,
		trigger: { player: "changeHp" },
		filter(event, player) {
			return player.hp <= 0 && event.num < 0;
		},
		marktext: "创",
		intro: {
			markcount: "expansion",
			content: "expansion",
		},
		group: "buqu_recover",
		frequent: true,
		ondisable: true,
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				//delete player.nodying;
				player.loseToDiscardpile(cards);
				if (player.hp <= 0) {
					player.dying({});
				}
			}
		},
		process(player) {
			//delete player.nodying;
			const nums = [];
			const cards = player.getExpansions("buqu");
			for (let i = 0; i < cards.length; i++) {
				if (nums.includes(get.number(cards[i]))) {
					return false;
				} else {
					nums.push(get.number(cards[i]));
				}
			}
			return true;
			//player.nodying=true;
		},
		subSkill: {
			recover: {
				trigger: { player: "recoverAfter" },
				filter(event, player) {
					return player.getExpansions("buqu").length > 0 && event.num > 0;
				},
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					for (let i = trigger.num; i > 0; i--) {
						let cards = player.getExpansions("buqu");
						const count = cards.length;
						if (count <= 0 || player.hp + count <= 1) {
							return;
						}
						if (count > 1) {
							cards = (
								await player
									.chooseCardButton("不屈：移去一张“创”", true, cards)
									.set("ai", function (button) {
										const buttons = get.selectableButtons();
										for (let i = 0; i < buttons.length; i++) {
											if (
												buttons[i] != button &&
												get.number(buttons[i].link) == get.number(button.link) &&
												!ui.selected.buttons.includes(buttons[i])
											) {
												return 1;
											}
										}
										return 0;
									})
									.forResult()
							).links;
						}
						await player.loseToDiscardpile(cards);
					}
					if (lib.skill.buqu.process(player)) {
						if (player.isDying()) {
							const histories = [event];
							let evt = event;
							while (true) {
								evt = event.getParent("dying");
								if (!evt || evt.name != "dying" || histories.includes(evt)) {
									break;
								}
								histories.push(evt);
								if (evt.player == player) {
									evt.nodying = true;
								}
							}
						}
					}
				},
			},
		},
		async content(event, trigger, player) {
			const num = -trigger.num - Math.max(player.hp - trigger.num, 1) + 1;
			const next = player.addToExpansion(get.cards(num), "gain2");
			next.gaintag.add("buqu");
			await next;
			await player.showCards(get.translation(player) + "的不屈牌", player.getExpansions("buqu"));
			if (lib.skill.buqu.process(player)) {
				const evt = trigger.getParent();
				if (evt.name == "damage" || evt.name == "loseHp") {
					evt.nodying = true;
				}
			}
		},
		ai: {
			mingzhi: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
						let num = target.getExpansions("buqu").length || target.getHp();
						return (num + 1) / 5;
					}
				},
			},
		},
	},
	// 张角
	// 雷击
	leiji: {
		audio: 2,
		trigger: { player: ["useCard", "respond"] },
		filter(event, player) {
			return event.card.name == "shan";
		},
		preHidden: true,
		line: "thunder",
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill))
				.set("ai", target => {
					const player = get.player();
					if (target.hasSkill("hongyan")) {
						return 0;
					}
					return get.damageEffect(target, player, player, "thunder");
				})
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			const next = target.judge(card => {
				if (get.suit(card) == "spade") {
					return -4;
				}
				return 4;
			});
			next.judge2 = result => !result.bool;
			const result = await next.forResult();
			if (!result?.bool) {
				await target.damage(2, "thunder");
			}
		},
		ai: {
			mingzhi: false,
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
						) &&
						game.hasPlayer(function (current) {
							return get.attitude(target, current) < 0 && get.damageEffect(current, target, target, "thunder") > 0;
						})
					) {
						if (card.name === "sha") {
							if (!target.mayHaveShan(player, "use")) {
								return;
							}
						} else if (!target.mayHaveShan(player)) {
							return 1 - 0.1 * Math.min(5, target.countCards("hs"));
						}
						if (!target.hasSkillTag("rejudge")) {
							return [1, 1];
						}
						let pos = player.hasSkillTag("viewHandcard", null, target, true) ? "hes" : "e";
						if (
							target.hasCard(function (cardx) {
								return get.suit(cardx) === "spade";
							}, pos)
						) {
							return [1, 4];
						}
						if (pos === "e") {
							return [1, Math.min(4, 1 + 0.75 * Math.max(1, target.countCards("hs")))];
						}
						return [1, 1];
					}
				},
			},
		},
	},
	// 鬼道
	guidao: {
		audio: 2,
		audioname: ["sp_zhangjiao"],
		trigger: { global: "judge" },
		filter(event, player) {
			return player.countCards("hes", { color: "black" }) > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard(
					`${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`,
					"hes",
					card => {
						const player = get.player();
						if (get.color(card) !== "black") {
							return false;
						}
						const mod2 = game.checkMod(card, player, "unchanged", "cardEnabled2", player);
						if (mod2 != "unchanged") {
							return mod2;
						}
						const mod = game.checkMod(card, player, "unchanged", "cardRespondable", player);
						if (mod != "unchanged") {
							return mod;
						}
						return true;
					}
				)
				.set("ai", card => {
					const trigger = get.event().getTrigger();
					const { player, judging } = get.event();
					const result = trigger.judge(card) - trigger.judge(judging);
					const attitude = get.attitude(player, trigger.player);
					let val = get.value(card);
					if (get.subtype(card) == "equip2") {
						val /= 2;
					} else {
						val /= 6;
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
				.forResult();
		},
		popup: false,
		async content(event, trigger, player) {
			const next = player.respond(event.cards, event.name, "highlight", "noOrdering");
			await next;
			const { cards } = next;
			if (cards?.length) {
				player.$gain2(trigger.player.judging[0]);
				await player.gain(trigger.player.judging[0]);
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
	// 黄天
	huangtian: {
		audio: "huangtian2",
		audioname: ["zhangjiao", "re_zhangjiao"],
		audioname2: {
			pe_jun_zhangjiao: ["xinhuangtian2_re_zhangjiao1.mp3", "xinhuangtian2_re_zhangjiao2.mp3"],
		},
		global: "huangtian2",
		zhuSkill: true,
	},
	huangtian2: {
		audio: 2,
		enable: "phaseUse",
		discard: false,
		lose: false,
		delay: false,
		line: true,
		prepare(cards, player, targets) {
			targets[0].logSkill("huangtian");
		},
		prompt() {
			const player = _status.event.player;
			const list = game.filterPlayer(function (target) {
				return target != player && target.hasZhuSkill("huangtian", player);
			});
			let str = "将一张【闪】或【闪电】交给" + get.translation(list);
			if (list.length > 1) {
				str += "中的一人";
			}
			return str;
		},
		filter(event, player) {
			if (player.group != "qun") {
				return false;
			}
			if (player.countCards("h", "shan") + player.countCards("h", "shandian") == 0) {
				return 0;
			}
			return game.hasPlayer(function (target) {
				return target != player && target.hasZhuSkill("huangtian", player) && !target.hasSkill("huangtian3");
			});
		},
		filterCard(card) {
			return card.name == "shan" || card.name == "shandian";
		},
		log: false,
		visible: true,
		filterTarget(card, player, target) {
			return target != player && target.hasZhuSkill("huangtian", player) && !target.hasSkill("huangtian3");
		},
		//usable:1,
		//forceaudio:true,
		async content(event, trigger, player) {
			await player.give(event.cards, event.target);
			event.target.addTempSkill("huangtian3", "phaseUseEnd");
		},
		ai: {
			expose: 0.3,
			order: 10,
			result: {
				target: 5,
			},
		},
	},
	huangtian3: {},
	// 于吉
	// 蛊惑
	guhuo: {
		audio: 2,
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard(player, name) {
			return lib.inpile.includes(name) && player.countCards("hs") > 0;
		},
		filter(event, player) {
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
					return current != player && current.hp != 0 && (get.realAttitude || get.attitude)(current, player) < 0;
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
							return current != player && current.hp != 0 && (get.realAttitude || get.attitude)(current, player) < 0;
						});
						const cardx = lib.skill.guhuo_backup.viewAs;
						if (enemyNum) {
							if (card.name == cardx.name && (card.name != "sha" || get.is.sameNature(card, cardx))) {
								return 2 + Math.random() * 3;
							} else if (lib.skill.guhuo_backup.aiUse < 0.5 && !player.isDying()) {
								return 0;
							}
						}
						return 6 - get.value(card);
					},
					async precontent(event, trigger, player) {
						player.logSkill("guhuo");
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
				if (!player.countCards("hs")) {
					return false;
				}
			},
			threaten: 1.2,
			order: 8.1,
			result: {
				player: 1,
			},
		},
		subSkill: {
			guess: {
				trigger: {
					player: ["useCardBefore", "respondBefore"],
				},
				forced: true,
				silent: true,
				popup: false,
				firstDo: true,
				charlotte: true,
				filter(event, player) {
					return event.skill && event.skill.indexOf("guhuo_") == 0;
				},
				async content(event, trigger, player) {
					event.fake = false;
					event.betrayer = [];
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
					trigger.skill = "guhuo_backup";
					game.log(
						player,
						"声明",
						trigger.targets && trigger.targets.length ? "对" : "",
						trigger.targets || "",
						trigger.name == "useCard" ? "使用" : "打出",
						trigger.card
					);
					event.prompt =
						get.translation(player) +
						"声明" +
						(trigger.targets && trigger.targets.length ? "对" + get.translation(trigger.targets) : "") +
						(trigger.name == "useCard" ? "使用" : "打出") +
						(get.translation(trigger.card.nature) || "") +
						get.translation(trigger.card.name) +
						"，是否质疑？";
					event.targets = game
						.filterPlayer(function (current) {
							return current != player && current.hp != 0;
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
							event.betrayer.add(target);
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
					if (!event.betrayer.length) {
						return;
					}
					if (event.fake) {
						event.betrayer.forEach(target => target.popup("质疑正确", "wood"));
						await game.asyncDraw(event.betrayer);
						game.log(player, "声明的", trigger.card, "作废了");
						trigger.cancel();
						trigger.getParent().goto(0);
						trigger.line = false;
						event.clearUI = true;
					} else {
						event.betrayer.forEach(target => target.popup("质疑错误", "fire"));
						for (let target of event.betrayer) {
							await target.loseHp();
						}
						if (get.suit(card) != "heart") {
							game.log(player, "声明的", trigger.card, "作废了");
							trigger.cancel();
							trigger.getParent().goto(0);
							trigger.line = false;
							event.clearUI = true;
						}
					}
					await game.delay(2);
					if (event.clearUI) {
						game.broadcastAll(() => ui.clear());
					} // game.broadcastAll(ui.clear); 原来的代码抽象喵
				},
			},
			cheated: {
				trigger: {
					player: "gainAfter",
					global: "loseAsyncAfter",
				},
				charlotte: true,
				forced: true,
				silent: true,
				popup: false,
				firstDo: true,
				onremove: true,
				filter(event, player) {
					if (event.getParent().name == "draw") {
						return true;
					}
					var cards = event.getg(player);
					if (!cards.length) {
						return false;
					}
					return game.hasPlayer(current => {
						if (current == player) {
							return false;
						}
						var evt = event.getl(current);
						if (evt && evt.cards && evt.cards.length) {
							return true;
						}
						return false;
					});
				},
				async content(event, trigger, player) {
					player.removeSkill("guhuo_cheated");
				},
			},
		},
	},
	// 典韦
	// 强袭
	qiangxi: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		audioname: ["boss_lvbu3"],
		filterCard(card) {
			return get.subtype(card) == "equip1";
		},
		selectCard: [0, 1],
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			return player.inRange(target);
		},
		async content(event, trigger, player) {
			if (event.cards.length == 0) {
				await player.loseHp();
			}
			await event.target.damage("nocard");
		},
		check(card) {
			return 10 - get.value(card);
		},
		position: "he",
		ai: {
			damage: true,
			order: 8,
			result: {
				player(player, target) {
					if (ui.selected.cards.length) {
						return 0;
					}
					if (player.hp >= target.hp) {
						return -0.9;
					}
					if (player.hp <= 2) {
						return -10;
					}
					return -2;
				},
				target(player, target) {
					if (!ui.selected.cards.length) {
						if (player.hp < 2) {
							return 0;
						}
						if (player.hp == 2 && target.hp >= 2) {
							return 0;
						}
						if (target.hp > player.hp) {
							return 0;
						}
					}
					return get.damageEffect(target, player);
				},
			},
			threaten: 1.3,
		},
	},
	// 荀彧
	// 驱虎
	quhu: {
		audio: 2,
		audioname: ["re_xunyu", "ol_xunyu"],
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			if (player.countCards("h") == 0) {
				return false;
			}
			return game.hasPlayer(function (current) {
				return current.hp > player.hp && player.canCompare(current);
			});
		},
		filterTarget(card, player, target) {
			return target.hp > player.hp && player.canCompare(target);
		},
		async content(event, trigger, player) {
			const target = event.target;
			const { bool } = await player.chooseToCompare(target).forResult();
			if (!bool) {
				return void (await player.damage(target));
			}
			if (
				!game.hasPlayer(function (player) {
					return player != target && target.inRange(player);
				})
			) {
				return;
			}
			const result = await player
				.chooseTarget(function (card, player, target) {
					const source = _status.event.source;
					return target != source && source.inRange(target);
				}, true)
				.set("ai", function (target) {
					return get.damageEffect(target, _status.event.source, player);
				})
				.set("source", target)
				.forResult();
			if (!result.bool || !result.targets || !result.targets.length) {
				return;
			}
			target.line(result.targets[0], "green");
			await result.targets[0].damage(target);
		},
		ai: {
			order: 0.5,
			result: {
				target(player, target) {
					const att = get.attitude(player, target);
					const oc = target.countCards("h") == 1;
					if (att > 0 && oc) {
						return 0;
					}
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						if (players[i] != target && players[i] != player && target.inRange(players[i])) {
							if (get.damageEffect(players[i], target, player) > 0) {
								return att > 0 ? att / 2 : att - (oc ? 5 : 0);
							}
						}
					}
					return 0;
				},
				player(player, target) {
					if (target.hasSkillTag("jueqing", false, target)) {
						return -10;
					}
					const hs = player.getCards("h");
					let mn = 1;
					for (let i = 0; i < hs.length; i++) {
						mn = Math.max(mn, get.number(hs[i]));
					}
					if (mn <= 11 && player.hp < 2) {
						return -20;
					}
					let max = player.maxHp - hs.length;
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						if (get.attitude(player, players[i]) > 2) {
							max = Math.max(Math.min(5, players[i].hp) - players[i].countCards("h"), max);
						}
					}
					switch (max) {
						case 0:
							return mn == 13 ? 0 : -20;
						case 1:
							return mn >= 12 ? 0 : -15;
						case 2:
							return 0;
						case 3:
							return 1;
						default:
							return max;
					}
				},
			},
			expose: 0.2,
		},
	},
	jieming: {
		audio: 2,
		trigger: { player: "damageEnd" },
		getIndex(event) {
			return event.num;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					return true; //target.countCards('h')<Math.min(target.maxHp,5); // 没有卷入格式化大劫的上古代码碎片喵
				})
				.set("ai", function (target) {
					let att = get.attitude(_status.event.player, target);
					if (target.hasSkillTag("nogain")) {
						att /= 6;
					}
					if (att > 2) {
						return Math.max(0, Math.min(5, target.maxHp) - target.countCards("h"));
					}
					return att / 3;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			for (const target of event.targets) {
				await target.drawTo(Math.min(5, target.maxHp));
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
						const players = game.filterPlayer();
						let max = 0;
						for (let i = 0; i < players.length; i++) {
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
	// 节命

	// 庞统
	// 连环
	lianhuan: {
		audio: 2,
		hiddenCard(player, name) {
			return name == "tiesuo" && player.hasCard(card => get.suit(card) == "club", "sh");
		},
		enable: "chooseToUse",
		filter(event, player) {
			if (!player.hasCard(card => get.suit(card) == "club", "sh")) {
				return false;
			}
			return event.type == "phase" || event.filterCard(get.autoViewAs({ name: "tiesuo" }, "unsure"), player, event);
		},
		position: "hs",
		filterCard(card, player, event) {
			if (!event) {
				event = _status.event;
			}
			if (get.suit(card) != "club") {
				return false;
			}
			if (event.type == "phase" && get.position(card) != "s" && player.canRecast(card)) {
				return true;
			} else {
				if (game.checkMod(card, player, "unchanged", "cardEnabled2", player) === false) {
					return false;
				}
				const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
				return event._backup.filterCard(cardx, player, event);
			}
		},
		filterTarget(fuck, player, target) {
			const card = ui.selected.cards[0],
				event = _status.event,
				backup = event._backup;
			if (!card || game.checkMod(card, player, "unchanged", "cardEnabled2", player) === false) {
				return false;
			}
			const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
			return backup.filterCard(cardx, player, event) && backup.filterTarget(cardx, player, target);
		},
		selectTarget() {
			const card = ui.selected.cards[0],
				event = _status.event,
				player = event.player,
				backup = event._backup;
			let recast = false,
				use = false;
			const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
			if (event.type == "phase" && player.canRecast(card)) {
				recast = true;
			}
			if (card && game.checkMod(card, player, "unchanged", "cardEnabled2", player) !== false) {
				if (backup.filterCard(cardx, player, event)) {
					use = true;
				}
			}
			if (!use) {
				return [0, 0];
			} else {
				const select = backup.selectTarget(cardx, player);
				if (recast && select[0] > 0) {
					select[0] = 0;
				}
				return select;
			}
		},
		filterOk() {
			const card = ui.selected.cards[0],
				event = _status.event,
				player = event.player,
				backup = event._backup;
			const selected = ui.selected.targets.length;
			let recast = false,
				use = false;
			const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
			if (event.type == "phase" && player.canRecast(card)) {
				recast = true;
			}
			if (card && game.checkMod(card, player, "unchanged", "cardEnabled2", player) !== false) {
				if (backup.filterCard(cardx, player, event)) {
					use = true;
				}
			}
			if (recast && selected == 0) {
				return true;
			} else if (use) {
				const select = backup.selectTarget(cardx, player);
				if (select[0] <= -1) {
					return true;
				}
				return selected >= select[0] && selected <= select[1];
			}
		},
		ai1(card) {
			return 6 - get.value(card);
		},
		ai2(target) {
			const player = get.player();
			return get.effect(target, { name: "tiesuo" }, player, player);
		},
		discard: false,
		lose: false,
		delay: false,
		viewAs(cards, player) {
			return {
				name: "tiesuo",
			};
		},
		prepare: () => true,
		async precontent(event, trigger, player) {
			const result = event.result;
			if (!result?.targets?.length) {
				delete result.card;
			}
		},
		async content(event, trigger, player) {
			await player.recast(event.cards);
		},
		ai: {
			order(item, player) {
				if (
					game.hasPlayer(current => get.effect(current, { name: "tiesuo" }, player, player) > 0) ||
					player.hasCard(card => get.suit(card) == "club" && player.canRecast(card), "h")
				) {
					return 8;
				}
				return 1;
			},
			result: { player: 1 },
		},
	},
	// 涅槃
	oldniepan: {
		audio: "niepan",
		audioname2: { sb_pangtong: "sbniepan" },
		enable: "chooseToUse",
		skillAnimation: true,
		limited: true,
		animationColor: "orange",
		filter(event, player) {
			if (event.type == "dying") {
				if (player != event.dying) {
					return false;
				}
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.storage.oldniepan = true;
			await player.discard(player.getCards("hej"));
			await player.link(false);
			await player.turnOver(false);
			await player.draw(3);
			if (player.hp < 3) {
				await player.recover(3 - player.hp);
			}
		},
		ai: {
			order: 1,
			skillTagFilter(player, arg, target) {
				if (player != target || player.storage.oldniepan) {
					return false;
				}
			},
			save: true,
			result: {
				player(player) {
					if (player.hp <= 0) {
						return 10;
					}
					if (player.hp <= 2 && player.countCards("he") <= 1) {
						return 10;
					}
					return 0;
				},
			},
			threaten(player, target) {
				if (!target.storage.oldniepan) {
					return 0.6;
				}
			},
		},
	},

	// 卧龙诸葛
	// 火计
	// 八阵
	// 看破
	huoji: {
		audio: 2,
		enable: "chooseToUse",
		filterCard(card) {
			return get.color(card) == "red";
		},
		viewAs: { name: "huogong" },
		viewAsFilter(player) {
			if (!player.countCards("hs", { color: "red" })) {
				return false;
			}
		},
		position: "hs",
		prompt: "将一张红色牌当火攻使用",
		check(card) {
			const player = get.player();
			if (player.countCards("h") > player.hp) {
				return 6 - get.value(card);
			}
			return 3 - get.value(card);
		},
		ai: {
			fireAttack: true,
		},
	},
	bazhen: {
		audio: 2,
		audioname: ["re_sp_zhugeliang", "ol_sp_zhugeliang", "ol_pangtong"],
		group: "bazhen_bagua",
		locked: true,
		init(player, skill) {
			player.addExtraEquip(skill, "bagua", true, player => player.hasEmptySlot(2) && lib.card.bagua);
		},
		onremove(player, skill) {
			player.removeExtraEquip(skill);
		},
	},
	bazhen_bagua: {
		audio: "bazhen",
		audioname: ["re_sp_zhugeliang", "ol_sp_zhugeliang", "ol_pangtong"],
		equipSkill: true,
		noHidden: true,
		inherit: "bagua_skill",
		sourceSkill: "bazhen",
		filter(event, player) {
			if (!lib.skill.bagua_skill.filter(event, player)) {
				return false;
			}
			if (!player.hasEmptySlot(2)) {
				return false;
			}
			return true;
		},
		ai: {
			respondShan: true,
			freeShan: true,
			skillTagFilter(player, tag, arg) {
				if (tag !== "respondShan" && tag !== "freeShan") {
					return;
				}
				if (!player.hasEmptySlot(2) || player.hasSkillTag("unequip2")) {
					return false;
				}
				if (!arg || !arg.player) {
					return true;
				}
				if (
					arg.player.hasSkillTag("unequip", false, {
						target: player,
					})
				) {
					return false;
				}
				return true;
			},
			effect: {
				target(card, player, target) {
					if (player == target && get.subtype(card) == "equip2") {
						if (get.equipValue(card) <= 7.5) {
							return 0;
						}
					}
					if (!target.hasEmptySlot(2)) {
						return;
					}
					return lib.skill.bagua_skill.ai.effect.target.apply(this, arguments);
				},
			},
		},
	},
	kanpo: {
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "wuxie" && get.color(card) != "black") {
					return;
				}
				const cards = player.getCards("hs", function (card) {
					return get.name(card) == "wuxie" || get.color(card) == "black";
				});
				cards.sort(function (a, b) {
					return (get.name(b) == "wuxie" ? 1 : 2) - (get.name(a) == "wuxie" ? 1 : 2);
				});
				const geti = function () {
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
				return lib.skill.kanpo.mod.aiValue.apply(this, arguments);
			},
		},
		locked: false,
		audio: 2,
		enable: "chooseToUse",
		filterCard(card) {
			return get.color(card) == "black";
		},
		viewAsFilter(player) {
			return player.countCards("hs", { color: "black" }) > 0;
		},
		viewAs: { name: "wuxie" },
		position: "hs",
		prompt: "将一张黑色手牌当无懈可击使用",
		check(card) {
			const tri = _status.event.getTrigger();
			if (tri && tri.card && tri.card.name == "chiling") {
				return -1;
			}
			return 8 - get.value(card);
		},
		threaten: 1.2,
	},

	// 太史慈
	// 天义
	tianyi: {
		audio: 2,
		audioname: ["re_taishici"],
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return player.canCompare(target);
		},
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			const { bool } = await player.chooseToCompare(event.target).forResult();
			if (bool) {
				player.addTempSkill("tianyi2");
			} else {
				player.addTempSkill("tianyi3");
			}
		},
		ai: {
			order(name, player) {
				const cards = player.getCards("h");
				if (player.countCards("h", "sha") == 0) {
					return 1;
				}
				for (let i = 0; i < cards.length; i++) {
					if (cards[i].name != "sha" && get.number(cards[i]) > 11 && get.value(cards[i]) < 7) {
						return 9;
					}
				}
				return get.order({ name: "sha" }) - 1;
			},
			result: {
				player(player) {
					if (player.countCards("h", "sha") > 0) {
						return 0.6;
					}
					const num = player.countCards("h");
					if (num > player.hp) {
						return 0;
					}
					if (num == 1) {
						return -2;
					}
					if (num == 2) {
						return -1;
					}
					return -0.7;
				},
				target(player, target) {
					const num = target.countCards("h");
					if (num == 1) {
						return -1;
					}
					if (num == 2) {
						return -0.7;
					}
					return -0.5;
				},
			},
			threaten: 1.3,
		},
	},
	tianyi2: {
		mod: {
			targetInRange(card, player, target, now) {
				if (card.name == "sha") {
					return true;
				}
			},
			selectTarget(card, player, range) {
				if (card.name == "sha" && range[1] != -1) {
					range[1]++;
				}
			},
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + 1;
				}
			},
		},
		charlotte: true,
	},
	tianyi3: {
		mod: {
			cardEnabled(card) {
				if (card.name == "sha") {
					return false;
				}
			},
		},
		charlotte: true,
	},
	// 庞德
	mengjin: {
		audio: 2,
		trigger: { player: "shaMiss" },
		//priority:-1,
		filter(event) {
			return event.target.countCards("he") > 0;
		},
		check(event, player) {
			return get.attitude(player, event.target) < 0;
		},
		logTarget: "target",
		async content(event, trigger, player) {
			await player.discardPlayerCard("he", trigger.target, true);
		},
	},
	// 颜良文丑
	shuangxiong: {
		audio: 2,
		audioname: ["re_yanwen"],
		group: "shuangxiong_judge",
		subSkill: {
			judge: {
				audio: "shuangxiong",
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
				preHidden: true,
				prompt2: () => "进行一次判定，本回合可以将一张与此牌颜色不同的手牌当作【决斗】使用",
				async content(event, trigger, player) {
					trigger.changeToZero();
					await player.judge().set("callback", lib.skill.shuangxiong_judge.callback);
				},
				async callback(event, trigger, player) {
					await player.gain(event.card, "gain2");
					player.addTempSkill("shuangxiong_viewas");
					player.markAuto("shuangxiong_viewas", [event.judgeResult.color]);
				},
			},
			viewas: {
				charlotte: true,
				onremove: true,
				audio: "shuangxiong",
				logAudio: () => "shuangxiong2.mp3",
				enable: "chooseToUse",
				viewAs: { name: "juedou" },
				position: "hs",
				viewAsFilter(player) {
					return player.hasCard(card => lib.skill.shuangxiong_viewas.filterCard(card, player), "hs");
				},
				filterCard(card, player) {
					const color = get.color(card),
						colors = player.getStorage("shuangxiong_viewas");
					for (const i of colors) {
						if (color != i) {
							return true;
						}
					}
					return false;
				},
				prompt() {
					const colors = _status.event.player.getStorage("shuangxiong_viewas");
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
			re_yanwen1: { audio: true },
			re_yanwen2: { audio: true },
		},
	},
	shuangxiong1: {
		audio: true,
		trigger: { player: "phaseDrawBegin1" },
		sourceSkill: "shuangxiong",
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
		preHidden: true,
		prompt2: () => "进行一次判定，本回合可以将一张与此牌颜色不同的手牌当作【决斗】使用",
		async content(event, trigger, player) {
			trigger.changeToZero();
			await player.judge().set("callback", lib.skill.shuangxiong1.callback);
		},
		async callback(event, trigger, player) {
			await player.gain(event.card, "gain2");
			player.addTempSkill("shuangxiong2");
			player.markAuto("shuangxiong2", [event.judgeResult.color]);
		},
	},
	shuangxiong2: {
		charlotte: true,
		onremove: true,
		audio: true,
		audioname2: {
			re_yanwen: "shuangxiong_re_yanwen2",
		},
		enable: "chooseToUse",
		viewAs: { name: "juedou" },
		position: "hs",
		sourceSkill: "shuangxiong",
		viewAsFilter(player) {
			return player.hasCard(card => lib.skill.shuangxiong2.filterCard(card, player), "hs");
		},
		filterCard(card, player) {
			const color = get.color(card),
				colors = player.getStorage("shuangxiong2");
			for (const i of colors) {
				if (color != i) {
					return true;
				}
			}
			return false;
		},
		prompt() {
			const colors = _status.event.player.getStorage("shuangxiong2");
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
	// 袁绍
	// 乱击
	luanji: {
		audio: 2,
		enable: "phaseUse",
		position: "hs",
		viewAs: { name: "wanjian" },
		filterCard(card, player) {
			if (ui.selected.cards.length) {
				return get.suit(card) == get.suit(ui.selected.cards[0]);
			}
			const cards = player.getCards("hs");
			for (let i = 0; i < cards.length; i++) {
				if (card != cards[i]) {
					if (get.suit(card) == get.suit(cards[i])) {
						return true;
					}
				}
			}
			return false;
		},
		selectCard: 2,
		complexCard: true,
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
				order: 8.5,
			},
		},
	},
	// 血裔
	xueyi: {
		trigger: { player: "phaseDiscardBefore" },
		audio: 2,
		audioname: ["re_yuanshao"],
		audioname2: {
			pe_jun_yuanshao: ["xueyi_re_yuanshao1.mp3", "xueyi_re_yuanshao2.mp3"],
		},
		forced: true,
		firstDo: true,
		filter(event, player) {
			return (
				player.hasZhuSkill("xueyi") &&
				game.hasPlayer(function (current) {
					return current != player && current.group == "qun";
				}) &&
				player.countCards("h") > player.hp
			);
		},
		async content() { },
		mod: {
			maxHandcard(player, num) {
				if (player.hasZhuSkill("xueyi")) {
					return (
						num +
						game.countPlayer(function (current) {
							if (player != current && current.group == "qun") {
								return 2;
							}
						})
					);
				}
				return num;
			},
		},
		zhuSkill: true,
	},
	// 徐晃
	// 断粮
	gzduanliang: {
		audio: "duanliang1",
		audioname: ["re_xuhuang"],
		group: ["duanliang1", "duanliang2"],
		ai: {
			threaten: 1.2,
		},
	},
	duanliang: {
		audio: "duanliang1",
		audioname: ["re_xuhuang"],
		group: ["duanliang1", "duanliang3"],
		ai: {
			threaten: 1.2,
		},
	},
	duanliang1: {
		audio: 2,
		audioname: ["re_xuhuang"],
		enable: "chooseToUse",
		sourceSkill: "duanliang",
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
	duanliang2: {
		mod: {
			targetInRange(card, player, target) {
				if (card.name == "bingliang") {
					if (get.distance(player, target) <= 2) {
						return true;
					}
				}
			},
		},
	},
	duanliang3: {
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
	// 曹丕
	// 行殇
	xingshang: {
		audio: 2,
		audioname2: { caoying: "lingren_xingshang" },
		trigger: { global: "die" },
		preHidden: true,
		filter(event) {
			return event.player.countCards("he") > 0;
		},
		async content(event, trigger, player) {
			event.togain = trigger.player.getCards("he");
			await player.gain(event.togain, trigger.player, "giveAuto", "bySelf");
		},
	},
	// 放逐
	// 颂威
	fangzhu: {
		audio: 2,
		audioname2: { new_simayi: "fangzhu_new_simayi" },
		trigger: { player: "damageEnd" },
		preHidden: true,
		async cost(event, trigger, player) {
			const draw = player.getDamagedHp();
			event.result = await player
				.chooseTarget(
					get.prompt(event.skill),
					"令一名其他角色翻面" + (draw > 0 ? "并摸" + get.cnNumber(draw) + "张牌" : ""),
					function (card, player, target) {
						return player != target;
					}
				)
				.setHiddenSkill(event.skill)
				.set("ai", target => {
					if (target.hasSkillTag("noturn")) {
						return 0;
					}
					const player = _status.event.player;
					const current = _status.currentPhase;
					const dis = current ? get.distance(current, target, "absolute") : 1;
					const draw = player.getDamagedHp();
					const att = get.attitude(player, target);
					if (att == 0) {
						return target.hasJudge("lebu") ? Math.random() / 3 : Math.sqrt(get.threaten(target)) / 5 + Math.random() / 2;
					}
					if (att > 0) {
						if (target.isTurnedOver()) {
							return att + draw;
						}
						if (draw < 4) {
							return -1;
						}
						if (current && target.getSeatNum() > current.getSeatNum()) {
							return att + draw / 3;
						}
						return (10 * Math.sqrt(Math.max(0.01, get.threaten(target)))) / (3.5 - draw) + dis / (2 * game.countPlayer());
					} else {
						if (target.isTurnedOver()) {
							return att - draw;
						}
						if (draw >= 5) {
							return -1;
						}
						if (current && target.getSeatNum() <= current.getSeatNum()) {
							return -att + draw / 3;
						}
						return (4.25 - draw) * 10 * Math.sqrt(Math.max(0.01, get.threaten(target))) + (2 * game.countPlayer()) / dis;
					}
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const draw = player.getDamagedHp();
			if (draw > 0) {
				await event.targets[0].draw(draw);
			}
			await event.targets[0].turnOver();
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
						if (target.hp <= 1) {
							return;
						}
						if (!target.hasFriend()) {
							return;
						}
						let hastarget = false;
						let turnfriend = false;
						const players = game.filterPlayer();
						for (let i = 0; i < players.length; i++) {
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
	fangzhu_new_simayi: { audio: 1 },
	songwei: {
		group: "songwei2",
		audioname: ["re_caopi"],
		audio: "songwei2",
		zhuSkill: true,
	},
	songwei2: {
		audio: 2,
		audioname: ["re_caopi"],
		audioname2: {
			pe_jun_caopi: "sbsongwei",
		},
		forceaudio: true,
		trigger: { global: "judgeEnd" },
		sourceSkill: "songwei",
		filter(event, player) {
			if (event.player == player || event.player.group != "wei") {
				return false;
			}
			if (event.result.color != "black") {
				return false;
			}
			return player.hasZhuSkill("songwei", event.player);
		},
		async cost(event, trigger, player) {
			event.result = await trigger.player
				.chooseBool("是否发动【颂威】，令" + get.translation(player) + "摸一张牌？")
				.set("choice", get.attitude(trigger.player, player) > 0)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.player.line(player, "green");
			player.draw();
		},
	},
	// 孙坚
	yinghun: {
		audio: 2,
		audioname: ["re_sunjian", "sunce", "re_sunben", "re_sunce", "ol_sunjian"],
		audioname2: {
			re_sunyi: "gzyinghun_re_sunyi",
			boss_sunce: "yinghun_sunce",
		},
		mod: {
			aiOrder(player, card, num) {
				if (num > 0 && _status.event && _status.event.type == "phase" && get.tag(card, "recover")) {
					if (player.needsToDiscard()) {
						return num / 3;
					}
					return 0;
				}
			},
		},
		locked: false,
		trigger: { player: "phaseZhunbeiBegin" },
		preHidden: true,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					const player = _status.event.player;
					if (player.getDamagedHp() == 1 && target.countCards("he") == 0) {
						return 0;
					}
					if (get.attitude(_status.event.player, target) > 0) {
						return 10 + get.attitude(_status.event.player, target);
					}
					if (player.getDamagedHp() == 1) {
						return -1;
					}
					return 1;
				})
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const num = player.getDamagedHp();
			const [target] = event.targets;
			let directcontrol = num == 1;
			if (!directcontrol) {
				const str1 = "摸" + get.cnNumber(num, true) + "弃一";
				const str2 = "摸一弃" + get.cnNumber(num, true);
				directcontrol =
					str1 ==
					(
						await player
							.chooseControl(str1, str2, function (event, player) {
								if (player.isHealthy()) {
									return 1 - _status.event.choice;
								}
								return _status.event.choice;
							})
							.set("choice", get.attitude(player, target) > 0 ? 0 : 1)
							.forResult()
					).control;
			}
			if (directcontrol) {
				if (num > 0) {
					await target.draw(num);
				}
				await target.chooseToDiscard(true, "he");
			} else {
				await target.draw();
				if (num > 0) {
					await target.chooseToDiscard(num, true, "he", "allowChooseAll");
				}
			}
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (
						get.tag(card, "damage") &&
						get.itemtype(player) === "player" &&
						target.hp >
						(player.hasSkillTag("damageBonus", true, {
							target: target,
							card: card,
						})
							? 2
							: 1)
					) {
						return [1, 0.5];
					}
				},
			},
			threaten(player, target) {
				return Math.max(0.5, target.getDamagedHp() / 2);
			},
			maixie: true,
		},
	},
	gzyinghun: {
		audio: "yinghun",
		audioname: ["re_sunjian", "sunce", "re_sunben", "re_sunce", "ol_sunjian", "sb_sunce"],
		audioname2: {
			re_sunyi: "gzyinghun_re_sunyi",
		},
		mod: {
			aiOrder(player, card, num) {
				if (num > 0 && _status.event && _status.event.type == "phase" && get.tag(card, "recover")) {
					if (player.needsToDiscard()) {
						return num / 3;
					}
					return 0;
				}
			},
		},
		locked: false,
		trigger: { player: "phaseZhunbeiBegin" },
		filter(event, player) {
			return player.getDamagedHp() > 0;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					const player = _status.event.player;
					if (player.getDamagedHp() == 1 && target.countCards("he") == 0) {
						return 0;
					}
					if (get.attitude(_status.event.player, target) > 0) {
						return 10 + get.attitude(_status.event.player, target);
					}
					if (player.getDamagedHp() == 1) {
						return -1;
					}
					return 1;
				})
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const num = player.getDamagedHp();
			const [target] = event.targets;
			let directcontrol = num == 1;
			if (!directcontrol) {
				const str1 = "摸" + get.cnNumber(num, true) + "弃一";
				const str2 = "摸一弃" + get.cnNumber(num, true);
				directcontrol =
					str1 ==
					(
						await player
							.chooseControl(str1, str2, function (event, player) {
								return _status.event.choice;
							})
							.set("choice", get.attitude(player, target) > 0 ? str1 : str2)
							.forResult()
					).control;
			}
			if (directcontrol) {
				await target.draw(num);
				await target.chooseToDiscard(true, "he");
			} else {
				await target.draw();
				await target.chooseToDiscard(num, true, "he");
			}
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (
						get.tag(card, "damage") &&
						get.itemtype(player) === "player" &&
						target.hp >
						(player.hasSkillTag("damageBonus", true, {
							target: target,
							card: card,
						})
							? 2
							: 1)
					) {
						return [1, 0.5];
					}
				},
			},
			threaten(player, target) {
				return Math.max(0.5, target.getDamagedHp() / 2);
			},
			maixie: true,
		},
	},

	// 董卓
	// 酒池
	jiuchi: {
		audio: 2,
		audioname: ["re_dongzhuo"],
		enable: "chooseToUse",
		filterCard(card) {
			return get.suit(card) == "spade";
		},
		viewAs: { name: "jiu" },
		viewAsFilter(player) {
			if (!player.countCards("hs", { suit: "spade" })) {
				return false;
			}
			return true;
		},
		prompt: "将一张黑桃手牌当酒使用",
		check(card) {
			if (_status.event.type == "dying") {
				return 1 / Math.max(0.1, get.value(card));
			}
			return 4 - get.value(card);
		},
		ai: {
			threaten: 1.5,
		},
	},
	// 肉林
	roulin: {
		audio: 2,
		audioname: ["re_dongzhuo", "ol_dongzhuo"],
		trigger: { player: "useCardToPlayered", target: "useCardToTargeted" },
		forced: true,
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			if (player == event.player) {
				return event.target.hasSex("female");
			}
			return event.player.hasSex("female");
		},
		check(event, player) {
			return player == event.player;
		},
		async content(event, trigger, player) {
			const id = (player == trigger.player ? trigger.target : player).playerid;
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
			halfneg: true,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (tag === "directHit_ai") {
					return;
				}
				if (arg.card.name != "sha" || !arg.target.hasSex("female") || arg.target.countCards("h", "shan") > 1) {
					return false;
				}
			},
		},
	},
	// 崩坏
	benghuai: {
		audio: 2,
		audioname: ["re_dongzhuo", "ol_dongzhuo"],
		audioname2: {
			zhugedan: "benghuai_zhugedan",
			re_zhugedan: "benghuai_re_zhugedan",
		},
		trigger: { player: "phaseJieshuBegin" },
		forced: true,
		check() {
			return false;
		},
		filter(event, player) {
			return !player.isMinHp();
		},
		async content(event, trigger, player) {
			const { control } = await player
				.chooseControl("baonue_hp", "baonue_maxHp", function (event, player) {
					if (player.hp == player.maxHp) {
						return "baonue_hp";
					}
					if (player.hp < player.maxHp - 1 || player.hp <= 2) {
						return "baonue_maxHp";
					}
					return "baonue_hp";
				})
				.set("prompt", "崩坏：失去1点体力或减1点体力上限")
				.forResult();
			if (control == "baonue_hp") {
				await player.loseHp();
			} else {
				await player.loseMaxHp(true);
			}
		},
		ai: {
			threaten: 0.5,
			neg: true,
		},
	},
	// 暴虐
	baonue: {
		group: "baonue2",
		audioname: ["re_dongzhuo"],
		audio: "baonue2",
		zhuSkill: true,
	},
	baonue2: {
		audio: 2,
		audioname: ["re_dongzhuo"],
		//forceaudio:true,
		trigger: { global: "damageSource" },
		sourceSkill: "baonue",
		filter(event, player) {
			if (player == event.source || !event.source || event.source.group != "qun") {
				return false;
			}
			return player.hasZhuSkill("baonue", event.source);
		},
		async cost(event, trigger, player) {
			event.result = await trigger.source
				.chooseBool("是否对" + get.translation(player) + "发动【暴虐】？")
				.set("choice", get.attitude(trigger.source, player) > 0)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.source.line(player, "green");
			const next = trigger.source.judge(function (card) {
				if (get.suit(card) == "spade") {
					return 4;
				}
				return 0;
			});
			next.judge2 = function (result) {
				return result.bool ? true : false;
			};
			const result = await next.forResult();
			if (result.suit == "spade") {
				await player.recover();
			}
		},
	},
	// 祝融
	// 巨象
	juxiang: {
		//unique:true,
		locked: true,
		audio: "juxiang1",
		audioname: ["re_zhurong", "ol_zhurong"],
		group: ["juxiang1", "juxiang2"],
		preHidden: ["juxiang1", "juxiang2"],
		ai: {
			effect: {
				target(card) {
					if (card.name == "nanman") {
						return [0, 1, 0, 0];
					}
				},
			},
		},
	},
	juxiang1: {
		audio: 2,
		audioname: ["re_zhurong", "ol_zhurong"],
		trigger: { target: "useCardToBefore" },
		forced: true,
		priority: 15,
		sourceSkill: "juxiang",
		filter(event, player) {
			return event.card.name == "nanman";
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
	},
	juxiang2: {
		audio: "juxiang1",
		audioname: ["re_zhurong", "ol_zhurong"],
		trigger: { global: "useCardAfter" },
		forced: true,
		sourceSkill: "juxiang",
		filter(event, player) {
			return event.card.name == "nanman" && event.player != player && event.cards.someInD();
		},
		async content(event, trigger, player) {
			await player.gain(trigger.cards.filterInD(), "gain2");
		},
	},
	// 烈刃
	lieren: {
		audio: 2,
		audioname: ["boss_lvbu3", "ol_zhurong"],
		trigger: { source: "damageSource" },
		filter(event, player) {
			if (event._notrigger.includes(event.player)) {
				return false;
			}
			return (
				event.card && event.card.name == "sha" && event.getParent().name == "sha" && event.player.isIn() && player.canCompare(event.player)
			);
		},
		check(event, player) {
			return get.attitude(player, event.player) < 0 && player.countCards("h") > 1;
		},
		//priority:5,
		async content(event, trigger, player) {
			const result = await player.chooseToCompare(trigger.player).forResult();
			if (result.bool && trigger.player.countGainableCards(player, "he")) {
				await player.gainPlayerCard(trigger.player, true, "he");
			}
		},
	},
	// 孟获
	// 祸首
	huoshou: {
		audio: "huoshou1",
		audioname: ["re_menghuo"],
		locked: true,
		group: ["huoshou1", "huoshou2"],
		preHidden: ["huoshou1", "huoshou2"],
		ai: {
			halfneg: true,
			effect: {
				target(card, player, target) {
					if (card.name == "nanman") {
						return "zeroplayertarget";
					}
				},
			},
		},
	},
	huoshou1: {
		audio: 2,
		audioname: ["re_menghuo"],
		trigger: { target: "useCardToBefore" },
		forced: true,
		priority: 15,
		sourceSkill: "huoshou",
		filter(event, player) {
			return event.card.name == "nanman";
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
	},
	huoshou2: {
		audio: "huoshou1",
		audioname: ["re_menghuo"],
		trigger: { global: "useCard" },
		forced: true,
		sourceSkill: "huoshou",
		filter(event, player) {
			return event.card && event.card.name == "nanman" && event.player != player;
		},
		async content(event, trigger, player) {
			trigger.customArgs.default.customSource = player;
		},
	},
	// 再起
	zaiqixx: {
		audio: "zaiqi",
		inherit: "zaiqi",
	},
	zaiqi: {
		audio: 2,
		trigger: { player: "phaseDrawBegin1" },
		filter(event, player) {
			return !event.numFixed && player.isDamaged();
		},
		check(event, player) {
			if (player.getDamagedHp() < 2) {
				return false;
			} else if (player.getDamagedHp() == 2) {
				return player.countCards("h") >= 2;
			}
			return true;
		},
		async content(event, trigger, player) {
			trigger.changeToZero();
			let cards = get.cards(player.getDamagedHp() + (event.name == "zaiqi" ? 0 : 1), true);
			cards = (
				await player
					.showCards(cards, `${get.translation(player)}发动了〖${get.translation(event.name)}〗`, true)
					.set("delay_time", Math.min(4, cards.length))
					.forResult()
			).cards;
			let num = 0;
			for (let i = 0; i < cards.length; i++) {
				if (get.suit(cards[i]) == "heart") {
					num++;
					cards.splice(i--, 1);
				}
			}
			if (num) {
				await player.recover(num);
			}
			if (cards.length) {
				await player.gain(cards, "gain2");
			}
		},
		ai: {
			threaten(player, target) {
				if (target.hp == 1) {
					return 2;
				}
				if (target.hp == 2) {
					return 1.5;
				}
				return 1;
			},
		},
	},
	// 贾诩
	// 完杀
	wansha: {
		locked: true,
		audio: 2,
		audioname: ["re_jiaxu", "boss_lvbu3", "new_simayi"],
		audioname2: { shen_simayi: "jilue_wansha" },
		global: "wansha2",
		trigger: { global: "dying" },
		priority: 15,
		forced: true,
		preHidden: true,
		filter(event, player, name) {
			return _status.currentPhase == player && event.player != player;
		},
		async content() { },
	},
	wansha2: {
		mod: {
			cardSavable(card, player) {
				if (card.name == "tao" && _status.currentPhase?.isIn() && _status.currentPhase.hasSkill("wansha") && _status.currentPhase != player) {
					if (!player.isDying()) {
						return false;
					}
				}
			},
			cardEnabled(card, player) {
				if (card.name == "tao" && _status.currentPhase?.isIn() && _status.currentPhase.hasSkill("wansha") && _status.currentPhase != player) {
					if (!player.isDying()) {
						return false;
					}
				}
			},
		},
	},
	// 帷幕
	weimu: {
		trigger: { global: "useCard1" },
		audio: 2,
		audioname2: {
			wangyuanji: "qc_weimu",
			boss_chujiangwang: "boss_chujiangwang_weimu",
		},
		forced: true,
		firstDo: true,
		filter(event, player) {
			if (event.player == player) {
				return false;
			}
			if (get.color(event.card) != "black" || get.type(event.card) != "trick") {
				return false;
			}
			var info = lib.card[event.card.name];
			return info && info.selectTarget && info.selectTarget == -1 && !info.toself;
		},
		async content(event, trigger, player) { },
		mod: {
			targetEnabled(card) {
				if ((get.type(card) == "trick" || get.type(card) == "delay") && get.color(card) == "black") {
					return false;
				}
			},
		},
	},

	// 乱武
	luanwu: {
		audio: 2,
		audioname: ["re_jiaxu"],
		enable: "phaseUse",
		filter(event, player) {
			return game.hasPlayer(current => player != current);
		},
		limited: true,
		skillAnimation: "epic",
		animationColor: "thunder",
		filterTarget: lib.filter.notMe,
		selectTarget: -1,
		multiline: true,
		async contentBefore(event, trigger, player) {
			player.awakenSkill(event.skill);
		},
		async content(event, trigger, player) {
			const { target } = event;
			const result = await target
				.chooseToUse(
					"乱武：使用一张【杀】或失去1点体力",
					function (card) {
						if (get.name(card) != "sha") {
							return false;
						}
						return lib.filter.filterCard.apply(this, arguments);
					},
					function (card, player, target) {
						if (player == target) {
							return false;
						}
						var dist = get.distance(player, target);
						if (dist > 1) {
							if (
								game.hasPlayer(function (current) {
									return current != player && get.distance(player, current) < dist;
								})
							) {
								return false;
							}
						}
						return lib.filter.filterTarget.apply(this, arguments);
					}
				)
				.set("ai2", function () {
					return get.effect_use.apply(this, arguments) - get.event().effect;
				})
				.set("effect", get.effect(target, { name: "losehp" }, target, target))
				.set("addCount", false)
				.forResult();
			if (!result?.bool) {
				await target.loseHp();
			}
		},
		ai: {
			order: 1,
			result: {
				player(player) {
					if (lib.config.mode == "identity" && game.zhu.isZhu && player.identity == "fan") {
						if (game.zhu.hp == 1 && game.zhu.countCards("h") <= 2) {
							return 1;
						}
					}
					const players = game.filterPlayer();
					let num = 0;
					for (let i = 0; i < players.length; i++) {
						let att = get.attitude(player, players[i]);
						if (att > 0) {
							att = 1;
						}
						if (att < 0) {
							att = -1;
						}
						if (players[i] != player && players[i].hp <= 3) {
							const hs = players[i].countCards("hs");
							if (hs === 0) {
								num += att / players[i].hp;
							} else if (hs === 1) {
								num += att / 2 / players[i].hp;
							} else if (hs === 2) {
								num += att / 4 / players[i].hp;
							}
						}
						if (players[i].hp == 1) {
							num += att * 1.5;
						}
					}
					if (player.hp == 1) {
						return -num;
					}
					if (player.hp == 2) {
						return -game.players.length / 4 - num;
					}
					return -game.players.length / 3 - num;
				},
			},
		},
	},
	// 鲁肃
	// 好施
	haoshi: {
		audio: 2,
		trigger: { player: "phaseDrawBegin2" },
		filter(event, player) {
			return !event.numFixed;
		},
		preHidden: true,
		check(event, player) {
			return (
				player.countCards("h") + 2 + event.num <= 5 ||
				game.hasPlayer(function (target) {
					return (
						player !== target &&
						!game.hasPlayer(function (current) {
							return current !== player && current !== target && current.countCards("h") < target.countCards("h");
						}) &&
						get.attitude(player, target) > 0
					);
				})
			);
		},
		async content(event, trigger, player) {
			trigger.num += 2;
			player.addSkill("haoshi2");
		},
		ai: {
			threaten: 2,
			noh: true,
			skillTagFilter(player, tag) {
				if (tag == "noh") {
					if (player.countCards("h") != 2) {
						return false;
					}
				}
			},
		},
	},
	haoshi2: {
		trigger: { player: "phaseDrawEnd" },
		forced: true,
		popup: false,
		audio: false,
		sourceSkill: "haoshi",
		async content(event, trigger, player) {
			player.removeSkill("haoshi2");
			if (player.countCards("h") <= 5) {
				return;
			}
			const result = await player
				.chooseCardTarget({
					selectCard: Math.floor(player.countCards("h") / 2),
					filterTarget(card, player, target) {
						return target.isMinHandcard();
					},
					prompt: "将一半的手牌交给场上手牌数最少的一名角色",
					forced: true,
					ai2(target) {
						return get.attitude(_status.event.player, target);
					},
				})
				.forResult();
			if (result.targets && result.targets[0]) {
				await player.give(result.cards, result.targets[0]);
			}
		},
	},
	// 缔盟
	dimeng: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		position: "he",
		filterCard() {
			const targets = ui.selected.targets;
			if (targets.length == 2) {
				if (Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) <= ui.selected.cards.length) {
					return false;
				}
			}
			return true;
		},
		selectCard: [0, Infinity],
		selectTarget: 2,
		complexCard: true,
		complexTarget: true,
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			const targets = ui.selected.targets;
			if (!targets?.length) {
				return true;
			} else if (targets.concat([target]).every(target => !target.countCards("h"))) {
				return false;
			}
			return Math.abs(targets[0].countCards("h") - target.countCards("h")) == ui.selected.cards.length;
		},
		/*filterOk() {
			if (targets.length != 2) {
				return false;
			}
			return Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) == ui.selected.cards.length;
		},*/
		multitarget: true,
		multiline: true,
		async content(event, trigger, player) {
			event.targets[0].swapHandcards(event.targets[1]);
		},
		check(card) {
			const list = [],
				player = _status.event.player;
			const num = player.countCards("he");
			const players = game.filterPlayer();
			let count;
			for (let i = 0; i < players.length; i++) {
				if (players[i] != player && get.attitude(player, players[i]) > 3) {
					list.push(players[i]);
				}
			}
			list.sort(function (a, b) {
				return a.countCards("h") - b.countCards("h");
			});
			if (list.length == 0) {
				return -1;
			}
			const from = list[0];
			list.length = 0;
			for (let i = 0; i < players.length; i++) {
				if (players[i] != player && get.attitude(player, players[i]) < 1) {
					list.push(players[i]);
				}
			}
			if (list.length == 0) {
				return -1;
			}
			list.sort(function (a, b) {
				return b.countCards("h") - a.countCards("h");
			});
			if (from.countCards("h") >= list[0].countCards("h")) {
				return -1;
			}
			for (let i = 0; i < list.length && from.countCards("h") < list[i].countCards("h"); i++) {
				if (list[i].countCards("h") - from.countCards("h") <= num) {
					count = list[i].countCards("h") - from.countCards("h");
					break;
				}
			}
			if (count < 2 && from.countCards("h") >= 2) {
				return -1;
			}
			if (ui.selected.cards.length < count) {
				return 11 - get.value(card);
			}
			return -1;
		},
		ai: {
			order: 6,
			threaten: 3,
			expose: 0.9,
			result: {
				target(player, target) {
					const list = [];
					const num = player.countCards("he");
					const players = game.filterPlayer();
					if (ui.selected.targets.length == 0) {
						for (let i = 0; i < players.length; i++) {
							if (players[i] != player && get.attitude(player, players[i]) > 3) {
								list.push(players[i]);
							}
						}
						list.sort(function (a, b) {
							return a.countCards("h") - b.countCards("h");
						});
						if (target == list[0]) {
							return get.attitude(player, target);
						}
						return -get.attitude(player, target);
					} else {
						const from = ui.selected.targets[0];
						for (let i = 0; i < players.length; i++) {
							if (players[i] != player && get.attitude(player, players[i]) < 1) {
								list.push(players[i]);
							}
						}
						list.sort(function (a, b) {
							return b.countCards("h") - a.countCards("h");
						});
						if (from.countCards("h") >= list[0].countCards("h")) {
							return -get.attitude(player, target);
						}
						for (let i = 0; i < list.length && from.countCards("h") < list[i].countCards("h"); i++) {
							if (list[i].countCards("h") - from.countCards("h") <= num) {
								const count = list[i].countCards("h") - from.countCards("h");
								if (count < 2 && from.countCards("h") >= 2) {
									return -get.attitude(player, target);
								}
								if (target == list[i]) {
									return get.attitude(player, target);
								}
								return -get.attitude(player, target);
							}
						}
					}
				},
			},
		},
	},
	// 张郃
	// 巧变
	qiaobian: {
		audio: 2,
		audioname2: { gz_jun_caocao: "jianan_qiaobian" },
		trigger: {
			player: ["phaseJudgeBefore", "phaseDrawBefore", "phaseUseBefore", "phaseDiscardBefore"],
		},
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			let check,
				str = "弃置一张手牌并跳过";
			str += ["判定", "摸牌", "出牌", "弃牌"][lib.skill.qiaobian.trigger.player.indexOf(event.triggername)];
			str += "阶段";
			if (trigger.name == "phaseDraw") {
				str += "，然后可以获得至多两名角色各一张手牌";
			}
			if (trigger.name == "phaseUse") {
				str += "，然后可以移动场上的一张牌";
			}
			switch (trigger.name) {
				case "phaseJudge":
					check = player.countCards("j");
					break;
				case "phaseDraw": {
					let i,
						num = 0,
						num2 = 0;
					const players = game.filterPlayer();
					for (i = 0; i < players.length; i++) {
						if (player != players[i] && players[i].countCards("h")) {
							const att = get.attitude(player, players[i]);
							if (att <= 0) {
								num++;
							}
							if (att < 0) {
								num2++;
							}
						}
					}
					check = num >= 2 && num2 > 0;
					break;
				}
				case "phaseUse":
					if (!player.canMoveCard(true)) {
						check = false;
					} else {
						check = game.hasPlayer(function (current) {
							return get.attitude(player, current) > 0 && current.countCards("j");
						});
						if (!check) {
							if (player.countCards("h") > player.hp + 1) {
								check = false;
							} else if (player.countCards("h", { name: "wuzhong" })) {
								check = false;
							} else {
								check = true;
							}
						}
					}
					break;
				case "phaseDiscard":
					check = player.needsToDiscard();
					break;
			}
			event.result = await player
				.chooseToDiscard(get.prompt(event.skill), str, lib.filter.cardDiscardable)
				.set("ai", card => {
					if (!_status.event.check) {
						return -1;
					}
					return 7 - get.value(card);
				})
				.set("check", check)
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			game.log(
				player,
				"跳过了",
				"#y" + ["判定", "摸牌", "出牌", "弃牌"][lib.skill.qiaobian.trigger.player.indexOf(event.triggername)] + "阶段"
			);
			if (trigger.name == "phaseUse") {
				if (player.canMoveCard()) {
					await player.moveCard();
				}
			} else if (trigger.name == "phaseDraw") {
				const result = await player
					.chooseTarget([1, 2], "获得至多两名角色各一张手牌", function (card, player, target) {
						return target != player && target.countCards("h");
					})
					.set("ai", function (target) {
						return 1 - get.attitude(_status.event.player, target);
					})
					.forResult();
				if (!result.bool) {
					return;
				}
				result.targets.sortBySeat();
				player.line(result.targets, "green");
				if (!result.targets.length) {
					return;
				}
				await player.gainMultiple(result.targets);
				await game.delay();
			}
		},
		ai: { threaten: 3 },
	},
	// 邓艾
	// 屯田
	// 凿险
	// 急袭
	tuntian: {
		audio: 2,
		audioname: ["gz_dengai"],
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		preHidden: true,
		filter(event, player) {
			if (player == _status.currentPhase) {
				return false;
			}
			if (event.name == "gain" && event.player == player) {
				return false;
			}
			const evt = event.getl(player);
			return evt && evt.cards2 && evt.cards2.length > 0;
		},
		async content(event, trigger, player) {
			const judge = player.judge(function (card) {
				if (get.suit(card) == "heart") {
					return -1;
				}
				return 1;
			});
			judge.judge2 = function (result) {
				return result.bool;
			};
			if (get.mode() != "guozhan") {
				judge.callback = lib.skill.tuntian.callback;
				return void (await judge);
			}
			const result = await judge.forResult();
			if (!result.bool || get.position(result.card) != "d") {
				//game.cardsDiscard(card);
				return;
			}
			const card = result.card;
			const chooseBool = player.chooseBool("是否将" + get.translation(card) + "作为“田”置于武将牌上？");
			chooseBool.ai = function () {
				return true;
			};
			const { bool } = await chooseBool.forResult();
			if (!bool) {
				return;
			}
			const addToExpansion = player.addToExpansion(card, "gain2");
			addToExpansion.gaintag.add("tuntian");
			await addToExpansion;
		},
		async callback(event, trigger, player) {
			if (!event.judgeResult.bool) {
				return;
			}
			const next = player.addToExpansion(event.judgeResult.card, "gain2");
			next.gaintag.add("tuntian");
			await next;
		},
		marktext: "田",
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
		group: "tuntian_dist",
		locked: false,
		subSkill: {
			dist: {
				locked: false,
				mod: {
					globalFrom(from, to, distance) {
						let num = distance - from.getExpansions("tuntian").length;
						if (_status.event.skill == "jixi_backup" || _status.event.skill == "gz_jixi_backup") {
							num++;
						}
						return num;
					},
				},
			},
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (typeof card === "object" && get.name(card) === "sha" && target.mayHaveShan(player, "use")) {
						return [0.6, 0.75];
					}
					if (!target.hasFriend() && !player.hasUnknown()) {
						return;
					}
					if (_status.currentPhase == target || get.type(card) === "delay") {
						return;
					}
					if (card.name != "shuiyanqijunx" && get.tag(card, "loseCard") && target.countCards("he")) {
						if (target.hasSkill("ziliang")) {
							return 0.7;
						}
						return [0.5, Math.max(2, target.countCards("h"))];
					}
					if (target.isUnderControl(true, player)) {
						if (
							(get.tag(card, "respondSha") && target.countCards("h", "sha")) ||
							(get.tag(card, "respondShan") && target.countCards("h", "shan"))
						) {
							if (target.hasSkill("ziliang")) {
								return 0.7;
							}
							return [0.5, 1];
						}
					} else if (get.tag(card, "respondSha") || get.tag(card, "respondShan")) {
						if (get.attitude(player, target) > 0 && card.name == "juedou") {
							return;
						}
						if (get.tag(card, "damage") && target.hasSkillTag("maixie")) {
							return;
						}
						if (target.countCards("h") == 0) {
							return 2;
						}
						if (target.hasSkill("ziliang")) {
							return 0.7;
						}
						if (get.mode() == "guozhan") {
							return 0.5;
						}
						return [0.5, Math.max(target.countCards("h") / 4, target.countCards("h", "sha") + target.countCards("h", "shan"))];
					}
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
	zaoxian: {
		skillAnimation: true,
		animationColor: "thunder",
		audio: 2,
		audioname: ["re_dengai"],
		juexingji: true,
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			return player.getExpansions("tuntian").length >= 3;
		},
		derivation: "jixi",
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.loseMaxHp();
			await player.addSkills("jixi");
		},
		ai: {
			combo: "tuntian",
		},
	},
	jixi: {
		audio: 2,
		audioname: ["re_dengai", "gz_dengai", "ol_dengai"],
		enable: "phaseUse",
		filter(event, player) {
			return player.getExpansions("tuntian").length > 0 && event.filterCard({ name: "shunshou" }, player, event);
		},
		chooseButton: {
			dialog(event, player) {
				return ui.create.dialog("急袭", player.getExpansions("tuntian"), "hidden");
			},
			filter(button, player) {
				const card = button.link;
				if (!game.checkMod(card, player, "unchanged", "cardEnabled2", player)) {
					return false;
				}
				const evt = _status.event.getParent();
				return evt.filterCard(get.autoViewAs({ name: "shunshou" }, [card]), player, evt);
			},
			backup(links, player) {
				const skill = _status.event.buttoned;
				return {
					audio: "jixi",
					audioname: ["re_dengai", "gz_dengai", "ol_dengai"],
					selectCard: -1,
					position: "x",
					filterCard: skill == "jixi" ? card => card == lib.skill.jixi_backup.card : card => card == lib.skill.gz_jixi_backup.card,
					viewAs: { name: "shunshou" },
					card: links[0],
				};
			},
			prompt(links, player) {
				return "选择 顺手牵羊（" + get.translation(links[0]) + "）的目标";
			},
		},
		subSkill: {
			backup: {},
		},
		ai: {
			order: 10,
			result: {
				player(player) {
					return player.getExpansions("tuntian").length - 1;
				},
			},
			combo: "tuntian",
		},
	},
	// 姜维
	// 挑衅
	tiaoxin: {
		audio: 2,
		audioname: ["sp_jiangwei", "xiahouba", "re_jiangwei", "gz_jiangwei", "ol_jiangwei"],
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return target != player && target.inRange(player) && target.countCards("he") > 0;
		},
		async content(event, trigger, player) {
			const target = event.target;
			const result = await target
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
				.set("sourcex", player)
				.forResult();
			if (result.bool == false && target.countCards("he") > 0) {
				player.discardPlayerCard(target, "he", true);
			}
		},
		ai: {
			order: 4,
			expose: 0.2,
			result: {
				target: -1,
				player(player, target) {
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
	tiaoxin_xiahouba: { audio: 2 },

	// 志继
	zhiji: {
		skillAnimation: true,
		animationColor: "fire",
		audio: 2,
		audioname: ["re_jiangwei"],
		juexingji: true,
		derivation: "reguanxing",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			if (player.storage.zhiji) {
				return false;
			}
			return player.countCards("h") == 0;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.chooseDrawRecover(2, true);
			await player.loseMaxHp();
			await player.addSkills("reguanxing");
		},
	},
	// 刘禅
	// 享乐
	xiangle: {
		audio: 2,
		audioname: ["re_liushan", "ol_liushan"],
		trigger: { target: "useCardToTargeted" },
		forced: true,
		preHidden: true,
		filter(event, player) {
			return event.card.name == "sha";
		},
		async content(event, trigger, player) {
			const eff = get.effect(player, trigger.card, trigger.player, trigger.player);
			const result = await trigger.player
				.chooseToDiscard("享乐：弃置一张基本牌，否则杀对" + get.translation(player) + "无效", function (card) {
					return get.type(card) == "basic";
				})
				.set("ai", function (card) {
					if (_status.event.eff > 0) {
						return 10 - get.value(card);
					}
					return 0;
				})
				.set("eff", eff)
				.forResult();
			if (!result?.bool) {
				trigger.getParent().excluded.add(player);
			}
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (card.name == "sha" && get.attitude(player, target) < 0) {
						if (_status.event.name == "xiangle") {
							return;
						}
						if (get.attitude(player, target) > 0 && current < 0) {
							return "zerotarget";
						}
						const bs = player.getCards("h", { type: "basic" });
						bs.remove(card);
						if (card.cards) {
							bs.removeArray(card.cards);
						} else {
							bs.removeArray(ui.selected.cards);
						}
						if (!bs.length) {
							return "zerotarget";
						}
						if (player.hasSkill("jiu") || player.hasSkill("tianxianjiu")) {
							return;
						}
						if (bs.length <= 2) {
							for (let i = 0; i < bs.length; i++) {
								if (get.value(bs[i]) < 7) {
									return [1, 0, 1, -0.5];
								}
							}
							return [1, 0, 0.3, 0];
						}
						return [1, 0, 1, -0.5];
					}
				},
			},
		},
	},
	// 放权
	fangquan: {
		audio: 2,
		trigger: { player: "phaseUseBefore" },
		filter(event, player) {
			return player.countCards("h") > 0 && !player.hasSkill("fangquan3");
		},
		preHidden: true,
		async cost(event, trigger, player) {
			const fang = player.countMark("fangquan2") == 0 && player.hp >= 2 && player.countCards("h") <= player.hp + 1;
			event.result = await player
				.chooseBool(get.prompt2(event.skill))
				.set("ai", function () {
					const player = get.player();
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
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.addTempSkill("fangquan2");
			player.addMark("fangquan2", 1, false);
			//player.storage.fangquan=result.targets[0];
		},
	},
	fangquan2: {
		trigger: { player: "phaseEnd" },
		locked: true,
		log: false,
		audio: false,
		//priority:-50,
		onremove: true,
		sourceSkill: "fangquan",
		getIndex(event, player) {
			return player.countMark("fangquan2") || 1;
		},
		async cost(event, trigger, player) {
			const chooseToDiscard = player.chooseToDiscard("是否弃置一张手牌并令一名其他角色进行一个额外回合？");
			chooseToDiscard.ai = function (card) {
				return 20 - get.value(card);
			};
			if (!(await chooseToDiscard.forResult()).bool) {
				return;
			}
			const chooseTarget = player.chooseTarget(true, "请选择进行额外回合的目标角色", lib.filter.notMe);
			chooseTarget.ai = function (target) {
				const player = get.player();
				if (target.hasJudge("lebu") || get.attitude(player, target) <= 0) {
					return -1;
				}
				if (target.isTurnedOver()) {
					return 0.18;
				}
				return get.threaten(target) / Math.sqrt(target.hp + 1) / Math.sqrt(target.countCards("h") + 1);
			};
			event.result = await chooseTarget.forResult();
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			player.logSkill(player.name == "re_liushan" ? "refangquan" : "fangquan", event.targets, "fire");
			target.markSkillCharacter("fangquan", player, "放权", "进行一个额外回合");
			target.insertPhase();
			player.removeMark("fangquan2");
			target.addSkill("fangquan3");
		},
	},
	fangquan3: {
		trigger: { player: ["phaseAfter", "phaseCancelled"] },
		forced: true,
		popup: false,
		audio: false,
		sourceSkill: "fangquan",
		async content(event, trigger, player) {
			player.unmarkSkill("fangquan");
			player.removeSkill("fangquan3");
		},
	},
	// 若愚
	ruoyu: {
		skillAnimation: true,
		animationColor: "fire",
		audio: 2,
		audioname: ["re_liushan"],
		juexingji: true,
		zhuSkill: true,
		keepSkill: true,
		derivation: "rejijiang",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			return player.isMinHp();
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.gainMaxHp();
			await player.recover();
			await player.addSkills("rejijiang");
		},
	},
	// 孙策
	// 激昂
	jiang: {
		audio: 2,
		preHidden: true,
		audioname: ["sp_lvmeng", "re_sunben", "re_sunce"],
		mod: {
			aiOrder(player, card, num) {
				if (get.color(card) === "red" && get.name(card) === "sha") {
					return get.order({ name: "sha" }) + 0.15;
				}
			},
		},
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (!(event.card.name == "juedou" || (event.card.name == "sha" && get.color(event.card) == "red"))) {
				return false;
			}
			return player == event.target || event.getParent().triggeredTargets3.length == 1;
		},
		locked: false,
		frequent: true,
		async content(event, trigger, player) {
			player.draw();
		},
		ai: {
			effect: {
				target_use(card, player, target) {
					if (card.name == "sha" && get.color(card) == "red") {
						return [1, 0.6];
					}
				},
				player_use(card, player, target) {
					if (card.name == "sha" && get.color(card) == "red") {
						return [1, 1];
					}
				},
			},
		},
	},
	// 魂姿
	hunzi: {
		//audioname:['re_sunben'],
		skillAnimation: true,
		animationColor: "wood",
		audio: 2,
		juexingji: true,
		derivation: ["reyingzi", "gzyinghun"],
		trigger: { player: "phaseZhunbeiBegin" },
		filter(event, player) {
			return player.hp <= 1 && !player.storage.hunzi;
		},
		forced: true,
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.loseMaxHp();
			await player.addSkills(["reyingzi", "gzyinghun"]);
		},
		ai: {
			threaten(player, target) {
				if (target.hp == 1) {
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
						target.hp === 2 &&
						get.tag(card, "damage") == 1 &&
						!target.isTurnedOver() &&
						_status.currentPhase !== target &&
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
	// 制霸
	zhiba: {
		global: "zhiba_global",
		audioname: ["re_sunben"],
		audioname2: {
			pe_jun_sunce: "olzhiba",
		},
		audio: 2,
		zhuSkill: true,
		subSkill: {
			global: {
				enable: "phaseUse",
				prompt() {
					const player = get.player();
					const list = game.filterPlayer(target => target.hasZhuSkill("zhiba", player) && player.canCompare(target));
					let str = "和" + get.translation(list);
					if (list.length > 1) {
						str += "中的一人";
					}
					str += "进行拼点。若你没赢，其可以获得两张拼点牌。";
					return str;
				},
				filter(event, player) {
					if (player.group != "wu") {
						return false;
					}
					return game.hasPlayer(target => target.hasZhuSkill("zhiba", player) && player.canCompare(target));
				},
				filterTarget(card, player, target) {
					return target.hasZhuSkill("zhiba", player) && player.canCompare(target);
				},
				log: false,
				prepare(cards, player, targets) {
					targets[0].logSkill("zhiba");
				},
				usable: 1,
				async content(event, trigger, player) {
					const { target } = event;
					if (["hunzi", "rehunzi"].some(skill => target.storage[skill])) {
						const { bool } = await target
							.chooseBool("是否拒绝〖制霸〗拼点？")
							.set("choice", get.attitude(target, player) <= 0)
							.forResult();
						if (bool) {
							game.log(target, "拒绝了拼点");
							target.chat("拒绝");
							return;
						}
					}
					if (!player.canCompare(target)) {
						return;
					}
					const result = await player
						.chooseToCompare(target, card => {
							if (card.name == "du") {
								return 20;
							}
							const player = get.owner(card);
							const target = get.event().getParent().target;
							if (player != target && get.attitude(player, target) > 0) {
								return -get.number(card);
							}
							return get.number(card);
						})
						.set("preserve", "lose")
						.forResult();
					if (result.bool == false) {
						const list = [result.player, result.target].filterInD("d");
						if (!list.length) {
							return;
						}
						const next = target.chooseBool("是否获得" + get.translation(list) + "？").set("ai", () => get.value(list) > 0);
						if ((await next.forResult()).bool) {
							await target.gain(list, "gain2");
						}
					}
				},
				ai: {
					basic: {
						order: 1,
					},
					expose: 0.2,
					result: {
						target(player, target) {
							if (player.countCards("h", "du") && get.attitude(player, target) < 0) {
								return -1;
							}
							if (player.countCards("h") <= player.hp) {
								return 0;
							}
							let maxnum = 0;
							const cards2 = target.getCards("h");
							for (let i = 0; i < cards2.length; i++) {
								if (get.number(cards2[i]) > maxnum) {
									maxnum = get.number(cards2[i]);
								}
							}
							if (maxnum > 10) {
								maxnum = 10;
							}
							if (maxnum < 5 && cards2.length > 1) {
								maxnum = 5;
							}
							const cards = player.getCards("h");
							for (let i = 0; i < cards.length; i++) {
								if (get.number(cards[i]) < maxnum) {
									return 1;
								}
							}
							return 0;
						},
					},
				},
			},
		},
	},
	// 张昭张纮
	// 直谏
	zhijian: {
		audio: 2,
		enable: "phaseUse",
		filter(event, player) {
			return player.countCards("h", { type: "equip" }) > 0;
		},
		filterCard(card) {
			return get.type(card) == "equip";
		},
		check(card) {
			const player = _status.currentPhase;
			if (player.countCards("he", { subtype: get.subtype(card) }) > 1) {
				return 11 - get.equipValue(card);
			}
			return 6 - get.value(card);
		},
		filterTarget(card, player, target) {
			if (target.isMin()) {
				return false;
			}
			return player != target && target.canEquip(card);
		},
		async content(event, trigger, player) {
			await event.target.equip(event.cards[0]);
			await player.draw();
		},
		discard: false,
		lose: false,
		prepare(cards, player, targets) {
			player.$give(cards, targets[0], false);
		},
		ai: {
			basic: {
				order: 10,
			},
			result: {
				target(player, target) {
					const card = ui.selected.cards[0];
					if (card) {
						return get.effect(target, card, target, target);
					}
					return 0;
				},
			},
			threaten: 1.3,
		},
	},
	// 固政
	guzheng: {
		audio: 2,
		audioname: ["re_zhangzhang"],
		trigger: { global: "phaseDiscardAfter" },
		filter(event, player) {
			if (event.player != player && event.player.isIn()) {
				return (
					event.player.getHistory("lose", function (evt) {
						return evt.type == "discard" && evt.getParent("phaseDiscard") == event && evt.hs.someInD("d");
					}).length > 0
				);
			}
			return false;
		},
		checkx(event, player, cards, cards2) {
			if (cards.length > 2 || get.attitude(player, event.player) > 0) {
				return true;
			}
			for (let i = 0; i < cards2.length; i++) {
				if (get.value(cards2[i], event.player, "raw") < 0) {
					return true;
				}
			}
			return false;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			const cards = [],
				cards2 = [];
			const target = trigger.player;
			game.getGlobalHistory("cardMove", function (evt) {
				if (evt.name == "cardsDiscard") {
					if (evt.getParent("phaseDiscard") == trigger) {
						const moves = evt.cards.filterInD("d");
						cards.addArray(moves);
						cards2.removeArray(moves);
					}
				}
				if (evt.name == "lose") {
					if (evt.type != "discard" || evt.position != ui.discardPile || evt.getParent("phaseDiscard") != trigger) {
						return;
					}
					const moves = evt.cards.filterInD("d");
					cards.addArray(moves);
					if (evt.player == target) {
						cards2.addArray(moves);
					} else {
						cards2.removeArray(moves);
					}
				}
			});
			if (!cards2.length) {
				return;
			}
			if (cards.length == 1) {
				event.card = cards[0];
				event.result = await player
					.chooseBool()
					.set("createDialog", [get.prompt(event.skill, target), '<span class="text center">点击“确认”以令其收回此牌</span>', cards])
					.set("choice", lib.skill.guzheng.checkx(trigger, player, cards, cards2))
					.set("ai", function () {
						return _status.event.choice;
					})
					.setHiddenSkill(event.skill)
					.forResult();
				event.result.cost_data = {
					action: "single",
					cards: cards,
				};
			} else {
				event.result = await player
					.chooseButton(2, [
						get.prompt(event.skill, target),
						'<span class="text center">被选择的牌将成为对方收回的牌</span>',
						cards,
						[["获得剩余的牌", "放弃剩余的牌"], "tdnodes"],
					])
					.set("filterButton", function (button) {
						const type = typeof button.link;
						if (ui.selected.buttons.length && type == typeof ui.selected.buttons[0].link) {
							return false;
						}
						return type == "string" || _status.event.allowed.includes(button.link);
					})
					.set("allowed", cards2)
					.set("check", lib.skill.guzheng.checkx(trigger, player, cards, cards2))
					.set("ai", function (button) {
						if (typeof button.link == "string") {
							return button.link == "获得剩余的牌" ? 1 : 0;
						}
						if (_status.event.check) {
							return 20 - get.value(button.link, _status.event.getTrigger().player);
						}
						return 0;
					})
					.setHiddenSkill(event.skill)
					.forResult();
				event.result.cost_data = {
					action: "multiple",
					cards: event.result.links,
				};
			}
		},
		logTarget: "player",
		async content(event, trigger, player) {
			const target = trigger.player;
			const action = event.cost_data.action;
			const cards = event.cost_data.cards;
			if (action != "multiple") {
				const gain = target.gain(cards[0], "gain2");
				gain.giver = player;
				await gain;
			} else {
				if (typeof cards[0] != "string") {
					cards.reverse();
				}
				const [, card] = cards;
				const gain = target.gain(card, "gain2");
				gain.giver = player;
				await gain;
				if (cards[0] != "获得剩余的牌") {
					return;
				}
			}
			//避免插入结算改变弃牌堆 重新判断一次
			cards.length = 0;
			game.getGlobalHistory("cardMove", function (evt) {
				if (evt.name == "cardsDiscard") {
					if (evt.getParent("phaseDiscard") == trigger) {
						const moves = evt.cards.filterInD("d");
						cards.addArray(moves);
					}
				}
				if (evt.name == "lose") {
					if (evt.type != "discard" || evt.position != ui.discardPile || evt.getParent("phaseDiscard") != trigger) {
						return;
					}
					const moves = evt.cards.filterInD("d");
					cards.addArray(moves);
				}
			});
			if (cards.length > 0) {
				await player.gain(cards, "gain2");
			}
		},
		ai: {
			threaten: 1.3,
			expose: 0.2,
		},
	},
	// 左慈
	// 新生
	xinsheng: {
		audio: 2,
		unique: true,
		trigger: { player: "damageEnd" },
		frequent: true,
		getIndex: event => event.num,
		filter(event) {
			return event.num;
		},
		async content(event, trigger, player) {
			lib.skill.huashen.addHuashens(player, 1);
		},
		ai: { combo: "huashen" },
	},
	// 化身
	huashen: {
		audio: "huashen2",
		unique: true,
		init(player) {
			if (!player.storage.huashen) {
				player.storage.huashen = { owned: {}, choosed: [] };
			}
		},
		intro: {
			content(storage, player) {
				let str = "";
				const list = Object.keys(storage.owned);
				if (list.length) {
					str += get.translation(list[0]);
					for (let i = 1; i < list.length; i++) {
						str += "、" + get.translation(list[i]);
					}
				}
				const skill = player.storage.huashen.current2;
				if (skill) {
					str += "<p>当前技能：" + get.translation(skill);
				}
				return str;
			},
			onunmark(storage, player) {
				_status.characterlist.addArray(Object.keys(storage.owned));
				storage.owned = [];
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
			mark(dialog, content, player) {
				const list = Object.keys(content.owned);
				if (list.length) {
					const skill = player.storage.huashen.current2;
					const character = player.storage.huashen.current;
					if (skill && character) {
						dialog.addSmall([
							[character],
							(item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node),
						]);
						dialog.add(
							'<div><div class="skill">【' +
							get.translation(lib.translate[skill + "_ab"] || get.translation(skill).slice(0, 2)) +
							"】</div>" +
							"<div>" +
							get.skillInfoTranslation(skill, player, false) +
							"</div></div>"
						);
					}
					if (player.isUnderControl(true)) {
						dialog.addSmall([
							list,
							(item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node),
						]);
					} else {
						dialog.addText("共有" + get.cnNumber(list.length) + "张“化身”");
					}
				} else {
					return "没有化身";
				}
			},
			markcount(storage = {}) {
				return Object.keys(storage.owned).length;
			},
		},
		addHuashen(player) {
			if (!player.storage.huashen) {
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
					lib.skill.rehuashen.banned.includes(name) ||
					player.storage.huashen.owned[name]
				) {
					continue;
				}
				let skills = lib.character[name][3].filter(skill => {
					const categories = get.skillCategoriesOf(skill, player);
					return !categories.some(type => lib.skill.rehuashen.bannedType.includes(type));
				});
				if (skills.length) {
					player.storage.huashen.owned[name] = skills;
					_status.characterlist.remove(name);
					return name;
				}
			}
		},
		addHuashens(player, num) {
			const list = [];
			for (let i = 0; i < num; i++) {
				const name = lib.skill.huashen.addHuashen(player);
				if (name) {
					list.push(name);
				}
			}
			if (list.length) {
				player.syncStorage("huashen");
				player.markSkill("huashen");
				game.log(player, "获得了", get.cnNumber(list.length) + "张", "#g化身");
				lib.skill.rehuashen.drawCharacter(player, list);
			}
		},
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
			return !get.is.empty(player.storage.huashen.owned);
		},
		log: false,
		async cost(event, trigger, player) {
			const name = event.triggername;
			if (trigger.name != "phase" || (name == "phaseBefore" && game.phaseNumber == 0)) {
				player.logSkill("huashen");
				lib.skill.huashen.addHuashens(player, 2);
				event.logged = true;
			}
			await Promise.all(event.next); // await logSkill 防止被 paused
			// 因为化身内置了一个 chooseButtonControl 需要特殊处理一下
			const cards = [];
			const skills = [];
			for (const i in player.storage.huashen.owned) {
				cards.push(i);
				skills.addArray(player.storage.huashen.owned[i]);
			}
			const cond = event.triggername == "phaseBegin" ? "in" : "out";
			skills.randomSort();
			skills.sort(function (a, b) {
				return get.skillRank(b, cond) - get.skillRank(a, cond);
			});
			if (player.isUnderControl()) {
				game.swapPlayerAuto(player);
			}
			const switchToAuto = function () {
				_status.imchoosing = false;
				let skill = skills[0],
					character;
				for (const i in player.storage.huashen.owned) {
					if (player.storage.huashen.owned[i].includes(skill)) {
						character = i;
						break;
					}
				}
				if (event.dialog) {
					event.dialog.close();
				}
				if (event.control) {
					event.control.close();
				}
				return Promise.resolve({
					bool: true,
					skill: skill,
					character: character,
				});
			};
			const chooseButton = function (player, list, forced) {
				const { promise, resolve } = Promise.withResolvers();
				const event = _status.event;
				player = player || event.player;
				if (!event._result) {
					event._result = {};
				}
				const prompt = forced ? "化身：选择获得一项技能" : get.prompt("huashen");
				const dialog = ui.create.dialog(prompt, [
					list,
					(item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node),
				]);
				event.dialog = dialog;
				event.forceMine = true;
				event.button = null;
				for (let i = 0; i < event.dialog.buttons.length; i++) {
					event.dialog.buttons[i].classList.add("pointerdiv");
					event.dialog.buttons[i].classList.add("selectable");
				}
				const buttons = dialog.content.querySelector(".buttons");
				const array = dialog.buttons.filter(item => !item.classList.contains("nodisplay") && item.style.display !== "none");
				const choosed = player.storage.huashen.choosed;
				const groups = array
					.map(i => get.character(i.link).group)
					.unique()
					.sort((a, b) => {
						const getNum = g => (lib.group.includes(g) ? lib.group.indexOf(g) : lib.group.length);
						return getNum(a) - getNum(b);
					});
				if (choosed.length > 0 || groups.length > 1) {
					event.dialog.style.bottom = (parseInt(event.dialog.style.top || "0", 10) + get.is.phoneLayout() ? 230 : 220) + "px";
					event.dialog.addPagination({
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
				event.dialog.open();
				event.custom.replace.button = function (button) {
					const paginationInstance = event.dialog.paginationMap?.get(event.dialog.content.querySelector(".buttons"));
					if (!event.dialog.contains(button.parentNode)) {
						return;
					}
					if (event.control) {
						event.control.style.opacity = 1;
					}
					if (button.classList.contains("selectedx")) {
						//二次选择已选择的武将牌解禁更换操作
						if (paginationInstance?.state) {
							paginationInstance.state.pageRefuseChanged = false;
						}
						event.button = null;
						button.classList.remove("selectedx");
						if (event.control) {
							event.control.replacex(["cancel2"]);
						}
					} else {
						//否则禁止更换操作
						if (paginationInstance?.state) {
							paginationInstance.state.pageRefuseChanged = true;
						}
						if (event.button) {
							event.button.classList.remove("selectedx");
						}
						button.classList.add("selectedx");
						event.button = button;
						if (event.control && button.link) {
							event.control.replacex(player.storage.huashen.owned[button.link]);
						}
					}
					game.check();
				};
				event.custom.replace.window = function () {
					//解禁更换操作
					const paginationInstance = event.dialog.paginationMap?.get(event.dialog.content.querySelector(".buttons"));
					if (paginationInstance?.state) {
						paginationInstance.state.pageRefuseChanged = false;
					}
					if (event.button) {
						event.button.classList.remove("selectedx");
						event.button = null;
					}
					if (event.control) {
						event.control.replacex(["cancel2"]);
					}
				};
				event.switchToAuto = function () {
					const cards = [];
					const skills = [];
					for (const i in player.storage.huashen.owned) {
						cards.push(i);
						skills.addArray(player.storage.huashen.owned[i]);
					}
					const cond = event.triggername == "phaseBegin" ? "in" : "out";
					skills.randomSort();
					skills.sort(function (a, b) {
						return get.skillRank(b, cond) - get.skillRank(a, cond);
					});
					_status.imchoosing = false;
					let skill = skills[0],
						character;
					for (const i in player.storage.huashen.owned) {
						if (player.storage.huashen.owned[i].includes(skill)) {
							character = i;
							break;
						}
					}
					resolve({
						bool: true,
						skill: skill,
						character: character,
					});
					if (event.dialog) {
						event.dialog.close();
					}
					if (event.control) {
						event.control.close();
					}
				};
				const controls = [];
				event.control = ui.create.control();
				event.control.replacex = function () {
					const args = Array.from(arguments)[0];
					if (args.includes("cancel2") && forced) {
						args.remove("cancel2");
						this.style.opacity = "";
					}
					args.push(function (link) {
						const result = event._result;
						if (link == "cancel2") {
							result.bool = false;
						} else {
							if (!event.button) {
								return;
							}
							result.bool = true;
							result.skill = link;
							result.character = event.button.link;
						}
						event.dialog.close();
						event.control.close();
						game.resume(); // 不再 game.resume 防止 game.loop 被重复执行
						_status.imchoosing = false;
						resolve(result);
					});
					return this.replace.apply(this, args);
				};
				if (!forced) {
					controls.push("cancel2");
					event.control.style.opacity = 1;
				}
				event.control.replacex(controls);
				game.pause(); // 暂停 game.loop 防止 game.resume2
				game.countChoose();
				return promise;
			};
			let next;
			if (event.isMine()) {
				next = chooseButton(player, cards, event.logged);
			} else if (event.isOnline()) {
				const { promise, resolve } = Promise.withResolvers();
				event.player.send(chooseButton, event.player, cards, event.logged);
				event.player.wait(async result => {
					if (result == "ai") {
						result = await switchToAuto();
					}

					resolve(result);
				}); // 不再 game.resume 防止 game.loop 被重复执行
				game.pause(); // 暂停 game.loop 防止 game.resume2
				next = promise;
			} else {
				next = switchToAuto();
			}
			const result = await next;
			// _status.paused = false; // 恢复 game.loop 但不立刻执行
			game.resume();
			result.logged = event.logged;
			event.result = {
				bool: result.bool,
				cost_data: result,
			};
		},
		async content(event, trigger, player) {
			const map = event.cost_data;
			if (!map.logged) {
				player.logSkill("huashen");
			}
			const skill = map.skill,
				character = map.character;
			player.storage.huashen.choosed.add(character);
			if (character != player.storage.huashen.current) {
				const old = player.storage.huashen.current;
				player.storage.huashen.current = character;
				player.markSkill("huashen");
				game.broadcastAll(
					function (player, character, old) {
						player.tempname.remove(old);
						player.tempname.add(character);
						player.sex = lib.character[character].sex;
						//player.group=lib.character[character][1];
						//player.node.name.dataset.nature=get.groupnature(player.group);
						/*
						const mark = player.marks.huashen;
						if (!mark) return;
						mark.style.transition = "all 0.3s";
						setTimeout(function () {
							mark.style.transition = "all 0s";
							ui.refresh(mark);
							mark.setBackground(character, "character");
							if (mark.firstChild) {
								mark.firstChild.remove();
							}
							setTimeout(function () {
								mark.style.transition = "";
								mark.show();
							}, 50);
						}, 200);
						*/
					},
					player,
					character,
					old
				);
				get.character().group;
				game.log(player, "将性别变为了", "#y" + get.translation(get.character(character).sex) + "性");
				await player.changeGroup(get.character(character).group);
			}
			player.storage.huashen.current2 = skill;
			if (!player.additionalSkills.huashen || !player.additionalSkills.huashen.includes(skill)) {
				player.flashAvatar("huashen", character);
				player.syncStorage("huashen");
				player.updateMarks("huashen");
				await player.addAdditionalSkills("huashen", skill);
				// lib.skill.rehuashen.createAudio(character,skill,'zuoci');
			}
		},
	},
	huashen2: { audio: 2 },
	// 蔡文姬
	// 悲歌
	beige: {
		audio: 2,
		audioname: ["re_caiwenji", "ol_caiwenji"],
		trigger: { global: "damageEnd" },
		filter(event, player) {
			return event.card && event.card.name == "sha" && event.source && event.player.isIn() && player.countCards("he");
		},
		checkx(event, player) {
			const att1 = get.attitude(player, event.player);
			const att2 = get.attitude(player, event.source);
			return att1 > 0 && att2 <= 0;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			const next = player.chooseToDiscard("he", get.prompt2(event.skill, trigger.player));
			const check = lib.skill.beige.checkx(trigger, player);
			next.set("ai", function (card) {
				if (_status.event.goon) {
					return 8 - get.value(card);
				}
				return 0;
			});
			next.set("goon", check);
			next.setHiddenSkill(event.skill);
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			const result = await trigger.player.judge().forResult();
			switch (result.suit) {
				case "heart":
					await trigger.player.recover();
					break;
				case "diamond":
					await trigger.player.draw(2);
					break;
				case "club":
					await trigger.source.chooseToDiscard("he", 2, true);
					break;
				case "spade":
					await trigger.source.turnOver();
					break;
			}
		},
		ai: {
			expose: 0.3,
		},
	},
	// 断肠
	duanchang: {
		audio: 2,
		audioname: ["re_caiwenji", "ol_caiwenji"],
		forbid: ["boss"],
		trigger: { player: "die" },
		forced: true,
		forceDie: true,
		skillAnimation: true,
		animationColor: "gray",
		filter(event) {
			return event.source && event.source.isIn();
		},
		async content(event, trigger, player) {
			trigger.source.clearSkills();
		},
		logTarget: "source",
		ai: {
			maixie_defend: true,
			threaten(player, target) {
				if (target.hp == 1) {
					return 0.2;
				}
				return 1.5;
			},
			effect: {
				target(card, player, target, current) {
					if (!target.hasFriend()) {
						return;
					}
					if (target.hp <= 1 && get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return 3;
						}
						return [1, 0, 0, -3 * get.threaten(player)];
					}
				},
			},
		},
	},
	// 神关羽
	// 武神
	wushen: {
		mod: {
			cardname(card, player, name) {
				if (get.suit(card) == "heart") {
					return "sha";
				}
			},
			cardnature(card, player) {
				if (get.suit(card) == "heart") {
					return false;
				}
			},
			targetInRange(card) {
				if (card.name === "sha") {
					const suit = get.suit(card);
					if (suit === "heart" || suit === "unsure") {
						return true;
					}
				}
			},
			cardUsable(card) {
				if (card.name === "sha") {
					const suit = get.suit(card);
					if (suit === "heart" || suit === "unsure") {
						return Infinity;
					}
				}
			},
		},
		audio: 2,
		trigger: { player: "useCard" },
		forced: true,
		filter(event, player) {
			return event.card.name == "sha" && get.suit(event.card) == "heart";
		},
		async content(event, trigger, player) {
			trigger.directHit.addArray(game.players);
			if (trigger.addCount !== false) {
				trigger.addCount = false;
				if (player.stat[player.stat.length - 1].card.sha > 0) {
					player.stat[player.stat.length - 1].card.sha--;
				}
			}
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "respondSha") && current < 0) {
						return 0.6;
					}
				},
			},
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				return arg.card.name == "sha" && get.suit(arg.card) == "heart";
			},
		},
	},
	// 武魂
	wuhun: {
		audio: "wuhun2",
		trigger: { player: "die" },
		filter(event) {
			return event.source && event.source.isIn();
		},
		forced: true,
		forceDie: true,
		skillAnimation: true,
		animationColor: "soil",
		logTarget: "source",
		async content(event, trigger, player) {
			const num = trigger.source.getHp();
			if (num > 0) {
				await trigger.source.loseHp(num);
			}
		},
		ai: {
			threaten(player, target) {
				if (target.hp == 1) {
					if (player.getHp() <= 0) {
						return 100;
					}
					return 0.2;
				}
				return 0.8;
			},
			effect: {
				target(card, player, target, current) {
					if (player.getHp() <= 0) {
						return;
					}
					if (!target.hasFriend()) {
						return;
					}
					if (target.hp <= 1 && get.tag(card, "damage")) {
						return [1, 0, 0, -2 * player.getHp()];
					}
				},
			},
		},
	},
	wuhun2: { audio: 2 },
	new_wuhun: {
		audio: "wuhun2",
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return event.source && event.source.isIn();
		},
		forced: true,
		logTarget: "source",
		async content(event, trigger, player) {
			trigger.source.addMark("new_wuhun", trigger.num);
		},
		group: "new_wuhun_die",
		ai: {
			notemp: true,
			effect: {
				target: (card, player, target) => {
					if (!target.hasFriend()) {
						return;
					}
					let rec = get.tag(card, "recover"),
						damage = get.tag(card, "damage");
					if (!rec && !damage) {
						return;
					}
					if (damage && player.hasSkillTag("jueqing", false, target)) {
						return 1.7;
					}
					let die = [null, 1],
						temp;
					game.filterPlayer(i => {
						temp = i.countMark("new_wuhun");
						if (i === player && target.hp + target.hujia > 1) {
							temp++;
						}
						if (temp > die[1]) {
							die = [i, temp];
						} else if (temp === die[1]) {
							if (!die[0]) {
								die = [i, temp];
							} else if (get.attitude(target, i) < get.attitude(target, die[0])) {
								die = [i, temp];
							}
						}
					});
					if (die[0]) {
						if (damage) {
							return [1, 0, 1, (-6 * get.sgnAttitude(player, die[0])) / Math.max(1, target.hp)];
						}
						return [1, (6 * get.sgnAttitude(player, die[0])) / Math.max(1, target.hp)];
					}
				},
			},
		},
		marktext: "魇",
		intro: {
			name: "梦魇",
			content: "mark",
			onunmark: true,
		},
		subSkill: {
			die: {
				audio: "wuhun2",
				trigger: { player: "die" },
				filter(event, player) {
					return game.hasPlayer(function (current) {
						return current != player && current.hasMark("new_wuhun");
					});
				},
				forced: true,
				direct: true,
				forceDie: true,
				skillAnimation: true,
				animationColor: "soil",
				async content(event, trigger, player) {
					let maxNum = 0;
					for (const current of game.players) {
						if (current === player) {
							continue;
						}

						const markNum = current.countMark("new_wuhun");
						maxNum = Math.max(maxNum, markNum);
					}
					const num = maxNum;
					let result = await player
						.chooseTarget(
							true,
							"请选择【武魂】的目标",
							"令其进行判定，若判定结果不为【桃】或【桃园结义】，则其死亡",
							(card, player, target) => {
								return target != player && target.countMark("new_wuhun") == _status.event.num;
							}
						)
						.set("ai", target => -get.attitude(_status.event.player, target))
						.set("forceDie", true)
						.set("num", num)
						.forResult();
					if (!result.bool) {
						return;
					}

					const target = result.targets[0];
					event.target = target;
					player.logSkill("new_wuhun_die", target);
					player.line(target, { color: [255, 255, 0] });
					await game.delay(2);
					result = await target
						.judge(card => (["tao", "taoyuan"].includes(card.name) ? 10 : -10))
						.set("judge2", result => !result.bool)
						.forResult();
					if (!result.bool) {
						await target.die();
					}
				},
			},
		},
	},
	// 神吕蒙
	// 涉猎
	shelie: {
		audio: 2,
		trigger: { player: "phaseDrawBegin1" },
		filter(event, player) {
			return !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.changeToZero();
			const cards = get.cards(5, true);
			await player.showCards(cards, `${get.translation(player)}发动了【${get.translation(event.name)}】`, true).set("clearArena", false);
			const list = cards.map(card => get.suit(card)).unique();
			const result = await player
				.chooseCardButton(`涉猎：获取花色各不相同的牌`, cards, list.length, true)
				.set("filterButton", function (button) {
					for (let i = 0; i < ui.selected.buttons.length; i++) {
						if (get.suit(ui.selected.buttons[i].link) == get.suit(button.link)) {
							return false;
						}
					}
					return true;
				})
				.set("ai", function (button) {
					return get.value(button.link, _status.event.player);
				})
				.forResult();
			game.broadcastAll(ui.clear);
			if (result?.links?.length) {
				await player.gain(result.links, "gain2");
			}
		},
		ai: {
			threaten: 1.2,
		},
	},
	// 攻心
	gongxin: {
		audio: 2,
		audioname: ["re_lvmeng"],
		audioname2: { gexuan: "gongxin_gexuan" },
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return target != player && target.countCards("h");
		},
		async content(event, trigger, player) {
			const { target } = event;
			const cards = target.getCards("h");
			const result = await player
				.chooseToMove_new("攻心")
				.set("list", [
					[get.translation(target) + "的手牌", cards],
					[["弃置"], ["置于牌堆顶"]],
				])
				.set("filterOk", moved => {
					return (
						moved[1]
							.slice()
							.concat(moved[2])
							.filter(card => get.suit(card) == "heart").length == 1
					);
				})
				.set("filterMove", (from, to, moved) => {
					if (moved[0].includes(from.link) && moved[1].length + moved[2].length >= 1 && [1, 2].includes(to)) {
						return false;
					}
					return get.suit(from) == "heart";
				})
				.set("processAI", list => {
					let card = list[0][1]
						.slice()
						.filter(card => {
							return get.suit(card) == "heart";
						})
						.sort((a, b) => {
							return get.value(b) - get.value(a);
						})[0];
					if (!card) {
						return false;
					}
					return [list[0][1].slice().remove(card), [card], []];
				})
				.forResult();
			if (result.bool) {
				if (result.moved[1].length) {
					await target.discard(result.moved[1]);
				} else {
					await player.showCards(result.moved[2], get.translation(player) + "对" + get.translation(target) + "发动了【攻心】");
					await target.lose(result.moved[2], ui.cardPile, "visible", "insert");
				}
			}
		},
		ai: {
			threaten: 1.5,
			result: {
				target(player, target) {
					return -target.countCards("h");
				},
			},
			order: 10,
			expose: 0.4,
		},
	},
	// 神周瑜
	// 琴音
	qinyin: {
		audio: 2,
		audioname: ["mb_zhouyu"],
		trigger: { player: "phaseDiscardEnd" },
		direct: true,
		logAudio: index => (typeof index === "number" ? "qinyin" + index + ".mp3" : 2),
		logAudio2: {
			mb_zhouyu: index => (typeof index === "number" ? `qinyin_mb_zhouyu${index}.mp3` : 2),
		},
		filter(event, player) {
			var cards = [];
			player.getHistory("lose", function (evt) {
				if (evt.type == "discard" && evt.getParent("phaseDiscard") == event) {
					cards.addArray(evt.cards2);
				}
			});
			return cards.length > 1;
		},
		async content(event, trigger, player) {
			event.forceDie = true;
			if (typeof event.count !== "number") {
				event.count = 1;
			}

			for (let time = event.count; time > 0; time--) {
				let recover = 0;
				let lose = 0;
				const players = game.filterPlayer();
				for (const current of players) {
					if (current.hp < current.maxHp) {
						if (get.attitude(player, current) > 0) {
							if (current.hp < 2) {
								lose--;
								recover += 0.5;
							}
							lose--;
							recover++;
						} else if (get.attitude(player, current) < 0) {
							if (current.hp < 2) {
								lose++;
								recover -= 0.5;
							}
							lose++;
							recover--;
						}
					} else {
						if (get.attitude(player, current) > 0) {
							lose--;
						} else if (get.attitude(player, current) < 0) {
							lose++;
						}
					}
				}

				const prompt = get.prompt("qinyin") + "（剩余" + get.cnNumber(time) + "次）";
				const next = player.chooseControl("失去体力", "回复体力", "cancel2", ui.create.dialog(get.prompt("qinyin"), "hidden"));
				next.set("ai", () => {
					if (lose > recover && lose > 0) {
						return 0;
					}
					if (lose < recover && recover > 0) {
						return 1;
					}
					return 2;
				});

				const result = await next.forResult();
				if (result.control === "cancel2") {
					return;
				}

				player.logSkill("qinyin", null, null, null, [result.control == "回复体力" ? 2 : 1]);
				const bool = result.control === "回复体力";
				await game.doAsyncInOrder(game.filterPlayer(), async target => {
					if (bool) {
						await target.recover();
					} else {
						await target.loseHp();
					}
				});
			}
		},
		ai: {
			expose: 0.1,
			threaten: 2,
		},
	},
	// 业炎
	yeyan: {
		limited: true,
		audio: 2,
		enable: "phaseUse",
		filterCard(card, player) {
			return !ui.selected.cards.some(cardx => get.suit(cardx, player) == get.suit(card, player));
		},
		selectCard: [0, 4],
		filterTarget(card, player, target) {
			var length = ui.selected.cards.length;
			return length == 0 || length == 4;
		},
		selectTarget() {
			if (ui.selected.cards.length == 4) {
				return [1, 2];
			}
			if (ui.selected.cards.length == 0) {
				return [1, 3];
			}
			game.uncheck("target");
			return [1, 3];
		},
		complexCard: true,
		complexSelect: true,
		line: "fire",
		forceDie: true,
		animationColor: "metal",
		skillAnimation: "legend",
		check(card) {
			if (!lib.skill.yeyan.getBigFire(get.event().player)) {
				return -1;
			}
			return 1 / (get.value(card) || 0.5);
		},
		multitarget: true,
		multiline: true,
		async contentBefore(event, trigger, player) {
			player.awakenSkill(event.skill);
		},
		async content(event, trigger, player) {
			const { cards, targets } = event;

			if (cards.length !== 4) {
				await game.doAsyncInOrder(targets, target =>
					target.damage({
						num: 1,
						nature: "fire",
						nocard: true,
					})
				);
				return;
			}

			await player.loseHp(3);

			if (targets.length === 1) {
				const result = await player
					.chooseControl("2点", "3点")
					.set("prompt", "请选择伤害点数")
					.set("ai", () => "3点")
					.set("forceDie", true)
					.forResult();

				await targets[0].damage({
					num: result.control === "2点" ? 2 : 3,
					nature: "fire",
					nocard: true,
				});
			} else {
				const result = await player
					.chooseTarget("请选择受到2点伤害的角色", true, (card, player, target) => {
						return get.event().targets.includes(target);
					})
					.set("ai", () => 1)
					.set("forceDie", true)
					.set("targets", targets)
					.forResult();

				const target2 = result.targets[0];
				targets.sortBySeat();
				for (const target of targets) {
					let damageNum = 1;
					if (target === target2) {
						damageNum = 2;
					}
					await target.damage({
						num: damageNum,
						nature: "fire",
						nocard: true,
					});
				}
			}
		},
		ai: {
			order(item, player) {
				return lib.skill.yeyan.getBigFire(player) ? 10 : 1;
			},
			fireAttack: true,
			result: {
				target(player, target) {
					if (player.hasUnknown()) {
						return 0;
					}
					const att = get.sgn(get.attitude(player, target));
					const targets = game.filterPlayer(
						target =>
							get.damageEffect(target, player, player, "fire") &&
							(!lib.skill.yeyan.getBigFire(player) || (target.hp <= 3 && !target.hasSkillTag("filterDamage", null, { player: player })))
					);
					if (!targets.includes(target)) {
						return 0;
					}
					if (lib.skill.yeyan.getBigFire(player)) {
						if (ui.selected.targets.length) {
							return 0;
						}
						if (!(targets.length == 1 || (att < 0 && target.identity && target.identity.indexOf("zhu") != -1))) {
							return 0;
						}
					}
					return att * get.damageEffect(target, player, player, "fire");
				},
			},
		},
		getBigFire(player) {
			if (player.getDiscardableCards(player, "h").reduce((list, card) => list.add(get.suit(card, player)), []).length < 4) {
				return false;
			}
			const targets = game.filterPlayer(
				target =>
					get.damageEffect(target, player, player, "fire") &&
					target.hp <= 3 &&
					!target.hasSkillTag("filterDamage", null, { player: player })
			);
			if (!targets.length) {
				return false;
			}
			if (
				targets.length == 1 ||
				targets.some(target => get.attitude(player, target) < 0 && target.identity && target.identity.indexOf("zhu") != -1)
			) {
				let suits = player.getDiscardableCards(player, "h").reduce((map, card) => {
					const suit = get.suit(card, player);
					if (!map[suit]) {
						map[suit] = [];
					}
					return map;
				}, {}),
					cards = [];
				Object.keys(suits).forEach(i => {
					suits[i].addArray(player.getDiscardableCards(player, "h").filter(card => get.suit(card) == i));
					cards.add(suits[i].sort((a, b) => get.value(a) - get.value(b))[0]);
				});
				return player.hp + player.countCards("h", card => !cards.includes(card) && player.canSaveCard(card, player)) - 3 > 0;
			}
			return false;
		},
	},
	// 神诸葛亮
	// 七星
	qixing: {
		audio: 2,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: false,
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			const getStars = player.addToExpansion(get.cards(7), "draw");
			getStars.gaintag.add("qixing");
			await getStars;

			// 下面内容直接复制的qixing2，仅ai做了改变
			const expansions = player.getExpansions("qixing");
			const cards = player.getCards("h");
			if (!expansions.length || !cards.length) {
				return;
			}

			const next = player.chooseToMove("七星：是否交换“星”和手牌？");
			next.set("list", [
				[`${get.translation(player)}（你）的星`, expansions],
				["手牌区", cards],
			]);
			next.set("filterMove", (from, to) => typeof to != "number");
			next.set("processAI", processAI);

			const result = await next.forResult();
			if (result.bool) {
				const pushs = result.moved[0];
				const gains = result.moved[1];
				pushs.removeArray(expansions);
				gains.removeArray(cards);
				if (!pushs.length || pushs.length !== gains.length) {
					return;
				}
				player.logSkill("qixing2");
				const addStars = player.addToExpansion(pushs, player, "giveAuto");
				addStars.gaintag.add("qixing");
				await addStars;
				await player.gain(gains, "draw");
			}

			return;

			/**
			 * @typedef {[string, Card[]]} MoveItem
			 * @typedef {MoveItem[]} MoveList
			 * @param {MoveList} list
			 * @return {[Card[], Card[]]}
			 */
			function processAI(list) {
				const player = get.player();

				const cards = list[0][1].concat(list[1][1]).sort((a, b) => get.useful(a) - get.useful(b));
				const cards2 = cards.splice(0, player.getExpansions("qixing").length);
				return [cards2, cards];
			}
		},
		intro: {
			markcount: "expansion",
			mark(dialog, content, player) {
				var content = player.getExpansions("qixing");
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						dialog.addAuto(content);
					} else {
						return "共有" + get.cnNumber(content.length) + "张星";
					}
				}
			},
			content(content, player) {
				var content = player.getExpansions("qixing");
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						return get.translation(content);
					}
					return "共有" + get.cnNumber(content.length) + "张星";
				}
			},
		},
		group: ["qixing2"],
		ai: {
			notemp: true,
		},
	},
	qixing2: {
		trigger: { player: "phaseDrawAfter" },
		direct: true,
		sourceSkill: "qixing",
		filter(event, player) {
			return player.getExpansions("qixing").length > 0 && player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			const expansions = player.getExpansions("qixing");
			const cards = player.getCards("h");
			if (!expansions.length || !cards.length) {
				return;
			}

			const next = player.chooseToMove("七星：是否交换“星”和手牌？");
			next.set("list", [
				[`${get.translation(player)}（你）的星`, expansions],
				["手牌区", cards],
			]);
			next.set("filterMove", (from, to) => typeof to != "number");
			next.set("processAI", processAI);

			const result = await next.forResult();
			if (result.bool) {
				const pushs = result.moved[0];
				const gains = result.moved[1];
				pushs.removeArray(expansions);
				gains.removeArray(cards);
				if (!pushs.length || pushs.length !== gains.length) {
					return;
				}
				player.logSkill("qixing2");
				const addStars = player.addToExpansion(pushs, player, "giveAuto");
				addStars.gaintag.add("qixing");
				await addStars;
				await player.gain(gains, "draw");
			}

			return;

			/**
			 * @typedef {[string, Card[]]} MoveItem
			 * @typedef {MoveItem[]} MoveList
			 * @param {MoveList} list
			 * @return {[Card[], Card[]]}
			 */
			function processAI(list) {
				const player = get.player();

				const cards = list[0][1].concat(list[1][1]).sort((a, b) => get.value(a) - get.value(b));
				const cards2 = cards.splice(0, player.getExpansions("qixing").length);
				return [cards2, cards];
			}
		},
	},
	// 狂风
	kuangfeng: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		filter(event, player) {
			return player.getExpansions("qixing").length;
		},
		async cost(event, trigger, player) {
			const {
				bool,
				targets,
				links: cost_data,
			} = await player
				.chooseButtonTarget({
					createDialog: [get.prompt2(event.skill), player.getExpansions("qixing")],
					selectButton: 1,
					filterTarget: true,
					ai1(button) {
						if (
							game.hasPlayer(target => {
								return get.attitude(get.player(), target) < 0;
							})
						) {
							return 1;
						}
						return 0;
					},
					ai2(target) {
						return -get.attitude(get.player(), target);
					},
				})
				.forResult();
			event.result = {
				bool: bool,
				targets: targets?.sortBySeat(),
				cost_data: cost_data,
			};
		},
		async content(event, trigger, player) {
			const { targets, cost_data: cards } = event;
			targets.forEach(target => {
				target.addAdditionalSkill(`kuangfeng_${player.playerid}`, "kuangfeng2");
				target.markAuto("kuangfeng2", [player]);
			});
			player.addTempSkill("kuangfeng3", { player: "phaseBeginStart" });
			await player.loseToDiscardpile(cards);
		},
		ai: {
			combo: "qixing",
		},
	},
	kuangfeng2: {
		charlotte: true,
		intro: {
			content(storage) {
				return `共有${storage.length}枚标记`;
			},
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "fireDamage") && current < 0) {
						return 1.5;
					}
				},
			},
		},
	},
	kuangfeng3: {
		trigger: { global: "damageBegin3" },
		sourceSkill: "kuangfeng",
		filter(event, player) {
			return event.hasNature("fire") && event.player.getStorage("kuangfeng2").includes(player);
		},
		charlotte: true,
		forced: true,
		logTarget: "player",
		async content(event, trigger, player) {
			trigger.num++;
		},
		onremove(player) {
			game.countPlayer2(current => {
				if (current.getStorage("kuangfeng2").includes(player)) {
					current.unmarkAuto("kuangfeng2", player);
					current.removeAdditionalSkill(`kuangfeng_${player.playerid}`);
				}
			}, true);
		},
	},
	// 大雾
	dawu: {
		trigger: { player: "phaseJieshuBegin" },
		filter(event, player) {
			return player.getExpansions("qixing").length;
		},
		audio: 2,
		async cost(event, trigger, player) {
			const {
				bool,
				targets,
				links: cost_data,
			} = await player
				.chooseButtonTarget({
					createDialog: [get.prompt2(event.skill), player.getExpansions("qixing")],
					selectButton: [1, game.countPlayer()],
					filterTarget: true,
					selectTarget() {
						return ui.selected.buttons.length;
					},
					complexSelect: true,
					ai1(button) {
						const { player, allUse } = get.event();
						const targets = game.filterPlayer(target => {
							if (target.isMin() || target.hasSkill("biantian2") || target.hasSkill("dawu2")) {
								return false;
							}
							let att = get.attitude(player, target);
							if (att >= 4) {
								if (target.hp > 2 && (target.isHealthy() || target.hasSkillTag("maixie"))) {
									return false;
								}
								if (allUse || target.hp == 1) {
									return true;
								}
								if (target.hp == 2 && target.countCards("he") <= 2) {
									return true;
								}
							}
							return false;
						});
						if (ui.selected.buttons.length < targets.length) {
							return 1;
						}
						return 0;
					},
					ai2(target) {
						const { player, allUse } = get.event();
						if (target.isMin() || target.hasSkill("biantian2") || target.hasSkill("dawu2")) {
							return 0;
						}
						let att = get.attitude(player, target);
						if (att >= 4) {
							if (target.hp > 2 && (target.isHealthy() || target.hasSkillTag("maixie"))) {
								return 0;
							}
							if (allUse || target.hp == 1) {
								return att;
							}
							if (target.hp == 2 && target.countCards("he") <= 2) {
								return att * 0.7;
							}
							return 0;
						}
						return -1;
					},
				})
				.set("allUse", player.getExpansions("qixing").length >= game.countPlayer(current => get.attitude(player, current) > 4) * 2)
				.forResult();
			event.result = {
				bool: bool,
				targets: targets?.sortBySeat(),
				cost_data: cost_data,
			};
		},
		async content(event, trigger, player) {
			const { targets, cost_data: cards } = event;
			targets.forEach(target => {
				target.addAdditionalSkill(`dawu_${player.playerid}`, "dawu2");
				target.markAuto("dawu2", [player]);
			});
			player.addTempSkill("dawu3", { player: "phaseBeginStart" });
			await player.loseToDiscardpile(cards);
		},
		ai: {
			combo: "qixing",
		},
	},
	dawu2: {
		charlotte: true,
		ai: {
			nofire: true,
			nodamage: true,
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "damage") && !get.tag(card, "thunderDamage")) {
						return "zeroplayertarget";
					}
				},
			},
		},
		intro: {
			content(storage) {
				return `共有${storage.length}枚标记`;
			},
		},
	},
	dawu3: {
		trigger: { global: "damageBegin4" },
		sourceSkill: "dawu",
		filter(event, player) {
			return !event.hasNature("thunder") && event.player.getStorage("dawu2").includes(player);
		},
		forced: true,
		charlotte: true,
		logTarget: "player",
		async content(event, trigger, player) {
			trigger.cancel();
		},
		onremove(player) {
			game.countPlayer2(current => {
				if (current.getStorage("dawu2").includes(player)) {
					current.unmarkAuto("dawu2", [player]);
					current.removeAdditionalSkill(`dawu_${player.playerid}`);
				}
			}, true);
		},
	},
	// 神曹操
	// 归心
	guixin: {
		audio: 2,
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return game.hasPlayer(cur => {
				return cur !== player && cur.countCards("hej") > 0;
			});
		},
		check(event, player) {
			if (player.isTurnedOver() || event.num > 1) {
				return true;
			}
			var num = game.countPlayer(function (current) {
				if (current.countCards("he") && current != player && get.attitude(player, current) <= 0) {
					return true;
				}
				if (current.countCards("j") && current != player && get.attitude(player, current) > 0) {
					return true;
				}
			});
			return num >= 2;
		},
		getIndex(event, player) {
			return event.num;
		},
		async content(event, trigger, player) {
			let targets = game.filterPlayer(current => current != player).sortBySeat();
			player.line(targets, "green");
			await player.gainMultiple(targets, "hej");
			await player.turnOver();
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			threaten(player, target) {
				if (target.hp == 1) {
					return 2.5;
				}
				return 0.5;
			},
			effect: {
				target(card, player, target) {
					if (
						!target._guixin_eff &&
						get.tag(card, "damage") &&
						target.hp >
						(player.hasSkillTag("damageBonus", true, {
							card: card,
							target: target,
						})
							? 2
							: 1)
					) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -2];
						}
						target._guixin_eff = true;
						let gain = game.countPlayer(function (current) {
							if (target == current) {
								return 0;
							}
							if (get.attitude(target, current) > 0) {
								if (
									current.hasCard(
										cardx =>
											lib.filter.canBeGained(cardx, target, current, "guixin") &&
											get.effect(current, cardx, current, current) < 0,
										"ej"
									)
								) {
									return 1.3;
								}
								return 0;
							}
							if (
								current.hasCard(
									cardx =>
										lib.filter.canBeGained(cardx, target, current, "guixin") && get.effect(current, cardx, current, current) > 0,
									"ej"
								)
							) {
								return 1.1;
							}
							if (current.hasCard(cardx => lib.filter.canBeGained(cardx, target, current, "guixin"), "h")) {
								return 0.9;
							}
							return 0;
						});
						if (target.isTurnedOver()) {
							gain += 2.3;
						} else {
							gain -= 2.3;
						}
						delete target._guixin_eff;
						return [1, Math.max(0, gain)];
					}
				},
			},
		},
	},
	new_guixin: {
		audio: "guixin",
		trigger: {
			player: "damageEnd",
		},
		filter(event, player) {
			return game.hasPlayer(cur => {
				return cur !== player && cur.countCards("hej") > 0;
			});
		},
		check(event, player) {
			if (player.isTurnedOver() || event.num > 1) {
				return true;
			}
			var num = game.countPlayer(function (current) {
				if (current.countCards("he") && current != player && get.attitude(player, current) <= 0) {
					return true;
				}
				if (current.countCards("j") && current != player && get.attitude(player, current) > 0) {
					return true;
				}
			});
			return num >= 2;
		},
		getIndex(event, player) {
			return event.num;
		},
		async content(event, trigger, player) {
			let targets = game.filterPlayer();
			targets.remove(player);
			targets.sort(lib.sort.seat);
			player.line(targets, "green");
			const control = await player
				.chooseControl("手牌区", "装备区", "判定区")
				.set("ai", function () {
					if (
						game.hasPlayer(function (current) {
							return current.countCards("j") && current != player && get.attitude(player, current) > 0;
						})
					) {
						return 2;
					}
					return Math.floor(Math.random() * 3);
				})
				.set("prompt", "请选择优先获得的区域")
				.forResult();
			const range = {
				手牌区: ["h", "e", "j"],
				装备区: ["e", "h", "j"],
				判定区: ["j", "h", "e"],
			}[control.control || "手牌区"];
			while (targets.length > 0) {
				const target = targets.shift();
				for (var i = 0; i < range.length; i++) {
					var cards = target.getCards(range[i]);
					if (cards.length) {
						var card = cards.randomGet();
						await player.gain(card, target, "giveAuto", "bySelf");
						break;
					}
				}
			}
			await player.turnOver();
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			threaten(player, target) {
				if (target.hp == 1) {
					return 2.5;
				}
				return 1;
			},
			effect: {
				target(card, player, target) {
					if (
						!target._new_guixin_eff &&
						get.tag(card, "damage") &&
						target.hp >
						(player.hasSkillTag("damageBonus", true, {
							card: card,
							target: target,
						})
							? 2
							: 1)
					) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -2];
						}
						target._new_guixin_eff = true;
						let gain = game.countPlayer(function (current) {
							if (target == current) {
								return 0;
							}
							if (get.attitude(target, current) > 0) {
								if (
									current.hasCard(
										cardx =>
											lib.filter.canBeGained(cardx, target, current, "new_guixin") &&
											get.effect(current, cardx, current, current) < 0,
										"j"
									)
								) {
									return 1.3;
								}
								return 0;
							}
							if (
								current.hasCard(
									cardx =>
										lib.filter.canBeGained(cardx, target, current, "new_guixin") &&
										get.effect(current, cardx, current, current) > 0,
									"e"
								)
							) {
								return 1.1;
							}
							if (current.hasCard(cardx => lib.filter.canBeGained(cardx, target, current, "new_guixin"), "h")) {
								return 0.9;
							}
							return 0;
						});
						if (target.isTurnedOver()) {
							gain += 2.3;
						} else {
							gain -= 2.3;
						}
						delete target._new_guixin_eff;
						return [1, Math.max(0, gain)];
					}
				},
			},
		},
	},
	// 飞影
	feiying: {
		mod: {
			globalTo(from, to, distance) {
				return distance + 1;
			},
		},
	},
	// 神吕布
	// 狂暴
	kuangbao: {
		audio: 2,
		marktext: "暴",
		trigger: {
			source: "damageSource",
			player: ["damageEnd", "enterGame"],
			global: "phaseBefore",
		},
		forced: true,
		filter(event) {
			return (event.name != "damage" && (event.name != "phase" || game.phaseNumber == 0)) || event.num > 0;
		},
		async content(event, trigger, player) {
			player.addMark("baonu", trigger.name == "damage" ? trigger.num : 2);
		},
		intro: {
			name: "暴怒",
			content: "mark",
		},
		ai: {
			combo: "shenfen",
			maixie: true,
			maixie_hp: true,
		},
	},
	// 无谋
	wumou: {
		audio: 2,
		trigger: { player: "useCard" },
		forced: true,
		filter(event) {
			return get.type(event.card) == "trick";
		},
		async content(event, trigger, player) {
			if (!player.hasMark("baonu")) {
				await player.loseHp();
				return;
			}

			const result = await player
				.chooseControlList(["移去一枚【暴怒】标记", "失去1点体力"], true)
				.set("ai", (event, player) => {
					if (get.effect(player, { name: "losehp" }, player, player) >= 0) {
						return 1;
					}
					if (player.storage.baonu > 6) {
						return 0;
					}
					if (player.hp + player.countCards("h", "tao") > 3) {
						return 1;
					}
					return 0;
				})
				.forResult();

			if (result.index == 0) {
				player.removeMark("baonu", 1);
			} else {
				await player.loseHp();
			}
		},
		ai: {
			effect: {
				player_use(card, player) {
					if (get.type(card) == "trick" && get.value(card) < 6) {
						return [0, -2];
					}
				},
			},
			neg: true,
		},
	},
	// 无前
	wuqian: {
		audio: 2,
		enable: "phaseUse",
		derivation: "wushuang",
		filter(event, player) {
			return player.countMark("baonu") >= 2 && game.hasPlayer(target => lib.skill.wuqian.filterTarget(null, player, target));
		},
		filterTarget(card, player, target) {
			return target != player && !target.hasSkill("wuqian_targeted");
		},
		async content(event, trigger, player) {
			const { target } = event;
			player.removeMark("baonu", 2);
			await player.addTempSkills("wushuang");
			player.popup("无双");
			// game.log(player,'获得了技能','#g【无双】');
			target.addTempSkill("wuqian_targeted");
		},
		ai: {
			order: 9,
			result: {
				target(player, target) {
					if (
						player.countCards("hs", card => {
							if (!player.getCardUsable({ name: card.name })) {
								return false;
							}
							if (!player.canUse(card, target)) {
								return false;
							}
							var eff1 = get.effect(target, card, player, player);
							_status.baonuCheck = true;
							var eff2 = get.effect(target, card, player, player);
							delete _status.baonuCheck;
							return eff2 > Math.max(0, eff1);
						})
					) {
						return -1;
					}
					return 0;
				},
			},
			combo: "baonu",
		},
		global: "wuqian_ai",
		subSkill: {
			targeted: {
				charlotte: true,
				ai: { unequip2: true },
			},
			ai: {
				ai: {
					unequip2: true,
					skillTagFilter(player) {
						if (!_status.baonuCheck) {
							return false;
						}
					},
				},
			},
		},
	},
	// 神愤
	shenfen: {
		audio: 2,
		enable: "phaseUse",
		filter(event, player) {
			return player.countMark("baonu") >= 6;
		},
		usable: 1,
		skillAnimation: true,
		animationColor: "metal",
		async content(event, trigger, player) {
			player.removeMark("baonu", 6);
			const targets = game.filterPlayer(target => target !== player);
			player.line(targets, "green");

			await game.doAsyncInOrder(targets, target => target.damage("nocard"));
			await game.doAsyncInOrder(targets, async target => {
				const cards = target.getCards("e");
				await target.discard(cards).set("delay", false);
				if (cards.length) {
					await game.delay(0.5);
				}
			});
			await game.doAsyncInOrder(targets, async target => {
				const num = target.countCards("h");
				await target.chooseToDiscard(4, "h", true).set("delay", false);
				if (num > 0) {
					await game.delay(0.5);
				}
			});
			await player.turnOver();
		},
		ai: {
			combo: "baonu",
			order: 10,
			result: {
				player(player) {
					return game.countPlayer(function (current) {
						if (current != player) {
							return get.sgn(get.damageEffect(current, player, player));
						}
					});
				},
			},
		},
	},
	// 神赵云
	// 绝境
	juejing: {
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
		audio: true,
		trigger: { player: "phaseDrawBegin2" },
		//priority:-5,
		filter(event, player) {
			return !event.numFixed && player.hp < player.maxHp;
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.num += player.getDamagedHp();
		},
	},
	// 龙魂
	longhun: {
		audio: 4,
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
		group: ["longhun1", "longhun2", "longhun3", "longhun4"],
		ai: {
			fireAttack: true,
			skillTagFilter(player, tag) {
				switch (tag) {
					case "respondSha": {
						if (player.countCards("he", { suit: "diamond" }) < Math.max(1, player.hp)) {
							return false;
						}
						break;
					}
					case "respondShan": {
						if (player.countCards("he", { suit: "club" }) < Math.max(1, player.hp)) {
							return false;
						}
						break;
					}
					case "save": {
						if (player.countCards("he", { suit: "heart" }) < Math.max(1, player.hp)) {
							return false;
						}
						break;
					}
					default:
						return true;
				}
			},
			maixie: true,
			respondSha: true,
			respondShan: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "recover") && target.hp >= 1) {
						return [0, 0];
					}
					if (!target.hasFriend()) {
						return;
					}
					if ((get.tag(card, "damage") == 1 || get.tag(card, "loseHp")) && target.hp > 1) {
						return [0, 1];
					}
				},
			},
			threaten(player, target) {
				if (target.hp == 1) {
					return 2;
				}
				return 0.5;
			},
		},
	},
	longhun1: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张红桃牌当作桃使用";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 10 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAs: { name: "tao" },
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "heart" }) >= player.hp;
		},
		filterCard(card) {
			return get.suit(card) == "heart";
		},
	},
	longhun2: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张方片当作火杀使用或打出";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 10 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAs: { name: "sha", nature: "fire" },
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "diamond" }) >= player.hp;
		},
		filterCard(card) {
			return get.suit(card) == "diamond";
		},
	},
	longhun3: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张梅花牌当作闪使用或打出";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 10 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "club" }) >= player.hp;
		},
		viewAs: { name: "shan" },
		filterCard(card) {
			return get.suit(card) == "club";
		},
	},
	longhun4: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张黑桃牌当作无懈可击使用";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 7 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAs: { name: "wuxie" },
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "spade" }) >= player.hp;
		},
		filterCard(card) {
			return get.suit(card) == "spade";
		},
	},
	// 神司马懿
	// 忍戒
	renjie: {
		audio: "renjie2",
		trigger: { player: "damageEnd" },
		forced: true,
		group: "renjie2",
		filter(event) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			player.addMark("renjie", trigger.num);
		},
		intro: {
			name2: "忍",
			content: "mark",
		},
		marktext: "忍",
		ai: {
			maixie: true,
			maixie_hp: true,
			combo: "jilue",
			effect: {
				target(card, player, target) {
					if ((!target.hasSkill("sbaiyin") && !target.hasSkill("jilue")) || !target.hasFriend()) {
						return;
					}
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -2];
					}
					if (get.tag(card, "damage")) {
						if (target.hp == target.maxHp) {
							if (!target.hasSkill("jilue")) {
								return [0, 1];
							}
							return [0.7, 1];
						}
						return 0.7;
					}
				},
			},
		},
	},
	renjie2: {
		audio: 2,
		mod: {
			aiOrder: (player, card, num) => {
				if (num <= 0 || typeof card !== "object" || !player.isPhaseUsing()) {
					return num;
				}
				if (player.hasSkill("sbaiyin")) {
					if (player.countMark("renjie") < 4 && player.getUseValue(card) < Math.min(4, (player.hp * player.hp) / 4)) {
						return 0;
					}
				} else if (player.hasSkill("jilue")) {
					if (player.countMark("renjie") < 3 && player.getUseValue(card) < Math.min(1.8, 0.18 * player.hp * player.hp)) {
						return 0;
					}
				}
			},
		},
		trigger: {
			player: "loseAfter",
			global: "loseAsyncAfter",
		},
		forced: true,
		sourceSkill: "renjie",
		filter(event, player) {
			if (event.type != "discard" || event.getlx === false) {
				return false;
			}
			var evt = event.getParent("phaseDiscard"),
				evt2 = event.getl(player);
			return evt && evt2 && evt.name == "phaseDiscard" && evt.player == player && evt2.cards2 && evt2.cards2.length > 0;
		},
		async content(event, trigger, player) {
			player.addMark("renjie", trigger.getl(player).cards2.length);
		},
	},
	// 拜印
	sbaiyin: {
		skillAnimation: "epic",
		animationColor: "thunder",
		juexingji: true,
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		audio: 2,
		filter(event, player) {
			return player.countMark("renjie") >= 4;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.loseMaxHp();
			await player.addSkills("jilue");
		},
		derivation: ["jilue", "jilue_wansha", "jilue_zhiheng", "jilue_guicai", "jilue_fangzhu", "jilue_jizhi"],
		ai: { combo: "renjie" },
	},
	// 极略
	jilue: {
		audio: 2,
		group: ["jilue_wansha", "jilue_zhiheng", "jilue_guicai", "jilue_fangzhu", "jilue_jizhi"],
		ai: { combo: "renjie" },
	},
	jilue_wansha: {
		audio: 1,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return player.hasMark("renjie");
		},
		async content(event, trigger, player) {
			player.removeMark("renjie", 1);
			player.addTempSkill("rewansha");
		},
		ai: {
			order: () => {
				let player = _status.event.player;
				if (
					game.hasPlayer(current => {
						if (player === current || current.hp > 1 || get.attitude(player, current) >= 0) {
							return false;
						}
						return (
							(player.inRange(current) && player.countCards("hs", "sha") && player.getCardUsable("sha")) ||
							player.countCards("hs", card => get.name(card) !== "sha" && get.tag(card, "damage")) > 1
						);
					})
				) {
					return 9.2;
				}
				return 0;
			},
			result: {
				player: 1,
			},
			effect: {
				player(card, player, target) {
					if (target && player.hasSkill("rewansha") && target.hp <= 1 && get.tag(card, "damage")) {
						return [1, 0, 1.5, -1.5];
					}
				},
			},
		},
	},
	jilue_zhiheng: {
		audio: 1,
		audioname2: {},
		inherit: "rezhiheng",
		filter(event, player) {
			return player.hasMark("renjie");
		},
		prompt: "弃置一枚“忍”，然后弃置任意张牌并摸等量的牌。若弃置了所有的手牌，则可以多摸一张牌。",
		async content(event, trigger, player) {
			player.removeMark("renjie", 1);

			const playerCards = player.getCards("h");
			const discardingCards = event.cards;
			await player.discard(discardingCards);

			const extraNum = discardingCards.every(card => playerCards.includes(card)) ? 1 : 0;
			await player.draw(event.num + discardingCards.length);
		},
		ai: {
			order(item, player) {
				if (player.hasCard(i => get.value(i) > Math.max(6, 9 - player.hp), "he")) {
					return 1;
				}
				return 10;
			},
			result: {
				player(player) {
					var num = 0;
					var cards = player.getCards("he");
					for (var i = 0; i < cards.length; i++) {
						if (get.value(cards[i]) < 6) {
							num++;
						}
					}
					if (cards.length > 2) {
						return 1;
					}
					// if (cards.length == 2 && player.storage.jilue > 1) {
					// }
					return 0;
				},
			},
			nokeep: true,
			skillTagFilter(player, tag, arg) {
				if (tag === "nokeep") {
					return player.isPhaseUsing() && !player.getStat().skill.jilue_zhiheng && player.hasCard(card => get.name(card) !== "tao", "h");
				}
			},
		},
	},
	jilue_guicai: {
		audio: 1,
		trigger: { global: "judge" },
		filter(event, player) {
			return player.countCards("hes") > 0 && player.hasMark("renjie");
		},
		async cost(event, trigger, player) {
			const next = player.chooseCard("是否弃置一枚“忍”，并发动〖鬼才〗？", "hes", filterCard);
			next.set("ai", processAI);

			event.result = await next.forResult();

			return;

			/**
			 * @param {Card} card
			 * @returns {boolean}
			 */
			function filterCard(card) {
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
			}

			/**
			 * @param {Card} card
			 * @returns {number}
			 */
			function processAI(card) {
				const trigger = get.event().parent._trigger;
				const player = get.event().player;
				const result = trigger.judge(card) - trigger.judge(trigger.player.judging[0]);
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
			}
		},
		async content(event, trigger, player) {
			const { cards } = event;
			const [card] = cards;
			player.removeMark("renjie", 1);
			await player.respond(cards, "highlight", "noOrdering");
			if (trigger.player.judging[0].clone) {
				trigger.player.judging[0].clone.delete();
				game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
			}
			await game.cardsDiscard(trigger.player.judging[0]);
			trigger.player.judging[0] = card;
			trigger.orderingCards.addArray(cards);
			game.log(trigger.player, "的判定牌改为", card);
			await game.delay(2);
		},
		ai: {
			rejudge: true,
			tag: {
				rejudge: 1,
			},
		},
	},
	jilue_fangzhu: {
		audio: 1,
		trigger: { player: "damageEnd" },
		//priority:-1,
		filter(event, player) {
			return player.hasMark("renjie");
		},
		async cost(event, trigger, player) {
			const next = player.chooseTarget("是否弃置一枚“忍”，并发动【放逐】？", (card, player, target) => player !== target);
			next.set("ai", processAI);

			event.result = await next.forResult();

			return;

			/**
			 * @param {Player} target
			 * @returns {number}
			 */
			function processAI(target) {
				if (target.hasSkillTag("noturn")) {
					return 0;
				}
				const player = get.player();
				const current = _status.currentPhase;
				const dis = current ? get.distance(current, target, "absolute") : 1;
				const draw = player.getDamagedHp();
				const att = get.attitude(player, target);
				if (att == 0) {
					return target.hasJudge("lebu") ? Math.random() / 3 : Math.sqrt(get.threaten(target)) / 5 + Math.random() / 2;
				}
				if (att > 0) {
					if (target.isTurnedOver()) {
						return att + draw;
					}
					if (draw < 4) {
						return -1;
					}
					if (current && target.getSeatNum() > current.getSeatNum()) {
						return att + draw / 3;
					}
					return (10 * Math.sqrt(Math.max(0.01, get.threaten(target)))) / (3.5 - draw) + dis / (2 * game.countPlayer());
				} else {
					if (target.isTurnedOver()) {
						return att - draw;
					}
					if (draw >= 5) {
						return -1;
					}
					if (current && target.getSeatNum() <= current.getSeatNum()) {
						return -att + draw / 3;
					}
					return (4.25 - draw) * 10 * Math.sqrt(Math.max(0.01, get.threaten(target))) + (2 * game.countPlayer()) / dis;
				}
			}
		},
		logTarget: "targets",
		async content(event, trigger, player) {
			const { targets } = event;
			const [target] = targets;
			player.removeMark("renjie", 1);
			await target.draw(player.maxHp - player.hp);
			await target.turnOver();
		},
	},
	jilue_jizhi: {
		audio: 1,
		trigger: { player: "useCard" },
		filter(event, player) {
			return get.type(event.card, "trick") == "trick" && event.card.isCard && player.hasMark("renjie");
		},
		async content(event, trigger, player) {
			player.removeMark("renjie", 1);
			const result = await player.draw("nodelay").forResult();
			event.card = result.cards[0];

			if (get.type(event.card) !== "basic") {
				return;
			}

			const result2 = await player
				.chooseBool(`是否弃置${get.translation(event.card)}并令本回合手牌上限+1？`)
				.set("ai", (evt, player) => _status.currentPhase === player && player.needsToDiscard(-3) && _status.event.value < 6)
				.set("value", get.value(event.card, player))
				.forResult();

			if (result2.bool) {
				await player.discard(event.card);
				player.addTempSkill("jilue_jizhi_clear");
				player.addMark("jilue_jizhi_clear", 1, false);
			}
		},
		subSkill: {
			clear: {
				charlotte: true,
				onremove: true,
				mod: {
					maxHandcard(player, num) {
						return num + player.countMark("jilue_jizhi_clear");
					},
				},
				intro: { content: "手牌上限+#" },
			},
		},
	},
	// 连破
	lianpo: {
		audio: 2,
		audioname: ["new_simayi"],
		trigger: { global: "phaseAfter" },
		frequent: true,
		filter(event, player) {
			return player.getStat("kill") > 0;
		},
		async content(event, trigger, player) {
			player.insertPhase();
		},
	},
};

export default skills;
