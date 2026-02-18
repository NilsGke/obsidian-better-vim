import { Patch } from "src/types";
import { Vim } from "src/vimTypes";

let originalPushText: any = null;

function patch(vim: Vim) {
    const registerController = vim.getRegisterController();
    if (originalPushText === null)
        originalPushText = registerController.pushText;

    registerController.pushText = function (
        registerName: string,
        operator: string,
        text: string,
        isVisual: boolean,
        lines: string[],
    ): void {
        originalPushText.apply(this, [
            registerName,
            operator,
            text,
            isVisual,
            lines,
        ]);

        if (navigator.clipboard && text) {
            navigator.clipboard.writeText(text).catch((err) => {
                console.error("Vim clipboard sync failed:", err);
            });
        }
    };
}

function unpatch(vim: Vim) {
    if (originalPushText === null) return;
    const registerController = vim.getRegisterController();
    registerController.pushText = originalPushText;
}

export const yankToClipboard = {
    description: "always yanks to system clipboard",
    patch,
    unpatch,
} as const satisfies Patch;
