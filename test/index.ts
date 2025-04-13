import * as v from "../src/lib/validation.js";

const SECLEVELS = {
    f: 4,
    h: 3,
    m: 2,
    l: 1,
    n: 0,
    fullsec: 4,
    highsec: 3,
    midsec: 2,
    lowsec: 1,
    nullsec: 0,
    full: 4,
    high: 3,
    mid: 2,
    low: 1,
    null: 0,
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
} as Record<string, number>;

const schema = v.object({
    level: v
        .number()
        .min(0)
        .max(4)
        .or(
            v
                .string()
                .refine((x) => x in SECLEVELS)
                .map((x) => SECLEVELS[x]),
            "must be valid sec level"
        ),
});

const ret = schema.parse({ level: "g" });