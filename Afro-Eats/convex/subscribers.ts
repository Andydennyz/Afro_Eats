import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existing) {
      if (existing.status === "active") {
        throw new ConvexError({ message: "You're already subscribed!", code: "CONFLICT" });
      }
      // Re-subscribe if previously unsubscribed
      await ctx.db.patch(existing._id, {
        status: "active",
        subscribedAt: new Date().toISOString(),
      });
      return { resubscribed: true };
    }

    await ctx.db.insert("subscribers", {
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
      status: "active",
    });

    return { resubscribed: false };
  },
});

export const unsubscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (!existing) {
      throw new ConvexError({ message: "Email not found", code: "NOT_FOUND" });
    }

    await ctx.db.patch(existing._id, { status: "unsubscribed" });
  },
});

// Admin only: list all active subscribers (public query)
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user?.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }

    const subscribers = await ctx.db
      .query("subscribers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    return subscribers;
  },
});

// Internal query for email action to fetch subscribers without auth check
export const adminListInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscribers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Internal mutation for broadcast logging
export const markBroadcastSent = internalMutation({
  args: { count: v.number() },
  handler: async (_ctx, { count }) => {
    console.log(`Broadcast sent to ${count} subscribers`);
  },
});
