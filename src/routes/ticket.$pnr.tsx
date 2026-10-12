import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer, TrainFront, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmAction } from "@/components/rail/ConfirmAction";
import { EmptyState, RouteLine, StatusBadge, formatDate, genderLabel } from "@/components/rail/bits";
import { commit, useRail } from "@/lib/rail/store";
import { cancelReservation, formatDuration, inr } from "@/lib/rail/service";
import type { Reservation, Train } from "@/lib/rail/types";

export const Route = createFileRoute("/ticket/$pnr")({
  head: ({ params }) => ({
    meta: [
      { title: `Ticket PNR ${params.pnr} — RailYatra` },
      { name: "description", content: "View, print, download or cancel a simulated railway ticket." },
      { property: "og:title", content: `Ticket PNR ${params.pnr} — RailYatra` },
      { property: "og:description", content: "View, print, download or cancel a simulated railway ticket." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TicketPage,
});

export function doCancel(pnr: string) {
  const r = commit((s) => cancelReservation(s, pnr));
  if (!r.ok) {
    toast.error(r.error);
    return;
  }
  toast.success(`PNR ${pnr} cancelled · ${r.value.reservation.passengers.length} seat(s) released`);
  for (const p of r.value.promoted) {
    toast.info(`Waiting list ${p.fromWaitlistId} confirmed · new PNR ${p.pnr}`);
  }
}

function ticketText(r: Reservation, t?: Train) {
  const lines = [
    "RAILYATRA — SIMULATED E-TICKET (NOT VALID FOR TRAVEL)",
    "=".repeat(52),
    `PNR:            ${r.pnr}`,
    `Status:         ${r.status}`,
    `Train:          ${r.trainNumber} ${t?.trainName ?? ""}`,
    `Route:          ${t ? `${t.source} (${t.departureTime}) -> ${t.destination} (${t.arrivalTime})` : "-"}`,
    `Journey date:   ${r.journeyDate}`,
    `Booked on:      ${new Date(r.bookingDate).toLocaleString("en-IN")}`,
    `Total fare:     INR ${r.totalFare}`,
    "",
    "Passengers:",
    ...r.passengers.map((p, i) => `  ${i + 1}. ${p.name}, ${p.age} ${p.gender}, ${p.contactNumber}`),
  ];
  return lines.join("\n");
}

function TicketPage() {
  const { pnr } = Route.useParams();
  const { reservations, trains } = useRail();
  const r = reservations.find((x) => x.pnr === pnr);
  if (!r) {
    return (
      <EmptyState icon={TrainFront} title={`No reservation found for PNR ${pnr}`}>
        <Link to="/reservations" className="text-primary underline">Go to My Reservations</Link>
      </EmptyState>
    );
  }
  const t = trains.find((x) => x.trainNumber === r.trainNumber);

  const download = () => {
    const blob = new Blob([ticketText(r, t)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ticket-${r.pnr}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Ticket downloaded");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/reservations"><ArrowLeft /> My Reservations</Link></Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer /> Print</Button>
          <Button variant="outline" size="sm" onClick={download}><Download /> Download</Button>
          {r.status === "CONFIRMED" && (
            <ConfirmAction
              title="Cancel this reservation?"
              description={`PNR ${r.pnr} will be cancelled and ${r.passengers.length} seat(s) returned to train ${r.trainNumber}. Waiting-list passengers may be promoted.`}
              confirmLabel="Cancel ticket"
              destructive
              onConfirm={() => doCancel(r.pnr)}
            >
              <Button variant="destructive" size="sm"><XCircle /> Cancel ticket</Button>
            </ConfirmAction>
          )}
        </div>
      </div>

      <article className="card-surface print-area overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 bg-primary px-6 py-4 text-primary-foreground">
          <div className="flex items-center gap-2">
            <TrainFront className="size-5" />
            <span className="font-display font-bold">RailYatra e-Ticket</span>
          </div>
          <span className="text-xs opacity-80">Simulated — not valid for travel</span>
        </header>
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">PNR number</p>
              <p className="font-mono text-2xl font-bold">{r.pnr}</p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          {t ? (
            <div className="rounded-lg border p-4">
              <p className="mb-3 font-semibold">{t.trainNumber} · {t.trainName}</p>
              <RouteLine train={t} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Train {r.trainNumber} (removed from schedule)</p>
          )}
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Info label="Journey date" value={formatDate(r.journeyDate)} />
            <Info label="Booked on" value={formatDate(r.bookingDate)} />
            <Info label="Duration" value={t ? formatDuration(t.durationMins) : "—"} />
            <Info label="Total fare" value={inr(r.totalFare)} />
          </dl>
          {r.fromWaitlistId && <p className="text-xs text-muted-foreground">Confirmed from waiting list {r.fromWaitlistId}.</p>}
          {r.cancelledAt && <p className="text-xs text-destructive">Cancelled on {formatDate(r.cancelledAt)}.</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Contact</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {r.passengers.map((p, i) => (
                  <TableRow key={p.passengerId}>
                    <TableCell>{i + 1}</TableCell><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.age}</TableCell><TableCell>{genderLabel(p.gender)}</TableCell><TableCell className="font-mono">{p.contactNumber}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </article>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
