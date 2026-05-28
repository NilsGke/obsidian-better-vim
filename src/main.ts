import { MarkdownView, Plugin } from "obsidian";
import { patches, newPatchesMap as patchesMap } from "./patches";
import { DEFAULT_SETTINGS, Settings, SettingsTab } from "./settings";
import { typeSafeObjectEntries } from "./util";
import { overrideYank } from "./yankEvent";
import { markViewPlugin } from "./markViewPlugin";
import { EditorView } from "@codemirror/view";

export default class BetterVimPlugin extends Plugin {
    private patched = false;
    settings: Settings;
    vim = window.CodeMirrorAdapter.Vim;

    private get activeView() {
        return this.app.workspace.getActiveViewOfType(MarkdownView);
    }

    /**
     * Returns the CodeMirror instance of the active editor view.
     * @returns an object of type `EditorView` or `undefined`.
     */
    get activeEditorView(): EditorView | null {
        if (this.activeView === null) return null;

        const view = this.activeView.leaf.view as {
            editor?: { cm: EditorView };
        };
        if (!view.editor) return null;

        return view.editor.cm;
    }
    async onload() {
        this.registerEditorExtension([markViewPlugin]);

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
            if (enabled)
                patchesMap[patchName].patch({
                    vim,
                    plugin: this,
                    getSetting: (settingKey) => this.settings[key][settingKey],
                });
        });

        overrideYank(this.vim, this);

        this.patched = true;
    }

    onunload(): void {
        const vim = window.CodeMirrorAdapter?.Vim;
        if (!vim) return;

        patches.forEach((patch) => patch.unpatch({ vim, plugin: this }));
    }

    async loadSettings() {
        const base = structuredClone(DEFAULT_SETTINGS) as Settings;

        const loaded = await this.loadData();

        if (!loaded || typeof loaded !== "object" || Array.isArray(loaded)) {
            this.settings = base;
            return;
        }

        const data = loaded as Record<string, unknown>;

        for (const [key, value] of typeSafeObjectEntries(data)) {
            if (!(key in patchesMap)) continue;
            if (!value || typeof value !== "object" || Array.isArray(value))
                continue;

            const k = key as keyof typeof patchesMap;

            Object.assign(base[k], value);
        }

        this.settings = base;
        await this.saveSettings();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    addSettingsUI() {
        this.addSettingTab(new SettingsTab(this.app, this, this.vim));
    }
}
