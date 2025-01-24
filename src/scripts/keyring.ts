import { isRecord } from "/lib/isRecord";

interface Key {
	k3y: string;
	user: string;
	sn: string;
	rarity: number;
	loaded: boolean;
}

export default (context: Context, args: unknown) => {
	$ms.maddy.whitelist();

    if (!isRecord(args)) return { ok: false };

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
