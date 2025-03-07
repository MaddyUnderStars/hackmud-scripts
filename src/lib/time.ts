import { padStart } from "./padStartColor";

/**
 * Renders ms as human readable strings
 * @param ms The millisecond value to render as human readable
 * @param units The time units to render as a bitfield
 * @returns 
 */
export const readableMs = (ms: number, units = 62) => {
	let _ms = ms;
	let s = (units & (1 << 2)) !== 0 ? Math.floor(Math.abs(_ms) / 1000) : 0;
	if ((units & (1 << 2)) !== 0) _ms = ms % 1000;
	let m = (units & (1 << 3)) !== 0 ? Math.floor(s / 60) : 0; 
	if ((units & (1 << 3)) !== 0) s = s % 60;
	let h = (units & (1 << 4)) !== 0 ? Math.floor(m / 60) : 0;
	if ((units & (1 << 4)) !== 0) m = m % 60;
	const d = (units & (1 << 5)) !== 0 ? Math.floor(h / 24) : 0;
	if ((units & (1 << 5)) !== 0) h = h % 24;

	let ret = "";
	if (d && (units & (1 << 5)) !== 0) ret += `${d}\`Dd\``;
	if (h && (units & (1 << 4)) !== 0) ret += ` ${padStart(`${h}`, 2, "`b0`")}\`5h\``;
	if (m && (units & (1 << 3)) !== 0) ret += ` ${padStart(`${m}`, 2, "`b0`")}\`4m\``;
	if (s && (units & (1 << 2)) !== 0) ret += ` ${padStart(`${s}`, 2, "`b0`")}\`Ls\``;
	if (_ms && (units & (1 << 1)) !== 0) ret += ` ${padStart(`${_ms}`, 4, "`b0`")}\`0ms\``;

	if (!ret) ret = "`b0000``0ms`";

	return ret.trim();
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
