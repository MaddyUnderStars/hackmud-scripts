import { game_ts_to_date } from "../timestamp";
import type { LockSolver } from "./type";

export const acct_nt: LockSolver = function* (context) {
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