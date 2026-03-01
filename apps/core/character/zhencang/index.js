import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import translates from "./translate.js";
import refreshSkills from "../refresh/skill.js";
import refreshTranslates from "../refresh/translate.js";
import refreshVoices from "../refresh/voices.js";
import refreshCharacters from "../refresh/character.js";
import shenhuaSkills from "../shenhua/skill.js";
import shenhuaTranslates from "../shenhua/translate.js";
import shenhuaVoices from "../shenhua/voices.js";
import shenhuaCharacters from "../shenhua/character.js";
import extraSkills from "../extra/skill.js";
import extraTranslates from "../extra/translate.js";
import extraVoices from "../extra/voices.js";
import extraCharacters from "../extra/character.js";

game.import("character", function () {
	const newCharacters = {
		...characters,
		// 界风林火山
		caoren: refreshCharacters.caoren,
		ol_xiahouyuan: refreshCharacters.ol_xiahouyuan,
		ol_weiyan: refreshCharacters.ol_weiyan,
		ol_xiaoqiao: refreshCharacters.ol_xiaoqiao,
		zhoutai: refreshCharacters.zhoutai,
		re_zhangjiao: refreshCharacters.re_zhangjiao,
		xin_yuji: refreshCharacters.xin_yuji,
		ol_huangzhong: refreshCharacters.ol_huangzhong,
		ol_sp_zhugeliang: refreshCharacters.ol_sp_zhugeliang,
		ol_xunyu: refreshCharacters.ol_xunyu,
		ol_dianwei: refreshCharacters.ol_dianwei,
		ol_yanwen: refreshCharacters.ol_yanwen,
		ol_pangtong: refreshCharacters.ol_pangtong,
		ol_yuanshao: refreshCharacters.ol_yuanshao,
		ol_pangde: refreshCharacters.ol_pangde,
		re_taishici: refreshCharacters.re_taishici,
		re_menghuo: refreshCharacters.re_menghuo,
		ol_sunjian: refreshCharacters.ol_sunjian,
		re_caopi: refreshCharacters.re_caopi,
		ol_xuhuang: refreshCharacters.ol_xuhuang,
		ol_dongzhuo: refreshCharacters.ol_dongzhuo,
		ol_zhurong: refreshCharacters.ol_zhurong,
		re_jiaxu: refreshCharacters.re_jiaxu,
		ol_lusu: refreshCharacters.ol_lusu,
		ol_jiangwei: refreshCharacters.ol_jiangwei,
		ol_caiwenji: refreshCharacters.ol_caiwenji,
		ol_liushan: refreshCharacters.ol_liushan,
		ol_zhangzhang: refreshCharacters.ol_zhangzhang,
		re_zuoci: refreshCharacters.re_zuoci,
		re_sunce: refreshCharacters.re_sunce,
		ol_dengai: refreshCharacters.ol_dengai,
		re_zhanghe: refreshCharacters.re_zhanghe,
		// 阴雷包
		wangji: shenhuaCharacters.wangji,
		kuailiangkuaiyue: shenhuaCharacters.kuailiangkuaiyue,
		yanyan: shenhuaCharacters.yanyan,
		wangping: shenhuaCharacters.wangping,
		sunliang: shenhuaCharacters.sunliang,
		luji: shenhuaCharacters.luji,
		xuyou: shenhuaCharacters.xuyou,
		yl_luzhi: shenhuaCharacters.yl_luzhi,
		haozhao: shenhuaCharacters.haozhao,
		guanqiujian: shenhuaCharacters.guanqiujian,
		chendao: shenhuaCharacters.chendao,
		zhugezhan: shenhuaCharacters.zhugezhan,
		lukang: shenhuaCharacters.lukang,
		zhoufei: shenhuaCharacters.zhoufei,
		zhangxiu: shenhuaCharacters.zhangxiu,
		yl_yuanshu: shenhuaCharacters.yl_yuanshu,
		// 神话再临神将
		shen_guanyu: extraCharacters.shen_guanyu,
		shen_lvmeng: extraCharacters.shen_lvmeng,
		shen_zhugeliang: extraCharacters.shen_zhugeliang,
		shen_zhouyu: extraCharacters.shen_zhouyu,
		shen_caocao: extraCharacters.shen_caocao,
		shen_lvbu: extraCharacters.shen_lvbu,
		shen_zhaoyun: extraCharacters.shen_zhaoyun,
		shen_simayi: extraCharacters.shen_simayi,
		shen_liubei: extraCharacters.shen_liubei,
		shen_luxun: extraCharacters.shen_luxun,
		shen_ganning: extraCharacters.shen_ganning,
		shen_zhangliao: extraCharacters.shen_zhangliao,
		// 特定神将
		shen_diaochan: extraCharacters.shen_diaochan,
		shen_jiaxu: extraCharacters.shen_jiaxu,
		shen_dianwei: extraCharacters.shen_dianwei,
		zc26_shen_huangyueying: extraCharacters.zc26_shen_huangyueying,
	};

	return {
		name: "zhencang",
		connect: true,
		character: newCharacters,
		characterSort: {
			zhencang: {
				zhencang_standard: Object.keys(characters),
				zhencang_refresh_feng: ["caoren", "ol_xiahouyuan", "ol_weiyan", "ol_xiaoqiao", "zhoutai", "re_zhangjiao", "xin_yuji", "ol_huangzhong"],
				zhencang_refresh_huo: ["ol_sp_zhugeliang", "ol_xunyu", "ol_dianwei", "ol_yanwen", "ol_pangtong", "ol_yuanshao", "ol_pangde", "re_taishici"],
				zhencang_refresh_lin: ["re_menghuo", "ol_sunjian", "re_caopi", "ol_xuhuang", "ol_dongzhuo", "ol_zhurong", "re_jiaxu", "ol_lusu"],
				zhencang_refresh_shan: ["ol_jiangwei", "ol_caiwenji", "ol_liushan", "ol_zhangzhang", "re_zuoci", "re_sunce", "ol_dengai", "re_zhanghe"],
				zhencang_shenhua_yin: ["wangji", "kuailiangkuaiyue", "yanyan", "wangping", "sunliang", "luji", "xuyou", "yl_luzhi"],
				zhencang_shenhua_lei: ["haozhao", "guanqiujian", "chendao", "zhugezhan", "lukang", "zhoufei", "zhangxiu", "yl_yuanshu"],
				zhencang_shenhua_shen: ["shen_guanyu", "shen_lvmeng", "shen_zhugeliang", "shen_zhouyu", "shen_caocao", "shen_lvbu", "shen_zhaoyun", "shen_simayi", "shen_liubei", "shen_luxun", "shen_ganning", "shen_zhangliao"],
				zhencang_shen_extra: ["shen_diaochan", "shen_jiaxu", "shen_dianwei", "zc26_shen_huangyueying"],
			},
		},
		skill: {
			...refreshSkills,
			...shenhuaSkills,
			...extraSkills,
		},
		translate: {
			...refreshTranslates,
			...refreshVoices,
			...shenhuaTranslates,
			...shenhuaVoices,
			...extraTranslates,
			...extraVoices,
			...translates,
			zhencang: "珍藏版2026",
			zhencang_standard: "界限突破·标",
			zhencang_refresh_feng: "界限突破·风",
			zhencang_refresh_huo: "界限突破·火",
			zhencang_refresh_lin: "界限突破·林",
			zhencang_refresh_shan: "界限突破·山",
			zhencang_shenhua_yin: "神话再临·阴",
			zhencang_shenhua_lei: "神话再临·雷",
			zhencang_shenhua_shen: "神话再临·神",
			zhencang_shen_extra: "珍藏神将",
			zc26_shen_huangyueying: "神黄月英",
			zc26_shen_huangyueying_prefix: "神",
		},
	};
});
