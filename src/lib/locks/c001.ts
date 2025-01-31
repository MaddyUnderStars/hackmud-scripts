import type { LockSolver } from "./type";

export const c001: LockSolver = function* () {
    const colours = $db.f({ s: "t1", k: "c", a: { $type: "string" }, i: { $type: "int" } }).array();

    for (const colour of colours) {
        yield { c001: colour.a, color_digit: colour.a.length };
    }
};