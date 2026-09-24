/**
 * Geometry of the reception floor, traced from the printed chart
 * "ASHLEY & JARED / RECEPTION SEAT NUMBERS — REVISED TO SCALE", kept at
 * public/images/ashandjae_finalseatingchart.png. Nothing loads that image
 * at runtime; it is the reference to re-check these coordinates against.
 *
 * All coordinates are in that image's own pixel space, so a table's
 * position here can be checked against the printed plan directly. The
 * room is a trapezoid: the window wall runs from the top-left corner down
 * to the right, and the right and bottom walls close it off.
 *
 * Seats are numbered the way the plan numbers them — clockwise from just
 * right of twelve o'clock on the rounds, top to bottom down each side of
 * the estate runs — so seat 1 here is the seat labelled 1 on the paper
 * chart taped to the wall.
 */

export interface PlanBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The drawing's extent, used as the SVG viewBox and the canvas size. */
export const PLAN_BOX: PlanBox = { x: 120, y: 200, width: 2240, height: 1120 };

/** Walls: top-left corner, down the slanted window wall, then right and bottom. */
export const ROOM_PATH = "M 155 240 L 2215 788 L 2215 1290 L 155 1290 Z";

/** The window wall, drawn heavier than the rest since it's the room's defining edge. */
export const WINDOW_WALL = { x1: 155, y1: 240, x2: 2215, y2: 788 };

/** Entrance aisle: the gap between the two estate runs. */
export const AISLE = { x: 1111, y1: 690, y2: 1180 };

export type TableGeometry =
  | {
      kind: "round";
      id: string;
      /** Center in plan coordinates. */
      cx: number;
      cy: number;
      /** Radius the seats sit on. */
      ring: number;
      /** Radius of the drawn table top. */
      radius: number;
      /** Set on the serpentine rings (T03, T11), which are drawn as a band. */
      hole?: number;
      /** Seat numbers in clockwise order. */
      seats: number[];
    }
  | {
      kind: "estate";
      id: string;
      /** Label shown above the run, e.g. "T07 | T08". */
      runLabel: string;
      /** The drawn table top, shared by the pair. */
      rect: { x: number; y: number; width: number; height: number };
      /** x of this table's seat column. */
      seatX: number;
      /** y of its first seat; the rest step down by `step`. */
      seatY: number;
      step: number;
      /** Seat numbers top to bottom. */
      seats: number[];
    }
  | {
      kind: "sweetheart";
      id: string;
      cx: number;
      cy: number;
      width: number;
      height: number;
      /** Degrees, matching the tilt of the window wall it sits against. */
      rotation: number;
      seats: number[];
    };

/** Inclusive run of seat numbers, e.g. range(11, 19). */
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const ESTATE_RECT_LEFT = { x: 960, y: 682, width: 60, height: 508 };
const ESTATE_RECT_RIGHT = { x: 1205, y: 682, width: 60, height: 508 };
const ESTATE_FIRST_Y = 706;
const ESTATE_STEP = 46;

