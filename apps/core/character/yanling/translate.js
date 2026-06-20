import { get } from "wtk"

const translates = {
  ylyg_xiaoqiao: "界小乔",
  ylyg_xiaoqiao_prefix: "界",
  ylygtianxiang: "天香",
  ylygtianxiang_info:
    "当你受到伤害时，你可以弃置一张红桃牌防止之。当你正面朝上失去红桃牌时，你可以将之交给一名其他角色，其于本回合结束时失去1点体力（不叠加）。",
  ylyghongyan: "红颜",
  ylyghongyan_info:
    "锁定技，你的黑桃牌和你的黑桃判定牌视为红桃牌。游戏开始时，你选择获得其他男性角色的一个含颜色或花色的技能。",

  ylyg_yuji: "界于吉",
  ylyg_yuji_prefix: "界",
  ylygguhuo: "蛊惑",
  ylygguhuo_info: `每回合每种类别限一次，你可以扣置一张手牌，将此牌当任意一张基本牌或普通锦囊牌使用，手牌数大于你的角色依次选择是否质疑，然后翻开此牌，若为：假，此牌作废且选择不质疑的角色各交给你一张手牌；真，选择质疑的角色各失去1点体力并获得${get.poptip("huinu")}。`,
  huinu: "恚怒",
  huinu_info: `锁定技，你必须质疑${get.poptip("ylygguhuo")}。`,

  ylyg_dianwei: "界典韦",
  ylyg_dianwei_prefix: "界",
  ylygqiangxi: "强袭",
  ylygqiangxi_info:
    "出牌阶段，你可以与一名本回合未选择过的角色拼点：若你赢，你摸一张牌或弃置其一张牌；若你本回合第二次没赢，你失去1点体力，对这两次选择的角色与其之间一条最短路径上的其他角色各造成1点伤害，然后此技能本回合失效。",

  ylyg_pangtong: "界庞统",
  ylyg_pangtong_prefix: "界",
  xiangxing: "相形",
  xiangxing_info: `锁定技，其他角色视为拥有${get.poptip("xiangxing_yingzi")}和${get.poptip("xiangxing_biyue")}。`,
  xiangxing_yingzi: "英姿",
  xiangxing_yingzi_info:
    "锁定技，摸牌阶段，你多摸一张牌；你的手牌上限等于你的体力上限。",
  xiangxing_biyue: "闭月",
  xiangxing_biyue_info:
    "结束阶段，若你：有手牌，你可以摸一张牌；没有手牌，你可以摸两张牌。",
  ylyglianhuan: "连环",
  ylyglianhuan_info:
    "出牌阶段限X次（X为洗牌的次数+1），你可以将一张牌当【铁索连环】使用，此牌结算结束后，两名目标角色随机平均分配双方手牌（不能均分的手牌交给你）。",
  ylygniepan: "涅槃",
  ylygniepan_info:
    "限定技，当你处于濒死状态时，你可以摸三张牌并将体力回复至3点，然后对一名角色造成2点火焰伤害。洗牌时，重置此技能。",
}

export default translates
