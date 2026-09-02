import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  ImageUp,
  Link as LinkIcon,
  Code,
  Undo,
  Redo,
  Minus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type EditorProps = {
  content: string;
  onChange: (html: string) => void;
};

export default function RichTextEditor({ content, onChange }: EditorProps) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.getStorageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingInline, setUploadingInline] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing your post content here..." }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) return null;

  const handleInlineImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }

    setUploadingInline(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = (await result.json()) as { storageId: string };
      const url = await getStorageUrl({
        storageId: storageId as Parameters<typeof getStorageUrl>[0]["storageId"],
      });
      if (!url) throw new Error("No URL");
      editor.chain().focus().setImage({ src: url }).run();
      toast.success("Image inserted!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingInline(false);
    }
  };

  const addLink = () => {
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const toolbarButtons = [
    { action: () => editor.chain().focus().toggleBold().run(), icon: Bold, label: "Bold", active: editor.isActive("bold") },
    { action: () => editor.chain().focus().toggleItalic().run(), icon: Italic, label: "Italic", active: editor.isActive("italic") },
    { action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: Heading2, label: "H2", active: editor.isActive("heading", { level: 2 }) },
    { action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: Heading3, label: "H3", active: editor.isActive("heading", { level: 3 }) },
    { action: () => editor.chain().focus().toggleBulletList().run(), icon: List, label: "Bullet list", active: editor.isActive("bulletList") },
    { action: () => editor.chain().focus().toggleOrderedList().run(), icon: ListOrdered, label: "Ordered list", active: editor.isActive("orderedList") },
    { action: () => editor.chain().focus().toggleBlockquote().run(), icon: Quote, label: "Quote", active: editor.isActive("blockquote") },
    { action: () => editor.chain().focus().toggleCode().run(), icon: Code, label: "Code", active: editor.isActive("code") },
    { action: () => editor.chain().focus().setHorizontalRule().run(), icon: Minus, label: "Divider", active: false },
    { action: addLink, icon: LinkIcon, label: "Link", active: editor.isActive("link") },
    { action: () => fileInputRef.current?.click(), icon: uploadingInline ? Loader2 : ImageUp, label: "Insert Image", active: false },
    { action: () => editor.chain().focus().undo().run(), icon: Undo, label: "Undo", active: false },
    { action: () => editor.chain().focus().redo().run(), icon: Redo, label: "Redo", active: false },
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 bg-muted border-b border-border">
        {/* The toolbar actions are event handlers; they do not read the ref while rendering. */}
        {/* eslint-disable-next-line react-hooks/refs */}
        {toolbarButtons.map(({ action, icon: Icon, label, active }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            title={label}
            disabled={label === "Insert Image" && uploadingInline}
            className={`p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-4 h-4 ${label === "Insert Image" && uploadingInline ? "animate-spin" : ""}`} />
          </button>
        ))}
      </div>
      {/* Hidden file input for inline uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleInlineImageFile(file);
          e.target.value = "";
        }}
      />
      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-5 min-h-[320px] focus:outline-none"
      />
    </div>
  );
}
