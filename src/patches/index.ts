import { Patch } from "src/types";
import { listNewLine } from "./listNewLine";
import { yankToClipboard } from "./yankToClipboard";
import { yankHighlight } from "./yankHighlight";

export const patchesMap = {
    "list-new-line": listNewLine,
    "yank-to-clipboard": yankToClipboard,
    "yank-highlight": yankHighlight,
} as const satisfies Record<string, Patch>;

export const patches = Object.values(patchesMap) satisfies Patch[];
