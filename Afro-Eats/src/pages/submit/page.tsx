import { useState } from "react";
import { useMutation, useQuery, Authenticated, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { Send, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const categories = ["recipes", "articles", "stories", "guides"];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function SubmitPage() {
  const navigate = useNavigate();
  const saveDraft = useMutation(api.communitySubmissions.saveDraft);
  const submit = useMutation(api.communitySubmissions.submit);
  const submissions = useQuery(api.communitySubmissions.listMine);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", coverImage: "", category: "recipes", tags: "" });
  const [editingId, setEditingId] = useState<Id<"submissions"> | undefined>();
  const [saving, setSaving] = useState(false);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const save = async (shouldSubmit: boolean) => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error("Title, summary, and content are required");
      return;
    }
    setSaving(true);
    try {
      const id = await saveDraft({
        id: editingId, title: form.title.trim(), slug: `${slugify(form.title)}-${editingId ?? Date.now()}`,
        excerpt: form.excerpt.trim(), content: `<p>${form.content.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
        coverImage: form.coverImage.trim() || undefined, category: form.category,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), recipeData: undefined,
      });
      if (shouldSubmit) await submit({ id });
      toast.success(shouldSubmit ? "Submitted for review" : "Draft saved");
      setForm({ title: "", excerpt: "", content: "", coverImage: "", category: "recipes", tags: "" });
      setEditingId(undefined);
    } catch {
      toast.error("Could not save your submission");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Authenticated>
        <div className="mb-8"><h1 className="font-serif text-3xl font-bold">Share with Afro Eats</h1><p className="text-muted-foreground mt-1">Submit your recipe or story for editorial review.</p></div>
        <div className="space-y-5 bg-card border border-border rounded-2xl p-6">
          {editingId && <p className="text-sm text-primary">Editing a returned draft</p>}
          <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Your recipe or story title" /></div>
          <div><Label htmlFor="excerpt">Short summary</Label><Textarea id="excerpt" value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} placeholder="What should readers know?" /></div>
          <div><Label htmlFor="content">Content</Label><Textarea id="content" className="min-h-48" value={form.content} onChange={(event) => update("content", event.target.value)} placeholder="Tell the story or write the method..." /></div>
          <div className="grid sm:grid-cols-2 gap-4"><div><Label htmlFor="category">Category</Label><select id="category" value={form.category} onChange={(event) => update("category", event.target.value)} className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"><option value="recipes">Recipe</option>{categories.slice(1).map((category) => <option key={category} value={category}>{category}</option>)}</select></div><div><Label htmlFor="tags">Tags</Label><Input id="tags" value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="jollof, family, Ghana" /></div></div>
          <div><Label htmlFor="coverImage">Cover image URL</Label><Input id="coverImage" value={form.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder="https://..." /></div>
          <div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={saving} onClick={() => void save(false)}><Save className="w-4 h-4 mr-2" />Save draft</Button><Button disabled={saving} onClick={() => void save(true)}><Send className="w-4 h-4 mr-2" />Submit for review</Button></div>
        </div>
        <div className="mt-8"><h2 className="font-serif text-xl font-bold mb-3">Your submissions</h2>{submissions?.length ? <div className="space-y-2">{submissions.map((item) => <div key={item._id} className="border border-border rounded-lg p-3"><div className="flex justify-between gap-3"><span className="font-medium">{item.title}</span><span className="text-sm text-muted-foreground capitalize">{item.status}</span></div>{item.reviewNote && <p className="text-sm text-muted-foreground mt-2">{item.reviewNote}</p>}{(item.status === "draft" || item.status === "rejected") && <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => { setEditingId(item._id); setForm({ title: item.title, excerpt: item.excerpt, content: item.content.replace(/<[^>]+>/g, ""), coverImage: item.coverImage ?? "", category: item.category, tags: item.tags.join(", ") }); }}>Edit draft</Button>}</div>)}</div> : <p className="text-sm text-muted-foreground">Your drafts and review updates will appear here.</p>}</div>
      </Authenticated>
      <Unauthenticated><div className="text-center py-20"><h1 className="font-serif text-3xl font-bold mb-3">Sign in to contribute</h1><p className="text-muted-foreground mb-5">Create an account to share recipes and stories with the community.</p><SignInButton /></div></Unauthenticated>
      <button className="sr-only" onClick={() => navigate("/")}>Back home</button>
    </div>
  );
}