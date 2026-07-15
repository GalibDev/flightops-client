import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { databaseUserId } from "@/lib/user-id";
import { ContactMessageModel } from "@/models/ContactMessage";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(3000),
});

export async function POST(request: Request) {
  try {
    const values = schema.parse(await request.json());
    if (!(await connectDB())) {
      return NextResponse.json({ success: false, message: "Message service is temporarily unavailable." }, { status: 503 });
    }
    const user = await currentUser();
    const identity = user
      ? { name: user.name, email: user.email, user: await databaseUserId(user) }
      : { name: values.name, email: values.email };
    await ContactMessageModel.create({ ...values, ...identity, status: "unread" });
    return NextResponse.json({ success: true, message: "Your message has been sent to the FlightOps admin team." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof z.ZodError ? error.issues[0]?.message : "Could not send your message." },
      { status: 400 },
    );
  }
}
