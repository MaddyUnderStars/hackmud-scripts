export const removeColour = (text: string) => {
    if (!text) return text;
	return text.replaceAll(/\`[0-9a-zA-Z](.*?)\`/g, (s, ...args) => {
		return args[0];
	});
};