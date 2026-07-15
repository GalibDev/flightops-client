import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/admin";
import { ContactMessageModel } from "@/models/ContactMessage";

const body = z.object({ status: z.enum(["unread", "read"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid message" }, { status: 400 });
  const values = body.parse(await request.json());
  const message = await ContactMessageModel.findByIdAndUpdate(id, values, { returnDocument: "after" }).lean();
  if (!message) return NextResponse.json({ success: false, message: "Message not found" }, { status: 404 });
  await audit(admin, "MESSAGE_STATUS_CHANGED", "message", id, `${message.email} marked ${values.status}`);
  return NextResponse.json({ success: true, message: `Message marked ${values.status}`, data: message });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid message" }, { status: 400 });
  const message = await ContactMessageModel.findByIdAndDelete(id).lean();
  if (!message) return NextResponse.json({ success: false, message: "Message not found" }, { status: 404 });
  await audit(admin, "MESSAGE_DELETED", "message", id, `${message.email}: ${message.subject}`);
  return NextResponse.json({ success: true, message: "Message deleted" });
}
