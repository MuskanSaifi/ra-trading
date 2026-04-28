import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import About from "@/models/About";
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET,
});


export async function GET() {
await connectDB();
const about = await About.findOne();
return NextResponse.json({ success: true, about });
}


export async function POST(req) {
await connectDB();


const formData = await req.formData();
const data = JSON.parse(formData.get("data"));


const file = formData.get("image");
const directorFile = formData.get("directorImage");


if (file && file.name) {
const buffer = Buffer.from(await file.arrayBuffer());


const upload = await new Promise((resolve, reject) => {
const stream = cloudinary.uploader.upload_stream(
{ folder: "about-section" },
(err, result) => {
if (err) reject(err);
else resolve({ url: result.secure_url, public_id: result.public_id });
}
);
stream.end(buffer);
});


data.image = upload;
}

if (directorFile && directorFile.name) {
const buffer = Buffer.from(await directorFile.arrayBuffer());

const upload = await new Promise((resolve, reject) => {
const stream = cloudinary.uploader.upload_stream(
{ folder: "about-section" },
(err, result) => {
if (err) reject(err);
else resolve({ url: result.secure_url, public_id: result.public_id });
}
);
stream.end(buffer);
});

data.directorImage = upload;
}


let about = await About.findOne();
if (!about) {
about = await About.create(data);
} else {
about = await About.findByIdAndUpdate(about._id, data, { new: true });
}


return NextResponse.json({ success: true, about });
}