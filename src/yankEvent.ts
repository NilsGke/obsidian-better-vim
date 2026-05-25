import BetterVimPlugin from "./main";
import { Vim, VimRegisterController } from "./vimTypes";

let originalPushText: VimRegisterController["pushText"] | null = null;

export const yankEventTarget = new EventTarget();
export type YankEventDetail = {
    registerName: string;
    operator: string;
    text: string;
    linewise: boolean;
    blockwise: boolean;
    vim: Vim;
    plugin: BetterVimPlugin;
};

/** overrides vims yank to intercept it for patches   */
export function overrideYank(vim: Vim, plugin: BetterVimPlugin) {
    const registerController = vim.getRegisterController();
    if (originalPushText === null)
        originalPushText = registerController.pushText.bind(
            registerController,
        ) as typeof registerController.pushText;

    registerController.pushText = function (
        registerName,
        operator,
        text,
        linewise,
        blockwise,
    ) {
        if (originalPushText)
            originalPushText.apply(this, [
                registerName,
                operator,
                text,
                linewise,
                blockwise,
            ]);

        const event = new CustomEvent<YankEventDetail>("yank", {
            detail: {
                registerName,
                operator,
                text,
                linewise,
                blockwise,
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
