const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiresAt = 0;

function getShiprocketCreds() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function isShiprocketConfigured() {
  return Boolean(getShiprocketCreds());
}

async function shiprocketFetch(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${SHIPROCKET_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Invalid Shiprocket response" };
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : `Shiprocket error (${res.status})`);
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function getShiprocketToken(force = false) {
  const creds = getShiprocketCreds();
  if (!creds) {
    throw new Error("Shiprocket is not configured (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD)");
  }

  if (!force && cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const data = await shiprocketFetch("/auth/login", {
    method: "POST",
    body: { email: creds.email, password: creds.password },
  });

  if (!data?.token) {
    throw new Error("Shiprocket login failed — no token returned");
  }

  cachedToken = data.token;
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || "Customer",
    last: parts.slice(1).join(" ") || "",
  };
}

function estimatePackage(items = []) {
  const qty = items.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
  return {
    length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH || 20),
    breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH || 15),
    height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT || 10),
    weight: Math.max(
      0.5,
      Number(process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5) * Math.max(1, qty)
    ),
  };
}

export async function createShiprocketShipment({
  order,
  user,
  pickupLocation,
  courierId,
} = {}) {
  if (!order) throw new Error("Order is required");

  const token = await getShiprocketToken();
  const { first, last } = splitName(order.address?.name || user?.name || "Customer");
  const pkg = estimatePackage(order.items);
  const paymentMethod = order.paymentMode === "PayU" ? "Prepaid" : "COD";
  const itemsTotal = (order.items || []).reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1),
    0
  );
  // The courier collects sub_total + shipping_charges on COD, so this must add up to the order total
  const shippingCharges = Math.max(0, Number(order.totalAmount || 0) - itemsTotal);

  const orderDate = new Date(order.createdAt || Date.now())
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const payload = {
    order_id: String(order._id),
    order_date: orderDate,
    pickup_location:
      pickupLocation ||
      process.env.SHIPROCKET_PICKUP_LOCATION ||
      "Primary",
    channel_id: process.env.SHIPROCKET_CHANNEL_ID || undefined,
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: order.address?.street || "Address",
    billing_address_2: "",
    billing_city: order.address?.city || "",
    billing_pincode: String(order.address?.pincode || ""),
    billing_state: order.address?.state || "",
    billing_country: "India",
    billing_email: user?.email || process.env.SHIPROCKET_BILLING_EMAIL || "orders@example.com",
    billing_phone: String(order.address?.phone || user?.phone || "").replace(/\D/g, "").slice(-10),
    shipping_is_billing: true,
    order_items: (order.items || []).map((item, idx) => ({
      name: item.name || `Item ${idx + 1}`,
      sku: item.sku || String(item.productId || `SKU-${idx + 1}`),
      units: Number(item.quantity || 1),
      selling_price: Number(item.price || 0),
      discount: 0,
      tax: 0,
      hsn: Number(process.env.SHIPROCKET_DEFAULT_HSN || 3305),
    })),
    payment_method: paymentMethod,
    shipping_charges: Number(shippingCharges.toFixed(2)),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: Number(itemsTotal.toFixed(2)),
    length: pkg.length,
    breadth: pkg.breadth,
    height: pkg.height,
    weight: pkg.weight,
  };

  if (!payload.channel_id) delete payload.channel_id;

  const created = await shiprocketFetch("/orders/create/adhoc", {
    method: "POST",
    token,
    body: payload,
  });

  const shiprocketOrderId = created?.order_id || created?.orderId;
  const shipmentId = created?.shipment_id || created?.shipmentId;

  let awb = created?.awb_code || created?.awb || null;
  let courierName = created?.courier_name || null;
  let labelUrl = created?.label_url || null;
  let assignData = null;

  if (shipmentId && !awb) {
    try {
      const assigned = await assignShiprocketAwb(shipmentId, courierId, token);
      awb = assigned.awb || awb;
      courierName = assigned.courierName || courierName;
      labelUrl = assigned.labelUrl || labelUrl;
      assignData = assigned.raw;
    } catch (err) {
      console.warn("Shiprocket AWB assign:", err.message);
    }
  }

  const trackingUrl = awb ? `https://shiprocket.co/tracking/${awb}` : null;

  return {
    shiprocketOrderId: shiprocketOrderId ? String(shiprocketOrderId) : null,
    shipmentId: shipmentId ? String(shipmentId) : null,
    awb,
    courierName,
    labelUrl,
    trackingUrl,
    raw: { created, assignData },
  };
}


export function extractAwbFromResponse(data) {
  return (
    data?.response?.data?.awb_code ||
    data?.response?.awb_code ||
    data?.awb_code ||
    data?.awb ||
    data?.data?.awb_code ||
    null
  );
}

