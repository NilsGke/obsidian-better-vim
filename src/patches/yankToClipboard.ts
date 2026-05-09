import {
    addYankEventListener,
    removeYankEventListener,
    YankEventDetail,
} from "src/yankEvent";
import { Patch } from "src/types";

const handler = ({ detail: { text } }: CustomEvent<YankEventDetail>) => {
    if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error("Vim clipboard sync failed:", err);
        });
    }
};

export const yankToClipboard = {
    description: "always yanks to system clipboard",
    patch: () => addYankEventListener(handler),
    unpatch: () => removeYankEventListener(handler),
} as const satisfies Patch;
