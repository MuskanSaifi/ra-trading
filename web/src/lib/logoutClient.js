"use client";

/** Ends the customer session on the server and clears local session data. */
export async function logoutUser() {
  try {
    await fetch("/api/user/logout", { method: "POST" });
  } catch {
    // Still clear the local session if the request fails
  }
  const cart = localStorage.getItem("cart");
  localStorage.clear();
  sessionStorage.clear();
  // Keep the cart so a customer who signs out doesn't lose what they picked
  if (cart) localStorage.setItem("cart", cart);
  window.dispatchEvent(new Event("userAuthChanged"));
}

/** Only allow same-site paths so ?redirect= can't send users to another site. */
export function safeRedirectPath(value, fallback = "/") {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
