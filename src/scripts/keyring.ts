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

	if (
		isRecord(args) &&
		(typeof args.load === "string" || Array.isArray(args.load))
	) {
		const requested: string[] = Array.isArray(args.load)
			? args.load
			: [args.load];

		const keys = $hs.sys.upgrades_of_owner({
			//@ts-ignore
			filter: { k3y: { $in: requested }, loaded: false },
			full: true,
		});

		if (!Array.isArray(keys) || !keys.length) return { ok: false, msg: keys };

		const sending: Map<string, string> = new Map(
			//@ts-expect-error
			keys.map((x: Omit<Key, "user">) => [x.k3y, x.sn]),
		);

		return $fs.sys.xfer_upgrade_to_caller({ sn: [...sending.values()] });
	}

	return $hs.sys.upgrades_of_owner({ filter: { k3y: null }, full: true });
};
