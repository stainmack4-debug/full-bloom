import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/" as const, label: "Home" },
  { to: "/services" as const, label: "Services" },
  { to: "/about" as const, label: "About" },
  { to: "/contact" as const, label: "Contact" },
  { to: "/track" as const, label: "Track Order" },
];

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group", className)}>
      <img
        src="/logo-icon.svg"
        alt="NextRide Logistics"
        className="h-10 w-10 rounded-xl shadow-lg shadow-accent/30 group-hover:scale-105 transition"
      />
      <span className={cn("font-display font-extrabold leading-none tracking-tight", tone === "dark" ? "text-primary" : "text-white")}>
        <span className="block text-base">NEXTRIDE</span>
        <span className="block text-[10px] font-semibold tracking-[0.25em] text-accent">LOGISTICS</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/orders">My Orders</Link>
          </Button>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/book">Book Delivery</Link>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 px-3 pb-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/orders" onClick={() => setOpen(false)}>My Orders</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 bg-accent text-accent-foreground">
                <Link to="/book" onClick={() => setOpen(false)}>Book</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <Logo tone="light" />
          <p className="mt-4 text-sm text-primary-foreground/70">
            Fast, reliable and secure delivery across Nigeria.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-accent">Contact Us</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
            <li>+234 800 123 4567</li>
            <li>hello@nextridelogistics.com</li>
            <li>123 Logistics Street, Lagos, Nigeria</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-accent">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
            <li><Link to="/track" className="hover:text-white">Track Order</Link></li>
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-accent">Portals</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
            <li><Link to="/book" className="hover:text-white">Book a Delivery</Link></li>
            <li><Link to="/orders" className="hover:text-white">My Packages</Link></li>
            <li><Link to="/driver" className="hover:text-white">Driver Portal</Link></li>
            <li><Link to="/admin" className="hover:text-white">Admin Portal</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} NextRide Logistics. All rights reserved.
      </div>
    </footer>
  );
}
