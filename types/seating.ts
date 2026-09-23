/**
 * Shapes shared by the /seating tool's API routes and its client UI.
 *
 * Everything here mirrors the "Seat assignments" tab literally: a seat is
 * identified by its printed seat number (1-157, matching the numbered
 * floor-plan chart), a parking slot by its sheet row (167-186). No guest
 * ids are involved — that tab stores display names only, and the tool's
 * job is to move those names between cells.
 */

export type LocationType = "seat" | "parking";

export interface SeatCell {
  /** Printed seat number, 1-157 (column A). */
  seat: number;
  /** 1-indexed sheet row this seat lives on. */
  row: number;
  /** Table id: "T01".."T14" or "ST" (column B). */
  table: string;
  /** Seat position within the table (column C). */
  seatAtTable: string;
  /** Guest display name, or "" for an empty seat (column D). */
  name: string;
  /** Dinner choice exactly as stored (column E). */
  meal: string;
  /** Group / household (column F). */
  group: string;
  /** Notes — dietary notes, reservations, origin markers (column G). */
  notes: string;
}

export interface ParkingSlot {
  /** 1-indexed sheet row, 167-186. */
  row: number;
  name: string;
  meal: string;
  group: string;
  notes: string;
}

export interface GroupColor {
  name: string;
  /** Soft background for seat cards in this group. */
  background: string;
  /** Border/accent that stays legible on the background. */
  border: string;
}

export interface SeatingData {
  seats: SeatCell[];
  parking: ParkingSlot[];
  groups: GroupColor[];
  /** ISO timestamp of the read, for the "last updated" line. */
  updatedAt: string;
}

export interface MoveRequest {
  fromType: LocationType;
  /** Seat number when fromType is "seat", sheet row when "parking". */
  fromId: number;
  toType: LocationType;
  /**
   * Seat number or parking row. Omitted when moving to the parking lot,
   * in which case the first free parking row is used.
   */
  toId?: number;
}

export interface MoveResponse {
  /** Human-readable summary for the toast, e.g. "Frank White moved to seat 019". */
  message: string;
  /** Seat rows whose contents changed. */
  seats: SeatCell[];
  /** Parking rows whose contents changed. */
  parking: ParkingSlot[];
  updatedAt: string;
}
