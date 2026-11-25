import { connectDB } from "@/lib/dbConnect";
import DeleteAccountRequest from "@/models/DeleteAccountRequest";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();

    // ✅ FIX: cookies() is async in Next 15
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return Response.json({ success: false }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET);

    const count = await DeleteAccountRequest.countDocuments({
      status: "pending",
    });

    return Response.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error("Delete request count error:", err);
    return Response.json({ success: false, count: 0 });
  }
}
