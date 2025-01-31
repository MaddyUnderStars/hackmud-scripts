import type { LockSolver } from "./type";

export const ez_35: LockSolver = function* () {
	const words = ["unlock", "open", "release"];

	for (const word of words) {
		const ret = yield { EZ_35: word };
		if (ret.includes("digit")) break;
	}

	for (let i = 0; i <= 9; i++) {
		yield { digit: i };
	}
};
