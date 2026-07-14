import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NextRide Logistics" },
      { name: "description", content: "Get in touch with the NextRide Logistics team." },
      { property: "og:title", content: "Contact — NextRide Logistics" },
      { property: "og:description", content: "Get in touch with the NextRide Logistics team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sending, setSending] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Contact</p>
          <h1 className="mt-2 font-display text-5xl font-bold">We're here to help.</h1>
          <p className="mt-4 max-w-xl text-primary-foreground/70">Questions about a delivery, bulk pricing, or a partnership? Send us a note.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-6 lg:col-span-1">
          {[
            { icon: Phone, label: "Phone", value: "+234 800 123 4567" },
            { icon: Mail, label: "Email", value: "hello@nextridelogistics.com" },
            { icon: MapPin, label: "Address", value: "123 Logistics Street, Lagos" },
          ].map((c) => (
            <div key={c.label} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-semibold text-primary">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => { setSending(false); toast.success("Message sent — we'll be in touch shortly."); (e.target as HTMLFormElement).reset(); }, 600);
          }}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 lg:col-span-2 sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Name</Label><Input required placeholder="Your name" /></div>
            <div><Label>Email</Label><Input type="email" required placeholder="you@example.com" /></div>
          </div>
          <div><Label>Subject</Label><Input required placeholder="How can we help?" /></div>
          <div><Label>Message</Label><Textarea required rows={5} placeholder="Tell us more..." /></div>
          <Button type="submit" disabled={sending} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {sending ? "Sending..." : "Send message"}
          </Button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
