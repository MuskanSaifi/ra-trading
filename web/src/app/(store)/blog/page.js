import Link from "next/link";
import { connectDB } from "@/lib/dbConnect";
import BlogPost from "@/models/BlogPost";
import PageBanner from "@/components/store/PageBanner";
import { getContactSection } from "@/lib/staticData";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const contact = await getContactSection();
  const name = contact?.siteName || "Store";
  return {
    title: `Blog`,
    description: `Tips, updates, and stories from ${name}.`,
  };
}

export default async function BlogIndexPage() {
  await connectDB();
  const posts = await BlogPost.find({ published: true })
    .sort({ createdAt: -1 })
    .select("title slug excerpt banner.url createdAt")
    .lean();

  return (
    <div className="pb-16">
      <PageBanner
        accent="blog"
        title="Blog"
        subtitle="News, guides, and product stories from our team."
        crumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      />
      <div className="store-container py-12 md:py-16">
        {posts.length === 0 ? (
          <p className="text-center text-[var(--store-muted)]">No articles yet. Check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={String(post._id)}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-[var(--store-border)] bg-white overflow-hidden shadow-sm hover:shadow-lg hover:border-[var(--store-primary)]/40 transition-all"
              >
                <div className="aspect-[16/10] bg-[var(--store-surface)] overflow-hidden">
                  {post.banner?.url ? (
                    <img
                      src={post.banner.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--store-muted)] text-sm">
                      No banner
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <time className="text-xs text-[var(--store-muted)]">
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </time>
                  <h2 className="mt-2 text-lg font-bold text-[var(--store-ink)] group-hover:text-[var(--store-primary)] transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-[var(--store-muted)] line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="mt-4 text-sm font-bold text-[var(--store-primary)]">
                    Read more →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
