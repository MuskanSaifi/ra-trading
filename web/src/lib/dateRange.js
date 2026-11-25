// Date range presets shared by admin pages (client) and admin APIs (server).

export const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Resolves a preset (in the browser's local time) to { from, to } Date objects.
 * "all" returns nulls. Custom uses YYYY-MM-DD strings.
 */
export function resolveRange({ preset = "30d", from, to } = {}) {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "7d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { from: startOfDay(s), to: endOfDay(now) };
    }
    case "30d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { from: startOfDay(s), to: endOfDay(now) };
    }
    case "month":
      return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
    case "custom":
      return {
        from: from ? startOfDay(new Date(`${from}T00:00:00`)) : null,
        to: to ? endOfDay(new Date(`${to}T00:00:00`)) : null,
      };
    default:
      return { from: null, to: null };
  }
}

/** Query-string fragment ("from=...&to=...") for an admin API call. */
export function rangeQuery(range) {
  const { from, to } = resolveRange(range);
  const params = new URLSearchParams();
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());
  return params.toString();
}

export function rangeLabel(range) {
  if (range?.preset === "custom") {
    const fmt = (s) =>
      s ? new Date(`${s}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…";
    return `${fmt(range.from)} – ${fmt(range.to)}`;
  }
  return DATE_PRESETS.find((p) => p.key === range?.preset)?.label || "All time";
}

/** Mongo filter for a date field from ?from=&to= ISO params. Returns null when unbounded. */
export function dateFilterFromParams(searchParams, field = "createdAt") {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cond = {};
  if (from && !Number.isNaN(Date.parse(from))) cond.$gte = new Date(from);
  if (to && !Number.isNaN(Date.parse(to))) cond.$lte = new Date(to);
  return Object.keys(cond).length ? { [field]: cond } : null;
}

/** True when a date value falls inside a resolved range (used for client-side filtering). */
export function inRange(value, range) {
  const { from, to } = resolveRange(range);
  if (!from && !to) return true;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return false;
  return (!from || t >= from.getTime()) && (!to || t <= to.getTime());
}
