import { get } from "wtk"

const translates = {
  ylyg_xiaoqiao: "界小乔",
  ylyg_xiaoqiao_prefix: "界",
  ylygtianxiang: "天香",
  ylygtianxiang_info:
    "当你受到伤害时，你可以弃置一张♥牌防止之；当你正面失去♥牌时，你可以将之交给一名其他角色，其于此回合结束时失去1点体力（不叠加）。",
  ylyghongyan: "红颜",
  ylyghongyan_info:
    "锁定技，你的♠牌视为♥；游戏开始时，你选择获得其他男性角色的一个含颜色或花色的技能。",

  ylyg_yuji: "界于吉",
  ylyg_yuji_prefix: "界",
  ylygguhuo: "蛊惑",
  ylygguhuo_info: `每回合每种类别限一次，你可以扣置一张手牌当任意基本牌或普通锦囊牌使用，手牌数大于你的角色依次选择是否质疑，然后翻开此牌：若为假，此牌作废、选择不质疑的角色各交给你一张手牌；若为真，质疑的角色依次失去1点体力并获得${get.poptip("huinu")}。`,
  huinu: "恚怒",
  huinu_info: `锁定技，你必须质疑${get.poptip("yl_guhuo")}。`,

  ylyg_dianwei: "界典韦",
  ylyg_dianwei_prefix: "界",
  ylygqiangxi: "强袭",
  ylygqiangxi_info:
    "出牌阶段，你可以与一名本回合未选择过的角色拼点：若你赢，你摸一张牌或弃置对方一张牌；本回合第二次没赢时，你失去1点体力对这两次拼点目标及其之间的所有其他角色各造成1点伤害，然后此技能本回合失效。",

  ylyg_pangtong: "界庞统",
  ylyg_pangtong_prefix: "界",
  xiangxing: "相形",
  xiangxing_info: `锁定技，其他角色视为拥有${get.poptip("xiangxing_yingzi")}${get.poptip("xiangxing_biyue")}。`,
  xiangxing_yingzi: "英姿",
  xiangxing_yingzi_info:
    "锁定技，摸牌阶段摸牌时，你额外摸一张牌；你的手牌上限为你的体力上限。",
  xiangxing_biyue: "闭月",
  xiangxing_biyue_info:
    "结束阶段，你可以摸一张牌，若你没有手牌，则改为摸两张牌。",
  ylyglianhuan: "连环",
  ylyglianhuan_info:
    "出牌阶段限X次，你可以将一张牌当【铁索连环】使用，结算后两名目标随机均分手牌（无法均分的手牌交给你，X为洗牌的次数+1）。",
  ylygniepan: "涅槃",
  ylygniepan_info:
    "限定技，当你处于濒死状态时，你可以摸三张牌、回复至3点体力，然后造成2点火焰伤害；洗牌时，此技能重置。",
}

export default translates
