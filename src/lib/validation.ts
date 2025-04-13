import { isFailure } from "./failure.js";
import { isRecord } from "./isRecord.js";
import { isScriptor } from "./isScriptor.js";
import { fromReadableTime } from "./time.js";

// biome-ignore lint/suspicious/noExplicitAny: awful sadness
type RawShape = Record<string, Type<any>>;
type BaseObjectOutputType<Shape extends RawShape> = {
    [k in keyof Shape]: Shape[k] extends Type<infer X> ? X : never;
};

interface Type<T> {
    /**
    * The key of this type in an object. Otherwise `$`
    */
    path: string;

    /**
     * The name of this type
     */
    type: string;

    parse: (x: unknown, parent?: Type<unknown>) => T;
    refine: (func: (data: T) => boolean, message?: string) => Type<T>;
    // optional: (fallback?: T | undefined) => Type<T | undefined>;
    optional: <K extends T | undefined>(
        fallback?: K,
    ) => K extends undefined ? Type<T | undefined> : Type<T>;
    array: () => Type<T[]>;
    or: <K>(other: Type<K>, message?: string) => Type<T | K>;
    map: <K>(transformation: (data: T) => K) => Type<K>;
}

class ValidationError extends Error {
    name = "ValidationError";
    path: string;

    constructor(path: string, message: string, cause?: Error[]) {
        super(`${path} ${message}`);
        this.path = path;
        this.cause = cause;
    }

    public toString() {
        return `${this.path} ${this.message}`;
    }
}

export const parser = <T>(
    type: string,
    check: (data: unknown, parent?: Type<unknown>) => T,
) => {
    const r: Type<T> = {
        type,
        path: "$",
        parse: check,
        map: (func) =>
            parser(type, (data) => {
                const parsed = check(data, r);
                return func(parsed);
            }),
        or: (other, message = `is not ${r.type}|${other.type}`) => {
            r.type += `|${other.type}`;
            const oldCheck = r.parse;
            //@ts-ignore hatred...
            r.parse = (data) => {
                const errors: ValidationError[] = [];

                try {
                    return oldCheck(data, r);
                } catch (e) {
                    if (e instanceof ValidationError) errors.push(e);
                }

                try {
                    return other.parse(data, r);
                } catch (e) {
                    if (e instanceof ValidationError) errors.push(e);
                }

                throw new ValidationError(r.path, message, errors);
            };

            return r;
        },
        refine: (func, message = "failed refinement") => {
            const oldCheck = r.parse;
            r.parse = (data) => {
                const ret = oldCheck(data, r);
                if (!func(ret))
                    throw new ValidationError(r.path, message);
                return ret;
            };

            return r;
        },
        optional: (fallback) => {
            r.type += "?";
            const oldCheck = r.parse;
            r.parse = (data) => {
                if (data === undefined) {
                    if (fallback !== undefined) return fallback as T; // hatred...
                    return data as T;
                }

                return oldCheck(data, r);
            };

            return r;
        },
        array: (message = `is not a ${type}[]`) => {
            r.type += "[]";
            const oldCheck = r.parse;
            //@ts-ignore hatred...
            r.parse = (data) => {
                if (!Array.isArray(data))
                    throw new ValidationError(r.path, message);
                return data.map((x) => oldCheck(x, r));
            };

            return r as Type<T[]>;
        }
    };

    return r;
};

type NumberType = Type<number> & {
    min: (min: number) => NumberType;
    max: (max: number) => NumberType;
};

const _number = (check: (data: unknown, parent?: Type<unknown>) => number): NumberType => {
    const ret: NumberType = {
        ...parser("number", check),
        min: (min, message = `must be greater than ${min}`) =>
            _number((inner, parent) => {
                const num = check(inner, parent);
                if (num < min)
                    throw new ValidationError(parent?.path ?? "$", message);
                return num;
            }),
        max: (max, message = `must be less than ${max}`) =>
            _number((inner, parent) => {
                const num = check(inner, parent);
                if (num > max)
                    throw new ValidationError(parent?.path ?? "$", message);
                return num;
            }),
    };

    return ret;
};

