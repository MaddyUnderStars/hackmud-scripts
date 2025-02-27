import { isFailure, throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

const exec = (scriptor: Scriptor, args?: unknown): string => {
	return throwFailure($fs.maddy.read({ s: scriptor, a: args }));
};

const NPC_LOC_REGEX =
	/^(?:abandoned|abndnd|anon|anonymous|derelict|uknown|unidentified|unknown)_(?:jr|(?:jr|dd|wb|pr|ls)(?:wlf|wvr|ttl|rvn|stg))_[a-z0-9]{6}\.(?:access|entry|extern|external|info|out|p|pub|pubinfo|pub_info|public)_[a-z0-9]{6}$/gm;

const HELP_TEXT =
	"t2 loc scraper. pass corp scriptor as `Ns`\ncheck out maddy.corps { tier: 2 } for corp scripts.";

export default function (context: Context, args?: unknown) {
	if (!isRecord(args) || !isScriptor(args.s)) return HELP_TEXT;

	const usernames = $fs.katsu.find_usernames({}) as string[];

	const locs: string[] = [];

	let i = typeof args.i === "number" ? args.i : 0;
	let timeout = false;

	for (; i < usernames.length; i++) {
		const username = usernames[i];

		if (_END - Date.now() < 1000) {
			timeout = true;
			break;
		}

		i++;

		const codes: Array<{ id: string }> | string = $fs.dtr.qr({
			t: args.s,
			a: {
				username,
				process: "order_qrs",
				cmd: "order_qrs",
				nav: "order_qrs",
				navigation: "order_qrs",
				get: "order_qrs",
				show: "order_qrs",
				action: "order_qrs",
				see: "order_qrs",
				entry: "order_qrs",
				open: "order_qrs",
				command: "order_qrs",
			},
		});

		// does not exist, no codes on this username
		if (typeof codes === "string") continue;

        // shifting, typically
        if (isFailure(codes)) return codes.msg;

		for (const code of codes) {
			if (_END - Date.now() < 1000) {
				timeout = true;
				break;
			}

			const out = exec(args.s as Scriptor, {
				username,
				order_id: code.id,
				process: "cust_service",
				cmd: "cust_service",
				nav: "cust_service",
				navigation: "cust_service",
				get: "cust_service",
				show: "cust_service",
				action: "cust_service",
				see: "cust_service",
				entry: "cust_service",
				open: "cust_service",
				command: "cust_service",
			});

			const l = [
				...out.matchAll(
					/([a-z_][a-z_0-9]{0,24})\.?((?:info|out|external|public|pub|pub_info|pubinfo|p|access|entry|extern)_[a-z0-9]{6})/g,
				),
			]
				.filter((x) => x[0].includes("."))
				.map((x) => `${x[1]}.${x[2]}`);

			locs.push(...l);
		}
	}

	const player_locs: string[] = [];
	const npc_locs: string[] = [];
	for (const loc of locs) {
		if (loc.match(NPC_LOC_REGEX)) npc_locs.push(loc);
		else {
			player_locs.push(loc);

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
	}

	$fs.maddy.locs;

	return `${npc_locs.join("\n")}\n\n${player_locs.join("\n")}${timeout ? `\n\ndid not finish scrape. pass i: ${i} to continue` : ""}`;
}
