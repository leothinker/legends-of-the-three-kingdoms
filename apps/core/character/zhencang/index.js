import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import skills from "./skill.js";
import { characterSort, characterSortTranslate } from "./sort.js";

game.import("character", function () {
	return {
		name: "zhencang",
		connect: true,
		character: { ...characters },
		characterSort: {
			zhencang: characterSort,
		},
		skill: { ...skills },
		translate: { ...characterSortTranslate },
	};
});
