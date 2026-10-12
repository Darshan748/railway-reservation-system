import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, Search, TrainFront } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState, PageHeader, RouteLine, SeatBadge } from "@/components/rail/bits";
import { useRail } from "@/lib/rail/store";
import { bubbleSort } from "@/lib/rail/structures";
import { MAX_PASSENGERS, inr } from "@/lib/rail/service";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Trains — RailYatra" },
      { name: "description", content: "Search simulated Indian trains by source, destination, date and passengers." },
      { property: "og:title", content: "Search Trains — RailYatra" },
      { property: "og:description", content: "Search simulated Indian trains by route, date and passenger count." },
    ],
  }),
  component: SearchPage,
});

const ANY = "__any";
type SortKey = "departureTime" | "fare" | "trainNumber";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function SearchPage() {
  const { trains } = useRail();
  const stations = useMemo(() => [...new Set(trains.flatMap((t) => [t.source, t.destination]))].sort(), [trains]);
  const [source, setSource] = useState(ANY);
  const [destination, setDestination] = useState(ANY);
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [pax, setPax] = useState(1);
  const [query, setQuery] = useState<{ source: string; destination: string } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("departureTime");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = todayISO();
    setMinDate(t);
    setDate(t);
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (source !== ANY && source === destination) return setError("Source and destination must be different.");
    if (!date) return setError("Please select a journey date.");
    if (date < minDate) return setError("Journey date cannot be in the past.");
    if (pax < 1 || pax > MAX_PASSENGERS) return setError(`Passengers must be between 1 and ${MAX_PASSENGERS}.`);
    setError("");
    setQuery({ source, destination });
  }

  const active = query ?? { source: ANY, destination: ANY };
  const results = useMemo(() => {
    const filtered = trains.filter(
      (t) =>
        (active.source === ANY || t.source === active.source) &&
        (active.destination === ANY || t.destination === active.destination) &&
        (!onlyAvailable || t.availableSeats >= pax),
    );
    return bubbleSort(filtered, (t) => (sortKey === "departureTime" ? t.departureTime.replace(":", "") : t[sortKey])).sorted;
  }, [trains, active.source, active.destination, onlyAvailable, pax, sortKey]);

  return (
    <div className="space-y-6">
      <PageHeader title="Find your train" description="Simulated schedules and fares — not live railway information." />

      <form onSubmit={onSearch} className="card-surface grid gap-4 p-5 md:grid-cols-[1fr_auto_1fr_1fr_120px_auto] md:items-end" noValidate>
        <div className="space-y-1.5">
          <Label>From</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger aria-label="Source station"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any station</SelectItem>
              {stations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Swap stations" onClick={() => { setSource(destination); setDestination(source); }}>
          <ArrowLeftRight />
        </Button>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger aria-label="Destination station"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any station</SelectItem>
              {stations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Journey date</Label>
          <Input id="date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pax">Passengers</Label>
          <Input id="pax" type="number" min={1} max={MAX_PASSENGERS} value={pax} onChange={(e) => setPax(Number(e.target.value))} />
        </div>
        <Button type="submit" variant="highlight" className="h-9">
          <Search /> Search
        </Button>
        {error && (
          <Alert variant="destructive" className="md:col-span-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{results.length}</strong> train(s)
          {query && (query.source !== ANY || query.destination !== ANY) ? ` for ${query.source === ANY ? "any" : query.source} → ${query.destination === ANY ? "any" : query.destination}` : " on all routes"}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={onlyAvailable} onCheckedChange={setOnlyAvailable} /> Seats for {pax} only
          </label>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-48" aria-label="Sort by"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="departureTime">Sort: Departure time</SelectItem>
              <SelectItem value="fare">Sort: Fare (low to high)</SelectItem>
              <SelectItem value="trainNumber">Sort: Train number</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState icon={TrainFront} title="No trains found">Try another route or turn off the seat filter.</EmptyState>
      ) : (
        <div className="grid gap-4">
          {results.map((t) => (
            <article key={t.trainNumber} className="card-surface grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)_200px] lg:items-center">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">#{t.trainNumber}</p>
                <h3 className="truncate text-lg font-semibold">{t.trainName}</h3>
                <div className="mt-1"><SeatBadge available={t.availableSeats} total={t.totalSeats} /></div>
              </div>
              <RouteLine train={t} />
              <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
                <div className="lg:text-right">
                  <p className="font-display text-2xl font-bold">{inr(t.fare)}</p>
                  <p className="text-xs text-muted-foreground">per passenger · {inr(t.fare * pax)} for {pax}</p>
                </div>
                <Button asChild variant={t.availableSeats >= pax ? "default" : "outline"}>
                  <Link to="/book/$trainNumber" params={{ trainNumber: t.trainNumber }} search={{ date: date || undefined, pax }}>
                    {t.availableSeats >= pax ? "Book Now" : "Join Waitlist"}
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
