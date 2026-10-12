import type { RailState, Reservation, Train, WaitingListEntry } from "./types";

export const STATIONS = ["Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Nagpur"];

const BASE_TRAINS: Omit<Train, "availableSeats">[] = [
  { trainNumber: "12123", trainName: "Deccan Queen", source: "Pune", destination: "Mumbai", departureTime: "07:15", arrivalTime: "10:25", durationMins: 190, fare: 385, totalSeats: 120 },
  { trainNumber: "12124", trainName: "Deccan Queen", source: "Mumbai", destination: "Pune", departureTime: "17:10", arrivalTime: "20:25", durationMins: 195, fare: 385, totalSeats: 120 },
  { trainNumber: "12951", trainName: "Mumbai Rajdhani", source: "Mumbai", destination: "Delhi", departureTime: "17:00", arrivalTime: "08:32", durationMins: 932, fare: 3450, totalSeats: 90 },
  { trainNumber: "12627", trainName: "Karnataka Express", source: "Bengaluru", destination: "Delhi", departureTime: "19:20", arrivalTime: "09:00", durationMins: 2260, fare: 2180, totalSeats: 100 },
  { trainNumber: "12163", trainName: "Chennai Express", source: "Mumbai", destination: "Chennai", departureTime: "20:35", arrivalTime: "19:45", durationMins: 1390, fare: 1240, totalSeats: 80 },
  { trainNumber: "12025", trainName: "Pune Secunderabad Shatabdi", source: "Pune", destination: "Hyderabad", departureTime: "05:50", arrivalTime: "14:20", durationMins: 510, fare: 1450, totalSeats: 5 },
  { trainNumber: "12105", trainName: "Vidarbha Express", source: "Mumbai", destination: "Nagpur", departureTime: "19:05", arrivalTime: "10:05", durationMins: 900, fare: 890, totalSeats: 100 },
  { trainNumber: "12136", trainName: "Nagpur Pune Express", source: "Nagpur", destination: "Pune", departureTime: "18:00", arrivalTime: "09:30", durationMins: 930, fare: 845, totalSeats: 80 },
  { trainNumber: "12007", trainName: "Chennai Mysuru Shatabdi", source: "Chennai", destination: "Bengaluru", departureTime: "06:00", arrivalTime: "11:00", durationMins: 300, fare: 990, totalSeats: 70 },
  { trainNumber: "12723", trainName: "Telangana Express", source: "Hyderabad", destination: "Delhi", departureTime: "06:00", arrivalTime: "08:15", durationMins: 1575, fare: 1920, totalSeats: 90 },
  { trainNumber: "12434", trainName: "Chennai Rajdhani", source: "Delhi", destination: "Chennai", departureTime: "15:55", arrivalTime: "20:45", durationMins: 1730, fare: 3850, totalSeats: 60 },
  { trainNumber: "22691", trainName: "KSR Bengaluru Rajdhani", source: "Bengaluru", destination: "Delhi", departureTime: "20:00", arrivalTime: "05:30", durationMins: 1970, fare: 4120, totalSeats: 72 },
  { trainNumber: "11007", trainName: "Deccan Express", source: "Mumbai", destination: "Pune", departureTime: "06:40", arrivalTime: "11:05", durationMins: 265, fare: 240, totalSeats: 150 },
  { trainNumber: "12722", trainName: "Dakshin Express", source: "Delhi", destination: "Hyderabad", departureTime: "22:30", arrivalTime: "04:55", durationMins: 1825, fare: 1880, totalSeats: 90 },
];

function p(id: string, name: string, age: number, gender: "M" | "F" | "O", contactNumber: string) {
  return { passengerId: id, name, age, gender, contactNumber };
}

