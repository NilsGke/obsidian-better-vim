import BetterVimPlugin from "./main";
import { Vim } from "./vimTypes";

export type Patch = {
    description: string;
    patch: (vim: Vim, plugin: BetterVimPlugin) => void;
    unpatch: (vim: Vim, plugin: BetterVimPlugin) => void;
};
