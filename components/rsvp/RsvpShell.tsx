"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Attendance,
  InvitationEventMeta,
  InvitationGuest,
  InvitationResponse,
  RsvpSettings,
  SearchResult,
  SubmitEventResponse,
  VerificationMethod,
} from "@/types/rsvp";
import { STEAK_ENTREE_LABEL } from "@/types/rsvp";
import { ProgressIndicator } from "./ProgressIndicator";
import { WelcomeStep } from "./WelcomeStep";
import { NameSearchStep } from "./NameSearchStep";
import { HouseholdConfirmStep } from "./HouseholdConfirmStep";
import { VerificationStep } from "./VerificationStep";
import { EventAttendanceStep } from "./EventAttendanceStep";
import { MealSelectionStep } from "./MealSelectionStep";
import { SteakTemperatureStep } from "./SteakTemperatureStep";
import { DietaryNotesStep } from "./DietaryNotesStep";
import { ReviewStep, type ReviewGuest } from "./ReviewStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { PrimaryButton, SecondaryButton } from "./ui";

type Screen =
  | { id: "welcome" }
  | { id: "search" }
  | { id: "confirm" }
  | { id: "verify" }
  | { id: "event"; eventId: string }
  | { id: "meal"; eventId: string }
  | { id: "steak"; eventId: string }
  | { id: "dietary" }
  | { id: "review" }
  | { id: "confirmation" };

interface EventAnswer {
  attendance: Attendance | null;
  mealChoice: string;
  steakTemperature: string;
}

const EMPTY_ANSWER: EventAnswer = { attendance: null, mealChoice: "", steakTemperature: "" };

function isSteak(mealChoice: string): boolean {
  return mealChoice.trim().toLowerCase() === STEAK_ENTREE_LABEL.toLowerCase();
}

