"use client";
import React from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism.css";

export default function ClientOnlyEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Editor
      value={value}
      onValueChange={onChange}
      highlight={code => Prism.highlight(code, Prism.languages.sql, "sql")}
      padding={12}
      style={{
        fontFamily: "Fira Mono, monospace",
        fontSize: 15,
        minHeight: 90,
        outline: "none",
        background: "inherit",
        color: "#222",
      }}
      textareaId="sql-editor"
      placeholder="Type your SQL query here..."
    />
  );
}
