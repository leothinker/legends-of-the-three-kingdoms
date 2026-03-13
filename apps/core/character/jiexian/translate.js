const translates = {
	liubei: "刘备",
	rende: "仁德",
	rende_info: "出牌阶段，你可以将任意张手牌交给其他角色，每回合你以此法给出第二张牌时，回复1点体力。",
	jijiang: "激将",
	jijiang_info: "主公技，你可以令其他蜀势力角色选择是否替你使用或打出【杀】。",

	guanyu: "关羽",
	wusheng: "武圣",
	wusheng_info: "你可以将一张红色牌当【杀】使用或打出。",

	zhangfei: "张飞",
	paoxiao: "咆哮",
	paoxiao_info: "锁定技，你使用【杀】无次数限制。",

	zhugeliang: "诸葛亮",
	guanxing: "观星",
	guanxing_info: "准备阶段，你可以观看牌堆顶的X张牌（X为全场角色数且最多为5），然后以任意顺序分配于牌堆顶或牌堆底。",
	kongcheng: "空城",
	kongcheng_info: "锁定技，若你没有手牌，则你不能成为【杀】或【决斗】的目标。",

	zhaoyun: "赵云",
	longdan: "龙胆",
	longdan_info: "你可以将【杀】当【闪】、【闪】当【杀】使用或打出。",

	machao: "马超",
	mashu: "马术",
	mashu_info: "锁定技，你计算与其他角色的距离-1。",
	tieji: "铁骑",
	tieji_info: "你的【杀】指定目标后，你可以进行判定，若结果为红色，该角色不能使用【闪】。",

	huangyueying: "黄月英",
	jizhi: "集智",
	jizhi_info: "当你使用普通锦囊牌时，你可以摸一张牌。",
	qicai: "奇才",
	qicai_info: "锁定技，你使用锦囊牌无距离限制。",

	sunquan: "孙权",
	zhiheng: "制衡",
	zhiheng_info: "出牌阶段限一次，你可以弃置任意张牌，然后摸等量的牌。",
	jiuyuan: "救援",
	jiuyuan_info: "主公技，锁定技，其他吴势力角色对你使用的【桃】回复的体力值+1。",

	ganning: "甘宁",
	qixi: "奇袭",
	qixi_info: "你可以将一张黑色牌当【过河拆桥】使用。",

	lvmeng: "吕蒙",
	keji: "克己",
	keji_info: "若你本回合没有使用或打出过【杀】，则你可以跳过弃牌阶段。",

	huanggai: "黄盖",
	kurou: "苦肉",
	kurou_info: "出牌阶段，你可以失去1点体力，然后摸两张牌。",

	zhouyu: "周瑜",
	yingzi: "英姿",
	yingzi_info: "摸牌阶段，你可以额外摸一张牌。",
	fanjian: "反间",
	fanjian_info: "出牌阶段限一次，你可以令一名其他角色猜一种花色，然后获得你的一张手牌并展示之，如果猜错花色，该角色受到1点伤害。",

	daqiao: "大乔",
	guose: "国色",
	guose_info: "你可以将一张♦牌当【乐不思蜀】使用。",
	liuli: "流离",
	liuli_info: "当你成为【杀】的目标时，你可以弃置一张牌并将此【杀】转移给你攻击范围内的一名其他角色（不能是使用此【杀】的角色）。",

	luxun: "陆逊",
	qianxun: "谦逊",
	qianxun_info: "锁定技，你不能成为【顺手牵羊】和【乐不思蜀】的目标。",
	lianying: "连营",
	lianying_info: "当你失去最后的手牌时，你可以摸一张牌。",

	sunshangxiang: "孙尚香",
	jieyin: "结姻",
	jieyin_info: "出牌阶段限一次，你可以选择一名已受伤的男性角色并弃置两张手牌，然后你与其各回复1点体力。",
	xiaoji: "枭姬",
	xiaoji_info: "当你失去装备区里的一张牌时，你可以摸两张牌。",

	caocao: "曹操",
	jianxiong: "奸雄",
	jianxiong_info: "当你受到伤害后，你可以获得造成伤害的牌。",
	hujia: "护驾",
	hujia_info: "主公技，你可以令其他魏势力角色选择是否替你使用或打出【闪】。",

	simayi: "司马懿",
	fankui: "反馈",
	fankui_info: "当你受到伤害后，你可以获得伤害来源的一张牌。",
	guicai: "鬼才",
	guicai_info: "当一名角色的判定牌生效前，你可以打出一张手牌代替之。",

	xiahoudun: "夏侯惇",
	ganglie: "刚烈",
	ganglie_info: "当你受到伤害后，你可以进行判定，若结果不为♥，则伤害来源选择一项：1.弃置两张手牌；2.受到你造成的1点伤害。",

	zhangliao: "张辽",
	tuxi: "突袭",
	tuxi_info: "摸牌阶段，你可以放弃摸牌，改为获得最多两名其他角色的各一张手牌。",

	xuchu: "许褚",
	luoyi: "裸衣",
	luoyi_info: "摸牌阶段，你可以少摸一张牌，然后本回合你的【杀】或【决斗】造成的伤害+1。",

	guojia: "郭嘉",
	tiandu: "天妒",
	tiandu_info: "当你的判定牌生效后，你可以获得此牌。",
	yiji: "遗计",
	yiji_info: "当你受到1点伤害后，你可以观看牌堆顶的两张牌，然后交给任意名角色。",

	zhenji: "甄姬",
	qingguo: "倾国",
	qingguo_info: "你可以将一张黑色手牌当【闪】使用或打出。",
	luoshen: "洛神",
	luoshen_info: "准备阶段，你可以进行判定，若结果为黑色，你获得之并可以重复此流程。",

	huatuo: "华佗",
	jijiu: "急救",
	jijiu_info: "你的回合外，你可以将一张红色牌当【桃】使用。",
	qingnang: "青囊",
	qingnang_info: "出牌阶段限一次，你可以弃置一张手牌，然后令一名已受伤的角色回复1点体力。",

	lvbu: "吕布",
	wushuang: "无双",
	wushuang_info: "锁定技，你的【杀】需要两张【闪】才能抵消；与你【决斗】的角色每次需要打出两张【杀】。",

	diaochan: "貂蝉",
	lijian: "离间",
	lijian_info: "出牌阶段限一次，你可以弃置一张牌，然后令一名男性角色视为对另一名男性角色使用一张【决斗】。",
	biyue: "闭月",
	biyue_info: "结束阶段，你可以摸一张牌。",

	huaxiong: "华雄",
	yaowu: "耀武",
	yaowu_info: "锁定技，当一名角色使用红色【杀】对你造成伤害时，该角色回复1点体力或摸一张牌。",

	gongsunzan: "公孙瓒",
	yicong: "义从",
	yicong_info: "锁定技，当你的体力值大于2时，你计算与其他角色的距离-1；当你的体力值不大于2时，其他角色计算与你的距离+1。",

	panfeng: "潘凤",
	kuangfu: "狂斧",
	kuangfu_info: "锁定技，出牌阶段限一次，你使用【杀】对其他角色造成伤害后，若其体力值小于你，你摸两张牌，若其体力值不小于你，你失去1点体力。",

	ganfuren: "甘夫人",
	shenzhi: "神智",
	shenzhi_info: "你的回合开始时，你可以弃置所有手牌，然后若你弃置的牌数大于你的体力值，你回复1点体力。",
	shushen: "淑慎",
	shushen_info: "当你回复1点体力后，你可以令一名其他角色摸一张牌，若其没有手牌，改为摸两张牌。",

	yuejin: "乐进",
	xiaoguo: "骁果",
	xiaoguo_info: "其他角色的回合结束时，你可以弃置一张基本牌，若如此做，其需弃置一张装备牌，否则你对其造成1点伤害。",
};

export default translates;
