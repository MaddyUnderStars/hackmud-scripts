import { decodeBase64, isBase64 } from "/lib/base64";
import { removeColour } from "/lib/colour";
import { throwFailure } from "/lib/failure";
import { isRecord } from "/lib/isRecord";

export default function (context: Context, args?: unknown) {
	if (!args || !isRecord(args)) return;

	if ("backup" in args && args.backup) {
		const backup = args.backup;
		const pin = args.pin;

		if (!args.confirm)
			return "this will check all entries in the backup server which may have malicious payloads. confirm: true";

		const root: string = throwFailure(
			$fs.maddy.read({ s: backup, a: { pin } }),
		);

		const items = root.matchAll(/(\d*)?> (.*?)$/gm);

		let key: string | undefined = undefined;
		const outputs: string[] = [];
		for (let i = 0; i < 20; i++) {
			const out = throwFailure($fs.maddy.read({ s: backup, a: { pin, i } }));
			if (out.includes("record not found")) continue;
			if (out.includes("key")) key = out.split("\n").slice(-1)[0];

			outputs.push(out);
		}

		return outputs;
	}

	const priv = args.s;

	if (!args.u || typeof args.u !== "string") {
		const usernames = $ms.katsu.find_usernames({});

		for (const username of usernames) {
			if (!username) continue;

			const ret = $fs.maddy.read({ s: priv, a: { username } });

			if (ret.includes("does not exist")) {
				continue;
			}

			$D(`maddy.t3_pin_brute { s: #s.${priv.name}, u: "${username}" }`);
		}
		return;
	}

	const username = args.u;

	if (args.calendar && username && args.pin) {
		const pin = args.pin as number;

		$D("getting root");
		const root = priv.call({
			username,
			pin: String(pin).padStart(4, "0"),
			a_t: "w_ek",
			perform: "flow",
			work: "calendar",
		}) as string;

		// get the offset
		const offset = removeColour(root).match(/D\d{3}/gm)?.[0];
		if (!offset) {
			$D("no offset");
			return;
		}

		$D(Number.parseInt(offset.slice(1)));

		for (let d = -Number.parseInt(offset.slice(1)); d < 400; d += 12) {
			const calendar = priv.call({
				username,
				pin: String(pin).padStart(4, "0"),
				a_t: "w_ek",
				perform: "flow",
				work: "calendar",
				d,
			}) as string;

			const indexes = calendar
				.match(/\| [A-Za-z0-9]{6}/gm)
				?.map((x) => x.slice(2));
			if (!indexes) {
				$D(`no indexes at ${d}`);
				continue;
			}

			for (const index of indexes) {
				const c_index = priv.call({
					username,
					pin: String(pin).padStart(4),
					a_t: "w_ek",
					perform: "flow",
					work: "calendar",
					d,
					i: index,
				}) as string;

				// const locs = c_index.match(
				// 	/([a-z_][a-z_0-9]{0,24})\.?((?:info|out|external|public|pub|pub_info|pubinfo|p|access|entry|extern)_[a-z0-9]{6})/g,
				// );

				const encoded_portion = c_index.split("\n").slice(2).join("\n");

				if (isBase64(encoded_portion))
					$D(
						decodeBase64(encoded_portion).replace(
							/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~\n]*/g,
							"",
						),
					);
				else $D(c_index);

				// const ret = $fs.maddy.tmp({ key: args.key, str: c_index });
				// if (!ret.returnArray.length) $D(c_index);
				// else $D(ret.returnArray[0].s);
			}
		}
		return;
	}

	const startPin =
		args.c && typeof args.c === "number"
			? args.c
			: (($db.f({ _id: `t3_pin_brute_${priv.name}_${username}` }).first()
					?.pin as number) ?? 0);

	const timings: number[] = [];
	// do pin brute force
	for (let pin = startPin; pin < 9999; pin++) {
		if (_END - Date.now() < 1500) {
			$db.us(
				{ _id: `t3_pin_brute_${priv.name}_${username}` },
				{ $set: { pin } },
			);
			return (
				// biome-ignore lint/style/useTemplate: <explanation>
				`maddy.t3_pin_brute { s: #s.${priv.name}, u: "${username}", c: ${pin} }\n\n` +
				"timing:\n" +
				`first call - ${timings[0]}ms\n` +
				`rest - ${Math.round(timings.slice(1).reduce((prev, curr) => prev + curr) / (timings.length - 1))}ms\n` +
				`ran ${timings.length - 1} times`
			);
		}

		const start = Date.now();
		const ret = $fs.maddy.read({
			s: priv,
			a: { username, pin: String(pin).padStart(4, "0") },
		});
		timings.push(Date.now() - start);

		if (ret.includes("incorrect")) continue;
		// const ret = priv.call({ username, pin: String(pin).padStart(4) }) as string;

		// if (ret.split("\n").length === 4) continue;

		return {
			ok: false,
			msg: `${priv.name} { username: "${username}", pin: "${String(pin).padStart(4, "0")}" }`,
		};
	}
}
