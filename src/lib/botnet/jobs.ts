import { breachedJob } from "./jobs/breached";
import { marketwatchJob } from "./jobs/marketwatch";
import { upgradesJob } from "./jobs/upgrades";

export type JobHandler = (context: Context, log: (str: string) => void) => void;

export default {
    "breached": breachedJob,
    "upgrades": upgradesJob,
    "marketwatch": marketwatchJob,
} as Record<string, JobHandler>;
