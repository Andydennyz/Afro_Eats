import { internalQuery } from "./_generated/server";

// Returns slugs and publish dates for all published posts (used by sitemap)
export const getPublishedSlugs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    return posts.map((p) => ({ slug: p.slug, publishedAt: p.publishedAt }));
  },
});
