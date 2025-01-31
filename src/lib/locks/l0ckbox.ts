import type { LockSolver } from "./type";

export const l0ckbox: LockSolver = function* () {
    const input = yield {};

    const k3y: string = input.split(" ").slice(-1)[0];

    const ret = $ls.maddy.keyring({ unload: true, load: k3y });

    if (!ret || !("ok" in ret && ret.ok)) {
        const buy = $ls.maddy.keyring({ market: k3y, buy: "10mgc" });

        if ("ok" in buy && !buy.ok) throw `matr1x.r3dbox { request: "${k3y}" }`;
    }

    yield;
}