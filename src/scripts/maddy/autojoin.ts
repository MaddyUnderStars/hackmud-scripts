import { throwFailure } from "/lib/failure";

const AXIOMS = [
    "KIN",
    "CHAOS",
    "VOID",
    "DATA",
    "FORM",
    "CHOICE",
];

const PUBLICS = [
    (sector?: string) =>
        sector ? $fs.scripts.nullsec({ sector }) : $fs.scripts.nullsec(),
    (sector?: string) =>
        sector ? $fs.scripts.lowsec({ sector }) : $fs.scripts.lowsec(),
    (sector?: string) =>
        sector ? $fs.scripts.midsec({ sector }) : $fs.scripts.midsec(),
    (sector?: string) =>
        sector ? $fs.scripts.highsec({ sector }) : $fs.scripts.highsec(),
    (sector?: string) =>
        sector ? $fs.scripts.fullsec({ sector }) : $fs.scripts.fullsec(),
];

export default (context: Context, args?: unknown) => {
    const sectors = PUBLICS.flatMap(x => throwFailure(x()));

    for (const name of sectors.filter(x => AXIOMS.find(y => x.includes(y)))) {
        $ms.chats.join({ channel: name });
    }

    return { ok: true };
};