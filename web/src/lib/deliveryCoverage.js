import DeliveryZone from "@/models/DeliveryZone";

function normalizeText(v) {
  return String(v || "").trim();
}

function normalizeKey(v) {
  return normalizeText(v).toLowerCase();
}

function normalizePincode(v) {
  return String(v || "").replace(/\D/g, "").slice(0, 6);
}

export function normalizeAddressForCoverage(address) {
  const country = normalizeText(address?.country || "India");
  const state = normalizeText(address?.state || "");
  const city = normalizeText(address?.city || "");
  const pincode = normalizePincode(address?.pincode || address?.pinCode || "");
  return { country, state, city, pincode };
}

export async function checkDeliveryCoverage(address, { suggestionLimit = 6 } = {}) {
  const a = normalizeAddressForCoverage(address);

  if (!a.country || !a.city || !a.pincode) {
    return {
      ok: false,
      status: 400,
      message: "Delivery check requires country, city and pincode",
      suggestions: [],
    };
  }

  const countryKey = normalizeKey(a.country);
  const stateKey = normalizeKey(a.state);
  const cityKey = normalizeKey(a.city);

  // If admin hasn't configured delivery zones yet, don't block checkout.
  const configuredCount = await DeliveryZone.countDocuments({ enabled: true });
  if (configuredCount === 0) {
    return { ok: true, status: 200, message: "Serviceable", suggestions: [] };
  }

  // Exact match (case-insensitive on text, exact pincode)
  const exact = await DeliveryZone.findOne({
    enabled: true,
    country: { $regex: new RegExp(`^${escapeRegex(a.country)}$`, "i") },
    city: { $regex: new RegExp(`^${escapeRegex(a.city)}$`, "i") },
    pincode: { $in: [a.pincode, "*"] },
    ...(a.state ? { state: { $regex: new RegExp(`^${escapeRegex(a.state)}$`, "i") } } : {}),
  }).lean();

  if (exact) {
    return { ok: true, status: 200, message: "Serviceable", suggestions: [] };
  }

  // Suggestions: same city (any pincode) → same state → same country
  const suggestions = [];

  const sameCity = await DeliveryZone.find({
    enabled: true,
    country: { $regex: new RegExp(`^${escapeRegex(a.country)}$`, "i") },
    city: { $regex: new RegExp(`^${escapeRegex(a.city)}$`, "i") },
  })
    .sort({ updatedAt: -1 })
    .limit(suggestionLimit)
    .lean();

  for (const z of sameCity) suggestions.push(zoneToSuggestion(z));

  if (suggestions.length < suggestionLimit && a.state) {
    const sameState = await DeliveryZone.find({
      enabled: true,
      country: { $regex: new RegExp(`^${escapeRegex(a.country)}$`, "i") },
      state: { $regex: new RegExp(`^${escapeRegex(a.state)}$`, "i") },
    })
      .sort({ updatedAt: -1 })
      .limit(suggestionLimit - suggestions.length)
      .lean();
    for (const z of sameState) suggestions.push(zoneToSuggestion(z));
  }

  if (suggestions.length < suggestionLimit) {
    const sameCountry = await DeliveryZone.find({
      enabled: true,
      country: { $regex: new RegExp(`^${escapeRegex(a.country)}$`, "i") },
    })
      .sort({ updatedAt: -1 })
      .limit(suggestionLimit - suggestions.length)
      .lean();
    for (const z of sameCountry) suggestions.push(zoneToSuggestion(z));
  }

  // De-dup
  const seen = new Set();
  const unique = [];
  for (const s of suggestions) {
    const key = `${normalizeKey(s.country)}|${normalizeKey(s.state)}|${normalizeKey(s.city)}|${s.pincode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(s);
  }

  return {
    ok: false,
    status: 400,
    message: "Sorry, we do not deliver to this location yet.",
    suggestions: unique,
    debug: { countryKey, stateKey, cityKey },
  };
}

function zoneToSuggestion(z) {
  return {
    id: String(z._id),
    country: z.country,
    state: z.state || "",
    city: z.city,
    pincode: z.pincode,
  };
}

function escapeRegex(str) {
  // Avoid regex injection / errors for city names like "Gurgaon (NCR)"
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

