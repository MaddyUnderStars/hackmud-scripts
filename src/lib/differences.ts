const getDifferenceUnique = <T extends number | string>(
	arrayA: T[],
	arrayB: T[],
) => {
	const valuesByFrequencies = (accumulator: Record<T, boolean>, value: T) =>
		Object.assign({}, accumulator, {
			[value]: true,
		});

	const dictionaryA = arrayA.reduce(
		valuesByFrequencies,
		{} as Record<T, boolean>,
	);
	const dictionaryB = arrayB.reduce(
		valuesByFrequencies,
		{} as Record<T, boolean>,
	);

	return {
		// get only those values from the `arrayA` that AREN'T present in the
		// `arrayB`. This will get us an array containing the REMOVED items only.
		deletions: arrayA.filter((value) => !dictionaryB[value]),
		// get only those values from the `arrayB` that AREN'T present in the
		// `arrayA`. This will get us an array containing the ADDED items only.
		additions: arrayB.filter((value) => !dictionaryA[value]),
	};
};
