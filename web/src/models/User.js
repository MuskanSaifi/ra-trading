import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    otp: String,
    otpExpiresAt: Date,

    // 🔹 JWT Token for single-device authentication
    authToken: {
      type: String,
      default: null,
    },

    // Profile Details (editable later)
    name: String,
    email: String,
    altPhone: String,
    whatsapp: String,
    gender: String,
    dob: String,
    maritalStatus: String,
    bloodGroup: String,
    occupation: String,
    company: String,
    annualIncome: String,
    aadhaar: String,
    pan: String,
    passport: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    emergencyContact: String,
    joinedOn: {
      type: Date,
      default: Date.now,
    },
    accountType: {
      type: String,
      default: "Regular",
    },
    profilePic: {
      url: String,
      public_id: String,
    },

    // Expo push tokens (one user may have multiple devices)
    expoPushTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
