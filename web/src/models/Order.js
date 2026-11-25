const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    address: {
      name: String,
      phone: String,
      alternatePhone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },

    totalAmount: Number,
    paymentMode: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "Pending" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    cashfreeOrderId: { type: String },
    cashfreePaymentId: { type: String },
    payuTxnId: { type: String, index: true },
    payuPaymentId: { type: String },

    status: { type: String, default: "Pending" },
    statusHistory: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    cancelReason: String,
    cancelledBy: String,
    expectedDelivery: Date,
    deliveredAt: Date,
    refundId: String,
    refundError: String,

    shiprocketOrderId: { type: String },
    shipmentId: { type: String },
    awb: { type: String },
    courierName: { type: String },
    trackingUrl: { type: String },
    labelUrl: { type: String },
    shippedAt: { type: Date },
    pickupRequestedAt: { type: Date },
    pickupScheduledFor: { type: String },
    pickupError: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
