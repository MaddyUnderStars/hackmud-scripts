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

	if (!allowed.includes(context.caller)) {
		$ms.maddy.xfer();
		throw new Error("unauthorized");
	}
    
    if (isRecord(args) && typeof args.user === "string")
        return { ok: allowed.includes(args.user) };

	return { ok: true };
};
