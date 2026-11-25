// src/models/Attribute.js
import mongoose from "mongoose";

const AttributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. Size, Color, Material
    values: [{ type: String }],             // ["S","M","L"] or ["Red","Blue"]
  },
  { timestamps: true }
);

const Attribute = mongoose.models.Attribute || mongoose.model("Attribute", AttributeSchema);
export default Attribute;
