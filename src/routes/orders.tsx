import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira, type PackageRow } from "@/lib/nextride";
import { Package as PackageIcon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — NextRide Logistics" }, { name: "description", content: "See every package you've booked with NextRide." }] }),
  component: Orders,
});

function Orders() {
  const [email, setEmail] = useState("");
  const [q, setQ] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nextride:email");
      if (saved) { setEmail(saved); setQ(saved); }
    }
  }, []);

  const query = useQuery({
    queryKey: ["my-orders", q],
    enabled: !!q,
    queryFn: async () => {
      const { data, error } = await supabase.from("packages" as never).select("*").eq("customer_email", q ?? "").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PackageRow[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">My Orders</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Your NextRide packages</h1>
          <form onSubmit={(e) => { e.preventDefault(); setQ(email); if (email) localStorage.setItem("nextride:email", email); }} className="mt-6 flex gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter the email you booked with" className="h-11 bg-white text-foreground" />
            <Button type="submit" className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">View</Button>
          </form>
        </div>
      </section>
      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {!q && <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Enter your email above to see your orders.</p>}
        {q && query.isLoading && <p className="text-center text-muted-foreground">Loading…</p>}
        {q && !query.isLoading && (query.data ?? []).length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-semibold text-primary">No orders for {q}</p>
            <p className="mt-1 text-sm text-muted-foreground">Book your first delivery to get started.</p>
            <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/book">Book a delivery</Link></Button>
          </div>
        )}
        <div className="space-y-3">
          {(query.data ?? []).map((p) => (
            <Link key={p.id} to="/track" search={{ id: p.tracking_id }} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/40 hover:shadow-lg">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-accent"><PackageIcon className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-primary">{p.tracking_id}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">To {p.receiver_name} · {p.receiver_address}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{formatNaira(p.fee_ngn)}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
