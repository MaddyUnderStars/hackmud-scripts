// , "katsu", "verdance"
// missing due to being throw away / cron users
const users = ["maddy", "ira", "squizzy"];

export const throwWhitelist = (caller: string) => {
    if (!users.includes(caller)) throw "unauthorised"
}