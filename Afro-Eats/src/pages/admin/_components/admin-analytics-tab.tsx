import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, Heart, MessageSquare, Bookmark, TrendingUp, BarChart2, ExternalLink } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  recipes: "#e07b39",
  articles: "#7c6fcd",
  news: "#e8a020",
  stories: "#9b59b6",
  guides: "#3498db",
  post: "#95a5a6",
};

type StatBubbleProps = {
  label: string;
  value: number;
  icon: React.ElementType;
  delay?: number;
};

function StatBubble({ label, value, icon: Icon, delay = 0 }: StatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="bg-muted/40 rounded-2xl p-5 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold font-serif">{value.toLocaleString()}</p>
    </motion.div>
  );
}

// Format chart date label: "Aug 3"
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Show every 5th tick to reduce clutter
function tickFormatter(val: string, idx: number) {
  return idx % 5 === 0 ? fmtDate(val) : "";
}

export default function AdminAnalyticsTab() {
  const stats = useQuery(api.analytics.getDashboardStats);

  if (stats === undefined) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  // Thin out viewsByDay to every other day for readability on small screens
  const chartData = stats.viewsByDay.filter((_, i) => i % 2 === 0 || i === stats.viewsByDay.length - 1);

  return (
    <div className="p-6 space-y-8">
      {/* Engagement stat bubbles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBubble label="Total Views" value={stats.totalViews} icon={Eye} delay={0} />
        <StatBubble label="Total Likes" value={stats.totalLikes} icon={Heart} delay={0.05} />
        <StatBubble label="Comments" value={stats.totalComments} icon={MessageSquare} delay={0.1} />
        <StatBubble label="Bookmarks" value={stats.totalBookmarks} icon={Bookmark} delay={0.15} />
      </div>

      {/* Views over time */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-serif font-bold text-base">Views — last 30 days</h3>
          <span className="text-xs text-muted-foreground ml-auto">Estimated distribution</span>
        </div>
        {stats.totalViews === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No view data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickFormatter={tickFormatter}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
                labelFormatter={fmtDate}
                formatter={(v: number) => [v.toLocaleString(), "Views"]}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#viewsGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Top posts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="md:col-span-3 bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-bold text-base">Top Posts by Views</h3>
          </div>
          {stats.topPosts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No views recorded yet</div>
          ) : (
            <div className="space-y-3">
              {stats.topPosts.map((post, i) => (
                <div key={post._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Link
                        to={`/post/${post.slug}`}
                        className="text-sm font-medium truncate hover:text-primary transition-colors"
                      >
                        {post.title}
                      </Link>
                      <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="capitalize">{post.category}</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.likeCount}
                      </span>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (post.viewCount / (stats.topPosts[0]?.viewCount ?? 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold shrink-0 tabular-nums">
                    {post.viewCount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2 bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-bold text-base">Views by Category</h3>
          </div>
          {stats.categoryBreakdown.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stats.categoryBreakdown}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barSize={12}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v.toLocaleString(), "Views"]}
                />
                <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                  {stats.categoryBreakdown.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category.toLowerCase()] ?? "#95a5a6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {stats.categoryBreakdown.map((entry) => (
              <div key={entry.category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORY_COLORS[entry.category.toLowerCase()] ?? "#95a5a6" }}
                />
                <span className="capitalize">{entry.category}</span>
                <span className="font-medium text-foreground">({entry.count})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
