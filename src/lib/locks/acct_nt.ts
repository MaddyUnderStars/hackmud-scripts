import { LOG_LEVEL } from "../log";
import { game_ts_to_date } from "../timestamp";
import type { LockSolver } from "./type";

// TODO: Store the solve as indexes somewhere
// and on additional acct_nt calls, if we have those indexes, we can just use those
// since acct_nt wouldn't have changed the indexes probably

const acct_net: Handler = function* (context, log, transactions, start, end) {
	const [startDate, endDate] = [game_ts_to_date(start), game_ts_to_date(end)];

	const range = transactions.filter((x) => between(x.time, startDate, endDate));

	log(
		`range\n${range.map((x) => JSON.stringify(x)).join("\n")}`,
		LOG_LEVEL.DEBUG,
	);

	const startIndexes = getIndexes(range, startDate, true);
	const endIndexes = getIndexes(range, endDate, false);

	log(`start\n${startIndexes.join("\n")}`, LOG_LEVEL.DEBUG);
	log(`end\n${endIndexes.join("\n")}`, LOG_LEVEL.DEBUG);

	const attempts = new Set<number>([0]);
	for (const startInx of startIndexes) {
		for (const endInx of endIndexes) {
			const sum = range
				.slice(...[startInx, endInx].sort((a, b) => a - b))
				.map((x) => (x.recipient === context.caller ? x.amount : -x.amount))
				.reduce((prev, curr) => prev + curr, 0);

			if (attempts.has(sum)) continue;
			attempts.add(sum);
			log(sum.toString(), LOG_LEVEL.DEBUG);
			yield { acct_nt: sum };
		}
	}
};

const acct_large: Handler = function* (
	context,
	log,
	transactions,
	type,
	timestamp,
) {
	const date = game_ts_to_date(timestamp);

	const range = transactions.filter((x) => {
		const typeCheck =
			type === "withdrawal"
				? x.sender === context.caller
				: x.recipient === context.caller;

		const dateCheck = around(date, x.time);

		return typeCheck && dateCheck;
	});

	const attempts = new Set<number>([0]);
	for (const x of range) {
		if (attempts.has(x.amount)) continue;
		attempts.add(x.amount);

		yield { acct_nt: x.amount };
	}

	log("nothing near, searching...");

	const startInx = Math.max(
		transactions.findIndex((x) => around(x.time, date)),
		0,
	);

	for (let i = 0; i < transactions.length; i++) {
		const above = transactions[startInx + i];
		if (above && !attempts.has(above.amount)) {
			attempts.add(above.amount);
			yield { acct_nt: above.amount };
		}

		const below = transactions[startInx - i];
		if (below && !attempts.has(below.amount)) {
			attempts.add(below.amount);
			yield { acct_nt: below.amount };
		}
	}
};

const acct_total: Handler = function* (
	context,
	log,
	transactions,
	type,
	memos,
	end,
	start,
) {
	const [startDate, endDate] = [game_ts_to_date(start), game_ts_to_date(end)];

	const range = transactions.filter((x) => {
		const memoCheck = memos === "with" ? !!x.memo : !x.memo;

		const typeCheck = true;
		// type === "spent"
		// 	? x.sender === context.caller
		// 	: x.recipient === context.caller;

		const rangeCheck = between(x.time, endDate, startDate);

		return memoCheck && typeCheck && rangeCheck;
	});

	log(`range has ${range.length} elements`);

	const startIndexes = getIndexes(range, startDate, true);
	const endIndexes = getIndexes(range, endDate, false);

	log(range.map((x) => JSON.stringify(x)).join("\n"), LOG_LEVEL.DEBUG);
	log(`start\n${startIndexes.join("\n")}`, LOG_LEVEL.DEBUG);
	log(`end\n${endIndexes.join("\n")}`, LOG_LEVEL.DEBUG);

	const attempts = new Set<number>([0]);
	for (const startInx of startIndexes) {
		for (const endInx of endIndexes) {
			const sliced = range.slice(...[startInx, endInx].sort((a, b) => a - b));

			const sum = Math.abs(
				sliced
					.map((x) => (x.recipient === context.caller ? x.amount : -x.amount))
					.reduce((prev, curr) => prev + curr, 0),
			);

			if (attempts.has(sum)) continue;
			attempts.add(sum);

			log(sum.toString(), LOG_LEVEL.DEBUG);
			yield { acct_nt: sum };
		}
	}
};

type Handler = (
	context: Context,
	log: (s: string, level?: LOG_LEVEL) => void,
	transactions: Transaction[],
	...args: string[]
) => Generator;

const MODES = {
	total: acct_total,
	large: acct_large,
	net: acct_net,
} as Record<string, Handler>;

export const acct_nt: LockSolver = function* (context, log) {
	const input = yield { acct_nt: 0 };

	const transactions: Transaction[] = $hs.accts.transactions({ count: 50 });

	const { mode, args } = getMode(input);

	log(`mode ${mode} ${args.join(" ")}`);

	const handler = MODES[mode];
	if (!handler) throw new Error(`no handler for ${mode}`);

	yield* handler(context, log, transactions, ...args);
};

const getMode = (str: string) => {
	if (str.includes("net"))
		return {
			mode: "net",
			args: [...(str.match(/between (.+) and (.+)$/) ?? [])].slice(1),
		};
	if (str.includes("total"))
		return {
			mode: "total",
			args: [
				...(str.match(
					/(earned|spent) on transactions (with|without) memos between (.+) and (.+)$/,
				) ?? []),
			].slice(1),
		};
	if (str.includes("large"))
		return {
			mode: "large",
			args: [
				...(str.match(/large (deposit|withdrawal) near (.+)$/) ?? []),
			].slice(1),
		};

	throw new Error("no mode");
};

// tests whether a is within 60 seconds of b
const around = (a: Date, b: Date) =>
	a.valueOf() >= b.valueOf() - 60 * 1000 &&
	a.valueOf() <= b.valueOf() + 60 * 1000;

// tests whether x is between a (lower) and b (higher), with 60 seconds on either side
const between = (x: Date, a: Date, b: Date) => {
	return (
		(x.valueOf() >= a.valueOf() - 60 * 1000 ||
			x.valueOf() >= a.valueOf() + 60 * 1000) &&
		(x.valueOf() <= b.valueOf() - 60 * 1000 ||
			x.valueOf() <= b.valueOf() + 60 * 1000)
	);
};

// get the indexes with 'range' around 'date'. if none found, return either the 'start' or end of the range
const getIndexes = (range: Transaction[], date: Date, start: boolean) => {
	const indexes = range
		.map((x, i) => (around(x.time, date) ? i : undefined))
		.filter((x): x is number => x !== undefined);
	if (!indexes.length) indexes.push(start ? 0 : range.length - 1);

    return indexes;
};

type Transaction = {
	time: Date;
	amount: number;
	sender: string;
	recipient: string;
	script: string | null;
	memo?: string;
};
