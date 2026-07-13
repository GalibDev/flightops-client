import { hash } from "bcryptjs";
import { Types } from "mongoose";
import type { User } from "@/types";
import { UserModel } from "@/models/User";

export async function databaseUserId(user: User) {
  if (Types.ObjectId.isValid(user.id)) return new Types.ObjectId(user.id);

  const existing = await UserModel.findOne({ email: user.email }).select("_id").lean();
  if (existing) return existing._id as Types.ObjectId;

  const password = await hash(crypto.randomUUID(), 12);
  const record = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      $setOnInsert: {
        name: user.name,
        email: user.email,
        password,
        role: user.role,
        isBlocked: false,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  return record._id as Types.ObjectId;
}
