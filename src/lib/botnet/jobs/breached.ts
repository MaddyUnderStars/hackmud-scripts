import type { JobHandler } from "../jobs";
import { throwFailure } from "/lib/failure";

const LOC_REGEX =
	/[a-z_][a-z_0-9]{0,24}.(?:info|out|external|public|pub|pub_info|pubinfo|p|access|entry|extern)_[a-z0-9]{6}/;

const isInDanger = (context: Context, log: (str: string) => void) => {
	const status = $hs.sys.status();
	if (status.breach) {
		log("breached");
		return true;
	}

	const amounts = $db
		.f({
			s: "t2",
			k: "sn_w_glock",
			q: { $type: "string" },
			a: { $type: "string" },
		})
		.array();

	const transactions = $hs.accts.transactions({ to: context.caller });

	const lib = $fs.scripts.lib();

	const cache: Record<string, boolean> = {};
	const glocked = transactions.find((x) => {
		if (!cache[x.sender])
			cache[x.sender] = $ms.maddy.whitelist({ user: x.sender }).ok;

		return (
			amounts.map((x) => x.a).includes(throwFailure(lib.to_gc_str(x.amount))) &&
			cache[x.sender]
		);
	});

	if (glocked) {
		const msg = `glock amount from ${glocked.sender}`;
		$fs.chats.tell({ to: "maddy", msg });
		log(msg);
	}

	return !!glocked;
};

// Check my status
// If breached, or glock amounts been given, move all money and upgrades to some non-breached user
export const breachedJob: JobHandler = (context, log) => {
	if (!isInDanger(context, log)) return;

	const balance = $hs.accts.balance();
	const brainCost = throwFailure(
		$hs.sys.upgrades({
			filter: { type: "bot_brain", loaded: true },
			full: true,
		}),
	)[0].cost as number;

	$ms.maddy.xfer({ amount: balance - brainCost });

	const access = throwFailure($ls.sys.access_log()).filter((x) => x.u);

	$fs.maddy.locs({
		input: access.map((x) => x.msg.match(LOC_REGEX)?.[0]).filter((x) => !!x),
	});
};
