import { connectDB } from "@/lib/dbConnect";
import DeleteAccountRequest from "@/models/DeleteAccountRequest";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    await connectDB();

    const token = cookies().get("authToken")?.value;
    if (!token) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET);

    const { id, status } = await request.json();

    if (!id || !["approved", "rejected"].includes(status)) {
      return Response.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    const req = await DeleteAccountRequest.findById(id);
    if (!req) {
      return Response.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }

    req.status = status;
    req.processedAt = new Date();
    await req.save();

    return Response.json({
      success: true,
      message: `Request ${status} successfully`,
    });
  } catch (err) {
    console.error("Update delete request error:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
