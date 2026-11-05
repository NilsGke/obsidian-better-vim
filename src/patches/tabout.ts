import { createPatch } from "./patch";
import { buildPairMaps, taboutConfig, taboutExtension } from "../tabout";

/**
 * Tab-out (inspired by https://github.com/abecodes/tabout.nvim).
 *
 *  Unlike some of the other patches this does not map vim keys. Actual key handling
 * lives in a CodeMirror keymap extension (`taboutExtension`) registered once in
 * `main.ts`; this patch only mirrors the settings into the shared
 * `taboutConfig` and toggles it on/off. `patch`/`unpatch` are driven by the
 * settings UI, so changing a sub-setting re-runs `patch` and refreshes config.
 */
export default createPatch({
    defaultSettings: {
        __patch: {
            name: "Tab out",
            description:
                "in insert mode, press Tab to jump past the next closing bracket/quote on the line (and Shift-Tab to jump back)",
            defaultValue: true,
        },
        shiftTab: {
            name: "Shift-Tab to tab back in",
            description:
                "Shift-Tab jumps left, before the previous opening bracket/quote",
            defaultValue: true,
        },
        closingChars: {
            name: "Closing characters",
            description: "characters Tab jumps past (searched to the right)",
            defaultValue: ")]}>\"'`",
        },
        openingChars: {
            name: "Opening characters",
            description:
                "characters Shift-Tab jumps before (searched to the left)",
            defaultValue: "([{<\"'`",
        },
        insertModeOnly: {
            name: "Insert mode only",
            description:
                "only tab out while in Vim insert mode (keeps normal-mode Tab indentation)",
            defaultValue: true,
        },
    },

    patch: ({ getSetting }) => {
        const newOpening = getSetting("openingChars");
        const newClosing = getSetting("closingChars");

        taboutConfig.shiftTab = getSetting("shiftTab");
        taboutConfig.opening = newOpening;
        taboutConfig.closing = newClosing;
        taboutConfig.insertModeOnly = getSetting("insertModeOnly");
        taboutConfig.enabled = true;
        taboutConfig._pairs = buildPairMaps(newOpening, newClosing);
    },

    unpatch: () => {
        taboutConfig.enabled = false;
    },

    extension: taboutExtension,
});
