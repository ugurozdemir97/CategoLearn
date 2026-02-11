import { createContext, useContext, useState } from "react";

// Context to manage clipboard state across the app (for cut/copy/paste operations)
const ClipboardContext = createContext();

// In App.js this wraps the entire app, providing clipboard state and functions to all components
export function ClipboardProvider({ children }) {

    const [clipboard, setClipboard] = useState([]);               // Array of items currently in the clipboard (can be from cut or copy)
    const [clipboardMode, setClipboardMode] = useState(null);     // 'cut' | 'copy' | null
    const [cutItemIds, setCutItemIds] = useState([]);             // Array of item IDs that are currently cut (used for UI feedback)
    const [copiedItemIds, setCopiedItemIds] = useState([]);       // Array of item IDs that are currently copied (used for UI feedback)


    const cut = (items) => {
        setClipboard([...items]);                                  // Store the items being cut in the clipboard state    
        setClipboardMode("cut");                                   // Set mode to 'cut' so that paste operations know how to handle these items    
        setCutItemIds(items.map((i) => `${i.type}-${i.id}`));      // Store IDs of cut items for UI feedback
        setCopiedItemIds([]);                                      // If cutting, clear any copied item IDs since they are no longer relevant
    };

    const copy = (items) => {
        setClipboard([...items]);                                  // Store the items being copied in the clipboard state
        setClipboardMode("copy");                                  // Set mode to 'copy' so that paste operations know how to handle these items
        setCopiedItemIds(items.map((i) => `${i.type}-${i.id}`));   // Store IDs of copied items for UI feedback
        setCutItemIds([]);                                         // If copying, clear any cut item IDs since they are no longer relevant
    }; 

    // These are for UI feedback
    const getItemStatus = (itemId, type) => ({
        isCut: cutItemIds.includes(`${type}-${itemId}`),           // Check if this item is currently cut
        isCopied: copiedItemIds.includes(`${type}-${itemId}`),     // Check if this item is currently copied
    });

    // Clear the clipboard, use after pasting or when user cancels the operation
    const clearClipboard = () => {
        setClipboard([]);
        setClipboardMode(null);
        setCutItemIds([]);
        setCopiedItemIds([]);
    };

    return (
        <ClipboardContext.Provider value={{ clipboard, clipboardMode, cutItemIds, copiedItemIds, cut, copy, clearClipboard, getItemStatus}}>
            {children}
        </ClipboardContext.Provider>
    );
}

export function useClipboard() {
    const context = useContext(ClipboardContext);
    if (!context) throw new Error("useClipboard must be used within a ClipboardProvider");
    return context;
}
