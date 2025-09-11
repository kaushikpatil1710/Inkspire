
import React from "react";

export type Theme = {
  darkMode: boolean;
};

export const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 12,
  flexWrap: "wrap",
};

export const btnBase: React.CSSProperties = {
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

export const btnActive = (theme: Theme): React.CSSProperties => ({
  ...btnBase,
  background: theme.darkMode ? "#2b6cb0" : "#2b6cb0",
});

export const selectBase: React.CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1.2,
  userSelect: "none",
  outline: "none",
  width: "60px",
  textOverflow: "ellipsis",
};

export const pageStyle = (theme: Theme): React.CSSProperties => ({
  fontFamily: "Inter, system-ui, sans-serif",
  color: theme.darkMode ? "#f5f5f5" : "#111",
  background: theme.darkMode ? "#0f1216" : "#fafafa",
  minHeight: "100vh",
  padding: 20,
});

export const editorBox = (theme: Theme): React.CSSProperties => ({
  border: "1px solid #d0d7de",
  background: theme.darkMode ? "#111418" : "#fff",
  color: theme.darkMode ? "#f5f5f5" : "#111",
  borderRadius: 10,
  padding: 16,
  minHeight: 220,
  textAlign: "left",
  outline: "none",
  marginBottom: 24,
  boxShadow: theme.darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
  direction: "ltr", 
});

export const toggleBtn = (theme: Theme): React.CSSProperties => ({
  padding: "8px 12px",
  border: "1px solid #d0d7de",
  borderRadius: 8,
  background: theme.darkMode ? "#222" : "#fff",
  color: theme.darkMode ? "#eee" : "#111",
  cursor: "pointer",
  marginBottom: 20,
});

export const previewsWrap: React.CSSProperties = {
  display: "flex",
  gap: "20px",
  justifyContent: "center",
  marginTop: 20,
};

export const desktopShell = (theme: Theme): React.CSSProperties => ({
  width: 600,
  border: "1px solid #ccc",
  borderRadius: 12,
  overflow: "hidden",
  background: theme.darkMode ? "#111418" : "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
});

export const browserBar = (theme: Theme): React.CSSProperties => ({
  background: theme.darkMode ? "#1b1f24" : "#f5f5f5",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid #ccc",
});

export const phoneShell = (theme: Theme): React.CSSProperties => ({
  width: 375,
  border: "1px solid #ccc",
  borderRadius: 24,
  background: theme.darkMode ? "#111418" : "#fff",
  overflow: "hidden",
  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
});

export const phoneBar = (theme: Theme): React.CSSProperties => ({
  background: theme.darkMode ? "#1b1f24" : "#f5f5f5",
  padding: "6px",
  textAlign: "center",
});

export const previewContent = (theme: Theme): React.CSSProperties => ({
  padding: 16,
  minHeight: 300,
  lineHeight: 1.6,
  color: theme.darkMode ? "#f5f5f5" : "#111",
  textAlign: "left",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
});


export  const HEADING_STYLES: Record<string, Partial<CSSStyleDeclaration>> = {
    h1: { fontSize: "2rem", fontWeight: "700", margin: "0.6em 0 0.4em" },
    h2: { fontSize: "1.5rem", fontWeight: "700", margin: "0.6em 0 0.4em" },
    h3: { fontSize: "1.25rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    h4: { fontSize: "1.125rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    h5: { fontSize: "1rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    h6: { fontSize: "0.95rem", fontWeight: "600", margin: "0.6em 0 0.4em" },
    p: { fontSize: "1rem", fontWeight: "400", margin: "0.6em 0 0.6em" },
    blockquote: { margin: "1em 1.5em", paddingLeft: "1em", borderLeft: "3px solid #d0d7de" },
  };