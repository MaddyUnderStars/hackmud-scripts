import { permute } from "../permute";
import type { LockSolver } from "./type";

export const magnara: LockSolver = function* () {
    const input = yield { magnara: "" };
    const word: string = input.split(" ").splice(-1)[0];

    const sorted = word
        .split("")
        .sort((a, b) => a.localeCompare(b))
        .join("");
    const existing = $db
        .f({ _id: `magnara_${sorted}`, word: { $type: "string" } })
        .first();
    if (existing) {
        yield { magnara: existing.word };

        // if the existing word didn't work, remove it
        $db.r({ _id: `magnara_${sorted}` });
    }

    const LIMIT = 6;

    // if the word is small enough, just brute it
    if (word.length < LIMIT) {
        const gen = permute(word.split(""));
        for (const perm of gen) {
            const word = perm.join("");

            // I'd rather only do 1 db opt,
            // but that would involve being able to signal to a solver when it's done
            // which would be messy at the moment.
            $db.us({ _id: `magnara_${sorted}` }, { $set: { word } });

            yield { magnara: word };
        }
    }
};