import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { flights } from "@/lib/flights";
import { getStripe } from "@/lib/stripe";
import { databaseUserId } from "@/lib/user-id";
import { BookingModel } from "@/models/Booking";
import { FlightModel } from "@/models/Flight";
import { PaymentModel } from "@/models/Payment";

const input = z.object({ flightId: z.string().min(1), seats: z.coerce.number().int().min(1).max(6) });

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ success: false, message: "Please sign in to pay for a booking" }, { status: 401 });
  let bookingId: Types.ObjectId | undefined;
  let bookingNumber: string | undefined;
  try {
    const values = input.parse(await request.json());
    if (!(await connectDB())) return NextResponse.json({ success: false, message: "Payment database is unavailable" }, { status: 503 });
    const seed = flights.find((flight) => flight.id === values.flightId);
    const databaseFlight = !seed && Types.ObjectId.isValid(values.flightId) ? await FlightModel.findById(values.flightId).lean() : null;
    const flight = seed || databaseFlight;
    if (!flight) return NextResponse.json({ success: false, message: "Flight not found" }, { status: 404 });
    if (values.seats > Number(flight.availableSeats || 0)) return NextResponse.json({ success: false, message: "The requested seats are unavailable" }, { status: 409 });

    bookingNumber = `FO-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const totalAmount = Number(flight.price) * values.seats;
    const booking = await BookingModel.create({
      bookingNumber,
      user: await databaseUserId(user),
      passengerName: user.name,
      passengerEmail: user.email,
      flight: databaseFlight?._id,
      flightNumber: flight.flightNumber,
      route: `${flight.departureAirport} to ${flight.destinationAirport}`,
      seats: values.seats,
      totalAmount,
      status: "pending",
      paymentStatus: "pending",
    });
    bookingId = booking._id as Types.ObjectId;
    const origin = new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      client_reference_id: bookingNumber,
      line_items: [{ quantity: values.seats, price_data: { currency: "usd", unit_amount: Math.round(Number(flight.price) * 100), product_data: { name: `${flight.flightNumber}: ${flight.departureAirport} to ${flight.destinationAirport}`, description: `${flight.airlineName} · ${flight.departureDate} ${flight.departureTime}` } } }],
      metadata: { bookingNumber, bookingId: String(booking._id), userEmail: user.email, flightId: values.flightId },
      success_url: `${origin}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/flights/${values.flightId}/book?payment=cancelled`,
    });
    await Promise.all([
      BookingModel.updateOne({ _id: booking._id }, { stripeCheckoutSessionId: session.id }),
      PaymentModel.create({ transactionId: session.id, booking: booking._id, bookingNumber, customerEmail: user.email, amount: totalAmount, method: "card", status: "pending" }),
    ]);
    return NextResponse.json({ success: true, message: "Stripe Checkout created", data: { url: session.url } }, { status: 201 });
  } catch (error) {
    if (bookingId) await BookingModel.findByIdAndDelete(bookingId).catch(() => null);
    if (bookingNumber) await PaymentModel.deleteMany({ bookingNumber }).catch(() => null);
    return NextResponse.json({ success: false, message: error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Could not start Stripe Checkout" }, { status: 400 });
  }
}
