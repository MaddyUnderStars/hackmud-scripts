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

    parse: (x: unknown) => T;
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
    check: (data: unknown) => T,
) => {
    const r: Type<T> = {
        type,
        path: "$",
        parse: check,
        map: (func) =>
            parser(type, (data) => {
                const parsed = check.call(r, data);
                return func(parsed);
            }),
        or: (other, message = `is not ${type}|${other.type}`) => {
            r.type = `${type}|${other.type}`;
            //@ts-ignore hatred...
            r.parse = (data) => {
                const errors: ValidationError[] = []

                try {
                    return check.call(r, data);
                } catch (e) {
                    if (e instanceof ValidationError) errors.push(e);
                }

                try {
                    return other.parse.call(r, data);
                } catch (e) {
                    if (e instanceof ValidationError) errors.push(e)
                }

                throw new ValidationError(r.path, message, errors);
            };

            return r;
        },
        refine: (func, message = "failed refinement") => {
            r.parse = (data) => {
                const ret = check.call(r, data);
                if (!func(ret))
                    throw new ValidationError(r.path, message);
                return ret;
            };

            return r;
        },
        optional: (fallback) => {
            r.type += "?";
            r.parse = (data) => {
                if (data === undefined) {
                    if (fallback !== undefined) return fallback as T; // hatred...
                    return data as T;
                }

                return check.call(r, data);
            };

            return r;
        },
        array: (message = `is not a ${type}[]`) => {
            r.type += "[]";
            //@ts-ignore hatred...
            r.parse = (data) => {
                if (!Array.isArray(data))
                    throw new ValidationError(r.path, message);
                return data.map((x) => check.call(r, x));
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

const _number = (check: (data: unknown) => number): NumberType => {
    const ret: NumberType = {
        ...parser("number", check),
        min: (min, message = `must be greater than ${min}`) =>
            _number(function (this: Type<number>, inner) {
                const num = check.call(this, inner);
                if (num < min)
                    throw new ValidationError(this.path, message);
                return num;
            }),
        max: (max, message = `must be less than ${max}`) =>
            _number(function (this: Type<number>, inner) {
                const num = check.call(this, inner);
                if (num > max)
                    throw new ValidationError(this.path, message);
                return num;
            }),
    };

    return ret;
};

const number = (message = "is not number"): NumberType => {
    const check = function (this: Type<number>, data: unknown) {
        if (typeof data !== "number")
            throw new ValidationError(ret.path, message);

        return data;
    };

    const ret = _number(check);

    return ret;
};

const string = (message = "is not string"): Type<string> => {
    const check = function (this: Type<string>, data: unknown) {
        if (typeof data !== "string")
            throw new ValidationError(this.path, message);

        return data;
    };

    const ret = parser("string", check);

    return ret;
};

const undef = (message = "is not undefined"): Type<undefined> => {
    const check = function (this: Type<undefined>, data: unknown) {
        if (data === undefined) return data;

        throw new ValidationError(this.path, message);
    };

    const ret = parser("undefined", check);

    return ret;
};

const readableTime = (message = "is not a valid readable timestamp"): Type<number> => {
    const check = function (this: Type<number>, data: unknown) {
        if (typeof data !== "string") throw new ValidationError(this.path, message);

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
    const check = function (this: Type<Scriptor>, data: unknown) {
        if (!isScriptor(data))
            throw new ValidationError(this.path, message);
        return data;
    };

    const seccheck = function (this: Type<Scriptor>, seclevel: keyof typeof SECNAMES, data: unknown) {
        const d = check.call(ret, data);
        const sec = $fs.scripts.get_level({ name: d.name });
        if (isFailure(sec)) throw new ValidationError(this.path, "does not exist");

        if (sec !== seclevel)
            throw new ValidationError(this.path, `is not ${SECNAMES[seclevel]}`);

        return d;
    };

    const ret = {
        ...parser("scriptor", check),
        fullsec: function (this: Type<Scriptor>) {
            ret.parse = (d) => seccheck.call(this, 4, d);
            return ret;
        },
        highsec: function (this: Type<Scriptor>) {
            ret.parse = (d) => seccheck.call(this, 3, d);
            return ret;
        },
        midsec: function (this: Type<Scriptor>) {
            ret.parse = (d) => seccheck.call(this, 2, d);
            return ret;
        },
        lowsec: function (this: Type<Scriptor>) {
            ret.parse = (d) => seccheck.call(this, 1, d);
            return ret;
        },
        nullsec: function (this: Type<Scriptor>) {
            ret.parse = (d) => seccheck.call(this, 0, d);
            return ret;
        },
    };

    return ret;
};

const boolean = (message = "is not a boolean") => {
    const check = function (this: Type<boolean>, data: unknown) {
        if (typeof data === "boolean") return data;
        throw new ValidationError(this.path, message);
    };

    const ret = parser("boolean", check);

    return ret;
};

const object = <T extends RawShape>(inner: T, message = "is not an object"): Type<BaseObjectOutputType<T>> => {
    const check = function (this: Type<BaseObjectOutputType<T>>, data: unknown) {
        if (!isRecord(data)) throw new ValidationError(this.path, message);

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

