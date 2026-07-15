"use client";

import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

type Form = Record<string, string>;
type Option = { value: string; label?: string };
type Field = {
  name: string;
  label: string;
  type?: string;
  wide?: boolean;
  textarea?: boolean;
  optional?: boolean;
  options?: Option[];
  list?: Option[];
  placeholder?: string;
};

const airlines = ["Biman Bangladesh Airlines", "US-Bangla Airlines", "Emirates", "Qatar Airways", "Turkish Airlines", "Etihad Airways", "Singapore Airlines", "Malaysia Airlines", "Thai Airways", "Saudia"];
const airports: Option[] = [
  ["DAC", "Hazrat Shahjalal International Airport"],
  ["CGP", "Shah Amanat International Airport"],
  ["CXB", "Cox's Bazar Airport"],
  ["DXB", "Dubai International Airport"],
  ["DOH", "Hamad International Airport"],
  ["IST", "Istanbul Airport"],
  ["KUL", "Kuala Lumpur International Airport"],
  ["SIN", "Singapore Changi Airport"],
  ["BKK", "Suvarnabhumi Airport"],
  ["JED", "King Abdulaziz International Airport"],
  ["LHR", "Heathrow Airport"],
].map(([value, label]) => ({ value, label }));
const cities = ["Dhaka", "Chattogram", "Cox's Bazar", "Dubai", "Doha", "Istanbul", "Kuala Lumpur", "Singapore", "Bangkok", "Jeddah", "London"];
const aircraft = ["Boeing 737-800", "Boeing 777-300ER", "Boeing 787-8 Dreamliner", "Airbus A320neo", "Airbus A330-300", "Airbus A350-900", "ATR 72-600"];
const list = (values: string[]) => values.map((value) => ({ value }));

