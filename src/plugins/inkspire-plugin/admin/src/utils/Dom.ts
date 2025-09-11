 const isElement = (n: Node | null): n is HTMLElement =>
    !!n && n.nodeType === Node.ELEMENT_NODE;
export const getSelectionRoot = (): Node | null => {
    const sel = window.getSelection();
    return sel && sel.rangeCount > 0 ? sel.anchorNode : null;
};
export const findAncestor = (
    start: Node | null,
    predicate: (el: HTMLElement) => boolean,
    stopAt?: HTMLElement | null
): HTMLElement | null => {
    let n: Node | null = start;
    while (n && n !== stopAt) {
        if (isElement(n) && predicate(n)) return n;
        n = n.parentNode;
    }
    return null;
};
    const toEditorBlock = (
    node: Node,
    editor: HTMLElement
): HTMLElement | null => {
    let el: HTMLElement | null =
        node.nodeType === Node.TEXT_NODE
            ? (node.parentElement as HTMLElement)
            : (node as HTMLElement);

    while (el && el.parentElement !== editor) {
        el = el.parentElement as HTMLElement | null;
    }
    return el && el.parentElement === editor ? el : null;
};
export const collectBlocksInRange = (
    editor: HTMLElement,
    range: Range
): HTMLElement[] => {
    const start = toEditorBlock(range.startContainer, editor);
    const end = toEditorBlock(range.endContainer, editor);
    if (!start || !end) return [];
    const blocks: HTMLElement[] = [];
    let cur: HTMLElement | null = start;
    while (cur) {
        blocks.push(cur);
        if (cur === end) break;
        cur = cur.nextElementSibling as HTMLElement | null;
    }
    return blocks;
};
export const isInside = (editor: HTMLElement, selector: string): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const node = sel.anchorNode;
    if (!node || !editor.contains(node)) return false;

    const el =
        node.nodeType === Node.ELEMENT_NODE
            ? (node as HTMLElement)
            : (node.parentElement as HTMLElement | null);

    return !!el?.closest(selector);
};

export function sanitizeHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const fragment = doc.body;

    const ALLOWED_TAGS = new Set([
        "P",
        "BR",
        "STRONG",
        "B",
        "EM",
        "I",
        "A",
        "UL",
        "OL",
        "LI",
        "BLOCKQUOTE",
        "CODE",
        "PRE",
        "H1",
        "H2",
        "H3",
        "H4",
    ]);
    const ALLOWED_A_ATTRIBUTES = new Set(["href", "target", "rel"]);

    function unwrap(node: Element) {
        const parent = node.parentNode;
        if (!parent) return;
        while (node.firstChild) {
            parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
    }

    const nodes = Array.from(fragment.querySelectorAll("*"));
    for (const node of nodes) {
        const tag = node.tagName;

        if (node.nodeType === Node.COMMENT_NODE) {
            node.remove();
            continue;
        }

        if (tag === "SPAN" || node.hasAttribute("style")) {
            const style = node.getAttribute("style") || "";

            if (node.textContent && node.textContent.trim() === "\u00A0") {
                node.remove();
                continue;
            }

            const onlyTextChildren = Array.from(node.childNodes).every(
                (n) => n.nodeType === Node.TEXT_NODE
            );
            const junkStylePattern =
                /(font-family|font-size|color|line-height|font-weight|font-style)\s*:/i;

            if (tag === "SPAN" && onlyTextChildren && junkStylePattern.test(style)) {
                unwrap(node);
                continue;
            }

            node.removeAttribute("style");
        }

        if (!ALLOWED_TAGS.has(tag)) {
            if (["IMG", "TABLE", "SCRIPT", "STYLE"].includes(tag)) {
                node.remove();
                continue;
            }
            unwrap(node);
            continue;
        }

        if (tag === "A") {
            const attrs = Array.from(node.attributes);
            for (const { name } of attrs) {
                if (!ALLOWED_A_ATTRIBUTES.has(name)) node.removeAttribute(name);
            }
            if (!node.hasAttribute("rel")) node.setAttribute("rel", "noopener noreferrer");
            if (!node.hasAttribute("target")) node.setAttribute("target", "_blank");
        }
    }

    const htmlOut = fragment.innerHTML.replace(/\u00A0/g, " ");
    return htmlOut.trim();
}
