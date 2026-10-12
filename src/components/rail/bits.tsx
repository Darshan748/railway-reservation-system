import { TrainFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { dayOffset, formatDuration } from "@/lib/rail/service";
import type { ReservationStatus, Train, WaitingStatus } from "@/lib/rail/types";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "primary" }: { label: string; value: ReactNode; icon: LucideIcon; hint?: string; tone?: "primary" | "highlight" | "success" | "destructive" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    highlight: "bg-highlight/15 text-highlight",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="card-surface flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="size-5" />
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: ReservationStatus | WaitingStatus }) {
  const map = {
    CONFIRMED: { v: "success", l: "Confirmed" },
    CANCELLED: { v: "danger", l: "Cancelled" },
    WAITING: { v: "warning", l: "Waiting" },
    PROMOTED: { v: "info", l: "Promoted" },
  } as const;
  const { v, l } = map[status];
  return <Badge variant={v}>{l}</Badge>;
}

export function SeatBadge({ available, total }: { available: number; total: number }) {
  if (available === 0) return <Badge variant="danger">No seats · Waitlist</Badge>;
  if (available <= Math.max(5, total * 0.1)) return <Badge variant="warning">{available} left</Badge>;
  return <Badge variant="success">{available} available</Badge>;
}

export function RouteLine({ train }: { train: Train }) {
  const off = dayOffset(train);
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <div>
        <p className="font-display text-xl font-bold">{train.departureTime}</p>
        <p className="text-sm text-muted-foreground">{train.source}</p>
      </div>
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-xs text-muted-foreground">{formatDuration(train.durationMins)}</span>
        <div className="flex w-full items-center gap-1">
          <span className="size-2 shrink-0 rounded-full border-2 border-primary" />
          <div className="rail-track flex-1" />
          <TrainFront className="size-4 shrink-0 text-highlight" />
          <div className="rail-track flex-1" />
          <span className="size-2 shrink-0 rounded-full bg-primary" />
        </div>
      </div>
      <div className="text-right">
        <p className="font-display text-xl font-bold">
          {train.arrivalTime}
          {off > 0 && <sup className="ml-0.5 text-xs font-medium text-highlight">+{off}</sup>}
        </p>
        <p className="text-sm text-muted-foreground">{train.destination}</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function formatDate(d: string) {
  const date = d.length === 10 ? new Date(d + "T00:00:00") : new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function genderLabel(g: string) {
  return g === "M" ? "Male" : g === "F" ? "Female" : "Other";
}
