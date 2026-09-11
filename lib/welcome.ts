import { z } from "zod";
import {
  getEventsTab,
  getGuestsTab,
  getHouseholdsTab,
  getInvitationsTab,
  type TabRow,
} from "./google-sheets";
import { normalizeName, submitPlusOneNameSchema } from "./rsvp-validation";
import type { EventRow, GuestRow, HouseholdRow, InvitationRow } from "@/types/rsvp";
import { WELCOME_EVENT_ID_CANDIDATES } from "@/types/welcome";

// ---- Schemas ----
//
// Deliberately narrower than the main RSVP schemas: no `verification`
// block (this flow has no ZIP/phone/email step) and no meal/steak fields
// (the Friday event has requires_meal=FALSE).

export const welcomeSearchRequestSchema = z.object({
  query: z.string().trim().min(3, "Please enter at least 3 characters."),
});

export const welcomeInvitationRequestSchema = z.object({
  householdId: z.string().trim().min(1),
});

export const welcomeSubmitGuestResponseSchema = z.object({
  guestId: z.string().trim().min(1),
  attendance: z.enum(["YES", "NO"]),
  dietaryNotes: z.string().trim().max(500).optional(),
});

export const welcomeSubmitRequestSchema = z.object({
  householdId: z.string().trim().min(1),
  responses: z.array(welcomeSubmitGuestResponseSchema).min(1),
  plusOneNames: z.array(submitPlusOneNameSchema).optional(),
});

// ---- Sheet context ----

export interface WelcomeContext {
  households: TabRow<HouseholdRow>[];
  guests: TabRow<GuestRow>[];
  invitations: TabRow<InvitationRow>[];
  /** The resolved welcome-event row from the "Events" tab, or null if missing/inactive. */
  event: EventRow | null;
  /** guest_ids with invited=TRUE for the resolved welcome event. */
  invitedGuestIds: Set<string>;
  /** household_ids with at least one guest invited to the welcome event. */
  invitedHouseholdIds: Set<string>;
}

/**
 * Picks the welcome event out of the "Events" tab. An inactive row is
 * treated as absent, which shuts the flow down (no search results, no
 * submissions) rather than writing to an event that's been turned off.
 */
function resolveWelcomeEvent(rows: TabRow<EventRow>[]): EventRow | null {
  const configured = process.env.WELCOME_EVENT_ID?.trim();
  const candidates = configured ? [configured] : [...WELCOME_EVENT_ID_CANDIDATES];

  for (const id of candidates) {
    const row = rows.find((r) => r.data.event_id === id);
    if (row && row.data.active === "TRUE") return row.data;
  }
  return null;
}

/**
 * Single read of every tab this flow needs, plus the derived
 * "who is actually invited to Friday" sets that gate both search results
 * and submissions. The server is the source of truth for invitedness —
 * the client never gets to name an event or a guest it wasn't handed.
 */
export async function loadWelcomeContext(): Promise<WelcomeContext> {
  const [households, guests, events, invitations] = await Promise.all([
    getHouseholdsTab(),
    getGuestsTab(),
    getEventsTab(),
    getInvitationsTab(),
  ]);

  const event = resolveWelcomeEvent(events.rows);

  const invitedGuestIds = new Set<string>();
  if (event) {
    for (const row of invitations.rows) {
      if (row.data.event_id === event.event_id && row.data.invited === "TRUE") {
        invitedGuestIds.add(row.data.guest_id);
      }
    }
  }

  const invitedHouseholdIds = new Set<string>();
  for (const row of guests.rows) {
    if (invitedGuestIds.has(row.data.guest_id)) {
      invitedHouseholdIds.add(row.data.household_id);
    }
  }

  return {
    households: households.rows,
    guests: guests.rows,
    invitations: invitations.rows,
    event,
    invitedGuestIds,
    invitedHouseholdIds,
  };
}

export function guestDisplayName(guest: GuestRow): string {
  return guest.display_name || `${guest.first_name} ${guest.last_name}`.trim();
}

/** Every guest in the household, in sheet order. */
export function householdGuests(ctx: WelcomeContext, householdId: string): GuestRow[] {
  return ctx.guests.map((r) => r.data).filter((g) => g.household_id === householdId);
}

/** The household's guests invited to the welcome event, in sheet order. */
export function invitedGuestsForHousehold(
  ctx: WelcomeContext,
  householdId: string
): GuestRow[] {
  return householdGuests(ctx, householdId).filter((g) =>
    ctx.invitedGuestIds.has(g.guest_id)
  );
}

/** True when every member of the household is invited to the welcome event. */
function isWholeHouseholdInvited(invited: GuestRow[], all: GuestRow[]): boolean {
  return all.length > 0 && invited.length === all.length;
}

/**
 * Names a search query may match for a given household.
 *
 * The invited guests' own names always match. The household-level name
 * fields ("The Smith Family", "Ann & Bob Smith") are only added when the
 * *entire* household is invited — otherwise a member who is not on the
 * welcome list could surface the household by searching their own name,
 * and the requirement is that they see "We couldn't find your invitation".
 */
export function searchCandidatesForHousehold(
  household: HouseholdRow,
  invitedGuests: GuestRow[],
  allGuests: GuestRow[]
): string[] {
  const candidates = invitedGuests.map((g) => normalizeName(guestDisplayName(g)));

  if (isWholeHouseholdInvited(invitedGuests, allGuests)) {
    candidates.push(
      normalizeName(household.search_name),
      normalizeName(household.household_name),
      normalizeName(household.primary_guest_name)
    );
  }

  return candidates.filter(Boolean);
}

/**
 * The name shown (masked) in search results. A fully-invited household
 * shows its primary-guest name, identical to the main RSVP portal; a
 * partially-invited one shows only the guests actually invited, so the
 * result never hints at who else lives there.
 */
export function welcomeResultName(
  household: HouseholdRow,
  invitedGuests: GuestRow[],
  allGuests: GuestRow[]
): string {
  if (isWholeHouseholdInvited(invitedGuests, allGuests)) {
    return household.primary_guest_name || household.household_name;
  }
  return (
    invitedGuests.map(guestDisplayName).join(" & ") || household.household_name
  );
}
