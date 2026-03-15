import { lib, game, ui, get, ai, _status } from "noname";

const characterFilters = {
	jx_zuoci(mode) {
		return mode != "guozhan";
	},
};

export default characterFilters;
