import type { LockSolver } from "./type";

export const ez_40: LockSolver = function* () {
	const words = ["unlock", "open", "release"];

	for (const word of words) {
		const ret = yield { EZ_40: word };
		if (ret.includes("ez_prime")) break;
	}

	const answers = $db.f({ s: "t1", k: "ez_40", a: { $type: "int" } }).array();

	for (const a of answers) {
		yield { ez_prime: a.a };
	}
};
