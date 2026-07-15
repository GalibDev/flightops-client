import { BookingModel } from "@/models/Booking";
import { PaymentModel } from "@/models/Payment";
import { getStripe } from "@/lib/stripe";

export async function completeCheckout(sessionId: string, expectedEmail?: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const email = session.customer_details?.email || session.customer_email || "";
  if (expectedEmail && email.toLowerCase() !== expectedEmail.toLowerCase()) {
    throw new Error("This checkout does not belong to your account");
  }
  if (session.payment_status !== "paid") return { session, booking: null };
  const bookingNumber = session.metadata?.bookingNumber;
  if (!bookingNumber) throw new Error("Checkout booking reference is missing");
  const booking = await BookingModel.findOneAndUpdate(
    { bookingNumber },
    { status: "confirmed", paymentStatus: "paid", stripeCheckoutSessionId: session.id },
    { returnDocument: "after" },
  ).lean();
  await PaymentModel.findOneAndUpdate(
    { transactionId: session.id },
    { status: "paid", providerPaymentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id },
  );
  return { session, booking };
}
