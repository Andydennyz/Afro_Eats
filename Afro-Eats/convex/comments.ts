import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const listByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    return await Promise.all(
      comments
        .filter((c) => c.status === "visible")
        .map(async (comment) => {
          const author = await ctx.db.get(comment.authorId);
          return {
            ...comment,
            authorName: author?.name ?? "Anonymous",
            authorEmail: author?.email,
          };
        }),
    );
  },
});

export const create = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Sign in to comment", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    return await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: args.content,
      parentId: args.parentId,
      likeCount: 0,
      status: "visible",
    });
  },
});

export const likeComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Sign in to like", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return;

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment_and_user", (q) =>
        q.eq("commentId", args.commentId).eq("userId", user._id),
      )
      .unique();

    const comment = await ctx.db.get(args.commentId);
    if (!comment) return;

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.commentId, { likeCount: Math.max(0, (comment.likeCount ?? 0) - 1) });
    } else {
      await ctx.db.insert("commentLikes", { commentId: args.commentId, userId: user._id });
      await ctx.db.patch(args.commentId, { likeCount: (comment.likeCount ?? 0) + 1 });
    }
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return;

    const comment = await ctx.db.get(args.commentId);
    if (!comment) return;

    if (comment.authorId !== user._id && user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }

    await ctx.db.patch(args.commentId, { status: "deleted" });
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") return [];

    const comments = await ctx.db.query("comments").order("desc").take(200);
    return await Promise.all(
      comments
        .filter((c) => c.status !== "deleted")
        .map(async (comment) => {
          const author = await ctx.db.get(comment.authorId);
          const post = await ctx.db.get(comment.postId);
          return {
            ...comment,
            authorName: author?.name ?? "Anonymous",
            postTitle: post?.title ?? "Unknown",
            postSlug: post?.slug ?? "",
          };
        }),
    );
  },
});

export const flagComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });

    await ctx.db.patch(args.commentId, { status: "flagged" });
  },
});

export const approveComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });

    await ctx.db.patch(args.commentId, { status: "visible" });
  },
});
