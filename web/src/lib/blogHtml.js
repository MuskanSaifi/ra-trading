import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
  "pre",
  "code",
  "hr",
  "div",
  "span",
];

const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "data-public-id",
  "target",
  "rel",
  "width",
  "height",
];

/**
 * Strip dangerous HTML for public blog rendering.
 */
export function sanitizeBlogHtml(html) {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

/**
 * Collect Cloudinary public_ids embedded in editor HTML (img data-public-id).
 */
export function extractPublicIdsFromHtml(html) {
  if (!html || typeof html !== "string") return [];
  const ids = [];
  const re = /data-public-id=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) ids.push(m[1]);
  }
  return [...new Set(ids)];
}
