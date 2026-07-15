import AuthForm from "@/components/forms/AuthForm";

export const metadata = { title: "Login" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return <section className="bg-slate-50 py-20"><AuthForm mode="login" redirectTo={redirectTo} /></section>;
}
