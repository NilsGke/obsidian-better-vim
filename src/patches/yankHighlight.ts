import {
    addYankEventListener,
    removeYankEventListener,
    YankEventDetail,
} from "src/yankEvent";
import { Vim } from "src/vimTypes";
import BetterVimPlugin from "src/main";
import { markViewPlugin } from "src/markViewPlugin";
import { createPatch } from "./patch";

let timeoutHandle = 0;

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
    }, 500);
};

function patchFn(_vim: Vim, _plugin: BetterVimPlugin) {
    addYankEventListener(handler);
}

function unpatch(_vim: Vim, _plugin: BetterVimPlugin) {
    removeYankEventListener(handler);
}

export const yankHighlight = {
    description: "highlight yanks",
    defaultEnabled: true,
    patch: patchFn,
    unpatch,
};

export default createPatch({
    defaultSettings: {
        __patch: {
            name: "Highlith yanks",
            defaultValue: true,
        },
    },
    patch: () => addYankEventListener(handler),
    unpatch: () => removeYankEventListener(handler),
});
