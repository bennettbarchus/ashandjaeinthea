// Shared types for the standalone Friday Welcome Celebration flow (/welcome).
//
// This flow is deliberately narrower than the full RSVP portal: one event,
// no secondary verification, no meal/steak questions. Where the shapes are
// identical to the main portal they are re-used from ./rsvp rather than
// duplicated, so the shared components in components/rsvp/ accept them
// unchanged.

import type {
  Attendance,
  InvitationEventMeta,
  InvitationGuest,
  RsvpSettings,
  SearchResult,
  SubmitPlusOneName,
} from "./rsvp";

/**
 * Candidate `event_id`s for the single event this flow covers, resolved
 * against the Sheet's "Events" tab in this order (first active match wins);
 * the `WELCOME_EVENT_ID` env var overrides the list entirely.
 *
 * Two ids are listed because the spec names `friday_welcome` (the id in
 * scripts/seed-sheet.ts) while the live sheet currently uses `welcome`.
 * Resolving rather than hardcoding means the flow works today and keeps
 * working if the sheet's event is ever renamed to the seed's id.
 *
 * Lives here rather than in lib/ so both the client shell and the server
 * routes can import it without pulling in lib/google-sheets.ts (which
 * throws when imported in the browser).
 */
export const WELCOME_EVENT_ID_CANDIDATES = ["friday_welcome", "welcome"] as const;

export interface WelcomeSearchResponse {
  results: SearchResult[];
}

export interface WelcomeInvitationResponse {
  household: {
    id: string;
    name: string;
  };
  /**
   * Only the household members with invited=TRUE for `friday_welcome`.
   * Each guest's `events` array holds exactly that one entry, so the
   * shared components typed against InvitationGuest work as-is.
   */
  guests: InvitationGuest[];
  event: InvitationEventMeta;
  settings: RsvpSettings;
}

export interface WelcomeSubmitGuestResponse {
  guestId: string;
  attendance: Attendance;
  dietaryNotes?: string;
}

export interface WelcomeSubmitRequestBody {
  householdId: string;
  responses: WelcomeSubmitGuestResponse[];
  plusOneNames?: SubmitPlusOneName[];
}

export interface WelcomeSubmitResponse {
  success: true;
  submittedAt: string;
}
