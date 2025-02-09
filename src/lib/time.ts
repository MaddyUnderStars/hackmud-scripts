import { padStart } from "./padStartColor";

export const readableMs = (ms: number) => {
	let _ms = ms;
	let s = Math.floor(Math.abs(_ms) / 1000);
	_ms = ms % 1000;
	let m = Math.floor(s / 60);
	s = s % 60;
	let h = Math.floor(m / 60);
	m = m % 60;
	const d = Math.floor(h / 24);
	h = h % 24;

	let ret = "";
	if (d) ret += `${d}\`Dd\``;
	if (h) ret += ` ${padStart(`${h}`, 2, "`b0`")}\`5h\``;
	if (m) ret += ` ${padStart(`${m}`, 2, "`b0`")}\`4m\``;
	if (s) ret += ` ${padStart(`${s}`, 2, "`b0`")}\`Ls\``;
	if (_ms) ret += ` ${padStart(`${_ms}`, 4, "`b0`")}\`0ms\``;

	return ret;
};

const timeRegex = /(\d*d)?\s?(\d*h)?\s?(\d*m)?\s?(\d*s)?\s?(\d*ms)?/;
export const fromReadableTime = (str: string) => {
	const match = str.match(timeRegex);
	if (!match) throw new Error(`${str} is not a valid human readable timestamp`);

	const d = match.find((x) => x?.includes("d"));
	const h = match.find((x) => x?.includes("h"));
	const m = match.find((x) => x?.includes("m") && !x?.includes("ms"));
	const s = match.find((x) => x?.includes("s"));
	const ms = match.find((x) => x?.includes("ms"));

	let retMs = 0;
	if (d) retMs += Number.parseInt(d) * (1000 * 60 * 60 * 24);
	if (h) retMs += Number.parseInt(h) * (1000 * 60 * 60);
	if (m) retMs += Number.parseInt(m) * (1000 * 60);
	if (s) retMs += Number.parseInt(s) * 1000;
	if (ms) retMs += Number.parseInt(ms);

	return retMs;
};
