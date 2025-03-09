import { throwFailure } from "/lib/failure";

export default function (context: Context, args?: unknown) {
	const usernames = $db
		.f({ s: "corp_usernames" })
		.array()
		.map((x) => x.name);

	for (const username of usernames) {
		const corp = throwFailure($fs.maddy.read({
			s: {
				call: (args: unknown) => $ms.cyberdine.members(args),
				name: "cyberdine.members",
			},
			a: { username }
		}));

        if (corp.includes("does not exist")) {
            $D(`no results for ${username}`);
            $db.r({ _id: `corp_usernames_${username}` })
        }
	}
}
