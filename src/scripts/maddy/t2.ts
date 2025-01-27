import { removeColour } from "/lib/colour";
import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";
import { permute } from "/lib/permute";
import { game_ts_to_date } from "/lib/timestamp";

const LOG: unknown[] = [];

const handlers: Record<string, (context: Context) => Generator> = {};

handlers.l0cket = function* () {
	const answers = $db
		.f({ s: "t1", k: "l0cket", a: { $type: "string" } })
		.array();

	for (const answer of answers) {
		yield { l0cket: answer.a };
	}
};

handlers.l0ckbox = function* () {
	const input = yield {};

	const k3y: string = input.split(" ").slice(-1)[0];

	const ret = $ls.maddy.keyring({ unload: true, load: k3y });

	if (!ret || !("ok" in ret && ret.ok)) {
		const buy = $ls.maddy.keyring({ market: k3y, buy: "10mgc" });

		if ("ok" in buy && !buy.ok) throw `matr1x.r3dbox { request: "${k3y}" }`;
	}

	yield;
};

handlers.acct_nt = function* (context) {
	const input = yield { acct_nt: 0 }; // try 0 just in case lol

	const transactions = $hs.accts.transactions({ count: 50 });

	const around = (a: Date, b: Date) =>
		a.valueOf() > b.valueOf() - 240 * 1000 &&
		a.valueOf() < b.valueOf() + 240 * 1000;

	const getIndexes = (
		startDate: Date,
		endDate: Date,
		list: typeof transactions,
	) => {
		const potentionalStartIndexes: number[] = [];
		const potentionalEndIndexes: number[] = [];
		for (let i = 0; i < list.length; i++) {
			const x = list[i];
			if (around(x.time, startDate)) {
				potentionalStartIndexes.push(i);
			}

			if (around(x.time, endDate)) {
				potentionalEndIndexes.push(i);
			}
		}

		return [potentionalStartIndexes, potentionalEndIndexes];
	};

	if (input.includes("net")) {
		const [_, end, start] = input.match(/between (.+) and (.+)$/);
		const startDate = game_ts_to_date(start);
		const endDate = game_ts_to_date(end);

		const [potentionalStartIndexes, potentionalEndIndexes] = getIndexes(
			startDate,
			endDate,
			transactions,
		);

		const sumTransactions = (list: typeof transactions) =>
			list
				.map((x) => (x.recipient === context.caller ? x.amount : -x.amount))
				.reduce((prev, curr) => prev + curr, 0);

		const attempts = new Set<number>();

		for (const start of potentionalStartIndexes) {
			for (const end of potentionalEndIndexes) {
				const sum = sumTransactions(transactions.slice(start, end));
				if (attempts.has(sum)) continue;
				attempts.add(sum);
				yield { acct_nt: sum };
			}
		}
	} else if (input.includes("total")) {
		const [_, type, memos, end, start] = input.match(
			/(earned|spent) on transactions (with|without) memos between (.+) and (.+)$/,
		);

		const startDate = game_ts_to_date(start);
		const endDate = game_ts_to_date(end);

		const list = transactions.filter((x) =>
			memos === "with" ? !!x.memo : !x.memo,
		);

		const [potentionalStartIndexes, potentionalEndIndexes] = getIndexes(
			startDate,
			endDate,
			list,
		);

		const sumTransactions = (list: typeof transactions) =>
			list
				.filter((x) =>
					type === "spent"
						? x.sender === context.caller
						: x.recipient === context.caller,
				)
				.map((x) => (x.recipient === context.caller ? x.amount : -x.amount))
				.reduce((prev, curr) => prev + curr, 0);

		// just brute it for now
		const l = new Set();

		for (const start of potentionalStartIndexes) {
			for (const end of potentionalEndIndexes) {
				l.add(Math.abs(sumTransactions(list.slice(start, end))));
			}
		}

		// for (let i = 0; i < list.length; i++) {
		// 	for (let x = 0; x < list.length; x++) {
		// 		l.add(Math.abs(sumTransactions(list.slice(i, x))));
		// 	}
		// }

		for (const x of l) {
			if (_END - Date.now() < 500) {
				return { ok: false, x };
			}

			yield {
				acct_nt: x,
			};
		}
	} else if (input.includes("large")) {
		const [_, type, timestamp] = input.match(
			/large (deposit|withdrawal) near (.+)$/,
		);

		const date = game_ts_to_date(timestamp);

		const list = transactions.filter((x) =>
			type === "withdrawal"
				? x.recipient === context.caller
				: x.sender === context.caller,
		);

		const potential: number[] = [];
		for (let i = 0; i < list.length; i++) {
			if (around(list[i].time, date)) potential.push(i);
		}

		// try all the ones in the range first
		for (const i of potential) {
			yield { acct_nt: list[i].amount };
		}

		LOG.push("acct_nt search");

		const attempts = new Set<number>();

		// then try search
		const pick = potential[0];
		attempts.add(list[pick].amount);
		yield { acct_nt: list[pick].amount };
		for (let i = 0; i < list.length; i++) {
			if (list[pick + i] && !attempts.has(list[pick + i].amount)) {
				attempts.add(list[pick + i].amount);
				yield { acct_nt: list[pick + i].amount };
			}
			if (list[pick - i] && !attempts.has(list[pick - i].amount)) {
				attempts.add(list[pick - i].amount);
				yield { acct_nt: list[pick - i].amount };
			}
		}
	}
};

