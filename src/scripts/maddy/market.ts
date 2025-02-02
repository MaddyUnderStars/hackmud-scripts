import { isFailure } from "/lib/failure";
import { table } from "/lib/table";

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
			"Args are passed to market.browse. First n=50 listings are fetched, and rendered in a table\n" +
			"If searching for the same upgrade*, also display special stats\n\n" +
			'*same = name.replace(/_v./, "")'
		);

	const market = $fs.market.browse(args);

	if (!Array.isArray(market)) return market;

	if (!market.length) return "no results";

	const fetched = market.slice(0, 50).flatMap((up) => {
		const ret = $fs.market.browse({ i: up.i });
		if (isFailure(ret)) return [];
		// your types are wrong sam
		return ret as unknown as MarketListing;
	});

	const lib = $fs.scripts.lib();

	const includedStats =
		new Set(fetched.map((x) => x.upgrade.name.replace(/_v./, ""))).size === 1
			? UPGRADE_STATS.filter((x) =>
					fetched.find((listing) => Object.keys(listing.upgrade).includes(x)),
				)
			: [];

	const more = market.length - fetched.length;

	return (
		`${table(
			[
				[
					"i",
					"cost",
					"name",
					"type",
					includedStats.length ? "|" : "",
					...includedStats,
				],
				[],
				...fetched.map((listing) => [
					`${listing.i}`,
					lib.to_gc_str(listing.cost),
					`\`${listing.upgrade.rarity}${listing.upgrade.name}\``,
					listing.upgrade.type,

					includedStats.length ? "|" : "",

					...includedStats.map((stat) => {
						let ret = stat in listing.upgrade ? listing.upgrade[stat] : "";

						if (stat === "cost" && typeof ret === "number")
							ret = lib.to_gc_str(ret);

						return `${ret}`;
					}),
				]),
			],
			context.cols,
			3,
		)}${more ? `\n\n...${more} more results` : ""}`
	);
};
