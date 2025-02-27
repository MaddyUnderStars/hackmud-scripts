import * as v from "/lib/validation";

export default (context: Context, args?: unknown) => {
	const obj = v.object({
        e: v.undef(),
    });

	const ret = obj.parse(args);

	return ret;
};
