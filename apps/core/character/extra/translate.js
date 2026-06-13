import { get } from "wtk"

const translates = {
  le_diaochan: "神貂蝉",
  le_diaochan_prefix: "神",
  meihun: "魅魂",
  meihun_info:
    "结束阶段或当你成为【杀】的目标后，你可以令一名其他角色交给你一张你声明的花色的牌，若其没有则你观看其手牌然后弃置其中一张。",
  huoxin_control: "惑心",
  huoxin: "惑心",
  huoxin_info:
    "出牌阶段限一次，你可以展示两张花色相同的手牌并分别交给两名其他角色，然后令这两名角色拼点，没赢的角色获得1枚“魅惑”标记。拥有2枚或更多“魅惑”的角色回合即将开始时，该角色移去其所有“魅惑”，此回合改为由你操控。",

  le_dianwei: "神典韦",
  le_dianwei_prefix: "神",
  juanjia: "捐甲",
  juanjia_info:
    "锁定技，游戏开始时，废除你的防具栏，然后你获得一个额外的武器栏。",
  qiexie: "挈挟",
  qiexie_info: `锁定技，准备阶段，你在剩余武将牌堆中随机观看五张武将牌，然后选择其中任意张当${get.poptip(
    {
      id: "qiexie_equip1",
      name: "武器牌",
      type: "character",
      info: "1.无花色点数且攻击范围为牌上的体力上限；<br>2.武器效果为牌上描述中含有“【杀】”的无类型标签或仅有锁定技标签的技能；<br>3.此牌离开你的装备区时你令其销毁。",
    },
  )}置于你的装备区中。`,
  cuijue: "摧决",
  cuijue_info:
    "每回合对每名角色限一次，出牌阶段，你可以弃置一张牌，然后对一名攻击范围内距离最远的其他角色造成1点伤害。",

  le_jiaxu: "神贾诩",
  le_jiaxu_prefix: "神",
  zclianpo: "炼魄",
  zclianpo_info:
    "锁定技，若场上最大阵营为反贼，其他角色的手牌上限-1，所有角色使用【杀】的次数和攻击范围+1，主忠，其他角色不能对其以外的角色使用【桃】，若有多个最大阵营，其他角色死亡后，杀死其的角色摸两张牌或回复1点体力；每轮开始时，你展示一张未加入游戏或死亡角色的身份牌，本轮该阵营角色数视为+1。",
  zhaoluan: "兆乱",
  zhaoluan_info:
    "限定技，一名角色的濒死结算完成后，若其未脱离濒死状态，你可以令其增加3点体力上限并失去所有非锁定技，然后其将体力回复至3点并摸四张牌，本局游戏你可以令其减少1点体力上限并对一名你选择的角色造成1点伤害（出牌阶段每名角色限一次）。",

  le_huangyueying: "神黄月英",
  le_huangyueying_prefix: "神",
  cangqiao: "藏巧",
  cangqiao_info:
    "每轮开始时，你可以获得游戏外或弃牌堆中的【折戟】、【女装】、【驽马】各至多一张；你使用上述牌时可以将手牌摸至你的体力上限。",
  shenji: "神机",
  shenji_info:
    "每回合限一次，以你为唯一目标的黑色牌结算后，你可以将场上一张装备牌当未以此法使用过的延时锦囊牌使用（均使用过后重置）；此类锦囊牌在判定区内同时拥有被转化的装备牌的效果。",
  huaxiu: "化朽",
  huaxiu_info: `出牌阶段限一次，你可以将一种“藏巧”装备牌效果修改为下述对应顺序的牌直到下回合开始：${get.poptip("hun_zhuge")}、${get.poptip("hun_bagua")}、${get.poptip("lingling")}。`,
  hun_zhuge: "魂·诸葛连弩",
  hun_zhuge_info:
    "你使用【杀】无次数限制且指定目标后，你可以令任意名死亡角色依次观看目标手牌并可以重铸其中一张牌。",
  hun_zhuge_skill: "魂·诸葛连弩",
  hun_zhuge_skill_info:
    "你使用【杀】无次数限制且指定目标后，你可以令任意名死亡角色依次观看目标手牌并可以重铸其中一张牌。",
  hun_bagua: "魂·八卦阵",
  hun_bagua_info:
    "当你需要使用或打出【闪】时，你可以进行一次判定，若结果为红色，视为使用或打出之；判定前你可以令一名死亡角色卜算3。",
  hun_bagua_skill: "魂·八卦阵",
  hun_bagua_skill_info:
    "当你需要使用或打出【闪】时，你可以进行一次判定，若结果为红色，视为使用或打出之；判定前你可以令一名死亡角色卜算3。",
  lingling: "軨軨",
  lingling_info:
    "准备阶段，你须对一名角色造成1点雷电伤害；每轮结束时，所有死亡角色同时秘密选择上家或下家，然后按顺序（死亡由前到后）依次移动此牌至选择的角色对应区域内。",
  lingling_skill: "軨軨",
  lingling_skill_info:
    "准备阶段，你须对一名角色造成1点雷电伤害；每轮结束时，所有死亡角色同时秘密选择上家或下家，然后按顺序（死亡由前到后）依次移动此牌至选择的角色对应区域内。",

  chixueqingfeng: "赤血青锋",
  chixueqingfeng2: "赤血青锋",
  chixueqingfeng_info:
    "锁定技，当你使用【杀】指定一名角色为目标后，此【杀】无视其防具且其不能使用或打出手牌，直到此【杀】结算结束。",

  olhuaquan_heavy: "重拳",
  olhuaquan_heavy_bg: "重拳",
  olhuaquan_heavy_info: "造成的伤害+1。",
  olhuaquan_light: "轻拳",
  olhuaquan_light_bg: "轻拳",
  olhuaquan_light_info: "使用后你摸一张牌。",

  oltianhou_spade: "骤雨",
  oltianhou_spade_miehuo: "骤雨",
  oltianhou_spade_info:
    "锁定技，防止其他角色造成的火焰伤害。当一名角色受到雷电伤害后，其相邻角色失去1点体力。",
  oltianhou_heart: "烈暑",
  oltianhou_heart_info:
    "锁定技，其他角色的结束阶段，若其体力值全场最大，其失去1点体力。",
  oltianhou_club: "严霜",
  oltianhou_club_info:
    "锁定技，其他角色结束阶段，若其体力值全场最小，其失去1点体力。",
  oltianhou_diamond: "凝雾",
  oltianhou_diamond_info:
    "锁定技，当其他角色使用【杀】指定非相邻角色为唯一目标时，其判定，若结果点数大于此【杀】，此【杀】无效。",

  de_diaochan: "魔貂蝉",
  de_diaochan_prefix: "魔",
  huanhuo: "幻惑",
  huanhuo_info:
    "每轮开始时，你摸两张牌，然后弃置至多两张牌并选择等量其他角色。其下回合出牌阶段强制选中一张可用的手牌，且每使用一张牌后随机弃一张牌，直到其使用了两张牌后。",
  de_qingshi: "倾世",
  de_qingshi_info: `准备阶段，你可${get.poptip("rule_rumo")}，令所有角色获得一张单目标伤害牌。其他角色使用此牌指定唯一目标时，你可弃置一张牌，重新指定牌的目标（无距离限制）。这些牌：造成伤害后，你摸一张牌；未因使用进入弃牌堆后，你获得之。（准备阶段，若这些牌均离开其手牌区，你再令所有角色获得牌。）`,

  rumo: "入魔",
  rumo_info: "入魔后，每轮结束时，若本轮你未造成过伤害，你失去1点体力。",
}

export default translates
