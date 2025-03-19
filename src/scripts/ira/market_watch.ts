import type { MarketListing } from "../maddy/market";
import { histogram } from "/lib/chart";
import { throwFailure } from "/lib/failure";
import { groupBy } from "/lib/groupBy";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

const users = [
	"arakni",
	"enigma",
	"ira",
	"katsu",
	"maddy",
	"oscilio",
	"squizzy",
	"uzuri",
	"verdance",
];

export default (context: Context, args?: unknown) => {
	$fs.maddy.whitelist();

	if (context.calling_script || isRecord(args)) {
		const records = $db
			.f({
				_id: { $regex: "market_watch", $type: "string" },
				_token: { $type: "string" },
				_removed: { $exists: false },
			})
			.array();

		const market = users.flatMap((user) =>
			throwFailure($fs.market.browse({ seller: user })),
		);

		const additions = market.filter(
			(x) => !records.find((y) => y._token === x.i),
		);

		const additionsMarket = throwFailure(
			$fs.market.browse({ i: additions.slice(0, 500).map((x) => x.i) }),
		) as unknown as MarketListing[];

		const deletions = records.filter(
			(x) => !market.find((y) => x._token === y.i),
		);

		$db.i(
			additionsMarket.map((x) => ({
				_id: `market_watch_${x.i}`,
				...x.upgrade,
				_token: x.i,
				_date: new Date(),
				_price: x.cost,
				_seller: x.seller,
			})),
		);

		for (const deletion of deletions)
			$db.u({ _id: deletion._id }, { $set: { _removed: new Date() } });

		return { additions: additions.length, sold: deletions.length };
	}

	const lastWeek = new Date();
	lastWeek.setDate(lastWeek.getDate() - 7);

	let expiredCount = 0;
	const records = $db
		.f({
			_id: { $regex: "market_watch", $type: "string" },
			_removed: { $gt: lastWeek },
		})
		.array()
		.filter((x) => {
			const date = new Date(x._date as Date);
			const removed = new Date(x._removed as Date);

			if (!date || !removed) return false;

			date.setMonth(date.getMonth() + 1);
			const ret = removed.valueOf() < date.valueOf();
			expiredCount += ret ? 0 : 1;
			return ret;
		});

	const soldGroupedDay = groupBy(
		records.filter((x) => x._removed),
		(v) => `${(v._removed as Date).toDateString()}`, //`\`${v.rarity}${v.name}\``,
	);

	const soldGroupedName = groupBy(
		records.filter((x) => x._removed),
		(v) => `\`${v.rarity}${v.name}\``,
	);

	let ret = "";

	ret +=
		expiredCount > 0 ? `Excluding ${expiredCount} destroyed listings\n\n` : "";

	const lastSold = records
		.filter((x) => x._removed)
		.sort(
			(a, b) => (b._removed as Date).valueOf() - (a._removed as Date).valueOf(),
		)[0];

	const lib = $fs.scripts.lib();
	ret += lastSold
		? `Last sold: \`${lastSold.rarity}${lastSold.name}\` for ${lib.to_gc_str(lastSold._price as number)}\n\n`
		: "";

	ret += "Sold in last week\n";

	ret += table(
		[
			["name", "count"],
			[],
			...Object.entries(soldGroupedName).map(([key, value]) => [
				key,
				`${value.length}`,
			]),
		],
		context.cols,
	);

	ret += "\n\n";

	ret += histogram(
		Object.entries(soldGroupedDay).map(([key, value]) => ({
			value: value.length,
			label: key,
		})),
		context.cols,
	);

	return ret;
};
