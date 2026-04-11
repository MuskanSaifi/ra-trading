"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import countriesData from "@/lib/countries.json" assert { type: "json" };

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const [countries] = useState(countriesData);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [paymentMode, setPaymentMode] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [sameAsProfile, setSameAsProfile] = useState(true);

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    street: "",
    country: "India",
    state: "",
    city: "",
    pincode: "",
  });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const c = JSON.parse(localStorage.getItem("cart") || "[]");

    if (!u) {
      router.push(`/auth/login?redirect=/checkout`);
      return;
    }

    setUser(u);
    setCartItems(c);

    const countryObj = countries.find((c) => c.name === (u.country || "India"));
    setStates(countryObj?.states || []);

    const stateObj = countryObj?.states?.find((s) => s.name === u.state);
    setCities(stateObj?.cities || []);

    setAddress({
      name: u.name || "",
      phone: u.phone || "",
      alternatePhone: "",
      street: u.address || "",
      city: u.city || "",
      state: u.state || "",
      pincode: u.pincode || "",
      country: u.country || "India",
    });

    setInitialized(true);
  }, []);

  useEffect(() => {
    const c = countries.find((x) => x.name === address.country);
    setStates(c?.states || []);
  }, [address.country]);

  useEffect(() => {
    const s = states.find((x) => x.name === address.state);
    setCities(s?.cities || []);
  }, [address.state]);

  const codAllowed = useMemo(
    () =>
      cartItems.length > 0 &&
      cartItems.every((i) => i.codAvailable !== false),
    [cartItems]
  );

  useEffect(() => {
    if (!codAllowed && paymentMode === "COD") {
      setPaymentMode("Razorpay");
    }
  }, [codAllowed, paymentMode]);

  const effectiveAddress = useMemo(() => {
    if (!user) return address;
    if (sameAsProfile) {
      return {
        name: user.name || "",
        phone: user.phone || "",
        alternatePhone: address.alternatePhone || "",
        street: user.address || "",
        country: user.country || "India",
        state: user.state || "",
        city: user.city || "",
        pincode: user.pincode || "",
      };
    }
    return address;
  }, [user, sameAsProfile, address]);

  const subtotal = cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const shipping = subtotal > 0 ? 99 : 0;
  const total = subtotal + shipping;

  const validatePhone = (v) => /^\d{10}$/.test(v);
  const validatePincode = (v) => /^\d{6}$/.test(v);

  const orderLineItems = () =>
    cartItems.map((i) => ({
      productId: i.productId || i._id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

  const placeOrderRequest = async (razorpay) => {
    const res = await fetch("/api/user/order/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        address: effectiveAddress,
        items: orderLineItems(),
        totalAmount: total,
        paymentMode: razorpay ? "Razorpay" : paymentMode,
        ...(razorpay ? { razorpay } : {}),
      }),
    });
    return res.json();
  };

  const handlePlaceOrder = async () => {
    if (!cartItems.length) return alert("Cart empty.");

    const addr = effectiveAddress;
    if (!validatePhone(addr.phone)) return alert("Enter valid phone.");
    if (addr.alternatePhone && !validatePhone(addr.alternatePhone))
      return alert("Invalid alternate phone.");
    if (!validatePincode(addr.pincode)) return alert("Invalid pincode.");
    if (!addr.name || !addr.street || !addr.city || !addr.state)
      return alert("Fill all required shipping info.");

    if (paymentMode === "COD" && !codAllowed) {
      return alert("COD is not available for items in your cart. Pay online with Razorpay.");
    }

    if (paymentMode === "Razorpay") {
      setLoading(true);
      try {
        const co = await fetch("/api/payments/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            items: orderLineItems(),
          }),
        });
        const jd = await co.json();
        if (!jd.success) {
          alert(jd.message || "Could not start payment");
          setLoading(false);
          return;
        }

        const scriptOk = await loadRazorpayScript();
        if (!scriptOk || !window.Razorpay) {
          alert("Could not load Razorpay checkout.");
          setLoading(false);
          return;
        }

        const options = {
          key: jd.keyId,
          amount: jd.amount,
          currency: jd.currency,
          order_id: jd.orderId,
          name: "Checkout",
          description: "Order payment",
          handler: async function (response) {
            setLoading(true);
            try {
              const data = await placeOrderRequest({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              if (data.success) {
                localStorage.removeItem("cart");
                window.dispatchEvent(
                  new CustomEvent("cartUpdated", { detail: 0 })
                );
                alert("Order placed successfully!");
                router.push("/user-dashboard/orders");
              } else {
                alert(
                  data.message ||
                    "Payment received but order failed — contact support with your payment ID."
                );
              }
            } catch {
              alert("Network error confirming your order.");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: addr.name,
            contact: addr.phone,
            email: user.email || "",
          },
          theme: { color: "#ff9900" },
          modal: {
            ondismiss: () => setLoading(false),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          alert("Payment failed. Try again or pick another method.");
          setLoading(false);
        });
        rzp.open();
      } catch {
        alert("Could not start payment.");
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const data = await placeOrderRequest(null);
      if (data.success) {
        localStorage.removeItem("cart");
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: 0 }));
        alert("Order Placed Successfully!");
        router.push("/user-dashboard/orders");
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch {
      alert("Server error, try again.");
    }
    setLoading(false);
  };

  if (!initialized)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-lg text-gray-600">Preparing checkout...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Checkout 🛍️
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex justify-between">
              <h2 className="text-2xl font-semibold mb-4">Shipping Details</h2>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {sameAsProfile ? "Using Profile" : "Edit Address"}
                </span>

                <button
                  type="button"
                  onClick={() => setSameAsProfile(!sameAsProfile)}
                  className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-all flex items-center border-0
                    ${sameAsProfile ? "bg-indigo-600" : "bg-gray-300"}`}
                  aria-pressed={sameAsProfile}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-all block
                      ${sameAsProfile ? "ml-5" : "ml-0"}`}
                  />
                </button>
              </div>
            </div>

            {sameAsProfile ? (
              <div className="space-y-1 bg-purple-50 p-4 rounded-lg border">
                <p>{user.name}</p>
                <p>📞 {user.phone}</p>
                <p>{user.address}</p>
                <p>
                  {user.city}, {user.state} - {user.pincode}
                </p>
                <p>{user.country}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) =>
                    setAddress({ ...address, name: e.target.value })
                  }
                  className="w-full border p-3 rounded-lg"
                />

                <input
                  placeholder="Phone (10 digits)"
                  value={address.phone}
                  maxLength={10}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className={`w-full border p-3 rounded-lg ${
                    validatePhone(address.phone) ? "" : "border-red-500"
                  }`}
                />

                <input
                  placeholder="Alternate Phone"
                  value={address.alternatePhone}
                  maxLength={10}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      alternatePhone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full border p-3 rounded-lg"
                />

                <input
                  placeholder="Street Address"
                  value={address.street}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                  className="w-full border p-3 rounded-lg"
                />

                <select
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: e.target.value })
                  }
                  className="w-full border p-3 rounded-lg"
                >
                  {countries.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                  className="w-full border p-3 rounded-lg"
                >
                  <option>Select State</option>
                  {states.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  className="w-full border p-3 rounded-lg"
                >
                  <option>Select City</option>
                  {cities.map((c, idx) => (
                    <option key={idx} value={c.name || c}>
                      {c.name || c}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Pincode"
                  value={address.pincode}
                  maxLength={6}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      pincode: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className={`w-full border p-3 rounded-lg ${
                    validatePincode(address.pincode) ? "" : "border-red-500"
                  }`}
                />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3">
              {cartItems.map((i) => (
                <div key={i._id} className="flex justify-between border-b pb-2">
                  <div className="flex gap-3 items-center">
                    <img
                      src={i.image}
                      alt=""
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-gray-600 text-sm">Qty: {i.quantity}</p>
                      {(i.minOrder || 1) > 1 && (
                        <p className="text-xs text-amber-700">
                          Min. order qty: {i.minOrder || 1}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-gray-700">
                    ₹{(i.price * i.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4 space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{shipping}</span>
              </div>

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              <div className="mt-4 space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Payment method
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full border p-3 rounded-lg"
                >
                  {codAllowed && (
                    <option value="COD">Cash on Delivery</option>
                  )}
                  <option value="Razorpay">Razorpay (Card / UPI / Netbanking)</option>
                </select>
                {!codAllowed && (
                  <p className="text-xs text-amber-800">
                    COD is disabled because at least one product is online-payment only.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
              >
                {loading
                  ? paymentMode === "Razorpay"
                    ? "Opening payment…"
                    : "Placing Order..."
                  : paymentMode === "Razorpay"
                    ? "Pay with Razorpay"
                    : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
