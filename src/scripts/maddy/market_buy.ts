import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";

export default (context: Context, args?: unknown) => {
    $fs.maddy.whitelist();

    const tokens =
        isRecord(args) && "input" in args
            ? typeof args.input === "string"
                ? [...args.input.split(" ")]
                : Array.isArray(args.input)
                    ? args.input.filter(x => typeof x === "string")
                    : undefined
            : undefined;

    if (!tokens || !tokens.length) return "maddy.market_buy { `Ni`: `Vstring | string[]` }";

    const listings = throwFailure($fs.market.browse({ i: tokens }));

    const totalCost = listings.reduce((acc, curr) => acc + curr.cost, 0);

    throwFailure($ms.maddy.xfer({ amount: Math.ceil(totalCost) }));

    for (const token of tokens) {
        throwFailure($ms.market.buy({ i: token, count: 1, confirm: true }));
    }

    return { ok: true };
};
