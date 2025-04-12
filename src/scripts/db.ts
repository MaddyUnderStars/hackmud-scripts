import { isRecord } from "/lib/isRecord";

export default function (context: Context, args?: unknown): unknown {
	$ms.maddy.whitelist();

	if (!isRecord(args) || !args.t) {
		const count = $db.f({}).count_and_close();

		return {
			ok: false,
			msg: `maddy.db { t: "i" | "f" | "r", a: MongoDbOpts }\n\ntotal records: ${count}`,
		};
	}

	if (args.t === "f" || args.t === "c") {
		//@ts-ignore
		const cursor = $db.f(args.a, args.p);

		//@ts-ignore
		if (args.n) cursor.limit(args.n);
		//@ts-ignore
		if (args.s) cursor.skip(args.s);

		return args.t === "f"
			? cursor
					.array()
					.map((x) => (Object.keys(x).length === 1 ? Object.values(x)[0] : x))
			: cursor.count_and_close();
	}

	if (args.t === "r") {
		if (!args.confirm) {
			//@ts-ignore
			return `${JSON.ostringify($db.f(args.a).array(), null, 2)}\n\nconfirm: true`;
		}

		//@ts-ignore
		return $db.r(args.a);
	}

	if (args.t === "i") {
		//@ts-ignore
		return $db.i(args.a);
	}

	if (args.t === "u") {
		//@ts-ignore
		return $db.u(args.a, args.u);
	}
}
