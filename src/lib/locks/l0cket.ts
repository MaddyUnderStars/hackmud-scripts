import type { LockSolver } from "./type";

export const l0cket: LockSolver = function* () {
    const answers = $db
        .f({ s: "t1", k: "l0cket", a: { $type: "string" } })
        .array();

    for (const answer of answers) {
        yield { l0cket: answer.a };
    }
};