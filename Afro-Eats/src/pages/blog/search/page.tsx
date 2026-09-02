import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { PostCard } from "../_components/post-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { motion } from "motion/react";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [debouncedQuery] = useDebounce(input, 400);

  useEffect(() => {
    if (debouncedQuery !== params.get("q")) {
      setParams(debouncedQuery ? { q: debouncedQuery } : {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const results = useQuery(api.posts.search, { query: debouncedQuery });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6">Search</h1>
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search recipes, articles, stories..."
            className="w-full bg-muted rounded-2xl pl-12 pr-5 py-4 text-base outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </motion.div>

      {!debouncedQuery ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-4 opacity-30" />
          <p className="font-serif text-xl">Start typing to search posts</p>
        </div>
      ) : results === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-serif text-xl">No results for "{debouncedQuery}"</p>
          <p className="mt-2 text-sm">Try different keywords</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for "{debouncedQuery}"
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {results.map((post, i) => (
              <PostCard key={post._id} post={post} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
