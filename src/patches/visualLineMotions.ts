import { Patch } from "src/types";
import { Vim } from "src/vimTypes";

const CONTEXTS = ["normal", "visual", "operator"] as const;
const NORMAL_CONTEXT = "normal" as const;

function patchVisualLineMotions(vim: Vim) {
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

function unpatchVisualLineMotions(vim: Vim) {
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
    patch: patchVisualLineMotions,
    unpatch: unpatchVisualLineMotions,
} as const satisfies Patch;