export function extractCourierFromResponse(data) {
  return (
    data?.response?.data?.courier_name ||
    data?.response?.courier_name ||
    data?.courier_name ||
    data?.data?.courier_name ||
    null
  );
}

/**
 * Assign / generate AWB for an existing Shiprocket shipment_id
 */
export async function assignShiprocketAwb(shipmentId, courierId, existingToken) {
  if (!shipmentId) throw new Error("shipmentId is required to generate AWB");

  const token = existingToken || (await getShiprocketToken());
  const body = {
    shipment_id: Number(shipmentId) || shipmentId,
  };
  if (courierId) body.courier_id = courierId;

  const assignData = await shiprocketFetch("/courier/assign/awb", {
    method: "POST",
    token,
    body,
  });

  let awb = extractAwbFromResponse(assignData);
  let courierName = extractCourierFromResponse(assignData);
  let labelUrl = assignData?.label_url || assignData?.response?.data?.label_url || null;

  // Generate label if AWB exists but label missing
  if (awb && !labelUrl) {
    try {
      const labelData = await shiprocketFetch("/courier/generate/label", {
        method: "POST",
        token,
        body: { shipment_id: [Number(shipmentId) || shipmentId] },
      });
      labelUrl =
        labelData?.label_url ||
        labelData?.response?.label_url ||
        labelData?.data?.label_url ||
        null;
    } catch (err) {
      console.warn("Shiprocket label generate:", err.message);
    }
  }

  if (!awb) {
    throw new Error(
      assignData?.message ||
        "AWB not generated. Check courier serviceability / wallet balance on Shiprocket."
    );
  }

  return {
    awb: String(awb),
    courierName,
    labelUrl,
    trackingUrl: `https://shiprocket.co/tracking/${awb}`,
    raw: assignData,
  };
}

/**
 * Asks the assigned courier to collect the parcel from the pickup address.
 * Returns { scheduledDate, token } or throws.
 */
export async function requestShiprocketPickup(shipmentId, existingToken) {
  if (!shipmentId) throw new Error("shipmentId is required to request pickup");
  const token = existingToken || (await getShiprocketToken());
  const data = await shiprocketFetch("/courier/generate/pickup", {
    method: "POST",
    token,
    body: { shipment_id: [Number(shipmentId) || shipmentId] },
  });
  const res = data?.response || data;
  return {
    scheduledDate: res?.pickup_scheduled_date || res?.data?.pickup_scheduled_date || null,
    token: res?.pickup_token_number || null,
    raw: data,
  };
}

export async function listShiprocketPickupLocations() {
  const token = await getShiprocketToken();
  const data = await shiprocketFetch("/settings/company/pickup", { token });
  return (data?.data?.shipping_address || []).map((a) => ({
    name: a.pickup_location,
    address: [a.address, a.city, a.pin_code].filter(Boolean).join(", "),
    pincode: a.pin_code,
    primary: Boolean(a.is_primary_location),
  }));
}

export async function trackShiprocketByAwb(awb) {
  if (!awb) throw new Error("AWB is required");
  const token = await getShiprocketToken();
  return shiprocketFetch(`/courier/track/awb/${encodeURIComponent(awb)}`, {
    token,
  });
}

export async function checkShiprocketServiceability({
  pickupPostcode,
  deliveryPostcode,
  weight = 0.5,
  cod = false,
} = {}) {
  const pickup = pickupPostcode || process.env.SHIPROCKET_PICKUP_PINCODE || "";
  if (!pickup || !deliveryPostcode) {
    throw new Error("pickup and delivery pincode required");
  }

  const token = await getShiprocketToken();
  const qs = new URLSearchParams({
    pickup_postcode: String(pickup),
    delivery_postcode: String(deliveryPostcode),
    weight: String(weight),
    cod: cod ? "1" : "0",
  });

  return shiprocketFetch(`/courier/serviceability/?${qs.toString()}`, {
    token,
  });
}

export async function cancelShiprocketOrder(shiprocketOrderId) {
  if (!shiprocketOrderId) throw new Error("shiprocketOrderId is required");
  const token = await getShiprocketToken();
  return shiprocketFetch("/orders/cancel", {
    method: "POST",
    token,
    body: { ids: [Number(shiprocketOrderId) || shiprocketOrderId] },
  });
}

export function mapShiprocketStatus(srStatus = "") {
  const s = String(srStatus).toLowerCase();
  // RTO ("return to origin") statuses also contain words like "delivered"
  if (s.includes("rto")) return "Return Requested";
  if (s.includes("delivered")) return "Delivered";
  if (s.includes("out for delivery") || s.includes("out_for_delivery"))
    return "Out for Delivery";
  if (s.includes("shipped") || s.includes("in transit") || s.includes("picked"))
    return "Shipped";
  if (s.includes("cancel")) return "Cancelled by Admin";
  return null;
}

