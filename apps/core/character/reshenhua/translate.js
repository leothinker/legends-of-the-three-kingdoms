import { get } from "wtk"

const translates = {
  re_caoren: "界曹仁",
  re_caoren_prefix: "界",
  rejushou: "据守",
  rejushou_info:
    "结束阶段，你可以翻面，然后摸四张牌并弃置一张手牌，若此牌为装备牌，则你改为使用之。",
  jiewei: "解围",
  jiewei_info:
    "你可以将装备区里的一张牌当【无懈可击】使用；当你翻面至正面朝上时，你可以弃置一张手牌，然后可以移动场上的一张牌。",

  re_xiahouyuan: "界夏侯渊",
  re_xiahouyuan_prefix: "界",
  reshensu: "神速",
  shensu4: "神速",
  reshensu_info:
    "你可以做出如下选择：1.跳过判定阶段和摸牌阶段；2.跳过出牌阶段并弃置一张装备牌；3.跳过弃牌阶段并翻面。你每选择一项，便视为使用一张无距离限制的【杀】。",

  re_huangzhong: "界黄忠",
  re_huangzhong_prefix: "界",
  reliegong: "烈弓",
  reliegong_info:
    "你使用【杀】可以选择距离不大于此【杀】点数的角色为目标。当你使用【杀】指定一名角色为目标后，你可以根据下列条件执行相应的效果：1.其手牌数不大于你的手牌数，其不能使用【闪】响应此【杀】；2.其体力值不小于你的体力值，此【杀】伤害+1。",

  re_weiyan: "界魏延",
  re_weiyan_prefix: "界",
  rekuanggu: "狂骨",
  rekuanggu_info:
    "当你对距离小于2的一名角色造成1点伤害后，你可以回复1点体力或摸一张牌。",
  qimou: "奇谋",
  qimou_info:
    "限定技，出牌阶段，你可以失去任意点体力，然后你于此阶段内计算与其他角色的距离-X，且你可以多使用X张【杀】（X为你以此法失去的体力值）。",

  re_xiaoqiao: "界小乔",
  re_xiaoqiao_prefix: "界",
  retianxiang: "天香",
  retianxiang_info:
    "当你受到伤害时，你可以弃置一张红桃手牌并选择一名其他角色，然后防止此伤害并选择一项：1.令来源对其造成1点伤害，然后其摸X张牌（X为其已损失的体力值且至多为5）；2.令其失去1点体力，然后其获得你弃置的牌。",

  re_zhoutai: "界周泰",
  re_zhoutai_prefix: "界",
  rebuqu: "不屈",
  rebuqu_bg: "创",
  rebuqu_info:
    "锁定技，当你处于濒死状态时，你将牌堆顶的一张牌置于你的武将牌上，称为“创”，若此牌的点数与已有的“创”点数均不同，则你将体力回复至1点，否则你将此牌置入弃牌堆。若你的武将牌上有“创”，你的手牌上限与“创”的数量相等。",
  fenji: "奋激",
  fenji_info:
    "一名角色的结束阶段，若其没有手牌，你可以令其摸两张牌，然后你失去1点体力。",

  re_zhangjiao: "界张角",
  re_zhangjiao_prefix: "界",
  releiji: "雷击",
  releiji_info:
    "当你使用或打出【闪】时，你可以令一名其他角色进行判定，若结果为：黑桃，你对其造成2点雷电伤害；梅花，你回复1点体力，对其造成1点雷电伤害。",

  re_yuji: "界于吉",
  re_yuji_prefix: "界",
  reguhuo: "蛊惑",
  reguhuo_info: `每回合限一次，你可以扣置一张手牌，将此牌当任意一张基本牌或普通锦囊牌使用或打出且其他角色可以进行质疑。若有其他角色质疑则翻开此牌，若为假，则此牌作废，否则质疑者获得${get.poptip("chanyuan")}。`,
  chanyuan: "缠怨",
  chanyuan_info:
    "锁定技，你不能质疑〖蛊惑〗；若你的体力值为1，你的其他技能失效。",

  re_shen_guanyu: "神关羽",
  re_shen_guanyu_prefix: "神",

  re_shen_lvmeng: "神吕蒙",
  re_shen_lvmeng_prefix: "神",

  re_dianwei: "界典韦",
  re_dianwei_prefix: "界",
  reqiangxi: "强袭",
  reqiangxi_info:
    "出牌阶段对每名角色限一次，你可以失去1点体力或弃置一张武器牌，对你攻击范围内的一名其他角色造成1点伤害。",

  re_xunyu: "界荀彧",
  re_xunyu_prefix: "界",
  rejieming: "节命",
  rejieming_info:
    "当你受到1点伤害后，你可以令一名角色摸两张牌，然后若其手牌数小于其体力上限，你摸一张牌。",

  re_sp_zhugeliang: "界卧龙诸葛",
  re_sp_zhugeliang_prefix: "界",
  rehuoji: "火计",
  rehuoji_info: "你可以将一张红色牌当【火攻】使用。",
  rekanpo: "看破",
  rekanpo_info: "你可以将一张黑色牌当【无懈可击】使用。",

  re_pangtong: "界庞统",
  re_pangtong_prefix: "界",
  relianhuan: "连环",
  relianhuan_info:
    "你可以将一张梅花手牌当【铁索连环】使用或重铸；你使用【铁索连环】可以多指定一名角色为目标。",
  reniepan: "涅槃",
  reniepan_info:
    "限定技，出牌阶段或当你处于濒死状态时，你可以弃置区域里的所有牌，复原武将牌，然后摸三张牌并将体力回复至3点。",

  re_taishici: "界太史慈",
  re_taishici_prefix: "界",
  retianyi: "天义",
  retianyi_info:
    "出牌阶段限一次，你可以与一名角色拼点，若你：赢，本回合你使用【杀】无距离限制、次数上限和目标上限均+1；没赢，本回合你使用下一张牌时取消之并令唯一目标摸两张牌。",
  dangmo: "荡魔",
  dangmo_info:
    "当你使用牌结算结束后，若此牌与你本回合使用的上一张牌目标不完全相同，你可以对两张牌的相同目标各造成1点伤害。",

  re_pangde: "界庞德",
  re_pangde_prefix: "界",
  jianchu: "鞬出",
  jianchu_info:
    "当你使用【杀】指定一名角色为目标后，你可以弃置其一张牌，若弃置的牌：为装备牌，其不能使用【闪】；不为装备牌，其获得此【杀】。",

  re_yuanshao: "界袁绍",
  re_yuanshao_prefix: "界",
  reluanji: "乱击",
  reluanji_info:
    "你可以将两张手牌当【万箭齐发】使用（不能使用本回合发动此技能时使用过的花色）。当你使用【万箭齐发】：被其他角色打出【闪】响应时，其摸一张牌；结算结束后，若没有角色受到此牌的伤害，你摸一张牌。",

  re_yanwen: "界颜良文丑",
  re_yanwen_prefix: "界",
  reshuangxiong: "双雄",
  reshuangxiong_info:
    "摸牌阶段，你可以改为亮出牌堆顶的两张牌，你获得其中一张牌，然后本回合你可以将与此牌颜色不同的一张手牌当【决斗】使用；当你因【决斗】受到伤害后，你可以获得此次【决斗】中其他角色打出的【杀】。",

  re_shen_zhouyu: "神周瑜",
  re_shen_zhouyu_prefix: "神",

  re_shen_zhugeliang: "神诸葛亮",
  re_shen_zhugeliang_prefix: "神",

  re_caopi: "界曹丕",
  re_caopi_prefix: "界",
  rexingshang: "行殇",
  rexingshang_info:
    "当其他角色死亡时，你可以选择一项：1.获得其所有牌；2.回复1点体力。",
  refangzhu: "放逐",
  refangzhu_info:
    "当你受到伤害后，你可以令一名其他角色选择一项：1.弃置X张牌并失去1点体力；2.摸X张牌并翻面（X为你已损失的体力值）。",

  re_xuhuang: "界徐晃",
  re_xuhuang_prefix: "界",
  reduanliang: "断粮",
  reduanliang_info:
    "你可以将一张黑色非锦囊牌当【兵粮寸断】使用；你对手牌数不小于你的角色使用【兵粮寸断】无距离限制。",
  jiezi: "截辎",
  jiezi_info: "锁定技，当其他角色跳过摸牌阶段后，你摸一张牌。",

  re_zhurong: "界祝融",
  re_zhurong_prefix: "界",
  relieren: "烈刃",
  relieren_info:
    "当你使用【杀】指定一名角色为目标后，你可以与其拼点，若你：赢，你获得其一张牌；没赢，你获得其拼点的牌，其获得你拼点的牌。",

  re_menghuo: "界孟获",
  re_menghuo_prefix: "界",
  rezaiqi: "再起",
  rezaiqi_info:
    "弃牌阶段结束时，你可以令至多X名角色各选择一项（X为本回合置入弃牌堆的红色牌数）：1.摸一张牌；2.令你回复1点体力。",

  re_lusu: "界鲁肃",
  re_lusu_prefix: "界",
  rehaoshi: "好施",
  rehaoshi_info:
    "摸牌阶段，你可以多摸两张牌，然后手牌唯一最多的角色将半数（向下取整）手牌交给你选择的一名手牌最少的角色。",
  redimeng: "缔盟",
  redimeng_info:
    "出牌阶段限一次，你可以选择两名手牌数之差小于3的其他角色，这两名角色各可以使用至多三张手牌，然后双方交换手牌。",

  re_sunjian: "界孙坚",
  re_sunjian_prefix: "界",
  polu: "破虏",
  polu_info:
    "当你杀死一名角色或死亡后，你可以令任意名角色各摸X张牌（X为你此前发动过此技能的次数+1）。",

  re_dongzhuo: "界董卓",
  re_dongzhuo_prefix: "界",
  rejiuchi: "酒池",
  rejiuchi_info:
    "你可以将一张黑桃手牌当【酒】使用。当你使用【酒】【杀】造成伤害后，本回合〖崩坏〗失效。",
  rebaonue: "暴虐",
  rebaonue2: "暴虐",
  rebaonue_info:
    "主公技，当其他群势力角色造成伤害后，其可以令你进行判定，若结果为黑桃，你回复1点体力。",

  re_jiaxu: "界贾诩",
  re_jiaxu_prefix: "界",
  rewansha: "完杀",
  rewansha_info:
    "锁定技，你的回合内：除处于濒死状态的角色外的其他角色的红色基本牌均视为【杀】，此【杀】被使用时你摸两张牌。",
  reweimu: "帷幕",
  reweimu_info:
    "黑色锦囊牌对你无效；你可以将一张黑色非锦囊牌当【借刀杀人】使用。",

  re_shen_lvbu: "神吕布",
  re_shen_lvbu_prefix: "神",

  re_shen_caocao: "神曹操",
  re_shen_caocao_prefix: "神",

  re_dengai: "界邓艾",
  re_dengai_prefix: "界",
  retuntian: "屯田",
  retuntian_info:
    "当你于回合外失去牌后，你可以进行判定，若结果为红桃，则你获得此判定牌；否则你将此判定牌置于你的武将牌上，称为“田”。你计算与其他角色的距离-X（X为“田”的数量）。",

  re_zhanghe: "界张郃",
  re_zhanghe_prefix: "界",
  reqiaobian: "巧变",
  reqiaobian_info:
    "每轮开始时，你可以与一名上轮未选择过的角色各摸一张牌，本轮其回合内你可以弃置一张牌跳过其一个阶段（准备阶段和结束阶段除外），若以此法跳过：摸牌阶段，其获得至多两名角色各一张手牌；出牌阶段，其可以移动场上的一张牌。",

  re_jiangwei: "界姜维",
  re_jiangwei_prefix: "界",
  retiaoxin: "挑衅",
  retiaoxin_info:
    "出牌阶段限一次，你可以选择一名其他角色，然后除非其对你使用一张【杀】（须合法），否则你弃置其一张牌。",
  rezhiji: "志继",
  rezhiji_info: `觉醒技，准备阶段，若你没有手牌，你回复1点体力或摸两张牌，减1点体力上限，然后获得${get.poptip("reguanxing")}。`,

  re_liushan: "界刘禅",
  re_liushan_prefix: "界",
  refangquan: "放权",
  refangquan_info:
    "你可以跳过出牌阶段，令你本回合的手牌上限等于体力上限。若如此做，本回合结束时，你可以弃置一张手牌，令一名其他角色执行一个额外的回合。",

  re_sunce: "界孙策",
  re_sunce_prefix: "界",
  rehunzi: "魂姿",
  rehunzi_info:
    "觉醒技，准备阶段，若你的体力值不大于2，你减1点体力上限，然后获得〖英姿〗和〖英魂〗。",

  re_zhangzhang: "界张昭张纮",
  re_zhangzhang_prefix: "界",
  rezhijian: "直谏",
  rezhijian_info:
    "出牌阶段，你可以将手牌中的一张装备牌置入其他角色的装备区，然后摸一张牌；当你于出牌阶段内使用装备牌时，你摸一张牌。",

  re_zuoci: "界左慈",
  re_zuoci_prefix: "界",
  rehuashen: "化身",
  rehuashen_info:
    "游戏开始时，你获得三张武将牌作为“化身”牌，然后亮出其中一张，你获得亮出“化身”牌的一个技能（限定技、觉醒技、主公技除外），且性别和势力视为与之相同；回合开始或结束时，你可以选择一项：1.更改亮出的“化身”牌；2.移去至多两张未亮出的“化身”牌，然后获得等量新的“化身”牌。",
  rexinsheng: "新生",
  rexinsheng_info:
    "当你受到1点伤害后，若你拥有〖化身〗，你可以获得一张新的“化身”牌。",

  re_caiwenji: "界蔡文姬",
  re_caiwenji_prefix: "界",
  rebeige: "悲歌",
  rebeige_info:
    "当一名角色受到【杀】造成的伤害后，你可以弃置一张牌，然后令其进行判定，若结果为：红桃，其回复X点体力（X为其本次受到的伤害值）；方块，其摸三张牌；梅花，伤害来源弃置两张牌；黑桃，伤害来源翻面。",

  re_shen_simayi: "神司马懿",
  re_shen_simayi_prefix: "神",
  rerenjie: "忍戒",
  rerenjie2: "忍戒",
  rerenjie_info:
    "锁定技，当你受到伤害后/于弃牌阶段内弃置手牌后，你获得伤害值枚/弃置手牌数枚“忍”。",
  rebaiyin: "拜印",
  rebaiyin_info: `觉醒技，准备阶段，若“忍”数大于3，你减1点体力上限，然后获得${get.poptip("rejilue")}。`,
  rejilue: "极略",
  rejilue_info: `你可以弃1枚“忍”，发动下列一项技能：${get.poptip("rejilue_guicai")}、${get.poptip("rejilue_fangzhu")}、${get.poptip("rejilue_jizhi")}、${get.poptip("rejilue_zhiheng")}或${get.poptip("rejilue_wansha")}。`,
  rejilue_guicai: "鬼才",
  rejilue_guicai_info: "当一名角色的判定牌生效前，你可以打出一张牌代替之。",
  rejilue_fangzhu: "放逐",
  rejilue_fangzhu_info:
    "当你受到伤害后，你可以令一名其他角色选择一项：1.弃置X张牌并失去1点体力；2.摸X张牌并翻面（X为你已损失的体力值）。",
  rejilue_jizhi: "集智",
  rejilue_jizhi_info:
    "当你使用非转化的普通锦囊牌时，你可以摸一张牌。若此牌为基本牌，你可以弃置此牌，然后本回合手牌上限+1。",
  rejilue_zhiheng: "制衡",
  rejilue_zhiheng_info:
    "出牌阶段限一次，你可以弃置任意张牌，然后摸等量的牌。若你以此法弃置了所有手牌，则你多摸一张牌。",
  rejilue_wansha: "完杀",
  rejilue_wansha_info:
    "锁定技，你的回合内：除处于濒死状态的角色外的其他角色的红色基本牌均视为【杀】，此【杀】被使用时你摸两张牌。",

  re_shen_zhaoyun: "神赵云",
  re_shen_zhaoyun_prefix: "神",
  rejuejing: "绝境",
  rejuejing_info:
    "锁定技，你的手牌上限+2；当你进入或脱离濒死状态时，你摸一张牌。",
  relonghun: "龙魂",
  longhun1: "龙魂♥︎",
  longhun2: "龙魂♦︎",
  longhun3: "龙魂♣︎",
  longhun4: "龙魂♠︎",
  relonghun_info:
    "你可以将至多两张花色相同的牌按以下规则使用或打出：红桃当【桃】；方块当火【杀】；梅花当【闪】；黑桃当【无懈可击】。若你以此法转化了两张：红色牌，此牌回复值或伤害值+1；黑色牌，你弃置当前回合角色一张牌。",

  wangji: "王基",
  qizhi: "奇制",
  qizhi_info:
    "当你于回合内使用基本牌或锦囊牌指定目标后，你可以弃置不是此牌目标的一名角色一张牌，然后其摸一张牌。",
  jinqu: "进趋",
  jinqu_info:
    "结束阶段，你可以摸两张牌，然后将手牌弃置至X张（X为你本回合发动过〖奇制〗的次数）。",

  kuailiangkuaiyue: "蒯良蒯越",
  jianxiang: "荐降",
  jianxiang_info:
    "当你成为其他角色使用牌的目标后，你可以令手牌数最少的一名角色摸一张牌。",
  shenshi: "审时",
  shenshi_info:
    "转换技，阳：出牌阶段限一次，你可以将一张牌交给一名除你外手牌数最多的角色，然后对其造成1点伤害；若其因此死亡，你可以令一名角色将手牌摸至四张。阴：当其他角色对你造成伤害后，你可以观看其手牌，然后交给其一张牌；当前回合结束时，若其未失去此牌，你将手牌摸至四张。",

  yanyan: "严颜",
  juzhan: "拒战",
  juzhan_info:
    "转换技，阳：当你成为其他角色使用【杀】的目标后，你可以与其各摸一张牌，然后其本回合不能再对你使用牌。阴：当你使用【杀】指定一名角色为目标后，你可以获得其一张牌，然后你本回合不能再对其使用牌。",

  wangping: "王平",
  feijun: "飞军",
  feijun_info:
    "出牌阶段限一次，你可以弃置一张牌，然后选择一项：1.令一名手牌数大于你的角色交给你一张牌；2.令一名装备区里牌数大于你的角色弃置一张装备牌。",
  binglve: "兵略",
  binglve_info: "锁定技，当你对每名其他角色首次发动〖飞军〗时，你摸两张牌。",

  luji: "陆绩",
  huaiju: "怀橘",
  huaiju_info:
    "锁定技，游戏开始时，你获得3枚“橘”；当有“橘”的角色受到伤害时，防止此伤害，然后其弃1枚“橘”；有“橘”的角色摸牌阶段多摸一张牌。",
  tachibana_effect: "怀橘",
  yili: "遗礼",
  yili_info:
    "出牌阶段开始时，你可以失去1点体力或弃1枚“橘”，令一名其他角色获得1枚“橘”。",
  zhenglun: "整论",
  zhenglun_info:
    "摸牌阶段开始前，若你没有“橘”，你可以跳过此阶段，然后获得1枚“橘”。",

  sunliang: "孙亮",
  kuizhu: "溃诛",
  kuizhu_info:
    "弃牌阶段结束时，你可以选择一项：1.令至多X名角色各摸一张牌；2.对任意名体力值之和为X的角色各造成1点伤害，若不少于两名角色，你失去1点体力（X为你此阶段弃置的牌数）。",
  chezheng: "掣政",
  chezheng_info:
    "锁定技，出牌阶段内，攻击范围内不包含你的其他角色不能成为你使用牌的目标。出牌阶段结束时，若你此阶段使用的牌数小于这些角色数，你弃置其中一名角色一张牌。",
  lijun1: "立军",
  lijun: "立军",
  lijun_info:
    "主公技，当其他吴势力角色于其出牌阶段内使用【杀】结算结束后，其可以将此【杀】交给你，然后你可以令其摸一张牌。",

  xuyou: "许攸",
  chenglve: "成略",
  chenglve_info:
    "转换技，出牌阶段限一次，阳：你可以摸一张牌，然后弃置两张手牌。阴：你可以摸两张牌，然后弃置一张手牌。若如此做，你本阶段使用与弃置牌花色相同的牌无距离和次数限制。",
  shicai: "恃才",
  shicai_info:
    "当你使用一张牌结算结束后，若此牌与你本回合使用的牌类别均不同，你可以将此牌置于牌堆顶，然后摸一张牌。",
  cunmu: "寸目",
  cunmu_info: "锁定技，当你摸牌时，改为从牌堆底摸牌。",

  luzhi: "卢植",
  mingren: "明任",
  mingren_info:
    "游戏开始时，你摸一张牌，然后将一张手牌置于你的武将牌上，称为“任”。结束阶段，你可以用一张手牌替换“任”。",
  zhenliang: "贞良",
  zhenliang_info:
    "转换技，阳：出牌阶段限一次，你可以选择你攻击范围内的一名其他角色并弃置X张与“任”颜色相同的牌，对其造成1点伤害（X为你与其体力值之差且至少为1）；阴：你的回合外，当你使用或打出的牌结算结束后，若此牌与“任”类别相同，你可以令一名角色摸一张牌。",

  shen_liubei: "神刘备",
  shen_liubei_prefix: "神",
  longnu: "龙怒",
  longnu_info:
    "转换技，锁定技，出牌阶段开始时，阳：你失去1点体力，摸一张牌，你的红色手牌于此阶段内均视为火【杀】，你于此阶段内使用火【杀】无距离限制；阴：你减1点体力上限，摸一张牌，你的锦囊牌于此阶段内均视为雷【杀】，你于此阶段内使用雷【杀】无次数限制。",
  jieying: "结营",
  jieying_info:
    "锁定技，你始终横置；已横置的角色手牌上限+2；结束阶段，你横置一名其他角色。",

  shen_luxun: "神陆逊",
  shen_luxun_prefix: "神",
  junlve: "军略",
  junlve_info: "锁定技，当你造成或受到1点伤害后，你获得1枚“军略”。",
  cuike: "摧克",
  cuike_info:
    "出牌阶段开始时，若“军略”数量为：奇数，你可以对一名角色造成1点伤害；偶数，你可以横置一名角色并弃置其区域里的一张牌。若“军略”数量大于7，你可以弃所有“军略”并对所有其他角色各造成1点伤害。",
  zhanhuo: "绽火",
  zhanhuo_info:
    "限定技，出牌阶段，你可以弃所有“军略”，令至多等量的已横置角色各弃置装备区里的所有牌，然后对其中一名角色造成1点火焰伤害。",

  haozhao: "郝昭",
  zhengu: "镇骨",
  zhengu_info:
    "结束阶段，你可以选择一名其他角色，你的回合结束时和该角色的下个回合结束时，其将手牌摸至或弃置至与你手牌数相同（至多摸至五张）。",

  guanqiujian: "毌丘俭",
  zhengrong: "征荣",
  zhengrong_info:
    "当你对其他角色造成伤害后，若其手牌数大于你，你可以将其一张牌置于你的武将牌上，称为“荣”。",
  hongju: "鸿举",
  hongju_info: `觉醒技，准备阶段，若“荣”的数量不小于3且场上有角色死亡，你用任意张手牌替换等量的“荣”，减1点体力上限，获得${get.poptip("qingce")}。`,
  qingce: "清侧",
  qingce_info:
    "出牌阶段，若场上有牌，你可以移去一张“荣”，然后弃置场上的一张牌。",

  chendao: "陈到",
  wanglie: "往烈",
  wanglie_info:
    "出牌阶段，你使用的第一张牌无距离限制。当你于出牌阶段内使用基本牌或普通锦囊牌时，你可以令此牌不能被响应，然后你本阶段不能再使用牌。",

  zhugezhan: "诸葛瞻",
  zuilun: "罪论",
  zuilun_info:
    "结束阶段，你可以观看牌堆顶三张牌，你每满足以下一项便获得其中的一张，然后将其余牌以任意顺序置于牌堆顶：1.本回合造成过伤害；2.本回合未弃置过牌；3.手牌数为全场最少。若均不满足，你与一名其他角色各失去1点体力。",
  fuyin: "父荫",
  fuyin_info:
    "锁定技，当你每回合第一次成为【杀】或【决斗】的目标后，若你的手牌数不大于使用者，此牌对你无效。",

  zhoufei: "周妃",
  liangyin: "良姻",
  liangyin_info:
    "当有牌移出游戏时，你可以令手牌数大于你的一名角色摸一张牌；当有牌从游戏外移入任意角色的手牌时，你可以令手牌数小于你的一名角色弃置一张牌。",
  kongsheng: "箜声",
  kongsheng_info:
    "准备阶段，你可以将任意张牌置于武将牌上。若如此做，结束阶段，你使用这些牌中的装备牌并获得其余牌。",
  kongsheng2: "箜声",
  kongsheng2_info: "",

  lukang: "陆抗",
  qianjie: "谦节",
  qianjie_info:
    "锁定技，你不能被横置，且不能成为延时锦囊牌或其他角色拼点的目标。",
  jueyan: "决堰",
  jueyan_info: `出牌阶段限一次，你可以废除你装备区里的一种装备栏，然后执行对应的一项：武器栏，本回合可以多使用三张【杀】；防具栏，摸三张牌，本回合手牌上限+3；坐骑栏，本回合使用牌无距离限制；宝物栏，本回合获得${get.poptip("rejizhi")}。`,
  poshi: "破势",
  poshi_info: `觉醒技，准备阶段，若你所有装备栏均被废除或体力值为1，你减1点体力上限，然后将手牌摸至体力上限，失去〖决堰〗，获得${get.poptip("huairou")}。`,
  huairou: "怀柔",
  huairou_info: "出牌阶段，你可以重铸装备牌。",

  yuanshu: "袁术",
  yongsi: "庸肆",
  yongsi_info:
    "锁定技，摸牌阶段，你改为摸X张牌（X为势力数）；出牌阶段结束时，若你本回合：未造成过伤害，你将手牌摸至体力值；造成伤害值大于1，你本回合手牌上限改为已损失的体力值。",
  weidi: "伪帝",
  weidi_tag: "伪帝",
  weidi_info:
    "主公技，你于弃牌阶段弃置的牌可以交给任意名其他群势力角色各一张。",

  zhangxiu: "张绣",
  xiongluan: "雄乱",
  xiongluan_info:
    "限定技，出牌阶段，你可以废除你所有未被废除的判定区和装备栏并选择一名其他角色。本回合你对其使用牌无距离和次数限制，其不能使用或打出手牌。",
  congjian: "从谏",
  congjian_info:
    "当你成为锦囊牌的目标后，若此牌目标数大于1，你可以将一张牌交给一名其他目标角色，若此牌为：非装备牌，你摸一张牌；装备牌，你摸两张牌。",

  shen_zhangliao: "神张辽",
  shen_zhangliao_prefix: "神",
  duorui1: "失效技能",
  duorui1_bg: "锐",
  duorui: "夺锐",
  duorui_info:
    "当你于出牌阶段内对一名其他角色造成伤害后，你可以废除一个装备栏，然后选择其武将牌上的一个技能（限定技、觉醒技、使命技、持恒技、主公技、隐匿技除外），令其于其下回合结束前此技能失效，然后你于其下回合结束或其死亡前获得此技能且不能发动〖夺锐〗。",
  zhiti: "止啼",
  zhiti_info:
    "锁定技，你攻击范围内已受伤的角色手牌上限-1。当你与这些角色拼点或【决斗】你赢时，你恢复一个装备栏。当你受到这些角色对你造成的伤害后，你恢复一个装备栏。",

  shen_ganning: "神甘宁",
  shen_ganning_prefix: "神",
  poxi: "魄袭",
  poxi_info:
    "出牌阶段限一次，你可以观看一名其他角色的手牌，且可以弃置你与其手牌中四张花色均不同的牌，然后若你以此法被弃置的牌数为：0，你减1点体力上限；1，你结束出牌阶段且你本回合的手牌上限-1；3，你回复1点体力；4，你摸四张牌。",
  gn_jieying: "劫营",
  gn_jieying_info:
    "回合开始时，若没有角色有“营”，你获得“营”。结束阶段，你可以将“营”交给一名其他角色。有“营”的角色摸牌阶段多摸一张牌、使用【杀】的次数上限+1、手牌上限+1。有“营”的其他角色的回合结束后，你弃其“营”，获得其所有手牌。",
}

export default translates
