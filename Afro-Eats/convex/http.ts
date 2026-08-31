import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Serve sitemap.xml for SEO crawlers
http.route({
  path: "/sitemap.xml",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const origin = new URL(request.url).origin.replace(".convex.site", ".onhercules.app");

    const posts = await ctx.runQuery(internal.seo.getPublishedSlugs, {});

    const staticUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
      { loc: `${origin}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${origin}/category/recipes`, priority: "0.8", changefreq: "weekly" },
      { loc: `${origin}/category/articles`, priority: "0.8", changefreq: "weekly" },
      { loc: `${origin}/category/news`, priority: "0.7", changefreq: "weekly" },
      { loc: `${origin}/category/stories`, priority: "0.7", changefreq: "weekly" },
      { loc: `${origin}/category/guides`, priority: "0.7", changefreq: "weekly" },
    ];

    const postUrls = posts.map((p: { slug: string; publishedAt?: string }) => ({
      loc: `${origin}/post/${p.slug}`,
      lastmod: p.publishedAt ? p.publishedAt.split("T")[0] : undefined,
      priority: "0.9",
      changefreq: "monthly",
    }));

    const allUrls = [...staticUrls, ...postUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }),
});

export default http;
