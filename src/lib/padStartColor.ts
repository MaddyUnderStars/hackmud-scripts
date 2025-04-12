import { removeColour } from "./colour.js";

// String.padStart with support for colour codes
export const padStart = (str: string, length: number, pad: string) => {
    let ret = str;
    while (removeColour(ret).length < length) {
        ret = pad + ret;
    }
    return ret;
}