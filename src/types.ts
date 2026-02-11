import { EditorView } from "@codemirror/view";

declare global {
    interface Window {
        CodeMirrorAdapter: {
            Vim: Vim;
        };
    }
}

export interface VimCodeMirrorAdapter {
    cm6: EditorView;
}

export interface VimActionArgs {
    registerName: string | null;
    repeat: number;
    repeatIsExplicit: boolean;
    expectLiteralNext: boolean;
    [key: string]: any;
}

export interface VimState {
    inputState: any;
    insertEnd: { cm: any; id: number; offset: number; assoc: number };
    insertMode: boolean;
    insertModeRepeat?: number;
    insertModeReturn?: boolean;
    lastEditActionCommand?: any;
    lastEditInputState?: any;
    lastHPos?: number;
    lastHSPos?: number;
    lastMotion?: any;
    lastPastedText?: string | null;
    lastSelection?: any;
    marks: Record<number, any>;
    mode: string;
    sel: any;
    status: string;
    visualBlock: boolean;
    visualLine: boolean;
    visualMode: boolean;
    onPasteFn?: (...args: any[]) => void;
    [key: string]: any;
}

export interface Vim {
    /** define a new action in Vim
     * @param name name of the action
     * @param fn the callback executed when the action is triggered
     */
    defineAction(
        name: string,
        fn: (
            cm: VimCodeMirrorAdapter,
            args: VimActionArgs,
            vimState: VimState,
        ) => void,
    ): void;

    /** map a key or key sequence to a Vim action */
    mapCommand(
        keys: string,
        type: string,
        name: string,
        args: Record<string, any>,
        extra: Record<string, any>,
    ): void;

    /** put editor into insert mode */
    enterInsertMode(cm: VimCodeMirrorAdapter): void;
}
