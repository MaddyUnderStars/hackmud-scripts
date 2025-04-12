import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

const exec = (scriptor: Scriptor, args?: unknown) => {
	return throwFailure($fs.maddy.read({ s: scriptor, a: args }));
};

const NPC_LOC_REGEX =
	/^(?:abandoned|abndnd|anon|anonymous|derelict|uknown|unidentified|unknown)_(?:jr|(?:jr|dd|wb|pr|ls)(?:wlf|wvr|ttl|rvn|stg))_[a-z0-9]{6}\.(?:access|entry|extern|external|info|out|p|pub|pubinfo|pub_info|public)_[a-z0-9]{6}$/gm;

const PASSWORDS = [
	"plantowin",
	"thenumberone",
	"bethebest",
	"supercalifragilisticexpialidocious",
	"knowyourteam",
];

export default function (
	context: Context,
	args?: unknown,
): ScriptFailure | string[] {
	$fs.maddy.analytics({ context, args });

	if (!isRecord(args) || !isScriptor(args.s))
		return { ok: false, msg: "maddy.search_t1 { s: #s.corp.script }" };

	const empty = exec(args.s, {});

	// get the directory nav
	const peopleNav = empty.split(":").splice(-1)[0].replaceAll('"', "");

	let password = "";

	const locs = [];
	const projects = $fs.katsu.find_usernames({ projects: true }) as string[];
	for (const project of projects) {
		if (_END - Date.now() < 500) {
			locs.push("\nran out of time.");
			break;
		}

		if (!password) {
			for (const curr of PASSWORDS) {
				const out = exec(args.s, {
					process: peopleNav,
					cmd: peopleNav,
					nav: peopleNav,
					navigation: peopleNav,
					get: peopleNav,
					show: peopleNav,
					action: peopleNav,
					see: peopleNav,
					entry: peopleNav,
					open: peopleNav,
					command: peopleNav,
					pass: curr,
					password: curr,
					p: curr,
				});

				if (out.includes("Authenticated")) {
					password = curr;
					break;
				}
			}

			if (!password)
				// tried them all
				return { ok: false, msg: "failed to find password" };
		}

		const curr = exec(args.s, {
			process: peopleNav,
			cmd: peopleNav,
			nav: peopleNav,
			navigation: peopleNav,
			get: peopleNav,
			show: peopleNav,
			action: peopleNav,
			see: peopleNav,
			entry: peopleNav,
			open: peopleNav,
			command: peopleNav,
			pass: password,
			password: password,
			p: password,
			project,
		});

		locs.push(
			...curr
				.split("\n")
				.filter((x) => x.match(/^[A-Za-z_\d]+?\.[A-Za-z_\d]+?$/gim)),
		);
	}

	for (const loc of locs) {
		if (
			loc &&
			!loc.match(NPC_LOC_REGEX) &&
			loc.match(/^[A-Za-z_\d]+?\.[A-Za-z_\d]+?$/gim) &&
			!"¡¢Á¤Ã¦§¨©ª".split("").find((x) => loc.includes(x))
		) {
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

	return locs;
}
