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
    [key: string]: unknown;
}

export interface VimState {
    inputState: unknown;
    insertEnd: { cm: unknown; id: number; offset: number; assoc: number };
    insertMode: boolean;
    insertModeRepeat?: number;
    insertModeReturn?: boolean;
    lastEditActionCommand?: unknown;
    lastEditInputState?: unknown;
    lastHPos?: number;
    lastHSPos?: number;
    lastMotion?: unknown;
    lastPastedText?: string | null;
    lastSelection?: unknown;
    marks: Record<number, unknown>;
    mode: string;
    sel: unknown;
    status: string;
    visualBlock: boolean;
    visualLine: boolean;
    visualMode: boolean;
    onPasteFn?: (...args: unknown[]) => void;
    [key: string]: unknown;
}

/**
 * Register structure used by the Vim register controller.
 */
export interface VimRegister {
    setText: (text: string, linewise?: boolean, blockwise?: boolean) => void;
    pushText: (text: string, linewise?: boolean) => void;
    clear: () => void;
    toString: () => string;
    linewise?: boolean;
    blockwise?: boolean;
}

/**
 * Register controller returned by getRegisterController().
 * This is not formally documented, so it's typed structurally.
 */
export interface VimRegisterController {
    getRegister(name: string): VimRegister;
    setRegister(name: string, value: VimRegister): void;
    pushText(
        registerName: string,
        operator: string,
        text: string,
        linewise: boolean,
        blockwise: boolean,
    ): void;
    registers?: Record<string, VimRegister>;
    unnamedRegister?: VimRegister;
    [key: string]: unknown;
}

/**
 * Vim global state returned by getVimGlobalState_().
 */
export interface VimGlobalState {
    searchState?: unknown;
    macroModeState?: unknown;
    lastInsertModeChanges?: unknown;
    [key: string]: unknown;
}

/**
 * Motion function signature.
 */
export type VimMotionFn = (
    cm: VimCodeMirrorAdapter,
    head: number,
    motionArgs: unknown,
    vimState: VimState,
) => unknown;

/**
 * Operator function signature.
 */
export type VimOperatorFn = (
    cm: VimCodeMirrorAdapter,
    operatorArgs: unknown,
    ranges: unknown,
    vimState: VimState,
) => unknown;

/**
 * Ex command handler signature.
 */
export type VimExFn = (
    cm: VimCodeMirrorAdapter,
    params: unknown,
    vimState: VimState,
) => void;

/**
 * Option callback signature.
 */
export type VimOptionCallback = (
    value: unknown,
    cm: VimCodeMirrorAdapter,
    cfg: unknown,
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
        defaultValue: unknown,
        type: string,
        aliases?: string[],
        callback?: VimOptionCallback,
    ): void;

    /** Define a register (", a-z, +, *, etc) */
    defineRegister(name: string, register: unknown): void;

    /** Enter insert mode */
    enterInsertMode(cm: VimCodeMirrorAdapter): void;

    /** Enable Vim mode for an editor */
    enterVimMode(cm: VimCodeMirrorAdapter): void;

    /** Exit insert mode */
    exitInsertMode(cm: VimCodeMirrorAdapter, keepCursor?: boolean): void;

    /** Exit visual mode */
    exitVisualMode(cm: VimCodeMirrorAdapter, moveHead?: boolean): void;

    /** Find mapping result for a key */
    findKey(cm: VimCodeMirrorAdapter, key: string, origin?: string): unknown;

    /** Get option value */
    getOption(name: string, cm?: VimCodeMirrorAdapter, cfg?: unknown): unknown;

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
        args?: Record<string, unknown>,
        extra?: Record<string, unknown>,
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
        value: unknown,
        cm?: VimCodeMirrorAdapter,
        cfg?: unknown,
    ): void;

    /** Whether error logging is suppressed */
    suppressErrorLogging: boolean;

    /** Remove mapping */
    unmap(lhs: string, ctx?: string): void;

    /** Convert a DOM keyboard event into a Vim key string */
    vimKeyFromEvent(e: KeyboardEvent, vim?: Vim): string;

    /** Internal: map command object builder */
    _mapCommand(command: unknown): unknown;
}
