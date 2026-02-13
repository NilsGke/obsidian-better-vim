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

/**
 * Register controller returned by getRegisterController().
 * This is not formally documented, so it's typed structurally.
 */
export interface VimRegisterController {
    getRegister(name: string): any;
    setRegister(name: string, value: any): void;
    [key: string]: any;
}

/**
 * Vim global state returned by getVimGlobalState_().
 */
export interface VimGlobalState {
    searchState?: any;
    macroModeState?: any;
    lastInsertModeChanges?: any;
    [key: string]: any;
}

/**
 * Motion function signature.
 */
export type VimMotionFn = (
    cm: VimCodeMirrorAdapter,
    head: number,
    motionArgs: any,
    vimState: VimState,
) => any;

/**
 * Operator function signature.
 */
export type VimOperatorFn = (
    cm: VimCodeMirrorAdapter,
    operatorArgs: any,
    ranges: any,
    vimState: VimState,
) => any;

/**
 * Ex command handler signature.
 */
export type VimExFn = (
    cm: VimCodeMirrorAdapter,
    params: any,
    vimState: VimState,
) => void;

/**
 * Option callback signature.
 */
export type VimOptionCallback = (
    value: any,
    cm: VimCodeMirrorAdapter,
    cfg: any,
) => void;

export interface Vim {
    /** Insert mode handler for a single key */
    InsertModeKey(keyName: string, e: KeyboardEvent): boolean | void;

    /** Build the internal keymap */
    buildKeyMap(): void;

    /** Define a new action callable by Vim mappings */
    defineAction(
        name: string,
        fn: (
            cm: VimCodeMirrorAdapter,
            args: VimActionArgs,
            vimState: VimState,
        ) => void,
    ): void;

    /** Define an Ex command (like :w, :q, etc) */
    defineEx(name: string, prefix: string, func: VimExFn): void;

    /** Define a motion (w, b, gg, etc) */
    defineMotion(name: string, fn: VimMotionFn): void;

    /** Define an operator (d, c, y, etc) */
    defineOperator(name: string, fn: VimOperatorFn): void;

    /** Define a Vim option (:set ...) */
    defineOption(
        name: string,
        defaultValue: any,
        type: string,
        aliases?: string[],
        callback?: VimOptionCallback,
    ): void;

    /** Define a register (", a-z, +, *, etc) */
    defineRegister(name: string, register: any): void;

    /** Enter insert mode */
    enterInsertMode(cm: VimCodeMirrorAdapter): void;

    /** Enable Vim mode for an editor */
    enterVimMode(cm: VimCodeMirrorAdapter): void;

    /** Exit insert mode */
    exitInsertMode(cm: VimCodeMirrorAdapter, keepCursor?: boolean): void;

    /** Exit visual mode */
    exitVisualMode(cm: VimCodeMirrorAdapter, moveHead?: boolean): void;

    /** Find mapping result for a key */
    findKey(cm: VimCodeMirrorAdapter, key: string, origin?: string): any;

    /** Get option value */
    getOption(name: string, cm?: VimCodeMirrorAdapter, cfg?: any): any;

    /** Returns the internal register controller */
    getRegisterController(): VimRegisterController;

    /** Returns global Vim state (internal) */
    getVimGlobalState_(): VimGlobalState;

    /** Handle an Ex command input (":w", ":q!", etc) */
    handleEx(cm: VimCodeMirrorAdapter, input: string): void;

    /** Handle a Vim key sequence */
    handleKey(cm: VimCodeMirrorAdapter, key: string, origin?: string): boolean;

    /** Update langmap */
    langmap(langmapString: string, remapCtrl?: boolean): void;

    /** Leave Vim mode entirely */
    leaveVimMode(cm: VimCodeMirrorAdapter): void;

    /** Map lhs to rhs (recursive mapping) */
    map(lhs: string, rhs: string, ctx?: string): void;

    /**
     * Map keys to a vim command/action/operator/motion.
     * Example type values: "action", "operator", "motion", "ex"
     */
    mapCommand(
        keys: string,
        type: string,
        name: string,
        args?: Record<string, any>,
        extra?: Record<string, any>,
    ): void;

    /** Clear mappings (optionally per context) */
    mapclear(ctx?: string): void;

    /** Ensure Vim state is initialized for this editor */
    maybeInitVimState_(cm: VimCodeMirrorAdapter): void;

    /** Handle multi cursor / multi selection key behavior */
    multiSelectHandleKey(
        cm: VimCodeMirrorAdapter,
        key: string,
        origin?: string,
    ): boolean;

    /** Non-recursive map */
    noremap(lhs: string, rhs: string, ctx?: string): void;

    /** Reset global vim state */
    resetVimGlobalState_(): void;

    /** Set option value */
    setOption(
        name: string,
        value: any,
        cm?: VimCodeMirrorAdapter,
        cfg?: any,
    ): void;

    /** Whether error logging is suppressed */
    suppressErrorLogging: boolean;

    /** Remove mapping */
    unmap(lhs: string, ctx?: string): void;

    /** Convert a DOM keyboard event into a Vim key string */
    vimKeyFromEvent(e: KeyboardEvent, vim?: Vim): string;

    /** Internal: map command object builder */
    _mapCommand(command: any): any;
}
