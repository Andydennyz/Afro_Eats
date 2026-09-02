/**
 * Injects per-post Open Graph / Twitter meta tags and canonical URL
 * into <head> using React's built-in <title> + <meta> JSX support (React 19).
 */
interface PostSeoHeadProps {
  title: string;
  description: string;
  coverImage?: string;
  slug: string;
  publishedAt?: string;
  authorName: string;
}

export default function PostSeoHead({
  title,
  description,
  coverImage,
  slug,
  publishedAt,
  authorName,
}: PostSeoHeadProps) {
  const url = `${window.location.origin}/post/${slug}`;
  const siteName = "Afro Eats";

  return (
    <>
      <title>{title} — {siteName}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      {coverImage && <meta property="og:image" content={coverImage} />}
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      <meta property="article:author" content={authorName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {coverImage && <meta name="twitter:image" content={coverImage} />}
    </>
  );
}
