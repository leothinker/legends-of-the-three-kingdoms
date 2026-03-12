import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	//新杀小加强 陈到
	dcwanglie: {
		audio: "drlt_wanglie",
		locked: false,
		mod: {
			targetInRange(card, player, target) {
				if (player.hasSkill("dcwanglie_effect", null, null, false)) {
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
			if (player.hasSkill("dcwanglie2", null, null, false)) {
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
		group: "dcwanglie_startup",
		async content(event, trigger, player) {
			trigger.nowuxie = true;
			trigger.directHit.addArray(game.players);
			player.addTempSkill("dcwanglie2", "phaseUseAfter");
		},
		subSkill: {
			startup: {
				trigger: { player: "phaseUseBegin" },
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					player.addTempSkill("dcwanglie_effect", "phaseUseAfter");
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
					player.addMark("dcwanglie_effect", 1, false);
					if (player.countMark("dcwanglie_effect") >= 2) {
						player.removeSkill("dcwanglie_effect");
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
	dcwanglie2: {
		charlotte: true,
		mod: {
			playerEnabled(card, player, target) {
				if (player != target) {
					return false;
				}
			},
		},
	},
	//周妃
	olliangyin: {
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
		usable: 1,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt(event.skill), "选择一名其他角色，你与其各摸一张牌", lib.filter.notMe)
				.set("ai", function (target) {
					const player = _status.event.player,
						num = player.getExpansions("olkongsheng").length - 1;
					const att = get.attitude(player, target);
					if (att <= 0) {
						return 0;
					}
					if (target.countCards("h") == num && target.isDamaged() && get.recoverEffect(target, player, player) > 0) {
						return 3 * att;
					}
					return att;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			await game.asyncDraw([player, target].sortBySeat());
			await game.delayx();
			let num = player.getExpansions("olkongsheng").length;
			let check = player => {
				if (!player.isIn() || player.isHealthy()) {
					return false;
				}
				return player.countCards("h") == num;
			};
			if (check(player) || check(target)) {
				const choiceList = ["令自己回复1点体力", "令" + get.translation(target) + "回复1点体力"];
				const choices = [];
				if (check(player)) {
					choices.push("选项一");
				} else {
					choiceList[0] = '<span style="opacity:0.5">' + choiceList[0] + "</span>";
				}
				if (check(target)) {
					choices.push("选项二");
				} else {
					choiceList[1] = '<span style="opacity:0.5">' + choiceList[1] + "</span>";
				}
				choices.push("cancel2");
				const { control } = await player
					.chooseControl(choices)
					.set("choiceList", choiceList)
					.set("prompt", "良姻：是否令一名角色回复体力？")
					.set("ai", function () {
						const player = _status.event.player,
							target = _status.event.getParent().targets[0];
						let list = _status.event.controls.slice(0),
							eff1 = 0,
							eff2 = 0;
						if (list.includes("选项一")) {
							eff1 = get.recoverEffect(player, player, player);
						}
						if (list.includes("选项二")) {
							eff2 = get.recoverEffect(target, player, player);
						}
						if (eff1 > Math.max(0, eff2)) {
							return "选项一";
						}
						if (eff2 > 0) {
							return "选项二";
						}
						return "cancel2";
					})
					.forResult();
				if (control == "选项一") {
					await player.recover();
				} else if (control == "选项二") {
					await target.recover();
				}
			}
		},
		group: "olliangyin_gain",
		subSkill: {
			gain: {
				audio: "liangyin",
				trigger: {
					global: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				filter(event, player) {
					return game.hasPlayer(function (current) {
						const evt = event.getl(current);
						return evt && (evt.xs.length > 0 || evt.ss.length > 0);
					});
				},
				usable: 1,
				async cost(event, trigger, player) {
					if (!player.countCards("he") || !game.hasPlayer(current => current != player && current.countCards("he") > 0)) {
						return;
					}
					event.result = await player
						.chooseCardTarget({
							prompt: get.prompt("olliangyin"),
							prompt2: "弃置一张牌，并令一名其他角色也弃置一张牌",
							position: "he",
							filterCard: lib.filter.cardDiscardable,
							filterTarget(card, player, target) {
								return target != player && target.countCards("he") > 0;
							},
							ai1(card) {
								let player = _status.event.player;
								if (_status.event.me) {
									if (get.position(card) === _status.event.me) {
										return 12 - player.hp - get.value(card);
									}
									return 0;
								}
								return 5 - get.value(card);
							},
							ai2(target) {
								let player = _status.event.player,
									att = get.attitude(player, target);
								if (att > 0 && (_status.event.me || target.isHealthy())) {
									return -att;
								}
								if (
									att > 0 &&
									(target.countCards("he") > target.hp ||
										target.hasCard(function (card) {
											return get.value(card, target) <= 0;
										}, "e"))
								) {
									return att;
								}
								return -att;
							},
							me: (() => {
								if (player.isHealthy() || get.recoverEffect(player, player, _status.event.player) <= 0) {
									return false;
								}
								let ph = player.countCards("h"),
									num = player.getExpansions("olkongsheng").length;
								if (ph === num) {
									if (player.hasSkillTag("noh")) {
										return "h";
									}
									return "e";
								}
								if (ph - 1 === num) {
									return "h";
								}
								return false;
							})(),
						})
						.forResult();
				},
				async content(event, trigger, player) {
					const target = event.targets[0];
					await player.discard(event.cards);
					await target.chooseToDiscard("he", true);
					await game.delayx();
					const num = player.getExpansions("olkongsheng").length;
					const check = player => {
						if (!player.isIn() || player.isHealthy()) {
							return false;
						}
						return player.countCards("h") == num;
					};
					if (check(player) || check(target)) {
						const choiceList = ["令自己回复1点体力", "令" + get.translation(target) + "回复1点体力"];
						const choices = [];
						if (check(player)) {
							choices.push("选项一");
						} else {
							choiceList[0] = '<span style="opacity:0.5">' + choiceList[0] + "</span>";
						}
						if (check(target)) {
							choices.push("选项二");
						} else {
							choiceList[1] = '<span style="opacity:0.5">' + choiceList[1] + "</span>";
						}
						choices.push("cancel2");
						const { control } = await player
							.chooseControl(choices)
							.set("choiceList", choiceList)
							.set("prompt", "良姻：是否令一名角色回复体力？")
							.set("ai", function () {
								const player = _status.event.player,
									target = _status.event.getParent().targets[0];
								let list = _status.event.controls.slice(0),
									eff1 = 0,
									eff2 = 0;
								if (list.includes("选项一")) {
									eff1 = get.recoverEffect(player, player, player);
								}
								if (list.includes("选项二")) {
									eff2 = get.recoverEffect(target, player, player);
								}
								if (eff1 > Math.max(0, eff2)) {
									return "选项一";
								}
								if (eff2 > 0) {
									return "选项二";
								}
								return "cancel2";
							})
							.forResult();
						if (control == "选项一") {
							await player.recover();
						} else if (control == "选项二") {
							await target.recover();
						}
					}
				},
			},
		},
	},
	olkongsheng: {
		audio: "kongsheng",
		trigger: { player: "phaseZhunbeiBegin" },
		filter(event, player) {
			return player.countCards("he") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard("he", [1, player.countCards("he")], get.prompt(event.skill), "将任意张牌作为“箜”置于武将牌上", "allowChooseAll")
				.set("ai", function (card) {
					const player = _status.event.player,
						num = player.getExpansions("olkongsheng") + ui.selected.cards.length;
					if (
						ui.selected.cards.length > 0 &&
						game.hasPlayer(function (current) {
							if (current.isHealthy() || get.recoverEffect(current, player, player) <= 0) {
								return false;
							}
							const num2 =
								current.countCards("h", function (card) {
									if (current != player) {
										return true;
									}
									return !ui.selected.cards.includes(card);
								}) + 1;
							return num == num2;
						})
					) {
						return 0;
					}
					if (get.type(card, null, false) == "equip") {
						for (const i of ui.selected.cards) {
							if (get.type(i, null, false) == "equip") {
								return 0;
							}
						}
						return 5 - get.value(card);
					}
					if (!player.hasValueTarget(card)) {
						return 1;
					}
					return 0;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const next = player.addToExpansion(event.cards, player, "give");
			next.gaintag.add("olkongsheng");
			await next;
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
		group: "olkongsheng_kessoku",
		subSkill: {
			kessoku: {
				audio: "kongsheng",
				trigger: { player: "phaseJieshuBegin" },
				forced: true,
				locked: false,
				filter(event, player) {
					return (
						player.getExpansions("olkongsheng").filter(function (card) {
							return get.type(card, null, false) != "equip";
						}).length > 0
					);
				},
				async content(event, trigger, player) {
					let cards = player.getExpansions("olkongsheng").filter(function (card) {
						return get.type(card, null, false) != "equip";
					});
					if (cards.length) {
						await player.gain(cards, "gain2");
					}
					cards = player.getExpansions("olkongsheng");
					if (cards.length <= 0) {
						return;
					}
					const result = await player
						.chooseTarget(true, "令一名角色使用以下装备牌", get.translation(cards))
						.set("ai", function (target) {
							const player = _status.event.player;
							return get.effect(target, { name: "losehp" }, player, player);
						})
						.forResult();
					const target = result.targets[0];
					player.line(target, "green");
					while (true) {
						const cards = player.getExpansions("olkongsheng").filter(function (i) {
							return target.hasUseTarget(i);
						});
						if (cards.length) {
							let card = cards[0];
							if (cards.length > 1) {
								const result = await target
									.chooseButton(true, ["选择要使用的装备牌", cards])
									.set("ai", function (button) {
										return get.order(button.link);
									})
									.forResult();
								if (!result.bool) {
									break;
								}
								card = result.links[0];
							}
							await target.chooseUseTarget(card, true);
						} else {
							break;
						}
					}
					await target.loseHp();
				},
			},
		},
	},
	//新毌丘俭
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
				.chooseTarget(
					get.prompt(event.skill),
					"将一名手牌数不小于你的目标角色的一张牌置于你的武将牌上，成为「荣」",
					function (card, player, target) {
						return (
							_status.event.targets.includes(target) && target.countCards("h") >= player.countCards("h") && target.countCards("he") > 0
						);
					}
				)
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
	//阴雷
	drlt_zhenrong: {
		marktext: "荣",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		audio: 2,
		trigger: { source: "damageSource" },
		filter(event, player) {
			return event.player != player && event.player.countCards("h") > player.countCards("h");
		},
		async cost(event, trigger, player) {
			const result = await player
				.choosePlayerCard("hej", get.prompt(event.skill), trigger.player)
				.set("ai", function (button) {
					const { player, target } = get.event();
					return -get.attitude(player, target) + 1;
				})
				.forResult();
			if (result?.bool && result.links?.length) {
				event.result = result;
				event.result.cards = result.links;
			}
		},
		async content(event, trigger, player) {
			const next = player.addToExpansion(event.cards, trigger.player, "give", "log");
			next.gaintag.add("drlt_zhenrong");
			await next;
		},
	},
	drlt_hongju: {
		skillAnimation: true,
		animationColor: "thunder",
		audio: 2,
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		unique: true,
		juexingji: true,
		derivation: ["drlt_qingce"],
		filter(event, player) {
			return player.getExpansions("drlt_zhenrong").length >= 3 && game.dead.length > 0;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			const cards = player.getExpansions("drlt_zhenrong");
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
						cards2 = cards.splice(0, player.getExpansions("drlt_zhenrong").length);
					return [cards2, cards];
				});
				const result = await next.forResult();
				if (result.bool) {
					const pushs = result.moved[0],
						gains = result.moved[1];
					pushs.removeArray(player.getExpansions("drlt_zhenrong"));
					gains.removeArray(player.getCards("h"));
					if (pushs.length && pushs.length == gains.length) {
						const next = player.addToExpansion(pushs);
						next.gaintag.add("drlt_zhenrong");
						await next;
						await player.gain(gains, "gain2", "log");
					}
				}
			}
			await player.addSkills("drlt_qingce");
			await player.loseMaxHp();
		},
		ai: {
			combo: "drlt_zhenrong",
		},
	},
	drlt_qingce: {
		audio: 2,
		enable: "phaseUse",
		filter(event, player) {
			return player.getExpansions("drlt_zhenrong").length > 0;
		},
		filterTarget(card, player, target) {
			return target.countDiscardableCards(player, "ej") > 0;
		},
		async content(event, trigger, player) {
			const next = player.chooseCardButton(player.getExpansions("drlt_zhenrong"), 1, "请选择需要弃置的“荣”", true);
			next.ai = button => 6 - get.value(button.link);
			const result = await next.forResult();
			if (result.bool) {
				const cards = result.links;
				await player.loseToDiscardpile(cards);
				await player.discardPlayerCard(event.target, "ej", 1, true);
			}
		},
		ai: {
			combo: "drlt_zhenrong",
			order: 13,
			result: {
				target(player, target) {
					if (get.attitude(player, target) > 0 && target.countCards("j") > 0) {
						return 1;
					}
					return -1;
				},
			},
		},
	},
	drlt_zhengu: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					//if(target.storage.drlt_zhengu_mark&&target.storage.drlt_zhengu_mark.includes(player)) return false;
					return target != player;
				})
				.set("ai", function (target) {
					const player = _status.event.player;
					//if(target.storage.drlt_zhengu_mark&&target.storage.drlt_zhengu_mark.includes(player)) return 0;
					const num = Math.min(5, player.countCards("h")) - target.countCards("h");
					const att = get.attitude(player, target);
					return num * att;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			player.addSkill("drlt_zhengu2");
			target.addSkill("drlt_zhengu_mark");
			target.storage.drlt_zhengu_mark.push(player);
			target.markSkill("drlt_zhengu_mark");
			lib.skill.drlt_zhengu.sync(player, target);
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
	drlt_zhengu2: {
		audio: "drlt_zhengu",
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		charlotte: true,
		logTarget: "player",
		sourceSkill: "drlt_zhengu",
		filter(event, player) {
			return event.player.storage.drlt_zhengu_mark && event.player.storage.drlt_zhengu_mark.includes(player);
		},
		async content(event, trigger, player) {
			while (trigger.player.storage.drlt_zhengu_mark.includes(player)) {
				trigger.player.storage.drlt_zhengu_mark.remove(player);
			}
			if (trigger.player.storage.drlt_zhengu_mark.length == 0) {
				trigger.player.unmarkSkill("drlt_zhengu_mark");
			}
			lib.skill.drlt_zhengu.sync(player, trigger.player);
		},
	},
	drlt_zhengu_mark: {
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
	xinfu_zuilun: {
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
			return get.prompt("xinfu_zuilun") + "（可获得" + get.cnNumber(num) + "张牌）";
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
	xinfu_fuyin: {
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
	drlt_qianjie: {
		audio: 2,
		group: ["drlt_qianjie_1", "drlt_qianjie_2", "drlt_qianjie_3"],
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
				audio: "drlt_qianjie",
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
	drlt_jueyan: {
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
					if (list.includes("equip5") && !player.hasSkill("drlt_jueyan_effect")) {
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
			const bool = !player.hasSkill("drlt_jueyan_effect");
			switch (control) {
				case "equip1":
					player.addTempSkill("drlt_jueyan1");
					if (bool) {
						player.addSkill("drlt_jueyan_sha");
					}
					break;
				case "equip2":
					await player.draw(3);
					player[bool ? "addSkill" : "addTempSkill"]("drlt_jueyan3");
					break;
				case "equip3_4":
					player[bool ? "addSkill" : "addTempSkill"]("drlt_jueyan2");
					break;
				case "equip5":
					await player[bool ? "addSkills" : "addTempSkills"]("rejizhi");
					break;
			}
			if (bool) {
				player.addSkill("drlt_jueyan_effect");
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
		derivation: ["drlt_jueyan_rewrite", "rejizhi"],
	},
	rejizhi_lukang: { audio: 1 },
	drlt_jueyan1: {
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
	drlt_jueyan2: {
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
	drlt_jueyan3: {
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
	drlt_poshi: {
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
			await player.changeSkills(["drlt_huairou"], ["drlt_jueyan"]);
		},
	},
	drlt_huairou: {
		audio: 2,
		enable: "phaseUse",
		position: "he",
		filter: (event, player) => player.hasCard(card => lib.skill.drlt_huairou.filterCard(card, player), lib.skill.drlt_huairou.position),
		filterCard: (card, player) => get.type(card) == "equip" && player.canRecast(card),
		check(card) {
			if (get.position(card) == "e") {
				return 0.5 - get.value(card, get.player());
			}
			if (!get.player().canEquip(card)) {
				return 5;
			}
			return 3 - get.value(card);
		},
		async content(event, trigger, player) {
			await player.recast(event.cards);
		},
		discard: false,
		lose: false,
		delay: false,
		prompt: "重铸一张装备牌",
		ai: {
			order: 10,
			result: {
				player: 1,
			},
		},
	},
	drlt_yongsi: {
		audio: 2,
		group: ["drlt_yongsi_1", "drlt_yongsi_2"],
		locked: true,
		subSkill: {
			1: {
				audio: "drlt_yongsi",
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
				audio: "drlt_yongsi",
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
						player.addTempSkill("drlt_yongsi1", { player: "phaseDiscardAfter" });
					}
				},
			},
		},
	},
	drlt_yongsi1: {
		mod: {
			maxHandcard(player, num) {
				return num + player.maxHp - 2 * Math.max(0, player.hp);
			},
		},
	},
	drlt_weidi: {
		audio: 2,
		forceaudio: true,
		zhuSkill: true,
		trigger: { player: "phaseDiscardBegin" },
		filter(event, player) {
			if (!player.hasZhuSkill("drlt_weidi")) {
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
					prompt2:
						"你可以将" +
						(num > 1 ? "至多" : "") +
						get.cnNumber(num) +
						"张手牌交给等量的其他群势力角色。先按顺序选中所有要给出的手牌，然后再按顺序选择等量的目标角色",
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
								return (
									target != player &&
									target.group == "qun" &&
									!ui.selected.targets.includes(target) &&
									get.sgn(value) == get.sgn(get.attitude(player, target))
								);
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
	drlt_xiongluan: {
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
						if (player.getStorage("drlt_xiongluan_effect").includes(target)) {
							return true;
						}
					},
					cardUsableTarget(card, player, target) {
						if (player.getStorage("drlt_xiongluan_effect").includes(target)) {
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
							if (!target._drlt_xiongluan2_effect && get.tag(card, "damage")) {
								target._drlt_xiongluan2_effect = true;
								const eff = get.effect(target, card, player, target);
								delete target._drlt_xiongluan2_effect;
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
	drlt_congjian: {
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
						if (player.storage.drlt_xiongluan && get.type(card) == "equip") {
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
	drlt_wanglie: {
		locked: false,
		mod: {
			targetInRange(card, player, target, now) {
				if (game.online) {
					if (!player.countUsed()) {
						return true;
					}
				} else {
					const evt = _status.event.getParent("phaseUse");
					if (
						evt &&
						evt.name == "phaseUse" &&
						player.getHistory("useCard", function (evt2) {
							return evt2.getParent("phaseUse") == evt;
						}).length == 0
					) {
						return true;
					}
				}
			},
		},
		audio: 2,
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			return player.isPhaseUsing() && (event.card.name == "sha" || get.type(event.card) == "trick");
		},
		preHidden: true,
		check(event, player) {
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
			return "令" + get.translation(event.card) + "不能被响应，然后本阶段不能再使用牌";
		},
		async content(event, trigger, player) {
			trigger.nowuxie = true;
			trigger.directHit.addArray(game.players);
			player.addTempSkill("drlt_wanglie2", "phaseUseAfter");
		},
		ai: {
			pretao: true,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (tag == "pretao") {
					return true;
				}
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
	drlt_wanglie2: {
		mod: {
			cardEnabled(card, player) {
				return false;
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
	kongsheng_ai: { ai: { reverseOrder: true } },
	kongsheng2: {
		audio: "kongsheng",
		marktext: "箜",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		trigger: {
			player: "phaseJieshuBegin",
		},
		sourceSkill: "kongsheng",
		filter(event, player) {
			return player.getExpansions("kongsheng2").length > 0;
		},
		forced: true,
		charlotte: true,
		async content(event, trigger, player) {
			player.addTempSkill("kongsheng_ai", "kongsheng2After");
			while (true) {
				const cards = player.getExpansions("kongsheng2").filter(function (i) {
					return get.type(i, null, false) == "equip" && player.hasUseTarget(i);
				});
				if (cards.length > 0) {
					let [card] = cards;
					if (cards.length > 1) {
						const result = await player
							.chooseButton(true, ["选择要使用的装备牌", cards])
							.set("ai", function (button) {
								return get.order(button.link);
							})
							.forResult();
						if (!result.bool) {
							continue;
						}
						[card] = result.links;
					}
					await player.chooseUseTarget(card, true);
				} else {
					break;
				}
			}
			const cards2 = player.getExpansions("kongsheng2");
			if (cards2.length) {
				await player.gain(cards2, "gain2");
			}
		},
	},
	nzry_juzhan: {
		audio: ["nzry_juzhan_11.mp3", "nzry_juzhan_12.mp3"],
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
			if (!player.storage.nzry_juzhan) {
				return player != event.player;
			}
			return player == event.player && event.target.countGainableCards(player, "he");
		},
		logTarget(event, player) {
			return player.storage.nzry_juzhan ? event.target : event.player;
		},
		check(event, player) {
			const target = get.info("nzry_juzhan").logTarget(event, player);
			return get.attitude(player, target) < 0;
		},
		prompt2(event, player) {
			const target = get.info("nzry_juzhan").logTarget(event, player);
			return player.storage.nzry_juzhan
				? `获得${get.translation(target)}一张牌，然后你本回合内不能再对其使用牌`
				: `与${get.translation(target)}各摸一张牌，然后其本回合内不能再对你使用牌`;
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
						if (player.getStorage("nzry_juzhan_effect").includes(target)) {
							return false;
						}
					},
				},
				intro: { content: "本回合不能对$使用牌" },
			},
		},
	},
	nzry_feijun: {
		init: player => {
			if (!Array.isArray(player.storage.nzry_feijun)) {
				player.storage.nzry_feijun = [];
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
			const list2 = player.getStorage("nzry_feijun");
			if (!list2.includes(target)) {
				event._nzry_binglve = true;
				player.markAuto("nzry_feijun", [target]);
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
							return (
								(current.countCards("h") > player.countCards("h") || current.countCards("e") > player.countCards("e")) &&
								get.attitude(player, current) < 0 &&
								player.getStorage("nzry_feijun").includes(current)
							);
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
	nzry_binglve: {
		audio: 2,
		trigger: { player: "nzry_feijunAfter" },
		forced: true,
		filter(event, player) {
			return event._nzry_binglve == true;
		},
		async content(event, trigger, player) {
			await player.draw(2);
		},
		ai: { combo: "nzry_feijun" },
	},
	nzry_huaiju_ai: {
		charlotte: true,
		ai: {
			filterDamage: true,
			skillTagFilter(player, tag, arg) {
				if (!player.hasMark("nzry_huaiju")) {
					return false;
				}
				if (
					!game.hasPlayer(function (current) {
						return current.hasSkill("tachibana_effect");
					})
				) {
					return false;
				}
				if (arg && arg.player) {
					if (arg.player.hasSkillTag("jueqing", false, player)) {
						return false;
					}
				}
			},
		},
	},
	nzry_huaiju: {
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
			player.addMark("nzry_huaiju", 3);
			player.addSkill("nzry_huaiju_ai");
		},
		group: ["tachibana_effect"],
	},
	//没错 这是个橘
	tachibana_effect: {
		audio: "nzry_huaiju",
		sourceSkill: "nzry_huaiju",
		trigger: {
			global: ["damageBegin4", "phaseDrawBegin2"],
		},
		forced: true,
		filter(event, player) {
			return event.player.hasMark("nzry_huaiju") && (event.name == "damage" || !event.numFixed);
		},
		async content(event, trigger, player) {
			player.line(trigger.player, "green");
			if (trigger.name == "damage") {
				trigger.cancel();
				trigger.player.removeMark("nzry_huaiju", 1);
			} else {
				trigger.num++;
			}
		},
	},
	nzry_yili: {
		audio: 2,
		trigger: { player: "phaseUseBegin" },
		async cost(event, trigger, player) {
			const next = player.chooseTarget(
				get.prompt(event.skill),
				"移去一个【橘】或失去1点体力，然后令一名其他角色获得一个【橘】",
				function (card, player, target) {
					return target != player;
				}
			);
			next.ai = function (target) {
				const player = _status.event.player;
				if (player.storage.nzry_huaiju > 2 || player.hp > 2) {
					return get.attitude(player, target);
				}
				return -1;
			};
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			let index = 0;
			if (player.hasMark("nzry_huaiju")) {
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
				player.removeMark("nzry_huaiju", 1);
			} else {
				await player.loseHp();
			}
			target.addMark("nzry_huaiju", 1);
			target.addSkill("nzry_huaiju_ai");
		},
		ai: {
			combo: "nzry_huaiju",
		},
	},
	nzry_zhenglun: {
		audio: 2,
		trigger: {
			player: "phaseDrawBefore",
		},
		filter(event, player) {
			return !player.hasMark("nzry_huaiju");
		},
		check(event, player) {
			return player.countCards("h") >= 2 || player.skipList.includes("phaseUse");
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.addMark("nzry_huaiju", 1);
		},
		ai: {
			combo: "nzry_huaiju",
		},
	},
	nzry_kuizhu: {
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
	rechezheng: {
		audio: "nzry_zhizheng",
		trigger: { source: "damageBegin2" },
		filter(event, player) {
			return player.isPhaseUsing() && !player.inRangeOf(event.player);
		},
		forced: true,
		logTarget: "player",
		async content(event, trigger, player) {
			trigger.cancel();
		},
		ai: {
			effect: {
				player(card, player, target) {
					if (target && get.tag(card, "damage") && !player.inRangeOf(target)) {
						return "zeroplayertarget";
					}
				},
			},
		},
	},
	nzry_zhizheng: {
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
			const next = player.chooseTarget(
				"请选择〖掣政〗的目标",
				"弃置一名攻击范围内不包含你的角色的一张牌",
				true,
				function (card, player, target) {
					return target != player && !target.inRange(player) && target.countDiscardableCards(player, "he");
				}
			);
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
	nzry_lijun: {
		global: "nzry_lijun1",
		audio: "nzry_lijun1",
		zhuSkill: true,
	},
	nzry_lijun2: {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + player.countMark("nzry_lijun2");
				}
			},
		},
		charlotte: true,
		onremove: true,
	},
	nzry_lijun1: {
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
			if (player.hasSkill("nzry_lijun2")) {
				return false;
			}
			if (!player.isPhaseUsing()) {
				return false;
			}
			if (
				!game.hasPlayer(function (target) {
					return player != target && target.hasZhuSkill("nzry_lijun", player);
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
				return player != target && target.hasZhuSkill("nzry_lijun", player);
			});
			const next = player.chooseTarget(
				get.prompt("nzry_lijun"),
				"将" + get.translation(trigger.cards) + "交给" + get.translation(list) + (list.length > 1 ? "中的一人" : ""),
				function (card, player, target) {
					return player != target && target.hasZhuSkill("nzry_lijun", player);
				}
			);
			next.ai = function (target) {
				return get.attitude(_status.event.player, target);
			};
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			player.addTempSkill("nzry_lijun2", "phaseUseEnd");
			const [zhu] = event.targets;
			player.line(zhu, "green");
			zhu.logSkill("nzry_lijun"); // 给牌的人去logSkill好像还是不太好喵？
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
			player.addMark("nzry_lijun2", 1, false);
		},
	},
	nzry_chenglve: {
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
			player.changeZhuanhuanji("nzry_chenglve");
			const num = player.storage.nzry_chenglve ? 1 : 2;
			await player.draw(num);
			if (!player.hasCard(card => lib.filter.cardDiscardable(card, player, "nzry_chenglve"), "h")) {
				return;
			}
			await game.delayx();
			const { bool, cards } = await player
				.chooseToDiscard(true, "h", 3 - num)
				.set("ai", card => {
					const player = get.player(),
						effect = player.getStorage("nzry_chenglve_effect");
					const cards = player
							.getCards("h")
							.filter(i => get.tag(i, "damage") && get.type(i) != "delay" && player.hasValueTarget(i, true, false)),
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
					if (
						player.storage.nzry_chenglve &&
						ui.selected.cards.length &&
						!ui.selected.cards.some(i => get.suit(i) == get.suit(card, player))
					) {
						return 2;
					}
					return 6 - get.value(card);
				})
				.forResult();
			if (bool) {
				const effect = "nzry_chenglve_effect";
				player.addTempSkill(effect);
				player.markAuto(effect, cards.map(card => get.suit(card, player)).unique());
				player.storage[effect].sort((a, b) => lib.suits.indexOf(b) - lib.suits.indexOf(a));
				player.addTip(effect, get.translation(effect) + player.getStorage(effect).reduce((str, suit) => str + get.translation(suit), ""));
			}
		},
		ai: {
			order(item, player) {
				if (
					player.countCards("h", card => get.tag(card, "damage") && get.type(card) != "delay" && player.hasValueTarget(card, true, false)) >
					2
				) {
					return get.order({ name: "sha" }) + 0.14;
				}
				return 2.7;
			},
			result: {
				player(player) {
					if (!player.storage.nzry_chenglve && player.countCards("h") < 3) {
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
						if (suit == "unsure" || player.getStorage("nzry_chenglve_effect").includes(suit)) {
							return Infinity;
						}
					},
					targetInRange(card, player) {
						const suit = get.suit(card);
						if (suit == "unsure" || player.getStorage("nzry_chenglve_effect").includes(suit)) {
							return true;
						}
					},
				},
				marktext: "略",
				intro: { content: `本回合使用$花色的牌无距离和次数限制` },
			},
		},
	},
	nzry_shicai: {
		audio: "nzry_shicai_2",
		locked: false,
		mod: {
			aiOrder(player, card, num) {
				if (num <= 0 || player.nzry_shicai_aiOrder || get.itemtype(card) !== "card" || player.hasSkillTag("abnormalDraw")) {
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
				player.nzry_shicai_aiOrder = true;
				let val = player.getUseValue(card, true, true);
				delete player.nzry_shicai_aiOrder;
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
	nzry_cunmu: {
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
	nzry_mingren: {
		audio: "nzry_mingren_1",
		drawNum: 2,
		audioname: ["sb_yl_luzhi"],
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: false,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && !player.getExpansions("nzry_mingren").length;
		},
		async content(event, trigger, player) {
			await player.draw(get.info(event.name).drawNum || 2);
			if (!player.countCards("h")) {
				return;
			}
			const result = await player
				.chooseCard("h", "将一张手牌置于武将牌上，称为“任”", true)
				.set("ai", function (card) {
					return 6 - get.value(card);
				})
				.forResult();
			if (result.bool) {
				const next = player.addToExpansion(result.cards[0], player, "give", "log");
				next.gaintag.add("nzry_mingren");
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
		group: ["nzry_mingren_1"],
		ai: { notemp: true },
		subSkill: {
			1: {
				audio: 2,
				audioname: ["sb_yl_luzhi"],
				trigger: { player: "phaseJieshuBegin" },
				filter(event, player) {
					return player.countCards("h") > 0 && player.getExpansions("nzry_mingren").length > 0;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseCard(
							"h",
							get.prompt(event.skill),
							"选择一张手牌替换“任”（" + get.translation(player.getExpansions("nzry_mingren")[0]) + "）"
						)
						.set("ai", function (card) {
							const player = _status.event.player;
							const color = get.color(card);
							if (color == get.color(player.getExpansions("nzry_mingren")[0])) {
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
					const card = player.getExpansions("nzry_mingren")[0];
					const next = player.addToExpansion(event.cards[0], "log", "give", player);
					next.gaintag.add("nzry_mingren");
					await next;
					if (card) {
						await player.gain(card, "gain2");
					}
				},
			},
		},
	},
	nzry_zhenliang: {
		audio: ["nzry_zhenliang_11.mp3", "nzry_zhenliang_12.mp3"],
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
			const cards = player.getExpansions("nzry_mingren");
			if (!cards.length) {
				return false;
			}
			if (event.name == "chooseToUse") {
				if (player.storage.nzry_zhenliang || player.hasSkill("nzry_zhenliang_used", null, null, false)) {
					return false;
				}
				const color = get.color(cards[0]);
				if (!player.countCards("he", card => get.color(card) == color)) {
					return false;
				}
				return game.hasPlayer(current => player.inRange(current));
			} else {
				if (_status.currentPhase == player || !player.storage.nzry_zhenliang) {
					return false;
				}
				return get.color(event.card) == get.color(cards[0]);
			}
		},
		position: "he",
		filterCard(card, player) {
			return get.color(card) == get.color(player.getExpansions("nzry_mingren")[0]);
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
				.chooseTarget(
					get.prompt(skillName),
					`令${(num > 1 ? "至多" : "") + get.cnNumber(num)}名角色${num > 1 ? "各" : ""}摸${get.cnNumber(num)}张牌`
				)
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
			combo: "nzry_mingren",
		},
		subSkill: { used: { charlotte: true } },
	},
	nzry_jianxiang: {
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
	nzry_shenshi: {
		audio: ["nzry_shenshi_11.mp3", "nzry_shenshi_12.mp3"],
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
				return (
					!player.storage.nzry_shenshi &&
					!player.hasSkill("nzry_shenshi_used", null, null, false) &&
					game.hasPlayer(current => get.info("nzry_shenshi").filterTarget(null, player, current))
				);
			}
			return event.source?.isIn() && event.source != player && event.player == player && player.storage.nzry_shenshi;
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
				.set(
					"choice",
					(source.countCards("h") <= source.getHp() && player.countCards("h") < 4 && !source.hasSkillTag("nogain")) ||
						get.attitude(player, source) > 0
				)
				.set(
					"prompt2",
					"其他角色对你造成伤害后，你可以观看该角色的手牌，然后交给其一张牌，当前角色回合结束时，若此牌仍在该角色的手牌区或装备区，你将手牌摸至四张"
				)
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
				const result = await player
					.chooseToGive(target, "he", true, `交给${get.translation(target)}一张牌`)
					.set("ai", card => {
						return 5 - get.value(card);
					})
					.forResult();
				if (result.bool) {
					const card = result.cards[0];
					target.addGaintag(result.cards, event.name);
					player
						.when({ global: "phaseJieshuBegin" })
						.filter(
							evt =>
								evt.getParent() == trigger.getParent("phase", true) &&
								target.getCards("he").includes(card) &&
								player.countCards("h") < 4
						)
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
	xinjiewei: {
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
		group: "xinjiewei_move",
		subSkill: {
			move: {
				trigger: { player: "turnOverEnd" },
				audio: "jiewei",
				filter(event, player) {
					return !player.isTurnedOver() && player.canMoveCard();
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseToDiscard("he", get.prompt("xinjiewei"), "弃置一张牌并移动场上的一张牌", lib.filter.cardDiscardable)
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
	redimeng: {
		audio: "dimeng",
		enable: "phaseUse",
		usable: 1,
		position: "he",
		filterCard() {
			if (ui.selected.targets.length == 2) {
				return false;
			}
			return true;
		},
		selectCard: [0, Infinity],
		selectTarget: 2,
		complexCard: true,
		complexSelect: true,
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			if (ui.selected.targets.length == 0) {
				return true;
			}
			return Math.abs(ui.selected.targets[0].countCards("h") - target.countCards("h")) == ui.selected.cards.length;
		},
		multitarget: true,
		multiline: true,
		async content(event, trigger, player) {
			// 改到一半发现又没人用这个技能
			// 心态炸了喵_(:з」∠)_
			const [target, target1] = event.targets;
			const cards = target.getCards("h").concat(target1.getCards("h"));
			event.dialogRef = true;
			const videoId = lib.status.videoId++;
			game.broadcastAll(
				function (cards, id, player, targets) {
					const dialog = ui.create.dialog("缔盟", true);
					if (player.isUnderControl(true) || targets[0].isUnderControl(true) || targets[1].isUnderControl(true)) {
						dialog.add(cards);
						dialog.seeing = true;
					} else {
						dialog.add([cards, "blank"]);
					}
					_status.dieClose.push(dialog);
					dialog.videoId = id;
					if (_status.event.dialogRef) {
						_status.event.dialog = dialog;
					}
				},
				cards,
				videoId,
				player,
				event.targets
			);
			game.addVideo("cardDialog", null, ["缔盟", get.cardsInfo(cards), videoId]);
			delete event.dialogRef;
			const dialog = event.dialog;
			let current = target;
			let num1 = 0;
			let num2 = 0;
			await game.delay();
			while (dialog.buttons.length) {
				let card;
				if (dialog.buttons.length > 1) {
					const next = current.chooseButton(true, function (button) {
						return get.value(button.link, _status.event.player);
					});
					next.set("dialog", get.idDialog(videoId));
					next.set("closeDialog", false);
					next.set("dialogdisplay", true);
					const result = await next.forResult();
					if (!result.bool) {
						return;
					}
					card = result.links[0];
				} else {
					card = dialog.buttons[0].link;
				}
				const button = dialog.buttons.find(button => button.link == card);
				if (button) {
					if (dialog.seeing) {
						button.querySelector(".info").innerHTML = get.translation(current.name);
						if (!_status.connectMode) {
							game.log(current, "选择了", button.link);
						}
					}
					dialog.buttons.remove(button);
				}
				if (card) {
					await current.gain(card);
					if (dialog.seeing) {
						current.$draw(card, "nobroadcast");
					} else {
						current.$draw(1, "nobroadcast");
					}
					game.broadcast(
						function (card, id, current) {
							const dialog = get.idDialog(id);
							if (dialog && dialog.seeing) {
								const button = dialog.buttons.find(button => button.link == card);
								if (button) {
									button.querySelector(".info").innerHTML = get.translation(current.name);
									dialog.buttons.remove(button);
								}
								current.$draw(card, "nobroadcast");
							} else {
								current.$draw(1, "nobroadcast");
							}
						},
						card,
						videoId,
						current
					);
				}
				if (current == target) {
					num1++;
					current = target1;
				} else {
					num2++;
					current = target;
				}
				await game.delay(2);
			}
			if (!_status.connectMode) {
				game.log(event.targets[0], "获得了" + get.cnNumber(num1) + "张牌");
				game.log(event.targets[1], "获得了" + get.cnNumber(num2) + "张牌");
			}
			dialog.close();
			_status.dieClose.remove(dialog);
			game.broadcast(function (id) {
				const dialog = get.idDialog(id);
				if (dialog) {
					dialog.close();
					_status.dieClose.remove(dialog);
				}
			}, videoId);
			game.addVideo("cardDialog", null, videoId);
		},
		targetprompt: ["先拿牌", "后拿牌"],
		find(type) {
			const player = _status.event.player;
			let list = game.filterPlayer(current => current != player && get.attitude(player, current) > 3);
			const num = player.countCards("he", card => get.value(card) < 7);
			let count = null,
				from,
				nh;
			if (list.length == 0) {
				return null;
			}
			list.sort((a, b) => a.countCards("h") - b.countCards("h"));
			if (type == 1) {
				return list[0];
			}
			from = list[0];
			nh = from.countCards("h");
			list = game.filterPlayer(current => current != player && get.attitude(player, current) < 1);
			if (!list.length) {
				return null;
			}
			list.sort((a, b) => b.countCards("h") - a.countCards("h"));
			for (let i = 0; i < list.length; i++) {
				const nh2 = list[i].countCards("h");
				if (nh2 - nh <= num) {
					count = nh2 - nh;
					break;
				}
			}
			if (count == null || count < 0) {
				return null;
			}
			if (type == 3) {
				return count;
			}
			return list[i];
		},
		check(card) {
			const count = lib.skill.redimeng.find(3);
			if (count == null) {
				return -1;
			}
			if (ui.selected.cards.length < count) {
				return 7 - get.value(card);
			}
			return -1;
		},
		ai: {
			order: 8,
			threaten: 1.6,
			expose: 0.5,
			result: {
				player(player, target) {
					if (ui.selected.targets.length == 0) {
						if (target == lib.skill.redimeng.find(1)) {
							return 1;
						}
						return 0;
					} else {
						if (target == lib.skill.redimeng.find(2)) {
							return 1;
						}
						return 0;
					}
				},
			},
		},
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
							return (
								current.hp <= mindist - 1 &&
								get.distance(player, current, "attack") <= mindist &&
								player.canUse(card, current, false) &&
								get.effect(current, card, player, player) > 0
							);
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
	// ---------- 本次分界线喵 ----------
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
	jiewei: {
		trigger: { player: "turnOverEnd" },
		//direct:true,
		frequent: true,
		audio: "xinjiewei",
		async content(event, trigger, player) {
			await player.draw();
			const result = await player
				.chooseToUse(function (card) {
					if (!lib.filter.cardEnabled(card, _status.event.player, _status.event)) {
						return false;
					}
					const type = get.type(card, "trick");
					return type == "trick" || type == "equip";
				}, "是否使用一张锦囊牌或装备牌？")
				.forResult();
			if (!result.bool) {
				return;
			}
			const type = get.type(result.card || result.cards[0]);
			if (
				!game.hasPlayer(function (current) {
					if (type == "equip") {
						return current.countCards("e");
					} else {
						return current.countCards("j");
					}
				})
			) {
				return;
			}
			const next = player.chooseTarget("是否弃置场上的一张" + get.translation(type) + "牌？", function (card, player, target) {
				if (_status.event.type == "equip") {
					return target.countCards("e") > 0;
				} else {
					return target.countCards("j") > 0;
				}
			});
			next.set("ai", function (target) {
				if (type == "equip") {
					return -get.attitude(player, target);
				} else {
					return get.attitude(player, target);
				}
			});
			next.set("type", type);
			event.type = type;
			const result2 = await next.forResult();
			if (type && result2.bool && result2.targets && result2.targets.length) {
				player.line(result2.targets, "green");
				if (type == "equip") {
					player.discardPlayerCard(result2.targets[0], "e", true);
				} else {
					player.discardPlayerCard(result2.targets[0], "j", true);
				}
			}
		},
		ai: {
			combo: "moon_jushou",
		},
	},
	fenji: {
		audio: 2,
		trigger: { global: ["gainAfter", "loseAfter", "loseAsyncAfter"] },
		filter(event, player) {
			if (event.name == "lose") {
				if (event.type != "discard" || !event.player.isIn()) {
					return false;
				}
				if ((event.discarder || event.getParent(2).player) == event.player) {
					return false;
				}
				if (!event.getl(event.player).hs.length) {
					return false;
				}
				return true;
			} else if (event.name == "gain") {
				if (event.giver || event.getParent().name == "gift") {
					return false;
				}
				const cards = event.getg(event.player);
				if (!cards.length) {
					return false;
				}
				return game.hasPlayer(current => {
					if (current == event.player) {
						return false;
					}
					const hs = event.getl(current).hs;
					for (const i of hs) {
						if (cards.includes(i)) {
							return true;
						}
					}
					return false;
				});
			} else if (event.type == "gain") {
				if (event.giver || !event.player || !event.player.isIn()) {
					return false;
				}
				const hs = event.getl(event.player);
				return game.hasPlayer(current => {
					if (current == event.player) {
						return false;
					}
					const cards = event.getg(current);
					for (const i of cards) {
						if (hs.includes(i)) {
							return true;
						}
					}
				});
			} else if (event.type == "discard") {
				if (!event.discarder) {
					return false;
				}
				return game.hasPlayer(current => {
					return current != event.discarder && event.getl(current).hs.length > 0;
				});
			}
			return false;
		},
		getIndex(event) {
			const targets = [];
			if (event.name == "gain") {
				const cards = event.getg(event.player);
				targets.addArray(
					game.filterPlayer(current => {
						if (current == event.player) {
							return false;
						}
						const hs = event.getl(current).hs;
						for (const i of hs) {
							if (cards.includes(i)) {
								return true;
							}
						}
						return false;
					})
				);
			} else if (event.name == "loseAsync" && event.type == "discard") {
				targets.addArray(
					game.filterPlayer(current => {
						return current != event.discarder && event.getl(current).hs.length > 0;
					})
				);
			} else {
				targets.push(event.player);
			}
			return targets;
		},
		logTarget: (event, player, triggername, target) => target,
		check(event, player, triggername, target) {
			if (get.attitude(player, target) <= 0) {
				return false;
			}
			return 2 * get.effect(target, { name: "draw" }, player, player) + get.effect(player, { name: "losehp" }, player, player) > 0;
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			await player.loseHp();
			await target.draw(2);
		},
	},
	new_fenji: {
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
			return (
				2 * get.effect(event.player, { name: "draw" }, player, get.event().player) +
					get.effect(player, { name: "losehp" }, player, get.event().player) >
				0
			);
		},
		logTarget: "player",
		async content(event, trigger, player) {
			player.line(trigger.player, "green");
			await trigger.player.draw(2);
			await player.loseHp();
		},
	},
};

export default skills;
