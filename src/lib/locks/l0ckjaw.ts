import { isFailure } from "../failure";
import type { LockSolver } from "./type";
import type { Key } from "/scripts/maddy/keyring";

export const l0ckjaw: LockSolver = function* (context, log) {
	const keys = $ls.maddy.keyring() as Key[] | ScriptFailure;

	if (!Array.isArray(keys)) return keys;

	const duplicates = [
		...new Set(keys.map((x) => x.k3y).filter((e, i, a) => a.indexOf(e) !== i)),
	];

	const ret = $ls.maddy.keyring({
		load: duplicates.map((x) => x),
		unload: true,
	});
	if (isFailure(ret)) return ret;

	yield {};

	$ls.maddy.keyring({ unload: true });

	log(`the following keys did not succeed\n${duplicates.join("\n")}`);
};
