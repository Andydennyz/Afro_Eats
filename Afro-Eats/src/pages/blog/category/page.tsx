import { useParams } from "react-router-dom";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { PostCard } from "../_components/post-card.tsx";
import { RecipePostCard } from "../_components/recipe-post-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { ChefHat, Globe, SlidersHorizontal, X } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type Post = Doc<"posts"> & { authorName: string };

const CATEGORY_META: Record<string, { label: string; description: string; image: string }> = {
  articles: {
    label: "Articles",
    description: "In-depth explorations of African food culture, history, and culinary traditions.",
    image:
      "https://images.unsplash.com/photo-1665332195309-9d75071138f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  },
  recipes: {
    label: "Recipes",
    description: "Step-by-step guides to cook authentic African dishes from across the continent.",
    image:
      "https://images.unsplash.com/photo-1765338915553-6e02fe63ff4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  },
  news: {
    label: "News",
    description: "The latest happenings in the world of African food, restaurants, and chefs.",
    image:
      "https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  },
  stories: {
    label: "Stories",
    description: "Personal narratives and memoirs about food, family, and African heritage.",
    image:
      "https://images.unsplash.com/photo-1665333048952-a3ee97714c6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  },
  guides: {
    label: "Guides",
    description: "Practical guides on ingredients, techniques, and navigating African cuisines.",
    image:
      "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  },
};

const COOK_TIME_RANGES = [
  { label: "Any time", min: 0, max: Infinity },
  { label: "Under 30 min", min: 0, max: 30 },
  { label: "30–60 min", min: 30, max: 60 },
  { label: "Over 60 min", min: 60, max: Infinity },
] as const;

type CookTimeRange = (typeof COOK_TIME_RANGES)[number]["label"];

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

function RecipeFilters({
  cuisines,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedCuisine,
  setSelectedCuisine,
  selectedCookTime,
  setSelectedCookTime,
  activeCount,
  onClear,
}: {
  cuisines: string[];
  selectedDifficulty: Difficulty | "";
  setSelectedDifficulty: (v: Difficulty | "") => void;
  selectedCuisine: string;
  setSelectedCuisine: (v: string) => void;
  selectedCookTime: CookTimeRange;
  setSelectedCookTime: (v: CookTimeRange) => void;
  activeCount: number;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-b border-border">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </div>

      {/* Difficulty */}
      <div className="flex items-center gap-1.5">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDifficulty(selectedDifficulty === d ? "" : d)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer
              ${selectedDifficulty === d
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Cook time */}
      <select
        value={selectedCookTime}
        onChange={(e) => setSelectedCookTime(e.target.value as CookTimeRange)}
        className="text-xs border border-border rounded-full px-3 py-1.5 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {COOK_TIME_RANGES.map((r) => (
          <option key={r.label} value={r.label}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Cuisine */}
      {cuisines.length > 0 && (
        <select
          value={selectedCuisine}
          onChange={(e) => setSelectedCuisine(e.target.value)}
          className="text-xs border border-border rounded-full px-3 py-1.5 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {/* Clear */}
      {activeCount > 0 && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}

function RecipesHero({ stats }: { stats: { totalRecipes: number; cuisineCount: number } | undefined }) {
  const meta = CATEGORY_META.recipes;
  return (
    <div className="relative overflow-hidden h-64 md:h-80">
      <img src={meta.image} alt="Recipes" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-primary font-display tracking-widest text-base mb-1">CATEGORY</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold">{meta.label}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">{meta.description}</p>
          {stats && (
            <div className="flex items-center gap-6 mt-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 text-sm"
              >
                <ChefHat className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">{stats.totalRecipes}</span>
                <span className="text-muted-foreground">recipes</span>
              </motion.div>
              {stats.cuisineCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">{stats.cuisineCount}</span>
                  <span className="text-muted-foreground">cuisines</span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const isRecipes = category === "recipes";

  const meta = CATEGORY_META[category ?? ""] ?? {
    label: category ?? "Posts",
    description: "",
    image: "",
  };

  // Filter state (recipes only)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "">("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedCookTime, setSelectedCookTime] = useState<CookTimeRange>("Any time");

  const recipeStats = useQuery(
    api.posts.getRecipeStats,
    isRecipes ? {} : "skip"
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.list,
    { category: category ?? "" },
    { initialNumItems: 18 },
  );

  const activeFilterCount = [
    selectedDifficulty !== "",
    selectedCuisine !== "",
    selectedCookTime !== "Any time",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedDifficulty("");
    setSelectedCuisine("");
    setSelectedCookTime("Any time");
  };

  const filteredResults = useMemo(() => {
    if (!isRecipes) return results;
    return (results as Post[]).filter((post) => {
      const recipe = post.recipeData;
      if (!recipe) return true;

      if (selectedDifficulty && recipe.difficulty !== selectedDifficulty) return false;
      if (selectedCuisine && recipe.cuisine !== selectedCuisine) return false;

      const range = COOK_TIME_RANGES.find((r) => r.label === selectedCookTime);
      if (range && range.label !== "Any time") {
        const totalCook = recipe.cookTime;
        if (totalCook < range.min || totalCook >= range.max) return false;
      }

      return true;
    });
  }, [results, isRecipes, selectedDifficulty, selectedCuisine, selectedCookTime]);

  return (
    <div>
      {/* Hero */}
      {isRecipes ? (
        <RecipesHero stats={recipeStats} />
      ) : (
        <div className="relative overflow-hidden h-52 md:h-72">
          {meta.image && (
            <img src={meta.image} alt={meta.label} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-primary font-display tracking-widest text-base mb-1">CATEGORY</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold">{meta.label}</h1>
              {meta.description && (
                <p className="text-muted-foreground mt-2 max-w-xl">{meta.description}</p>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Recipe Filters */}
        {isRecipes && (
          <RecipeFilters
            cuisines={recipeStats?.cuisines ?? []}
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            selectedCuisine={selectedCuisine}
            setSelectedCuisine={setSelectedCuisine}
            selectedCookTime={selectedCookTime}
            setSelectedCookTime={setSelectedCookTime}
            activeCount={activeFilterCount}
            onClear={clearFilters}
          />
        )}

        <div className="mt-8">
          {status === "LoadingFirstPage" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {activeFilterCount > 0 ? (
                <>
                  <p className="font-serif text-xl">No recipes match your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-sm text-primary underline cursor-pointer hover:opacity-80"
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <>
                  <p className="font-serif text-xl">No posts in this category yet.</p>
                  <p className="mt-2 text-sm">Check back soon for new content!</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map((post, i) =>
                  isRecipes ? (
                    <RecipePostCard key={post._id} post={post as Post} index={i} />
                  ) : (
                    <PostCard key={post._id} post={post as Post} index={i} />
                  )
                )}
              </div>
              {status === "CanLoadMore" && activeFilterCount === 0 && (
                <div className="text-center mt-10">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => loadMore(9)}
                    className="cursor-pointer"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
