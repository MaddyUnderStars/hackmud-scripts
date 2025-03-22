import { throwFailure } from "/lib/failure";

export default function (context: Context, args?: unknown) {
	const usernames = $fs.katsu.find_usernames({}) as string[];

    let ret = "";
	for (const username of usernames) {
		const out = throwFailure(
			$fs.maddy.read({
				s: {
					call: () =>
						$fs.archaic.public({ cmd: "public_profiles", user: username }),
					name: "archaic.public",
				},
			}),
		);

		if (out.includes("Welcome")) continue;
        ret += out;
	}

    return ret;
}
