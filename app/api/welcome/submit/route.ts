import { NextRequest, NextResponse } from "next/server";
import { submitWelcomeRsvp } from "@/lib/google-sheets";
import {
  deadlinePassedMessage,
  getRsvpSettings,
  isDeadlinePassed,
} from "@/lib/rsvp-config";
import { sanitizeText } from "@/lib/rsvp-validation";
import {
  householdGuests,
  invitedGuestsForHousehold,
  loadWelcomeContext,
  welcomeSubmitRequestSchema,
} from "@/lib/welcome";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { SubmitPlusOneName } from "@/types/rsvp";
import type { WelcomeSubmitResponse } from "@/types/welcome";

/**
 * Records Friday Welcome Celebration attendance.
 *
 * The event is never taken from the request body — it is always
 * `friday_welcome` — and every guest in the payload is re-checked against
 * invited=TRUE for that event before anything is written, so this route
 * cannot be used to answer for another event or for an uninvited guest.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`welcome-submit:${ip}`, {
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

  const parsed = welcomeSubmitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const payload = parsed.data;

  try {
    const settings = await getRsvpSettings();
    if (!settings.rsvpOpen) {
      return NextResponse.json({ error: "RSVP is currently closed." }, { status: 403 });
    }

    const ctx = await loadWelcomeContext();
    if (!ctx.event) {
      return NextResponse.json(
        { error: "We couldn't find your invitation." },
        { status: 404 }
      );
    }
    const event = ctx.event;

    const householdRow = ctx.households.find(
      (r) => r.data.household_id === payload.householdId
    );
    if (!householdRow) {
      return NextResponse.json(
        { error: "We couldn't find your invitation." },
        { status: 404 }
      );
    }

    const invitedGuests = invitedGuestsForHousehold(ctx, payload.householdId);
    if (invitedGuests.length === 0) {
      return NextResponse.json(
        { error: "We couldn't find your invitation." },
        { status: 404 }
      );
    }
    const invitedGuestIds = new Set(invitedGuests.map((g) => g.guest_id));

    // Mirrors the main portal: once the deadline is past, only households
    // that already have an answer on file may amend it.
    const hasExistingAnswer = ctx.invitations.some(
      (r) =>
        r.data.event_id === event.event_id &&
        invitedGuestIds.has(r.data.guest_id) &&
        (r.data.attendance === "YES" || r.data.attendance === "NO")
    );
    if (isDeadlinePassed(settings) && !hasExistingAnswer) {
      return NextResponse.json(
        { error: deadlinePassedMessage(settings) },
        { status: 400 }
      );
    }

    const seen = new Set<string>();
    const responses = [];
    for (const raw of payload.responses) {
      // Guest must belong to this household *and* be invited to Friday.
      if (!invitedGuestIds.has(raw.guestId)) {
        return NextResponse.json(
          { error: "You are not invited to this event." },
          { status: 403 }
        );
      }
      if (seen.has(raw.guestId)) {
        return NextResponse.json(
          { error: "Duplicate response for a guest." },
          { status: 400 }
        );
      }
      seen.add(raw.guestId);

      const notes = raw.dietaryNotes ? sanitizeText(raw.dietaryNotes, 500) : "";
      responses.push({
        guestId: raw.guestId,
        attendance: raw.attendance,
        // Dietary notes only make sense for guests who are actually coming.
        dietaryNotes: raw.attendance === "YES" ? notes : "",
      });
    }

    const plusOneNames: SubmitPlusOneName[] = [];
    for (const po of payload.plusOneNames ?? []) {
      const guest = invitedGuests.find((g) => g.guest_id === po.guestId);
      if (!guest) {
        return NextResponse.json(
          { error: "Invalid guest for plus-one name." },
          { status: 400 }
        );
      }
      if (guest.is_plus_one !== "TRUE" || guest.plus_one_name_editable !== "TRUE") {
        return NextResponse.json(
          { error: "This guest's name cannot be edited." },
          { status: 400 }
        );
      }
      plusOneNames.push({
        guestId: po.guestId,
        displayName: sanitizeText(po.displayName, 100),
      });
    }

    // Is this event the household's entire invitation? If so, answering it
    // completes their RSVP and the household should be marked submitted;
    // if they're also invited to the ceremony it plainly doesn't.
    const householdGuestIds = new Set(
      householdGuests(ctx, payload.householdId).map((g) => g.guest_id)
    );
    const welcomeIsWholeInvitation = ctx.invitations.every(
      (r) =>
        !householdGuestIds.has(r.data.guest_id) ||
        r.data.invited !== "TRUE" ||
        r.data.event_id === event.event_id
    );

    const submittedAt = await submitWelcomeRsvp({
      eventId: event.event_id,
      householdId: payload.householdId,
      markHouseholdSubmitted: welcomeIsWholeInvitation,
      responses,
      plusOneNames,
    });

    const response: WelcomeSubmitResponse = { success: true, submittedAt };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Welcome submit failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
