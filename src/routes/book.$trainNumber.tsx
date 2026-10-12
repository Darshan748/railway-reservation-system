import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ListOrdered, Loader2, Minus, Plus, TrainFront } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmAction } from "@/components/rail/ConfirmAction";
import { EmptyState, PageHeader, RouteLine, SeatBadge, formatDate } from "@/components/rail/bits";
import { commit, useRail } from "@/lib/rail/store";
import { MAX_PASSENGERS, bookTicket, inr, joinWaitlist, validatePassenger, type PassengerErrors } from "@/lib/rail/service";
import type { Gender, PassengerInput } from "@/lib/rail/types";

export const Route = createFileRoute("/book/$trainNumber")({
  validateSearch: z.object({
    date: z.string().optional(),
    pax: z.coerce.number().int().min(1).max(MAX_PASSENGERS).optional().catch(1),
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Book Train ${params.trainNumber} — RailYatra` },
      { name: "description", content: "Enter passenger details and confirm a simulated train reservation." },
      { property: "og:title", content: `Book Train ${params.trainNumber} — RailYatra` },
      { property: "og:description", content: "Enter passenger details and confirm a simulated reservation." },
    ],
  }),
  component: BookPage,
});

type Draft = { name: string; age: string; gender: Gender | ""; contactNumber: string };
const blank = (): Draft => ({ name: "", age: "", gender: "", contactNumber: "" });

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function BookPage() {
  const { trainNumber } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { trains } = useRail();
  const train = trains.find((t) => t.trainNumber === trainNumber);

  const [date, setDate] = useState(search.date ?? "");
  const [minDate, setMinDate] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>(() => Array.from({ length: search.pax ?? 1 }, blank));
  const [errors, setErrors] = useState<PassengerErrors[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    const t = todayISO();
    setMinDate(t);
    setDate((d) => d || t);
  }, []);

  if (!train) {
    return (
      <EmptyState icon={TrainFront} title="Train not found">
        <Link to="/search" className="text-primary underline">Back to search</Link>
      </EmptyState>
    );
  }

  const n = drafts.length;
  const enough = train.availableSeats >= n;
  const total = train.fare * n;

  const setCount = (c: number) => {
    const count = Math.max(1, Math.min(MAX_PASSENGERS, c));
    setDrafts((d) => (count > d.length ? [...d, ...Array.from({ length: count - d.length }, blank)] : d.slice(0, count)));
    setErrors((e) => e.slice(0, count));
  };
  const update = (i: number, patch: Partial<Draft>) => {
    setDrafts((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setErrors((e) => e.map((x, j) => (j === i ? {} : x)));
  };

  const toInputs = (): PassengerInput[] =>
    drafts.map((d) => ({ name: d.name, age: d.age === "" ? (undefined as unknown as number) : Number(d.age), gender: d.gender as Gender, contactNumber: d.contactNumber }));

  /** Returns true when the form is valid. */
  function validate(): boolean {
    const errs = toInputs().map(validatePassenger);
    setErrors(errs);
    if (!date) { setFormError("Select a journey date."); return false; }
    if (minDate && date < minDate) { setFormError("Journey date cannot be in the past."); return false; }
    if (errs.some((e) => Object.keys(e).length)) { setFormError("Please fix the highlighted passenger details."); return false; }
    setFormError("");
    return true;
  }

  function submit(kind: "book" | "waitlist") {
    if (lock.current) return;
    lock.current = true;
    setSubmitting(true);
    // Small delay simulates a server round-trip and shows the loading state.
    setTimeout(() => {
      const input = { trainNumber: train!.trainNumber, journeyDate: date, passengers: toInputs() };
      if (kind === "book") {
        const r = commit((s) => bookTicket(s, input));
        if (r.ok) {
          toast.success(`Booking confirmed · PNR ${r.value.pnr}`);
          navigate({ to: "/ticket/$pnr", params: { pnr: r.value.pnr } });
          return;
        }
        setFormError(r.error);
        toast.error(r.error);
      } else {
        const r = commit((s) => joinWaitlist(s, input));
        if (r.ok) {
          toast.success(`Added to waiting list · ${r.value.waitingListId} (position ${r.value.queuePosition})`);
          navigate({ to: "/waitlist" });
          return;
        }
        setFormError(r.error);
        toast.error(r.error);
      }
      lock.current = false;
      setSubmitting(false);
    }, 600);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Book ticket" description="Enter details for every passenger. Seats are deducted only after a successful booking." />

      <div className="card-surface grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="font-mono text-xs text-muted-foreground">#{train.trainNumber}</p>
          <h3 className="text-lg font-semibold">{train.trainName}</h3>
          <SeatBadge available={train.availableSeats} total={train.totalSeats} />
        </div>
        <RouteLine train={train} />
        <p className="font-display text-xl font-bold lg:text-right">{inr(train.fare)}<span className="block text-xs font-normal text-muted-foreground">per passenger</span></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="card-surface grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jdate">Journey date</Label>
              <Input id="jdate" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Number of passengers</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => setCount(n - 1)} disabled={n <= 1} aria-label="Remove passenger"><Minus /></Button>
                <span className="w-10 text-center font-display text-lg font-bold" aria-live="polite">{n}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setCount(n + 1)} disabled={n >= MAX_PASSENGERS} aria-label="Add passenger"><Plus /></Button>
                <span className="text-xs text-muted-foreground">max {MAX_PASSENGERS}</span>
              </div>
            </div>
          </div>

          {drafts.map((d, i) => {
            const e = errors[i] ?? {};
            const id = (f: string) => `p${i}-${f}`;
            return (
              <fieldset key={i} className="card-surface grid gap-4 p-5 sm:grid-cols-2">
                <legend className="sr-only">Passenger {i + 1}</legend>
                <p className="font-semibold sm:col-span-2">Passenger {i + 1}</p>
                <Field id={id("name")} label="Full name" error={e.name}>
                  <Input id={id("name")} value={d.name} onChange={(x) => update(i, { name: x.target.value })} aria-invalid={!!e.name} placeholder="e.g. Ananya Rao" />
                </Field>
                <Field id={id("age")} label="Age" error={e.age}>
                  <Input id={id("age")} type="number" min={1} max={120} value={d.age} onChange={(x) => update(i, { age: x.target.value })} aria-invalid={!!e.age} />
                </Field>
                <Field id={id("gender")} label="Gender" error={e.gender}>
                  <Select value={d.gender} onValueChange={(v) => update(i, { gender: v as Gender })}>
                    <SelectTrigger id={id("gender")} aria-invalid={!!e.gender}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field id={id("phone")} label="Contact number" error={e.contactNumber}>
                  <Input id={id("phone")} inputMode="numeric" maxLength={10} value={d.contactNumber} onChange={(x) => update(i, { contactNumber: x.target.value.replace(/\D/g, "") })} aria-invalid={!!e.contactNumber} placeholder="10-digit mobile" />
                </Field>
              </fieldset>
            );
          })}
        </div>

        <aside className="card-surface h-fit space-y-4 p-5 lg:sticky lg:top-20">
          <h3 className="font-semibold">Fare summary</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Fare per passenger</dt><dd>{inr(train.fare)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Passengers</dt><dd>× {n}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Journey</dt><dd>{date ? formatDate(date) : "—"}</dd></div>
          </dl>
          <div className="flex items-baseline justify-between border-t pt-3">
            <span className="font-medium">Total fare</span>
            <span className="font-display text-2xl font-bold">{inr(total)}</span>
          </div>

          {formError && (
            <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
          )}

          {enough ? (
            <ConfirmGate
              valid={validate}
              title="Confirm booking?"
              description={`Book ${n} seat(s) on ${train.trainNumber} ${train.trainName} for ${date ? formatDate(date) : ""}. Total fare ${inr(total)}.`}
              onConfirm={() => submit("book")}
              disabled={submitting}
            >
              {submitting ? <><Loader2 className="animate-spin" /> Booking…</> : "Confirm booking"}
            </ConfirmGate>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertTitle>Not enough seats</AlertTitle>
                <AlertDescription>
                  Only {train.availableSeats} seat(s) left for {n} passenger(s). You can join the simulated waiting list — this is not an actual railway waitlist confirmation.
                </AlertDescription>
              </Alert>
              <ConfirmGate
                valid={validate}
                title="Join waiting list?"
                description={`Your group of ${n} will be queued (FIFO) and promoted automatically when enough seats free up.`}
                onConfirm={() => submit("waitlist")}
                disabled={submitting}
                variant="highlight"
              >
                {submitting ? <><Loader2 className="animate-spin" /> Adding…</> : <><ListOrdered /> Join waiting list</>}
              </ConfirmGate>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive" role="alert">{error}</p>}
    </div>
  );
}

/** Validates first; opens the confirmation dialog only when the form is valid. */
function ConfirmGate({ valid, title, description, onConfirm, disabled, children, variant = "default" }: {
  valid: () => boolean; title: string; description: string; onConfirm: () => void; disabled: boolean; children: React.ReactNode; variant?: "default" | "highlight";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="w-full" variant={variant} disabled={disabled} onClick={() => valid() && setOpen(true)}>{children}</Button>
      <ConfirmAction
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={<span>{description}<span className="mt-2 block text-xs">Simulated booking — no payment is taken.</span></span>}
        onConfirm={onConfirm}
      />
    </>
  );
}
