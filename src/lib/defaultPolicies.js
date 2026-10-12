export const POLICY_LINKS = [
  { slug: "privacy-policy", href: "/privacy-policy", label: "Privacy Policy" },
  { slug: "terms-and-conditions", href: "/terms-and-conditions", label: "Terms & Conditions" },
  { slug: "refund-and-return-policy", href: "/refund-and-return-policy", label: "Refund & Return Policy" },
  { slug: "shipping-and-returns", href: "/shipping-and-returns", label: "Shipping Policy" },
  { slug: "cancellation-policy", href: "/cancellation-policy", label: "Cancellation Policy" },
];

const UPDATED = "12 October 2026";

export const DEFAULT_POLICIES = {
  "privacy-policy": {
    title: "Privacy Policy",
    contentHtml: `
      <p>Last updated: ${UPDATED}</p>
      <p>RA Trading (“we”, “us”) operates this website to sell personal care and related products. This policy explains what information we collect, why we collect it, and how it is used when you browse, create an account, or place an order.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Name, phone number, email address, and delivery address</li>
        <li>Order details, payment status, and shipment tracking information</li>
        <li>Account login details you choose to create</li>
        <li>Messages you send through the contact form or support channels</li>
        <li>Basic device and usage data such as browser type and pages visited</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To process orders, deliveries, returns, refunds, and customer support</li>
        <li>To send order updates by SMS, email, or WhatsApp</li>
        <li>To prevent fraud and keep the website secure</li>
        <li>To improve our products, catalogue, and website</li>
      </ul>
      <h2>Payments</h2>
      <p>Online payments are processed by a licensed payment gateway. We do not store your full card number, CVV, or UPI PIN on our servers. Payment data is handled by the payment provider under its own security and privacy terms.</p>
      <h2>Sharing</h2>
      <p>We share information only with parties needed to complete your order, such as courier partners, the payment gateway, and service providers who host our website or send notifications. We do not sell your personal information.</p>
      <h2>Retention</h2>
      <p>Order and account records are kept for as long as needed to fulfil orders, handle disputes, and meet tax and legal requirements.</p>
      <h2>Your choices</h2>
      <p>You may ask us to correct your account details or request deletion of your account, subject to records we must keep by law. Use the contact details on this website for any privacy request.</p>
    `,
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    contentHtml: `
      <p>Last updated: ${UPDATED}</p>
      <p>By using this website or placing an order, you agree to these terms. If you do not agree, please do not use the site.</p>
      <h2>Orders</h2>
      <p>Product prices, descriptions, and availability are shown on the product page and may change. An order is confirmed only after we accept it and, for online payments, after payment is successfully received. We may cancel an order if a product is unavailable, the price was listed in error, or the payment could not be verified.</p>
      <h2>Accounts</h2>
      <p>You are responsible for keeping your login details private and for activity under your account. Information you provide at checkout must be accurate so we can deliver the order.</p>
      <h2>Payments</h2>
      <p>We accept the payment methods shown at checkout, including cash on delivery where it is available, and online payment through our payment gateway. You agree to pay the amount shown, including shipping charges, before or at delivery as applicable.</p>
      <h2>Shipping, returns, and cancellations</h2>
      <p>Delivery, returns, refunds, and cancellations are covered by our Shipping Policy, Refund &amp; Return Policy, and Cancellation Policy. Those pages form part of these terms.</p>
      <h2>Use of the website</h2>
      <p>You may not misuse the website, attempt unauthorised access, or use it for any unlawful purpose. Product images are for reference. Minor variation in colour or packaging may occur.</p>
      <h2>Liability</h2>
      <p>To the extent allowed by law, we are not liable for delays caused by courier partners, payment networks, or events outside our reasonable control. Our responsibility for a product is limited to the remedies in our refund and return policy.</p>
    `,
  },
  "refund-and-return-policy": {
    title: "Refund & Return Policy",
    contentHtml: `
      <p>Last updated: ${UPDATED}</p>
      <p>This policy explains when a return, replacement, or refund is available for products bought on this website.</p>
      <h2>When you can request a return</h2>
      <p>Contact us within <strong>48 hours of delivery</strong> if:</p>
      <ul>
        <li>The product arrived damaged</li>
        <li>The product is defective</li>
        <li>You received the wrong item</li>
      </ul>
      <p>Please share your order number and clear photos or an unboxing video. Requests without enough proof may be declined.</p>
      <h2>When a return is not available</h2>
      <ul>
        <li>Change of mind</li>
        <li>Opened, used, or washed personal-care products, except where the item is damaged or incorrect</li>
        <li>Products damaged after delivery</li>
        <li>Requests raised after 48 hours of delivery</li>
      </ul>
      <h2>Refunds</h2>
      <p>Where a return is approved, we prefer a replacement. If a replacement is not possible, the product amount is refunded to the original payment method within <strong>5–7 business days</strong> after approval. Cash on delivery refunds are sent to the bank account or UPI ID you provide. Shipping charges are not refunded unless the return is due to our error.</p>
      <h2>How to raise a request</h2>
      <p>Use the contact details on this website, or the Contact page, and include your order number. Our decision after inspection of the product is final.</p>
    `,
  },
  "shipping-and-returns": {
    title: "Shipping Policy",
    contentHtml: `
      <p>Last updated: ${UPDATED}</p>
      <p>We ship orders across India through courier partners.</p>
      <h2>Processing</h2>
      <p>Orders are processed within <strong>1–3 business days</strong> after payment confirmation, or after the order is accepted for cash on delivery. Orders placed on Sundays or public holidays are processed on the next working day.</p>
      <h2>Delivery time</h2>
      <p>Estimated delivery is <strong>4–8 business days</strong> after dispatch. Timelines can change because of location, weather, or courier delays. Tracking details are shared once the shipment is booked.</p>
      <h2>Shipping charges</h2>
      <p>Any shipping charge is shown at checkout before you place the order. Serviceability depends on the delivery pincode.</p>
      <h2>Failed delivery</h2>
      <p>Please keep the phone number on the order reachable. If a courier cannot deliver because of an incorrect address or repeated failed attempts, the shipment may be returned. Extra shipping charges may apply to reship the order.</p>
      <h2>Returns</h2>
      <p>Return and refund rules are in our Refund &amp; Return Policy.</p>
    `,
  },
  "cancellation-policy": {
    title: "Cancellation Policy",
    contentHtml: `
      <p>Last updated: ${UPDATED}</p>
      <p>You may cancel an order from your account, or by contacting us, while the order status is still <strong>Pending</strong> and it has not been shipped.</p>
      <h2>Before dispatch</h2>
      <p>If an online payment was already captured, the amount is refunded to the original payment method within <strong>5–7 business days</strong> after the cancellation is confirmed. Cash on delivery orders that are cancelled before dispatch are not charged.</p>
      <h2>After dispatch</h2>
      <p>Once an order is shipped, it cannot be cancelled. You may refuse the delivery. For prepaid orders that are returned to us undelivered, the product amount is refunded after the courier confirms the return. Shipping charges may be deducted.</p>
      <h2>Cancellation by us</h2>
      <p>We may cancel an order if the product is out of stock, the delivery pincode is not serviceable, payment is not received, or we suspect a fraudulent order. If you have already paid, the amount is refunded to the original payment method.</p>
    `,
  },
};

export function getDefaultPolicy(slug) {
  return DEFAULT_POLICIES[slug] || null;
}
