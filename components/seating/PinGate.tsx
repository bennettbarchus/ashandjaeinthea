"use client";

import { useState, useSyncExternalStore } from "react";
import { SEATING_PIN } from "@/lib/seating-auth";
import { SeatingTool } from "./SeatingTool";

const STORAGE_KEY = "seating-unlocked";

/**
 * sessionStorage read as an external store rather than an effect, so the
 * server render ("locked") and the client's first paint agree without a
 * flash of the PIN form at someone who unlocked earlier in the session.
 * Nothing else writes the key mid-render, so subscribe is a no-op.
 */
const storageStore = {
  subscribe: () => () => {},
  getSnapshot: () => {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) === SEATING_PIN;
    } catch {
      // Private browsing or blocked storage: treat as locked.
      return false;
    }
  },
  getServerSnapshot: () => false,
};

/**
 * PIN screen in front of the seating tool.
 *
 * Kept separate from the homepage's password gate on purpose — this one
 * guards an internal editing tool, and unlocking one should not unlock the
 * other. The unlocked flag lives in sessionStorage so a refresh mid-session
 * doesn't ask again, while closing the tab does.
 */
export function PinGate() {
  const storedUnlock = useSyncExternalStore(
    storageStore.subscribe,
    storageStore.getSnapshot,
    storageStore.getServerSnapshot
  );
  const [unlockedNow, setUnlockedNow] = useState(false);
  const unlocked = storedUnlock || unlockedNow;
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pin.trim() !== SEATING_PIN) {
      setError(true);
      setPin("");
      return;
    }
    try {
      window.sessionStorage.setItem(STORAGE_KEY, SEATING_PIN);
    } catch {
      // Not fatal — they just re-enter it after a refresh.
    }
    setUnlockedNow(true);
  }

  if (unlocked) return <SeatingTool />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-sand/50 bg-cream px-8 py-10 text-center shadow-sm"
      >
        <p className="font-cinzel text-[0.65rem] font-medium uppercase tracking-[0.35em] text-sand">
          Ashley &amp; Jared
        </p>
        <h1 className="mt-3 font-playfair text-2xl text-mocha">Seating Chart</h1>
        <label
          htmlFor="seating-pin"
          className="mt-8 block font-cinzel text-[0.6rem] uppercase tracking-[0.3em] text-sand"
        >
          Enter PIN
        </label>
        <input
          id="seating-pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          className="mx-auto mt-3 block w-32 border-b border-sand bg-transparent pb-2 text-center font-playfair text-2xl tracking-[0.4em] text-mocha outline-none focus:border-mocha"
        />
        <button
          type="submit"
          className="mt-8 w-full rounded-sm border border-mocha px-6 py-3 font-cinzel text-[0.65rem] uppercase tracking-[0.3em] text-mocha transition-colors hover:bg-mocha hover:text-cream"
        >
          Unlock
        </button>
        <p
          role="alert"
          className={`mt-4 font-playfair text-sm text-alert transition-opacity ${
            error ? "opacity-100" : "opacity-0"
          }`}
        >
          That PIN doesn&apos;t match.
        </p>
      </form>
    </main>
  );
}
