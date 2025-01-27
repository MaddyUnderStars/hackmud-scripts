import { ALLOWED_USERS } from "/lib/auth";
import { isRecord } from "/lib/isRecord";

export default function (context: Context, args?: unknown) {
	const l = $fs.scripts.lib();

	if (
		isRecord(args) &&
		"amount" in args &&
		args.amount &&
		ALLOWED_USERS.includes(context.caller) &&
		(typeof args.amount === "string" || typeof args.amount === "number")
	) {
		$fs.accts.xfer_gc_to_caller({ amount: args.amount });
		return l.to_gc_str($fs.accts.balance_of_owner());
	}

	$ms.accts.xfer_gc_to({ to: "squizzy", amount: $hs.accts.balance() });

	if (ALLOWED_USERS.includes(context.caller)) {
		return l.to_gc_str($fs.accts.balance_of_owner());
	}
}
