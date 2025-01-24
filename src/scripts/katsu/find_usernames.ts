
const t1_corps = [
	$fs.bunnybat_hut.public,
	$fs.cyberdine.public,
	$fs.setec_gas.public,
	$fs.soylentbean.public,
	$fs.suborbital_airlines.public,
	$fs.tandoori.public,
	$fs.tyrell.public,
	$fs.weyland.public,
];

const read = (
	scriptor: (...rest: unknown[]) => unknown,
	args?: unknown,
): string => {
	return $fs.maddy.read({
		s: {
            name: "test",
			call: scriptor,
		},
		a: args,
	});
};

export default function (context: Context, args?: unknown) {
	$ms.maddy.whitelist();

	if (args) {
		return $db
			.f({ s: "corp_usernames" })
			.array()
			.map((x) => x.name);
	}

	const names = new Set<string>();

	for (const corp of t1_corps) {
		const home = read(corp);
		const empty = read(corp, {});

		const navArgName = empty.split(":")[0].split(" ").splice(-1)[0];

		// get the nav values from home page
		const [blogNav] = home
			.split("\n")
			.splice(-1)[0]
			.split("|")
			.map((x) => x.trim());

		const blog = read(corp, { [navArgName]: blogNav });

		const usernames = [
			...blog.matchAll(/(^(.*?) of project)|(-- (.*?) when being)/gim),
		].map((x) => x.filter((y) => !!y).splice(-1)[0]);

		for (const n of usernames) names.add(n);
	}

	for (const name of names) {
		const _id = `corp_usernames_${name}`;
		if ($db.f({ _id }).count() > 0) continue;

		$db.i({ _id, name, s: "corp_usernames" });
	}
}
