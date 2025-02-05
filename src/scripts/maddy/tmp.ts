
export default function (context: Context, args?: unknown) {
	return $db.f({ s: "t1", k: "l0cket" }).array();

	$db.r({ s: "t2", k: "sn_w_glock" });

	const glock = [
		["hunter''s", "3K6GC"],
		["secret", "7GC"],
		["secure", "443GC"],
		["meaning", "43GC"],
		["beast", "666GC"],
		["special", "38GC"],
		["magician", "1K89GC"],
		["elite", "1K337GC"],
		["monolithic", "2K1GC"],
	];

	// biome-ignore lint/complexity/noForEach: <explanation>
	glock.forEach((x) => {
		$db.i({
			s: "t2",
			k: "sn_w_glock",
			q: x[0],
			a: x[1],
		});
	});

	return;

	$db.r({ s: "t1", k: "c" });

	const colors = [
		"green",
		"lime",
		"yellow",
		"orange",
		"red",
		"purple",
		"blue",
		"cyan",
	];

	// biome-ignore lint/complexity/noForEach: <explanation>
	colors.forEach((x, i) => {
		$db.i({
			s: "t1",
			k: "c",
			a: x,
			i,
		});
	});

	return;

	$db.r({ s: "t1", k: "dc1" });
	$db.r({ s: "t1", k: "datacheck" });

	const answers = [
		["did", "fran_lee"],
		["hou", "robovac"],
		["jus", "sentience"],
		["iss", "sans_comedy"],
		["ie's", "angels"],
		["ry's", "minions"],
		["che", "sisters"],
		["will ", "petra"],
		["he's", "fountain"],
		["hal", "helpdesk"],
		["pet", "bunnybat"],
		["dep", "get_level"],
		["atm", "weathernet"],
		["act", "eve"],
		["ure", "resource"],
		["end ", "bo"],
		["n3", "heard"],
		["instruction", "teach"],
		["gc", "outta_juice"],
		["caf", "poetry"],

		// v2
		["agn", "diagalpha"],
		["fast", "crowsnest"],
		["anja", "blazer"],
		["skim", "dead"],
		["ve, h", "engaged"],
		["flight", "a2231"],
		["arch", "obsessive"],
		["cond", "atlanta"],
		["idiom", "skimmerite"],
		["m_id", "piano"],
		["moreso", "idp1p1"],
		["idk3w2", "well"],
		["ol'", "nubloopstone"],
		["nub's", "sheriff"],
		["ascent", "nowhere"],
		["theme", "executives"],
		["council", "thirteen"],
		["stars", "bnnyhunter"],
		["s:o", "unvarnishedpygmyumbrella"],
		["dron", "goodfellow"],
		["packbot", "lime"],
		["ComCODE", "mallory"],
		["blu", "hammer"],
		["ons as", "index"],
		["kill", "making"],
		["designat", "110652"],
	];

	// biome-ignore lint/complexity/noForEach: <explanation>
	answers.forEach((x) => {
		$db.i({
			s: "t1",
			k: "datacheck",
			q: x[0],
			a: x[1],
		});
	});

	return { ok: true };
}