export function RsvpShell({ initialSettings }: { initialSettings: RsvpSettings }) {
  const [settings, setSettings] = useState<RsvpSettings>(initialSettings);
  const [history, setHistory] = useState<Screen[]>([{ id: "welcome" }]);
  const screen = history[history.length - 1];

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Invitation / confirm / verify
  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [plusOneNames, setPlusOneNames] = useState<Record<string, string>>({});
  const [verificationMethodOverride, setVerificationMethodOverride] =
    useState<VerificationMethod | null>(null);
  const verificationMethod: VerificationMethod =
    verificationMethodOverride ?? invitation?.verificationOptions?.[0] ?? "zip";
  const [verificationValue, setVerificationValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Wizard answers
  const [answers, setAnswers] = useState<Record<string, Record<string, EventAnswer>>>({});
  const [dietaryNotes, setDietaryNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const guests: InvitationGuest[] = useMemo(
    () => (invitation?.unlocked ? invitation.guests ?? [] : []),
    [invitation]
  );
  const events: InvitationEventMeta[] = useMemo(
    () => (invitation?.unlocked ? invitation.events ?? [] : []),
    [invitation]
  );

  // Merge in prior answers/notes once the invitation unlocks, without
  // clobbering anything the guest has already changed in this session.
  // This runs during render (React's documented "adjusting state when a
  // prop changes" pattern) rather than in an effect, since it only needs
  // to react to `invitation` identity changing, not to synchronize with
  // anything outside React.
  const [lastMergedInvitation, setLastMergedInvitation] = useState<InvitationResponse | null>(
    null
  );
  if (invitation && invitation !== lastMergedInvitation && invitation.unlocked && invitation.guests) {
    const unlockedGuests = invitation.guests;
    setLastMergedInvitation(invitation);
    setAnswers((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const guest of unlockedGuests) {
        for (const ev of guest.events) {
          if (next[guest.id]?.[ev.eventId]) continue;
          changed = true;
          next[guest.id] = {
            ...next[guest.id],
            [ev.eventId]: {
              attendance: ev.attendance,
              mealChoice: ev.mealChoice,
              steakTemperature: ev.steakTemperature,
            },
          };
        }
      }
      return changed ? next : prev;
    });
    setDietaryNotes((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const guest of unlockedGuests) {
        if (next[guest.id] !== undefined) continue;
        const firstNote = guest.events.map((e) => e.dietaryNotes).find((n) => n && n.trim());
        if (firstNote) {
          next[guest.id] = firstNote;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  function attendanceFor(guestId: string, eventId: string): Attendance | null {
    return answers[guestId]?.[eventId]?.attendance ?? null;
  }
  function mealChoiceFor(guestId: string, eventId: string): string {
    return answers[guestId]?.[eventId]?.mealChoice ?? "";
  }
  function steakFor(guestId: string, eventId: string): string {
    return answers[guestId]?.[eventId]?.steakTemperature ?? "";
  }

  function guestsForEvent(eventId: string): InvitationGuest[] {
    return guests.filter((g) => g.events.some((e) => e.eventId === eventId));
  }
  function guestsAttendingEvent(eventId: string): InvitationGuest[] {
    return guestsForEvent(eventId).filter((g) => attendanceFor(g.id, eventId) === "YES");
  }
  function mealEvents(): InvitationEventMeta[] {
    return events.filter((e) => e.requiresMeal && guestsAttendingEvent(e.eventId).length > 0);
  }
  function steakGuestsForEvent(eventId: string): InvitationGuest[] {
    return guestsAttendingEvent(eventId).filter((g) => isSteak(mealChoiceFor(g.id, eventId)));
  }
  function steakEvents(): InvitationEventMeta[] {
    return mealEvents().filter((e) => steakGuestsForEvent(e.eventId).length > 0);
  }

  // ---- Search ----
  const trimmedQuery = searchQuery.trim();

  useEffect(() => {
    if (trimmedQuery.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch("/api/rsvp/search", {
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
      const res = await fetch("/api/rsvp/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const inv = data as InvitationResponse;
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
    setVerifyError(null);
    setHistory((h) => {
      const idx = h.findIndex((s) => s.id === "search");
      return idx >= 0 ? h.slice(0, idx + 1) : [{ id: "welcome" }, { id: "search" }];
    });
  }

  function goToFirstWizardStep(inv: InvitationResponse) {
    const evs = inv.events ?? [];
    if (evs.length > 0) {
      setHistory((h) => [...h, { id: "event", eventId: evs[0].eventId }]);
    } else {
      setHistory((h) => [...h, { id: "dietary" }]);
    }
  }

  function confirmParty() {
    if (!invitation) return;
    if (invitation.requiresVerification && !invitation.unlocked) {
      setVerifyError(null);
      setHistory((h) => [...h, { id: "verify" }]);
      return;
    }
    goToFirstWizardStep(invitation);
  }

  async function submitVerification() {
    if (!invitation?.household || !verificationValue.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/rsvp/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: invitation.household.id,
          verification: { method: verificationMethod, value: verificationValue },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error ?? "We couldn't verify that information. Please try again.");
        return;
      }
      const inv = data as InvitationResponse;
      setInvitation(inv);
      if (inv.settings) setSettings(inv.settings);
      goToFirstWizardStep(inv);
    } catch {
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  // ---- Answer mutators ----
  function setAttendance(guestId: string, eventId: string, attendance: Attendance) {
    setAnswers((prev) => {
      const existing = prev[guestId]?.[eventId] ?? EMPTY_ANSWER;
      const next: EventAnswer =
        attendance === "NO"
          ? { attendance, mealChoice: "", steakTemperature: "" }
          : { ...existing, attendance };
      return { ...prev, [guestId]: { ...prev[guestId], [eventId]: next } };
    });
  }
  function setMealChoice(guestId: string, eventId: string, mealChoice: string) {
    setAnswers((prev) => {
      const existing = prev[guestId]?.[eventId] ?? EMPTY_ANSWER;
      return {
        ...prev,
        [guestId]: {
          ...prev[guestId],
          [eventId]: {
            ...existing,
            mealChoice,
            steakTemperature: isSteak(mealChoice) ? existing.steakTemperature : "",
          },
        },
      };
    });
  }
  function setSteakTemperature(guestId: string, eventId: string, steakTemperature: string) {
    setAnswers((prev) => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [eventId]: { ...(prev[guestId]?.[eventId] ?? EMPTY_ANSWER), steakTemperature },
      },
    }));
  }
  function setDietaryNote(guestId: string, notes: string) {
    setDietaryNotes((prev) => ({ ...prev, [guestId]: notes }));
  }
  function setPlusOneName(guestId: string, value: string) {
    setPlusOneNames((prev) => ({ ...prev, [guestId]: value }));
  }

  // ---- Wizard navigation ----
  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }

  function goNextFrom(current: Screen) {
    if (current.id === "event") {
      const idx = events.findIndex((e) => e.eventId === current.eventId);
      if (idx >= 0 && idx < events.length - 1) {
        setHistory((h) => [...h, { id: "event", eventId: events[idx + 1].eventId }]);
        return;
      }
      const meals = mealEvents();
      if (meals.length > 0) {
        setHistory((h) => [...h, { id: "meal", eventId: meals[0].eventId }]);
        return;
      }
      const steaks = steakEvents();
      if (steaks.length > 0) {
        setHistory((h) => [...h, { id: "steak", eventId: steaks[0].eventId }]);
        return;
      }
      setHistory((h) => [...h, { id: "dietary" }]);
      return;
    }
    if (current.id === "meal") {
      const meals = mealEvents();
      const idx = meals.findIndex((e) => e.eventId === current.eventId);
      if (idx >= 0 && idx < meals.length - 1) {
        setHistory((h) => [...h, { id: "meal", eventId: meals[idx + 1].eventId }]);
        return;
      }
      const steaks = steakEvents();
      if (steaks.length > 0) {
        setHistory((h) => [...h, { id: "steak", eventId: steaks[0].eventId }]);
        return;
      }
      setHistory((h) => [...h, { id: "dietary" }]);
      return;
    }
    if (current.id === "steak") {
      const steaks = steakEvents();
      const idx = steaks.findIndex((e) => e.eventId === current.eventId);
      if (idx >= 0 && idx < steaks.length - 1) {
        setHistory((h) => [...h, { id: "steak", eventId: steaks[idx + 1].eventId }]);
        return;
      }
      setHistory((h) => [...h, { id: "dietary" }]);
      return;
    }
    if (current.id === "dietary") {
      setHistory((h) => [...h, { id: "review" }]);
    }
  }

  function canContinue(current: Screen): boolean {
    if (current.id === "event") {
      return guestsForEvent(current.eventId).every((g) => attendanceFor(g.id, current.eventId) !== null);
    }
    if (current.id === "meal") {
      return guestsAttendingEvent(current.eventId).every((g) => mealChoiceFor(g.id, current.eventId) !== "");
    }
    if (current.id === "steak") {
      return steakGuestsForEvent(current.eventId).every((g) => steakFor(g.id, current.eventId) !== "");
    }
    return true;
  }

  async function handleSubmit() {
    if (!invitation?.household) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const responses: SubmitEventResponse[] = [];
    for (const guest of guests) {
      for (const ev of guest.events) {
        const attendance = attendanceFor(guest.id, ev.eventId);
        if (!attendance) continue;
        const mealChoice = mealChoiceFor(guest.id, ev.eventId);
        const steakTemperature = steakFor(guest.id, ev.eventId);
        const notes = dietaryNotes[guest.id]?.trim();
        responses.push({
          guestId: guest.id,
          eventId: ev.eventId,
          attendance,
          mealChoice: mealChoice || undefined,
          steakTemperature: steakTemperature || undefined,
          dietaryNotes: attendance === "YES" && notes ? notes : undefined,
        });
      }
    }

    const plusOnePayload = Object.entries(plusOneNames)
      .filter(([, name]) => name.trim().length > 0)
      .map(([guestId, displayName]) => ({ guestId, displayName: displayName.trim() }));

    try {
      const res = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: invitation.household.id,
          verification: invitation.requiresVerification
            ? { method: verificationMethod, value: verificationValue }
            : undefined,
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

  const reviewGuests: ReviewGuest[] = guests.map((guest) => ({
    id: guest.id,
    displayName: plusOneNames[guest.id]?.trim() ? plusOneNames[guest.id].trim() : guest.displayName,
    answers: guest.events.map((ev) => ({
      eventId: ev.eventId,
      eventName: ev.eventName,
      attendance: attendanceFor(guest.id, ev.eventId),
      mealChoice: mealChoiceFor(guest.id, ev.eventId),
      steakTemperature: steakFor(guest.id, ev.eventId),
    })),
    dietaryNotes: dietaryNotes[guest.id] ?? "",
  }));

  const stepNumber = history.length;
  const totalStepsEstimate = Math.max(
    stepNumber,
    5 + events.length + mealEvents().length * 2 + (invitation?.requiresVerification ? 1 : 0)
  );

  const showBack = history.length > 1 && screen.id !== "confirmation";
  const showGenericFooter = ["event", "meal", "steak", "dietary"].includes(screen.id);

  if (!settings.rsvpOpen) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-parchment px-6 py-10 text-center text-mocha sm:max-w-lg">
        <h1 className="font-playfair text-2xl text-mocha">RSVP is currently closed.</h1>
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
      {/* Shown on every screen, including Welcome (per spec — "include a subtle
          progress indicator") and Confirmation (reads as 100% complete). */}
      <ProgressIndicator current={stepNumber} total={totalStepsEstimate} />

      {showBack ? (
        <div className="mb-4">
          <SecondaryButton onClick={goBack} type="button">
            &larr; Back
          </SecondaryButton>
        </div>
      ) : null}

      <div className="flex-1">
        {screen.id === "welcome" && (
          <WelcomeStep
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

        {screen.id === "confirm" && invitation?.guests && invitation.household && (
          <HouseholdConfirmStep
            householdName={invitation.household.name}
            guests={invitation.guests}
            plusOneNames={plusOneNames}
            onPlusOneNameChange={setPlusOneName}
            onConfirm={confirmParty}
            onNotMyParty={notMyParty}
            isLoading={false}
            errorMessage={null}
          />
        )}

        {screen.id === "verify" && invitation?.verificationOptions && (
          <VerificationStep
            verificationOptions={invitation.verificationOptions}
            method={verificationMethod}
            onMethodChange={setVerificationMethodOverride}
            value={verificationValue}
            onValueChange={setVerificationValue}
            onSubmit={submitVerification}
            isLoading={isVerifying}
            errorMessage={verifyError}
          />
        )}

        {screen.id === "event" &&
          (() => {
            const event = events.find((e) => e.eventId === screen.eventId);
            if (!event) return null;
            return (
              <EventAttendanceStep
                event={event}
                guests={guestsForEvent(event.eventId).map((g) => ({
                  id: g.id,
                  displayName: g.displayName,
                  attendance: attendanceFor(g.id, event.eventId),
                }))}
                onChange={(guestId, attendance) => setAttendance(guestId, event.eventId, attendance)}
              />
            );
          })()}

        {screen.id === "meal" &&
          (() => {
            const event = events.find((e) => e.eventId === screen.eventId);
            if (!event) return null;
            return (
              <MealSelectionStep
                event={event}
                guests={guestsAttendingEvent(event.eventId).map((g) => ({
                  id: g.id,
                  displayName: g.displayName,
                  mealChoice: mealChoiceFor(g.id, event.eventId),
                }))}
                mealOptions={settings.mealOptions}
                onChange={(guestId, mealChoice) => setMealChoice(guestId, event.eventId, mealChoice)}
              />
            );
          })()}

        {screen.id === "steak" &&
          (() => {
            const event = events.find((e) => e.eventId === screen.eventId);
            if (!event) return null;
            return (
              <SteakTemperatureStep
                guests={steakGuestsForEvent(event.eventId).map((g) => ({
                  id: g.id,
                  displayName: g.displayName,
                  steakTemperature: steakFor(g.id, event.eventId),
                }))}
                steakOptions={settings.steakOptions}
                onChange={(guestId, temp) => setSteakTemperature(guestId, event.eventId, temp)}
              />
            );
          })()}

        {screen.id === "dietary" && (
          <DietaryNotesStep
            guests={guests
              .filter((g) => g.events.some((ev) => attendanceFor(g.id, ev.eventId) === "YES"))
              .map((g) => ({
                id: g.id,
                displayName: g.displayName,
                dietaryNotes: dietaryNotes[g.id] ?? "",
              }))}
            onChange={setDietaryNote}
          />
        )}

        {screen.id === "review" && (
          <ReviewStep
            guests={reviewGuests}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
            onSubmit={handleSubmit}
          />
        )}

        {screen.id === "confirmation" && (
          <ConfirmationStep
            confirmationMessage={settings.confirmationMessage}
            rsvpDeadline={settings.rsvpDeadline}
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