const number = (message = "is not number"): NumberType => {
    const check = (data: unknown, parent?: Type<unknown>) => {
        if (typeof data !== "number")
            throw new ValidationError(parent?.path ?? "$", message);

        return data;
    };

    const ret = _number(check);

    return ret;
};

const string = (message = "is not string"): Type<string> => {
    const check = (data: unknown, parent?: Type<unknown>) => {
        if (typeof data !== "string")
            throw new ValidationError(parent?.path ?? "$", message);

        return data;
    };

    const ret = parser("string", check);

    return ret;
};

const undef = (message = "is not undefined"): Type<undefined> => {
    const check = (data: unknown, parent?: Type<unknown>) => {
        if (data === undefined) return data;

        throw new ValidationError(parent?.path ?? "$", message);
    };

    const ret = parser("undefined", check);

    return ret;
};

const readableTime = (message = "is not a valid readable timestamp"): Type<number> => {
    const check = (data: unknown, parent?: Type<unknown>) => {
        if (typeof data !== "string") throw new ValidationError(parent?.path ?? "$", message);

        return fromReadableTime(data);
    };

    const ret = parser("readableTimestamp", check);

    return ret;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ScriptorType<T extends any[]> = Type<Scriptor<T>> & {
    fullsec: () => Type<Scriptor>;
    highsec: () => Type<Scriptor>;
    midsec: () => Type<Scriptor>;
    lowsec: () => Type<Scriptor>;
    nullsec: () => Type<Scriptor>;
};

const SECNAMES = {
    0: "nullsec",
    1: "lowsec",
    2: "midsec",
    3: "highsec",
    4: "fullsec",
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const scriptor = <T extends any[]>(message = "is not a scriptor"): ScriptorType<T> => {
    const check = (data: unknown, parent?: Type<unknown>) => {
        if (!isScriptor(data))
            throw new ValidationError(parent?.path ?? "$", message);
        return data;
    };

    const seccheck = (seclevel: keyof typeof SECNAMES, data: unknown, parent?: Type<unknown>) => {
        const d = check(data, parent);
        const sec = $fs.scripts.get_level({ name: d.name });
        if (isFailure(sec)) throw new ValidationError(parent?.path ?? "$", "does not exist");

        if (sec !== seclevel)
            throw new ValidationError(parent?.path ?? "$", `is not ${SECNAMES[seclevel]}`);

        return d;
    };

    const ret = {
        ...parser("scriptor", check),
        fullsec: () => {
            ret.parse = (d) => seccheck(4, d, ret);
            return ret;
        },
        highsec: () => {
            ret.parse = (d) => seccheck(3, d, ret);
            return ret;
        },
        midsec: () => {
            ret.parse = (d) => seccheck(2, d, ret);
            return ret;
        },
        lowsec: () => {
            ret.parse = (d) => seccheck(1, d, ret);
            return ret;
        },
        nullsec: () => {
            ret.parse = (d) => seccheck(0, d, ret);
            return ret;
        },
    };

    return ret;
};

const boolean = (message = "is not a boolean") => {
    const check = (data: unknown, parent?: Type<unknown>) => {
        if (typeof data === "boolean") return data;
        throw new ValidationError(parent?.path ?? "$", message);
    };

    const ret = parser("boolean", check);

    return ret;
};

const object = <T extends RawShape>(inner: T, message = "is not an object"): Type<BaseObjectOutputType<T>> => {
    const check = (data: unknown, parent?: Type<unknown>) => {
        if (!isRecord(data)) throw new ValidationError(parent?.path ?? "$", message);

        const r: Record<string, unknown> = {};

        for (const key in inner) {
            inner[key].path = `${ret.path}.${key}`;

            r[key] = inner[key].parse(data[key]);
        }

        return r as BaseObjectOutputType<T>;
    };

    const ret = parser("object", check);

    // for (const key in inner) {
    //     inner[key].path += `.${key}`;
    // }

    return ret;
};

export { boolean, number, object, readableTime, scriptor, string, undef };