const SEED_RESERVATIONS: Omit<Reservation, "totalFare">[] = [
  { pnr: "4521873690", trainNumber: "12123", journeyDate: "2026-10-20", bookingDate: "2026-10-05T09:12:00.000Z", status: "CONFIRMED", passengers: [p("P-1001", "Aarav Sharma", 28, "M", "9876543210"), p("P-1002", "Diya Sharma", 26, "F", "9876543210")] },
  { pnr: "4521873691", trainNumber: "12951", journeyDate: "2026-10-22", bookingDate: "2026-10-06T14:40:00.000Z", status: "CONFIRMED", passengers: [p("P-1003", "Rohan Mehta", 41, "M", "9823012345")] },
  { pnr: "4521873692", trainNumber: "12025", journeyDate: "2026-10-18", bookingDate: "2026-10-07T07:05:00.000Z", status: "CONFIRMED", passengers: [p("P-1004", "Sneha Kulkarni", 33, "F", "9765432109"), p("P-1005", "Amit Kulkarni", 36, "M", "9765432109"), p("P-1006", "Isha Kulkarni", 9, "F", "9765432109")] },
  { pnr: "4521873693", trainNumber: "12025", journeyDate: "2026-10-18", bookingDate: "2026-10-08T11:30:00.000Z", status: "CONFIRMED", passengers: [p("P-1007", "Karthik Iyer", 30, "M", "9944556677"), p("P-1008", "Meera Iyer", 29, "F", "9944556677")] },
  { pnr: "4521873694", trainNumber: "12163", journeyDate: "2026-10-25", bookingDate: "2026-10-08T16:20:00.000Z", status: "CONFIRMED", passengers: [p("P-1009", "Priya Nair", 24, "F", "9090909090")] },
  { pnr: "4521873695", trainNumber: "12123", journeyDate: "2026-10-15", bookingDate: "2026-10-09T08:00:00.000Z", status: "CANCELLED", cancelledAt: "2026-10-10T10:00:00.000Z", passengers: [p("P-1010", "Vikram Patil", 52, "M", "9822001122")] },
  { pnr: "4521873696", trainNumber: "12105", journeyDate: "2026-10-28", bookingDate: "2026-10-10T19:45:00.000Z", status: "CONFIRMED", passengers: [p("P-1011", "Neha Deshmukh", 31, "F", "9011223344"), p("P-1012", "Sahil Deshmukh", 34, "M", "9011223344"), p("P-1013", "Asha Deshmukh", 60, "F", "9011223344")] },
  { pnr: "4521873697", trainNumber: "12123", journeyDate: "2026-10-21", bookingDate: "2026-10-11T06:15:00.000Z", status: "CONFIRMED", passengers: [p("P-1014", "Tanvi Joshi", 22, "F", "8888777766")] },
];

const SEED_WAITLIST: WaitingListEntry[] = [
  { waitingListId: "WL482931", trainNumber: "12025", journeyDate: "2026-10-18", queuePosition: 1, status: "WAITING", createdAt: "2026-10-11T12:00:00.000Z", passengerDetails: [p("P-1015", "Rahul Verma", 27, "M", "9988776655")] },
];

/** Builds a fresh, internally consistent sample dataset (no randomness). */
export function createSeed(): RailState {
  const reservations: Reservation[] = SEED_RESERVATIONS.map((r) => {
    const fare = BASE_TRAINS.find((t) => t.trainNumber === r.trainNumber)!.fare;
    return { ...r, totalFare: fare * r.passengers.length, passengers: r.passengers.map((x) => ({ ...x })) };
  });
  const trains: Train[] = BASE_TRAINS.map((t) => {
    const booked = reservations
      .filter((r) => r.trainNumber === t.trainNumber && r.status === "CONFIRMED")
      .reduce((n, r) => n + r.passengers.length, 0);
    return { ...t, availableSeats: t.totalSeats - booked };
  });
  return {
    trains,
    reservations,
    waitlist: SEED_WAITLIST.map((w) => ({ ...w, passengerDetails: w.passengerDetails.map((x) => ({ ...x })) })),
  };
}
