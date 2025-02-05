export const readableMs = (ms: number) => {
	let s = Math.floor(Math.abs(ms) / 1000);
	let m = Math.floor(s / 60);
	s = s % 60;
	let h = Math.floor(m / 60);
	m = m % 60;
	const d = Math.floor(h / 24);
	h = h % 24;

	let ret = "";
	if (d) ret += `${d}\`Dd\` `;
	if (h) ret += `${h}\`5h\` `;
	if (m) ret += `${m}\`4m\` `;
	if (s) ret += `${s}\`Ls\``;

	return ret;
};
