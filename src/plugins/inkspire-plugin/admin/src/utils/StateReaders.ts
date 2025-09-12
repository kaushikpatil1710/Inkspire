import {
    getSelectionRoot,
    findAncestor,
    sanitizeHtml,
    collectBlocksInRange
} from "./Dom";
import { HOVER_STYLE } from "../components/styled";
export type ListType = "ul" | "ol" | undefined;
export type HeadingType = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | undefined;
const SKIP_TAGS = new Set(["A", "CODE", "PRE", "SCRIPT", "STYLE"]);
const URL_REGEX =
    /((https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?)/gi;
export const blockTagToHeading = (tag?: string): HeadingType => {
    if (!tag) return undefined;
    const t = tag.toUpperCase();
    if (t === "P" || t === "DIV") return "p";
    if (/^H[1-6]$/.test(t)) return t.toLowerCase() as HeadingType;
    return undefined;
};

export const getActiveBlockTag = (editor: HTMLElement | null): string | undefined => {
    const selRoot = getSelectionRoot();
    if (!editor || !selRoot) return undefined;
    if (!editor.contains(selRoot)) return undefined;

    const node = selRoot;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement | null);
    if (!el) return undefined;

    const block = el.closest("ul,ol,blockquote,h1,h2,h3,h4,h5,h6,p,div,li") as HTMLElement | null;
    if (!block) return undefined;

    if (block.tagName === "LI" && block.parentElement) {
        return block.parentElement.tagName;
    }
    return block.tagName;
};
export const getActiveHeading = (editor: HTMLElement | null): HeadingType => {
    const tag = getActiveBlockTag(editor);
    if (!tag) return undefined;
    if (tag === "BLOCKQUOTE" || tag === "UL" || tag === "OL") return undefined;
    return blockTagToHeading(tag);
};

export const getActiveListType = (editor: HTMLElement | null): ListType => {
    if (!editor) return undefined;
    const selRoot = getSelectionRoot();
    if (!selRoot || !editor.contains(selRoot)) return undefined;

    const node = selRoot;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement | null);
    if (!el) return undefined;

    const list = el.closest("ul,ol") as HTMLElement | null;
    if (!list) return undefined;
    return list.tagName === "UL" ? "ul" : "ol";
};

export const getActiveFontFamily = (editor: HTMLElement | null): string | undefined => {
    if (!editor) return undefined;
    const selRoot = getSelectionRoot();
    if (!selRoot || !editor.contains(selRoot)) return undefined;

    const node = selRoot;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement | null) || editor;
    const fam = (window.getComputedStyle(el).fontFamily || "").trim();

    const known = [
        { label: "Times New Roman", match: "Times New Roman" },
        { label: "Arial", match: "Arial" },
        { label: "Georgia", match: "Georgia" },
        { label: "Courier New", match: "Courier New" },
    ];
    const hit = known.find((k) => fam.toLowerCase().includes(k.match.toLowerCase()));
    return hit ? hit.label : fam || undefined;
};

export const isInlineActive = (editor: HTMLElement | null, tags: string[]): boolean => {
  if (!editor) return false;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  const rootNode = getSelectionRoot();
  if (!rootNode || !editor.contains(rootNode)) return false;

  try {
    const blocks = collectBlocksInRange(editor, range);
    if (blocks.length > 1) {
      return false;
    }
  } catch (err) {
        console.log(err)
  }

  const el = findAncestor(rootNode, (e) => tags.includes(e.tagName), editor);
  if (el) return true;
  const nodeEl = findAncestor(rootNode, (e) => !!e, editor) as HTMLElement | null;
  if (!nodeEl) return false;

  if (/^H[1-6]$/.test(nodeEl.tagName)) {
    return false;
  }
  if (tags.includes("STRONG") || tags.includes("B")) {
    const fw = window.getComputedStyle(nodeEl).fontWeight || "";
    const num = parseInt(fw, 10);
    if (fw === "bold" || fw === "bolder" || (!isNaN(num) && num >= 600)) {
      return true;
    }
  }
  if (tags.includes("EM") || tags.includes("I")) {
    const fs = window.getComputedStyle(nodeEl).fontStyle || "";
    if (fs === "italic" || fs === "oblique") return true;
  }
  if (tags.includes("U") || tags.includes("UNDERLINE")) {
    const td = (window.getComputedStyle(nodeEl).textDecorationLine || "").toLowerCase();
    if (td.includes("underline")) return true;
  }

  return false;
};


export const getActiveAlignment = (editor: HTMLElement | null): "left" | "center" | "right" | undefined => {
    if (!editor) return undefined;
    const selRoot = getSelectionRoot();
    if (!selRoot || !editor.contains(selRoot)) return undefined;

    const node = selRoot;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement | null);
    if (!el) return undefined;

    const block = el.closest("p,h1,h2,h3,h4,h5,h6,blockquote,div,li") as HTMLElement | null;
    if (!block) return undefined;

    const align = block.style.textAlign;
    if (align === "center" || align === "right") return align as "center" | "right";
    return "left";
};

