import { removeColour } from "/lib/colour";
import { isRecord } from "/lib/isRecord";

export default function (context: Context, args?: unknown) {
	if (!args || !isRecord(args)) return;

	if ("backup" in args && args.backup) {
		const backup = args.backup;
		const pin = args.pin;

		if (!args.confirm)
			return "this will check all entries in the backup server which may have malicious payloads. confirm: true";

		const root: string = $fs.maddy.read({ s: backup, a: { pin } });

		const items = root.matchAll(/(\d*)?> (.*?)$/gm);

		let key: string | undefined = undefined;
		const outputs: string[] = [];
		for (let i = 0; i < 20; i++) {
			const out = $fs.maddy.read({ s: backup, a: { pin, i } });
			if (out.includes("record not found")) continue;
			if (out.includes("key")) key = out.split("\n").slice(-1)[0];

			outputs.push(out);
		}

		if (!key) return outputs;

		return `${outputs.map((x) => JSON.stringify(decode(key, x.split("\n").slice(4).join("\n")) ?? `failed to decode: \n${x}`)).join("\n\n")}\n\nkey: ${key}`;
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

				const ret = args.key ? decode(args.key as string, c_index) : undefined;
				if (!ret) $D(testString(c_index));
				else $D(ret);

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

const BASE64 =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const ILLEGAL_REGEX =
	/[ÀºÍª¨õÚßúÊ¶çì¹Ù½ÄÞÂÓã¡äæáÒ»­¿ÇÌóø¤©£þïÝàÛù¢¸âåÅðË§¯Ôè³òü¥Ü²ë÷×ÿÁÃ·û¬ÕÏØýÑñé®µÐîêö°Öí¾Æ´«Î¼ô]/g;

const KEY_VARIATIONS = [
	"0", //only the first char of the key
	"0246135", // skipNKey, shift:1 addmode:true, skips every 2nd
	"0123456601234556012344560123345601223456011234560", //rotateKey shift:1, repeats every 6th keychar
	"0123456123456023456013456012456012356012346012345", //skips every 8th
	"01234456011234556012234566012334560", //repeats every 5th
	"012456123560234601345", //skips every 7th
	"012234456601123345560", //repeats every 2nd
	"01234601235601245601345602345612345", //skipNKey, shift:1, skips every 6th
];

function decode_base64(s: string) {
	var e = {},
		i,
		b = 0,
		c,
		x,
		l = 0,
		a,
		r = "",
		w = String.fromCharCode,
		L = s.length,
		A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

	for (i = 0; i < 64; i++) {
		e[A.charAt(i)] = i;
	}

	for (x = 0; x < L; x++) {
		c = e[s.charAt(x)];
		b = (b << 6) + c;
		l += 6;

		while (l >= 8) {
			((a = (b >>> (l -= 8)) & 0xff) || x < L - 2) && (r += w(a));
		}
	}

	return r;
}

const testString = (str: string) => {
	if ((str.match(/\+/g) || []).length / str.length > 0.1)
		return { type: "plain", str };
	if (str.match(/\/{6,}/)) return { type: "img", str };

	const decoded = decode_base64(str);

	const illegal = decoded.match(ILLEGAL_REGEX)?.length ?? 0;
	const weird = decoded.match(/[^\w\d-+_/?\[\](){}|\\<>]/g)?.length ?? 0;

	if (decoded.includes("invitees") || decoded.match(/\w{4,}.? \w{4,}/))
		return { type: "b64", str: decoded };

	if (decoded.match(/\/{6,}/)) return { type: "b64img", str };
};

const decode = (_key: string, _input: string) => {
	const key = _key.split("").map((x) => BASE64.indexOf(x));
	const input = _input.split("").map((x) => BASE64.indexOf(x));

	for (const variation of KEY_VARIATIONS) {
		const decoded: number[] = [];
		const encoded: number[] = [];
		let i = -1;
		for (const char of input) {
			decoded.push(
				(char -
					key[Number.parseInt(variation.charAt(++i % variation.length))] +
					BASE64.length) %
					BASE64.length,
			);

			encoded.push(
				char + key[Number.parseInt(variation.charAt(i % variation.length))],
			) % BASE64.length;
		}

		const decoded_str = decoded.map((x) => BASE64[x]).join("");
		const encoded_str = encoded.map((x) => BASE64[x]).join("");

		const tested = testString(decoded_str) ?? testString(encoded_str);
		if (tested) return tested;
	}
};
