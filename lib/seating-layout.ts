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
      /** Set on the serpentine rings (T03, T9), which are drawn as a band. */
      hole?: number;
      /** Seat numbers in clockwise order. */
      seats: number[];
    }
  | {
      kind: "estate";
      id: string;
      /** The drawn table top. */
      rect: { x: number; y: number; width: number; height: number };
      /** x of each of the table's two seat columns, left then right. */
      columns: [number, number];
      /** y of each column's first seat. */
      seatY: number;
      /**
       * Distance from a column's first seat to its last. Each column spreads
       * its own seats evenly over this length, so a side that gives up a
       * seat closes the gap instead of leaving a hole, and both sides still
       * start and end level with each other.
       */
      span: number;
      /** Seat numbers top to bottom, left column then right column. */
      sides: [number[], number[]];
      /** Every seat at the table, left column then right (derived from `sides`). */
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
// Eleven seats 46 apart: the length every estate column is spread over.
const ESTATE_SPAN = 10 * 46;

function estate(
  id: string,
  rect: PlanBox,
  columns: [number, number],
  sides: [number[], number[]]
): TableGeometry {
  return { kind: "estate", id, rect, columns, seatY: ESTATE_FIRST_Y, span: ESTATE_SPAN, sides, seats: [...sides[0], ...sides[1]] };
}

export const TABLES: TableGeometry[] = [
  // T01, T02, T11 and T12 each gave up a seat (008, 018, 138, 152) and
  // seat nine; their circles shrink to match. T05 gave up 048 too, then
  // took it back for a tenth guest.
  { kind: "round", id: "T01", cx: 320, cy: 455, ring: 64, radius: 51, seats: [...range(1, 7), ...range(9, 10)] },
  { kind: "round", id: "T02", cx: 657, cy: 530, ring: 64, radius: 51, seats: [...range(11, 17), 19, 20] },
  { kind: "round", id: "T03", cx: 712, cy: 850, ring: 128, radius: 116, hole: 62, seats: range(21, 36) },
  { kind: "round", id: "T04", cx: 440, cy: 678, ring: 68, radius: 55, seats: range(37, 46) },
  { kind: "round", id: "T05", cx: 540, cy: 1125, ring: 68, radius: 55, seats: range(47, 56) },
  { kind: "round", id: "T06", cx: 355, cy: 930, ring: 68, radius: 55, seats: range(57, 66) },
  // Each estate run is one long table seated down both sides, eleven to a
  // side. A side that gives up a seat spreads its remaining seats over the
  // same length (T8 did this while seat 105 was retired), so list each
  // side's seats explicitly rather than splitting the run in half.
  estate("T7", ESTATE_RECT_LEFT, [957, 1024], [range(67, 77), range(78, 88)]),
  estate("T8", ESTATE_RECT_RIGHT, [1200, 1265], [range(89, 99), range(100, 110)]),
  { kind: "round", id: "T9", cx: 1566, cy: 849, ring: 128, radius: 116, hole: 62, seats: range(111, 126) },
  { kind: "round", id: "T10", cx: 1891, cy: 849, ring: 68, radius: 55, seats: range(127, 136) },
  { kind: "round", id: "T11", cx: 1724, cy: 1129, ring: 64, radius: 51, seats: [137, ...range(139, 146)] },
  { kind: "round", id: "T12", cx: 2008, cy: 1071, ring: 64, radius: 51, seats: [...range(147, 151), ...range(153, 156)] },
  {
    kind: "sweetheart",
    id: "ST",
    cx: 1111,
    cy: 581,
    width: 132,
    height: 60,
    rotation: 14,
    seats: [157, 158],
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
    if (table.kind === "estate") {
      table.sides.forEach((side, column) => {
        const gap = side.length > 1 ? table.span / (side.length - 1) : 0;
        side.forEach((seat, j) => {
          points.set(seat, {
            seat,
            table: table.id,
            x: table.columns[column],
            y: table.seatY + j * gap,
          });
        });
      });
      continue;
    }

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

/** Seat card size in plan units — sized to the tightest ring (T03/T9 at 16 seats). */
export const CARD = { width: 46, height: 20 };
