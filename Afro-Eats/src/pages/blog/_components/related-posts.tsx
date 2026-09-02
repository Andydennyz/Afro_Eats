import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { PostCard } from "./post-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface RelatedPostsProps {
  postId: Id<"posts">;
  category: string;
}

export default function RelatedPosts({ postId, category }: RelatedPostsProps) {
  const related = useQuery(api.posts.getRelated, { postId, category });

  if (related === undefined) {
    return (
      <section className="mt-12 pt-8 border-t border-border">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-2xl font-bold">You Might Also Like</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (related.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-12 pt-8 border-t border-border"
    >
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-2xl font-bold">You Might Also Like</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {related.map((post, i) => (
          <PostCard key={post._id} post={post} index={i} />
        ))}
      </div>
    </motion.section>
  );
}
