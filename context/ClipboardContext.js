import { createContext, useContext, useState } from "react";

const ClipboardContext = createContext();

export function ClipboardProvider({ children }) {
    const [clipboard, setClipboard] = useState([]);
    const [clipboardMode, setClipboardMode] = useState(null); // 'cut' | 'copy' | null
    const [cutItemIds, setCutItemIds] = useState([]);
    const [copiedItemIds, setCopiedItemIds] = useState([]);

    const cut = (items) => {
        setClipboard([...items]);
        setClipboardMode("cut");
        setCutItemIds(items.map((i) => `${i.type}-${i.id}`)); // scoped IDs
        console.log("Cut items:", items);
        setCopiedItemIds([]);
    };

    const copy = (items) => {
        setClipboard([...items]);
        setClipboardMode("copy");
        setCopiedItemIds(items.map((i) => `${i.type}-${i.id}`));
        setCutItemIds([]);
    };

    const getItemStatus = (itemId, type) => ({
        isCut: cutItemIds.includes(`${type}-${itemId}`),
        isCopied: copiedItemIds.includes(`${type}-${itemId}`),
    });

    const clear = () => {
        setClipboard([]);
        setClipboardMode(null);
        setCutItemIds([]);
        setCopiedItemIds([]);
    };


    const hasClipboard = clipboard.length > 0;
    const isCut = clipboardMode === "cut";
    const isCopy = clipboardMode === "copy";

    return (
        <ClipboardContext.Provider
            value={{
                clipboard,
                clipboardMode,
                cutItemIds,
                copiedItemIds,
                hasClipboard,
                isCut,
                isCopy,
                cut,
                copy,
                clear,
                getItemStatus,
            }}
        >
            {children}
        </ClipboardContext.Provider>
    );
}

export function useClipboard() {
    const context = useContext(ClipboardContext);
    if (!context) {
        throw new Error("useClipboard must be used within a ClipboardProvider");
    }
    return context;
}
