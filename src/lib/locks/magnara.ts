import { permute } from "../permute";
import type { LockSolver } from "./type";

export const magnara: LockSolver = function* (context, log) {
	const input = yield { magnara: "" };
	const word: string = input.split(" ").splice(-1)[0];

	log(`word is ${word}`);

	const sorted = word
		.split("")
		.sort((a, b) => a.localeCompare(b))
		.join("");
	const existing = $db
		.f({ _id: `magnara_${sorted}`, word: { $type: "string" } })
		.first();
	if (existing) {
		log(`magnara db had ${existing.word}`);
		yield { magnara: existing.word };

		log("bad word");

		// if the existing word didn't work, remove it
		$db.r({ _id: `magnara_${sorted}` });
	}

	log("no magnara dict, bruting");

	const LIMIT = 6;

	// if the word is small enough, just brute it
	if (word.length < LIMIT) {
		const gen = permute(word.split(""));
		let found: string | undefined;
		try {
			for (const perm of gen) {
				found = perm.join("");
				yield { magnara: found };
			}
		} finally {
			if (!found) {
				log("no word found");
			} else {
				log(`found word ${found}`);
				$db.us({ _id: `magnara_${sorted}` }, { $set: { word: found } });
			}
		}
	}
};
