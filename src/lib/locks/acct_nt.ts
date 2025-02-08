import { game_ts_to_date } from "../timestamp";
import type { LockSolver } from "./type";

const around = (a: Date, b: Date) =>
	a.valueOf() > b.valueOf() - 60 * 1000 &&
	a.valueOf() < b.valueOf() + 60 * 1000;

const getIndexes = (startDate: Date, endDate: Date, list: Transation[]) => {
	const potentialStartIndexes: number[] = [];
	const potentialEndIndexes: number[] = [];
	for (let i = 0; i < list.length; i++) {
		const x = list[i];
		if (around(x.time, startDate)) {
			potentialStartIndexes.push(i);
		}

		if (around(x.time, endDate)) {
			potentialEndIndexes.push(i);
		}
	}

	return [potentialStartIndexes, potentialEndIndexes];
};

export const acct_nt: LockSolver = function* (context, log) {
	const input = yield { acct_nt: 0 }; // try 0 just in case lol

	const transactions: Transation[] = $hs.accts.transactions({ count: 50 });

	if (input.includes("net")) {
		log("mode net");

		const [_, end, start] = input.match(/between (.+) and (.+)$/);
		const startDate = game_ts_to_date(start);
		const endDate = game_ts_to_date(end);

		const [potentialStartIndexes, potentialEndIndexes] = getIndexes(
			startDate,
			endDate,
			transactions,
		);

		log(`start = ${potentialStartIndexes.join(", ")}`);
		log(`end = ${potentialEndIndexes.join(", ")}`);

		const sumTransactions = (list: Transation[]) =>
			list
				.map((x) => (x.recipient === context.caller ? x.amount : -x.amount))
				.reduce((prev, curr) => prev + curr, 0);

		const attempts = new Set<number>();

		for (const start of potentialStartIndexes) {
			for (const end of potentialEndIndexes) {
				const slice = transactions.slice(start, end);
				const sum = sumTransactions(slice);
				if (attempts.has(sum)) continue;
				attempts.add(sum);
				yield { acct_nt: sum };
			}
		}
	} else if (input.includes("total")) {
		log("mode total");

		const [_, type, memos, end, start] = input.match(
			/(earned|spent) on transactions (with|without) memos between (.+) and (.+)$/,
		);

		const startDate = game_ts_to_date(start);
		const endDate = game_ts_to_date(end);

		const list = transactions.filter((x) =>
			memos === "with" ? !!x.memo : !x.memo,
		);

		const [potentialStartIndexes, potentialEndIndexes] = getIndexes(
			startDate,
			endDate,
			list,
		);

		const sumTransactions = (list: Transation[]) =>
			list
				// .filter((x) =>
				// 	type === "spent"
				// 		? x.recipient === context.caller
				// 		: x.sender === context.caller,
				// )
				.map((x) => (x.recipient === context.caller ? x.amount : -x.amount))
				.reduce((prev, curr) => prev + curr, 0);

		log(`start indexes - ${potentialStartIndexes.join(", ")}`);
		log(`end indexes - ${potentialEndIndexes.join(", ")}`);

		// just brute it for now
		const l = new Set();

		for (const start of potentialStartIndexes) {
			for (const end of potentialEndIndexes) {
				l.add(Math.abs(sumTransactions(list.slice(start, end))));
			}
		}

		log(`have ${l.size} permutations`);

		for (const x of l) {
			yield {
				acct_nt: x,
			};
		}
	} else if (input.includes("large")) {
		log("mode large");

		const [_, type, timestamp] = input.match(
			/large (deposit|withdrawal) near (.+)$/,
		);

		const date = game_ts_to_date(timestamp);

		const list = transactions.filter((x) =>
			type === "withdrawal"
				? x.sender === context.caller
				: x.recipient === context.caller,
		);

		const potential: number[] = [];
		for (let i = 0; i < list.length; i++) {
			if (around(list[i].time, date)) potential.push(i);
		}

		log(`potential: ${potential.join(", ")}`);

		// try all the ones in the range first
		for (const i of potential) {
			yield { acct_nt: list[i].amount };
		}

		log("attempting search");

		const attempts = new Set<number>(potential);

		// then try search
		const pick = potential[0];
		attempts.add(list[pick].amount);
		yield { acct_nt: list[pick].amount };
		for (let i = 0; i < list.length; i++) {
			if (list[pick + i] && !attempts.has(pick + i)) {
				attempts.add(pick + i);
				yield { acct_nt: list[pick + i].amount };
			}
			if (list[pick - i] && !attempts.has(pick - i)) {
				attempts.add(pick - i);
				yield { acct_nt: list[pick - i].amount };
			}
		}
	}
};

type Transation = {
	time: Date;
	amount: number;
	sender: string;
	recipient: string;
	script: string | null;
	memo?: string;
};
