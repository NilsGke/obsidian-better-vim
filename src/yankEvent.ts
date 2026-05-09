import BetterVimPlugin from "./main";
import { Vim } from "./vimTypes";

let originalPushText: any = null;

export const yankEventTarget = new EventTarget();
export type YankEventDetail = {
    registerName: string;
    operator: string;
    text: string;
    isVisual: boolean;
    lines: string[];
    vim: Vim;
    plugin: BetterVimPlugin;
};

/** overrides vims yank to intercept it for patches   */
export function overrideYank(vim: Vim, plugin: BetterVimPlugin) {
    const registerController = vim.getRegisterController();
    if (originalPushText === null)
        originalPushText = registerController.pushText;

    registerController.pushText = function (
        registerName,
        operator,
        text,
        isVisual,
        lines,
    ) {
        originalPushText.apply(this, [
            registerName,
            operator,
            text,
            isVisual,
            lines,
        ]);

        const event = new CustomEvent<YankEventDetail>("yank", {
            detail: {
                registerName,
                operator,
                text,
                isVisual,
                lines,
                vim,
                plugin,
            },
        });
        yankEventTarget.dispatchEvent(event);
    };
}

export const addYankEventListener = (
    fn: (ev: CustomEvent<YankEventDetail>) => void,
) => yankEventTarget.addEventListener("yank", fn);

export const removeYankEventListener = (
    fn: (ev: CustomEvent<YankEventDetail>) => void,
) => yankEventTarget.removeEventListener("yank", fn);
