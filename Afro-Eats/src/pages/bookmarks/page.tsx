import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { PostCard } from "@/pages/blog/_components/post-card.tsx";
import { Bookmark, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type BookmarkedPost = Doc<"posts"> & { authorName: string; bookmarkedAt: number };

function BookmarksList() {
  const posts = useQuery(api.bookmarks.getMyBookmarks);
  const navigate = useNavigate();

  if (posts === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bookmark />
          </EmptyMedia>
          <EmptyTitle>No saved posts yet</EmptyTitle>
          <EmptyDescription>Bookmark posts you want to read later and they'll appear here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={() => navigate("/")} className="cursor-pointer">
            Browse Posts
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post: BookmarkedPost, i: number) => (
        <motion.div
          key={post._id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        >
          <PostCard post={post} />
        </motion.div>
      ))}
    </div>
  );
}

export default function BookmarksPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Bookmark className="w-6 h-6 text-primary" />
          <h1 className="font-serif text-3xl font-bold">Saved Posts</h1>
        </div>
        <p className="text-muted-foreground">Posts you've bookmarked for later reading.</p>
      </motion.div>

      <AuthLoading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Bookmark className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-center max-w-sm">
            Sign in to view your saved posts and bookmark new ones.
          </p>
          <SignInButton />
        </div>
      </Unauthenticated>

      <Authenticated>
        <BookmarksList />
      </Authenticated>
    </div>
  );
}
