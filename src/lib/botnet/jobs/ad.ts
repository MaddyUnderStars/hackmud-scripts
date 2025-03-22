import type { JobHandler } from "../jobs";

export const adJob: JobHandler = () => {
	$ms.maddy.ad();
};