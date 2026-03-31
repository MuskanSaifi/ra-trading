"use client";

import { useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  ImagePlus,
  Minus,
  Pilcrow,
} from "lucide-react";

const CloudinaryImage = Image.extend({
  name: "image",
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
      dataPublicId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-public-id"),
        renderHTML: (attrs) =>
          attrs.dataPublicId ? { "data-public-id": attrs.dataPublicId } : {},
      },
    };
  },
});

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 text-sm transition ${
        active
          ? "bg-[#ff9900] text-[#1a1a1a] shadow-inner"
          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function MenuBar({ editor, onInsertImage }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 rounded-t-xl">
      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>

      <span className="mx-1 w-px h-6 bg-slate-300 hidden sm:block" />

      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <span className="text-xs font-black px-0.5">H1</span>
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="text-xs font-black px-0.5">H2</span>
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="text-xs font-black px-0.5">H3</span>
      </ToolbarButton>
      <ToolbarButton
        title="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>

      <span className="mx-1 w-px h-6 bg-slate-300 hidden sm:block" />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>

      <span className="mx-1 w-px h-6 bg-slate-300 hidden sm:block" />

      <ToolbarButton title="Insert link" onClick={setLink}>
        <Link2 className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton title="Insert image (Cloudinary)" onClick={onInsertImage}>
        <ImagePlus className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
    </div>
  );
}

/**
 * @param {string} initialContent - HTML; remount with key when loading async content
 * @param {(html: string) => void} onChange
 */
export default function BlogRichEditor({ initialContent = "<p></p>", onChange }) {
  const fileRef = useRef(null);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: {
            HTMLAttributes: {
              class: "rounded-lg bg-slate-900 text-slate-100 p-4 text-sm font-mono overflow-x-auto",
            },
          },
          link: {
            openOnClick: false,
            autolink: true,
            HTMLAttributes: {
              class: "text-[#b45309] underline font-medium",
              rel: "noopener noreferrer",
              target: "_blank",
            },
          },
        }),
        CloudinaryImage.configure({ inline: false, allowBase64: false }),
        Placeholder.configure({
          placeholder: "Write your article… headings, lists, images, links.",
        }),
      ],
      content: initialContent,
      editorProps: {
        attributes: {
          class:
            "min-h-[320px] px-4 py-4 focus:outline-none prose prose-slate max-w-none text-slate-800 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:h-auto [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange?.(ed.getHTML());
      },
    },
    []
  );

  const onInsertImage = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor) return;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload/blog", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Upload failed");
        editor
          .chain()
          .focus()
          .setImage({ src: data.url, dataPublicId: data.publicId })
          .run();
      } catch (err) {
        alert(err.message);
      }
    },
    [editor]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
      <MenuBar editor={editor} onInsertImage={onInsertImage} />
      <EditorContent editor={editor} className="blog-tiptap bg-white" />
    </div>
  );
}
