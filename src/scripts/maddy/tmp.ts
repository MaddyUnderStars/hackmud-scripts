import { histogram } from "/lib/chart";

export default function (context: Context, args?: unknown) {
	return histogram(
		[
			{ value: 1, label: "hello" },
			{ value: 5, label: "how" },
			{ value: 4, label: "are" },
			{ value: 7, label: "you" },
			{ value: 10, label: "today" },
		],
		context.cols,
	);
}
