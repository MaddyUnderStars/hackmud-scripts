export const ALLOWED_USERS = ["maddy", "ira", "squizzy", "uzuri", "katsu", "verdance", "oscilio"];

export const throwWhitelist = (caller: string) => {
    if (!ALLOWED_USERS.includes(caller)) throw "unauthorised"
}