"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SEATING_PIN, SEATING_PIN_HEADER } from "@/lib/seating-auth";
import type {
  MoveRequest,
  MoveResponse,
  ParkingSlot,
  SeatCell,
  SeatingData,
} from "@/types/seating";

/** What the tool currently has picked up, if anything. */
type Selection =
  | { kind: "seat"; seat: number }
  | { kind: "parking"; row: number };

type TableShape = "round" | "estate" | "sweetheart";

/**
 * The 14 tables plus the sweetheart table, placed to roughly echo the
 * numbered floor plan: rounds down the left and right, the four estate
 * tables in the middle, the couple at the top. `area` names cells in the
 * grid template defined in globals.css (.seating-floor), which only
 * applies from 1400px up — narrower screens stack in this order instead.
 */
const TABLES: { id: string; shape: TableShape; area: string }[] = [
  { id: "ST", shape: "sweetheart", area: "st" },
  { id: "T01", shape: "round", area: "t01" },
  { id: "T02", shape: "round", area: "t02" },
  { id: "T03", shape: "round", area: "t03" },
  { id: "T04", shape: "round", area: "t04" },
  { id: "T05", shape: "round", area: "t05" },
  { id: "T06", shape: "round", area: "t06" },
  { id: "T07", shape: "estate", area: "t07" },
  { id: "T08", shape: "estate", area: "t08" },
  { id: "T09", shape: "estate", area: "t09" },
  { id: "T10", shape: "estate", area: "t10" },
  { id: "T11", shape: "round", area: "t11" },
  { id: "T12", shape: "round", area: "t12" },
  { id: "T13", shape: "round", area: "t13" },
  { id: "T14", shape: "round", area: "t14" },
];

const POLL_MS = 60_000;

function mealIcon(meal: string): string {
  const m = meal.toLowerCase();
  if (m.includes("strip") || m.includes("steak")) return "🥩";
  if (m.includes("bass") || m.includes("fish")) return "🐟";
  if (m.includes("risotto") || m.includes("veg")) return "🌿";
  return "";
}

/** Notes that are only an origin marker aren't a dietary flag. */
function hasDietaryNote(notes: string): boolean {
  const trimmed = notes.trim();
  if (!trimmed) return false;
  return !/^—\s*from seat\s*\d+$/.test(trimmed);
}

const seatLabel = (seat: number) => String(seat).padStart(3, "0");

