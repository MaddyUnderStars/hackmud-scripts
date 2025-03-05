import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

const exists = (name: string) => {
	const [last_action] = $fs.users.last_action({ name });
	return !!last_action;
};

const lookup = (name: string) => {
	const entry = $db
		.f({
			_id: `who_is_${name}`,
		})
		.first();

	if (!entry) return false;

	if ("redirect" in entry && typeof entry.redirect === "string")
		return lookup(entry.redirect);

	return entry;
};

export default (context: Context, args?: unknown) => {
	$fs.maddy.whitelist();

	if (!isRecord(args)) {
		return "usage:\nmaddy.who_is user\nmaddy.who_is { user: string[], is: string, meta: { any... } }";
	}

	if (
		args.user &&
		Array.isArray(args.user) &&
		args.is &&
		typeof args.is === "string"
	) {
		const all = [...args.user, args.is];
		for (const user of all) {
			if (!exists(user)) {
				return { ok: false, msg: `${user} does not exist` };
			}
		}

		const date = new Date();

		for (const user of args.user) {
			$db.us(
				{ _id: `who_is_${user}` },
				{ $set: { redirect: args.is, added: date } },
			);
		}

		const set = Object.assign({}, args.meta, { added: date });

		$db.us({ _id: `who_is_${args.is}` }, { $set: set });
	}

	if (args.input && typeof args.input === "string") {
		const entry = lookup(args.input);
		if (!entry) return { ok: false };

		const metaKeys = Object.keys(entry).filter((x) => x !== "_id");
		const name = entry._id.replace("who_is_", "");
		//@ts-ignore
		// biome-ignore lint/performance/noDelete: <explanation>
		delete entry._id;
		return table(
			[
				["user", ...metaKeys],
				[],
				[
					name,
					...Object.values(entry).map((x) => {
						if (x instanceof Date) return x.toUTCString();
						return x?.toString() ?? "";
					}),
				],
			],
			context.cols,
		);
	}
};
