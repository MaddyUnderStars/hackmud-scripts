import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
import { mongoFilter } from "/lib/mongoFilter";
import { table } from "/lib/table";
import { fromReadableTime, readableMs } from "/lib/time";
import * as v from "/lib/validation";
import { walk } from "/lib/walk";

export type MarketListing = {
    i: string;
    seller: string;
    cost: number;
    description: string;
    upgrade: Record<string, string | number> & {
        rarity: number;
        name: string;
        type: string;
        sn: string;
        tier: number;
    };
    no_notify: boolean;
};

const UPGRADE_STATS = [
    "p1_len",
    "p2_len",
    "acct_nt_min",
    "max_glock_amnt",
    "expire_secs",
    "salt_digits",
    "magnara_len",
    "up_count_min",
    "up_count_max",
    "name_count",
    "rarity_count",
    "digits",
    "loc_count",
    "chars",
    "slots",
    "count",
    "cooldown",
    "amount",
    "acc_mod",
    "price",
    "retries",
    "k3y",
] as const;

// if not present here, use default (1)
const preferredSortDir = {
    retries: -1,
    magnara_len: -1,
    p2_len: -1,
    acct_nt_min: -1,
    max_glock_amnt: -1,
    salt_digits: -1,
    up_count_min: -1,
    name_count: -1,
    rarity_count: -1,
    digits: -1,
    loc_count: -1,
    chars: -1,
    slots: -1,
    count: -1,
    amount: -1,
    acc_mod: -1,
    "#": -1,
} as Record<string, number>;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default (context: Context, args: any) => {
    $fs.maddy.analytics({ context, args });

    if (!args) {
        const args_table = table(
            [
                ["arg", "value", "default", "desc"],
                [],
                ["`Nn`", "`Vnumber`", "50", "page size"],
                ["`Npage`", "`Vnumber`", "0", "selected page"],
                [],
                [
                    "`Nsort`",
                    "`Vstring | string[]`",
                    "",
                    "sort by table headers. fetches max 1000 market items. if array order is priority",
                ],
                ["`Nsort_dir`", "`V1 | -1`", "1", "-1 inverts sort order"],
                [],
                [
                    "`Ndebug`",
                    "`Vboolean`",
                    "false",
                    "show args passed to market.browse, after mangling",
                ],
                [
                    "`Ntiming`",
                    "`Vboolean`",
                    "false",
                    "timing information used for debugging"
                ]
            ],
            context.cols,
            1,
        );

        return (
            // biome-ignore lint/style/useTemplate: <explanation>
            "Market listings viewer.\n\n" +
            "Extends market.browse:\n" +
            "- Shows inner market details in one table\n" +
            "- Sorting for any property, including cron_bot 'cost' (renamed: 'price') and listings 'count' (renamed '#')\n" +
            "- Querying with mongo filters for any property including cron price and listings count\n" +
            "- Human readable outputs for cooldowns, gc amounts, etc\n" +
            '- Human readable *queries*, e.g. max_glock_amnt: { "$gt": "1MGC" }\n' +
            "- Query for k3y's using 3 letter k3y codes\n" +
            '- Support for `N[key]`: `Vnull` like in sys.upgrades. Shorthand for { `N[key]`: { `N"$exists"`: `Vtrue` } }\n\n' +
            args_table +
            "\n\n" +
            "Example queries:\n" +
            '- find all brains with less than 1h 30m cooldowns, sorted by cooldown then price\n' +
            '{ type: "bot_brain", cooldown: { "$lt": "1h30m" }, sort: ["cooldown", "price"] }\n\n' +
            "- find all keys, sort by how many are listed\n" +
            '{ k3y: null, sort: "#" }\n\n' +
            "- find all magnaras, sort by their length property\n" +
            '{ sort: "magnara_len" }' +
            "\n\n" +
            "Useful macros\n" +
            '- /m = maddy.market {{ name: {{ "$regex": "{0}" }} }}\n' +
            '- /mm = maddy.market {{ name: {{ "$regex": "{0}" }}, {$} }}'
        );
    }

    const lib = $fs.scripts.lib();

    const { sort_dir, sort, page, n: page_size, debug, timing } = v
        .object({
            sort_dir: v
                .number()
                .refine((d) => d === -1 || d === 1)
                .optional(),
            sort: v
                .string()
                .array()
                .or(v.string().map((d) => [d]))
                .optional([]),
            page: v.number().min(0).optional(0),
            n: v.number().min(1).optional(50),
            debug: v.boolean().optional(false),
            timing: v.boolean().optional(false),
        })
        .parse(args);

    const convertFromReadable = (key: string, value: unknown) => {
        if (
            ["cost", "price", "max_glock_amnt", "amount"].includes(key) &&
            typeof value === "string"
        )
            return lib.to_gc_num(value);

        if (["cooldown", "expire_secs"].includes(key) && typeof value === "string")
            return fromReadableTime(value) / 1000;

        if (key === "k3y" && typeof value === "string" && value.length === 3)
            return { $regex: value };

        return value;
    };

    // add all the sort values to their query
    // they get converted from null below
    for (const key of sort) {
        if (!args[key])
            args[key] = null;
    }

    if (isRecord(args)) {
        // convert all human readable values to their real values
        // and convert null shorthand
        for (const [parentKey, parentValue] of Object.entries(args)) {
            // if it's an object we must walk it
            if (isRecord(parentValue)) {
                walk(parentValue, (value, key) =>
                    convertFromReadable(parentKey, value),
                );
            } else {
                // otherwise this property is just a primitive, we can convert it now
                if (parentValue === null) args[parentKey] = { $exists: true };
                else args[parentKey] = convertFromReadable(parentKey, parentValue);
            }
        }
    }

    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.sort;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.sort_dir;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.page_size;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.page;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.n;

    const args_price = args.price;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.price;

    const args_hash = args["#"];
    // biome-ignore lint/performance/noDelete: <explanation>
    delete args["#"];

    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.debug;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete args.timing;

    // their query only consisted of `price` which isn't supported by market.browse
    // only crons have a price (translated to `cost`), so lets just search for all crons
    if (args_price !== undefined && !Object.keys(args).length)
        Object.assign(args, { type: "bot_brain" });

    // Similarly, if they've only provided "#", just convert it to `type: null`
    // which will show the entire market
    if (args_hash !== undefined && !Object.keys(args).length) {
        Object.assign(args, { type: { $exists: true } });
    }

    if (debug) {
        return args;
    }

    const BROWSE_TIME = Date.now();
    const market = $fs.market.browse(args);
    const BROWSE_TIME_MS = Date.now() - BROWSE_TIME;

    if (!Array.isArray(market)) return market;
    if (!market.length) return "no results";

    let market_size = market.length;

    const listings = market.map((x) => x.i);

    const FETCH_TIME = Date.now();
    let fetched = throwFailure(
        $fs.market.browse({
            // if we're sorting OR if a `price`/`#` arg was passed, get the entire market
            // we slice the results later down to page size
            i:
                sort.length || args_price || args_hash
                    ? listings.slice(0, 1000)
                    : listings.slice(page_size * page, page_size * (page + 1)),
        }),
    ).map((x) => {
        if ("cost" in x.upgrade)
            x.upgrade = Object.assign({}, x.upgrade, {
                price: x.upgrade.cost,
                cost: undefined,
            });
        return x;
    });
    const FETCH_TIME_MS = Date.now() - FETCH_TIME;

    // cron's `cost` property can't be queried in market.browse
    // have to rename it to `price` for our usage
    // and then do the filtering ourselves
    if (args_price) {
        fetched = fetched.filter((x) => {
            if (!("price" in x.upgrade)) return false;

            if (isRecord(args_price)) return mongoFilter(args_price, x.upgrade.price);

            return x.upgrade.price === args_price;
        });

        market_size = fetched.length;
    }

    // same for the number of listings
    if (args_hash) {
        fetched = fetched.filter((x) => {
            if (isRecord(args_hash)) return mongoFilter(args_hash, x.count);
            return x.count === args_hash;
        });

        market_size = fetched.length;
    }

    if (sort.length)
        fetched = fetched.sort((a, b) => {
            const mergedA = Object.assign({}, a.upgrade, {
                cost: a.cost,
                seller: a.seller,
                i: a.i,
                "#": a.count,
            });

            const mergedB = Object.assign({}, b.upgrade, {
                cost: b.cost,
                seller: b.seller,
                i: b.i,
                "#": b.count,
            });

            for (const s of sort) {
                if (!(s in mergedA && s in mergedB)) continue;

                if (mergedA[s] === mergedB[s]) continue;

                if (typeof mergedA[s] === "number" && typeof mergedB[s] === "number")
                    return (
                        (mergedA[s] - mergedB[s]) * (sort_dir ?? preferredSortDir?.[s] ?? 1)
                    );

                if (typeof mergedA[s] === "string" && typeof mergedB[s] === "string")
                    return mergedA[s].localeCompare(mergedB[s]);
            }

            return 0;
        });

    if (!fetched.length) return "no results";

    const includedStats =
        new Set(fetched.map((x) => x.upgrade.name.replace(/_v./, ""))).size === 1
            ? UPGRADE_STATS.filter((x) =>
                fetched.find((listing) => Object.keys(listing.upgrade).includes(x)),
            )
            : [];

    const more = market_size - page_size > 0;

    let ret = table(
        [
            [
                "i",
                "cost",
                "name",
                "seller",
                "type",
                "#",
                includedStats.length ? "|" : "",
                ...includedStats,
            ],
            [],
            ...fetched
                .slice(
                    // don't like this, oh well
                    fetched.length > page_size ? page_size * page : undefined,
                    fetched.length > page_size ? page_size * (page + 1) : undefined,
                )
                .map((listing, index) => [
                    `${listing.i}`,
                    lib.to_gc_str(listing.cost),
                    `\`${listing.upgrade.rarity}${listing.upgrade.name}\``,
                    listing.seller,
                    listing.upgrade.type,
                    `${listing.count}`,

                    includedStats.length ? "|" : "",

                    ...includedStats.map((stat) => {
                        let ret = stat in listing.upgrade ? listing.upgrade[stat] : "";

                        if (
                            ["price", "cost", "max_glock_amnt", "amount"].includes(stat) &&
                            typeof ret === "number"
                        )
                            ret = lib.to_gc_str(ret);

                        if (
                            ["cooldown", "expire_secs"].includes(stat) &&
                            typeof ret === "number"
                        )
                            ret = readableMs(ret * 1000);

                        return `${ret}`;
                    }),
                ]),
        ],
        context.cols,
        3,
    );

    if (more) {
        const lastPage = Math.floor(market_size / page_size);
        if (lastPage > page) ret += `\nnext page: ${page + 1}`;
        ret += `\nlast page: ${lastPage}`;
        ret += `\ntotal listings: ${market_size}`;
    }

    if (market_size !== fetched.length && sort.length)
        ret +=
            "\n\nwarning: too many listings, sort may be inaccurate. try refining your query.";

    if (timing)
        ret += `\n\nTotal time ${Date.now() - _START}ms\nBrowse time ${BROWSE_TIME_MS}ms\nFetch time ${FETCH_TIME_MS}ms`;

    return ret;
};
