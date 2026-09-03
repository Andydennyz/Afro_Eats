import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";

const THE_MEAL_DB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";
const PROVIDER = "themealdb";

type MealDbMeal = {
  idMeal: string;
  strMeal: string;
  strCategory?: string | null;
  strArea?: string | null;
  strInstructions?: string | null;
  strMealThumb?: string | null;
  strTags?: string | null;
  strYoutube?: string | null;
  strSource?: string | null;
  [key: `strIngredient${number}`]: string | null | undefined;
  [key: `strMeasure${number}`]: string | null | undefined;
};

type MealDbResponse = { meals: MealDbMeal[] | null };

function text(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mealToImport(meal: MealDbMeal) {
  const ingredients = Array.from({ length: 20 }, (_, index) => {
    const position = index + 1;
    return {
      amount: text(meal[`strMeasure${position}`]),
      name: text(meal[`strIngredient${position}`]),
    };
  }).filter((ingredient) => ingredient.name);

  const instructions = text(meal.strInstructions);
  const steps = instructions
    .split(/\r?\n+/)
    .map((instruction) => instruction.trim())
    .filter(Boolean)
    .map((instruction, index) => ({ step: index + 1, instruction }));
  const title = text(meal.strMeal);
  const tags = [text(meal.strCategory), text(meal.strArea), ...text(meal.strTags).split(",")]
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    title,
    slug: `${slugify(title)}-${meal.idMeal}`,
    excerpt: `${title}${meal.strArea ? `, a ${text(meal.strArea)} recipe` : ""}. Imported for Afro Eats readers.`,
    content: `<p>${escapeHtml(instructions || `Discover ${title} on Afro Eats.`)}</p>`,
    coverImage: text(meal.strMealThumb) || undefined,
    tags: [...new Set(tags)],
    externalUrl: text(meal.strSource) || text(meal.strYoutube) || undefined,
    recipeData: {
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      difficulty: "Medium",
      ingredients,
      steps: steps.length ? steps : [{ step: 1, instruction: "Follow the source instructions." }],
      cuisine: text(meal.strArea) || undefined,
    },
  };
}

export const searchMeals = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }
    const query = args.query.trim();
    if (!query) return [];

    const response = await fetch(`${THE_MEAL_DB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    if (!response.ok) throw new ConvexError({ message: "Food DB search failed", code: "FOOD_DB_ERROR" });
    const data = (await response.json()) as MealDbResponse;
    return (data.meals ?? []).map((meal) => ({
      id: meal.idMeal,
      title: text(meal.strMeal),
      area: text(meal.strArea),
      category: text(meal.strCategory),
      image: text(meal.strMealThumb),
    }));
  },
});

export const importMeal = action({
  args: { mealId: v.string(), status: v.union(v.literal("draft"), v.literal("published")) },
  handler: async (ctx, args): Promise<{ postId: string; operation: "imported" | "updated" }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user || user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }
    const response = await fetch(`${THE_MEAL_DB_BASE_URL}/lookup.php?i=${encodeURIComponent(args.mealId)}`);
    if (!response.ok) throw new ConvexError({ message: "Food DB import failed", code: "FOOD_DB_ERROR" });
    const data = (await response.json()) as MealDbResponse;
    const meal = data.meals?.[0];
    if (!meal) throw new ConvexError({ message: "Food DB recipe not found", code: "NOT_FOUND" });

    const result: { postId: string; operation: "imported" | "updated" } = await ctx.runMutation(internal.foodDb.upsertImportedMeal, {
      tokenIdentifier: identity.tokenIdentifier,
      externalId: meal.idMeal,
      status: args.status,
      meal: mealToImport(meal),
    });
    return result;
  },
});

export const upsertImportedMeal = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    externalId: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    meal: v.object({
      title: v.string(), slug: v.string(), excerpt: v.string(), content: v.string(),
      coverImage: v.optional(v.string()), tags: v.array(v.string()), externalUrl: v.optional(v.string()),
      recipeData: v.object({
        prepTime: v.number(), cookTime: v.number(), servings: v.number(), difficulty: v.string(),
        ingredients: v.array(v.object({ amount: v.string(), name: v.string() })),
        steps: v.array(v.object({ step: v.number(), instruction: v.string() })),
        cuisine: v.optional(v.string()),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier)).unique();
    if (!admin || admin.role !== "admin") throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });

    const now = new Date().toISOString();
    const existing = await ctx.db.query("posts")
      .withIndex("by_external_source_and_id", (q) => q.eq("externalSource", PROVIDER).eq("externalId", args.externalId))
      .unique();
    const post = {
      ...args.meal, category: "recipes", authorId: admin._id, status: args.status,
      source: "foodDb" as const, externalSource: PROVIDER, externalId: args.externalId,
      sourceAttribution: "Recipe data provided by TheMealDB", importedAt: now, lastSyncedAt: now,
      featured: false, readTime: 1, publishedAt: args.status === "published" ? now : undefined, viewCount: 0,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...post, importedAt: existing.importedAt, publishedAt: existing.publishedAt ?? post.publishedAt,
      });
      const importRecord = await ctx.db.query("contentImports").withIndex("by_provider_and_external_id", (q) => q.eq("provider", PROVIDER).eq("externalId", args.externalId)).unique();
      if (importRecord) await ctx.db.patch(importRecord._id, { lastSyncedAt: now, status: "updated" });
      else await ctx.db.insert("contentImports", { provider: PROVIDER, externalId: args.externalId, postId: existing._id, importedById: admin._id, importedAt: now, lastSyncedAt: now, status: "updated" });
      return { postId: existing._id, operation: "updated" as const };
    }

    const postId = await ctx.db.insert("posts", post);
    await ctx.db.insert("contentImports", { provider: PROVIDER, externalId: args.externalId, postId, importedById: admin._id, importedAt: now, lastSyncedAt: now, status: "imported" });
    return { postId, operation: "imported" as const };
  },
});
