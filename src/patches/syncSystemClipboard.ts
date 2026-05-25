import { Patch } from "src/types";
import {
    addYankEventListener,
    removeYankEventListener,
    YankEventDetail,
} from "src/yankEvent";
import { Vim, VimRegister } from "src/vimTypes";
import { readClipboardTextSync, writeClipboardText } from "src/clipboard";

const yankHandler = ({
    detail: { text, linewise },
}: CustomEvent<YankEventDetail>) => {
    if (!text) return;
    const normalizedText =
        linewise && !text.endsWith("\n") ? `${text}\n` : text;
    writeClipboardText(normalizedText);
};

class ClipboardRegister implements VimRegister {
    linewise = false;
    blockwise = false;
    #text = "";

    setText(text: string, linewise?: boolean, blockwise?: boolean) {
        const nextText = text ?? "";
        this.#text = nextText;
        this.linewise = !!linewise;
        this.blockwise = !!blockwise;
        writeClipboardText(nextText);
    }

    pushText(text: string, linewise?: boolean) {
        const current = this.toString();
        let nextText = current;
        let nextLinewise = this.linewise;

        if (linewise) {
            if (
                !nextLinewise &&
                nextText.length > 0 &&
                !nextText.endsWith("\n")
            ) {
                nextText += "\n";
            }
            nextLinewise = true;
        }

        nextText += text;
        this.setText(nextText, nextLinewise, this.blockwise);
    }

    clear() {
        this.#text = "";
        this.linewise = false;
        this.blockwise = false;
    }

    toString() {
        const clipboardText = readClipboardTextSync();
        if (clipboardText !== null && clipboardText !== this.#text) {
            this.#text = clipboardText;
            this.linewise = false;
            this.blockwise = false;
        }

        return this.#text;
    }
}

let originalPlusRegister: VimRegister | undefined;
let originalQuoteRegister: VimRegister | undefined;
let originalUnnamedRegister: VimRegister | undefined;
let registersPatched = false;
let yankListenerAttached = false;

function patch(vim: Vim) {
    if (!yankListenerAttached) {
        addYankEventListener(yankHandler);
        yankListenerAttached = true;
    }

    if (registersPatched) return;
    const registerController = vim.getRegisterController();
    if (!registerController.registers) {
        console.error(
            "Vim clipboard sync failed: register controller unavailable.",
        );
        return;
    }

    const clipboardRegister = new ClipboardRegister();
    originalPlusRegister = registerController.registers["+"] ?? undefined;
    originalQuoteRegister = registerController.registers['"'] ?? undefined;
    originalUnnamedRegister = registerController.unnamedRegister ?? undefined;

    registerController.registers["+"] = clipboardRegister;
    registerController.registers['"'] = clipboardRegister;
    if ("unnamedRegister" in registerController)
        registerController.unnamedRegister = clipboardRegister;

    registersPatched = true;
}

function unpatch(vim: Vim) {
    if (yankListenerAttached) {
        removeYankEventListener(yankHandler);
        yankListenerAttached = false;
    }

    if (!registersPatched) return;
    const registerController = vim.getRegisterController();
    if (!registerController.registers) {
        console.error(
            "Vim clipboard sync failed: register controller unavailable.",
        );
        registersPatched = false;
        return;
    }

    if (originalPlusRegister) {
        registerController.registers["+"] = originalPlusRegister;
    }
    if (originalQuoteRegister) {
        registerController.registers['"'] = originalQuoteRegister;
    }
    if ("unnamedRegister" in registerController && originalUnnamedRegister) {
        registerController.unnamedRegister = originalUnnamedRegister;
    }

    originalPlusRegister = undefined;
    originalQuoteRegister = undefined;
    originalUnnamedRegister = undefined;
    registersPatched = false;
}

export const syncSystemClipboard = {
    description: "syncs yank/paste with the system clipboard",
    patch,
    unpatch,
} as const satisfies Patch;
