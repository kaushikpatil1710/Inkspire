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
  block?: string;        // "P","H1","BLOCKQUOTE","UL","OL"
  heading?: HeadingType; // normalized for dropdown
  fontFamily?: string;
}
interface BrandPreviewProps {
  name: string;
  value: { html: string } | null;
  onChange: (event: { target: { name: string; value: any; type?: "json" } }) => void;
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
        onClick={handleBtn("bold")}
        aria-pressed={active.bold}
        aria-label="Bold"
      >
        B
      </button>
      <button
        style={active.italic ? btnActive : btnBase}
        onClick={handleBtn("italic")}
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

      {/* Font family */}
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
        <option value="cursive">Cursive</option>
      </select>

      <button style={btnBase} onClick={handleBtn("codeblock")}>{"</> Code"}</button>
      <button
        style={active.block === "BLOCKQUOTE" ? btnActive : btnBase}
        onClick={handleBtn("block", "blockquote")}
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
const BrandPreview: React.FC<BrandPreviewProps> = ({ name, value, onChange }) => {
  const initialHtml = `<h2>Your Brand Story</h2><p>Start writing here...</p>`;
  const [darkMode, setDarkMode] = useState(false);
  const [html, setHtml] = useState<string>(value?.html ?? initialHtml);
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

  const toEditorBlock = (node: Node, editor: HTMLElement): HTMLElement | null => {
    let el: HTMLElement | null =
      node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement) : (node as HTMLElement);
    while (el && el.parentElement !== editor) el = el.parentElement as HTMLElement;
    return el && el.parentElement === editor ? el : null;
  };

  const collectBlocksInRange = (editor: HTMLElement, range: Range): HTMLElement[] => {
    const start = toEditorBlock(range.startContainer, editor);
    const end = toEditorBlock(range.endContainer, editor);
    if (!start || !end) return [];
    const blocks: HTMLElement[] = [];
    let cur: HTMLElement | null = start;
    while (cur) {
      blocks.push(cur);
      if (cur === end) break;
      cur = cur.nextElementSibling as HTMLElement;
    }
    return blocks;
  };

