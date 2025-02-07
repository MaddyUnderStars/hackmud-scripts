import { isRecord } from "/lib/isRecord";

export default (context: Context, args?: unknown) => {
	const allowed = [
		"maddy",
		"ira",
		"katsu",
		"verdance",
		"squizzy",
		"uzuri",
		"oscilio",
		"arakni",
		"enigma",
	];

	if (
		context.calling_script &&
		!allowed.includes(context.calling_script.split(".")[0])
	)
		throw new Error("unauthorized");

	if (!allowed.includes(context.caller)) throw new Error("unauthorized");

	if (isRecord(args) && typeof args.user === "string")
		return { ok: allowed.includes(args.user) };

	return { ok: true };
};
