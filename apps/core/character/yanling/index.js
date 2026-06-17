import { game } from "wtk"
import cards from "./card.js"
import characters from "./character.js"
import characterFilters from "./characterFilter.js"
import characterTitles from "./characterTitle.js"
import dynamicTranslates from "./dynamicTranslate.js"
import characterIntros from "./intro.js"
import perfectPairs from "./perfectPairs.js"
import pinyins from "./pinyin.js"
import skills from "./skill.js"
import { characterSort, characterSortTranslate } from "./sort.js"
import translates from "./translate.js"
import voices from "./voices.js"

game.import("character", () => ({
  name: "yanling",
  connect: true,
  character: { ...characters },
  characterSort: {
    yanling: characterSort,
  },
  characterFilter: { ...characterFilters },
  characterTitle: { ...characterTitles },
  dynamicTranslate: { ...dynamicTranslates },
  characterIntro: { ...characterIntros },
  card: { ...cards },
  skill: { ...skills },
  perfectPair: { ...perfectPairs },
  translate: { ...translates, ...voices, ...characterSortTranslate },
  pinyins: { ...pinyins },
}))
