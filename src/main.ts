import { Plugin } from "obsidian";
import { patches, patchesMap } from "./patches";
import { DEFAULT_SETTINGS, Settings, SettingsTab } from "./settings";
import { typeSafeObjectEntries } from "./util";

export default class VimYankHighlightPlugin extends Plugin {
    private patched = false;
    // extend to generic string boolean pair because old settings might exist
    settings: Settings & { [key: string]: boolean };
    vim = window.CodeMirrorAdapter.Vim;

    async onload() {
        await this.loadSettings();
        this.addSettingsUI();

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

        typeSafeObjectEntries(this.settings).forEach(([key, enabled]) => {
            if (!(key in patchesMap)) return;
            const patchName = key as keyof typeof patchesMap;
            if (enabled) patchesMap[patchName].patch(vim);
        });

        this.patched = true;
    }

    onunload(): void {
        const vim = window.CodeMirrorAdapter?.Vim;
        if (!vim) return;

        patches.forEach(({ unpatch }) => unpatch(vim));
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    addSettingsUI() {
        this.addSettingTab(new SettingsTab(this.app, this, this.vim));
    }
}
