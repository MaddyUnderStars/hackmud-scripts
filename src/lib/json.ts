export const tryParseJson = (data: string) => {
    try {
        return JSON.parse(data);
    }
    catch (e) {
        return null;
    }
}