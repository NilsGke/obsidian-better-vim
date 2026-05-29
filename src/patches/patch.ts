import BetterVimPlugin from "src/main";
import { Vim } from "src/vimTypes";

export type SettingValue = string | number | boolean;

export type PatchSetting = {
    name: string;
    description?: string;
    defaultValue: SettingValue;
};

// Widen literal defaults (e.g. true -> boolean) so consumers don't get stuck with literals.
type WidenLiteral<T> = T extends boolean
    ? boolean
    : T extends string
      ? string
      : T extends number
        ? number
        : T;

// Resolve the setting value type for a specific key, with "__patch" always boolean.
export type SettingValueFor<
    SettingsMap extends SettingsMapType,
    Key extends keyof SettingsMap,
> = Key extends "__patch"
    ? boolean
    : WidenLiteral<SettingsMap[Key]["defaultValue"]>;

export type SettingsMapType = Record<string, PatchSetting>;

/** Build a strongly-typed getter for patch settings to avoid repeating casts at each call site. */
export const createGetSetting = <SettingsMap extends SettingsMapType>(
    _defaults: SettingsMap,
    settings: { [Key in keyof SettingsMap]: SettingValue },
) => {
    return <Key extends keyof SettingsMap>(
        key: Key,
    ): SettingValueFor<SettingsMap, Key> =>
        settings[key] as SettingValueFor<SettingsMap, Key>;
};

export class Patch<SettingsMap extends SettingsMapType> {
    constructor(
        public readonly defaultSettings: SettingsMap,
        public patch: (params: {
            vim: Vim;
            plugin: BetterVimPlugin;
            getSetting: <Key extends keyof SettingsMap>(
                key: Key,
            ) => SettingValueFor<SettingsMap, Key>;
        }) => void,
        public unpatch: (params: { vim: Vim; plugin: BetterVimPlugin }) => void,
    ) {}
}

export const createPatch = <SettingsMap extends SettingsMapType>(options: {
    defaultSettings: SettingsMap;
    patch: (params: {
        vim: Vim;
        plugin: BetterVimPlugin;
        getSetting: <Key extends keyof SettingsMap>(
            key: Key,
        ) => SettingValueFor<SettingsMap, Key>;
    }) => void;
    unpatch: (params: { vim: Vim; plugin: BetterVimPlugin }) => void;
}) =>
    new Patch<SettingsMap>(
        options.defaultSettings,
        options.patch,
        options.unpatch,
    );
