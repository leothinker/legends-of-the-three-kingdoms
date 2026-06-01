import { lib, game, ui, get, ai, _status } from "wtk"
import { old } from "../../mode/guozhan/src/info/pile"

const translates = {
  ol_caocao: "界曹操",
  ol_caocao_prefix: "界",
  rehujia: "护驾",
  rehujia_info:
    "主公技，当你需要使用或打出【闪】时，你可以令其他魏势力角色选择是否替你使用或打出【闪】（视为由你使用或打出）。当其他魏势力角色于其回合外使用、打出或替你使用或打出【闪】时，其可以令你摸一张牌（每回合限一次）。",

  ol_xuzhu: "界许褚",
  ol_xuzhu_prefix: "界",
  olluoyi: "裸衣",
  olluoyi_info:
    "摸牌阶段开始前，你可以亮出牌堆顶的三张牌，然后你可以跳过摸牌阶段并获得其中的基本牌、武器牌和【决斗】。若如此做，直到你的下个回合开始，你为伤害来源的【杀】或【决斗】造成的伤害+1。",

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

  ol_zhangfei: "界张飞",
  ol_zhangfei_prefix: "界",
  olpaoxiao: "咆哮",
  olpaoxiao2: "咆哮",
  olpaoxiao_info:
    "锁定技，你使用【杀】无次数限制；当你使用的【杀】被抵消后，你本回合下一次造成【杀】的伤害时，此伤害+1。",
  retishen: "替身",
  retishen_info: "限定技，准备阶段，你可以将体力回复至上限，然后摸X张牌（X为你本次回复的体力值）。",

  ol_zhaoyun: "界赵云",
  ol_zhaoyun_prefix: "界",
  relongdan: "龙胆",
  relongdan_info:
    "你可以将一张【闪】当【杀】、【杀】当【闪】、【酒】当【桃】、【桃】当【酒】使用或打出。",
  reyajiao: "涯角",
  reyajiao_info:
    "当你于回合外使用或打出手牌时，你可以展示牌堆顶的一张牌。若这两张牌的类别：相同，你可以将此牌交给一名角色；不同，你可以弃置攻击范围内包含你的角色区域里的一张牌。",

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

  ol_sunshangxiang: "界孙尚香",
  ol_sunshangxiang_prefix: "界",

  ol_diaochan: "界貂蝉",
  ol_diaochan_prefix: "界",
  relijian: "离间",
  relijian_info:
    "出牌阶段限一次，你可以弃置一张牌并选择两名其他男性角色，然后令其中一名角色视为对另一名角色使用一张【决斗】（不能被【无懈可击】响应）。",

  ol_huaxiong: "界华雄",
  ol_huaxiong_prefix: "界",
  olyaowu: "耀武",
  olyaowu_info:
    "锁定技，当你受到伤害时，若对你造成伤害的牌：为红色，伤害来源摸一张牌；不为红色，你摸一张牌。",
  shizhan: "势斩",
  shizhan_info: "出牌阶段限两次，你可以令一名其他角色视为对你使用一张【决斗】。",

  ol_gongsunzan: "界公孙瓒",
  ol_gongsunzan_prefix: "界",
  reyicong: "义从",
  reyicong_info:
    "锁定技，你计算与其他角色的距离-1；若你已损失的体力值不小于2，其他角色计算与你的距离+1。",
  reqiaomeng: "趫猛",
  reqiaomeng_info:
    "当你使用的黑色牌指定其他角色为目标后，你可以弃置其中一个目标一张牌。若此牌为：装备牌，你获得之；锦囊牌，此黑色牌无法被响应。",

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
  refenji: "奋激",
  refenji_info:
    "每回合每名角色限一次，当一名角色非因使用或打出而失去手牌后，你可以失去1点体力，然后失去手牌的角色摸两张牌。",

  ol_zhangjiao: "界张角",
  ol_zhangjiao_prefix: "界",
  olleiji: "雷击",
  olleiji_misa: "雷击",
  olleiji_info:
    "当你使用或打出【闪】或使用【闪电】时，你可以进行判定。当你进行判定后，若结果为：黑桃，你对一名角色造成2点雷电伤害；梅花，你回复1点体力，可以对一名角色造成1点雷电伤害。",
  reguidao: "鬼道",
  reguidao_info:
    "当一名角色的判定牌生效前，你可以用一张黑色牌替换之。若此牌为黑桃2-9，你摸一张牌。",
  rehuangtian: "黄天",
  rehuangtian2: "黄天",
  rehuangtian_info: "主公技，其他群势力角色的出牌阶段限一次，其可以交给你一张【闪】或黑桃手牌。",

  ol_yuji: "界于吉",
  ol_yuji_prefix: "界",
  olguhuo: "蛊惑",
  olguhuo_info:
    "每回合限一次，你可以扣置一张手牌，将此牌当任意一张基本牌或普通锦囊牌使用或打出且其他角色可以进行质疑。若有其他角色质疑则翻开此牌，若为假，则此牌作废且质疑者各摸一张牌，否则质疑者各弃置一张牌或失去1点体力，然后获得〖缠怨〗。",
  rechanyuan: "缠怨",
  rechanyuan_info: "锁定技，你不能质疑〖蛊惑〗；若你的体力值小于等于1，你的其他技能失效。",

  ol_dianwei: "界典韦",
  ol_dianwei_prefix: "界",
  olqiangxi: "强袭",
  olqiangxi_info:
    "出牌阶段限两次，你可以受到1点伤害或弃置一张武器牌，对你本回合未以此法选择过的一名其他角色造成1点伤害。",
  ninge: "狞恶",
  ninge_info:
    "锁定技，当一名角色每回合第二次受到伤害后，若其为你或伤害来源为你，你摸一张牌并弃置其场上一张牌。",
}

export default translates
