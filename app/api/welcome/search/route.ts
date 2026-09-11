import { NextRequest, NextResponse } from "next/server";
import { maskName, normalizeName } from "@/lib/rsvp-validation";
import {
  householdGuests,
  invitedGuestsForHousehold,
  loadWelcomeContext,
  searchCandidatesForHousehold,
  welcomeResultName,
  welcomeSearchRequestSchema,
} from "@/lib/welcome";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { HouseholdRow, SearchResult } from "@/types/rsvp";
import type { WelcomeSearchResponse } from "@/types/welcome";

const MAX_RESULTS = 5;

/**
 * Name search for the Friday Welcome Celebration, scoped to households
 * with at least one guest invited=TRUE for `friday_welcome`. A guest who
 * isn't on the Friday list simply gets no results, which the UI renders
 * as "We couldn't find your invitation."
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`welcome-search:${ip}`, {
    limit: 20,
    windowMs: 5 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many search requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = welcomeSearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  try {
    const ctx = await loadWelcomeContext();

    // If the Friday event is missing or inactive, nobody is invited to it.
    if (!ctx.event) {
      const empty: WelcomeSearchResponse = { results: [] };
      return NextResponse.json(empty);
    }

    const normalizedQuery = normalizeName(parsed.data.query);
    const queryTokens = normalizedQuery.split(" ").filter(Boolean);

    const scored: { household: HouseholdRow; invitedCount: number; score: number }[] = [];
    for (const row of ctx.households) {
      const household = row.data;
      if (!ctx.invitedHouseholdIds.has(household.household_id)) continue;

      const allGuests = householdGuests(ctx, household.household_id);
      const invitedGuests = invitedGuestsForHousehold(ctx, household.household_id);
      const candidates = searchCandidatesForHousehold(household, invitedGuests, allGuests);

      let score = 0;
      for (const candidate of candidates) {
        if (candidate === normalizedQuery) {
          score = Math.max(score, 100);
        } else if (queryTokens.length > 0 && queryTokens.every((t) => candidate.includes(t))) {
          score = Math.max(score, 50);
        } else if (candidate.includes(normalizedQuery)) {
          score = Math.max(score, 30);
        }
      }

      if (score > 0) {
        scored.push({ household, invitedCount: invitedGuests.length, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, MAX_RESULTS);

    // Disambiguate identical masked names with a city/state hint, exactly
    // as the main portal does.
    const maskedByHousehold = new Map<string, string>();
    const maskedNameCounts = new Map<string, number>();
    for (const { household } of top) {
      const masked = maskName(
        welcomeResultName(
          household,
          invitedGuestsForHousehold(ctx, household.household_id),
          householdGuests(ctx, household.household_id)
        )
      );
      maskedByHousehold.set(household.household_id, masked);
      maskedNameCounts.set(masked, (maskedNameCounts.get(masked) ?? 0) + 1);
    }

    const results: SearchResult[] = top.map(({ household, invitedCount }) => {
      const masked = maskedByHousehold.get(household.household_id) ?? "";
      const needsLocation = (maskedNameCounts.get(masked) ?? 0) > 1;
      const location = needsLocation
        ? [household.city, household.state].filter(Boolean).join(", ") || null
        : null;

      return {
        householdId: household.household_id,
        maskedName: masked,
        // Party size reflects who is invited to Friday, not the full household.
        partySize: invitedCount,
        location,
      };
    });

    const response: WelcomeSearchResponse = { results };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Welcome search failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
