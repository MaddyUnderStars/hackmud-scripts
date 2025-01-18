import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

const exec = (scriptor: Scriptor, args?: unknown): string => {
	return $fs.maddy.read({ s: scriptor, a: args });
};

export default function (context: Context, args?: unknown) {
	if (!isRecord(args)) return { ok: false };
	if (!args.s || !isScriptor(args.s)) return { ok: false };

	const usernames = $ms.katsu.find_usernames({}) as string[];

	const membersHome = usernames.map((x) =>
		exec(args.s as Scriptor, {
			username: x,
		}),
	)[0];

	const membersNavArg = membersHome.split("\n")[2].trim();

	const qrCodes = usernames
		.flatMap((x) =>
			// thank you dtr
			$fs.dtr.qr({
				t: args.s,
				a: {
					username: x,
					[membersNavArg]: "order_qrs",
				},
			}),
		)
		.filter((x) => isRecord(x));

    return qrCodes;

	const locs = new Set<string>();
	let failedCount = 0;
	for (const code of qrCodes) {
		for (const username of usernames) {
			if (_END - Date.now() < 500) {
				locs.add("ran out of time");
				break;
			}

			const output = exec(args.s as Scriptor, {
				username,
				[membersNavArg]: "cust_service",
				order_id: code.id,
			});

			if (output.includes("does not exist")) {
				failedCount++;
				continue;
			}

			const l = output.matchAll(
				/([a-z_][a-z_0-9]{0,24})\.?((?:info|out|external|public|pub|pub_info|pubinfo|p|access|entry|extern)_[a-z0-9]{6})/g,
			);
			if (!l) continue;

			for (const x of l) {
                if (!x[0].includes(".")) {
                    locs.add(`${x[1]}.${x[2]}`)
                    continue;
                }
				locs.add(x[0]);
			}
		}
	}
	return [...locs, failedCount];
}
