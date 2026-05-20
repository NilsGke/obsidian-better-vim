import { Patch } from "src/types";
import { listNewLine } from "./listNewLine";
import { syncSystemClipboard } from "./syncSystemClipboard";
import { yankHighlight } from "./yankHighlight";

export const patchesMap = {
    "list-new-line": listNewLine,
    "sync-system-clipboard": syncSystemClipboard,
    "yank-highlight": yankHighlight,
} as const satisfies Record<string, Patch>;

export const patches = Object.values(patchesMap) satisfies Patch[];
