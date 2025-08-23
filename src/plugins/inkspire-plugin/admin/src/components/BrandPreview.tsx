import React, { useEffect, useRef, useState } from "react";

/* =========================
   Types & Toolbar state
   ========================= */
type ListType = "ul" | "ol" | undefined;
type HeadingType = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | undefined;

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  list?: ListType;
  block?: string;        // "P","H1","BLOCKQUOTE","UL","OL"
  heading?: HeadingType; // normalized for dropdown
  fontFamily?: string;
}

/* =========================
   Toolbar (inline styles kept)
   ========================= */
const Toolbar: React.FC<{
  onCommand: (cmd: string, val?: string) => void;
  active: ToolbarState;
}> = ({ onCommand, active }) => {
  const toolbarStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  };

  const btnBase: React.CSSProperties = {
    padding: "8px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    userSelect: "none",
    transition: "background .15s ease, color .15s ease",
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "#2b6cb0",
    borderColor: "#2b6cb0",
  };

  const selectBase: React.CSSProperties = {
    padding: "8px 10px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    color: "#111",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    userSelect: "none",
    outline: "none",
  };

  const handleBtn = (cmd: string, val?: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onCommand(cmd, val);
  };

  return (
    <div style={toolbarStyle}>
      <button
        style={active.bold ? btnActive : btnBase}
        onMouseDown={handleBtn("bold")}
        aria-pressed={active.bold}
        aria-label="Bold"
      >
        B
      </button>
      <button
        style={active.italic ? btnActive : btnBase}
        onMouseDown={handleBtn("italic")}
        aria-pressed={active.italic}
        aria-label="Italic"
      >
        I
      </button>

      {/* Headings dropdown (controlled) */}
      <select
        style={selectBase}
        title="Headings"
        value={active.heading ?? ""}
        onChange={(e) => {
          const val = e.target.value as HeadingType | "";
          if (!val) return;
          onCommand("block", val);
        }}
      >
        <option value="">Heading</option>
        <option value="p">Paragraph</option>
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
        <option value="h4">H4</option>
        <option value="h5">H5</option>
        <option value="h6">H6</option>
      </select>

      {/* Lists dropdown (controlled) */}
      <select
        style={selectBase}
        title="Lists"
        value={active.list ?? ""}
        onChange={(e) => {
          const val = e.target.value as "ul" | "ol" | "";
          if (!val) return;
          onCommand("list", val);
        }}
      >
        <option value="">List</option>
        <option value="ul">• Unordered</option>
        <option value="ol">1. Ordered</option>
      </select>

      {/* Font dropdown (fire-and-forget; label reflects current) */}
      <select
        style={selectBase}
        title="Font family"
        value=""
        onChange={(e) => {
          const val = e.target.value;
          if (!val) return;
          onCommand("font", val);
        }}
      >
        <option value="">{active.fontFamily ? `Font: ${active.fontFamily}` : "Font"}</option>
        <option value="Times New Roman, Times, serif">Times New Roman</option>
        <option value="Arial, Helvetica, sans-serif">Arial</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Courier New, Courier, monospace">Courier New</option>
      </select>

      <button style={btnBase} onMouseDown={handleBtn("codeblock")}>{"</> Code"}</button>
      <button
        style={active.block === "BLOCKQUOTE" ? btnActive : btnBase}
        onMouseDown={handleBtn("block", "blockquote")}
        aria-pressed={active.block === "BLOCKQUOTE"}
      >
        ❝ Quote
      </button>
    </div>
  );
};

/* =========================
   Main Component
   ========================= */
