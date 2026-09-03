import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";

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

const submissionFields = {
  title: v.string(),
  slug: v.string(),
  excerpt: v.string(),
  content: v.string(),
  coverImage: v.optional(v.string()),
  category: v.string(),
  tags: v.array(v.string()),
  recipeData: recipeDataValidator,
};

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  return user;
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("submissions")
      .withIndex("by_submitter", (q) => q.eq("submittedById", user._id))
      .order("desc")
      .collect();
  },
});

export const saveDraft = mutation({
  args: { id: v.optional(v.id("submissions")), ...submissionFields },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...fields } = args;
    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing || existing.submittedById !== user._id) {
        throw new ConvexError({ message: "Submission not found", code: "NOT_FOUND" });
      }
      if (existing.status === "submitted" || existing.status === "published") {
        throw new ConvexError({ message: "This submission cannot be edited", code: "INVALID_STATUS" });
      }
      await ctx.db.patch(id, { ...fields, status: "draft", reviewNote: undefined });
      return id;
    }
    return await ctx.db.insert("submissions", { ...fields, submittedById: user._id, status: "draft" });
  },
});

export const submit = mutation({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const submission = await ctx.db.get(args.id);
    if (!submission || submission.submittedById !== user._id) {
      throw new ConvexError({ message: "Submission not found", code: "NOT_FOUND" });
    }
    if (submission.status !== "draft" && submission.status !== "rejected") {
      throw new ConvexError({ message: "This submission is already under review", code: "INVALID_STATUS" });
    }
    await ctx.db.patch(args.id, { status: "submitted", reviewNote: undefined });
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getCurrentUser(ctx);
    if (admin.role !== "admin") return [];
    const submissions = await ctx.db.query("submissions").withIndex("by_status", (q) => q.eq("status", "submitted")).order("desc").collect();
    return await Promise.all(submissions.map(async (submission) => {
      const author = await ctx.db.get(submission.submittedById);
      return { ...submission, authorName: author?.displayName ?? author?.name ?? "Unknown" };
    }));
  },
});

export const review = mutation({
  args: {
    id: v.id("submissions"),
    decision: v.union(v.literal("approve"), v.literal("reject"), v.literal("return")),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    if (admin.role !== "admin") throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    const submission = await ctx.db.get(args.id);
    if (!submission) throw new ConvexError({ message: "Submission not found", code: "NOT_FOUND" });
    const now = new Date().toISOString();
    if (args.decision === "approve") {
      const postId = await ctx.db.insert("posts", {
        title: submission.title,
        slug: submission.slug,
        excerpt: submission.excerpt,
        content: submission.content,
        coverImage: submission.coverImage,
        category: submission.category,
        tags: submission.tags,
        authorId: submission.submittedById,
        status: "published",
        source: "community",
        recipeData: submission.recipeData,
        featured: false,
        publishedAt: now,
        viewCount: 0,
      });
      await ctx.db.patch(args.id, { status: "published", reviewNote: args.reviewNote, reviewedAt: now, reviewedById: admin._id, publishedPostId: postId });
      await ctx.db.insert("notifications", { userId: submission.submittedById, type: "submission_approved", message: "Your submission was published", actorId: admin._id, postId, read: false });
      return postId;
    }
    await ctx.db.patch(args.id, {
      status: args.decision === "reject" ? "rejected" : "draft",
      reviewNote: args.reviewNote,
      reviewedAt: now,
      reviewedById: admin._id,
    });
    await ctx.db.insert("notifications", { userId: submission.submittedById, type: args.decision === "reject" ? "submission_rejected" : "submission_returned", message: args.decision === "reject" ? "Your submission was rejected" : "Your submission was returned for changes", actorId: admin._id, read: false });
    return null;
  },
});