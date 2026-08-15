import { NextRequest, NextResponse } from "next/server";
import {
  getEventsTab,
  getGuestsTab,
  getHouseholdsTab,
  getInvitationsTab,
} from "@/lib/google-sheets";
import { getRsvpSettings } from "@/lib/rsvp-config";
import {
  availableVerificationMethods,
  invitationRequestSchema,
  matchesVerification,
  normalizeName,
} from "@/lib/rsvp-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type {
  InvitationEventEntry,
  InvitationEventMeta,
  InvitationGuest,
  InvitationResponse,
} from "@/types/rsvp";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`invitation:${ip}`, {
    limit: 15,
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

  const parsed = invitationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const { householdId, verification } = parsed.data;

  try {
    const settings = await getRsvpSettings();
    if (!settings.rsvpOpen) {
      return NextResponse.json(
        { error: "RSVP is currently closed." },
        { status: 403 }
      );
    }

    const [households, guests, events, invitations] = await Promise.all([
      getHouseholdsTab(),
      getGuestsTab(),
      getEventsTab(),
      getInvitationsTab(),
    ]);

    const householdRow = households.rows.find(
      (r) => r.data.household_id === householdId
    );
    if (!householdRow) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 }
      );
    }
    const household = householdRow.data;

    const ambiguousKey = normalizeName(
      household.search_name || household.primary_guest_name
    );
    const exactNameCollision =
      households.rows.filter(
        (r) =>
          normalizeName(r.data.search_name || r.data.primary_guest_name) ===
          ambiguousKey
      ).length > 1;

    // Two households can share a last name (e.g. "Kati Swenson" and "Kelsi
    // Swenson & Anthony Tran") without their full stored name colliding —
    // a guest searching the shared surname could still tap the wrong result.
    // Treat that as ambiguous too, gated on last names actually present.
    const normalizeLastName = (s: string) => s.trim().toLowerCase();
    const lastNamesByHousehold = new Map<string, Set<string>>();
    for (const g of guests.rows) {
      const ln = normalizeLastName(g.data.last_name);
      if (!ln) continue;
      const set = lastNamesByHousehold.get(g.data.household_id) ?? new Set<string>();
      set.add(ln);
      lastNamesByHousehold.set(g.data.household_id, set);
    }
    const myLastNames = lastNamesByHousehold.get(householdId) ?? new Set<string>();
    const lastNameCollision =
      myLastNames.size > 0 &&
      households.rows.some((r) => {
        if (r.data.household_id === householdId) return false;
        const otherLastNames = lastNamesByHousehold.get(r.data.household_id);
        if (!otherLastNames) return false;
        for (const ln of myLastNames) {
          if (otherLastNames.has(ln)) return true;
        }
        return false;
      });

    const isAmbiguous = exactNameCollision || lastNameCollision;

    let verified = !isAmbiguous;
    let verificationOptions: InvitationResponse["verificationOptions"];

    if (isAmbiguous) {
      // Zip is required whenever it's on file (true for every household
      // today) — it's guaranteed present and unambiguous, unlike phone/email
      // which are only sparsely populated. Fall back to whatever else is
      // available only if a household is ever missing a zip.
      const allMethods = availableVerificationMethods(household);
      const availableMethods = allMethods.includes("zip") ? ["zip" as const] : allMethods;
      verificationOptions = availableMethods;

      if (verification) {
        verified =
          availableMethods.includes(verification.method) &&
          matchesVerification(household, verification.method, verification.value);

        if (!verified) {
          return NextResponse.json(
            { error: "We couldn't verify that information. Please try again." },
            { status: 401 }
          );
        }
      }
    }

    // Household + guest names are always returned once a household is
    // resolved (the guest already narrowed to this one household from a
    // masked search result) — verification only gates the actual event
    // invitations and prior responses, per the RSVP access strategy.
    const householdGuests = guests.rows
      .map((r) => r.data)
      .filter((g) => g.household_id === householdId);

    let guestSummaries: InvitationGuest[] = householdGuests.map((guest) => ({
      id: guest.guest_id,
      displayName: guest.display_name || `${guest.first_name} ${guest.last_name}`,
      firstName: guest.first_name,
      isPlusOne: guest.is_plus_one === "TRUE",
      plusOneNameEditable: guest.plus_one_name_editable === "TRUE",
      events: [],
    }));

    let householdEvents: InvitationEventMeta[] | undefined;

    if (verified) {
      const activeEvents = events.rows
        .map((r) => r.data)
        .filter((e) => e.active === "TRUE")
        .sort(
          (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
        );

      const invitationRows = invitations.rows.map((r) => r.data);

      guestSummaries = householdGuests.map((guest) => {
        const guestEvents: InvitationEventEntry[] = [];
        for (const event of activeEvents) {
          const invitation = invitationRows.find(
            (inv) => inv.guest_id === guest.guest_id && inv.event_id === event.event_id
          );
          if (!invitation || invitation.invited !== "TRUE") continue;

          guestEvents.push({
            eventId: event.event_id,
            eventName: event.event_name,
            eventDate: event.event_date,
            eventTime: event.event_time,
            location: event.location,
            requiresMeal: event.requires_meal === "TRUE",
            attendance:
              invitation.attendance === "YES" || invitation.attendance === "NO"
                ? invitation.attendance
                : null,
            mealChoice: invitation.meal_choice,
            steakTemperature: invitation.steak_temperature,
            dietaryNotes: invitation.dietary_notes,
          });
        }

        return {
          id: guest.guest_id,
          displayName: guest.display_name || `${guest.first_name} ${guest.last_name}`,
          firstName: guest.first_name,
          isPlusOne: guest.is_plus_one === "TRUE",
          plusOneNameEditable: guest.plus_one_name_editable === "TRUE",
          events: guestEvents,
        };
      });

      const invitedEventIds = new Set(
        guestSummaries.flatMap((g) => g.events.map((e) => e.eventId))
      );
      householdEvents = activeEvents
        .filter((e) => invitedEventIds.has(e.event_id))
        .map((e) => ({
          eventId: e.event_id,
          eventName: e.event_name,
          eventDate: e.event_date,
          eventTime: e.event_time,
          location: e.location,
          requiresMeal: e.requires_meal === "TRUE",
        }));
    }

    const response: InvitationResponse = {
      requiresVerification: isAmbiguous,
      verificationOptions,
      unlocked: verified,
      household: {
        id: household.household_id,
        name: household.household_name || household.primary_guest_name,
        submitted: household.submitted === "TRUE",
        submittedAt: household.submitted_at || null,
      },
      guests: guestSummaries,
      events: householdEvents,
      settings,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("RSVP invitation lookup failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
