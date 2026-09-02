import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useEffect, useState, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CategoryBadge } from "../_components/post-card.tsx";
import RecipeCard from "../_components/recipe-card.tsx";
import { Clock, Eye, ArrowLeft, Heart, Send, MessageCircle, ChevronUp } from "lucide-react";
import LikeBookmarkButtons from "../_components/like-bookmark-buttons.tsx";
import PostSeoHead from "../_components/post-seo-head.tsx";
import ShareButtons from "../_components/share-buttons.tsx";
import RelatedPosts from "../_components/related-posts.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils.ts";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";

type Comment = Doc<"comments"> & { authorName: string };

// ─── Reading progress bar ───────────────────────────────────────────────────
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
      <motion.div
        className="h-full bg-primary origin-left"
        style={{ scaleX: progress / 100 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      />
    </div>
  );
}

// ─── Back to top button ──────────────────────────────────────────────────────
function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-8 right-6 z-40 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── Comment item ─────────────────────────────────────────────────────────────
function CommentItem({
  comment,
  allComments,
  postId,
  depth = 0,
}: {
  comment: Comment;
  allComments: Comment[];
  postId: Id<"posts">;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const createComment = useMutation(api.comments.create);
  const likeComment = useMutation(api.comments.likeComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const currentUser = useQuery(api.users.getCurrentUser);

  const replies = allComments.filter((c) => c.parentId === comment._id);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await createComment({ postId, content: replyText, parentId: comment._id });
      setReplyText("");
      setReplying(false);
    } catch (e) {
      if (e instanceof ConvexError) toast.error((e.data as { message: string }).message);
      else toast.error("Failed to reply");
    }
  };

  return (
    <div className={cn(depth > 0 && "ml-6 border-l-2 border-border pl-4")}>
      <div className="py-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {(comment.authorName[0] ?? "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment._creationTime).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => likeComment({ commentId: comment._id }).catch(() => {})}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Heart className="w-3 h-3" />
                {comment.likeCount ?? 0}
              </button>
              <Authenticated>
                {depth < 2 && (
                  <button
                    onClick={() => setReplying((r) => !r)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    Reply
                  </button>
                )}
                {currentUser?._id === comment.authorId && (
                  <button
                    onClick={() =>
                      deleteComment({ commentId: comment._id }).catch(() =>
                        toast.error("Failed to delete"),
                      )
                    }
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </Authenticated>
            </div>
          </div>
        </div>
        {replying && (
          <div className="mt-3 ml-11 flex gap-2">
            <input
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
            />
            <Button size="sm" onClick={handleReply} className="cursor-pointer">
              <Send className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      {replies.map((r) => (
        <CommentItem
          key={r._id}
          comment={r}
          allComments={allComments}
          postId={postId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// ─── Comments section ─────────────────────────────────────────────────────────
function CommentsSection({ postId }: { postId: Id<"posts"> }) {
  const comments = useQuery(api.comments.listByPost, { postId });
  const createComment = useMutation(api.comments.create);
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      await createComment({ postId, content: text });
      setText("");
      toast.success("Comment posted!");
    } catch (e) {
      if (e instanceof ConvexError) toast.error((e.data as { message: string }).message);
      else toast.error("Failed to post comment");
    }
  };

  const topLevelComments = comments?.filter((c) => !c.parentId) ?? [];

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h3 className="font-serif text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-primary" />
        Comments ({comments?.length ?? 0})
      </h3>

      <Authenticated>
        <div className="flex gap-3 mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button onClick={handleSubmit} className="self-end cursor-pointer">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="bg-muted rounded-xl p-5 mb-8 text-center">
          <p className="text-muted-foreground mb-3">Sign in to join the conversation</p>
          <SignInButton />
        </div>
      </Unauthenticated>

      {!comments ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : topLevelComments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-1 divide-y divide-border">
          {topLevelComments.map((c: Comment) => (
            <CommentItem
              key={c._id}
              comment={c}
              allComments={comments}
              postId={postId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main post page ───────────────────────────────────────────────────────────
export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = useQuery(api.posts.getBySlug, { slug: slug ?? "" });
  const incrementViews = useMutation(api.posts.incrementViews);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post?._id) {
      incrementViews({ id: post._id }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?._id]);

  if (post === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-6 w-3/4 mb-8" />
        <Skeleton className="h-72 w-full rounded-2xl mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-4", i % 5 === 4 ? "w-2/3" : "w-full")} />
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-8">This post may have been moved or deleted.</p>
        <Button onClick={() => navigate("/")} className="cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];

  return (
    <>
      <PostSeoHead
        title={post.seoTitle ?? post.title}
        description={post.seoDescription ?? post.excerpt}
        coverImage={post.coverImage}
        slug={post.slug}
        publishedAt={post.publishedAt}
        authorName={post.authorName ?? ""}
      />

      <ReadingProgressBar />
      <BackToTopButton />

      <article ref={articleRef} className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Category + tags */}
          <div className="flex items-center flex-wrap gap-2 mb-5">
            <CategoryBadge category={post.category} />
            {tags.map((tag) => (
              <Link
                key={tag}
                to={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight text-balance mb-5">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>

          {/* Meta bar */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-y border-border py-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                {(post.authorName?.[0] ?? "A").toUpperCase()}
              </div>
              <span className="font-semibold text-foreground">{post.authorName ?? "Unknown"}</span>
            </div>

            {post.publishedAt && (
              <span>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}

            {post.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime} min read
              </span>
            )}

            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {(post.viewCount ?? 0).toLocaleString()} views
            </span>

            <div className="ml-auto">
              <LikeBookmarkButtons postId={post._id} />
            </div>
          </div>
        </motion.div>

        {/* Cover image */}
        {post.coverImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-2xl overflow-hidden mb-10 aspect-[16/9] shadow-md"
          >
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </motion.div>
        )}

        {/* Recipe card — shown before prose for recipe posts */}
        {post.recipeData && <RecipeCard data={post.recipeData} />}

        {/* Article body */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share */}
        <div className="mt-12 pt-6 border-t border-border">
          <ShareButtons title={post.title} slug={post.slug} />
        </div>

        {/* Related posts */}
        <RelatedPosts postId={post._id} category={post.category} />

        {/* Comments */}
        <CommentsSection postId={post._id} />
      </article>
    </>
  );
}
