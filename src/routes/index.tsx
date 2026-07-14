import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  Package as PackageIcon,
  Building2,
  DoorOpen,
  MapPin,
  ShieldCheck,
  Clock,
  Truck,
  Camera,
  Check,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImg from "@/assets/hero-courier.jpg";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

const SERVICES = [
  { icon: Bike, title: "Same-day Delivery", desc: "Fast delivery within the same day across the city." },
  { icon: PackageIcon, title: "Package Pickup", desc: "We pick up your packages from your location." },
  { icon: Building2, title: "Business Logistics", desc: "Reliable logistics solutions for growing businesses." },
  { icon: DoorOpen, title: "Door-to-door Delivery", desc: "From your doorstep straight to the receiver." },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Secure Handling", desc: "Every package is insured and handled with care." },
  { icon: Clock, title: "Real-time Tracking", desc: "Follow your delivery on a live status timeline." },
  { icon: Camera, title: "Proof of Delivery", desc: "Photo and signature captured at drop-off." },
  { icon: Truck, title: "Nationwide Coverage", desc: "Serving Lagos, Abuja, Port Harcourt and beyond." },
];

function Landing() {
  const [trackId, setTrackId] = useState("");
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-gradient text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Delivering across Nigeria
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Fast, Reliable & <span className="text-brand-gradient">Secure</span> Delivery Service
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/70">
              NextRide Logistics delivers your packages safely and on time — every time. Book a pickup, track in real time, and pay only for what you send.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-accent px-6 text-base font-semibold text-accent-foreground shadow-xl shadow-accent/30 hover:brightness-110">
                <Link to="/book">
                  Book a Delivery <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-white/20 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10 hover:text-white">
                <Link to="/track">Track Package</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                { k: "5k+", v: "Deliveries" },
                { k: "98%", v: "On-time" },
                { k: "24/7", v: "Support" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-display text-3xl font-bold text-accent">{s.k}</div>
                  <div className="text-xs uppercase tracking-widest text-white/60">{s.v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur">
              <img
                src={heroImg}
                alt="NextRide courier holding a package"
                width={1200}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>

            {/* floating status card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-8 -left-6 hidden w-64 rounded-2xl border border-white/15 bg-primary/90 p-4 shadow-2xl backdrop-blur sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-success text-success-foreground">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Package NXR482910</p>
                  <p className="text-sm font-semibold text-white">Out for delivery</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-4/5 rounded-full bg-accent" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TRACK BAR */}
      <section className="relative -mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <MapPin className="h-4 w-4 text-accent" /> Track your package
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (trackId.trim()) nav({ to: "/track", search: { id: trackId.trim().toUpperCase() } }); }}
            className="flex flex-1 gap-2"
          >
            <Input
              placeholder="Enter tracking ID, e.g. NXR482910"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="h-11 flex-1 uppercase"
            />
            <Button type="submit" className="h-11 bg-primary px-6 hover:bg-primary/90">Track</Button>
          </form>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Our Services</p>
          <h2 className="mt-2 text-4xl font-bold text-primary sm:text-5xl">Delivery, done four ways</h2>
          <p className="mt-4 text-muted-foreground">
            Whether it's a single document or a full business shipment, pick the service that fits.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-accent group-hover:bg-accent group-hover:text-accent-foreground transition">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-primary p-8 text-primary-foreground sm:p-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">How it works</p>
              <h2 className="mt-2 font-display text-4xl font-bold">From click to doorstep in four steps</h2>
              <p className="mt-4 text-primary-foreground/70">Book online, we pick up, driver delivers, you receive proof — real-time updates the whole way.</p>
            </div>
            <ol className="space-y-4">
              {[
                { t: "Book online", d: "Enter sender, receiver and package details. We calculate the fare instantly." },
                { t: "Driver picks up", d: "Nearest available driver accepts and heads to your pickup location." },
                { t: "In transit", d: "Track the driver live from pickup to drop-off." },
                { t: "Proof of delivery", d: "Photo + signature captured at drop-off. Case closed." },
              ].map((step, i) => (
                <li key={step.t} className="flex gap-4 rounded-xl bg-white/5 p-4 border border-white/10">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{step.t}</p>
                    <p className="text-sm text-primary-foreground/70">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-accent" />
              <h4 className="mt-3 font-semibold text-primary">{f.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent-glow p-10 text-accent-foreground sm:p-16">
          <h2 className="max-w-2xl font-display text-4xl font-bold leading-tight">Ready to send your first package?</h2>
          <p className="mt-3 max-w-xl text-accent-foreground/90">Get a quote in under 30 seconds and have a driver dispatched today.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-white px-6 text-primary hover:bg-white/90">
              <Link to="/book">Book delivery</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
