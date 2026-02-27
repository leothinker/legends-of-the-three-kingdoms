import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import translates from "./translate.js";
import refreshSkills from "../refresh/skill.js";
import refreshTranslates from "../refresh/translate.js";
import refreshVoices from "../refresh/voices.js";

game.import("character", function () {
	return {
		name: "zhencang",
		connect: true,
		character: { ...characters },
		characterSort: {
			zhencang: {
				zhencang_standard: Object.keys(characters),
			},
		},
		skill: { ...refreshSkills },
		translate: {
			...refreshTranslates,
			...refreshVoices,
			...translates,
			zhencang: "2020-2026珍藏版",
			zhencang_standard: "珍藏版·标",
		},
	};
});
