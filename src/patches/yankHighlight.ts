import {
    addYankEventListener,
    removeYankEventListener,
    YankEventDetail,
} from "src/yankEvent";
import { Patch } from "src/types";
import { Vim } from "src/vimTypes";
import BetterVimPlugin from "src/main";
import { MarkViewPlugin, markViewPlugin } from "src/markViewPlugin";

let plugin: BetterVimPlugin | null = null;
let timeoutHandle = 0;

const handler = ({
    detail: { registerName, operator, text, isVisual, lines, vim, plugin },
}: CustomEvent<YankEventDetail>) => {
    if (operator !== "yank") return;

    console.log({ registerName, operator, text, isVisual, lines, plugin });

    const plug = plugin.activeEditorView.plugin(markViewPlugin);
    if (!plug) throw Error("could not load mark view plugin");

    plug.setYankText(text, plugin.activeEditorView);

    console.log(plug);

    const timeoutEditorView = plugin.activeEditorView;
    clearTimeout(timeoutHandle);
    timeoutHandle = window.setTimeout(() => {
        plug.cleanYankText(timeoutEditorView);
    }, 500);
};

function patch(vim: Vim, _plugin: BetterVimPlugin) {
    plugin = _plugin;
    addYankEventListener(handler);
}

function unpatch(vim: Vim, plugin: BetterVimPlugin) {
    removeYankEventListener(handler);
}

export const yankHighlight = {
    description: "highlight yanks",
    patch,
    unpatch,
} as const satisfies Patch;
