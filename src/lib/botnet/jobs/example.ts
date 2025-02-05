import type { JobHandler } from "../jobs";

export const exampleJob: JobHandler = () => {
	$fs.chats.tell({ to: "maddy", msg: "example job" });
};
