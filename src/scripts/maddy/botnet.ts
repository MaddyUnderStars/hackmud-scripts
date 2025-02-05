import { makeBotnetCheckinId, makeBotnetLogId } from "/lib/botnet/ids";
import jobs from "/lib/botnet/jobs";
import { throwFailure } from "/lib/failure";
import { createLogger } from "/lib/log";

export default (context: Context, args?: unknown) => {
	$ns.maddy.whitelist();

	// get funds for next brain run
	const balance = $hs.accts.balance();
	const brain = throwFailure(
		$hs.sys.upgrades({
			filter: { type: "bot_brain", loaded: true },
			full: true,
		}),
	);

	const amount = brain[0].cost as number;
	if (amount > balance) $ms.maddy.xfer({ amount });

	// do check in
	const status = $hs.sys.status();

	$db.us(
		{ _id: makeBotnetCheckinId(context.caller) },
		{
			$set: {
				date: new Date(),
				breached: status.breach,
				brain: brain[0],
				name: context.caller,
			},
		},
	);

	// for each job
	for (const [name, job] of Object.entries(jobs)) {
		// if in risk of timeout, return
		if (_END - Date.now() < 500) return;

		// create new job log
		const logId = makeBotnetLogId(context.caller, name);
		$db.i({ _id: logId, date: new Date() });

		// run job handler
		const { log, stop } = createLogger(`job: ${name}`);
		job(context, log);
		const logs = stop();

		// mark job in log as done
		$db.u({ _id: logId }, { $set: { logs: logs } });
	}
};
