import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

export default (context: Context, args?: unknown) => {
	$ms.maddy.whitelist();

	const keys = $ls.maddy.keyring();
	if (!Array.isArray(keys)) return keys;

	const allKeys = $db
		.f({ s: "t1", k: "l0cket", a: { $type: "string" } })
		.array();

	const missing = allKeys.filter((x) => !keys.find((y) => y.k3y === x.a));

	const market = missing
		.map((x) => {
			const ret = $fs.market.browse({ k3y: x.a });
			if (!Array.isArray(ret)) return undefined;
			return Object.assign({}, ret.sort((a, b) => a.cost - b.cost)[0], {
				k3y: x.a,
			});
		})
		.filter((x) => !!x);

	if (isRecord(args) && "buy" in args && typeof args.buy === "string") {
		const buyLimit = $fs.scripts.lib().to_gc_num(args.buy) as number;
		for (const key of market) {
			if (key.cost > buyLimit) continue;

			$ms.maddy.xfer({ amount: key.cost });
			const ret = $ms.market.buy({ i: key.i, confirm: true, count: 1 });

			if ("ok" in ret && !ret.ok) return ret;
		}
	}

	const lib = $fs.scripts.lib();

	return table(
		[
			["k3y", "i", "cost"],
			[],
			...market.map((x) => [
				x.rarity ? `\`${x.rarity}${x.k3y}\`` : x.k3y,
				x.i ?? "",
				`${x.cost ? lib.to_gc_str(x.cost) : ""}`,
			]),
		],
		context.cols,
	);
};
