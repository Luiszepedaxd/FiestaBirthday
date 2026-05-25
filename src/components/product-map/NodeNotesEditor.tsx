import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "Agrega notas, contexto, decisiones, links importantes sobre este nodo...";

const DEBOUNCE_MS = 800;

export type NodeNotesEditorProps = {
  content: JSONContent | null;
  onChange: (json: JSONContent, plainText: string) => void;
  readOnly?: boolean;
};

function formatSavedAgo(seconds: number): string {
  if (seconds < 5) return "Guardado · hace un momento";
  if (seconds < 60) return `Guardado · hace ${seconds} seg`;
  const mins = Math.floor(seconds / 60);
  return `Guardado · hace ${mins} min`;
}

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, label, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-lg text-[#2E2D2C] hover:bg-accent",
        active && "bg-accent text-[#C6017F]",
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

export function NodeNotesEditor({
  content,
  onChange,
  readOnly = false,
}: NodeNotesEditorProps) {
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedSecondsAgo, setSavedSecondsAgo] = useState<number | null>(null);
  const lastSavedAtRef = useRef<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const markSaved = useCallback(() => {
    lastSavedAtRef.current = Date.now();
    setSavedSecondsAgo(0);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "node-notes-link",
        },
      }),
      Placeholder.configure({ placeholder: PLACEHOLDER }),
    ],
    content: content ?? undefined,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "node-notes-prose min-h-[300px] max-h-[420px] overflow-y-auto px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const json = ed.getJSON();
        const plainText = ed.getText().trim();
        onChangeRef.current(json, plainText);
        markSaved();
      }, DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor || content === undefined) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content ?? { type: "doc", content: [] });
    if (current !== incoming) {
      editor.commands.setContent(content ?? "", false);
    }
  }, [editor, content]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (savedSecondsAgo === null) return;
    const interval = window.setInterval(() => {
      if (lastSavedAtRef.current === null) return;
      const secs = Math.floor((Date.now() - lastSavedAtRef.current) / 1000);
      setSavedSecondsAgo(secs);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [savedSecondsAgo]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] bg-white">
        <div className="h-[300px] animate-pulse rounded-xl bg-[#FAF8F5]" />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-[#E5E5E5] bg-white">
      <style>{`
        .node-notes-editor .node-notes-prose {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .node-notes-editor .node-notes-prose h1 {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0.75rem 0 0.35rem;
          line-height: 1.25;
        }
        .node-notes-editor .node-notes-prose h2 {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0.65rem 0 0.3rem;
          line-height: 1.3;
        }
        .node-notes-editor .node-notes-prose h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem;
        }
        .node-notes-editor .node-notes-prose p {
          margin: 0.35rem 0;
          line-height: 1.55;
          color: #2E2D2C;
        }
        .node-notes-editor .node-notes-prose ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.35rem 0;
        }
        .node-notes-editor .node-notes-prose ol {
          list-style: decimal;
          padding-left: 1.25rem;
          margin: 0.35rem 0;
        }
        .node-notes-editor .node-notes-prose blockquote {
          border-left: 3px solid #E5E5E5;
          padding-left: 0.75rem;
          color: #717B99;
          margin: 0.5rem 0;
        }
        .node-notes-editor .node-notes-prose pre {
          background: #FAF8F5;
          border-radius: 0.5rem;
          padding: 0.75rem;
          font-size: 0.85rem;
          overflow-x: auto;
        }
        .node-notes-editor .node-notes-prose code {
          background: #FAF8F5;
          border-radius: 0.25rem;
          padding: 0.1rem 0.25rem;
          font-size: 0.9em;
        }
        .node-notes-editor .node-notes-prose a.node-notes-link {
          color: #C6017F;
          text-decoration: underline;
          cursor: pointer;
        }
        .node-notes-editor .node-notes-prose p.is-editor-empty:first-child::before {
          color: #A1A1A0;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      {!readOnly && (
        <div className="sticky top-0 z-10 flex flex-wrap gap-0.5 border-b border-[#F2F2F2] bg-white/95 px-2 py-1.5 backdrop-blur-sm">
          <ToolbarButton
            label="Negrita"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Cursiva"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Título 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Título 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Título 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Lista con viñetas"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Lista numerada"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Enlace"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Código"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      <div className="node-notes-editor">
        <EditorContent editor={editor} />
      </div>

      {!readOnly && savedSecondsAgo !== null && (
        <p className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-[#717B99]">
          {formatSavedAgo(savedSecondsAgo)}
        </p>
      )}
    </div>
  );
}
