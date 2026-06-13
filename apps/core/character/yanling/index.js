import { game } from "wtk"
import characters from "./character.js"
import characterTitles from "./characterTitle.js"
import skills from "./skill.js"
import { characterSort, characterSortTranslate } from "./sort.js"
import translates from "./translate.js"

game.import("character", () => ({
  name: "yanling",
  connect: true,
  character: { ...characters },
  characterSort: {
    yanling: characterSort,
  },
  characterTitle: { ...characterTitles },
  skill: { ...skills },
  translate: { ...translates, ...characterSortTranslate },
}))
