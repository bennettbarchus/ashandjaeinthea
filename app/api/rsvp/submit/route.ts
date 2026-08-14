import { NextRequest, NextResponse } from "next/server";
import {
  getEventsTab,
  getGuestsTab,
  getHouseholdsTab,
  getInvitationsTab,
  submitRsvp,
} from "@/lib/google-sheets";
import { getRsvpSettings } from "@/lib/rsvp-config";
import {
  availableVerificationMethods,
  matchesVerification,
  normalizeName,
  submitRequestSchema,
  validateSubmission,
} from "@/lib/rsvp-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { SubmitResponse } from "@/types/rsvp";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`submit:${ip}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = submitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const payload = parsed.data;

  try {
    const settings = await getRsvpSettings();

    const [households, guests, events, invitations] = await Promise.all([
      getHouseholdsTab(),
      getGuestsTab(),
      getEventsTab(),
      getInvitationsTab(),
    ]);

    const householdRow = households.rows.find(
      (r) => r.data.household_id === payload.householdId
    );
    if (!householdRow) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 }
      );
    }
    const household = householdRow.data;

    // Re-validate secondary verification server-side, independent of
    // whatever the client claims it already confirmed.
    const ambiguousKey = normalizeName(
      household.search_name || household.primary_guest_name
    );
    const ambiguousCount = households.rows.filter(
      (r) =>
        normalizeName(r.data.search_name || r.data.primary_guest_name) ===
        ambiguousKey
    ).length;

    if (ambiguousCount > 1) {
      const availableMethods = availableVerificationMethods(household);
      const isValid =
        !!payload.verification &&
        availableMethods.includes(payload.verification.method) &&
        matchesVerification(
          household,
          payload.verification.method,
          payload.verification.value
        );
      if (!isValid) {
        return NextResponse.json(
          { error: "We couldn't verify that information. Please try again." },
          { status: 401 }
        );
      }
    }

    const householdGuests = guests.rows.filter(
      (r) => r.data.household_id === payload.householdId
    );

    const validation = validateSubmission(payload, {
      household: householdRow,
      guests: householdGuests,
      events: events.rows,
      invitations: invitations.rows,
      settings,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const submittedAt = await submitRsvp({
      householdId: payload.householdId,
      responses: validation.data.responses,
      plusOneNames: validation.data.plusOneNames,
    });

    const response: SubmitResponse = { success: true, submittedAt };
    return NextResponse.json(response);
  } catch (err) {
    console.error("RSVP submit failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