const BrandPreview: React.FC = () => {
  const initialHtml = `<h2>Your Brand Story</h2><p>Start writing here...</p>`;
  const [html, setHtml] = useState<string>(initialHtml);
  const [darkMode, setDarkMode] = useState(false);
  const [active, setActive] = useState<ToolbarState>({
    bold: false,
    italic: false,
    list: undefined,
    block: "P",
    heading: "p",
    fontFamily: undefined,
  });

  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  /* ---------- Selection utils ---------- */
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    const r = savedRangeRef.current;
    if (!sel || !r) return;
    editorRef.current?.focus();
    sel.removeAllRanges();
    sel.addRange(r.cloneRange());
  };

  /* ---------- DOM helpers ---------- */
  const isElement = (n: Node | null): n is HTMLElement =>
    !!n && n.nodeType === Node.ELEMENT_NODE;

  const getSelectionRoot = () => {
    const sel = window.getSelection();
    return sel && sel.rangeCount > 0 ? (sel.anchorNode as Node | null) : null;
  };

  // Lift to direct editor child block
  const getEditorBlock = (node: Node, editor: HTMLElement): HTMLElement | null => {
    let el = node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement) : (node as HTMLElement);
    while (el && el !== editor && el.parentElement !== editor) el = el.parentElement as HTMLElement;
    return el && el !== editor ? el : null;
  };

  const getSelectedEditorBlocks = (
    editor: HTMLElement,
    range: Range
  ): { start: HTMLElement; end: HTMLElement } | null => {
    const start = getEditorBlock(range.startContainer, editor);
    const end = getEditorBlock(range.endContainer, editor);
    if (!start || !end) return null;
    return { start, end };
  };

  const moveRangeInto = (start: HTMLElement, end: HTMLElement, target: HTMLElement): void => {
    let cur: Node | null = start;
    while (cur) {
      const next: Node | null = cur.nextSibling;
      target.appendChild(cur);
      if (cur === end) break;
      cur = next;
    }
  };

  const unwrapBlockquote = (bq: HTMLElement) => {
    const parent = bq.parentElement!;
    const ref = bq;
    while (bq.firstChild) parent.insertBefore(bq.firstChild, ref);
    parent.removeChild(bq);
  };

  const findAncestor = (
    start: Node | null,
    predicate: (el: HTMLElement) => boolean,
    stopAt?: HTMLElement | null
  ) => {
    let n: Node | null = start;
    while (n && n !== stopAt) {
      if (isElement(n) && predicate(n)) return n;
      n = n.parentNode;
    }
    return null;
  };

  // --- heading marker patterns ---
  const LEADING_H_MARK = /^(h[1-6]\)\s*)/i;
  const TRAILING_H_MARK = /(\s*\(h[1-6]\))$/i;

  const stripHeadingMarkersOnBlock = (block: HTMLElement) => {
    // strip leading "hX) " from first text node
    const first = block.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
      (first as Text).data = (first as Text).data.replace(LEADING_H_MARK, "");
      if ((first as Text).data === "") first.parentNode?.removeChild(first);
    }
    // strip trailing " (hX)" from last text node
    const last = block.lastChild;
    if (last && last.nodeType === Node.TEXT_NODE) {
      (last as Text).data = (last as Text).data.replace(TRAILING_H_MARK, "");
      if ((last as Text).data === "") last.parentNode?.removeChild(last);
    }
  };

  // Apply required heading style as literal markers.
  // Rule per your example: h1 is prefix "h1) ", others are suffix " (hN)"
  const applyHeadingMarkersToBlock = (block: HTMLElement, tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
    stripHeadingMarkersOnBlock(block);

    if (tag === "h1") {
      // prefix "h1) "
      block.insertBefore(document.createTextNode(`${tag}) `), block.firstChild);
    } else {
      // suffix " (hN)"
      block.appendChild(document.createTextNode(` (${tag})`));
    }
  };

  const LEADING_NUM_MARK = /^\s*\d+\)\s*/;
  const LEADING_BULLET_MARK = /^\s*•\s*/;

  const stripListMarkerOnBlock = (block: HTMLElement) => {
    const first = block.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
      let data = (first as Text).data;
      data = data.replace(LEADING_NUM_MARK, "");
      data = data.replace(LEADING_BULLET_MARK, "");
      (first as Text).data = data;
      if ((first as Text).data === "") first.parentNode?.removeChild(first);
    }
  };

  // Detect our marker-based heading on a single block
  const detectHeadingFromMarkers = (block: HTMLElement): HeadingType | undefined => {
    const first = block.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
      const m = (first as Text).data.match(/^h([1-6])\)\s*/i);
      if (m) return (`h${m[1]}` as HeadingType);
    }
    const last = block.lastChild;
    if (last && last.nodeType === Node.TEXT_NODE) {
      const m = (last as Text).data.match(/\(h([1-6])\)\s*$/i);
      if (m) return (`h${m[1]}` as HeadingType);
    }
    return undefined;
  };

  // Get marker heading for current selection (falls back to tag-based)
  const getActiveHeading = (): HeadingType => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return undefined;

    const range = sel.getRangeAt(0);
    const blkSel = getSelectedEditorBlocks(editor, range);
    let block: HTMLElement | null = null;

    if (blkSel) block = blkSel.start;
    else block = getEditorBlock(range.startContainer, editor);

    if (!block) return undefined;

    const byMarker = detectHeadingFromMarkers(block);
    if (byMarker) return byMarker;

    // fallback: “p” if block is a normal paragraph-like tag
    const raw = block.tagName.toUpperCase();
    if (raw === "P" || raw === "DIV") return "p";
    if (/^H[1-6]$/.test(raw)) return raw.toLowerCase() as HeadingType;
    return undefined;
  };


  const applyOrderedListMarkers = (blocks: HTMLElement[]) => {
    let i = 1;
    blocks.forEach(b => {
      stripHeadingMarkersOnBlock(b);   // headings shouldn’t conflict with list prefix
      stripListMarkerOnBlock(b);       // avoid duplicates
      b.insertBefore(document.createTextNode(`${i}) `), b.firstChild);
      i += 1;
    });
  };

  const applyUnorderedListMarkers = (blocks: HTMLElement[]) => {
    blocks.forEach(b => {
      stripHeadingMarkersOnBlock(b);
      stripListMarkerOnBlock(b);
      b.insertBefore(document.createTextNode(`• `), b.firstChild);
    });
  };



  /* ---------- State readers (no deprecated APIs) ---------- */
  const getActiveBlockTag = (): string | undefined => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return undefined;
    const node = sel.anchorNode as Node;
    if (!editor.contains(node)) return undefined;

    const el = (node as HTMLElement).closest?.("ul,ol,blockquote,h1,h2,h3,h4,h5,h6,p,div,li") as HTMLElement | null;
    if (!el) return undefined;
    if (el.tagName === "LI" && el.parentElement) return el.parentElement.tagName; // show UL/OL instead of LI
    return el.tagName;
  };

  const getActiveListType = (): ListType => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return undefined;

    const node = sel.anchorNode as Node;
    if (!editor.contains(node)) return undefined;

    // real lists first
    const ancestorList = (node as HTMLElement).closest?.("ul,ol") as HTMLElement | null;
    if (ancestorList) return ancestorList.tagName === "UL" ? "ul" : "ol";

    // marker-based lists
    const block = getEditorBlock(node, editor);
    if (!block) return undefined;

    const first = block.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
      const txt = (first as Text).data;
      if (/^\s*•\s+/.test(txt)) return "ul";
      if (/^\s*\d+\)\s+/.test(txt)) return "ol";
    }
    return undefined;
  };


  const isInlineActive = (tags: string[]) => {
    const editor = editorRef.current;
    const root = getSelectionRoot();
    if (!editor || !root || !editor.contains(root)) return false;

    const el = findAncestor(root, (e) => tags.includes(e.tagName), editor);
    if (el) return true;

    // computed style heuristic
    const nodeEl = findAncestor(root, (e) => !!e, editor) as HTMLElement | null;
    if (!nodeEl) return false;

    if (tags.includes("STRONG") || tags.includes("B")) {
      const fw = window.getComputedStyle(nodeEl).fontWeight;
      const num = parseInt(fw, 10);
      if (fw === "bold" || fw === "bolder" || num >= 600) return true;
    }
    if (tags.includes("EM") || tags.includes("I")) {
      const fs = window.getComputedStyle(nodeEl).fontStyle;
      if (fs === "italic" || fs === "oblique") return true;
    }
    return false;
  };

  const blockTagToHeading = (tag?: string): HeadingType => {
    if (!tag) return undefined;
    const t = tag.toUpperCase();
    if (t === "P" || t === "DIV") return "p";
    if (/^H[1-6]$/.test(t)) return t.toLowerCase() as HeadingType;
    return undefined;
  };

  const getActiveFontFamily = (): string | undefined => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return undefined;
    const node = sel.anchorNode as Node;
    if (!editor.contains(node)) return undefined;

    const el =
      (node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement)) || editor;
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

  const updateToolbarState = () => {
    const block = getActiveBlockTag();     // keep if you still want to show BLOCKQUOTE active state
    const list = getActiveListType();      // we’ll fix list detection next
    const bold = isInlineActive(["STRONG", "B"]);
    const italic = isInlineActive(["EM", "I"]);
    const heading = getActiveHeading();    // << use marker-aware heading
    const fontFamily = getActiveFontFamily();

    setActive({ bold, italic, list, block, heading, fontFamily });
  };


  /* ---------- Editor mutations ---------- */
  const updateHtmlFromEditor = () => {
    const ed = editorRef.current;
    if (ed) setHtml(ed.innerHTML);
  };

  const wrapInline = (tagName: string, style?: Partial<CSSStyleDeclaration>) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      const el = document.createElement(tagName);
      if (style) Object.assign(el.style, style);
      el.appendChild(document.createTextNode(""));
      range.insertNode(el);
      const r = document.createRange();
      r.setStart(el, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    } else {
      const frag = range.extractContents();
      const wrapper = document.createElement(tagName);
      if (style) Object.assign(wrapper.style, style);
      wrapper.appendChild(frag);
      range.insertNode(wrapper);
      const after = document.createRange();
      after.setStartAfter(wrapper);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
    }
    updateHtmlFromEditor();
  };

  const applyHeadingMulti = (tag: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const editor = editorRef.current;
    if (!editor) return;

    // Collect selected blocks
    const blkSel = getSelectedEditorBlocks(editor, range);
    const blocks: HTMLElement[] = [];
    if (blkSel) {
      const { start, end } = blkSel;
      let cur: HTMLElement | null = start;
      while (cur) {
        blocks.push(cur);
        if (cur === end) break;
        cur = cur.nextElementSibling as HTMLElement;
      }
    } else {
      const b = getEditorBlock(range.startContainer, editor);
      if (b) blocks.push(b);
    }
    if (blocks.length === 0) return;

    blocks.forEach(b => {
      // If we hit a list container, convert each LI to a plain block with markers
      if (b.tagName === "UL" || b.tagName === "OL") {
        const items = Array.from(b.children) as HTMLElement[];
        let ref = b;
        items.forEach(li => {
          const p = document.createElement("p");
          // move all children to preserve inline formatting
          while (li.firstChild) p.appendChild(li.firstChild);
          applyHeadingMarkersToBlock(p, tag === "p" ? "h1" : (tag as any)); // if "p", remove markers (see below)
          b.parentElement?.insertBefore(p, ref);
          ref = p;
          if (tag !== "p") {
            applyHeadingMarkersToBlock(p, tag)
          }
        });
        b.remove();
        return;
      }

      // Normal block: either clear markers (for "p") or apply specific hN marker
      if (tag === "p") {
        stripHeadingMarkersOnBlock(b);
      } else {
        applyHeadingMarkersToBlock(b, tag);
      }
    });

    updateHtmlFromEditor();
    saveSelection();
    updateToolbarState();
  };

  const applyListMulti = (listType: "ul" | "ol") => {
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const editor = editorRef.current;
    if (!editor) return;

    // Gather blocks: if selection spans multiple blocks, use them;
    // otherwise split the single block by <br> into multiple paragraphs.
    const blkSel = getSelectedEditorBlocks(editor, range);
    let blocks: HTMLElement[] = [];

    if (blkSel) {
      const { start, end } = blkSel;
      let cur: HTMLElement | null = start;
      while (cur) {
        // Convert list containers to paragraphs per item
        if (cur.tagName === "UL" || cur.tagName === "OL") {
          const items = Array.from(cur.children) as HTMLElement[];
          items.forEach(li => {
            const p = document.createElement("p");
            while (li.firstChild) p.appendChild(li.firstChild);
            cur?.parentElement?.insertBefore(p, cur);
            blocks.push(p);
          });
          const toRemove = cur;
          cur = cur.nextElementSibling as HTMLElement | null;
          toRemove.remove();
          if (!cur || toRemove === end) break;
          continue;
        }
        blocks.push(cur);
        if (cur === end) break;
        cur = cur.nextElementSibling as HTMLElement | null;
      }
    } else {
      const single = getEditorBlock(range.startContainer, editor);
      if (single) {
        // split by <br> into separate <p> siblings to apply markers per line
        const tmp = document.createElement("div");
        tmp.innerHTML = single.innerHTML;
        const parts = tmp.innerHTML.split(/<br\s*\/?>/i).map(s => s.trim());
        if (parts.length > 1) {
          const marker = document.createTextNode("");
          single.parentElement!.insertBefore(marker, single);
          parts.forEach(seg => {
            if (!seg) return;
            const p = document.createElement("p");
            p.innerHTML = seg;
            marker.parentNode!.insertBefore(p, marker);
            blocks.push(p);
          });
          single.remove();
          marker.parentNode!.removeChild(marker);
        } else {
          blocks.push(single);
        }
      }
    }

    if (blocks.length === 0) return;

    if (listType === "ol") applyOrderedListMarkers(blocks);
    else applyUnorderedListMarkers(blocks);
    // if already has markers of the same type, remove them instead
    const already = listType === "ol" ? /^\s*\d+\)\s+/ : /^\s*•\s+/;
    const allHave = blocks.every(b => {
      const first = b.firstChild;
      return first && first.nodeType === Node.TEXT_NODE && already.test((first as Text).data);
    });
    if (allHave) {
      blocks.forEach(stripListMarkerOnBlock);
      updateHtmlFromEditor();
      saveSelection();
      updateToolbarState();
      return;
    }


    updateHtmlFromEditor();
    saveSelection();
    updateToolbarState();
  };


  const insertCodeBlock = () => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    pre.style.border = "1px solid #d0d7de";
    pre.style.borderRadius = "8px";
    pre.style.padding = "12px";
    pre.style.background = "rgba(15,23,42,0.04)";
    pre.style.whiteSpace = "pre";
    pre.style.overflowX = "auto";
    pre.style.fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace";
    if (range.collapsed) code.textContent = "/* code */";
    else code.appendChild(range.extractContents());
    pre.appendChild(code);
    range.insertNode(pre);

    const r = document.createRange();
    r.selectNodeContents(pre);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);

    updateHtmlFromEditor();
  };

  const applyFont = (fontFamily: string) => wrapInline("span", { fontFamily });

  const toggleBlockquote = () => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const editor = editorRef.current;
    if (!editor) return;

    const anchor = sel.anchorNode as Node;
    const bqAncestor = (anchor instanceof Element ? anchor : anchor.parentElement)?.closest("blockquote");
    if (bqAncestor && editor.contains(bqAncestor)) {
      unwrapBlockquote(bqAncestor as HTMLElement);
      updateHtmlFromEditor();
      saveSelection();
      updateToolbarState();
      return;
    }

    const selBlocks = getSelectedEditorBlocks(editor, range);
    if (!selBlocks) return;
    const { start, end } = selBlocks;

    const marker = document.createTextNode("");
    start.parentElement!.insertBefore(marker, start);

    const bq = document.createElement("blockquote");
    bq.style.margin = "1em 1.5em";
    bq.style.paddingLeft = "1em";
    bq.style.borderLeft = "3px solid #d0d7de";
    start.parentElement!.insertBefore(bq, marker);

    moveRangeInto(start, end, bq);
    marker.parentNode?.removeChild(marker);

    const r = document.createRange();
    r.selectNodeContents(bq);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);

    updateHtmlFromEditor();
    saveSelection();
    updateToolbarState();
  };

  /* ---------- Command dispatcher ---------- */
  const onCommand = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    restoreSelection();

    const tryExec = (command: string, value?: string) => {
      try {
        if (value != null) document.execCommand(command, false, value);
        else document.execCommand(command, false);
        return true;
      } catch {
        return false;
      }
    };

    switch (cmd) {
      case "bold":
        tryExec("bold");
        break;
      case "italic":
        tryExec("italic");
        break;
      case "code":
        wrapInline("code");
        break;
      case "codeblock":
        insertCodeBlock();
        break;
      case "block":
        if (!val) break;
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(val)) {
          // ignore execCommand; we’re using markers now
          applyHeadingMulti(val as any);
        } else if (val === "blockquote") {
          // keep your blockquote wrapper if you still want it, or drop it if “quote” is purely visual
          toggleBlockquote();
        }
        break;
      case "list":
        if (val === "ul" || val === "ol") {
          applyListMulti(val);
        }
        break;
      case "font":
        if (val) applyFont(val);
        break;
    }

    updateHtmlFromEditor();
    saveSelection();
    updateToolbarState();
  };

  /* ---------- Events ---------- */
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const onInteract = () => {
      saveSelection();
      updateToolbarState();
    };
    ed.addEventListener("mouseup", onInteract);
    ed.addEventListener("keyup", onInteract);
    ed.addEventListener("input", updateToolbarState);
    document.addEventListener("selectionchange", updateToolbarState);
    return () => {
      ed.removeEventListener("mouseup", onInteract);
      ed.removeEventListener("keyup", onInteract);
      ed.removeEventListener("input", updateToolbarState);
      document.removeEventListener("selectionchange", updateToolbarState);
    };
  }, []);

  useEffect(() => {
    const ed = editorRef.current;
    if (ed && ed.innerHTML.trim() === "") {
      ed.innerHTML = initialHtml;
      setHtml(ed.innerHTML);
    }
    updateToolbarState();
  }, []);

  /* ---------- Inline styles (kept) ---------- */
  const pageStyle: React.CSSProperties = {
    fontFamily: "Inter, system-ui, sans-serif",
    color: darkMode ? "#f5f5f5" : "#111",
    background: darkMode ? "#0f1216" : "#fafafa",
    minHeight: "100vh",
    padding: 20,
  };

  const editorBox: React.CSSProperties = {
    border: "1px solid #d0d7de",
    background: darkMode ? "#111418" : "#fff",
    color: darkMode ? "#f5f5f5" : "#111",
    borderRadius: 10,
    padding: 16,
    minHeight: 220,
    textAlign: "left",
    direction: "ltr",
    outline: "none",
    marginBottom: 24,
    boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
  };

  const toggleBtn: React.CSSProperties = {
    padding: "8px 12px",
    border: "1px solid #d0d7de",
    borderRadius: 8,
    background: darkMode ? "#222" : "#fff",
    color: darkMode ? "#eee" : "#111",
    cursor: "pointer",
    marginBottom: 20,
  };

  const previewsWrap: React.CSSProperties = {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    marginTop: 20,
  };

  const desktopShell: React.CSSProperties = {
    width: 600,
    border: "1px solid #ccc",
    borderRadius: 12,
    overflow: "hidden",
    background: darkMode ? "#111418" : "#fff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  };

  const browserBar: React.CSSProperties = {
    background: darkMode ? "#1b1f24" : "#f5f5f5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: "1px solid #ccc",
  };

  const phoneShell: React.CSSProperties = {
    width: 375,
    border: "1px solid #ccc",
    borderRadius: 24,
    background: darkMode ? "#111418" : "#fff",
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  };

  const phoneBar: React.CSSProperties = {
    background: darkMode ? "#1b1f24" : "#f5f5f5",
    padding: "6px",
    textAlign: "center",
  };

  const previewContent: React.CSSProperties = {
    padding: 16,
    minHeight: 300,
    lineHeight: 1.6,
    color: darkMode ? "#f5f5f5" : "#111",
    textAlign: "left",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  return (
    <div style={pageStyle}>
      <Toolbar onCommand={onCommand} active={active} />

      <div
        id="editor"
        ref={editorRef}
        style={editorBox}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
        spellCheck={false}
        tabIndex={0}
      >
        <h2>Your Brand Story</h2>
        <p>Start writing here...</p>
      </div>

      <button style={toggleBtn} onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "🌙 Dark" : "☀️ Light"}
      </button>

      <div style={previewsWrap}>
        <div style={desktopShell}>
          <div style={browserBar}>📸</div>
          <div style={previewContent} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div style={phoneShell}>
          <div style={phoneBar}>───</div>
          <div style={{ ...previewContent, minHeight: 500 }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
};

export default BrandPreview;
