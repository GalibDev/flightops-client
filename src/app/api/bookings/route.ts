import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { flights } from "@/lib/flights";
import { databaseUserId } from "@/lib/user-id";
import { BookingModel } from "@/models/Booking";
import { FlightModel } from "@/models/Flight";

const input = z.object({ flightId: z.string().min(1), seats: z.coerce.number().int().min(1).max(6) });

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ success: false, message: "Please sign in to book a flight" }, { status: 401 });
  try {
    const values = input.parse(await request.json());
    if (!(await connectDB())) return NextResponse.json({ success: false, message: "Booking service is unavailable" }, { status: 503 });

    const seed = flights.find((flight) => flight.id === values.flightId);
    const databaseFlight = !seed && Types.ObjectId.isValid(values.flightId)
      ? await FlightModel.findById(values.flightId).lean()
      : null;
    const flight = seed || databaseFlight;
    if (!flight) return NextResponse.json({ success: false, message: "Flight not found" }, { status: 404 });
    if (values.seats > (flight.availableSeats || 0)) {
      return NextResponse.json({ success: false, message: "The requested number of seats is not available" }, { status: 409 });
    }

    const ownerId = await databaseUserId(user);
    const bookingNumber = `FO-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const booking = await BookingModel.create({
      bookingNumber,
      user: ownerId,
      passengerName: user.name,
      passengerEmail: user.email,
      flight: databaseFlight?._id,
      flightNumber: flight.flightNumber,
      route: `${flight.departureAirport} to ${flight.destinationAirport}`,
      seats: values.seats,
      totalAmount: Number(flight.price) * values.seats,
      status: "pending",
      paymentStatus: "pending",
    });
    return NextResponse.json(
      { success: true, message: "Booking reserved. Complete payment when Stripe checkout is enabled.", data: { id: String(booking._id), bookingNumber, totalAmount: booking.totalAmount } },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof z.ZodError ? error.issues[0]?.message : "Could not reserve this booking" },
      { status: 400 },
    );
  }
}
