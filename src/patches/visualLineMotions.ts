import { Patch } from "src/types";
import { Vim } from "src/vimTypes";
import { createPatch } from "./patch";

const CONTEXTS = ["normal", "visual", "operator"] as const;
const NORMAL_CONTEXT = "normal" as const;

function patchVisualLineMotions({ vim }: { vim: Vim }) {
    CONTEXTS.forEach((context) => {
        vim.noremap("j", "gj", context);
        vim.noremap("k", "gk", context);
        vim.noremap("0", "g0", context);
        vim.noremap("$", "g$", context);
        vim.noremap("_", "g_", context);
    });

    vim.noremap("A", "g$a", NORMAL_CONTEXT);
    vim.noremap("I", "g0i", NORMAL_CONTEXT);
    vim.noremap("V", "g0vg$", NORMAL_CONTEXT);
}

function unpatchVisualLineMotions({ vim }: { vim: Vim }) {
    CONTEXTS.forEach((context) => {
        vim.unmap("j", context);
        vim.unmap("k", context);
        vim.unmap("0", context);
        vim.unmap("$", context);
        vim.unmap("_", context);
    });

    vim.unmap("A", NORMAL_CONTEXT);
    vim.unmap("I", NORMAL_CONTEXT);
    vim.unmap("V", NORMAL_CONTEXT);
}

export const visualLineMotions = {
    description: "use visual-line motions (j/k/0/$/_/A/I/V) on wrapped lines",
    defaultEnabled: false,
    patch: (vim) => patchVisualLineMotions({ vim }),
    unpatch: (vim) => unpatchVisualLineMotions({ vim }),
} as const satisfies Patch;

export default createPatch({
    defaultSettings: {
        __patch: {
            name: "Visual line navigation",
            description:
                "use visual-line motions (j/k/0/$/_/A/I/V) on wrapped lines",
            defaultValue: true,
        },

        jk: {
            name: "j, k",
            description: "j and k go up and down one visual line",
            defaultValue: true,
        },
        "0$": {
            name: "0, $",
            description: "0 and $ jump to start and end of visual line",
            defaultValue: true,
        },
        _: {
            name: "_",
            description:
                "_ goes to the first non whitespace character of the visual line",
            defaultValue: true,
        },
        "I-A": {
            name: "I, A",
            description: "I and A go to insert mode but in the visual line",
            defaultValue: true,
        },
        V: {
            name: "V",
            description:
                "V selects only the visual line not the entire paragraph",
            defaultValue: true,
        },
    },

    patch: ({ vim, getSetting: getSubSetting }) => {
        CONTEXTS.forEach((context) => {
            if (getSubSetting("jk")) {
                vim.noremap("j", "gj", context);
                vim.noremap("k", "gk", context);
            }
            if (getSubSetting("0$")) {
                vim.noremap("0", "g0", context);
                vim.noremap("$", "g$", context);
            }
            if (getSubSetting("_")) {
                vim.noremap("_", "g_", context);
            }
        });

        if (getSubSetting("I-A")) {
            vim.noremap("A", "g$a", NORMAL_CONTEXT);
            vim.noremap("I", "g0i", NORMAL_CONTEXT);
        }
        if (getSubSetting("V")) vim.noremap("V", "g0vg$", NORMAL_CONTEXT);
    },
    unpatch: unpatchVisualLineMotions,
});
