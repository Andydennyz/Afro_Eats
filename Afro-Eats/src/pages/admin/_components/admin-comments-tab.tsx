import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { CheckCircle, Flag, Trash2, MessageSquare, ExternalLink, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type CommentStatus = "visible" | "flagged" | "deleted";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  visible: { label: "Visible", variant: "secondary" },
  flagged: { label: "Flagged", variant: "destructive" },
  deleted: { label: "Deleted", variant: "outline" },
};

type FilterTab = "all" | "flagged" | "visible";

export default function AdminCommentsTab() {
  const comments = useQuery(api.comments.adminList);
  const flagComment = useMutation(api.comments.flagComment);
  const approveComment = useMutation(api.comments.approveComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const flaggedCount = comments?.filter((c) => c.status === "flagged").length ?? 0;

  const filtered = comments?.filter((c) => {
    if (filter === "flagged") return c.status === "flagged";
    if (filter === "visible") return c.status === "visible";
    return true;
  }) ?? [];

  const runAction = async (
    id: Id<"comments">,
    action: () => Promise<unknown>,
    successMsg: string,
  ) => {
    setLoadingId(id);
    try {
      await action();
      toast.success(successMsg);
    } catch {
      toast.error("Action failed");
    } finally {
      setLoadingId(null);
    }
  };

  if (comments === undefined) {
    return (
      <div className="p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Flagged alert banner */}
      {flaggedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-5 flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm"
        >
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-destructive font-medium">
            {flaggedCount} flagged {flaggedCount === 1 ? "comment" : "comments"} need review
          </span>
          <button
            className="ml-auto text-xs underline text-destructive cursor-pointer hover:opacity-80"
            onClick={() => setFilter("flagged")}
          >
            Review now
          </button>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 px-5 pt-4 border-b border-border">
        {(["all", "flagged", "visible"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px capitalize
              ${filter === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
            {tab === "flagged" && flaggedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                {flaggedCount}
              </span>
            )}
            {tab === "all" && (
              <span className="text-xs text-muted-foreground">({comments.length})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {filter === "flagged" ? "No flagged comments" : "No comments yet"}
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="divide-y divide-border">
            {filtered.map((comment) => {
              const isLoading = loadingId === comment._id;
              const statusMeta = STATUS_BADGE[comment.status as CommentStatus] ?? STATUS_BADGE.visible;
              return (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`px-5 py-4 hover:bg-muted/20 transition-colors ${comment.status === "flagged" ? "bg-destructive/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Left: avatar placeholder */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 mt-0.5">
                      {(comment.authorName ?? "A")[0].toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{comment.authorName}</span>
                        <Badge variant={statusMeta.variant} className="text-xs">
                          {statusMeta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment._creationTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/90 mb-2 line-clamp-3">{comment.content}</p>

                      <Link
                        to={`/post/${comment.postSlug}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {comment.postTitle}
                      </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {comment.status === "flagged" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="cursor-pointer h-8 gap-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                          onClick={() =>
                            runAction(
                              comment._id,
                              () => approveComment({ commentId: comment._id }),
                              "Comment approved",
                            )
                          }
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                      )}
                      {comment.status === "visible" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="cursor-pointer h-8 gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          onClick={() =>
                            runAction(
                              comment._id,
                              () => flagComment({ commentId: comment._id }),
                              "Comment flagged",
                            )
                          }
                        >
                          <Flag className="w-3.5 h-3.5" />
                          Flag
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading}
                        className="cursor-pointer h-8 w-8 hover:text-destructive"
                        onClick={() =>
                          runAction(
                            comment._id,
                            () => deleteComment({ commentId: comment._id }),
                            "Comment deleted",
                          )
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
