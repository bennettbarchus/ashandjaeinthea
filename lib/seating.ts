/**
 * Server-side model of the "Seat assignments" tab for the /seating tool.
 *
 * The tab is not a plain table: rows 1-5 are a title/summary block, row 6
 * holds the column headers, rows 7-164 are the numbered seats, and a
 * "PARKING LOT" block sits below with a header at row 166 and 50 holding
 * rows at 167-216. Columns A-C (seat number, table, seat-at-table) and
 * column H (a =IF(D…) status formula) are fixtures of the sheet — this
 * module only ever writes D:G, exactly as the manual edits did.
 *
 * A seat's row is its number plus six, always: seat 020 was retired when
 * T02 dropped to nine seats and its row was blanked rather than deleted,
 * because deleting it would have shifted every seat below onto the wrong
 * row. A retired seat has no table and cannot be moved into.
 */

import { readRange, writeCellsByRange } from "@/lib/google-sheets";
import type {
  GroupColor,
  MoveRequest,
  MoveResponse,
  ParkingSlot,
  SeatCell,
  SeatingData,
} from "@/types/seating";

export const SEAT_TAB = "Seat assignments";
export const SEAT_FIRST_ROW = 7;
// Row 164 is seat 158, added when T14 went from nine seats to ten.
export const SEAT_LAST_ROW = 164;
export const PARKING_FIRST_ROW = 167;
// 50 holding rows. Seats freed by a table shrinking have to go somewhere,
// and 20 filled up the first time Ashley reshuffled the room.
export const PARKING_LAST_ROW = 216;

/** Seat number (column A) for a given sheet row, and back again. */
const seatNumberForRow = (row: number) => row - SEAT_FIRST_ROW + 1;
const rowForSeatNumber = (seat: number) => seat + SEAT_FIRST_ROW - 1;

/** "19" -> "019", the form used on the floor plan and in origin notes. */
export function formatSeat(seat: number): string {
  return String(seat).padStart(3, "0");
}

/**
 * Marker appended to a parked guest's notes so we know where they came
 * from. Written by the sheet edits that created the parking lot, so the
 * same wording is kept here.
 */
const ORIGIN_NOTE = (seat: number) => `— from seat ${formatSeat(seat)}`;
const ORIGIN_NOTE_PATTERN = /\s*—\s*from seat\s*\d+\s*$/;

function stripOriginNote(notes: string): string {
  return notes.replace(ORIGIN_NOTE_PATTERN, "").trim();
}

function withOriginNote(notes: string, seat: number): string {
  const base = stripOriginNote(notes);
  return base ? `${base} ${ORIGIN_NOTE(seat)}` : ORIGIN_NOTE(seat);
}

/**
 * Soft card colors, one per group, assigned in the order groups appear in
 * the sheet so a given group keeps its color between refreshes. Drawn from
 * the site palette's neighborhood (warm, low-saturation) rather than
 * default chart colors, and kept light enough for espresso text on top.
 */
const GROUP_PALETTE: { background: string; border: string }[] = [
  { background: "#f3e2d6", border: "#c39a78" },
  { background: "#e4ded2", border: "#a89a80" },
  { background: "#f7ddd9", border: "#d79f99" },
  { background: "#dfe5dc", border: "#93a08c" },
  { background: "#ece1ea", border: "#b298b0" },
  { background: "#fae4cf", border: "#d5a06a" },
  { background: "#dde4ea", border: "#8fa2b3" },
  { background: "#f1e7cf", border: "#c2ab72" },
  { background: "#e8dcef", border: "#a58cbb" },
  { background: "#dcece7", border: "#89ab9f" },
  { background: "#f6e0e7", border: "#cf95a6" },
  { background: "#e9e6d6", border: "#a6a180" },
  { background: "#e2e8f0", border: "#94a3b8" },
  { background: "#f4e3c8", border: "#c9a45f" },
  { background: "#e5ded9", border: "#a3948a" },
  { background: "#dff0ea", border: "#86b3a4" },
  { background: "#f0e2ef", border: "#b494b2" },
  { background: "#ede6dc", border: "#b09c84" },
];

/** Reads the seat block and the parking block in one pass. */
export async function getSeatingData(): Promise<SeatingData> {
  const [seatRows, parkingRows] = await Promise.all([
    readRange(`${SEAT_TAB}!A${SEAT_FIRST_ROW}:H${SEAT_LAST_ROW}`, 8),
    readRange(`${SEAT_TAB}!A${PARKING_FIRST_ROW}:G${PARKING_LAST_ROW}`, 7),
  ]);

  const seats: SeatCell[] = [];
  for (let i = 0; i < SEAT_LAST_ROW - SEAT_FIRST_ROW + 1; i += 1) {
    const row = seatRows[i] ?? [];
    const sheetRow = SEAT_FIRST_ROW + i;
    seats.push({
      seat: seatNumberForRow(sheetRow),
      row: sheetRow,
      table: row[1] ?? "",
      seatAtTable: row[2] ?? "",
      name: row[3] ?? "",
      meal: row[4] ?? "",
      group: row[5] ?? "",
      notes: row[6] ?? "",
    });
  }

  const parking: ParkingSlot[] = [];
  for (let i = 0; i < PARKING_LAST_ROW - PARKING_FIRST_ROW + 1; i += 1) {
    const row = parkingRows[i] ?? [];
    parking.push({
      row: PARKING_FIRST_ROW + i,
      name: row[3] ?? "",
      meal: row[4] ?? "",
      group: row[5] ?? "",
      notes: row[6] ?? "",
    });
  }

  return {
    seats,
    parking,
    groups: buildGroupColors([...seats, ...parking]),
    updatedAt: new Date().toISOString(),
  };
}

