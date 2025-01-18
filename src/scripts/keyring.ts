import { throwWhitelist } from "/lib/auth";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

const keyrings = {
	maddy: $ls.maddy.keyring,
	ira: $ls.ira.keyring,
	squizzy: $ls.squizzy.keyring,
	katsu: $ls.katsu.keyring,
	// verdance: $s.verdance.keyring,
};

interface Key {
	k3y: string;
	user: string;
	sn: string;
	rarity: number;
	loaded: boolean;
}

const getAllKeys = (caller: string) => {
	const keys: Key[] = [];
	for (const user in keyrings) {
		const ret: Key[] = keyrings[user as keyof typeof keyrings]();

		keys.push(...ret.map((x) => Object.assign({}, x, { user })));
	}
	return keys;
};

export default (context: Context, args: unknown) => {
	throwWhitelist(context.caller);

	// no args, return list of keys from all users
	if (!args || !isRecord(args)) {
		if (context.calling_script) {
			// We're a subscript
			// get all of this users keys

			return $hs.sys.upgrades_of_owner({ filter: { k3y: null }, full: true });
		}

		const keys = getAllKeys(context.caller);

		return table(
			[
				["k3y", "user", "loaded"],
				[],
				...keys
					.sort((a, b) => (a.k3y === b.k3y ? 1 : -1))
					.map((x) => [`\`${x.rarity}${x.k3y}\``, x.user, `${x.loaded}`]),
			],
			context.cols,
		);
	}

	if ("load" in args && typeof args.load === "string") {
		// if we're a subscript, send our key to them
		if (context.calling_script) {
			const keys = $hs.sys.upgrades_of_owner({
				filter: { k3y: args.load },
				full: true,
			});

			if (!Array.isArray(keys) || !keys.length)
				return { ok: false, msg: keys };

			const key: Omit<Key, "user"> = keys[0];

			$fs.sys.xfer_upgrade_to_caller({ sn: key.sn });

			return { ok: true };
		}
	}

	return $ls.maddy.keyring(args);
};
