import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatusTimeline } from "@/components/status-badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { formatNaira, type PackageEventRow, type PackageRow } from "@/lib/nextride";
import { MapPin, User, Phone, Package as PackageIcon } from "lucide-react";
import { toast } from "sonner";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/track")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Track your package — NextRide Logistics" },
      { name: "description", content: "Enter your NextRide tracking ID to see live status and delivery timeline." },
      { property: "og:title", content: "Track your package — NextRide Logistics" },
      { property: "og:description", content: "Enter your NextRide tracking ID to see live status and delivery timeline." },
    ],
  }),
  component: Track,
});

function Track() {
  const { id } = Route.useSearch();
  const nav = useNavigate();
  const [input, setInput] = useState(id ?? "");

  useEffect(() => { setInput(id ?? ""); }, [id]);

  const query = useQuery({
    queryKey: ["track", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: pkg, error } = await supabase
        .from("packages" as never)
        .select("*")
        .eq("tracking_id", (id ?? "").toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!pkg) return { pkg: null as PackageRow | null, events: [] as PackageEventRow[] };
      const { data: events } = await supabase
        .from("package_events" as never)
        .select("*")
        .eq("package_id", (pkg as PackageRow).id)
        .order("created_at", { ascending: true });
      return { pkg: pkg as PackageRow, events: (events ?? []) as PackageEventRow[] };
    },
  });

  useEffect(() => {
    if (!id || !query.data?.pkg) return;
    const channel = supabase
      .channel("track-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "packages", filter: `tracking_id=eq.${id.toUpperCase()}` }, () => query.refetch())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "package_events", filter: `package_id=eq.${query.data.pkg.id}` }, () => { query.refetch(); toast.info("New tracking update"); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, query.data?.pkg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pkg = query.data?.pkg;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Track</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Where's my package?</h1>
          <form
            onSubmit={(e) => { e.preventDefault(); if (input.trim()) nav({ to: "/track", search: { id: input.trim().toUpperCase() } }); }}
            className="mt-6 flex gap-3"
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="NXR123456" className="h-12 flex-1 bg-white text-foreground uppercase" />
            <Button type="submit" size="lg" className="h-12 bg-accent px-6 text-accent-foreground hover:bg-accent/90">Track</Button>
          </form>
        </div>
      </section>
      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {!id && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Enter a tracking ID above to see delivery status.</p>
        )}
        {id && query.isLoading && (
          <p className="text-center text-muted-foreground">Loading…</p>
        )}
        {id && !query.isLoading && !pkg && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-semibold text-primary">No package found for {id}</p>
            <p className="mt-1 text-sm text-muted-foreground">Double-check the tracking ID and try again.</p>
          </div>
        )}
        {pkg && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Tracking ID</p>
                    <p className="font-display text-2xl font-bold text-primary">{pkg.tracking_id}</p>
                  </div>
                  <StatusBadge status={pkg.status} />
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoRow icon={MapPin} label="From" value={pkg.sender_address} />
                  <InfoRow icon={MapPin} label="To" value={pkg.receiver_address} />
                  <InfoRow icon={User} label="Receiver" value={pkg.receiver_name} />
                  <InfoRow icon={Phone} label="Phone" value={pkg.receiver_phone} />
                  <InfoRow icon={PackageIcon} label="Type" value={`${pkg.package_type} · ${pkg.weight_kg}kg`} />
                  <InfoRow icon={PackageIcon} label="Fee" value={formatNaira(pkg.fee_ngn)} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold text-primary">Delivery timeline</h3>
              <div className="mt-4">
                <StatusTimeline status={pkg.status} events={query.data!.events} />
              </div>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="truncate font-medium text-primary">{value}</p>
      </div>
    </div>
  );
}
