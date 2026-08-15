// Shared types for the RSVP portal — mirrors the Google Sheet tab structure
// documented in GOOGLE_SHEETS_SETUP.md.

export type VerificationMethod = "zip" | "phone_last_four" | "email";

/** The entrée label that triggers the steak-temperature question. Shared between client and server. */
export const STEAK_ENTREE_LABEL = "Steak";

export type Attendance = "YES" | "NO";

/** Raw row shape from the "Households" tab. */
export interface HouseholdRow {
  household_id: string;
  household_name: string;
  primary_guest_name: string;
  search_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_last_four: string;
  email: string;
  verification_method: string;
  submitted: string; // "TRUE" | "FALSE"
  submitted_at: string;
  updated_at: string;
}

/** Raw row shape from the "Guests" tab. */
export interface GuestRow {
  guest_id: string;
  household_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  is_plus_one: string; // "TRUE" | "FALSE"
  plus_one_name_editable: string; // "TRUE" | "FALSE"
}

/** Raw row shape from the "Events" tab. */
export interface EventRow {
  event_id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  location: string;
  requires_meal: string; // "TRUE" | "FALSE"
  display_order: string;
  active: string; // "TRUE" | "FALSE"
}

/** Raw row shape from the "Invitations" tab. */
export interface InvitationRow {
  guest_id: string;
  event_id: string;
  invited: string; // "TRUE" | "FALSE"
  attendance: string; // "" | "YES" | "NO"
  meal_choice: string;
  steak_temperature: string;
  dietary_notes: string;
  updated_at: string;
}

/** Raw row shape from the "Settings" tab. */
export interface SettingsRow {
  key: string;
  value: string;
}

export interface RsvpSettings {
  rsvpOpen: boolean;
  rsvpDeadline: string | null;
  supportEmail: string;
  confirmationMessage: string;
  registryUrl: string;
  registryMessage: string;
  steakOptions: string[];
  mealOptions: string[];
}

// ---- API request/response shapes ----

export interface SearchResult {
  householdId: string;
  maskedName: string;
  partySize: number;
  location: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface InvitationGuestSummary {
  id: string;
  displayName: string;
  firstName: string;
  isPlusOne: boolean;
  plusOneNameEditable: boolean;
}

export interface InvitationEventEntry {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  requiresMeal: boolean;
  attendance: Attendance | null;
  mealChoice: string;
  steakTemperature: string;
  dietaryNotes: string;
}

export interface InvitationGuest extends InvitationGuestSummary {
  events: InvitationEventEntry[];
}

export interface InvitationEventMeta {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  requiresMeal: boolean;
}

export interface InvitationResponse {
  requiresVerification: boolean;
  verificationOptions?: VerificationMethod[];
  /** True once `guests[].events` (and `events`) are populated — i.e. verification (if required) has passed. */
  unlocked: boolean;
  household?: {
    id: string;
    name: string;
    submitted: boolean;
    submittedAt: string | null;
  };
  guests?: InvitationGuest[];
  events?: InvitationEventMeta[];
  settings?: RsvpSettings;
}

export interface SubmitEventResponse {
  guestId: string;
  eventId: string;
  attendance: Attendance;
  mealChoice?: string;
  steakTemperature?: string;
  dietaryNotes?: string;
}

export interface SubmitPlusOneName {
  guestId: string;
  displayName: string;
}

export interface SubmitRequestBody {
  householdId: string;
  verification?: {
    method: VerificationMethod;
    value: string;
  };
  responses: SubmitEventResponse[];
  plusOneNames?: SubmitPlusOneName[];
}

export interface SubmitResponse {
  success: true;
  submittedAt: string;
}
