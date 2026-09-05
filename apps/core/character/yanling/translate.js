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

  ylyg_xuhuang: "界徐晃",
  ylyg_xuhuang_prefix: "界",
  ylygduanliang: "断粮",
  ylygduanliang_info:
    "你可以将一张黑色非锦囊牌当无距离限制的【兵粮寸断】使用，然后若目标角色手牌数大于你，你摸一张牌。",
  ylygzier: "辎饵",
  ylygzier_info:
    "当一名角色跳过一个阶段后，你可以记录此阶段。每轮限一次，一名角色的回合开始时，你可以将其本回合的一个阶段改为你本轮记录的阶段。",

  ylyg_zhurong: "界祝融",
  ylyg_zhurong_prefix: "界",
  ylyglieren: "烈刃",
  ylyglieren_info:
    "当你每回合首次使用【杀】指定一名角色为唯一目标后，你可以与其拼点，赢的角色于此【杀】结算结束后将所有手牌当【南蛮入侵】使用。",
  ylygjuxiang: "巨象",
  ylygjuxiang_info:
    "锁定技，当【南蛮入侵】被使用时，若使用者不为你，则此牌对你无效且你于此牌结算结束后获得之；否则你可以令此牌对体力值大于你的角色造成的伤害+1。",

  ylyg_caiwenji: "界蔡文姬",
  ylyg_caiwenji_prefix: "界",
  ylygduanchang: "断肠",
  ylygduanchang_info:
    "锁定技，当你死亡时，你令杀死你的角色失去所有武将技能或弃置所有牌。",
  ylygbeige: "悲歌",
  ylygbeige_info: `当一名角色受到【杀】造成的伤害后，你可以弃置一张牌，然后令其进行判定，若结果为：红桃，其回复X点体力（X为其本次受到的伤害值）；方块，其摸三张牌；梅花，伤害来源弃置两张牌；黑桃，伤害来源翻面。因此判定过四种花色后，你获得${get.poptip("quzhong")}。`,
  quzhong: "曲终",
  quzhong_info:
    "一名角色的结束阶段，你可以将你本回合弃置的一张牌当【杀】使用，因此发动的〖悲歌〗交换选项中的其与伤害来源。",

  ylyg_sunce: "界孙策",
  ylyg_sunce_prefix: "界",
  ylygjiang: "激昂",
  ylygjiang_info:
    "当一名角色使用【决斗】或红色【杀】指定目标后，你可以与其各摸一张牌。你点数为K的牌均视为【杀】。",
  ylyghunzi: "魂姿",
  ylyghunzi_info: `觉醒技，当你的体力值首次变为1后，你加1点体力上限，然后获得${get.poptip("reyingzi")}和${get.poptip("yinghun")}。`,
  ylygzhiba: "制霸",
  ylygzhiba_info:
    "主公技，吴势力角色的准备阶段，你可以令其与一名角色拼点，若其赢，其视为使用一张【决斗】。",
}

export default translates
