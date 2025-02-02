import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

export interface Key {
	k3y: string;
	user: string;
	sn: string;
	rarity: number;
	loaded: boolean;
	tier: number;
}

const keyrings = {
	ira: $ls.ira.keyring,
	squizzy: $ls.squizzy.keyring,
	katsu: $ls.katsu.keyring,
	uzuri: $ls.uzuri.keyring,
	// verdance: $s.verdance.keyring,
};

const getAllKeys = (owner: string) => {
	const keys: Key[] = [];
	const users = [...Object.keys(keyrings), owner];
	for (const user of users) {
		let ret: unknown;
		if (user === owner)
			ret = $fs.sys.upgrades_of_owner({
				filter: { k3y: null },
				full: true,
			});
		else ret = keyrings[user as keyof typeof keyrings]();

		if (!Array.isArray(ret)) {
			keys.push({
				user,
				k3y: "failed to fetch keys",
				loaded: false,
				rarity: 0,
				sn: "",
				tier: -1,
			});
			continue;
		}

		keys.push(...ret.map((x) => Object.assign({}, x, { user })));
	}
	return keys.sort((a, b) => {
		if (a.tier === b.tier) {
			if (a.rarity === b.rarity) {
				return a.k3y === b.k3y ? 1 : -1;
			}
			return b.rarity - a.rarity;
		}
		return b.tier - a.tier;
	});
};

export default (context: Context, args: unknown) => {
	const SCRIPT_OWNER = context.this_script.split(".")[0];

	$ms.maddy.whitelist();

	if (!args || !isRecord(args)) {
		const keys = getAllKeys(SCRIPT_OWNER);

		if (context.calling_script) return keys;

		return table(
			[
				["k3y", "user", "tier", "loaded"],
				[],
				...keys.map((x) => {
					if (x.tier === -1) return ["failed", x.user, "", ""];
					return [
						`\`${x.rarity}${x.k3y}\``,
						x.user,
						`${x.tier}`,
						`${x.loaded}`,
					];
				}),
			],
			context.cols,
		);
	}

	if (typeof args.market === "string") {
		const keys = $fs.market.browse({ k3y: args.market });
		if (!Array.isArray(keys)) return keys;

		if (!keys.length) return { ok: false, msg: "no results on market" };

		const lib = $fs.scripts.lib();

		if (typeof args.buy === "number" || typeof args.buy === "string") {
			const cheapest = keys.sort((a, b) => a.cost - b.cost)[0];

			const buy =
				typeof args.buy === "number" ? args.buy : lib.to_gc_num(args.buy);

			if (typeof buy !== "number") return buy;

			if (cheapest.cost > buy)
				return {
					ok: false,
					msg: `cheapest ${lib.to_gc_str(cheapest.cost)} > ${lib.to_gc_str(buy)}`,
				};

			const xfer = $ms.squizzy.xfer({ amount: cheapest.cost });
			if (isRecord(xfer) && "ok" in xfer && !xfer.ok) return xfer;

			return $ms.market.buy({ i: cheapest.i, count: 1, confirm: true });
		}

		return table(
			[["i", "cost"], [], ...keys.map((x) => [x.i, lib.to_gc_str(x.cost)])],
			context.cols,
		);
	}

	if ("unload" in args) {
		const keys = $hs.sys.upgrades({ filter: { k3y: null } });
		if (!Array.isArray(keys)) return keys;

		$ms.sys.manage({ unload: keys.map((x) => x.i) });

		$ls.sys.xfer_upgrade_to({ i: keys.map((x) => x.i), to: "squizzy" });

		if (Object.keys(args).length === 1) return { ok: true };
	}

	if (typeof args.load === "string" || Array.isArray(args.load)) {
		const requested: string[] = Array.isArray(args.load)
			? args.load
			: [args.load];

		const allKeys = getAllKeys(SCRIPT_OWNER);

		const found = allKeys.filter((x) => requested.includes(x.k3y) && !x.loaded);

		const groupedByUser: Record<string, string[]> = {};
		for (const key of found)
			groupedByUser[key.user] = groupedByUser[key.user]
				? [...groupedByUser[key.user], key.k3y]
				: [key.k3y];

		for (const user in groupedByUser) {
			if (user === SCRIPT_OWNER) continue;

			const keys = groupedByUser[user];

			const ret = keyrings[user as keyof typeof keyrings]({ load: keys });
			if ("ok" in ret && !ret.ok) return ret;

			//@ts-expect-error
			const localKey = $hs.sys.upgrades({ filter: { k3y: { $in: keys } } });
			if (!Array.isArray(localKey) || !localKey.length)
				return { ok: false, msg: "failed to transfer keys" };

			$ls.sys.manage({ load: localKey.map((x) => x.i) });
		}

		return { ok: true };
	}

	return (
		"maddy.keyring\n" +
		"no args - show all keys on all users\n" +
		'{ load: "key" } - load a key from any user\n' +
		'{ market: "key", buy: "?gc" } - buy a key\n' +
		"{ unload: true } - send all keys away. can be chained with load"
	);
};
