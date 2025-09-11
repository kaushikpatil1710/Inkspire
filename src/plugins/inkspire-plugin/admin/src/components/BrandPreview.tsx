import React, { useEffect, useRef, useState } from "react";
import {
  Theme,
  toolbarStyle,
  btnBase,
  btnActive,
  selectBase,
  pageStyle,
  editorBox,
  toggleBtn,
  previewsWrap,
  desktopShell,
  browserBar,
  phoneShell,
  phoneBar,
  previewContent,
  HEADING_STYLES
} from "./styled";
import { createSelectionHelpers } from "../utils/Selection";
import { collectBlocksInRange, isInside } from "../utils/Dom";
import { getActiveAlignment, getActiveHeading, getActiveBlockTag, getActiveFontFamily, getActiveListType, isInlineActive, autoLinkInEditor, handlePasteSanitize, attachExternalLinkGuard } from "../utils/StateReaders";
import ConfirmExternalLink from "./Alert";
/* =========================
   Types & Toolbar state
   ========================= */
type ListType = "ul" | "ol" | undefined;
type HeadingType = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | undefined;

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  list?: ListType;
  block?: string;
  underline: boolean; // "P","H1","BLOCKQUOTE","UL","OL"
  heading?: HeadingType; // normalized for dropdown
  fontFamily?: string;
  alignment?: "left" | "center" | "right";
}
interface BrandPreviewProps {
  name: string;
  value: { html: string } | null;
  onChange: (event: { target: { name: string; value: any; type?: "json" } }) => void;
}

interface ToolbarProps {
  onCommand: (cmd: string, val?: string) => void;
  active: ToolbarState;
  theme: Theme; // new prop
}



/* =========================
   Toolbar (inline styles kept)
   ========================= */
