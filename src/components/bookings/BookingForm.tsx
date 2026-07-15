"use client";

import { CheckCircle2, CreditCard, Loader2, LockKeyhole, Plane } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

type Form = { seats: number };
type Confirmation = { bookingNumber: string; totalAmount: number };

export default function BookingForm({ flight, user }: { flight: { id: string; flightNumber: string; airlineName: string; departureAirport: string; destinationAirport: string; departureDate: string; departureTime: string; price: number; availableSeats: number }; user: { name: string; email: string } }) {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<Form>({ defaultValues: { seats: 1 } });
  const seats = Number(useWatch({ control, name: "seats" }) || 1);

  async function reserve(values: Form) {
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flightId: flight.id, seats: Number(values.seats) }) });
      const result = await response.json();
      if (!response.ok) return toast.error(result.message || "Could not reserve booking");
      setConfirmation(result.data);
      toast.success(result.message);
    } catch {
      toast.error("Could not reach the booking service");
    }
  }

  if (confirmation) {
    return <div className="card p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={54} /><span className="eyebrow mt-5">RESERVATION CREATED</span><h1 className="mt-3 text-3xl font-black">Your booking is pending payment</h1><p className="muted mt-3">Booking number</p><p className="mt-1 text-xl font-black text-blue-700">{confirmation.bookingNumber}</p><div className="mx-auto mt-6 max-w-sm rounded-xl bg-slate-50 p-4"><span className="text-sm text-slate-500">Amount due</span><p className="text-3xl font-black">${confirmation.totalAmount}</p></div><p className="muted mt-5 text-sm">Your reservation is visible to the admin. Stripe test checkout can be connected next without collecting card details directly on FlightOps.</p></div>;
  }

  return (
    <form onSubmit={handleSubmit(reserve)} className="card overflow-hidden">
      <div className="bg-slate-950 p-6 text-white"><div className="flex items-center justify-between"><div><span className="text-xs font-black tracking-widest text-blue-300">{flight.airlineName}</span><h1 className="mt-2 text-2xl font-black">Book {flight.flightNumber}</h1></div><Plane className="text-blue-400" size={34} /></div><div className="mt-6 flex items-center justify-between rounded-xl bg-white/10 p-4"><div><b>{flight.departureAirport}</b><small className="block text-slate-300">{flight.departureDate} · {flight.departureTime}</small></div><span className="text-blue-300">→</span><b>{flight.destinationAirport}</b></div></div>
      <div className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-sm font-bold">Passenger name</span><input className="input bg-slate-50" value={user.name} readOnly /></label><label><span className="mb-2 block text-sm font-bold">Email</span><input className="input bg-slate-50" value={user.email} readOnly /></label></div>
        <label><span className="mb-2 block text-sm font-bold">Seats</span><select className="input" {...register("seats", { valueAsNumber: true })}>{Array.from({ length: Math.min(6, flight.availableSeats) }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{value} seat{value > 1 ? "s" : ""}</option>)}</select></label>
        <div className="rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-bold"><CreditCard className="text-blue-600" />Secure card payment</div><div className="flex items-center gap-2"><span className="rounded bg-blue-700 px-2 py-1 text-xs font-black italic text-white">VISA</span><span className="flex -space-x-2"><i className="size-6 rounded-full bg-red-500" /><i className="size-6 rounded-full bg-amber-400/90" /></span></div></div><p className="muted mt-3 text-sm">Card details are not collected yet. Stripe test checkout will be connected in the next payment step.</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"><LockKeyhole size={14} />Payment fields will be hosted securely by Stripe</div></div>
        <div className="flex items-center justify-between border-t pt-5"><div><span className="text-sm text-slate-500">Total for {seats} seat{seats > 1 ? "s" : ""}</span><p className="text-3xl font-black">${flight.price * seats}</p></div><button disabled={isSubmitting} className="btn btn-primary">{isSubmitting && <Loader2 className="animate-spin" />}{isSubmitting ? "Reserving..." : "Reserve booking"}</button></div>
      </div>
    </form>
  );
}
