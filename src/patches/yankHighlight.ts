import {
    addYankEventListener,
    removeYankEventListener,
    YankEventDetail,
} from "src/util/yankEvent";
import { markViewPlugin } from "../markViewPlugin";
import { createPatch } from "./patch";

let timeoutHandle = 0;
let currentHighlightDuration = 500;
let currentFadeDuration = 0;

export function setHighlightCSS(
    highlightDuration: number,
    fadeDuration: number,
) {
    const doc = activeWindow.document;
    const animDuration = fadeDuration;
    const delay = highlightDuration;

    const styleId = "better-vim-highlight-style";
    let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
        styleEl = doc.createElement("style");
        styleEl.id = styleId;
        doc.head.appendChild(styleEl);
    }
    styleEl.textContent = `
:root {
    --better-vim-anim-duration: ${animDuration / 1000}s;
    --better-vim-anim-delay: ${delay / 1000}s;
}`;
}

const handler = ({
    detail: { operator, text, plugin },
}: CustomEvent<YankEventDetail>) => {
    if (operator !== "yank") return;
    if (!plugin.activeEditorView) return;

    const plug = plugin.activeEditorView.plugin(markViewPlugin);
    if (!plug) throw Error("could not load mark view plugin");

    plug.setYankText(text, plugin.activeEditorView);

    const timeoutEditorView = plugin.activeEditorView;
    window.clearTimeout(timeoutHandle);
    const totalDuration = currentHighlightDuration + currentFadeDuration;
    timeoutHandle = window.setTimeout(() => {
        plug.cleanYankText(timeoutEditorView);
    }, totalDuration);
};

export default createPatch({
    defaultSettings: {
        __patch: {
            name: "Highlight yanks",
            description: "highlight yanks with a visual indicator",
            defaultValue: true,
        },
        highlightDuration: {
            name: "Highlight duration (ms)",
            description:
                "How long the yank highlight is fully displayed before fading starts",
            defaultValue: 500,
        },
        fadeDuration: {
            name: "Fade duration (ms)",
            description:
                "Duration of the fade-out animation after the highlight duration",
            defaultValue: 400,
        },
    },
    patch: ({ getSetting }) => {
        currentHighlightDuration = getSetting("highlightDuration");
        currentFadeDuration = getSetting("fadeDuration");
        setHighlightCSS(currentHighlightDuration, currentFadeDuration);
        addYankEventListener(handler);
    },
    unpatch: () => {
        const doc = activeWindow.document;
        const styleEl = doc.getElementById("better-vim-highlight-style");
        if (styleEl) styleEl.remove();
        removeYankEventListener(handler);
    },
});