export const TABLES: TableGeometry[] = [
  { kind: "round", id: "T01", cx: 320, cy: 455, ring: 68, radius: 55, seats: range(1, 10) },
  { kind: "round", id: "T02", cx: 657, cy: 530, ring: 68, radius: 55, seats: range(11, 20) },
  { kind: "round", id: "T03", cx: 712, cy: 850, ring: 128, radius: 116, hole: 62, seats: range(21, 36) },
  { kind: "round", id: "T04", cx: 440, cy: 678, ring: 68, radius: 55, seats: range(37, 46) },
  { kind: "round", id: "T05", cx: 540, cy: 1125, ring: 68, radius: 55, seats: range(47, 56) },
  { kind: "round", id: "T06", cx: 355, cy: 930, ring: 68, radius: 55, seats: range(57, 66) },
  {
    kind: "estate",
    id: "T07",
    runLabel: "T07 | T08",
    rect: ESTATE_RECT_LEFT,
    seatX: 957,
    seatY: ESTATE_FIRST_Y,
    step: ESTATE_STEP,
    seats: range(67, 77),
  },
  {
    kind: "estate",
    id: "T08",
    runLabel: "",
    rect: ESTATE_RECT_LEFT,
    seatX: 1024,
    seatY: ESTATE_FIRST_Y,
    step: ESTATE_STEP,
    seats: range(78, 88),
  },
  {
    kind: "estate",
    id: "T09",
    runLabel: "T09 | T10",
    rect: ESTATE_RECT_RIGHT,
    seatX: 1200,
    seatY: ESTATE_FIRST_Y,
    step: ESTATE_STEP,
    seats: range(89, 99),
  },
  {
    kind: "estate",
    id: "T10",
    runLabel: "",
    rect: ESTATE_RECT_RIGHT,
    seatX: 1265,
    seatY: ESTATE_FIRST_Y,
    step: ESTATE_STEP,
    seats: range(100, 110),
  },
  { kind: "round", id: "T11", cx: 1566, cy: 849, ring: 128, radius: 116, hole: 62, seats: range(111, 126) },
  { kind: "round", id: "T12", cx: 1891, cy: 849, ring: 68, radius: 55, seats: range(127, 136) },
  { kind: "round", id: "T13", cx: 1724, cy: 1129, ring: 68, radius: 55, seats: range(137, 146) },
  // T14 was the one 60" round. Its tenth seat is numbered 158 rather than
  // 156, because 156 and 157 were already the sweetheart's, so its seats
  // are the one run on the plan that isn't contiguous. The circle grows a
  // little to take the extra chair.
  {
    kind: "round",
    id: "T14",
    cx: 2008,
    cy: 1071,
    ring: 66,
    radius: 52,
    seats: [...range(147, 155), 158],
  },
  {
    kind: "sweetheart",
    id: "ST",
    cx: 1111,
    cy: 581,
    width: 132,
    height: 60,
    rotation: 14,
    seats: [156, 157],
  },
];

export interface SeatPoint {
  seat: number;
  x: number;
  y: number;
  table: string;
}

const RAD = Math.PI / 180;

/**
 * Every seat's point on the plan, keyed by the seat number printed on the
 * chart. Built once at module load — the geometry never changes, only who
 * is sitting in it.
 */
export const SEAT_POINTS: Map<number, SeatPoint> = buildSeatPoints();

function buildSeatPoints(): Map<number, SeatPoint> {
  const points = new Map<number, SeatPoint>();

  for (const table of TABLES) {
    table.seats.forEach((seat, i) => {
      if (table.kind === "round") {
        // Seat 1 sits just clockwise of twelve o'clock, not on it, which is
        // why the half-step offset is here: the plan straddles the top of
        // each round with its first and last seat.
        const angle = (-90 + (i + 0.5) * (360 / table.seats.length)) * RAD;
        points.set(seat, {
          seat,
          table: table.id,
          x: table.cx + table.ring * Math.cos(angle),
          y: table.cy + table.ring * Math.sin(angle),
        });
        return;
      }

      if (table.kind === "estate") {
        points.set(seat, {
          seat,
          table: table.id,
          x: table.seatX,
          y: table.seatY + i * table.step,
        });
        return;
      }

      // Sweetheart: both seats along the upper long edge, tilted with the table.
      const angle = table.rotation * RAD;
      const localX = i === 0 ? -33 : 33;
      const localY = -30;
      points.set(seat, {
        seat,
        table: table.id,
        x: table.cx + localX * Math.cos(angle) - localY * Math.sin(angle),
        y: table.cy + localX * Math.sin(angle) + localY * Math.cos(angle),
      });
    });
  }

  return points;
}

/**
 * Below this many screen pixels per plan unit a name is unreadable, so the
 * plan draws the printed chart's numbered dots instead of name cards.
 */
export const NAME_THRESHOLD = 1.25;

/** Seat card size in plan units — sized to the tightest ring (T03/T11 at 16 seats). */
export const CARD = { width: 46, height: 20 };
