export default (context: Context, args: unknown[]) => {
	const myUsers = ["maddy", "ira", "squizzy", "katsu"];
	if (!myUsers.includes(context.caller)) return $ms.squizzy.xfer();

	const ups = $hs.sys.upgrades_of_owner({ full: true });

	if (!Array.isArray(ups)) return ups;

	if (args && "sn" in args) {
		const upgrade = ups.find((x) => x.sn === args.sn);

		return upgrade;
	}

	return ups;
};
