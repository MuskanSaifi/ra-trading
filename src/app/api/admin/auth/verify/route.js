import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/authHelpers";

export const GET = requireAdminAuth(async () => {
  return NextResponse.json({ success: true });
});

