import crypto from "crypto";

const UDF_KEYS = ["udf1", "udf2", "udf3", "udf4", "udf5", "udf6", "udf7", "udf8", "udf9", "udf10"];

export function getPayuEnv() {
  const env = String(process.env.PAYU_ENV || "test").toLowerCase();
  return env === "prod" || env === "production" || env === "live" ? "prod" : "test";
}

function paymentUrl() {
  return getPayuEnv() === "prod"
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";
}

function postServiceUrl() {
  return getPayuEnv() === "prod"
    ? "https://info.payu.in/merchant/postservice.php?form=2"
    : "https://test.payu.in/merchant/postservice.php?form=2";
}

export function isPayuConfigured() {
  return Boolean(process.env.PAYU_KEY && process.env.PAYU_SALT);
}

export function getPayuKeyPreview() {
  const key = process.env.PAYU_KEY || "";
  return key ? `${key.slice(0, 3)}...` : null;
}

function sha512(value) {
  return crypto.createHash("sha512").update(value).digest("hex");
}

export function formatPayuAmount(amount) {
  return Number(amount).toFixed(2);
}

export function newPayuTxnId() {
  // PayU allows at most 25 characters
  return `PU${Date.now()}${crypto.randomInt(1000, 9999)}`;
}

/** Public site origin, honouring the proxy headers set by the host. */
export function getPublicOrigin(req) {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

/**
 * Builds the fields the browser posts to PayU hosted checkout.
 */
export function buildPayuPaymentForm({
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  phone,
  surl,
  furl,
  udf = {},
}) {
  const key = process.env.PAYU_KEY || "";
  const salt = process.env.PAYU_SALT || "";

  const fields = {
    key,
    txnid,
    amount: formatPayuAmount(amount),
    productinfo,
    firstname,
    email,
    phone,
    surl,
    furl,
  };
  for (const k of UDF_KEYS.slice(0, 5)) fields[k] = udf[k] || "";

  fields.hash = sha512(
    [
      key,
      fields.txnid,
      fields.amount,
      fields.productinfo,
      fields.firstname,
      fields.email,
      ...UDF_KEYS.map((k) => fields[k] || ""),
      salt,
    ].join("|")
  );

  return { action: paymentUrl(), fields };
}

/**
 * Checks the hash PayU posts back to surl/furl.
 */
export function verifyPayuResponseHash(response) {
  const salt = process.env.PAYU_SALT || "";
  if (!salt || !response?.hash) return false;

  const parts = [
    salt,
    response.status || "",
    ...[...UDF_KEYS].reverse().map((k) => response[k] || ""),
    response.email || "",
    response.firstname || "",
    response.productinfo || "",
    response.amount || "",
    response.txnid || "",
    response.key || "",
  ];
  if (response.additionalCharges) parts.unshift(response.additionalCharges);

  const expected = sha512(parts.join("|"));
  const received = String(response.hash).toLowerCase();
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

async function postService(command, vars) {
  const key = process.env.PAYU_KEY || "";
  const salt = process.env.PAYU_SALT || "";
  const params = {
    key,
    command,
    ...vars,
    hash: sha512([key, command, vars.var1, salt].join("|")),
  };

  const res = await fetch(postServiceUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(params).toString(),
    cache: "no-store",
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error(text || `PayU error (${res.status})`);
    err.status = 502;
    throw err;
  }
}

/** Asks PayU for the current state of a transaction. Returns the details or null. */
export async function verifyPayuPayment(txnid) {
  const data = await postService("verify_payment", { var1: txnid });
  return data?.transaction_details?.[txnid] || null;
}

export async function refundPayuPayment({ mihpayid, amount, refundId }) {
  const data = await postService("cancel_refund_transaction", {
    var1: mihpayid,
    var2: refundId,
    var3: formatPayuAmount(amount),
  });
  if (String(data?.status) !== "1") {
    const err = new Error(data?.msg || "PayU refund failed");
    err.status = 502;
    err.data = data;
    throw err;
  }
  return data;
}
