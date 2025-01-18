import { isRecord } from "/lib/isRecord";

const myUsers = ["maddy", "ira", "squizzy", "katsu"];

export default function (context: Context, args?: unknown) {
	if (
		isRecord(args) &&
		"amount" in args &&
		args.amount &&
		myUsers.includes(context.caller) &&
		(typeof args.amount === "string" || typeof args.amount === "number")
	) {
		$fs.accts.xfer_gc_to_caller({ amount: args.amount });
		return args.amount;
	}

	$ms.accts.xfer_gc_to({ to: "squizzy", amount: $hs.accts.balance() });

	if (myUsers.includes(context.caller)) {
		const l = $fs.scripts.lib();
		return l.to_gc_str($fs.accts.balance_of_owner());
	}
}
