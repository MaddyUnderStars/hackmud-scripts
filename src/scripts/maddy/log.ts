import { table } from "/lib/table";

export default function (context: Context, args?: unknown) {
    $fs.maddy.analytics({ context, args });
    
    const lastRan = args
        ? undefined
        : $db.f({ _id: `sys_log_${context.caller}` }).first()?.t;

    const out = [["time", "msg"]];
    let i = 0;

    const PAGE_SIZE = 200;

    loop: while (true) {
        if (_END - Date.now() < 500) {
            out.push(["out of time", ""]);
            break;
        }

        const logs = $ls.sys.access_log({ count: PAGE_SIZE, start: i * PAGE_SIZE });
        if (!Array.isArray(logs)) {
            out.push(["out of logs", ""]);
            break;
        }
        i++;

        for (const log of logs) {
            if (lastRan && log.t < lastRan) {
                if (!args)
                    $db.us({ _id: `sys_log_${context.caller}` }, { $set: { t: log.t } });
                break loop;
            }

            if (log.u) out.push([log.t.toLocaleString(), log.msg]);
        }

        if (logs.length < PAGE_SIZE) {
            out.push(["out of logs", ""]);
            break;
        }
    }

    $db.us({ _id: `sys_log_${context.caller}` }, { $set: { t: new Date() } });

    return table(out, context.cols) + (args ? "" : "\n\npass empty param to view all* logs\n\n*as many as possible");
}
