import { isRecord } from "/lib/isRecord";

export default function (context: Context, args?: unknown) {
	$ms.maddy.whitelist();

	if (!isRecord(args) || !args.t)
		return {
			ok: false,
			msg: 'maddy.db { t: "i" | "f" | "r", a: MongoDbOpts }',
		};

	if (args.t === "f") {
		//@ts-ignore
		return $db.f(args.a).array();
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
}
