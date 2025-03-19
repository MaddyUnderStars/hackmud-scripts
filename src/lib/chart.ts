import { padStart } from "./padStartColor";

const PADDING = 10;
const CHAR = "\u00A1";

export const histogram = (
	data: Array<{ value: number; label?: string }>,
	width: number,
) => {
	const ret: string[] = [];
	const maxValue = Math.max(...data.map((x) => x.value));
	const maxLabelLength = Math.max(...data.map((x) => x.label?.length ?? 0));

	for (const row of data) {
		const percentage = row.value / maxValue;

		let rendered = CHAR.repeat(
			Math.round(
				(width - maxLabelLength - PADDING - row.value.toString().length) *
					percentage,
			),
		);
		rendered += ` ${row.value}`;
		if (maxLabelLength > 0)
			rendered = `${padStart(row.label ?? "", maxLabelLength, " ")} | ${rendered}`;

		ret.push(rendered);
	}

	return ret.join("\n\n");
};
