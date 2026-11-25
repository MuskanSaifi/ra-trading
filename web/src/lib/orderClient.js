"use client";

export function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/** Posts the PayU fields from the server to PayU hosted checkout. */
export function submitToPayu({ action, fields }) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value ?? "";
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export async function cancelOrderRequest(orderId, reason) {
  const user = getLocalUser();
  const res = await fetch("/api/user/order/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, userId: user?._id, reason }),
  });
  return res.json();
}

/** Restarts PayU payment for an order; redirects the browser on success. */
export async function retryPayment(orderId) {
  const user = getLocalUser();
  const res = await fetch("/api/user/order/retry-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, userId: user?._id }),
  });
  const data = await res.json();
  if (data.success && data.payu) {
    submitToPayu(data.payu);
    return { success: true };
  }
  return data;
}
