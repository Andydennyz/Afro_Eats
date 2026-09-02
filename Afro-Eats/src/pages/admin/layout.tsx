import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  LayoutDashboard,
  PenSquare,
  ChefHat,
  LogOut,
  Home,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { motion } from "motion/react";

function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signout } = useAuth();

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/editor", label: "New Post", icon: PenSquare, exact: true },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-sidebar" />
          </div>
          <span className="font-display text-xl text-sidebar-primary tracking-wide">AFRO EATS</span>
        </Link>
        <p className="text-xs text-sidebar-foreground/50 mt-1 ml-10">Admin Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Home className="w-4 h-4 mr-2" />
          View Blog
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive cursor-pointer"
          onClick={() => signout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

function AdminGuard() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2">Admin Access Only</h2>
          <p className="text-muted-foreground text-sm mb-6">
            This area is restricted to administrators. If you are the site owner, your account
            needs admin privileges.
          </p>
          <Button variant="secondary" onClick={() => window.history.back()} className="cursor-pointer">
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return <Outlet />;
}

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <Unauthenticated>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold mb-4">Sign in to access the Admin</h2>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-32 w-64" />
        </div>
      </AuthLoading>
      <Authenticated>
        <AdminNav />
        <main className="flex-1 overflow-auto bg-muted/30">
          <AdminGuard />
        </main>
      </Authenticated>
    </div>
  );
}
