export default function(context, args) {
    const isRecord = (value) => Boolean(value) && typeof value === "object";
    
    class ValidationError extends Error {
        constructor(path, message, cause) {
            super(`${path} ${message}`);
            this.name = "ValidationError";
            this.path = path;
            this.cause = cause;
        }
    
        toString() {
            return `${this.path} ${this.message}`;
        }
    };

    const parser = (type, check) => {
        const r = {
            type,
            path: "$",
            parse: check,
            or: (other, message = `is not ${type}|${other.type}`) => {
                r.type = `${type}|${other.type}`;
                //@ts-ignore hatred...
                r.parse = (data) => {
                    const errors = []
    
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
                        if (fallback !== undefined) return fallback
                        return data
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
    
                return r
            }
        };
    
        return r;
    };

    const _number = (check) => {
        const ret = {
            min: (min, message = `must be greater than ${min}`) =>
                _number(function (inner) {
                    const num = check.call(this, inner);
                    if (num < min)
                        throw new ValidationError(this.path, message);
                    return num;
                }),
            max: (max, message = `must be less than ${max}`) =>
                _number(function (inner) {
                    const num = check.call(this, inner);
                    if (num > max)
                        // THE THIS KEYWORD IS BEING TURNED INTO `UNDEFINED` HERE!!!
                        throw new ValidationError(this.path, message);
                    return num;
                }),
        };

        Object.assign(ret, parser("number", check))
    
        return ret;
    };
    
    const number = (message = "is not number") => {
        // biome-ignore lint/complexity/useArrowFunction: <explanation>
        const check = function (data) {
            if (typeof data !== "number")
                throw new ValidationError(ret.path, message);
    
            return data;
        };
    
        const ret = _number(check);
    
        return ret;
    };

    const object = (inner, message = "is not an object") => {
        const check = function (data) {
            if (!isRecord(data)) throw new ValidationError(this.path, message);
    
            const r = {};
    
            for (const key in inner) {
                inner[key].path = `${ret.path}.${key}`;
    
                r[key] = inner[key].parse(data[key]);
            }
    
            return r
        };
    
        const ret = parser("object", check);
    
        // for (const key in inner) {
        //     inner[key].path += `.${key}`;
        // }
    
        return ret;
    };    

    const schema = object({
        test: number().min(0).optional(0)
    });

    try {
        return schema.parse(args);
    }
    catch (e) {
        return e.stack;
    }
}