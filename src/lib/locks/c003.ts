import type { LockSolver } from "./type";

export const c003: LockSolver = function* () {
	const colours = $db
		.f({ s: "t1", k: "c", a: { $type: "string" }, i: { $type: "int" } })
		.array();

	for (let i = 0; i < colours.length; i++) {
		yield {
			c003: colours[i].a,
			c003_triad_1: colours[(i + 3) % 8].a,
			c003_triad_2: colours[(i + 5) % 8].a,
		};
	}
};
