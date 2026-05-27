import { lib, game, ui, get, ai, _status } from "wtk"

const translates = {
  re_caocao: "界曹操",
  re_caocao_prefix: "界",
  rejianxiong: "奸雄",
  rejianxiong_info: "当你受到伤害后，你可以获得对你造成伤害的牌，摸一张牌。",

  re_simayi: "界司马懿",
  re_simayi_prefix: "界",
  refankui: "反馈",
  refankui_info: "当你受到1点伤害后，你可以获得伤害来源的一张牌。",
  reguicai: "鬼才",
  reguicai_info: "当一名角色的判定牌生效前，你可以打出一张牌代替之。",

  re_xiahoudun: "界夏侯惇",
  re_xiahoudun_prefix: "界",
  reganglie: "刚烈",
  reganglie_info:
    "当你受到1点伤害后，你可以进行判定，若结果为：红色，你对伤害来源造成1点伤害；黑色，你弃置其一张牌。",
  qingjian: "清俭",
  qingjian_info:
    "每回合限一次，当你于摸牌阶段外获得牌后，你可以展示任意张牌并将这些牌交给一名其他角色，然后当前回合角色本回合手牌上限+X（X为你以此法展示的牌包含的类别数）。",
  qingjian_add: "清俭",
  qingjian_add_info: "",

  re_zhangliao: "界张辽",
  re_zhangliao_prefix: "界",
  retuxi: "突袭",
  retuxi_info: "摸牌阶段，你可以少摸任意张牌并获得等量其他角色的各一张手牌。",

  re_xuchu: "界许褚",
  re_xuchu_prefix: "界",
  reluoyi: "裸衣",
  reluoyi2: "裸衣",
  reluoyi_info:
    "摸牌阶段开始时，你亮出牌堆顶的三张牌，然后你可以获得其中的基本牌、武器牌和【决斗】。若如此做，你放弃摸牌，且直到你的下个回合开始，你为伤害来源的【杀】或【决斗】造成的伤害+1。",

  re_guojia: "界郭嘉",
  re_guojia_prefix: "界",
  reyiji: "遗计",
  reyiji_info: "当你受到1点伤害后，你可以摸两张牌，然后可以将至多两张手牌交给其他角色。",

  re_zhenji: "界甄姬",
  re_zhenji_prefix: "界",
  reqingguo: "倾国",
  reqingguo_info: "你可以将一张黑色牌当【闪】使用或打出。",

  lidian: "李典",
  xunxun: "恂恂",
  xunxun_info:
    "摸牌阶段开始时，你可以观看牌堆顶的四张牌，将其中两张牌以任意顺序置于牌堆顶，其余以任意顺序置于牌堆底。",
  wangxi: "忘隙",
  wangxi_info:
    "当你对其他角色造成1点伤害后，或当你受到其他角色造成的1点伤害后，你可以与其各摸一张牌。",

  re_liubei: "界刘备",
  re_liubei_prefix: "界",
  rerende: "仁德",
  rerende_info:
    "出牌阶段每名角色限一次，你可以将任意张手牌交给一名其他角色，每阶段你以此法给出第二张牌时，你可以视为使用一张基本牌（以此法使用的【杀】有距离限制且计入次数限制）。",

  re_guanyu: "界关羽",
  re_guanyu_prefix: "界",
  rewusheng: "武圣",
  rewusheng_info: "你可以将一张红色牌当【杀】使用或打出；你使用方块【杀】无距离限制。",
  yijue: "义绝",
  yijue_info:
    "出牌阶段限一次，你可以弃置一张牌，然后令一名其他角色展示一张手牌，若此牌为：黑色，直到回合结束，其不能使用或打出手牌且所有非锁定技失效，你对其使用红桃【杀】造成的伤害+1；红色，你获得之，然后你可以令其回复1点体力。",

  re_zhangfei: "界张飞",
  re_zhangfei_prefix: "界",
  repaoxiao: "咆哮",
  repaoxiao_info:
    "锁定技，你使用【杀】无次数限制；若你于当前出牌阶段使用过【杀】，则你于此阶段使用【杀】无距离限制。",
  tishen: "替身",
  tishen_info:
    "出牌阶段结束时，你可以展示所有牌并弃置其中所有锦囊牌和坐骑牌，然后直到你的下回合开始，你获得所有以你为目标且未对你造成伤害的【杀】。",
  tishen2: "替身",
  tishen2_info: "",

  re_zhugeliang: "界诸葛亮",
  re_zhugeliang_prefix: "界",
  reguanxing: "观星",
  reguanxing_info:
    "准备阶段，你可以观看牌堆顶的五张牌（若存活角色数小于4则改为三张），然后将这些牌以任意顺序置于牌堆顶或牌堆底。若你将这些牌均置于牌堆底，结束阶段，你可以再发动一次〖观星〗。",

  re_zhaoyun: "界赵云",
  re_zhaoyun_prefix: "界",
  yajiao: "涯角",
  yajiao_info:
    "当你于回合外使用或打出手牌时，你可以亮出牌堆顶的一张牌并交给一名角色。若这两张牌的类别不同，你弃置一张牌。",

  re_machao: "界马超",
  re_machao_prefix: "界",
  retieji: "铁骑",
  retieji_info:
    "当你使用【杀】指定一名角色为目标后，你可以令其本回合所有非锁定技失效，然后你进行判定，除非其弃置与结果花色相同的一张牌，否则不能使用【闪】响应此【杀】。",

  re_huangyueying: "界黄月英",
  re_huangyueying_prefix: "界",
  rejizhi: "集智",
  rejizhi_info:
    "当你使用非转化的普通锦囊牌时，你可以摸一张牌。若此牌为基本牌，你可以弃置此牌，然后本回合手牌上限+1。",
  reqicai: "奇才",
  reqicai_info: "锁定技，你使用锦囊牌无距离限制；其他角色不能弃置你装备区里的防具牌与宝物牌。",

  xushu: "徐庶",
  zhuhai: "诛害",
  zhuhai_info: "其他角色的结束阶段，若其本回合造成过伤害，你可以对其使用一张【杀】。",
  qianxin: "潜心",
  qianxin_info: "觉醒技，当你造成伤害后，若你已受伤，你减1点体力上限，然后获得技能〖荐言〗。",
  jianyan: "荐言",
  jianyan_info:
    "出牌阶段限一次，你可以声明一种牌的类别或颜色，然后将牌堆中第一张符合你声明的牌交给一名男性角色。",

  re_sunquan: "界孙权",
  re_sunquan_prefix: "界",
  rezhiheng: "制衡",
  rezhiheng_info:
    "出牌阶段限一次，你可以弃置任意张牌，然后摸等量的牌。若你以此法弃置了所有手牌，你多摸一张牌。",
  rejiuyuan: "救援",
  rejiuyuan_info:
    "主公技，当其他吴势力角色对其使用【桃】时，若其体力值大于你，其可以改为令你回复1点体力，然后其摸一张牌。",

  re_ganning: "界甘宁",
  re_ganning_prefix: "界",
  fenwei: "奋威",
  fenwei_info: "限定技，当一张锦囊牌指定多个目标后，你可以令此牌对其中任意个目标无效。",

  re_lvmeng: "界吕蒙",
  re_lvmeng_prefix: "界",
  qinxue: "勤学",
  qinxue_info:
    "觉醒技，准备阶段，若你的手牌数减体力值至少为3（游戏人数不小于7则改为2），你减1点体力上限，然后获得技能〖攻心〗。",

  re_huanggai: "界黄盖",
  re_huanggai_prefix: "界",
  rekurou: "苦肉",
  rekurou_info: "出牌阶段限一次，你可以弃置一张牌，然后失去1点体力。",
  zhaxiang: "诈降",
  zhaxiang2: "诈降",
  zhaxiang_info:
    "锁定技，当你失去1点体力后，你摸三张牌，然后若此时为你的出牌阶段内，则此阶段你使用【杀】的次数上限+1、使用红色【杀】无距离限制且不能被【闪】响应。",

  re_zhouyu: "界周瑜",
  re_zhouyu_prefix: "界",
  reyingzi: "英姿",
  reyingzi_info: "锁定技，摸牌阶段，你多摸一张牌；你的手牌上限等于你的体力上限。",
  refanjian: "反间",
  refanjian_card: "弃牌",
  refanjian_hp: "失去体力",
  refanjian_info:
    "出牌阶段限一次，你可以展示一张手牌并交给一名其他角色，令其选择一项：1.展示所有手牌，然后弃置与此牌花色相同的所有牌；2.失去1点体力。",

  redaqiao: "界大乔",
  redaqiao_prefix: "界",
  reguose: "国色",
  reguose_info:
    "出牌阶段限一次，你可以选择一项：1.将一张♦牌当【乐不思蜀】使用；2.弃置一张♦牌并弃置场上的一张【乐不思蜀】。选择完成后，你摸一张牌。",
  liuli: "流离",
  liuli_info:
    "当你成为【杀】的目标时，你可以弃置一张牌并将此【杀】转移给你攻击范围内的一名其他角色（不能是使用此【杀】的角色）。",

  reluxun: "界陆逊",
  reluxun_prefix: "界",
  reqianxun: "谦逊",
  reqianxun2: "谦逊",
  reqianxun_info:
    "当一张延时锦囊牌或其他角色使用的普通锦囊牌对你生效时，若你是此牌唯一目标，则你可以将所有手牌扣置于武将牌上，然后此回合结束时，你获得这些牌。",
  relianying: "连营",
  relianying_info:
    "当你失去手牌后，若你没有手牌，则你可以令至多X名角色各摸一张牌（X为你此次失去的手牌数）。",

  resunshangxiang: "界孙尚香",
  resunshangxiang_prefix: "界",
  rejieyin: "结姻",
  rejieyin_info:
    "出牌阶段限一次，你可以选择一名男性角色并弃置一张手牌或将一张装备牌放入其装备区。然后你与其体力值较高的角色摸一张牌，体力值较低的角色回复1点体力。",
  rexiaoji: "枭姬",
  rexiaoji_info: "当你失去装备区里的牌后，你可以摸两张牌。",

  rehuatuo: "界华佗",
  rehuatuo_prefix: "界",
  jijiu: "急救",
  jijiu_info: "你的回合外，你可以将一张红色牌当【桃】使用。",
  chuli: "除疠",
  chuli_info:
    "出牌阶段限一次，你可以选择任意名势力各不相同的其他角色，然后你弃置你和这些角色的各一张牌。被弃置♠牌的角色各摸一张牌。",

  relvbu: "界吕布",
  relvbu_prefix: "界",
  wushuang: "无双",
  wushuang_info:
    "锁定技，你的【杀】需要两张【闪】才能抵消；与你【决斗】的角色每次需要打出两张【杀】。",
  liyu: "利驭",
  liyu_info:
    "当你的【杀】对一名其他角色造成伤害后，你可以获得其所属区域内的一张牌，然后若获得的牌：不是装备牌，其摸一张牌；是装备牌，则视为你对其选择的另一名角色使用一张【决斗】。",

  rediaochan: "界貂蝉",
  rediaochan_prefix: "界",
  lijian: "离间",
  lijian_info:
    "出牌阶段限一次，你可以弃置一张牌并选择两名男性角色，然后令其中一名男性角色视为对另一名男性角色使用一张【决斗】。",
  rebiyue: "闭月",
  rebiyue_info: "结束阶段，若你：有手牌，你可以摸一张牌；没有手牌，你可以摸两张牌。",

  rehuaxiong: "界华雄",
  rehuaxiong_prefix: "界",
  reyaowu: "耀武",
  reyaowu_info:
    "锁定技，当你受到【杀】造成的伤害时，若此【杀】为红色，伤害来源回复1点体力或摸一张牌；若此【杀】不为红色，则你摸一张牌。",

  regongsunzan: "界公孙瓒",
  regongsunzan_prefix: "界",
  yicong: "义从",
  yicong_info:
    "锁定技，若你的体力值大于2，你计算与其他角色的距离-1；若你的体力值不大于2，其他角色计算与你的距离+1。",
  qiaomeng: "趫猛",
  qiaomeng_info:
    "当你的黑色【杀】对一名角色造成伤害后，你可以弃置其装备区里的一张牌。然后当此牌放入弃牌堆后，若此牌为坐骑牌，你获得之。",

  std_yiji: "伊籍",
  jijie: "机捷",
  jijie_info: "出牌阶段限一次，你可以观看牌堆底的一张牌，然后交给一名角色。",
  jiyuan: "急援",
  jiyuan_info: "当一名角色进入濒死状态或你交给一名其他角色牌时，你可以令其摸一张牌。",

  caozhang: "曹彰",
  jiangchi: "将驰",
  jiangchi_info:
    "摸牌阶段结束时，你可以选择一项：1.摸一张牌，然后你于此回合内不能使用或打出【杀】；2.弃置一张牌，然后你于此回合内使用【杀】无距离限制且可以多使用一张【杀】。",
}

export default translates
