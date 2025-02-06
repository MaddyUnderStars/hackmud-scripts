import { isRecord } from "./isRecord";

export const walk = (
	obj: Record<string, unknown>,
	cb: (value: unknown, key: string, obj: Record<string, unknown>) => void,
) => {
	for (const key in obj) {
		if (isRecord(obj[key])) {
			walk(obj[key], cb);
			continue;
		}

        obj[key] = cb(obj[key], key, obj);
	}
};
