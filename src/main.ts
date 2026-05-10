import { MarkdownView, Plugin } from "obsidian";
import { patches, patchesMap } from "./patches";
import { DEFAULT_SETTINGS, Settings, SettingsTab } from "./settings";
import { typeSafeObjectEntries } from "./util";
import { overrideYank } from "./yankEvent";
import { markViewPlugin } from "./markViewPlugin";
import { EditorView } from "@codemirror/view";

export default class BetterVimPlugin extends Plugin {
    private patched = false;
    // extend to generic string boolean pair because old settings might exist
    settings: Settings & { [key: string]: boolean };
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
            if (enabled) patchesMap[patchName].patch(vim, this);
        });

        overrideYank(this.vim, this);

        this.patched = true;
    }

    onunload(): void {
        const vim = window.CodeMirrorAdapter?.Vim;
        if (!vim) return;

        patches.forEach(({ unpatch }) => unpatch(vim, this));
    }

    async loadSettings() {
        this.settings = { ...DEFAULT_SETTINGS };

        const loadedSettings = await (this.loadData() as Promise<unknown>);
        if (typeof loadedSettings !== "object") return;

        const loadedSettingsObject = loadedSettings as Record<string, unknown>;

        typeSafeObjectEntries(loadedSettingsObject).forEach(([key, value]) => {
            if (key in patchesMap && typeof value === "boolean")
                this.settings[key as keyof typeof patchesMap] = value;
        });
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    addSettingsUI() {
        this.addSettingTab(new SettingsTab(this.app, this, this.vim));
    }
}
