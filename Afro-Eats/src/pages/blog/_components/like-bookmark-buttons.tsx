import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Heart, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface LikeBookmarkButtonsProps {
  postId: Id<"posts">;
}

export default function LikeBookmarkButtons({ postId }: LikeBookmarkButtonsProps) {
  const likeStatus = useQuery(api.postLikes.getPostLikeStatus, { postId });
  const bookmarkStatus = useQuery(api.bookmarks.getBookmarkStatus, { postId });
  const toggleLike = useMutation(api.postLikes.toggleLike);
  const toggleBookmark = useMutation(api.bookmarks.toggleBookmark);

  const handleLike = async () => {
    try {
      await toggleLike({ postId });
    } catch (e) {
      if (e instanceof ConvexError) toast.error((e.data as { message: string }).message);
      else toast.error("Sign in to like posts");
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark({ postId });
      toast.success(result.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks");
    } catch (e) {
      if (e instanceof ConvexError) toast.error((e.data as { message: string }).message);
      else toast.error("Sign in to bookmark posts");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Like button */}
      <button
        onClick={handleLike}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
          likeStatus?.liked
            ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
            : "bg-muted text-muted-foreground hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400",
        )}
        aria-label={likeStatus?.liked ? "Unlike post" : "Like post"}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={likeStatus?.liked ? "liked" : "not-liked"}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Heart
              className={cn("w-4 h-4", likeStatus?.liked && "fill-current")}
            />
          </motion.span>
        </AnimatePresence>
        <span>{likeStatus?.count ?? 0}</span>
      </button>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
          bookmarkStatus?.bookmarked
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary",
        )}
        aria-label={bookmarkStatus?.bookmarked ? "Remove bookmark" : "Bookmark post"}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={bookmarkStatus?.bookmarked ? "bookmarked" : "not-bookmarked"}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Bookmark
              className={cn("w-4 h-4", bookmarkStatus?.bookmarked && "fill-current")}
            />
          </motion.span>
        </AnimatePresence>
        <span className="hidden sm:inline">
          {bookmarkStatus?.bookmarked ? "Saved" : "Save"}
        </span>
      </button>
    </div>
  );
}
