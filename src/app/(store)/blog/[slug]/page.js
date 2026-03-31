import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/dbConnect";
import BlogPost from "@/models/BlogPost";
import PageBanner from "@/components/store/PageBanner";
import BlogArticleBody from "@/components/blog/BlogArticleBody";
import { getContactSection } from "@/lib/staticData";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectDB();
  const post = await BlogPost.findOne({ slug, published: true })
    .select("title excerpt banner.url metaTitle metaDescription")
    .lean();
  if (!post) return { title: "Article" };
  const contact = await getContactSection();
  const site = contact?.siteName || "Store";
  const metaTitle = (post.metaTitle || "").trim();
  const metaDesc = (post.metaDescription || "").trim();
  return {
    title: metaTitle || post.title,
    description: metaDesc || post.excerpt || `${post.title} — ${site}`,
    openGraph: {
      title: metaTitle || post.title,
      description: metaDesc || post.excerpt || "",
      images: post.banner?.url ? [post.banner.url] : [],
      type: "website",
    },
  };
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  await connectDB();
  const post = await BlogPost.findOne({ slug, published: true }).lean();
  if (!post) notFound();

  return (
    <article className="pb-16">
      <PageBanner
        accent="blog"
        title={post.title}
        subtitle={post.excerpt || ""}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      <div className="store-container py-10 md:py-14 max-w-3xl">
        {post.banner?.url && (
          <div className="rounded-2xl overflow-hidden border border-[var(--store-border)] shadow-md mb-10">
            <img
              src={post.banner.url}
              alt=""
              className="w-full h-auto max-h-[420px] object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-[var(--store-muted)] mb-6">
          {post.createdAt && (
            <time>
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          {post.author && <span>· {post.author}</span>}
          {post.category && (
            <span className="rounded-full bg-[var(--store-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[#b45309]">
              {post.category}
            </span>
          )}
        </div>

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((t) => (
              <span
                key={t}
                className="text-xs border border-[var(--store-border)] rounded-full px-2 py-0.5 text-[var(--store-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <BlogArticleBody contentHtml={post.contentHtml} blocks={post.blocks || []} />

        <div className="mt-12 pt-8 border-t border-[var(--store-border)]">
          <Link
            href="/blog"
            className="inline-flex font-bold text-[var(--store-primary)] hover:underline"
          >
            ← All articles
          </Link>
        </div>
      </div>
    </article>
  );
}
