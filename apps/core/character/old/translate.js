import { get } from "wtk"

const translates = {
  old_diaochan: "貂蝉",

  old_liubei: "刘备",
  oldrende: "仁德",
  oldrende_info:
    "出牌阶段限一次，你可以将任意张手牌交给其他角色，若你给出的牌数大于1，你回复1点体力。",

  old_huangyueying: "黄月英",
  oldjizhi: "集智",
  oldjizhi_info:
    "当你使用非转化的锦囊牌时，你可以展示牌堆顶的一张牌，若此牌：为基本牌，你将之置入弃牌堆或将一张手牌与之交换；不为基本牌，你获得之。",
  oldqicai: "奇才",
  oldqicai_info:
    "锁定技，你使用锦囊牌无距离限制；其他角色不能弃置你装备区里除坐骑牌外的牌。",

  old_yuanshu: "袁术",
  wangzun: "妄尊",
  wangzun2: "妄尊",
  wangzun_info: "主公的准备阶段，你可以摸一张牌，然后主公本回合手牌上限-1。",
  tongji: "同疾",
  tongji_info:
    "锁定技，若你的手牌数大于体力值，攻击范围含有你的角色使用【杀】只能以你为目标。",

  old_guanyu: "界关羽",
  old_guanyu_prefix: "界",
  oldyijue: "义绝",
  oldyijue2: "义绝",
  oldyijue_info:
    "出牌阶段限一次，你可以与一名角色拼点，若你：赢，直到回合结束，其不能使用或打出手牌且所有非锁定技失效；没赢，你可以令其回复1点体力。",

  old_zhangfei: "界张飞",
  old_zhangfei_prefix: "界",
  oldtishen: "替身",
  oldtishen2: "替身",
  oldtishen_info:
    "限定技，准备阶段，你可以将体力回复至等同于你上回合结束后的体力，然后摸X张牌（X为你本次回复的体力值）。",

  old_zhaoyun: "界赵云",
  old_zhaoyun_prefix: "界",
  oldyajiao: "涯角",
  oldyajiao_info:
    "当你于回合外使用或打出手牌时，你可以展示牌堆顶的一张牌。若这两张牌的类别：相同，你可以将此牌交给一名角色；不同，你可以将此牌置入弃牌堆。",

  re_xushu: "界徐庶",
  re_xushu_prefix: "界",
  zhuhai: "诛害",
  zhuhai_info:
    "其他角色的结束阶段，若其本回合造成过伤害，你可以对其使用一张【杀】。",
  qianxin: "潜心",
  qianxin_info:
    "觉醒技，当你造成伤害后，若你已受伤，你减1点体力上限，然后获得技能〖荐言〗。",
  jianyan: "荐言",
  jianyan_info:
    "出牌阶段限一次，你可以声明一种牌的类别或颜色，然后连续亮出牌堆顶的牌，直到亮出符合你声明的牌为止。最后你令一名男性角色获得此牌。",

  old_caocao: "界曹操",
  old_caocao_prefix: "界",
  oldjianxiong: "奸雄",
  oldjianxiong_info:
    "当你受到伤害后，你可以选择一项：1.摸一张牌；2.获得对你造成伤害的牌。",

  old_xiahoudun: "界夏侯惇",
  old_xiahoudun_prefix: "界",
  oldqingjian: "清俭",
  oldqingjian_info:
    "当你于摸牌阶段外获得牌后，你可以将其中任意张牌交给其他角色。",

  old_zhangliao: "界张辽",
  old_zhangliao_prefix: "界",
  oldtuxi: "突袭",
  oldtuxi_info:
    "摸牌阶段，你可以少摸任意张牌并选择等量手牌不少于你的其他角色，然后你获得这些角色的各一张手牌。",

  old_xuzhu: "界许褚",
  old_xuzhu_prefix: "界",
  oldluoyi: "裸衣",
  oldluoyi_info:
    "摸牌阶段，你可以改为亮出牌堆顶的三张牌，然后你获得其中的基本牌、武器牌和【决斗】。若如此做，直到你的下个回合开始，你为伤害来源的【杀】或【决斗】造成的伤害+1。",

  old_guojia: "界郭嘉",
  old_guojia_prefix: "界",
  oldyiji: "遗计",
  oldyiji2: "遗计",
  oldyiji_info:
    "当你受到1点伤害后，你可以摸两张牌，然后可以在至多两名其他角色的武将牌旁分别扣置至多两张手牌。这些角色的下个摸牌阶段开始时获得这些牌。",

  old_lvbu: "界吕布",
  old_lvbu_prefix: "界",
  oldliyu: "利驭",
  oldliyu_info:
    "当你使用【杀】对一名其他角色造成伤害后，其可以令你获得其一张牌，然后你视为对其选择的另一名角色使用一张【决斗】。",

  old_yujin: "旧于禁",
  old_yujin_prefix: "旧",
  yizhong: "毅重",
  yizhong_info: "锁定技，若你的装备区里没有防具牌，黑色【杀】对你无效。",

  old_fazheng: "旧法正",
  old_fazheng_prefix: "旧",
  oldenyuan: "恩怨",
  oldenyuan1: "恩怨",
  oldenyuan2: "恩怨",
  oldenyuan_info:
    "锁定技，当其他角色令你回复1点体力后，其摸一张牌；当你受到其他角色对你造成的伤害后，其选择一项：1.交给你一张红桃手牌；2.失去1点体力。",
  oldxuanhuo: "眩惑",
  oldxuanhuo_info:
    "出牌阶段限一次，你可以将一张红桃手牌交给一名其他角色，然后你获得其一张牌并可以交给另一名其他角色。",

  old_masu: "旧马谡",
  old_masu_prefix: "旧",
  xinzhan: "心战",
  xinzhan_gain: "获得",
  xinzhan_place: "牌堆顶",
  xinzhan_info:
    "出牌阶段限一次，若你的手牌数大于体力上限，你可以观看牌堆顶的三张牌，然后展示并获得其中任意张红桃牌，最后将其余牌以任意顺序置于牌堆顶。",
  huilei: "挥泪",
  huilei_info: "锁定技，当你死亡时，杀死你的角色弃置所有牌。",

  old_xushu: "旧徐庶",
  old_xushu_prefix: "旧",
  oldwuyan: "无言",
  oldwuyan_info:
    "锁定技，你使用的普通锦囊牌对其他角色无效，其他角色使用的普通锦囊牌对你无效。",
  oldjujian: "举荐",
  oldjujian_info:
    "出牌阶段限一次，你可以弃置至多三张牌，然后令一名其他角色摸等量的牌。若你以此法弃置三张相同类别的牌，你回复1点体力。",

  old_lingtong: "旧凌统",
  old_lingtong_prefix: "旧",
  oldxuanfeng: "旋风",
  oldxuanfeng_info:
    "当你失去装备区里的牌后，你可以选择一项：1.视为使用一张无距离限制的【杀】（此【杀】不计入次数限制）；2.对与你距离1以内的一名其他角色造成1点伤害。",

  old_xusheng: "旧徐盛",
  old_xusheng_prefix: "旧",
  oldpojun: "破军",
  oldpojun_info:
    "当你使用【杀】对目标角色造成伤害后，你可以令其摸X张牌（X为其体力值且至多为5），然后其翻面。",

  old_caozhang: "旧曹彰",
  old_caozhang_prefix: "旧",
  oldjiangchi: "将驰",
  oldjiangchi_less: "少摸一张",
  oldjiangchi_more: "多摸一张",
  oldjiangchi_info:
    "摸牌阶段，你可以选择一项：1.多摸一张牌，本回合不能使用或打出【杀】；2.少摸一张牌，本回合使用【杀】无距离限制且可以多使用一张【杀】。",

  old_wangyi: "旧王异",
  old_wangyi_prefix: "旧",
  oldzhenlie: "贞烈",
  oldzhenlie_info: "当你的判定牌生效前，你可以亮出牌堆顶的一张牌代替此牌。",
  oldmiji: "秘计",
  oldmiji_info:
    "准备或结束阶段，若你已受伤，你可以进行判定，若结果为黑色，你观看牌堆顶的X张牌（X为你已损失的体力值），然后将这些牌交给一名角色。",

  old_guanzhang: "旧关兴张苞",
  old_guanzhang_prefix: "旧",
  oldfuhun: "父魂",
  oldfuhun_info: `摸牌阶段，你可以改为亮出牌堆顶的两张牌并获得之，若亮出的牌颜色不同，你本回合视为拥有${get.poptip("wusheng")}和${get.poptip("paoxiao")}。`,

  old_madai: "旧马岱",
  old_madai_prefix: "旧",
  oldqianxi: "潜袭",
  oldqianxi_info:
    "当你使用【杀】对距离为1的目标角色造成伤害时，你可以进行判定，若结果不为红桃，你防止此伤害，然后其减1点体力上限。",

  old_liaohua: "旧廖化",
  old_liaohua_prefix: "旧",
  olddangxian: "当先",
  olddangxian_info: "锁定技，回合开始时，你执行一个额外的出牌阶段。",
  oldfuli: "伏枥",
  oldfuli_info:
    "限定技，当你处于濒死状态时，你可以将体力回复至X点（X为全场势力数），然后你翻面。",

  old_handang: "旧韩当",
  old_handang_prefix: "旧",
  oldgongqi: "弓骑",
  oldgongqi_info:
    "你可以将一张装备牌当【杀】使用或打出；你以此法使用的【杀】无距离限制。",
  oldjiefan: "解烦",
  oldjiefan_info:
    "你的回合外，当一名角色处于濒死状态时，你可以对当前回合角色使用一张【杀】，此【杀】造成伤害时，你防止此伤害，视为对该濒死角色使用一张【桃】。",

  old_huaxiong: "将华雄",
  old_huaxiong_prefix: "将",
  shiyong: "恃勇",
  shiyong_info:
    "锁定技，当你受到红色【杀】或【酒】【杀】造成的伤害后，你减1点体力上限。",

  old_liubiao: "旧刘表",
  old_liubiao_prefix: "旧",
  oldzishou: "自守",
  oldzishou_info:
    "摸牌阶段，若你已受伤，你可以多摸X张牌（X为你已损失的体力值）。若如此做，你跳过出牌阶段。",

  old_caochong: "旧曹冲",
  old_caochong_prefix: "旧",
  oldchengxiang: "称象",
  oldchengxiang_info:
    "当你受到伤害后，你可以亮出牌堆顶的四张牌，然后获得其中任意张点数之和小于13的牌。",
  oldrenxin: "仁心",
  oldrenxin_info:
    "当一名其他角色处于濒死状态时，你可以翻面并将所有手牌（至少一张）交给其，然后其回复1点体力。",

  old_guohuai: "旧郭淮",
  old_guohuai_prefix: "旧",
  oldjingce: "精策",
  oldjingce_info:
    "出牌阶段结束时，若你本回合使用过的牌数不小于你的体力值，你可以摸两张牌。",

  old_manchong: "旧满宠",
  old_manchong_prefix: "旧",
  oldjunxing: "峻刑",
  oldjunxing_info:
    "出牌阶段限一次，你可以弃置任意张手牌并令一名其他角色选择一项：1.弃置与你弃置的牌类别均不同的一张手牌；2.翻面，然后摸等量的牌。",

  old_zhuran: "旧朱然",
  old_zhuran_prefix: "旧",
  olddanshou: "胆守",
  olddanshou_info:
    "当你造成伤害后，你可以摸一张牌，然后终止一切结算，结束当前回合。",
  olddanshou_faq: "关于〖胆守〗",
  olddanshou_faq_info:
    "<br>被终止的结算包括：当前正在进行的伤害结算、牌或其他技能的使用结算、连环传导，以及将要触发的连环。终止伤害结算，即伤害结算直接完毕；终止牌的使用结算，即使用结算直接完毕；终止其他技能的使用结算，即不会再对从当前回合角色开始行动顺序在你之后的角色进行结算，也不会再执行后续的效果。",

  old_fuhuanghou: "旧伏皇后",
  old_fuhuanghou_prefix: "旧",
  oldzhuikong: "惴恐",
  oldzhuikong_info:
    "其他角色的回合开始时，若你已受伤，你可以与其拼点，若你：赢，其跳过本回合的出牌阶段；没赢，本回合其与你的距离视为1。",
  oldqiuyuan: "求援",
  oldqiuyuan_info:
    "当你成为【杀】的目标时，你可以令另一名有手牌的其他角色交给你一张手牌，若此牌不为【闪】，其也成为此【杀】的目标。",

  old_liru: "旧李儒",
  old_liru_prefix: "旧",
  oldjuece: "绝策",
  oldjuece_info:
    "当一名其他角色于你的回合内失去最后一张手牌后，你可以对其造成1点伤害。",
  oldmieji: "灭计",
  oldmieji_info:
    "当你使用黑色锦囊牌指定唯一目标时，你可以多指定一名角色为目标。",
  oldfencheng: "焚城",
  oldfencheng_info:
    "限定技，出牌阶段，你可以令所有其他角色依次选择一项：1.弃置X张牌（X为其装备区里的牌数且至少为1）；2.受到你造成的1点火焰伤害。",

  old_caozhen: "旧曹真",
  old_caozhen_prefix: "旧",
  oldsidi: "司敌",
  oldsidi2: "司敌",
  oldsidi3: "司敌",
  oldsidi_info:
    "当你使用或其他角色于你的回合内使用【闪】时，你可以将牌堆顶的一张牌置于武将牌上，称为“钤”。其他角色的出牌阶段开始时，你可以移去一张“钤”，令其此阶段使用【杀】的次数上限-1。",

  old_chenqun: "旧陈群",
  old_chenqun_prefix: "旧",
  dingpin: "定品",
  dingpin_info:
    "出牌阶段，你可以弃置一张手牌（不能是你本回合使用或弃置过的类别）并选择一名已受伤的角色，令其进行判定，若结果为：黑色，其摸X张牌（X为其已损失的体力值），然后你于此回合内不能对其发动〖定品〗；红色，你翻面。",
  oldfaen: "法恩",
  oldfaen_info: "当一名角色翻面或横置后，你可以令其摸一张牌。",

  old_wuyi: "旧吴懿",
  old_wuyi_prefix: "旧",
  oldbenxi: "奔袭",
  oldbenxi_info:
    "锁定技，当你于回合内使用牌时，本回合你计算与其他角色的距离-1；你的回合内，若你与所有其他角色的距离均为1，则你无视其他角色的防具且你使用【杀】可以多指定一个目标。",

  old_zhoucang: "旧周仓",
  old_zhoucang_prefix: "旧",
  oldzhongyong: "忠勇",
  oldzhongyong_info:
    "当你于出牌阶段内使用的【杀】被其他角色使用的【闪】抵消后，你可以将此【闪】交给另一名角色，然后若获得牌的角色不为你，你可以再对该角色使用一张【杀】。",

  old_zhuhuan: "旧朱桓",
  old_zhuhuan_prefix: "旧",
  youdi: "诱敌",
  youdi_info:
    "结束阶段，你可以令一名其他角色弃置你的一张牌，若弃置的牌不为【杀】，你获得其一张牌。",

  old_caorui: "旧曹叡",
  old_caorui_prefix: "旧",
  oldmingjian: "明鉴",
  oldmingjian_info:
    "你可以跳过出牌阶段并将所有手牌交给一名其他角色，然后结束此回合。若如此做，其获得一个额外的出牌阶段。",

  old_caoxiu: "旧曹休",
  old_caoxiu_prefix: "旧",
  taoxi: "讨袭",
  taoxi2: "讨袭",
  taoxi3: "讨袭",
  taoxi_info:
    "出牌阶段内限一次，当你使用牌指定其他角色为唯一目标后，你可以亮出其一张手牌直到回合结束，且你本回合可以如手牌般使用此牌；回合结束时，若其未失去此牌，你失去1点体力。",

  old_quancong: "旧全琮",
  old_quancong_prefix: "旧",
  zhenshan: "振赡",
  zhenshan_info:
    "每回合限一次，当你需要使用或打出一张基本牌时，你可以与手牌数小于你的一名角色交换手牌，视为使用或打出此牌。",
}

export default translates
