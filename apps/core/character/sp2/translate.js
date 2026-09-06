import { get } from "wtk"

const translates = {
  zhangzhi: "张芝",
  olbixin: "笔心",
  olbixin_info:
    "一名角色的准备阶段和结束阶段，你可以声明一种类别并摸3张牌（每种类别限1次），将所有此类别手牌当你本轮未使用过的基本牌使用。",
  olximo: "洗墨",
  olximo_info: `锁定技，当你发动${get.poptip("olbixin")}后，删除其描述的前五个字符，若为第三次发动，交换其描述中的两个数字，你失去此技能并获得${get.poptip("olfeibai")}。`,
  olfeibai: "飞白",
  olfeibai_info:
    "转换技，锁定技，阳：当你的非黑色牌造成伤害时，此伤害值+1；阴：当你的非红色牌回复体力时，此回复值+1。",
}

export default translates
