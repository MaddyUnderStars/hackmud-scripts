import type { JobHandler } from "../jobs";
import { throwFailure } from "/lib/failure";

export const upgradesJob: JobHandler = () => {
	const ups = throwFailure($ms.sys.upgrades({ full: true }));

	// load any glams
	$ms.sys.manage({
		load: ups.filter((x) => !x.loaded && x.type === "glam").map((x) => x.i),
	});
};
