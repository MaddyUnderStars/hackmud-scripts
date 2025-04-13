// @autocomplete level: 0, page: 0

import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
// import { number, object, string } from "/lib/validation";

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

const HELP_TEXT = `public scripts helper.\nmaddy.scripts { \`Nlevel\`: \`Vnumber|string\`, \`Npage?\`: \`Vnumber\` }\n\n\`Nlevel\` can be any of:\n- ${[0, 1, 2, 3, 4, ...Object.keys(SECLEVELS)].map((x) => `\`V${JSON.stringify(x)}\``).join("\n- ")}`;

const PUBLICS = [
    (sector?: string) =>
        sector ? $fs.scripts.nullsec({ sector }) : $fs.scripts.nullsec(),
    (sector?: string) =>
        sector ? $fs.scripts.lowsec({ sector }) : $fs.scripts.lowsec(),
    (sector?: string) =>
        sector ? $fs.scripts.midsec({ sector }) : $fs.scripts.midsec(),
    (sector?: string) =>
        sector ? $fs.scripts.highsec({ sector }) : $fs.scripts.highsec(),
    (sector?: string) =>
        sector ? $fs.scripts.fullsec({ sector }) : $fs.scripts.fullsec(),
];

const allSectors = (e: number) => {
    return Object.values(PUBLICS.filter((_, i) => i === e)).flatMap(
        (x) => x() as string[],
    );
};

export default (context: Context, args?: unknown) => {
    $fs.maddy.analytics({ context, args });

    if (!isRecord(args)) return HELP_TEXT;

    const v = throwFailure($fs.maddy.v());

    const { page, level } = v
        .object({
            page: v.number().min(0).optional(0),
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
        })
        .parse(args);

    const sectors = PUBLICS[level]() as string[];

    const sector = sectors[page];

    const all = allSectors(level);
    const joined = $ms.chats.channels().filter((x) => all.includes(x));
    for (const j of joined) {
        if (j === sector) continue;
        $ms.chats.leave({ channel: j });
    }

    $ms.chats.join({ channel: sector });

    const scripts = throwFailure(PUBLICS[level](sector));

    $ms.chats.leave({ channel: sector });

    if (context.calling_script) {
        return scripts;
    }

    return `${$fs.scripts.lib().columnize(scripts)}\n\ntotal pages: ${sectors.length - 1}`;
};