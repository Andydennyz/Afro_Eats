import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import NewsletterForm from "./_components/newsletter-form.tsx";
import { Moon, Sun, Search, Menu, X, ChefHat, Bookmark } from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = ["Articles", "Recipes", "News", "Stories", "Guides"];

function NavUserArea() {
  const user = useQuery(api.users.getCurrentUser);
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2">
      {user?.role === "admin" && (
        <Button size="sm" variant="secondary" onClick={() => navigate("/admin")}>
          Admin
        </Button>
      )}
      <Authenticated>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/bookmarks")}
          className="cursor-pointer"
          title="Saved posts"
        >
          <Bookmark className="w-4 h-4" />
        </Button>
        <button
          onClick={() => user && navigate(`/profile/${user._id}`)}
          title="My Profile"
          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
        >
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </button>
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <AuthLoading>
        <Skeleton className="w-8 h-8 rounded-full" />
      </AuthLoading>
    </div>
  );
}

function MobileProfileLink({ onClose }: { onClose: () => void }) {
  const user = useQuery(api.users.getCurrentUser);
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <button
      onClick={() => { navigate(`/profile/${user._id}`); onClose(); }}
      className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary text-muted-foreground flex items-center gap-2 cursor-pointer w-full text-left"
    >
      <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
        {user.name?.[0]?.toUpperCase() ?? "U"}
      </div>
      My Profile
    </button>
  );
}


export default function BlogLayout() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl text-primary tracking-wide hidden sm:block">
              AFRO EATS
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-primary ${location.pathname === "/" ? "text-primary" : "text-muted-foreground"}`}
            >
              Home
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/category/${cat.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-primary ${location.pathname === `/category/${cat.toLowerCase()}` ? "text-primary" : "text-muted-foreground"}`}
              >
                {cat}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((s) => !s)}
              className="cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDark}
              className="cursor-pointer"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <div className="hidden sm:block">
              <NavUserArea />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden cursor-pointer"
              onClick={() => setMenuOpen((m) => !m)}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
                <input
                  autoFocus
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search recipes, articles, stories..."
                  className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="sm">
                  Search
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary"
                >
                  Home
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/category/${cat.toLowerCase()}`}
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary text-muted-foreground"
                  >
                    {cat}
                  </Link>
                ))}
                <Authenticated>
                  <Link
                    to="/bookmarks"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary text-muted-foreground flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" /> Saved Posts
                  </Link>
                  <MobileProfileLink onClose={() => setMenuOpen(false)} />
                </Authenticated>
                <div className="pt-2 border-t border-border">
                  <NavUserArea />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl text-sidebar-primary tracking-wide">
                AFRO EATS
              </span>
            </div>
            <p className="text-sm text-sidebar-foreground/70 leading-relaxed">
              Celebrating the rich, diverse, and vibrant food culture of Africa — from street food
              to traditional feasts.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sidebar-primary">Explore</h4>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  to={`/category/${cat.toLowerCase()}`}
                  className="text-sm text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sidebar-primary">Newsletter</h4>
            <p className="text-sm text-sidebar-foreground/70 mb-3">
              Get the latest African food stories delivered to your inbox.
            </p>
            <NewsletterForm variant="footer" />
          </div>
        </div>
        <div className="border-t border-sidebar-border px-4 py-4 text-center text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Afro Eats. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
