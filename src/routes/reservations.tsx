import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Search, Ticket, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmAction } from "@/components/rail/ConfirmAction";
import { EmptyState, PageHeader, StatusBadge, formatDate } from "@/components/rail/bits";
import { useRail } from "@/lib/rail/store";
import { inr } from "@/lib/rail/service";
import { doCancel } from "./ticket.$pnr";

export const Route = createFileRoute("/reservations")({
  head: () => ({
    meta: [
      { title: "My Reservations — RailYatra" },
      { name: "description", content: "Search by PNR, view, print and cancel your simulated railway reservations." },
      { property: "og:title", content: "My Reservations — RailYatra" },
      { property: "og:description", content: "Search by PNR, view, print and cancel simulated reservations." },
    ],
  }),
  component: ReservationsPage,
});

function ReservationsPage() {
  const { reservations, trains } = useRail();
  const [tab, setTab] = useState<"all" | "CONFIRMED" | "CANCELLED">("all");
  const [q, setQ] = useState("");
  const query = q.trim();
  const rows = [...reservations]
    .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate))
    .filter((r) => (tab === "all" || r.status === tab) && (!query || r.pnr.includes(query)));

  return (
    <div className="space-y-6">
      <PageHeader title="My reservations" description="All bookings saved in this browser." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All ({reservations.length})</TabsTrigger>
            <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by PNR" inputMode="numeric" value={q} onChange={(e) => setQ(e.target.value.replace(/\D/g, ""))} aria-label="Search by PNR" />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Ticket} title={query ? `No reservation matches PNR "${query}"` : "No reservations here"}>
          <Link to="/search" className="text-primary underline">Search trains to book</Link>
        </EmptyState>
      ) : (
        <div className="card-surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PNR</TableHead><TableHead>Passenger</TableHead><TableHead>Train</TableHead><TableHead>Route</TableHead>
                <TableHead>Journey</TableHead><TableHead>Booked</TableHead><TableHead className="text-center">Pax</TableHead>
                <TableHead className="text-right">Fare</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const t = trains.find((x) => x.trainNumber === r.trainNumber);
                return (
                  <TableRow key={r.pnr}>
                    <TableCell className="font-mono">{r.pnr}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{r.passengers[0]?.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.trainNumber} <span className="text-muted-foreground">{t?.trainName}</span></TableCell>
                    <TableCell className="whitespace-nowrap">{t ? `${t.source} → ${t.destination}` : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.journeyDate)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(r.bookingDate)}</TableCell>
                    <TableCell className="text-center">{r.passengers.length}</TableCell>
                    <TableCell className="text-right">{inr(r.totalFare)}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm"><Link to="/ticket/$pnr" params={{ pnr: r.pnr }}><Eye /> View</Link></Button>
                        {r.status === "CONFIRMED" && (
                          <ConfirmAction
                            title="Cancel this reservation?"
                            description={`PNR ${r.pnr} will be cancelled and ${r.passengers.length} seat(s) returned.`}
                            confirmLabel="Cancel ticket"
                            destructive
                            onConfirm={() => doCancel(r.pnr)}
                          >
                            <Button variant="ghost" size="sm" className="text-destructive"><XCircle /> Cancel</Button>
                          </ConfirmAction>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
