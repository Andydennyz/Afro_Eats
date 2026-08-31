import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("posts");
    const results = args.category
      ? await q
          .withIndex("by_category", (qi) => qi.eq("category", args.category!))
          .order("desc")
          .paginate(args.paginationOpts)
      : await q.withIndex("by_status", (qi) => qi.eq("status", args.status ?? "published"))
          .order("desc")
          .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page
        .filter((p) => (args.status ? p.status === args.status : p.status === "published"))
        .map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          return { ...post, authorName: author?.name ?? "Unknown" };
        }),
    );
    return { ...results, page };
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .order("desc")
      .take(3);
    return await Promise.all(
      posts
        .filter((p) => p.status === "published")
        .map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          return { ...post, authorName: author?.name ?? "Unknown" };
        }),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!post) return null;
    const author = await ctx.db.get(post.authorId);
    return { ...post, authorName: author?.name ?? "Unknown" };
  },
});

export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return null;
    const author = await ctx.db.get(post.authorId);
    return { ...post, authorName: author?.name ?? "Unknown" };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const results = await ctx.db
      .query("posts")
      .withSearchIndex("search_posts", (q) =>
        q.search("title", args.query).eq("status", "published"),
      )
      .take(20);
    return await Promise.all(
      results.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, authorName: author?.name ?? "Unknown" };
      }),
    );
  },
});

const recipeDataValidator = v.optional(v.object({
  prepTime: v.number(),
  cookTime: v.number(),
  servings: v.number(),
  difficulty: v.string(),
  ingredients: v.array(v.object({ amount: v.string(), name: v.string() })),
  steps: v.array(v.object({ step: v.number(), instruction: v.string() })),
  cuisine: v.optional(v.string()),
  calories: v.optional(v.string()),
}));

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    status: v.string(),
    featured: v.optional(v.boolean()),
    readTime: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    recipeData: recipeDataValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }

    return await ctx.db.insert("posts", {
      ...args,
      authorId: user._id,
      publishedAt: args.status === "published" ? new Date().toISOString() : undefined,
      viewCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    readTime: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    recipeData: recipeDataValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }

    const { id, ...rest } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });

    const publishedAt =
      rest.status === "published" && existing.status !== "published"
        ? new Date().toISOString()
        : existing.publishedAt;

    await ctx.db.patch(id, { ...rest, publishedAt });
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }

    await ctx.db.delete(args.id);
  },
});

export const incrementViews = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return;
    await ctx.db.patch(args.id, { viewCount: (post.viewCount ?? 0) + 1 });
  },
});

export const adminList = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") return { page: [], isDone: true, continueCursor: "" };

    const results = await ctx.db.query("posts").order("desc").paginate(args.paginationOpts);
    const page = await Promise.all(
      results.page.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, authorName: author?.name ?? "Unknown" };
      }),
    );
    return { ...results, page };
  },
});

// Returns posts filtered by a tag
export const listByTag = query({
  args: { tag: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .paginate(args.paginationOpts);

    const filtered = results.page.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === args.tag.toLowerCase()),
    );

    const page = await Promise.all(
      filtered.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, authorName: author?.name ?? "Unknown" };
      }),
    );
    return { ...results, page };
  },
});

// Returns all tags with their post counts
export const getAllTags = query({
  args: {},
  handler: async (ctx): Promise<{ tag: string; count: number }[]> => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const counts: Record<string, number> = {};
    for (const post of posts) {
      for (const tag of post.tags) {
        const key = tag.toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// Returns posts in the same category, excluding the current post
export const getRelated = query({
  args: { postId: v.id("posts"), category: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(10);

    const filtered = posts
      .filter((p) => p._id !== args.postId && p.status === "published")
      .slice(0, 3);

    return await Promise.all(
      filtered.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, authorName: author?.name ?? "Unknown" };
      }),
    );
  },
});

// Returns recipe stats for the hero section
export const getRecipeStats = query({
  args: {},
  handler: async (ctx): Promise<{ totalRecipes: number; cuisineCount: number; cuisines: string[] }> => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_category", (q) => q.eq("category", "recipes"))
      .collect();

    const published = posts.filter((p) => p.status === "published");
    const cuisineSet = new Set<string>();
    for (const p of published) {
      if (p.recipeData?.cuisine) cuisineSet.add(p.recipeData.cuisine);
    }

    return {
      totalRecipes: published.length,
      cuisineCount: cuisineSet.size,
      cuisines: Array.from(cuisineSet).sort(),
    };
  },
});

// Returns top posts sorted by viewCount (most popular)
export const getPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Sort by viewCount descending in JS since there's no index on viewCount
    const sorted = posts
      .filter((p) => (p.viewCount ?? 0) > 0)
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, limit);

    return await Promise.all(
      sorted.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, authorName: author?.name ?? "Unknown" };
      }),
    );
  },
});
