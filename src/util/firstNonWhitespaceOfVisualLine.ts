import { EditorSelection } from "@codemirror/state";
import { VimCodeMirrorAdapter, VimMotionFn, VimPos } from "src/vimTypes";

export const VISUAL_LINE_FIRST_NON_WHITESPACE_MOTION =
    "obsidianVisualLineFirstNonWhitespace";

const findFirstNonWhiteSpaceCharacter = (text: string) => {
    const firstNonWhitespace = text.search(/\S/);
    return firstNonWhitespace === -1 ? text.length : firstNonWhitespace;
};

const posToOffset = (view: VimCodeMirrorAdapter["cm6"], pos: VimPos) => {
    const line = view.state.doc.line(pos.line + 1);
    return line.from + pos.ch;
};

const offsetToPos = (view: VimCodeMirrorAdapter["cm6"], offset: number): VimPos => {
    const line = view.state.doc.lineAt(offset);
    return { line: line.number - 1, ch: offset - line.from };
};

export const moveToFirstNonWhitespaceOfVisualLine: VimMotionFn = (
    cm,
    head,
    motionArgs,
) => {
    const view = cm.cm6;
    if (!view) return head;

    const headOffset = posToOffset(view, head);
    let range = EditorSelection.cursor(headOffset);

    const repeat = Number.isFinite(motionArgs.repeat)
        ? Math.max(1, motionArgs.repeat)
        : 1;
    for (let i = 1; i < repeat; i++) {
        range = view.moveVertically(range, true);
    }

    const start = view.moveToLineBoundary(range, false, true).head;
    const end = view.moveToLineBoundary(range, true, true).head;
    const segmentText = view.state.doc.sliceString(start, end);
    const firstNonWhitespace = findFirstNonWhiteSpaceCharacter(segmentText);

    return offsetToPos(view, start + firstNonWhitespace);
};
