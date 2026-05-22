import { lib, game, ui, get, ai, _status } from "wtk"
import characters from "./character.js"
import skills from "./skill.js"
import translates from "./translate.js"
import characterTitles from "./characterTitle.js"
import { characterSort, characterSortTranslate } from "./sort.js"

game.import("character", function () {
  return {
    name: "yanling",
    connect: true,
    character: { ...characters },
    characterSort: {
      yanling: characterSort,
    },
    characterTitle: { ...characterTitles },
    skill: { ...skills },
    translate: { ...translates, ...characterSortTranslate },
  }
})
