import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, UserCircle, MessageSquare, Heart, Bookmark, Edit2, Check, X, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-card border border-border">
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-2xl font-bold font-serif">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function EditProfileForm({ currentDisplayName, currentBio, onClose }: {
  currentDisplayName?: string;
  currentBio?: string;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [bio, setBio] = useState(currentBio ?? "");
  const updateProfile = useMutation(api.users.updateProfile);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName || undefined, bio: bio || undefined });
      toast.success("Profile updated!");
      onClose();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 mb-6"
    >
      <h3 className="font-semibold mb-4 text-sm">Edit Profile</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            maxLength={50}
            className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
            maxLength={200}
            className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/200</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving} className="cursor-pointer">
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer">
            <Check className="w-3.5 h-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileContent({ userId }: { userId: Id<"users"> }) {
  const profile = useQuery(api.users.getPublicProfile, { userId });
  const currentUser = useQuery(api.users.getCurrentUser);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  const isOwnProfile = currentUser?._id === userId;
  const displayName = profile?.user?.displayName || profile?.user?.name || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (profile === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!profile.user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        <h1 className="font-serif text-2xl font-bold mb-2">User Not Found</h1>
        <Button onClick={() => navigate("/")} className="cursor-pointer mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-5 mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-2xl font-bold">{displayName}</h1>
            {profile.user.role === "admin" && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
          {profile.user.bio ? (
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{profile.user.bio}</p>
          ) : isOwnProfile ? (
            <p className="text-muted-foreground/50 text-sm mt-1 italic">No bio yet. Add one below!</p>
          ) : null}
          {isOwnProfile && !editing && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 cursor-pointer -ml-2 text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Profile
            </Button>
          )}
        </div>
      </motion.div>

      {/* Edit form */}
      {editing && (
        <EditProfileForm
          currentDisplayName={profile.user.displayName}
          currentBio={profile.user.bio}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex gap-3 flex-wrap mb-8"
      >
        <StatPill icon={MessageSquare} label="Comments" value={profile.commentCount} />
        <StatPill icon={Heart} label="Post Likes" value={profile.likeCount} />
        <StatPill icon={Bookmark} label="Bookmarks" value={profile.bookmarkCount} />
      </motion.div>

      {/* Recent Comments */}
      {profile.recentComments.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Recent Comments
          </h2>
          <div className="space-y-3">
            {profile.recentComments.map((comment) => (
              <div key={comment._id} className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-foreground/90 mb-2 line-clamp-3">{comment.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {comment.postTitle && (
                    <Link
                      to={`/post/${comment.postId}`}
                      className="hover:text-primary transition-colors truncate max-w-[70%]"
                    >
                      On: {comment.postTitle}
                    </Link>
                  )}
                  <span>
                    {new Date(comment._creationTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {profile.recentComments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No comments yet.</p>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">Invalid profile URL.</p>
        <Button onClick={() => navigate("/")} className="cursor-pointer mt-4">Back to Home</Button>
      </div>
    );
  }

  return (
    <>
      <AuthLoading>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </AuthLoading>
      {/* Profile is public — visible to anyone */}
      <Unauthenticated>
        <ProfileContent userId={userId as Id<"users">} />
      </Unauthenticated>
      <Authenticated>
        <ProfileContent userId={userId as Id<"users">} />
      </Authenticated>
    </>
  );
}
