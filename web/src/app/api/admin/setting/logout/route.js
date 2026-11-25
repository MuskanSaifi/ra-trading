export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({
    success: true,
    message: "Logged out",
  });

  // Remove cookie
  res.cookies.set("adminToken", "", {
    httpOnly: true,
    secure: false,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
