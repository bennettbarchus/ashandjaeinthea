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
import {
  AFTERPARTY_EVENT_ID_CANDIDATES,
  CEREMONY_EVENT_ID_CANDIDATES,
  STEAK_ENTREE_LABEL,
} from "@/types/rsvp";
import { WELCOME_EVENT_ID_CANDIDATES } from "@/types/welcome";
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
import { DressCodeStep } from "@/components/welcome/DressCodeStep";
import { CeremonyDressCodeStep } from "./CeremonyDressCodeStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { PrimaryButton, SecondaryButton } from "./ui";

type Screen =
  | { id: "welcome" }
  | { id: "search" }
  | { id: "confirm" }
  | { id: "verify" }
  | { id: "dress" }
  | { id: "ceremonyDress" }
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

  /**
   * `events` only lists events the household is actually invited to (the
   * invitation route builds it from invited=TRUE rows), so a hit here
   * doubles as "is this guest invited to it?". It's only populated once
   * verification has passed.
   */
  function eventMatching(
    candidates: readonly string[],
    eventList: InvitationEventMeta[]
  ): InvitationEventMeta | undefined {
    return eventList.find((e) => candidates.includes(e.eventId));
  }

  /**
   * Position of each screen in the wizard, low to high. Each event's dress
   * code sits directly after that event's own attendance question, so the
   * guest says whether they're coming and is then told what to wear for it,
   * rather than being handed both dress codes at the end.
   *
   * Ranks rather than a plain array index because meal and steak screens
   * appear and disappear as answers change; comparing ranks means navigation
   * still lands somewhere sensible if the screen you're on is no longer in
   * the list (say you went back and switched off the steak entrée).
   */
  const STAGE = {
    welcomeAttendance: 0,
    welcomeDress: 1,
    ceremonyAttendance: 2,
    ceremonyDress: 3,
    otherAttendance: 4,
    meal: 5,
    steak: 6,
    dietary: 7,
    afterPartyAttendance: 8,
    review: 9,
  } as const;

  function stageOf(screen: Screen): number {
    switch (screen.id) {
      case "dress":
        return STAGE.welcomeDress;
      case "ceremonyDress":
        return STAGE.ceremonyDress;
      case "meal":
        return STAGE.meal;
      case "steak":
        return STAGE.steak;
      case "dietary":
        return STAGE.dietary;
      case "event":
        if (WELCOME_EVENT_ID_CANDIDATES.includes(screen.eventId as never))
          return STAGE.welcomeAttendance;
        if (CEREMONY_EVENT_ID_CANDIDATES.includes(screen.eventId as never))
          return STAGE.ceremonyAttendance;
        if (AFTERPARTY_EVENT_ID_CANDIDATES.includes(screen.eventId as never))
          return STAGE.afterPartyAttendance;
        return STAGE.otherAttendance;
      default:
        return STAGE.review;
    }
  }

  /**
   * Every screen this guest still has to see, in order. Rebuilt on demand
   * because which meal and steak screens apply depends on the answers given
   * so far, and each entry is only included if the guest is invited to the
   * event behind it.
   */
  function orderedScreens(
    eventList: InvitationEventMeta[] = events
  ): { screen: Screen; stage: number }[] {
    const steps: { screen: Screen; stage: number }[] = [];
    const push = (screen: Screen) => steps.push({ screen, stage: stageOf(screen) });

    const welcomeEvent = eventMatching(WELCOME_EVENT_ID_CANDIDATES, eventList);
    if (welcomeEvent) {
      push({ id: "event", eventId: welcomeEvent.eventId });
      push({ id: "dress" });
    }

    const ceremonyEvent = eventMatching(CEREMONY_EVENT_ID_CANDIDATES, eventList);
    if (ceremonyEvent) {
      push({ id: "event", eventId: ceremonyEvent.eventId });
      push({ id: "ceremonyDress" });
    }

    // Any event that isn't one of the three named above still gets its
    // attendance question, so adding an event to the sheet can't drop it
    // silently out of the flow.
    const named = [
      ...WELCOME_EVENT_ID_CANDIDATES,
      ...CEREMONY_EVENT_ID_CANDIDATES,
      ...AFTERPARTY_EVENT_ID_CANDIDATES,
    ] as readonly string[];
    for (const e of eventList.filter((ev) => !named.includes(ev.eventId))) {
      push({ id: "event", eventId: e.eventId });
    }

    for (const e of mealEvents()) push({ id: "meal", eventId: e.eventId });
    for (const e of steakEvents()) push({ id: "steak", eventId: e.eventId });
    push({ id: "dietary" });

    const afterParty = eventMatching(AFTERPARTY_EVENT_ID_CANDIDATES, eventList);
    if (afterParty) push({ id: "event", eventId: afterParty.eventId });

    push({ id: "review" });
    return steps;
  }

  /**
   * Enter the wizard at its first screen.
   *
   * Takes its events from `inv` rather than the `events` memo on purpose.
   * submitVerification() calls this in the same tick as setInvitation(), so
   * the memo — which returns [] until the invitation is both committed and
   * unlocked — is still empty at this point. Reading it here sent verified
   * guests straight to dietary notes, since an empty event list leaves
   * dietary as the first entry in the ordered list.
   */
  function goToFirstWizardStep(inv: InvitationResponse) {
    const first = orderedScreens(inv.events ?? [])[0]?.screen ?? { id: "dietary" as const };
    setHistory((h) => [...h, first]);
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

  /** Advance to the first remaining screen ranked after the current one. */
  function goNextFrom(current: Screen) {
    const steps = orderedScreens();
    const currentStage = stageOf(current);
    const next = steps.find((s) => s.stage > currentStage)?.screen ?? { id: "review" as const };
    setHistory((h) => [...h, next]);
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
  // welcome + search + confirm (+ verify), then every wizard screen the
  // guest still has to see, then the confirmation. Derived from the same
  // list that drives navigation, so the bar can't drift from the real flow.
  const totalStepsEstimate = Math.max(
    stepNumber,
    3 + (invitation?.requiresVerification ? 1 : 0) + orderedScreens().length + 1
  );

  const showBack = history.length > 1 && screen.id !== "confirmation";
  const showGenericFooter = ["dress", "ceremonyDress", "event", "meal", "steak", "dietary"].includes(
    screen.id
  );

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

        {screen.id === "dress" && <DressCodeStep />}

        {screen.id === "ceremonyDress" && <CeremonyDressCodeStep />}

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
            rsvpDeadlineDisplay={settings.rsvpDeadlineDisplay}
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
