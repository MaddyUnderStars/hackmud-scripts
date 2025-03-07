import { throwFailure } from "/lib/failure";

export default (context: Context, args?: unknown) => {
	const halfHourago = new Date();
	halfHourago.setMinutes(halfHourago.getMinutes() - 30);
	const [updated] = $db.u(
		{ _id: "maddy_public_ad", date: { $lt: halfHourago } },
		{ $set: { date: new Date() } },
	);

	if (updated.n === 0)
		return {
			ok: false,
			msg: "The advert has already been posted within the last 30 minutes. Please try again later.",
		};

	const AD_TEXT = "maddy.public";
	const AD_DEST = "0000";

	const in_channel = $ms.chats.channels().includes(AD_DEST);
	if (!in_channel) throwFailure($ms.chats.join({ channel: AD_DEST }));

	throwFailure($ms.chats.send({ channel: AD_DEST, msg: AD_TEXT }));

	if (!in_channel) $ms.chats.leave({ channel: AD_DEST });

	return { ok: true, msg: "Thank you" };
};
