import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Clock, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge.tsx";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type Post = Doc<"posts"> & { authorName: string };

// Threshold for showing the Trending badge (views)
const TRENDING_THRESHOLD = 50;

const CATEGORY_COLORS: Record<string, string> = {
  articles: "bg-primary/15 text-primary",
  recipes: "bg-accent/15 text-accent",
  news: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  stories: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  guides: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  post: "bg-muted text-muted-foreground",
};

export function CategoryBadge({ category }: { category: string }) {
  const colorClass = CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.post;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${colorClass}`}>
      {category}
    </span>
  );
}

export function TrendingBadge() {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 uppercase tracking-wide">
      <TrendingUp className="w-3 h-3" />
      Trending
    </span>
  );
}

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const isTrending = (post.viewCount ?? 0) >= TRENDING_THRESHOLD;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: "easeOut" }}
    >
      <Link to={`/post/${post.slug}`} className="group block cursor-pointer">
        <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300">
          {post.coverImage && (
            <div className="overflow-hidden aspect-[16/9] relative">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {isTrending && (
                <div className="absolute top-3 right-3">
                  <TrendingBadge />
                </div>
              )}
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <CategoryBadge category={post.category} />
              {isTrending && !post.coverImage && <TrendingBadge />}
            </div>
            <h3 className="font-serif text-lg font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="font-medium">{post.authorName}</span>
              {post.readTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readTime} min read
                </span>
              )}
              {post.publishedAt && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturedPostCard({ post }: { post: Post }) {
  return (
    <Link to={`/post/${post.slug}`} className="group block cursor-pointer">
      <div className="relative rounded-3xl overflow-hidden aspect-[16/8] md:aspect-[16/6]">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <CategoryBadge category={post.category} />
          <h2 className="font-serif text-2xl md:text-4xl font-bold text-white mt-3 mb-2 leading-tight group-hover:text-primary-foreground/90 transition-colors line-clamp-2">
            {post.title}
          </h2>
          <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-3">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-white/70">
            <span>{post.authorName}</span>
            {post.readTime && <span>{post.readTime} min read</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export { Badge };
