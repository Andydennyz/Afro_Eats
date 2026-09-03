import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()), // "admin" | "user"
    bio: v.optional(v.string()),
    displayName: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(), // HTML from TipTap
    coverImage: v.optional(v.string()),
    category: v.string(), // "article" | "news" | "story" | "guide" | "post"
    tags: v.array(v.string()),
    authorId: v.id("users"),
    status: v.string(), // "draft" | "published"
    featured: v.optional(v.boolean()),
    readTime: v.optional(v.number()), // minutes
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    publishedAt: v.optional(v.string()), // ISO 8601
    viewCount: v.optional(v.number()),
    // Content provenance. Existing editorial posts intentionally omit this field
    // and are treated as "admin" by readers until they are next edited.
    source: v.optional(v.union(v.literal("admin"), v.literal("community"), v.literal("foodDb"))),
    externalSource: v.optional(v.string()),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    sourceAttribution: v.optional(v.string()),
    importedAt: v.optional(v.string()),
    lastSyncedAt: v.optional(v.string()),
    // Recipe-specific fields (only present when category === "recipes")
    recipeData: v.optional(v.object({
      prepTime: v.number(),       // minutes
      cookTime: v.number(),       // minutes
      servings: v.number(),
      difficulty: v.string(),     // "Easy" | "Medium" | "Hard"
      ingredients: v.array(v.object({
        amount: v.string(),
        name: v.string(),
      })),
      steps: v.array(v.object({
        step: v.number(),
        instruction: v.string(),
      })),
      cuisine: v.optional(v.string()),
      calories: v.optional(v.string()),
    })),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_author", ["authorId"])
    .index("by_featured", ["featured"])
    .index("by_source", ["source"])
    .index("by_status_and_source", ["status", "source"])
    .index("by_external_source_and_id", ["externalSource", "externalId"])
    .searchIndex("search_posts", {
      searchField: "title",
      filterFields: ["status", "category"],
    }),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
    likeCount: v.optional(v.number()),
    status: v.string(), // "visible" | "flagged" | "deleted"
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentId"]),

  commentLikes: defineTable({
    commentId: v.id("comments"),
    userId: v.id("users"),
  })
    .index("by_comment", ["commentId"])
    .index("by_comment_and_user", ["commentId", "userId"]),

  postLikes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_post_and_user", ["postId", "userId"])
    .index("by_user", ["userId"]),

  bookmarks: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_post_and_user", ["postId", "userId"]),

  subscribers: defineTable({
    email: v.string(),
    subscribedAt: v.string(), // ISO 8601
    status: v.string(), // "active" | "unsubscribed"
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  contentImports: defineTable({
    provider: v.string(),
    externalId: v.string(),
    postId: v.optional(v.id("posts")),
    importedById: v.id("users"),
    importedAt: v.string(),
    lastSyncedAt: v.string(),
    status: v.union(v.literal("imported"), v.literal("updated"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    attemptCount: v.optional(v.number()),
  })
    .index("by_provider_and_external_id", ["provider", "externalId"])
    .index("by_post", ["postId"]),

  submissions: defineTable({
    submittedById: v.id("users"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    recipeData: v.optional(v.object({
      prepTime: v.number(),
      cookTime: v.number(),
      servings: v.number(),
      difficulty: v.string(),
      ingredients: v.array(v.object({ amount: v.string(), name: v.string() })),
      steps: v.array(v.object({ step: v.number(), instruction: v.string() })),
      cuisine: v.optional(v.string()),
      calories: v.optional(v.string()),
    })),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("rejected"),
      v.literal("published"),
    ),
    reviewNote: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    reviewedById: v.optional(v.id("users")),
    publishedPostId: v.optional(v.id("posts")),
  })
    .index("by_submitter", ["submittedById"])
    .index("by_status", ["status"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_pair", ["followerId", "followingId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    actorId: v.optional(v.id("users")),
    postId: v.optional(v.id("posts")),
    read: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"]),
});
