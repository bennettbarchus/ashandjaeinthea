/**
 * Locks the Welcome Party guest list down to the final invite list.
 *
 * Phase 1 — adds the welcome-only households (couples and singles) if they
 *           aren't already present, invited=TRUE for the welcome event and
 *           FALSE for every other active event.
 * Phase 2 — sets invited=FALSE on the welcome event for every guest whose
 *           household isn't on the keep list.
 *
 * Idempotent: phase 1 skips households that already exist (matched on
 * primary_guest_name), phase 2 only writes rows that aren't already FALSE.
 *
 * Run: npx tsx --env-file=.env.local scripts/finalize-welcome-guest-list.ts [--dry-run]
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

interface Spec {
  householdName: string;
  primary: string;
  guests: [string, string][];
}

/** The final welcome-only invite list. */
const SPECS: Spec[] = [
  { householdName: "The Pain Family", primary: "Amber & T Pain", guests: [["Amber", "Pain"], ["T", "Pain"]] },
  { householdName: "The Hunt Family", primary: "Keisha & Eric Hunt", guests: [["Keisha", "Hunt"], ["Eric", "Hunt"]] },
  { householdName: "Maria Cancela", primary: "Maria Cancela", guests: [["Maria", "Cancela"]] },
  { householdName: "Erica Butts", primary: "Erica Butts", guests: [["Erica", "Butts"]] },
  { householdName: "Ernest Butts", primary: "Ernest Butts", guests: [["Ernest", "Butts"]] },
  { householdName: "Jodi Merriday", primary: "Jodi Merriday", guests: [["Jodi", "Merriday"]] },
  { householdName: "Niyi Odumusu", primary: "Niyi Odumusu", guests: [["Niyi", "Odumusu"]] },
  { householdName: "TK Peterson", primary: "TK Peterson", guests: [["TK", "Peterson"]] },
  { householdName: "Britt Allen", primary: "Britt Allen", guests: [["Britt", "Allen"]] },
  { householdName: "Jhordan Gibbs", primary: "Jhordan Gibbs", guests: [["Jhordan", "Gibbs"]] },
  { householdName: "Chase Freeman", primary: "Chase Freeman", guests: [["Chase", "Freeman"]] },
  { householdName: "Kevin Reese", primary: "Kevin Reese", guests: [["Kevin", "Reese"]] },
];

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

function nextNumeric(ids: string[], prefix: string): number {
  let max = 0;
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("DRY RUN — no writes\n");

  const events = await getEventsTab();
  let [households, guests, invitations] = await Promise.all([
    getHouseholdsTab(),
    getGuestsTab(),
    getInvitationsTab(),
  ]);

  const activeEvents = events.rows.map((r) => r.data).filter((e) => e.active === "TRUE");
  const welcome = activeEvents.find((e) =>
    (WELCOME_EVENT_ID_CANDIDATES as readonly string[]).includes(e.event_id)
  );
  if (!welcome) throw new Error("No active welcome event found.");

  // ---- Phase 1: add the welcome-only households ----
  const missing = SPECS.filter(
    (s) => !households.rows.some((r) => r.data.primary_guest_name === s.primary)
  );
  console.log(`PHASE 1 — ${SPECS.length} target households, ${missing.length} to add`);

  if (missing.length) {
    let hNext = nextNumeric(households.rows.map((r) => r.data.household_id), "hh_");
    let gNext = nextNumeric(guests.rows.map((r) => r.data.guest_id), "g_");

    const hRows: string[][] = [];
    const gRows: string[][] = [];
    const iRows: string[][] = [];
    const row = (headers: string[], v: Record<string, string>) => headers.map((h) => v[h] ?? "");

    for (const s of missing) {
      const hid = `hh_${String(hNext++).padStart(3, "0")}`;
      hRows.push(row(households.headers, {
        household_id: hid,
        household_name: s.householdName,
        primary_guest_name: s.primary,
        search_name: s.primary.toLowerCase(),
        submitted: "FALSE",
      }));
      for (const [first, last] of s.guests) {
        const gid = `g_${String(gNext++).padStart(4, "0")}`;
        const display = `${first} ${last}`;
        gRows.push(row(guests.headers, {
          guest_id: gid,
          household_id: hid,
          first_name: first,
          last_name: last,
          display_name: display,
          is_plus_one: "FALSE",
          plus_one_name_editable: "FALSE",
        }));
        for (const e of activeEvents) {
          iRows.push(row(invitations.headers, {
            guest_id: gid,
            guest_name: display,
            event_id: e.event_id,
            invited: e.event_id === welcome.event_id ? "TRUE" : "FALSE",
          }));
        }
      }
      console.log(`  + ${hid}  "${s.primary}"  (${s.guests.length} guest${s.guests.length > 1 ? "s" : ""})`);
    }

    if (!dryRun) {
      await appendRows("Households", hRows);
      await appendRows("Guests", gRows);
      await appendRows("Invitations", iRows);
      // Re-read so phase 2 sees the rows just written.
      [households, guests, invitations] = await Promise.all([
        getHouseholdsTab(),
        getGuestsTab(),
        getInvitationsTab(),
      ]);
    }
    console.log(`  wrote ${hRows.length} households, ${gRows.length} guests, ${iRows.length} invitations`);
  } else {
    console.log("  all already present — nothing to add");
  }

  // ---- Phase 2: de-invite everyone else from the welcome event ----
  const keepHouseholdIds = new Set(
    households.rows
      .filter((r) => SPECS.some((s) => s.primary === r.data.primary_guest_name))
      .map((r) => r.data.household_id)
  );
  const householdByGuest = new Map(guests.rows.map((r) => [r.data.guest_id, r.data.household_id]));
  const invitedColumn = columnToLetter(invitations.headers.indexOf("invited"));

  const toFlip = invitations.rows.filter((r) => {
    if (r.data.event_id !== welcome.event_id) return false;
    if (r.data.invited === "FALSE") return false;
    const hid = householdByGuest.get(r.data.guest_id);
    return !hid || !keepHouseholdIds.has(hid);
  });

  const keptRows = invitations.rows.filter(
    (r) =>
      r.data.event_id === welcome.event_id &&
      keepHouseholdIds.has(householdByGuest.get(r.data.guest_id) ?? "")
  );

  console.log(`\nPHASE 2 — welcome event "${welcome.event_id}"`);
  console.log(`  keep list:        ${keepHouseholdIds.size} households / ${keptRows.length} guests -> stay invited=TRUE`);
  console.log(`  to set FALSE:     ${toFlip.length} guest rows`);
  console.log(`  households affected: ${new Set(toFlip.map((r) => householdByGuest.get(r.data.guest_id))).size}`);

  if (toFlip.length && !dryRun) {
    await writeCellsByRange(
      toFlip.map((r) => ({ range: `Invitations!${invitedColumn}${r.rowNumber}`, value: "FALSE" }))
    );
    console.log(`  wrote ${toFlip.length} cells`);
  }

  // Stale attendance left behind on rows that are no longer invited.
  const staleAnswers = toFlip.filter((r) => r.data.attendance === "YES" || r.data.attendance === "NO");
  if (staleAnswers.length) {
    console.log(`\n  NOTE: ${staleAnswers.length} de-invited rows still carry a prior attendance answer.`);
    console.log("        Left in place deliberately — not clearing RSVP data that wasn't asked to be cleared.");
  }
}

main().catch((err) => {
  console.error("Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
