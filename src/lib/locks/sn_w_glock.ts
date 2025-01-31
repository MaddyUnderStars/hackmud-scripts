import type { LockSolver } from "./type";

export const sn_w_glock: LockSolver = function* () {
    // send all our money to main acct
    $ls.squizzy.xfer();

    const input = yield { sn_w_glock: "" };

    const amounts = $db
        .f({
            s: "t2",
            k: "sn_w_glock",
            q: { $type: "string" },
            a: { $type: "string" },
        })
        .array();

    const amount = amounts.find((x) => input.toLowerCase().includes(x.q))?.a;
    if (!amount) throw new Error("no sn_w_glock amnt");

    // get back the glock amount
    $ls.squizzy.xfer({
        amount,
    });

    // run the loc again
    yield;

    // and get the key from our log
    const transaction = $hs.accts.transactions({ count: 1 })[0];
    yield { sn_w_glock: transaction.memo?.split(" ").splice(-1)[0] };
};