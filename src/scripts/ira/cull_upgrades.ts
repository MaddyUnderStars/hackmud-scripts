import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

export default function (context: Context, args?: unknown) {
	const trash = $ls.sys.upgrades({
		filter: {
			loaded: false,
		},
		full: true,
	});

	if ("ok" in trash && !trash.ok) return trash;

	if (!Array.isArray(trash)) return trash;

	const filtered = trash
		.filter((x) => x.rarity <= 3)
		.filter((x) => !x.loaded)
		.filter((x) => !x.name.includes("k3y"));

	const lib = $fs.scripts.lib();

	const log = [];

	for (const item of filtered) {
		const s = JSON.parse(JSON.stringify(item));
		for (const key of ["i", "sn", "loaded", "description"]) delete s[key];

        if (s.cooldown) s.cooldown = { $gte: s.cooldown }
        if (s.amount) s.amount = { $gte: s.amount }
        if (s.cost) s.cost = { $gte: s.cost }
        if (s.count) s.count = { $lte: s.count }
        if (s.chars) s.chars = { $lte: s.chars }
        if (s.max_glock_amnt) s.max_glock_amnt = { $lte: s.max_glock_amnt }
        if (s.expire_secs) s.expire_secs = { $gte: s.expire_secs }

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
			if (index.rarity < 3) {
				if (isRecord(args) && "dry" in args && !args.dry)
					$ls.sys.cull({
						i: index.i,
						confirm: true,
					});

				log.push([
					`${index.i}`,
					`\`${item.rarity}${item.name}\``,
					"",
					"",
					"CULL no market",
				]);
			}

			continue;
		}

		// const sellCost =
		// market.reduce((prev, curr) => prev + curr.cost, 0) / (market.length - 1);

		// get the new index of this up

		const sellCost = market[0].cost;
		const returnValue = sellCost * 0.9;

		const listFee = Math.max(sellCost * 0.05, 1_000);

		if (listFee >= returnValue) {
			log.push([
				`${index.i}`,
				`\`${item.rarity}${item.name}\``,
				"",
				"",
				"CULL poor return",
			]);

			if (isRecord(args) && "dry" in args && !args.dry)
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
			"sell",
		]);
	}

	return table(
		[["i", "name", "sell price", "list fee", "action"], [], ...log],
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
