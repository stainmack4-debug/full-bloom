import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira, type PackageRow } from "@/lib/nextride";
import { Package as PackageIcon, ArrowRight, LogOut, User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — NextRide Logistics" }, { name: "description", content: "Sign in and see every package you've booked with NextRide." }] }),
  component: Orders,
});

function Orders() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setLoadingSession(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">My Orders</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Your NextRide packages</h1>
          <p className="mt-2 max-w-lg text-white/70">Sign in to see every package you have booked, tracked and delivered.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {loadingSession ? (
          <p className="text-center text-muted-foreground">Checking your session…</p>
        ) : session ? (
          <OrdersList session={session} onLogout={() => supabase.auth.signOut().then(() => toast.success("Signed out"))} />
        ) : (
          <AuthGate />
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function AuthGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created. You are now signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully.");
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-accent mx-auto"><User className="h-5 w-5"/></div>
      <h2 className="mt-4 text-center font-display text-2xl font-bold text-primary">{mode === "signin" ? "Sign in" : "Create account"}</h2>
      <p className="mt-1 text-center text-sm text-muted-foreground">{mode === "signin" ? "Access your package history" : "Get access to your bookings anytime"}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="pl-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" minLength={6} className="pl-10" />
          </div>
        </div>
        <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {busy ? (mode === "signin" ? "Signing in…" : "Creating account…") : (mode === "signin" ? "Sign in" : "Create account")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-accent hover:underline">
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

function OrdersList({ session, onLogout }: { session: { user: { email?: string } }; onLogout: () => void }) {
  const userEmail = session.user.email ?? "";
  const query = useQuery({
    queryKey: ["my-orders", userEmail],
    enabled: !!userEmail,
    queryFn: async () => {
      const { data, error } = await supabase.from("packages" as never).select("*").or(`user_id.eq.${session.user.id},customer_email.eq.${userEmail}`).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PackageRow[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-accent"><User className="h-5 w-5"/></div>
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="font-semibold text-primary">{userEmail}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} className="gap-2"><LogOut className="h-4 w-4"/> Sign out</Button>
      </div>

      {query.isLoading && <p className="text-center text-muted-foreground">Loading your orders…</p>}
      {!query.isLoading && (query.data ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-semibold text-primary">No orders yet</p>
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
    </div>
  );
}
