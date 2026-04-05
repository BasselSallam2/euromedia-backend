function makeRegExp(search: string, flags = "i", prefix = "") {
    return new RegExp(`${prefix}${search}`, flags);
}
export { makeRegExp };
