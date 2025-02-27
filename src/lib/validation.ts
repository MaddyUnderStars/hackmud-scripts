import { isFailure } from "./failure";
import { isRecord } from "./isRecord";
import { isScriptor } from "./isScriptor";

type RawShape = Record<string, Type<unknown>>;
type BaseObjectOutputType<Shape extends RawShape> = {
	[k in keyof Shape]: Shape[k] extends Type<infer X> ? X : never;
};

interface Type<T> {
	parse: (x: unknown) => T;
	// optional: (fallback?: T | undefined) => Type<T | undefined>;
	array: () => Type<T[]>;
}

class ValidationError extends Error {
	name = "ValidationError";
}

const parser = <T>(check: (data: unknown) => T): Type<T> => {
	return {
		parse: check,
		// optional: (fallback?: T | undefined) =>
		// 	parser<T | undefined>((data) => {
		// 		if (!data && fallback) return fallback;
		// 		return check(data);
		// 	}),
		array: () =>
			parser((data) => {
				if (!Array.isArray(data))
					throw new ValidationError(`${data} is not an array`);
				return data.map((x) => check(x));
			}),
	};
};

type NumberType = Type<number> & {
	min: (min: number) => NumberType;
	max: (max: number) => NumberType;
};

const _number = (check: (data: unknown) => number): NumberType => {
	return {
		...parser(check),
		min: (min) =>
			_number((inner) => {
				const num = check(inner);
				if (num < min)
					throw new ValidationError(`${inner} must be less than ${min}`);
				return num;
			}),
		max: (max) =>
			_number((inner) => {
				const num = check(inner);
				if (num > max)
					throw new ValidationError(`${inner} must be greater than ${max}`);
				return num;
			}),
	};
};

const number = (): NumberType => {
	const check = (data: unknown) => {
		if (typeof data !== "number")
			throw new ValidationError(`'${data}' is not number`);

		return data;
	};

	return _number(check);
};

const string = (): Type<string> =>
	parser((data) => {
		if (typeof data !== "string")
			throw new ValidationError(`'${data}' is not string`);

		return data;
	});

const undef = (): Type<undefined> =>
	parser((data) => {
		if (data === undefined) return data;

		throw new ValidationError(`${data} is not undefined`);
	});

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
const scriptor = <T extends any[]>(): ScriptorType<T> => {
	const check = (data: unknown) => {
		if (!isScriptor(data))
			throw new ValidationError(`${data} is not a scriptor`);
		return data;
	};

	const seccheck = (seclevel: keyof typeof SECNAMES, data: unknown) => {
		const d = check(data);
		const sec = $fs.scripts.get_level({ name: d.name });
		if (isFailure(sec)) throw new ValidationError(`${d.name} does not exist`);

		if (sec !== seclevel)
			throw new ValidationError(`${d.name} is not ${SECNAMES[seclevel]}`);

		return d;
	};

	return {
		...parser(check),
		fullsec: () => parser((d) => seccheck(4, d)),
		highsec: () => parser((d) => seccheck(3, d)),
		midsec: () => parser((d) => seccheck(2, d)),
		lowsec: () => parser((d) => seccheck(1, d)),
		nullsec: () => parser((d) => seccheck(0, d)),
	};
};

const object = <T extends RawShape>(inner: T): Type<BaseObjectOutputType<T>> =>
	parser((data) => {
		if (!isRecord(data)) throw new ValidationError(`${data} is not an object`);

		const ret: Record<string, unknown> = {};

		for (const key in inner) {
			ret[key] = inner[key].parse(data[key]);
		}

		return ret as BaseObjectOutputType<T>;
	});

export { number, object, scriptor, string, undef };

