"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Attendance,
  InvitationEventMeta,
  InvitationGuest,
  RsvpSettings,
  SearchResult,
} from "@/types/rsvp";
import type {
  WelcomeInvitationResponse,
  WelcomeSubmitGuestResponse,
} from "@/types/welcome";
import { ProgressIndicator } from "@/components/rsvp/ProgressIndicator";
import { NameSearchStep } from "@/components/rsvp/NameSearchStep";
import { HouseholdConfirmStep } from "@/components/rsvp/HouseholdConfirmStep";
import { DietaryNotesStep } from "@/components/rsvp/DietaryNotesStep";
import { PrimaryButton, SecondaryButton } from "@/components/rsvp/ui";
import { WelcomeIntroStep } from "./WelcomeIntroStep";
import { PersonalMessageStep } from "./PersonalMessageStep";
import { DressCodeStep } from "./DressCodeStep";
import { WelcomeAttendanceStep } from "./WelcomeAttendanceStep";
import { WelcomeReviewStep, type WelcomeReviewGuest } from "./WelcomeReviewStep";
import { WelcomeConfirmationStep } from "./WelcomeConfirmationStep";

type Screen =
  | { id: "intro" }
  | { id: "search" }
  | { id: "confirm" }
  | { id: "message" }
  | { id: "dress" }
  | { id: "attendance" }
  | { id: "dietary" }
  | { id: "review" }
  | { id: "confirmation" };

/** intro → search → confirm → [message] → dress → attendance → dietary → review → confirmation */
const STEPS_WITHOUT_MESSAGE = 8;

