import { removeColour } from "./colour";
import { padStart } from "./padStartColor";

const LOG: { date: Date; msg: string; internal?: boolean; level: LOG_LEVEL }[] =
	[];

export enum LOG_LEVEL {
	INFO = 0,
	DEBUG = 1,
}

export type LOG_FUNC = ReturnType<typeof createLogger>["log"];

const condColour = (msg: string, colour: boolean) =>
	colour ? msg : removeColour(msg);

const time = (d: Date, timeDisplay?: number) => {
	const t = d.valueOf() - _START;
	const danger = t > 3000;

	return `${danger ? "`D" : ""}${padStart(`${timeDisplay ? (!danger ? `\`1${timeDisplay}\`` : timeDisplay) : !danger ? `\`1${t}\`` : t}`, 4, !danger ? "`C0`" : "0")}${danger ? "`" : ""}\`qms\``;
};

export const createLogger = (name: string) => {
	const internalLog: typeof LOG = [
		{ date: new Date(), msg: name, level: LOG_LEVEL.INFO },
	]; // [`${time()} ${name}`];
	return {
		log: (args: string, level?: LOG_LEVEL) =>
			internalLog.push(
				// extra padding for time
				// `${time()} - ${args.split("\n").join("\n         -> ")}`,
				{
					date: new Date(),
					msg: args,
					internal: true,
					level: level ?? LOG_LEVEL.INFO,
				},
			),
		stop: (msg?: string) => {
			// LOG.push(...internalLog, msg ? `${time()} ${msg}` : "");
			LOG.push(...internalLog);
			if (msg) LOG.push({ date: new Date(), msg, level: LOG_LEVEL.INFO });
			return internalLog;
		},
	};
};

export const getLog = (
	includeDeltas = true,
	level: LOG_LEVEL = LOG_LEVEL.INFO,
) =>
	LOG.filter((x) => x.level <= level).map((x, i) => {
		if (!includeDeltas)
			return `\`C[\`${time(x.date)}\`C]\` ${x.msg.split("\n").join("\n         `C->` ")}}`;

		const lastOuterLog = LOG.slice(0, i)
			.reverse()
			.find((x) => !x.internal);

		if (
			!lastOuterLog ||
			x.internal ||
			x.date.valueOf() - lastOuterLog.date.valueOf() === 0
		)
			return `\`C[\`${time(x.date)}      \`C]\` ${x.msg.split("\n").join("\n             `C->` ")}`;

		return `\`C[\`${time(x.date)} \`q+\`${padStart(`\`1${lastOuterLog ? x.date.valueOf() - lastOuterLog.date.valueOf() : 0}\``, 4, "`C0`")}\`C]\` ${x.msg.split("\n").join("\n               `C->` ")}`;
	});

export const getRawLog = () => LOG;
