import type { JobHandler } from "../jobs";
import { throwFailure } from "/lib/failure";

export const marketwatchJob: JobHandler = (context, log) => {
	const out = throwFailure($fs.ira.market_watch({}));

	if (typeof out === "string") return;

	log(`new: ${out.additions}. sold: ${out.sold}`);
};
