"use client";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Form = Record<string, string>;

const fields = [
  ["airlineName", "Airline name"],
  ["airlineLogo", "Airline logo URL (optional)"],
  ["flightNumber", "Flight number"],
  ["title", "Flight title"],
  ["shortDescription", "Short description"],
  ["fullDescription", "Full description"],
  ["departureAirport", "Departure airport"],
  ["departureCity", "Departure city"],
  ["destinationAirport", "Destination airport"],
  ["destinationCity", "Destination city"],
  ["departureDate", "Departure date"],
  ["departureTime", "Departure time"],
  ["arrivalDate", "Arrival date"],
  ["arrivalTime", "Arrival time"],
  ["aircraftType", "Aircraft type"],
  ["travelClass", "Travel class"],
  ["price", "Price (USD)"],
  ["rating", "Rating"],
  ["availableSeats", "Available seats"],
  ["baggageAllowance", "Baggage allowance"],
  ["image", "Main image URL (optional)"],
  ["images", "Additional image URLs, comma separated (optional)"],
  ["status", "Status"],
] as const;

const optionalFields = new Set(["airlineLogo", "image", "images"]);

export default function FlightForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<Form>({ defaultValues: { status: "scheduled" } });

  async function submit(values: Form) {
    const response = await fetch("/api/flights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) return toast.error(result.message);
    toast.success("Flight added successfully");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="card grid gap-4 p-6 md:grid-cols-2">
      {fields.map(([name, label]) => {
        const validation = optionalFields.has(name) ? {} : { required: `${label} is required` };
        const wide = name.includes("Description") || name === "images";
        return (
          <label className={wide ? "md:col-span-2" : ""} key={name}>
            <span className="mb-2 block text-sm font-bold">{label}</span>
            {name.includes("Description") ? (
              <textarea className="input min-h-24" {...register(name, validation)} />
            ) : (
              <input
                className="input"
                type={
                  name.includes("Date")
                    ? "date"
                    : name.includes("Time")
                      ? "time"
                      : ["price", "rating", "availableSeats"].includes(name)
                        ? "number"
                        : "text"
                }
                step={name === "rating" ? "0.1" : undefined}
                {...register(name, validation)}
              />
            )}
            {errors[name] && <small className="text-red-600">{errors[name]?.message}</small>}
          </label>
        );
      })}
      <button disabled={isSubmitting} className="btn btn-primary md:col-span-2">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Add flight
      </button>
    </form>
  );
}
