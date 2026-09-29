const API_VERSION = "2023-08-01";

export function getCashfreeEnv() {
  const env = String(process.env.CASHFREE_ENV || "sandbox").toLowerCase();
  return env === "production" || env === "prod" ? "production" : "sandbox";
}

export function getCashfreeBaseUrl() {
  return getCashfreeEnv() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

export function isCashfreeConfigured() {
  return Boolean(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET);
}

export function getCashfreeClientIdPreview() {
  const id = process.env.CASHFREE_CLIENT_ID || "";
  if (!id) return null;
  return `${id.slice(0, 6)}...`;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": process.env.CASHFREE_CLIENT_ID || "",
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET || "",
  };
}

async function cashfreeFetch(path, { method = "GET", body } = {}) {
  if (!isCashfreeConfigured()) {
    const err = new Error("Cashfree is not configured");
    err.status = 503;
    throw err;
  }

  const res = await fetch(`${getCashfreeBaseUrl()}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Invalid Cashfree response" };
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      `Cashfree error (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function createCashfreeOrder({
  orderId,
  amount,
  customer,
}) {
  const phone = String(customer?.phone || "").replace(/\D/g, "").slice(-10);
  const payload = {
    order_id: orderId,
    order_amount: Number(Number(amount).toFixed(2)),
    order_currency: "INR",
    customer_details: {
      customer_id: String(customer?.id || "guest").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "guest",
      customer_phone: phone,
      customer_name: customer?.name || "Customer",
    },
    order_meta: {
      return_url: customer?.returnUrl || undefined,
    },
  };

  if (customer?.email) payload.customer_details.customer_email = customer.email;
  if (!payload.order_meta.return_url) delete payload.order_meta;

  return cashfreeFetch("/orders", { method: "POST", body: payload });
}

export async function getCashfreeOrder(orderId) {
  return cashfreeFetch(`/orders/${encodeURIComponent(orderId)}`);
}

export async function getCashfreePayments(orderId) {
  return cashfreeFetch(`/orders/${encodeURIComponent(orderId)}/payments`);
}

export async function refundCashfreePayment({ orderId, amount, refundId, note }) {
  return cashfreeFetch(`/orders/${encodeURIComponent(orderId)}/refunds`, {
    method: "POST",
    body: {
      refund_amount: Number(Number(amount).toFixed(2)),
      refund_id: refundId,
      refund_note: note || "Admin refund",
    },
  });
}
