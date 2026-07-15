import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { UserModel } from "@/models/User";
import { FlightModel } from "@/models/Flight";
import { BookingModel } from "@/models/Booking";
import { PaymentModel } from "@/models/Payment";
import { AuditLogModel } from "@/models/AuditLog";
import { ContactMessageModel } from "@/models/ContactMessage";
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 },
    );
  const [
    users,
    blocked,
    pendingFlights,
    bookings,
    revenue,
    pendingPayments,
    audits,
    unreadMessages,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isBlocked: true }),
    FlightModel.countDocuments({ status: "pending" }),
    BookingModel.countDocuments(),
    PaymentModel.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PaymentModel.countDocuments({ status: "pending" }),
    AuditLogModel.countDocuments(),
    ContactMessageModel.countDocuments({ status: "unread" }),
  ]);
  return NextResponse.json({
    success: true,
    message: "Admin overview loaded",
    data: {
      users,
      blocked,
      pendingFlights,
      bookings,
      revenue: revenue[0]?.total || 0,
      pendingPayments,
      audits,
      unreadMessages,
    },
  });
}
