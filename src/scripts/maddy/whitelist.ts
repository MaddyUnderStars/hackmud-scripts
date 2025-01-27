export default (context: Context) => {
    const allowed = [
        "maddy",
        "ira",
        "katsu",
        "verdance",
        "squizzy",
        "uzuri",
        "oscilio"
    ]

    if (!allowed.includes(context.caller)) {
        $ms.squizzy.xfer();
        throw new Error("unauthorized");
    }

    return { ok: true }
}