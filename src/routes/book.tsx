import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { calculateFee, formatNaira, type PackageRow } from "@/lib/nextride";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, ArrowRight, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a delivery — NextRide Logistics" },
      { name: "description", content: "Book a package pickup and delivery in under a minute." },
      { property: "og:title", content: "Book a delivery — NextRide Logistics" },
      { property: "og:description", content: "Book a package pickup and delivery in under a minute." },
    ],
  }),
  component: Book,
});

function Book() {
  const nav = useNavigate();
  const [f, setF] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    sender_name: "", sender_phone: "", sender_address: "",
    receiver_name: "", receiver_phone: "", receiver_address: "",
    package_type: "Document", weight_kg: 1, description: "",
    pickup_option: "driver_pickup" as "driver_pickup" | "customer_dropoff",
    pickup_at: "", distance_km: 10,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user && mounted) {
        setUserId(user.id);
        setF((s) => ({ ...s, customer_email: user.email ?? s.customer_email }));
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setUserId(s?.user?.id ?? null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const fee = useMemo(() => calculateFee(Number(f.distance_km) || 0, Number(f.weight_kg) || 1), [f.distance_km, f.weight_kg]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function createBooking() {
    const payload = {
      ...f,
      customer_email: f.customer_email || null,
      user_id: userId,
      weight_kg: Number(f.weight_kg),
      distance_km: Number(f.distance_km),
      fee_ngn: fee,
      pickup_at: f.pickup_at ? new Date(f.pickup_at).toISOString() : null,
      estimated_delivery: f.pickup_at ? new Date(new Date(f.pickup_at).getTime() + 6 * 3600 * 1000).toISOString() : null,
    };
    const { data, error } = await supabase.from("packages" as never).insert(payload as never).select("tracking_id, customer_email").single();
    if (error) throw error;
    const row = data as Pick<PackageRow, "tracking_id" | "customer_email">;
    if (f.customer_email && typeof window !== "undefined") {
      localStorage.setItem("nextride:email", f.customer_email);
    }
    toast.success(`Booking confirmed — ${row.tracking_id}`);
    nav({ to: "/track", search: { id: row.tracking_id } });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.customer_email) {
      toast.error("Please enter your email address first.");
      return;
    }
    setSubmitting(true);
    try {
      if (!userId) {
        setAuthOpen(true);
        return;
      }
      await createBooking();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to book");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setAuthBusy(true);
    try {
      // Try sign-up first, then sign-in if the account already exists.
      let { error: signUpError } = await supabase.auth.signUp({ email: f.customer_email, password });
      if (signUpError) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: f.customer_email, password });
        if (signInError) throw signUpError;
      }
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!uid) throw new Error("Authentication succeeded but no session was created.");
      setUserId(uid);
      setAuthOpen(false);
      setPassword("");
      setConfirmPassword("");
      await createBooking();
    } catch (err) {
      toast.error((err as Error).message ?? "Authentication failed");
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Book</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Book a delivery in under a minute</h1>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:px-8">
        <form onSubmit={submit} className="space-y-6">
          <Section title="Your details">
            <Row>
              <Field label="Full name"><Input required value={f.customer_name} onChange={(e) => set("customer_name", e.target.value)} /></Field>
              <Field label="Email"><Input required type="email" value={f.customer_email} onChange={(e) => set("customer_email", e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Phone"><Input required value={f.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} /></Field>
              <Field label="Pickup date & time"><Input type="datetime-local" required value={f.pickup_at} onChange={(e) => set("pickup_at", e.target.value)} /></Field>
            </Row>
          </Section>

          <Section title="Sender information">
            <Row>
              <Field label="Name"><Input required value={f.sender_name} onChange={(e) => set("sender_name", e.target.value)} /></Field>
              <Field label="Phone"><Input required value={f.sender_phone} onChange={(e) => set("sender_phone", e.target.value)} /></Field>
            </Row>
            <Field label="Pickup address"><Textarea required rows={2} value={f.sender_address} onChange={(e) => set("sender_address", e.target.value)} /></Field>
          </Section>

          <Section title="Receiver information">
            <Row>
              <Field label="Name"><Input required value={f.receiver_name} onChange={(e) => set("receiver_name", e.target.value)} /></Field>
              <Field label="Phone"><Input required value={f.receiver_phone} onChange={(e) => set("receiver_phone", e.target.value)} /></Field>
            </Row>
            <Field label="Delivery address"><Textarea required rows={2} value={f.receiver_address} onChange={(e) => set("receiver_address", e.target.value)} /></Field>
          </Section>

          <Section title="Package details">
            <Row>
              <Field label="Type">
                <Select value={f.package_type} onValueChange={(v) => set("package_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Document","Parcel","Fragile","Food","Electronics","Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Weight (kg)"><Input type="number" min={0.1} step={0.1} value={f.weight_kg} onChange={(e) => set("weight_kg", Number(e.target.value))} /></Field>
            </Row>
            <Row>
              <Field label="Distance (km)"><Input type="number" min={1} step={1} value={f.distance_km} onChange={(e) => set("distance_km", Number(e.target.value))} /></Field>
              <Field label="Pickup option">
                <RadioGroup value={f.pickup_option} onValueChange={(v) => set("pickup_option", v as "driver_pickup" | "customer_dropoff")} className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="driver_pickup" /> Driver pickup</label>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="customer_dropoff" /> Customer drop-off</label>
                </RadioGroup>
              </Field>
            </Row>
            <Field label="Description (optional)"><Textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
          </Section>
        </form>

        <aside className="h-fit lg:sticky lg:top-24 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><Truck className="h-5 w-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Delivery summary</p>
              <p className="font-semibold text-primary">NextRide standard</p>
            </div>
          </div>
          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Distance</dt><dd className="font-medium">{f.distance_km || 0} km</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Weight</dt><dd className="font-medium">{f.weight_kg || 0} kg</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Pickup</dt><dd className="font-medium capitalize">{f.pickup_option.replace("_"," ")}</dd></div>
          </dl>
          <div className="rounded-xl bg-primary p-4 text-primary-foreground">
            <p className="text-xs uppercase tracking-widest text-accent">Estimated fee</p>
            <p className="mt-1 font-display text-3xl font-bold">{formatNaira(fee)}</p>
            <p className="mt-1 text-xs text-primary-foreground/70">Final fee confirmed at pickup.</p>
          </div>
          <Button onClick={submit as unknown as React.MouseEventHandler} disabled={submitting} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {submitting ? "Booking..." : (<>Book delivery <ArrowRight className="ml-1 h-4 w-4"/></>)}
          </Button>
        </aside>
      </section>
      <SiteFooter />

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-xl">Set your password</DialogTitle>
            <DialogDescription className="text-center">
              Create a password for <span className="font-semibold text-primary">{f.customer_email}</span> so you can track this delivery and manage future bookings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAuth} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" value={f.customer_email} readOnly className="pl-10 bg-muted" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" required minLength={6} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" required minLength={6} placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Button type="submit" disabled={authBusy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {authBusy ? "Creating account…" : "Create account & book delivery"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have a password? Use the same one above to sign in.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-border bg-card p-6">
      <legend className="px-2 text-sm font-semibold uppercase tracking-widest text-accent">{title}</legend>
      <div className="space-y-4 pt-2">{children}</div>
    </fieldset>
  );
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 sm:grid-cols-2">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>{children}</div>;
}
