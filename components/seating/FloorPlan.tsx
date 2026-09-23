"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AISLE,
  CARD,
  NAME_THRESHOLD,
  PLAN_BOX,
  ROOM_PATH,
  SEAT_POINTS,
  TABLES,
  WINDOW_WALL,
} from "@/lib/seating-layout";
import type { SeatCell } from "@/types/seating";

export type ZoomSetting = "fit" | number;

interface Props {
  seats: SeatCell[];
  selectedSeat: number | null;
  groupColors: Map<string, { background: string; border: string }>;
  matchesQuery: (name: string) => boolean;
  mealIcon: (meal: string) => string;
  hasDietaryNote: (notes: string) => boolean;
  onSeatClick: (seat: SeatCell) => void;
  zoom: ZoomSetting;
}

const seatLabel = (seat: number) => String(seat).padStart(3, "0");

/**
 * A seat card is only as wide as the tightest ring allows, so a full name
 * would always be cut off. First initial plus surname is what fits and is
 * what a seating chart is read for; the full name is in the tooltip, the
 * selection banner and the sidebar.
 */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0][0]}. ${last}`;
}

/**
 * The room, drawn to the proportions of the printed seating chart.
 *
 * Everything is laid out in the plan's own coordinate space and the whole
 * canvas is then scaled with a CSS transform, so tables, seats and labels
 * keep their relationship to each other at every zoom level. Zoomed out
 * far enough that a name could not be read, seats fall back to the printed
 * chart's numbered dots rather than unreadable slivers of text.
 */
export function FloorPlan({
  seats,
  selectedSeat,
  groupColors,
  matchesQuery,
  mealIcon,
  hasDietaryNote,
  onSeatClick,
  zoom,
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(0.5);

  // The "fit" zoom depends on the viewport, so it is measured rather than
  // assumed. A ResizeObserver covers the sidebar collapsing, the window
  // resizing, and an iPad rotating.
  const measure = useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;
    const padding = 32;
    const scale = Math.min(
      (node.clientWidth - padding) / PLAN_BOX.width,
      (node.clientHeight - padding) / PLAN_BOX.height
    );
    setFitScale(Math.max(0.12, scale));
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  const scale = zoom === "fit" ? fitScale : zoom;
  const showNames = scale >= NAME_THRESHOLD;
  const seatByNumber = new Map(seats.map((s) => [s.seat, s]));

  return (
    // Grid + place-content centres the plan while it fits inside the frame
    // and still lets it scroll from its own edge once it is larger.
    <div
      ref={viewportRef}
      className="h-full w-full overflow-auto"
      style={{ display: "grid", placeContent: "center" }}
    >
      <div
        style={{
          width: PLAN_BOX.width * scale,
          height: PLAN_BOX.height * scale,
          position: "relative",
        }}
      >
        <div
          style={{
            width: PLAN_BOX.width,
            height: PLAN_BOX.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            inset: 0,
          }}
        >
          <PlanBackdrop />

          {seats.length > 0 &&
            [...SEAT_POINTS.values()].map((point) => {
              const seat = seatByNumber.get(point.seat);
              if (!seat) return null;
              return (
                <SeatMark
                  key={point.seat}
                  seat={seat}
                  x={point.x}
                  y={point.y}
                  showName={showNames}
                  selected={selectedSeat === seat.seat}
                  highlighted={matchesQuery(seat.name)}
                  color={groupColors.get(seat.group.trim())}
                  icon={mealIcon(seat.meal)}
                  flagged={hasDietaryNote(seat.notes)}
                  onClick={() => onSeatClick(seat)}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

/** Walls, table tops and table labels: the parts that never change. */
function PlanBackdrop() {
  return (
    <svg
      width={PLAN_BOX.width}
      height={PLAN_BOX.height}
      viewBox={`${PLAN_BOX.x} ${PLAN_BOX.y} ${PLAN_BOX.width} ${PLAN_BOX.height}`}
      className="absolute inset-0"
      aria-hidden="true"
    >
      <path d={ROOM_PATH} fill="#fbf5ef" stroke="#d8c3ad" strokeWidth={4} />
      <line
        x1={WINDOW_WALL.x1}
        y1={WINDOW_WALL.y1}
        x2={WINDOW_WALL.x2}
        y2={WINDOW_WALL.y2}
        stroke="#c2a68a"
        strokeWidth={9}
      />

      <line
        x1={AISLE.x}
        y1={AISLE.y1}
        x2={AISLE.x}
        y2={AISLE.y2}
        stroke="#c09a8c"
        strokeWidth={3}
        strokeDasharray="14 12"
      />
      <text
        x={AISLE.x - 10}
        y={(AISLE.y1 + AISLE.y2) / 2}
        transform={`rotate(-90 ${AISLE.x - 10} ${(AISLE.y1 + AISLE.y2) / 2})`}
        textAnchor="middle"
        fontSize={20}
        letterSpacing={3}
        fill="#b08a7d"
        fontFamily="var(--font-cinzel), serif"
      >
        ENTRANCE AISLE
      </text>

      {TABLES.map((table) => {
        if (table.kind === "round") {
          return (
            <g key={table.id}>
              <circle
                cx={table.cx}
                cy={table.cy}
                r={table.radius}
                fill="#ece2d8"
                stroke="#bfa58a"
                strokeWidth={3}
              />
              {table.hole !== undefined && (
                <circle
                  cx={table.cx}
                  cy={table.cy}
                  r={table.hole}
                  fill="#fbf5ef"
                  stroke="#bfa58a"
                  strokeWidth={3}
                />
              )}
              <text
                x={table.cx}
                y={table.cy + 6}
                textAnchor="middle"
                fontSize={table.hole ? 30 : 26}
                fill="#5e3b2b"
                fontFamily="var(--font-cinzel), serif"
                letterSpacing={2}
              >
                {table.id}
              </text>
              <text
                x={table.cx}
                y={table.cy + (table.hole ? 30 : 28)}
                textAnchor="middle"
                fontSize={17}
                fill="#bfa58a"
                fontFamily="var(--font-cinzel), serif"
              >
                {table.seatCount}
              </text>
            </g>
          );
        }

        if (table.kind === "estate") {
          // Both tables of a run share one drawn top; only the left-hand
          // one carries the run's label, so it isn't painted twice.
          return (
            <g key={table.id}>
              {table.runLabel && (
                <>
                  <rect
                    x={table.rect.x}
                    y={table.rect.y}
                    width={table.rect.width}
                    height={table.rect.height}
                    rx={6}
                    fill="#ece2d8"
                    stroke="#bfa58a"
                    strokeWidth={3}
                  />
                  <text
                    x={table.rect.x + table.rect.width / 2}
                    y={table.rect.y - 16}
                    textAnchor="middle"
                    fontSize={24}
                    fill="#5e3b2b"
                    fontFamily="var(--font-cinzel), serif"
                    letterSpacing={2}
                  >
                    {table.runLabel}
                  </text>
                </>
              )}
            </g>
          );
        }

        return (
          <g
            key={table.id}
            transform={`rotate(${table.rotation} ${table.cx} ${table.cy})`}
          >
            <rect
              x={table.cx - table.width / 2}
              y={table.cy - table.height / 2}
              width={table.width}
              height={table.height}
              rx={5}
              fill="#ece2d8"
              stroke="#bfa58a"
              strokeWidth={3}
            />
            <text
              x={table.cx}
              y={table.cy + 9}
              textAnchor="middle"
              fontSize={22}
              fill="#5e3b2b"
              fontFamily="var(--font-cinzel), serif"
              letterSpacing={2}
            >
              ST
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SeatMark({
  seat,
  x,
  y,
  showName,
  selected,
  highlighted,
  color,
  icon,
  flagged,
  onClick,
}: {
  seat: SeatCell;
  x: number;
  y: number;
  showName: boolean;
  selected: boolean;
  highlighted: boolean;
  color?: { background: string; border: string };
  icon: string;
  flagged: boolean;
  onClick: () => void;
}) {
  const empty = seat.name.trim() === "";
  const title = `Seat ${seatLabel(seat.seat)}${seat.name ? ` — ${seat.name}` : " — open"}${
    seat.meal ? ` · ${seat.meal}` : ""
  }${seat.notes ? ` · ${seat.notes}` : ""}`;

  const ring = selected
    ? "0 0 0 5px #5e3b2b"
    : highlighted
      ? "0 0 0 5px #f1a96a"
      : undefined;

  // Zoomed out, a seat is the printed chart's dot; zoomed in it becomes a
  // card with the name on it. Same button either way, so selection and
  // placement behave identically at any zoom.
  if (!showName) {
    const size = 22;
    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        aria-label={title}
        style={{
          position: "absolute",
          left: x - PLAN_BOX.x - size / 2,
          top: y - PLAN_BOX.y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: empty ? "transparent" : (color?.background ?? "#e8dcd0"),
          border: `3px solid ${empty ? "#cbb69f" : (color?.border ?? "#a8896c")}`,
          borderStyle: empty ? "dashed" : "solid",
          boxShadow: ring,
          padding: 0,
          cursor: "pointer",
        }}
      />
    );
  }

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        position: "absolute",
        left: x - PLAN_BOX.x - CARD.width / 2,
        top: y - PLAN_BOX.y - CARD.height / 2,
        width: CARD.width,
        height: CARD.height,
        borderRadius: 4,
        background: empty ? "transparent" : (color?.background ?? "#e8dcd0"),
        border: `1.5px ${empty ? "dashed" : "solid"} ${
          empty ? "#cbb69f" : (color?.border ?? "#a8896c")
        }`,
        boxShadow: ring,
        padding: "1px 2px",
        overflow: "hidden",
        cursor: "pointer",
        color: "#5e3b2b",
        lineHeight: 1.05,
      }}
    >
      {/* Seat number, meal and the dietary flag share the top line so the
          whole card width is left for the name underneath. */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          fontSize: 5.5,
          letterSpacing: 0.4,
          color: "#a8907a",
          fontFamily: "var(--font-cinzel), serif",
        }}
      >
        {seatLabel(seat.seat)}
        {!empty && icon ? <span style={{ fontSize: 7 }}>{icon}</span> : null}
        {flagged && !empty ? <span style={{ fontSize: 7 }}>🚨</span> : null}
      </span>
      <span
        style={{
          display: "block",
          fontSize: 7.5,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontFamily: "var(--font-playfair), Georgia, serif",
        }}
      >
        {empty ? (seat.notes ? seat.notes : "open") : shortName(seat.name)}
      </span>
    </button>
  );
}
