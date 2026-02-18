import { Vim } from "./vimTypes";

export type Patch = {
    description: string;
    patch: (vim: Vim) => void;
    unpatch: (vim: Vim) => void;
};
