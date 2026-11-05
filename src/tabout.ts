import { EditorSelection, Extension, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

const DEFAULT_CLOSING = ")]}>\"'`";
const DEFAULT_OPENING = "([{<\"'`";

type Pairs = {
    openToClose: Map<string, string>;
    closeToOpen: Map<string, string>;
    symmetric: Set<string>;
};

export function buildPairMaps(opening: string, closing: string): Pairs {
    const openToClose = new Map<string, string>();
    const closeToOpen = new Map<string, string>();
    const symmetric = new Set<string>();

    const length = Math.min(opening.length, closing.length);
    for (let i = 0; i < length; i++) {
        const openingChar = opening[i];
        const closingChar = closing[i];
        if (openingChar === closingChar) symmetric.add(openingChar);
        else {
            openToClose.set(openingChar, closingChar);
            closeToOpen.set(closingChar, openingChar);
        }
    }
    return { openToClose, closeToOpen, symmetric };
}

type Context = {
    position: number;
    opener: string;
    closer: string;
    isSymmetric: boolean;
};

/**
 * Runtime configuration for the tab-out feature.
 * */
export type TaboutConfig = {
    /** Active or not. */
    enabled: boolean;
    /** Whether Shift-Tab should tab back in (jump before the opening char). */
    shiftTab: boolean;
    /** Only act while in vim insert mode. */
    insertModeOnly: boolean;
    /** Characters Shift-Tab jumps before (searched to the left). */
    opening: string;
    /** Characters Tab jumps past (searched to the right, on the current line). */
    closing: string;
    /** Stores pairs derived from opening and closing chars. */
    _pairs: Pairs;
};

export const taboutConfig: TaboutConfig = {
    enabled: false,
    shiftTab: true,
    insertModeOnly: true,
    opening: DEFAULT_OPENING,
    closing: DEFAULT_CLOSING,
    _pairs: buildPairMaps(DEFAULT_OPENING, DEFAULT_CLOSING),
};

/**
 * Determine whether the given editor is currently in vim insert mode.
 *
 * Primary path uses the cm5 adapter exposed by `@replit/codemirror-vim`
 * (via `window.CodeMirrorAdapter.getCM`). Falls back to detecting the block
 * cursor the vim layer renders in non-insert modes, and finally
 * assumes insert mode so the feature still works if detection is unavailable.
 */
function isInsertMode(view: EditorView): boolean {
    const adapter = window.CodeMirrorAdapter;
    const cm = adapter?.getCM?.(view);
    const vimState = cm?.state?.vim;
    if (vimState && typeof vimState.insertMode === "boolean")
        return vimState.insertMode;

    // Fallback: the vim block cursor adds `cm-fat-cursor` in normal/visual
    // modes; not there means we're in insert mode.
    const hasFatCursor =
        view.dom.classList.contains("cm-fat-cursor") ||
        view.dom.querySelector(".cm-fat-cursor") !== null;
    return !hasFatCursor;
}

/** builds opening / closing character context around the col. */
function enclosingContext(text: string, col: number) {
    const { openToClose, closeToOpen, symmetric } = taboutConfig._pairs;
    const stack: Context[] = [];

    for (let i = 0; i < col; i++) {
        const c = text[i];
        const top = stack[stack.length - 1];
        if (symmetric.has(c)) {
            if (top && top.isSymmetric && top.opener === c) stack.pop();
            else
                stack.push({
                    position: i,
                    opener: c,
                    closer: c,
                    isSymmetric: true,
                });
        } else if (openToClose.has(c)) {
            stack.push({
                position: i,
                opener: c,
                closer: openToClose.get(c)!,
                isSymmetric: false,
            });
        } else if (closeToOpen.has(c)) {
            if (top && !top.isSymmetric && top.closer === c) stack.pop();
        }
    }
    return stack;
}

function forwardTarget(
    text: string,
    col: number,
    context: Context,
): number | null {
    if (context.isSymmetric) {
        const index = text.indexOf(context.closer, col);
        return index === -1 ? null : index + 1;
    }
    let depth = 0;
    for (let i = col; i < text.length; i++) {
        const c = text[i];
        if (c === context.opener) depth++;
        else if (c === context.closer) {
            if (depth === 0) return i + 1;
            else depth--;
        }
    }
    return null;
}

/** Jumps cursor to specified column in current line */
function jumpTo(view: EditorView, target: number) {
    view.dispatch({
        selection: EditorSelection.cursor(target),
        scrollIntoView: true,
    });
    return true;
}

/** Tab forward: jump past the next closing character on the line. */
function tabOut(view: EditorView): boolean {
    const sel = view.state.selection.main;
    if (!sel.empty) return false;

    const line = view.state.doc.lineAt(sel.head);
    const cursorCol = sel.head - line.from;

    const contextStack = enclosingContext(line.text, cursorCol);
    for (let i = contextStack.length - 1; i >= 0; i--) {
        const target = forwardTarget(line.text, cursorCol, contextStack[i]);
        if (target !== null) return jumpTo(view, line.from + target);
    }

    return false;
}

/** Shift-Tab: jump before the previous opening character on the line. */
function tabIn(view: EditorView): boolean {
    const sel = view.state.selection.main;
    if (!sel.empty) return false;

    const line = view.state.doc.lineAt(sel.head);
    const cursorCol = sel.head - line.from;

    const contextStack = enclosingContext(line.text, cursorCol);
    for (let i = contextStack.length - 1; i >= 0; i--) {
        const context = contextStack[i];
        if (
            context.isSymmetric &&
            forwardTarget(line.text, cursorCol, context) === null
        )
            continue;
        return jumpTo(view, line.from + context.position);
    }

    return false;
}

function handle(view: EditorView, direction: "forward" | "backward"): boolean {
    if (!taboutConfig.enabled) return false;
    if (direction === "backward" && !taboutConfig.shiftTab) return false;
    if (taboutConfig.insertModeOnly && !isInsertMode(view)) return false;

    return direction === "forward" ? tabOut(view) : tabIn(view);
}

/**
 * The CodeMirror extension. Registered once in main;
 * behavior is gated through `taboutConfig`. Highest precedence so it
 * gets first at Tab before the default indent handling. Returns false when there is nothing to tab out of.
 */
export const taboutExtension: Extension = Prec.highest(
    keymap.of([
        { key: "Tab", run: (view) => handle(view, "forward") },
        { key: "Shift-Tab", run: (view) => handle(view, "backward") },
    ]),
);
