/**
 * One-off: adds (or removes) a throwaway household used to walk the
 * /welcome flow end-to-end without touching a real guest's data.
 *
 * The test guest is invited to the welcome event ONLY — invited=FALSE for
 * every other active event — which also exercises the flow's
 * welcome-only scoping.
 *
 * Add:    npx tsx --env-file=.env.local scripts/add-test-household.ts
 * Remove: npx tsx --env-file=.env.local scripts/add-test-household.ts --remove
 *
 * Both directions are idempotent.
 */
import {
  appendRows,
  getEventsTab,
  getGuestsTab,
  getHouseholdsTab,
  getInvitationsTab,
  writeCellsByRange,
} from "@/lib/google-sheets";
import { WELCOME_EVENT_ID_CANDIDATES } from "@/types/welcome";

const HOUSEHOLD_NAME = "Someday I Wish";
const GUEST_NAME = "Mr. Someday I Wish";
const PERSONAL_MESSAGE =
  "We'd love if you joined us. We think someone will be there waiting to meet you. Come dressed to impress! - Ash and Jae";

function columnToLetter(index: number): string {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/** Highest numeric suffix in use, so a new id can't collide with a gap-filled sequence. */
function nextId(existing: string[], prefix: string, width: number): string {
  let max = 0;
  for (const id of existing) {
    if (!id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
}

async function main() {
  const remove = process.argv.includes("--remove");

  const [households, guests, events, invitations] = await Promise.all([
    getHouseholdsTab(),
    getGuestsTab(),
    getEventsTab(),
    getInvitationsTab(),
  ]);

  const existing = households.rows.find(
    (r) => r.data.household_name === HOUSEHOLD_NAME
  );

  if (remove) {
    if (!existing) {
      console.log("Test household not present — nothing to remove.");
      return;
    }
    // Blank the rows in place rather than deleting them: readTab() skips
    // all-empty rows, so the records disappear from the app without
    // shifting any other row's number (which the Dashboard depends on).
    const householdId = existing.data.household_id;
    const guestIds = guests.rows
      .filter((r) => r.data.household_id === householdId)
      .map((r) => r.data.guest_id);

    const targets: { tab: string; headers: string[]; rowNumber: number }[] = [
      { tab: "Households", headers: households.headers, rowNumber: existing.rowNumber },
      ...guests.rows
        .filter((r) => r.data.household_id === householdId)
        .map((r) => ({ tab: "Guests", headers: guests.headers, rowNumber: r.rowNumber })),
      ...invitations.rows
        .filter((r) => guestIds.includes(r.data.guest_id))
        .map((r) => ({ tab: "Invitations", headers: invitations.headers, rowNumber: r.rowNumber })),
    ];

    // One batched request — a per-cell loop here would be ~50 sequential
    // writes and can trip the Sheets per-user rate limit.
    const blanks = targets.flatMap((t) =>
      t.headers.map((_, i) => ({
        range: `${t.tab}!${columnToLetter(i)}${t.rowNumber}`,
        value: "",
      }))
    );
    await writeCellsByRange(blanks);
    for (const t of targets) console.log(`Cleared ${t.tab} row ${t.rowNumber}`);
    console.log(`\nRemoved test household ${householdId} and guest(s) ${guestIds.join(", ")}.`);
    return;
  }

  if (existing) {
    console.log(
      `Test household already exists as ${existing.data.household_id} — nothing to do.`
    );
    return;
  }

  const householdId = nextId(households.rows.map((r) => r.data.household_id), "hh_", 3);
  const guestId = nextId(guests.rows.map((r) => r.data.guest_id), "g_", 4);

  const activeEvents = events.rows.map((r) => r.data).filter((e) => e.active === "TRUE");
  const welcomeEvent = activeEvents.find((e) =>
    (WELCOME_EVENT_ID_CANDIDATES as readonly string[]).includes(e.event_id)
  );
  if (!welcomeEvent) throw new Error("No active welcome event found in the Events tab.");

  // Build each row positionally from the tab's real headers, so a column
  // added later can't silently shift a value into the wrong field.
  const householdValues: Record<string, string> = {
    household_id: householdId,
    household_name: HOUSEHOLD_NAME,
    primary_guest_name: GUEST_NAME,
    search_name: GUEST_NAME.toLowerCase(),
    submitted: "FALSE",
    personal_message: PERSONAL_MESSAGE,
  };
  const guestValues: Record<string, string> = {
    guest_id: guestId,
    household_id: householdId,
    first_name: "Someday",
    last_name: "Wish",
    display_name: GUEST_NAME,
    is_plus_one: "FALSE",
    plus_one_name_editable: "FALSE",
  };

  const row = (headers: string[], values: Record<string, string>) =>
    headers.map((h) => values[h] ?? "");

  await appendRows("Households", [row(households.headers, householdValues)]);
  await appendRows("Guests", [row(guests.headers, guestValues)]);
  await appendRows(
    "Invitations",
    activeEvents.map((e) =>
      row(invitations.headers, {
        guest_id: guestId,
        guest_name: GUEST_NAME,
        event_id: e.event_id,
        invited: e.event_id === welcomeEvent.event_id ? "TRUE" : "FALSE",
      })
    )
  );

  console.log(`Added household ${householdId} ("${HOUSEHOLD_NAME}")`);
  console.log(`Added guest ${guestId} ("${GUEST_NAME}")`);
  for (const e of activeEvents) {
    const invited = e.event_id === welcomeEvent.event_id ? "TRUE" : "FALSE";
    console.log(`  invitation ${e.event_id.padEnd(12)} invited=${invited}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
