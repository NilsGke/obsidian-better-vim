import { Patch } from "src/types";
import { Vim, VimActionArgs, VimCodeMirrorAdapter } from "src/vimTypes";

function patchListNewLine(vim: Vim) {
    const insertLine = (
        codeMirrorAdapter: VimCodeMirrorAdapter,
        actionArgs: VimActionArgs,
        direction: "below" | "above",
    ) => {
        const view = codeMirrorAdapter.cm6;
        if (!view) return;

        const state = view.state;
        const sel = state.selection.main;
        const pos = sel.head;
        const line = state.doc.lineAt(pos);
        const lineText = line.text;

        const bulletMatch = lineText.match(/^(\s*)([-*+])\s+/);
        const numberMatch = lineText.match(/^(\s*)(\d+)([.)])\s+/);

        const indent = bulletMatch?.[1] ?? numberMatch?.[1] ?? "";

        let insertPos: number;
        if (direction === "below") {
            insertPos = line.to;
        } else {
            insertPos = line.from;
        }

        const repeat = actionArgs.repeat ?? 1;

        let insertText = "";
        if (numberMatch) {
            const num = parseInt(numberMatch[2]);
            const delim = numberMatch[3];
            for (let i = 0; i < repeat; i++)
                if (direction === "below") {
                    insertText += `\n${indent}${num + 1 + i}${delim} `;
                } else {
                    insertText += `${indent}${Math.max(1, num - 1)}${delim} \n`;
                }
        } else {
            // handles bulletMatch or no match

            const bullet = bulletMatch?.[2] ?? "";
            const prefix = `${indent}${bullet} `;

            if (direction === "below") {
                insertText = `\n${prefix} `.repeat(repeat);
            } else {
                insertText = `${prefix} \n`.repeat(repeat);
            }
        }

        view.dispatch({
            changes: {
                from: insertPos,
                to: insertPos,
                insert: insertText,
            },
            selection: {
                anchor:
                    direction === "below"
                        ? insertPos + insertText.split("\n")[1]!.length
                        : insertPos + insertText.split("\n")[0]!.length,
            },
        });

        vim.enterInsertMode(codeMirrorAdapter);
    };

    // define new vim actions
    vim.defineAction("obsidianSmartOpenLineBelow", (cm, args) =>
        insertLine(cm, args, "below"),
    );
    vim.defineAction("obsidianSmartOpenLineAbove", (cm, args) =>
        insertLine(cm, args, "above"),
    );

    // map new vim actions
    vim.mapCommand(
        "o",
        "action",
        "obsidianSmartOpenLineBelow",
        {},
        { context: "normal" },
    );

    vim.mapCommand(
        "O",
        "action",
        "obsidianSmartOpenLineAbove",
        {},
        { context: "normal" },
    );
}

function unpatchListNewLine(vim: Vim) {
    vim.unmap("o", "normal");
    vim.unmap("O", "normal");
}

export const listNewLine: Patch = {
    patch: patchListNewLine,
    unpatch: unpatchListNewLine,
};