  const isInside = (selector: string): boolean => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return false;
    const node = sel.anchorNode;
    if (!node || !editor.contains(node)) return false;
    const el = node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null);
    return !!el?.closest(selector);
  };

  /* ---------- Visual defaults for headings/lists (inline; minimal) ---------- */
  const HEADING_STYLES: Record<string, Partial<CSSStyleDeclaration>> = {
    h1: { fontSize: "2rem", fontWeight: "700", margin: "0.6em 0 0.4em" },
    h2: { fontSize: "1.5rem", fontWeight: "700", margin: "0.6em 0 0.4em" },
    h3: { fontSize: "1.25rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    h4: { fontSize: "1.125rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    h5: { fontSize: "1rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    h6: { fontSize: "0.95rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    p: { fontSize: "1rem", fontWeight: "400", margin: "0.6em 0 0.6em" },
    blockquote: { margin: "1em 1.5em", paddingLeft: "1em", borderLeft: "3px solid #d0d7de" },
  };

  // --- MODIFICATION: REMOVE `updateHtmlFromEditor` ---
  // We will now read from the DOM directly when needed.

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
    // MODIFICATION: REMOVED `updateHtmlFromEditor()` here
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
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);

    // MODIFICATION: REMOVED `updateHtmlFromEditor()` here
  };

  const applyFont = (fontFamily: string) => wrapInline("span", { fontFamily });

  // Replace selected blocks with a new tag (p, h1..h6, blockquote)
  const applyBlockFormat = (tag: string) => {
    if (isInside("pre")) return; // don't retag inside code blocks
    restoreSelection();
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !editor) return;

    const range = sel.getRangeAt(0);
    const blocks = collectBlocksInRange(editor, range);
    if (blocks.length === 0) return;

    blocks.forEach((blk) => {
      const current = blk.tagName.toLowerCase();
      if (current === tag.toLowerCase()) return;

      const replacement = document.createElement(tag);
      while (blk.firstChild) replacement.appendChild(blk.firstChild);

      const styles = HEADING_STYLES[tag.toLowerCase()];
      if (styles) Object.assign(replacement.style, styles);

      blk.replaceWith(replacement);
    });

    // MODIFICATION: REMOVED `updateHtmlFromEditor()` here
  };

  // Wrap selected blocks into a list (ul/ol)
  const applyList = (listType: "ul" | "ol") => {
    if (isInside("pre")) return; // don't list-wrap code
    restoreSelection();
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !editor) return;

    const range = sel.getRangeAt(0);
    const blocks = collectBlocksInRange(editor, range);
    if (blocks.length === 0) return;

    const list = document.createElement(listType);
    list.style.listStyleType = listType === "ul" ? "disc" : "decimal";
    list.style.paddingLeft = "1.25rem";
    list.style.margin = "0.6em 0 0.6em";

    blocks.forEach((blk) => {
      const li = document.createElement("li");
      while (blk.firstChild) li.appendChild(blk.firstChild);
      list.appendChild(li);
    });

    const anchor = blocks[0];
    anchor.parentElement?.insertBefore(list, anchor);
    blocks.forEach((b) => b.remove());

    // MODIFICATION: REMOVED `updateHtmlFromEditor()` here
  };

  /* ---------- State readers ---------- */
  const getActiveBlockTag = (): string | undefined => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return undefined;

    const node = sel.anchorNode;
    if (!node || !editor.contains(node)) return undefined;

    const el =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : (node.parentElement as HTMLElement | null);

    if (!el) return undefined;

    const block = el.closest("ul,ol,blockquote,h1,h2,h3,h4,h5,h6,p,div,li") as HTMLElement | null;
    if (!block) return undefined;

    if (block.tagName === "LI" && block.parentElement) {
      return block.parentElement.tagName; // "UL" or "OL"
    }
    return block.tagName; // "P","H2","BLOCKQUOTE", etc.
  };

  const blockTagToHeading = (tag?: string): HeadingType => {
    if (!tag) return undefined;
    const t = tag.toUpperCase();
    if (t === "P" || t === "DIV") return "p";
    if (/^H[1-6]$/.test(t)) return t.toLowerCase() as HeadingType;
    return undefined;
  };

  const getActiveHeading = (): HeadingType => {
    const tag = getActiveBlockTag();
    if (!tag) return undefined;
    if (tag === "BLOCKQUOTE" || tag === "UL" || tag === "OL") return undefined;
    return blockTagToHeading(tag);
  };

  const getActiveListType = (): ListType => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return undefined;

    const node = sel.anchorNode;
    if (!node || !editor.contains(node)) return undefined;

    const el = node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null);

    if (!el) return undefined;

    const list = el.closest("ul,ol") as HTMLElement | null;
    if (!list) return undefined;
    return list.tagName === "UL" ? "ul" : "ol";
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

  const isInlineActive = (tags: string[]) => {
    const editor = editorRef.current;
    const root = getSelectionRoot();
    if (!editor || !root || !editor.contains(root)) return false;

    const el = findAncestor(root, (e) => tags.includes(e.tagName), editor);
    if (el) return true;

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

  const updateToolbarState = () => {
    const block = getActiveBlockTag();
    const list = getActiveListType();
    const bold = isInlineActive(["STRONG", "B"]);
    const italic = isInlineActive(["EM", "I"]);
    const heading = getActiveHeading();
    const fontFamily = getActiveFontFamily();

    setActive({ bold, italic, list, block, heading, fontFamily });
  };

  /* ---------- Events ---------- */
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const onInteract = () => {
      saveSelection();
      updateToolbarState();
    };
    // --- MODIFICATION: ADD onInput listener to update toolbar state ---
    // We still need this to keep the toolbar in sync with selection,
    // but we no longer use it to manage the component's state.
    ed.addEventListener("mouseup", onInteract);
    ed.addEventListener("keyup", onInteract);
    ed.addEventListener("input", onInteract);
    document.addEventListener("selectionchange", updateToolbarState);
    return () => {
      ed.removeEventListener("mouseup", onInteract);
      ed.removeEventListener("keyup", onInteract);
      ed.removeEventListener("input", onInteract);
      document.removeEventListener("selectionchange", updateToolbarState);
    };
  }, []);

  // --- MODIFICATION: Initialize the editor's content from the value prop ---
  useEffect(() => {
    const ed = editorRef.current;
    if (ed) {
      // Only set innerHTML if it's different from the current value to avoid re-renders
      if (ed.innerHTML !== (value?.html ?? initialHtml)) {
        ed.innerHTML = value?.html ?? initialHtml;
      }
    }
    updateToolbarState();
  }, [value, initialHtml]);

  // --- MODIFICATION: REMOVED the `handleInput` function ---

  // ---------- Command dispatcher ----------
  const onCommand = (cmd: string, val?: string) => {
    // keep focus & selection alive
    editorRef.current?.focus();
    restoreSelection();

    switch (cmd) {
      // Inline
      case "bold":
        // using execCommand for inline toggles is still the least painful cross-browser option
        try { document.execCommand("bold", false); } catch { }
        break;

      case "italic":
        try { document.execCommand("italic", false); } catch { }
        break;

      case "code":
        wrapInline("code");
        break;

      // Blocks
      case "block":
        if (val) applyBlockFormat(val); // "p" | "h1".."h6" | "blockquote"
        break;

      case "codeblock":
        insertCodeBlock();
        break;

      // Lists
      case "list":
        if (val === "ul" || val === "ol") applyList(val);
        break;

      // Font
      case "font":
        if (val) applyFont(val);
        break;

      default:
        // shrug
        break;
    }

    // --- MODIFICATION: Read and sync the DOM content to the parent onChange handler ---
    const ed = editorRef.current;
    if (ed) {
      const newHtml = ed.innerHTML;
      // This syncs the component's internal state for preview and the parent's value
      onChange({
        target: { name, value: { html: newHtml }, type: "json" },
      });
    }

    // sync toolbar and selection
    saveSelection();
    updateToolbarState();
  };

  // --- MODIFICATION: Create a new state to handle the preview HTML ---
  // This is separate from the editor's content and is updated via the onChange prop.
  const [previewHtml, setPreviewHtml] = useState<string>(value?.html ?? initialHtml);

  useEffect(() => {
    setPreviewHtml(value?.html ?? initialHtml);
  }, [value, initialHtml]);

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
    outline: "none",
    marginBottom: 24,
    boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",

    direction: "ltr",          // ✅ only direction, no bidi override
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

  // --- MODIFICATION: Sync content on blur to handle un-forced changes ---
  const handleBlur = () => {
    const ed = editorRef.current;
    if (ed) {
      onChange({
        target: { name, value: { html: ed.innerHTML }, type: "json" },
      });
    }
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
        spellCheck={false}
        onInput={(e) => {
          const newHtml = (e.target as HTMLDivElement).innerHTML;
          setHtml(newHtml); // ✅ keeps preview live
          onChange({
            target: { name, value: { html: newHtml }, type: "json" },
          });
        }}
        onBlur={() => {
          // optional: re-sync on blur if needed
          if (editorRef.current) {
            const finalHtml = editorRef.current.innerHTML;
            setHtml(finalHtml);
            onChange({
              target: { name, value: { html: finalHtml }, type: "json" },
            });
          }
        }}
      />

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
          <div
            style={{ ...previewContent, minHeight: 500 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
};

export default BrandPreview;