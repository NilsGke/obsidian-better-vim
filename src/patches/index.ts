import { Patch } from "src/types";
import { listNewLine } from "./listNewLine";
import { syncSystemClipboard } from "./syncSystemClipboard";
import { yankHighlight } from "./yankHighlight";
import { visualLineMotions } from "./visualLineMotions";

export const patchesMap = {
    "list-new-line": listNewLine,
    "sync-system-clipboard": syncSystemClipboard,
    "yank-highlight": yankHighlight,
    "visual-line-motions": visualLineMotions,
} as const satisfies Record<string, Patch>;

export const patches = Object.values(patchesMap) satisfies Patch[];
