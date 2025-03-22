import { isFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";

export default (
	context: Context,
	args?: unknown,
): { ok: boolean; msg?: string } => {
	$fs.maddy.whitelist();

	if (!args || !isRecord(args))
		return {
			ok: true,
			msg: `${$db.f({ _id: { $regex: "loc" } }).count()} locs in db\nuse {} for all locs.\nuse \`Nuser\`: \`Vstring\` to get user loc\n\`Nrecent\`: \`Vtrue\` to get the most recently added locs\npass space delimited string to add locs`,
		};

	if (!Object.keys(args).length) {
		return {
			ok: true,
			msg: $db
				.f({ _id: { $regex: "loc" }, loc: { $type: "string" } })
				.array()
				.map((x) => x.loc)
				.join("\n"),
		};
	}

	if (typeof args.user === "string") {
		const found = $db
			.f({
				_id: { $regex: `loc_${args.user}` },
				loc: { $type: "string" },
				user: { $type: "string" },
			})
			.first();
		if (!found) return { ok: false };

		const activity = $fs.users.last_action({ name: found.user })[0];

		if (context.calling_script) return { ok: true, msg: found.loc };
        
		return { ok: true, msg: `${found.loc} - ${activity?.t?.toUTCString()}` };
	}

	if (args.recent === true) {
		return {
			ok: true,
			msg: $db
				.f({
					_id: { $regex: "loc" },
					loc: { $type: "string" },
				})
				.sort({ date: -1 })
				.limit(20)
				.array()
				.map((x) => x.loc)
				.join("\n"),
		};
	}

	if ("input" in args && typeof args.input === "string") {
		const log = [];
		const locs = args.input
			.split(" ")
			.map((x) => x.trim())
			.filter((x) => !!x);

		for (const loc of locs) {
			// if (!LOC_REGEX.test(loc)) {
			// 	log.push(`${loc} did not match regex`);
			// 	continue;
			// }

			const access = $fs.scripts.get_access_level({ name: loc });
			if (isFailure(access)) {
				log.push(`${loc} ${access.msg}`);
				continue;
			}

			if (!access.hidden && !access.public && !access.trust) {
				log.push(`${loc} not public hidden`);
				continue;
			}

			$db.us(
				{
					_id: `loc_${loc}`,
				},
				{
					$set: {
						loc,
						date: new Date(),
						user: loc.split(".")[0],
					},
				},
			);
		}

		return log.length ? { ok: false, msg: log.join("\n") } : { ok: true };
	}

	return { ok: false };
};
