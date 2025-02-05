// @autocomplete tier: 1

import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";

const CORP_USERNAMES = [
	"legion_bible",
	"ros_13_update_checker",
	"soylentbean",
	"weathernet",
	"amal_robo",
	"aon",
	"archaic",
	"bluebun",
	"bunnybat_hut",
	"context",
	"core",
	"cyberdine",
	"empty_nest",
	"etceteraco",
	"futuretech",
	"goodfellow",
	"halperyon",
	"kill_9_1",
	"kill_bio",
	"legion_intl",
	"light",
	"lowell_extermination",
	"macro_polo",
	"merrymoor_pharma",
	"nation_of_wales",
	"nuutec",
	"pica",
	"protein_prevention",
	"ros13",
	"setec_gas",
	"skimmerite",
	"sn_w",
	"subject_object",
	"tandoori",
	"turing_testing",
	"tyrell",
	"vacuum_rescue",
	"welsh_measles_info",
	"gibson",
	"the_holy_checksum",
	"world_pop",
];

const tierToSec = {
	1: ["f"],
	2: ["h", "m"],
	3: ["l"],
	4: ["n"],
} as Record<number, string[]>;

export default (context: Context, args?: unknown) => {
	if (
		!isRecord(args) ||
		!args.tier ||
		typeof args.tier !== "number" ||
		!(args.tier in tierToSec)
	)
		return "maddy.corps { tier: 1-4 }\n\nGet all corp scripts for a tier";

	const seclevels = tierToSec[args.tier];

	const scripts: string[] = seclevels.flatMap((sec) =>
		throwFailure($ms.maddy.scripts({ level: sec, page: 0 })),
	);

	const filtered = scripts.filter((x) =>
		CORP_USERNAMES.some((y) => x.includes(y)),
	);

	if (context.calling_script) return filtered;

	const lib = $fs.scripts.lib();

	return lib.columnize(filtered);
};
