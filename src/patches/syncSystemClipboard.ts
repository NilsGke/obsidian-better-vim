import { removeYankEventListener, YankEventDetail } from "src/yankEvent";
import { Vim, VimRegister } from "src/vimTypes";
import { readClipboardTextSync, writeClipboardText } from "src/clipboard";
import { createPatch } from "./patch";

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

function patch({ vim }: { vim: Vim }) {}

function unpatch({ vim }: { vim: Vim }) {
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

export default createPatch({
    defaultSettings: {
        __patch: {
            name: "Sync system clipboard",
            description: "syncs yank/paste with the system clipboard",
            defaultValue: true as boolean,
        },
        "yank-to-clipboard": {
            name: "Yank to clipboard",
            defaultValue: true,
        },
        "paste-from-clipboard": {
            name: "Paste from clipboard",
            defaultValue: true,
        },
    },
    patch: ({ vim, getSetting }) => {
        const registerController = vim.getRegisterController();

        if (!registerController.registers) {
            console.error(
                "Vim clipboard sync failed: register controller unavailable.",
            );
            return;
        }

        // Store originals once
        if (!registersPatched) {
            originalPlusRegister =
                registerController.registers["+"] ?? undefined;

            originalQuoteRegister =
                registerController.registers['"'] ?? undefined;

            originalUnnamedRegister =
                registerController.unnamedRegister ?? undefined;

            registersPatched = true;
        }

        const yankToClipboard = getSetting("yank-to-clipboard");
        const pasteFromClipboard = getSetting("paste-from-clipboard");

        const clipboardRegister = new ClipboardRegister();

        // + register controls explicit clipboard paste
        registerController.registers["+"] = pasteFromClipboard
            ? clipboardRegister
            : originalPlusRegister!;

        // unnamed register controls normal yank behavior
        registerController.registers['"'] = yankToClipboard
            ? clipboardRegister
            : originalQuoteRegister!;

        if ("unnamedRegister" in registerController) {
            registerController.unnamedRegister = yankToClipboard
                ? clipboardRegister
                : originalUnnamedRegister;
        }
    },
    unpatch: ({ vim }) => {
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
        if (
            "unnamedRegister" in registerController &&
            originalUnnamedRegister
        ) {
            registerController.unnamedRegister = originalUnnamedRegister;
        }

        originalPlusRegister = undefined;
        originalQuoteRegister = undefined;
        originalUnnamedRegister = undefined;
        registersPatched = false;
    },
});
