export default function (context: Context, args?: unknown) {
	const brain = $hs.sys.upgrades({
		filter: { type: "bot_brain", loaded: true },
		full: true,
	});

	if (!Array.isArray(brain)) return;

	const cost = brain[0].cost;

	$ms.squizzy.xfer({ amount: cost });

	return $ms.katsu.find_usernames();
}
