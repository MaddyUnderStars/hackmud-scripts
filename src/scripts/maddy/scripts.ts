// @autocomplete level: 0, page: 0

import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";

const SECLEVELS = {
	f: 0,
	h: 1,
	m: 2,
	l: 3,
	n: 4,
	fullsec: 0,
	highsec: 1,
	midsec: 2,
	lowsec: 3,
	nullsec: 4,
	full: 0,
	high: 1,
	mid: 2,
	low: 3,
	null: 4,
	"0": 0,
	"1": 1,
	"2": 2,
	"3": 3,
	"4": 4,
} as Record<string, number>;

const HELP_TEXT = `public scripts helper.\nmaddy.scripts { level: number|string, page?: number }\n\nlevel can be any of:\n- ${[0, 1, 2, 3, 4, ...Object.keys(SECLEVELS)].map((x) => JSON.stringify(x)).join("\n- ")}`;

const PUBLICS = [
	(sector?: string) =>
		sector ? $fs.scripts.fullsec({ sector }) : $fs.scripts.fullsec(),
	(sector?: string) =>
		sector ? $fs.scripts.highsec({ sector }) : $fs.scripts.highsec(),
	(sector?: string) =>
		sector ? $fs.scripts.midsec({ sector }) : $fs.scripts.midsec(),
	(sector?: string) =>
		sector ? $fs.scripts.lowsec({ sector }) : $fs.scripts.lowsec(),
	(sector?: string) =>
		sector ? $fs.scripts.nullsec({ sector }) : $fs.scripts.nullsec(),
];

const allSectors = (e: number) => {
	return Object.values(PUBLICS.filter((_, i) => i === e)).flatMap(
		(x) => x() as string[],
	);
};

export default (context: Context, args?: unknown) => {
    $fs.maddy.analytics({ context, args });
    
	if (!isRecord(args)) return HELP_TEXT;

	const page = "page" in args && typeof args.page === "number" ? args.page : 0;
	const level =
		"level" in args && typeof args.level === "number"
			? args.level
			: typeof args.level === "string"
				? (SECLEVELS[args.level] ?? 0)
				: 0;

	if (!PUBLICS[level]) return "level not in range 0-5";

	const sectors = PUBLICS[level]() as string[];

	const sector = sectors[page];

	const all = allSectors(level);
	const joined = $ms.chats.channels().filter((x) => all.includes(x));
	for (const j of joined) {
		if (j === sector) continue;
		$ms.chats.leave({ channel: j });
	}

	$ms.chats.join({ channel: sector });

	const scripts = throwFailure(PUBLICS[level](sector));

    $ms.chats.leave({ channel: sector });

	if (context.calling_script) {
		return scripts;
	}

	return `${$fs.scripts.lib().columnize(scripts)}\n\ntotal pages: ${sectors.length - 1}`;
};
