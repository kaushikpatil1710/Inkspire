import React, { useEffect } from "react";
import { backdropStyle,panelStyle,footerStyle } from "./styled";
type Props = {
    open: boolean;
    href?: string | null;
    onClose: (result: boolean) => void;
};

export default function ConfirmExternalLink({ open, href, onClose }: Props) {
  // trap Escape key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" style={backdropStyle} onClick={() => onClose(false)}>
      <div
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="confirm-external-link-title"
      >
        <h3 id="confirm-external-link-title" style={{ margin: 0 }}>
          Open external link
        </h3>

        <p style={{ marginTop: 12 }}>
          You are about to open external link:
        </p>
        <p style={{ wordBreak: "break-all", color: "#0b5fff", marginTop: 4 }}>
          {href}
        </p>

        <div style={footerStyle}>
          <button
            onClick={() => onClose(false)}
            style={{
              padding: "8px 12px",
              background: "#f3f4f6",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(true)}
            style={{
              padding: "8px 12px",
              background: "#2563eb",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            Open link
          </button>
        </div>
      </div>
    </div>
  );
}

