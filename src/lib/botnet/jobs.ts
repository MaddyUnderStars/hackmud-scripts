import { breachedJob } from "./jobs/breached";
import { upgradesJob } from "./jobs/upgrades";

export type JobHandler = (context: Context, log: (str: string) => void) => void;

export default {
	"breached": breachedJob,
	"upgrades": upgradesJob,
} as Record<string, JobHandler>;
