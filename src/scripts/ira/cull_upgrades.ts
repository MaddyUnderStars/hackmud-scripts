import { throwFailure } from "/lib/failure";
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

	const lib = $fs.scripts.lib();

	const filtered = trash
		.filter((x) => x.rarity <= 3)
		.filter((x) => !x.loaded)
		.filter((x) => !x.name.includes("k3y"));

	const operations: {
		op: "sell" | "cull" | "store";
		msg?: string;
		sn: string;
		name: string;
		cost?: number;
		fee?: number;
		ret?: number;
	}[] = [];

	for (const item of filtered) {
		if (item.rarity > 2) {
			operations.push({
				op: "store",
				sn: item.sn,
				name: `\`${item.rarity}${item.name}\``,
				msg: "rarity > 2",
			});
            continue;
		}

		const s = JSON.parse(JSON.stringify(item));
		for (const key of ["i", "sn", "loaded", "description"]) delete s[key];

		if (s.cooldown) s.cooldown = { $gte: s.cooldown };
		if (s.amount) s.amount = { $gte: s.amount };
		if (s.cost) s.cost = { $gte: s.cost };
		if (s.count) s.count = { $lte: s.count };
		if (s.chars) s.chars = { $lte: s.chars };
		if (s.max_glock_amnt) s.max_glock_amnt = { $lte: s.max_glock_amnt };
		if (s.expire_secs) s.expire_secs = { $gte: s.expire_secs };

		const market = $ls.market.browse(s);

		if (!Array.isArray(market) || !market.length) {
			operations.push({
				op: "cull",
				name: `\`${item.rarity}${item.name}\``,
				msg: "no market",
				sn: item.sn,
			});
			continue;
		}

		const sellCost = market[0].cost;
		const returnValue = sellCost * 0.9;
		const listFee = Math.max(sellCost * 0.05, 1_000);

		if (listFee >= returnValue) {
			operations.push({
				op: "cull",
				msg: "poor return",
				name: `\`${item.rarity}${item.name}\``,
				sn: item.sn,
				cost: sellCost,
			});
			continue;
		}

		operations.push({
			op: "sell",
			sn: item.sn,
			name: `\`${item.rarity}${item.name}\``,
			cost: sellCost,
			fee: listFee,
			ret: returnValue,
		});
	}

	if (isRecord(args) && "dry" in args && !args.dry) {
		const totalFees = operations
			.map((x) => x.fee ?? 0)
			.reduce((prev, curr) => prev + curr, 0);

		$ms.maddy.xfer({ amount: Math.ceil(totalFees) });

		for (const item of operations) {
			const index = throwFailure($hs.sys.upgrades({ full: true })).find(
				(x) => x.sn === item.sn,
			)?.i;
			if (!index) continue;

			if (item.op === "cull") {
				throwFailure(
					$ls.sys.cull({
						i: index,
						confirm: true,
					}),
				);
				continue;
			}

            if (item.op === "store") continue;

			if (!item.cost) continue;

			throwFailure(
				$ls.market.sell({
					i: index,
					cost: Math.floor(item.cost),
					confirm: true,
				}),
			);
		}
	}

	return table(
		[
			["name", "return value", "action", "msg"],
			[],
			...operations.map((x) => [
				x.name,
				x.ret ? lib.to_gc_str(x.ret) : "",
				x.op,
				x.msg ?? "",
			]),
		],
		context.cols,
	);
}
