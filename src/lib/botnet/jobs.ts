import { breachedJob } from "./jobs/breached";

export type JobHandler = (context: Context, log: (str: string) => void) => void;

export default {
	"breached": breachedJob,
} as Record<string, JobHandler>;
