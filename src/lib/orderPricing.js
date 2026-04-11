import Product from "@/models/Product";

/**
 * Validates cart lines against DB (price, stock, MOQ, active).
 * @returns {{ ok: true, byId: Map, verifiedSubtotal: number } | { ok: false, message: string, status: number }}
 */
export async function validateCartItems(items) {
  if (!items?.length) {
    return { ok: false, message: "Cart is empty", status: 400 };
  }

  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  let verifiedSubtotal = 0;

  for (const item of items) {
    const p = byId.get(String(item.productId));
    if (!p || p.status !== "active") {
      return {
        ok: false,
        message: "Invalid or unavailable product in cart",
        status: 400,
      };
    }

    const unit = Number(p.salePrice != null ? p.salePrice : p.price);
    const qty = Number(item.quantity);
    const minOrder = p.minOrder != null ? Number(p.minOrder) : 1;

    if (qty < minOrder) {
      return {
        ok: false,
        message: `Minimum order quantity for "${p.name}" is ${minOrder}`,
        status: 400,
      };
    }

    if (qty > p.stock) {
      return {
        ok: false,
        message: `Insufficient stock for "${p.name}"`,
        status: 400,
      };
    }

    if (unit !== Number(item.price)) {
      return {
        ok: false,
        message: "Price mismatch — refresh your cart and try again",
        status: 400,
      };
    }

    verifiedSubtotal += unit * qty;
  }

  return { ok: true, byId, verifiedSubtotal };
}

export function assertCodAllowedForCart(byId, items) {
  for (const item of items) {
    const p = byId.get(String(item.productId));
    if (p && p.codAvailable === false) {
      return {
        ok: false,
        message: "Cash on delivery is not available for one or more items in your cart",
      };
    }
  }
  return { ok: true };
}
