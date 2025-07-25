import { histogram } from "/lib/chart";
import { getDateFormatter } from "/lib/date";
import { groupBy } from "/lib/groupBy";
import { isRecord } from "/lib/isRecord";
import { table } from "/lib/table";
import * as v from "/lib/validation";

const HELP_TEXT = `Script analytics helper. Usage in scripts: \`#fs.maddy.analytics();\`
You may also provide your scripts args, context, or other data you would like to browse later.
    
Usage in CLI:
\`Nq\`: \`Vstring\` - Show stats for a script you own`;

/**
 * TODO:
 * - show most popular args? or generally, most popular any prop in custom?
 */

export default (context: Context, args?: unknown): unknown => {
    // if (#FMCL) fmcl doesn't work in hse
    if ($G.__maddy__fmcl)
        return { ok: false, msg: "Currently, you may only call this script once." };
    $G.__maddy__fmcl = true;

    const IS_OWNER = context.caller === context.this_script.split(".")[0];

    if (!context.calling_script) {
        if (!args) return HELP_TEXT;

        const RANGE_VALIDATOR = v
            .readableTime(
                "`Nsince` must be in format /(\\d*d)?\\s?(\\d*h)?\\s?(\\d*m)?\\s?(\\d*s)?\\s?(\\d*ms)?/",
            )
            .optional();

        const { q, after, before, user, show, run, no_brains } = v
            .object({
                q: v
                    .string()
                    .refine((data) => {
                        if (data.includes("."))
                            return data.split(".")[0] === context.caller || IS_OWNER;
                        return data === context.caller || IS_OWNER;
                    }, "Access denied")
                    .optional(),
                after: RANGE_VALIDATOR,
                before: RANGE_VALIDATOR,
                user: v.string().optional(),
                show: v
                    .string()
                    .refine((data) => ["users", "latest"].includes(data), "must be one of `users`, `latest`")
                    .optional(),
                run: v.string().optional(),
                no_brains: v.boolean().optional(),
            })
            .parse(args);

        if (run) {
            return $db.f({ _id: `analytics_${run}` }).first();
        }

        if (!q) {
            return `Provide a script to view with \`Nq\`\n\n${$fs.scripts
                .lib()
                .columnize(
                    $db
                        .f({ script: { $regex: context.caller } }, { script: true })
                        .distinct("script")
                        .map((x) => `${x}`),
                )}`;
        }

        const script_owner = q.includes(".") ? q.split(".")[0] : q;

        if (show === "users") {
            return `Showing all users of ${q}\n\n${$fs.scripts.lib().columnize(
                $db
                    .f({ script: q.includes(".") ? q : { $regex: q } })
                    .distinct("caller")
                    .map((x) => x?.toString() ?? ""),
            )}`;
        }

        if (show === "latest") {
            return $db
                .f({
                    script: q.includes(".") ? q : { $regex: q },
                    date: { $type: "date" },
                    caller: user ? user : { $ne: script_owner },
                    is_brain: no_brains ? { $eq: false } : { $exists: true },
                })
                .sort({ date: -1 })
                .limit(100)
                .array();
            // .filter((x) => {
            //     if (x.custom)
            //         //@ts-ignore
            //         return !x.custom.context.calling_script?.includes(script_owner);
            //     return true;
            // });
        }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const data = $db
            .f({
                script: q.includes(".") ? q : { $regex: q },
                date: {
                    $exists: true,
                    ...(after ? { $gt: new Date(Date.now() - after) } : { $gt: weekAgo }),
                    ...(before ? { $lt: new Date(Date.now() - before) } : {}),
                },
                caller: user ? user : { $ne: script_owner },
            })
            .sort({ date: -1 })
            .array();

        const grouped = groupBy(
            data,
            (x) =>
                (x.date as Date)?.toLocaleDateString(
                    "en-AU",
                    getDateFormatter(context.caller),
                ) ?? "",
        );

        const users = groupBy(data, (x) => x.caller as string);

        let ret = "";

        if (user) {
            const customKeys = [
                ...new Set(data.flatMap((x) => Object.keys(x.custom ?? {}))),
            ];

            return `${q}\n\n${table(
                [
                    ["RUN_ID", "date", ...customKeys],
                    [],
                    ...data.map((x) => [
                        (x._id as string).replace("analytics_", ""),
                        (x.date as Date).toLocaleString(
                            "en-AU",
                            getDateFormatter(context.caller),
                        ),
                        ...Object.values(x.custom ?? ({} as Record<string, unknown>)).map(
                            (y) => `${y}`,
                        ),
                    ]),
                ],
                context.cols,
            )}`;
        }

        ret += `${q}\n\n`;

        const usersDisplay = Object.entries(users).map(
            ([key, value]) => `${key} (${value.length})`,
        );

        ret += `Users: ${usersDisplay.slice(0, 10).join(", ")}${usersDisplay.length > 10 ? ` ... and ${usersDisplay.length - 10} more` : ""}\n\n`;

        ret += `Usage by day\n\n${histogram(
            Object.entries(grouped).map(([key, value]) => ({
                label: key,
                value: value.length,
            })),
            context.cols,
        )}`;

        return ret;
    }

    //@ts-ignore
    const args_context: boolean | undefined = args?.context?.is_brain;
    const is_brain = context.is_brain || args_context || false;

    $db.i({
        _id: `analytics_${_RUN_ID}`,
        caller: context.caller,
        script: context.calling_script,
        date: new Date(),
        is_brain,

        //@ts-ignore
        custom: args && isRecord(args) ? JSON.stringify(args) : null,
    });

    return { ok: true };
};
