import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira, type DriverRow, type PackageRow, type PackageStatus } from "@/lib/nextride";
import { Home, Package as PackageIcon, User, LogOut, Lock, Phone, MapPin, Camera, PenLine, Truck as TruckIcon, ArrowLeft, CheckCircle2, ChevronRight, Bike } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver")({
  head: () => ({ meta: [{ title: "Driver Portal — NextRide Logistics" }, { name: "robots", content: "noindex" }] }),
  component: DriverPage,
});

const DRIVER_KEY = "nextride:driver";
const DRIVER_ID_KEY = "nextride:driver_id";
const DRIVER_PASSWORD = "NRL drivers";

function DriverPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUnlocked(sessionStorage.getItem(DRIVER_KEY) === "1");
      setDriverId(sessionStorage.getItem(DRIVER_ID_KEY));
    }
  }, []);

  if (!unlocked) return <Gate onUnlock={() => { sessionStorage.setItem(DRIVER_KEY, "1"); setUnlocked(true); }} />;
  if (!driverId) return <PickDriver onPick={(id) => { sessionStorage.setItem(DRIVER_ID_KEY, id); setDriverId(id); }} onLogout={logout} />;
  return <DriverApp driverId={driverId} onLogout={logout} />;

  function logout() { sessionStorage.removeItem(DRIVER_KEY); sessionStorage.removeItem(DRIVER_ID_KEY); setUnlocked(false); setDriverId(null); }
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="min-h-screen bg-hero-gradient text-white grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-xl">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/40 mx-auto"><Lock className="h-6 w-6"/></div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold">Driver Portal</h1>
        <p className="mt-1 text-center text-sm text-white/70">Enter driver access password</p>
        <form onSubmit={(e) => { e.preventDefault(); if (pw === DRIVER_PASSWORD) onUnlock(); else { setErr(true); setPw(""); } }} className="mt-6 space-y-3">
          <Input autoFocus type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} placeholder="Password" className="h-12 bg-white text-foreground" />
          {err && <p className="text-sm bg-destructive/20 rounded-md p-2 text-center">Incorrect password</p>}
          <Button type="submit" size="lg" className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">Unlock</Button>
        </form>
      </div>
    </div>
  );
}

