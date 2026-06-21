import { get } from "wtk"

const translates = {
  ol_sb_jiangwei: "谋姜维",
  ol_sb_jiangwei_prefix: "谋",
  olsbzhuri: "逐日",
  olsbzhuri_info:
    "你的阶段结束时，若你本阶段手牌数变化过，你可以拼点，若你：赢，你可以使用一张拼点牌；没赢，你失去1点体力或失去此技能直到回合结束。",
  olsbranji: "燃己",
  olsbranji_info: `限定技，结束阶段，若你本回合使用过牌的阶段数：不小于体力值，你可以获得${get.poptip("kunfenx")}；不大于体力值，你可以获得${get.poptip("zhaxiang")}。若如此做，你将手牌数或体力值调整至上限，然后你不能回复体力直到杀死角色。`,
  kunfenx: "困奋",
  kunfenx_info: "结束阶段，你可以失去1点体力，然后摸两张牌。",
}

export default translates
