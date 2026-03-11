import { lib, game, ui, get, ai, _status } from "noname";
game.import("card", function () {
	return {
		name: "extra",
		connect: true,
		card: {
			muniu: {
				fullskin: true,
				type: "equip",
				subtype: "equip5",
				nomod: true,
				onEquip() {
					if (card && card.storages?.length) {
						player.directgains(card.storages, null, "muniu");
					}
					player.markSkill("muniu_skill");
				},
				forceDie: true,
				onLose() {
					if (card?.storage?.used) {
						card.storage.used = 0;
					}
					if (!player.getVCards("e", i => i.name == "muniu").length) {
						player.unmarkSkill("muniu_skill");
					} else {
						player.markSkill("muniu_skill");
					}
					if (!card || !card.storages || !card.storages.length) {
						return;
					}
					if ((!event.getParent(3) || event.getParent(3).name != "swapEquip") && (event.getParent().type != "equip" || event.getParent().swapEquip)) {
						player.lose(card.storages, ui.discardPile);
						player.$throw(card.storages, 1000);
						player.popup("muniu");
						game.log(card, "掉落了", card.storages);
						card.storages.length = 0;
					} else {
						player.lose(card.storages, ui.special);
					}
				},
				clearLose: true,
				equipDelay: false,
				loseDelay: false,
				skills: ["muniu_skill", "muniu_skill7"],
				ai: {
					equipValue(card) {
						if (card.storages) {
							return 7 + card.storages.length;
						}
						return 7;
					},
					basic: {
						equipValue: 7,
					},
				},
			},
		},
		skill: {},
		translate: {},
		list: [],
	};
});
