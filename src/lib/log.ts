const LOG: string[] = [];

export const createLogger = (name: string) => {
	const time = () => {
		const t = _END - Date.now();
		const danger = t < 2000;
		return `[${danger ? "`D" : ""}${String(t).padStart(4, "0")}${danger ? "`" : ""}ms]`;
	};

	const internalLog: string[] = [`${time()} ${name}`];
	return {
		log: (args: string) =>
			internalLog.push(
				// extra padding for time
				`${time()} - ${args.split("\n").join("\n         -> ")}`,
			),
		stop: (msg?: string) => {
			LOG.push(...internalLog, msg ? `${time()} ${msg}` : "");
			return internalLog;
		},
	};
};

export const getLog = () => LOG;
