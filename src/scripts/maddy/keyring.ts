import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

const keyrings = {
	maddy: $ls.maddy.keyring,
	ira: $ls.ira.keyring,
	squizzy: $ls.squizzy.keyring,
	katsu: $ls.katsu.keyring,
	uzuri: $ls.uzuri.keyring,
	// verdance: $s.verdance.keyring,
};

interface Key {
	k3y: string;
	user: string;
	sn: string;
	rarity: number;
	loaded: boolean;
	tier: number;
}

const getAllKeys = () => {
	const keys: Key[] = [];
	for (const user in keyrings) {
		const ret: Key[] = keyrings[user as keyof typeof keyrings]();

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
	$ms.maddy.whitelist();

	// no args, return list of keys from all users
	if (!args || !isRecord(args)) {
		if (context.calling_script?.split(".")?.[1] === "keyring") {
			// We're a subscript
			// get all of this users keys

			return $hs.sys.upgrades_of_owner({ filter: { k3y: null }, full: true });
		}

		const keys = getAllKeys();

		return table(
			[
				["k3y", "tier", "user", "loaded"],
				[],
				...keys.map((x) => [
					`\`${x.rarity}${x.k3y}\``,
					`${x.tier}`,
					x.user,
					`${x.loaded}`,
				]),
			],
			context.cols,
		);
	}

	if ("list" in args && args.list) {
		return getAllKeys();
	}

	// browse the market for keys
	if ("market" in args && typeof args.market === "string") {
		const keys = $fs.market.browse({ k3y: args.market });
		if (!Array.isArray(keys)) return keys;

		if (!keys.length) return { ok: false, msg: "no results on market" };

		const lib = $fs.scripts.lib();

		if (
			("buy" in args && typeof args.buy === "number") ||
			typeof args.buy === "string"
		) {
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

		// if this is the only arg, just return now
		// otherwise, we might want to load
		if (Object.keys(args).length === 1) return { ok: true };
	}

	// load a key
	if ("load" in args && typeof args.load === "string") {
		// if we're a subscript, send our key to them
		if (context.calling_script?.split(".")?.[1] === "keyring") {
			const keys = $hs.sys.upgrades_of_owner({
				filter: { k3y: args.load },
				full: true,
			});

			if (!Array.isArray(keys) || !keys.length)
				return { ok: false, msg: "key not found on remote" };

			const key: Omit<Key, "user"> = keys[0];

			$fs.sys.xfer_upgrade_to_caller({ sn: key.sn });

			return { ok: true };
		}

		// if we're not a subscript, get the key from them and load it

		const keys = getAllKeys();

		const key = keys.find((x) => x.k3y === args.load);
		if (!key) return { ok: false, msg: "key not found" };

		const ret = keyrings[key.user as keyof typeof keyrings]({ load: key.k3y });
		if ("ok" in ret && !ret.ok) return ret;

		const localKey = $hs.sys.upgrades({ filter: { k3y: key.k3y } });
		if (!Array.isArray(localKey) || !localKey.length)
			return { ok: false, msg: "failed to transfer key" };

		$ls.sys.manage({ load: localKey[0].i });

		return { ok: true };
	}

	return (
		"maddy.keyring\n" +
		"no args - show all keys on all users\n" +
		'{ load: "key" } - load a key from any user\n' +
		'{ market: "key", buy: "?gc" } - buy a key\n' +
		"{ unload: true } - send all keys away"
	);
};
