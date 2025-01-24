// @autocomplete s: #s.

import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

export default function (context: Context, args?: unknown) {
    if (!isRecord(args) || !isScriptor(args.s))
        return { ok: false, msg: "maddy.read { s: #s.trust.public_corp, a: { passthrough }, timings?: true }" };

    const passthrough = args.a;

    const chars = $fs.scripts.lib().corruption_chars;

    let ret = "";
    const timings = [];
    do {
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
                return args[0];
            },
        );

        if (ret === "") ret = iter;

        ret = ret
            .split("")
            .map((char, i) => (!chars.includes(char) ? char : iter[i]))
            .join("");

        timings.push(Date.now() - start);
    } while (chars.split("").find((x) => ret.includes(x)));

    if (args.timings)
        return `${ret}\n\n${timings.reduce((prev, curr) => prev + curr) / (timings.length - 1)}ms`;

    return ret;
}
