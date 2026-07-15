"use client";

import { CreditCard, Loader2, LockKeyhole, Plane, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

type Form = { seats: number };

export default function BookingForm({ flight, user, cancelled = false }: { flight: { id: string; flightNumber: string; airlineName: string; departureAirport: string; destinationAirport: string; departureDate: string; departureTime: string; price: number; availableSeats: number }; user: { name: string; email: string }; cancelled?: boolean }) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<Form>({ defaultValues: { seats: 1 } });
  const seats = Number(useWatch({ control, name: "seats" }) || 1);

  async function checkout(values: Form) {
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flightId: flight.id, seats: Number(values.seats) }) });
      const result = await response.json();
      if (!response.ok || !result.data?.url) return toast.error(result.message || "Could not start secure checkout");
      window.location.assign(result.data.url);
    } catch {
      toast.error("Could not reach Stripe Checkout");
    }
  }

  return (
    <form onSubmit={handleSubmit(checkout)} className="card overflow-hidden">
      <div className="bg-slate-950 p-6 text-white"><div className="flex items-center justify-between"><div><span className="text-xs font-black tracking-widest text-blue-300">{flight.airlineName}</span><h1 className="mt-2 text-2xl font-black">Book {flight.flightNumber}</h1></div><Plane className="text-blue-400" size={34} /></div><div className="mt-6 flex items-center justify-between rounded-xl bg-white/10 p-4"><div><b>{flight.departureAirport}</b><small className="block text-slate-300">{flight.departureDate} · {flight.departureTime}</small></div><span className="text-blue-300">→</span><b>{flight.destinationAirport}</b></div></div>
      <div className="space-y-5 p-6">
        {cancelled && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Payment was cancelled. No charge was made. You can restart checkout below.</div>}
        <div className="grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-sm font-bold">Passenger name</span><input className="input bg-slate-50" value={user.name} readOnly /></label><label><span className="mb-2 block text-sm font-bold">Email</span><input className="input bg-slate-50" value={user.email} readOnly /></label></div>
        <label><span className="mb-2 block text-sm font-bold">Seats</span><select className="input" {...register("seats", { valueAsNumber: true })}>{Array.from({ length: Math.min(6, flight.availableSeats) }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{value} seat{value > 1 ? "s" : ""}</option>)}</select></label>
        <div className="rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-bold"><CreditCard className="text-blue-600" />Secure card payment</div><div className="flex items-center gap-2"><span className="rounded bg-blue-700 px-2 py-1 text-xs font-black italic text-white">VISA</span><span className="flex -space-x-2"><i className="size-6 rounded-full bg-red-500" /><i className="size-6 rounded-full bg-amber-400/90" /></span></div></div><p className="muted mt-3 text-sm">Your card details are entered only on Stripe&apos;s secure hosted Checkout page and are never stored by FlightOps.</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"><LockKeyhole size={14} />Encrypted Stripe test checkout</div></div>
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><ShieldCheck className="mr-2 inline" size={17} />Test mode is active. Use a Stripe test card; no real charge will be made.</div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5"><div><span className="text-sm text-slate-500">Total for {seats} seat{seats > 1 ? "s" : ""}</span><p className="text-3xl font-black">${flight.price * seats}</p></div><button disabled={isSubmitting || flight.availableSeats < 1} className="btn btn-primary">{isSubmitting && <Loader2 className="animate-spin" />}{isSubmitting ? "Opening Stripe..." : "Pay securely with card"}</button></div>
      </div>
    </form>
  );
}
