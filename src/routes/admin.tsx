import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira, STATUS_LABEL, type DriverRow, type PackageRow, type PackageStatus } from "@/lib/nextride";
import {
  LayoutDashboard, Package as PackageIcon, Users, Bike as BikeIcon, MapPin,
  FileText, Settings, LogOut, TrendingUp, Clock, Truck as TruckIcon, CheckCircle2, Wallet, Lock, Search,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — NextRide Logistics" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const ADMIN_KEY = "nextride:admin";
const ADMIN_PASSWORD = "NRL";

function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") setUnlocked(sessionStorage.getItem(ADMIN_KEY) === "1");
  }, []);
  if (!unlocked) return <Gate onUnlock={() => { sessionStorage.setItem(ADMIN_KEY, "1"); setUnlocked(true); }} />;
  return <AdminShell onLogout={() => { sessionStorage.removeItem(ADMIN_KEY); setUnlocked(false); }} />;
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="min-h-screen bg-hero-gradient text-white grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-xl">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/40 mx-auto"><Lock className="h-6 w-6"/></div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold">Admin Portal</h1>
        <p className="mt-1 text-center text-sm text-white/70">Enter access password</p>
        <form onSubmit={(e) => { e.preventDefault(); if (pw === ADMIN_PASSWORD) onUnlock(); else { setErr(true); setPw(""); } }} className="mt-6 space-y-3">
          <Input autoFocus type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} placeholder="Password" className="h-12 bg-white text-foreground" />
          {err && <p className="text-sm text-destructive-foreground bg-destructive/20 rounded-md p-2 text-center">Incorrect password</p>}
          <Button type="submit" size="lg" className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">Unlock</Button>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "packages", label: "Packages", icon: PackageIcon },
  { id: "customers", label: "Customers", icon: Users },
  { id: "drivers", label: "Drivers", icon: BikeIcon },
  { id: "pickups", label: "Pickups", icon: MapPin },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];

