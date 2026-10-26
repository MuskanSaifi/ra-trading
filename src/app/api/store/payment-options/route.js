import { NextResponse } from "next/server";
import { getIntegrationSettings } from "@/lib/getIntegrationSettings";
import { isPayuConfigured } from "@/lib/payu";

export const runtime = "nodejs";

export async function GET() {
  const configured = isPayuConfigured();
  try {
    const settings = await getIntegrationSettings();
    return NextResponse.json({
      success: true,
      payuEnabled: settings.payuEnabled !== false && configured,
      payuConfigured: configured,
      codEnabled: settings.codEnabled !== false,
    });
  } catch {
    return NextResponse.json({
      success: true,
      payuEnabled: configured,
      payuConfigured: configured,
      codEnabled: true,
    });
  }
}
