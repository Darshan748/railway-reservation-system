import { Queue } from "./structures";
import type {
  Passenger,
  PassengerInput,
  RailState,
  Reservation,
  Train,
  WaitingListEntry,
} from "./types";

export type Result<T> = { ok: true; state: RailState; value: T } | { ok: false; error: string };

export const MAX_PASSENGERS = 6;

export interface IdGen {
  pnr: () => string;
  waitlistId: () => string;
  passengerId: () => string;
  now: () => Date;
}

const digits = (n: number) => {
  let s = String(Math.floor(Math.random() * 9) + 1);
  for (let i = 1; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
};

export const defaultIds: IdGen = {
  pnr: () => digits(10),
  waitlistId: () => "WL" + digits(6),
  passengerId: () => "P-" + digits(6),
  now: () => new Date(),
};

function uniqueId(gen: () => string, taken: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const id = gen();
    if (!taken.has(id)) return id;
  }
  throw new Error("Could not generate a unique id");
}

export type PassengerErrors = Partial<Record<keyof PassengerInput, string>>;

export function validatePassenger(p: Partial<PassengerInput>): PassengerErrors {
  const e: PassengerErrors = {};
  const name = (p.name ?? "").trim();
  if (!name) e.name = "Name is required";
  else if (!/^[A-Za-z][A-Za-z .']{1,49}$/.test(name)) e.name = "Use 2–50 letters only";
  const age = Number(p.age);
  if (p.age === undefined || (p.age as unknown) === "" || Number.isNaN(age)) e.age = "Age is required";
  else if (!Number.isInteger(age) || age < 1 || age > 120) e.age = "Age must be 1–120";
  if (!p.gender || !["M", "F", "O"].includes(p.gender)) e.gender = "Select gender";
  const phone = (p.contactNumber ?? "").trim();
  if (!phone) e.contactNumber = "Contact number is required";
  else if (!/^[6-9]\d{9}$/.test(phone)) e.contactNumber = "Enter a valid 10-digit mobile number";
  return e;
}

function validateBookingInput(
  state: RailState,
  input: { trainNumber: string; journeyDate: string; passengers: PassengerInput[] },
): { train: Train } | { error: string } {
  const train = state.trains.find((t) => t.trainNumber === input.trainNumber);
  if (!train) return { error: "Train not found" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.journeyDate)) return { error: "Select a valid journey date" };
  const n = input.passengers.length;
  if (n < 1) return { error: "Add at least one passenger" };
  if (n > MAX_PASSENGERS) return { error: `A maximum of ${MAX_PASSENGERS} passengers is allowed per booking` };
  for (let i = 0; i < n; i++) {
    if (Object.keys(validatePassenger(input.passengers[i]!)).length) {
      return { error: `Passenger ${i + 1} has invalid details` };
    }
  }
  return { train };
}

function toPassengers(list: PassengerInput[], ids: IdGen): Passenger[] {
  return list.map((p) => ({
    passengerId: ids.passengerId(),
    name: p.name.trim(),
    age: Number(p.age),
    gender: p.gender,
    contactNumber: p.contactNumber.trim(),
  }));
}

function allIds(state: RailState) {
  return new Set([
    ...state.reservations.map((r) => r.pnr),
    ...state.waitlist.map((w) => w.waitingListId),
  ]);
}

/** Recomputes 1-based queue positions for WAITING entries per train (FIFO order preserved). */
function renumber(waitlist: WaitingListEntry[]): WaitingListEntry[] {
  const counters = new Map<string, number>();
  return waitlist.map((w) => {
    if (w.status !== "WAITING") return { ...w, queuePosition: 0 };
    const pos = (counters.get(w.trainNumber) ?? 0) + 1;
    counters.set(w.trainNumber, pos);
    return { ...w, queuePosition: pos };
  });
}

export function bookTicket(
  state: RailState,
  input: { trainNumber: string; journeyDate: string; passengers: PassengerInput[] },
  ids: IdGen = defaultIds,
): Result<Reservation> {
  const v = validateBookingInput(state, input);
  if ("error" in v) return { ok: false, error: v.error };
  const { train } = v;
  const n = input.passengers.length;
  if (train.availableSeats < n) {
    return {
      ok: false,
      error: `Only ${train.availableSeats} seat(s) available on ${train.trainNumber}. You can join the waiting list instead.`,
    };
  }
  const reservation: Reservation = {
    pnr: uniqueId(ids.pnr, allIds(state)),
    trainNumber: train.trainNumber,
    passengers: toPassengers(input.passengers, ids),
    journeyDate: input.journeyDate,
    totalFare: train.fare * n,
    bookingDate: ids.now().toISOString(),
    status: "CONFIRMED",
  };
  return {
    ok: true,
    value: reservation,
    state: {
      ...state,
      trains: state.trains.map((t) =>
        t.trainNumber === train.trainNumber ? { ...t, availableSeats: t.availableSeats - n } : t,
      ),
      reservations: [reservation, ...state.reservations],
    },
  };
}

export function joinWaitlist(
  state: RailState,
  input: { trainNumber: string; journeyDate: string; passengers: PassengerInput[] },
  ids: IdGen = defaultIds,
): Result<WaitingListEntry> {
  const v = validateBookingInput(state, input);
  if ("error" in v) return { ok: false, error: v.error };
  if (v.train.availableSeats >= input.passengers.length) {
    return { ok: false, error: "Seats are available — please book a confirmed ticket instead." };
  }
  const entry: WaitingListEntry = {
    waitingListId: uniqueId(ids.waitlistId, allIds(state)),
    trainNumber: input.trainNumber,
    passengerDetails: toPassengers(input.passengers, ids),
    journeyDate: input.journeyDate,
    queuePosition: 0,
    status: "WAITING",
    createdAt: ids.now().toISOString(),
  };
  const waitlist = renumber([...state.waitlist, entry]);
  return {
    ok: true,
    state: { ...state, waitlist },
    value: waitlist[waitlist.length - 1]!,
  };
}

/**
 * Promotes waiting entries for a train in strict FIFO order while the entry
 * at the front of the queue fits in the available seats.
 */
export function promoteWaitlist(
  state: RailState,
  trainNumber: string,
  ids: IdGen = defaultIds,
): { state: RailState; promoted: Reservation[] } {
  const train = state.trains.find((t) => t.trainNumber === trainNumber);
  if (!train) return { state, promoted: [] };
  const queue = new Queue(state.waitlist.filter((w) => w.trainNumber === trainNumber && w.status === "WAITING"));
  let available = train.availableSeats;
  const promoted: Reservation[] = [];
  const promotedMap = new Map<string, string>();
  const taken = allIds(state);
  while (!queue.isEmpty()) {
    const front = queue.peek()!;
    if (front.passengerDetails.length > available) break;
    queue.dequeue();
    const pnr = uniqueId(ids.pnr, taken);
    taken.add(pnr);
    available -= front.passengerDetails.length;
    promotedMap.set(front.waitingListId, pnr);
    promoted.push({
      pnr,
      trainNumber,
      passengers: front.passengerDetails,
      journeyDate: front.journeyDate,
      totalFare: train.fare * front.passengerDetails.length,
      bookingDate: ids.now().toISOString(),
      status: "CONFIRMED",
      fromWaitlistId: front.waitingListId,
    });
  }
  if (!promoted.length) return { state, promoted };
  return {
    promoted,
    state: {
      trains: state.trains.map((t) => (t.trainNumber === trainNumber ? { ...t, availableSeats: available } : t)),
      reservations: [...promoted, ...state.reservations],
      waitlist: renumber(
        state.waitlist.map((w) =>
          promotedMap.has(w.waitingListId)
            ? { ...w, status: "PROMOTED" as const, promotedPnr: promotedMap.get(w.waitingListId)! }
            : w,
        ),
      ),
    },
  };
}

export function cancelReservation(
  state: RailState,
  pnr: string,
  ids: IdGen = defaultIds,
): Result<{ reservation: Reservation; promoted: Reservation[] }> {
  const res = state.reservations.find((r) => r.pnr === pnr);
  if (!res) return { ok: false, error: "Reservation not found" };
  if (res.status !== "CONFIRMED") return { ok: false, error: "This reservation is already cancelled" };
  const cancelled: Reservation = { ...res, status: "CANCELLED", cancelledAt: ids.now().toISOString() };
  const n = res.passengers.length;
  const afterCancel: RailState = {
    ...state,
    trains: state.trains.map((t) =>
      t.trainNumber === res.trainNumber
        ? { ...t, availableSeats: Math.min(t.totalSeats, t.availableSeats + n) }
        : t,
    ),
    reservations: state.reservations.map((r) => (r.pnr === pnr ? cancelled : r)),
  };
  const { state: next, promoted } = promoteWaitlist(afterCancel, res.trainNumber, ids);
  return { ok: true, state: next, value: { reservation: cancelled, promoted } };
}

export function cancelWaitlistEntry(state: RailState, id: string): Result<WaitingListEntry> {
  const entry = state.waitlist.find((w) => w.waitingListId === id);
  if (!entry) return { ok: false, error: "Waiting-list entry not found" };
  if (entry.status !== "WAITING") return { ok: false, error: "Only waiting entries can be cancelled" };
  const waitlist = renumber(state.waitlist.map((w) => (w.waitingListId === id ? { ...w, status: "CANCELLED" as const } : w)));
  return { ok: true, state: { ...state, waitlist }, value: waitlist.find((w) => w.waitingListId === id)! };
}

export function bookedSeats(state: RailState, trainNumber: string): number {
  return state.reservations
    .filter((r) => r.trainNumber === trainNumber && r.status === "CONFIRMED")
    .reduce((n, r) => n + r.passengers.length, 0);
}

export function validateTrain(t: Partial<Train>): string | null {
  if (!/^\d{5}$/.test(t.trainNumber ?? "")) return "Train number must be 5 digits";
  if (!t.trainName || t.trainName.trim().length < 3) return "Train name must be at least 3 characters";
  if (!t.source || !t.destination) return "Source and destination are required";
  if (t.source.trim().toLowerCase() === t.destination.trim().toLowerCase()) return "Source and destination must differ";
  if (!/^\d{2}:\d{2}$/.test(t.departureTime ?? "") || !/^\d{2}:\d{2}$/.test(t.arrivalTime ?? "")) return "Enter valid times";
  if (!(Number(t.durationMins) > 0)) return "Duration must be positive";
  if (!(Number(t.fare) > 0)) return "Fare must be greater than 0";
  if (!Number.isInteger(Number(t.totalSeats)) || Number(t.totalSeats) < 1) return "Total seats must be at least 1";
  const a = Number(t.availableSeats);
  if (!Number.isInteger(a) || a < 0 || a > Number(t.totalSeats)) return "Available seats must be between 0 and total seats";
  return null;
}

export function addTrain(state: RailState, train: Train): Result<Train> {
  const err = validateTrain(train);
  if (err) return { ok: false, error: err };
  if (state.trains.some((t) => t.trainNumber === train.trainNumber)) {
    return { ok: false, error: `Train ${train.trainNumber} already exists` };
  }
  return { ok: true, value: train, state: { ...state, trains: [...state.trains, train] } };
}

export function updateTrain(state: RailState, trainNumber: string, patch: Train, ids: IdGen = defaultIds): Result<Train> {
  if (!state.trains.some((t) => t.trainNumber === trainNumber)) return { ok: false, error: "Train not found" };
  if (patch.trainNumber !== trainNumber) return { ok: false, error: "Train number cannot be changed" };
  const err = validateTrain(patch);
  if (err) return { ok: false, error: err };
  const booked = bookedSeats(state, trainNumber);
  if (patch.totalSeats - patch.availableSeats < booked) {
    return { ok: false, error: `${booked} seat(s) are already booked; available seats cannot exceed ${patch.totalSeats - booked}` };
  }
  const updated: RailState = { ...state, trains: state.trains.map((t) => (t.trainNumber === trainNumber ? patch : t)) };
  const { state: next } = promoteWaitlist(updated, trainNumber, ids);
  return { ok: true, state: next, value: next.trains.find((t) => t.trainNumber === trainNumber)! };
}

export function deleteTrain(state: RailState, trainNumber: string): Result<Train> {
  const train = state.trains.find((t) => t.trainNumber === trainNumber);
  if (!train) return { ok: false, error: "Train not found" };
  if (state.reservations.some((r) => r.trainNumber === trainNumber && r.status === "CONFIRMED")) {
    return { ok: false, error: "Cancel the confirmed reservations on this train before deleting it" };
  }
  if (state.waitlist.some((w) => w.trainNumber === trainNumber && w.status === "WAITING")) {
    return { ok: false, error: "This train still has passengers on the waiting list" };
  }
  return { ok: true, value: train, state: { ...state, trains: state.trains.filter((t) => t.trainNumber !== trainNumber) } };
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function dayOffset(t: Pick<Train, "departureTime" | "durationMins">): number {
  const [h = 0, m = 0] = t.departureTime.split(":").map(Number);
  return Math.floor((h * 60 + m + t.durationMins) / 1440);
}

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
