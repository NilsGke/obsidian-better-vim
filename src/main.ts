import { Plugin } from "obsidian";
import type { Vim, VimActionArgs, VimCodeMirrorAdapter } from "./types";

export default class VimYankHighlightPlugin extends Plugin {
    initialized = false;
    vim: Vim;

    async onload() {
        if (this.initialized) return;

        this.registerEvent(
            this.app.workspace.on("active-leaf-change", () =>
                this.initialize(),
            ),
        );

        this.initialized = true;
    }

    private initialize() {
        this.vim = window.CodeMirrorAdapter?.Vim;
        if (!this.vim) {
            console.error("vim is not avalible (vim mode probably disabled)");
            return;
        }

        this.patchOpenLine();
    }

    private patchOpenLine() {
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
            const indent = bulletMatch?.[1] ?? "";
            const bullet = bulletMatch?.[2] ?? "";

            let insertText = bullet ? `${indent}${bullet} ` : "";
            insertText =
                direction === "below" ? "\n" + insertText : insertText + "\n";

            let insertPos: number;
            if (direction === "below") insertPos = line.to;
            else insertPos = line.from;

            view.dispatch({
                changes: {
                    from: insertPos,
                    to: insertPos,
                    insert: insertText.repeat(actionArgs.repeat),
                },
                selection: {
                    anchor:
                        direction === "below"
                            ? insertPos + insertText.length
                            : insertPos + 1 + indent.length + bullet.length,
                },
            });

            this.vim.enterInsertMode(codeMirrorAdapter);
        };

        // define new vim actions
        this.vim.defineAction("obsidianSmartOpenLineBelow", (cm, args) =>
            insertLine(cm, args, "below"),
        );
        this.vim.defineAction("obsidianSmartOpenLineAbove", (cm, args) =>
            insertLine(cm, args, "above"),
        );

        // map new vim actions
        this.vim.mapCommand(
            "o",
            "action",
            "obsidianSmartOpenLineBelow",
            {},
            { context: "normal" },
        );

        this.vim.mapCommand(
            "O",
            "action",
            "obsidianSmartOpenLineAbove",
            {},
            { context: "normal" },
        );
    }
}
