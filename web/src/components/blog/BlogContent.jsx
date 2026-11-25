export default function BlogContent({ blocks = [] }) {
  if (!blocks.length) {
    return <p className="text-[var(--store-muted)]">No content yet.</p>;
  }

  return (
    <div className="prose-blog space-y-6 max-w-none">
      {blocks.map((block, i) => {
        const key = block._id || i;
        switch (block.type) {
          case "h1":
            return (
              <h1 key={key} className="text-3xl md:text-4xl font-extrabold text-[var(--store-ink)]">
                {block.text}
              </h1>
            );
          case "h2":
            return (
              <h2 key={key} className="text-2xl md:text-3xl font-bold text-[var(--store-ink)]">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} className="text-xl md:text-2xl font-bold text-[var(--store-ink)]">
                {block.text}
              </h3>
            );
          case "h4":
            return (
              <h4 key={key} className="text-lg md:text-xl font-bold text-[var(--store-ink)]">
                {block.text}
              </h4>
            );
          case "h5":
            return (
              <h5 key={key} className="text-base md:text-lg font-bold text-[var(--store-ink)]">
                {block.text}
              </h5>
            );
          case "p":
            return (
              <p key={key} className="text-[var(--store-muted)] leading-relaxed whitespace-pre-wrap">
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul
                key={key}
                className="list-disc pl-6 space-y-2 text-[var(--store-muted)]"
              >
                {(block.items || []).map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "img":
            return block.url ? (
              <figure key={key} className="rounded-xl overflow-hidden border border-[var(--store-border)] shadow-sm">
                <img src={block.url} alt="" className="w-full h-auto object-cover max-h-[480px]" />
              </figure>
            ) : null;
          default:
            return null;
        }
      })}
    </div>
  );
}
