import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_STEPS, type PackageStatus, type PackageEventRow } from "@/lib/nextride";
import { Check, Circle } from "lucide-react";

const STATUS_STYLES: Record<PackageStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30 text-amber-700",
  assigned: "bg-info/15 text-info border-info/30",
  picked_up: "bg-info/15 text-info border-info/30",
  in_transit: "bg-accent/15 text-accent border-accent/30",
  out_for_delivery: "bg-accent/15 text-accent border-accent/30",
  delivered: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: PackageStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusTimeline({
  status,
  events,
}: {
  status: PackageStatus;
  events?: PackageEventRow[];
}) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  const eventsByStatus = new Map<string, PackageEventRow>();
  (events ?? []).forEach((e) => {
    const existing = eventsByStatus.get(e.status);
    if (!existing || new Date(e.created_at) < new Date(existing.created_at)) {
      eventsByStatus.set(e.status, e);
    }
  });

  return (
    <ol className="space-y-4">
      {STATUS_STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const event = eventsByStatus.get(s);
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition",
                  done
                    ? "border-success bg-success text-success-foreground"
                    : "border-border bg-background text-muted-foreground",
                  active && "ring-4 ring-success/20",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn("mt-1 h-8 w-0.5", done ? "bg-success" : "bg-border")} />
              )}
            </div>
            <div className="pb-2">
              <p className={cn("font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                {STATUS_LABEL[s]}
              </p>
              {event ? (
                <p className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60">Pending</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
