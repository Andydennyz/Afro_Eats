import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { PenSquare, Eye, FileText, MessageSquare, Trash2, Edit, Users, AlertTriangle, BarChart2, Download, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import AdminUsersTab from "./_components/admin-users-tab.tsx";
import AdminSubscribersTab from "./_components/admin-subscribers-tab.tsx";
import AdminCommentsTab from "./_components/admin-comments-tab.tsx";
import AdminAnalyticsTab from "./_components/admin-analytics-tab.tsx";
import FoodDbImportTab from "./_components/food-db-import-tab.tsx";
import AdminSubmissionsTab from "./_components/admin-submissions-tab.tsx";

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-5 border border-border"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold font-serif">{value}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"posts" | "analytics" | "comments" | "users" | "subscribers" | "foodDb" | "submissions">("posts");
  const { results: posts, status } = usePaginatedQuery(
    api.posts.adminList,
    {},
    { initialNumItems: 20 },
  );
  const comments = useQuery(api.comments.adminList);
  const removePost = useMutation(api.posts.remove);

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  const handleDelete = async (id: Id<"posts">, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await removePost({ id });
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your blog content</p>
        </div>
        <Button onClick={() => navigate("/admin/editor")} className="cursor-pointer">
          <PenSquare className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Posts" value={posts.length} icon={FileText} />
        <StatCard label="Published" value={published} icon={Eye} />
        <StatCard label="Drafts" value={drafts} icon={PenSquare} />
        <StatCard label="Comments" value={comments?.length ?? 0} icon={MessageSquare} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          Posts
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "analytics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <BarChart2 className="w-4 h-4 inline mr-1.5" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "comments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="w-4 h-4" />
          Comments
          {(comments?.filter((c) => c.status === "flagged").length ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-bold">
              <AlertTriangle className="w-2.5 h-2.5" />
              {comments?.filter((c) => c.status === "flagged").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Users
        </button>
        <button
          onClick={() => setActiveTab("subscribers")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "subscribers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="w-4 h-4 inline mr-1.5" />
          Newsletter
        </button>
        <button
          onClick={() => setActiveTab("foodDb")}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "foodDb" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Download className="w-4 h-4 inline mr-1.5" />
          Food DB
        </button>
        <button onClick={() => setActiveTab("submissions")} className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "submissions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Send className="w-4 h-4 inline mr-1.5" /> Submissions
        </button>
      </div>

      {activeTab === "analytics" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-serif text-lg font-bold">Analytics</h2>
          </div>
          <AdminAnalyticsTab />
        </div>
      ) : activeTab === "foodDb" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <FoodDbImportTab />
        </div>
      ) : activeTab === "submissions" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden"><div className="px-5 py-4 border-b border-border"><h2 className="font-serif text-lg font-bold">Community Submissions</h2></div><AdminSubmissionsTab /></div>
      ) : activeTab === "subscribers" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-serif text-lg font-bold">Newsletter Subscribers</h2>
          </div>
          <AdminSubscribersTab />
        </div>
      ) : activeTab === "users" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-serif text-lg font-bold">All Users</h2>
          </div>
          <AdminUsersTab />
        </div>
      ) : activeTab === "comments" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">Comments</h2>
            {(comments?.filter((c) => c.status === "flagged").length ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {comments?.filter((c) => c.status === "flagged").length} flagged
              </span>
            )}
          </div>
          <AdminCommentsTab />
        </div>
      ) : (
      <>
      {/* Posts Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold">All Posts</h2>
        </div>
        {status === "LoadingFirstPage" ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No posts yet. Create your first post!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0 hidden sm:block"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs">
                      {post.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{post.category}</span>
                    {post.publishedAt && (
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer h-8 w-8"
                    onClick={() => navigate(`/admin/editor/${post._id}`)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer h-8 w-8 hover:text-destructive"
                    onClick={() => handleDelete(post._id, post.title)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
