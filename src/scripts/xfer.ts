// transfer amount: number to caller or show balance of user
// runs on all users other than `maddy` who owns the controlling script
export default (context: Context, args?: { amount: number | string }) => {
	$ms.maddy.whitelist();

	const amount = args?.amount;
	if (amount) {
		return $fs.accts.xfer_gc_to_caller({ amount });
	}

    return $fs.accts.balance_of_owner();
};
