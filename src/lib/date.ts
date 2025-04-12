export const getDateFormatter = (
	caller: string,
	options?: Intl.DateTimeFormatOptions,
) => {
	if (!$G.__maddy__timezoneDate) {
		const record = $db
			.f({
				_id: `timezone_${caller}`,
				timeZone: { $type: "string" },
			})
			.first() ?? { timeZone: "UTC" };

		$G.__maddy__timezoneDate = Object.assign({}, record, options);
	}

	return $G.__maddy__timezoneDate as Intl.DateTimeFormatOptions;
};