function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>("dashboard");
  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex flex-col bg-sidebar text-sidebar-foreground">
        <div className="p-5 border-b border-sidebar-border"><Logo tone="light" /></div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${tab === t.id ? "bg-accent text-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8">
            <h1 className="font-display text-2xl font-bold text-primary capitalize">{TABS.find((t) => t.id === tab)?.label}</h1>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-muted-foreground">Admin</span>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-bold">A</div>
            </div>
          </div>
          {/* mobile tabs */}
          <div className="flex gap-1 overflow-x-auto border-t border-border px-2 py-2 md:hidden">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${tab === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
            <button onClick={onLogout} className="shrink-0 ml-auto rounded-lg px-3 py-1.5 text-xs text-muted-foreground"><LogOut className="h-3.5 w-3.5" /></button>
          </div>
        </header>
        <div className="p-4 sm:p-8">
          {tab === "dashboard" && <Dashboard />}
          {tab === "packages" && <PackagesTab />}
          {tab === "customers" && <CustomersTab />}
          {tab === "drivers" && <DriversTab />}
          {tab === "pickups" && <PickupsTab />}
          {tab === "reports" && <ReportsTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

function usePackages() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages" as never).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PackageRow[];
    },
  });
  useEffect(() => {
    const ch = supabase.channel("admin-packages")
      .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, () => qc.invalidateQueries({ queryKey: ["admin-packages"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  return q;
}

function useDrivers() {
  return useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers" as never).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DriverRow[];
    },
  });
}

function Dashboard() {
  const { data: packages = [] } = usePackages();
  const totals = useMemo(() => {
    const total = packages.length;
    const pending = packages.filter((p) => p.status === "pending" || p.status === "assigned").length;
    const inTransit = packages.filter((p) => ["picked_up","in_transit","out_for_delivery"].includes(p.status)).length;
    const delivered = packages.filter((p) => p.status === "delivered").length;
    const revenue = packages.filter((p) => p.status !== "cancelled").reduce((s, p) => s + Number(p.fee_ngn), 0);
    return { total, pending, inTransit, delivered, revenue };
  }, [packages]);

  const chartData = [
    { name: "Pending", value: packages.filter((p) => p.status === "pending").length, color: "#f59e0b" },
    { name: "In Transit", value: totals.inTransit, color: "#F27321" },
    { name: "Delivered", value: totals.delivered, color: "#22c55e" },
    { name: "Assigned", value: packages.filter((p) => p.status === "assigned").length, color: "#3b82f6" },
  ].filter((d) => d.value > 0);

  const recent = packages.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Total Packages" value={totals.total} icon={PackageIcon} tint="primary" />
        <Kpi label="Pending" value={totals.pending} icon={Clock} tint="warning" />
        <Kpi label="In Transit" value={totals.inTransit} icon={TruckIcon} tint="accent" />
        <Kpi label="Delivered" value={totals.delivered} icon={CheckCircle2} tint="success" />
        <Kpi label="Revenue" value={formatNaira(totals.revenue)} icon={Wallet} tint="info" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Recent Packages">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Tracking ID</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Receiver</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-3 font-semibold text-primary">{p.tracking_id}</td>
                    <td className="px-6 py-3">{p.customer_name}</td>
                    <td className="px-6 py-3">{p.receiver_name}</td>
                    <td className="px-6 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No packages yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Delivery Overview">
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="grid h-full place-items-center text-muted-foreground">No data yet</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PackagesTab() {
  const { data: packages = [] } = usePackages();
  const { data: drivers = [] } = useDrivers();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackageStatus | "all">("all");

  const filtered = packages.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !`${p.tracking_id} ${p.customer_name} ${p.receiver_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function assign(pkgId: string, driverId: string) {
    const { error } = await supabase.from("packages" as never).update({ driver_id: driverId, status: "assigned" } as never).eq("id", pkgId);
    if (error) return toast.error(error.message);
    await supabase.from("drivers" as never).update({ status: "busy" } as never).eq("id", driverId);
    toast.success("Driver assigned");
    qc.invalidateQueries({ queryKey: ["admin-packages"] });
    qc.invalidateQueries({ queryKey: ["admin-drivers"] });
  }
  async function updateStatus(pkgId: string, status: PackageStatus) {
    const { error } = await supabase.from("packages" as never).update({ status } as never).eq("id", pkgId);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["admin-packages"] });
  }

  return (
    <Card title={`All Packages (${filtered.length})`}>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracking ID, customer, receiver..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PackageStatus | "all")}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as PackageStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Tracking</th>
              <th className="px-6 py-3 font-medium">Route</th>
              <th className="px-6 py-3 font-medium">Driver</th>
              <th className="px-6 py-3 font-medium">Fee</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const driver = drivers.find((d) => d.id === p.driver_id);
              return (
                <tr key={p.id} className="border-b border-border/60 last:border-0 align-top">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-primary">{p.tracking_id}</p>
                    <p className="text-xs text-muted-foreground">{p.customer_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="truncate max-w-[220px]">{p.sender_address}</p>
                    <p className="mt-1 text-xs text-muted-foreground">To</p>
                    <p className="truncate max-w-[220px]">{p.receiver_address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Select value={p.driver_id ?? ""} onValueChange={(v) => assign(p.id, v)}>
                      <SelectTrigger className="w-40"><SelectValue placeholder={driver?.name ?? "Assign"} /></SelectTrigger>
                      <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatNaira(p.fee_ngn)}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4">
                    <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v as PackageStatus)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(STATUS_LABEL) as PackageStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No packages match.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CustomersTab() {
  const { data: packages = [] } = usePackages();
  const customers = useMemo(() => {
    const map = new Map<string, { email: string; name: string; phone: string; orders: number; spent: number }>();
    packages.forEach((p) => {
      const key = p.customer_email ?? p.customer_phone ?? p.customer_name;
      const existing = map.get(key);
      if (existing) { existing.orders += 1; existing.spent += Number(p.fee_ngn); }
      else map.set(key, { email: p.customer_email ?? "-", name: p.customer_name, phone: p.customer_phone ?? "-", orders: 1, spent: Number(p.fee_ngn) });
    });
    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [packages]);
  return (
    <Card title={`Customers (${customers.length})`}>
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Email</th><th className="px-6 py-3 font-medium">Phone</th><th className="px-6 py-3 font-medium">Orders</th><th className="px-6 py-3 font-medium">Total spend</th>
          </tr></thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="px-6 py-3 font-medium text-primary">{c.name}</td>
                <td className="px-6 py-3">{c.email}</td>
                <td className="px-6 py-3">{c.phone}</td>
                <td className="px-6 py-3">{c.orders}</td>
                <td className="px-6 py-3 font-semibold">{formatNaira(c.spent)}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DriversTab() {
  const { data: drivers = [], refetch } = useDrivers();
  const { data: packages = [] } = usePackages();
  const [form, setForm] = useState({ name: "", phone: "", vehicle: "", plate: "" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("drivers" as never).insert(form as never);
    if (error) return toast.error(error.message);
    toast.success("Driver added"); setForm({ name: "", phone: "", vehicle: "", plate: "" }); refetch();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("drivers" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Driver removed"); refetch();
  }
  const activeByDriver = useMemo(() => {
    const map = new Map<string, PackageRow[]>();
    packages.forEach((p) => {
      if (!p.driver_id) return;
      if (["delivered", "cancelled"].includes(p.status)) return;
      const list = map.get(p.driver_id) ?? [];
      list.push(p);
      map.set(p.driver_id, list);
    });
    return map;
  }, [packages]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card title={`Drivers (${drivers.length})`}>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Phone</th><th className="px-6 py-3 font-medium">Vehicle</th><th className="px-6 py-3 font-medium">Active jobs</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3"/>
            </tr></thead>
            <tbody>
              {drivers.map((d) => {
                const active = activeByDriver.get(d.id) ?? [];
                return (
                  <tr key={d.id} className="border-b border-border/60 last:border-0 align-top">
                    <td className="px-6 py-3 font-medium text-primary">{d.name}<div className="text-xs text-muted-foreground">{d.plate ?? "-"}</div></td>
                    <td className="px-6 py-3">{d.phone}</td>
                    <td className="px-6 py-3">{d.vehicle ?? "-"}</td>
                    <td className="px-6 py-3">
                      {active.length === 0 ? <span className="text-muted-foreground">None</span> : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-accent/15 text-accent px-2 py-0.5 text-xs font-semibold">{active.length} assigned</span>
                          {active.slice(0, 3).map((p) => (
                            <div key={p.id} className="text-xs text-muted-foreground">
                              <span className="font-semibold text-primary">{p.tracking_id}</span> · {STATUS_LABEL[p.status]}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${active.length > 0 ? "bg-accent/15 text-accent" : d.status === "available" ? "bg-success/15 text-success" : d.status === "busy" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{active.length > 0 ? "busy" : d.status}</span></td>
                    <td className="px-6 py-3"><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(d.id)}>Remove</Button></td>
                  </tr>
                );
              })}
              {drivers.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No drivers yet. Add one on the right.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Add Driver">
        <form onSubmit={add} className="space-y-3">
          <Input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="Vehicle (e.g. Honda CB Bike)" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />
          <Input placeholder="Plate number" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Add driver</Button>
        </form>
      </Card>
    </div>
  );
}

function PickupsTab() {
  const { data: packages = [] } = usePackages();
  const today = packages.filter((p) => p.pickup_option === "driver_pickup" && (p.status === "pending" || p.status === "assigned"));
  return (
    <Card title={`Pickups Scheduled (${today.length})`}>
      <div className="space-y-3">
        {today.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-primary">{p.tracking_id} · {p.customer_name}</p>
                <p className="text-sm text-muted-foreground">{p.sender_address}</p>
                <p className="mt-1 text-xs text-muted-foreground">Pickup: {p.pickup_at ? new Date(p.pickup_at).toLocaleString() : "Not scheduled"}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          </div>
        ))}
        {today.length === 0 && <p className="text-center text-muted-foreground py-10">No scheduled pickups.</p>}
      </div>
    </Card>
  );
}

function ReportsTab() {
  const { data: packages = [] } = usePackages();
  const revenue = packages.filter((p) => p.status !== "cancelled").reduce((s, p) => s + Number(p.fee_ngn), 0);
  const delivered = packages.filter((p) => p.status === "delivered").length;
  const rate = packages.length ? Math.round((delivered / packages.length) * 100) : 0;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Kpi label="Lifetime Revenue" value={formatNaira(revenue)} icon={Wallet} tint="info" />
      <Kpi label="Total Deliveries" value={packages.length} icon={PackageIcon} tint="primary" />
      <Kpi label="On-time Rate" value={`${rate}%`} icon={TrendingUp} tint="success" />
    </div>
  );
}

function SettingsTab() {
  return (
    <Card title="Settings">
      <p className="text-sm text-muted-foreground">This portal is protected by a shared password. Contact your system administrator to change access credentials.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Company</p>
          <p className="mt-1 font-semibold text-primary">NextRide Logistics</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Support Email</p>
          <p className="mt-1 font-semibold text-primary">support@nextridelogistics.com</p>
        </div>
      </div>
    </Card>
  );
}

/* Shared bits */
function Kpi({ label, value, icon: Icon, tint }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tint: "primary" | "accent" | "success" | "warning" | "info" }) {
  const tintClass = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-amber-600",
    info: "bg-info/15 text-info",
  }[tint];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${tintClass}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4"><h3 className="font-semibold text-primary">{title}</h3></div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Keep unused Dialog import out of dead-code warning
void Dialog; void DialogContent; void DialogHeader; void DialogTitle; void DialogTrigger;