handlers.sn_w_glock = function* () {
	// send all our money to main acct
	$ls.squizzy.xfer();

	const input = yield { sn_w_glock: "" };

	const amounts = $db
		.f({
			s: "t2",
			k: "sn_w_glock",
			q: { $type: "string" },
			a: { $type: "string" },
		})
		.array();

	const amount = amounts.find((x) => input.toLowerCase().includes(x.q))?.a;
	if (!amount) throw new Error("no sn_w_glock amnt");

	// get back the glock amount
	$ls.squizzy.xfer({
		amount,
	});

	// run the loc again
	yield;

	// and get the key from our log
	const transaction = $hs.accts.transactions({ count: 1 })[0];
	yield { sn_w_glock: transaction.memo?.split(" ").splice(-1)[0] };
};

// TODO: this solve is very stupid
// because there are too many checks
// it would be better to use a dictionary
handlers.magnara = function* () {
	const input = yield { magnara: "" };
	const word: string = input.split(" ").splice(-1)[0];

	const sorted = word
		.split("")
		.sort((a, b) => a.localeCompare(b))
		.join("");
	const existing = $db
		.f({ _id: `magnara_${sorted}`, word: { $type: "string" } })
		.first();
	if (existing) {
		LOG.push(`magnara dict had word ${existing.word}`);
		yield { magnara: existing.word };

		// if the existing word didn't work, remove it
		LOG.push("magnara dict failed, removing");
		$db.r({ _id: `magnara_${sorted}` });
	}

	LOG.push(`no magnara dict found for ${sorted}`);

	const LIMIT = 6;

	// if the word is small enough, just brute it
	if (word.length < LIMIT) {
		const gen = permute(word.split(""));
		for (const perm of gen) {
			const word = perm.join("");

			// I'd rather only do 1 db opt,
			// but that would involve being able to signal to a solver when it's done
			// which would be messy at the moment.
			$db.us({ _id: `magnara_${sorted}` }, { $set: { word } });

			yield { magnara: word };
		}
	}

	LOG.push(`magnara length greater than limit (${LIMIT})`);
};

handlers.CON_SPEC = function* () {
	const input = yield { CON_SPEC: "" };

	if (input.includes("scriptor")) {
		yield {
			CON_SPEC: {
				call: (args: Record<string, unknown>) => {
					const s = args.s as string;
					const d = args.d as number;

					return (
						s
							.split("")
							.filter((x) =>
								Number.isNaN(x) ? false : Number.parseInt(x) === d,
							)?.length ?? 0
					);
				},
			},
		};
		return;
	}

	// do the sequence
	const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
	const sequence = input.toLowerCase().split("\n")[0].split("") as string[];

	const indexes = sequence.map((x) => alphabet.indexOf(x));

	const differences = indexes.slice(1).map((v, i) => v - indexes[i]);

	let ret = "";
	let curr = indexes[indexes.length - 1];
	const attempts = [];
	for (let i = 3; i > 0; i--) {
		const attempt =
			differences[(differences.length - i - 1) % differences.length];
		curr += attempt;
		attempts.push(attempt);

		if (curr < 0) curr += alphabet.length;

		ret += alphabet[curr % alphabet.length];
	}

	yield { CON_SPEC: ret.toUpperCase() };

	return { indexes, differences, attempts };
};

handlers.DATA_CHECK = function* () {
	const answers = $db
		.f({
			s: "t1",
			k: "datacheck",
			q: { $type: "string" },
			a: { $type: "string" },
		})
		.array();

	const input = (yield { DATA_CHECK: "" }) as string;

	const ret = input
		.split("\n")
		.map(
			(x) =>
				answers.find((y) => x.toLowerCase().includes(y.q.toLowerCase()))?.a,
		)
		.join("");

	yield { DATA_CHECK: ret };
};

const isBreached = (out: string) =>
	out.toLowerCase().includes("connection terminated");

let lastlock = "";
const getCurrentLock = (out: string) => {
	const lastline = out.split("\n").slice(-1)[0];
	const lock = lastline.split(" ").slice(-2)[0];

	if (out.includes("appropriate k3y")) {
		return "l0ckbox";
	}

	if (
		handlers[lock.substring(0, lock.length - 1).substring(2)] ||
		!lastlock.length
	) {
		lastlock = removeColour(lock);
		return lastlock;
	}
	return lastlock;
};

export default function (context: Context, args?: unknown) {
	if (!isRecord(args))
		return { ok: false, msg: "maddy.t2 { s: #s.example.loc }" };

	if (!isScriptor(args.s)) return { ok: false };

	const exec = (p?: unknown) => {
		const ret = (args.s as Scriptor).call(p);

		LOG.push(`tried ${JSON.stringify(p)} got ${JSON.stringify(ret)}`);

		if (typeof ret === "string") return ret;
		if (Array.isArray(ret)) return ret.join("\n");
		if (isRecord(ret) && "msg" in ret && typeof ret.msg === "string")
			return ret.msg;
		return JSON.stringify(ret);
	};

	const solve = args.p ? args.p : {};
	let state = exec(solve);

	while (!isBreached(state)) {
		const lock = getCurrentLock(state);
		LOG.push(`current: ${lock}`);

		const handler = handlers[lock];
		if (!handler) {
			LOG.push("no handler");
			return { ok: false, msg: LOG.join("\n") };
		}

		const gen = handler(context);

		while (getCurrentLock(state) === lock) {
			if (isBreached(state)) break;
			try {
				const iter = gen.next(state);
				if (iter.done) {
					return {
						ok: false,
						msg:
							LOG.join("\n") +
							(iter.value ? `\n\n${JSON.stringify(iter.value)}` : ""),
					};
				}
				Object.assign(solve, iter.value, args.p);
				state = exec(solve);
			} catch (e) {
				LOG.push(e instanceof Error ? e.message : e);
				return { ok: false, msg: LOG.join("\n") };
			}
		}
	}

	return LOG;
}
