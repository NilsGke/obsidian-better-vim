import { Patch as PatchType } from "src/types";
import listNewLinePatch, { listNewLine } from "./listNewLine";
import syncSystemClipboardPatch, {
    syncSystemClipboard,
} from "./syncSystemClipboard";
import yankHighlightPatch, { yankHighlight } from "./yankHighlight";
import visualLineMotionsPatch, { visualLineMotions } from "./visualLineMotions";
import { Patch } from "./patch";

// export const patchesMap = {
//     "list-new-line": listNewLine,
//     "sync-system-clipboard": syncSystemClipboard,
//     "yank-highlight": yankHighlight,
//     "visual-line-motions": visualLineMotions,
// } as const satisfies Record<string, PatchType>;

export const newPatchesMap = {
    "list-new-line": listNewLinePatch,
    "sync-system-clipboard": syncSystemClipboardPatch,
    "yank-highlight": yankHighlightPatch,
    "visual-line-motions": visualLineMotionsPatch,
} as const satisfies Record<string, Patch<any>>;

export const patches = Object.values(newPatchesMap) satisfies Patch<any>[];

type ExtractSubSettings<T> = T extends Patch<infer S> ? S : never;

type FlattenedSubSettings<T extends Record<string, Patch<any>>> = {
    [P in keyof T]: {
        [K in keyof ExtractSubSettings<
            T[P]
        > as `${P & string}.${K & string}`]: ExtractSubSettings<T[P]>[K];
    };
}[keyof T];

export type UnionToIntersection<U> = (
    U extends any ? (x: U) => void : never
) extends (x: infer I) => void
    ? I
    : never;

type FlattenedSubSettingsObject<T extends Record<string, Patch<any>>> =
    UnionToIntersection<FlattenedSubSettings<T>>;

export type SubSettings = FlattenedSubSettingsObject<typeof newPatchesMap>;
