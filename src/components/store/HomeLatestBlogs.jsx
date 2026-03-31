"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomeLatestBlogs() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/store/blog?limit=3&page=1", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setPosts(Array.isArray(json?.posts) ? json.posts : []);
      } catch {
        if (alive) setPosts([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="store-container py-12 md:py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--store-muted)]">
            Latest
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-black text-[var(--store-ink)]">
            From our blog
          </h2>
        </div>
        <Link
          href="/blog"
          className="hidden sm:inline-flex items-center justify-center rounded-xl border border-[var(--store-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--store-ink)] hover:border-[var(--store-primary)]/40 hover:text-[var(--store-primary)] transition"
        >
          View more blogs →
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-[var(--store-muted)]">Loading…</p>
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
                  <h3 className="mt-2 text-lg font-bold text-[var(--store-ink)] group-hover:text-[var(--store-primary)] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
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

      <div className="mt-10 sm:hidden">
        <Link
          href="/blog"
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#ff9900] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:brightness-95 transition"
        >
          View more blogs
        </Link>
      </div>
    </section>
  );
}

