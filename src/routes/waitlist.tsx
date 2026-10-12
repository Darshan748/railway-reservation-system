import { createFileRoute, Link } from "@tanstack/react-router";
import { Info, ListOrdered, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmAction } from "@/components/rail/ConfirmAction";
import { EmptyState, PageHeader, StatusBadge, formatDate } from "@/components/rail/bits";
import { commit, useRail } from "@/lib/rail/store";
import { cancelWaitlistEntry } from "@/lib/rail/service";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Waiting List — RailYatra" },
      { name: "description", content: "FIFO waiting list for fully booked trains in the RailYatra simulation." },
      { property: "og:title", content: "Waiting List — RailYatra" },
      { property: "og:description", content: "FIFO waiting list for fully booked simulated trains." },
    ],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  const { waitlist, trains } = useRail();
  const rows = [...waitlist].sort((a, b) =>
    a.trainNumber === b.trainNumber ? 0 : a.trainNumber < b.trainNumber ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Waiting list" description="Passengers are queued per train in first-in, first-out order." />
      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          This is a simulated waiting list implemented with a queue. When a confirmed ticket is cancelled, the group at the front of the queue is
          confirmed if enough seats are free. It does not represent actual railway waitlist confirmation.
        </AlertDescription>
      </Alert>
      {rows.length === 0 ? (
        <EmptyState icon={ListOrdered} title="Nobody is waiting">Fully booked trains offer a waiting list on the booking page.</EmptyState>
      ) : (
        <div className="card-surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WL ID</TableHead><TableHead>Train</TableHead><TableHead>Passengers</TableHead><TableHead>Journey</TableHead>
                <TableHead className="text-center">Position</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w) => {
                const t = trains.find((x) => x.trainNumber === w.trainNumber);
                return (
                  <TableRow key={w.waitingListId}>
                    <TableCell className="font-mono">{w.waitingListId}</TableCell>
                    <TableCell className="whitespace-nowrap">{w.trainNumber} <span className="text-muted-foreground">{t?.trainName}</span></TableCell>
                    <TableCell>{w.passengerDetails.map((p) => p.name).join(", ")}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(w.journeyDate)}</TableCell>
                    <TableCell className="text-center font-display font-bold">{w.status === "WAITING" ? `WL ${w.queuePosition}` : "—"}</TableCell>
                    <TableCell><StatusBadge status={w.status} /></TableCell>
                    <TableCell className="text-right">
                      {w.status === "WAITING" ? (
                        <ConfirmAction
                          title="Leave the waiting list?"
                          description={`${w.waitingListId} will be removed and passengers behind it move up.`}
                          confirmLabel="Remove"
                          destructive
                          onConfirm={() => {
                            const r = commit((s) => cancelWaitlistEntry(s, w.waitingListId));
                            if (r.ok) toast.success(`${w.waitingListId} removed from waiting list`);
                            else toast.error(r.error);
                          }}
                        >
                          <Button variant="ghost" size="sm" className="text-destructive"><XCircle /> Remove</Button>
                        </ConfirmAction>
                      ) : w.promotedPnr ? (
                        <Button asChild variant="ghost" size="sm"><Link to="/ticket/$pnr" params={{ pnr: w.promotedPnr }}>View ticket</Link></Button>
                      ) : null}
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
