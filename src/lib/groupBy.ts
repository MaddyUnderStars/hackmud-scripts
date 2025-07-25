export const groupBy = <T>(
	array: T[],
	predicate: (value: T, index: number, array: T[]) => string,
) =>
	array.reduce(
		(acc, value, index, array) => {
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			(acc[predicate(value, index, array)] ||= []).push(value);
			return acc;
		},
		{} as { [key: string]: T[] },
	);
