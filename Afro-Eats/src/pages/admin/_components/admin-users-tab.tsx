import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { UserCircle, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function AdminUsersTab() {
  const users = useQuery(api.users.adminListUsers);
  const setAdmin = useMutation(api.users.setAdminRole);
  const navigate = useNavigate();

  const handlePromote = async (userId: Id<"users">, name?: string) => {
    try {
      await setAdmin({ userId });
      toast.success(`${name ?? "User"} is now an admin`);
    } catch {
      toast.error("Failed to update role");
    }
  };

  if (users === undefined) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <UserCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No users yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {users.map((user, i) => {
        const displayName = user.displayName || user.name || "Anonymous";
        const initials = displayName.slice(0, 2).toUpperCase();
        return (
          <motion.div
            key={user._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{displayName}</span>
                {user.role === "admin" && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email ?? "No email"}</p>
              {user.bio && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{user.bio}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer h-8 w-8"
                title="View profile"
                onClick={() => navigate(`/profile/${user._id}`)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              {user.role !== "admin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer h-8 text-xs"
                  onClick={() => handlePromote(user._id, user.name)}
                >
                  <ShieldCheck className="w-3 h-3 mr-1" /> Make Admin
                </Button>
              )}
              {user.role === "admin" && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
