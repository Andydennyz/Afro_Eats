import { query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx): Promise<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalBookmarks: number;
    topPosts: {
      _id: string;
      title: string;
      slug: string;
      category: string;
      viewCount: number;
      likeCount: number;
      publishedAt: string | undefined;
    }[];
    categoryBreakdown: { category: string; count: number; views: number }[];
    viewsByDay: { date: string; views: number }[];
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }

    // Fetch all published posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Total views
    const totalViews = posts.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);

    // Total likes from postLikes table
    const allLikes = await ctx.db.query("postLikes").collect();
    const totalLikes = allLikes.length;

    // Total comments (non-deleted)
    const allComments = await ctx.db.query("comments").collect();
    const totalComments = allComments.filter((c) => c.status !== "deleted").length;

    // Total bookmarks
    const allBookmarks = await ctx.db.query("bookmarks").collect();
    const totalBookmarks = allBookmarks.length;

    // Top 10 posts by views
    const topPosts = posts
      .filter((p) => (p.viewCount ?? 0) > 0)
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 10)
      .map((p) => ({
        _id: p._id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        viewCount: p.viewCount ?? 0,
        likeCount: allLikes.filter((l) => l.postId === p._id).length,
        publishedAt: p.publishedAt,
      }));

    // Category breakdown
    const categoryMap = new Map<string, { count: number; views: number }>();
    for (const post of posts) {
      const cat = post.category;
      const existing = categoryMap.get(cat) ?? { count: 0, views: 0 };
      categoryMap.set(cat, {
        count: existing.count + 1,
        views: existing.views + (post.viewCount ?? 0),
      });
    }
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, { count, views }]) => ({ category, count, views }))
      .sort((a, b) => b.views - a.views);

    // Views by day for the last 30 days (based on publishedAt)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const dayViewMap = new Map<string, number>();

    // Build a day map seeded with zeros for all 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayViewMap.set(key, 0);
    }

    // Distribute each post's views evenly across its days since publish
    // (approximation — real per-day tracking would need a separate events table)
    for (const post of posts) {
      if (!post.publishedAt || (post.viewCount ?? 0) === 0) continue;
      const publishMs = new Date(post.publishedAt).getTime();
      const effectiveStart = Math.max(publishMs, thirtyDaysAgo);
      const daysSincePublish = Math.max(
        1,
        Math.floor((now - effectiveStart) / (24 * 60 * 60 * 1000)),
      );
      const viewsPerDay = (post.viewCount ?? 0) / daysSincePublish;

      for (const [key] of dayViewMap) {
        const dayMs = new Date(key).getTime();
        if (dayMs >= effectiveStart && dayMs <= now) {
          dayViewMap.set(key, (dayViewMap.get(key) ?? 0) + viewsPerDay);
        }
      }
    }

    const viewsByDay = Array.from(dayViewMap.entries()).map(([date, views]) => ({
      date,
      views: Math.round(views),
    }));

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalBookmarks,
      topPosts,
      categoryBreakdown,
      viewsByDay,
    };
  },
});
