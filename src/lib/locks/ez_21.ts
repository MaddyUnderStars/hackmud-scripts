import type { LockSolver } from "./type";

export const ez_21: LockSolver = function* () {
	const words = ["unlock", "open", "release"];

	for (const word of words) {
		yield { EZ_21: word };
	}
};
