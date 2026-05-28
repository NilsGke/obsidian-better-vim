import { App, PluginSettingTab, Setting } from "obsidian";
import { newPatchesMap as patchesMap } from "./patches";
import ExamplePlugin from "./main";
import { typeSafeObjectEntries } from "./util";
import { Vim } from "./vimTypes";

type PatchMap = typeof patchesMap;

type SettingsOf<K extends keyof PatchMap> = PatchMap[K]["defaultSettings"];

type SettingValue<
    K extends keyof PatchMap,
    S extends keyof SettingsOf<K>,
> = SettingsOf<K>[S] extends { defaultValue: infer V } ? V : never; // we need this hack with `extends ...` because typescript cannot remember the union value two levels down

export type Settings = {
    -readonly [K in keyof PatchMap]: {
        [S in keyof SettingsOf<K>]: SettingValue<K, S>;
    };
};

type DeepReadonly<T> = {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
};

const _defaultSettings = {} as Settings;
export const DEFAULT_SETTINGS: DeepReadonly<typeof _defaultSettings> =
    _defaultSettings;

for (const _key in patchesMap) {
    const key = _key as keyof typeof patchesMap;
    const patch = patchesMap[key];

    const settings: any = {};

    for (const _settingKey in patch.defaultSettings) {
        // is not just "__patch" but every setting key. TS cannot infer this
        const settingKey = _settingKey as keyof typeof patch.defaultSettings;
        settings[settingKey] = patch.defaultSettings[settingKey].defaultValue;
    }

    _defaultSettings[key] = settings;
}

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
            .forEach(([key, settingValues]) => {
                const settings = patchesMap[key].defaultSettings;
                const { sub } = createSetting({
                    expandable: Object.keys(settings).length > 1,
                    value: settingValues.__patch,
                    container: containerEl,
                    name: settings.__patch.name,
                    desc:
                        "description" in settings.__patch
                            ? settings.__patch.description
                            : null,
                    onToggle: async (value) => {
                        if (value)
                            patchesMap[key].patch({
                                vim: this.#vim,
                                plugin: this.plugin,
                                getSetting: (settingKey) =>
                                    this.plugin.settings[key][settingKey],
                            });
                        else
                            patchesMap[key].unpatch({
                                vim: this.#vim,
                                plugin: this.plugin,
                            });

                        this.plugin.settings[key].__patch = value;
                        await this.plugin.saveSettings();
                    },
                });

                const repatch = () => {
                    patchesMap[key].unpatch({
                        vim: this.#vim,
                        plugin: this.plugin,
                    });
                    patchesMap[key].patch({
                        vim: this.#vim,
                        plugin: this.plugin,
                        getSetting: (settingKey) =>
                            this.plugin.settings[key][settingKey],
                    });
                };

                typeSafeObjectEntries(patchesMap[key].defaultSettings).forEach(
                    ([_settingKey, { defaultValue, name }]) => {
                        if (_settingKey === "__patch" || !sub) return;
                        const settingKey =
                            _settingKey as keyof (typeof patchesMap)[typeof key]["defaultSettings"];
                        const option = settings[settingKey];
                        const setting = new Setting(sub).setName(name);

                        if ("description" in option)
                            setting.setDesc(option.description);

                        setting.settingEl.style.backgroundColor = "#8881";

                        switch (typeof defaultValue) {
                            case "boolean":
                                setting.addToggle((toggle) =>
                                    toggle
                                        .setValue(
                                            this.plugin.settings[key][
                                                settingKey
                                            ],
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
                                            this.plugin.settings[key][
                                                settingKey
                                            ].toString() as unknown as string,
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
            });
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
            if (expandable) sub.style.display = v ? "block" : "none";
            onToggle(v);
        }),
    );
    if (!expandable) return { setting };

    const sub = setting.settingEl.createDiv();
    if (!value) sub.style.display = "none";
    sub.style.flex = "1 1 100%";
    setting.settingEl.style.flexWrap = "wrap";

    return { setting, sub };
}
