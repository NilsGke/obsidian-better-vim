import { Patch } from "src/types";
import { listNewLine } from "./listNewLine";
import { yankToClipboard } from "./yankToClipboard";

export const patchesMap = {
    "list-new-line": listNewLine,
    "yank-to-clipboard": yankToClipboard,
} as const satisfies Record<string, Patch>;

export const patches = Object.values(patchesMap) satisfies Patch[];
