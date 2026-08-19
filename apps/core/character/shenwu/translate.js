import { get } from "wtk"

const translates = {
  ol_caocao: "界曹操",
  ol_caocao_prefix: "界",
  rehujia: "护驾",
  rehujia_info:
    "主公技，当你需要使用或打出【闪】时，你可以令其他魏势力角色选择是否替你使用或打出【闪】（视为由你使用或打出）。当其他魏势力角色于其回合外使用、打出或替你使用或打出【闪】时，其可以令你摸一张牌（每回合限一次）。",

  ol_simayi: "界司马懿",
  ol_simayi_prefix: "界",

  ol_xiahoudun: "界夏侯惇",
  ol_xiahoudun_prefix: "界",
  olganglie: "刚烈",
  olganglie_info:
    "当你受到其他角色造成的1点伤害后，你可以进行判定，若结果为：红色，你对伤害来源造成1点伤害；黑色，你弃置其一张牌。",

  ol_zhangliao: "界张辽",
  ol_zhangliao_prefix: "界",

  ol_xuzhu: "界许褚",
  ol_xuzhu_prefix: "界",
  olluoyi: "裸衣",
  olluoyi_info:
    "摸牌阶段开始前，你可以亮出牌堆顶的三张牌，然后你可以跳过摸牌阶段并获得其中的基本牌、武器牌和【决斗】。若如此做，直到你的下个回合开始，你为伤害来源的【杀】或【决斗】造成的伤害+1。",

  ol_guojia: "界郭嘉",
  ol_guojia_prefix: "界",

  ol_zhenji: "界甄姬",
  ol_zhenji_prefix: "界",
  reluoshen: "洛神",
  reluoshen_info:
    "准备阶段，你可以进行判定，当黑色判定牌生效后，你获得之并可以重复此流程。你的手牌上限+X（X为你本回合因〖洛神〗获得的牌数）。",

  ol_liubei: "界刘备",
  ol_liubei_prefix: "界",
  rejijiang: "激将",
  rejijiang1: "激将",
  rejijiang2: "激将",
  rejijiang_info:
    "主公技，当你需要使用或打出【杀】时，你可以令其他蜀势力角色选择是否替你使用或打出【杀】（视为由你使用或打出）。当其他蜀势力角色于其回合外使用、打出或替你使用或打出【杀】时，其可以令你摸一张牌（每回合限一次）。",

  ol_guanyu: "界关羽",
  ol_guanyu_prefix: "界",

  ol_zhangfei: "界张飞",
  ol_zhangfei_prefix: "界",
  olpaoxiao: "咆哮",
  olpaoxiao2: "咆哮",
  olpaoxiao_info:
    "锁定技，你使用【杀】无次数限制；当你使用的【杀】被抵消后，你本回合下一次造成【杀】的伤害时，此伤害+1。",
  retishen: "替身",
  retishen_info:
    "限定技，准备阶段，你可以将体力回复至上限，然后摸X张牌（X为你本次回复的体力值）。",

  ol_zhugeliang: "界诸葛亮",
  ol_zhugeliang_prefix: "界",

  ol_zhaoyun: "界赵云",
  ol_zhaoyun_prefix: "界",
  relongdan: "龙胆",
  relongdan_info:
    "你可以将一张【闪】当【杀】、【杀】当【闪】、【酒】当【桃】、【桃】当【酒】使用或打出。",
  reyajiao: "涯角",
  reyajiao_info:
    "当你于回合外使用或打出手牌时，你可以展示牌堆顶的一张牌。若这两张牌的类别：相同，你可以将此牌交给一名角色；不同，你可以弃置攻击范围内包含你的角色区域里的一张牌。",

  ol_machao: "界马超",
  ol_machao_prefix: "界",

  ol_huangyueying: "界黄月英",
  ol_huangyueying_prefix: "界",
  oljizhi: "集智",
  oljizhi_info:
    "当你使用非转化的锦囊牌时，你可以摸一张牌。然后你可以弃置一张基本牌，若如此做，本回合你的手牌上限+1。",

  ol_sunquan: "界孙权",
  ol_sunquan_prefix: "界",
  oljiuyuan: "救援",
  oljiuyuan_info:
    "主公技，当其他吴势力角色于其回合内回复体力时，若其体力值不小于你，其可以改为令你回复1点体力，然后其摸一张牌。",

  ol_ganning: "界甘宁",
  ol_ganning_prefix: "界",

  ol_lvmeng: "界吕蒙",
  ol_lvmeng_prefix: "界",
  reqinxue: "勤学",
  reqinxue_info:
    "觉醒技，准备阶段或结束阶段，若你的手牌数减体力值至少为2，你减1点体力上限，回复1点体力或摸两张牌，然后获得技能〖攻心〗。",
  botu: "博图",
  botu_info:
    "每轮限X次（X为存活角色数且至多为3），回合结束后，若本回合置入弃牌堆的牌包含四种花色，你可以获得一个额外回合。",

  ol_huanggai: "界黄盖",
  ol_huanggai_prefix: "界",
  rezhaxiang: "诈降",
  rezhaxiang_info:
    "锁定技，当你失去1点体力后，你摸三张牌，然后若此时为你的出牌阶段内，则此回合你使用【杀】的次数上限+1、使用红色【杀】无距离限制且不能被【闪】响应。",

  ol_zhouyu: "界周瑜",
  ol_zhouyu_prefix: "界",

  ol_daqiao: "界大乔",
  ol_daqiao_prefix: "界",

  ol_luxun: "界陆逊",
  ol_luxun_prefix: "界",

  ol_sunshangxiang: "界孙尚香",
  ol_sunshangxiang_prefix: "界",

  ol_huatuo: "界华佗",
  ol_huatuo_prefix: "界",

  ol_lvbu: "界吕布",
  ol_lvbu_prefix: "界",

  ol_diaochan: "界貂蝉",
  ol_diaochan_prefix: "界",
  relijian: "离间",
  relijian_info:
    "出牌阶段限一次，你可以弃置一张牌并选择两名其他男性角色，然后令其中一名角色视为对另一名角色使用一张【决斗】（不能被【无懈可击】响应）。",

  ol_gongsunzan: "界公孙瓒",
  ol_gongsunzan_prefix: "界",
  reyicong: "义从",
  reyicong_info:
    "锁定技，你计算与其他角色的距离-1；若你已损失的体力值不小于2，其他角色计算与你的距离+1。",
  reqiaomeng: "趫猛",
  reqiaomeng_info:
    "当你使用的黑色牌指定其他角色为目标后，你可以弃置其中一个目标一张牌。若此牌为：装备牌，你获得之；锦囊牌，此黑色牌无法被响应。",

  ol_huaxiong: "界华雄",
  ol_huaxiong_prefix: "界",
  olyaowu: "耀武",
  olyaowu_info:
    "锁定技，当你受到伤害时，若对你造成伤害的牌：为红色，伤害来源摸一张牌；不为红色，你摸一张牌。",
  shizhan: "势斩",
  shizhan_info:
    "出牌阶段限两次，你可以令一名其他角色视为对你使用一张【决斗】。",

  ol_caoren: "界曹仁",
  ol_caoren_prefix: "界",
  rejiewei: "解围",
  rejiewei_info:
    "你可以将装备区里的一张牌当【无懈可击】使用；当你翻面至正面朝上时，你可以弃置一张牌，然后可以移动场上的一张牌。",

  ol_xiahouyuan: "界夏侯渊",
  ol_xiahouyuan_prefix: "界",
  shebian: "设变",
  shebian_info: "当你翻面时，你可以移动场上的一张装备牌。",

  ol_huangzhong: "界黄忠",
  ol_huangzhong_prefix: "界",
  olliegong: "烈弓",
  olliegong_info:
    "你使用【杀】无距离限制。当你使用【杀】指定一名角色为目标后，你可以根据下列条件执行相应的效果：1.其手牌数不大于你的手牌数，其不能使用【闪】响应此【杀】；2.其体力值不小于你的体力值，此【杀】伤害+1。",

  ol_weiyan: "界魏延",
  ol_weiyan_prefix: "界",
  reqimou: "奇谋",
  reqimou_info:
    "限定技，出牌阶段，你可以失去任意点体力，摸X张牌，然后直到回合结束，你计算与其他角色的距离-X，且你可以多使用X张【杀】（X为你以此法失去的体力值）。",

  ol_xiaoqiao: "界小乔",
  ol_xiaoqiao_prefix: "界",
  oltianxiang: "天香",
  oltianxiang_info:
    "当你受到伤害时，你可以弃置一张红桃牌并选择一名其他角色，然后防止此伤害并选择一项：1.令来源对其造成1点伤害，然后其摸X张牌（X为其已损失的体力值且至多为5）；2.令其失去1点体力，然后其获得你弃置的牌。",
  rehongyan: "红颜",
  rehongyan_info:
    "锁定技，你的黑桃牌和你的黑桃判定牌视为红桃牌。若你的装备区里有红桃牌，你的手牌上限等于体力上限。",
  piaoling: "飘零",
  piaoling_info:
    "结束阶段，你可以进行一次判定，若结果为红桃，你将判定牌置于牌堆顶或交给一名角色，若其为你，你弃置一张牌。",

  ol_zhoutai: "界周泰",
  ol_zhoutai_prefix: "界",
  olbuqu: "不屈",
  olbuqu_info:
    "锁定技，当你非因〖不屈〗进入濒死状态时，你将体力回复至1点并重置〖奋激〗，然后将牌堆顶的一张牌置于你的武将牌上，称为“创”，若与另一张“创”点数相同，移去此“创”；当你移去“创”时，你失去等量的体力；你的手牌上限+X（X为“创”的数量）。",
  refenji: "奋激",
  refenji_info:
    "每回合每名角色限一次，当一名角色非因使用或打出而失去手牌后，你可以失去1点体力，然后失去手牌的角色摸两张牌。",

  ol_zhangjiao: "界张角",
  ol_zhangjiao_prefix: "界",
  olleiji: "雷击",
  olleiji_misa: "雷击",
  olleiji_info:
    "当你使用或打出【闪】或使用【闪电】时，你可以进行判定。当你进行判定后，若结果为：黑桃，你可以对一名角色造成2点雷电伤害；梅花，你回复1点体力，可以对一名角色造成1点雷电伤害。",
  reguidao: "鬼道",
  reguidao_info:
    "当一名角色的判定牌生效前，你可以用一张黑色牌替换之。若此牌为黑桃2-9，你摸一张牌。",
  rehuangtian: "黄天",
  rehuangtian2: "黄天",
  rehuangtian_info:
    "主公技，其他群势力角色的出牌阶段限一次，其可以交给你一张【闪】或黑桃手牌。",

  ol_yuji: "界于吉",
  ol_yuji_prefix: "界",
  olguhuo: "蛊惑",
  olguhuo_info:
    "每回合限一次，你可以扣置一张手牌，将此牌当任意一张基本牌或普通锦囊牌使用或打出且其他角色可以进行质疑。若有其他角色质疑则翻开此牌，若为假，则此牌作废且质疑者各摸一张牌，否则质疑者各弃置一张牌或失去1点体力，然后获得〖缠怨〗。",
  rechanyuan: "缠怨",
  rechanyuan_info:
    "锁定技，你不能质疑〖蛊惑〗；若你的体力值小于等于1，你的其他技能失效。",

  ol_shen_guanyu: "神关羽",
  ol_shen_guanyu_prefix: "神",
  rewushen: "武神",
  rewushen_info:
    "锁定技，你的红桃手牌视为【杀】；你使用红桃【杀】无距离和次数限制。",

  ol_shen_lvmeng: "神吕蒙",
  ol_shen_lvmeng_prefix: "神",

  ol_dianwei: "界典韦",
  ol_dianwei_prefix: "界",
  olqiangxi: "强袭",
  olqiangxi_info:
    "出牌阶段限两次，你可以受到1点伤害或弃置一张武器牌，对你本回合未以此法选择过的一名其他角色造成1点伤害。",
  ninge: "狞恶",
  ninge_info:
    "锁定技，当一名角色每回合第二次受到伤害后，若其为你或伤害来源为你，你摸一张牌并弃置其场上一张牌。",

  ol_xunyu: "界荀彧",
  ol_xunyu_prefix: "界",
  oljieming: "节命",
  oljieming_info:
    "当你受到1点伤害后或死亡时，你可以令一名角色摸X张牌，然后将手牌弃置至X张（X为其体力上限且至多为5）。",

  ol_sp_zhugeliang: "界卧龙诸葛",
  ol_sp_zhugeliang_prefix: "界",
  olhuoji: "火计",
  olhuoji_info:
    "你可以将一张红色牌当【火攻】使用；你的【火攻】改为展示目标角色一张手牌，你弃置与其展示牌颜色相同的手牌以造成伤害。",
  olkanpo: "看破",
  olkanpo_info:
    "你可以将一张黑色牌当【无懈可击】使用；你的【无懈可击】不能被响应。",
  cangzhuo: "藏拙",
  cangzhuo_info:
    "弃牌阶段开始时，若你本回合未使用过锦囊牌，你可以展示任意张锦囊牌，令这些牌此阶段不计入手牌上限。",

  ol_pangtong: "界庞统",
  ol_pangtong_prefix: "界",
  ollianhuan: "连环",
  ollianhuan_info:
    "你可以将一张梅花牌当【铁索连环】使用或重铸；你使用【铁索连环】可以多指定一名角色为目标。",
  olniepan: "涅槃",
  olniepan_info:
    "限定技，当你处于濒死状态时，你可以弃置区域里的所有牌，复原武将牌，然后摸三张牌并将体力回复至3点，选择下列一个技能并获得之：〖八阵〗、〖火计〗或〖看破〗。",

  ol_taishici: "界太史慈",
  ol_taishici_prefix: "界",
  hanzhan: "酣战",
  hanzhan_gain: "酣战",
  hanzhan_info:
    "当你与其他角色拼点或其他角色与你拼点时，你可以选择其一张手牌，其用此牌与你拼点。当你拼点后，你可以获得其中点数最大的【杀】。",

  ol_pangde: "界庞德",
  ol_pangde_prefix: "界",
  rejianchu: "鞬出",
  rejianchu_info:
    "当你使用【杀】指定一名角色为目标后，你可以弃置其一张牌，若弃置的牌：为基本牌，其获得此【杀】；不为基本牌，其不能使用【闪】且你本回合可以多使用一张【杀】。",

  ol_yuanshao: "界袁绍",
  ol_yuanshao_prefix: "界",
  olluanji: "乱击",
  olluanji_info:
    "你可以将两张花色相同的手牌当【万箭齐发】使用。你使用【万箭齐发】可以少选择一个目标。",
  rexueyi: "血裔",
  rexueyi_info:
    "主公技，游戏开始时，你获得2X枚“裔”（X为群势力角色数）。出牌阶段开始时，你可以弃1枚“裔”，然后摸一张牌。每有1枚“裔”，你的手牌上限便+1。",

  ol_yanwen: "界颜良文丑",
  ol_yanwen_prefix: "界",
  olshuangxiong: "双雄",
  olshuangxiong_info:
    "摸牌阶段结束时，你可以弃置一张牌，然后本回合你可以将一张与之颜色不同的牌当【决斗】使用。结束阶段，你获得本回合对你造成伤害的牌。",

  ol_shen_zhouyu: "神周瑜",
  ol_shen_zhouyu_prefix: "神",

  ol_shen_zhugeliang: "神诸葛亮",
  ol_shen_zhugeliang_prefix: "神",

  ol_caopi: "界曹丕",
  ol_caopi_prefix: "界",

  ol_xuhuang: "界徐晃",
  ol_xuhuang_prefix: "界",
  olduanliang: "断粮",
  olduanliang_info:
    "你可以将一张黑色非锦囊牌当【兵粮寸断】使用；若你本回合未造成过伤害，你使用【兵粮寸断】无距离限制。",
  rejiezi: "截辎",
  rejiezi_info:
    "当一名角色跳过摸牌阶段后，你可以选择一名角色，若其手牌数为全场最少且没有“辎”，其获得“辎”，否则其摸一张牌。有“辎”的角色摸牌阶段结束时，其弃其“辎”，执行一个额外的摸牌阶段。",

  ol_zhurong: "界祝融",
  ol_zhurong_prefix: "界",
  changbiao: "长标",
  changbiao_info:
    "出牌阶段限一次，你可以将任意张手牌当一张无距离限制的【杀】使用。若此【杀】对目标角色造成伤害，出牌阶段结束时，你摸等量的牌。",

  ol_menghuo: "界孟获",
  ol_menghuo_prefix: "界",
  olzaiqi: "再起",
  olzaiqi_info:
    "结束阶段，你可以令至多X名角色各选择一项（X为本回合置入弃牌堆的红色牌数）：1.摸一张牌；2.令你回复1点体力。",

  ol_lusu: "界鲁肃",
  ol_lusu_prefix: "界",
  olhaoshi: "好施",
  olhaoshi_info:
    "摸牌阶段，你可以多摸两张牌，然后若你的手牌数大于5，你将半数（向下取整）手牌交给手牌最少的一名其他角色。若如此做，直到你下回合开始，当你成为【杀】或普通锦囊牌的目标后，其可以交给你一张手牌。",
  oldimeng: "缔盟",
  oldimeng_info:
    "出牌阶段限一次，你可以令两名手牌数之差不大于你的牌数的其他角色交换手牌，然后此阶段结束时，你弃置X张牌（X为这两名角色手牌数之差）。",

  ol_sunjian: "界孙坚",
  ol_sunjian_prefix: "界",
  wulie: "武烈",
  wulie2: "武烈",
  wulie_info:
    "限定技，结束阶段，你可以失去任意点体力，令等量名其他角色各获得“烈”；有“烈”的角色受到伤害时，弃其“烈”并防止此伤害。",

  ol_dongzhuo: "界董卓",
  ol_dongzhuo_prefix: "界",
  oljiuchi: "酒池",
  oljiuchi_info:
    "你可以将一张黑桃手牌当【酒】使用。你使用【酒】无次数限制。当你使用【酒】【杀】造成伤害后，本回合〖崩坏〗失效。",
  olbaonue: "暴虐",
  olbaonue_info:
    "主公技，当其他群势力角色造成伤害后，你可以进行判定，若结果为黑桃，你回复1点体力并获得此判定牌。",

  ol_jiaxu: "界贾诩",
  ol_jiaxu_prefix: "界",
  olweimu: "帷幕",
  olweimu_info:
    "锁定技，你不能成为黑色锦囊牌的目标。你防止于回合内受到的伤害并摸两倍伤害值数的牌。",
  olwansha: "完杀",
  olwansha_info:
    "锁定技，你的回合内：若有角色处于濒死状态，只有你和处于濒死状态的角色才能使用【桃】；任意角色的濒死结算中，除处于濒死状态的角色外的其他角色非锁定技失效。",
  olluanwu: "乱武",
  olluanwu_info:
    "限定技，出牌阶段，你可以令所有其他角色依次选择一项：1.对距离最近的另一名角色使用【杀】；2.失去1点体力。然后你可以视为使用一张无距离限制的【杀】。",

  ol_shen_lvbu: "神吕布",
  ol_shen_lvbu_prefix: "神",

  ol_shen_caocao: "神曹操",
  ol_shen_caocao_prefix: "神",

  ol_dengai: "界邓艾",
  ol_dengai_prefix: "界",
  oltuntian: "屯田",
  oltuntian_info:
    "当你于回合外失去牌后，或于回合内弃置【杀】后，你可以进行判定，若结果不为红桃，你将此判定牌置于你的武将牌上，称为“田”。你计算与其他角色的距离-X（X为“田”的数量）。",
  olzaoxian: "凿险",
  olzaoxian_info:
    "觉醒技，准备阶段，若“田”的数量大于2，你减1点体力上限，然后获得〖急袭〗。你于此回合结束后获得一个额外的回合。",

  ol_zhanghe: "界张郃",
  ol_zhanghe_prefix: "界",
  olqiaobian: "巧变",
  olqiaobian_info:
    "游戏开始时，你获得2枚“变”。你可以弃置一张牌或弃1枚“变”跳过你的一个阶段（准备阶段和结束阶段除外），若以此法跳过：摸牌阶段，你可以获得至多两名其他角色各一张手牌；出牌阶段，你可以移动场上的一张牌。结束阶段，若你的手牌数与此前每个结束阶段均不同，你获得1枚“变”。",

  ol_jiangwei: "界姜维",
  ol_jiangwei_prefix: "界",
  oltiaoxin: "挑衅",
  oltiaoxin_info:
    "出牌阶段限一次，你可以选择一名你在其攻击范围内的角色，然后除非其对你使用一张【杀】且此【杀】对你造成伤害，否则你弃置其一张牌并于本阶段内将此技能修改为“出牌阶段限两次”。",
  olzhiji: "志继",
  olzhiji_info:
    "觉醒技，准备阶段或结束阶段，若你没有手牌，你回复1点体力或摸两张牌，减1点体力上限，然后获得〖观星〗。",

  ol_liushan: "界刘禅",
  ol_liushan_prefix: "界",
  olfangquan: "放权",
  olfangquan_info:
    "你可以跳过出牌阶段，然后弃牌阶段开始时，你可以弃置一张手牌，令一名其他角色于回合结束时执行一个额外的回合。",
  olruoyu: "若愚",
  olruoyu_info:
    "主公技，觉醒技，准备阶段，若你是体力值最小的角色，你加1点体力上限并回复体力至3点，然后获得〖激将〗和〖思蜀〗。",
  sishu: "思蜀",
  sishu_info:
    "出牌阶段开始时，你可以选择一名角色，其本局游戏【乐不思蜀】的判定结果反转。",

  ol_sunce: "界孙策",
  ol_sunce_prefix: "界",
  oljiang: "激昂",
  oljiang_info:
    "当你使用【决斗】或红色【杀】指定目标后，或成为【决斗】或红色【杀】的目标后，你可以摸一张牌。当【决斗】或红色【杀】每回合首次因弃置进入弃牌堆后，你可以失去1点体力获得之。",
  olhunzi: "魂姿",
  olhunzi_info:
    "觉醒技，准备阶段，若你的体力值为1，你减1点体力上限，然后获得〖英姿〗和〖英魂〗。本回合的结束阶段，你摸两张牌或回复1点体力。",
  olzhiba: "制霸",
  olzhiba2: "制霸",
  olzhiba_info:
    "主公技，其他吴势力角色的出牌阶段限一次，其可以与你拼点（你可以拒绝此拼点）；出牌阶段限一次，你可以与其他吴势力角色拼点。若其没赢，你可以获得拼点的两张牌。",

  ol_zhangzhang: "界张昭张纮",
  ol_zhangzhang_prefix: "界",
  olzhijian: "直谏",
  olzhijian_info:
    "出牌阶段，你可以将一张装备牌置入其他角色的装备区（替换原装备），然后摸一张牌。",
  olguzheng: "固政",
  olguzheng_info:
    "每阶段限一次，当其他角色的至少两张牌因弃置而置入弃牌堆后，你可以令其获得其中一张牌，然后你可以获得其余牌。",

  ol_zuoci: "界左慈",
  ol_zuoci_prefix: "界",
  olhuashen: "化身",
  olhuashen_info:
    "游戏开始时，你获得三张武将牌作为“化身”牌，然后亮出其中一张，你获得亮出“化身”牌的一个技能（限定技、觉醒技、主公技除外），且性别和势力视为与之相同；回合开始或结束时，你可以选择一项：1.更改亮出的“化身”牌；2.移去至多两张未亮出的“化身”牌，然后获得等量新的“化身”牌。",
  olxinsheng: "新生",
  olxinsheng_info: "当你受到1点伤害后，你可以获得一张新的“化身”牌。",

  ol_caiwenji: "界蔡文姬",
  ol_caiwenji_prefix: "界",
  olbeige: "悲歌",
  olbeige_info:
    "当一名角色受到【杀】造成的伤害后，若你有牌，你可以令其进行判定，然后你可以弃置一张牌，根据结果执行：红桃，其回复1点体力；方块，其摸两张牌；梅花，伤害来源弃置两张牌；黑桃，伤害来源翻面；点数相同，你获得你弃置的牌；花色相同，你获得判定牌。",

  ol_shen_simayi: "神司马懿",
  ol_shen_simayi_prefix: "神",
  olrenjie: "忍戒",
  olrenjie2: "忍戒",
  olrenjie_info:
    "锁定技，当你受到伤害后/于弃牌阶段内弃置手牌后，你获得伤害值枚/弃置手牌数枚“忍”。",
  olbaiyin: "拜印",
  olbaiyin_info: `觉醒技，准备阶段，若“忍”数大于3，你减1点体力上限，然后获得${get.poptip("olrenjie")}。`,
  oljilue: "极略",
  oljilue_info: `你可以弃1枚“忍”，发动下列一项技能：${get.poptip("oljilue_guicai")}、${get.poptip("oljilue_fangzhu")}、${get.poptip("oljilue_jizhi")}、${get.poptip("oljilue_zhiheng")}或${get.poptip("oljilue_wansha")}。`,
  oljilue_guicai: "鬼才",
  oljilue_guicai_info: "当一名角色的判定牌生效前，你可以打出一张牌代替之。",
  oljilue_fangzhu: "放逐",
  oljilue_fangzhu_info:
    "当你受到伤害后，你可以令一名其他角色选择一项：1.弃置X张牌并失去1点体力；2.摸X张牌并翻面（X为你已损失的体力值）。",
  oljilue_jizhi: "集智",
  oljilue_jizhi_info:
    "当你使用非转化的锦囊牌时，你可以摸一张牌。然后你可以弃置一张基本牌，若如此做，本回合你的手牌上限+1。",
  oljilue_zhiheng: "制衡",
  oljilue_zhiheng_info:
    "出牌阶段限一次，你可以弃置任意张牌，然后摸等量的牌。若你以此法弃置了所有手牌，则你多摸一张牌。",
  oljilue_wansha: "完杀",
  oljilue_wansha_info:
    "锁定技，你的回合内：若有角色处于濒死状态，只有你和处于濒死状态的角色才能使用【桃】；任意角色的濒死结算中，除你和濒死角色外的其他角色非锁定技无效。",

  ol_shen_zhaoyun: "神赵云",
  ol_shen_zhaoyun_prefix: "神",

  ol_wangping: "王平",
  refeijun: "飞军",
  refeijun_info:
    "出牌阶段限一次，你可以弃置一张牌，然后选择一项：1.令一名手牌数大于你的角色交给你一张牌；2.令一名装备区里牌数大于你的角色弃置装备区里的一张牌。",

  ol_sunliang: "孙亮",
  rekuizhu: "溃诛",
  rekuizhu_info:
    "弃牌阶段结束时，你可以选择一项：1.令至多X名角色各摸一张牌；2.对任意名体力值之和为X的角色各造成1点伤害（X为你此阶段弃置的牌数）。",
  rechezheng: "掣政",
  rechezheng_info:
    "锁定技，出牌阶段内，防止你对攻击范围内不包含你的其他角色造成的伤害。出牌阶段结束时，若你此阶段使用的牌数小于这些角色数，你弃置其中一名角色一张牌。",
  relijun1: "立军",
  relijun: "立军",
  relijun_info:
    "主公技，每阶段限一次，当其他吴势力角色于其出牌阶段内使用【杀】结算结束后，其可以将此【杀】交给你，然后你可以令其摸一张牌且此回合使用【杀】的次数上限+1。",
}

export default translates
