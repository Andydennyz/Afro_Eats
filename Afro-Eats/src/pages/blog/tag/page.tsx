import { useParams, Link } from "react-router-dom";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { PostCard } from "../_components/post-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { motion } from "motion/react";
import { Hash, Tag } from "lucide-react";

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag ?? "");

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.listByTag,
    { tag: decodedTag },
    { initialNumItems: 9 },
  );

  // Count comes from the total results loaded — we show it as "N+ posts" if more
  const postCount = results.length;
  const hasMore = status === "CanLoadMore";

  return (
    <div>
      {/* Tag Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex items-center gap-2 text-primary font-display tracking-widest text-base mb-3">
              <Hash className="w-4 h-4" />
              TAG
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-3">
              #{decodedTag}
            </h1>
            {status !== "LoadingFirstPage" && (
              <p className="text-muted-foreground text-lg">
                {postCount === 0
                  ? "No posts found"
                  : `${postCount}${hasMore ? "+" : ""} post${postCount !== 1 ? "s" : ""}`}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {status === "LoadingFirstPage" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-serif text-xl">No posts tagged #{decodedTag}</p>
            <p className="mt-2 text-sm mb-6">Check back soon or explore other tags.</p>
            <Button asChild variant="secondary">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((post, i) => (
                <PostCard key={post._id} post={post} index={i} />
              ))}
            </div>
            {status === "CanLoadMore" && (
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
  );
}