const Toolbar: React.FC<ToolbarProps> = ({ onCommand, active, theme }) => {
  const handleBtn = (cmd: string, val?: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onCommand(cmd, val);
  };


  return (
    <div style={toolbarStyle}>
      <button
        style={active.bold ? (theme ? btnActive(theme) : btnBase) : btnBase}
        onClick={handleBtn("bold")}
        aria-pressed={active.bold}
        aria-label="Bold"
      >
        B
      </button>
      <button
        style={active.italic ? (theme ? btnActive(theme) : btnBase) : btnBase}
        onClick={handleBtn("italic")}
        aria-pressed={active.italic}
        aria-label="Italic"
      >
        I
      </button>

      <button
        style={active.underline ? (theme ? btnActive(theme) : btnBase) : btnBase}
        onClick={handleBtn("underline")}
        aria-pressed={active.underline}
        aria-label="Underline"
      >
        U
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
        style={active.block === "BLOCKQUOTE" ? (theme ? btnActive(theme) : btnBase) : btnBase}
        onClick={handleBtn("block", "blockquote")}
        aria-pressed={active.block === "BLOCKQUOTE"}
      >
        ❝ Quote
      </button>

      {/* Alignment dropdown */}
      <select
        style={selectBase}
        title="Alignment"
        value={active.alignment ?? ""}
        onChange={(e) => {
          const val = e.target.value as "left" | "center" | "right" | "";
          if (!val) return;
          onCommand("align", val);
        }}
      >
        <option value="">Align</option>
        <option value="left">⬅ Left</option>
        <option value="center">⬍ Center</option>
        <option value="right">➡ Right</option>
      </select>


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
  const theme: Theme = { darkMode };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const confirmResolverRef = useRef<((ok: boolean) => void) | null>(null);
  const [active, setActive] = useState<ToolbarState>({
    bold: false,
    italic: false,
    list: undefined,
    underline: false,
    block: "P",
    heading: "p",
    fontFamily: undefined,
  });

  const editorRef = useRef<HTMLDivElement | null>(null);
  const {
    saveSelection,
    restoreSelection,
    clearSavedSelection,
  } = React.useMemo(() => createSelectionHelpers(editorRef), [editorRef])

  const showConfirmForHref = (href: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingHref(href);
      confirmResolverRef.current = resolve;
      setConfirmOpen(true);
    });
  };

  // when the modal closes, resolver is called
  const handleConfirmClose = (result: boolean) => {
    setConfirmOpen(false);
    const r = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setPendingHref(null);
    if (r) r(result);
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
    if (isInside(editorRef.current!, "pre")) return; // don't retag inside code blocks
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
    if (isInside(editorRef.current!, "pre")) return; // don't list-wrap code
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

  const applyAlignment = (alignment: "left" | "center" | "right") => {
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !editor) return;

    const range = sel.getRangeAt(0);
    const block = range.startContainer.parentElement;

    if (block && editor.contains(block)) {
      (block as HTMLElement).style.textAlign = alignment;
    }
  };
  const updateToolbarState = () => {
    const editor = editorRef.current
    const block = getActiveBlockTag(editor);
    const list = getActiveListType(editor);
    const alignment = getActiveAlignment(editor);
    const underline = isInlineActive(editor, ["U", "UNDERLINE"]);
    const bold = isInlineActive(editor, ["STRONG", "B"]);
    const italic = isInlineActive(editor, ["EM", "I"]);
    const heading = getActiveHeading(editor);
    const fontFamily = getActiveFontFamily(editor);

    setActive({ bold, italic, underline, list, block, heading, fontFamily, alignment });
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
    document.addEventListener("selectionchange", onInteract);
    return () => {
      ed.removeEventListener("mouseup", onInteract);
      ed.removeEventListener("keyup", onInteract);
      ed.removeEventListener("input", onInteract);
      document.removeEventListener("selectionchange", onInteract);
      clearSavedSelection();
    };
  }, [saveSelection, clearSavedSelection]);

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

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const cleanup = attachExternalLinkGuard(ed, showConfirmForHref);
    return () => cleanup();
  }, [editorRef.current]);

  // --- MODIFICATION: REMOVED the `handleInput` function ---

  // ---------- Command dispatcher ----------
  const onCommand = (cmd: string, val?: string) => {
    // keep focus & selection alive
    editorRef.current?.focus();
    restoreSelection();
    saveSelection();
    updateToolbarState();

    switch (cmd) {
      // Inline
      case "bold":
        // using execCommand for inline toggles is still the least painful cross-browser option
        try { document.execCommand("bold", false); } catch { }
        break;

      case "italic":
        try { document.execCommand("italic", false); } catch { }
        break;
      case "underline":
        try { document.execCommand("underline", false); } catch { }
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

      case "align":
        if (val) applyAlignment(val as "left" | "center" | "right");
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
    <div style={pageStyle(theme)}>
      <Toolbar onCommand={onCommand} active={active} theme={theme} />

      <div
        id="editor"
        ref={editorRef}
        style={editorBox(theme)}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(e) => {
          const newHtml = (e.target as HTMLDivElement).innerHTML;
          const editor = editorRef.current;
          if (!editor) return;
          autoLinkInEditor(editor);
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
        onPaste={(e) => {
          handlePasteSanitize(e);
          // Let paste happen first, then linkify on next tick
          requestAnimationFrame(() => {
            const editor = editorRef.current;
            if (!editor) return;
            autoLinkInEditor(editor);
            const newHtml = editor.innerHTML;
            setHtml(newHtml);
            onChange({ target: { name, value: { html: newHtml }, type: "json" } });
          });
        }}
      />

      <button style={toggleBtn(theme)} onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "🌙 Dark" : "☀️ Light"}
      </button>

      <div style={previewsWrap}>
        <div style={desktopShell(theme)}>
          <div style={browserBar(theme)}>📸</div>
          <div style={previewContent(theme)} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div style={phoneShell(theme)}>
          <div style={phoneBar(theme)}>───</div>
          <div
            style={{ ...previewContent, minHeight: 500 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <ConfirmExternalLink open={confirmOpen} href={pendingHref} onClose={handleConfirmClose} />
    </div>
  );
};
export default BrandPreview;