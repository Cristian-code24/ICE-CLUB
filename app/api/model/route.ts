import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    available: process.env.ICE_CLUB_MODEL_AVAILABLE === "true",
  });
}
