import { Link } from "react-router-dom";
import { Clock, Users, ChefHat, Flame } from "lucide-react";
import { motion } from "motion/react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type Post = Doc<"posts"> & { authorName: string };

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function RecipePostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const recipe = post.recipeData;
  const totalTime = recipe ? recipe.prepTime + recipe.cookTime : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      <Link to={`/post/${post.slug}`} className="group block cursor-pointer h-full">
        <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
          {/* Cover image */}
          <div className="overflow-hidden aspect-[16/9] relative shrink-0">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-primary/40" />
              </div>
            )}
            {recipe?.difficulty && (
              <div className="absolute top-3 left-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_COLOR[recipe.difficulty] ?? DIFFICULTY_COLOR.Medium}`}>
                  {recipe.difficulty}
                </span>
              </div>
            )}
            {recipe?.cuisine && (
              <div className="absolute top-3 right-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
                  {recipe.cuisine}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-serif text-lg font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{post.excerpt}</p>

            {/* Recipe metadata */}
            {recipe && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border flex-wrap">
                {totalTime !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary/60" />
                    {totalTime} min
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-primary/60" />
                  Cook {recipe.cookTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary/60" />
                  Serves {recipe.servings}
                </span>
              </div>
            )}

            {!recipe && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                <span className="font-medium">{post.authorName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
