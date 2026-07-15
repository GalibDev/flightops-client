"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string().optional(),
  })
  .refine((value) => !value.confirm || value.password === value.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type Form = z.infer<typeof schema>;

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [show, setShow] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function submit(values: Form) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        return toast.error(result?.message || "Authentication service is unavailable");
      }
      toast.success(result?.message || "Success");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof DOMException && error.name === "AbortError"
          ? "Database connection timed out. Check the Atlas URI and Network Access settings."
          : "Could not reach the server. Please try again.",
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function demo(role: "user" | "admin") {
    setValue("email", `${role}@flightops.com`);
    setValue("password", role === "user" ? "User123!" : "Admin123!");
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="card mx-auto max-w-md p-7">
      <h1 className="text-2xl font-black">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted mb-6 mt-2 text-sm">
        {mode === "login" ? "Sign in to manage your FlightOps workspace." : "Start managing journeys with clarity."}
      </p>
      {mode === "register" && (
        <Field label="Full name" error={errors.name?.message}>
          <input className="input" {...register("name")} placeholder="Your full name" />
        </Field>
      )}
      <Field label="Email" error={errors.email?.message}>
        <input className="input" {...register("email")} type="email" placeholder="you@example.com" />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <div className="relative">
          <input className="input !pr-11" {...register("password")} type={show ? "text" : "password"} placeholder="Minimum 8 characters" />
          <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-3 text-slate-500">
            {show ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </Field>
      {mode === "register" && (
        <Field label="Confirm password" error={errors.confirm?.message}>
          <input className="input" {...register("confirm")} type="password" placeholder="Repeat password" />
        </Field>
      )}
      <button disabled={isSubmitting} className="btn btn-primary mt-2 w-full">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {mode === "login" ? "Sign in" : "Create account"}
      </button>
      {mode === "login" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary !p-2 text-xs" onClick={() => demo("user")}>Demo user</button>
          <button type="button" className="btn btn-secondary !p-2 text-xs" onClick={() => demo("admin")}>Demo admin</button>
        </div>
      )}
      <p className="mt-5 text-center text-sm text-slate-500">
        {mode === "login" ? "New to FlightOps? " : "Already registered? "}
        <Link className="font-bold text-blue-600" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Create account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block text-sm font-bold">
      {label}
      <div className="mt-2">{children}</div>
      {error && <small className="mt-1 block text-red-600">{error}</small>}
    </label>
  );
}
