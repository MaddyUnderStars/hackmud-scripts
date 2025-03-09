// converts game timestamp (i.e. 240423.1042) into Date
export const game_ts_to_date = (timestamp: string) => {
	const split = timestamp.split(".");
	const [year, month, day] = (split[0]?.match(/.{2}/g) ?? []).map((x) =>
		Number.parseInt(x),
	);
	const [hour, minute] = (split[1]?.match(/.{2}/g) ?? []).map((x) =>
		Number.parseInt(x),
	);

	// Y3K lol
	return new Date(Number.parseInt(`20${year}`), month - 1, day, hour, minute);
};
