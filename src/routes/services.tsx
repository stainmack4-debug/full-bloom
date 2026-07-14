import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Bike, Package, Building2, DoorOpen, Camera, Clock, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — NextRide Logistics" },
      { name: "description", content: "Same-day delivery, package pickup, business logistics and door-to-door delivery across Nigeria." },
      { property: "og:title", content: "Services — NextRide Logistics" },
      { property: "og:description", content: "Same-day, pickup, business and door-to-door delivery services." },
    ],
  }),
  component: ServicesPage,
});

const SERVICES = [
  { icon: Bike, title: "Same-day Delivery", desc: "Get your package to its destination within the same day, anywhere in the city.", price: "from ₦1,500" },
  { icon: Package, title: "Package Pickup", desc: "Our driver picks up your package from your location — no need to drop it off.", price: "from ₦2,000" },
  { icon: Building2, title: "Business Logistics", desc: "Scheduled routes, bulk pricing, and dedicated account management for businesses.", price: "custom quote" },
  { icon: DoorOpen, title: "Door-to-door Delivery", desc: "Straight from the sender's doorstep to the receiver — with real-time updates.", price: "from ₦2,500" },
];

function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Services</p>
          <h1 className="mt-2 font-display text-5xl font-bold">Delivery tailored to what you send</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/70">Choose the service that fits — from urgent single documents to scheduled business shipments.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-8">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-accent">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold text-accent">{s.price}</span>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90"><Link to="/book">Book now</Link></Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Insured", desc: "Every package is protected against loss or damage." },
            { icon: Clock, title: "On-time", desc: "98% on-time rate across all deliveries." },
            { icon: Camera, title: "POD", desc: "Photo + signature on every drop-off." },
            { icon: Truck, title: "Fleet", desc: "Bikes, cars and vans for every parcel size." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-accent" />
              <h4 className="mt-3 font-semibold text-primary">{f.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
