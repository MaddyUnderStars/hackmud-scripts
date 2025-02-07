import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";
import { fromReadableTime, readableMs } from "/lib/time";
import { walk } from "/lib/walk";

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
} as Record<string, number>;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default (context: Context, args: any) => {
	if (!args)
		return (
			"Market listings viewer.\n" +
			"Args are passed to market.browse (with some mangling*). First n listings are fetched, and rendered in a table\n" +
			"If searching for the same upgrade**, also display special stats\n\n" +
			"*you may use human readable values (same format as script output) instead of plain numbers in queries.\n" +
			"   you may also use k3y 3 letter shorthands\n" +
			"   lastly, passing `Vnull` as a prop will act the same as in sys.upgrades\n" +
			'**same = name.replace(/_v./, "")\n\n' +
			"`Nsort`: `Vstring | string[]` - sort by table headers. sorting is limited to first 1000 listings \n" +
			"`Npage`: `Vnumber` - default 0\n" +
			"`Nn`: `Vnumber` - page size. default 50\n" +
			"`Ndebug`: `Vboolean` - return arguments passed to market.browse"
		);

	const lib = $fs.scripts.lib();

	const sort_dir =
		isRecord(args) && "sort_dir" in args && typeof args.sort_dir === "string"
			? args.sort_dir.toLowerCase() === "asc"
				? 1
				: -1
			: undefined;
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

	const convertFromReadable = (key: string, value: unknown) => {
		if (["cost", "max_glock_amnt"].includes(key) && typeof value === "string")
			return lib.to_gc_num(value);

		if (["cooldown", "expire_secs"].includes(key) && typeof value === "string")
			return fromReadableTime(value) / 1000;

		if (key === "k3y" && typeof value === "string" && value.length === 3)
			return { $regex: value };

		return value;
	};

	if (isRecord(args)) {
		for (const [parentKey, parentValue] of Object.entries(args)) {
			if (isRecord(parentValue)) {
				walk(parentValue, (value, key) =>
					convertFromReadable(parentKey, value),
				);
			} else {
				if (parentValue === null) args[parentKey] = { $exists: true };
				else args[parentKey] = convertFromReadable(parentKey, parentValue);
			}
		}
	}

	if (isRecord(args) && args.debug) {
		// biome-ignore lint/performance/noDelete: <explanation>
		delete args.debug;
		return args;
	}

	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.sort;
	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.sort_dir;
	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.page;
	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.n;
	// biome-ignore lint/performance/noDelete: <explanation>
	delete args.debug;

	const market = $fs.market.browse(args);

	if (!Array.isArray(market)) return market;
	if (!market.length) return "no results";

	const listings = market.map((x) => x.i);

	let fetched = throwFailure(
		$fs.market.browse({
			// if we're sorting, get the entire market
			// we slice the results later down to page size
			i: sort.length
				? listings.slice(0, 1000)
				: listings.slice(page_size * page, page_size * (page + 1)),
		}),
	);

	if (sort.length)
		fetched = fetched.sort((a, b) => {
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

	const more = market.length - fetched.length;

	let ret = table(
		[
			[
				"i",
				"price",
				"name",
				"seller",
				"type",
				includedStats.length ? "|" : "",
				...includedStats,
			],
			[],
			...fetched
				.slice(page_size * page, page_size * (page + 1))
				.map((listing, index) => [
					`${listing.i}`,
					lib.to_gc_str(listing.cost),
					`\`${listing.upgrade.rarity}${listing.upgrade.name}\``,
					listing.seller,
					listing.upgrade.type,

					includedStats.length ? "|" : "",

					...includedStats.map((stat) => {
						let ret = stat in listing.upgrade ? listing.upgrade[stat] : "";

						if (
							["cost", "max_glock_amnt"].includes(stat) &&
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
		const lastPage = Math.floor(market.length / page_size);
		if (lastPage >= page) ret += `\nnext page: ${page + 1}`;
		ret += `\nlast page: ${Math.floor(market.length / page_size)}`;
		ret += `\ntotal listings: ${market.length}`;
	}

    if (market.length !== fetched.length && sort.length)
        ret += "\n\nwarning: too many listings, sort may be inaccurate. try refining your query."

	return ret;
};
