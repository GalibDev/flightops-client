import { CheckCircle2, CreditCard, Plane } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { completeCheckout } from "@/lib/checkout";
import { currentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";

export const metadata = { title: "Payment successful" };

export default async function BookingSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { session_id: sessionId } = await searchParams;
  if (!sessionId || !(await connectDB())) redirect("/dashboard");
  let result: Awaited<ReturnType<typeof completeCheckout>> | null = null;
  try {
    result = await completeCheckout(sessionId, user.email);
  } catch {
    result = null;
  }
  if (!result?.booking || result.session.payment_status !== "paid") {
    return <div className="grid min-h-[70vh] place-items-center bg-slate-50 p-6"><div className="card max-w-lg p-8 text-center"><h1 className="text-2xl font-black">Payment verification is pending</h1><p className="muted mt-3">Stripe has not confirmed this checkout yet. Your booking remains pending and no duplicate charge will be created.</p><Link href="/dashboard" className="btn btn-primary mt-6">Return to dashboard</Link></div></div>;
  }
  const booking = result.booking;
  return <div className="grid min-h-[70vh] place-items-center bg-slate-50 p-6"><div className="card w-full max-w-xl p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={64} /><span className="eyebrow mt-5">PAYMENT CONFIRMED</span><h1 className="mt-3 text-3xl font-black">Your flight is booked</h1><p className="muted mt-3">Stripe confirmed your test card payment and FlightOps updated the booking automatically.</p><div className="mt-7 grid grid-cols-2 gap-3 text-left"><div className="rounded-xl bg-slate-50 p-4"><small className="text-slate-500">Booking number</small><p className="mt-1 font-black text-blue-700">{booking.bookingNumber}</p></div><div className="rounded-xl bg-slate-50 p-4"><small className="text-slate-500">Amount paid</small><p className="mt-1 font-black">${booking.totalAmount}</p></div><div className="rounded-xl bg-slate-50 p-4"><Plane className="mb-2 text-blue-600" size={18} /><p className="font-bold">{booking.flightNumber}</p><small>{booking.route}</small></div><div className="rounded-xl bg-slate-50 p-4"><CreditCard className="mb-2 text-emerald-600" size={18} /><p className="font-bold capitalize">{booking.paymentStatus}</p><small>Stripe test payment</small></div></div><Link href="/dashboard" className="btn btn-primary mt-7">View dashboard</Link></div></div>;
}
