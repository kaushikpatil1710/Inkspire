export type EditorRef = React.RefObject<HTMLElement | null>;

export function createSelectionHelpers(editorRef: EditorRef) {
    let savedRange: Range | null = null;

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const sel = window.getSelection();
        if (!sel || !savedRange) return;
        if (editorRef?.current) {
            (editorRef.current as HTMLElement).focus();
        }
        sel.removeAllRanges();
        sel.addRange(savedRange.cloneRange());
    };

    const clearSavedSelection = () => {
        savedRange = null;
    };

    const hasSavedSelection = () => savedRange !== null;

    return {
        saveSelection,
        restoreSelection,
        clearSavedSelection,
        hasSavedSelection,
    } as const;
}
