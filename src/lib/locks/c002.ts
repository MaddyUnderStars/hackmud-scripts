import type { LockSolver } from "./type";

export const c002: LockSolver = function* () {
	const colours = $db
		.f({ s: "t1", k: "c", a: { $type: "string" }, i: { $type: "int" } })
		.array();

	for (let i = 0; i < colours.length; i++) {
		yield {
			c002: colours[i].a,
			c002_complement: colours[(i + 4) % 8].a,
		};
	}
};
