"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SEATING_PIN, SEATING_PIN_HEADER } from "@/lib/seating-auth";
import { FloorPlan, type ZoomSetting } from "./FloorPlan";
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

const POLL_MS = 60_000;

/** Fit shows the whole room; the rest are screen pixels per plan unit. */
const ZOOM_STEPS: { label: string; value: ZoomSetting }[] = [
  { label: "Fit screen", value: "fit" },
  { label: "1x", value: 1.3 },
  { label: "2x", value: 2.1 },
  { label: "3x", value: 3 },
];

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
  // Opens at a zoom where the seat cards can actually be read; seeing the
  // whole room at once is a button away rather than the default.
  const [zoom, setZoom] = useState<ZoomSetting>(1.3);

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
    <div className="flex min-h-screen w-full flex-col bg-parchment text-mocha lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="w-full shrink-0 self-start border-b border-sand/40 bg-cream px-5 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-[280px] lg:overflow-y-auto lg:border-r lg:border-b-0">
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
            Parking lot
          </h2>
          <p className="mt-1 font-playfair text-xs text-sand">
            {parked.length} parked · {freeParking} free of{" "}
            {(data?.parking ?? []).length} slots
          </p>
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
            {freeParking > 0 && (
              <li className="rounded-sm border border-dashed border-sand/70 px-3 py-2 font-playfair text-[0.7rem] text-sand">
                {freeParking} empty {freeParking === 1 ? "slot" : "slots"}
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

      <main className="flex w-full min-w-0 flex-1 flex-col px-4 py-4 lg:h-screen lg:px-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {selectedGuest ? (
            <div className="flex-1 rounded-sm border border-mocha bg-cream px-4 py-2 font-playfair text-sm">
              <strong>{selectedGuest}</strong> is selected — click an empty seat
              to place them, or click them again to put them down.
            </div>
          ) : (
            <p className="flex-1 font-playfair text-sm text-sand">
              Click a guest to pick them up.
              {zoom === "fit"
                ? " Zoom in to read names, or scroll the plan."
                : " Scroll the plan to reach every table."}
            </p>
          )}
          <div className="flex items-center gap-1">
            {ZOOM_STEPS.map((step) => (
              <button
                key={String(step.value)}
                type="button"
                onClick={() => setZoom(step.value)}
                className={`rounded-sm border px-3 py-1 font-cinzel text-[0.6rem] uppercase tracking-[0.2em] ${
                  zoom === step.value
                    ? "border-mocha bg-mocha text-cream"
                    : "border-sand text-mocha hover:border-mocha"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* min-w-0 on the frame below keeps the zoomed canvas scrolling
            inside it rather than stretching this column past the window. */}
        {loading && !data ? (
          <p className="font-playfair text-sm text-sand">Loading the chart…</p>
        ) : (
          <div className="min-h-[60vh] min-w-0 flex-1 overflow-hidden rounded-md border border-sand/50 bg-parchment">
            <FloorPlan
              seats={data?.seats ?? []}
              selectedSeat={selection?.kind === "seat" ? selection.seat : null}
              groupColors={groupColors}
              matchesQuery={matchesQuery}
              mealIcon={mealIcon}
              hasDietaryNote={hasDietaryNote}
              onSeatClick={onSeatClick}
              zoom={zoom}
            />
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
