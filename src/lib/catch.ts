export const wrapCatch = (func: (...rest: unknown[]) => unknown) => {
    try {
        return func();
    }
    catch (e) {
        $D(e instanceof Error ? e.stack : e?.toString());
        return { ok: false, msg: "500" }
    }
}