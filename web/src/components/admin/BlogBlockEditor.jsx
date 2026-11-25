"use client";

import { ChevronDown, ChevronUp, Trash2, ImagePlus } from "lucide-react";

const BLOCK_TYPES = [
  { type: "h1", label: "H1" },
  { type: "h2", label: "H2" },
  { type: "h3", label: "H3" },
  { type: "h4", label: "H4" },
  { type: "h5", label: "H5" },
  { type: "p", label: "Paragraph" },
  { type: "ul", label: "Bullet list" },
  { type: "img", label: "Image" },
];

function newClientId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function serializeBlocks(blocks) {
  return blocks.map((b) => {
    const o = { type: b.type };
    if (b.type === "ul") {
      o.items = (b.items || [])
        .map((x) => String(x).trim())
        .filter(Boolean);
    } else if (b.type === "img") {
      o.url = b.url || "";
      o.publicId = b.publicId || "";
    } else {
      o.text = b.text || "";
    }
    return o;
  });
}

export default function BlogBlockEditor({ blocks, setBlocks }) {
  const addBlock = (type) => {
    const id = newClientId();
    const base = { _clientId: id, type };
    if (type === "ul") base.items = [""];
    else if (type === "img") {
      base.url = "";
      base.publicId = "";
    } else base.text = "";
    setBlocks((prev) => [...prev, base]);
  };

  const move = (index, dir) => {
    setBlocks((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const remove = (index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const patch = (index, patchFn) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index] = patchFn(next[index]);
      return next;
    });
  };

  const uploadImage = async (file, index) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload/blog", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Upload failed");
    setBlocks((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        url: data.url,
        publicId: data.publicId,
      };
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-[var(--store-primary-soft)] border border-gray-300"
          >
            + {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div
            key={block._clientId || block._id || index}
            className="border rounded-xl p-4 bg-white shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase text-[var(--store-primary)]">
                {block.type}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-gray-100"
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-gray-100"
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-red-50 text-red-600"
                  onClick={() => remove(index)}
                  aria-label="Remove block"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {block.type === "ul" ? (
              <div className="space-y-2">
                <label className="text-xs text-gray-500">One bullet per line</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm min-h-[120px]"
                  value={(block.items || []).join("\n")}
                  onChange={(e) =>
                    patch(index, (b) => ({
                      ...b,
                      items: e.target.value.split("\n"),
                    }))
                  }
                />
              </div>
            ) : block.type === "img" ? (
              <div className="space-y-2">
                {block.url && (
                  <img src={block.url} alt="" className="max-h-40 rounded-lg border object-contain" />
                )}
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-[var(--store-primary)]">
                  <ImagePlus size={18} />
                  Upload / replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        await uploadImage(f, index);
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                value={block.text || ""}
                onChange={(e) =>
                  patch(index, (b) => ({ ...b, text: e.target.value }))
                }
                placeholder={`${block.type.toUpperCase()} text`}
              />
            )}
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-gray-500">Add blocks to build your article.</p>
      )}
    </div>
  );
}
