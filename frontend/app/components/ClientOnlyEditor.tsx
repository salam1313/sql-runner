"use client";
import React, { useEffect, useRef, useState } from "react";

export default function ClientOnlyEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [Editor, setEditor] = useState<any>(null);
  const [Prism, setPrism] = useState<any>(null);
  const prismLoaded = useRef(false);

  useEffect(() => {
    let isMounted = true;
    // Dynamically import editor and prismjs only on client
    Promise.all([
      import("react-simple-code-editor"),
      import("prismjs")
    ]).then(([editorMod, prismMod]) => {
      if (!prismLoaded.current) {
        require("prismjs/components/prism-sql");
        require("prismjs/themes/prism.css");
        prismLoaded.current = true;
      }
      if (isMounted) {
        setEditor(() => editorMod.default);
        setPrism(() => prismMod.default || prismMod);
      }
    });
    return () => { isMounted = false; };
  }, []);

  if (!Editor || !Prism) return null;
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
