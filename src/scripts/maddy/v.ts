import * as v from "/lib/validation";

export default (context: Context) => {
	return Object.assign(
		{
			ok: true,
			msg: "maddy.v\n\nzod-like validation library.",
		},
		v,
	);
};