function PickDriver({ onPick, onLogout }: { onPick: (id: string) => void; onLogout: () => void }) {
  const { data: drivers = [] } = useQuery({
    queryKey: ["driver-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers" as never).select("*").order("name");
      if (error) throw error;
      return (data ?? []) as DriverRow[];
    },
  });
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">Driver</p>
          <h1 className="font-display text-xl font-bold">Who's driving today?</h1>
        </div>
        <button onClick={onLogout} className="text-white/70 hover:text-white"><LogOut className="h-5 w-5" /></button>
      </header>
      <div className="p-4 space-y-2">
        {drivers.map((d) => (
          <button key={d.id} onClick={() => onPick(d.id)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-accent">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-accent"><Bike className="h-5 w-5"/></div>
            <div className="flex-1">
              <p className="font-semibold text-primary">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.vehicle} · {d.plate}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        {drivers.length === 0 && <p className="p-8 text-center text-muted-foreground">No drivers configured yet.</p>}
      </div>
    </div>
  );
}

function DriverApp({ driverId, onLogout }: { driverId: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"home" | "packages" | "profile">("home");
  const [openPkg, setOpenPkg] = useState<string | null>(null);

  const { data: driver } = useQuery({
    queryKey: ["driver-me", driverId],
    queryFn: async () => {
      const { data } = await supabase.from("drivers" as never).select("*").eq("id", driverId).maybeSingle();
      return (data ?? null) as DriverRow | null;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["driver-packages", driverId],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages" as never).select("*").eq("driver_id", driverId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PackageRow[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("driver-" + driverId)
      .on("postgres_changes", { event: "*", schema: "public", table: "packages", filter: `driver_id=eq.${driverId}` }, () => qc.invalidateQueries({ queryKey: ["driver-packages", driverId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [driverId, qc]);

  const active = packages.filter((p) => ["assigned","picked_up","in_transit","out_for_delivery"].includes(p.status));
  const delivered = packages.filter((p) => p.status === "delivered");
  const todayEarnings = delivered.reduce((s, p) => s + Number(p.fee_ngn), 0);

  const openPkgData = openPkg ? packages.find((p) => p.id === openPkg) : null;

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Welcome back</p>
            <h1 className="font-display text-xl font-bold">{driver?.name ?? "Driver"}</h1>
          </div>
          <button onClick={onLogout} className="text-white/70 hover:text-white"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      {openPkgData ? (
        <PackageDetail pkg={openPkgData} onBack={() => setOpenPkg(null)} onChanged={() => qc.invalidateQueries({ queryKey: ["driver-packages", driverId] })} />
      ) : (
        <>
          {tab === "home" && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Active" value={active.length} icon={TruckIcon} />
                <StatCard label="Delivered" value={delivered.length} icon={CheckCircle2} />
              </div>
              <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
                <p className="text-xs uppercase tracking-widest text-accent">Today's earnings</p>
                <p className="mt-1 font-display text-3xl font-bold">{formatNaira(todayEarnings)}</p>
                <p className="mt-1 text-xs text-primary-foreground/70">Based on delivered packages</p>
              </div>
              <h2 className="pt-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Active jobs</h2>
              {active.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">No active jobs — you're all clear.</p>}
              <div className="space-y-3">
                {active.map((p) => <PackageCard key={p.id} pkg={p} onOpen={() => setOpenPkg(p.id)} />)}
              </div>
            </div>
          )}

          {tab === "packages" && (
            <div className="p-4 space-y-3">
              {packages.map((p) => <PackageCard key={p.id} pkg={p} onOpen={() => setOpenPkg(p.id)} />)}
              {packages.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No packages assigned yet.</p>}
            </div>
          )}

          {tab === "profile" && driver && (
            <div className="p-4 space-y-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-accent"><Bike className="h-7 w-7" /></div>
                  <div>
                    <p className="font-display text-lg font-bold text-primary">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <ProfileItem label="Vehicle" value={driver.vehicle ?? "-"} />
                  <ProfileItem label="Plate" value={driver.plate ?? "-"} />
                  <ProfileItem label="Status" value={driver.status} />
                  <ProfileItem label="Delivered" value={String(delivered.length)} />
                </div>
                <Button onClick={() => { sessionStorage.removeItem(DRIVER_ID_KEY); location.reload(); }} variant="outline" className="mt-4 w-full">Switch driver</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom nav */}
      {!openPkgData && (
        <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur grid grid-cols-3">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "packages", label: "Packages", icon: PackageIcon },
            { id: "profile", label: "Profile", icon: User },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as "home" | "packages" | "profile")} className={`flex flex-col items-center gap-1 py-3 text-xs ${tab === t.id ? "text-accent" : "text-muted-foreground"}`}>
              <t.icon className="h-5 w-5" /> {t.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-primary capitalize">{value}</p>
    </div>
  );
}

function PackageCard({ pkg, onOpen }: { pkg: PackageRow; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-primary">{pkg.tracking_id}</p>
          <p className="text-xs text-muted-foreground">{pkg.package_type} · {pkg.weight_kg}kg</p>
        </div>
        <StatusBadge status={pkg.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground"/> {pkg.sender_address}</p>
        <p className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent"/> {pkg.receiver_address}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Fee: <b className="text-primary">{formatNaira(pkg.fee_ngn)}</b></span>
        <ChevronRight className="h-4 w-4"/>
      </div>
    </button>
  );
}

function PackageDetail({ pkg, onBack, onChanged }: { pkg: PackageRow; onBack: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: PackageStatus, note?: string) {
    setBusy(true);
    try {
      const { error } = await supabase.from("packages" as never).update({ status } as never).eq("id", pkg.id);
      if (error) throw error;
      if (note) await supabase.from("package_events" as never).insert({ package_id: pkg.id, status, note, actor: "driver" } as never);
      toast.success("Status updated");
      onChanged();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  async function reject() {
    setBusy(true);
    const { error } = await supabase.from("packages" as never).update({ driver_id: null, status: "pending" } as never).eq("id", pkg.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast("Job rejected");
    onChanged(); onBack();
  }

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground -mt-px">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5"/></button>
        <p className="font-semibold">{pkg.tracking_id}</p>
        <div className="ml-auto"><StatusBadge status={pkg.status} /></div>
      </div>

      <div className="p-4 space-y-4">
        <Section title="Pickup">
          <RowLine icon={MapPin} label="Address" value={pkg.sender_address} />
          <RowLine icon={User} label="Sender" value={pkg.sender_name} />
          <RowLine icon={Phone} label="Phone" value={pkg.sender_phone} />
        </Section>

        <Section title="Drop-off">
          <RowLine icon={MapPin} label="Address" value={pkg.receiver_address} />
          <RowLine icon={User} label="Receiver" value={pkg.receiver_name} />
          <RowLine icon={Phone} label="Phone" value={pkg.receiver_phone} />
        </Section>

        <Section title="Package">
          <RowLine icon={PackageIcon} label="Type" value={`${pkg.package_type} · ${pkg.weight_kg}kg`} />
          <RowLine icon={TruckIcon} label="Fee" value={formatNaira(pkg.fee_ngn)} />
          {pkg.description && <RowLine icon={PenLine} label="Notes" value={pkg.description} />}
        </Section>

        <MapPlaceholder pkg={pkg} />

        {/* Actions by status */}
        <div className="space-y-2">
          {pkg.status === "assigned" && (
            <>
              <Button disabled={busy} onClick={() => setStatus("picked_up", "Driver accepted and heading to pickup")} className="w-full bg-success text-success-foreground hover:bg-success/90">Accept & head to pickup</Button>
              <Button disabled={busy} onClick={reject} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10">Reject</Button>
              <a href={`tel:${pkg.sender_phone}`} className="block"><Button variant="outline" className="w-full">Call sender</Button></a>
            </>
          )}
          {pkg.status === "picked_up" && (
            <>
              <Button disabled={busy} onClick={() => setStatus("in_transit", "Package picked up, in transit")} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">I've picked up</Button>
              <a href={`tel:${pkg.sender_phone}`} className="block"><Button variant="outline" className="w-full">Call sender</Button></a>
            </>
          )}
          {pkg.status === "in_transit" && (
            <>
              <Button disabled={busy} onClick={() => setStatus("out_for_delivery", "Approaching receiver")} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Start delivery</Button>
              <a href={`tel:${pkg.receiver_phone}`} className="block"><Button variant="outline" className="w-full">Call receiver</Button></a>
            </>
          )}
          {pkg.status === "out_for_delivery" && (
            <ProofOfDeliveryForm pkg={pkg} onDone={() => { onChanged(); onBack(); }} />
          )}
          {pkg.status === "delivered" && (
            <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-center text-success"><CheckCircle2 className="mx-auto h-6 w-6"/> <p className="mt-1 font-semibold">Delivered</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}
function RowLine({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-accent shrink-0" />
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-primary">{value}</p></div>
    </div>
  );
}

function MapPlaceholder({ pkg }: { pkg: PackageRow }) {
  return (
    <div className="relative h-40 overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}/>
      <svg className="absolute inset-0" viewBox="0 0 400 160" preserveAspectRatio="none">
        <path d="M 40 130 C 100 40, 250 20, 360 100" stroke="#F27321" strokeWidth="3" fill="none" strokeDasharray="6 4"/>
      </svg>
      <div className="absolute left-4 top-3 flex items-center gap-1.5 text-xs">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground"><MapPin className="h-3 w-3"/></span> Pickup
      </div>
      <div className="absolute right-4 bottom-3 flex items-center gap-1.5 text-xs">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground"><MapPin className="h-3 w-3"/></span> Drop-off
      </div>
      <p className="absolute bottom-3 left-4 text-xs text-white/70">Est. {pkg.distance_km}km · {Math.round(pkg.distance_km * 3)} min</p>
    </div>
  );
}

function ProofOfDeliveryForm({ pkg, onDone }: { pkg: PackageRow; onDone: () => void }) {
  const [receiverName, setReceiverName] = useState(pkg.receiver_name);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!; ctx.strokeStyle = "#0B1E3F"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }
  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!; ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
  }
  function endDraw() { drawingRef.current = false; if (canvasRef.current) setSignature(canvasRef.current.toDataURL("image/png")); }
  function clearSig() { const c = canvasRef.current; if (!c) return; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setSignature(null); }

  async function submit() {
    if (!receiverName.trim()) return toast.error("Receiver name required");
    setBusy(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const path = `${pkg.id}/${Date.now()}-${photoFile.name}`;
        const { error: upErr } = await supabase.storage.from("proof-of-delivery").upload(path, photoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("proof-of-delivery").createSignedUrl(path, 60 * 60 * 24 * 365);
        photoUrl = signed?.signedUrl ?? null;
      }
      await supabase.from("proof_of_delivery" as never).upsert({
        package_id: pkg.id, receiver_name: receiverName, photo_url: photoUrl, signature_data_url: signature,
      } as never, { onConflict: "package_id" });
      await supabase.from("packages" as never).update({ status: "delivered" } as never).eq("id", pkg.id);
      toast.success("Delivered — proof captured");
      onDone();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Proof of Delivery</p>
      <div>
        <label className="text-xs text-muted-foreground">Receiver name</label>
        <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Photo</label>
        <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-accent">
          <Camera className="h-4 w-4"/> {photoFile ? photoFile.name : "Take or upload photo"}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}/>
        </label>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Signature</label>
          <button type="button" onClick={clearSig} className="text-xs text-accent">Clear</button>
        </div>
        <canvas ref={canvasRef} width={600} height={160} className="mt-1 h-32 w-full touch-none rounded-lg border border-border bg-muted/30" onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={endDraw} onPointerLeave={endDraw} />
      </div>
      <Button disabled={busy} onClick={submit} className="w-full bg-success text-success-foreground hover:bg-success/90"><CheckCircle2 className="mr-2 h-4 w-4"/>Mark delivered</Button>
    </div>
  );
}

// suppress unused
void Select; void SelectContent; void SelectItem; void SelectTrigger; void SelectValue;
