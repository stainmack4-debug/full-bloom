import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — NextRide Logistics" },
      { name: "description", content: "The people, mission and story behind NextRide Logistics." },
      { property: "og:title", content: "About — NextRide Logistics" },
      { property: "og:description", content: "The people, mission and story behind NextRide Logistics." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">About</p>
          <h1 className="mt-2 font-display text-5xl font-bold">Built to move Nigeria forward, one package at a time.</h1>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-16 text-lg leading-relaxed text-muted-foreground sm:px-6 lg:px-8">
        <p>NextRide Logistics started with a simple belief: moving a package across town shouldn't feel like a gamble. We combine a trained rider network, live tracking, and a customer-first support team to make every delivery feel effortless — for individuals and businesses alike.</p>
        <p className="mt-6">Today we operate in Lagos, Abuja and Port Harcourt, moving thousands of packages every month. From single-document errands to multi-stop business logistics, our platform is designed for speed, safety and full visibility.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { k: "5,000+", v: "Packages delivered" },
            { k: "300+", v: "Businesses served" },
            { k: "98%", v: "On-time delivery" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-border bg-card p-6 text-center text-foreground">
              <div className="font-display text-4xl font-bold text-accent">{s.k}</div>
              <div className="mt-1 text-sm uppercase tracking-widest text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
