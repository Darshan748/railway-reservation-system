import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Armchair, Ban, Search, Settings2, Ticket, TrainFront } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, StatCard, StatusBadge, formatDate } from "@/components/rail/bits";
import { useRail } from "@/lib/rail/store";
import { inr } from "@/lib/rail/service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RailYatra Reservation System" },
      { name: "description", content: "Overview of trains, reservations, seat availability and popular routes in the RailYatra demo." },
      { property: "og:title", content: "Dashboard — RailYatra Reservation System" },
      { property: "og:description", content: "Overview of trains, reservations, seat availability and popular routes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { trains, reservations, waitlist } = useRail();
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
  const cancelled = reservations.filter((r) => r.status === "CANCELLED");
  const seats = trains.reduce((n, t) => n + t.availableSeats, 0);
  const waiting = waitlist.filter((w) => w.status === "WAITING").length;

  const routeCounts = new Map<string, number>();
  for (const r of reservations) {
    const t = trains.find((x) => x.trainNumber === r.trainNumber);
    if (!t) continue;
    const key = `${t.source} → ${t.destination}`;
    routeCounts.set(key, (routeCounts.get(key) ?? 0) + r.passengers.length);
  }
  const popular = [...routeCounts.entries()]
    .map(([route, passengers]) => ({ route, passengers }))
    .sort((a, b) => b.passengers - a.passengers)
    .slice(0, 5);

  const recent = [...reservations].sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)).slice(0, 6);

  const actions = [
    { to: "/search", label: "Search Trains", icon: Search },
    { to: "/search", label: "Book Ticket", icon: TrainFront },
    { to: "/reservations", label: "My Reservations", icon: Ticket },
    { to: "/admin", label: "Train Management", icon: Settings2 },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back, traveller"
        description="Plan, book and manage your journeys. All figures below are calculated from the saved demo records."
        actions={
          <Button asChild variant="highlight">
            <Link to="/search">
              <Search /> Find a train
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available trains" value={trains.length} icon={TrainFront} hint="Across all routes" />
        <StatCard label="Total reservations" value={reservations.length} icon={Ticket} tone="success" hint={`${confirmed.length} confirmed`} />
        <StatCard label="Available seats" value={seats.toLocaleString("en-IN")} icon={Armchair} tone="highlight" hint={`${waiting} on waiting list`} />
        <StatCard label="Cancelled tickets" value={cancelled.length} icon={Ban} tone="destructive" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link key={label} to={to} className="card-surface group flex items-center gap-3 p-4 transition-colors hover:border-primary/40">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card-surface p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent reservations</h3>
            <Link to="/reservations" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Ticket} title="No reservations yet" />
          ) : (
            <ul className="divide-y">
              {recent.map((r) => {
                const t = trains.find((x) => x.trainNumber === r.trainNumber);
                return (
                  <li key={r.pnr}>
                    <Link to="/ticket/$pnr" params={{ pnr: r.pnr }} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.passengers[0]?.name}{r.passengers.length > 1 && ` +${r.passengers.length - 1}`}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          PNR <span className="font-mono">{r.pnr}</span> · {t ? `${t.trainNumber} ${t.source} → ${t.destination}` : r.trainNumber} · {formatDate(r.journeyDate)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={r.status} />
                        <span className="text-xs text-muted-foreground">{inr(r.totalFare)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card-surface p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Popular routes <span className="text-xs font-normal text-muted-foreground">(passengers booked)</span></h3>
          {popular.length === 0 ? (
            <EmptyState icon={TrainFront} title="No route data yet" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popular} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis type="category" dataKey="route" width={130} tick={{ fontSize: 11, fill: "var(--color-foreground)" }} />
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }} />
                  <Bar dataKey="passengers" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
