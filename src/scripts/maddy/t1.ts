// @autocomplete s: #s.trust.me
import { isRecord } from "/lib/isRecord";
import { isScriptor } from "/lib/isScriptor";

//@ts-ignore
const colours = ($db.f({ s: "t1", k: "c" }).array() as { s: "t1", k: "c", a: string; i: number; }[]).sort((a, b) => a.i - b.i);

const set = (obj: unknown) => {
    Object.assign(keys, obj);
};

const keys = {};
const handlers = {
    c002: function* () {

        for (let i = 0; i < colours.length; i++) {
            set({
                c002: colours[i].a,
                c002_complement: colours[(i + 4) % 8].a
            });
            yield;
        }
    },

    c001: function* () {
        for (let i = 0; i < colours.length; i++) {
            set({
                c001: colours[i].a,
                color_digit: colours[i].a.length
            });
            yield;
        }
    },

    c003: function* () {
        for (let i = 0; i < colours.length; i++) {
            set({
                c003: colours[i].a,
                c003_triad_1: colours[(i + 3) % 8].a,
                c003_triad_2: colours[(i + 5) % 8].a
            });
            yield;
        }
    },

    EZ_21: function* () {
        const words = ["unlock", "open", "release"];

        for (const word of words) {
            set({ EZ_21: word });
            yield;
        }
    },

    EZ_40: function* () {
        const words = ["unlock", "open", "release"];

        for (const word of words) {
            set({ EZ_40: word });
            if (((yield) as string).includes("ez_prime")) break;
        }

        //@ts-ignore
        const answers = $db.f({ s: "t1", k: "ez_40" }).array() as { s: "t1", k: "ez_40", a: number; }[];

        for (const a of answers) {
            set({ ez_prime: a.a });
            yield;
        }
    },

    EZ_35: function* () {
        const words = ["unlock", "open", "release"];

        for (const word of words) {
            set({ EZ_35: word });
            if (((yield) as string).includes("digit")) break;
        }

        for (let i = 0; i <= 9; i++) {
            set({ digit: i });
            yield;
        }
    },

    DATA_CHECK: function* () {
        //@ts-ignore
        const answers = $db.f({ s: "t1", k: "datacheck" }).array() as { s: "t1", k: "datacheck", q: string, a: string; }[];

        set({ DATA_CHECK: "" });
        const input = (yield) as string;

        const ret = input.split("\n").map(x =>
            answers.find(
                y => x.toLowerCase().includes(y.q.toLowerCase())
            )?.a
        ).join("");

        set({ DATA_CHECK: ret });

        yield;
    },

    l0cket: function* () {
        //@ts-ignore
        const answers = $db.f({ s: "t1", k: "l0cket" }).array() as { s: "t1", k: "l0cket", a: string; }[];

        for (const answer of answers) {
            set({ l0cket: answer.a });
            yield;
        }
    }
} as Record<string, (input?: string) => Generator<unknown, unknown, unknown>>;

let lastlock = "";
const getCurrentLock = (out: string) => {
    const lastline = out.split("\n").slice(-1)[0];
    const lock = lastline.split(" ").slice(-2)[0];

    if (
        handlers[lock.substring(0, lock.length - 1).substring(2)] ||
        !lastlock.length
    ) {
        lastlock = lock;
        return lock;
    }
    return lastlock;
};

const isBreached = (out: string) => out.toLowerCase().includes("connection terminated");

export default function (context: Context, args?: unknown) {
    if (!isRecord(args)) return { ok: false, msg: "maddy.t1 { s: #s.example.loc }" };
    if (!isScriptor(args.s)) return { ok: false };

    const passthrough = args.p;
    set(passthrough);

    const history: { keys: object, out: string; }[] = [];

    let out = args.s.call(passthrough) as string;
    const run = () => {
        const e = (args.s as Scriptor).call(keys);
        if (isRecord(e) && 'msg' in e) out = e.msg as string;
        else out = e as string;
        // $D(`tried ${JSON.stringify(keys)} got\n${JSON.stringify(out)}\n`);
        history.push(Object.assign({}, { keys, out }));
    };

    run();

    if (!out.includes("LOCK_ERROR")) return out;

    let attempts = 0;
    while (out?.includes("LOCK_ERROR")) {
        const lock = getCurrentLock(out);

        attempts++;
        if (attempts > 20) {
            return { ok: false, msg: history };
        }

        const handler = handlers[lock.substring(0, lock.length - 1).substring(2)];
        if (!handler) {
            return { ok: false, msg: history };
        }

        const gen = handler(out);

        while (getCurrentLock(out) === lock) {
            if (isBreached(out)) break;
            if (gen.next(out).done) {
                return { ok: false, history };
            }
            run();
        }
    }

    return { ok: true };
}