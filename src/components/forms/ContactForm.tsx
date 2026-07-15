"use client";

import { Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Form = { name: string; email: string; subject: string; message: string };

export default function ContactForm({ user }: { user?: { name: string; email: string } | null }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ defaultValues: { name: user?.name || "", email: user?.email || "" } });

  async function send(values: Form) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.message || "Could not send message");
      toast.success(result.message);
      reset({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
    } catch {
      toast.error("Could not reach the message service. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(send)} className="card p-7">
      {user && <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Signed in as <b>{user.name}</b>. The admin will receive your verified account name and email.</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <input className="input" readOnly={!!user} {...register("name", { required: "Name is required" })} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input className="input" readOnly={!!user} type="email" {...register("email", { required: "Email is required" })} />
        </Field>
      </div>
      <Field label="Subject" error={errors.subject?.message}>
        <input className="input" placeholder="How can we help?" {...register("subject", { required: "Subject is required" })} />
      </Field>
      <Field label="Message" error={errors.message?.message}>
        <textarea className="input min-h-36" placeholder="Write your message for the admin team" {...register("message", { required: "Message is required", minLength: { value: 10, message: "Please add a little more detail" } })} />
      </Field>
      <button disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="mb-4 block text-sm font-bold">{label}<div className="mt-2">{children}</div>{error && <small className="text-red-600">{error}</small>}</label>;
}
