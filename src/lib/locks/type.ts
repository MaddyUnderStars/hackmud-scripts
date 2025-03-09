import type { LOG_FUNC } from "../log";

export type LockSolver = (context: Context, log: LOG_FUNC) => Generator;
