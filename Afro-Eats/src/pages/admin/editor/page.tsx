import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import RichTextEditor from "../_components/rich-text-editor.tsx";
import ImageUploader from "../_components/image-uploader.tsx";
import RecipeFields from "../_components/recipe-fields.tsx";
import { DEFAULT_RECIPE_DATA, type RecipeData } from "../_components/recipe-types.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { motion } from "motion/react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const CATEGORIES = ["articles", "recipes", "news", "stories", "guides", "post"];

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function estimateReadTime(html: string) {
  const text = html.replace(/<[^>]+>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function AdminPostEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);

  const existingPost = useQuery(
    api.posts.getById,
    id ? { id: id as Id<"posts"> } : "skip",
  );

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "articles",
    tags: "",
    status: "draft",
    featured: false,
    seoTitle: "",
    seoDescription: "",
  });

  const [recipeData, setRecipeData] = useState<RecipeData>(DEFAULT_RECIPE_DATA);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);

  const isRecipe = form.category === "recipes";

  useEffect(() => {
    if (existingPost) {
      setForm({
        title: existingPost.title,
        slug: existingPost.slug,
        excerpt: existingPost.excerpt,
        content: existingPost.content,
        coverImage: existingPost.coverImage ?? "",
        category: existingPost.category,
        tags: existingPost.tags.join(", "),
        status: existingPost.status,
        featured: existingPost.featured ?? false,
        seoTitle: existingPost.seoTitle ?? "",
        seoDescription: existingPost.seoDescription ?? "",
      });
      if (existingPost.recipeData) {
        setRecipeData({
          prepTime: existingPost.recipeData.prepTime,
          cookTime: existingPost.recipeData.cookTime,
          servings: existingPost.recipeData.servings,
          difficulty: existingPost.recipeData.difficulty,
          cuisine: existingPost.recipeData.cuisine ?? "",
          calories: existingPost.recipeData.calories ?? "",
          ingredients: existingPost.recipeData.ingredients,
          steps: existingPost.recipeData.steps,
        });
      }
      setSlugManual(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPost?._id]);

  const set = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && !slugManual) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  };

  const buildRecipePayload = () => {
    if (!isRecipe) return undefined;
    return {
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty,
      cuisine: recipeData.cuisine || undefined,
      calories: recipeData.calories || undefined,
      ingredients: recipeData.ingredients.filter((i) => i.name.trim()),
      steps: recipeData.steps.filter((s) => s.instruction.trim()),
    };
  };

  const handleSave = async (statusOverride?: string) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    if (!form.excerpt.trim()) { toast.error("Excerpt is required"); return; }
    if (!form.content || form.content === "<p></p>") { toast.error("Content is required"); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        coverImage: form.coverImage.trim() || undefined,
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: statusOverride ?? form.status,
        featured: form.featured,
        readTime: estimateReadTime(form.content),
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        recipeData: buildRecipePayload(),
      };

      if (id) {
        await updatePost({ id: id as Id<"posts">, ...payload });
        toast.success("Post updated!");
      } else {
        await createPost(payload);
        toast.success("Post created!");
        navigate("/admin");
      }
    } catch (e) {
      if (e instanceof ConvexError) toast.error(e.data.message);
      else toast.error("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-2xl font-bold flex-1">
            {id ? "Edit Post" : "New Post"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave("published")}
              disabled={saving}
              className="cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Publish
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Cover Image Upload */}
          <div>
            <Label className="mb-2 block">Cover Image</Label>
            <ImageUploader
              onUpload={(url) => setForm((prev) => ({ ...prev, coverImage: url }))}
              currentUrl={form.coverImage}
              label="Upload Cover Image"
            />
            <div className="mt-2 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or paste a URL</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <input
              value={form.coverImage}
              onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
              placeholder="https://images.unsplash.com/..."
              className="w-full mt-2 bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Your amazing post title..."
              className="mt-1 text-lg"
            />
          </div>

          {/* Slug */}
          <div>
            <Label>Slug *</Label>
            <Input
              value={form.slug}
              onChange={(e) => { setSlugManual(true); set("slug", e.target.value); }}
              placeholder="your-post-slug"
              className="mt-1 font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div>
            <Label>Excerpt *</Label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="A brief, enticing summary of the post..."
              rows={2}
              className="w-full mt-1 bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Category & Status row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="jollof, rice, west africa"
                className="mt-1"
              />
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <Label htmlFor="featured" className="cursor-pointer">
              Feature this post on the homepage
            </Label>
          </div>

          {/* Recipe Fields — only shown when category is "recipes" */}
          {isRecipe && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RecipeFields data={recipeData} onChange={setRecipeData} />
            </motion.div>
          )}

          {/* Content Editor */}
          <div>
            <Label className="mb-2 block">Content *</Label>
            <RichTextEditor
              content={form.content}
              onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
            />
          </div>

          {/* SEO */}
          <div className="rounded-xl border border-border p-5 space-y-4 bg-card">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              SEO Settings
            </h3>
            <div>
              <Label>SEO Title</Label>
              <Input
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                placeholder="Overrides post title for search engines"
                className="mt-1"
              />
            </div>
            <div>
              <Label>SEO Description</Label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                placeholder="150-160 character description for search engines..."
                rows={2}
                maxLength={160}
                className="w-full mt-1 bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.seoDescription.length}/160 characters
              </p>
            </div>
          </div>

          {/* Bottom save buttons */}
          <div className="flex justify-end gap-2 pb-8">
            <Button
              variant="secondary"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
