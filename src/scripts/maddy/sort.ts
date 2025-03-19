import { throwFailure } from "/lib/failure";

export default (context: Context, args?: unknown) => {
    $fs.maddy.analytics({ context, args });
    
	// swap and extend as needed
	const lockPriority = [
		"CON_TELL",
		"w4rn_er",
		"acct_nt",
		"sn_w_glock",
		"shfflr",
		"sn_w_usac",
		"l0ckjaw",
		"l0ckbox",
		"DATA_CHECK_V4",
		"DATA_CHECK_V3",
		"l0g_wr1t3r",
		"magnara",
		"CONSPEC",
		"EZ40",
	];

	const sortedLocks = throwFailure(
		$hs.sys.upgrades({ filter: { type: "lock", loaded: true } }),
	)
		.sort(lockSort)
		.map((a) => a.i);

	//@ts-ignore
	const sortedOther = (
		throwFailure(
			//@ts-ignore
			$hs.sys.upgrades({ filter: { type: { $ne: "lock" } } }) as unknown[],
		) as Upgrade[]
	)
		.sort(genericSort)
		.map((a) => a.i);

	reorderUpgrades(sortedLocks, 0);
	reorderUpgrades(sortedOther, sortedLocks.length);

	return throwFailure($hs.sys.upgrades({ is_script: false })).upgrades;

	// sort locks by lockPriority array
	function lockSort(a: Upgrade, b: Upgrade) {
		let indexA = lockPriority.indexOf(a.name);
		let indexB = lockPriority.indexOf(b.name);

		if (indexA === -1) indexA = lockPriority.length;
		if (indexB === -1) indexB = lockPriority.length;

		return indexA - indexB;
	}

	type Upgrade = { name: string; rarity: number; loaded: boolean; i: number };

	// sort all other upgrades by loaded, name, and rarity
	function genericSort(a: Upgrade, b: Upgrade) {
		if (a.loaded === b.loaded) {
			if (a.name === b.name) {
				return a.rarity - b.rarity;
			}
			return a.name.localeCompare(b.name);
		}
		return a.loaded ? -1 : 1;
	}

	function reorderUpgrades(sortedArray: number[], offset = 0) {
		for (let s = sortedArray.length - 1; s >= 0; s--) {
			const from = sortedArray[s];
			const to = offset;

			$ms.sys.manage({ reorder: { from, to } });
			sortedArray[s] = to;

			for (let ss = 0; ss < sortedArray.length; ss++) {
				if (sortedArray[ss] < from) sortedArray[ss]++;
			}
		}
	}
};
