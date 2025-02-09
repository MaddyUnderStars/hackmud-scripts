import { isFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";

const LOC_REGEX =
	/[a-z_0-9]*\.(?:access|entry|extern|external|info|out|p|pub|pubinfo|pub_info|public)_[a-z0-9]{6}$/gm;

export default (
	context: Context,
	args?: unknown,
): { ok: boolean; msg?: string } => {
	$fs.maddy.whitelist();

	if (!args || !isRecord(args))
		return {
			ok: true,
			msg: `${$db.f({ _id: { $regex: "loc" } }).count()} locs in db`,
		};

	if (!Object.keys(args).length)
		return {
			ok: true,
			msg: $db
				.f({ _id: { $regex: "loc" }, loc: { $type: "string" } })
				.array()
				.map((x) => x.loc)
				.join("\n"),
		};

	if (typeof args.user === "string") {
		const found = $db
			.f({ _id: { $regex: `loc_${args.user}` }, loc: { $type: "string" } })
			.first();
		if (!found) return { ok: false };
		return { ok: true, msg: found.loc };
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