function buildGroupColors(cells: { group: string }[]): GroupColor[] {
  const names: string[] = [];
  for (const cell of cells) {
    const group = cell.group.trim();
    if (group && !names.includes(group)) names.push(group);
  }
  return names.map((name, i) => ({
    name,
    ...GROUP_PALETTE[i % GROUP_PALETTE.length],
  }));
}

const isOccupied = (cell: { name: string }) => cell.name.trim() !== "";

/** A1 ranges for the four editable columns of a seat or parking row. */
const cellRange = (row: number, column: "D" | "E" | "F" | "G") =>
  `${SEAT_TAB}!${column}${row}`;

function writesFor(
  row: number,
  values: { name: string; meal: string; group: string; notes: string }
) {
  return [
    { range: cellRange(row, "D"), value: values.name },
    { range: cellRange(row, "E"), value: values.meal },
    { range: cellRange(row, "F"), value: values.group },
    { range: cellRange(row, "G"), value: values.notes },
  ];
}

const EMPTY = { name: "", meal: "", group: "", notes: "" };

export class MoveError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/**
 * Moves one guest between two locations.
 *
 * Reads the current state first and refuses if the source has since been
 * emptied or the destination filled — two people can have this tool open
 * at once, and the client's 60s polling means its view can be a minute
 * stale. An occupied destination is never overwritten.
 */
export async function moveGuest(request: MoveRequest): Promise<MoveResponse> {
  const data = await getSeatingData();

  const source =
    request.fromType === "seat"
      ? findSeat(data, request.fromId)
      : findParking(data, request.fromId);

  if (!isOccupied(source.values)) {
    throw new MoveError(`${source.label} is already empty.`, 409);
  }

  const destination =
    request.toType === "seat"
      ? findSeat(data, requireId(request.toId, "seat"))
      : request.toId === undefined
        ? firstFreeParking(data)
        : findParking(data, request.toId);

  if (source.row === destination.row) {
    throw new MoveError("That guest is already there.", 400);
  }
  if (isOccupied(destination.values)) {
    throw new MoveError(
      `${destination.label} is taken by ${destination.values.name}.`,
      409
    );
  }

  // Notes carry an origin marker only while a guest sits in the parking
  // lot; seating them again drops it so their dietary note reads clean.
  const notes =
    destination.kind === "parking"
      ? withOriginNote(source.values.notes, seatNumberForRow(source.row))
      : stripOriginNote(source.values.notes);

  const moved = { ...source.values, notes };

  await writeCellsByRange([
    ...writesFor(destination.row, moved),
    ...writesFor(source.row, EMPTY),
  ]);

  const changedSeats: SeatCell[] = [];
  const changedParking: ParkingSlot[] = [];

  for (const [location, values] of [
    [source, EMPTY],
    [destination, moved],
  ] as const) {
    if (location.kind === "seat") {
      changedSeats.push({ ...location.seat, ...values });
    } else {
      changedParking.push({ row: location.row, ...values });
    }
  }

  return {
    message: `${source.values.name} moved to ${destination.label}`,
    seats: changedSeats,
    parking: changedParking,
    updatedAt: new Date().toISOString(),
  };
}

function requireId(id: number | undefined, kind: string): number {
  if (id === undefined) {
    throw new MoveError(`A destination ${kind} is required.`, 400);
  }
  return id;
}

type Location =
  | {
      kind: "seat";
      row: number;
      label: string;
      seat: SeatCell;
      values: { name: string; meal: string; group: string; notes: string };
    }
  | {
      kind: "parking";
      row: number;
      label: string;
      values: { name: string; meal: string; group: string; notes: string };
    };

function findSeat(data: SeatingData, seatNumber: number): Location {
  const seat = data.seats.find((s) => s.seat === seatNumber);
  if (!seat) {
    throw new MoveError(`Seat ${seatNumber} does not exist.`, 400);
  }
  if (!seat.table.trim()) {
    throw new MoveError(
      `Seat ${formatSeat(seatNumber)} has been retired and can't be used.`,
      400
    );
  }
  return {
    kind: "seat",
    row: rowForSeatNumber(seatNumber),
    label: `seat ${formatSeat(seatNumber)}`,
    seat,
    values: {
      name: seat.name,
      meal: seat.meal,
      group: seat.group,
      notes: seat.notes,
    },
  };
}

function findParking(data: SeatingData, row: number): Location {
  const slot = data.parking.find((p) => p.row === row);
  if (!slot) {
    throw new MoveError(`Parking row ${row} does not exist.`, 400);
  }
  return {
    kind: "parking",
    row,
    label: "the parking lot",
    values: {
      name: slot.name,
      meal: slot.meal,
      group: slot.group,
      notes: slot.notes,
    },
  };
}

function firstFreeParking(data: SeatingData): Location {
  const slot = data.parking.find((p) => !isOccupied(p));
  if (!slot) {
    throw new MoveError(
      "The parking lot is full — seat someone before parking another guest.",
      409
    );
  }
  return findParking(data, slot.row);
}
