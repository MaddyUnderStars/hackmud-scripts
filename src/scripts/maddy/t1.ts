// @autocomplete s: #s.

import { removeColour } from "/lib/colour";
import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";
import { c001 } from "/lib/locks/c001";
import { c002 } from "/lib/locks/c002";
import { c003 } from "/lib/locks/c003";
import { data_check } from "/lib/locks/data_check";
import { ez_21 } from "/lib/locks/ez_21";
import { ez_35 } from "/lib/locks/ez_35";
import { ez_40 } from "/lib/locks/ez_40";
import { l0cket } from "/lib/locks/l0cket";
import type { LockSolver } from "/lib/locks/type";
import { LOG_LEVEL, createLogger, getLog } from "/lib/log";

const handlers: Record<string, LockSolver> = {};

handlers.l0cket = l0cket;
handlers.DATA_CHECK = data_check;
handlers.c001 = c001;
handlers.c002 = c002;
handlers.c003 = c003;
handlers.EZ_21 = ez_21;
handlers.EZ_35 = ez_35;
handlers.EZ_40 = ez_40;

const isBreached = (out: string) =>
	out.toLowerCase().includes("connection terminated");

let lastLock = "";
const getCurrentLock = (out: string) => {
	const lastLine = out.split("\n").slice(-1)[0];
	const lock = lastLine.split(" ").slice(-2)[0];

	if (out.includes("appropriate k3y")) return "l0ckbox";
	if (out.includes("l0ckjaw")) return "l0ckjaw";

	if (
		out.includes("net GC") ||
		out.includes("transactions") ||
		(out.includes("large") && out.split("\n").length === 1)
	)
		return "acct_nt";

	if (
		handlers[lock.substring(0, lock.length - 1).substring(2)] ||
		!lastLock.length
	)
		lastLock = removeColour(lock);

	return lastLock;
};

const HELP_TEXT = `maddy.t1 { s: #s.example.loc }\n\nsupported locks:\n${Object.keys(handlers).join("\n")}`;

export default function (context: Context, args?: unknown) {
    $fs.maddy.analytics({ context, args });
    
	if (!isRecord(args))
		return {
			ok: false,
			msg: HELP_TEXT,
		};

	if (!isScriptor(args.s)) return { ok: false, msg: HELP_TEXT };

	const exec = (p?: unknown) => {
		const ret = (args.s as Scriptor).call(p);

		let e: string;

		if (typeof ret === "string") e = ret;
		else if (Array.isArray(ret)) e = ret.join("\n");
		else if (isRecord(ret) && "msg" in ret && typeof ret.msg === "string")
			e = ret.msg;
		else e = JSON.stringify(ret);

		if (e.includes("anon_self_destruct")) throw new Error("anon_self_destruct");

		return e;
	};

	const solve = args.p ? args.p : {};
	let state = exec(solve);
	let calls = 0;

	const debug = typeof args.debug === "boolean" ? args.debug : false;
	const getDebugLog = () =>
		getLog(true, debug ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

	if (state.includes("different")) return state;
	if (state.includes("more than 4")) return state;

	while (!isBreached(state)) {
		const lock = getCurrentLock(state);

		const handler = handlers[lock];
		if (!handler) {
			return `no handler for ${lock}\n\n${getDebugLog().join("\n")}\n\n${state}`;
		}

		const { log, stop } = createLogger(`\`N${lock}\``);
		calls = 0;
		const gen = handler(context, log);

		while (getCurrentLock(state) === lock) {
			if (_END - Date.now() < 1200) {
				stop(`timeout. did ${calls} calls`);
				return `${getDebugLog().join("\n")}\n\nlast solve: ${JSON.stringify(solve)}`;
			}

			if (isBreached(state)) break;
			try {
				calls++;
				const iter = gen.next(state);
				if (iter.done) {
					stop(`returned ${JSON.stringify(iter.value)}`);
					return `${getDebugLog().join("\n")}\n\n${state}`;
				}

				Object.assign(solve, iter.value, args.p);
				state = exec(solve);
			} catch (e) {
				stop(`threw ${e instanceof Error ? e.message : JSON.stringify(e)}`);
				return getDebugLog().join("\n");
			}
		}

		gen.return(state);
		stop(`\`2solved ${lock}\``);
	}

	return `\`2LOCK_UNLOCKED\`\n\n${getDebugLog().join("\n")}`;
}
