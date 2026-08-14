import { z } from "zod";
import type { TabRow } from "./google-sheets";
import { isDeadlinePassed, isSteakChoice } from "./rsvp-config";
import type {
  EventRow,
  GuestRow,
  HouseholdRow,
  InvitationRow,
  RsvpSettings,
  SubmitEventResponse,
  SubmitPlusOneName,
  VerificationMethod,
} from "@/types/rsvp";

// ---- Schemas ----

export const searchRequestSchema = z.object({
  query: z.string().trim().min(3, "Please enter at least 3 characters."),
});

export const verificationSchema = z.object({
  method: z.enum(["zip", "phone_last_four", "email"]),
  value: z.string().trim().min(1).max(120),
});

export const invitationRequestSchema = z.object({
  householdId: z.string().trim().min(1),
  verification: verificationSchema.optional(),
});

export const submitEventResponseSchema = z.object({
  guestId: z.string().trim().min(1),
  eventId: z.string().trim().min(1),
  attendance: z.enum(["YES", "NO"]),
  mealChoice: z.string().trim().max(60).optional(),
  steakTemperature: z.string().trim().max(60).optional(),
  dietaryNotes: z.string().trim().max(500).optional(),
});

export const submitPlusOneNameSchema = z.object({
  guestId: z.string().trim().min(1),
  displayName: z.string().trim().min(1).max(100),
});

export const submitRequestSchema = z.object({
  householdId: z.string().trim().min(1),
  verification: verificationSchema.optional(),
  responses: z.array(submitEventResponseSchema).min(1),
  plusOneNames: z.array(submitPlusOneNameSchema).optional(),
});

// ---- Sanitization / normalization ----

// Built from char codes (rather than a literal \x00-\x1F escape) so no raw
// control bytes end up embedded in this source file.
const CONTROL_CHAR_CODES = [
  ...Array.from({ length: 32 }, (_, i) => i), // 0x00-0x1F
  127, // DEL
];
const CONTROL_CHARS_PATTERN = new RegExp(
  `[${CONTROL_CHAR_CODES.map((c) => `\\u${c.toString(16).padStart(4, "0")}`).join("")}]`,
  "g"
);

export function sanitizeText(input: string, maxLength: number): string {
  return input
    .replace(CONTROL_CHARS_PATTERN, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

export function normalizeName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/** "Jared Barchus" -> "J**** B*******" */
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const maskPart = (p: string) =>
    p.length <= 1 ? p : p[0] + "*".repeat(p.length - 1);
  return parts.map(maskPart).join(" ");
}

// ---- Secondary verification ----

export function availableVerificationMethods(
  household: HouseholdRow
): VerificationMethod[] {
  const methods: VerificationMethod[] = [];
  if (household.zip_code.trim()) methods.push("zip");
  if (household.phone_last_four.trim()) methods.push("phone_last_four");
  if (household.email.trim()) methods.push("email");
  return methods;
}

export function matchesVerification(
  household: HouseholdRow,
  method: VerificationMethod,
  value: string
): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  switch (method) {
    case "zip":
      return household.zip_code.trim().toLowerCase() === normalized;
    case "phone_last_four":
      return household.phone_last_four.trim().toLowerCase() === normalized;
    case "email":
      return household.email.trim().toLowerCase() === normalized;
    default:
      return false;
  }
}

// ---- Submission validation (server is the source of truth) ----

export interface SubmissionContext {
  household: TabRow<HouseholdRow>;
  guests: TabRow<GuestRow>[];
  events: TabRow<EventRow>[];
  invitations: TabRow<InvitationRow>[];
  settings: RsvpSettings;
}

export interface SubmissionResult {
  responses: SubmitEventResponse[];
  plusOneNames: SubmitPlusOneName[];
}

export type SubmissionValidation =
  | { ok: true; data: SubmissionResult }
  | { ok: false; error: string };

export function validateSubmission(
  payload: z.infer<typeof submitRequestSchema>,
  ctx: SubmissionContext
): SubmissionValidation {
  if (!ctx.settings.rsvpOpen) {
    return { ok: false, error: "RSVP is currently closed." };
  }
  if (
    isDeadlinePassed(ctx.settings) &&
    ctx.household.data.submitted !== "TRUE"
  ) {
    return { ok: false, error: "The RSVP deadline has passed." };
  }

  const guestIds = new Set(ctx.guests.map((g) => g.data.guest_id));
  const eventById = new Map(ctx.events.map((e) => [e.data.event_id, e.data]));
  const key = (guestId: string, eventId: string) => `${guestId}::${eventId}`;
  const invitationByKey = new Map(
    ctx.invitations.map((inv) => [
      key(inv.data.guest_id, inv.data.event_id),
      inv.data,
    ])
  );

  const responses: SubmitEventResponse[] = [];

  for (const raw of payload.responses) {
    if (!guestIds.has(raw.guestId)) {
      return { ok: false, error: "Invalid guest in submission." };
    }
    const event = eventById.get(raw.eventId);
    if (!event || event.active !== "TRUE") {
      return { ok: false, error: "Invalid event in submission." };
    }
    const invitation = invitationByKey.get(key(raw.guestId, raw.eventId));
    if (!invitation || invitation.invited !== "TRUE") {
      return {
        ok: false,
        error: "You are not invited to one of the submitted events.",
      };
    }

    let mealChoice = "";
    let steakTemperature = "";
    const dietaryNotes = raw.dietaryNotes
      ? sanitizeText(raw.dietaryNotes, 500)
      : "";

    const eligibleForMeal =
      raw.attendance === "YES" && event.requires_meal === "TRUE";

    if (eligibleForMeal) {
      if (raw.mealChoice) {
        if (!ctx.settings.mealOptions.includes(raw.mealChoice)) {
          return { ok: false, error: "Invalid meal choice." };
        }
        mealChoice = raw.mealChoice;

        if (isSteakChoice(mealChoice)) {
          if (raw.steakTemperature) {
            if (!ctx.settings.steakOptions.includes(raw.steakTemperature)) {
              return { ok: false, error: "Invalid steak temperature." };
            }
            steakTemperature = raw.steakTemperature;
          }
        } else if (raw.steakTemperature) {
          return {
            ok: false,
            error: "Steak temperature is only valid for the steak entrée.",
          };
        }
      }
    } else if (raw.mealChoice || raw.steakTemperature) {
      return {
        ok: false,
        error: "Meal selections are only valid for attending reception guests.",
      };
    }

    responses.push({
      guestId: raw.guestId,
      eventId: raw.eventId,
      attendance: raw.attendance,
      mealChoice,
      steakTemperature,
      dietaryNotes,
    });
  }

  const plusOneNames: SubmitPlusOneName[] = [];
  for (const po of payload.plusOneNames ?? []) {
    const guest = ctx.guests.find((g) => g.data.guest_id === po.guestId);
    if (!guest) {
      return { ok: false, error: "Invalid guest for plus-one name." };
    }
    if (
      guest.data.is_plus_one !== "TRUE" ||
      guest.data.plus_one_name_editable !== "TRUE"
    ) {
      return { ok: false, error: "This guest's name cannot be edited." };
    }
    plusOneNames.push({
      guestId: po.guestId,
      displayName: sanitizeText(po.displayName, 100),
    });
  }

  return { ok: true, data: { responses, plusOneNames } };
}
