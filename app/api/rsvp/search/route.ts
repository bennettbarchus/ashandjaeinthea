import { NextRequest, NextResponse } from "next/server";
import { getGuestsTab, getHouseholdsTab } from "@/lib/google-sheets";
import { maskName, normalizeName, searchRequestSchema } from "@/lib/rsvp-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { GuestRow, HouseholdRow, SearchResponse, SearchResult } from "@/types/rsvp";

const MAX_RESULTS = 5;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`search:${ip}`, {
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

  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  try {
    const [households, guests] = await Promise.all([
      getHouseholdsTab(),
      getGuestsTab(),
    ]);

    const guestsByHousehold = new Map<string, GuestRow[]>();
    for (const g of guests.rows) {
      const list = guestsByHousehold.get(g.data.household_id) ?? [];
      list.push(g.data);
      guestsByHousehold.set(g.data.household_id, list);
    }

    const normalizedQuery = normalizeName(parsed.data.query);
    const queryTokens = normalizedQuery.split(" ").filter(Boolean);

    const scored: { household: HouseholdRow; score: number }[] = [];
    for (const row of households.rows) {
      const household = row.data;
      const memberNames = (guestsByHousehold.get(household.household_id) ?? []).map(
        (g) => g.display_name || `${g.first_name} ${g.last_name}`
      );
      const candidates = [
        household.primary_guest_name,
        household.search_name,
        household.household_name,
        ...memberNames,
      ]
        .filter(Boolean)
        .map(normalizeName);

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
        scored.push({ household, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, MAX_RESULTS);

    const maskedNameCounts = new Map<string, number>();
    for (const { household } of top) {
      const masked = maskName(household.primary_guest_name || household.household_name);
      maskedNameCounts.set(masked, (maskedNameCounts.get(masked) ?? 0) + 1);
    }

    const results: SearchResult[] = top.map(({ household }) => {
      const masked = maskName(household.primary_guest_name || household.household_name);
      const needsLocation = (maskedNameCounts.get(masked) ?? 0) > 1;
      const location = needsLocation
        ? [household.city, household.state].filter(Boolean).join(", ") || null
        : null;

      return {
        householdId: household.household_id,
        maskedName: masked,
        partySize: (guestsByHousehold.get(household.household_id) ?? []).length,
        location,
      };
    });

    const response: SearchResponse = { results };
    return NextResponse.json(response);
  } catch (err) {
    console.error("RSVP search failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
