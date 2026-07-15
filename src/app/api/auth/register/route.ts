import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { signToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";

const input = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const values = input.parse(await request.json());
    if (!(await connectDB())) {
      return NextResponse.json(
        { success: false, message: "Database connection failed. Check MongoDB Atlas configuration." },
        { status: 503 },
      );
    }
    if (await UserModel.exists({ email: values.email })) {
      return NextResponse.json({ success: false, message: "An account already exists" }, { status: 409 });
    }

    const document = await UserModel.create({
      ...values,
      password: await bcrypt.hash(values.password, 12),
      role: "user",
    });
    const user = { id: String(document._id), name: document.name, email: document.email, role: "user" as const };
    const response = NextResponse.json({ success: true, message: "Account created", data: user }, { status: 201 });
    response.cookies.set("flightops_token", await signToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 604800,
      path: "/",
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message || "Please check the form fields" }, { status: 400 });
    }
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      { success: false, message: duplicate ? "An account already exists" : "Could not create the account" },
      { status: duplicate ? 409 : 500 },
    );
  }
}
