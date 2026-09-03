import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Sign in to continue", code: "UNAUTHENTICATED" });
  const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  return user;
}

export const getFollowStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.userId);
    if (!target) return { following: false, followerCount: 0 };
    const followers = await ctx.db.query("follows").withIndex("by_following", (q) => q.eq("followingId", args.userId)).collect();
    const user = await currentUser(ctx).catch(() => null);
    if (!user || user._id === args.userId) return { following: false, followerCount: followers.length };
    const follow = await ctx.db.query("follows").withIndex("by_pair", (q) => q.eq("followerId", user._id).eq("followingId", args.userId)).unique();
    return { following: !!follow, followerCount: followers.length };
  },
});

export const toggleFollow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (user._id === args.userId) throw new ConvexError({ message: "You cannot follow yourself", code: "INVALID_TARGET" });
    const target = await ctx.db.get(args.userId);
    if (!target) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    const existing = await ctx.db.query("follows").withIndex("by_pair", (q) => q.eq("followerId", user._id).eq("followingId", args.userId)).unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { following: false };
    }
    await ctx.db.insert("follows", { followerId: user._id, followingId: args.userId });
    await ctx.db.insert("notifications", { userId: args.userId, type: "follow", message: `${user.displayName ?? user.name ?? "Someone"} followed you`, actorId: user._id, read: false });
    return { following: true };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    return await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(30);
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== user._id) throw new ConvexError({ message: "Notification not found", code: "NOT_FOUND" });
    await ctx.db.patch(args.id, { read: true });
  },
});