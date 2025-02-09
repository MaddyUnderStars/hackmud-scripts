export default (context: Context, args?: unknown) => {
	$ms.maddy.whitelist();

	const ups = $hs.sys.upgrades_of_owner({ full: true });

	if (!Array.isArray(ups)) return ups;

	return ups;
};
