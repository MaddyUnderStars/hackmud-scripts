// filter `data` by `query`. all conditions must be true
// implements https://www.mongodb.com/docs/manual/reference/operator/query/#std-label-query-projection-operators-top
export const mongoFilter = (query: Record<string, unknown>, data: unknown) => {
	let pass: boolean | null = null;
	if ("$eq" in query) pass = (pass ?? true) && query.$eq === data;
	if (
		"$gt" in query &&
		typeof query.$gt === "number" &&
		typeof data === "number"
	)
		pass = (pass ?? true) && query.$gt < data;
	if (
		"$gte" in query &&
		typeof query.$gt === "number" &&
		typeof data === "number"
	)
		pass = (pass ?? true) && query.$gt <= data;
	if ("$in" in query && Array.isArray(query.$in))
		pass = (pass ?? true) && query.$in.includes(data);
	if (
		"$lt" in query &&
		typeof query.$lt === "number" &&
		typeof data === "number"
	)
		pass = (pass ?? true) && query.$lt > data;
	if (
		"$lte" in query &&
		typeof query.$lt === "number" &&
		typeof data === "number"
	)
		pass = (pass ?? true) && query.$lt >= data;
	if ("$ne" in query) pass = (pass ?? true) && query.$ne !== data;
	if ("$nin" in query && Array.isArray(query.$nin))
		pass = (pass ?? true) && !query.$nin.includes(data);

	if ("$exists" in query && typeof query.$exists === "boolean")
		pass = (pass ?? true) && (query.$exists ? !!data : !data);

	return pass ?? true;
};
