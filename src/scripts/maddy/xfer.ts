import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";

const users = [
	["squizzy", $ms.squizzy.xfer],
	["katsu", $ms.katsu.xfer],
	["oscilio", $ms.oscilio.xfer],
	["arakni", $ms.arakni.xfer],
	["enigma", $ms.enigma.xfer],
] as const;

const getBalances = () =>
	users
		.map(([user, script]) => ({
			user,
			amount: throwFailure(script()) as number,
			script,
		}))
		.sort((a, b) => a.amount - b.amount);

export default function (context: Context, args?: unknown) {
	$fs.maddy.whitelist();

	const l = $fs.scripts.lib();

	const balances = getBalances();
	const total = balances.reduce((prev, curr) => prev + curr.amount, 0);

	const renderBalanceTable = (
		balances: ReturnType<typeof getBalances>,
		cols: number,
	) =>
		`${l.to_gc_str(total)}\n\n${table(
			[
				["user", "amount"],
				[],
				...balances.map((x) => [x.user, l.to_gc_str(x.amount)]),
			],
			cols,
		)}`;

	// get balance and take all money
	if (!args) {
		const balance = $ms.accts.balance();
		if (!balance) return;

		const safeUsers = $db
			.f({
				_id: { $regex: "botnet_checkin", $type: "string" },
				breached: false,
			})
			.array()
			.map((x) => x._id.split("_").slice(-1)[0]);

		const split = Math.floor(balance / safeUsers.length);
		let sentRemainder = false;
		for (const { user } of balances) {
			if (!safeUsers.includes(user)) continue;

			if (!sentRemainder) {
				sentRemainder = true;
				throwFailure(
					$ms.accts.xfer_gc_to({
						to: user,
						amount: split + (balance % users.length),
					}),
				);
			} else {
				if (!split) return;
				throwFailure($ms.accts.xfer_gc_to({ to: user, amount: split }));
			}
		}

		return { ok: true };
	}

	if (
		isRecord(args) &&
		(typeof args.amount === "string" || typeof args.amount === "number") &&
		args.amount
	) {
		const amount =
			typeof args.amount === "string"
				? Number.isNaN(Number(args.amount))
					? throwFailure(l.to_gc_num(args.amount))
					: Number.parseInt(args.amount)
				: args.amount;

		if (amount > total) return { ok: false, msg: "insufficient balance" };

		let received = 0;
		for (const user of balances.reverse()) {
			if (user.user === context.caller) continue;
			if (received >= amount) break;

			const a = Math.min(user.amount, amount - received);
			throwFailure(user.script({ amount: a }));
			received += a;
		}

		return { ok: true };
	}

	if (isRecord(args) && args.details === true)
		return renderBalanceTable(balances, context.cols);

	return l.to_gc_str(total);
}
