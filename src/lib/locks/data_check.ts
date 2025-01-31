import type { LockSolver } from "./type";

export const data_check: LockSolver = function* () {
    const answers = $db
        .f({
            s: "t1",
            k: "datacheck",
            q: { $type: "string" },
            a: { $type: "string" },
        })
        .array();

    const input = (yield { DATA_CHECK: "" }) as string;

    const ret = input
        .split("\n")
        .map(
            (x) =>
                answers.find((y) => x.toLowerCase().includes(y.q.toLowerCase()))?.a,
        )
        .join("");

    yield { DATA_CHECK: ret };
};