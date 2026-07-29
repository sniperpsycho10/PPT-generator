import { NextResponse } from "next/server";
import { generateWorkshopPpt } from "@/services/ppt/pptGenerator";
import { requireAdmin } from "@/lib/authHelpers";

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    
    const result = await generateWorkshopPpt(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("PPT Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate PPT" }, { status: 500 });
  }
}
