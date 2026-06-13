import { game } from "wtk"
import cards from "./card.js"
import characters from "./character.js"
import characterFilters from "./characterFilter.js"
import characterTitles from "./characterTitle.js"
import dynamicTranslates from "./dynamicTranslate.js"
import characterIntros from "./intro.js"
import pinyins from "./pinyin.js"
import skills from "./skill.js"
import { characterSort, characterSortTranslate } from "./sort.js"
import translates from "./translate.js"
import voices from "./voices.js"

game.import("character", () => ({
  name: "jsrg",
  connect: true,
  character: { ...characters },
  characterSort: {
    jsrg: characterSort,
  },
  characterSubstitute: {
    jsrg_simazhao: [["jin_jsrg_simazhao", []]],
  },
  characterFilter: { ...characterFilters },
  characterTitle: { ...characterTitles },
  dynamicTranslate: { ...dynamicTranslates },
  characterIntro: { ...characterIntros },
  card: { ...cards },
  skill: { ...skills },
  translate: { ...translates, ...voices, ...characterSortTranslate },
  pinyins: { ...pinyins },
}))
