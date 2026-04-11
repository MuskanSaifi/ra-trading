const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        price: Number,
        quantity: Number
      },
    ],

    address: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    totalAmount: Number,
    paymentMode: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "Pending" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    status: { type: String, default: "Pending" },
    cancelReason: String,
    expectedDelivery: Date
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
