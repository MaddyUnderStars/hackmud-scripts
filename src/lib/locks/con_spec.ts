import type { LockSolver } from "./type";

export const con_spec: LockSolver = function* () {
    const input = yield { CON_SPEC: "" };

    if (input.includes("scriptor")) {
        yield {
            CON_SPEC: {
                call: (args: Record<string, unknown>) => {
                    const s = args.s as string;
                    const d = args.d as number;

                    return (
                        s
                            .split("")
                            .filter((x) =>
                                Number.isNaN(x) ? false : Number.parseInt(x) === d,
                            )?.length ?? 0
                    );
                },
            },
        };
        return;
    }

    // do the sequence
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    const sequence = input.toLowerCase().split("\n")[0].split("") as string[];

    const indexes = sequence.map((x) => alphabet.indexOf(x));

    const differences = indexes.slice(1).map((v, i) => v - indexes[i]);

    let ret = "";
    let curr = indexes[indexes.length - 1];
    const attempts = [];
    for (let i = 3; i > 0; i--) {
        const attempt =
            differences[(differences.length - i - 1) % differences.length];
        curr += attempt;
        attempts.push(attempt);

        if (curr < 0) curr += alphabet.length;

        ret += alphabet[curr % alphabet.length];
    }

    yield { CON_SPEC: ret.toUpperCase() };

    return { indexes, differences, attempts };
};