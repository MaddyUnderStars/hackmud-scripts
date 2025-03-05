type ObjectIdDecoded = {
	timestamp: Date;
	counter: number;
	process_id: number;
	machine_id: string;
};

const fromHex = (hex: string): Uint8Array => {
	const buffer = [];
	for (let i = 0; i < hex.length; i += 2) {
		buffer.push(Number.parseInt(`${hex[i]}${hex[i + 1]}`, 16));
	}
	return Uint8Array.from(buffer);
};

export const decodeObjectId = (hex: string): ObjectIdDecoded => {
	const buffer = fromHex(hex);

	return {
		timestamp: new Date(
			((buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]) *
				1000,
		),
		machine_id: Array.from(buffer.slice(4, 7))
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join(""),
		process_id: (buffer[7] << 8) | buffer[8],
		counter: (buffer[9] << 16) | (buffer[10] << 8) | buffer[11],
	};
};
