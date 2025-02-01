const LOG: unknown[] = [];

export const createLogger = (name: string) => {
	const time = () => `[${String(Date.now() - _START).padStart(4, "0")}ms]`;

	const internalLog: unknown[] = [`${time()} ${name}`];
	return {
		log: (args: string) =>
			internalLog.push(
                // extra padding for time
				`${time()} - ${args.split("\n").join("\n        - - ")}`,
			),
		stop: (msg?: string) =>
			LOG.push(...internalLog, msg ? `${time()} ${msg}` : ""),
	};
};

export const getLog = () => LOG;
