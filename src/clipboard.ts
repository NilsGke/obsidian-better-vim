type ElectronClipboard = {
    readText: () => string;
    writeText: (text: string) => void;
};

const getElectronClipboard = (): ElectronClipboard | null => {
    const requireFn = (
        window as Window & { require?: (module: string) => unknown }
    ).require;
    if (!requireFn) return null;

    try {
        const electron = requireFn("electron") as {
            clipboard?: ElectronClipboard;
        };
        return electron?.clipboard ?? null;
    } catch (error) {
        console.error("Vim clipboard sync failed:", error);
        return null;
    }
};

export const readClipboardTextSync = (): string | null => {
    const clipboard = getElectronClipboard();
    if (!clipboard) {
        console.error(
            "Vim clipboard read failed: Electron clipboard unavailable.",
        );
        return null;
    }

    return clipboard.readText();
};

export const writeClipboardText = (text: string): void => {
    const clipboard = getElectronClipboard();
    if (clipboard) {
        clipboard.writeText(text);
        return;
    }

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch((error) => {
            console.error("Vim clipboard sync failed:", error);
        });
        return;
    }

    console.error("Vim clipboard sync failed: clipboard API unavailable.");
};
