import { Plugin } from "obsidian";
import { Patch } from "./types";
import { listNewLine } from "./patches/listNewLine";

export default class VimYankHighlightPlugin extends Plugin {
    private patched = false;

    private patches: Patch[] = [listNewLine];

    onload() {
        this.registerEvent(
            this.app.workspace.on("active-leaf-change", () =>
                this.initialize(),
            ),
        );

        this.initialize();
    }

    private initialize() {
        if (this.patched) return;

        const vim = window.CodeMirrorAdapter?.Vim;
        if (!vim) {
            console.error(
                "better-vim cannot initialize! Vim is not avalible (vim mode probably disabled).",
            );
            return;
        }

        this.patches.forEach(({ patch }) => patch(vim));

        this.patched = true;
    }

    onunload(): void {
        const vim = window.CodeMirrorAdapter?.Vim;
        if (!vim) return;

        this.patches.forEach(({ unpatch }) => unpatch(vim));
    }
}
