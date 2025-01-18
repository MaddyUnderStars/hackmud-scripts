// @autocomplete level: 0, page: 0

import { isRecord } from "/lib/isRecord";

const HELP_TEXT =
    "public scripts helper.\nmaddy.scripts { level: number, page?: number }";

const PUBLICS = [
    (sector?: string) =>
        sector ? $fs.scripts.fullsec({ sector }) : $fs.scripts.fullsec(),
    (sector?: string) =>
        sector ? $fs.scripts.highsec({ sector }) : $fs.scripts.highsec(),
    (sector?: string) =>
        sector ? $fs.scripts.midsec({ sector }) : $fs.scripts.midsec(),
    (sector?: string) =>
        sector ? $fs.scripts.lowsec({ sector }) : $fs.scripts.lowsec(),
    (sector?: string) =>
        sector ? $fs.scripts.nullsec({ sector }) : $fs.scripts.nullsec(),
];

const allSectors = (e: number) => {
    return Object.values(PUBLICS.filter((_, i) => i === e)).flatMap(x => x() as string[]);
};

export default (context: Context, args?: unknown) => {
    if (!isRecord(args)) return HELP_TEXT;

    const page = "page" in args && typeof args.page === "number" ? args.page : 0;
    const level =
        "level" in args && typeof args.level === "number" ? args.level : 0;

    if (!PUBLICS[level]) return "level not in range 0-5";

    const sectors = PUBLICS[level]() as string[];

    const sector = sectors[page];

    const all = allSectors(level);
    const joined = $ms.chats.channels().filter(x => all.includes(x));
    for (const j of joined) {
        if (j === sector) continue;
        $ms.chats.leave({ channel: j });
    }

    $ms.chats.join({ channel: sector });

    return `${$fs.scripts.lib().columnize(PUBLICS[level](sector) as string[])}\n\ntotal pages: ${sectors.length - 1}`;
};