// @autocomplete s: #s.

import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

export default function (context: Context, args?: unknown): string | ScriptFailure {
    $fs.maddy.analytics({ context, args });
    
	if (!isRecord(args) || !isScriptor(args.s))
		return {
			ok: false,
			msg: "maddy.read { s: #s.trust.public_corp, a: { passthrough }, timings?: true }",
		};

	const passthrough = args.a;

	const chars = $fs.scripts.lib().corruption_chars;

	const ignored: number[] = [];

	let attempts = 0;
	let ret = "";
	const timings = [];
	do {
		if (_END - Date.now() < 500) break;

		const start = Date.now();
		const corruptedOutput = args.s.call(passthrough);
		let iter: string;
		if (typeof corruptedOutput === "string") iter = corruptedOutput;
		else if (
			isRecord(corruptedOutput) &&
			"msg" in corruptedOutput &&
			typeof corruptedOutput.msg === "string"
		)
			iter = corruptedOutput.msg;
		else if (Array.isArray(corruptedOutput)) iter = corruptedOutput.join("\n");
		else return { ok: false, msg: "failed" };

		iter = iter.replaceAll(
			/\`[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ](.*?)\`/g,
			(s, ...args) => {
				if (chars.includes(args[0])) return args[0];

				return s;
			},
		);

		if (ret === "") ret = iter;

		ret = ret
			.split("")
			.map((char, i) => {
				if (!chars.includes(char) || ignored.includes(i)) return char;

				if (attempts > 0 && char === iter[i]) {
					ignored.push(i);
				}

				return iter[i];
			})
			.join("");

		attempts++;

		timings.push(Date.now() - start);
	} while (
		chars
			.split("")
			.find((x) => ret.includes(x) && !ignored.includes(ret.indexOf(x)))
	);

	if (args.timings)
		return `${ret}\n\navg ${timings.length === 1 ? timings[0] : timings.reduce((prev, curr) => prev + curr) / (timings.length - 1)}ms. calls: ${attempts}. ignored_indexes: ${JSON.stringify(ignored)}`;

	return ret;
}
