export const typeSafeObjectEntries = <T extends Record<PropertyKey, unknown>>(
    obj: T,
) => {
    return Object.entries(obj) as keyof T extends never
        ? []
        : { [K in keyof T]: [K, T[K]] }[keyof T][];
};
