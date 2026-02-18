import { App, PluginSettingTab, Setting } from "obsidian";
import { patchesMap } from "./patches";
import ExamplePlugin from "./main";
import { typeSafeObjectEntries } from "./util";
import { Vim } from "./vimTypes";

export type Settings = Record<keyof typeof patchesMap, boolean>;

export const DEFAULT_SETTINGS = Object.fromEntries(
    Object.keys(patchesMap).map((name: keyof typeof patchesMap) => [
        name satisfies keyof Settings,
        true,
    ]),
) as Settings;

export class SettingsTab extends PluginSettingTab {
    plugin: ExamplePlugin;
    #vim: Vim;

    constructor(app: App, plugin: ExamplePlugin, vim: Vim) {
        super(app, plugin);
        this.plugin = plugin;
        this.#vim = vim;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        typeSafeObjectEntries(this.plugin.settings)
            .filter(([key]) => key in patchesMap)
            .forEach(([key, value]: [keyof typeof patchesMap, boolean]) =>
                new Setting(containerEl)
                    .setName(key.replaceAll("-", " "))
                    .setDesc(patchesMap[key].description)
                    .addToggle((toggle) =>
                        toggle.setValue(value).onChange(async (value) => {
                            if (value) patchesMap[key].patch(this.#vim);
                            else patchesMap[key].unpatch(this.#vim);

                            this.plugin.settings[key] = value;
                            await this.plugin.saveSettings();
                        }),
                    ),
            );
    }
}
