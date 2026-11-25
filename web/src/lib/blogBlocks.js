const ALLOWED_TYPES = new Set(["h1", "h2", "h3", "h4", "h5", "p", "ul", "img"]);

function escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Convert legacy block array to HTML for Tiptap (migration / edit load). */
export function blocksToHtml(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return "<p></p>";
  const parts = [];
  for (const b of blocks) {
    if (!b?.type) continue;
    switch (b.type) {
      case "h1":
        parts.push(`<h1>${escText(b.text || "")}</h1>`);
        break;
      case "h2":
        parts.push(`<h2>${escText(b.text || "")}</h2>`);
        break;
      case "h3":
        parts.push(`<h3>${escText(b.text || "")}</h3>`);
        break;
      case "h4":
        parts.push(`<h4>${escText(b.text || "")}</h4>`);
        break;
      case "h5":
        parts.push(`<h5>${escText(b.text || "")}</h5>`);
        break;
      case "p":
        parts.push(`<p>${escText(b.text || "").replace(/\n/g, "<br />")}</p>`);
        break;
      case "ul":
        parts.push(
          "<ul>" +
            (b.items || [])
              .map((item) => `<li>${escText(item)}</li>`)
              .join("") +
            "</ul>"
        );
        break;
      case "img":
        if (b.url) {
          const pid = b.publicId ? ` data-public-id="${escAttr(b.publicId)}"` : "";
          parts.push(`<img src="${escAttr(b.url)}" alt=""${pid} />`);
        }
        break;
      default:
        break;
    }
  }
  return parts.length ? parts.join("") : "<p></p>";
}

export function normalizeBlogBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => b && ALLOWED_TYPES.has(b.type))
    .map((b) => {
      if (b.type === "ul") {
        return {
          type: "ul",
          items: Array.isArray(b.items)
            ? b.items.map((x) => String(x).trim()).filter(Boolean)
            : [],
        };
      }
      if (b.type === "img") {
        return {
          type: "img",
          url: String(b.url || "").slice(0, 2000),
          publicId: String(b.publicId || "").slice(0, 500),
        };
      }
      return {
        type: b.type,
        text: String(b.text || "").slice(0, 50000),
      };
    });
}
