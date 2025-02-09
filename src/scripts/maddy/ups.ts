import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

export default function (context: Context, args?: unknown) {
	$ms.maddy.whitelist();

	const sources: Array<[() => Array<Record<string, unknown>>, string]> = [
		[() => throwFailure($fs.sys.upgrades_of_owner({ full: true })), "maddy"],
		[() => throwFailure($ms.ira.ups()), "ira"],
		[() => throwFailure($ms.squizzy.ups()), "squizzy"],
		[() => throwFailure($ms.uzuri.ups()), "uzuri"],
		[() => throwFailure($ms.enigma.ups()), "enigma"],
		[() => throwFailure($ms.arakni.ups()), "arakni"],
		[() => throwFailure($ms.katsu.ups()), "katsu"],
		[() => throwFailure($ms.oscilio.ups()), "oscilio"],
	];

    if (isRecord(args) && typeof args.sn === "string") {
        const allUps = sources.flatMap(x => x[0]());

        return allUps.find(x => x.sn === args.sn);
    }

	const upgrades: {
		owner: string;
		name: string;
		cost?: number;
		sn: string;
		rarity: number;
		loaded: boolean;
	}[] = [];
	for (const source of sources) {
		if (isRecord(args) && args.user !== source[1]) continue;

		const list = source[0]().filter((x) =>
			typeof x.name === "string" ? !x.name.includes("k3y") : true,
		);

		for (const u of list) {
			if (_END - Date.now() < 500) break;

			if (typeof u.name === "string" && u.name?.includes("k3y")) continue;

			const s = JSON.parse(JSON.stringify(u));
			for (const key of ["i", "sn", "loaded", "description"]) delete s[key];

			if (s.cooldown) s.cooldown = { $gte: s.cooldown };
			if (s.amount) s.amount = { $gte: s.amount };
			if (s.cost) s.cost = { $gte: s.cost };
			if (s.count) s.count = { $lte: s.count };
			if (s.chars) s.chars = { $lte: s.chars };
			if (s.max_glock_amnt) s.max_glock_amnt = { $lte: s.max_glock_amnt };
			if (s.expire_secs) s.expire_secs = { $gte: s.expire_secs };

			if (
				upgrades.find((x) =>
					["name", "rarity", "tier"].every((key) => {
						//@ts-ignore
						return s[key] === x[key];
					}),
				)?.cost
			)
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
				cost:
					typeof x._market_low === "string"
						? x._market_low
						: x._market_low?.cost,
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
					if (isRecord(args) && "user" in args)
						return a.loaded === b.loaded ? 0 : a.loaded ? -1 : 1;

					if (b.rarity === a.rarity)
						return (
							(typeof b.cost === "number" ? b.cost : 0) -
							(typeof a.cost === "number" ? a.cost : 0)
						);
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
				typeof x.cost === "string"
					? x.cost
					: x.cost
						? lib.to_gc_str(x.cost)
						: "",
				x.sn ?? "",
			]),
		],
		context.cols,
	);
}
