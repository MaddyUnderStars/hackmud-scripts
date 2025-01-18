// @autocomplete s: #s.

import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;
    while (l--) {
        if (predicate(array[l], l, array))
            return l;
    }
    return -1;
}

export default function (context: Context, args?: unknown) {
    if (!isRecord(args)) return { ok: false };
    if (!isScriptor(args.s)) return { ok: false };

    const passthrough = args.a;

    const chars = $fs.scripts.lib().corruption_chars;
    const colourChars = $fs.scripts.lib().colors;

    let ret = "";
    do {
        const corruptedOutput = args.s.call(passthrough);
        let iter: string;
        if (typeof corruptedOutput === "string") iter = corruptedOutput;
        else if (isRecord(corruptedOutput) &&
            'msg' in corruptedOutput &&
            typeof corruptedOutput.msg === "string")
            iter = corruptedOutput.msg;
        else if (Array.isArray(corruptedOutput)) iter = corruptedOutput.join("\n");
        else return { ok: false, msg: "failed" };

        iter = iter.replaceAll(/\`[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ](.*?)\`/g, (s, ...args) => {
            return args[0];
        })

        if (ret === "") ret = iter;

        // ret = ret.split("").map((char, i, arr) => {
        //     if (!chars.includes(char)) return char;

        //     arr[i - 1] = iter[i - 1];
        //     arr[i + 1] = iter[i + 1];
        //     return iter[i];
        // }).join("");

        ret = ret.split("").map((char, i) => !chars.includes(char) ? char : iter[i]).join("");

        // const searchtext = ret.substring(-10);
        // const startpos = iter.indexOf(searchtext.substr(findLastIndex(searchtext.split(""), x => chars.includes(x))));

        // if (startpos === -1) continue;

        // const longestReadable = iter.substring(startpos + 1).split("").findIndex(x => chars.includes(x));
        // if (!longestReadable) continue;

        // const line = iter.substring(ret.length, longestReadable);
        // // $D(`${JSON.stringify({
        // //     searchtext: searchtext.replaceAll('"', '\"'),
        // //     startpos,
        // //     line: line.replaceAll('"', '\"'),
        // //     ret: ret.replaceAll('"', '\"'),
        // // }, null, 2)}\n`);
        // ret += line;
    } while (chars.split("").find(x => ret.includes(x)));

    return ret;
}