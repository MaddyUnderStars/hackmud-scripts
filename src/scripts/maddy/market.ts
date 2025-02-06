import { isFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";
import { readableMs } from "/lib/time";

type MarketListing = {
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
	"cost",
	"retries",
	"k3y",
];

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default (context: Context, args: any) => {
	if (!args)
		return (
			"Market listings viewer.\n" +
			"Args are passed to market.browse. First n listings are fetched, and rendered in a table\n" +
			"If searching for the same upgrade*, also display special stats\n\n" +
			'*same = name.replace(/_v./, "")\n\n' +
			"`Nsort`: `Vstring | string[]` - sort *the page* by table headers (except n)\n" +
			"`Npage`: `Vnumber` - default 0\n" +
			"`Nn`: `Vnumber` - page size. default 50"
		);

	const sort: string[] =
		isRecord(args) &&
		"sort" in args &&
		(typeof args.sort === "string" ||
			(Array.isArray(args.sort) &&
				args.sort.every((a: unknown) => typeof a === "string")))
			? Array.isArray(args.sort)
				? args.sort
				: [args.sort]
			: [];

	const page =
		isRecord(args) && "page" in args && typeof args.page === "number"
			? args.page
			: 0;
	const page_size =
		isRecord(args) && "n" in args && typeof args.n === "number" ? args.n : 50;

	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.sort;
	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.page;
	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.n;

	const market = $fs.market.browse(args);

	if (!Array.isArray(market)) return market;
	if (!market.length) return "no results";

	const fetched = market
		.slice(page_size * page, page_size * (page + 1))
		.flatMap((up) => {
			if (_END - Date.now() < 500)
				return Object.assign({}, up, {
					seller: "",
					upgrade: {
						name: up.name,
						rarity: up.rarity,
						type: "",
					},
				}) as unknown as MarketListing;

			const ret = $fs.market.browse({ i: up.i });
			if (isFailure(ret)) return [];
			// your types are wrong sam
			return ret as unknown as MarketListing;
		})
		.sort((a, b) => {
			const mergedA = Object.assign({}, a.upgrade, {
				price: a.cost,
				seller: a.seller,
				i: a.i,
			});

			const mergedB = Object.assign({}, b.upgrade, {
				price: b.cost,
				seller: b.seller,
				i: b.i,
			});

			for (const s of sort) {
				if (!(s in mergedA && s in mergedB)) continue;

				//@ts-ignore
				if (mergedA[s] === mergedB[s]) continue;

				//@ts-ignore
				if (typeof mergedA[s] === "number" && typeof mergedB[s] === "number")
					//@ts-ignore
					return mergedA[s] - mergedB[s];

				//@ts-ignore
				if (typeof mergedA[s] === "string" && typeof mergedB[s] === "string")
					//@ts-ignore
					return mergedA[s].localeCompare(mergedB[s]);
			}

			return 0;
		});

	const lib = $fs.scripts.lib();

	const includedStats =
		new Set(fetched.map((x) => x.upgrade.name.replace(/_v./, ""))).size === 1
			? UPGRADE_STATS.filter((x) =>
					fetched.find((listing) => Object.keys(listing.upgrade).includes(x)),
				)
			: [];

	const more = market.length - fetched.length;

	return `${table(
		[
			[
				"n",
				"i",
				"price",
				"name",
				"seller",
				"type",
				includedStats.length ? "|" : "",
				...includedStats,
			],
			[],
			...fetched.map((listing, index) => [
				`${index + page_size * page}`,
				`${listing.i}`,
				lib.to_gc_str(listing.cost),
				`\`${listing.upgrade.rarity}${listing.upgrade.name}\``,
				listing.seller,
				listing.upgrade.type,

				includedStats.length ? "|" : "",

				...includedStats.map((stat) => {
					let ret = stat in listing.upgrade ? listing.upgrade[stat] : "";

					if (["cost", "max_glock_amnt"].includes(stat) && typeof ret === "number")
						ret = lib.to_gc_str(ret);

                    if (["cooldown", "expire_secs"].includes(stat) && typeof ret === "number")
                        ret = readableMs(ret * 1000);

					return `${ret}`;
				}),
			]),
		],
		context.cols,
		3,
	)}${more ? `\n\n...${more} more results` : ""}`;
};
