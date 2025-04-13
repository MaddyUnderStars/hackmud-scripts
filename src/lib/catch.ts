export const wrapCatch = <T>(func: (...rest: unknown[]) => T): T | ScriptFailure => {
    try {
        return func();
    }
    catch (e) {
        $D(e instanceof Error ? e.stack : e?.toString());
        return { ok: false, msg: "500" }
    }
}