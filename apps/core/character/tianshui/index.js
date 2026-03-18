import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterTitles from "./characterTitle.js";
import characterIntros from "./intro.js";
import voices from "./voices.js";
import { characterSort, characterSortTranslate } from "./sort.js";

game.import("character", function () {
    return {
        name: "tianshui",
        connect: true,
        character: { ...characters },
        characterSort: {
            tianshui: characterSort,
        },
        characterTitle: { ...characterTitles },
        characterIntro: { ...characterIntros },
        skill: { ...skills },
        translate: { ...translates, ...voices, ...characterSortTranslate },
    };
});
