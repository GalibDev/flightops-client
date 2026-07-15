import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { ContactMessageModel } from "@/models/ContactMessage";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }
  const data = await ContactMessageModel.find().sort({ createdAt: -1 }).limit(250).lean();
  return NextResponse.json({ success: true, message: "Messages loaded", data });
}
