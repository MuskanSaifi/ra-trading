import { sanitizeBlogHtml } from "@/lib/blogHtml";
import BlogContent from "./BlogContent";

export default function BlogArticleBody({ contentHtml, blocks }) {
  const trimmed = typeof contentHtml === "string" ? contentHtml.trim() : "";
  if (trimmed) {
    const safe = sanitizeBlogHtml(trimmed);
    return (
      <div
        className="blog-html max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }
  return <BlogContent blocks={blocks || []} />;
}
