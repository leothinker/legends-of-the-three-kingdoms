import { game } from "noname"
import cards from "./card.js"
import characters from "./character.js"
import characterTitles from "./characterTitle.js"
import characterIntros from "./intro.js"
import skills from "./skill.js"
import { characterSort, characterSortTranslate } from "./sort.js"
import translates from "./translate.js"
import voices from "./voices.js"

game.import("character", () => ({
  name: "jiangxing",
  connect: true,
  character: { ...characters },
  characterSort: {
    jiangxing: characterSort,
  },
  characterTitle: { ...characterTitles },
  characterIntro: { ...characterIntros },
  card: { ...cards },
  skill: { ...skills },
  translate: { ...translates, ...voices, ...characterSortTranslate },
}))