export function WelcomeShell({ initialSettings }: { initialSettings: RsvpSettings }) {
  const [settings, setSettings] = useState<RsvpSettings>(initialSettings);
  const [history, setHistory] = useState<Screen[]>([{ id: "intro" }]);
  const screen = history[history.length - 1];

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Invitation
  const [invitation, setInvitation] = useState<WelcomeInvitationResponse | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [plusOneNames, setPlusOneNames] = useState<Record<string, string>>({});

  // Answers
  const [attendance, setAttendanceMap] = useState<Record<string, Attendance>>({});
  const [dietaryNotes, setDietaryNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const guests: InvitationGuest[] = useMemo(
    () => invitation?.guests ?? [],
    [invitation]
  );
  const event: InvitationEventMeta | null = invitation?.event ?? null;

  // Seed any answers already on file when an invitation loads, without
  // clobbering what the guest has changed in this session. Runs during
  // render (React's "adjusting state when a prop changes" pattern), the
  // same approach RsvpShell uses.
  const [lastMerged, setLastMerged] = useState<WelcomeInvitationResponse | null>(null);
  if (invitation && invitation !== lastMerged) {
    const loaded = invitation.guests;
    setLastMerged(invitation);
    setAttendanceMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const guest of loaded) {
        if (next[guest.id] !== undefined) continue;
        const prior = guest.events[0]?.attendance;
        if (prior) {
          next[guest.id] = prior;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setDietaryNotes((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const guest of loaded) {
        if (next[guest.id] !== undefined) continue;
        const prior = guest.events[0]?.dietaryNotes;
        if (prior && prior.trim()) {
          next[guest.id] = prior;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  const attendingGuests = guests.filter((g) => attendance[g.id] === "YES");
  const personalMessage = invitation?.household.personalMessage?.trim() ?? "";

  /** The personal-message screen is skipped entirely when there's no note. */
  function firstScreenAfterConfirm(): Screen {
    return personalMessage ? { id: "message" } : { id: "dress" };
  }

  function displayNameFor(guest: InvitationGuest): string {
    const edited = plusOneNames[guest.id]?.trim();
    return edited ? edited : guest.displayName;
  }

  // ---- Search ----
  const trimmedQuery = searchQuery.trim();

  useEffect(() => {
    if (trimmedQuery.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch("/api/welcome/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmedQuery }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSearchError(data.error ?? "Something went wrong. Please try again.");
          setSearchResults([]);
        } else {
          setSearchResults(data.results ?? []);
          setSearchError(null);
        }
      } catch {
        if (!cancelled) setSearchError("Something went wrong. Please try again.");
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedQuery]);

  async function selectHousehold(householdId: string) {
    setSearchError(null);
    setIsLoadingInvitation(true);
    try {
      const res = await fetch("/api/welcome/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const inv = data as WelcomeInvitationResponse;
      setInvitation(inv);
      if (inv.settings) setSettings(inv.settings);
      setHistory((h) => [...h, { id: "confirm" }]);
    } catch {
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setIsLoadingInvitation(false);
    }
  }

  function notMyParty() {
    setInvitation(null);
    setHistory((h) => {
      const idx = h.findIndex((s) => s.id === "search");
      return idx >= 0 ? h.slice(0, idx + 1) : [{ id: "intro" }, { id: "search" }];
    });
  }

  // ---- Navigation ----
  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }

  function goNextFrom(current: Screen) {
    if (current.id === "message") {
      setHistory((h) => [...h, { id: "dress" }]);
      return;
    }
    if (current.id === "dress") {
      setHistory((h) => [...h, { id: "attendance" }]);
      return;
    }
    if (current.id === "attendance") {
      // Nothing to ask about food if no one is coming.
      setHistory((h) => [...h, attendingGuests.length > 0 ? { id: "dietary" } : { id: "review" }]);
      return;
    }
    if (current.id === "dietary") {
      setHistory((h) => [...h, { id: "review" }]);
    }
  }

  function canContinue(current: Screen): boolean {
    if (current.id === "attendance") {
      return guests.every((g) => attendance[g.id] !== undefined);
    }
    return true;
  }

  async function handleSubmit() {
    if (!invitation) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const responses: WelcomeSubmitGuestResponse[] = [];
    for (const guest of guests) {
      const answer = attendance[guest.id];
      if (!answer) continue;
      const notes = dietaryNotes[guest.id]?.trim();
      responses.push({
        guestId: guest.id,
        attendance: answer,
        dietaryNotes: answer === "YES" && notes ? notes : undefined,
      });
    }

    const plusOnePayload = Object.entries(plusOneNames)
      .filter(([, name]) => name.trim().length > 0)
      .map(([guestId, displayName]) => ({ guestId, displayName: displayName.trim() }));

    try {
      const res = await fetch("/api/welcome/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: invitation.household.id,
          responses,
          plusOneNames: plusOnePayload.length > 0 ? plusOnePayload : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setHistory((h) => [...h, { id: "confirmation" }]);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const reviewGuests: WelcomeReviewGuest[] = guests.map((guest) => ({
    id: guest.id,
    displayName: displayNameFor(guest),
    attendance: attendance[guest.id] ?? null,
    dietaryNotes: dietaryNotes[guest.id] ?? "",
  }));

  const showBack = history.length > 1 && screen.id !== "confirmation";
  const showGenericFooter = ["message", "dress", "attendance", "dietary"].includes(
    screen.id
  );

  if (!settings.rsvpOpen) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-parchment px-6 py-10 text-center text-mocha sm:max-w-lg">
        <h1 className="font-playfair text-2xl text-mocha">
          Responses are currently closed.
        </h1>
        {settings.supportEmail ? (
          <p className="mt-4 font-playfair text-sm text-sand">
            Please reach out to{" "}
            <a href={`mailto:${settings.supportEmail}`} className="underline">
              {settings.supportEmail}
            </a>{" "}
            with any questions.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-parchment px-6 py-10 text-mocha sm:max-w-lg">
      <ProgressIndicator
        current={history.length}
        total={Math.max(history.length, STEPS_WITHOUT_MESSAGE + (personalMessage ? 1 : 0))}
      />

      {showBack ? (
        <div className="mb-4">
          <SecondaryButton onClick={goBack} type="button">
            &larr; Back
          </SecondaryButton>
        </div>
      ) : null}

      <div className="flex-1">
        {screen.id === "intro" && (
          <WelcomeIntroStep
            onBegin={() => setHistory((h) => [...h, { id: "search" }])}
            registryUrl={settings.registryUrl}
            registryMessage={settings.registryMessage}
          />
        )}

        {screen.id === "search" && (
          <NameSearchStep
            query={searchQuery}
            onQueryChange={setSearchQuery}
            results={trimmedQuery.length >= 3 && !isLoadingInvitation ? searchResults : []}
            isSearching={trimmedQuery.length >= 3 && isSearching}
            isSelecting={isLoadingInvitation}
            errorMessage={trimmedQuery.length >= 3 ? searchError : null}
            onSelect={selectHousehold}
            supportEmail={settings.supportEmail}
          />
        )}

        {screen.id === "confirm" && invitation && (
          <HouseholdConfirmStep
            householdName={invitation.household.name}
            guests={guests}
            plusOneNames={plusOneNames}
            onPlusOneNameChange={(guestId, value) =>
              setPlusOneNames((prev) => ({ ...prev, [guestId]: value }))
            }
            onConfirm={() => setHistory((h) => [...h, firstScreenAfterConfirm()])}
            onNotMyParty={notMyParty}
            isLoading={false}
            errorMessage={null}
          />
        )}

        {screen.id === "message" && personalMessage && (
          <PersonalMessageStep message={personalMessage} />
        )}

        {screen.id === "dress" && <DressCodeStep />}

        {screen.id === "attendance" && event && (
          <WelcomeAttendanceStep
            event={event}
            guests={guests.map((g) => ({
              id: g.id,
              displayName: displayNameFor(g),
              attendance: attendance[g.id] ?? null,
            }))}
            onChange={(guestId, value) =>
              setAttendanceMap((prev) => ({ ...prev, [guestId]: value }))
            }
          />
        )}

        {screen.id === "dietary" && (
          <DietaryNotesStep
            guests={attendingGuests.map((g) => ({
              id: g.id,
              displayName: displayNameFor(g),
              dietaryNotes: dietaryNotes[g.id] ?? "",
            }))}
            onChange={(guestId, notes) =>
              setDietaryNotes((prev) => ({ ...prev, [guestId]: notes }))
            }
          />
        )}

        {screen.id === "review" && (
          <WelcomeReviewStep
            eventName={event?.eventName ?? "Friday Welcome Celebration"}
            guests={reviewGuests}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
            onSubmit={handleSubmit}
          />
        )}

        {screen.id === "confirmation" && (
          <WelcomeConfirmationStep
            isAnyoneAttending={attendingGuests.length > 0}
            registryUrl={settings.registryUrl}
            registryMessage={settings.registryMessage}
          />
        )}
      </div>

      {showGenericFooter && (
        <div className="mt-8">
          <PrimaryButton onClick={() => goNextFrom(screen)} disabled={!canContinue(screen)}>
            Continue
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
