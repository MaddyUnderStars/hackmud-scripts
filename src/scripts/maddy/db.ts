import { isRecord } from "/lib/isRecord";

export default function (context: Context, args?: unknown) {
	if (!isRecord(args) || !args.t || !args.a || !isRecord(args.a))
		return {
			ok: false,
			msg: 'maddy.db { t: "i" | "f" | "r", a: MongoDbOpts }',
		};

    if (args.t === "f") {
        //@ts-ignore
        return $db.f(args.a).array();
    }

    if (args.t === "r") {
        //@ts-ignore
        return $db.r(args.a);
    }

    if (args.t === "i") {
        //@ts-ignore
        return $db.i(args.a);
    }
}