function linkifyTextNode(textNode: Text) {
    const text = textNode.nodeValue || "";
    if (!URL_REGEX.test(text)) return;

    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    text.replace(URL_REGEX, (match, _p1, _p2, offset) => {
        if (offset > lastIdx) {
            frag.appendChild(document.createTextNode(text.slice(lastIdx, offset)));
        }

        let href = match;
        if (!/^https?:\/\//i.test(href)) {
            href = href.startsWith("www.") ? `https://${href}` : `https://${href}`;
        }

        const a = document.createElement("a");
        a.href = href;
        a.textContent = match;
        a.style.color = "#2563eb";
        a.style.textDecoration = "underline";
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        frag.appendChild(a);
        lastIdx = offset + match.length;
        return match;
    });

    if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }

    textNode.replaceWith(frag);
}

function walkAndLinkify(root: Node) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    const toProcess: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
        toProcess.push(n as Text);
    }
    toProcess.forEach(linkifyTextNode);
}

export function autoLinkInEditor(editor: HTMLElement) {
    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0) {
        range = sel.getRangeAt(0).cloneRange();
    }

    walkAndLinkify(editor);

    if (range && sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

export type LinkConfirmFn = (href: string) => Promise<boolean>;
export function attachExternalLinkGuard(
  editor: HTMLElement | null,
  confirmFn?: LinkConfirmFn
): () => void {
  if (!editor) return () => {};

  const _confirmFn: LinkConfirmFn =
    confirmFn ||
    (async (href: string) => {
      return Promise.resolve(window.confirm(`Open external link?\n\n${href}`));
    });

  const applyHover = (a: HTMLElement) => {
    if (a.getAttribute("data-inkspire-hover")) return;
    a.setAttribute("data-inkspire-hover", "1");
    (a as any).__inkspire_prev_style = a.getAttribute("style") || "";
    Object.assign(a.style, HOVER_STYLE);
  };

  const removeHover = (a: HTMLElement) => {
    if (!a.getAttribute("data-inkspire-hover")) return;
    a.removeAttribute("data-inkspire-hover");
    const prev = (a as any).__inkspire_prev_style;
    if (typeof prev === "string") a.setAttribute("style", prev || "");
    else a.removeAttribute("style");
    delete (a as any).__inkspire_prev_style;
  };
  const onClick = async (ev: MouseEvent) => {
    // Ignore if event already prevented
    if (ev.defaultPrevented) return;

    const target = ev.target as Element | null;
    if (!target) return;
    const anchor = (target.closest && target.closest("a")) as HTMLAnchorElement | null;
    if (!anchor || !editor.contains(anchor)) return;

    try {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        if (range && range.intersectsNode && range.intersectsNode(anchor)) {
          return;
        }
      }
    } catch (err) {
      console.log(err);
    }

    const href = anchor.getAttribute("href") || "";
    if (!href) return;
    ev.preventDefault();
    ev.stopPropagation();

    try {
      const ok = await _confirmFn(href);
      if (ok) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.warn("Link guard confirmFn failed", err);
    }
  };

  const onPointerEnter = (ev: PointerEvent) => {
    const target = ev.target as Element | null;
    if (!target) return;
    const a = (target.closest && target.closest("a")) as HTMLElement | null;
    if (!a || !editor.contains(a)) return;
    applyHover(a);
  };
  const onPointerLeave = (ev: PointerEvent) => {
    const target = ev.target as Element | null;
    if (!target) return;
    const a = (target.closest && target.closest("a")) as HTMLElement | null;
    if (!a || !editor.contains(a)) return;
    removeHover(a);
  };

  const onTouchStart = (ev: TouchEvent) => {
    const t = ev.target as Element | null;
    if (!t) return;
    const a = (t.closest && t.closest("a")) as HTMLElement | null;
    if (!a || !editor.contains(a)) return;
    a.style.opacity = "0.95";
    setTimeout(() => {
      try { a.style.opacity = ""; } catch (e) {}
    }, 250);
  };
  editor.addEventListener("click", onClick, true);
  editor.addEventListener("pointerenter", onPointerEnter, true);
  editor.addEventListener("pointerleave", onPointerLeave, true);
  editor.addEventListener("touchstart", onTouchStart, { passive: true });
  const cleanup = () => {
    try {
      editor.removeEventListener("click", onClick, true);
      editor.removeEventListener("pointerenter", onPointerEnter, true);
      editor.removeEventListener("pointerleave", onPointerLeave, true);
      editor.removeEventListener("touchstart", onTouchStart as EventListener, { passive: true } as any);
      const anchors = editor.querySelectorAll("a[data-inkspire-hover]");
      anchors.forEach((a) => removeHover(a as HTMLElement));
    } catch (err) {
        console.log(err)
    }
  };

  return cleanup;
}



export function handlePasteSanitize(
    e: React.ClipboardEvent<HTMLDivElement>
): void {
    e.preventDefault();
    const clipboard = e.clipboardData;
    const html = clipboard.getData("text/html");
    const txt = clipboard.getData("text/plain");

    const cleaned = html
        ? sanitizeHtml(html)
        : (txt || "").replace(/\u00A0/g, " ");

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const temp = document.createElement("div");
    temp.innerHTML = cleaned;
    const frag = document.createDocumentFragment();
    let node: ChildNode | null;
    while ((node = temp.firstChild)) {
        frag.appendChild(node);
    }
    range.insertNode(frag);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(range.endContainer);
    newRange.collapse(false);
    sel.addRange(newRange);
}

