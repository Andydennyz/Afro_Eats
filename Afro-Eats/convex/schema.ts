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
});
