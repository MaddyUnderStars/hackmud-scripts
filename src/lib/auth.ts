// , "katsu", "verdance"
// missing due to being throw away / cron users
export const ALLOWED_USERS = ["maddy", "ira", "squizzy", "uzuri"];

export const throwWhitelist = (caller: string) => {
    if (!ALLOWED_USERS.includes(caller)) throw "unauthorised"
}