import { Patch } from "src/types";
import { listNewLine } from "./listNewLine";

export const patchesMap = {
    "list-new-line": listNewLine,
} as const satisfies Record<string, Patch>;

export const patches = Object.values(patchesMap) satisfies Patch[];
