import { makeBotnetCheckinId } from "/lib/botnet/ids";
import jobs from "/lib/botnet/jobs";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";
import { readableMs } from "/lib/time";

export default (context: Context, args?: unknown) => {
	// to prevent shifting
	$ns.maddy.whitelist();

	const users = ["squizzy", "katsu", "oscilio", "arakni", "enigma"];

	if (isRecord(args) && typeof args.user === "string") {
		const lib = $fs.scripts.lib();

		const logs = $db
			.f({
				_id: { $regex: `botnet_log_${args.user}` },
				logs: { $type: "array" },
				date: { $type: "date" },
			})
			.limit(20)
			.sort({ date: -1 })
			.array();

		return logs.flatMap((log) => [log.date, log.logs, "\n"]);
	}

	const checkins = users.flatMap((name) =>
		$db
			.f({
				_id: makeBotnetCheckinId(name),
				date: { $type: "date" },
				breached: { $type: "bool" },
				brain: { $type: "object" },
			})
			.array(),
	);

	return `Botnet health\n\nactive jobs: ${Object.keys(jobs).join(", ")}\n\n${table(
		[
			["user", "status", "last check-in", ""],
			[],
			...checkins.map((x) => {
				const name = x._id.split("_").slice(-1)[0];

				return [
					name,
					x.breached ? "`DBREACHED`" : "`LSafe`",
					readableMs(Date.now() - x.date.valueOf()),
					(x.brain.cooldown as number) < (Date.now() - x.date.valueOf()) / 1000
						? "`DMISSED CHECK-IN`"
						: "",
				];
			}),
			...users
				.filter(
					(x) => !checkins.find((y) => x === y._id.split("_").slice(-1)[0]),
				)
				.map((x) => [x, "`Dunknown`", ""]),
		],
		context.cols,
	)}`;
};
