import { Types } from "mongoose";
import { redirect, notFound } from "next/navigation";
import BookingForm from "@/components/bookings/BookingForm";
import { currentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { flights } from "@/lib/flights";
import { FlightModel } from "@/models/Flight";

export const metadata = { title: "Book flight" };

export default async function BookFlight({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=/flights/${id}/book`);
  const seed = flights.find((flight) => flight.id === id);
  const databaseFlight = !seed && Types.ObjectId.isValid(id) && await connectDB() ? await FlightModel.findById(id).lean() : null;
  const flight = seed || databaseFlight;
  if (!flight) notFound();
  return <div className="bg-slate-50 py-12"><div className="container max-w-3xl"><div className="mb-7"><span className="eyebrow">SECURE RESERVATION</span><h1 className="section-title">Complete your booking</h1><p className="muted">Reserve your seats now. Secure Stripe card payment will be connected next.</p></div><BookingForm flight={{ id, flightNumber: flight.flightNumber, airlineName: flight.airlineName, departureAirport: flight.departureAirport, destinationAirport: flight.destinationAirport, departureDate: flight.departureDate, departureTime: flight.departureTime, price: Number(flight.price), availableSeats: Number(flight.availableSeats) }} user={{ name: user.name, email: user.email }} /></div></div>;
}
