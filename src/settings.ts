import { App, PluginSettingTab, Setting } from "obsidian";
import { patchesMap } from "./patches";
import { createGetSetting, SettingValueFor } from "./patches/patch";
import ExamplePlugin from "./main";
import { typeSafeObjectEntries } from "./util";
import { Vim } from "./vimTypes";

type PatchMap = typeof patchesMap;

// Pull a patch's default settings map from the registry.
type SettingsOf<K extends keyof PatchMap> = PatchMap[K]["defaultSettings"];

export type Settings = {
    -readonly [K in keyof PatchMap]: {
        [S in keyof SettingsOf<K>]: SettingValueFor<SettingsOf<K>, S>;
    };
};

type DeepReadonly<T> = {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
};

const _defaultSettings = {} as Settings;
export const DEFAULT_SETTINGS: DeepReadonly<typeof _defaultSettings> =
    _defaultSettings;

typeSafeObjectEntries(patchesMap).forEach(
    <K extends keyof PatchMap>([key, patch]: [K, PatchMap[K]]) => {
        const settings = {} as Settings[K];

        typeSafeObjectEntries(patch.defaultSettings).forEach(
            ([settingKey, setting]) =>
                (settings[settingKey] = setting.defaultValue),
        );

        _defaultSettings[key] = settings;
    },
);

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

        typeSafeObjectEntries(patchesMap).forEach(
            <K extends keyof PatchMap>([key, patch]: [K, PatchMap[K]]) => {
                const settingValues = this.plugin.settings[key];
                const settings = patch.defaultSettings;
                const { sub } = createSetting({
                    expandable: Object.keys(settings).length > 1,
                    value: settingValues.__patch,
                    container: containerEl,
                    name: settings.__patch.name,
                    desc:
                        "description" in settings.__patch
                            ? settings.__patch.description
                            : null,
                    onToggle: (value) => {
                        if (value)
                            patch.patch({
                                vim: this.#vim,
                                plugin: this.plugin,
                                getSetting: createGetSetting(
                                    patch.defaultSettings,
                                    this.plugin.settings[key],
                                ),
                            });
                        else
                            patch.unpatch({
                                vim: this.#vim,
                                plugin: this.plugin,
                            });

                        this.plugin.settings[key].__patch = value;
                        void this.plugin.saveSettings();
                    },
                });

                const repatch = () => {
                    patch.unpatch({
                        vim: this.#vim,
                        plugin: this.plugin,
                    });
                    patch.patch({
                        vim: this.#vim,
                        plugin: this.plugin,
                        getSetting: createGetSetting(
                            patch.defaultSettings,
                            this.plugin.settings[key],
                        ),
                    });
                };

                typeSafeObjectEntries(patch.defaultSettings).forEach(
                    ([_settingKey, { defaultValue, name }]) => {
                        if (_settingKey === "__patch" || !sub) return;
                        const settingKey = _settingKey as keyof typeof settings;
                        const option = settings[settingKey];
                        const setting = new Setting(sub).setName(name);

                        if ("description" in option)
                            setting.setDesc(option.description);

                        setting.settingEl.classList.add(
                            "better-vim-setting-subitem",
                        );

                        switch (typeof defaultValue) {
                            case "boolean":
                                setting.addToggle((toggle) =>
                                    toggle
                                        .setValue(
                                            Boolean(
                                                this.plugin.settings[key][
                                                    settingKey
                                                ],
                                            ),
                                        )
                                        .onChange(async (v) => {
                                            this.plugin.settings[key][
                                                settingKey
                                            ] = v;
                                            repatch();
                                            await this.plugin.saveSettings();
                                        }),
                                );
                                break;

                            case "string":
                                setting.addText((text) =>
                                    text
                                        .setValue(
                                            this.plugin.settings[key][
                                                settingKey
                                            ] as unknown as string,
                                        )
                                        .onChange(async (v) => {
                                            // @ts-ignore we cannot infer the correct type here
                                            this.plugin.settings[key][
                                                settingKey
                                            ] = v;
                                            repatch();
                                            await this.plugin.saveSettings();
                                        }),
                                );
                                break;
                            case "number":
                                setting.addText((text) =>
                                    text
                                        .setValue(
                                            String(
                                                this.plugin.settings[key][
                                                    settingKey
                                                ],
                                            ),
                                        )
                                        .onChange(async (v) => {
                                            const num = parseInt(v);
                                            if (isNaN(num)) return;
                                            // @ts-ignore we cannot infer the correct type here
                                            this.plugin.settings[key][
                                                settingKey
                                            ] = num;
                                            repatch();
                                            await this.plugin.saveSettings();
                                        }),
                                );
                                break;
                            default:
                                break;
                        }
                    },
                );
            },
        );
    }
}

function createSetting({
    expandable,
    value,
    container,
    name,
    desc,
    onToggle,
}: {
    expandable: boolean;
    value: boolean;
    container: HTMLElement;
    name: string;
    desc: string | null;
    onToggle: (enabled: boolean) => void;
}) {
    const setting = new Setting(container).setName(name);
    if (desc) setting.setDesc(desc);

    setting.addToggle((toggle) =>
        toggle.setValue(value).onChange((v) => {
            if (expandable)
                sub.classList.toggle("better-vim-setting-sub-hidden", !v);
            onToggle(v);
        }),
    );
    if (!expandable) return { setting };

    const sub = setting.settingEl.createDiv();
    sub.classList.add("better-vim-setting-sub");
    setting.settingEl.classList.add("better-vim-setting-expandable");
    if (!value) sub.classList.add("better-vim-setting-sub-hidden");

    return { setting, sub };
}