const fields: Field[] = [
  { name: "airlineName", label: "Airline name", list: list(airlines), placeholder: "Type or select an airline" },
  { name: "airlineLogo", label: "Airline logo URL (optional)", optional: true, placeholder: "https://..." },
  { name: "flightNumber", label: "Flight number", placeholder: "Example: BG-147" },
  { name: "title", label: "Flight title", placeholder: "Example: Dhaka to Dubai direct flight" },
  { name: "shortDescription", label: "Short description", textarea: true, wide: true, placeholder: "A concise summary shown on the flight card" },
  { name: "fullDescription", label: "Full description", textarea: true, wide: true, placeholder: "Describe the journey, service and included facilities" },
  { name: "departureAirport", label: "Departure airport", list: airports, placeholder: "Select or type airport" },
  { name: "departureCity", label: "Departure city", list: list(cities), placeholder: "Select or type city" },
  { name: "destinationAirport", label: "Destination airport", list: airports, placeholder: "Select or type airport" },
  { name: "destinationCity", label: "Destination city", list: list(cities), placeholder: "Select or type city" },
  { name: "departureDate", label: "Departure date", type: "date" },
  { name: "departureTime", label: "Departure time", type: "time" },
  { name: "arrivalDate", label: "Arrival date", type: "date" },
  { name: "arrivalTime", label: "Arrival time", type: "time" },
  { name: "aircraftType", label: "Aircraft type", list: list(aircraft), placeholder: "Select or type aircraft" },
  { name: "travelClass", label: "Travel class", options: ["Economy", "Premium Economy", "Business", "First Class"].map((value) => ({ value })) },
  { name: "price", label: "Price (USD)", type: "number", placeholder: "Example: 485" },
  { name: "rating", label: "Rating", type: "number", placeholder: "0–5" },
  { name: "availableSeats", label: "Available seats", type: "number", placeholder: "Example: 36" },
  { name: "baggageAllowance", label: "Baggage allowance", list: list(["20 kg checked + 7 kg cabin", "25 kg checked + 7 kg cabin", "30 kg checked + 7 kg cabin", "35 kg checked + 10 kg cabin", "40 kg checked + 10 kg cabin"]), placeholder: "Select or type allowance" },
  { name: "images", label: "Additional image URLs (optional)", optional: true, wide: true, placeholder: "Separate multiple URLs with commas" },
  { name: "status", label: "Status", options: ["scheduled", "active"].map((value) => ({ value })) },
];

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be smaller than 10 MB");
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / source.width, 1000 / source.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot process the image");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export default function FlightForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { isSubmitting, errors },
  } = useForm<Form>({ defaultValues: { status: "scheduled", image: "" } });
  const image = useWatch({ control, name: "image" });

  async function processFile(file?: File) {
    if (!file) return;
    setProcessing(true);
    try {
      const value = await compressImage(file);
      setValue("image", value, { shouldDirty: true, shouldValidate: true });
      toast.success("Image added and optimized");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not process image");
    } finally {
      setProcessing(false);
      setDragging(false);
    }
  }

  async function submit(values: Form) {
    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.message || "Could not add flight");
      toast.success(result.message || "Flight added successfully");
      reset();
    } catch {
      toast.error("Could not reach the server. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="card grid gap-5 p-6 md:grid-cols-2 md:p-8">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 md:col-span-2">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Add Flight</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Create a complete flight listing</h2>
        <p className="mt-1 text-sm text-slate-600">Select suggested values or type your own operational information.</p>
      </div>
      {fields.slice(0, 20).map((field) => <FormField key={field.name} field={field} register={register} error={errors[field.name]?.message} />)}

      <div className="md:col-span-2">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold">Main flight image (optional)</span><span className="text-xs text-slate-500">URL or upload</span></div>
        <div className="grid gap-3 lg:grid-cols-2">
          <label>
            <span className="sr-only">Main image URL</span>
            <input className="input" placeholder="Paste an image URL" {...register("image")} />
          </label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); processFile(event.dataTransfer.files[0]); }}
            className={`flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 text-center transition ${dragging ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-blue-400 hover:bg-blue-50"}`}
          >
            {processing ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            <span className="text-sm font-semibold">Drop image here or click to browse</span>
            <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => processFile(event.target.files?.[0])} />
          </div>
        </div>
        {image && (
          <div className="relative mt-3 h-44 overflow-hidden rounded-xl bg-slate-100">
            <Image src={image} alt="Selected flight preview" fill className="object-cover" unoptimized={image.startsWith("data:")} />
            <button type="button" aria-label="Remove image" onClick={() => setValue("image", "")} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-red-600 shadow"><X size={17} /></button>
          </div>
        )}
      </div>

      {fields.slice(20).map((field) => <FormField key={field.name} field={field} register={register} error={errors[field.name]?.message} />)}
      <button disabled={isSubmitting || processing} className="btn btn-primary md:col-span-2">
        {isSubmitting ? <Loader2 className="animate-spin" /> : <ImagePlus size={18} />}
        {isSubmitting ? "Submitting flight…" : "Submit flight for approval"}
      </button>
    </form>
  );
}

function FormField({ field, register, error }: { field: Field; register: ReturnType<typeof useForm<Form>>["register"]; error?: string }) {
  const validation = field.optional ? {} : { required: `${field.label} is required` };
  const listId = `${field.name}-suggestions`;
  return (
    <label className={field.wide ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-sm font-bold">{field.label}</span>
      {field.textarea ? (
        <textarea className="input min-h-28" placeholder={field.placeholder} {...register(field.name, validation)} />
      ) : field.options ? (
        <select className="input" {...register(field.name, validation)} defaultValue="">
          <option value="" disabled>Select {field.label.toLowerCase()}</option>
          {field.options.map((option) => <option value={option.value} key={option.value}>{option.label || option.value}</option>)}
        </select>
      ) : (
        <>
          <input
            className="input"
            type={field.type || "text"}
            list={field.list ? listId : undefined}
            placeholder={field.placeholder}
            min={field.name === "rating" ? 0 : ["price", "availableSeats"].includes(field.name) ? 0 : undefined}
            max={field.name === "rating" ? 5 : undefined}
            step={field.name === "rating" ? "0.1" : undefined}
            {...register(field.name, validation)}
          />
          {field.list && <datalist id={listId}>{field.list.map((option) => <option value={option.value} label={option.label} key={option.value} />)}</datalist>}
        </>
      )}
      {error && <small className="mt-1 block text-red-600">{error}</small>}
    </label>
  );
}
