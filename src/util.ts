export const typeSafeObjectEntries = <T extends Record<PropertyKey, unknown>>(
    obj: T,
): { [K in keyof T]: [K, T[K]] }[keyof T][] => {
    return Object.entries(obj) as { [K in keyof T]: [K, T[K]] }[keyof T][];
};
