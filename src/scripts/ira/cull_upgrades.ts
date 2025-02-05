import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

export default function (context: Context, args?: unknown) {
	const trash = $hs.sys.upgrades({
		filter: {
			loaded: false,
		},
		full: true,
	});

	if ("ok" in trash && !trash.ok) return trash;

	if (!Array.isArray(trash)) return trash;

	const filtered = trash
		.filter((x) => x.rarity < 3)
		.filter((x) => !x.loaded)
		.filter((x) => !x.name.includes("k3y"));

	const lib = $fs.scripts.lib();

	const log = [];

	for (const item of filtered) {
		const s = JSON.parse(JSON.stringify(item));
		for (const key of ["i", "sn", "loaded", "description"]) delete s[key];

		const market = $ls.market.browse(s);

		const index = (
			$hs.sys.upgrades({ full: true }) as {
				sn: string;
				i: number;
				rarity: number;
			}[]
		).find((x) => x.sn === item.sn);

		if (!index) continue;

		if (!Array.isArray(market) || !market.length) {
			if (index.rarity < 1 && isRecord(args) && "dry" in args && !args.dry)
				$ls.sys.cull({
					i: index.i,
					confirm: true,
				});

			continue;
		}

		// const sellCost =
		// market.reduce((prev, curr) => prev + curr.cost, 0) / (market.length - 1);

		// get the new index of this up

		const sellCost = market[0].cost;
        const returnValue = sellCost * 0.9;

		const listFee = Math.max(sellCost * 0.05, 1_000);

		if (listFee >= returnValue && isRecord(args) && "dry" in args && !args.dry) {
			$ls.sys.cull({
				i: index.i,
				confirm: true,
			});
			continue;
		}

		if (!sellCost) continue;

		if (isRecord(args) && "dry" in args && !args.dry) {
			const bal = $hs.accts.balance();
			if (bal < listFee) $ms.maddy.xfer({ amount: Math.ceil(listFee) });

			const ret = $ls.market.sell({
				i: index.i,
				cost: Math.floor(sellCost),
				confirm: true,
			});

			if (!ret.ok) return ret;
		}

		log.push([
			`${index.i}`,
			`\`${item.rarity}${item.name}\``,
			lib.to_gc_str(sellCost),
			lib.to_gc_str(listFee),
		]);
	}

	return table(
		[["i", "name", "sell price", "list fee"], [], ...log],
		context.cols,
	);

	// $ls.sys.cull({
	// 	i: trash
	// 		.filter((x) => x.rarity < 2)
	// 		.filter((x) => !x.name.includes("k3y"))
	// 		.map((x) => x.i),
	// 	confirm: true,
	// });
}
