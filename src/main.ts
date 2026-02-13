import { Plugin } from "obsidian";
import { patchListNewLine } from "./patches/listNewLine";

export default class VimYankHighlightPlugin extends Plugin {
    initialized = false;

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
        const vim = window.CodeMirrorAdapter?.Vim;
        if (!vim) {
            console.error("vim is not avalible (vim mode probably disabled)");
            return;
        }

        patchListNewLine(vim);
    }
}
