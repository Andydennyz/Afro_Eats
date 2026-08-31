import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: identity.name,
        email: identity.email,
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      role: "user",
    });
    return userId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const setAdminRole = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    await ctx.db.patch(args.userId, { role: "admin" });
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      displayName: args.displayName,
      bio: args.bio,
    });
  },
});

// Admin: list all users
export const adminListUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const caller = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!caller || caller.role !== "admin") return [];
    return await ctx.db.query("users").order("desc").take(100);
  },
});

// Get a user's public activity: comment count, like count, bookmark count
export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<{
    user: { _id: string; name?: string; displayName?: string; bio?: string; role?: string } | null;
    commentCount: number;
    likeCount: number;
    bookmarkCount: number;
    recentComments: Array<{ _id: string; content: string; postId: string; _creationTime: number; postTitle?: string }>;
  }> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { user: null, commentCount: 0, likeCount: 0, bookmarkCount: 0, recentComments: [] };

    // Fetch all comments by this author (full scan filtered by authorId)
    const allComments = await ctx.db.query("comments").collect();
    const userComments = allComments.filter(
      (c) => c.authorId === args.userId && c.status === "visible"
    );

    const likes = await ctx.db
      .query("postLikes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get recent comments with post titles
    const recentComments = await Promise.all(
      userComments.slice(-5).reverse().map(async (c) => {
        const post = await ctx.db.get(c.postId);
        return { _id: c._id, content: c.content, postId: c.postId, _creationTime: c._creationTime, postTitle: post?.title };
      })
    );

    return {
      user: { _id: user._id, name: user.name, displayName: user.displayName, bio: user.bio, role: user.role },
      commentCount: userComments.length,
      likeCount: likes.length,
      bookmarkCount: bookmarks.length,
      recentComments,
    };
  },
});
