import { game } from "wtk"
import characters from "./character.js"
import characterTitles from "./characterTitle.js"
import characterIntros from "./intro.js"
import skills from "./skill.js"
import { characterSort, characterSortTranslate } from "./sort.js"
import translates from "./translate.js"
import voices from "./voices.js"

game.import("character", () => ({
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
}))
