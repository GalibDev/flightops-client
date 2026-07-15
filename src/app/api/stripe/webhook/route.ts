import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { completeCheckout } from "@/lib/checkout";
import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { BookingModel } from "@/models/Booking";
import { PaymentModel } from "@/models/Payment";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ message: "Stripe webhook is not configured" }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid Stripe signature" }, { status: 400 });
  }
  if (!(await connectDB())) return NextResponse.json({ message: "Database unavailable" }, { status: 503 });
  try {
    if (event.type === "checkout.session.completed") {
      await completeCheckout(event.data.object.id);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const bookingNumber = session.metadata?.bookingNumber;
      if (bookingNumber) {
        await Promise.all([
          BookingModel.updateOne({ bookingNumber, paymentStatus: "pending" }, { status: "cancelled", paymentStatus: "failed" }),
          PaymentModel.updateOne({ transactionId: session.id, status: "pending" }, { status: "failed" }),
        ]);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json({ message: "Webhook processing failed" }, { status: 500 });
  }
}
