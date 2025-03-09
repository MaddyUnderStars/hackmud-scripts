import type { LOG_FUNC } from "../log";
import { adJob } from "./jobs/ad";
import { breachedJob } from "./jobs/breached";
import { marketwatchJob } from "./jobs/marketwatch";
import { upgradesJob } from "./jobs/upgrades";

export type JobHandler = (context: Context, log: LOG_FUNC) => void;

export default {
	breached: breachedJob,
	upgrades: upgradesJob,
	marketwatch: marketwatchJob,
	ad: adJob,
} as Record<string, JobHandler>;
