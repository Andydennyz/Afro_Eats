import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { PostCard, FeaturedPostCard, TrendingBadge } from "./blog/_components/post-card.tsx";
import { NewsletterCTA } from "./blog/_components/newsletter-form.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { TrendingUp, Eye, Hash } from "lucide-react";

const CATEGORIES = [
  { label: "Articles", slug: "articles", emoji: "📰" },
  { label: "Recipes", slug: "recipes", emoji: "🍲" },
  { label: "News", slug: "news", emoji: "📡" },
  { label: "Stories", slug: "stories", emoji: "📖" },
  { label: "Guides", slug: "guides", emoji: "🗺️" },
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1765338915553-6e02fe63ff4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "https://images.unsplash.com/photo-1665332195309-9d75071138f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
];

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-sidebar">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${HERO_IMAGES[0]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/80 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-xl"
        >
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sidebar-primary font-display tracking-widest text-lg mb-3"
          >
            THE TASTE OF AFRICA
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight mb-5 text-balance"
          >
            Discover the Soul of African Cuisine
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-white/70 text-lg mb-8 leading-relaxed"
          >
            From smoky jollof to injera feasts — explore recipes, stories, news, and guides from
            across the continent.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.4 }}
            className="flex flex-wrap gap-3"
          >
            <Link to="/category/recipes">
              <Button size="lg" className="bg-primary hover:bg-primary/90 cursor-pointer">
                Explore Recipes
              </Button>
            </Link>
            <Link to="/category/stories">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20 border-white/20 cursor-pointer"
              >
                Read Stories
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  const featured = useQuery(api.posts.getFeatured);

  if (!featured) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Featured</h2>
        <div className="h-px flex-1 mx-4 bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FeaturedPostCard post={featured[0]} />
        </div>
        {featured.slice(1).map((post) => (
          <FeaturedPostCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}

function CategoryBrowse() {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-6">
      <h2 className="font-serif text-2xl font-bold mb-6">Browse by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Link
              to={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group text-center"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                {cat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PopularPosts() {
  const popular = useQuery(api.posts.getPopular, { limit: 5 });

  if (popular === undefined) {
    return (
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h2 className="font-serif text-2xl font-bold">Popular Posts</h2>
          <div className="h-px flex-1 mx-4 bg-border" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (popular.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pb-12">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h2 className="font-serif text-2xl font-bold">Popular Posts</h2>
        <div className="h-px flex-1 mx-4 bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {popular.map((post, i) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <Link
              to={`/post/${post.slug}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
            >
              <span className="text-3xl font-serif font-bold text-muted-foreground/30 w-8 shrink-0 text-center">
                {i + 1}
              </span>
              {post.coverImage && (
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingBadge />
                </div>
                <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.viewCount?.toLocaleString()} views
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}


function TagCloud() {
  const tags = useQuery(api.posts.getAllTags);

  if (!tags || tags.length === 0) return null;

  // Show up to 20 tags
  const displayTags = tags.slice(0, 20);

  return (
    <section className="max-w-7xl mx-auto px-4 pb-10">
      <div className="flex items-center gap-2 mb-5">
        <Hash className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-2xl font-bold">Explore by Tag</h2>
        <div className="h-px flex-1 mx-4 bg-border" />
      </div>
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {displayTags.map(({ tag, count }, i) => (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
          >
            <Link
              to={`/tag/${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
            >
              <Hash className="w-3 h-3" />
              {tag}
              <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
                {count}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}


function LatestPosts() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.list,
    { status: "published" },
    { initialNumItems: 6 },
  );

  return (
    <section className="max-w-7xl mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Latest Posts</h2>
        <div className="h-px flex-1 mx-4 bg-border" />
      </div>
      {status === "LoadingFirstPage" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-serif">No posts yet. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((post, i) => (
              <PostCard key={post._id} post={post} index={i} />
            ))}
          </div>
          {status === "CanLoadMore" && (
            <div className="text-center mt-10">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => loadMore(6)}
                className="cursor-pointer"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function Index() {
  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <CategoryBrowse />
      <PopularPosts />
      <TagCloud />
      <LatestPosts />
      <NewsletterCTA />
    </>
  );
}
