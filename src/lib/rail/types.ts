export type Gender = "M" | "F" | "O";

export interface Train {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string; // HH:MM
  arrivalTime: string; // HH:MM
  durationMins: number;
  fare: number; // per passenger, INR
  totalSeats: number;
  availableSeats: number;
}

export interface Passenger {
  passengerId: string;
  name: string;
  age: number;
  gender: Gender;
  contactNumber: string;
}

export type PassengerInput = Omit<Passenger, "passengerId">;

export type ReservationStatus = "CONFIRMED" | "CANCELLED";

export interface Reservation {
  pnr: string;
  trainNumber: string;
  passengers: Passenger[];
  journeyDate: string; // YYYY-MM-DD
  totalFare: number;
  bookingDate: string; // ISO
  status: ReservationStatus;
  cancelledAt?: string;
  fromWaitlistId?: string;
}

export type WaitingStatus = "WAITING" | "PROMOTED" | "CANCELLED";

export interface WaitingListEntry {
  waitingListId: string;
  trainNumber: string;
  passengerDetails: Passenger[];
  journeyDate: string;
  queuePosition: number; // 1-based among WAITING entries of the same train, 0 when not waiting
  status: WaitingStatus;
  createdAt: string;
  promotedPnr?: string;
}

export interface RailState {
  trains: Train[];
  reservations: Reservation[];
  waitlist: WaitingListEntry[];
}
