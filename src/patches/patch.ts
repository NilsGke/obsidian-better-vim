import BetterVimPlugin from "src/main";
import { Vim } from "src/vimTypes";

export type SubSettingValue = string | number | boolean;
export type PatchSetting = {
    name: string;
    description?: string;
    defaultValue: SubSettingValue;
};

export type SettingsMapType = { __patch: PatchSetting } & Record<
    string,
    PatchSetting
>;

export class Patch<SettingsMap extends SettingsMapType> {
    constructor(
        public readonly defaultSettings: SettingsMap,
        public patch: (params: {
            vim: Vim;
            plugin: BetterVimPlugin;
            getSetting: <Key extends keyof SettingsMap>(
                key: Key,
            ) => SettingsMap[typeof key]["defaultValue"];
        }) => void,
        public unpatch: (params: { vim: Vim; plugin: BetterVimPlugin }) => void,
    ) {}
}

export const createPatch = <SettingsMap extends SettingsMapType>(options: {
    defaultSettings: SettingsMap;
    patch: (params: {
        vim: Vim;
        plugin: BetterVimPlugin;
        getSetting: (
            key: keyof SettingsMap,
        ) => SettingsMap[typeof key]["defaultValue"];
    }) => void;
    unpatch: (params: { vim: Vim; plugin: BetterVimPlugin }) => void;
}) =>
    new Patch<SettingsMap>(
        options.defaultSettings,
        options.patch,
        options.unpatch,
    );