export function SeatingTool() {
  const [data, setData] = useState<SeatingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Polling must not fire mid-write, or a stale read would land on top of
  // a move that's still in flight. Tracked in a ref (written only from the
  // move handler, never during render) so the polling effect doesn't have
  // to be torn down and rebuilt every time a request starts or finishes.
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/seating/data", {
        cache: "no-store",
        headers: { [SEATING_PIN_HEADER]: SEATING_PIN },
      });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as SeatingData);
      setError(null);
    } catch {
      setError("Couldn't reach the sheet. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  // One effect owns both the first read and the 60s poll that keeps two
  // people editing at once roughly in sync. The initial read is deferred a
  // tick rather than called inline so this effect never sets state
  // synchronously while mounting.
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!cancelled && !busyRef.current) void load();
    };
    const first = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const groupColors = useMemo(() => {
    const map = new Map<string, { background: string; border: string }>();
    for (const g of data?.groups ?? []) {
      map.set(g.name, { background: g.background, border: g.border });
    }
    return map;
  }, [data]);

  const seatsByTable = useMemo(() => {
    const map = new Map<string, SeatCell[]>();
    for (const seat of data?.seats ?? []) {
      const list = map.get(seat.table) ?? [];
      list.push(seat);
      map.set(seat.table, list);
    }
    return map;
  }, [data]);

  const parked = (data?.parking ?? []).filter((p) => p.name.trim() !== "");
  const freeParking = (data?.parking ?? []).length - parked.length;

  const selectedGuest = (() => {
    if (!selection || !data) return null;
    if (selection.kind === "seat") {
      return data.seats.find((s) => s.seat === selection.seat)?.name ?? null;
    }
    return data.parking.find((p) => p.row === selection.row)?.name ?? null;
  })();

  const matchesQuery = useCallback(
    (name: string) => {
      const q = query.trim().toLowerCase();
      return q.length > 0 && name.toLowerCase().includes(q);
    },
    [query]
  );

  /** Applies the rows the server reports back, so the board updates without a full re-read. */
  function applyChanges(result: MoveResponse) {
    setData((prev) => {
      if (!prev) return prev;
      const seats = prev.seats.map((seat) => {
        const changed = result.seats.find((s) => s.seat === seat.seat);
        return changed ? { ...seat, ...changed } : seat;
      });
      const parking = prev.parking.map((slot) => {
        const changed = result.parking.find((p) => p.row === slot.row);
        return changed ? { ...slot, ...changed } : slot;
      });
      return { ...prev, seats, parking, updatedAt: result.updatedAt };
    });
  }

  async function move(request: MoveRequest) {
    if (busy) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/seating/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [SEATING_PIN_HEADER]: SEATING_PIN,
        },
        body: JSON.stringify(request),
      });
      const payload = (await res.json()) as MoveResponse | { error: string };
      if (!res.ok) {
        setToast({ text: (payload as { error: string }).error, bad: true });
        // A rejected move usually means someone else changed the sheet.
        await load();
        return;
      }
      applyChanges(payload as MoveResponse);
      setToast({ text: (payload as MoveResponse).message });
      setSelection(null);
    } catch {
      setToast({ text: "That move didn't save. Try again.", bad: true });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function onSeatClick(seat: SeatCell) {
    const occupied = seat.name.trim() !== "";

    if (selection?.kind === "seat" && selection.seat === seat.seat) {
      setSelection(null);
      return;
    }

    if (!selection) {
      if (occupied) setSelection({ kind: "seat", seat: seat.seat });
      return;
    }

    if (occupied) {
      setToast({
        text: `Seat ${seatLabel(seat.seat)} is taken by ${seat.name}. Pick an empty seat.`,
        bad: true,
      });
      return;
    }

    void move({
      fromType: selection.kind,
      fromId: selection.kind === "seat" ? selection.seat : selection.row,
      toType: "seat",
      toId: seat.seat,
    });
  }

  function onParkedClick(slot: ParkingSlot) {
    if (selection?.kind === "parking" && selection.row === slot.row) {
      setSelection(null);
      return;
    }
    if (!selection) {
      setSelection({ kind: "parking", row: slot.row });
      return;
    }
    setToast({
      text: `${slot.name} is already parked there.`,
      bad: true,
    });
  }

  function parkSelected() {
    if (selection?.kind !== "seat") return;
    void move({ fromType: "seat", fromId: selection.seat, toType: "parking" });
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-parchment text-mocha lg:flex-row">
      <aside className="w-full shrink-0 border-b border-sand/40 bg-cream px-5 py-6 lg:h-screen lg:w-[280px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <p className="font-cinzel text-[0.6rem] uppercase tracking-[0.3em] text-sand">
          Ashley &amp; Jared
        </p>
        <h1 className="mt-1 font-playfair text-xl">Seating Chart</h1>

        <label htmlFor="seating-search" className="sr-only">
          Search guests
        </label>
        <input
          id="seating-search"
          type="search"
          value={query}
          placeholder="Search a guest…"
          onChange={(e) => setQuery(e.target.value)}
          className="mt-5 w-full rounded-sm border border-sand/70 bg-parchment px-3 py-2 font-playfair text-sm outline-none placeholder:text-sand focus:border-mocha"
        />

        <div className="mt-6">
          <h2 className="font-cinzel text-[0.6rem] uppercase tracking-[0.3em] text-sand">
            Parking lot ({parked.length})
          </h2>
          <p className="mt-2 font-playfair text-xs text-sand">
            {selectedGuest
              ? "Click an empty seat to place them."
              : "Click a guest to pick them up."}
          </p>

          <ul className="mt-3 space-y-2">
            {parked.map((slot) => {
              const isSelected =
                selection?.kind === "parking" && selection.row === slot.row;
              const color = groupColors.get(slot.group.trim());
              return (
                <li key={slot.row}>
                  <button
                    type="button"
                    onClick={() => onParkedClick(slot)}
                    style={
                      color
                        ? { background: color.background, borderColor: color.border }
                        : undefined
                    }
                    className={`w-full rounded-sm border px-3 py-2 text-left transition-shadow ${
                      isSelected ? "ring-2 ring-mocha" : ""
                    } ${matchesQuery(slot.name) ? "ring-2 ring-peach" : ""}`}
                  >
                    <span className="block font-playfair text-sm">
                      {mealIcon(slot.meal)} {slot.name}{" "}
                      {hasDietaryNote(slot.notes) ? "🚨" : ""}
                    </span>
                    <span className="block font-playfair text-[0.7rem] text-sand">
                      {slot.notes || "parked"}
                    </span>
                  </button>
                </li>
              );
            })}
            {parked.length === 0 && (
              <li className="font-playfair text-xs text-sand">
                Nobody is parked right now.
              </li>
            )}
          </ul>

          {selection?.kind === "seat" && (
            <button
              type="button"
              onClick={parkSelected}
              disabled={busy || freeParking === 0}
              className="mt-4 w-full rounded-sm border border-dashed border-mocha px-3 py-3 font-cinzel text-[0.6rem] uppercase tracking-[0.25em] disabled:opacity-40"
            >
              {freeParking === 0
                ? "Parking lot full"
                : `Park ${selectedGuest ?? "guest"}`}
            </button>
          )}
        </div>

        <div className="mt-8 border-t border-sand/40 pt-4">
          <button
            type="button"
            onClick={() => void load()}
            className="w-full rounded-sm border border-mocha px-3 py-2 font-cinzel text-[0.6rem] uppercase tracking-[0.25em] hover:bg-mocha hover:text-cream"
          >
            Refresh
          </button>
          <p className="mt-2 font-playfair text-[0.7rem] text-sand">
            {data
              ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()}`
              : "Loading…"}
          </p>
          {error && (
            <p role="alert" className="mt-2 font-playfair text-[0.7rem] text-alert">
              {error}
            </p>
          )}
        </div>
      </aside>

      <main className="w-full flex-1 overflow-x-auto px-4 py-6 lg:h-screen lg:overflow-y-auto lg:px-8">
        {selectedGuest && (
          <div className="mb-4 rounded-sm border border-mocha bg-cream px-4 py-2 font-playfair text-sm">
            <strong>{selectedGuest}</strong> is selected — click an empty seat to
            place them, or click them again to put them down.
          </div>
        )}

        {loading && !data ? (
          <p className="font-playfair text-sm text-sand">Loading the chart…</p>
        ) : (
          <div className="seating-floor">
            {TABLES.map((table) => (
              <TableView
                key={table.id}
                id={table.id}
                shape={table.shape}
                area={table.area}
                seats={seatsByTable.get(table.id) ?? []}
                selection={selection}
                groupColors={groupColors}
                matchesQuery={matchesQuery}
                onSeatClick={onSeatClick}
              />
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-sm px-5 py-3 font-playfair text-sm shadow-lg ${
            toast.bad ? "bg-alert text-cream" : "bg-mocha text-cream"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function TableView({
  id,
  shape,
  area,
  seats,
  selection,
  groupColors,
  matchesQuery,
  onSeatClick,
}: {
  id: string;
  shape: TableShape;
  area: string;
  seats: SeatCell[];
  selection: Selection | null;
  groupColors: Map<string, { background: string; border: string }>;
  matchesQuery: (name: string) => boolean;
  onSeatClick: (seat: SeatCell) => void;
}) {
  const filled = seats.filter((s) => s.name.trim() !== "").length;

  const header = (
    <div className="mb-2 text-center">
      <span className="font-cinzel text-[0.65rem] uppercase tracking-[0.25em]">
        {id}
      </span>
      <span className="ml-2 font-playfair text-[0.7rem] text-sand">
        {filled}/{seats.length}
      </span>
    </div>
  );

  const chips = seats.map((seat) => (
    <SeatChip
      key={seat.seat}
      seat={seat}
      selected={selection?.kind === "seat" && selection.seat === seat.seat}
      highlighted={matchesQuery(seat.name)}
      color={groupColors.get(seat.group.trim())}
      onClick={() => onSeatClick(seat)}
    />
  ));

  if (shape === "round") {
    // Seats sit around the rim of the circle, starting at the top. Chips are
    // centered on the rim, so half of one hangs outside the circle's box on
    // every side — the px-11/pb-10 padding is what reserves that space, and
    // without it neighboring tables in the grid overlap.
    // Circumference has to fit every chip side by side: a chip is 72px
    // wide and the rim sits at 40% of the box, so the box must be at least
    // (chip + gap) * seats / (2π * 0.4) across. T03 and T11 seat 16 and
    // need a much bigger circle than the 9- and 10-seat rounds.
    const size = Math.max(280, Math.round(32 * seats.length));
    return (
      <section
        style={{ gridArea: area }}
        className="flex flex-col items-center px-10 pb-8"
      >
        {header}
        <div
          className="relative rounded-full border border-sand/70 bg-cream/60"
          style={{ width: size, height: size }}
        >
          {seats.map((seat, i) => {
            const angle = (i / seats.length) * 2 * Math.PI - Math.PI / 2;
            return (
              <div
                key={seat.seat}
                className="absolute"
                style={{
                  left: `${50 + 40 * Math.cos(angle)}%`,
                  top: `${50 + 40 * Math.sin(angle)}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {chips[i]}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Estate tables and the sweetheart table are rectangles: seats run in two
  // columns down the long sides, which is how they face each other on the
  // floor plan.
  return (
    <section style={{ gridArea: area }} className="flex flex-col items-center">
      {header}
      <div className="grid grid-cols-2 gap-2 rounded-md border border-sand/70 bg-cream/60 p-3">
        {chips}
      </div>
    </section>
  );
}

function SeatChip({
  seat,
  selected,
  highlighted,
  color,
  onClick,
}: {
  seat: SeatCell;
  selected: boolean;
  highlighted: boolean;
  color?: { background: string; border: string };
  onClick: () => void;
}) {
  const empty = seat.name.trim() === "";
  const reserved = empty && seat.notes.trim() !== "";

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Seat ${seatLabel(seat.seat)}${seat.name ? ` — ${seat.name}` : ""}${
        seat.notes ? ` — ${seat.notes}` : ""
      }`}
      style={
        !empty && color
          ? { background: color.background, borderColor: color.border }
          : undefined
      }
      className={`h-[2.9rem] w-[4.5rem] overflow-hidden rounded-sm border px-1 py-1 text-center leading-tight transition-shadow ${
        empty
          ? "border-dashed border-sand bg-transparent hover:border-mocha"
          : "border-solid"
      } ${selected ? "ring-2 ring-mocha" : ""} ${
        highlighted ? "ring-2 ring-peach" : ""
      }`}
    >
      <span className="block font-cinzel text-[0.5rem] tracking-[0.15em] text-sand">
        {seatLabel(seat.seat)}
      </span>
      {empty ? (
        <span className="block font-playfair text-[0.6rem] text-sand">
          {reserved ? seat.notes : "open"}
        </span>
      ) : (
        <span className="block truncate font-playfair text-[0.63rem]">
          {mealIcon(seat.meal)} {seat.name}
          {hasDietaryNote(seat.notes) ? " 🚨" : ""}
        </span>
      )}
    </button>
  );
}
