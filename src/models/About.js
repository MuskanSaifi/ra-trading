import mongoose from "mongoose";


const AboutSchema = new mongoose.Schema(
{
title: { type: String, required: true },
subtitle: { type: String },
description: { type: String },
image: {
url: String,
public_id: String,
},
stats: [
{
label: String,
value: String,
},
],
// Extra sections for About page (admin-managed rich text)
companyTitle: { type: String, default: "" },
companyContentHtml: { type: String, default: "" },

directorName: { type: String, default: "" },
directorTitle: { type: String, default: "" },
directorContentHtml: { type: String, default: "" },
directorImage: {
url: { type: String, default: "" },
public_id: { type: String, default: "" },
},

trustTitle: { type: String, default: "" },
trustContentHtml: { type: String, default: "" },
status: {
type: String,
enum: ["active", "inactive"],
default: "active",
},
},
{ timestamps: true }
);


export default mongoose.models.About || mongoose.model("About", AboutSchema);