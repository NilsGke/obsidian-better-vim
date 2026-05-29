import listNewLinePatch from "./listNewLine";
import syncSystemClipboardPatch from "./syncSystemClipboard";
import yankHighlightPatch from "./yankHighlight";
import visualLineMotionsPatch from "./visualLineMotions";
import { PatchSetting, Patch } from "./patch";

type MinimalPachType = Patch<{
    __patch: PatchSetting & { defaultValue: boolean };
}>;

export const patchesMap = {
    "list-new-line": listNewLinePatch,
    "sync-system-clipboard": syncSystemClipboardPatch,
    "yank-highlight": yankHighlightPatch,
    "visual-line-motions": visualLineMotionsPatch,
} as const satisfies Record<string, MinimalPachType>;

export const patches = Object.values(patchesMap) satisfies MinimalPachType[];

type ExtractSubSettings<T> = T extends Patch<infer S> ? S : never;

type FlattenedSubSettings<T extends Record<string, MinimalPachType>> = {
    [P in keyof T]: {
        [K in keyof ExtractSubSettings<
            T[P]
        > as `${P & string}.${K & string}`]: ExtractSubSettings<T[P]>[K];
    };
}[keyof T];

export type UnionToIntersection<U> = (
    U extends MinimalPachType["defaultSettings"] ? (x: U) => void : never
) extends (x: infer I) => void
    ? I
    : never;

type FlattenedSubSettingsObject<T extends Record<string, MinimalPachType>> =
    UnionToIntersection<FlattenedSubSettings<T>>;

export type SubSettings = FlattenedSubSettingsObject<typeof patchesMap>;
