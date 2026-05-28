import BetterVimPlugin from "./main";
import { Vim } from "./vimTypes";

export type Patch = {
    description: string;
    defaultEnabled: boolean;
    patch: (vim: Vim, plugin: BetterVimPlugin) => void;
    unpatch: (vim: Vim, plugin: BetterVimPlugin) => void;
};
