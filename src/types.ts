import { Vim } from "./vimTypes";

export type Patch = {
    patch: (vim: Vim) => void;
    unpatch: (vim: Vim) => void;
};
