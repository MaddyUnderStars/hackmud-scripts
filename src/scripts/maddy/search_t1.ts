import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

const exec = (scriptor: Scriptor, args?: unknown): string => {
    return $fs.maddy.read({ s: scriptor, a: args });
};

export default function (context: Context, args?: unknown) {
    if (!isRecord(args) || !isScriptor(args.s)) return { ok: false, msg: "maddy.search_t1 { s: #s.corp.script }" };

    const home = exec(args.s);
    const empty = exec(args.s, {});

    const navArgName = empty.split(":")[0].split(" ").splice(-1)[0];

    // get the nav values from home page
    const [blogNav, aboutNav] = home.split("\n").splice(-1)[0].split("|").map(x => x.trim());

    // get the directory nav
    const peopleNav = empty.split(":").splice(-1)[0].replaceAll("\"", "");

    // get the password
    const about = exec(args.s, { [navArgName]: aboutNav });

    const password = about.match(/strategy .*? /i)?.[0]?.split(" ")[1];
    if (!password) return { ok: false, msg: "Could not find password" };

    const blog = exec(args.s, { [navArgName]: blogNav });
    const projects = [...blog.matchAll(/(review of .*? )|(developments on .*? )|(launch of the .*? )|(release date for .*? )/gi)]
        .map(x => x[0]
            .split(" ")
            .filter(x => !!x)
            .splice(-1)[0]
            .replace(/(\.|,)$/, "")
        );

    const possiblePwArgs = ["password", "pass", "p"];
    let passwordArg: string | undefined;
    do {
        const tryArg = possiblePwArgs.shift();
        if (!tryArg) return { ok: false, msg: "couldn't find password argument" };
        const attempt = exec(args.s, { [navArgName]: peopleNav, [tryArg]: password });

        if (attempt.indexOf("No password specified") === -1) passwordArg = tryArg;
    } while (!passwordArg);

    const locs = [];
    for (const project of projects) {
        if (_END - Date.now() < 500) {
            locs.push("\nran out of time.");
            break;
        }

        const curr = exec(args.s, {
            [navArgName]: peopleNav,
            [passwordArg]: password,
            project
        });

        locs.push(...curr.split("\n").filter(x => x.match(/[A-Za-z_\d]+?\.[A-Za-z_\d]+?$/gmi)));
    }

    return locs.map(x => `maddy.t1 { s: #s.${x} }`);
}