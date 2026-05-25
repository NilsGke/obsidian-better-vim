import {
    addYankEventListener,
    removeYankEventListener,
    YankEventDetail,
} from "src/yankEvent";
import { Patch } from "src/types";
import { Vim } from "src/vimTypes";
import BetterVimPlugin from "src/main";
import { markViewPlugin } from "src/markViewPlugin";

let timeoutHandle = 0;

export function setHighlightCSS(plugin: BetterVimPlugin) {
    const doc = activeWindow.document;
    const { yankHighlightDuration, yankHighlightFadeEnabled, yankHighlightFadeDuration } =
        plugin.settings;

    const duration = yankHighlightFadeEnabled
        ? yankHighlightFadeDuration
        : 0;
    const delay = yankHighlightFadeEnabled
        ? Math.max(0, yankHighlightDuration - yankHighlightFadeDuration)
        : yankHighlightDuration;

    const styleId = "ovy-highlight-style";
    let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
        styleEl = doc.createElement("style");
        styleEl.id = styleId;
        doc.head.appendChild(styleEl);
    }
    styleEl.textContent = `
:root {
    --ovy-anim-duration: ${duration / 1000}s;
    --ovy-anim-delay: ${delay / 1000}s;
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
    activeWindow.clearTimeout(timeoutHandle);
    timeoutHandle = activeWindow.setTimeout(() => {
        plug.cleanYankText(timeoutEditorView);
    }, plugin.settings.yankHighlightDuration);
};

function patch(_vim: Vim, plugin: BetterVimPlugin) {
    setHighlightCSS(plugin);
    addYankEventListener(handler);
}

function unpatch(_vim: Vim, _plugin: BetterVimPlugin) {
    const doc = activeWindow.document;
    const styleEl = doc.getElementById("ovy-highlight-style");
    if (styleEl) styleEl.remove();
    removeYankEventListener(handler);
}

export const yankHighlight = {
    description: "highlight yanks",
    patch,
    unpatch,
} as const satisfies Patch;
