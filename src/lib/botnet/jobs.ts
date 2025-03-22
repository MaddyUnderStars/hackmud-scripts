import type { LOG_FUNC } from "../log";
import { adJob } from "./jobs/ad";
import { breachedJob } from "./jobs/breached";
import { locsJob } from "./jobs/locs";
import { marketwatchJob } from "./jobs/marketwatch";
import { upgradesJob } from "./jobs/upgrades";

export type JobHandler = ((context: Context, log: LOG_FUNC) => void) & {
	users?: string[];
};

export default {
	breached: breachedJob,
	upgrades: upgradesJob,
	marketwatch: marketwatchJob,
	ad: adJob,
	locs: locsJob,
} as Record<string, JobHandler>;
