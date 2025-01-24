import { table } from "/lib/table";

export default function (context: Context, args?: unknown) {
	$ms.maddy.whitelist();

    const sources: Array<[() => Array<Record<string, unknown>>, string]> = [
        [() => $fs.sys.upgrades_of_owner({ full: true }), "maddy"],
        [() => $ms.ira.ups({ full: true }), "ira"],
        [() => $ms.squizzy.ups({ full: true }), "squizzy"],
        [() => $ms.uzuri.ups({ full: true }), "uzuri"],
    ];

    const upgrades: {
        owner: string;
        name: string;
        cost?: number;
        sn: string;
        rarity: number;
        loaded: boolean;
    }[] = [];
    for (const source of sources) {
        const list = source[0]();

        for (const u of list) {
            const s = JSON.parse(JSON.stringify(u));
            for (const key of ["i", "sn", "loaded", "description"]) delete s[key];

            if (upgrades.find((x) => Object.keys(s).every((key) => {
                //@ts-ignore
                return s[key] === x[key]
            }))?.cost)
                continue;

            const market = $fs.market.browse(s);

            if (!Array.isArray(market) || !market.length) {
                u._market_low = "`Dnot found`";
                continue;
            }

            u._market_low = market.sort((a, b) => a.cost - b.cost)[0];
        }

        upgrades.push(
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            ...list.map((x: any) => ({
                name: x.name,
                owner: source[1],
                cost: typeof x._market_low === "string" ? x._market_low : x._market_low?.cost,
                sn: x.sn,
                loaded: x.loaded,
                rarity: x.rarity,
            })),
        );
    }

    const groupNames = new Set<string>(upgrades.map((x) => x.name));
    let groups = [];

    for (const name of groupNames) {
        groups.push(
            upgrades
                .filter((x) => x.name === name)
                .sort((a, b) => {
                    if (b.rarity === a.rarity) return (typeof b.cost === "number" ? b.cost : 0) - (typeof a.cost === "number" ? a.cost : 0);
                    return b.rarity - a.rarity;
                }),
        );
    }

    groups = groups.sort((a, b) => (b[0].cost ?? 0) - (a[0].cost ?? 0)).flat();

    const lib = $fs.scripts.lib();

    return table(
        [
            ["user", "name", "cost low", "sn"],
            [],
            ...groups.map((x) => [
                `\`${x.loaded ? "V" : "C"}${x.owner}\``,
                `\`${x.rarity}${x.name}\``,
                typeof x.cost === "string" ? x.cost : (x.cost ? lib.to_gc_str(x.cost) : ""),
                x.sn ?? "",
            ]),
        ],
        context.cols,
    );
}
