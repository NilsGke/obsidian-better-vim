import { App, PluginSettingTab, Setting } from "obsidian";
import { patchesMap } from "./patches";
import ExamplePlugin from "./main";
import { typeSafeObjectEntries } from "./util";
import { Vim } from "./vimTypes";
import { setHighlightCSS } from "./patches/yankHighlight";

export type Settings = Record<keyof typeof patchesMap, boolean> & {
    yankHighlightDuration: number;
    yankHighlightFadeEnabled: boolean;
    yankHighlightFadeDuration: number;
};

export const DEFAULT_SETTINGS = {
    ...Object.fromEntries(
        typeSafeObjectEntries(patchesMap).map(
            ([name]) => [name, true] as const,
        ),
    ),
    yankHighlightDuration: 500,
    yankHighlightFadeEnabled: true,
    yankHighlightFadeDuration: 400,
} as Settings;

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
            .forEach(([key, value]: [keyof typeof patchesMap, boolean]) => {
                new Setting(containerEl)
                    .setName(key.replaceAll("-", " "))
                    .setDesc(patchesMap[key].description)
                    .addToggle((toggle) =>
                        toggle.setValue(value).onChange(async (value) => {
                            if (value)
                                patchesMap[key].patch(this.#vim, this.plugin);
                            else
                                patchesMap[key].unpatch(
                                    this.#vim,
                                    this.plugin,
                                );

                            this.plugin.settings[key] = value;
                            await this.plugin.saveSettings();
                            this.display();
                        }),
                    );

                if (key === "yank-highlight" && value) {
                    new Setting(containerEl)
                        .setName("Highlight duration (ms)")
                        .setDesc(
                            "How long the yank highlight stays visible before fading out",
                        )
                        .addText((text) =>
                            text
                                .setValue(
                                    String(
                                        this.plugin.settings
                                            .yankHighlightDuration,
                                    ),
                                )
                                .onChange(async (val) => {
                                    const num = parseInt(val, 10);
                                    if (isNaN(num) || num < 0) return;
                                    this.plugin.settings.yankHighlightDuration =
                                        num;
                                    await this.plugin.saveSettings();
                                    setHighlightCSS(this.plugin);
                                }),
                        );

                    new Setting(containerEl)
                        .setName("Fade animation")
                        .setDesc("Enable fade-out animation for the highlight")
                        .addToggle((toggle) =>
                            toggle
                                .setValue(
                                    this.plugin.settings
                                        .yankHighlightFadeEnabled,
                                )
                                .onChange(async (value) => {
                                    this.plugin.settings.yankHighlightFadeEnabled =
                                        value;
                                    await this.plugin.saveSettings();
                                    setHighlightCSS(this.plugin);
                                    this.display();
                                }),
                        );

                    if (this.plugin.settings.yankHighlightFadeEnabled) {
                        new Setting(containerEl)
                            .setName("Fade duration (ms)")
                            .setDesc(
                                "Duration of the fade-out animation",
                            )
                            .addText((text) =>
                                text
                                    .setValue(
                                        String(
                                            this.plugin.settings
                                                .yankHighlightFadeDuration,
                                        ),
                                    )
                                    .onChange(async (val) => {
                                        const num = parseInt(val, 10);
                                        if (isNaN(num) || num < 0)
                                            return;
                                        this.plugin.settings.yankHighlightFadeDuration =
                                            num;
                                        await this.plugin.saveSettings();
                                        setHighlightCSS(
                                            this.plugin,
                                        );
                                    }),
                            );
                    }
                }
            });
    }
}


