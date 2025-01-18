export default function (context: Context, args?: unknown) {
	const trash = $hs.sys.upgrades({
		filter: {
			loaded: false,
		},
	});

	if ("ok" in trash && !trash.ok) return trash;

	if (!Array.isArray(trash)) return trash;

	$ls.sys.cull({
		i: trash
			.filter((x) => x.rarity < 2)
			.filter((x) => !x.name.includes("k3y"))
			.map((x) => x.i),
		confirm: true,
	});
}
