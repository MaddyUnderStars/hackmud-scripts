import { removeColour } from "./colour";
import { padStart } from "./padStartColor";

const LOG: { date: Date; msg: string; internal?: boolean }[] = [];

const condColour = (msg: string, colour: boolean) =>
	colour ? msg : removeColour(msg);

const time = (d: Date, timeDisplay?: number) => {
	const t = d.valueOf() - _START;
	const danger = t > 3000;

	return `${danger ? "`D" : ""}${padStart(`${timeDisplay ? (!danger ? `\`1${timeDisplay}\`` : timeDisplay) : !danger ? `\`1${t}\`` : t}`, 4, !danger ? "`C0`" : "0")}${danger ? "`" : ""}\`qms\``;
};

export const createLogger = (name: string) => {
	const internalLog: typeof LOG = [{ date: new Date(), msg: name }]; // [`${time()} ${name}`];
	return {
		log: (args: string) =>
			internalLog.push(
				// extra padding for time
				// `${time()} - ${args.split("\n").join("\n         -> ")}`,
				{
					date: new Date(),
					msg: args.split("\n").join("\n         -> "),
					internal: true,
				},
			),
		stop: (msg?: string) => {
			// LOG.push(...internalLog, msg ? `${time()} ${msg}` : "");
			LOG.push(...internalLog);
			if (msg) LOG.push({ date: new Date(), msg });
			return internalLog;
		},
	};
};

export const getLog = (includeDeltas = true) =>
	LOG.map((x, i) => {
		if (!includeDeltas) return `\`C[\`${time(x.date)}\`C]\` ${x.msg}`;

		const lastOuterLog = LOG.slice(0, i)
			.reverse()
			.find((x) => !x.internal);

		if (
			!lastOuterLog ||
			x.internal ||
			x.date.valueOf() - lastOuterLog.date.valueOf() === 0
		)
			return `\`C[\`${time(x.date)}      \`C]\` ${x.msg}`;

		return `\`C[\`${time(x.date)} \`q+\`${padStart(`\`1${lastOuterLog ? x.date.valueOf() - lastOuterLog.date.valueOf() : 0}\``, 4, "`C0`")}\`C]\` ${x.msg}`;
	});

export const getRawLog = () => LOG;
