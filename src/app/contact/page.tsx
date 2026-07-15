import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Contact", description: "Contact the FlightOps support team." };

export default async function Contact() {
  const user = await currentUser();
  return (
    <>
      <div className="page-head"><div className="container"><span className="eyebrow">CONTACT US</span><h1 className="section-title">How can we help?</h1><p className="muted">Questions about a route or your operations? Our team is ready.</p></div></div>
      <section className="container grid gap-8 py-12 lg:grid-cols-[.65fr_1fr]">
        <div className="card h-fit p-7">
          <h2 className="text-xl font-black">Talk with our team</h2><p className="muted my-5 text-sm">We aim to respond within one business day.</p>
          {[[Mail, "support@flightops.com"], [Phone, "+880 1234 567890"], [MapPin, "Dhaka, Bangladesh"]].map(([Icon, text]) => <p className="mb-5 flex items-center gap-3" key={String(text)}><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={18} /></span>{String(text)}</p>)}
        </div>
        <ContactForm user={user ? { name: user.name, email: user.email } : null} />
      </section>
    </>
  );
}
